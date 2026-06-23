import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import sgMail from "@sendgrid/mail";

const sendgridApiKeySecret = defineSecret("SENDGRID_API_KEY");
const sendgridFromEmailSecret = defineSecret("SENDGRID_FROM_EMAIL");

// Logo must be a public URL — never use hostOrigin (could be localhost in dev)
const LOGO_URL = 'https://turizoneando-dev.web.app/assets/img/logoSoloLetras.png';

// Helper function to send email via SendGrid
async function sendRawEmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<void> {
  const apiKey = sendgridApiKeySecret.value().trim();
  const fromEmail = sendgridFromEmailSecret.value().trim() || "turizoneando@mitur.gob.do";

  if (!apiKey) {
    throw new HttpsError("failed-precondition", "SendGrid API key is not configured in Secret Manager.");
  }

  sgMail.setApiKey(apiKey);

  const msg = {
    to: to.trim().toLowerCase(),
    from: {
      email: fromEmail,
      name: "Turizoneando"
    },
    subject: subject,
    text: textContent,
    html: htmlContent
  };

  try {
    await sgMail.send(msg);
  } catch (error: any) {
    console.error("SendGrid error detailed:", error.response?.body || error);
    throw new Error(error.message || "Failed to dispatch email via SendGrid.");
  }
}

// ── HEADER & FOOTER TEMPLATE UTILITIES ───────────────────────────────────
function getEmailHeader(title: string, subtitle: string, logoUrl = LOGO_URL): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #edf6f6;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        table {
          border-spacing: 0;
          border-collapse: collapse;
          width: 100%;
        }
        td {
          padding: 0;
        }
        .wrapper {
          width: 100%;
          table-layout: fixed;
          background-color: #edf6f6;
          padding-bottom: 40px;
          padding-top: 40px;
        }
        .main-card {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(9, 109, 125, 0.13);
          border: 1px solid #c8e8e6;
        }
        .header-banner {
          background: linear-gradient(135deg, #00bbb4 0%, #096d7d 100%);
          padding: 36px 30px 28px;
          text-align: center;
        }
        /* filter:invert works on Gmail, Apple Mail, iOS — not Outlook Windows */
        .logo-img {
          height: 54px;
          width: auto;
          display: block;
          margin: 0 auto 10px;
          filter: brightness(0) invert(1);
        }
        .logo-subtitle {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.85);
          margin: 0;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }
        .content-body {
          padding: 40px 30px;
          color: #1e293b;
        }
        .footer-banner {
          padding: 24px 30px;
          background-color: #edf6f6;
          border-top: 1px solid #c8e8e6;
          text-align: center;
          font-size: 11px;
          color: #64748b;
          line-height: 1.6;
        }
        .btn-cta {
          display: inline-block;
          padding: 14px 30px;
          background: linear-gradient(135deg, #e0344b 0%, #ff9447 100%);
          color: #ffffff !important;
          font-size: 15px;
          font-weight: 800;
          text-decoration: none !important;
          border-radius: 10px;
          margin: 24px 0;
          text-align: center;
          box-shadow: 0 4px 14px rgba(224, 52, 75, 0.28);
          text-transform: uppercase;
        }
        .prize-card {
          background-color: #f0fafa;
          border: 1px solid #c8e8e6;
          border-radius: 14px;
          padding: 22px;
          margin: 20px 0;
          text-align: center;
        }
        .category-badge {
          font-size: 11px;
          font-weight: 800;
          color: #00bbb4;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: inline-block;
          background-color: rgba(0,187,180,0.12);
          padding: 4px 12px;
          border-radius: 20px;
          margin-bottom: 10px;
        }
        .prize-name {
          font-size: 18px;
          font-weight: 700;
          color: #096d7d;
          margin: 0 0 10px 0;
        }
        .code-label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
          margin-top: 12px;
        }
        .code-box {
          display: inline-block;
          font-family: monospace;
          font-size: 22px;
          font-weight: 800;
          color: #ff9447;
          background-color: rgba(255,148,71,0.10);
          border: 2px dashed #ff9447;
          padding: 8px 24px;
          border-radius: 8px;
          margin-top: 6px;
          letter-spacing: 2px;
        }
        .section-title {
          font-size: 15px;
          font-weight: 700;
          color: #096d7d;
          margin: 24px 0 10px 0;
        }
        .steps-list {
          margin: 0 0 16px 0;
          padding-left: 20px;
          color: #475569;
          font-size: 14px;
        }
        .steps-list li {
          margin-bottom: 8px;
        }
        .note-text {
          margin: 0;
          font-size: 12px;
          color: #94a3b8;
          text-align: center;
          border-top: 1px solid #c8e8e6;
          padding-top: 16px;
        }
        h2.greeting {
          font-size: 20px;
          font-weight: 700;
          color: #096d7d;
          margin: 0 0 16px 0;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <table class="main-card">
          <tr>
            <td>
              <div class="header-banner">
                <div style="font-size: 32px; font-weight: 900; color: #ffffff; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">Turizoneando</div>
                <div class="logo-subtitle">${subtitle}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td class="content-body">
  `;
}

function getEmailFooter(): string {
  return `
            </td>
          </tr>
          <tr>
            <td>
              <div class="footer-banner">
                <strong style="color: #096d7d;">Ministerio de Turismo (MITUR)</strong><br>
                Dirección de Fomento Turístico de la Ciudad Colonial, Santo Domingo, RD<br>
                Este correo fue enviado de forma segura. Si recibiste este mensaje por error, por favor notifícanos y elimínalo.<br>
                &copy; ${new Date().getFullYear()} Turizoneando. Todos los derechos reservados.
              </div>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;
}

