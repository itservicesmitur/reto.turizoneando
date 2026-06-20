import { useTranslation } from 'react-i18next'
import type { Monumento } from '../types/map.types'

const COINS_PER_STOP = 100

interface Props {
  onBack: () => void
  completedStops: boolean[]
  monuments: Monumento[]
  stageGroups: number[][]
  seasonName: string
}

export default function Progress({ onBack, completedStops, monuments, stageGroups, seasonName }: Props) {
  const { t } = useTranslation()

  const totalCompleted  = completedStops.filter(Boolean).length
  const totalStops      = completedStops.length
  const coinsEarned     = totalCompleted * COINS_PER_STOP
  const stagesCompleted = stageGroups.filter(g => g.length > 0 && g.every(i => completedStops[i])).length

  const stats = [
    { icon: 'ri-map-pin-2-line', value: `${totalCompleted}/${totalStops}`, label: t('map.stops_completed') },
    { icon: 'ri-flag-2-line',    value: `${stagesCompleted}/${stageGroups.length}`, label: t('map.stages_completed') },
    { icon: 'ri-coin-line',      value: `${coinsEarned}`,                  label: t('map.coins_earned') },
  ]

  const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI']

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
            {seasonName || t('map.menu_progress')}
          </span>
          <div className="w-10" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pb-10">
          {stats.map(s => (
            <div key={s.label} className="flex flex-col items-center gap-1 rounded-2xl py-3 px-2 text-center" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <i className={`${s.icon} text-lg text-white`} />
              <span className="text-lg font-black text-white">{s.value}</span>
              <span className="text-[8px] font-bold uppercase tracking-wide leading-tight text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Card blanca ── */}
      <div
        className="flex-1 min-h-0 rounded-t-3xl flex flex-col overflow-hidden"
        style={{ background: '#ffffff', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)' }}
      >
        <div className="flex-1 overflow-y-auto px-5 pt-6 pb-6 space-y-4 min-h-0" style={{ scrollbarWidth: 'none' }}>

          {stageGroups.map((group, stageIdx) => {
            const done     = group.filter(i => completedStops[i]).length
            const total    = group.length
            const pct      = total > 0 ? (done / total) * 100 : 0
            const complete = done === total && total > 0
            const numeral  = NUMERALS[stageIdx] ?? String(stageIdx + 1)

            return (
              <div key={stageIdx} className="rounded-2xl overflow-hidden" style={{ background: '#f8fffe', border: '1px solid rgba(0,187,180,0.18)', boxShadow: '0 2px 12px rgba(0,187,180,0.06)' }}>

                {/* Stage header */}
                <div className="flex items-center gap-3 px-4 pt-3 pb-2">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all"
                    style={complete
                      ? { background: 'linear-gradient(135deg,#18d5cd 0%,#00bbb4 100%)', boxShadow: '0 4px 12px rgba(0,187,180,0.35)' }
                      : { background: 'rgba(0,187,180,0.08)', border: '1.5px solid rgba(0,187,180,0.3)' }}
                  >
                    {complete
                      ? <i className="ri-checkbox-circle-line text-sm text-white" />
                      : <span className="text-[11px] font-black" style={{ color: '#00bbb4' }}>{numeral}</span>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black" style={{ color: '#096d7d' }}>{t('map.stage', { n: stageIdx + 1 })}</span>
                      <span className="text-[10px] font-bold" style={{ color: complete ? '#00bbb4' : 'rgba(9,109,125,0.5)' }}>{done}/{total}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,187,180,0.1)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: complete ? 'linear-gradient(90deg,#18d5cd,#00bbb4)' : '#00bbb4' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Stop thumbnails */}
                <div className="flex px-4 pb-3 gap-2">
                  {group.map(stopIdx => {
                    const monument = monuments[stopIdx]
                    const isDone   = completedStops[stopIdx]
                    const imgUrl   = monument?.imagen || ''

                    return (
                      <div key={stopIdx} className="flex-1 relative rounded-xl overflow-hidden" style={{ aspectRatio: '1', minWidth: 0 }}>
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={monument?.nombre || ''}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full" style={{ background: 'rgba(0,187,180,0.08)', border: '1px solid rgba(0,187,180,0.2)' }} />
                        )}

                        {/* Overlay completada */}
                        {isDone && (
                          <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ background: 'rgba(0,187,180,0.75)' }}
                          >
                            <i className="ri-check-line text-white font-black" style={{ fontSize: 18 }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

        </div>
      </div>
    </div>
  )
}
