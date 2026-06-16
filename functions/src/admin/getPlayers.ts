import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { computePlayerScores } from "../game/scoring";

export const getPlayers = onCall(async (request) => {
  // 1. Validate auth
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  // 2. Validate custom claims for Admin role
  if ((request.auth.token.role as string | undefined)?.toLowerCase() !== "admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  try {
    const db = getFirestore();
    const snapshot = await db.collection("players").orderBy("createdAt", "desc").get();
    const playerScores = await computePlayerScores();

    const players = snapshot.docs.map(doc => {
      const data = doc.data();
      const scoreData = playerScores.get(doc.id) || { baseScore: 0, realScore: 0 };
      return {
        uid: doc.id,
        displayName: data.displayName || "",
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        gender: data.gender || "",
        nationality: data.nationality || "",
        ageRange: data.ageRange || "",
        preferredLang: data.preferredLang || "es",
        score: scoreData.realScore,
        baseScore: scoreData.baseScore,
        photoURL: data.photoURL || "",
        mapProgress: data.mapProgress || {},
        completedStopsCount: typeof data.completedStopsCount === "number" ? data.completedStopsCount : 0,
        currentNodeId: data.currentNodeId || null,
        banned: data.banned === true,
        active: data.active !== false,
        createdAt: data.createdAt && typeof data.createdAt.toDate === "function"
          ? data.createdAt.toDate().toISOString()
          : null,
      };
    });

    // Calculate rankings in-memory for active non-banned players
    const activeNonBanned = players.filter(p => !p.banned && p.active !== false);
    const sortedForRanking = [...activeNonBanned].sort((a, b) => b.score - a.score);

    const rankingMap = new Map<string, number>();
    let currentRank = 1;
    let previousScore: number | null = null;

    for (let i = 0; i < sortedForRanking.length; i++) {
      const p = sortedForRanking[i];
      if (p.score !== previousScore) {
        currentRank = i + 1;
      }
      rankingMap.set(p.uid, currentRank);
      previousScore = p.score;
    }

    const playersWithRanking = players.map(p => ({
      ...p,
      ranking: rankingMap.get(p.uid) || null
    }));

    return { players: playersWithRanking };
  } catch (error: any) {
    throw new HttpsError("internal", error.message || "Failed to retrieve players.");
  }
});
