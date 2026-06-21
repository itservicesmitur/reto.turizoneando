import { useTranslation } from 'react-i18next'

interface Props { onBack: () => void }

export default function AboutApp({ onBack }: Props) {
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
            {t('map.menu_about')}
          </span>
          <div className="w-10" />
        </div>

        {/* Logo + nombre */}
        <div className="flex flex-col items-center gap-3 pb-10">
          <div
            className="h-auro w-60 rounded-full overflow-hidden"
            // style={{ border: '6px solid #ffffff', filter: 'drop-shadow(0 10px 28px rgba(0,0,0,0.35))' }}
          >
            <img src="/assets/img/logoConFondo.png" alt="Turizoneando" className="w-full h-full object-cover" />
          </div>
          <img src="/assets/img/logoSoloLetras.png" alt="Turizoneando" className="h-40 -mt-22 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
          <p className="text-[10px] font-bold -mt-18 uppercase tracking-widest" style={{ color: 'rgba(229,220,198,0.75)' }}>
            {t('map.app_version')}
          </p>
        </div>
      </div>

      {/* ── Card blanca ── */}
      <div
        className="flex-1 min-h-0 rounded-t-3xl flex flex-col overflow-hidden"
        style={{ background: '#ffffff', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)' }}
      >
        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4 space-y-3 min-h-0" style={{ scrollbarWidth: 'none' }}>

          {/* Descripción */}
          <div className="rounded-2xl px-5 py-4" style={{ background: '#f8fffe', border: '1px solid rgba(0,187,180,0.18)', boxShadow: '0 2px 12px rgba(0,187,180,0.06)' }}>
            <p className="text-sm leading-relaxed" style={{ color: '#096d7d', opacity: 0.85 }}>{t('map.app_desc')}</p>
          </div>

          {/* Desarrollado por */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#f8fffe', border: '1px solid rgba(0,187,180,0.18)', boxShadow: '0 2px 12px rgba(0,187,180,0.06)' }}>
            <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(0,187,180,0.12)' }}>
              <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#18d5cd 0%,#096d7d 100%)', boxShadow: '0 4px 12px rgba(0,187,180,0.3)' }}>
                <i className="ri-government-line text-lg text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider mb-0.5" style={{ color: 'rgba(9,109,125,0.55)' }}>{t('map.developed_by')}</p>
                <p className="text-sm font-black" style={{ color: '#096d7d' }}>{t('map.mitur_name')}</p>
                <p className="text-[11px]" style={{ color: '#00bbb4' }}>{t('map.mitur_sub')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <i className="ri-map-2-line text-lg shrink-0" style={{ color: '#00bbb4' }} />
              <p className="text-xs" style={{ color: '#096d7d', opacity: 0.75 }}>Desafío Cultural de la Ciudad Colonial, Santo Domingo</p>
            </div>
          </div>
        </div>

        {/* Footer fijo al fondo */}
        <div className="shrink-0 px-5 pb-8 pt-3">
          <div className="h-px mb-4" style={{ background: 'linear-gradient(90deg,transparent,rgba(0,187,180,0.3),transparent)' }} />
          <p className="text-center text-[10px]" style={{ color: 'rgba(9,109,125,0.4)' }}>© 2025 Turizoneando — MITUR</p>
        </div>
      </div>
    </div>
  )
}