// ── CUSTOM/TEST EMAIL CALLABLE ──────────────────────────────────────────
export const sendAdminCustomEmail = onCall({
  secrets: [sendgridApiKeySecret, sendgridFromEmailSecret]
}, async (request) => {
  // 1. Authenticate & Admin Check
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }
  if ((request.auth.token.role as string | undefined)?.toLowerCase() !== "admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  const { email, subject, body } = request.data as {
    email?: string;
    subject?: string;
    body?: string;
  };

  if (!email || !email.includes("@")) {
    throw new HttpsError("invalid-argument", "Valid target email is required.");
  }
  if (!subject || !subject.trim()) {
    throw new HttpsError("invalid-argument", "Email subject is required.");
  }
  if (!body || !body.trim()) {
    throw new HttpsError("invalid-argument", "Email body text is required.");
  }

  // Generate premium HTML content
  const formattedBodyHtml = body
    .trim()
    .replace(/\n/g, "<br>")
    .split("<br><br>")
    .map(p => `<p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 15px; color: #334155;">${p}</p>`)
    .join("");

  const htmlContent = `
    ${getEmailHeader("Turizoneando", "Mensaje del Administrador", LOGO_URL)}
    <div style="font-size: 15px; line-height: 1.6; color: #1e293b;">
      ${formattedBodyHtml}
    </div>
    ${getEmailFooter()}
  `;

  try {
    await sendRawEmail(email, subject.trim(), htmlContent, body.trim());
    return { success: true };
  } catch (error: any) {
    throw new HttpsError("internal", error.message || "Failed to send custom email.");
  }
});

// ── PASSWORD RESET EMAIL CALLABLE ───────────────────────────────────────
export const sendAdminPasswordResetEmail = onCall({
  secrets: [sendgridApiKeySecret, sendgridFromEmailSecret]
}, async (request) => {
  // 1. Authenticate & Admin Check
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }
  if ((request.auth.token.role as string | undefined)?.toLowerCase() !== "admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  const { email } = request.data as { email?: string };
  if (!email || !email.includes("@")) {
    throw new HttpsError("invalid-argument", "Valid player email is required.");
  }

  const db = getFirestore();

  try {
    // 2. Fetch Player detail to get display name
    const playerQuery = await db.collection("players")
      .where("email", "==", email.trim().toLowerCase())
      .limit(1)
      .get();

    let displayName = "Jugador";
    if (!playerQuery.empty) {
      const pData = playerQuery.docs[0].data();
      displayName = pData.displayName || `${pData.firstName || ""} ${pData.lastName || ""}`.trim() || "Jugador";
    }

    // 3. Generate password reset link via Firebase Admin SDK and adapt it for our custom route
    const actionCodeSettings = {
      url: "https://turizoneando.mitur.gob.do/login",
    };
    const defaultLink = await admin.auth().generatePasswordResetLink(email.trim().toLowerCase(), actionCodeSettings);

    const urlObj = new URL(defaultLink);
    const oobCode = urlObj.searchParams.get("oobCode") || "";
    const apiKey = urlObj.searchParams.get("apiKey") || "";

    const hostOrigin = request.rawRequest.headers.origin || "https://turizoneando.mitur.gob.do";
    const customResetLink = `${hostOrigin}/reset-password?oobCode=${oobCode}&apiKey=${apiKey}`;

    // 4. Construct beautiful HTML layout
    const htmlContent = `
      ${getEmailHeader("Turizoneando", "Restablecimiento de Contraseña", LOGO_URL)}
      <div style="font-size: 15px; line-height: 1.6; color: #1e293b;">
        <h2 class="greeting">¡Hola, ${displayName}!</h2>
        <p style="margin: 0 0 16px 0;">Un administrador del sistema ha iniciado una solicitud para restablecer la contraseña de tu cuenta en <strong>Turizoneando</strong>.</p>
        <p style="margin: 0 0 24px 0;">Para elegir una nueva contraseña y recuperar el acceso a tu cuenta, haz clic en el siguiente enlace:</p>
        
        <div style="text-align: center;">
          <a href="${customResetLink}" class="btn-cta" target="_blank" style="color: #096d7d !important;">Restablecer Contraseña</a>
        </div>

        <p style="margin: 24px 0 16px 0; font-size: 13px; color: #64748b;">Este enlace de seguridad es de un solo uso. Si expiró, puedes volver a solicitar uno nuevo en la pantalla de inicio de sesión de la aplicación.</p>
        <p style="margin: 0; font-size: 13px; color: #64748b;">Si no solicitaste este cambio, simplemente ignora este mensaje y tu contraseña actual seguirá funcionando.</p>
      </div>
      ${getEmailFooter()}
    `;

    const textContent = `Hola ${displayName},\n\nUn administrador ha solicitado el restablecimiento de tu contraseña en Turizoneando.\n\nUsa este enlace para cambiar tu contraseña:\n${customResetLink}\n\nSi no fuiste tú, puedes ignorar este mensaje.\n\nMITUR`;

    await sendRawEmail(email, "Restablece tu contraseña - Turizoneando", htmlContent, textContent);
    return { success: true };
  } catch (error: any) {
    console.error("Password reset email dispatch failed:", error);
    throw new HttpsError("internal", error.message || "Failed to send password reset email.");
  }
});

