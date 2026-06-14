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
    <div className="fixed inset-0 z-60 flex flex-col menu-view-slide-in" style={{ background: 'var(--color-map-cream-light)' }}>
      <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold),var(--color-map-gold-light),var(--color-map-gold),transparent)' }} />

      <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(168,127,42,0.2)' }}>
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full active:scale-90 transition-all shrink-0" style={{ background: 'rgba(168,127,42,0.1)', border: '1px solid rgba(168,127,42,0.3)' }}>
          <i className="ri-arrow-left-line text-xl" style={{ color: 'var(--color-map-wood-dark)' }} />
        </button>
        <h2 className="text-sm font-black flex-1" style={{ fontFamily: 'Georgia, serif', color: 'var(--color-map-wood-dark)' }}>{t('map.menu_privacy')}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3 min-h-0">
        <p className="text-[10px] italic px-1" style={{ color: 'var(--color-map-gold)' }}>{t('map.privacy_effective')}</p>

        {SECTIONS.map((s, i) => (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-map-cream-light)', border: '1px solid rgba(168,127,42,0.2)' }}>
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(168,127,42,0.12)' }}>
              <i className={`${s.icon} text-lg shrink-0`} style={{ color: 'var(--color-map-gold)' }} />
              <h3 className="text-xs font-black" style={{ color: 'var(--color-map-wood-dark)' }}>{t(s.titleKey)}</h3>
            </div>
            <p className="px-4 py-3.5 text-xs leading-relaxed font-serif" style={{ color: 'var(--color-map-wood-dark)', opacity: 0.8 }}>{t(s.bodyKey)}</p>
          </div>
        ))}
      </div>

      <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold),var(--color-map-gold-light),var(--color-map-gold),transparent)' }} />
    </div>
  )
}
