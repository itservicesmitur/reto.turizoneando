import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import GameButton from './GameButton'

interface Props {
  stopIndex: number
  onSpinComplete: () => void
}

const ROULETTE_EMOJIS = ['🪙', '🗝️', '🧭', '🗺️', '💰', '🛡️', '⚔️', '💎']

// Harmonious pirate color scheme from Fromend.md tokens
const SEG_COLORS = [
  '#ebdcc3', // Cream / Tan
  '#321e0f', // Dark Brown
  '#fcd34d', // Yellow Gold
  '#a87f2a', // Borde dorado
  '#ebdcc3',
  '#321e0f',
  '#fcd34d',
  '#a87f2a',
]

const SEG_TEXT = [
  '#321e0f',
  '#fff3d1',
  '#321e0f',
  '#fff3d1',
  '#321e0f',
  '#fff3d1',
  '#321e0f',
  '#fff3d1',
]

const toRad = (d: number) => d * Math.PI / 180

function segPath(i: number, r: number) {
  const s = toRad(i * 45 - 90)
  const e = toRad((i + 1) * 45 - 90)
  return `M 0 0 L ${(r * Math.cos(s)).toFixed(1)} ${(r * Math.sin(s)).toFixed(1)} A ${r} ${r} 0 0 1 ${(r * Math.cos(e)).toFixed(1)} ${(r * Math.sin(e)).toFixed(1)} Z`
}

