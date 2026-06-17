import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

export const getCorrectAnswer = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const { questionId, selectedIndex } = request.data as {
    questionId?: string;
    selectedIndex?: number;
  };

  if (!questionId || !questionId.trim()) {
    throw new HttpsError("invalid-argument", "questionId is required");
  }
  if (typeof selectedIndex !== "number") {
    throw new HttpsError("invalid-argument", "selectedIndex must be a number");
  }

  const db = getFirestore();

  try {
    const questionDoc = await db.collection("questions").doc(questionId).get();
    if (!questionDoc.exists) {
      throw new HttpsError("not-found", "Question not found");
    }

    const qData = questionDoc.data() ?? {};
    const correctIndex: number = typeof qData.correctIndex === "number" ? qData.correctIndex : 0;
    const correct = selectedIndex === correctIndex;
    const points: number = typeof qData.points === "number" ? qData.points : 10;
    const isBonus: boolean = qData.isBonus === true;

    return {
      correct,
      pointsAwarded: correct ? points : 0,
      isBonus,
      explanation: qData.explanation || "",
      explanationEn: qData.explanationEn || ""
    };
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to validate answer");
  }
});
