import { useTranslation } from 'react-i18next'

const STOPS_PER_STAGE = 4
const COINS_PER_STOP  = 100
const STAGE_NUMERALS  = ['I', 'II', 'III']

interface Props {
  onBack: () => void
  completedStops: boolean[]
}

export default function Progress({ onBack, completedStops }: Props) {
  const { t } = useTranslation()

  const totalCompleted  = completedStops.filter(Boolean).length
  const totalStops      = completedStops.length
  const coinsEarned     = totalCompleted * COINS_PER_STOP
  const stagesCompleted = STAGE_NUMERALS.filter((_, i) =>
    completedStops.slice(i * STOPS_PER_STAGE, (i + 1) * STOPS_PER_STAGE).every(Boolean)
  ).length

  const stats = [
    { icon: 'ri-map-pin-2-line', value: `${totalCompleted}/${totalStops}`, label: t('map.stops_completed') },
    { icon: 'ri-flag-2-line',    value: `${stagesCompleted}/3`,            label: t('map.stages_completed') },
    { icon: 'ri-coin-line',      value: `${coinsEarned}`,                  label: t('map.coins_earned') },
  ]

  return (
    <div className="fixed inset-0 z-60 flex flex-col menu-view-slide-in" style={{ background: 'var(--color-map-cream-light)' }}>
      <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold),var(--color-map-gold-light),var(--color-map-gold),transparent)' }} />

      <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(168,127,42,0.2)' }}>
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full active:scale-90 transition-all shrink-0" style={{ background: 'rgba(168,127,42,0.1)', border: '1px solid rgba(168,127,42,0.3)' }}>
          <i className="ri-arrow-left-line text-xl" style={{ color: 'var(--color-map-wood-dark)' }} />
        </button>
        <h2 className="text-sm font-black flex-1" style={{ fontFamily: 'Georgia, serif', color: 'var(--color-map-wood-dark)' }}>{t('map.menu_progress')}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 min-h-0">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map(s => (
            <div key={s.label} className="flex flex-col items-center gap-1.5 rounded-2xl py-4 px-2 text-center" style={{ background: 'var(--color-map-cream-light)', border: '1px solid rgba(168,127,42,0.2)' }}>
              <i className={`${s.icon} text-2xl`} style={{ color: 'var(--color-map-gold)' }} />
              <span className="text-xl font-black" style={{ color: 'var(--color-map-wood-dark)' }}>{s.value}</span>
              <span className="text-[9px] font-bold uppercase tracking-wide leading-tight text-center" style={{ color: 'var(--color-map-gold)' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Stage breakdown */}
        {STAGE_NUMERALS.map((numeral, stageIdx) => {
          const slice    = completedStops.slice(stageIdx * STOPS_PER_STAGE, (stageIdx + 1) * STOPS_PER_STAGE)
          const done     = slice.filter(Boolean).length
          const pct      = (done / STOPS_PER_STAGE) * 100
          const complete = done === STOPS_PER_STAGE

          return (
            <div key={numeral} className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-map-cream-light)', border: '1px solid rgba(168,127,42,0.2)' }}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 border-2 transition-all"
                  style={complete
                    ? { background: 'linear-gradient(135deg,var(--color-map-gold-light),var(--color-map-gold))', borderColor: 'var(--color-map-wood-dark)' }
                    : { background: 'rgba(168,127,42,0.08)', borderColor: 'rgba(168,127,42,0.3)' }}
                >
                  {complete
                    ? <i className="ri-checkbox-circle-line text-base" style={{ color: 'var(--color-map-wood-dark)' }} />
                    : <span className="text-xs font-black" style={{ color: 'var(--color-map-gold)' }}>{numeral}</span>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black" style={{ color: 'var(--color-map-wood-dark)' }}>{t('map.stage', { n: stageIdx + 1 })}</span>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--color-map-gold)' }}>{done}/{STOPS_PER_STAGE}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(168,127,42,0.15)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: complete ? 'linear-gradient(90deg,var(--color-map-gold-light),var(--color-map-gold))' : 'var(--color-map-gold)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Individual stop pills */}
              <div className="flex px-4 pb-3 gap-2">
                {slice.map((isDone, i) => (
                  <div key={i} className="flex-1 h-6 rounded-md flex items-center justify-center transition-all"
                    style={{ background: isDone ? 'linear-gradient(90deg,var(--color-map-gold-light),var(--color-map-gold))' : 'rgba(168,127,42,0.1)', border: '1px solid rgba(168,127,42,0.25)' }}
                  >
                    {isDone && <i className="ri-check-line text-[10px] font-black" style={{ color: 'var(--color-map-wood-dark)' }} />}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold),var(--color-map-gold-light),var(--color-map-gold),transparent)' }} />
    </div>
  )
}
