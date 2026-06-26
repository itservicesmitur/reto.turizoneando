import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { changePassword } from '../../../services/authService'
import { auth } from '../../../config/firebase'

interface Props { onBack: () => void }

type FieldKey = 'current' | 'next' | 'confirm'

const ERRORS: Record<string, string> = {
  'auth/wrong-password':        'map.err_wrong_password',
  'auth/invalid-credential':    'map.err_wrong_password',
  'auth/too-many-requests':     'map.err_too_many_requests',
  'auth/requires-recent-login': 'map.err_requires_recent_login',
  'auth/weak-password':         'map.err_weak_password_min_6',
  'no-email':                   'map.err_no_password_account',
}

const fieldStyle: React.CSSProperties = {
  background: '#f8fffe',
  border: '1.5px solid rgba(0,187,180,0.22)',
  color: '#096d7d',
  borderRadius: '8px',
}

export default function ChangePassword({ onBack }: Props) {
  const { t } = useTranslation()

  const [values,   setValues]   = useState({ current: '', next: '', confirm: '' })
  const [show,     setShow]     = useState({ current: false, next: false, confirm: false })
  const [saving,   setSaving]   = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const strength = values.next.length === 0 ? 0 : values.next.length < 6 ? 1 : values.next.length < 10 ? 2 : 3
  const strengthColors = ['transparent', '#e0344b', '#ff9447', '#00bbb4']
  const strengthLabels = ['', t('register.pw_weak'), t('register.pw_fair'), t('register.pw_strong')]

  const fields: { key: FieldKey; label: string }[] = [
    { key: 'current', label: t('map.current_password') },
    { key: 'next',    label: t('map.new_password') },
    { key: 'confirm', label: t('map.confirm_new_password') },
  ]

  const isEmailUser = auth.currentUser?.providerData.some(p => p.providerId === 'password')

  const handleSave = async () => {
    setErrorMsg(null)

    if (!isEmailUser) { setErrorMsg(ERRORS['no-email']); return }
    if (!values.current) { setErrorMsg('map.err_enter_current_password'); return }
    if (values.next.length < 6) { setErrorMsg('map.err_weak_password_min_6'); return }
    if (values.next !== values.confirm) { setErrorMsg('map.err_passwords_mismatch'); return }

    setSaving(true)
    try {
      await changePassword(values.current, values.next)
      setSuccess(true)
      setValues({ current: '', next: '', confirm: '' })
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) {
      const code: string = e?.code || e?.message || ''
      setErrorMsg(ERRORS[code] || 'map.err_password_change_failed')
    } finally {
      setSaving(false)
    }
  }

  const labelCls = 'text-[10px] font-black uppercase tracking-wider block mb-1.5'
  const inputCls = 'w-full px-4 py-3 pr-12 text-sm font-semibold outline-none transition-all'

  return (
    <div
      className="fixed inset-0 z-60 flex flex-col menu-view-slide-in"
      style={{ background: 'linear-gradient(to bottom, #075f6e 0%, #00bbb4 100%)' }}
    >
      {/* ── Zona teal ── */}
      <div className="shrink-0 px-5 pt-7">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            <i className="ri-arrow-left-line text-xl text-white" />
          </button>
          <span className="font-black text-sm text-white tracking-widest uppercase">
            {t('map.menu_change_password')}
          </span>
          <div className="w-10" />
        </div>

        {/* Ícono candado */}
        <div className="flex flex-col items-center gap-2 pb-10">
          <div
            className="h-24 w-24 rounded-full flex items-center justify-center"
            style={{ border: '4px solid #ffffff', boxShadow: '0 8px 28px rgba(0,0,0,0.22)', background: 'linear-gradient(135deg,#18d5cd 0%,#096d7d 100%)' }}
          >
            <i className="ri-lock-password-line text-4xl text-white" />
          </div>

          {!isEmailUser && (
            <p className="text-xs font-semibold mt-2 text-center px-4" style={{ color: 'rgba(255,220,180,0.9)' }}>
              {t('map.social_account_no_password')}
            </p>
          )}
        </div>
      </div>

      {/* ── Card blanca ── */}
      <div
        className="flex-1 min-h-0 rounded-t-3xl flex flex-col overflow-hidden"
        style={{ background: '#ffffff', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)' }}
      >
        <div className="flex-1 overflow-y-auto px-5 pt-8 pb-6 space-y-4 min-h-0" style={{ scrollbarWidth: 'none' }}>

          {/* Aviso cuenta social */}
          {!isEmailUser && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg" style={{ background: 'rgba(255,148,71,0.08)', border: '1px solid rgba(255,148,71,0.3)' }}>
              <i className="ri-alert-line shrink-0" style={{ color: '#ff9447' }} />
              <p className="text-xs font-semibold" style={{ color: '#ff9447' }}>
                {t('map.social_account_change_disabled')}
              </p>
            </div>
          )}

          {fields.map(f => (
            <div key={f.key}>
              <label className={labelCls} style={{ color: 'rgba(9,109,125,0.55)' }}>{f.label}</label>
              <div className="relative">
                <input
                  type={show[f.key] ? 'text' : 'password'}
                  value={values[f.key]}
                  onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                  disabled={!isEmailUser}
                  className={inputCls}
                  style={{
                    ...fieldStyle,
                    opacity: isEmailUser ? 1 : 0.5,
                    paddingRight: f.key === 'next' && values.next.length > 0 ? '88px' : '48px',
                  }}
                />
                {f.key === 'next' && values.next.length > 0 && (
                  <span
                    className="absolute top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-wide transition-colors duration-300 pointer-events-none"
                    style={{ right: '44px', color: strengthColors[strength] }}
                  >
                    {strengthLabels[strength]}
                  </span>
                )}
                <button
                  onClick={() => setShow(s => ({ ...s, [f.key]: !s[f.key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-all active:scale-90"
                  style={{ color: '#00bbb4' }}
                >
                  <i className={show[f.key] ? 'ri-eye-off-line text-lg' : 'ri-eye-line text-lg'} />
                </button>
              </div>
            </div>
          ))}

          {/* Feedback */}
          {errorMsg && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg animate-fade-in" style={{ background: 'rgba(224,52,75,0.08)', border: '1px solid rgba(224,52,75,0.25)' }}>
              <i className="ri-error-warning-line shrink-0" style={{ color: '#e0344b' }} />
              <p className="text-xs font-semibold" style={{ color: '#e0344b' }}>{t(errorMsg)}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg animate-fade-in" style={{ background: 'rgba(0,187,180,0.08)', border: '1px solid rgba(0,187,180,0.3)' }}>
              <i className="ri-checkbox-circle-fill shrink-0" style={{ color: '#00bbb4' }} />
              <p className="text-xs font-semibold" style={{ color: '#096d7d' }}>{t('map.success_password_update')}</p>
            </div>
          )}
        </div>

        {/* Botón guardar */}
        <div className="px-5 pb-8 pt-3 shrink-0" style={{ borderTop: '1px solid rgba(0,187,180,0.12)' }}>
          <button
            onClick={handleSave}
            disabled={saving || !isEmailUser}
            className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-wider text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(180deg,#18d5cd 0%,#00bbb4 45%,#096d7d 100%)', border: '2px solid #0c7f89', boxShadow: 'inset 0 2px 0 rgba(255,255,255,.35), 0 6px 0 #054f5c, 0 12px 22px rgba(9,109,125,.25)' }}
          >
            {saving
              ? <i className="ri-loader-4-line animate-spin text-xl" />
              : t('map.save_changes')}
          </button>
        </div>
      </div>
    </div>
  )
}
