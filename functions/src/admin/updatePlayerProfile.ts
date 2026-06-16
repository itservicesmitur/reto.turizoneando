import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

export interface UpdatePlayerProfileInput {
  uid: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  nationality?: string;
  ageRange?: string;
  preferredLang?: string;
  photoURL?: string;
}

export const updatePlayerProfile = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const isAdmin = (request.auth.token.role as string | undefined)?.toLowerCase() === "admin";
  if (!isAdmin) {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  const {
    uid,
    displayName,
    firstName,
    lastName,
    gender,
    nationality,
    ageRange,
    preferredLang,
    photoURL,
  } = request.data as UpdatePlayerProfileInput;

  if (!uid || typeof uid !== "string") {
    throw new HttpsError("invalid-argument", "Player UID is required.");
  }

  const db = getFirestore();
  const auth = getAuth();

  // Verify player exists in Firestore
  const playerRef = db.collection("players").doc(uid);
  const playerSnap = await playerRef.get();
  if (!playerSnap.exists) {
    throw new HttpsError("not-found", "Player not found.");
  }

  const firestoreUpdate: Record<string, any> = {};

  if (displayName !== undefined) {
    if (typeof displayName !== "string" || !displayName.trim()) {
      throw new HttpsError("invalid-argument", "displayName must be a non-empty string.");
    }
    firestoreUpdate.displayName = displayName.trim();
  }
  if (firstName !== undefined) firestoreUpdate.firstName = typeof firstName === "string" ? firstName.trim() : "";
  if (lastName !== undefined) firestoreUpdate.lastName = typeof lastName === "string" ? lastName.trim() : "";
  if (gender !== undefined) firestoreUpdate.gender = gender;
  if (nationality !== undefined) firestoreUpdate.nationality = nationality;
  if (ageRange !== undefined) firestoreUpdate.ageRange = ageRange;
  if (preferredLang !== undefined) firestoreUpdate.preferredLang = preferredLang;
  if (photoURL !== undefined) firestoreUpdate.photoURL = photoURL;

  if (Object.keys(firestoreUpdate).length === 0) {
    throw new HttpsError("invalid-argument", "No fields provided to update.");
  }

  // Update Firestore player doc
  await playerRef.update(firestoreUpdate);

  // Sync displayName and photoURL to Firebase Auth
  const authUpdate: { displayName?: string; photoURL?: string } = {};
  if (firestoreUpdate.displayName) authUpdate.displayName = firestoreUpdate.displayName;
  if (firestoreUpdate.photoURL !== undefined) authUpdate.photoURL = firestoreUpdate.photoURL;

  if (Object.keys(authUpdate).length > 0) {
    await auth.updateUser(uid, authUpdate);
  }

  return { success: true };
});
