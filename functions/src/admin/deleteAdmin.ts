import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";

export const deleteAdmin = onCall(async (request) => {
  // 1. Validate auth
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  // 2. Validate role
  if (request.auth.token.role !== "Admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  // 3. Validate input
  const { uid } = request.data;
  if (!uid || typeof uid !== "string") {
    throw new HttpsError("invalid-argument", "Admin UID is required.");
  }

  // Prevent self-deletion
  if (uid === request.auth.uid) {
    throw new HttpsError("failed-precondition", "You cannot delete your own administrator account.");
  }

  try {
    const auth = getAuth();

    // Delete from Firebase Auth
    await auth.deleteUser(uid);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete administrator.";
    throw new HttpsError("internal", message);
  }
});
