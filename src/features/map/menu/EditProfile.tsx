import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CountrySelect from '../../../components/CountrySelect'

interface Props { onBack: () => void }

const GENDER_KEYS = ['g_male', 'g_female', 'g_nb', 'g_pnts'] as const

export default function EditProfile({ onBack }: Props) {
  const { t } = useTranslation()
  const [firstName,   setFirstName]   = useState('Marco')
  const [lastName,    setLastName]    = useState('Pirata')
  const [nationality, setNationality] = useState('Dominicana')
  const [gender,      setGender]      = useState('g_male')
  const [ageRange,    setAgeRange]    = useState('25–34')

  const inputCls  = 'w-full px-4 py-3 rounded-xl text-sm font-semibold outline-none transition-all'
  const inputStyle = { background: 'var(--color-map-cream-light)', border: '1.5px solid rgba(168,127,42,0.3)', color: 'var(--color-map-wood-dark)' }
  const labelCls  = 'text-[10px] font-black uppercase tracking-wider block mb-1.5'

  const chipActive = { background: 'var(--color-map-wood-dark)', color: 'var(--color-map-gold-light)', border: '1.5px solid var(--color-map-gold)' }
  const chipIdle   = { background: 'var(--color-map-cream-light)', color: 'var(--color-map-wood-dark)', border: '1.5px solid rgba(168,127,42,0.3)' }

  return (
    <div className="fixed inset-0 z-60 flex flex-col menu-view-slide-in" style={{ background: 'var(--color-map-cream-light)' }}>
      <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold),var(--color-map-gold-light),var(--color-map-gold),transparent)' }} />

      <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(168,127,42,0.2)' }}>
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full active:scale-90 transition-all shrink-0" style={{ background: 'rgba(168,127,42,0.1)', border: '1px solid rgba(168,127,42,0.3)' }}>
          <i className="ri-arrow-left-line text-xl" style={{ color: 'var(--color-map-wood-dark)' }} />
        </button>
        <h2 className="text-sm font-black flex-1" style={{ fontFamily: 'Georgia, serif', color: 'var(--color-map-wood-dark)' }}>{t('map.menu_edit_profile')}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 min-h-0">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2 py-3">
          <div className="h-20 w-20 rounded-full flex items-center justify-center border-2" style={{ background: 'linear-gradient(135deg,var(--color-map-wood-deep),var(--color-map-wood-dark))', borderColor: 'var(--color-map-gold)' }}>
            <span className="text-2xl font-black" style={{ fontFamily: 'Georgia, serif', color: 'var(--color-map-gold-light)' }}>CM</span>
          </div>
          <button className="text-xs font-bold" style={{ color: 'var(--color-map-gold)' }}>{t('map.change_photo')}</button>
        </div>

        <div>
          <label className={labelCls} style={{ color: 'var(--color-map-gold)' }}>{t('register.firstName')}</label>
          <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} style={inputStyle} />
        </div>

        <div>
          <label className={labelCls} style={{ color: 'var(--color-map-gold)' }}>{t('register.lastName')}</label>
          <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} style={inputStyle} />
        </div>

        <div>
          <label className={labelCls} style={{ color: 'var(--color-map-gold)' }}>{t('register.nationality')}</label>
          <CountrySelect value={nationality} onChange={setNationality} isMapTheme />
        </div>

        <div>
          <label className={labelCls} style={{ color: 'var(--color-map-gold)' }}>{t('register.gender')}</label>
          <div className="grid grid-cols-2 gap-2">
            {GENDER_KEYS.map(key => (
              <button key={key} onClick={() => setGender(key)}
                className="px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={gender === key ? chipActive : chipIdle}
              >
                {t(`register.${key}`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls} style={{ color: 'var(--color-map-gold)' }}>{t('register.age') || 'Edad'}</label>
          <input
            type="number"
            inputMode="numeric"
            value={ageRange}
            onChange={e => setAgeRange(e.target.value)}
            placeholder="Ej: 25"
            className={inputCls}
            style={inputStyle}
          />
        </div>
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
