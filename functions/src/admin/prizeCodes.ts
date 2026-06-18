import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Helper to map category to prefix
function getCategoryPrefix(category: string): string {
  const norm = (category || "").trim().toLowerCase();
  switch (norm) {
    case "bares":
      return "BR";
    case "hoteles":
      return "HT";
    case "restaurantes":
      return "RT";
    case "museos":
      return "MS";
    case "actividades":
      return "AC";
    case "experiencias":
      return "EX";
    default:
      return "PR";
  }
}

// ── GENERATE TEST CODE ──────────────────────────────────────────────────
export const generateTestPrizeCode = onCall(async (request) => {
  // 1. Authenticate & authorize
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }
  if ((request.auth.token.role as string | undefined)?.toLowerCase() !== "admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  const { email, prizeId, seasonId, stageId, expiresAt: expiresAtInput } = request.data;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    throw new HttpsError("invalid-argument", "A valid player email is required.");
  }
  if (!prizeId || typeof prizeId !== "string") {
    throw new HttpsError("invalid-argument", "A valid Prize ID is required.");
  }
  if (!seasonId || typeof seasonId !== "string") {
    throw new HttpsError("invalid-argument", "A valid Season ID is required.");
  }
  if (!stageId || typeof stageId !== "string") {
    throw new HttpsError("invalid-argument", "A valid Stage ID is required.");
  }
  // Validate optional expiresAt — must be a future date if provided
  let customExpiresAt: Timestamp | null = null;
  if (expiresAtInput) {
    const parsed = new Date(expiresAtInput as string);
    if (isNaN(parsed.getTime()) || parsed <= new Date()) {
      throw new HttpsError("invalid-argument", "La fecha de expiración debe ser una fecha futura válida.");
    }
    customExpiresAt = Timestamp.fromDate(parsed);
  }

  const db = getFirestore();

  try {
    // 2. Lookup player doc
    const playerQuery = await db.collection("players")
      .where("email", "==", email.trim().toLowerCase())
      .limit(1)
      .get();

    if (playerQuery.empty) {
      throw new HttpsError("not-found", "Player account not found for this email address. Please register the user first.");
    }

    const playerDoc = playerQuery.docs[0];
    const playerId = playerDoc.id;
    const playerDisplayName = playerDoc.data().displayName || "Player";

    // 3. Lookup prize doc
    const prizeDoc = await db.collection("prizes").doc(prizeId).get();
    if (!prizeDoc.exists) {
      throw new HttpsError("not-found", "The specified Prize does not exist.");
    }

    const prizeData = prizeDoc.data() || {};
    const prizeName = prizeData.name || "Premio";
    const prizeCategory = prizeData.categoria || "";
    const prizeImageUrl = prizeData.imageUrl || "";
    const prizeLocalId = prizeData.localId || "";
    const prizeLocalName = prizeData.localName || "";
    const prizeExpirationDays = typeof prizeData.codeExpirationDays === "number" && prizeData.codeExpirationDays > 0
      ? prizeData.codeExpirationDays
      : 30;

    // 4. Lookup season doc
    const seasonDoc = await db.collection("seasons").doc(seasonId).get();
    const seasonName = seasonDoc.exists ? (seasonDoc.data()?.name || "Temporada") : "Temporada";

    // 5. Generate unique code using a retry transaction loop
    const prefix = getCategoryPrefix(prizeCategory);
    let generatedCode = "";
    
    // Attempt to find a unique suffix
    for (let attempts = 0; attempts < 10; attempts++) {
      const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5 digits
      const candidateCode = `${prefix}-${randomDigits}`;

      const docRef = db.collection("prizeCodes").doc(candidateCode);
      const isUnique = await db.runTransaction(async (transaction) => {
        const docSnap = await transaction.get(docRef);
        if (docSnap.exists) {
          return false; // Code exists, collision
        }
        
        // Write the code inside the transaction to lock it
        const now = Timestamp.now();
        const expiresAt = customExpiresAt ?? new Timestamp(now.seconds + prizeExpirationDays * 24 * 60 * 60, now.nanoseconds);
        transaction.set(docRef, {
          code: candidateCode,
          playerId,
          playerEmail: email.trim().toLowerCase(),
          playerDisplayName,
          seasonId,
          seasonName,
          stageId,
          prizeId,
          prizeName,
          prizeCategory,
          prizeImageUrl,
          localId: prizeLocalId,
          localName: prizeLocalName,
          status: "active",
          createdAt: now,
          expiresAt,
          claimedAt: null,
          claimedBy: null
        });
        return true;
      });

      if (isUnique) {
        generatedCode = candidateCode;
        break;
      }
    }

    if (!generatedCode) {
      throw new HttpsError("resource-exhausted", "Could not generate a unique prize code. Please try again.");
    }

    return { success: true, code: generatedCode };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Failed to generate test code.";
    throw new HttpsError("internal", message);
  }
});

// ── GET PUBLIC CODE DETAILS ──────────────────────────────────────────────
export const getPublicPrizeCode = onCall(async (request) => {
  const { code } = request.data;
  if (!code || typeof code !== "string") {
    throw new HttpsError("invalid-argument", "Code parameter is required.");
  }

  const db = getFirestore();

  try {
    const docRef = db.collection("prizeCodes").doc(code.trim().toUpperCase());
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new HttpsError("not-found", "El código ingresado no existe o no es válido.");
    }

    const data = docSnap.data() || {};
    return {
      exists: true,
      code: data.code,
      prizeName: data.prizeName,
      prizeCategory: data.prizeCategory,
      prizeImageUrl: data.prizeImageUrl,
      playerEmail: data.playerEmail,
      playerDisplayName: data.playerDisplayName,
      status: data.status, // 'active' | 'inactive' | 'claimed'
      createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
      expiresAt: data.expiresAt ? data.expiresAt.toDate().toISOString() : null,
      claimedAt: data.claimedAt ? data.claimedAt.toDate().toISOString() : null
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Failed to retrieve public prize details.";
    throw new HttpsError("internal", message);
  }
});

