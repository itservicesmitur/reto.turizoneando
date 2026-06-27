import { useTranslation } from 'react-i18next'

interface Props {
  onDismiss: () => void
}

export default function LocationGate({ onDismiss }: Props) {
  const { t } = useTranslation()

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center px-4"
      style={{ background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-[340px] rounded-3xl overflow-hidden animate-card-boing"
        style={{
          background: '#ffffff',
          boxShadow: '0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,187,180,0.15)',
        }}
      >
        {/* Icono */}
        <div className="flex flex-col items-center pt-8 pb-4 px-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{
              background: 'linear-gradient(135deg, #075f6e 0%, #00bbb4 100%)',
              boxShadow: '0 8px 24px rgba(0,187,180,0.35)',
            }}
          >
            <i className="ri-map-pin-2-fill text-3xl text-white" />
          </div>

          <h3 className="text-lg font-black text-center mb-2" style={{ color: '#075f6e' }}>
            {t('map.location_gate_title')}
          </h3>
          <p className="text-[13px] text-center leading-relaxed" style={{ color: '#64748b' }}>
            {t('map.location_gate_desc')}
          </p>
        </div>

        {/* Separador */}
        <div className="mx-6" style={{ height: 1, background: 'rgba(0,187,180,0.12)' }} />

        {/* Alerta */}
        <div className="px-5 pt-4 pb-5 flex flex-col gap-3">
          <div
            className="px-4 py-3 rounded-2xl flex flex-col gap-1.5"
            style={{ background: 'rgba(224,52,75,0.06)', border: '1px solid rgba(224,52,75,0.22)' }}
          >
            <div className="flex items-center gap-2">
              <i className="ri-error-warning-line text-base shrink-0" style={{ color: '#e0344b' }} />
              <p className="text-[12px] font-black leading-snug" style={{ color: '#991b1b' }}>
                {t('map.location_gate_denied')}
              </p>
            </div>
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#991b1b' }}>
              {t('map.location_gate_denied_check')}
            </p>
            <ul className="flex flex-col gap-1 pl-1">
              {[t('map.location_gate_denied_item1'), t('map.location_gate_denied_item2')].map((item, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] leading-snug font-medium" style={{ color: '#991b1b' }}>
                  <span className="shrink-0 mt-[2px]">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] font-medium mt-0.5" style={{ color: '#991b1b' }}>
              {t('map.location_gate_denied_footer')}
            </p>
          </div>

          <button
            onClick={onDismiss}
            className="w-full h-12 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 active:translate-y-[3px] transition-all"
            style={{
              background: 'linear-gradient(180deg,#18d5cd 0%,#00bbb4 45%,#096d7d 100%)',
              border: '2px solid #0c7f89',
              boxShadow: 'inset 0 2px 0 rgba(255,255,255,.35), 0 6px 0 #054f5c, 0 12px 22px rgba(9,109,125,.25)',
            }}
          >
            <i className="ri-check-line text-base" />
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
