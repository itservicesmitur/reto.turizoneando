import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { useTranslation } from 'react-i18next'
import { auth, db } from '../config/firebase'
import { sendOtp, verifyOtpCode } from '../services/authService'
import logoImg from '../assets/logo1.png'

const DIGITS = 6

export default function VerifyEmailPage() {
  const { t, i18n } = useTranslation()
  const navigate    = useNavigate()
  const lang        = i18n.language?.startsWith('en') ? 'en' : 'es'

  const [userEmail,   setUserEmail]   = useState('')
  const [digits,      setDigits]      = useState<string[]>(Array(DIGITS).fill(''))
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [success,     setSuccess]     = useState(false)
  const [countdown,   setCountdown]   = useState(0)
  const [authReady,   setAuthReady]   = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  // Wait for auth state, redirect if not logged in or already verified
  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) { navigate('/login', { replace: true }); return }
      setUserEmail(user.email || '')
      setAuthReady(true)
    })
  }, [navigate])

  function startCountdown(seconds = 60) {
    setCountdown(seconds)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  function handleDigitChange(idx: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[idx] = char
    setDigits(next)
    setError(null)
    if (char && idx < DIGITS - 1) inputRefs.current[idx + 1]?.focus()
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits]; next[idx] = ''; setDigits(next)
      } else if (idx > 0) {
        const next = [...digits]; next[idx - 1] = ''; setDigits(next)
        inputRefs.current[idx - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    } else if (e.key === 'ArrowRight' && idx < DIGITS - 1) {
      inputRefs.current[idx + 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGITS)
    if (!text) return
    e.preventDefault()
    const next = Array(DIGITS).fill('')
    for (let i = 0; i < text.length; i++) next[i] = text[i]
    setDigits(next)
    inputRefs.current[Math.min(text.length, DIGITS - 1)]?.focus()
  }

  async function handleVerify() {
    const code = digits.join('')
    if (code.length < DIGITS) {
      setError(lang === 'en' ? 'Enter all 6 digits.' : 'Ingresa los 6 dígitos del código.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await verifyOtpCode(code)
      // Also update the local Firestore cache immediately so ProtectedRoute
      // doesn't see the stale emailVerified:false value when navigating to /map
      const user = auth.currentUser
      if (user) {
        await updateDoc(doc(db, 'players', user.uid), { emailVerified: true })
      }
      setSuccess(true)
      setTimeout(() => navigate('/map', { replace: true }), 1200)
    } catch (err: any) {
      const msg = err?.message || (lang === 'en' ? 'Incorrect code.' : 'Código incorrecto.')
      setError(msg)
      setDigits(Array(DIGITS).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (countdown > 0) return
    setLoading(true)
    setError(null)
    try {
      await sendOtp()
      startCountdown(60)
      setDigits(Array(DIGITS).fill(''))
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      const raw = err?.message || ''
      const seconds = parseInt(raw, 10)
      if (!isNaN(seconds) && seconds > 0) {
        startCountdown(seconds)
        setError(
          lang === 'en'
            ? `Please wait ${seconds}s before requesting a new code.`
            : `Espera ${seconds} segundos antes de pedir otro código.`
        )
      } else {
        setError(raw || (lang === 'en' ? 'Could not resend.' : 'No se pudo reenviar.'))
      }
    } finally {
      setLoading(false)
    }
  }

  const masked = userEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')
  const code   = digits.join('')

  if (!authReady) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-navy)' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3.5px solid rgba(255,255,255,0.12)', borderTopColor: 'var(--color-yellow)', animation: 'vep-spin 0.7s linear infinite' }} />
        <style>{`@keyframes vep-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-navy)', fontFamily: 'var(--font-body)',
      padding: '20px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background blobs */}
      <div style={{ position: 'absolute', top: -80, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(0,187,180,0.15)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,148,71,0.10)', pointerEvents: 'none' }} />

      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--color-surface)',
        borderRadius: 24, overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.05)',
        position: 'relative', zIndex: 10,
      }}>
        {/* Accent bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, var(--color-teal), var(--color-yellow), var(--color-orange))' }} />

        <div style={{ padding: '28px 24px 32px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff', padding: 4, boxShadow: '0 0 0 3px rgba(0,187,180,0.4), 0 8px 24px rgba(0,0,0,0.2)' }}>
              <img src={logoImg} alt="Turizoneando" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
            </div>
          </div>

          {success ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(74,222,128,0.15)', border: '2px solid #4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <i className="ri-check-line" style={{ fontSize: 28, color: '#4ade80' }} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary-dark)', fontSize: 22, margin: '0 0 8px' }}>
                {lang === 'en' ? '¡Verified!' : '¡Verificado!'}
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
                {lang === 'en' ? 'Entering the map…' : 'Entrando al mapa…'}
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,187,180,0.12)', border: '2px solid rgba(0,187,180,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <i className="ri-mail-check-line" style={{ fontSize: 22, color: 'var(--color-teal)' }} />
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary-dark)', fontSize: 22, margin: '0 0 8px' }}>
                  {lang === 'en' ? 'Verify your email' : 'Verifica tu correo'}
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                  {lang === 'en'
                    ? <>We sent a 6-digit code to <strong style={{ color: 'var(--color-text)' }}>{masked}</strong></>
                    : <>Enviamos un código de 6 dígitos a <strong style={{ color: 'var(--color-text)' }}>{masked}</strong></>
                  }
                </p>
              </div>

              {/* OTP inputs */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }} onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onFocus={e => e.target.select()}
                    style={{
                      width: 44, height: 54, textAlign: 'center',
                      fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)',
                      borderRadius: 12,
                      border: `2px solid ${d ? 'var(--color-teal)' : 'var(--color-border)'}`,
                      background: d ? 'rgba(0,187,180,0.07)' : 'var(--color-gray-light)',
                      color: 'var(--color-primary-dark)',
                      outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 150ms, background 150ms',
                    }}
                    onFocusCapture={e => { e.target.style.borderColor = 'var(--color-teal)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,187,180,0.18)' }}
                    onBlurCapture={e => { e.target.style.boxShadow = 'none'; if (!d) e.target.style.borderColor = 'var(--color-border)' }}
                  />
                ))}
              </div>

              {/* Error */}
              {error && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(230,51,41,0.07)', border: '1.5px solid rgba(230,51,41,0.2)', marginBottom: 16 }}>
                  <i className="ri-error-warning-line" style={{ color: 'var(--color-error)', fontSize: 16, flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: 'var(--color-error)', lineHeight: 1.4 }}>{error}</span>
                </div>
              )}

              {/* Verify button */}
              <button
                onClick={handleVerify}
                disabled={loading || code.length < DIGITS}
                style={{
                  width: '100%', height: 50, borderRadius: 16,
                  background: (loading || code.length < DIGITS) ? 'var(--color-gray-mid)' : 'var(--gradient-primary)',
                  color: '#fff', fontSize: 16, fontWeight: 800,
                  border: 'none', cursor: (loading || code.length < DIGITS) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: (loading || code.length < DIGITS) ? 'none' : '0 6px 20px rgba(224,52,75,0.35)',
                  transition: 'all 150ms ease', marginBottom: 14,
                }}
              >
                {loading
                  ? <><i className="ri-loader-4-line" style={{ animation: 'vep-spin 0.8s linear infinite' }} /> {lang === 'en' ? 'Verifying…' : 'Verificando…'}</>
                  : <><i className="ri-shield-check-line" style={{ fontSize: 18 }} /> {lang === 'en' ? 'Verify' : 'Verificar'}</>
                }
              </button>

              {/* Resend */}
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {lang === 'en' ? "Didn't receive it? " : '¿No lo recibiste? '}
                </span>
                <button
                  onClick={handleResend}
                  disabled={loading || countdown > 0}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    fontSize: 13, fontWeight: 700, cursor: (loading || countdown > 0) ? 'not-allowed' : 'pointer',
                    color: countdown > 0 ? 'var(--color-text-muted)' : 'var(--color-teal)',
                    textDecoration: countdown > 0 ? 'none' : 'underline',
                  }}
                >
                  {countdown > 0
                    ? (lang === 'en' ? `Resend in ${countdown}s` : `Reenviar en ${countdown}s`)
                    : (lang === 'en' ? 'Resend code' : 'Reenviar código')
                  }
                </button>
              </div>

              {/* Back to login */}
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button
                  onClick={() => { auth.signOut(); navigate('/login', { replace: true }) }}
                  style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--color-text-muted)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {lang === 'en' ? 'Back to login' : 'Volver al inicio de sesión'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes vep-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
