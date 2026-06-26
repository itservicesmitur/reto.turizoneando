import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

export const deletePlayer = onCall(async (request) => {
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
  const auth = getAuth();

  const playerRef = db.collection("players").doc(playerId);

  // Borra todos los docs de una subcolección en batches de 500
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

  // Borra los prizeCodes del jugador en batches de 500
  const deletePrizeCodes = async (): Promise<number> => {
    let count = 0;
    let snap = await db.collection("prizeCodes")
      .where("playerId", "==", playerId)
      .limit(500)
      .get();
    while (!snap.empty) {
      const batch = db.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      count += snap.docs.length;
      snap = await db.collection("prizeCodes")
        .where("playerId", "==", playerId)
        .limit(500)
        .get();
    }
    return count;
  };

  // 1. Borrar subcolecciones del jugador
  const [attemptsDeleted, seasonsDeleted, prizeCodesDeleted] = await Promise.all([
    deleteSubcollection("attempts"),
    deleteSubcollection("seasons"),
    deletePrizeCodes(),
  ]);

  // 2. Borrar documento del jugador en Firestore
  await playerRef.delete();

  // 3. Borrar cuenta en Firebase Auth
  try {
    await auth.deleteUser(playerId);
  } catch (err: any) {
    // Si el usuario ya no existe en Auth (solo en Firestore), no es error fatal
    if (err?.code !== "auth/user-not-found") throw err;
  }

  return { success: true, attemptsDeleted, seasonsDeleted, prizeCodesDeleted };
});
