import { Fragment, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { type AuthError } from 'firebase/auth'
import {
  registerWithEmail,
  signUpWithGoogle,
  signUpWithApple,
  savePlayerProfile,
} from '../services/authService'
import type { User } from 'firebase/auth'
import logoImg   from '../assets/logo1.png'
import mascotImg from '../assets/mascota.png'

// ── helpers ──────────────────────────────────────────────────────────────
function pwStrength(pwd: string): 0 | 1 | 2 | 3 {
  if (pwd.length < 6)  return 0
  let s = 1
  if (pwd.length >= 8) s++
  if (/[A-Z]/.test(pwd) && /[0-9!@#$%^&*]/.test(pwd)) s++
  return s as 0 | 1 | 2 | 3
}

type Step = 1 | 2 | 3

// ── Chip selector button ─────────────────────────────────────────────────
function Chip({ label, selected, onClick }: {
  label: string; selected: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '9px 12px',
        borderRadius: 12,
        border: `2px solid ${selected ? 'var(--color-navy)' : 'var(--color-border)'}`,
        background: selected ? 'var(--color-navy)' : 'var(--color-gray-light)',
        color: selected ? '#fff' : 'var(--color-text-muted)',
        fontSize: 13, fontWeight: 600,
        fontFamily: 'var(--font-body)', cursor: 'pointer',
        transition: 'all 150ms ease',
        transform: selected ? 'scale(1.03)' : 'scale(1)',
        textAlign: 'center',
      }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)' }}
      onMouseUp={e => { e.currentTarget.style.transform = selected ? 'scale(1.03)' : 'scale(1)' }}
      onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.95)' }}
      onTouchEnd={e => { e.currentTarget.style.transform = selected ? 'scale(1.03)' : 'scale(1)' }}
    >
      {label}
    </button>
  )
}

// ── Styled input ─────────────────────────────────────────────────────────
function FieldInput({
  id, type = 'text', icon, value, onChange, placeholder, autoComplete, inputMode, rightSlot,
}: {
  id: string; type?: string; icon: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  autoComplete?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  rightSlot?: React.ReactNode;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <i className={icon} style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--color-gray-mid)', fontSize: 16, pointerEvents: 'none',
      }} />
      <input
        id={id} type={type} autoComplete={autoComplete} inputMode={inputMode}
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', height: 52, borderRadius: 14,
          border: '2px solid var(--color-border)',
          paddingLeft: 42, paddingRight: rightSlot ? 48 : 14, fontSize: 16,
          fontFamily: 'var(--font-body)', color: 'var(--color-text)',
          background: 'var(--color-gray-light)', outline: 'none',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'var(--color-navy)'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,43,110,0.1)'
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      />
      {rightSlot}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────
