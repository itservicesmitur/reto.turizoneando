import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export const registerAttempt = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const playerId = request.auth.uid;
  const { questionId, selectedIndex, timeMs, seasonId, stopId, clientAnsweredAt } = request.data as {
    questionId?: string;
    selectedIndex?: number;
    timeMs?: number;
    seasonId?: string;
    stopId?: string;
    clientAnsweredAt?: number;
  };
  console.log("request", request.data, playerId);

  if (!questionId?.trim()) throw new HttpsError("invalid-argument", "questionId is required");
  if (typeof selectedIndex !== "number") throw new HttpsError("invalid-argument", "selectedIndex must be a number");
  if (typeof timeMs !== "number" || timeMs < 0) throw new HttpsError("invalid-argument", "timeMs must be a non-negative number");
  if (!seasonId?.trim()) throw new HttpsError("invalid-argument", "seasonId is required");
  if (!stopId?.trim()) throw new HttpsError("invalid-argument", "stopId is required");

  const db = getFirestore();

  try {
    // 1. Read question via admin SDK — only place correctIndex is accessed
    const questionDoc = await db.collection("questions").doc(questionId).get();
    if (!questionDoc.exists) throw new HttpsError("not-found", "Question not found");

    const qData = questionDoc.data() ?? {};
    const correctIndex: number = typeof qData.correctIndex === "number" ? qData.correctIndex : 0;
    const correct = selectedIndex === correctIndex;
    const points: number = typeof qData.points === "number" ? qData.points : 10;
    const isBonus: boolean = qData.isBonus === true;

    // 2. Read previous attempts for this player + question
    const attemptsRef = db.collection("players").doc(playerId).collection("attempts");
    const prevSnap = await attemptsRef.where("questionId", "==", questionId).get();
    const attemptNumber = prevSnap.size + 1;
    const alreadySolved = prevSnap.docs.some(d => d.data().correct === true);

    // Only award points on the first correct answer
    const pointsAwarded = correct && !alreadySolved ? points : 0;

    // 3. Write attempt record
    await attemptsRef.add({
      questionId,
      stopId,
      seasonId,
      questionText: qData.text || "",
      questionTextEn: qData.textEn || "",
      selectedIndex,
      correct,
      timeMs,
      pointsAwarded,
      isBonus,
      attemptNumber,
      answeredAt: FieldValue.serverTimestamp(),
      clientAnsweredAt: typeof clientAnsweredAt === "number" ? new Date(clientAnsweredAt) : null,
    });

    // 4. Accumulate score on player document (only when points are actually awarded)
    // Also track completedStopsCount: increment once per stop on first correct answer
    const playerUpdate: Record<string, any> = {};

    if (pointsAwarded > 0) {
      playerUpdate.score = FieldValue.increment(pointsAwarded);
    }

    if (correct) {
      const prevCorrectForStop = await attemptsRef
        .where("stopId", "==", stopId)
        .where("correct", "==", true)
        .limit(1)
        .get();
      if (prevCorrectForStop.empty) {
        playerUpdate.completedStopsCount = FieldValue.increment(1);
      }
    }

    if (Object.keys(playerUpdate).length > 0) {
      await db.collection("players").doc(playerId).update(playerUpdate);
    }

    return {
      correct,
      pointsAwarded,
      isBonus,
      attemptNumber,
      alreadySolved,
      explanation: qData.explanation || "",
      explanationEn: qData.explanationEn || "",
    };
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to register attempt");
  }
});
