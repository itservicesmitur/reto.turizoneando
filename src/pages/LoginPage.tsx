import { type FormEvent, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  type AuthError,
} from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db, functions } from '../config/firebase'
import logoImg from '../assets/logo1.png'
import mascotImg from '../assets/mascota.png'
import { syncPlayerSocialProfile, getGoogleRedirectResult } from '../services/authService'

const googleProvider = new GoogleAuthProvider()

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPass, setShowPass] = useState(false)

  const [view, setView] = useState<'login' | 'reset'>('login')
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)

  useEffect(() => {
    getGoogleRedirectResult().then(async result => {
      if (!result) return
      setLoading(true)
      try {
        await result.user.getIdToken(true)
        const { banned } = await syncPlayerSocialProfile(result.user, i18n.language as 'es' | 'en')
        if (banned) {
          await auth.signOut()
          setError(t('login.bannedError'))
          return
        }
        navigate('/map', { replace: true })
      } catch (err) {
        console.error('[LoginPage] redirect result error:', err)
        setError(t('login.errorGeneric'))
      } finally {
        setLoading(false)
      }
    }).catch(err => {
      console.error('[LoginPage] getRedirectResult error:', err)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleLang() {
    i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const snap = await getDoc(doc(db, 'players', userCredential.user.uid))
      if (snap.exists() && snap.data().banned === true) {
        await auth.signOut()
        setError(t('login.bannedError'))
        return
      }
      navigate('/map', { replace: true })
    } catch (err) {
      const code = (err as AuthError).code
      setError(
        ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(code)
          ? t('login.errorInvalid')
          : t('login.errorGeneric'),
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword(e: FormEvent) {
    e.preventDefault()
    setResetError(null)
    setResetLoading(true)
    try {
      const sendReset = httpsCallable(functions, 'sendPlayerPasswordResetEmail')
      await sendReset({ email: resetEmail })
      setResetSent(true)
    } catch {
      setResetError(t('login.resetErrorGeneric'))
    } finally {
      setResetLoading(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    setLoading(true)
    try {
      const userCredential = await signInWithPopup(auth, googleProvider)

      // Force a fresh ID token so Firestore's offline cache doesn't use a stale auth context
      // from a previous session (causes permission-denied on the first Firestore read/write).
      await userCredential.user.getIdToken(true)

      // Sync Google profile data (email, name, photo) to Firestore
      const { banned } = await syncPlayerSocialProfile(userCredential.user, i18n.language as 'es' | 'en')

      if (banned) {
        await auth.signOut()
        setError(t('login.bannedError'))
        return
      }
      navigate('/map', { replace: true })
    } catch (err) {
      const code = (err as AuthError).code
      console.error('[LoginPage] Google sign-in error:', code, err)
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        // user dismissed — no message needed
      } else if (code === 'auth/account-exists-with-different-credential') {
        setError(t('login.errorDifferentCredential'))
      } else if (code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider)
        return // page will reload; redirect result handled in useEffect
      } else if (code === 'auth/network-request-failed') {
        setError('Sin conexión. Verifica tu internet e intenta de nuevo.')
      } else if (code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Espera unos minutos e intenta de nuevo.')
      } else if (code === 'auth/unauthorized-domain') {
        setError('Este dominio no está autorizado. Contacta al administrador.')
      } else {
        setError(`${t('login.errorGeneric')} (${code ?? 'unknown'})`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lp-login-outer" style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-primary-dark)',
      fontFamily: 'var(--font-body)',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* ── Decorative blobs ─────────────────────────────────── */}
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
        { top: '8%', left: '8%', size: 14, color: 'rgba(255,148,71,0.7)', delay: '0s' },
        { top: '18%', right: '22%', size: 10, color: 'rgba(0,187,180,0.6)', delay: '0.4s' },
        { top: '28%', left: '55%', size: 8, color: 'rgba(255,255,255,0.35)', delay: '0.8s' },
        { top: '6%', left: '40%', size: 12, color: 'rgba(224,52,75,0.45)', delay: '0.2s' },
      ].map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: s.top,
            left: (s as { left?: string }).left,
            right: (s as { right?: string }).right,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: s.color,
            animation: `twinkle 2.5s ${s.delay} infinite alternate ease-in-out`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* ── Language toggle ───────────────────────────────────── */}
      <button
        onClick={toggleLang}
        aria-label="Switch language"
        style={{
          position: 'absolute', top: 'calc(var(--safe-top) + 14px)', right: 16,
          zIndex: 20,
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 20, color: '#fff',
          padding: '6px 14px', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          letterSpacing: 0.5,
        }}
      >
        <i className="ri-global-line" style={{ fontSize: 13 }} />
        {i18n.language === 'es' ? 'EN' : 'ES'}
      </button>

      {/* ── Two-column card wrapper (tablet/desktop) ─────────── */}
      <div className="lp-login-card">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <div className="lp-login-hero" style={{
          flex: '0 0 auto',
          minHeight: '26dvh',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingTop: 'calc(var(--safe-top) + 16px)',
          paddingLeft: 24,
          paddingRight: 0,
          paddingBottom: 16,
          position: 'relative',
          zIndex: 1,
        }}>

          {/* Left — logo + text */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 8 }}>

            {/* Logo badge */}
            <div className="lp-logo-badge" style={{
              width: 88, height: 88,
              borderRadius: '50%',
              background: '#fff',
              padding: 5,
              boxShadow:
                '0 0 0 3px rgba(255,148,71,0.55), 0 0 0 6px rgba(255,148,71,0.18), 0 12px 32px rgba(0,0,0,0.3)',
            }}>
              <img
                src={logoImg}
                alt="Turizoneando"
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }}
              />
            </div>

            {/* App name */}
            <div>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                color: '#fff',
                fontSize: 32,
                margin: 0,
                lineHeight: 1.1,
                letterSpacing: 0.5,
                textShadow: '0 2px 20px rgba(255,148,71,0.4)',
              }}>
                {t('login.title')}
              </h1>
              <p style={{
                color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '4px 0 0',
                letterSpacing: 0.3,
              }}>
                {t('login.subtitle')}
              </p>
            </div>

            {/* Fun badges */}
            <div className="lp-badges" style={{ display: 'flex', gap: 6 }}>
              {(['🗺️', '🎯', '🏆'] as const).map((icon, i) => (
                <span key={i} style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 20, padding: '3px 8px', fontSize: 13,
                }}>
                  {icon}
                </span>
              ))}
            </div>
          </div>

          {/* Right — mascot */}
          <div className="lp-mascot-wrap" style={{
            flexShrink: 0,
            width: 150,
            height: 210,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            overflow: 'hidden',
          }}>
            <img
              src={mascotImg}
              alt="Mascota Turizoneando"
              style={{
                height: '100%',
                width: 'auto',
                objectFit: 'contain',
                objectPosition: 'bottom center',
                /* fade top to hide white bg against navy */
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 28%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 28%)',
                filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))',
              }}
            />
          </div>
        </div>

        {/* ── Form card ────────────────────────────────────────── */}
        <div
          className="animate-slide-up"
          style={{
            flex: 1,
            minHeight: 0,
            background: 'var(--color-surface)',
            borderRadius: '28px 28px 0 0',
            boxShadow: '0 -8px 40px rgba(27,43,110,0.25)',
            position: 'relative',
            zIndex: 5,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Teal accent strip at top */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: 'var(--gradient-primary)',
            flexShrink: 0,
          }} />

          <div style={{
            flex: 1,
            minHeight: 0,
            padding: '18px 20px',
            paddingBottom: 'calc(var(--safe-bottom) + 16px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            overflowY: 'auto',
          }}>

            {/* Drag handle */}
            <div style={{
              width: 36, height: 4, borderRadius: 2,
              background: 'var(--color-border)', margin: '0 auto 14px',
            }} />

            {/* Welcome */}
            <div style={{ marginBottom: 14 }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-primary-dark)', fontSize: 26,
                margin: '0 0 4px',
              }}>
                {t('login.welcome')}
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0 }}>
                {t('login.welcomeSubtitle')}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label htmlFor="email" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  {t('login.email')}
                </label>
                <div style={{ position: 'relative' }}>
                  <i className="ri-mail-line" style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--color-gray-mid)', fontSize: 16, pointerEvents: 'none',
                  }} />
                  <input
                    id="email" type="email" autoComplete="email" inputMode="email"
                    value={email} onChange={e => setEmail(e.target.value)} required
                    style={{
                      width: '100%', height: 48, borderRadius: 14,
                      border: '2px solid var(--color-border)',
                      paddingLeft: 42, paddingRight: 14, fontSize: 16,
                      fontFamily: 'var(--font-body)', color: 'var(--color-text)',
                      background: 'var(--color-gray-light)', outline: 'none',
                      transition: 'border-color 150ms ease, box-shadow 150ms ease',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'var(--color-primary-dark)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(9,109,125,0.12)'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'var(--color-border)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="password" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    {t('login.password')}
                  </label>
                  <button
                    type="button"
                    onClick={() => { setResetEmail(email); setResetSent(false); setResetError(null); setView('reset') }}
                    style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--color-primary-dark)', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                  >
                    {t('login.forgotPassword')}
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <i className="ri-lock-line" style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--color-gray-mid)', fontSize: 16, pointerEvents: 'none',
                  }} />
                  <input
                    id="password" type={showPass ? 'text' : 'password'} autoComplete="current-password"
                    value={password} onChange={e => setPassword(e.target.value)} required
                    style={{
                      width: '100%', height: 48, borderRadius: 14,
                      border: '2px solid var(--color-border)',
                      paddingLeft: 42, paddingRight: 48, fontSize: 16,
                      fontFamily: 'var(--font-body)', color: 'var(--color-text)',
                      background: 'var(--color-gray-light)', outline: 'none',
                      transition: 'border-color 150ms ease, box-shadow 150ms ease',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'var(--color-primary-dark)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(9,109,125,0.12)'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'var(--color-border)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <button
                    type="button" onClick={() => setShowPass(v => !v)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--color-gray-mid)',
                      cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
                    }}
                  >
                    <i className={showPass ? 'ri-eye-off-line' : 'ri-eye-line'} style={{ fontSize: 18 }} />
                  </button>
                </div>
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

              {/* Submit — yellow CTA */}
              <button
                type="submit" disabled={loading}
                style={{
                  marginTop: 2, width: '100%', height: 50, borderRadius: 16,
                  background: loading ? 'var(--color-gray-mid)' : 'var(--gradient-primary)',
                  color: '#fff',
                  fontSize: 17, fontWeight: 800, fontFamily: 'var(--font-body)',
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'transform 150ms ease, box-shadow 150ms ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: loading ? 'none' : '0 6px 20px rgba(224,52,75,0.4)',
                  letterSpacing: 0.3,
                }}
                onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.97)' }}
                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                onTouchStart={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.97)' }}
                onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                {loading
                  ? <><i className="ri-loader-4-line" style={{ animation: 'spin 0.8s linear infinite' }} /> {t('login.loading')}</>
                  : <><i className="ri-rocket-line" style={{ fontSize: 18 }} /> {t('login.submit')}</>
                }
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              <span style={{ fontSize: 12, color: 'var(--color-gray-mid)', fontWeight: 600 }}>{t('login.or')}</span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            </div>

            {/* Google */}
            <button
              type="button" onClick={handleGoogle} disabled={loading}
              aria-label={t('login.google')}
              style={{
                width: '100%', height: 48, borderRadius: 16,
                background: '#fff', border: '2px solid var(--color-border)',
                color: 'var(--color-text)', fontSize: 14, fontWeight: 700,
                fontFamily: 'var(--font-body)', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'transform 150ms ease, box-shadow 150ms ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
              onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.97)' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
              onTouchStart={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.97)' }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
              </svg>
              {t('login.google')}
            </button>

            {/* Register */}
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)', margin: '16px 0 0' }}>
              {t('login.noAccount')}{' '}
              <Link to="/register" style={{ color: 'var(--color-primary-dark)', fontWeight: 800, textDecoration: 'none' }}>
                {t('login.register')}
              </Link>
            </p>
          </div>

          {/* ── Reset password overlay ───────────────────────────── */}
          {view === 'reset' && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'var(--color-surface)',
              borderRadius: '28px 28px 0 0',
              display: 'flex', flexDirection: 'column',
              padding: '18px 20px',
              paddingBottom: 'calc(var(--safe-bottom) + 16px)',
              gap: 0,
              overflowY: 'auto',
              zIndex: 10,
            }}>
              {/* Drag handle */}
              <div style={{
                width: 36, height: 4, borderRadius: 2,
                background: 'var(--color-border)', margin: '0 auto 20px',
              }} />

              {/* Back button */}
              <button
                type="button"
                onClick={() => { setView('login'); setResetSent(false); setResetError(null) }}
                style={{
                  alignSelf: 'flex-start', background: 'none', border: 'none',
                  color: 'var(--color-primary-dark)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 700, padding: 0, marginBottom: 20,
                }}
              >
                <i className="ri-arrow-left-line" style={{ fontSize: 16 }} />
                {t('login.resetBack')}
              </button>

              {!resetSent ? (
                <>
                  {/* Header */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: 'rgba(9,109,125,0.10)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 12,
                    }}>
                      <i className="ri-lock-password-line" style={{ fontSize: 24, color: 'var(--color-primary-dark)' }} />
                    </div>
                    <h2 style={{
                      fontFamily: 'var(--font-display)',
                      color: 'var(--color-primary-dark)', fontSize: 24,
                      margin: '0 0 6px',
                    }}>
                      {t('login.resetTitle')}
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0 }}>
                      {t('login.resetSubtitle')}
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleForgotPassword} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label htmlFor="resetEmail" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                        {t('login.email')}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <i className="ri-mail-line" style={{
                          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                          color: 'var(--color-gray-mid)', fontSize: 16, pointerEvents: 'none',
                        }} />
                        <input
                          id="resetEmail" type="email" autoComplete="email" inputMode="email"
                          value={resetEmail} onChange={e => setResetEmail(e.target.value)} required
                          style={{
                            width: '100%', height: 48, borderRadius: 14,
                            border: '2px solid var(--color-border)',
                            paddingLeft: 42, paddingRight: 14, fontSize: 16,
                            fontFamily: 'var(--font-body)', color: 'var(--color-text)',
                            background: 'var(--color-gray-light)', outline: 'none',
                            transition: 'border-color 150ms ease, box-shadow 150ms ease',
                          }}
                          onFocus={e => {
                            e.currentTarget.style.borderColor = 'var(--color-primary-dark)'
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(9,109,125,0.12)'
                          }}
                          onBlur={e => {
                            e.currentTarget.style.borderColor = 'var(--color-border)'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        />
                      </div>
                    </div>

                    {resetError && (
                      <p role="alert" style={{
                        margin: 0, padding: '10px 14px', borderRadius: 12,
                        background: 'rgba(230,51,41,0.07)', border: '1.5px solid rgba(230,51,41,0.2)',
                        color: 'var(--color-error)', fontSize: 13,
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <i className="ri-error-warning-line" style={{ flexShrink: 0, fontSize: 16 }} />
                        {resetError}
                      </p>
                    )}

                    <button
                      type="submit" disabled={resetLoading}
                      style={{
                        marginTop: 2, width: '100%', height: 50, borderRadius: 16,
                        background: resetLoading ? 'var(--color-gray-mid)' : 'var(--gradient-primary)',
                        color: '#fff',
                        fontSize: 17, fontWeight: 800, fontFamily: 'var(--font-body)',
                        border: 'none', cursor: resetLoading ? 'not-allowed' : 'pointer',
                        transition: 'transform 150ms ease, box-shadow 150ms ease',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: resetLoading ? 'none' : '0 6px 20px rgba(224,52,75,0.4)',
                        letterSpacing: 0.3,
                      }}
                      onMouseDown={e => { if (!resetLoading) e.currentTarget.style.transform = 'scale(0.97)' }}
                      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                      onTouchStart={e => { if (!resetLoading) e.currentTarget.style.transform = 'scale(0.97)' }}
                      onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
                    >
                      {resetLoading
                        ? <><i className="ri-loader-4-line" style={{ animation: 'spin 0.8s linear infinite' }} /> {t('login.resetSending')}</>
                        : <><i className="ri-send-plane-line" style={{ fontSize: 18 }} /> {t('login.resetSubmit')}</>
                      }
                    </button>
                  </form>
                </>
              ) : (
                /* Success state */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 20, gap: 16 }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'rgba(0,187,180,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="ri-mail-check-line" style={{ fontSize: 34, color: 'var(--color-primary-dark)' }} />
                  </div>
                  <div>
                    <h2 style={{
                      fontFamily: 'var(--font-display)',
                      color: 'var(--color-primary-dark)', fontSize: 22,
                      margin: '0 0 8px',
                    }}>
                      {t('login.resetTitle')}
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                      {t('login.resetSuccess')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setView('login'); setResetSent(false); setResetError(null) }}
                    style={{
                      marginTop: 8, width: '100%', height: 50, borderRadius: 16,
                      background: 'var(--gradient-primary)',
                      color: '#fff',
                      fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-body)',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: '0 6px 20px rgba(224,52,75,0.4)',
                    }}
                  >
                    <i className="ri-arrow-left-line" style={{ fontSize: 18 }} />
                    {t('login.resetBack')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>{/* ── /lp-login-card ── */}

      <style>{`
        @keyframes spin    { from { transform: rotate(0deg);   } to { transform: rotate(360deg); } }
        @keyframes twinkle { from { opacity: 0.3; transform: scale(0.8); } to { opacity: 1; transform: scale(1.2); } }

        /* ── Login responsive layout ───────────────────── */
        .lp-login-card {
          display: flex;
          flex-direction: column;
          width: 100%;
          flex: 1;
        }

        /* Tablet: tarjeta centrada */
        @media (min-width: 600px) {
          .lp-login-outer {
            align-items: center;
            justify-content: center;
            padding: 32px 24px;
            background: #031f26 !important;
          }
          .lp-login-card {
            flex: 0 0 auto;
            max-width: 460px;
            width: 100%;
            border-radius: 28px;
            overflow: hidden;
            box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.09);
            position: relative;
            z-index: 1;
            background: var(--color-primary-dark);
          }
          .lp-login-hero {
            min-height: 220px !important;
            padding-top: 36px !important;
            background: linear-gradient(145deg, #054f5c 0%, var(--color-primary-dark) 100%) !important;
          }
          .lp-login-form {
            border-radius: 0 !important;
          }
        }

        /* Desktop: dos columnas */
        @media (min-width: 900px) {
          .lp-login-card {
            flex-direction: row;
            max-width: 820px;
            min-height: 580px;
          }
          .lp-login-hero {
            flex: 1;
            min-height: 0 !important;
            padding: 48px 36px 36px !important;
            justify-content: center !important;
          }
          .lp-login-form {
            width: 380px;
            flex-shrink: 0;
            flex: none;
            overflow-y: auto;
          }
        }

        /* Móvil: ocultar mascot, reducir logo y hero */
        @media (max-width: 599px) {
          .lp-mascot-wrap { display: none !important; }
          .lp-logo-badge { width: 64px !important; height: 64px !important; }
          .lp-login-hero {
            min-height: 0 !important;
            padding-top: calc(var(--safe-top) + 12px) !important;
            padding-bottom: 12px !important;
          }
        }
        /* Pantallas muy cortas: reducir aún más */
        @media (max-width: 599px) and (max-height: 700px) {
          .lp-login-hero {
            padding-top: calc(var(--safe-top) + 6px) !important;
            padding-bottom: 6px !important;
          }
          .lp-badges { display: none !important; }
          .lp-logo-badge { width: 52px !important; height: 52px !important; }
        }
      `}</style>
    </div>
  )
}
