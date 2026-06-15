import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import { useTranslation } from 'react-i18next'
import { savePlayerProfile } from '../services/authService'
import CountrySelect from './CountrySelect'
import StatusBlockCard from './StatusBlockCard'

type ClientStatus = 'pending' | 'auth' | 'unauth' | 'incomplete' | 'banned'
type AdminStatus  = 'pending' | 'ok'  | 'denied'

// ── Shared spinner ────────────────────────────────────────────────────────
function AuthSpinner() {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-navy)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        border: '3.5px solid rgba(255,255,255,0.12)',
        borderTopColor: 'var(--color-yellow)',
        animation: 'rg-spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes rg-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '46px',
  borderRadius: '12px',
  border: '2px solid var(--color-border)',
  padding: '0 12px',
  fontSize: '15px',
  fontFamily: 'var(--font-body)',
  color: 'var(--color-text)',
  background: 'var(--color-gray-light)',
  outline: 'none',
  boxSizing: 'border-box'
}

interface CompleteProfileFormProps {
  user: any
  onComplete: () => void
}

function CompleteProfileForm({ user, onComplete }: CompleteProfileFormProps) {
  const { t, i18n } = useTranslation()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gender, setGender] = useState('')
  const [nationality, setNationality] = useState('')
  const [ageRange, setAgeRange] = useState('')
  const [prefLang, setPrefLang] = useState<'es' | 'en'>(i18n.language === 'en' ? 'en' : 'es')
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.displayName) {
      const parts = user.displayName.split(' ')
      setFirstName(parts[0] || '')
      setLastName(parts.slice(1).join(' ') || '')
    }
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!firstName.trim()) {
      setError(t('register.err_firstname_empty'))
      return
    }
    if (!lastName.trim()) {
      setError(t('register.err_lastname_empty'))
      return
    }
    if (!nationality.trim()) {
      setError(t('register.err_nationality_empty'))
      return
    }
    if (!gender) {
      setError(t('register.err_gender_empty'))
      return
    }
    if (!ageRange.trim()) {
      setError(t('register.err_age_empty'))
      return
    }
    const ageNum = parseInt(ageRange, 10)
    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      setError(t('register.err_age_invalid'))
      return
    }
    if (!accepted) {
      setError(t('register.must_accept'))
      return
    }
    setLoading(true)
    try {
      await savePlayerProfile(user.uid, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        nationality: nationality.trim(),
        ageRange,
        preferredLang: prefLang,
        email: user.email || '',
        photoURL: user.photoURL || undefined,
      })
      onComplete()
    } catch (err) {
      console.error('[CompleteProfileForm] failed:', err)
      setError(t('register.err_generic'))
    } finally {
      setLoading(false)
    }
  }

  const genderOpts = [
    { key: 'M', label: t('register.g_male') },
    { key: 'F', label: t('register.g_female') },
    { key: 'NB', label: t('register.g_nb') },
    { key: 'PNTS', label: t('register.g_pnts') },
  ]

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-navy)',
      fontFamily: 'var(--font-body)',
      padding: '20px',
      boxSizing: 'border-box',
      position: 'relative',
      overflowY: 'auto'
    }}>
      {/* Background blobs */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 240, height: 240, borderRadius: '50%', background: 'rgba(43,191,184,0.18)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(245,200,0,0.10)', pointerEvents: 'none' }} />

      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: 'var(--color-surface)',
        borderRadius: '24px',
        padding: '32px 24px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Accent strip */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, var(--color-teal), var(--color-yellow), var(--color-orange))',
          borderRadius: '24px 24px 0 0'
        }} />

        <h2 style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-navy)',
          fontSize: '24px',
          margin: '0 0 8px 0',
          textAlign: 'center'
        }}>
          {t('register.rules_title')}
        </h2>
        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: '13px',
          margin: '0 0 20px 0',
          textAlign: 'center'
        }}>
          {i18n.language === 'en' ? 'Complete your profile information to start playing!' : '¡Completa tu información de perfil para comenzar a jugar!'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="firstName" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                {t('register.firstName')}
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="lastName" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                {t('register.lastName')}
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="nationality" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)' }}>
              {t('register.nationality')}
            </label>
            <CountrySelect
              id="nationality"
              value={nationality}
              onChange={setNationality}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)' }}>
              {t('register.gender')}
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {genderOpts.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setGender(opt.key)}
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    border: `2px solid ${gender === opt.key ? 'var(--color-navy)' : 'var(--color-border)'}`,
                    background: gender === opt.key ? 'var(--color-navy)' : 'var(--color-gray-light)',
                    color: gender === opt.key ? '#fff' : 'var(--color-text-muted)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="ageRange" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)' }}>
              {t('register.age') || (i18n.language === 'en' ? 'Age' : 'Edad')}
            </label>
            <input
              id="ageRange"
              type="number"
              inputMode="numeric"
              value={ageRange}
              onChange={e => setAgeRange(e.target.value)}
              placeholder={i18n.language === 'en' ? 'Enter your age...' : 'Digita tu edad...'}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="prefLang" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)' }}>
              {t('register.lang_pref')}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['es', 'en'] as const).map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    setPrefLang(lang)
                    i18n.changeLanguage(lang)
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '10px',
                    border: `2px solid ${prefLang === lang ? 'var(--color-teal)' : 'var(--color-border)'}`,
                    background: prefLang === lang ? 'var(--color-teal)' : 'var(--color-gray-light)',
                    color: prefLang === lang ? '#fff' : 'var(--color-text-muted)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                >
                  {lang === 'es' ? t('register.lang_es') : t('register.lang_en')}
                </button>
              ))}
            </div>
          </div>

          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            color: 'var(--color-text)',
            marginTop: '6px'
          }}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={e => setAccepted(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer', marginTop: '1px' }}
            />
            <span>{t('register.accept')}</span>
          </label>

          {error && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'rgba(230,51,41,0.07)',
              border: '1.5px solid rgba(230,51,41,0.2)',
              color: 'var(--color-error)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <i className="ri-error-warning-line" style={{ fontSize: '15px' }} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              height: '48px',
              borderRadius: '14px',
              background: loading ? 'var(--color-gray-mid)' : 'var(--color-yellow)',
              color: 'var(--color-navy)',
              fontSize: '15px',
              fontWeight: 800,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(245,200,0,0.35)',
              transition: 'all 150ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '6px'
            }}
          >
            {loading ? (
              <i className="ri-loader-4-line" style={{ animation: 'complete-spin 0.8s linear infinite' }} />
            ) : (
              t('register.finish')
            )}
          </button>
        </form>
      </div>
      <style>{`@keyframes complete-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Client guard: any authenticated Firebase user ─────────────────────────
export function ProtectedRoute() {
  const [status,      setStatus]      = useState<ClientStatus>('pending')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [banReason,   setBanReason]   = useState<string | undefined>(undefined)

  // Ref para saber si el bloqueo ya fue detectado antes del sign-out
  // (evita que onAuthStateChanged con user=null redirija a /login en vez de mostrar la card)
  const isBannedRef = useRef(false)

  useEffect(() => {
    let unsubFirestore: (() => void) | null = null

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Limpiar listener anterior de Firestore si cambia el usuario
      if (unsubFirestore) { unsubFirestore(); unsubFirestore = null }

      if (!user) {
        setCurrentUser(null)
        // Si ya detectamos ban, NO redirigimos — la card de ban se encarga
        if (!isBannedRef.current) setStatus('unauth')
        return
      }

      setCurrentUser(user)

      // Listener en tiempo real sobre el documento del jugador
      unsubFirestore = onSnapshot(
        doc(db, 'players', user.uid),
        (snap) => {
          const data = snap.exists() ? snap.data() : null

          if (data?.banned === true || data?.active === false) {
            isBannedRef.current = true
            const reason = data.bannedReason || data.banReason || data.reason || undefined
            setBanReason(reason ? String(reason) : undefined)
            setStatus('banned')
            auth.signOut().catch(() => {})
            return
          }

          const isIncomplete = !data ||
            !data.firstName || !data.lastName ||
            !data.gender    || !data.nationality || !data.ageRange

          setStatus(isIncomplete ? 'incomplete' : 'auth')
        },
        () => {
          // Permiso denegado u otro error de red → dejar pasar sin bloquear
          setStatus('auth')
        }
      )
    })

    return () => {
      unsubAuth()
      if (unsubFirestore) unsubFirestore()
    }
  }, [])

  if (status === 'banned') {
    return (
      <StatusBlockCard
        type="user_banned"
        reason={banReason}
        onDismiss={() => {
          isBannedRef.current = false
          setBanReason(undefined)
          setStatus('unauth')
        }}
      />
    )
  }
  if (status === 'pending')    return <AuthSpinner />
  if (status === 'unauth')     return <Navigate to="/login" replace />
  if (status === 'incomplete') return <CompleteProfileForm user={currentUser} onComplete={() => setStatus('auth')} />
  return <Outlet />
}

// ── Admin guard: authenticated + custom claim role: 'Admin' ──────────────
export function AdminRoute() {
  const [status, setStatus] = useState<AdminStatus>('pending')

  useEffect(() => {
    return onAuthStateChanged(auth, async user => {
      if (!user) { setStatus('denied'); return }
      try {
        const { claims } = await user.getIdTokenResult()
        const role = (claims.role as string | undefined)?.toLowerCase()
        setStatus(role === 'admin' ? 'ok' : 'denied')
      } catch {
        setStatus('denied')
      }
    })
  }, [])

  if (status === 'pending') return <AuthSpinner />
  if (status === 'denied')  return <Navigate to="/admin/login" replace />
  return <Outlet />
}
