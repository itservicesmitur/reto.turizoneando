import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

export const resetPlayer = onCall(async (request) => {
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

  const db = getFirestore();

  // Delete all attempts in batches of 500
  const attemptsRef = db.collection("players").doc(playerId).collection("attempts");
  let deleted = 0;
  let snap = await attemptsRef.limit(500).get();

  while (!snap.empty) {
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    deleted += snap.docs.length;
    snap = await attemptsRef.limit(500).get();
  }

  // Reset player progress fields
  await db.collection("players").doc(playerId).update({
    score: 0,
    mapProgress: {},
    currentNodeId: null,
  });

  return { success: true, attemptsDeleted: deleted };
});
