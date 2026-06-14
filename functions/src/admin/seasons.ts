import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

// Helper to convert date strings to Timestamps
function parseTimestamp(dateInput: any): Timestamp {
  if (!dateInput) {
    throw new HttpsError("invalid-argument", "Date is required.");
  }
  if (typeof dateInput === "string") {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      throw new HttpsError("invalid-argument", `Invalid date format: ${dateInput}`);
    }
    return Timestamp.fromDate(d);
  }
  if (typeof dateInput === "number") {
    return Timestamp.fromMillis(dateInput);
  }
  if (dateInput.seconds && typeof dateInput.seconds === "number") {
    return new Timestamp(dateInput.seconds, dateInput.nanoseconds || 0);
  }
  throw new HttpsError("invalid-argument", "Unsupported date type.");
}

export const createSeason = onCall(async (request) => {
  console.log("createSeason triggered with data:", request.data);
  try {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    if ((request.auth.token.role as string | undefined)?.toLowerCase() !== "admin") {
      throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
    }

    const { name, status, startDate, endDate, stages } = request.data;

    // Validation
    if (!name || typeof name !== "string" || !name.trim()) {
      throw new HttpsError("invalid-argument", "Season name is required.");
    }
    if (status !== "active" && status !== "upcoming" && status !== "archived") {
      throw new HttpsError("invalid-argument", "Status must be 'active', 'upcoming', or 'archived'.");
    }

    const startTS = parseTimestamp(startDate);
    const endTS = parseTimestamp(endDate);
    if (startTS.toMillis() > endTS.toMillis()) {
      throw new HttpsError("invalid-argument", "Start date must be before or equal to End date.");
    }

    if (!Array.isArray(stages) || stages.length < 1) {
      throw new HttpsError("invalid-argument", "Season must have at least 1 stage.");
    }

    for (let i = 0; i < stages.length; i++) {
      const s = stages[i];
      if (typeof s.pointsCount !== "number" || s.pointsCount < 0) {
        throw new HttpsError("invalid-argument", `Stage ${i + 1} pointsCount must be a non-negative number.`);
      }
      if (!Array.isArray(s.prizes) || s.prizes.length === 0) {
        throw new HttpsError("invalid-argument", `Stage ${i + 1} must have at least one prize configured.`);
      }
      for (let j = 0; j < s.prizes.length; j++) {
        const p = s.prizes[j];
        if (!p.prizeId || typeof p.prizeId !== "string") {
          throw new HttpsError("invalid-argument", `Stage ${i + 1} prize ${j + 1} must have a valid prizeId.`);
        }
        if (typeof p.stock !== "number" || p.stock < 0) {
          throw new HttpsError("invalid-argument", `Stage ${i + 1} prize ${j + 1} stock must be a non-negative number.`);
        }
      }
    }

    const db = getFirestore();
    const seasonRef = db.collection("seasons").doc();
    const uid = request.auth.uid;

    await db.runTransaction(async (transaction) => {
      // If setting this season to active, archive other active seasons
      if (status === "active") {
        const activeSeasonsQuery = db.collection("seasons").where("status", "==", "active");
        const activeSeasonsSnap = await transaction.get(activeSeasonsQuery);
        for (const doc of activeSeasonsSnap.docs) {
          transaction.update(doc.ref, { status: "archived" });
        }
      }

      // Create main season doc
      transaction.set(seasonRef, {
        id: seasonRef.id,
        name: name.trim(),
        status,
        startDate: startTS,
        endDate: endTS,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: uid,
      });

      // Create stages (variable count: 1–10)
      for (let i = 0; i < stages.length; i++) {
        const s = stages[i];
        const stageId = `stage_${i + 1}`;
        const stageRef = seasonRef.collection("stages").doc(stageId);
        const uniquePrizeIds = Array.from(new Set(s.prizes.map((p: any) => p.prizeId))) as string[];
        transaction.set(stageRef, {
          id: stageId,
          number: i + 1,
          prizeIds: uniquePrizeIds,
          prizes: s.prizes,
          pointsCount: s.pointsCount,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      // Create aggregated prizes stock
      const prizeStocks: Record<string, number> = {};
      for (const s of stages) {
        for (const p of s.prizes) {
          prizeStocks[p.prizeId] = (prizeStocks[p.prizeId] || 0) + p.stock;
        }
      }
      for (const [prizeId, stock] of Object.entries(prizeStocks)) {
        const prizeRef = seasonRef.collection("prizes").doc(prizeId);
        transaction.set(prizeRef, {
          id: prizeId,
          stock,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    });

    return { id: seasonRef.id };
  } catch (error) {
    console.error("Error in createSeason handler:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Failed to create season.";
    throw new HttpsError("internal", message);
  }
});

// ── UPDATE SEASON ────────────────────────────────────────────────────────
export const updateSeason = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  if ((request.auth.token.role as string | undefined)?.toLowerCase() !== "admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  const { id, name, status, startDate, endDate, stages } = request.data;

  if (!id || typeof id !== "string") {
    throw new HttpsError("invalid-argument", "Season ID is required.");
  }
  if (!name || typeof name !== "string" || !name.trim()) {
    throw new HttpsError("invalid-argument", "Season name is required.");
  }
  if (status !== "active" && status !== "upcoming" && status !== "archived") {
    throw new HttpsError("invalid-argument", "Status must be 'active', 'upcoming', or 'archived'.");
  }

  const startTS = parseTimestamp(startDate);
  const endTS = parseTimestamp(endDate);
  if (startTS.toMillis() > endTS.toMillis()) {
    throw new HttpsError("invalid-argument", "Start date must be before or equal to End date.");
  }

  if (!Array.isArray(stages) || stages.length < 1) {
    throw new HttpsError("invalid-argument", "Season must have at least 1 stage.");
  }

  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    if (typeof s.pointsCount !== "number" || s.pointsCount < 0) {
      throw new HttpsError("invalid-argument", `Stage ${i + 1} pointsCount must be a non-negative number.`);
    }
    if (!Array.isArray(s.prizes) || s.prizes.length === 0) {
      throw new HttpsError("invalid-argument", `Stage ${i + 1} must have at least one prize configured.`);
    }
    for (let j = 0; j < s.prizes.length; j++) {
      const p = s.prizes[j];
      if (!p.prizeId || typeof p.prizeId !== "string") {
        throw new HttpsError("invalid-argument", `Stage ${i + 1} prize ${j + 1} must have a valid prizeId.`);
      }
      if (typeof p.stock !== "number" || p.stock < 0) {
        throw new HttpsError("invalid-argument", `Stage ${i + 1} prize ${j + 1} stock must be a non-negative number.`);
      }
    }
  }


  try {
    const db = getFirestore();
    const seasonRef = db.collection("seasons").doc(id);

    await db.runTransaction(async (transaction) => {
      // 1. All Reads First
      const seasonSnap = await transaction.get(seasonRef);
      if (!seasonSnap.exists) {
        throw new HttpsError("not-found", "Season not found.");
      }

      let activeSeasonsSnap: any = null;
      if (status === "active") {
        const activeSeasonsQuery = db.collection("seasons").where("status", "==", "active");
        activeSeasonsSnap = await transaction.get(activeSeasonsQuery);
      }

      const oldPrizesCol = seasonRef.collection("prizes");
      const oldPrizesSnap = await transaction.get(oldPrizesCol);

      // 2. All Writes Second
      if (status === "active" && activeSeasonsSnap) {
        for (const doc of activeSeasonsSnap.docs) {
          if (doc.id !== id) {
            transaction.update(doc.ref, { status: "archived" });
          }
        }
      }

      // Update main season doc
      transaction.update(seasonRef, {
        name: name.trim(),
        status,
        startDate: startTS,
        endDate: endTS,
      });

      // Update stages (variable count)
      for (let i = 0; i < stages.length; i++) {
        const s = stages[i];
        const stageId = s.id || `stage_${i + 1}`;
        const stageRef = seasonRef.collection("stages").doc(stageId);
        const uniquePrizeIds = Array.from(new Set(s.prizes.map((p: any) => p.prizeId))) as string[];
        transaction.set(stageRef, {
          id: stageId,
          number: i + 1,
          prizeIds: uniquePrizeIds,
          prizes: s.prizes,
          pointsCount: s.pointsCount,
        }, { merge: true });
      }

      // Delete existing prizes subcollection docs
      for (const doc of oldPrizesSnap.docs) {
        transaction.delete(doc.ref);
      }

      // Create aggregated prizes stock
      const prizeStocks: Record<string, number> = {};
      for (const s of stages) {
        for (const p of s.prizes) {
          prizeStocks[p.prizeId] = (prizeStocks[p.prizeId] || 0) + p.stock;
        }
      }
      for (const [prizeId, stock] of Object.entries(prizeStocks)) {
        const prizeRef = seasonRef.collection("prizes").doc(prizeId);
        transaction.set(prizeRef, {
          id: prizeId,
          stock,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update season.";
    throw new HttpsError("internal", message);
  }
});

// ── DELETE SEASON ────────────────────────────────────────────────────────
export const deleteSeason = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  if ((request.auth.token.role as string | undefined)?.toLowerCase() !== "admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  const { id } = request.data;
  if (!id || typeof id !== "string") {
    throw new HttpsError("invalid-argument", "Season ID is required.");
  }

  try {
    const db = getFirestore();
    const seasonRef = db.collection("seasons").doc(id);

    await db.runTransaction(async (transaction) => {
      // 1. All Reads First
      const seasonSnap = await transaction.get(seasonRef);
      if (!seasonSnap.exists) {
        throw new HttpsError("not-found", "Season not found.");
      }

      // Read stages to delete them
      const stagesQuery = seasonRef.collection("stages");
      const stagesSnap = await transaction.get(stagesQuery);

      // Read prizes to delete them
      const prizesQuery = seasonRef.collection("prizes");
      const prizesSnap = await transaction.get(prizesQuery);

      // 2. All Writes Second
      // Delete stages subcollection docs
      for (const doc of stagesSnap.docs) {
        transaction.delete(doc.ref);
      }

      // Delete prizes subcollection docs
      for (const doc of prizesSnap.docs) {
        transaction.delete(doc.ref);
      }

      // Delete main season document
      transaction.delete(seasonRef);
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete season.";
    throw new HttpsError("internal", message);
  }
});
