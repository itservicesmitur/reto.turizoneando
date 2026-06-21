import { useTranslation } from 'react-i18next'

interface Props { onBack: () => void }

const RULES_ES = [
  'Visita cada parada del Desafío Cultural.',
  'Escucha la narración histórica completa de cada parada.',
  'Responde las preguntas del quiz para completar la parada.',
  'Las paradas deben completarse en orden dentro de cada etapa.',
  'Para avanzar de etapa, completa todas las paradas de la etapa actual.',
  'Los premios se validan según disponibilidad y rango de edad del participante.',
  'Un registro por correo electrónico. No se permiten cuentas duplicadas.',
  'Los premios canjeados no son reembolsables ni transferibles.',
]

const RULES_EN = [
  'Visit each stop of the Cultural Challenge.',
  'Listen to the complete historical narration at each stop.',
  'Answer the quiz questions to complete the stop.',
  'Stops must be completed in order within each stage.',
  'To advance to the next stage, complete all stops in the current stage.',
  "Prizes are validated based on availability and the participant's age range.",
  'One registration per email address. Duplicate accounts are not allowed.',
  'Redeemed prizes are non-refundable and non-transferable.',
]

export default function RallyRules({ onBack }: Props) {
  const { i18n } = useTranslation()
  const rules = i18n.language === 'en' ? RULES_EN : RULES_ES

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
            Desafío Cultural
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
            <i className="ri-book-2-line text-4xl text-white" />
          </div>
          <p className="text-xs font-bold mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Ciudad Colonial, Santo Domingo
          </p>
        </div>
      </div>

      {/* ── Card blanca ── */}
      <div
        className="flex-1 min-h-0 rounded-t-3xl flex flex-col overflow-hidden"
        style={{ background: '#ffffff', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)' }}
      >
        <div className="flex-1 overflow-y-auto px-5 pt-6 pb-6 min-h-0" style={{ scrollbarWidth: 'none' }}>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: '#f8fffe', border: '1px solid rgba(0,187,180,0.18)', boxShadow: '0 2px 12px rgba(0,187,180,0.06)' }}
          >
            {rules.map((rule, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-3.5"
                style={i < rules.length - 1 ? { borderBottom: '1px solid rgba(0,187,180,0.1)' } : undefined}
              >
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg,#18d5cd 0%,#00bbb4 100%)', minWidth: 24 }}
                >
                  <span className="text-[10px] font-black text-white">{i + 1}</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#096d7d', opacity: 0.85 }}>{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
