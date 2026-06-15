import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { computePlayerScores } from "./scoring";

interface RankedPlayer {
  uid: string;
  displayName: string;
  photoURL: string;
  score: number; // realScore
  baseScore: number;
  ranking: number | null;
}

// Helper to compute rankings for all active, non-banned players in memory
async function computeRankings(): Promise<{
  rankedPlayers: RankedPlayer[];
  playerMap: Map<string, RankedPlayer>;
}> {
  const db = getFirestore();
  const snapshot = await db.collection("players").get();
  const playerScores = await computePlayerScores();

  const allPlayers = snapshot.docs.map(doc => {
    const data = doc.data();
    const displayName = data.displayName || `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Jugador Anónimo";
    const scoreData = playerScores.get(doc.id) || { baseScore: 0, realScore: 0 };
    return {
      uid: doc.id,
      displayName,
      photoURL: data.photoURL || "",
      score: scoreData.realScore,
      baseScore: scoreData.baseScore,
      banned: data.banned === true,
      active: data.active !== false
    };
  });

  // Filter out banned and inactive players for ranking list
  const activeNonBanned = allPlayers.filter(p => !p.banned && p.active);

  // Sort by score (realScore) descending
  activeNonBanned.sort((a, b) => b.score - a.score);

  const rankedPlayers: RankedPlayer[] = [];
  const playerMap = new Map<string, RankedPlayer>();

  let currentRank = 1;
  let previousScore: number | null = null;

  for (let i = 0; i < activeNonBanned.length; i++) {
    const p = activeNonBanned[i];
    if (p.score !== previousScore) {
      currentRank = i + 1;
    }
    const ranked: RankedPlayer = {
      uid: p.uid,
      displayName: p.displayName,
      photoURL: p.photoURL,
      score: p.score,
      baseScore: p.baseScore,
      ranking: currentRank
    };
    rankedPlayers.push(ranked);
    playerMap.set(p.uid, ranked);
    previousScore = p.score;
  }

  // Also include banned or inactive players in the map with ranking = null
  for (const p of allPlayers) {
    if (p.banned || !p.active) {
      playerMap.set(p.uid, {
        uid: p.uid,
        displayName: p.displayName,
        photoURL: p.photoURL,
        score: p.score,
        baseScore: p.baseScore,
        ranking: null
      });
    }
  }

  return { rankedPlayers, playerMap };
}

export const getTopTen = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  try {
    const { rankedPlayers } = await computeRankings();
    return { topTen: rankedPlayers.slice(0, 10) };
  } catch (error: any) {
    throw new HttpsError("internal", error.message || "Failed to retrieve top ten.");
  }
});

export const getMyPositionsRanking = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  let targetId = request.auth.uid;
  if (request.data && request.data.playerId && request.data.playerId !== request.auth.uid) {
    if ((request.auth.token.role as string | undefined)?.toLowerCase() !== "admin") {
      throw new HttpsError("permission-denied", "Only administrators can query other players' rankings.");
    }
    targetId = request.data.playerId;
  }

  try {
    const { playerMap } = await computeRankings();
    const player = playerMap.get(targetId);
    if (!player) {
      return { uid: targetId, ranking: null, score: 0 };
    }
    return {
      uid: player.uid,
      ranking: player.ranking,
      score: player.score
    };
  } catch (error: any) {
    throw new HttpsError("internal", error.message || "Failed to retrieve player ranking.");
  }
});
