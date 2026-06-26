import { useState, useEffect, type FormEvent } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth'
import { auth } from '../config/firebase'
import logoImg from '../assets/logo1.png'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const oobCode = searchParams.get('oobCode')

  const [validating, setValidating]       = useState(true)
  const [codeError, setCodeError]         = useState<string | null>(null)
  const [email, setEmail]                 = useState('')

  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew]                 = useState(false)
  const [showConfirm, setShowConfirm]         = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState(false)

  useEffect(() => {
    async function checkCode() {
      if (!oobCode) {
        setCodeError('El enlace de restablecimiento es inválido o no contiene un código de seguridad.')
        setValidating(false)
        return
      }
      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode)
        setEmail(userEmail)
      } catch (err: any) {
        if (err.code === 'auth/invalid-action-code') {
          setCodeError('El código del enlace es inválido. Es posible que ya haya sido usado.')
        } else if (err.code === 'auth/expired-action-code') {
          setCodeError('El enlace ha expirado. Por favor, solicita uno nuevo desde la pantalla de inicio de sesión.')
        } else if (err.code === 'auth/user-disabled') {
          setCodeError('Esta cuenta ha sido desactivada.')
        } else {
          setCodeError('El enlace es inválido o ha expirado.')
        }
      } finally {
        setValidating(false)
      }
    }
    checkCode()
  }, [oobCode])

  const rules = {
    length:    newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number:    /[0-9]/.test(newPassword),
    special:   /[@$!%*?&#.\-_]/.test(newPassword),
    match:     newPassword === confirmPassword && newPassword.length > 0,
  }
  const isValid = Object.values(rules).every(Boolean)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!oobCode || !isValid) return
    setSubmitting(true)
    setError(null)
    try {
      await confirmPasswordReset(auth, oobCode, newPassword)
      setSuccess(true)
      setTimeout(() => navigate('/login', { replace: true }), 3500)
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error. Inténtalo nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Shared input focus handlers ──────────────────────────────────────────
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'var(--color-primary-dark)'
    e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(9,109,125,0.12)'
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'var(--color-border)'
    e.currentTarget.style.boxShadow   = 'none'
  }

  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-primary-dark)',
      fontFamily: 'var(--font-body)',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* ── Decorative blobs ──────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: -80, right: -80,
        width: 240, height: 240, borderRadius: '50%',
        background: 'rgba(0,187,180,0.15)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 100, left: -50,
        width: 160, height: 160, borderRadius: '50%',
        background: 'rgba(255,148,71,0.10)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '52dvh', left: '50%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'rgba(4,45,55,0.55)', transform: 'translate(-50%, 50%)',
        pointerEvents: 'none',
      }} />

      {/* ── Floating stars ────────────────────────────────────── */}
      {[
        { top: '8%',  left: '8%',  size: 14, color: 'rgba(255,148,71,0.7)',   delay: '0s' },
        { top: '18%', right: '22%', size: 10, color: 'rgba(0,187,180,0.6)',    delay: '0.4s' },
        { top: '28%', left: '55%', size: 8,  color: 'rgba(255,255,255,0.35)', delay: '0.8s' },
        { top: '6%',  left: '40%', size: 12, color: 'rgba(224,52,75,0.45)',   delay: '0.2s' },
      ].map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: s.top,
          left: (s as { left?: string }).left,
          right: (s as { right?: string }).right,
          width: s.size, height: s.size, borderRadius: '50%',
          background: s.color,
          animation: `twinkle 2.5s ${s.delay} infinite alternate ease-in-out`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* ── Card wrapper ──────────────────────────────────────── */}
      <div className="rp-card">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <div className="rp-hero" style={{
          flex: '0 0 auto',
          minHeight: '22dvh',
          display: 'flex',
          alignItems: 'flex-end',
          paddingTop: 'calc(var(--safe-top) + 16px)',
          paddingLeft: 24,
          paddingRight: 24,
          paddingBottom: 16,
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 8 }}>

            {/* Logo badge */}
            <div className="rp-logo-badge" style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#fff', padding: 5,
              boxShadow: '0 0 0 3px rgba(255,148,71,0.55), 0 0 0 6px rgba(255,148,71,0.18), 0 12px 32px rgba(0,0,0,0.3)',
            }}>
              <img src={logoImg} alt="Turizoneando" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
            </div>

            <div>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                color: '#fff', fontSize: 28, margin: 0,
                lineHeight: 1.1, letterSpacing: 0.5,
                textShadow: '0 2px 20px rgba(255,148,71,0.4)',
              }}>
                Turizoneando
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '4px 0 0', letterSpacing: 0.3 }}>
                Restablecer contraseña
              </p>
            </div>
          </div>
        </div>

        {/* ── Form card ─────────────────────────────────────────── */}
        <div
          className="animate-slide-up"
          style={{
            flex: 1, minHeight: 0,
            background: 'var(--color-surface)',
            borderRadius: '28px 28px 0 0',
            boxShadow: '0 -8px 40px rgba(27,43,110,0.25)',
            position: 'relative', zIndex: 5,
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Teal accent strip */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: 'var(--gradient-primary)', flexShrink: 0,
          }} />

          <div style={{
            flex: 1, minHeight: 0,
            padding: '18px 20px',
            paddingBottom: 'calc(var(--safe-bottom) + 20px)',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto',
          }}>

            {/* Drag handle */}
            <div style={{
              width: 36, height: 4, borderRadius: 2,
              background: 'var(--color-border)', margin: '0 auto 18px',
            }} />

            {/* ── LOADING STATE ─────────────────────────────────── */}
            {validating && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, paddingTop: 20 }}>
                <i className="ri-loader-4-line" style={{
                  fontSize: 36, color: 'var(--color-primary-dark)',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0, fontWeight: 500 }}>
                  Verificando tu enlace de seguridad...
                </p>
              </div>
            )}

            {/* ── ERROR STATE ───────────────────────────────────── */}
            {!validating && codeError && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--color-primary-dark)', fontSize: 24,
                    margin: '0 0 4px',
                  }}>
                    Enlace inválido
                  </h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0 }}>
                    No pudimos verificar tu enlace de restablecimiento.
                  </p>
                </div>

                <div style={{
                  padding: '16px', borderRadius: 14,
                  background: 'rgba(230,51,41,0.07)',
                  border: '1.5px solid rgba(230,51,41,0.2)',
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  marginBottom: 24,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(230,51,41,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="ri-error-warning-line" style={{ fontSize: 20, color: 'var(--color-error)' }} />
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--color-error)', lineHeight: 1.5 }}>
                    {codeError}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  style={{
                    width: '100%', height: 50, borderRadius: 16,
                    background: 'var(--gradient-primary)',
                    color: '#fff', fontSize: 16, fontWeight: 800,
                    fontFamily: 'var(--font-body)', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 6px 20px rgba(224,52,75,0.4)',
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
                  onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <i className="ri-arrow-left-line" style={{ fontSize: 18 }} />
                  Volver al inicio de sesión
                </button>
              </div>
            )}

            {/* ── SUCCESS STATE ─────────────────────────────────── */}
            {!validating && !codeError && success && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ marginBottom: 24, textAlign: 'center' }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'rgba(0,187,180,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <i className="ri-checkbox-circle-line" style={{ fontSize: 36, color: 'var(--color-primary-dark)' }} />
                  </div>
                  <h2 style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--color-primary-dark)', fontSize: 24,
                    margin: '0 0 8px',
                  }}>
                    ¡Contraseña restablecida!
                  </h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                    Tu contraseña fue cambiada exitosamente. Serás redirigido al inicio de sesión en unos segundos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/login', { replace: true })}
                  style={{
                    width: '100%', height: 50, borderRadius: 16,
                    background: 'var(--gradient-primary)',
                    color: '#fff', fontSize: 17, fontWeight: 800,
                    fontFamily: 'var(--font-body)', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 6px 20px rgba(224,52,75,0.4)',
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
                  onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <i className="ri-rocket-line" style={{ fontSize: 18 }} />
                  Iniciar sesión ahora
                </button>
              </div>
            )}

            {/* ── FORM STATE ────────────────────────────────────── */}
            {!validating && !codeError && !success && (
              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* Header */}
                <div style={{ marginBottom: 4 }}>
                  <h2 style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--color-primary-dark)', fontSize: 24,
                    margin: '0 0 4px',
                  }}>
                    Nueva contraseña
                  </h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0 }}>
                    Para la cuenta{' '}
                    <strong style={{ color: 'var(--color-primary-dark)', wordBreak: 'break-all' }}>{email}</strong>
                  </p>
                </div>

                {/* New password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label htmlFor="newPw" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    Nueva contraseña
                  </label>
                  <div style={{ position: 'relative' }}>
                    <i className="ri-lock-line" style={{
                      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--color-gray-mid)', fontSize: 16, pointerEvents: 'none',
                    }} />
                    <input
                      id="newPw"
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      style={{
                        width: '100%', height: 48, borderRadius: 14,
                        border: '2px solid var(--color-border)',
                        paddingLeft: 42, paddingRight: 48, fontSize: 16,
                        fontFamily: 'var(--font-body)', color: 'var(--color-text)',
                        background: 'var(--color-gray-light)', outline: 'none',
                        transition: 'border-color 150ms ease, box-shadow 150ms ease',
                      }}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                    <button
                      type="button" onClick={() => setShowNew(v => !v)}
                      aria-label={showNew ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      style={{
                        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--color-gray-mid)',
                        cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
                      }}
                    >
                      <i className={showNew ? 'ri-eye-off-line' : 'ri-eye-line'} style={{ fontSize: 18 }} />
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label htmlFor="confirmPw" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    Confirmar contraseña
                  </label>
                  <div style={{ position: 'relative' }}>
                    <i className="ri-lock-2-line" style={{
                      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--color-gray-mid)', fontSize: 16, pointerEvents: 'none',
                    }} />
                    <input
                      id="confirmPw"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      style={{
                        width: '100%', height: 48, borderRadius: 14,
                        border: '2px solid var(--color-border)',
                        paddingLeft: 42, paddingRight: 48, fontSize: 16,
                        fontFamily: 'var(--font-body)', color: 'var(--color-text)',
                        background: 'var(--color-gray-light)', outline: 'none',
                        transition: 'border-color 150ms ease, box-shadow 150ms ease',
                      }}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                    <button
                      type="button" onClick={() => setShowConfirm(v => !v)}
                      aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      style={{
                        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--color-gray-mid)',
                        cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
                      }}
                    >
                      <i className={showConfirm ? 'ri-eye-off-line' : 'ri-eye-line'} style={{ fontSize: 18 }} />
                    </button>
                  </div>
                </div>

                {/* Rules checklist */}
                <div style={{
                  borderRadius: 14, padding: '12px 14px',
                  background: 'var(--color-gray-light)',
                  border: '2px solid var(--color-border)',
                  display: 'flex', flexDirection: 'column', gap: 7,
                }}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    Requisitos de seguridad
                  </p>
                  {[
                    { label: 'Mínimo 8 caracteres',              ok: rules.length },
                    { label: 'Al menos una mayúscula (A-Z)',     ok: rules.uppercase },
                    { label: 'Al menos una minúscula (a-z)',     ok: rules.lowercase },
                    { label: 'Al menos un número (0-9)',         ok: rules.number },
                    { label: 'Al menos un carácter especial',    ok: rules.special },
                    { label: 'Las contraseñas coinciden',        ok: rules.match },
                  ].map((r, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
                      color: r.ok ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                      fontWeight: r.ok ? 700 : 400,
                      transition: 'color 150ms',
                    }}>
                      <i className={r.ok ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'}
                        style={{ fontSize: 15, flexShrink: 0, color: r.ok ? 'var(--color-primary-dark)' : 'var(--color-border)' }} />
                      {r.label}
                    </div>
                  ))}
                </div>

                {/* Error */}
                {error && (
                  <p role="alert" style={{
                    margin: 0, padding: '10px 14px', borderRadius: 12,
                    background: 'rgba(230,51,41,0.07)', border: '1.5px solid rgba(230,51,41,0.2)',
                    color: 'var(--color-error)', fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <i className="ri-error-warning-line" style={{ flexShrink: 0, fontSize: 16 }} />
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || !isValid}
                  style={{
                    marginTop: 2, width: '100%', height: 50, borderRadius: 16,
                    background: (submitting || !isValid) ? 'var(--color-gray-mid)' : 'var(--gradient-primary)',
                    color: '#fff', fontSize: 17, fontWeight: 800,
                    fontFamily: 'var(--font-body)', border: 'none',
                    cursor: (submitting || !isValid) ? 'not-allowed' : 'pointer',
                    transition: 'transform 150ms ease, box-shadow 150ms ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: (submitting || !isValid) ? 'none' : '0 6px 20px rgba(224,52,75,0.4)',
                    letterSpacing: 0.3,
                  }}
                  onMouseDown={e => { if (!submitting && isValid) e.currentTarget.style.transform = 'scale(0.97)' }}
                  onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                  onTouchStart={e => { if (!submitting && isValid) e.currentTarget.style.transform = 'scale(0.97)' }}
                  onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  {submitting
                    ? <><i className="ri-loader-4-line" style={{ animation: 'spin 0.8s linear infinite' }} /> Guardando...</>
                    : <><i className="ri-shield-check-line" style={{ fontSize: 18 }} /> Guardar nueva contraseña</>
                  }
                </button>
              </form>
            )}

          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin    { from { transform: rotate(0deg); }   to { transform: rotate(360deg); } }
        @keyframes twinkle { from { opacity: 0.3; transform: scale(0.8); } to { opacity: 1; transform: scale(1.2); } }

        .rp-card {
          display: flex;
          flex-direction: column;
          width: 100%;
          flex: 1;
        }

        /* Tablet */
        @media (min-width: 600px) {
          .rp-card {
            flex: 0 0 auto;
            max-width: 460px;
            width: 100%;
            margin: auto;
            border-radius: 28px;
            overflow: hidden;
            box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.09);
            position: relative;
            z-index: 1;
            background: var(--color-primary-dark);
          }
          .rp-hero {
            min-height: 180px !important;
            padding-top: 36px !important;
            background: linear-gradient(145deg, #054f5c 0%, var(--color-primary-dark) 100%) !important;
          }
        }

        /* Móvil: reducir hero */
        @media (max-width: 599px) {
          .rp-logo-badge { width: 56px !important; height: 56px !important; }
          .rp-hero {
            min-height: 0 !important;
            padding-top: calc(var(--safe-top) + 12px) !important;
            padding-bottom: 12px !important;
          }
        }
      `}</style>
    </div>
  )
}
