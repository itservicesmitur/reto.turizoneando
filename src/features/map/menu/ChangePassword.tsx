import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Props { onBack: () => void }

type FieldKey = 'current' | 'next' | 'confirm'

export default function ChangePassword({ onBack }: Props) {
  const { t } = useTranslation()
  const [values, setValues] = useState({ current: '', next: '', confirm: '' })
  const [show,   setShow]   = useState({ current: false, next: false, confirm: false })

  const strength = values.next.length === 0 ? 0 : values.next.length < 6 ? 1 : values.next.length < 10 ? 2 : 3
  const strengthColors = ['transparent', 'var(--color-map-tan)', 'var(--color-map-gold)', 'var(--color-map-gold-light)']
  const strengthLabels = ['', t('register.pw_weak'), t('register.pw_fair'), t('register.pw_strong')]

  const fields: { key: FieldKey; label: string }[] = [
    { key: 'current', label: t('map.current_password') },
    { key: 'next',    label: t('map.new_password') },
    { key: 'confirm', label: t('map.confirm_new_password') },
  ]

  return (
    <div className="fixed inset-0 z-60 flex flex-col menu-view-slide-in" style={{ background: 'var(--color-map-cream-light)' }}>
      <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold),var(--color-map-gold-light),var(--color-map-gold),transparent)' }} />

      <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(168,127,42,0.2)' }}>
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full active:scale-90 transition-all shrink-0" style={{ background: 'rgba(168,127,42,0.1)', border: '1px solid rgba(168,127,42,0.3)' }}>
          <i className="ri-arrow-left-line text-xl" style={{ color: 'var(--color-map-wood-dark)' }} />
        </button>
        <h2 className="text-sm font-black flex-1" style={{ fontFamily: 'Georgia, serif', color: 'var(--color-map-wood-dark)' }}>{t('map.menu_change_password')}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 min-h-0">
        <div className="flex justify-center py-4">
          <div className="h-16 w-16 rounded-full flex items-center justify-center border-2" style={{ background: 'linear-gradient(135deg,var(--color-map-wood-deep),var(--color-map-wood-dark))', borderColor: 'var(--color-map-gold)' }}>
            <i className="ri-lock-password-line text-2xl" style={{ color: 'var(--color-map-gold-light)' }} />
          </div>
        </div>

        {fields.map(f => (
          <div key={f.key}>
            <label className="text-[10px] font-black uppercase tracking-wider block mb-1.5" style={{ color: 'var(--color-map-gold)' }}>{f.label}</label>
            <div className="relative">
              <input
                type={show[f.key] ? 'text' : 'password'}
                value={values[f.key]}
                onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                className="w-full px-4 py-3 pr-12 rounded-xl text-sm font-semibold outline-none transition-all"
                style={{ background: 'var(--color-map-cream-light)', border: '1.5px solid rgba(168,127,42,0.3)', color: 'var(--color-map-wood-dark)' }}
              />
              <button
                onClick={() => setShow(s => ({ ...s, [f.key]: !s[f.key] }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-all active:scale-90"
                style={{ color: 'var(--color-map-gold)' }}
              >
                <i className={show[f.key] ? 'ri-eye-off-line text-lg' : 'ri-eye-line text-lg'} />
              </button>
            </div>

            {f.key === 'next' && values.next.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1 h-1.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex-1 rounded-full transition-all duration-300"
                      style={{ background: strength >= i ? strengthColors[strength] : 'rgba(168,127,42,0.15)' }}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-bold" style={{ color: strengthColors[strength] }}>
                  {strengthLabels[strength]}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 pb-8 pt-3 shrink-0" style={{ borderTop: '1px solid rgba(168,127,42,0.15)', background: 'var(--color-map-cream-light)' }}>
        <button
          className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-wider transition-all active:scale-95"
          style={{ background: 'linear-gradient(90deg,var(--color-map-wood-dark),var(--color-map-wood-mid),var(--color-map-wood-dark))', color: 'var(--color-map-gold-light)', border: '2px solid var(--color-map-gold)', boxShadow: 'inset 0 0 8px rgba(252,211,77,0.15)' }}
        >
          {t('map.save_changes')}
        </button>
      </div>

      <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold),var(--color-map-gold-light),var(--color-map-gold),transparent)' }} />
    </div>
  )
}
