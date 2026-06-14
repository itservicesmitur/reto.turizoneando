import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";

// ── GET ADMINS ───────────────────────────────────────────────────────────
export const getAdmins = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  if (request.auth.token.role !== "Admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  try {
    const auth = getAuth();
    const listUsersResult = await auth.listUsers(1000);
    
    const admins = listUsersResult.users
      .filter(user => user.customClaims && user.customClaims.role === "Admin")
      .map(user => {
        return {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          status: user.disabled ? "inactive" : "active",
          createdAt: user.metadata.creationTime
            ? new Date(user.metadata.creationTime).toISOString()
            : null,
        };
      });

    admins.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return { admins };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve admins.";
    throw new HttpsError("internal", message);
  }
});

// ── CREATE ADMIN ──────────────────────────────────────────────────────────
export const createAdmin = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  if (request.auth.token.role !== "Admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

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
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName.trim(),
    });

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

// ── UPDATE ADMIN ──────────────────────────────────────────────────────────
export const updateAdmin = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  if (request.auth.token.role !== "Admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

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

  if (uid === request.auth.uid && status === "inactive") {
    throw new HttpsError("failed-precondition", "You cannot deactivate your own administrator account.");
  }

  try {
    const auth = getAuth();
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

// ── DELETE ADMIN ──────────────────────────────────────────────────────────
export const deleteAdmin = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  if (request.auth.token.role !== "Admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  const { uid } = request.data;
  if (!uid || typeof uid !== "string") {
    throw new HttpsError("invalid-argument", "Admin UID is required.");
  }

  if (uid === request.auth.uid) {
    throw new HttpsError("failed-precondition", "You cannot delete your own administrator account.");
  }

  try {
    const auth = getAuth();
    await auth.deleteUser(uid);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete administrator.";
    throw new HttpsError("internal", message);
  }
});

// ── UPDATE SELF ADMIN ──────────────────────────────────────────────────────
export const updateSelfAdmin = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  if (request.auth.token.role !== "Admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  const uid = request.auth.uid;
  const { displayName, photoURL, email, deactivate, deleteAccount } = request.data;

  try {
    const auth = getAuth();

    // 1. Check for deletion
    if (deleteAccount === true) {
      await auth.deleteUser(uid);
      return { success: true, action: "deleted" };
    }

    // 2. Check for deactivation (disabling)
    if (deactivate === true) {
      await auth.updateUser(uid, { disabled: true });
      return { success: true, action: "deactivated" };
    }

    // 3. Normal profile/email update
    const updateParams: { displayName?: string; photoURL?: string; email?: string } = {};

    if (typeof displayName === "string") {
      updateParams.displayName = displayName.trim();
    }

    if (typeof photoURL === "string") {
      updateParams.photoURL = photoURL.trim();
    }

    let emailChanged = false;
    if (typeof email === "string" && email.trim()) {
      const targetEmail = email.trim().toLowerCase();
      if (!targetEmail.includes("@")) {
        throw new HttpsError("invalid-argument", "Valid email is required.");
      }

      const currentEmail = request.auth.token.email ? request.auth.token.email.toLowerCase() : "";
      if (targetEmail !== currentEmail) {
        updateParams.email = targetEmail;
        emailChanged = true;
      }
    }

    if (Object.keys(updateParams).length > 0) {
      await auth.updateUser(uid, updateParams);

      if (emailChanged) {
        await auth.setCustomUserClaims(uid, { role: "Admin" });
      }
    }

    return { success: true, action: "updated", emailChanged };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    const err = error as { code?: string; message?: string };
    if (err && err.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "The email address is already in use by another account.");
    }
    const message = err.message || "Failed to update your administrator profile.";
    throw new HttpsError("internal", message);
  }
});

