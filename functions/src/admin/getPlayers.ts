import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

export const getPlayers = onCall(async (request) => {
  // 1. Validate auth
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  // 2. Validate custom claims for Admin role
  if (request.auth.token.role !== "Admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  try {
    const db = getFirestore();
    const snapshot = await db.collection("players").orderBy("createdAt", "desc").get();

    const players = snapshot.docs.map(doc => {
      const data = doc.data();
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
        score: typeof data.score === "number" ? data.score : 0,
        mapProgress: data.mapProgress || {},
        currentNodeId: data.currentNodeId || null,
        banned: data.banned === true,
        createdAt: data.createdAt && typeof data.createdAt.toDate === "function"
          ? data.createdAt.toDate().toISOString()
          : null,
      };
    });

    return { players };
  } catch (error: any) {
    throw new HttpsError("internal", error.message || "Failed to retrieve players.");
  }
});
