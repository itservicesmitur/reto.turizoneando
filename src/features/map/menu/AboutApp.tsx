import { useTranslation } from 'react-i18next'

interface Props { onBack: () => void }

export default function AboutApp({ onBack }: Props) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-60 flex flex-col menu-view-slide-in" style={{ background: 'var(--color-map-cream-light)' }}>
      <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold),var(--color-map-gold-light),var(--color-map-gold),transparent)' }} />

      <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(168,127,42,0.2)' }}>
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full active:scale-90 transition-all shrink-0" style={{ background: 'rgba(168,127,42,0.1)', border: '1px solid rgba(168,127,42,0.3)' }}>
          <i className="ri-arrow-left-line text-xl" style={{ color: 'var(--color-map-wood-dark)' }} />
        </button>
        <h2 className="text-sm font-black flex-1" style={{ fontFamily: 'Georgia, serif', color: 'var(--color-map-wood-dark)' }}>{t('map.menu_about')}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 min-h-0">
        {/* Logo & title */}
        <div className="flex flex-col items-center gap-3 py-6">
          <img
            src="/assets/img/logo1.png"
            alt="Turizoneando"
            className="h-20 object-contain"
            style={{ filter: 'sepia(0.4) saturate(1.3) contrast(1.05)' }}
          />
          <div className="text-center">
            <h3 className="text-xl font-black" style={{ fontFamily: 'Georgia, serif', color: 'var(--color-map-wood-dark)' }}>Turizoneando</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--color-map-gold)' }}>{t('map.app_version')}</p>
          </div>
        </div>

        {/* Description */}
        <div className="rounded-2xl px-5 py-4" style={{ background: 'var(--color-map-cream-light)', border: '1px solid rgba(168,127,42,0.2)' }}>
          <p className="text-sm leading-relaxed font-serif" style={{ color: 'var(--color-map-wood-dark)' }}>{t('map.app_desc')}</p>
        </div>

        {/* Developed by */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-map-cream-light)', border: '1px solid rgba(168,127,42,0.2)' }}>
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(168,127,42,0.12)' }}>
            <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 border-2" style={{ background: 'linear-gradient(135deg,var(--color-map-wood-dark),var(--color-map-wood-mid))', borderColor: 'var(--color-map-gold)' }}>
              <i className="ri-government-line text-lg" style={{ color: 'var(--color-map-gold-light)' }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-map-gold)' }}>{t('map.developed_by')}</p>
              <p className="text-sm font-black" style={{ fontFamily: 'Georgia, serif', color: 'var(--color-map-wood-dark)' }}>{t('map.mitur_name')}</p>
              <p className="text-[11px]" style={{ color: 'var(--color-map-gold)' }}>{t('map.mitur_sub')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <i className="ri-map-2-line text-lg shrink-0" style={{ color: 'var(--color-map-gold)' }} />
            <p className="text-xs font-serif" style={{ color: 'var(--color-map-wood-dark)' }}>Rally Cultural de la Zona Colonial, Santo Domingo</p>
          </div>
        </div>

        <div className="h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(168,127,42,0.4),transparent)' }} />

        <p className="text-center text-[10px] italic pb-2" style={{ color: 'var(--color-map-gold)', opacity: 0.6 }}>© 2025 Turizoneando — MITUR</p>
      </div>

      <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold),var(--color-map-gold-light),var(--color-map-gold),transparent)' }} />
    </div>
  )
}
