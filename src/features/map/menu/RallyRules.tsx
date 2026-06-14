import { useTranslation } from 'react-i18next'

interface Props { onBack: () => void }

const RULES_ES = [
  'Visita cada parada del rally y escanea el código QR del lugar.',
  'Escucha la narración histórica completa de cada parada.',
  'Responde las preguntas del quiz para completar la parada.',
  'Las paradas deben completarse en orden dentro de cada etapa.',
  'Para avanzar de etapa, completa todas las paradas de la etapa actual.',
  'Los premios se validan según disponibilidad y rango de edad del participante.',
  'Un registro por correo electrónico. No se permiten cuentas duplicadas.',
  'Los premios canjeados no son reembolsables ni transferibles.',
]

const RULES_EN = [
  'Visit each rally stop and scan the QR code at the location.',
  'Listen to the complete historical narration at each stop.',
  'Answer the quiz questions to complete the stop.',
  'Stops must be completed in order within each stage.',
  'To advance to the next stage, complete all stops in the current stage.',
  "Prizes are validated based on availability and the participant's age range.",
  'One registration per email address. Duplicate accounts are not allowed.',
  'Redeemed prizes are non-refundable and non-transferable.',
]

export default function RallyRules({ onBack }: Props) {
  const { t, i18n } = useTranslation()
  const rules = i18n.language === 'en' ? RULES_EN : RULES_ES

  return (
    <div className="fixed inset-0 z-60 flex flex-col menu-view-slide-in" style={{ background: 'var(--color-map-cream-light)' }}>
      <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold),var(--color-map-gold-light),var(--color-map-gold),transparent)' }} />

      <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(168,127,42,0.2)' }}>
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full active:scale-90 transition-all shrink-0" style={{ background: 'rgba(168,127,42,0.1)', border: '1px solid rgba(168,127,42,0.3)' }}>
          <i className="ri-arrow-left-line text-xl" style={{ color: 'var(--color-map-wood-dark)' }} />
        </button>
        <h2 className="text-sm font-black flex-1" style={{ fontFamily: 'Georgia, serif', color: 'var(--color-map-wood-dark)' }}>{t('map.menu_rules')}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3 min-h-0">
        {/* Parchment header */}
        <div className="rounded-2xl px-5 py-5 flex flex-col items-center text-center gap-2"
          style={{ background: 'linear-gradient(180deg,var(--color-map-cream),var(--color-map-tan))', border: '2px solid var(--color-map-gold)', boxShadow: 'inset 0 0 12px rgba(82,49,22,0.1)' }}
        >
          <i className="ri-book-2-line text-3xl" style={{ color: 'var(--color-map-gold)' }} />
          <h3 className="text-base font-black" style={{ fontFamily: 'Georgia, serif', color: 'var(--color-map-wood-dark)' }}>{t('map.menu_rules')}</h3>
          <p className="text-[10px] italic" style={{ color: 'var(--color-map-wood-dark)', opacity: 0.6 }}>Rally Cultural — Zona Colonial, Santo Domingo</p>
        </div>

        {/* Rules list */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-map-cream-light)', border: '1px solid rgba(168,127,42,0.2)' }}>
          {rules.map((rule, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3.5"
              style={i < rules.length - 1 ? { borderBottom: '1px solid rgba(168,127,42,0.1)' } : undefined}
            >
              <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'var(--color-map-wood-dark)', minWidth: 24 }}>
                <span className="text-[10px] font-black" style={{ color: 'var(--color-map-gold-light)' }}>{i + 1}</span>
              </div>
              <p className="text-sm leading-relaxed font-serif" style={{ color: 'var(--color-map-wood-dark)' }}>{rule}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold),var(--color-map-gold-light),var(--color-map-gold),transparent)' }} />
    </div>
  )
}
