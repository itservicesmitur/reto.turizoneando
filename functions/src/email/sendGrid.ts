import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import sgMail from "@sendgrid/mail";

const sendgridApiKeySecret = defineSecret("SENDGRID_API_KEY");
const sendgridFromEmailSecret = defineSecret("SENDGRID_FROM_EMAIL");

// Logo must be a public URL — never use hostOrigin (could be localhost in dev)
const LOGO_URL = 'https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2FlogoNuevo.png?alt=media&token=911d069f-8f5f-4be5-9da3-0c17431dbab1';
const BG_HERO_URL = 'https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2FfondoGrid2.jpeg?alt=media&token=aa9c6e17-6d5d-4198-bae3-dafdb3bac4d2';

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



// ── PRIZE EMAIL TEMPLATE (nuevo diseño) ──────────────────────────────────
function buildClaimPrizeEmailHtml(
  displayName: string,
  prizeName: string,
  code: string,
  prizeImageUrl: string
): string {
  const cardBg = prizeImageUrl
    ? `background-image:url('${prizeImageUrl}');background-size:cover;background-position:center;background-color:#0f766e;`
    : `background-color:#0f766e;`;
  const year = new Date().getFullYear();

  const step = (n: number, text: string) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;"><tr>
      <td width="22" style="width:22px;vertical-align:top;padding-top:1px;">
        <div style="width:22px;height:22px;background-color:#58bea9;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:700;color:#ffffff;">${n}</div>
      </td>
      <td style="padding-left:12px;font-size:14px;color:#475569;line-height:1.55;vertical-align:middle;">${text}</td>
    </tr></table>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>¡Ganaste un Premio!</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body{margin:0;padding:0;background-color:#f1f5f9;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}
    table{border-spacing:0;border-collapse:collapse;}
    td{padding:0;mso-table-lspace:0;mso-table-rspace:0;}
    @media only screen and (max-width:600px){
      .mitur-info{display:block !important;width:100% !important;text-align:center !important;padding-bottom:12px !important;}
      .mitur-icons{display:block !important;width:100% !important;text-align:center !important;padding-left:0 !important;white-space:normal !important;}
      .mitur-icon-td{display:block !important;width:100% !important;text-align:center !important;padding-bottom:8px !important;}
      .mitur-text-td{display:block !important;width:100% !important;text-align:center !important;padding-left:0 !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">

<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
  <tr>
    <td style="padding:24px 12px;" align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.15);">

        <!-- HERO -->
        <tr>
          <td style="background-image:url('${BG_HERO_URL}');background-size:cover;background-position:center;background-color:#0f766e;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:rgba(0,0,0,0.28);padding:48px 24px 44px;text-align:center;">
                  <img src="${LOGO_URL}" alt="Turizoneando" width="180" style="display:block;margin:0 auto 6px;height:auto;" />
                  <p style="margin:0;color:#ffffff;font-size:15px;font-weight:300;letter-spacing:0.5px;">¡Lo lograste! Has ganado 🎉</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CONTENT -->
        <tr>
          <td style="padding:40px 32px;">

            <h2 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#58bea9;font-family:'Plus Jakarta Sans',sans-serif;">Hola, ${displayName}</h2>
            <p style="margin:0 0 28px;font-size:14px;color:#475569;line-height:1.7;">
              ¡Felicidades! Completaste una etapa del Desafío Cultural de la Ciudad Colonial y obtuviste un premio especial.
              La información de tu premio está en el recuadro.
            </p>

            <!-- Prize Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,0.22);margin-bottom:32px;">
              <tr>
                <td height="290" style="${cardBg}">
                  <table width="100%" cellpadding="0" cellspacing="0" style="height:290px;">
                    <tr>
                      <td height="290" style="background:linear-gradient(to bottom,rgba(0,0,0,0.15) 0%,rgba(0,0,0,0.38) 45%,rgba(0,0,0,0.72) 100%);padding:24px;text-align:center;vertical-align:bottom;">
                        <p style="margin:0 0 6px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.25em;color:#ffffff;">Premio ganado</p>
                        <h3 style="margin:0 0 18px;font-size:18px;font-weight:500;color:#ffffff;line-height:1.3;font-family:'Plus Jakarta Sans',sans-serif;">${prizeName}</h3>
                        <table cellpadding="0" cellspacing="0" align="center">
                          <tr>
                            <td style="border:2px solid rgba(255,255,255,0.5);background-color:rgba(16,185,129,0.25);border-radius:8px;padding:10px 36px;text-align:center;">
                              <span style="font-family:'Courier New',Courier,monospace;font-size:38px;font-weight:900;color:#ffffff;letter-spacing:3px;">${code}</span>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:8px 0 0;font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(255,255,255,0.65);">Código único de canje</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Steps -->
            <h3 style="margin:0 0 16px;font-size:16px;font-weight:600;color:#58bea9;font-family:'Plus Jakarta Sans',sans-serif;">¿Cómo canjear tu premio?</h3>
            ${step(1, 'Dirígete al establecimiento participante correspondiente a tu premio.')}
            ${step(2, 'Muestra este correo o tu código en la aplicación al personal.')}
            ${step(3, 'El establecimiento validará tu código y te entregará tu recompensa.')}
            ${step(4, 'Este código es válido para un único canje. Consérvalo de forma privada.')}

            <!-- MITUR footer -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-top:1px solid #f1f5f9;padding-top:28px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:20px;">
                    <tr>
                      <td style="padding:18px 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td class="mitur-info" style="vertical-align:middle;">
                              <table cellpadding="0" cellspacing="0">
                                <tr>
                                  <td class="mitur-icon-td" style="text-align:center;vertical-align:middle;">
                                    <span style="display:inline-block;width:44px;height:44px;background-color:rgba(88,190,169,0.1);border-radius:50%;text-align:center;line-height:44px;font-size:22px;">🏛️</span>
                                  </td>
                                  <td class="mitur-text-td" style="padding-left:12px;vertical-align:middle;">
                                    <p style="margin:0;font-size:11px;font-weight:700;color:#334155;">Ministerio de Turismo (MITUR)</p>
                                    <p style="margin:3px 0 0;font-size:10px;color:#64748b;line-height:1.5;">Dirección de Fomento Turístico de la Ciudad Colonial, Santo Domingo, RD</p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                            <td class="mitur-icons" style="text-align:right;vertical-align:middle;padding-left:12px;white-space:nowrap;">
                              <a href="#" style="display:inline-block;width:32px;height:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:50%;text-decoration:none;">
                                <img src="https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2Ffacebook.png?alt=media&token=858e51ff-4bda-4f00-a71f-1a0205e2a94e" width="20" height="20" alt="Facebook" style="display:block;margin:6px auto 0;" />
                              </a>
                              <a href="#" style="display:inline-block;width:32px;height:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:50%;text-decoration:none;margin-left:5px;">
                                <img src="https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2Fistagram.png?alt=media&token=fb568a1f-d124-4ed8-b6c8-33fdddc6790b" width="20" height="20" alt="Instagram" style="display:block;margin:6px auto 0;" />
                              </a>
                              <a href="#" style="display:inline-block;width:32px;height:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:50%;text-decoration:none;margin-left:5px;">
                                <img src="https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2Fweb.png?alt=media&token=11561e2e-9f20-48b8-90a0-eb7062c9927c" width="20" height="20" alt="Web" style="display:block;margin:6px auto 0;" />
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 10px;text-align:center;font-size:11px;font-weight:500;color:#475569;">✅ Este correo fue enviado de forma segura</p>
                  <p style="margin:0;text-align:center;font-size:10px;color:#94a3b8;line-height:1.6;">
                    <strong>Aviso de confidencialidad:</strong> Este mensaje y sus anexos son confidenciales y para el uso exclusivo de su destinatario. Si por error lo ha recibido, elimínelo de inmediato.
                  </p>
                  <p style="margin:14px 0 0;text-align:center;font-size:10px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:14px;">
                    © ${year} Turizoneando. Todos los derechos reservados.
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ── MULTIPLE PRIZES EMAIL TEMPLATE (nuevo diseño) ────────────────────────
function buildMultiplePrizesEmailHtml(
  displayName: string,
  codes: Array<{ prizeName: string; prizeCategory: string; code: string; prizeImageUrl: string }>
): string {
  const year = new Date().getFullYear();

  const step = (n: number, text: string) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;"><tr>
      <td width="22" style="width:22px;vertical-align:top;padding-top:1px;">
        <div style="width:22px;height:22px;background-color:#58bea9;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:700;color:#ffffff;">${n}</div>
      </td>
      <td style="padding-left:12px;font-size:14px;color:#475569;line-height:1.55;vertical-align:middle;">${text}</td>
    </tr></table>`;

  const prizeCards = codes.map(c => {
    const imgCell = c.prizeImageUrl
      ? `<img src="${c.prizeImageUrl}" width="96" height="96" alt="${c.prizeName}" style="display:block;border-radius:8px;width:96px;height:96px;object-fit:cover;" />`
      : `<div style="width:96px;height:96px;background-color:#ccfbf1;border-radius:8px;"></div>`;
    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(20,184,166,0.05);border:1px solid rgba(20,184,166,0.1);border-radius:12px;margin-bottom:12px;">
        <tr><td style="padding:8px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:96px;vertical-align:top;">${imgCell}</td>
              <td style="padding-left:12px;vertical-align:top;">
                <p style="margin:0 0 4px;font-size:10px;text-transform:uppercase;letter-spacing:0.18em;font-weight:600;color:#475569;">Premio Ganado</p>
                <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;color:#58bea9;line-height:1.3;">${c.prizeName}</h2>
                <p style="margin:0 0 2px;font-size:10px;text-transform:uppercase;letter-spacing:0.18em;font-weight:600;color:#475569;">Código de canje</p>
                <h3 style="margin:0;font-size:20px;font-weight:900;color:#58bea9;line-height:1;">${c.code}</h3>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>¡Ganaste Premios!</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body{margin:0;padding:0;background-color:#f1f5f9;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}
    table{border-spacing:0;border-collapse:collapse;}
    td{padding:0;mso-table-lspace:0;mso-table-rspace:0;}
    @media only screen and (max-width:600px){
      .mitur-info{display:block !important;width:100% !important;text-align:center !important;padding-bottom:12px !important;}
      .mitur-icons{display:block !important;width:100% !important;text-align:center !important;padding-left:0 !important;white-space:normal !important;}
      .mitur-icon-td{display:block !important;width:100% !important;text-align:center !important;padding-bottom:8px !important;}
      .mitur-text-td{display:block !important;width:100% !important;text-align:center !important;padding-left:0 !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
  <tr><td style="padding:24px 12px;" align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.15);">
      <tr>
        <td style="background-image:url('${BG_HERO_URL}');background-size:cover;background-position:center;background-color:#0f766e;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="background-color:rgba(0,0,0,0.28);padding:48px 24px 44px;text-align:center;">
              <img src="${LOGO_URL}" alt="Turizoneando" width="180" style="display:block;margin:0 auto 6px;height:auto;" />
              <p style="margin:0;color:#ffffff;font-size:15px;font-weight:300;letter-spacing:0.5px;">¡Lo lograste! Has ganado 🎉</p>
            </td>
          </tr></table>
        </td>
      </tr>
      <tr><td style="padding:40px 32px;">
        <h2 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#58bea9;">Hola, ${displayName}</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.7;">
          ¡Felicidades! Completaste el Desafío Cultural de la Ciudad Colonial y obtuviste ${codes.length === 1 ? "un premio especial" : `${codes.length} premios`}. Aquí están tus códigos de canje.
        </p>
        ${prizeCards}
        <h3 style="margin:24px 0 16px;font-size:16px;font-weight:600;color:#58bea9;">¿Cómo canjear tu premio?</h3>
        ${step(1, "Dirígete al establecimiento participante correspondiente a tu premio.")}
        ${step(2, "Muestra este correo o tu código en la aplicación al personal.")}
        ${step(3, "El establecimiento validará tu código y te entregará tu recompensa.")}
        ${step(4, "Cada código es válido para un único canje. Consérvalo de forma privada.")}
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="border-top:1px solid #f1f5f9;padding-top:28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:20px;">
              <tr><td style="padding:18px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td class="mitur-info" style="vertical-align:middle;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td class="mitur-icon-td" style="text-align:center;vertical-align:middle;">
                        <span style="display:inline-block;width:44px;height:44px;background-color:rgba(88,190,169,0.1);border-radius:50%;text-align:center;line-height:44px;font-size:22px;">🏛️</span>
                      </td>
                      <td class="mitur-text-td" style="padding-left:12px;vertical-align:middle;">
                        <p style="margin:0;font-size:11px;font-weight:700;color:#334155;">Ministerio de Turismo (MITUR)</p>
                        <p style="margin:3px 0 0;font-size:10px;color:#64748b;line-height:1.5;">Dirección de Fomento Turístico de la Ciudad Colonial, Santo Domingo, RD</p>
                      </td>
                    </tr></table>
                  </td>
                  <td class="mitur-icons" style="text-align:right;vertical-align:middle;padding-left:12px;white-space:nowrap;">
                    <a href="#" style="display:inline-block;width:32px;height:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:50%;text-decoration:none;">
                      <img src="https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2Ffacebook.png?alt=media&token=858e51ff-4bda-4f00-a71f-1a0205e2a94e" width="20" height="20" alt="Facebook" style="display:block;margin:6px auto 0;" />
                    </a>
                    <a href="#" style="display:inline-block;width:32px;height:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:50%;text-decoration:none;margin-left:5px;">
                      <img src="https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2Fistagram.png?alt=media&token=fb568a1f-d124-4ed8-b6c8-33fdddc6790b" width="20" height="20" alt="Instagram" style="display:block;margin:6px auto 0;" />
                    </a>
                    <a href="#" style="display:inline-block;width:32px;height:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:50%;text-decoration:none;margin-left:5px;">
                      <img src="https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2Fweb.png?alt=media&token=11561e2e-9f20-48b8-90a0-eb7062c9927c" width="20" height="20" alt="Web" style="display:block;margin:6px auto 0;" />
                    </a>
                  </td>
                </tr></table>
              </td></tr>
            </table>
            <p style="margin:0 0 10px;text-align:center;font-size:11px;font-weight:500;color:#475569;">✅ Este correo fue enviado de forma segura</p>
            <p style="margin:0;text-align:center;font-size:10px;color:#94a3b8;line-height:1.6;">
              <strong>Aviso de confidencialidad:</strong> Este mensaje y sus anexos son confidenciales y para el uso exclusivo de su destinatario. Si por error lo ha recibido, elimínelo de inmediato.
            </p>
            <p style="margin:14px 0 0;text-align:center;font-size:10px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:14px;">
              © ${year} Turizoneando. Todos los derechos reservados.
            </p>
          </td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
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

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Mensaje del Administrador</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body{margin:0;padding:0;background-color:#ffffff;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}
    table{border-spacing:0;border-collapse:collapse;}
    td{padding:0;mso-table-lspace:0;mso-table-rspace:0;}
    @media only screen and (max-width:600px){
      .mitur-info{display:block !important;width:100% !important;text-align:center !important;padding-bottom:12px !important;}
      .mitur-icons{display:block !important;width:100% !important;text-align:center !important;padding-left:0 !important;white-space:normal !important;}
      .mitur-icon-td{display:block !important;width:100% !important;text-align:center !important;padding-bottom:8px !important;}
      .mitur-text-td{display:block !important;width:100% !important;text-align:center !important;padding-left:0 !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
  <tr><td style="padding:16px 12px;" align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- HERO -->
      <tr>
        <td style="background-image:url('${BG_HERO_URL}');background-size:cover;background-position:center;background-color:#0f766e;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="background-color:rgba(0,0,0,0.28);padding:48px 24px 44px;text-align:center;">
              <img src="${LOGO_URL}" alt="Turizoneando" width="180" style="display:block;margin:0 auto 6px;height:auto;" />
              <p style="margin:0;color:#ffffff;font-size:15px;font-weight:300;letter-spacing:0.5px;">Mensaje del Administrador</p>
            </td>
          </tr></table>
        </td>
      </tr>

      <!-- CONTENT -->
      <tr><td style="padding:40px 32px;">

        <h2 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#58bea9;font-family:'Plus Jakarta Sans',sans-serif;">¡Hola!</h2>
        ${formattedBodyHtml}

        <!-- MITUR footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;"><tr>
          <td style="border-top:1px solid #f1f5f9;padding-top:28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:16px;border:1px solid #e2e8f0;margin-bottom:20px;">
              <tr><td style="padding:18px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td class="mitur-info" style="vertical-align:middle;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td class="mitur-icon-td" style="text-align:center;vertical-align:middle;">
                        <span style="display:inline-block;width:44px;height:44px;background-color:rgba(88,190,169,0.1);border-radius:50%;text-align:center;line-height:44px;font-size:22px;">🏛️</span>
                      </td>
                      <td class="mitur-text-td" style="padding-left:12px;vertical-align:middle;">
                        <p style="margin:0;font-size:11px;font-weight:700;color:#334155;">Ministerio de Turismo (MITUR)</p>
                        <p style="margin:3px 0 0;font-size:10px;color:#64748b;line-height:1.5;">Dirección de Fomento Turístico de la Ciudad Colonial, Santo Domingo, RD</p>
                      </td>
                    </tr></table>
                  </td>
                  <td class="mitur-icons" style="text-align:right;vertical-align:middle;padding-left:12px;white-space:nowrap;">
                    <a href="#" style="display:inline-block;width:32px;height:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:50%;text-decoration:none;">
                      <img src="https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2Ffacebook.png?alt=media&token=858e51ff-4bda-4f00-a71f-1a0205e2a94e" width="20" height="20" alt="Facebook" style="display:block;margin:6px auto 0;" />
                    </a>
                    <a href="#" style="display:inline-block;width:32px;height:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:50%;text-decoration:none;margin-left:5px;">
                      <img src="https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2Fistagram.png?alt=media&token=fb568a1f-d124-4ed8-b6c8-33fdddc6790b" width="20" height="20" alt="Instagram" style="display:block;margin:6px auto 0;" />
                    </a>
                    <a href="#" style="display:inline-block;width:32px;height:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:50%;text-decoration:none;margin-left:5px;">
                      <img src="https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2Fweb.png?alt=media&token=11561e2e-9f20-48b8-90a0-eb7062c9927c" width="20" height="20" alt="Web" style="display:block;margin:6px auto 0;" />
                    </a>
                  </td>
                </tr></table>
              </td></tr>
            </table>
            <p style="margin:0 0 10px;text-align:center;font-size:11px;font-weight:500;color:#475569;">✅ Este correo fue enviado de forma segura</p>
            <p style="margin:0;text-align:center;font-size:10px;color:#94a3b8;line-height:1.6;">
              <strong>Aviso de confidencialidad:</strong> Este mensaje y sus anexos son confidenciales y para el uso exclusivo de su destinatario. Si por error lo ha recibido, elimínelo de inmediato.
            </p>
            <p style="margin:14px 0 0;text-align:center;font-size:10px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:14px;">
              © ${new Date().getFullYear()} Turizoneando. Todos los derechos reservados.
            </p>
          </td>
        </tr></table>

      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

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

    // 4. Construct HTML email
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Restablece tu contraseña</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body{margin:0;padding:0;background-color:#ffffff;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}
    table{border-spacing:0;border-collapse:collapse;}
    td{padding:0;mso-table-lspace:0;mso-table-rspace:0;}
    @media only screen and (max-width:600px){
      .mitur-info{display:block !important;width:100% !important;text-align:center !important;padding-bottom:12px !important;}
      .mitur-icons{display:block !important;width:100% !important;text-align:center !important;padding-left:0 !important;white-space:normal !important;}
      .mitur-icon-td{display:block !important;width:100% !important;text-align:center !important;padding-bottom:8px !important;}
      .mitur-text-td{display:block !important;width:100% !important;text-align:center !important;padding-left:0 !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
  <tr><td style="padding:16px 12px;" align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- HERO -->
      <tr>
        <td style="background-image:url('${BG_HERO_URL}');background-size:cover;background-position:center;background-color:#0f766e;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="background-color:rgba(0,0,0,0.28);padding:48px 24px 44px;text-align:center;">
              <img src="${LOGO_URL}" alt="Turizoneando" width="180" style="display:block;margin:0 auto 6px;height:auto;" />
              <p style="margin:0;color:#ffffff;font-size:15px;font-weight:300;letter-spacing:0.5px;">Restablecimiento de Contraseña</p>
            </td>
          </tr></table>
        </td>
      </tr>

      <!-- CONTENT -->
      <tr><td style="padding:40px 32px;">

        <h2 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#58bea9;font-family:'Plus Jakarta Sans',sans-serif;">¡Hola, ${displayName}!</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.7;">
          Un administrador del sistema ha iniciado una solicitud para restablecer la contraseña de tu cuenta en <strong style="color:#334155;">Turizoneando</strong>.
          <br><br>
          Para elegir una nueva contraseña y recuperar el acceso a tu cuenta, haz clic en el botón de abajo:
        </p>

        <!-- Button -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr><td align="center" style="padding:8px 0 32px;">
            <a href="${customResetLink}" target="_blank" style="display:inline-block;background-color:#58bea9;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:12px;font-family:'Plus Jakarta Sans',sans-serif;">Restablecer contraseña</a>
          </td></tr>
        </table>

        <p style="margin:0 0 32px;font-size:11px;color:#94a3b8;line-height:1.7;">
          Este enlace de seguridad es de un solo uso. Si expiró, puedes volver a solicitar uno nuevo en la pantalla de inicio de sesión. Si no solicitaste este cambio, puedes ignorar este mensaje.
        </p>

        <!-- MITUR footer -->
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="border-top:1px solid #f1f5f9;padding-top:28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:16px;border:1px solid #e2e8f0;margin-bottom:20px;">
              <tr><td style="padding:18px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td class="mitur-info" style="vertical-align:middle;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td class="mitur-icon-td" style="text-align:center;vertical-align:middle;">
                        <span style="display:inline-block;width:44px;height:44px;background-color:rgba(88,190,169,0.1);border-radius:50%;text-align:center;line-height:44px;font-size:22px;">🏛️</span>
                      </td>
                      <td class="mitur-text-td" style="padding-left:12px;vertical-align:middle;">
                        <p style="margin:0;font-size:11px;font-weight:700;color:#334155;">Ministerio de Turismo (MITUR)</p>
                        <p style="margin:3px 0 0;font-size:10px;color:#64748b;line-height:1.5;">Dirección de Fomento Turístico de la Ciudad Colonial, Santo Domingo, RD</p>
                      </td>
                    </tr></table>
                  </td>
                  <td class="mitur-icons" style="text-align:right;vertical-align:middle;padding-left:12px;white-space:nowrap;">
                    <a href="#" style="display:inline-block;width:32px;height:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:50%;text-decoration:none;">
                      <img src="https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2Ffacebook.png?alt=media&token=858e51ff-4bda-4f00-a71f-1a0205e2a94e" width="20" height="20" alt="Facebook" style="display:block;margin:6px auto 0;" />
                    </a>
                    <a href="#" style="display:inline-block;width:32px;height:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:50%;text-decoration:none;margin-left:5px;">
                      <img src="https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2Fistagram.png?alt=media&token=fb568a1f-d124-4ed8-b6c8-33fdddc6790b" width="20" height="20" alt="Instagram" style="display:block;margin:6px auto 0;" />
                    </a>
                    <a href="#" style="display:inline-block;width:32px;height:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:50%;text-decoration:none;margin-left:5px;">
                      <img src="https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2Fweb.png?alt=media&token=11561e2e-9f20-48b8-90a0-eb7062c9927c" width="20" height="20" alt="Web" style="display:block;margin:6px auto 0;" />
                    </a>
                  </td>
                </tr></table>
              </td></tr>
            </table>
            <p style="margin:0 0 10px;text-align:center;font-size:11px;font-weight:500;color:#475569;">✅ Este correo fue enviado de forma segura</p>
            <p style="margin:0;text-align:center;font-size:10px;color:#94a3b8;line-height:1.6;">
              <strong>Aviso de confidencialidad:</strong> Este mensaje y sus anexos son confidenciales y para el uso exclusivo de su destinatario. Si por error lo ha recibido, elimínelo de inmediato.
            </p>
            <p style="margin:14px 0 0;text-align:center;font-size:10px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:14px;">
              © ${new Date().getFullYear()} Turizoneando. Todos los derechos reservados.
            </p>
          </td>
        </tr></table>

      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

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

    const htmlContent = buildMultiplePrizesEmailHtml(displayName, codes);

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
      const htmlContent = buildClaimPrizeEmailHtml(
        claimed.playerDisplayName,
        claimed.prizeName,
        claimed.code,
        claimed.prizeImageUrl
      );

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

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Verifica tu correo</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body{margin:0;padding:0;background-color:#ffffff;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}
    table{border-spacing:0;border-collapse:collapse;}
    td{padding:0;mso-table-lspace:0;mso-table-rspace:0;}
    @media only screen and (max-width:600px){
      .mitur-info{display:block !important;width:100% !important;text-align:center !important;padding-bottom:12px !important;}
      .mitur-icons{display:block !important;width:100% !important;text-align:center !important;padding-left:0 !important;white-space:normal !important;}
      .mitur-icon-td{display:block !important;width:100% !important;text-align:center !important;padding-bottom:8px !important;}
      .mitur-text-td{display:block !important;width:100% !important;text-align:center !important;padding-left:0 !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
  <tr><td style="padding:16px 12px;" align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- HERO -->
      <tr>
        <td style="background-image:url('${BG_HERO_URL}');background-size:cover;background-position:center;background-color:#0f766e;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="background-color:rgba(0,0,0,0.28);padding:48px 24px 44px;text-align:center;">
              <img src="${LOGO_URL}" alt="Turizoneando" width="180" style="display:block;margin:0 auto 6px;height:auto;" />
              <p style="margin:0;color:#ffffff;font-size:15px;font-weight:300;letter-spacing:0.5px;">Verificación de cuenta</p>
            </td>
          </tr></table>
        </td>
      </tr>

      <!-- CONTENT -->
      <tr><td style="padding:40px 32px;">

        <h2 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#58bea9;font-family:'Plus Jakarta Sans',sans-serif;">Verifica tu correo electrónico</h2>
        <p style="margin:0 0 32px;font-size:14px;color:#475569;line-height:1.7;">
          Usa el siguiente código para activar tu cuenta en <strong style="color:#334155;">Turizoneando</strong>. Este código es válido durante <strong style="color:#334155;">10 minutos</strong>.
        </p>

        <!-- Code card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:20px;margin-bottom:32px;box-shadow:0 1px 6px rgba(0,0,0,0.06);">
          <tr><td style="padding:32px 24px;text-align:center;">
            <p style="margin:0 0 16px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.15em;color:#64748b;">Tu código de verificación</p>
            <table cellpadding="0" cellspacing="0" align="center"><tr>
              <td style="border:2px solid #14b8a6;background-color:#f0fdfa;border-radius:16px;padding:14px 40px;text-align:center;">
                <span style="font-family:'Courier New',Courier,monospace;font-size:38px;font-weight:900;color:#0d9488;letter-spacing:10px;">${code}</span>
              </td>
            </tr></table>
            <p style="margin:24px 0 0;font-size:11px;color:#94a3b8;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
          </td></tr>
        </table>

        <!-- MITUR footer -->
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="border-top:1px solid #f1f5f9;padding-top:28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:16px;border:1px solid #e2e8f0;margin-bottom:20px;">
              <tr><td style="padding:18px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td class="mitur-info" style="vertical-align:middle;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td class="mitur-icon-td" style="text-align:center;vertical-align:middle;">
                        <span style="display:inline-block;width:44px;height:44px;background-color:rgba(88,190,169,0.1);border-radius:50%;text-align:center;line-height:44px;font-size:22px;">🏛️</span>
                      </td>
                      <td class="mitur-text-td" style="padding-left:12px;vertical-align:middle;">
                        <p style="margin:0;font-size:11px;font-weight:700;color:#334155;">Ministerio de Turismo (MITUR)</p>
                        <p style="margin:3px 0 0;font-size:10px;color:#64748b;line-height:1.5;">Dirección de Fomento Turístico de la Ciudad Colonial, Santo Domingo, RD</p>
                      </td>
                    </tr></table>
                  </td>
                  <td class="mitur-icons" style="text-align:right;vertical-align:middle;padding-left:12px;white-space:nowrap;">
                    <a href="#" style="display:inline-block;width:32px;height:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:50%;text-decoration:none;">
                      <img src="https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2Ffacebook.png?alt=media&token=858e51ff-4bda-4f00-a71f-1a0205e2a94e" width="20" height="20" alt="Facebook" style="display:block;margin:6px auto 0;" />
                    </a>
                    <a href="#" style="display:inline-block;width:32px;height:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:50%;text-decoration:none;margin-left:5px;">
                      <img src="https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2Fistagram.png?alt=media&token=fb568a1f-d124-4ed8-b6c8-33fdddc6790b" width="20" height="20" alt="Instagram" style="display:block;margin:6px auto 0;" />
                    </a>
                    <a href="#" style="display:inline-block;width:32px;height:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:50%;text-decoration:none;margin-left:5px;">
                      <img src="https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2Fweb.png?alt=media&token=11561e2e-9f20-48b8-90a0-eb7062c9927c" width="20" height="20" alt="Web" style="display:block;margin:6px auto 0;" />
                    </a>
                  </td>
                </tr></table>
              </td></tr>
            </table>
            <p style="margin:0 0 10px;text-align:center;font-size:11px;font-weight:500;color:#475569;">✅ Este correo fue enviado de forma segura</p>
            <p style="margin:0;text-align:center;font-size:10px;color:#94a3b8;line-height:1.6;">
              <strong>Aviso de confidencialidad:</strong> Este mensaje y sus anexos son confidenciales y para el uso exclusivo de su destinatario. Si por error lo ha recibido, elimínelo de inmediato.
            </p>
            <p style="margin:14px 0 0;text-align:center;font-size:10px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:14px;">
              © ${new Date().getFullYear()} Turizoneando. Todos los derechos reservados.
            </p>
          </td>
        </tr></table>

      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

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

    // 4. Construct HTML with new design
    const htmlContent = buildClaimPrizeEmailHtml(
      playerDisplayName,
      prizeName,
      uniqueCode,
      prizeImageUrl
    );

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
const localName = String(afterSnap.localName || "");
    const prizeId = prizeRef.id;

    // Send one email per newly-crossed threshold (usually just one at a time)
    for (const threshold of newCrossed) {
      const isCritical = threshold <= 5;
      const urgencyIcon = isCritical ? "🔴" : "🟡";
      const urgencyLabel = isCritical ? "Stock crítico" : "Stock bajo";
      const urgencyColor = isCritical ? "#dc2626" : "#d97706";
      const urgencyBg = isCritical ? "#fef2f2" : "#fffbeb";
      const urgencyBorder = isCritical ? "#fecaca" : "#fde68a";

      const subject = `${urgencyIcon} ${urgencyLabel}: ${prizeName} — quedan ${currStock} unidades`;

      const row = (label: string, value: string) => value ? `
        <tr><td style="padding-bottom:14px;vertical-align:top;">
          <p style="margin:0 0 3px;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;">${label}</p>
          <p style="margin:0;font-size:13px;color:#475569;">${value}</p>
        </td></tr>` : "";

      const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Alerta de Stock</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body{margin:0;padding:0;background-color:#ffffff;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}
    table{border-spacing:0;border-collapse:collapse;}
    td{padding:0;mso-table-lspace:0;mso-table-rspace:0;}
    @media only screen and (max-width:600px){
      .stock-left{display:block !important;width:100% !important;margin-bottom:16px !important;}
      .stock-right{display:block !important;width:100% !important;}
      .mitur-info{display:block !important;width:100% !important;text-align:center !important;padding-bottom:12px !important;}
      .mitur-icons{display:block !important;width:100% !important;text-align:center !important;padding-left:0 !important;white-space:normal !important;}
      .mitur-icon-td{display:block !important;width:100% !important;text-align:center !important;padding-bottom:8px !important;}
      .mitur-text-td{display:block !important;width:100% !important;text-align:center !important;padding-left:0 !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
  <tr><td style="padding:16px 12px;" align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- HERO -->
      <tr>
        <td style="background-image:url('${BG_HERO_URL}');background-size:cover;background-position:center;background-color:#0f766e;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="background-color:rgba(0,0,0,0.28);padding:48px 24px 44px;text-align:center;">
              <img src="${LOGO_URL}" alt="Turizoneando" width="180" style="display:block;margin:0 auto 6px;height:auto;" />
              <p style="margin:0;color:#ffffff;font-size:15px;font-weight:300;letter-spacing:0.5px;">Sistema de Notificaciones</p>
            </td>
          </tr></table>
        </td>
      </tr>

      <!-- CONTENT -->
      <tr><td style="padding:40px 32px;">

        <!-- Alert card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${urgencyBorder};border-radius:16px;margin-bottom:24px;">
          <tr><td style="padding:24px;">

            <h2 style="margin:0 0 6px;font-size:18px;font-weight:700;color:${urgencyColor};font-family:'Plus Jakarta Sans',sans-serif;">${urgencyLabel}</h2>
            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Quedan <strong style="color:#334155;">${currStock} unidades</strong> de este premio (umbral de alerta: ${threshold}).</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;"><tr><td style="border-top:1px solid #f1f5f9;height:1px;font-size:0;line-height:0;">&nbsp;</td></tr></table>

            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td class="stock-left" width="130" style="vertical-align:top;">
                <table cellpadding="0" cellspacing="0" style="background-color:${urgencyBg};border:1px solid ${urgencyBorder};border-radius:12px;width:100%;">
                  <tr><td style="padding:16px 12px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:11px;color:#64748b;">Unidades disponibles</p>
                    <p style="margin:0;font-size:64px;font-weight:800;color:${urgencyColor};line-height:1;">${currStock}</p>
                  </td></tr>
                </table>
              </td>
              <td class="stock-right" style="padding-left:20px;vertical-align:top;">
                <table cellpadding="0" cellspacing="0" width="100%">
                  ${row("Categoría", categoria)}
                  ${row("Premio", prizeName)}
                  ${row("Establecimiento", localName)}
                </table>
              </td>
            </tr></table>

          </td></tr>
        </table>

        <p style="margin:0 0 32px;font-size:13px;color:#475569;line-height:1.7;">
          Por favor, accede al panel de administración y repón el stock de este premio a la brevedad para asegurar que los jugadores puedan seguir ganándolo.
        </p>

        <!-- MITUR footer -->
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="border-top:1px solid #f1f5f9;padding-top:28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:16px;border:1px solid #e2e8f0;margin-bottom:20px;">
              <tr><td style="padding:18px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td class="mitur-info" style="vertical-align:middle;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td class="mitur-icon-td" style="text-align:center;vertical-align:middle;">
                        <span style="display:inline-block;width:44px;height:44px;background-color:rgba(88,190,169,0.1);border-radius:50%;text-align:center;line-height:44px;font-size:22px;">🏛️</span>
                      </td>
                      <td class="mitur-text-td" style="padding-left:12px;vertical-align:middle;">
                        <p style="margin:0;font-size:11px;font-weight:700;color:#334155;">Ministerio de Turismo (MITUR)</p>
                        <p style="margin:3px 0 0;font-size:10px;color:#64748b;line-height:1.5;">Dirección de Fomento Turístico de la Ciudad Colonial, Santo Domingo, RD</p>
                      </td>
                    </tr></table>
                  </td>
                  <td class="mitur-icons" style="text-align:right;vertical-align:middle;padding-left:12px;white-space:nowrap;">
                    <a href="#" style="display:inline-block;width:32px;height:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:50%;text-decoration:none;">
                      <img src="https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2Ffacebook.png?alt=media&token=858e51ff-4bda-4f00-a71f-1a0205e2a94e" width="20" height="20" alt="Facebook" style="display:block;margin:6px auto 0;" />
                    </a>
                    <a href="#" style="display:inline-block;width:32px;height:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:50%;text-decoration:none;margin-left:5px;">
                      <img src="https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2Fistagram.png?alt=media&token=fb568a1f-d124-4ed8-b6c8-33fdddc6790b" width="20" height="20" alt="Instagram" style="display:block;margin:6px auto 0;" />
                    </a>
                    <a href="#" style="display:inline-block;width:32px;height:32px;background:#ffffff;border:1px solid #e2e8f0;border-radius:50%;text-decoration:none;margin-left:5px;">
                      <img src="https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2Fweb.png?alt=media&token=11561e2e-9f20-48b8-90a0-eb7062c9927c" width="20" height="20" alt="Web" style="display:block;margin:6px auto 0;" />
                    </a>
                  </td>
                </tr></table>
              </td></tr>
            </table>
            <p style="margin:0 0 10px;text-align:center;font-size:11px;font-weight:500;color:#475569;">✅ Este correo fue enviado de forma segura</p>
            <p style="margin:0;text-align:center;font-size:10px;color:#94a3b8;line-height:1.6;">
              <strong>Aviso de confidencialidad:</strong> Este mensaje y sus anexos son confidenciales y para el uso exclusivo de su destinatario. Si por error lo ha recibido, elimínelo de inmediato.
            </p>
            <p style="margin:14px 0 0;text-align:center;font-size:10px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:14px;">
              © ${new Date().getFullYear()} Turizoneando. Todos los derechos reservados.
            </p>
          </td>
        </tr></table>

      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

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
