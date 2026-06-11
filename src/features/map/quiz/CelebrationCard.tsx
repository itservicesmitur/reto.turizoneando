import { useState } from 'react'

interface Props {
  stopIndex: number
  onSpinComplete: () => void
}

const ROULETTE_PRIZES = [
  { icon: 'ri-coins-line', label: 'Monedas' },
  { icon: 'ri-key-2-line', label: 'Llave' },
  { icon: 'ri-compass-3-line', label: 'Brújula' },
  { icon: 'ri-treasure-map-line', label: 'Mapa' },
  { icon: 'ri-cup-line', label: 'Cofre' },
  { icon: 'ri-shield-flash-line', label: 'Escudo' },
  { icon: 'ri-sword-line', label: 'Espada' },
  { icon: 'ri-vip-diamond-line', label: 'Gema' }
]

export default function CelebrationCard({ stopIndex, onSpinComplete }: Props) {
  const [spinning, setSpinning] = useState(false)
  const [spinDone, setSpinDone] = useState(false)

  const stageIdx = Math.floor(stopIndex / 4)
  const stopInStage = (stopIndex % 4) + 1
  const isLastInStage = (stopIndex % 4) === 3

  const handleSpin = () => {
    if (spinning || spinDone) return
    setSpinning(true)
    setTimeout(() => {
      setSpinDone(true)
      setSpinning(false)
      setTimeout(() => onSpinComplete(), 700)
    }, 3200)
  }

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div
        className="relative w-full h-full flex flex-col overflow-hidden quiz-card-enter rounded-2xl"
        style={{
          background: '#ebdcc3',
          border: '8px solid #321e0f',
          boxShadow: '0 12px 36px rgba(0,0,0,0.5), inset 0 0 0 2px #a87f2a, inset 0 0 16px rgba(0,0,0,0.5)'
        }}
      >
        {/* Metal Decorative Corners (Gold reinforcement look) */}
        <svg className="absolute -top-px -left-px w-9 h-9 pointer-events-none z-30 text-[#fcd34d]" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 20V3h17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11c3 0 8-5 8-8M3 7c1.5 0 4-2.5 4-4" strokeLinecap="round" />
          <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <svg className="absolute -top-px -right-px w-9 h-9 pointer-events-none z-30 text-[#fcd34d] transform scale-x-[-1]" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 20V3h17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11c3 0 8-5 8-8M3 7c1.5 0 4-2.5 4-4" strokeLinecap="round" />
          <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <svg className="absolute -bottom-px -left-px w-9 h-9 pointer-events-none z-30 text-[#fcd34d] transform scale-y-[-1]" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 20V3h17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11c3 0 8-5 8-8M3 7c1.5 0 4-2.5 4-4" strokeLinecap="round" />
          <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <svg className="absolute -bottom-px -right-px w-9 h-9 pointer-events-none z-30 text-[#fcd34d] transform scale-[-1]" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 20V3h17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11c3 0 8-5 8-8M3 7c1.5 0 4-2.5 4-4" strokeLinecap="round" />
          <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
        </svg>

        {/* Center Clasps (Top & Bottom Center) */}
        <svg className="absolute -top-px left-1/2 -translate-x-1/2 w-14 h-6 pointer-events-none z-30 text-[#fcd34d]" viewBox="0 0 56 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3h32M16 3c4 4 8 7 12 7s8-3 12-7" strokeLinecap="round" />
          <circle cx="28" cy="3" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <svg className="absolute -bottom-px left-1/2 -translate-x-1/2 w-14 h-6 pointer-events-none z-30 text-[#fcd34d] transform scale-y-[-1]" viewBox="0 0 56 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3h32M16 3c4 4 8 7 12 7s8-3 12-7" strokeLinecap="round" />
          <circle cx="28" cy="3" r="1.2" fill="currentColor" stroke="none" />
        </svg>

        {/* Top stripe */}
        <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,#fcd34d,#a87f2a,#fcd34d,transparent)' }} />

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-6 px-5 py-6 text-center">
          {/* Badge LOGRO DESBLOQUEADO */}
          <div className="logro-badge-pop flex flex-col items-center gap-3">
            <div
              className="px-6 py-2 rounded-full text-[9px] font-black tracking-[3px] uppercase"
              style={{
                background: 'linear-gradient(90deg,#a87f2a,#fcd34d,#c7a361,#fcd34d,#a87f2a)',
                color: '#321e0f',
                boxShadow: '0 0 16px rgba(252,211,77,0.45), 0 3px 8px rgba(0,0,0,0.2)',
                letterSpacing: '3px',
              }}
            >
              ¡Logro Desbloqueado!
            </div>
            <h2
              className="text-2xl font-black text-[#321e0f]"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {isLastInStage
                ? `¡Completaste la Etapa ${stageIdx + 1}!`
                : `¡Parada ${stopInStage} completada!`}
            </h2>
            <p className="text-[12px] text-[#6b4a20] leading-relaxed max-w-[260px]">
              {isLastInStage
                ? '¡El cofre del tesoro es tuyo, marinero!'
                : 'Gira la rueda de la fortuna pirata'}
            </p>
          </div>

          {/* Roulette wheel */}
          <div className="relative flex items-center justify-center my-2">
            {/* Outer wooden ring */}
            <div
              className="absolute rounded-full"
              style={{
                width: '352px',
                height: '352px',
                background: 'linear-gradient(135deg, #4e2f17 0%, #2c1608 50%, #3e2210 100%)',
                border: '6px solid #1f1006',
                boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8), 0 8px 24px rgba(0,0,0,0.4)',
              }}
            />
            {/* Gold inner trim */}
            <div
              className="absolute rounded-full"
              style={{
                width: '324px',
                height: '324px',
                background: 'conic-gradient(#a87f2a, #fcd34d, #c7a361, #a87f2a)',
                boxShadow: 'inset 0 0 6px rgba(0,0,0,0.6)',
              }}
            />
            {/* Inner dark transition */}
            <div
              className="absolute rounded-full"
              style={{ width: '316px', height: '316px', background: '#1a0d05' }}
            />

            {/* Glowing Bulb Lights around the wheel */}
            {Array.from({ length: 12 }).map((_, idx) => {
              const angle = (idx * 360) / 12
              return (
                <div
                  key={idx}
                  className="absolute rounded-full bg-white animate-pulse"
                  style={{
                    width: '7px',
                    height: '7px',
                    boxShadow: '0 0 8px #fff, 0 0 12px #fcd34d',
                    transform: `rotate(${angle}deg) translate(0, -160px)`,
                    transformOrigin: 'center center',
                    animationDelay: `${idx * 150}ms`,
                    zIndex: 15
                  }}
                />
              )
            })}

            {/* Wheel */}
            <div
              className={spinning ? 'roulette-spinning' : spinDone ? 'roulette-done' : ''}
              style={{
                width: '310px',
                height: '310px',
                borderRadius: '50%',
                background: 'conic-gradient(#321e0f 0deg 45deg, #fcd34d 45deg 90deg, #22150c 90deg 135deg, #ebdcc3 135deg 180deg, #321e0f 180deg 225deg, #a87f2a 225deg 270deg, #22150c 270deg 315deg, #ebdcc3 315deg 360deg)',
                position: 'relative',
                boxShadow: 'inset 0 0 16px rgba(0,0,0,0.4)',
                // @ts-ignore
                '--target-rotation': `${1800 - (stopIndex * 45 + 22.5)}deg`
              }}
            >
              {/* Slices Dividers */}
              {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '50%',
                    height: '1.5px',
                    background: 'rgba(235,220,195,0.25)',
                    transformOrigin: '0 50%',
                    transform: `rotate(${i * 45}deg)`,
                  }}
                />
              ))}

              {/* Prize Icons & Labels inside segments */}
              {ROULETTE_PRIZES.map((prize, i) => {
                const angle = i * 45 + 22.5
                const isDarkBg = i === 0 || i === 2 || i === 4 || i === 5 || i === 6
                const contentColor = isDarkBg ? '#ebdcc3' : '#321e0f'
                
                return (
                  <div
                    key={i}
                    className="absolute flex flex-col items-center justify-center text-center pointer-events-none"
                    style={{
                      top: '50%',
                      left: '50%',
                      width: '60px',
                      height: '60px',
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translate(0, -103px) rotate(${-angle}deg)`,
                      transformOrigin: 'center center'
                    }}
                  >
                    <i
                      className={`${prize.icon} text-xl mb-0.5`}
                      style={{ color: contentColor, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                    />
                    <span
                      className="text-[8px] font-black uppercase tracking-wider block"
                      style={{
                        color: contentColor,
                        fontFamily: 'Georgia, serif',
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                      }}
                    >
                      {prize.label}
                    </span>
                  </div>
                )
              })}

              {/* Center hub */}
              <button
                onClick={handleSpin}
                disabled={spinning || spinDone}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center rounded-full transition-all active:scale-90 disabled:cursor-default"
                style={{
                  width: '94px',
                  height: '94px',
                  background: spinning
                    ? '#321e0f'
                    : spinDone
                    ? 'linear-gradient(135deg,#14532d,#166534)'
                    : 'linear-gradient(135deg,#fcd34d,#a87f2a)',
                  border: '3px solid #ebdcc3',
                  boxShadow: spinning
                    ? 'none'
                    : spinDone
                    ? '0 0 16px rgba(34,197,94,0.4)'
                    : '0 0 20px rgba(252,211,77,0.6), 0 4px 10px rgba(0,0,0,0.2)',
                  zIndex: 10,
                  transition: 'all 0.3s ease',
                }}
              >
                {spinning ? (
                  <i className="ri-loader-4-line text-[#fcd34d] text-2xl" style={{ animation: 'spin 0.6s linear infinite' }} />
                ) : spinDone ? (
                  <i className="ri-check-line text-[#86efac] text-2xl font-black" />
                ) : (
                  <div className="flex flex-col items-center gap-0.5">
                    <i className="ri-star-fill text-[#321e0f] text-base" />
                    <span className="text-[10px] font-black text-[#321e0f] tracking-widest leading-none">GIRAR</span>
                    <i className="ri-star-fill text-[#321e0f] text-[9px]" />
                  </div>
                )}
              </button>
            </div>

            {/* Pointer arrow */}
            <div
              className="absolute pointer-events-none"
              style={{ top: '-14px', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '11px solid transparent',
                  borderRight: '11px solid transparent',
                  borderTop: '24px solid #a87f2a',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                }}
              />
            </div>
          </div>

          {/* Status text */}
          <div className="h-6 flex items-center justify-center">
            {!spinning && !spinDone && (
              <p className="text-[12px] text-[#6b4a20] font-bold" style={{ animation: 'stage-blink 1.4s ease-in-out infinite' }}>
                Presiona GIRAR para revelar tu premio
              </p>
            )}
            {spinning && (
              <p className="text-[12px] text-[#a87f2a] font-black tracking-wide" style={{ animation: 'stage-blink 0.7s ease-in-out infinite' }}>
                ¡Girando la ruleta del destino!
              </p>
            )}
            {spinDone && (
              <p className="text-[12px] text-[#22c55e] font-black">¡Premio revelado!</p>
            )}
          </div>
        </div>

        {/* Bottom stripe */}
        <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,#a87f2a,#fcd34d,#a87f2a,transparent)' }} />
      </div>
    </div>
  )
}
