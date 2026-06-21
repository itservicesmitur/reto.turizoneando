import { useState, useEffect, type FormEvent } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth'
import { auth } from '../config/firebase'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const oobCode = searchParams.get('oobCode')

  // Validation states
  const [validating, setValidating] = useState(true)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [email, setEmail] = useState('')

  // Form states
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Status states
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Verify the code upon mount
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
        console.error('Action code verification failed:', err)
        if (err.code === 'auth/invalid-action-code') {
          setCodeError('El código de seguridad del enlace es inválido. Es posible que ya haya sido usado.')
        } else if (err.code === 'auth/expired-action-code') {
          setCodeError('El enlace de restablecimiento ha expirado. Por favor, solicita uno nuevo.')
        } else if (err.code === 'auth/user-disabled') {
          setCodeError('Esta cuenta de usuario ha sido desactivada.')
        } else {
          setCodeError('El enlace de restablecimiento es inválido o ha expirado.')
        }
      } finally {
        setValidating(false)
      }
    }

    checkCode()
  }, [oobCode])

  // Password rule tests
  const rules = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[@$!%*?&#.\-_]/.test(newPassword),
    match: newPassword === confirmPassword && newPassword.length > 0
  }

  const isPasswordValid = Object.values(rules).every(Boolean)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!oobCode || !isPasswordValid) return

    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      await confirmPasswordReset(auth, oobCode, newPassword)
      setSuccess(true)
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 3500)
    } catch (err: any) {
      console.error('Confirm password reset failed:', err)
      setError(err.message || 'Ocurrió un error al restablecer tu contraseña. Inténtalo nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      width: '100%',
      background: 'linear-gradient(135deg, #1b2b6e 0%, #0d1526 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      boxSizing: 'border-box',
      position: 'relative',
      fontFamily: 'var(--font-body), sans-serif'
    }}>
      {/* Decorative background glow elements */}
      <div style={{
        position: 'absolute', width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(43,191,184,0.15) 0%, rgba(0,0,0,0) 70%)',
        top: '10%', left: '10%', pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(245,200,0,0.08) 0%, rgba(0,0,0,0) 70%)',
        bottom: '10%', right: '10%', pointerEvents: 'none', zIndex: 0
      }} />

      {/* Main card box */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '36px 28px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        boxSizing: 'border-box',
        zIndex: 1,
        color: '#fff',
        textAlign: 'center',
        animation: 'fade-in 0.4s ease-out'
      }}>
        {/* Logo and Brand Title */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontFamily: 'var(--font-display), cursive',
            fontSize: '32px',
            color: 'var(--color-yellow, #f5c800)',
            margin: '0 0 6px 0',
            letterSpacing: '0.5px',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            Turizoneando
          </h1>
          <p style={{
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#a0aec0',
            margin: 0
          }}>
            Desafío Cultural de la Ciudad Colonial
          </p>
        </div>

        {/* LOADING STATE */}
        {validating && (
          <div style={{ padding: '40px 0' }}>
            <div style={{
              width: '44px',
              height: '44px',
              border: '3px solid rgba(255,255,255,0.1)',
              borderTopColor: 'var(--color-yellow, #f5c800)',
              borderRadius: '50%',
              margin: '0 auto 16px auto',
              animation: 'spin-circle 1s linear infinite'
            }} />
            <p style={{ color: '#cbd5e1', fontSize: '15px', fontWeight: 500 }}>
              Verificando tu código de seguridad...
            </p>
          </div>
        )}

        {/* ERROR STATE: Code invalid or expired */}
        {!validating && codeError && (
          <div>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(230,51,41,0.15)', color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px auto', fontSize: '28px', border: '1px solid rgba(230,51,41,0.2)'
            }}>
              <i className="ri-error-warning-fill" style={{ margin: 'auto' }} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 10px 0', color: '#fca5a5' }}>
              Enlace inválido o expirado
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              {codeError}
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%', height: '48px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.08)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)', fontSize: '14px',
                fontWeight: 700, cursor: 'pointer', transition: 'background 150ms'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            >
              Ir al Inicio de Sesión
            </button>
          </div>
        )}

        {/* SUCCESS STATE */}
        {!validating && !codeError && success && (
          <div style={{ animation: 'fade-in 0.3s ease-out' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(60,173,66,0.2)', color: '#4ade80',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px auto', fontSize: '32px', border: '1px solid rgba(60,173,66,0.3)',
              boxShadow: '0 0 20px rgba(74,222,128,0.2)'
            }}>
              <i className="ri-checkbox-circle-fill" style={{ margin: 'auto' }} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 12px 0', color: '#4ade80' }}>
              ¡Contraseña Restablecida!
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: 1.5, margin: '0 0 28px 0' }}>
              Tu contraseña ha sido cambiada exitosamente. Serás redirigido al inicio de sesión automáticamente en unos segundos.
            </p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              style={{
                width: '100%', height: '48px', borderRadius: '12px',
                background: 'var(--color-yellow, #f5c800)', color: '#1b2b6e',
                border: 'none', fontSize: '14px', fontWeight: 800,
                cursor: 'pointer', transition: 'transform 150ms'
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Iniciar Sesión Ahora
            </button>
          </div>
        )}

        {/* FORM STATE */}
        {!validating && !codeError && !success && (
          <form onSubmit={handleSubmit} style={{ textAlign: 'left', animation: 'fade-in 0.3s ease-out' }}>
            <h2 style={{
              fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0',
              textAlign: 'center', color: '#fff'
            }}>
              Restablecer Contraseña
            </h2>
            <p style={{
              fontSize: '13px', color: '#cbd5e1', margin: '0 0 24px 0',
              textAlign: 'center', lineHeight: 1.4
            }}>
              Ingresa una nueva contraseña para la cuenta: <br />
              <strong style={{ color: 'var(--color-yellow, #f5c800)', wordBreak: 'break-all' }}>{email}</strong>
            </p>

            {error && (
              <div style={{
                padding: '12px 14px', background: 'rgba(230,51,41,0.15)',
                border: '1px solid rgba(230,51,41,0.25)', color: '#fca5a5',
                borderRadius: '10px', fontSize: '13px', marginBottom: 18,
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <i className="ri-error-warning-line" style={{ fontSize: '16px', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Input 1: New Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#a0aec0' }}>
                Nueva Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres..."
                  style={{
                    width: '100%', height: '48px', borderRadius: '12px',
                    border: '1.5px solid rgba(255,255,255,0.15)',
                    background: 'rgba(0,0,0,0.15)', color: '#fff',
                    padding: '0 48px 0 14px', fontSize: '16px', outline: 'none',
                    boxSizing: 'border-box', fontFamily: 'sans-serif',
                    transition: 'border-color 150ms'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--color-yellow, #f5c800)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', padding: 0
                  }}
                >
                  <i className={showNewPassword ? 'ri-eye-off-line' : 'ri-eye-line'} style={{ fontSize: '18px' }} />
                </button>
              </div>
            </div>

            {/* Input 2: Confirm Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#a0aec0' }}>
                Confirmar Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña..."
                  style={{
                    width: '100%', height: '48px', borderRadius: '12px',
                    border: '1.5px solid rgba(255,255,255,0.15)',
                    background: 'rgba(0,0,0,0.15)', color: '#fff',
                    padding: '0 48px 0 14px', fontSize: '16px', outline: 'none',
                    boxSizing: 'border-box', fontFamily: 'sans-serif',
                    transition: 'border-color 150ms'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--color-yellow, #f5c800)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', padding: 0
                  }}
                >
                  <i className={showConfirmPassword ? 'ri-eye-off-line' : 'ri-eye-line'} style={{ fontSize: '18px' }} />
                </button>
              </div>
            </div>

            {/* Password Validation Rules checklist panel */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: 24,
              fontSize: '13px',
              color: '#cbd5e1',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>
                Requisitos de Seguridad
              </div>
              
              {[
                { label: 'Mínimo 8 caracteres', checked: rules.length },
                { label: 'Al menos una mayúscula (A-Z)', checked: rules.uppercase },
                { label: 'Al menos una minúscula (a-z)', checked: rules.lowercase },
                { label: 'Al menos un número (0-9)', checked: rules.number },
                { label: 'Al menos un carácter especial (@$!%*?&)', checked: rules.special },
                { label: 'Las contraseñas coinciden', checked: rules.match }
              ].map((rule, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  color: rule.checked ? '#4ade80' : '#a0aec0',
                  fontWeight: rule.checked ? 600 : 400,
                  transition: 'color 150ms'
                }}>
                  <i className={rule.checked ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'} style={{ fontSize: '15px' }} />
                  <span>{rule.label}</span>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !isPasswordValid}
              style={{
                width: '100%',
                height: '52px',
                borderRadius: '12px',
                background: isPasswordValid ? 'var(--color-yellow, #f5c800)' : 'rgba(255, 255, 255, 0.08)',
                color: isPasswordValid ? '#1b2b6e' : 'rgba(255, 255, 255, 0.3)',
                border: 'none',
                fontSize: '15px',
                fontWeight: 800,
                cursor: isPasswordValid && !submitting ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'transform 150ms, background 150ms',
                boxShadow: isPasswordValid ? '0 4px 14px rgba(245,200,0,0.25)' : 'none'
              }}
              onMouseDown={e => { if (isPasswordValid && !submitting) e.currentTarget.style.transform = 'scale(0.97)' }}
              onMouseUp={e => { if (isPasswordValid && !submitting) e.currentTarget.style.transform = 'none' }}
            >
              {submitting && <i className="ri-loader-4-line ri-spin" style={{ fontSize: '18px' }} />}
              {submitting ? 'Restableciendo...' : 'Guardar Nueva Contraseña'}
            </button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes spin-circle { to { transform: rotate(360deg); } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  )
}
