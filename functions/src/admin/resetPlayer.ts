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
  const playerRef = db.collection("players").doc(playerId);

  const deleteSubcollection = async (name: string): Promise<number> => {
    const colRef = playerRef.collection(name);
    let count = 0;
    let snap = await colRef.limit(500).get();
    while (!snap.empty) {
      const batch = db.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      count += snap.docs.length;
      snap = await colRef.limit(500).get();
    }
    return count;
  };

  const [attemptsDeleted, seasonsDeleted] = await Promise.all([
    deleteSubcollection("attempts"),
    deleteSubcollection("seasons"),
  ]);

  await playerRef.update({
    score: 0,
    mapProgress: {},
    currentNodeId: null,
    completedStopsCount: 0,
  });

  return { success: true, attemptsDeleted, seasonsDeleted };
});
