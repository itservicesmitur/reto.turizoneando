const LOGO_URL = '/assets/img/logoSoloLetras.png'

export function getEmailHeader(title: string, subtitle: string, logoUrl = LOGO_URL): string {
  const wrapperStyle = `width:100%;table-layout:fixed;background-color:#edf6f6;padding-bottom:40px;padding-top:40px;`
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
        table { border-spacing: 0; border-collapse: collapse; width: 100%; }
        td { padding: 0; }
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
        .logo-img {
          height: 54px; width: auto; display: block;
          margin: 0 auto 10px;
          filter: brightness(0) invert(1);
        }
        .logo-subtitle {
          font-size: 12px; font-weight: 700;
          color: rgba(255,255,255,0.85);
          margin: 0; letter-spacing: 1.5px; text-transform: uppercase;
        }
        .content-body { padding: 40px 30px; color: #1e293b; }
        .footer-banner {
          padding: 24px 30px;
          background-color: #edf6f6;
          border-top: 1px solid #c8e8e6;
          text-align: center; font-size: 11px;
          color: #64748b; line-height: 1.6;
        }
        .btn-cta {
          display: inline-block; padding: 14px 30px;
          background: linear-gradient(135deg, #e0344b 0%, #ff9447 100%);
          color: #ffffff !important; font-size: 15px; font-weight: 800;
          text-decoration: none !important; border-radius: 10px;
          margin: 24px 0; text-align: center;
          box-shadow: 0 4px 14px rgba(224,52,75,0.28);
          text-transform: uppercase;
        }
        .prize-card {
          background-color: #f0fafa; border: 1px solid #c8e8e6;
          border-radius: 14px; padding: 22px; margin: 20px 0; text-align: center;
        }
        .category-badge {
          font-size: 11px; font-weight: 800; color: #00bbb4;
          text-transform: uppercase; letter-spacing: 1px;
          display: inline-block; background-color: rgba(0,187,180,0.12);
          padding: 4px 12px; border-radius: 20px; margin-bottom: 10px;
        }
        .prize-name { font-size: 18px; font-weight: 700; color: #096d7d; margin: 0 0 10px 0; }
        .code-label {
          font-size: 11px; color: #64748b; text-transform: uppercase;
          letter-spacing: 0.5px; display: block; margin-top: 12px;
        }
        .code-box {
          display: inline-block; font-family: monospace;
          font-size: 22px; font-weight: 800; color: #ff9447;
          background-color: rgba(255,148,71,0.10);
          border: 2px dashed #ff9447; padding: 8px 24px;
          border-radius: 8px; margin-top: 6px; letter-spacing: 2px;
        }
        .section-title { font-size: 15px; font-weight: 700; color: #096d7d; margin: 24px 0 10px 0; }
        .steps-list { margin: 0 0 16px 0; padding-left: 20px; color: #475569; font-size: 14px; }
        .steps-list li { margin-bottom: 8px; }
        .note-text {
          margin: 0; font-size: 12px; color: #94a3b8; text-align: center;
          border-top: 1px solid #c8e8e6; padding-top: 16px;
        }
        h2.greeting { font-size: 20px; font-weight: 700; color: #096d7d; margin: 0 0 16px 0; }
      </style>
    </head>
    <body>
      <div class="wrapper" style="${wrapperStyle}">
        <table class="main-card">
          <tr>
            <td>
              <div class="header-banner">
                <img src="${logoUrl}" alt="Turizoneando" class="logo-img" />
                <div style="font-size: 32px; font-weight: 900; color: #ffffff; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">Turizoneando</div>
                <div class="logo-subtitle">${subtitle}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td class="content-body">
  `
}

export function getEmailFooter(): string {
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
  `
}

// ── OTP ───────────────────────────────────────────────────────────────────────
export function buildOtpEmail(code = '847291'): string {
  const LOGO    = '/assets/img/logoNuevo.png'
  const BG_HERO = '/assets/img/fondoGrid2.jpeg'
  const year    = new Date().getFullYear()

  return `<!DOCTYPE html>
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
  <tr>
    <td style="padding:16px 12px;" align="center">

      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- ── HERO ─────────────────────────────────────────────── -->
        <tr>
          <td style="background-image:url('${BG_HERO}');background-size:cover;background-position:center;background-color:#0f766e;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:rgba(0,0,0,0.28);padding:48px 24px 44px;text-align:center;">
                  <img src="${LOGO}" alt="Turizoneando" width="180" style="display:block;margin:0 auto 6px;height:auto;pointer-events:none;" />
                  <p style="margin:0;color:#ffffff;font-size:15px;font-weight:300;letter-spacing:0.5px;">Verificación de cuenta</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── CONTENT ─────────────────────────────────────────── -->
        <tr>
          <td style="padding:40px 32px;">

            <h2 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#58bea9;font-family:'Plus Jakarta Sans',sans-serif;">Verifica tu correo electrónico</h2>
            <p style="margin:0 0 32px;font-size:14px;color:#475569;line-height:1.7;">
              Usa el siguiente código para activar tu cuenta en <strong style="color:#334155;">Turizoneando</strong>. Este código es válido durante <strong style="color:#334155;">10 minutos</strong>.
            </p>

            <!-- Code card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:20px;margin-bottom:32px;box-shadow:0 1px 6px rgba(0,0,0,0.06);">
              <tr>
                <td style="padding:32px 24px;text-align:center;">
                  <p style="margin:0 0 16px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.15em;color:#64748b;">Tu código de verificación</p>
                  <table cellpadding="0" cellspacing="0" align="center">
                    <tr>
                      <td style="border:2px solid #14b8a6;background-color:#f0fdfa;border-radius:16px;padding:14px 40px;text-align:center;">
                        <span style="font-family:'Courier New',Courier,monospace;font-size:38px;font-weight:900;color:#0d9488;letter-spacing:10px;">${code}</span>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:24px 0 0;font-size:11px;color:#94a3b8;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
                </td>
              </tr>
            </table>

            <!-- ── MITUR FOOTER ────────────────────────────────── -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
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
</html>`
}

// ── RESET PASSWORD ────────────────────────────────────────────────────────────
export function buildResetPasswordEmail(displayName = 'María García', resetLink = '#'): string {
  const LOGO    = '/assets/img/logoNuevo.png'
  const BG_HERO = '/assets/img/fondoGrid2.jpeg'
  const year    = new Date().getFullYear()

  return `<!DOCTYPE html>
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
        <td style="background-image:url('${BG_HERO}');background-size:cover;background-position:center;background-color:#0f766e;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="background-color:rgba(0,0,0,0.28);padding:48px 24px 44px;text-align:center;">
              <img src="${LOGO}" alt="Turizoneando" width="180" style="display:block;margin:0 auto 6px;height:auto;pointer-events:none;" />
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
            <a href="${resetLink}" target="_blank" style="display:inline-block;background-color:#58bea9;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:12px;font-family:'Plus Jakarta Sans',sans-serif;">Restablecer contraseña</a>
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
              © ${year} Turizoneando. Todos los derechos reservados.
            </p>
          </td>
        </tr></table>

      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ── PREMIO ÚNICO (claim) ──────────────────────────────────────────────────────
export function buildClaimPrizeEmail(
  displayName = 'Antonio de la Cruz',
  prizeName = 'Cena para 2 en La Atarazana',
  _prizeCategory = 'Restaurantes',
  code = 'RT-48291',
  prizeImageUrl = ''
): string {
  const LOGO = '/assets/img/logoNuevo.png'
  const BG_HERO = '/assets/img/fondoGrid2.jpeg'
  const cardBg = prizeImageUrl
    ? `background-image:url('${prizeImageUrl}');background-size:cover;background-position:center;background-color:#0f766e;`
    : `background-color:#0f766e;`
  const year = new Date().getFullYear()

  const step = (n: number, text: string) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;"><tr>
      <td width="22" style="width:22px;vertical-align:top;padding-top:1px;">
        <div style="width:22px;height:22px;background-color:#58bea9;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:700;color:#ffffff;">${n}</div>
      </td>
      <td style="padding-left:12px;font-size:14px;color:#475569;line-height:1.55;vertical-align:middle;">${text}</td>
    </tr></table>`

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>¡Ganaste un Premio!</title>
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
  <tr>
    <td style="padding:16px 12px;" align="center">

      <!-- Main card -->
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- ── HERO ─────────────────────────────────────────────── -->
        <tr>
          <td style="background-image:url('${BG_HERO}');background-size:cover;background-position:center;background-color:#0f766e;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:rgba(0,0,0,0.28);padding:48px 24px 44px;text-align:center;">
                  <img src="${LOGO}" alt="Turizoneando" width="180" style="display:block;margin:0 auto 6px;height:auto;pointer-events:none;" />
                  <p style="margin:0;color:#ffffff;font-size:15px;font-weight:300;letter-spacing:0.5px;">¡Lo lograste! Has ganado 🎉</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── CONTENT ─────────────────────────────────────────── -->
        <tr>
          <td style="padding:40px 32px;">

            <!-- Greeting -->
            <h2 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#58bea9;font-family:'Plus Jakarta Sans',sans-serif;">Hola, ${displayName}</h2>
            <p style="margin:0 0 28px;font-size:14px;color:#475569;line-height:1.7;">
              ¡Felicidades! Completaste una etapa del Desafío Cultural de la Ciudad Colonial y obtuviste un premio especial.
              La información de tu premio está en el recuadro.
            </p>

            <!-- Prize Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:16px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,0.22);margin-bottom:32px;">
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

            <!-- How to redeem -->
            <h3 style="margin:0 0 16px;font-size:16px;font-weight:600;color:#58bea9;font-family:'Plus Jakarta Sans',sans-serif;">¿Cómo canjear tu premio?</h3>
            ${step(1, 'Dirígete al establecimiento participante correspondiente a tu premio.')}
            ${step(2, 'Muestra este correo o tu código en la aplicación al personal.')}
            ${step(3, 'El establecimiento validará tu código y te entregará tu recompensa.')}
            ${step(4, 'Este código es válido para un único canje. Consérvalo de forma privada.')}

            <!-- MITUR footer -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-top:1px solid #f1f5f9;padding-top:28px;">

                  <!-- MITUR card -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:16px;border:1px solid #e2e8f0;margin-bottom:20px;">
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

                  <!-- Security notice -->
                  <p style="margin:0 0 10px;text-align:center;font-size:11px;font-weight:500;color:#475569;">✅ Este correo fue enviado de forma segura</p>
                  <p style="margin:0;text-align:center;font-size:10px;color:#94a3b8;line-height:1.6;">
                    <strong>Aviso de confidencialidad:</strong> Este mensaje y sus anexos son confidenciales y para el uso exclusivo de su destinatario. Si por error lo ha recibido, elimínelo de inmediato.
                  </p>

                  <!-- Copyright -->
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
</html>`
}

// ── MÚLTIPLES PREMIOS ─────────────────────────────────────────────────────────
export function buildMultiplePrizesEmail(
  displayName = 'Ana Pérez',
  codes = [
    { prizeName: 'Cena para 2 en La Atarazana', prizeCategory: 'Restaurantes', code: 'RT-48291', prizeImageUrl: '' },
    { prizeName: 'Noche en Hotel Colonial', prizeCategory: 'Hoteles', code: 'HT-73821', prizeImageUrl: '' },
  ]
): string {
  const LOGO = '/assets/img/logoNuevo.png'
  const BG_HERO = '/assets/img/fondoGrid2.jpeg'
  const year = new Date().getFullYear()

  const step = (n: number, text: string) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;"><tr>
      <td width="22" style="width:22px;vertical-align:top;padding-top:1px;">
        <div style="width:22px;height:22px;background-color:#58bea9;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:700;color:#ffffff;">${n}</div>
      </td>
      <td style="padding-left:12px;font-size:14px;color:#475569;line-height:1.55;vertical-align:middle;">${text}</td>
    </tr></table>`

  const prizeCards = codes.map(c => {
    const imgCell = c.prizeImageUrl
      ? `<img src="${c.prizeImageUrl}" width="96" height="96" alt="${c.prizeName}" style="display:block;border-radius:8px;width:96px;height:96px;object-fit:cover;" />`
      : `<div style="width:96px;height:96px;background-color:#ccfbf1;border-radius:8px;"></div>`
    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(20,184,166,0.05);border:1px solid rgba(20,184,166,0.1);border-radius:16px;margin-bottom:12px;">
        <tr><td style="padding:8px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:96px;vertical-align:top;">${imgCell}</td>
              <td style="padding-left:12px;vertical-align:top;">
                <p style="margin:0 0 4px;font-size:10px;text-transform:uppercase;letter-spacing:0.18em;font-weight:600;color:#475569;">Premio Ganado</p>
                <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;color:#58bea9;line-height:1.3;font-family:'Plus Jakarta Sans',sans-serif;">${c.prizeName}</h2>
                <p style="margin:0 0 2px;font-size:10px;text-transform:uppercase;letter-spacing:0.18em;font-weight:600;color:#475569;">Código de canje</p>
                <h3 style="margin:0;font-size:20px;font-weight:900;color:#58bea9;line-height:1;font-family:'Plus Jakarta Sans',sans-serif;">${c.code}</h3>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>¡Ganaste Premios!</title>
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
        <td style="background-image:url('${BG_HERO}');background-size:cover;background-position:center;background-color:#0f766e;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="background-color:rgba(0,0,0,0.28);padding:48px 24px 44px;text-align:center;">
              <img src="${LOGO}" alt="Turizoneando" width="180" style="display:block;margin:0 auto 6px;height:auto;pointer-events:none;" />
              <p style="margin:0;color:#ffffff;font-size:15px;font-weight:300;letter-spacing:0.5px;">¡Lo lograste! Has ganado 🎉</p>
            </td>
          </tr></table>
        </td>
      </tr>

      <!-- CONTENT -->
      <tr><td style="padding:40px 32px;">

        <h2 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#58bea9;font-family:'Plus Jakarta Sans',sans-serif;">Hola, ${displayName}</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.7;">
          ¡Felicidades! Completaste el Desafío Cultural de la Ciudad Colonial y obtuviste ${codes.length === 1 ? 'un premio especial' : `${codes.length} premios`}. Aquí están tus códigos de canje.
        </p>

        ${prizeCards}

        <h3 style="margin:24px 0 16px;font-size:16px;font-weight:600;color:#58bea9;font-family:'Plus Jakarta Sans',sans-serif;">¿Cómo canjear tu premio?</h3>
        ${step(1, 'Dirígete al establecimiento participante correspondiente a tu premio.')}
        ${step(2, 'Muestra este correo o tu código en la aplicación al personal.')}
        ${step(3, 'El establecimiento validará tu código y te entregará tu recompensa.')}
        ${step(4, 'Cada código es válido para un único canje. Consérvalo de forma privada.')}

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
              © ${year} Turizoneando. Todos los derechos reservados.
            </p>
          </td>
        </tr></table>

      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ── CORREO PERSONALIZADO ADMIN ────────────────────────────────────────────────
export function buildCustomEmail(body = 'Te escribimos para informarte que el Desafío Colonial comenzará el próximo lunes.\n\n¡Nos vemos en la Ciudad Colonial!'): string {
  const LOGO    = '/assets/img/logoNuevo.png'
  const BG_HERO = '/assets/img/fondoGrid2.jpeg'
  const year    = new Date().getFullYear()

  const formattedBodyHtml = body
    .trim()
    .replace(/\n/g, '<br>')
    .split('<br><br>')
    .map(p => `<p style="margin:0 0 16px 0;font-size:14px;color:#475569;line-height:1.7;">${p}</p>`)
    .join('')

  return `<!DOCTYPE html>
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
        <td style="background-image:url('${BG_HERO}');background-size:cover;background-position:center;background-color:#0f766e;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="background-color:rgba(0,0,0,0.28);padding:48px 24px 44px;text-align:center;">
              <img src="${LOGO}" alt="Turizoneando" width="180" style="display:block;margin:0 auto 6px;height:auto;pointer-events:none;" />
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
              © ${year} Turizoneando. Todos los derechos reservados.
            </p>
          </td>
        </tr></table>

      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ── ALERTA STOCK BAJO ─────────────────────────────────────────────────────────
export function buildLowStockEmail(
  prizeName = 'Cena para 2 en La Atarazana',
  categoria = 'Restaurantes',
  localName = 'La Atarazana',
  currStock = 4,
  threshold = 5,
  _prizeId = 'abc123xyz'
): string {
  const LOGO    = '/assets/img/logoNuevo.png'
  const BG_HERO = '/assets/img/fondoGrid2.jpeg'
  const year    = new Date().getFullYear()

  const isCritical   = currStock <= 5
  const urgencyLabel = isCritical ? 'Stock crítico' : 'Stock bajo'
  const urgencyColor = isCritical ? '#dc2626' : '#d97706'
  const urgencyBg    = isCritical ? '#fef2f2' : '#fffbeb'
  const urgencyBorder= isCritical ? '#fecaca' : '#fde68a'

  const row = (label: string, value: string) => value ? `
    <tr>
      <td style="padding-bottom:14px;vertical-align:top;">
        <p style="margin:0 0 3px;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;">${label}</p>
        <p style="margin:0;font-size:13px;color:#475569;">${value}</p>
      </td>
    </tr>` : ''

  return `<!DOCTYPE html>
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
        <td style="background-image:url('${BG_HERO}');background-size:cover;background-position:center;background-color:#0f766e;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="background-color:rgba(0,0,0,0.28);padding:48px 24px 44px;text-align:center;">
              <img src="${LOGO}" alt="Turizoneando" width="180" style="display:block;margin:0 auto 6px;height:auto;pointer-events:none;" />
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

            <!-- Header -->
            <h2 style="margin:0 0 6px;font-size:18px;font-weight:700;color:${urgencyColor};font-family:'Plus Jakarta Sans',sans-serif;">${urgencyLabel}</h2>
            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Quedan <strong style="color:#334155;">${currStock} unidades</strong> de este premio (umbral de alerta: ${threshold}).</p>

            <!-- Divider -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;"><tr><td style="border-top:1px solid #f1f5f9;height:1px;font-size:0;line-height:0;">&nbsp;</td></tr></table>

            <!-- Two columns: stock number + info -->
            <table width="100%" cellpadding="0" cellspacing="0"><tr>

              <!-- Left: big stock number -->
              <td class="stock-left" width="130" style="vertical-align:top;">
                <table cellpadding="0" cellspacing="0" style="background-color:${urgencyBg};border:1px solid ${urgencyBorder};border-radius:12px;width:100%;">
                  <tr><td style="padding:16px 12px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:11px;color:#64748b;">Unidades disponibles</p>
                    <p style="margin:0;font-size:64px;font-weight:800;color:${urgencyColor};line-height:1;">${currStock}</p>
                  </td></tr>
                </table>
              </td>

              <!-- Right: info -->
              <td class="stock-right" style="padding-left:20px;vertical-align:top;">
                <table cellpadding="0" cellspacing="0" width="100%">
                  ${row('Categoría', categoria)}
                  ${row('Premio', prizeName)}
                  ${row('Establecimiento', localName)}
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
              © ${year} Turizoneando. Todos los derechos reservados.
            </p>
          </td>
        </tr></table>

      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ── REENVÍO ADMIN CÓDIGO PREMIO ───────────────────────────────────────────────
export function buildAdminPrizeCodeEmail(
  displayName = 'Pedro Martínez',
  prizeName = 'Tour privado Ciudad Colonial',
  _prizeCategory = 'Experiencias',
  uniqueCode = 'EX-59103',
  prizeImageUrl = '/assets/img/fondoGrid3.jpeg'
): string {
  return buildClaimPrizeEmail(displayName, prizeName, _prizeCategory, uniqueCode, prizeImageUrl)
}
