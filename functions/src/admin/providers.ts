import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";

function requireAdmin(request: any) {
  if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required");
  if ((request.auth.token.role as string | undefined)?.toLowerCase() !== "admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }
}

// ── GET PROVIDERS ────────────────────────────────────────────────────────
export const getProviders = onCall(async (request) => {
  requireAdmin(request);

  try {
    const auth = getAuth();
    const listResult = await auth.listUsers(1000);

    const providers = listResult.users
      .filter(u => u.customClaims?.role === "provider")
      .map(u => ({
        uid: u.uid,
        email: u.email || "",
        displayName: u.displayName || "",
        localId: (u.customClaims?.localId as string) || "",
        localName: (u.customClaims?.localName as string) || "",
        status: u.disabled ? "inactive" : "active",
        createdAt: u.metadata.creationTime
          ? new Date(u.metadata.creationTime).toISOString()
          : null,
      }));

    providers.sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tB - tA;
    });

    return { providers };
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to retrieve providers.");
  }
});

// ── CREATE PROVIDER ───────────────────────────────────────────────────────
export const createProvider = onCall(async (request) => {
  requireAdmin(request);

  const { email, password, displayName, localId, localName } = request.data;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    throw new HttpsError("invalid-argument", "Valid email is required.");
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    throw new HttpsError("invalid-argument", "Password must be at least 8 characters long.");
  }
  if (!displayName || typeof displayName !== "string" || !displayName.trim()) {
    throw new HttpsError("invalid-argument", "Display name is required.");
  }
  if (!localId || typeof localId !== "string") {
    throw new HttpsError("invalid-argument", "A local must be assigned to the provider.");
  }

  try {
    const auth = getAuth();
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName.trim(),
    });

    await auth.setCustomUserClaims(userRecord.uid, {
      role: "provider",
      localId,
      localName: (localName || "").trim(),
    });

    return { uid: userRecord.uid };
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    if (error.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "The email address is already in use by another account.");
    }
    throw new HttpsError("internal", error.message || "Failed to create provider.");
  }
});

// ── UPDATE PROVIDER ───────────────────────────────────────────────────────
export const updateProvider = onCall(async (request) => {
  requireAdmin(request);

  const { uid, displayName, localId, localName, status } = request.data;
  if (!uid || typeof uid !== "string") throw new HttpsError("invalid-argument", "Provider UID is required.");
  if (!displayName || typeof displayName !== "string" || !displayName.trim()) {
    throw new HttpsError("invalid-argument", "Display name is required.");
  }
  if (!localId || typeof localId !== "string") {
    throw new HttpsError("invalid-argument", "A local must be assigned to the provider.");
  }
  if (status !== "active" && status !== "inactive") {
    throw new HttpsError("invalid-argument", "Status must be 'active' or 'inactive'.");
  }

  try {
    const auth = getAuth();
    await auth.updateUser(uid, {
      displayName: displayName.trim(),
      disabled: status === "inactive",
    });

    await auth.setCustomUserClaims(uid, {
      role: "provider",
      localId,
      localName: (localName || "").trim(),
    });

    return { success: true };
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to update provider.");
  }
});

// ── DELETE PROVIDER ───────────────────────────────────────────────────────
export const deleteProvider = onCall(async (request) => {
  requireAdmin(request);

  const { uid } = request.data;
  if (!uid || typeof uid !== "string") throw new HttpsError("invalid-argument", "Provider UID is required.");

  try {
    const auth = getAuth();
    await auth.deleteUser(uid);
    return { success: true };
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to delete provider.");
  }
});

// ── CHANGE PROVIDER PASSWORD ──────────────────────────────────────────────
export const changeProviderPassword = onCall(async (request) => {
  requireAdmin(request);

  const { uid, newPassword } = request.data;
  if (!uid || typeof uid !== "string") throw new HttpsError("invalid-argument", "Provider UID is required.");
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
    throw new HttpsError("invalid-argument", "Password must be at least 8 characters long.");
  }

  try {
    const auth = getAuth();
    await auth.updateUser(uid, { password: newPassword });
    return { success: true };
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to change provider password.");
  }
});
