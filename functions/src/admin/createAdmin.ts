import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";

export const createAdmin = onCall(async (request) => {
  // 1. Validate auth
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  // 2. Validate role
  if (request.auth.token.role !== "Admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  // 3. Validate input
  const { email, password, displayName } = request.data;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    throw new HttpsError("invalid-argument", "Valid email is required.");
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    throw new HttpsError("invalid-argument", "Password must be at least 8 characters long.");
  }
  if (!displayName || typeof displayName !== "string" || !displayName.trim()) {
    throw new HttpsError("invalid-argument", "Display name is required.");
  }

  try {
    const auth = getAuth();

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName.trim(),
    });

    // Set custom claim: { role: "Admin" }
    await auth.setCustomUserClaims(userRecord.uid, { role: "Admin" });

    return { uid: userRecord.uid };
  } catch (error) {
    const err = error as { code?: string; message?: string };
    if (err && err.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "The email address is already in use by another account.");
    }
    const message = err.message || "Failed to create administrator.";
    throw new HttpsError("internal", message);
  }
});
