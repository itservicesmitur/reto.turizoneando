import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, Firestore } from "firebase-admin/firestore";

async function resolvePlayerStatus(playerId: string, seasonId: string | undefined, db: Firestore) {
  // 1. Resolve season — use provided or fall back to the active one
  let resolvedSeasonId = seasonId?.trim();
  if (!resolvedSeasonId) {
    const activeSnap = await db.collection("seasons")
      .where("status", "==", "active")
      .limit(1)
      .get();
    if (activeSnap.empty) {
      throw new HttpsError("not-found", "No active season found.");
    }
    resolvedSeasonId = activeSnap.docs[0].id;
  }

  // 2. Fetch season stages ordered by number
  const stagesSnap = await db
    .collection("seasons")
    .doc(resolvedSeasonId)
    .collection("stages")
    .orderBy("number")
    .get();

  if (stagesSnap.empty) {
    throw new HttpsError("not-found", "Season has no stages.");
  }

  const stages = stagesSnap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      number: typeof data.number === "number" ? data.number : 0,
      pointsCount: typeof data.pointsCount === "number" ? data.pointsCount : 0,
    };
  });

  // 3. Fetch stops grouped by stageId — query per stage to avoid seasonId/seasonIds
  //    legacy mismatch. Firestore "in" supports up to 30 values; chunk if needed.
  const stageIds = stages.map(s => s.id);

  const stopsByStage = new Map<string, {
    id: string;
    name: string;
    nameEn: string;
    order: number;
    stageId: string;
  }[]>();

  // Initialize map for all stages so stages with 0 stops still appear
  for (const sid of stageIds) stopsByStage.set(sid, []);

  const chunkSize = 30;
  for (let i = 0; i < stageIds.length; i += chunkSize) {
    const chunk = stageIds.slice(i, i + chunkSize);
    const stopsSnap = await db
      .collection("stops")
      .where("stageId", "in", chunk)
      .get();

    stopsSnap.docs.forEach(d => {
      const data = d.data();
      const stageId: string = data.stageId || "";
      // Only include stops that belong to this season
      const seasonIds: string[] = Array.isArray(data.seasonIds)
        ? data.seasonIds
        : data.seasonId
        ? [data.seasonId]
        : [];
      if (!seasonIds.includes(resolvedSeasonId)) return;
      const stageStops = stopsByStage.get(stageId);
      if (!stageStops) return;
      stageStops.push({
        id: d.id,
        name: data.name || "",
        nameEn: data.nameEn || "",
        order: typeof data.order === "number" ? data.order : 0,
        stageId,
      });
    });
  }

  // 4. Fetch player attempts for this season
  const attemptsSnap = await db
    .collection("players")
    .doc(playerId)
    .collection("attempts")
    .where("seasonId", "==", resolvedSeasonId)
    .get();

  const visitedStopIds = new Set<string>();
  const completedStopIds = new Set<string>();

  attemptsSnap.docs.forEach(d => {
    const data = d.data();
    const sid: string = data.stopId || "";
    if (!sid) return;
    visitedStopIds.add(sid);
    if (data.correct === true) completedStopIds.add(sid);
  });

  // 5. Build per-stage summary
  const stageResults = stages.map(stage => {
    const stops = (stopsByStage.get(stage.id) || [])
      .sort((a, b) => a.order - b.order)
      .map(stop => ({
        id: stop.id,
        name: stop.name,
        nameEn: stop.nameEn,
        order: stop.order,
        visited: visitedStopIds.has(stop.id),
        completed: completedStopIds.has(stop.id),
      }));

    const completedCount = stops.filter(s => s.completed).length;
    const visitedCount = stops.filter(s => s.visited).length;
    const stageCompleted = stops.length > 0 && completedCount === stops.length;

    return {
      id: stage.id,
      number: stage.number,
      pointsCount: stage.pointsCount,
      totalStops: stops.length,
      visitedStops: visitedCount,
      completedStops: completedCount,
      completed: stageCompleted,
      stops,
    };
  });

  const completedStageCount = stageResults.filter(s => s.completed).length;
  const currentStage = stageResults.find(s => !s.completed) ?? stageResults[stageResults.length - 1];

  return {
    seasonId: resolvedSeasonId,
    totalStages: stageResults.length,
    completedStages: completedStageCount,
    currentStageNumber: currentStage?.number ?? null,
    finished: completedStageCount === stageResults.length,
    stages: stageResults,
  };
}

// ── PLAYER-FACING ─────────────────────────────────────────────────────────────
// Called by the authenticated player to get their own progress.
export const getPlayerStatus = onCall({ minInstances: 1, maxInstances: 200 }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const { seasonId } = request.data as { seasonId?: string };
  return resolvePlayerStatus(request.auth.uid, seasonId, getFirestore());
});

// ── ADMIN-FACING ──────────────────────────────────────────────────────────────
// Called by an admin to query any player's progress.
export const getPlayerStatusAdmin = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  if ((request.auth.token.role as string | undefined)?.toLowerCase() !== "admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  const { playerId, seasonId } = request.data as { playerId?: string; seasonId?: string };

  if (!playerId || !playerId.trim()) {
    throw new HttpsError("invalid-argument", "playerId is required.");
  }

  return resolvePlayerStatus(playerId.trim(), seasonId, getFirestore());
});