export default function RouletteCard({ stopIndex, onSpinComplete }: Props) {
  const { t } = useTranslation()
  const ROULETTE_PRIZES = [
    { emoji: ROULETTE_EMOJIS[0], label: t('map.roulette_coins') },
    { emoji: ROULETTE_EMOJIS[1], label: t('map.roulette_key') },
    { emoji: ROULETTE_EMOJIS[2], label: t('map.roulette_compass') },
    { emoji: ROULETTE_EMOJIS[3], label: t('map.roulette_map') },
    { emoji: ROULETTE_EMOJIS[4], label: t('map.roulette_chest') },
    { emoji: ROULETTE_EMOJIS[5], label: t('map.roulette_shield') },
    { emoji: ROULETTE_EMOJIS[6], label: t('map.roulette_sword') },
    { emoji: ROULETTE_EMOJIS[7], label: t('map.roulette_gem') },
  ]
  const [spinning, setSpinning] = useState(false)
  const [spinDone, setSpinDone] = useState(false)
  const [wheelAngle, setWheelAngle] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [])

  const stageIdx = Math.floor(stopIndex / 4)
  const stopInStage = (stopIndex % 4) + 1
  const isLastInStage = (stopIndex % 4) === 3

  const handleSpin = () => {
    if (spinning || spinDone) return
    setSpinning(true)

    const duration = 5400 // 5.4 seconds duration for suspense
    const startAngle = wheelAngle % 360
    const targetAngle = 2880 - (stopIndex * 45 + 22.5) // More spins (8 full rotations) for higher speed and longer deceleration
    const totalRotation = targetAngle - startAngle
    const startTime = performance.now()

    // Decelerates beautifully at the end (ease-out quintic)
    const easeOutQuintic = (t: number) => 1 - Math.pow(1 - t, 5)

    const animate = (now: number) => {
      const elapsed = now - startTime
      if (elapsed >= duration) {
        rafRef.current = null
        setWheelAngle(targetAngle)
        setSpinDone(true)
        setSpinning(false)
        setTimeout(() => onSpinComplete(), 1500)
      } else {
        const t = elapsed / duration
        const progress = easeOutQuintic(t)
        const currentAngle = startAngle + progress * totalRotation
        setWheelAngle(currentAngle)
        rafRef.current = requestAnimationFrame(animate)
      }
    }
    rafRef.current = requestAnimationFrame(animate)
  }

  // Calculate dynamic click angle for the pointer pin based on current wheel angle
  // Every 45 degrees, a spoke passes. We bend the pin back, then snap it forward.
  const diff = ((wheelAngle + 22.5) % 45) - 22.5
  const pinAngle = (spinning && diff < 0 && diff > -16) ? (diff + 16) * -1.3 : 0

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/50 backdrop-blur-xs p-0">
      <div
        className="relative w-full h-full flex flex-col overflow-hidden quiz-card-enter rounded-none"
        style={{
          backgroundImage: "linear-gradient(rgba(235,220,195,0.58), rgba(235,220,195,0.58)), url('/assets/img/fonto_textura.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '8px solid var(--color-map-wood-dark)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.6), inset 0 0 0 2px var(--color-map-gold), inset 0 0 20px rgba(0,0,0,0.4)'
        }}
      >
        {/* Metal Decorative Corners */}
        <svg className="absolute -top-px -left-px w-9 h-9 pointer-events-none z-30 text-map-gold-light" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 20V3h17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11c3 0 8-5 8-8M3 7c1.5 0 4-2.5 4-4" strokeLinecap="round" />
          <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <svg className="absolute -top-px -right-px w-9 h-9 pointer-events-none z-30 text-map-gold-light transform scale-x-[-1]" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 20V3h17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11c3 0 8-5 8-8M3 7c1.5 0 4-2.5 4-4" strokeLinecap="round" />
          <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <svg className="absolute -bottom-px -left-px w-9 h-9 pointer-events-none z-30 text-map-gold-light transform scale-y-[-1]" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 20V3h17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11c3 0 8-5 8-8M3 7c1.5 0 4-2.5 4-4" strokeLinecap="round" />
          <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <svg className="absolute -bottom-px -right-px w-9 h-9 pointer-events-none z-30 text-map-gold-light transform scale-[-1]" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 20V3h17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11c3 0 8-5 8-8M3 7c1.5 0 4-2.5 4-4" strokeLinecap="round" />
          <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
        </svg>

        {/* Center Clasps */}
        <svg className="absolute -top-px left-1/2 -translate-x-1/2 w-14 h-6 pointer-events-none z-30 text-map-gold-light" viewBox="0 0 56 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3h32M16 3c4 4 8 7 12 7s8-3 12-7" strokeLinecap="round" />
          <circle cx="28" cy="3" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <svg className="absolute -bottom-px left-1/2 -translate-x-1/2 w-14 h-6 pointer-events-none z-30 text-map-gold-light transform scale-y-[-1]" viewBox="0 0 56 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3h32M16 3c4 4 8 7 12 7s8-3 12-7" strokeLinecap="round" />
          <circle cx="28" cy="3" r="1.2" fill="currentColor" stroke="none" />
        </svg>

        {/* Top stripe */}
        <div className="h-1.5 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold-light),var(--color-map-gold),var(--color-map-gold-light),transparent)' }} />

        {/* Volumetric Spotlight Effect (Luz celestial/cenital indirecta y difuminada) */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-10 mix-blend-screen"
          style={{
            width: '100%',
            height: '460px',
            background: 'radial-gradient(circle at 50% -20px, rgba(252,211,77,0.7) 0%, rgba(252,211,77,0.22) 50%, transparent 85%)',
            filter: 'blur(30px)',
            animation: 'pulseGlow 4s ease-in-out infinite',
          }}
        />

        {/* Floating Pirate Gold Dust Particles rising from the bottom treasure */}
        {Array.from({ length: 22 }).map((_, i) => {
          const left = `${5 + (i * 37) % 90}%`
          const bottom = `${15 + (i * 11) % 40}px`
          const size = `${3 + (i * 7) % 6}px`
          const delay = `${(i * 0.22).toFixed(2)}s`
          const duration = `${3 + (i * 1.4) % 4.5}s`
          return (
            <div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                left,
                bottom,
                width: size,
                height: size,
                background: 'radial-gradient(circle, #fff 0%, var(--color-map-gold-light) 60%, var(--color-map-gold) 100%)',
                boxShadow: '0 0 6px var(--color-map-gold-light), 0 0 10px var(--color-map-gold)',
                animation: `floatFromTreasure ${duration} ease-out infinite`,
                animationDelay: delay,
                zIndex: 15,
              }}
            />
          )
        })}



        {/* Bottom Gold Aura Glow Effect behind the Treasure */}
        <div 
          className="absolute bottom-0 left-0 right-0 w-full h-[180px] pointer-events-none z-10 mix-blend-screen"
          style={{
            background: 'radial-gradient(circle at 50% 100%, rgba(252,211,77,0.5) 0%, rgba(252,211,77,0.15) 55%, transparent 80%)',
            filter: 'blur(12px)'
          }}
        />

        {/* Body */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start gap-6 px-5 pt-8 pb-36 text-center relative z-20" style={{ scrollbarWidth: 'none' }}>

          {/* Videogame-style Ribbon Header */}
          <div className="logro-badge-pop flex flex-col items-center gap-1.5 shrink-0 mt-2">
            
            {/* Achievement text */}
            <h2 className="text-2xl font-black text-map-wood-dark" style={{ fontFamily: 'Georgia, serif' }}>
              {isLastInStage ? t('map.stage_completed_final', { n: stageIdx + 1 }) : t('map.stage_completed', { n: stopInStage })}
            </h2>
            <p className="text-[12px] text-[#6b4a20] leading-relaxed max-w-[280px]">
              {isLastInStage ? t('map.roulette_msg_final') : t('map.roulette_msg_normal')}
            </p>
          </div>

          {/* ── WHEEL CONTAINER ── */}
          <div className="relative flex items-center justify-center select-none shrink-0" style={{ width: '360px', height: '360px' }}>

            {/* Glowing Bulb lights on outer ring (static) */}
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: '10px', height: '10px',
                  background: spinning ? '#fff' : 'var(--color-map-gold-light)',
                  boxShadow: spinning
                    ? '0 0 8px #fff, 0 0 16px var(--color-map-gold-light)'
                    : '0 0 12px var(--color-map-gold-light), 0 0 20px var(--color-map-gold)',
                  transform: `rotate(${idx * 45}deg) translate(0, -143px)`,
                  transformOrigin: 'center center',
                  transition: 'all 0.3s ease',
                  opacity: spinning && idx % 2 === 0 ? 0.4 : 1,
                  zIndex: 15,
                }}
              />
            ))}

            {/* ── SPINNING SHIP WHEEL ── */}
            <div
              style={{
                position: 'relative',
                width: '360px',
                height: '360px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `rotate(${wheelAngle}deg)`,
                willChange: 'transform',
              }}
            >
              <svg
                width="360"
                height="360"
                viewBox="-180 -180 360 360"
                style={{ display: 'block', overflow: 'visible' }}
              >
                <defs>
                  {/* Wood gradient for wheel rim and handles */}
                  <linearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7a4824" />
                    <stop offset="50%" stopColor="#503019" />
                    <stop offset="100%" stopColor="#22150c" />
                  </linearGradient>
                  
                  {/* Highlight wood gradient */}
                  <linearGradient id="woodLightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#a87f2a" />
                    <stop offset="50%" stopColor="#7a4824" />
                    <stop offset="100%" stopColor="#321e0f" />
                  </linearGradient>

                  {/* Gold trim gradient */}
                  <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="40%" stopColor="#fcd34d" />
                    <stop offset="100%" stopColor="#a87f2a" />
                  </linearGradient>

                  {/* Red Gem radial gradient */}
                  <radialGradient id="redGem" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#ff8888" />
                    <stop offset="40%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#7f1d1d" />
                  </radialGradient>

                  {/* Gold Gem radial gradient */}
                  <radialGradient id="goldGem" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#fffbeb" />
                    <stop offset="40%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#b45309" />
                  </radialGradient>
                </defs>

                {/* ── 8 Spokes/Handles (Rendered first so they sit under the rim) ── */}
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = i * 45
                  return (
                    <g key={i} transform={`rotate(${angle})`}>
                      {/* Spoke handle shadow */}
                      <rect x="-8" y="-175" width="16" height="60" rx="8" fill="rgba(0,0,0,0.25)" transform="translate(2, 4)" />
                      {/* Wooden Spoke shaft running to center */}
                      <rect x="-4" y="-120" width="8" height="120" fill="url(#woodGrad)" stroke="#1a0d05" strokeWidth="1.5" />
                      
                      {/* Handle Collar (Gold Ring) */}
                      <rect x="-6" y="-136" width="12" height="6" rx="1.5" fill="url(#goldGrad)" stroke="#1a0d05" strokeWidth="1" />
                      
                      {/* Handle Grip (Turned wood shape) */}
                      <path d="M -5 -136 C -10 -142, -10 -155, -5 -162 L 5 -162 C 10 -155, 10 -142, 5 -136 Z" fill="url(#woodLightGrad)" stroke="#1a0d05" strokeWidth="1.5" />
                      
                      {/* Upper neck and ball tip */}
                      <rect x="-3" y="-167" width="6" height="6" fill="url(#woodGrad)" stroke="#1a0d05" strokeWidth="1" />
                      <circle cx="0" cy="-172" r="7" fill="url(#woodLightGrad)" stroke="#1a0d05" strokeWidth="1.5" />
                      <circle cx="-2" cy="-174" r="2" fill="rgba(255,255,255,0.3)" />
                    </g>
                  )
                })}

                {/* ── Colored pie segments (fortune wheel canvas) ── */}
                {ROULETTE_PRIZES.map((_, i) => (
                  <path key={i} d={segPath(i, 110)} fill={SEG_COLORS[i]} stroke="#1a0d05" strokeWidth="2.5" />
                ))}

                {/* Golden/White Glowing Highlight Overlay when a segment wins (like in image) */}
                {spinDone && (
                  <path
                    d={segPath(stopIndex, 110)}
                    fill="rgba(252, 211, 77, 0.25)"
                    stroke="#ffffff"
                    strokeWidth="4"
                    style={{
                      filter: 'drop-shadow(0 0 12px var(--color-map-gold-light))',
                      animation: 'pulseGlow 0.6s ease-in-out infinite',
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Inner gold trim ring around the canvas */}
                <circle r="110" fill="none" stroke="url(#goldGrad)" strokeWidth="3" />
                <circle r="108" fill="none" stroke="#1a0d05" strokeWidth="1" />

                {/* ── Outer Wooden Rim (The ship's wheel outer circular frame) ── */}
                <circle r="121" fill="none" stroke="url(#woodGrad)" strokeWidth="22" strokeLinecap="round" />
                <circle r="132" fill="none" stroke="#1a0d05" strokeWidth="2" />
                <circle r="110" fill="none" stroke="#1a0d05" strokeWidth="2" />

                {/* Inner & Outer decorative gold wire rings on the wood rim */}
                <circle r="129" fill="none" stroke="url(#goldGrad)" strokeWidth="1" opacity="0.85" />
                <circle r="113" fill="none" stroke="url(#goldGrad)" strokeWidth="1" opacity="0.85" />

                {/* ── Red Gems / Studs on the rim between spokes ── */}
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = i * 45 + 22.5
                  return (
                    <g key={i} transform={`rotate(${angle}) translate(0, -121)`}>
                      <circle r="6" fill="url(#goldGrad)" stroke="#1a0d05" strokeWidth="1.2" />
                      <circle r="4" fill="url(#redGem)" />
                      <circle cx="-1" cy="-1" r="1" fill="#fff" opacity="0.6" />
                    </g>
                  )
                })}

                {/* ── Emoji + label per segment ── */}
                {ROULETTE_PRIZES.map((p, i) => {
                  const r = toRad(i * 45 + 22.5 - 90)
                  const x = (80 * Math.cos(r)).toFixed(1)
                  const y = (80 * Math.sin(r)).toFixed(1)
                  const tc = SEG_TEXT[i]
                  return (
                    <g key={i} transform={`translate(${x},${y}) rotate(${i * 45 + 22.5})`}>
                      <text textAnchor="middle" y="-6" fontSize="19" style={{ fontFamily: 'system-ui, sans-serif' }}>{p.emoji}</text>
                      <text
                        textAnchor="middle" y="12" fontSize="8" fontWeight="900"
                        fill={tc} paintOrder="stroke"
                        stroke={tc === '#fff3d1' ? '#321e0f' : '#ebdcc3'}
                        strokeWidth="2.5"
                        style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.05em' }}
                      >{p.label.toUpperCase()}</text>
                    </g>
                  )
                })}

                {/* ── Center Hub Bezel ── */}
                <circle r="44" fill="url(#goldGrad)" stroke="#1a0d05" strokeWidth="3" />
                <circle r="38" fill="#321e0f" />
                
                {/* Center Giant Gold Gem instead of button */}
                <circle r="26" fill="url(#goldGem)" stroke="#1a0d05" strokeWidth="2" />
                <circle cx="-6" cy="-6" r="6" fill="#fff" opacity="0.45" filter="blur(1px)" />

                {/* Hub rivets */}
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = i * 45
                  return (
                    <circle
                      key={i}
                      cx={(41 * Math.cos(toRad(angle))).toFixed(1)}
                      cy={(41 * Math.sin(toRad(angle))).toFixed(1)}
                      r="1.5"
                      fill="url(#goldGrad)"
                    />
                  )
                })}
              </svg>
            </div>

            {/* Pointer arrow at top (Clicks dynamically - rotate angle synchronized to spokes) */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: '38px',
                left: '50%',
                transform: `translateX(-50%) rotate(${pinAngle}deg)`,
                transformOrigin: '50% 20%',
                zIndex: 20,
                transition: spinning ? 'none' : 'transform 0.15s ease-out',
              }}
            >
              <svg width="28" height="34" viewBox="0 0 28 34" style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.35))' }}>
                <path d="M14 32 L2 6 Q14 1 26 6 Z" fill="url(#goldGrad)" stroke="#1a0d05" strokeWidth="2.5"/>
                <circle cx="14" cy="9" r="4.5" fill="#321e0f" stroke="#fcd34d" strokeWidth="1.5"/>
              </svg>
            </div>
          </div>

          

          {/* Videogame-style spin button placed outside/below the wheel */}
          <div className="flex justify-center w-full mt-4 shrink-0">
            <GameButton
              variant="dark"
              className="w-64 h-16 text-base disabled:opacity-50"
              onClick={handleSpin}
              disabled={spinning || spinDone}
            >
              {spinning ? (
                <>
                  <i className="ri-loader-4-line mr-2 animate-spin text-xl" />
                  {t('map.spinning')}
                </>
              ) : spinDone ? (
                <>
                  <i className="ri-check-line mr-2 text-xl" />
                  {t('map.prize_claimed')}
                </>
              ) : (
                <>{t('map.spin')}</>
              )}
            </GameButton>
          </div>

          {/* Status text */}
          <div className="h-6 flex items-center justify-center shrink-0">
            
            {spinning && (
              <p className="text-[12px] text-map-gold font-black tracking-wide" style={{ animation: 'stage-blink 0.7s ease-in-out infinite' }}>
                {t('map.spinning_msg')}
              </p>
            )}
            {spinDone && (
              <p className="text-[12px] text-map-gold-light font-black">{t('map.prize_revealed')}</p>
            )}
          </div>
        </div>

       <img 
            src="/assets/img/fondo_tesoro.png" 
            alt="Fondo Tesoro" 
            className="absolute bottom-0 left-0 right-0 w-full opacity-95 pointer-events-none z-10 select-none"
            style={{
              animation: 'treasureGlow 4s ease-in-out infinite'
            }}
          />

          {/* Gold Chest Lens Flare Sparkles overlay */}
          {[
            { left: '23%', bottom: '50px', size: '24px', delay: '0.5s', duration: '5s' },  // Chest left coins
            { left: '32%', bottom: '80px', size: '18px', delay: '2.2s', duration: '6s' },  // Chest top gold
            { left: '14%', bottom: '40px', size: '20px', delay: '4.1s', duration: '5.5s' },  // Skull / bottom chest
            { left: '55%', bottom: '45px', size: '20px', delay: '1.2s', duration: '4.8s' },  // Gold pile center
            { left: '68%', bottom: '70px', size: '26px', delay: '3.5s', duration: '6.2s' },  // Gold pile sword guard
            { left: '76%', bottom: '50px', size: '18px', delay: '0.1s', duration: '5.2s' }   // Gold pile right
          ].map((s, idx) => (
            <div
              key={idx}
              className="lens-flare"
              style={{
                left: s.left,
                bottom: s.bottom,
                width: s.size,
                height: s.size,
                animation: `occasionalSparkle ${s.duration} ease-in-out infinite`,
                animationDelay: s.delay,
              }}
            >
              <div className="lens-flare-core" />
            </div>
          ))}

        {/* Bottom stripe */}
        <div className="h-1.5 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold),var(--color-map-gold-light),var(--color-map-gold),transparent)' }} />
      </div>
    </div>
  )
}
