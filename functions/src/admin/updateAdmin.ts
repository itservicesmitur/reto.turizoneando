import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";

export const updateAdmin = onCall(async (request) => {
  // 1. Validate auth
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  // 2. Validate role
  if (request.auth.token.role !== "Admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  // 3. Validate input
  const { uid, displayName, status } = request.data;
  if (!uid || typeof uid !== "string") {
    throw new HttpsError("invalid-argument", "Admin UID is required.");
  }
  if (!displayName || typeof displayName !== "string" || !displayName.trim()) {
    throw new HttpsError("invalid-argument", "Display name is required.");
  }
  if (status !== "active" && status !== "inactive") {
    throw new HttpsError("invalid-argument", "Status must be 'active' or 'inactive'.");
  }

  // Prevent self-deactivation
  if (uid === request.auth.uid && status === "inactive") {
    throw new HttpsError("failed-precondition", "You cannot deactivate your own administrator account.");
  }

  try {
    const auth = getAuth();

    // Update Firebase Auth user
    await auth.updateUser(uid, {
      displayName: displayName.trim(),
      disabled: status === "inactive",
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update administrator.";
    throw new HttpsError("internal", message);
  }
});
