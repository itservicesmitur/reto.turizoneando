import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

export const getPrizes = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const db = getFirestore();

  try {
    const snapshot = await db.collection("prizes").limit(100).get();

    const prizes = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name || "",
        description: d.description || "",
        imageUrl: d.imageUrl || "",
        categoria: d.categoria || "",
        relevance: typeof d.relevance === "number" ? d.relevance : 1,
        requiresAdult: d.requiresAdult === true,
        createdAt: d.createdAt || null
      };
    });

    return { prizes };
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to retrieve prizes.");
  }
});

export const getPrizeById = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const { prizeId } = request.data as { prizeId?: string };
  if (!prizeId || !prizeId.trim()) {
    throw new HttpsError("invalid-argument", "prizeId is required.");
  }

  const db = getFirestore();

  try {
    const doc = await db.collection("prizes").doc(prizeId).get();
    if (!doc.exists) {
      throw new HttpsError("not-found", "Prize not found.");
    }

    const d = doc.data()!;
    return {
      prize: {
        id: doc.id,
        name: d.name || "",
        description: d.description || "",
        imageUrl: d.imageUrl || "",
        categoria: d.categoria || "",
        relevance: typeof d.relevance === "number" ? d.relevance : 1,
        requiresAdult: d.requiresAdult === true,
        createdAt: d.createdAt || null
      }
    };
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to retrieve prize.");
  }
});