export default function RegisterPage() {
  const { t, i18n } = useTranslation()
  const navigate      = useNavigate()

  // Step state
  const [step, setStep]           = useState<Step>(1)
  const [direction, setDirection] = useState<'fwd' | 'back'>('fwd')

  // Auth state
  const [fbUser, setFbUser]     = useState<User | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Step 1 — account
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirmPw, setConfirmPw]     = useState('')
  const [showPw, setShowPw]           = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  // Step 2 — profile
  const [firstName, setFirstName]     = useState('')
  const [lastName, setLastName]       = useState('')
  const [gender, setGender]           = useState('')
  const [nationality, setNationality] = useState('')
  const [ageRange, setAgeRange]       = useState('')
  const [prefLang, setPrefLang]       = useState<'es' | 'en'>(
    i18n.language === 'en' ? 'en' : 'es'
  )

  // Step 3 — rules
  const [accepted, setAccepted] = useState(false)

  function toggleLang() {
    i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')
  }

  function goForward(to: Step) {
    setDirection('fwd')
    setStep(to)
    setError(null)
  }

  function goBack(to: Step) {
    setDirection('back')
    setStep(to)
    setError(null)
  }

  // ── Step 1: create Firebase account with email ─────────────────────────
  async function handleEmailNext() {
    setError(null)
    if (!email.includes('@')) { setError(t('register.err_email')); return }
    if (password.length < 8)  { setError(t('register.pw_short')); return }
    if (password !== confirmPw) { setError(t('register.pw_mismatch')); return }

    setLoading(true)
    try {
      const user = await registerWithEmail(email, password)
      setFbUser(user)
      goForward(2)
    } catch (err) {
      const code = (err as AuthError).code
      setError(
        code === 'auth/email-already-in-use' ? t('register.err_exists')
        : code === 'auth/invalid-email'      ? t('register.err_email')
        : code === 'auth/weak-password'      ? t('register.err_weak_pw')
        : t('register.err_generic'),
      )
    } finally {
      setLoading(false)
    }
  }

  // ── Step 1: create account with Google or Apple ────────────────────────
  async function handleSocial(provider: 'google' | 'apple') {
    setError(null)
    setLoading(true)
    try {
      const { user, isNew } = provider === 'google'
        ? await signUpWithGoogle()
        : await signUpWithApple()

      if (!isNew) {
        navigate('/map', { replace: true })
        return
      }

      // Pre-fill from social profile
      if (user.email) setEmail(user.email)
      if (user.displayName) {
        const parts = user.displayName.split(' ')
        setFirstName(parts[0] || '')
        setLastName(parts.slice(1).join(' ') || '')
      }
      setFbUser(user)
      goForward(2)
    } catch (err) {
      const code = (err as AuthError).code
      if (code !== 'auth/popup-closed-by-user') {
        setError(t('register.err_generic'))
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: validate profile fields ───────────────────────────────────
  function handleProfileNext() {
    if (!firstName.trim() || !lastName.trim() || !gender || !nationality.trim() || !ageRange) {
      setError(t('register.fill_all'))
      return
    }
    setError(null)
    goForward(3)
  }

  // ── Step 3: save profile + redirect ────────────────────────────────────
  async function handleFinish() {
    if (!accepted) { setError(t('register.must_accept')); return }
    if (!fbUser)   { setError(t('register.err_generic')); return }

    setLoading(true)
    setError(null)
    try {
      await savePlayerProfile(fbUser.uid, {
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        gender, nationality: nationality.trim(),
        ageRange, preferredLang: prefLang,
        email: email || fbUser.email || '',
      })
      navigate('/map', { replace: true })
    } catch (err) {
      console.error('[RegisterPage] savePlayerProfile failed:', err)
      const code = (err as { code?: string }).code
      if (code === 'permission-denied') {
        setError('Sin permiso para guardar el perfil. Revisa las reglas de Firestore.')
      } else {
        setError(t('register.err_generic'))
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Hero data per step ─────────────────────────────────────────────────
  const heroMeta: Record<Step, { subtitle: string; badges: string[]; accent: string }> = {
    1: { subtitle: t('register.subtitle_1'), badges: ['🗺️', '🎯', '🏆'], accent: 'var(--color-yellow)' },
    2: { subtitle: t('register.subtitle_2'), badges: ['✏️', '👤', '🌍'], accent: 'var(--color-teal)' },
    3: { subtitle: t('register.subtitle_3'), badges: ['📋', '✅', '🚀'], accent: 'var(--color-orange)' },
  }
  const hero = heroMeta[step]

  const strength      = pwStrength(password)
  const strengthLabel = [t('register.pw_weak'), t('register.pw_weak'), t('register.pw_fair'), t('register.pw_strong')][strength]
  const strengthColor = ['var(--color-error)', 'var(--color-error)', 'var(--color-warning)', 'var(--color-success)'][strength]

  const genderOpts  = [
    { key: 'M',    label: t('register.g_male') },
    { key: 'F',    label: t('register.g_female') },
    { key: 'NB',   label: t('register.g_nb') },
    { key: 'PNTS', label: t('register.g_pnts') },
  ]
  const ageOpts = [
    { key: '<12',  label: t('register.age_u12') },
    { key: '12-17',label: t('register.age_12') },
    { key: '18-24',label: t('register.age_18') },
    { key: '25-34',label: t('register.age_25') },
    { key: '35-44',label: t('register.age_35') },
    { key: '45-54',label: t('register.age_45') },
    { key: '55+',  label: t('register.age_55') },
  ]

  return (
    <div
      className="rp-outer"
      style={{
        minHeight: '100dvh',
        display: 'flex', flexDirection: 'column',
        background: 'var(--color-navy)',
        fontFamily: 'var(--font-body)',
        overflow: 'hidden',
        position: 'relative',
        paddingTop: 'var(--safe-top)',
      }}
    >
      {/* ── Decorative blobs ──────────────────────────────────── */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 240, height: 240, borderRadius: '50%', background: 'rgba(43,191,184,0.18)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 100, left: -50, width: 160, height: 160, borderRadius: '50%', background: 'rgba(245,200,0,0.10)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '52dvh', left: '50%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(27,43,110,0.6)', transform: 'translate(-50%, 50%)', pointerEvents: 'none' }} />

      {/* ── Floating stars ────────────────────────────────────── */}
      {[
        { top: '8%', left: '8%', size: 14, color: 'rgba(245,200,0,0.7)', delay: '0s' },
        { top: '18%', right: '22%', size: 10, color: 'rgba(43,191,184,0.6)', delay: '0.4s' },
        { top: '28%', left: '55%', size: 8, color: 'rgba(255,255,255,0.4)', delay: '0.8s' },
        { top: '6%', left: '40%', size: 12, color: 'rgba(244,118,43,0.5)', delay: '0.2s' },
      ].map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: s.top, left: (s as { left?: string }).left,
          right: (s as { right?: string }).right,
          width: s.size, height: s.size, borderRadius: '50%',
          background: s.color,
          animation: `twinkle 2.5s ${s.delay} infinite alternate ease-in-out`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* ── Language toggle ───────────────────────────────────── */}
      <button
        onClick={toggleLang}
        aria-label="Switch language"
        style={{
          position: 'absolute', top: 'calc(var(--safe-top) + 14px)', right: 16,
          zIndex: 20, background: 'rgba(255,255,255,0.15)',
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

      {/* ── Card wrapper (single col → two col on desktop) ───── */}
      <div className="rp-card">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <div
          className="rp-hero"
          style={{
            flex: '0 0 auto',
            minHeight: '40dvh',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            paddingTop: 'calc(var(--safe-top) + 36px)',
            paddingLeft: 24, paddingRight: 0, paddingBottom: 20,
            position: 'relative', zIndex: 1,
          }}
        >
          {/* Left — logo + info + step pills */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 8 }}>

            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: '#fff', padding: 5,
              boxShadow: '0 0 0 3px rgba(245,200,0,0.5), 0 0 0 6px rgba(245,200,0,0.2), 0 12px 32px rgba(0,0,0,0.3)',
            }}>
              <img src={logoImg} alt="Turizoneando" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
            </div>

            <div key={step} className="rp-hero-text">
              <h1 style={{
                fontFamily: 'var(--font-display)',
                color: hero.accent,
                fontSize: 30, margin: 0, lineHeight: 1.1,
                letterSpacing: 0.5,
                textShadow: '0 2px 16px rgba(0,0,0,0.2)',
                transition: 'color 300ms ease',
              }}>
                {t('register.title')}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '4px 0 0', letterSpacing: 0.3 }}>
                {hero.subtitle}
              </p>
            </div>

            {/* Step progress pills */}
            <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
              {([1, 2, 3] as Step[]).map(s => (
                <div key={s} style={{
                  height: 7, borderRadius: 4,
                  width: step === s ? 24 : 8,
                  background: step >= s ? hero.accent : 'rgba(255,255,255,0.2)',
                  transition: 'all 350ms cubic-bezier(0.34,1.56,0.64,1)',
                }} />
              ))}
            </div>

            {/* Emoji badges */}
            <div style={{ display: 'flex', gap: 6 }}>
              {hero.badges.map((b, i) => (
                <span key={i} style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 20, padding: '3px 8px', fontSize: 13,
                }}>
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Right — mascot */}
          <div style={{ flexShrink: 0, width: 130, height: 190, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', overflow: 'hidden' }}>
            <img
              src={mascotImg} alt="Mascota Turizoneando"
              style={{
                height: '100%', width: 'auto', objectFit: 'contain', objectPosition: 'bottom center',
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 28%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 28%)',
                filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))',
              }}
            />
          </div>
        </div>

        {/* ── Form card ─────────────────────────────────────────── */}
        <div
          className="animate-slide-up rp-form"
          style={{
            flex: 1,
            background: 'var(--color-surface)',
            borderRadius: '28px 28px 0 0',
            boxShadow: '0 -8px 40px rgba(27,43,110,0.25)',
            position: 'relative', zIndex: 5, overflow: 'hidden',
          }}
        >
          {/* Accent strip */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: 'linear-gradient(90deg, var(--color-teal), var(--color-yellow), var(--color-orange))',
          }} />

          <div style={{
            padding: '20px 20px',
            paddingBottom: 'calc(var(--safe-bottom) + 20px)',
            display: 'flex', flexDirection: 'column', gap: 0,
            overflowY: 'auto', maxHeight: '62dvh',
          }}>

            {/* Drag handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)', margin: '0 auto 16px' }} />

            {/* ── Step indicator ──────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 18 }}>
              {([1, 2, 3] as Step[]).map((s, i) => (
                <Fragment key={s}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: step >= s ? 'var(--color-navy)' : 'transparent',
                      border: `2.5px solid ${step >= s ? 'var(--color-navy)' : 'var(--color-border)'}`,
                      color: step >= s ? '#fff' : 'var(--color-gray-mid)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800,
                      transition: 'all 300ms ease',
                    }}>
                      {step > s
                        ? <i className="ri-check-line" style={{ fontSize: 13 }} />
                        : s}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
                      color: step >= s ? 'var(--color-navy)' : 'var(--color-gray-mid)',
                      transition: 'color 300ms ease',
                    }}>
                      {[t('register.step1'), t('register.step2'), t('register.step3')][i]}
                    </span>
                  </div>
                  {i < 2 && (
                    <div style={{
                      width: 30, height: 2, marginBottom: 14, flexShrink: 0, alignSelf: 'center',
                      background: step > s ? 'var(--color-navy)' : 'var(--color-border)',
                      transition: 'background 300ms ease',
                    }} />
                  )}
                </Fragment>
              ))}
            </div>

            {/* ── Step content (animated on change) ────────────── */}
            <div
              key={step}
              className={direction === 'fwd' ? 'rp-step-fwd' : 'rp-step-back'}
              style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
            >

              {/* Step title */}
              <h2 style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-navy)', fontSize: 22,
                margin: '0 0 14px',
              }}>
                {[t('register.step1_title'), t('register.step2_title'), t('register.step3_title')][step - 1]}
              </h2>

              {/* ════ STEP 1 ════════════════════════════════════════════ */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {/* Email */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label htmlFor="reg-email" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                      {t('register.email')}
                    </label>
                    <FieldInput
                      id="reg-email" type="email" icon="ri-mail-line"
                      value={email} onChange={setEmail}
                      autoComplete="email" inputMode="email"
                    />
                  </div>

                  {/* Password */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label htmlFor="reg-pw" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                      {t('register.password')}
                    </label>
                    <FieldInput
                      id="reg-pw" type={showPw ? 'text' : 'password'} icon="ri-lock-line"
                      value={password} onChange={setPassword}
                      autoComplete="new-password"
                      rightSlot={
                        <button
                          type="button" onClick={() => setShowPw(v => !v)}
                          aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          style={{
                            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', color: 'var(--color-gray-mid)',
                            cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
                          }}
                        >
                          <i className={showPw ? 'ri-eye-off-line' : 'ri-eye-line'} style={{ fontSize: 18 }} />
                        </button>
                      }
                    />
                    {/* Strength bar */}
                    {password.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {[1, 2, 3].map(i => (
                          <div key={i} style={{
                            flex: 1, height: 4, borderRadius: 2,
                            background: i <= strength ? strengthColor : 'var(--color-border)',
                            transition: 'background 200ms ease',
                          }} />
                        ))}
                        <span style={{ fontSize: 11, fontWeight: 700, color: strengthColor, marginLeft: 4 }}>
                          {strengthLabel}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label htmlFor="reg-confirm" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                      {t('register.confirm_pw')}
                    </label>
                    <FieldInput
                      id="reg-confirm" type={showConfirmPw ? 'text' : 'password'} icon="ri-lock-2-line"
                      value={confirmPw} onChange={setConfirmPw}
                      autoComplete="new-password"
                      rightSlot={
                        <button
                          type="button" onClick={() => setShowConfirmPw(v => !v)}
                          aria-label="Toggle confirm password visibility"
                          style={{
                            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', color: 'var(--color-gray-mid)',
                            cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
                          }}
                        >
                          <i className={showConfirmPw ? 'ri-eye-off-line' : 'ri-eye-line'} style={{ fontSize: 18 }} />
                        </button>
                      }
                    />
                    {confirmPw.length > 0 && confirmPw !== password && (
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--color-error)', fontWeight: 600 }}>
                        <i className="ri-error-warning-line" /> {t('register.pw_mismatch')}
                      </p>
                    )}
                  </div>

                  {/* Error */}
                  {error && <ErrorBanner message={error} />}

                  {/* Next CTA */}
                  <button
                    type="button" onClick={handleEmailNext} disabled={loading}
                    style={ctaStyle(loading)}
                    onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.97)' }}
                    onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                    onTouchStart={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.97)' }}
                    onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
                  >
                    {loading
                      ? <><i className="ri-loader-4-line" style={{ animation: 'spin 0.8s linear infinite' }} /> {t('register.loading')}</>
                      : <>{t('register.next')} <i className="ri-arrow-right-line" /></>
                    }
                  </button>

                  {/* Divider */}
                  <Divider label={t('register.or')} />

                  {/* Social buttons */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <SocialBtn type="google" disabled={loading} onClick={() => handleSocial('google')} />
                    <SocialBtn type="apple"  disabled={loading} onClick={() => handleSocial('apple')} />
                  </div>

                  {/* Login link */}
                  <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)', margin: '8px 0 0' }}>
                    {t('register.has_account')}{' '}
                    <Link to="/login" style={{ color: 'var(--color-navy)', fontWeight: 800, textDecoration: 'none' }}>
                      {t('register.login_link')}
                    </Link>
                  </p>
                </div>
              )}

              {/* ════ STEP 2 ════════════════════════════════════════════ */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Nombre + Apellido */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label htmlFor="reg-fname" style={labelStyle}>{t('register.firstName')}</label>
                      <FieldInput id="reg-fname" icon="ri-user-line" value={firstName} onChange={setFirstName} autoComplete="given-name" />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label htmlFor="reg-lname" style={labelStyle}>{t('register.lastName')}</label>
                      <FieldInput id="reg-lname" icon="ri-user-line" value={lastName} onChange={setLastName} autoComplete="family-name" />
                    </div>
                  </div>

                  {/* Género */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={labelStyle}>{t('register.gender')}</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {genderOpts.map(opt => (
                        <Chip key={opt.key} label={opt.label} selected={gender === opt.key} onClick={() => setGender(opt.key)} />
                      ))}
                    </div>
                  </div>

                  {/* Nacionalidad */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label htmlFor="reg-nat" style={labelStyle}>{t('register.nationality')}</label>
                    <FieldInput
                      id="reg-nat" icon="ri-map-pin-2-line"
                      value={nationality} onChange={setNationality}
                      placeholder={t('register.nat_hint')}
                      autoComplete="country-name"
                    />
                  </div>

                  {/* Rango de edad */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={labelStyle}>{t('register.age_range')}</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {ageOpts.map(opt => (
                        <Chip key={opt.key} label={opt.label} selected={ageRange === opt.key} onClick={() => setAgeRange(opt.key)} />
                      ))}
                    </div>
                  </div>

                  {/* Idioma preferido */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={labelStyle}>{t('register.lang_pref')}</span>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {(['es', 'en'] as const).map(l => (
                        <button
                          key={l} type="button" onClick={() => setPrefLang(l)}
                          style={{
                            flex: 1, height: 52, borderRadius: 14,
                            border: `2px solid ${prefLang === l ? 'var(--color-navy)' : 'var(--color-border)'}`,
                            background: prefLang === l ? 'var(--color-navy)' : 'var(--color-gray-light)',
                            color: prefLang === l ? '#fff' : 'var(--color-text-muted)',
                            fontSize: 14, fontWeight: 700,
                            fontFamily: 'var(--font-body)', cursor: 'pointer',
                            transition: 'all 150ms ease',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          }}
                          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
                          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                          onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
                          onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
                        >
                          <i className="ri-global-line" style={{ fontSize: 16 }} />
                          {l === 'es' ? t('register.lang_es') : t('register.lang_en')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Error */}
                  {error && <ErrorBanner message={error} />}

                  {/* Nav buttons */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button type="button" onClick={() => goBack(1)} style={backBtnStyle}>
                      <i className="ri-arrow-left-line" /> {t('register.back')}
                    </button>
                    <button
                      type="button" onClick={handleProfileNext}
                      style={{ ...ctaStyle(false), flex: 1 }}
                      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
                      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                      onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
                      onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
                    >
                      {t('register.next')} <i className="ri-arrow-right-line" />
                    </button>
                  </div>
                </div>
              )}

              {/* ════ STEP 3 ════════════════════════════════════════════ */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Rules card */}
                  <div style={{
                    background: 'var(--color-gray-light)',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: 16, padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--color-navy)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <i className="ri-file-list-3-line" style={{ color: '#fff', fontSize: 15 }} />
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-navy)' }}>
                        {t('register.rules_title')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {t('register.rules_body').split('\n').map((line, i) => (
                        <p key={i} style={{
                          margin: 0, fontSize: 13,
                          color: line.startsWith('•') ? 'var(--color-text)' : 'var(--color-text-muted)',
                          fontWeight: line.startsWith('•') ? 600 : 400,
                        }}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Accept checkbox */}
                  <label
                    style={{
                      display: 'flex', gap: 12, alignItems: 'flex-start',
                      cursor: 'pointer', padding: '12px 14px',
                      borderRadius: 14,
                      border: `2px solid ${accepted ? 'var(--color-navy)' : 'var(--color-border)'}`,
                      background: accepted ? 'rgba(27,43,110,0.05)' : 'var(--color-gray-light)',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                      border: `2px solid ${accepted ? 'var(--color-navy)' : 'var(--color-border)'}`,
                      background: accepted ? 'var(--color-navy)' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 150ms ease',
                    }}>
                      {accepted && <i className="ri-check-line" style={{ color: '#fff', fontSize: 13 }} />}
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.5, fontWeight: 600 }}>
                      {t('register.accept')}
                    </span>
                    <input
                      type="checkbox" checked={accepted}
                      onChange={e => setAccepted(e.target.checked)}
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                    />
                  </label>

                  {/* Error */}
                  {error && <ErrorBanner message={error} />}

                  {/* Nav buttons */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button type="button" onClick={() => goBack(2)} style={backBtnStyle} disabled={loading}>
                      <i className="ri-arrow-left-line" /> {t('register.back')}
                    </button>
                    <button
                      type="button" onClick={handleFinish} disabled={loading || !accepted}
                      style={{ ...ctaStyle(loading || !accepted), flex: 1 }}
                      onMouseDown={e => { if (!loading && accepted) e.currentTarget.style.transform = 'scale(0.97)' }}
                      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                      onTouchStart={e => { if (!loading && accepted) e.currentTarget.style.transform = 'scale(0.97)' }}
                      onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
                    >
                      {loading
                        ? <><i className="ri-loader-4-line" style={{ animation: 'spin 0.8s linear infinite' }} /> {t('register.saving')}</>
                        : <><i className="ri-rocket-line" style={{ fontSize: 16 }} /> {t('register.finish')}</>
                      }
                    </button>
                  </div>
                </div>
              )}

            </div>{/* /step content */}
          </div>{/* /inner scroll */}
        </div>{/* /form card */}

      </div>{/* /rp-card */}

      <style>{`
        @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes twinkle { from { opacity: 0.3; transform: scale(0.8); } to { opacity: 1; transform: scale(1.2); } }
        @keyframes stepFwd  { from { opacity: 0; transform: translateX(22px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes stepBack { from { opacity: 0; transform: translateX(-22px); } to { opacity: 1; transform: translateX(0); } }

        .rp-step-fwd  { animation: stepFwd  0.25s ease-out; }
        .rp-step-back { animation: stepBack 0.25s ease-out; }

        .rp-hero-text { animation: stepFwd 0.35s ease-out; }

        .rp-card {
          display: flex; flex-direction: column; width: 100%; flex: 1;
        }

        @media (min-width: 600px) {
          .rp-outer {
            align-items: center; justify-content: center;
            padding: 32px 24px;
            background: #07101f !important;
          }
          .rp-card {
            flex: 0 0 auto; max-width: 480px; width: 100%;
            border-radius: 28px; overflow: hidden;
            box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.09);
            background: var(--color-navy);
          }
          .rp-hero {
            min-height: 210px !important;
            padding-top: 36px !important;
            background: linear-gradient(145deg, #1e306e 0%, var(--color-navy) 100%) !important;
          }
          .rp-form { border-radius: 0 !important; max-height: none !important; }
        }

        @media (min-width: 900px) {
          .rp-card { flex-direction: row; max-width: 880px; min-height: 620px; }
          .rp-hero {
            flex: 1; min-height: 0 !important;
            padding: 48px 36px 36px !important;
            justify-content: center !important;
          }
          .rp-form {
            width: 440px; flex-shrink: 0; flex: none;
            overflow-y: auto; max-height: none !important;
          }
          .rp-form > div { max-height: none !important; }
        }
      `}</style>
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────
function ErrorBanner({ message }: { message: string }) {
  return (
    <p role="alert" style={{
      margin: 0, padding: '10px 14px', borderRadius: 12,
      background: 'rgba(230,51,41,0.07)', border: '1.5px solid rgba(230,51,41,0.2)',
      color: 'var(--color-error)', fontSize: 13,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <i className="ri-error-warning-line" style={{ flexShrink: 0, fontSize: 16 }} />
      {message}
    </p>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
      <span style={{ fontSize: 11, color: 'var(--color-gray-mid)', fontWeight: 600 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
    </div>
  )
}

function SocialBtn({ type, disabled, onClick }: { type: 'google' | 'apple'; disabled: boolean; onClick: () => void }) {
  const isGoogle = type === 'google'
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      style={{
        flex: 1, height: 52, borderRadius: 16,
        background: isGoogle ? '#fff' : '#000',
        border: isGoogle ? '2px solid var(--color-border)' : '2px solid #000',
        color: isGoogle ? 'var(--color-text)' : '#fff',
        fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'transform 150ms ease',
        boxShadow: isGoogle ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
      }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
      onTouchStart={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)' }}
      onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {isGoogle
        ? (
          <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
          </svg>
        )
        : <i className="ri-apple-fill" style={{ fontSize: 19, lineHeight: 1 }} />
      }
      {isGoogle ? 'Google' : 'Apple'}
    </button>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)',
}

function ctaStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '100%', height: 54, borderRadius: 16,
    background: disabled ? 'var(--color-gray-mid)' : 'var(--color-yellow)',
    color: disabled ? '#fff' : 'var(--color-navy)',
    fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-body)',
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'transform 150ms ease, box-shadow 150ms ease',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    boxShadow: disabled ? 'none' : '0 6px 20px rgba(245,200,0,0.45)',
    letterSpacing: 0.3,
  }
}

const backBtnStyle: React.CSSProperties = {
  height: 54, paddingLeft: 16, paddingRight: 16,
  borderRadius: 16,
  background: 'var(--color-gray-light)',
  border: '2px solid var(--color-border)',
  color: 'var(--color-text-muted)',
  fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
  transition: 'transform 150ms ease',
  flexShrink: 0,
}
