import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";

export const getAdmins = onCall(async (request) => {
  // 1. Validate auth
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  // 2. Validate role
  if (request.auth.token.role !== "Admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  try {
    const auth = getAuth();
    
    // List users (limit to 1000 max results)
    const listUsersResult = await auth.listUsers(1000);
    
    // Filter users having role: "Admin"
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

    // Sort by createdAt descending
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
