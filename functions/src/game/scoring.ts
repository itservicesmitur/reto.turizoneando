import { getFirestore } from "firebase-admin/firestore";

export interface PlayerScoreData {
  uid: string;
  baseScore: number;
  realScore: number;
}

export async function computePlayerScores(): Promise<Map<string, PlayerScoreData>> {
  const db = getFirestore();
  
  // Fetch all players to ensure we have a record for everyone
  const playersSnapshot = await db.collection("players").get();
  const playerMap = new Map<string, PlayerScoreData>();
  
  for (const doc of playersSnapshot.docs) {
    const data = doc.data();
    playerMap.set(doc.id, {
      uid: doc.id,
      baseScore: typeof data.score === "number" ? data.score : 0,
      realScore: 0
    });
  }

  // Fetch all attempts across all players in a single group query
  const attemptsSnapshot = await db.collectionGroup("attempts").get();
  
  // Group attempts by player ID
  const playerAttemptsMap = new Map<string, any[]>();
  for (const doc of attemptsSnapshot.docs) {
    // Navigate from /players/{playerId}/attempts/{attemptId} to get playerId
    const playerId = doc.ref.parent.parent!.id;
    const data = doc.data();
    if (!playerAttemptsMap.has(playerId)) {
      playerAttemptsMap.set(playerId, []);
    }
    playerAttemptsMap.get(playerId)!.push({
      questionId: data.questionId || "",
      correct: data.correct === true,
      pointsAwarded: typeof data.pointsAwarded === "number" ? data.pointsAwarded : 0,
      attemptNumber: typeof data.attemptNumber === "number" ? data.attemptNumber : 1,
      timeMs: typeof data.timeMs === "number" ? data.timeMs : 60000
    });
  }

  // Calculate real score for each player
  for (const [playerId, attempts] of playerAttemptsMap.entries()) {
    // Group attempts of this player by questionId
    const questionAttempts = new Map<string, any[]>();
    for (const a of attempts) {
      if (!a.questionId) continue;
      if (!questionAttempts.has(a.questionId)) {
        questionAttempts.set(a.questionId, []);
      }
      questionAttempts.get(a.questionId)!.push(a);
    }

    let realScore = 0;
    for (const [_, qAttempts] of questionAttempts.entries()) {
      const correctAttempt = qAttempts.find(a => a.correct);
      if (correctAttempt) {
        // Base points is the maximum pointsAwarded in these attempts (usually the successful one)
        const basePoints = qAttempts.reduce((max, a) => Math.max(max, a.pointsAwarded), 0) || 10;
        
        // Attempt count is the attemptNumber of the correct attempt
        const attemptCount = correctAttempt.attemptNumber || 1;
        
        // Time taken in ms on the correct attempt
        const timeMs = correctAttempt.timeMs;
        const cappedTimeMs = Math.min(60000, Math.max(0, timeMs));
        const timeFactor = (60000 - cappedTimeMs) / 60000;
        
        // Formula: points = (basePoints / attemptCount) * (0.8 + 0.2 * timeFactor)
        const questionScore = (basePoints / attemptCount) * (0.8 + 0.2 * timeFactor);
        realScore += questionScore;
      }
    }

    const playerData = playerMap.get(playerId);
    if (playerData) {
      // Round to 2 decimal places
      playerData.realScore = Math.round(realScore * 100) / 100;
    }
  }

  return playerMap;
}
