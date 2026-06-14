import { type FormEvent, useState } from 'react'
import logoImg from '../../assets/logo1.png'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { signInWithEmailAndPassword, type AuthError } from 'firebase/auth'
import { auth } from '../../config/firebase'

export default function AdminLoginPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [showPass, setShowPass] = useState(false)

  function toggleLang() {
    i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const tokenResult = await userCredential.user.getIdTokenResult(true)
      
      if ((tokenResult.claims.role as string | undefined)?.toLowerCase() !== 'admin') {
        await auth.signOut()
        setError(t('adminLogin.unauthorized'))
        return
      }

      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      const code = (err as AuthError).code
      setError(
        code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found'
          ? t('adminLogin.error')
          : t('adminLogin.error'),
      )
    } finally {
      setLoading(false)
    }
  }

  const lang = i18n.language === 'es' ? 'es' : 'en'

  return (
    <div className="al-outer">

      {/* Subtle grid background */}
      <div className="al-bg-grid" aria-hidden />

      {/* Lang toggle */}
      <button onClick={toggleLang} aria-label="Switch language" className="al-lang-btn">
        <i className="ri-global-line" style={{ fontSize: 14 }} />
        {lang === 'es' ? 'EN' : 'ES'}
      </button>

      {/* Main card */}
      <div className="al-card animate-fade-in">

        {/* ── Left branding panel ──────────────────────────── */}
        <div className="al-left">
          <div className="al-left-pattern" aria-hidden />

          {/* Logo */}
          <div className="al-left-logo-wrap">
            <img src={logoImg} alt="Turizoneando" className="al-left-logo" />
          </div>

          {/* Title */}
          <h1 className="al-left-title">
            {lang === 'es' ? 'Panel de Control' : 'Control Panel'}
          </h1>
          <p className="al-left-sub">Turizoneando · MITUR</p>

          {/* Divider */}
          <div className="al-left-divider" />

          {/* Info badges */}
          <div className="al-left-badges">
            <span className="al-badge">
              <i className="ri-shield-keyhole-line" />
              {lang === 'es' ? 'Acceso restringido' : 'Restricted access'}
            </span>
            <span className="al-badge">
              <i className="ri-map-pin-2-line" />
              Zona Colonial, SD
            </span>
            <span className="al-badge">
              <i className="ri-building-2-line" />
              MITUR — {lang === 'es' ? 'Admin' : 'Admin'}
            </span>
          </div>
        </div>

        {/* ── Right form panel ────────────────────────────── */}
        <div className="al-right">

          {/* Mobile-only logo */}
          <div className="al-mobile-header">
            <div className="al-mobile-logo-wrap">
              <img src={logoImg} alt="Turizoneando" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 20, lineHeight: 1.1 }}>
                {lang === 'es' ? 'Panel de Control' : 'Control Panel'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                Turizoneando · MITUR
              </div>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-navy)', fontSize: 24,
              margin: '0 0 6px',
            }}>
              {lang === 'es' ? 'Iniciar sesión' : 'Sign in'}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ri-shield-check-line" style={{ color: 'var(--color-teal)', fontSize: 14 }} />
              {lang === 'es' ? 'Solo personal autorizado' : 'Authorized personnel only'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="admin-email" style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {t('adminLogin.email')}
              </label>
              <div style={{ position: 'relative' }}>
                <i className="ri-mail-line" style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--color-gray-mid)', fontSize: 16, pointerEvents: 'none',
                }} />
                <input
                  id="admin-email" type="email" autoComplete="email" inputMode="email"
                  value={email} onChange={e => setEmail(e.target.value)} required
                  style={{
                    width: '100%', height: 48, borderRadius: 10,
                    border: '1.5px solid var(--color-border)',
                    paddingLeft: 42, paddingRight: 14, fontSize: 15,
                    fontFamily: 'var(--font-body)', color: 'var(--color-text)',
                    background: '#f8f9fb', outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 150ms ease, box-shadow 150ms ease',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'var(--color-navy)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,43,110,0.08)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="admin-password" style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {t('adminLogin.password')}
              </label>
              <div style={{ position: 'relative' }}>
                <i className="ri-lock-line" style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--color-gray-mid)', fontSize: 16, pointerEvents: 'none',
                }} />
                <input
                  id="admin-password" type={showPass ? 'text' : 'password'} autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)} required
                  style={{
                    width: '100%', height: 48, borderRadius: 10,
                    border: '1.5px solid var(--color-border)',
                    paddingLeft: 42, paddingRight: 48, fontSize: 15,
                    fontFamily: 'var(--font-body)', color: 'var(--color-text)',
                    background: '#f8f9fb', outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 150ms ease, box-shadow 150ms ease',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'var(--color-navy)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,43,110,0.08)'
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
                  <i className={showPass ? 'ri-eye-off-line' : 'ri-eye-line'} style={{ fontSize: 17 }} />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p role="alert" style={{
                margin: 0, padding: '10px 14px', borderRadius: 10,
                background: 'rgba(230,51,41,0.07)', border: '1px solid rgba(230,51,41,0.18)',
                color: 'var(--color-error)', fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <i className="ri-error-warning-line" style={{ flexShrink: 0, fontSize: 15 }} />
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="al-submit-btn"
              style={{
                marginTop: 4, width: '100%', height: 48, borderRadius: 10,
                background: loading ? 'var(--color-gray-mid)' : 'var(--color-navy)',
                color: '#fff', fontSize: 15, fontWeight: 700,
                fontFamily: 'var(--font-body)', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'transform 150ms ease, box-shadow 150ms ease',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(27,43,110,0.3)',
              }}
              onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {loading
                ? <><i className="ri-loader-4-line" style={{ animation: 'al-spin 0.8s linear infinite' }} /> {t('adminLogin.loading')}</>
                : <><i className="ri-login-box-line" style={{ fontSize: 17 }} /> {t('adminLogin.submit')}</>
              }
            </button>
          </form>

          {/* Footer */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/" style={{
              fontSize: 13, color: 'var(--color-gray-mid)', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <i className="ri-arrow-left-line" style={{ fontSize: 13 }} />
              {t('adminLogin.back')}
            </Link>
            <span style={{ fontSize: 11, color: 'var(--color-gray-mid)', letterSpacing: 0.3 }}>
              v1.0 · MITUR
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes al-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* ── Outer container ──────────────────────── */
        .al-outer {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0d1526;
          font-family: var(--font-body);
          padding: 24px 16px;
          position: relative;
          overflow: hidden;
        }

        /* Subtle dot grid */
        .al-bg-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0);
          background-size: 32px 32px;
          pointer-events: none;
        }

        /* ── Lang button ──────────────────────────── */
        .al-lang-btn {
          position: fixed;
          top: 16px; right: 20px;
          z-index: 10;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 20px;
          color: rgba(255,255,255,0.8);
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: background 150ms ease;
        }
        .al-lang-btn:hover {
          background: rgba(255,255,255,0.14);
        }

        /* ── Card ─────────────────────────────────── */
        .al-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
          background: var(--color-surface);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
        }

        /* ── Left branding panel (hidden on mobile) ─ */
        .al-left {
          display: none;
          position: relative;
          overflow: hidden;
          background: linear-gradient(155deg, #14225a 0%, #0d1526 100%);
          padding: 48px 36px;
          flex-direction: column;
          justify-content: center;
          gap: 0;
        }
        .al-left-pattern {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }
        .al-left-logo-wrap {
          width: 80px; height: 80px;
          border-radius: 50%;
          background: #fff;
          padding: 5px;
          margin-bottom: 24px;
          box-shadow: 0 0 0 2px rgba(245,200,0,0.3), 0 8px 28px rgba(0,0,0,0.4);
          flex-shrink: 0;
        }
        .al-left-logo { width: 100%; height: 100%; object-fit: contain; border-radius: 50%; }

        .al-left-title {
          font-family: var(--font-display);
          color: #fff;
          font-size: 26px;
          margin: 0 0 6px;
          line-height: 1.1;
        }
        .al-left-sub {
          color: rgba(255,255,255,0.45);
          font-size: 13px;
          margin: 0 0 24px;
          letter-spacing: 0.5px;
        }
        .al-left-divider {
          height: 1px;
          background: rgba(255,255,255,0.08);
          margin-bottom: 24px;
        }
        .al-left-badges {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .al-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255,255,255,0.55);
          font-size: 12.5px;
          font-weight: 500;
        }
        .al-badge i {
          font-size: 15px;
          color: rgba(43,191,184,0.8);
        }

        /* ── Right form panel ─────────────────────── */
        .al-right {
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
        }

        /* Mobile-only header (logo + title inline) */
        .al-mobile-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--color-border);
        }
        .al-mobile-logo-wrap {
          width: 48px; height: 48px;
          border-radius: 50%;
          background: #fff;
          padding: 3px;
          box-shadow: 0 0 0 2px rgba(27,43,110,0.15), 0 4px 12px rgba(0,0,0,0.12);
          flex-shrink: 0;
        }

        /* Submit hover */
        .al-submit-btn:not(:disabled):hover {
          box-shadow: 0 6px 20px rgba(27,43,110,0.45) !important;
        }

        /* ── Desktop: two-column ──────────────────── */
        @media (min-width: 820px) {
          .al-card {
            flex-direction: row;
            max-width: 780px;
          }
          .al-left {
            display: flex;
            width: 300px;
            flex-shrink: 0;
          }
          .al-right {
            flex: 1;
            padding: 40px 36px;
            justify-content: center;
          }
          .al-mobile-header {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