// ── SEND ALL ACTIVE PRIZE CODES TO PLAYER ────────────────────────────────
export const sendPlayerPrizeCodes = onCall({
  secrets: [sendgridApiKeySecret, sendgridFromEmailSecret]
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }
  if ((request.auth.token.role as string | undefined)?.toLowerCase() !== "admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  const { email } = request.data as { email?: string };
  if (!email || !email.includes("@")) {
    throw new HttpsError("invalid-argument", "Valid player email is required.");
  }

  const db = getFirestore();

  try {
    // Fetch player display name
    const playerQuery = await db.collection("players")
      .where("email", "==", email.trim().toLowerCase())
      .limit(1)
      .get();

    const displayName = playerQuery.empty
      ? "Ganador"
      : (playerQuery.docs[0].data().displayName || "Ganador");

    // Fetch all active prize codes for this player
    const codesSnap = await db.collection("prizeCodes")
      .where("playerEmail", "==", email.trim().toLowerCase())
      .where("status", "==", "active")
      .get();

    if (codesSnap.empty) {
      throw new HttpsError("not-found", "No hay códigos activos para este jugador.");
    }

    const hostOrigin = request.rawRequest.headers.origin || "https://turizoneando.mitur.gob.do";

    const codes = codesSnap.docs.map(doc => {
      const d = doc.data();
      const uniqueCode = d.code || doc.id;
      return {
        code: uniqueCode,
        prizeName: d.prizeName || "Premio",
        prizeCategory: d.prizeCategory || "",
        prizeImageUrl: d.prizeImageUrl || "",
        stageId: d.stageId || "",
        seasonId: d.seasonId || "",
        status: d.status || "active",
        createdAt: d.createdAt ? d.createdAt.toDate().toISOString() : null,
        claimedAt: d.claimedAt ? d.claimedAt.toDate().toISOString() : null,
        validationUrl: `${hostOrigin}/validar/${uniqueCode}`
      };
    });

    // Build one HTML block per code
    const codeBlocksHtml = codes.map((c, i) => {
      const imgHtml = c.prizeImageUrl
        ? `<img src="${c.prizeImageUrl}" alt="${c.prizeName}" style="max-width: 140px; height: 140px; object-fit: cover; border-radius: 10px; border: 1.5px solid #e2e8f0; display: block; margin: 0 auto 12px;" />`
        : "";
      return `
        <div class="prize-card">
          <span class="category-badge">Premio ${i + 1}${c.prizeCategory ? " — " + c.prizeCategory : ""}</span>
          <h3 class="prize-name">${c.prizeName}</h3>
          ${imgHtml}
          <span class="code-label">Código de Canje</span>
          <div class="code-box">${c.code}</div>
        </div>
      `;
    }).join("");

    const htmlContent = `
      ${getEmailHeader("Turizoneando", "Tus Premios del Desafío Cultural", LOGO_URL)}
      <div style="font-size: 15px; line-height: 1.6; color: #1e293b;">
        <h2 class="greeting">¡Hola, ${displayName}!</h2>
        <p style="margin: 0 0 20px 0;">¡Felicidades por completar el Desafío Cultural de la Ciudad Colonial! Aquí ${codes.length === 1 ? "está tu premio ganado" : "están todos tus premios ganados"}:</p>
        ${codeBlocksHtml}
        <h3 class="section-title">¿Cómo canjear tu premio?</h3>
        <ol class="steps-list">
          <li>Dirígete al establecimiento participante que corresponde a tu premio.</li>
          <li>Muestra este correo o tu código en la aplicación al personal.</li>
          <li>El establecimiento validará tu código y te entregará tu recompensa.</li>
        </ol>
        <p class="note-text">Cada código es válido para un único canje. Conserva este correo de forma privada.</p>
      </div>
      ${getEmailFooter()}
    `;

    const textLines = codes.map((c, i) =>
      `Premio ${i + 1}: ${c.prizeName}\nCódigo: ${c.code}\nValidar en: ${c.validationUrl}`
    ).join("\n\n");
    const textContent = `¡Felicidades ${displayName}!\n\n${textLines}\n\nMITUR - Turizoneando`;

    const subject = codes.length === 1
      ? `Tu premio de Turizoneando: ${codes[0].prizeName} — Código ${codes[0].code}`
      : `Tus ${codes.length} premios de Turizoneando — Desafío Cultural Ciudad Colonial`;

    await sendRawEmail(email.trim().toLowerCase(), subject, htmlContent, textContent);

    // Return codes without the internal validationUrl
    const codesResult = codes.map(({ validationUrl: _v, ...rest }) => rest);
    return { success: true, emailSent: true, codes: codesResult };
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to send player prize codes.");
  }
});

