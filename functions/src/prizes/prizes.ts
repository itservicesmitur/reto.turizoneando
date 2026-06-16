import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";

function getCategoryPrefix(category: string): string {
  switch ((category || "").trim().toLowerCase()) {
    case "bares": return "BR";
    case "hoteles": return "HT";
    case "restaurantes": return "RT";
    case "museos": return "MS";
    case "actividades": return "AC";
    case "experiencias": return "EX";
    default: return "PR";
  }
}

export const getPrizes = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const db = getFirestore();

  try {
    const snapshot = await db.collection("prizes").limit(100).get();

    const prizes = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name || "",
        description: d.description || "",
        imageUrl: d.imageUrl || "",
        categoria: d.categoria || "",
        relevance: typeof d.relevance === "number" ? d.relevance : 1,
        stock: typeof d.stock === "number" ? d.stock : 0,
        stockCurrent: typeof d.stockCurrent === "number" ? d.stockCurrent : (typeof d.stock === "number" ? d.stock : 0),
        requiresAdult: d.requiresAdult === true,
        createdAt: d.createdAt || null
      };
    });

    return { prizes };
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to retrieve prizes.");
  }
});

export const getPrizeById = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const { prizeId } = request.data as { prizeId?: string };
  if (!prizeId || !prizeId.trim()) {
    throw new HttpsError("invalid-argument", "prizeId is required.");
  }

  const db = getFirestore();

  try {
    const doc = await db.collection("prizes").doc(prizeId).get();
    if (!doc.exists) {
      throw new HttpsError("not-found", "Prize not found.");
    }

    const d = doc.data()!;
    return {
      prize: {
        id: doc.id,
        name: d.name || "",
        description: d.description || "",
        imageUrl: d.imageUrl || "",
        categoria: d.categoria || "",
        relevance: typeof d.relevance === "number" ? d.relevance : 1,
        stock: typeof d.stock === "number" ? d.stock : 0,
        stockCurrent: typeof d.stockCurrent === "number" ? d.stockCurrent : (typeof d.stock === "number" ? d.stock : 0),
        requiresAdult: d.requiresAdult === true,
        createdAt: d.createdAt || null
      }
    };
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to retrieve prize.");
  }
});

// Llamada cuando el jugador completa una etapa y gana un premio.
// Recibe: { prizeId, seasonId, stageId }
// En una sola transacción: verifica stock, descuenta 1, genera código en /prizeCodes
// y registra el premio en /players/{uid}/seasons/{seasonId}.prizesWon.
export const claimPrize = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const uid = request.auth.uid;
  const { prizeId, seasonId, stageId } = request.data as {
    prizeId?: string;
    seasonId?: string;
    stageId?: string;
  };

  if (!prizeId || !prizeId.trim()) throw new HttpsError("invalid-argument", "prizeId is required.");
  if (!seasonId || !seasonId.trim()) throw new HttpsError("invalid-argument", "seasonId is required.");
  if (!stageId || !stageId.trim()) throw new HttpsError("invalid-argument", "stageId is required.");

  const db = getFirestore();

  // Refs necesarias
  const stageRef = db.collection("seasons").doc(seasonId).collection("stages").doc(stageId);
  const prizeRef = db.collection("prizes").doc(prizeId);
  const playerSeasonRef = db.collection("players").doc(uid).collection("seasons").doc(seasonId);
  const playerRef = db.collection("players").doc(uid);

  try {
    // Intentar hasta 10 veces para evitar colisiones de código
    for (let attempt = 0; attempt < 10; attempt++) {
      const prefix = await prizeRef.get().then(snap => {
        if (!snap.exists) throw new HttpsError("not-found", "Prize not found.");
        return getCategoryPrefix(snap.data()?.categoria || "");
      });

      const suffix = Math.floor(10000 + Math.random() * 90000);
      const code = `${prefix}-${suffix}`;
      const prizeCodeRef = db.collection("prizeCodes").doc(code);

      const result = await db.runTransaction(async (tx) => {
        // Leer docs dentro de la transacción
        const [stageSnap, prizeSnap, playerSeasonSnap, playerSnap, codeSnap] = await Promise.all([
          tx.get(stageRef),
          tx.get(prizeRef),
          tx.get(playerSeasonRef),
          tx.get(playerRef),
          tx.get(prizeCodeRef)
        ]);

        // Verificar que el premio esté asignado a esta etapa
        if (!stageSnap.exists) {
          throw new HttpsError("not-found", "Stage not found for this season.");
        }
        const stagePrizes: any[] = stageSnap.data()?.prizes || [];
        const prizeInStage = stagePrizes.some((p: any) => p.prizeId === prizeId);
        if (!prizeInStage) {
          throw new HttpsError("not-found", "Prize is not available for this stage.");
        }

        // Verificar stock desde el catálogo global
        if (!prizeSnap.exists) {
          throw new HttpsError("not-found", "Prize not found.");
        }
        const prizeData = prizeSnap.data()!;
        const stockCurrent = typeof prizeData.stockCurrent === "number" ? prizeData.stockCurrent : (typeof prizeData.stock === "number" ? prizeData.stock : 0);
        if (stockCurrent <= 0) {
          throw new HttpsError("resource-exhausted", "No hay stock disponible para este premio.");
        }

        // Evitar reclamar el mismo premio de la misma etapa dos veces
        const prizesWon: any[] = playerSeasonSnap.data()?.prizesWon || [];
        const alreadyClaimed = prizesWon.some(
          (p: any) => p.prizeId === prizeId && p.stageId === stageId
        );
        if (alreadyClaimed) {
          throw new HttpsError("already-exists", "Ya reclamaste el premio de esta etapa.");
        }

        // Colisión de código — reintentar fuera de la transacción
        if (codeSnap.exists) return null;

        const playerData = playerSnap.data()!;
        const now = Timestamp.now();

        // 1. Descontar stockCurrent del catálogo global
        tx.update(prizeRef, { stockCurrent: FieldValue.increment(-1) });

        // 2. Crear código en /prizeCodes
        tx.set(prizeCodeRef, {
          code,
          playerId: uid,
          playerEmail: playerData.email || "",
          playerDisplayName: playerData.displayName || "",
          seasonId,
          stageId,
          prizeId,
          prizeName: prizeData.name || "",
          prizeCategory: prizeData.categoria || "",
          prizeImageUrl: prizeData.imageUrl || "",
          status: "active",
          createdAt: now,
          claimedAt: null,
          claimedBy: null
        });

        // 3. Registrar en /players/{uid}/seasons/{seasonId}
        const prizeEntry = {
          prizeId,
          stageId,
          claimedCode: code,
          wonAt: now,
          claimedAt: null
        };

        if (playerSeasonSnap.exists) {
          tx.update(playerSeasonRef, {
            prizesWon: FieldValue.arrayUnion(prizeEntry)
          });
        } else {
          tx.set(playerSeasonRef, {
            seasonId,
            score: 0,
            mapProgress: {},
            currentNodeId: null,
            completedAt: null,
            prizesWon: [prizeEntry]
          });
        }

        return { code, wonAt: now.toDate().toISOString() };
      });

      if (result !== null) {
        return { success: true, code: result.code, wonAt: result.wonAt };
      }
      // result === null significa colisión de código, intentar con otro
    }

    throw new HttpsError("resource-exhausted", "No se pudo generar un código único. Intenta de nuevo.");
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to claim prize.");
  }
});
