import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

export const getStopWithQuestions = onCall(async (request) => {
  // 1. Validate auth
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const { stopId } = request.data as { stopId?: string };
  if (!stopId || !stopId.trim()) {
    throw new HttpsError("invalid-argument", "Stop ID is required.");
  }

  const db = getFirestore();

  try {
    // 2. Fetch Stop details
    const stopDoc = await db.collection("stops").doc(stopId).get();
    if (!stopDoc.exists) {
      throw new HttpsError("not-found", "Stop not found.");
    }
    const stopData = stopDoc.data() || {};

    // 3. Fetch related questions
    const questionsSnapshot = await db.collection("questions")
      .where("stopId", "==", stopId)
      .get();

    const allQuestions = questionsSnapshot.docs.map(doc => {
      const qData = doc.data();
      return {
        id: doc.id,
        stopId: qData.stopId || "",
        text: qData.text || "",
        textEn: qData.textEn || "",
        options: qData.options || [],
        optionsEn: qData.optionsEn || [],
        difficulty: qData.difficulty || "easy",
        points: typeof qData.points === "number" ? qData.points : 10,
        isBonus: qData.isBonus === true
      };
    });

    // Shuffle non-bonus questions; bonus questions always go last
    const regular = allQuestions.filter(q => !q.isBonus);
    const bonus = allQuestions.filter(q => q.isBonus);
    for (let i = regular.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [regular[i], regular[j]] = [regular[j], regular[i]];
    }
    const questions = [...regular, ...bonus];

    return {
      stop: {
        id: stopDoc.id,
        seasonId: stopData.seasonId || "",
        stageId: stopData.stageId || "",
        name: stopData.name || "",
        nameEn: stopData.nameEn || "",
        narration: stopData.narration || "",
        narrationEn: stopData.narrationEn || "",
        imageUrl: stopData.imageUrl || "",
        audioUrl: stopData.audioUrl || "",
        audioUrlEn: stopData.audioUrlEn || "",
        lat: stopData.lat || 0,
        lng: stopData.lng || 0,
        order: stopData.order || 0,
        active: stopData.active === true
      },
      questions
    };
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to retrieve stop details.");
  }
});
