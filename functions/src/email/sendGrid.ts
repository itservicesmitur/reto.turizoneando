import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import sgMail from "@sendgrid/mail";

const sendgridApiKeySecret = defineSecret("SENDGRID_API_KEY");
const sendgridFromEmailSecret = defineSecret("SENDGRID_FROM_EMAIL");

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
function getEmailHeader(title: string, subtitle: string): string {
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
          background-color: #f4f6fa;
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
          background-color: #f4f6fa;
          padding-bottom: 40px;
          padding-top: 40px;
        }
        .main-card {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(27, 43, 110, 0.08);
          border: 1px solid #e2e8f0;
        }
        .header-banner {
          background: linear-gradient(135deg, #1b2b6e 0%, #121e4a 100%);
          padding: 35px 30px;
          text-align: center;
        }
        .logo-text {
          font-size: 26px;
          font-weight: 800;
          color: #fbbf24;
          letter-spacing: 1px;
          margin: 0;
          text-transform: uppercase;
        }
        .logo-subtitle {
          font-size: 12px;
          font-weight: 500;
          color: #93c5fd;
          margin: 4px 0 0 0;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .content-body {
          padding: 40px 30px;
          color: #1e293b;
        }
        .footer-banner {
          padding: 24px 30px;
          background-color: #f8fafc;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 11px;
          color: #64748b;
          line-height: 1.6;
        }
        .btn-cta {
          display: inline-block;
          padding: 14px 28px;
          background-color: #fbbf24;
          color: #1b2b6e !important;
          font-size: 15px;
          font-weight: 800;
          text-decoration: none !important;
          border-radius: 10px;
          margin: 24px 0;
          text-align: center;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.25);
          text-transform: uppercase;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <table class="main-card">
          <tr>
            <td>
              <div class="header-banner">
                <div class="logo-text">${title}</div>
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
                <strong>Ministerio de Turismo (MITUR)</strong><br>
                Dirección de Fomento Turístico de la Zona Colonial, Santo Domingo, RD<br>
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
    ${getEmailHeader("Turizoneando", "Mensaje del Administrador")}
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
      ${getEmailHeader("Turizoneando", "Restablecimiento de Contraseña")}
      <div style="font-size: 15px; line-height: 1.6; color: #1e293b;">
        <h2 style="font-size: 20px; font-weight: 700; color: #1b2b6e; margin: 0 0 16px 0;">¡Hola, ${displayName}!</h2>
        <p style="margin: 0 0 16px 0;">Un administrador del sistema ha iniciado una solicitud para restablecer la contraseña de tu cuenta en <strong>Turizoneando</strong>.</p>
        <p style="margin: 0 0 24px 0;">Para elegir una nueva contraseña y recuperar el acceso a tu cuenta, haz clic en el siguiente enlace:</p>
        
        <div style="text-align: center;">
          <a href="${customResetLink}" class="btn-cta" target="_blank" style="color: #1b2b6e !important;">Restablecer Contraseña</a>
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

    const cData = codeSnap.data()!;
    const playerEmail = cData.playerEmail;
    const playerDisplayName = cData.playerDisplayName || "Ganador";
    const prizeName = cData.prizeName || "Premio del Rally";
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
      ${getEmailHeader("Turizoneando", "¡Felicidades por tu Premio!")}
      <div style="font-size: 15px; line-height: 1.6; color: #1e293b;">
        <h2 style="font-size: 20px; font-weight: 700; color: #1b2b6e; margin: 0 0 16px 0;">¡Hola, ${playerDisplayName}!</h2>
        <p style="margin: 0 0 16px 0;">¡Felicidades! Completaste un gran recorrido en el Rally Cultural de la Zona Colonial y te has ganado un premio especial:</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
          <span style="font-size: 11px; font-weight: 800; color: #2bbfa4; text-transform: uppercase; letter-spacing: 1px; display: inline-block; background-color: rgba(43,191,184,0.1); padding: 4px 10px; border-radius: 20px; margin-bottom: 8px;">
            ${prizeCategory}
          </span>
          <h3 style="font-size: 18px; font-weight: 700; color: #1b2b6e; margin: 0 0 8px 0;">${prizeName}</h3>
          ${prizeImageHtml}
          
          <div style="margin-top: 15px;">
            <span style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Código de Canje Único</span>
            <div style="display: inline-block; font-family: monospace; font-size: 22px; font-weight: 800; color: #d97706; background-color: #fef3c7; border: 2px dashed #f59e0b; padding: 8px 24px; border-radius: 8px; margin-top: 6px; letter-spacing: 2px;">
              ${uniqueCode}
            </div>
          </div>
        </div>

        <h3 style="font-size: 16px; font-weight: 700; color: #1b2b6e; margin: 24px 0 12px 0;">¿Cómo canjear tu premio?</h3>
        <ol style="margin: 0 0 24px 0; padding-left: 20px; color: #475569;">
          <li style="margin-bottom: 8px;">Dirígete al establecimiento participante de <strong>${prizeCategory}</strong>.</li>
          <li style="margin-bottom: 8px;">Muestra este correo o tu código en la aplicación al personal.</li>
          <li style="margin-bottom: 8px;">Ellos escanearán o ingresarán tu código para validarlo y entregarte tu recompensa.</li>
        </ol>

        <div style="text-align: center;">
          <a href="${validationUrl}" class="btn-cta" target="_blank" style="color: #1b2b6e !important;">Ver y Validar en Línea</a>
        </div>

        <p style="margin: 24px 0 0 0; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          Este código es válido para un único canje en el establecimiento. Conserva este correo de forma privada.
        </p>
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
