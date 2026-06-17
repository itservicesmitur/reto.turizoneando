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

  const { email, prizeId, seasonId, stageId } = request.data;
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
        const expiresAt = new Timestamp(now.seconds + 30 * 24 * 60 * 60, now.nanoseconds);
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
