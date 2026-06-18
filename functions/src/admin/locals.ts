import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

function requireAdmin(request: any) {
  if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required");
  if ((request.auth.token.role as string | undefined)?.toLowerCase() !== "admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }
}

// ── GET LOCALS ───────────────────────────────────────────────────────────
export const getLocals = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required");

  const db = getFirestore();
  try {
    const snap = await db.collection("locals").orderBy("createdAt", "desc").limit(200).get();
    const locals = snap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name || "",
        description: d.description || "",
        address: d.address || "",
        lat: typeof d.lat === "number" ? d.lat : null,
        lng: typeof d.lng === "number" ? d.lng : null,
        phone: d.phone || "",
        email: d.email || "",
        imageUrl: d.imageUrl || "",
        category: d.category || "",
        active: d.active !== false,
        createdAt: d.createdAt ? d.createdAt.toDate().toISOString() : null,
      };
    });
    return { locals };
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to retrieve locals.");
  }
});

// ── CREATE LOCAL ──────────────────────────────────────────────────────────
export const createLocal = onCall(async (request) => {
  requireAdmin(request);

  const { name, description, address, lat, lng, phone, email, imageUrl, category } = request.data;
  if (!name || typeof name !== "string" || !name.trim()) {
    throw new HttpsError("invalid-argument", "Local name is required.");
  }

  const db = getFirestore();
  try {
    const docRef = await db.collection("locals").add({
      name: name.trim(),
      description: (description || "").trim(),
      address: (address || "").trim(),
      lat: typeof lat === "number" ? lat : null,
      lng: typeof lng === "number" ? lng : null,
      phone: (phone || "").trim(),
      email: (email || "").trim().toLowerCase(),
      imageUrl: (imageUrl || "").trim(),
      category: (category || "").trim(),
      active: true,
      createdAt: Timestamp.now(),
    });
    return { id: docRef.id };
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to create local.");
  }
});

// ── UPDATE LOCAL ──────────────────────────────────────────────────────────
export const updateLocal = onCall(async (request) => {
  requireAdmin(request);

  const { id, name, description, address, lat, lng, phone, email, imageUrl, category, active } = request.data;
  if (!id || typeof id !== "string") throw new HttpsError("invalid-argument", "Local ID is required.");
  if (!name || typeof name !== "string" || !name.trim()) throw new HttpsError("invalid-argument", "Local name is required.");

  const db = getFirestore();
  try {
    await db.collection("locals").doc(id).update({
      name: name.trim(),
      description: (description || "").trim(),
      address: (address || "").trim(),
      lat: typeof lat === "number" ? lat : null,
      lng: typeof lng === "number" ? lng : null,
      phone: (phone || "").trim(),
      email: (email || "").trim().toLowerCase(),
      imageUrl: (imageUrl || "").trim(),
      category: (category || "").trim(),
      active: active !== false,
    });
    return { success: true };
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to update local.");
  }
});

// ── DELETE LOCAL ──────────────────────────────────────────────────────────
export const deleteLocal = onCall(async (request) => {
  requireAdmin(request);

  const { id } = request.data;
  if (!id || typeof id !== "string") throw new HttpsError("invalid-argument", "Local ID is required.");

  const db = getFirestore();
  try {
    // Prevent deletion if prizes are linked
    const prizesSnap = await db.collection("prizes").where("localId", "==", id).limit(1).get();
    if (!prizesSnap.empty) {
      throw new HttpsError(
        "failed-precondition",
        "No se puede eliminar el local porque tiene premios asociados. Reasigna o elimina los premios primero."
      );
    }
    await db.collection("locals").doc(id).delete();
    return { success: true };
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to delete local.");
  }
});