// ── VALIDATE PRIZE CODE (provider only) ─────────────────────────────────
// Only the provider whose localId matches the prize's localId can validate.
export const validatePrizeCode = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required");

  const role = (request.auth.token.role as string | undefined)?.toLowerCase();
  const providerLocalId = request.auth.token.localId as string | undefined;

  if (role !== "provider" && role !== "admin") {
    throw new HttpsError("permission-denied", "Solo un local autorizado puede canjear este código.");
  }

  const { code } = request.data;
  if (!code || typeof code !== "string") {
    throw new HttpsError("invalid-argument", "Code parameter is required.");
  }

  const db = getFirestore();
  const docRef = db.collection("prizeCodes").doc(code.trim().toUpperCase());

  try {
    const result = await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists) {
        throw new HttpsError("not-found", "El código no existe o no es válido.");
      }

      const data = docSnap.data() || {};

      if (data.status === "claimed") {
        throw new HttpsError("failed-precondition", "Este código ya fue canjeado.");
      }
      if (data.status === "inactive") {
        throw new HttpsError("failed-precondition", "Este código está desactivado.");
      }
      if (data.expiresAt && (data.expiresAt as Timestamp).toMillis() < Date.now()) {
        throw new HttpsError("failed-precondition", "Este código ha expirado.");
      }

      // Verify that the provider's localId matches the prize's localId
      if (role === "provider") {
        if (!providerLocalId) {
          throw new HttpsError("permission-denied", "Tu cuenta no tiene un local asignado.");
        }
        if (data.localId !== providerLocalId) {
          throw new HttpsError("permission-denied", "Este código no pertenece a tu local.");
        }
      }

      const claimedAt = Timestamp.now();
      transaction.update(docRef, {
        status: "claimed",
        claimedAt,
        claimedBy: request.auth!.uid,
      });

      return {
        claimedAt: claimedAt.toDate().toISOString(),
        prizeName: data.prizeName || "",
        playerDisplayName: data.playerDisplayName || "",
        playerEmail: data.playerEmail || "",
      };
    });

    return { success: true, ...result };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    const message = error instanceof Error ? error.message : "Failed to validate code.";
    throw new HttpsError("internal", message);
  }
});

// ── GET PROVIDER CODES ────────────────────────────────────────────────────
// Returns prize codes that belong to the provider's local.
export const getProviderCodes = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required");

  const role = (request.auth.token.role as string | undefined)?.toLowerCase();
  if (role !== "provider" && role !== "admin") {
    throw new HttpsError("permission-denied", "Access denied.");
  }

  let localId: string;
  if (role === "provider") {
    localId = request.auth.token.localId as string;
    if (!localId) throw new HttpsError("failed-precondition", "Tu cuenta no tiene un local asignado.");
  } else {
    // Admin can query a specific local
    localId = request.data?.localId;
    if (!localId) throw new HttpsError("invalid-argument", "localId is required.");
  }

  const db = getFirestore();
  try {
    const snap = await db.collection("prizeCodes")
      .where("localId", "==", localId)
      .orderBy("createdAt", "desc")
      .limit(500)
      .get();

    const codes = snap.docs.map(doc => {
      const d = doc.data();
      return {
        code: d.code || doc.id,
        prizeName: d.prizeName || "",
        prizeCategory: d.prizeCategory || "",
        prizeImageUrl: d.prizeImageUrl || "",
        localId: d.localId || "",
        localName: d.localName || "",
        playerEmail: d.playerEmail || "",
        playerDisplayName: d.playerDisplayName || "",
        seasonName: d.seasonName || "",
        status: d.status || "active",
        createdAt: d.createdAt ? d.createdAt.toDate().toISOString() : null,
        expiresAt: d.expiresAt ? d.expiresAt.toDate().toISOString() : null,
        claimedAt: d.claimedAt ? d.claimedAt.toDate().toISOString() : null,
      };
    });

    return { codes };
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to retrieve codes.");
  }
});

// ── REDEEM PUBLIC CODE ───────────────────────────────────────────────────
export const redeemPublicPrizeCode = onCall(async (request) => {
  const { code } = request.data;
  if (!code || typeof code !== "string") {
    throw new HttpsError("invalid-argument", "Code parameter is required.");
  }

  const db = getFirestore();
  const docRef = db.collection("prizeCodes").doc(code.trim().toUpperCase());

  try {
    const result = await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists) {
        throw new HttpsError("not-found", "El código no existe.");
      }

      const data = docSnap.data() || {};

      if (data.status === "claimed") {
        throw new HttpsError("failed-precondition", "Este código ya ha sido canjeado.");
      }

      if (data.status === "inactive") {
        throw new HttpsError("failed-precondition", "Este código está desactivado y no se puede canjear.");
      }

      if (data.expiresAt && (data.expiresAt as Timestamp).toMillis() < Date.now()) {
        throw new HttpsError("failed-precondition", "Este código ha expirado y ya no puede ser canjeado.");
      }

      const claimedAt = Timestamp.now();
      transaction.update(docRef, {
        status: "claimed",
        claimedAt,
        claimedBy: "merchant"
      });

      return { claimedAt: claimedAt.toDate().toISOString() };
    });

    return { success: true, claimedAt: result.claimedAt };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Failed to redeem code.";
    throw new HttpsError("internal", message);
  }
});
