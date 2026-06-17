import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

export const getPlayerAttempts = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  if ((request.auth.token.role as string | undefined)?.toLowerCase() !== "admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  const { playerId } = request.data;
  if (!playerId || typeof playerId !== "string") {
    throw new HttpsError("invalid-argument", "playerId is required.");
  }

  try {
    const db = getFirestore();
    const attemptsSnap = await db
      .collection("players")
      .doc(playerId)
      .collection("attempts")
      .orderBy("answeredAt", "asc")
      .get();

    const rawAttempts = attemptsSnap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        questionId: d.questionId || "",
        stopId: d.stopId || "",
        seasonId: d.seasonId || "",
        questionText: d.questionText || "",
        questionTextEn: d.questionTextEn || "",
        selectedIndex: typeof d.selectedIndex === "number" ? d.selectedIndex : -1,
        correct: d.correct === true,
        timeMs: typeof d.timeMs === "number" ? d.timeMs : 0,
        pointsAwarded: typeof d.pointsAwarded === "number" ? d.pointsAwarded : 0,
        isBonus: d.isBonus === true,
        attemptNumber: typeof d.attemptNumber === "number" ? d.attemptNumber : 1,
        answeredAt: d.answeredAt && typeof d.answeredAt.toDate === "function"
          ? d.answeredAt.toDate().toISOString()
          : null,
        clientAnsweredAt: d.clientAnsweredAt && typeof d.clientAnsweredAt.toDate === "function"
          ? d.clientAnsweredAt.toDate().toISOString()
          : null,
      };
    });

    // Batch-fetch unique stops
    const uniqueStopIds = [...new Set(rawAttempts.map(a => a.stopId).filter(Boolean))];
    const stopDocs = await Promise.all(
      uniqueStopIds.map(id => db.collection("stops").doc(id).get())
    );
    const stopMap = new Map<string, { name: string; nameEn: string; stageId: string }>();
    stopDocs.forEach(snap => {
      if (snap.exists) {
        const d = snap.data() ?? {};
        stopMap.set(snap.id, {
          name: d.name || "",
          nameEn: d.nameEn || "",
          stageId: d.stageId || "",
        });
      }
    });

    // Batch-fetch unique stages (seasonId + stageId pairs)
    const stagePairs = new Map<string, { seasonId: string; stageId: string }>();
    rawAttempts.forEach(a => {
      const stop = stopMap.get(a.stopId);
      if (stop?.stageId && a.seasonId) {
        const key = `${a.seasonId}/${stop.stageId}`;
        stagePairs.set(key, { seasonId: a.seasonId, stageId: stop.stageId });
      }
    });
    const stageEntries = [...stagePairs.entries()];
    const stageDocs = await Promise.all(
      stageEntries.map(([, { seasonId, stageId }]) =>
        db.collection("seasons").doc(seasonId).collection("stages").doc(stageId).get()
      )
    );
    const stageMap = new Map<string, number>();
    stageEntries.forEach(([key], i) => {
      const snap = stageDocs[i];
      if (snap.exists) {
        stageMap.set(key, snap.data()?.number ?? null);
      }
    });

    const attempts = rawAttempts.map(a => {
      const stop = stopMap.get(a.stopId);
      const stageKey = stop?.stageId && a.seasonId ? `${a.seasonId}/${stop.stageId}` : "";
      return {
        ...a,
        stopName: stop?.name ?? "",
        stopNameEn: stop?.nameEn ?? "",
        stageNumber: stageKey ? (stageMap.get(stageKey) ?? null) : null,
      };
    });

    return { attempts };
  } catch (error: any) {
    throw new HttpsError("internal", error.message || "Failed to retrieve player attempts.");
  }
});