// ── CLAIM PRIZE + SEND EMAIL IN ONE CALL ─────────────────────────────────
function getPrizeCategoryPrefix(category: string): string {
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

export const claimPrizeAndNotify = onCall({
  secrets: [sendgridApiKeySecret, sendgridFromEmailSecret]
}, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required");

  const uid = request.auth.uid;
  const { prizeId, seasonId, stageId } = request.data as {
    prizeId?: string;
    seasonId?: string;
    stageId?: string;
  };

  if (!prizeId?.trim()) throw new HttpsError("invalid-argument", "prizeId is required.");
  if (!seasonId?.trim()) throw new HttpsError("invalid-argument", "seasonId is required.");
  if (!stageId?.trim()) throw new HttpsError("invalid-argument", "stageId is required.");

  const db = getFirestore();
  const stageRef = db.collection("seasons").doc(seasonId).collection("stages").doc(stageId);
  const prizeRef = db.collection("prizes").doc(prizeId);
  const playerSeasonRef = db.collection("players").doc(uid).collection("seasons").doc(seasonId);
  const playerRef = db.collection("players").doc(uid);

  type ClaimResult = {
    code: string;
    wonAt: string;
    playerEmail: string;
    playerDisplayName: string;
    prizeName: string;
    prizeCategory: string;
    prizeImageUrl: string;
  };

  let claimed: ClaimResult | null = null;

  try {
    for (let attempt = 0; attempt < 10; attempt++) {
      const prefix = await prizeRef.get().then(snap => {
        if (!snap.exists) throw new HttpsError("not-found", "Prize not found.");
        return getPrizeCategoryPrefix(snap.data()?.categoria || "");
      });

      const code = `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;
      const prizeCodeRef = db.collection("prizeCodes").doc(code);

      const result = await db.runTransaction(async (tx) => {
        const [stageSnap, prizeSnap, playerSeasonSnap, playerSnap, codeSnap] = await Promise.all([
          tx.get(stageRef), tx.get(prizeRef), tx.get(playerSeasonRef), tx.get(playerRef), tx.get(prizeCodeRef)
        ]);

        if (!stageSnap.exists) throw new HttpsError("not-found", "Stage not found for this season.");
        const stagePrizes: any[] = stageSnap.data()?.prizes || [];
        if (!stagePrizes.some((p: any) => p.prizeId === prizeId)) {
          throw new HttpsError("not-found", "Prize is not available for this stage.");
        }

        if (!prizeSnap.exists) throw new HttpsError("not-found", "Prize not found.");
        const prizeData = prizeSnap.data() ?? {};
        const stockCurrent = typeof prizeData.stockCurrent === "number"
          ? prizeData.stockCurrent
          : (typeof prizeData.stock === "number" ? prizeData.stock : 0);
        if (stockCurrent <= 0) throw new HttpsError("resource-exhausted", "No hay stock disponible para este premio.");

        const prizesWon: any[] = playerSeasonSnap.data()?.prizesWon || [];
        if (prizesWon.some((p: any) => p.prizeId === prizeId && p.stageId === stageId)) {
          throw new HttpsError("already-exists", "Ya reclamaste el premio de esta etapa.");
        }
        if (prizesWon.length >= 1) {
          throw new HttpsError("already-exists", "Ya alcanzaste el límite de 1 premio para este desafío.");
        }

        if (codeSnap.exists) return null; // code collision — retry

        const playerData = playerSnap.data() ?? {};
        const now = Timestamp.now();
        const expiresAt = new Timestamp(now.seconds + 30 * 24 * 60 * 60, now.nanoseconds);

        tx.update(prizeRef, { stockCurrent: FieldValue.increment(-1) });
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
          expiresAt,
          claimedAt: null,
          claimedBy: null
        });

        const prizeEntry = { prizeId, stageId, claimedCode: code, wonAt: now, expiresAt, claimedAt: null };
        if (playerSeasonSnap.exists) {
          tx.update(playerSeasonRef, { prizesWon: FieldValue.arrayUnion(prizeEntry) });
        } else {
          tx.set(playerSeasonRef, {
            seasonId, score: 0, mapProgress: {}, currentNodeId: null, completedAt: null, prizesWon: [prizeEntry]
          });
        }

        return {
          code,
          wonAt: now.toDate().toISOString(),
          playerEmail: playerData.email || "",
          playerDisplayName: playerData.displayName || "Ganador",
          prizeName: prizeData.name || "Premio",
          prizeCategory: prizeData.categoria || "",
          prizeImageUrl: prizeData.imageUrl || ""
        } as ClaimResult;
      });

      if (result !== null) {
        claimed = result;
        break;
      }
    }
  } catch (error: any) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to claim prize.");
  }

  if (!claimed) {
    throw new HttpsError("resource-exhausted", "No se pudo generar un código único. Intenta de nuevo.");
  }

  // Send email — failure does NOT revert the claim
  let emailSent = false;
  if (claimed.playerEmail) {
    try {
      const hostOrigin = request.rawRequest.headers.origin || "https://turizoneando.mitur.gob.do";
      const validationUrl = `${hostOrigin}/validar/${claimed.code}`;
      const imgHtml = claimed.prizeImageUrl
        ? `<div style="text-align:center;margin:20px 0;"><img src="${claimed.prizeImageUrl}" alt="${claimed.prizeName}" style="max-width:180px;height:180px;object-fit:cover;border-radius:12px;border:1.5px solid #e2e8f0;box-shadow:0 4px 10px rgba(0,0,0,0.05);" /></div>`
        : "";
      const categoryBadge = claimed.prizeCategory
        ? `<span class="category-badge">${claimed.prizeCategory}</span>`
        : "";

      const htmlContent = `
        ${getEmailHeader("Turizoneando", "¡Felicidades por tu Premio!", LOGO_URL)}
        <div style="font-size:15px;line-height:1.6;color:#1e293b;">
          <h2 class="greeting">¡Hola, ${claimed.playerDisplayName}!</h2>
          <p style="margin:0 0 16px 0;">¡Felicidades! Completaste una etapa del Desafío Cultural de la Ciudad Colonial y ganaste un premio especial:</p>
          <div class="prize-card">
            ${categoryBadge}
            <h3 class="prize-name">${claimed.prizeName}</h3>
            ${imgHtml}
            <span class="code-label">Código de Canje Único</span>
            <div class="code-box">${claimed.code}</div>
          </div>
          <ol class="steps-list">
            <li>Dirígete al establecimiento participante que corresponde a tu premio.</li>
            <li>Muestra este correo o tu código en la aplicación al personal.</li>
            <li>El establecimiento validará tu código y te entregará tu recompensa.</li>
          </ol>
          <p class="note-text">Este código es válido para un único canje. Consérvalo de forma privada.</p>
        </div>
        ${getEmailFooter()}
      `;

      const textContent = `¡Felicidades ${claimed.playerDisplayName}!\n\nGanaste: ${claimed.prizeName}${claimed.prizeCategory ? ` (${claimed.prizeCategory})` : ""}\nCódigo: ${claimed.code}\nValidar en: ${validationUrl}\n\nMITUR - Turizoneando`;
      await sendRawEmail(
        claimed.playerEmail,
        `Tu premio de Turizoneando: ${claimed.prizeName} — Código ${claimed.code}`,
        htmlContent,
        textContent
      );
      emailSent = true;
    } catch (emailError: any) {
      console.error("Email send failed after prize claim:", emailError);
    }
  }

  return { success: true, code: claimed.code, wonAt: claimed.wonAt, emailSent };
});

// ── SEND OTP VERIFICATION EMAIL ───────────────────────────────────────────
export const sendOtpEmail = onCall({
  secrets: [sendgridApiKeySecret, sendgridFromEmailSecret]
}, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required");

  const uid = request.auth.uid;
  const email = request.auth.token.email;
  if (!email) throw new HttpsError("failed-precondition", "No email on account.");

  const db = getFirestore();
  const otpRef = db.collection("otpCodes").doc(uid);

  // Rate limit: 60s between resends
  const existing = await otpRef.get();
  if (existing.exists) {
    const createdAt = (existing.data() as { createdAt: Timestamp }).createdAt;
    const elapsed = Timestamp.now().seconds - createdAt.seconds;
    if (elapsed < 60) {
      throw new HttpsError("resource-exhausted", String(Math.ceil(60 - elapsed)));
    }
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const now = Timestamp.now();
  const expiresAt = new Timestamp(now.seconds + 10 * 60, 0);

  await otpRef.set({ code, email, expiresAt, attempts: 0, createdAt: now });

  const htmlContent = `
    ${getEmailHeader("Verificación de correo", "Verificación de cuenta")}
    <div style="font-size:15px;line-height:1.6;color:#1e293b;">
      <h2 class="greeting">Verifica tu correo electrónico</h2>
      <p style="margin:0 0 20px 0;">Usa el siguiente código para activar tu cuenta en <strong>Turizoneando</strong>. Expira en <strong>10 minutos</strong>.</p>
      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;background:#f0fafa;border:2px dashed #00bbb4;border-radius:16px;padding:20px 36px;">
          <div style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">Tu código de verificación</div>
          <div style="font-family:monospace;font-size:40px;font-weight:900;letter-spacing:8px;color:#096d7d;">${code}</div>
        </div>
      </div>
      <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;border-top:1px solid #c8e8e6;padding-top:16px;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
    </div>
    ${getEmailFooter()}
  `;

  await sendRawEmail(
    email,
    `${code} es tu código de verificación - Turizoneando`,
    htmlContent,
    `Tu código de verificación para Turizoneando es: ${code}\n\nEste código expira en 10 minutos.`
  );

  return { success: true };
});

// ── VERIFY OTP CODE ───────────────────────────────────────────────────────
export const verifyOtp = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required");

  const uid = request.auth.uid;
  const { code } = request.data as { code?: string };
  if (!code?.trim()) throw new HttpsError("invalid-argument", "Código requerido.");

  const db = getFirestore();
  const otpRef = db.collection("otpCodes").doc(uid);
  const snap = await otpRef.get();

  if (!snap.exists) throw new HttpsError("not-found", "No hay código pendiente. Solicita uno nuevo.");

  const data = snap.data() as Record<string, unknown>;
  const expiresAt = data.expiresAt as Timestamp;

  if (Timestamp.now().seconds > expiresAt.seconds) {
    await otpRef.delete();
    throw new HttpsError("deadline-exceeded", "El código expiró. Solicita uno nuevo.");
  }

  const attempts = (data.attempts as number) || 0;
  if (attempts >= 5) {
    await otpRef.delete();
    throw new HttpsError("resource-exhausted", "Demasiados intentos. Solicita un nuevo código.");
  }

  if (data.code !== code.trim()) {
    await otpRef.update({ attempts: FieldValue.increment(1) });
    const remaining = 4 - attempts;
    throw new HttpsError("invalid-argument", `Código incorrecto. ${remaining > 0 ? `Te quedan ${remaining} intentos.` : "Solicita un nuevo código."}`);
  }

  await Promise.all([
    otpRef.delete(),
    db.collection("players").doc(uid).update({ emailVerified: true }),
  ]);

  return { success: true };
});

// ── RESEND PRIZE CODE EMAIL CALLABLE ─────────────────────────────────────
export const sendAdminPrizeCodeEmail = onCall({
  secrets: [sendgridApiKeySecret, sendgridFromEmailSecret]
}, async (request) => {
  // 1. Authenticate & Admin Check
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }
  if ((request.auth.token.role as string | undefined)?.toLowerCase() !== "admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  const { code } = request.data as { code?: string };
  if (!code || !code.trim()) {
    throw new HttpsError("invalid-argument", "Prize code is required.");
  }

  const db = getFirestore();

  try {
    // 2. Fetch Code Details
    const codeRef = db.collection("prizeCodes").doc(code.trim().toUpperCase());
    const codeSnap = await codeRef.get();

    if (!codeSnap.exists) {
      throw new HttpsError("not-found", "The specified prize code does not exist.");
    }

    const cData = codeSnap.data() ?? {};
    const playerEmail = cData.playerEmail;
    const playerDisplayName = cData.playerDisplayName || "Ganador";
    const prizeName = cData.prizeName || "Premio del Desafío Cultural";
    const prizeCategory = cData.prizeCategory || "Establecimiento";
    const prizeImageUrl = cData.prizeImageUrl || "";
    const uniqueCode = cData.code || code.trim().toUpperCase();

    if (!playerEmail) {
      throw new HttpsError("failed-precondition", "No player email is associated with this code.");
    }

    // 3. Construct Validation URL (pointing to MITUR site validation endpoint)
    const hostOrigin = request.rawRequest.headers.origin || "https://turizoneando.mitur.gob.do";
    const validationUrl = `${hostOrigin}/validar/${uniqueCode}`;

    // 4. Construct beautiful HTML layout
    let prizeImageHtml = "";
    if (prizeImageUrl) {
      prizeImageHtml = `
        <div style="text-align: center; margin: 20px 0;">
          <img src="${prizeImageUrl}" alt="${prizeName}" style="max-width: 180px; height: 180px; object-fit: cover; border-radius: 12px; border: 1.5px solid #e2e8f0; box-shadow: 0 4px 10px rgba(0,0,0,0.05);" />
        </div>
      `;
    }

    const htmlContent = `
      ${getEmailHeader("Turizoneando", "¡Felicidades por tu Premio!", LOGO_URL)}
      <div style="font-size: 15px; line-height: 1.6; color: #1e293b;">
        <h2 class="greeting">¡Hola, ${playerDisplayName}!</h2>
        <p style="margin: 0 0 16px 0;">¡Felicidades! Completaste un gran recorrido en el Desafío Cultural de la Ciudad Colonial y te has ganado un premio especial:</p>

        <div class="prize-card">
          <span class="category-badge">${prizeCategory}</span>
          <h3 class="prize-name">${prizeName}</h3>
          ${prizeImageHtml}
          <span class="code-label">Código de Canje Único</span>
          <div class="code-box">${uniqueCode}</div>
        </div>

        <h3 class="section-title">¿Cómo canjear tu premio?</h3>
        <ol class="steps-list">
          <li>Dirígete al establecimiento participante de <strong>${prizeCategory}</strong>.</li>
          <li>Muestra este correo o tu código en la aplicación al personal.</li>
          <li>El personal verificará tu código y te entregará tu recompensa.</li>
        </ol>

        <p class="note-text">Este código es válido para un único canje en el establecimiento. Conserva este correo de forma privada.</p>
      </div>
      ${getEmailFooter()}
    `;

    const textContent = `¡Felicidades ${playerDisplayName}!\n\nGanaste: ${prizeName} (${prizeCategory}) en Turizoneando.\n\nTu código único de canje es: ${uniqueCode}\n\nCanjéalo ingresando a: ${validationUrl}\n\nMITUR`;

    await sendRawEmail(playerEmail, `Tu premio de Turizoneando: ${prizeName} (Código: ${uniqueCode})`, htmlContent, textContent);
    return { success: true };
  } catch (error: any) {
    console.error("Resending prize code email failed:", error);
    throw new HttpsError("internal", error.message || "Failed to resend prize code email.");
  }
});

// ── LOW-STOCK ALERT: Firestore trigger ────────────────────────────────────────
// Fires whenever a document in /prizes/{prizeId} is updated.
// If stockCurrent crosses a threshold (10 or 5) for the first time, sends an
// alert email to the address stored in /settings/notifications.stockAlertEmail.
// Thresholds already notified are stored in /prizes/{id}.alertsSent to avoid duplicates.

const STOCK_ALERT_THRESHOLDS = [10, 5];

export const notifyLowStock = onDocumentUpdated(
  {
    document: "prizes/{prizeId}",
    secrets: [sendgridApiKeySecret, sendgridFromEmailSecret],
  },
  async (event) => {
    // Safely extract before/after snapshots
    const beforeSnap = event.data?.before.data();
    const afterSnap = event.data?.after.data();
    const prizeRef = event.data?.after.ref;
    if (!beforeSnap || !afterSnap || !prizeRef) return;

    const prevStock: number =
      typeof beforeSnap.stockCurrent === "number" ? beforeSnap.stockCurrent : Infinity;
    const currStock: number =
      typeof afterSnap.stockCurrent === "number" ? afterSnap.stockCurrent : 0;

    // Only act when stock decreased
    if (currStock >= prevStock) return;

    // Which thresholds did we just cross downward?
    const crossed = STOCK_ALERT_THRESHOLDS.filter((t) => prevStock > t && currStock <= t);
    if (crossed.length === 0) return;

    // Which of those haven't been notified yet?
    const alertsSent: number[] = Array.isArray(afterSnap.alertsSent) ? afterSnap.alertsSent : [];
    const newCrossed = crossed.filter((t) => !alertsSent.includes(t));
    if (newCrossed.length === 0) return;

    // Mark thresholds as sent FIRST (idempotence — avoids duplicates on retry)
    await prizeRef.update({
      alertsSent: [...alertsSent, ...newCrossed],
    });

    // Read the notification email from /settings/notifications
    const db = getFirestore();
    const settingsSnap = await db.collection("settings").doc("notifications").get();
    const alertEmail: string = (settingsSnap.data()?.stockAlertEmail || "").trim();
    if (!alertEmail || !alertEmail.includes("@")) {
      console.log("[notifyLowStock] No stockAlertEmail configured — skipping.");
      return;
    }

    const prizeName = String(afterSnap.name || "Premio");
    const categoria = String(afterSnap.categoria || "");
    const prizeImg = String(afterSnap.imageUrl || "");
    const localName = String(afterSnap.localName || "");
    const prizeId = prizeRef.id;

    // Send one email per newly-crossed threshold (usually just one at a time)
    for (const threshold of newCrossed) {
      const isCritical = threshold <= 5;
      const urgencyIcon = isCritical ? "🔴" : "🟡";
      const urgencyLabel = isCritical ? "Stock crítico" : "Stock bajo";
      const urgencyColor = isCritical ? "#dc2626" : "#d97706";
      const urgencyBg = isCritical ? "rgba(220,38,38,0.07)" : "rgba(217,119,6,0.07)";
      const urgencyBorder = isCritical ? "rgba(220,38,38,0.3)" : "rgba(217,119,6,0.3)";

      const subject = `${urgencyIcon} ${urgencyLabel}: ${prizeName} — quedan ${currStock} unidades`;

      const imgHtml = prizeImg
        ? `<div style="text-align:center;margin:16px 0;"><img src="${prizeImg}" alt="${prizeName}" style="max-width:140px;height:140px;object-fit:cover;border-radius:10px;border:1.5px solid #e2e8f0;" /></div>`
        : "";
      const catBadge = categoria
        ? `<span style="font-size:11px;font-weight:800;color:#00bbb4;text-transform:uppercase;letter-spacing:1px;background:rgba(0,187,180,0.12);padding:4px 12px;border-radius:20px;display:inline-block;margin-bottom:10px;">${categoria}</span>`
        : "";
      const localLine = localName
        ? `<p style="margin:6px 0 0;font-size:13px;color:#64748b;">📍 Establecimiento: <strong>${localName}</strong></p>`
        : "";

      const htmlContent = `
        ${getEmailHeader("Alerta de Stock", "Sistema de Notificaciones")}
        <div style="font-size:15px;line-height:1.6;color:#1e293b;">

          <div style="background:${urgencyBg};border:1.5px solid ${urgencyBorder};border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:flex-start;gap:12px;">
            <span style="font-size:26px;line-height:1;">${urgencyIcon}</span>
            <div>
              <p style="margin:0 0 4px;font-weight:800;font-size:15px;color:${urgencyColor};">${urgencyLabel}</p>
              <p style="margin:0;font-size:13px;color:#475569;">
                Quedan <strong>${currStock} unidades</strong> de este premio (umbral de alerta: ${threshold}).
              </p>
            </div>
          </div>

          <div style="background:#f0fafa;border:1px solid #c8e8e6;border-radius:14px;padding:22px;margin:0 0 20px;text-align:center;">
            ${catBadge}
            <h3 style="font-size:18px;font-weight:700;color:#096d7d;margin:0 0 4px;">${prizeName}</h3>
            ${localLine}
            ${imgHtml}
            <div style="margin-top:14px;display:inline-block;background:${urgencyBg};border:2px solid ${urgencyBorder};border-radius:10px;padding:10px 28px;">
              <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Stock disponible</div>
              <div style="font-size:36px;font-weight:900;color:${urgencyColor};">${currStock}</div>
            </div>
          </div>

          <p style="margin:0 0 12px;font-size:14px;color:#475569;">
            Por favor, accede al panel de administración y repón el stock de este premio a la brevedad para asegurar que los jugadores puedan seguir ganándolo.
          </p>
          <p style="margin:0;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:14px;">
            Este correo fue generado automáticamente por el sistema de notificaciones de Turizoneando.<br>
            ID del premio: <code style="font-family:monospace;">${prizeId}</code>
          </p>
        </div>
        ${getEmailFooter()}
      `;

      const textContent =
        `[${isCritical ? "CRÍTICO" : "ADVERTENCIA"}] Stock bajo — ${prizeName}\n\n` +
        `Quedan ${currStock} unidades (umbral de alerta: ${threshold}).\n` +
        (localName ? `Establecimiento: ${localName}\n` : "") +
        `\nAccede al panel de administración para reponer el stock.\nID premio: ${prizeId}\n\nMITUR - Turizoneando`;

      try {
        await sendRawEmail(alertEmail, subject, htmlContent, textContent);
        console.log(`[notifyLowStock] Alert sent for prize ${prizeId} at threshold ${threshold} → ${alertEmail}`);
      } catch (emailErr: any) {
        console.error(`[notifyLowStock] Failed to send alert for prize ${prizeId}:`, emailErr);
      }
    }
  }
);
