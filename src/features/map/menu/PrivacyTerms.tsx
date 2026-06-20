import { useTranslation } from 'react-i18next'

interface Props { onBack: () => void }

const SECTIONS = [
  { icon: 'ri-database-2-line', titleKey: 'map.privacy_data_title',     bodyKey: 'map.privacy_data_body' },
  { icon: 'ri-map-pin-2-line',  titleKey: 'map.privacy_location_title', bodyKey: 'map.privacy_location_body' },
  { icon: 'ri-file-text-line',  titleKey: 'map.terms_use_title',        bodyKey: 'map.terms_use_body' },
  { icon: 'ri-gift-2-line',     titleKey: 'map.terms_prizes_title',     bodyKey: 'map.terms_prizes_body' },
]

export default function PrivacyTerms({ onBack }: Props) {
  const { t } = useTranslation()

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
            {t('map.menu_privacy')}
          </span>
          <div className="w-10" />
        </div>

        {/* Icono */}
        <div className="flex flex-col items-center gap-2 pb-10">
          <div
            className="h-20 w-20 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: '3px solid rgba(255,255,255,0.35)',
              boxShadow: '0 8px 28px rgba(0,0,0,0.15)',
            }}
          >
            <i className="ri-shield-check-line text-4xl text-white" />
          </div>
          <p className="text-xs font-bold mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {t('map.privacy_effective')}
          </p>
        </div>
      </div>

      {/* ── Card blanca ── */}
      <div
        className="flex-1 min-h-0 rounded-t-3xl flex flex-col overflow-hidden"
        style={{ background: '#ffffff', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)' }}
      >
        <div className="flex-1 overflow-y-auto px-5 pt-6 pb-6 space-y-3 min-h-0" style={{ scrollbarWidth: 'none' }}>
          {SECTIONS.map((s, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden"
              style={{ background: '#f8fffe', border: '1px solid rgba(0,187,180,0.18)', boxShadow: '0 2px 12px rgba(0,187,180,0.06)' }}
            >
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(0,187,180,0.12)' }}>
                <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(0,187,180,0.1)' }}>
                  <i className={`${s.icon} text-base`} style={{ color: '#00bbb4' }} />
                </div>
                <h3 className="text-xs font-black" style={{ color: '#096d7d' }}>{t(s.titleKey)}</h3>
              </div>
              <p className="px-4 py-3.5 text-xs leading-relaxed" style={{ color: '#096d7d', opacity: 0.75 }}>{t(s.bodyKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
