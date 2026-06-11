import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../config/firebase'
import { updateSelfAdminProfile } from '../../services/adminService'
import ImageUpload from '../../components/ImageUpload'


export default function SettingsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Form states
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [photoURL, setPhotoURL] = useState('')

  // UI States
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [imageError, setImageError] = useState(false)

  // Modals
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Populate data when loaded
  useEffect(() => {
    const user = auth.currentUser
    if (user) {
      setDisplayName(user.displayName || '')
      setEmail(user.email || '')
      setPhotoURL(user.photoURL || '')
    }
  }, [])

  // Handle updates
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setMessage(null)

    try {
      const result = await updateSelfAdminProfile({
        displayName,
        photoURL,
        email
      })

      if (result.success) {
        if (auth.currentUser) {
          await auth.currentUser.reload()
          await auth.currentUser.getIdToken(true)
        }
        window.dispatchEvent(new Event('admin-profile-updated'))
        setMessage({
          type: 'success',
          text: t('adminSettings.successUpdate')
        })
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : t('login.errorGeneric')
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle deactivation
  async function handleConfirmDeactivate() {
    setLoading(true)
    setMessage(null)
    setShowDeactivateModal(false)

    try {
      const result = await updateSelfAdminProfile({ deactivate: true })
      if (result.success) {
        await signOut(auth)
        navigate('/admin/login')
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : t('login.errorGeneric')
      })
      setLoading(false)
    }
  }

  // Handle deletion
  async function handleConfirmDelete() {
    setLoading(true)
    setMessage(null)
    setShowDeleteModal(false)

    try {
      const result = await updateSelfAdminProfile({ deleteAccount: true })
      if (result.success) {
        await signOut(auth)
        navigate('/admin/login')
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : t('login.errorGeneric')
      })
      setLoading(false)
    }
  }

  // Get initials for profile placeholder
  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD'

  return (
    <div style={{ animation: 'fade-in 0.3s ease-out', maxWidth: 800, margin: '0 auto' }}>
      {/* Header section */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 28, margin: '0 0 4px' }}>
          {t('adminSettings.title')}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
          {t('adminSettings.subtitle')}
        </p>
      </div>

      {/* Message feedback */}
      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 12,
          marginBottom: 24,
          fontSize: 14,
          fontWeight: 500,
          border: '1px solid',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: message.type === 'success' ? 'rgba(46,125,50,0.06)' : 'rgba(198,40,40,0.06)',
          borderColor: message.type === 'success' ? 'rgba(46,125,50,0.3)' : 'rgba(198,40,40,0.3)',
          color: message.type === 'success' ? '#2e7d32' : '#c62828'
        }}>
          <i className={message.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'} style={{ fontSize: 18 }} />
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile settings card */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        marginBottom: 32
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: '0 0 4px' }}>
            {t('adminSettings.profileCardTitle')}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0 }}>
            {t('adminSettings.profileCardDesc')}
          </p>
        </div>

        <form onSubmit={handleSaveProfile} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Avatar visualizer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-navy) 0%, rgba(27,43,110,0.8) 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {photoURL && !imageError ? (
                <img
                  src={photoURL}
                  alt={displayName}
                  onError={() => setImageError(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px', color: 'var(--color-navy)', fontSize: 16, fontWeight: 700 }}>
                {displayName || 'Admin User'}
              </h4>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 13 }}>
                {email}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%' }}>
            {/* Display Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                {t('adminSettings.displayName')}
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => {
                  setDisplayName(e.target.value)
                  setImageError(false)
                }}
                style={{
                  height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                  padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none'
                }}
              />
            </div>

            {/* Email Address */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                {t('adminSettings.email')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                  padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Profile Photo Uploader */}
          <ImageUpload
            value={photoURL}
            onChange={url => {
              setPhotoURL(url)
              setImageError(false)
            }}
            storagePath="admins"
            label={t('adminSettings.photoUrl')}
          />


          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                height: 44,
                padding: '0 24px',
                borderRadius: 10,
                background: 'var(--color-navy)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(27,43,110,0.2)',
                transition: 'transform 150ms ease, box-shadow 150ms ease'
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.transform = 'none' }}
            >
              {loading && <i className="ri-loader-4-line ri-spin" />}
              {loading ? t('adminSettings.btnSaving') : t('adminSettings.btnSave')}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone Card */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        border: '1px solid rgba(198,40,40,0.2)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(198,40,40,0.1)', background: 'rgba(198,40,40,0.02)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: '#c62828', fontSize: 18, margin: 0 }}>
            Danger Zone
          </h2>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Deactivation action row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--color-navy)' }}>
                {t('adminSettings.deactivateCardTitle')}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                {t('adminSettings.deactivateCardDesc')}
              </p>
            </div>
            <button
              onClick={() => setShowDeactivateModal(true)}
              style={{
                height: 40,
                padding: '0 16px',
                borderRadius: 8,
                background: 'rgba(198,40,40,0.06)',
                color: '#c62828',
                border: '1px solid rgba(198,40,40,0.2)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 150ms ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(198,40,40,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(198,40,40,0.06)'}
            >
              {t('adminSettings.btnDeactivate')}
            </button>
          </div>

          <div style={{ height: 1, background: 'var(--color-border)' }} />

          {/* Deletion action row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--color-navy)' }}>
                {t('adminSettings.deleteCardTitle')}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                {t('adminSettings.deleteCardDesc')}
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{
                height: 40,
                padding: '0 16px',
                borderRadius: 8,
                background: '#c62828',
                color: '#fff',
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(198,40,40,0.2)',
                transition: 'transform 150ms ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              {t('adminSettings.btnDelete')}
            </button>
          </div>
        </div>
      </div>

      {/* ── CONFIRM DEACTIVATE MODAL ─────────────────── */}
      {showDeactivateModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(13,21,38,0.5)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100, padding: 16
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 16,
            width: '100%', maxWidth: 460, boxShadow: 'var(--shadow-pop)',
            overflow: 'hidden', animation: 'slide-up 0.2s ease-out'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: 0 }}>
                {t('adminSettings.confirmDeactivateTitle')}
              </h3>
              <button onClick={() => setShowDeactivateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-mid)', padding: 4 }}>
                <i className="ri-close-line" style={{ fontSize: 20 }} />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ margin: '0 0 24px', color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.5 }}>
                {t('adminSettings.confirmDeactivateDesc')}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  onClick={() => setShowDeactivateModal(false)}
                  style={{
                    height: 40, padding: '0 16px', borderRadius: 8,
                    background: 'none', border: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  {t('adminSettings.btnCancel')}
                </button>
                <button
                  onClick={handleConfirmDeactivate}
                  style={{
                    height: 40, padding: '0 16px', borderRadius: 8,
                    background: '#c62828', color: '#fff', border: 'none',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  {t('adminSettings.btnConfirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE MODAL ─────────────────── */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(13,21,38,0.5)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100, padding: 16
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 16,
            width: '100%', maxWidth: 460, boxShadow: 'var(--shadow-pop)',
            overflow: 'hidden', animation: 'slide-up 0.2s ease-out'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: '#c62828', fontSize: 18, margin: 0 }}>
                {t('adminSettings.confirmDeleteTitle')}
              </h3>
              <button onClick={() => setShowDeleteModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-mid)', padding: 4 }}>
                <i className="ri-close-line" style={{ fontSize: 20 }} />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ margin: '0 0 24px', color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.5 }}>
                {t('adminSettings.confirmDeleteDesc')}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  style={{
                    height: 40, padding: '0 16px', borderRadius: 8,
                    background: 'none', border: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  {t('adminSettings.btnCancel')}
                </button>
                <button
                  onClick={handleConfirmDelete}
                  style={{
                    height: 40, padding: '0 16px', borderRadius: 8,
                    background: '#c62828', color: '#fff', border: 'none',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  {t('adminSettings.btnConfirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
