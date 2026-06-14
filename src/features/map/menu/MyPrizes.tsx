import { useTranslation } from 'react-i18next'

interface Props { onBack: () => void }

export default function MyPrizes({ onBack }: Props) {
  const { t } = useTranslation()
  const prizes: never[] = []

  return (
    <div className="fixed inset-0 z-60 flex flex-col menu-view-slide-in" style={{ background: 'var(--color-map-cream-light)' }}>
      <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold),var(--color-map-gold-light),var(--color-map-gold),transparent)' }} />

      <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(168,127,42,0.2)' }}>
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full active:scale-90 transition-all shrink-0" style={{ background: 'rgba(168,127,42,0.1)', border: '1px solid rgba(168,127,42,0.3)' }}>
          <i className="ri-arrow-left-line text-xl" style={{ color: 'var(--color-map-wood-dark)' }} />
        </button>
        <h2 className="text-sm font-black flex-1" style={{ fontFamily: 'Georgia, serif', color: 'var(--color-map-wood-dark)' }}>{t('map.menu_prizes')}</h2>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {prizes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
            <div className="h-28 w-28 rounded-full flex items-center justify-center border-2 border-dashed"
              style={{ background: 'rgba(168,127,42,0.06)', borderColor: 'rgba(168,127,42,0.4)' }}
            >
              <img src="/assets/img/COFRE_OPEN.png" alt="" className="w-20 h-20 object-contain opacity-40" />
            </div>
            <div>
              <p className="text-sm font-black mb-1.5" style={{ fontFamily: 'Georgia, serif', color: 'var(--color-map-wood-dark)' }}>
                {t('map.no_prizes_yet')}
              </p>
              <p className="text-xs leading-relaxed font-serif" style={{ color: 'var(--color-map-gold)' }}>
                {t('map.no_prizes_sub')}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold),var(--color-map-gold-light),var(--color-map-gold),transparent)' }} />
    </div>
  )
}
