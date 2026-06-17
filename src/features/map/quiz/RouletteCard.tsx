import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import GameButton from './GameButton'
import { claimPrizeAndNotify, getPrizesForStage } from '../services/prizeApi'
import type { PrizeInfo } from '../services/prizeApi'
import type { ClaimedPrize } from '../types/quiz.types'

interface Props {
  stopIndex: number
  seasonId: string
  stageId: string
  onSpinComplete: (prize: ClaimedPrize) => void
}

const ROULETTE_EMOJIS = ['🪙', '🗝️', '🧭', '🗺️', '💰', '🛡️', '⚔️', '💎']

const SEG_COLORS = [
  '#ebdcc3',
  '#321e0f',
  '#fcd34d',
  '#a87f2a',
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

export default function RouletteCard({ stopIndex, seasonId, stageId, onSpinComplete }: Props) {
  const { t } = useTranslation()

  const [spinning, setSpinning] = useState(false)
  const [spinDone, setSpinDone] = useState(false)
  const [wheelAngle, setWheelAngle] = useState(0)
  const [animDone, setAnimDone] = useState(false)
  const [claimResult, setClaimResult] = useState<ClaimedPrize | null>(null)
  const [prizes, setPrizes] = useState<PrizeInfo[]>([])
  const [landedSeg, setLandedSeg] = useState(stopIndex % 8)
  const rafRef = useRef<number | null>(null)
  const segIdxRef = useRef<number>(stopIndex % 8)
  const claimPrizeIdRef = useRef<string>('')
  const prizesRef = useRef<PrizeInfo[]>([])

  useEffect(() => {
    getPrizesForStage({ seasonId, stageId })
      .then(data => {
        console.log('[getPrizesForStage] respuesta:', data)
        setPrizes(data)
      })
      .catch(err => console.error('[getPrizesForStage] error:', err))
  }, [seasonId, stageId])

  useEffect(() => {
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [])

  const segments = useMemo(() => {
    const fallback = [
      t('map.roulette_coins'), t('map.roulette_key'), t('map.roulette_compass'),
      t('map.roulette_map'), t('map.roulette_chest'), t('map.roulette_shield'),
      t('map.roulette_sword'), t('map.roulette_gem'),
    ]
    return ROULETTE_EMOJIS.map((emoji, i) => {
      if (prizes.length === 0) return { emoji, label: fallback[i] ?? '', prizeId: '' }
      const prize = prizes[i % prizes.length]
      const name = prize.name
      const label = name.length > 9 ? name.slice(0, 8) + '…' : name
      return { emoji, label: label.toUpperCase(), prizeId: prize.id }
    })
  }, [prizes, t])

  const segmentsRef = useRef(segments)
  useEffect(() => { segmentsRef.current = segments }, [segments])
  useEffect(() => { prizesRef.current = prizes }, [prizes])

  // Cuando la animación Y la CF terminan → transicionar
  useEffect(() => {
    if (!animDone || !claimResult) return
    const t = setTimeout(() => onSpinComplete(claimResult), 1500)
    return () => clearTimeout(t)
  }, [animDone, claimResult, onSpinComplete])

  const stageNum = parseInt(stageId.replace('stage_', '')) || Math.floor(stopIndex / 4) + 1
  const stopInStage = (stopIndex % 4) + 1
  const isLastInStage = (stopIndex % 4) === 3

  const emptyPrize = (): ClaimedPrize => ({
    code: '', prizeId: claimPrizeIdRef.current, prizeName: '', prizeImageUrl: '', prizeCategory: '', description: '',
  })

  const enrichResult = (result: ClaimedPrize): ClaimedPrize => {
    const lookupId = result.prizeId || claimPrizeIdRef.current
    const info = prizesRef.current.find(p => p.id === lookupId)
    if (!info) return result
    return {
      ...result,
      prizeId:       result.prizeId       || lookupId,
      prizeName:     result.prizeName     || info.name,
      prizeImageUrl: result.prizeImageUrl || info.imageUrl,
      prizeCategory: result.prizeCategory || info.categoria,
      description:   result.description   || info.description,
    }
  }


  const handleSpin = () => {
    if (spinning || spinDone) return
    setSpinning(true)
    const p = prizesRef.current
    claimPrizeIdRef.current = p.length > 0 ? p[Math.floor(Math.random() * p.length)].id : ''
    console.log('[handleSpin] prizes cargados:', p.length, '| prizeId seleccionado:', claimPrizeIdRef.current)

    claimPrizeAndNotify({ prizeId: claimPrizeIdRef.current, seasonId, stageId })
      .then(result => {
        const enriched = enrichResult(result)
        const idx = segmentsRef.current.findIndex(s => s.prizeId === enriched.prizeId)
        if (idx >= 0) segIdxRef.current = idx
        setClaimResult(enriched)
      })
      .catch(() => { setClaimResult(emptyPrize()) })

    const startAngle = wheelAngle
    const startTime = performance.now()
    const PHASE1_MS = 4000
    const PHASE2_MS = 1400

    let phase2Active = false
    let p2Start = 0
    let p2End = 0
    let p2Time = 0

    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

    const animate = (now: number) => {
      const elapsed = now - startTime

      if (!phase2Active) {
        if (elapsed < PHASE1_MS) {
          setWheelAngle(startAngle + (elapsed / PHASE1_MS) * 2880)
          rafRef.current = requestAnimationFrame(animate)
          return
        }
        phase2Active = true
        p2Time = now
        p2Start = startAngle + 2880
        const seg = segIdxRef.current
        const desiredMod = (360 - (seg * 45 + 22.5) + 360) % 360
        const currentMod = p2Start % 360
        const delta = (desiredMod - currentMod + 360) % 360
        p2End = p2Start + delta + (delta < 135 ? 360 : 0)
      }

      const p2Elapsed = now - p2Time
      if (p2Elapsed >= PHASE2_MS) {
        rafRef.current = null
        setWheelAngle(p2End)
        setLandedSeg(segIdxRef.current)
        setSpinDone(true)
        setSpinning(false)
        setAnimDone(true)
        return
      }
      const progress = easeOutQuart(p2Elapsed / PHASE2_MS)
      setWheelAngle(p2Start + progress * (p2End - p2Start))
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
  }

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

        {/* Spotlight */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-10 mix-blend-screen"
          style={{
            width: '100%', height: '460px',
            background: 'radial-gradient(circle at 50% -20px, rgba(252,211,77,0.7) 0%, rgba(252,211,77,0.22) 50%, transparent 85%)',
            filter: 'blur(30px)',
            animation: 'pulseGlow 4s ease-in-out infinite',
          }}
        />

        {/* Particles */}
        {Array.from({ length: 22 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${5 + (i * 37) % 90}%`,
              bottom: `${15 + (i * 11) % 40}px`,
              width: `${3 + (i * 7) % 6}px`,
              height: `${3 + (i * 7) % 6}px`,
              background: 'radial-gradient(circle, #fff 0%, var(--color-map-gold-light) 60%, var(--color-map-gold) 100%)',
              boxShadow: '0 0 6px var(--color-map-gold-light), 0 0 10px var(--color-map-gold)',
              animation: `floatFromTreasure ${3 + (i * 1.4) % 4.5}s ease-out infinite`,
              animationDelay: `${(i * 0.22).toFixed(2)}s`,
              zIndex: 15,
            }}
          />
        ))}

        {/* Bottom Glow */}
        <div
          className="absolute bottom-0 left-0 right-0 w-full h-[180px] pointer-events-none z-10 mix-blend-screen"
          style={{
            background: 'radial-gradient(circle at 50% 100%, rgba(252,211,77,0.5) 0%, rgba(252,211,77,0.15) 55%, transparent 80%)',
            filter: 'blur(12px)'
          }}
        />

        {/* Body */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start gap-6 px-5 pt-8 pb-36 text-center relative z-20" style={{ scrollbarWidth: 'none' }}>

          <div className="logro-badge-pop flex flex-col items-center gap-1.5 shrink-0 mt-2">
            <h2 className="text-2xl font-black text-map-wood-dark" style={{ fontFamily: 'Georgia, serif' }}>
              {isLastInStage ? t('map.stage_completed_final', { n: stageNum }) : t('map.stage_completed', { n: stopInStage })}
            </h2>
            <p className="text-[12px] text-[#6b4a20] leading-relaxed max-w-[280px]">
              {isLastInStage ? t('map.roulette_msg_final') : t('map.roulette_msg_normal')}
            </p>
          </div>

          {/* Wheel */}
          <div className="relative flex items-center justify-center select-none shrink-0" style={{ width: '360px', height: '360px' }}>
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

            <div style={{ position: 'relative', width: '360px', height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${wheelAngle}deg)`, willChange: 'transform' }}>
              <svg width="360" height="360" viewBox="-180 -180 360 360" style={{ display: 'block', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7a4824" />
                    <stop offset="50%" stopColor="#503019" />
                    <stop offset="100%" stopColor="#22150c" />
                  </linearGradient>
                  <linearGradient id="woodLightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#a87f2a" />
                    <stop offset="50%" stopColor="#7a4824" />
                    <stop offset="100%" stopColor="#321e0f" />
                  </linearGradient>
                  <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="40%" stopColor="#fcd34d" />
                    <stop offset="100%" stopColor="#a87f2a" />
                  </linearGradient>
                  <radialGradient id="redGem" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#ff8888" />
                    <stop offset="40%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#7f1d1d" />
                  </radialGradient>
                  <radialGradient id="goldGem" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#fffbeb" />
                    <stop offset="40%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#b45309" />
                  </radialGradient>
                </defs>

                {Array.from({ length: 8 }).map((_, i) => (
                  <g key={i} transform={`rotate(${i * 45})`}>
                    <rect x="-8" y="-175" width="16" height="60" rx="8" fill="rgba(0,0,0,0.25)" transform="translate(2, 4)" />
                    <rect x="-4" y="-120" width="8" height="120" fill="url(#woodGrad)" stroke="#1a0d05" strokeWidth="1.5" />
                    <rect x="-6" y="-136" width="12" height="6" rx="1.5" fill="url(#goldGrad)" stroke="#1a0d05" strokeWidth="1" />
                    <path d="M -5 -136 C -10 -142, -10 -155, -5 -162 L 5 -162 C 10 -155, 10 -142, 5 -136 Z" fill="url(#woodLightGrad)" stroke="#1a0d05" strokeWidth="1.5" />
                    <rect x="-3" y="-167" width="6" height="6" fill="url(#woodGrad)" stroke="#1a0d05" strokeWidth="1" />
                    <circle cx="0" cy="-172" r="7" fill="url(#woodLightGrad)" stroke="#1a0d05" strokeWidth="1.5" />
                    <circle cx="-2" cy="-174" r="2" fill="rgba(255,255,255,0.3)" />
                  </g>
                ))}

                {segments.map((_, i) => (
                  <path key={i} d={segPath(i, 110)} fill={SEG_COLORS[i]} stroke="#1a0d05" strokeWidth="2.5" />
                ))}

                {spinDone && (
                  <path
                    d={segPath(landedSeg, 110)}
                    fill="rgba(252, 211, 77, 0.25)"
                    stroke="#ffffff"
                    strokeWidth="4"
                    style={{ filter: 'drop-shadow(0 0 12px var(--color-map-gold-light))', animation: 'pulseGlow 0.6s ease-in-out infinite', pointerEvents: 'none' }}
                  />
                )}

                <circle r="110" fill="none" stroke="url(#goldGrad)" strokeWidth="3" />
                <circle r="108" fill="none" stroke="#1a0d05" strokeWidth="1" />
                <circle r="121" fill="none" stroke="url(#woodGrad)" strokeWidth="22" strokeLinecap="round" />
                <circle r="132" fill="none" stroke="#1a0d05" strokeWidth="2" />
                <circle r="110" fill="none" stroke="#1a0d05" strokeWidth="2" />
                <circle r="129" fill="none" stroke="url(#goldGrad)" strokeWidth="1" opacity="0.85" />
                <circle r="113" fill="none" stroke="url(#goldGrad)" strokeWidth="1" opacity="0.85" />

                {Array.from({ length: 8 }).map((_, i) => (
                  <g key={i} transform={`rotate(${i * 45 + 22.5}) translate(0, -121)`}>
                    <circle r="6" fill="url(#goldGrad)" stroke="#1a0d05" strokeWidth="1.2" />
                    <circle r="4" fill="url(#redGem)" />
                    <circle cx="-1" cy="-1" r="1" fill="#fff" opacity="0.6" />
                  </g>
                ))}

                {segments.map((p, i) => {
                  const bisector = i * 45 + 22.5
                  const svgRad = toRad(bisector - 90)
                  const x = (72 * Math.cos(svgRad)).toFixed(1)
                  const y = (72 * Math.sin(svgRad)).toFixed(1)
                  const rot = bisector <= 180 ? bisector - 90 : bisector + 90
                  return (
                    <g key={i} transform={`translate(${x},${y}) rotate(${rot})`}>
                      <text textAnchor="middle" dominantBaseline="middle" fontSize="7.5" fontWeight="900" fill={SEG_TEXT[i]} paintOrder="stroke" stroke={SEG_TEXT[i] === '#fff3d1' ? '#321e0f' : '#ebdcc3'} strokeWidth="2.5" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.04em' }}>
                        {p.label}
                      </text>
                    </g>
                  )
                })}

                <circle r="44" fill="url(#goldGrad)" stroke="#1a0d05" strokeWidth="3" />
                <circle r="38" fill="#321e0f" />
                <circle r="26" fill="url(#goldGem)" stroke="#1a0d05" strokeWidth="2" />
                <circle cx="-6" cy="-6" r="6" fill="#fff" opacity="0.45" />

                {Array.from({ length: 8 }).map((_, i) => (
                  <circle key={i} cx={(41 * Math.cos(toRad(i * 45))).toFixed(1)} cy={(41 * Math.sin(toRad(i * 45))).toFixed(1)} r="1.5" fill="url(#goldGrad)" />
                ))}
              </svg>
            </div>

            <div className="absolute pointer-events-none" style={{ top: '38px', left: '50%', transform: `translateX(-50%) rotate(${pinAngle}deg)`, transformOrigin: '50% 20%', zIndex: 20, transition: spinning ? 'none' : 'transform 0.15s ease-out' }}>
              <svg width="28" height="34" viewBox="0 0 28 34" style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.35))' }}>
                <path d="M14 32 L2 6 Q14 1 26 6 Z" fill="url(#goldGrad)" stroke="#1a0d05" strokeWidth="2.5" />
                <circle cx="14" cy="9" r="4.5" fill="#321e0f" stroke="#fcd34d" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          {/* Spin button */}
          <div className="flex justify-center w-full mt-4 shrink-0">
            <GameButton
              variant="dark"
              className="w-64 h-16 text-base disabled:opacity-50"
              onClick={handleSpin}
              disabled={spinning || spinDone || prizes.length === 0}
            >
              {spinning ? (
                <><i className="ri-loader-4-line mr-2 animate-spin text-xl" />{t('map.spinning')}</>
              ) : spinDone ? (
                <><i className="ri-check-line mr-2 text-xl" />{t('map.prize_claimed')}</>
              ) : prizes.length === 0 ? (
                <><i className="ri-loader-4-line mr-2 animate-spin text-xl" />{t('map.roulette_loading')}</>
              ) : (
                <>{t('map.spin')}</>
              )}
            </GameButton>
          </div>

          {/* Status text */}
          <div className="flex flex-col items-center gap-2 min-h-6 shrink-0">
            {spinning && (
              <p className="text-[12px] text-map-gold font-black tracking-wide" style={{ animation: 'stage-blink 0.7s ease-in-out infinite' }}>
                {t('map.spinning_msg')}
              </p>
            )}
            {spinDone && !claimResult && (
              <p className="text-[12px] text-map-gold font-black tracking-wide" style={{ animation: 'stage-blink 0.7s ease-in-out infinite' }}>
                {t('map.roulette_preparing')}
              </p>
            )}
            {spinDone && claimResult && (
              <p className="text-[12px] text-map-gold-light font-black">{t('map.prize_revealed')}</p>
            )}
          </div>
        </div>

        <img
          src="/assets/img/fondo_tesoro.png"
          alt="Fondo Tesoro"
          className="absolute bottom-0 left-0 right-0 w-full opacity-95 pointer-events-none z-10 select-none"
          style={{ animation: 'treasureGlow 4s ease-in-out infinite' }}
        />

        {[
          { left: '23%', bottom: '50px', size: '24px', delay: '0.5s', duration: '5s' },
          { left: '32%', bottom: '80px', size: '18px', delay: '2.2s', duration: '6s' },
          { left: '14%', bottom: '40px', size: '20px', delay: '4.1s', duration: '5.5s' },
          { left: '55%', bottom: '45px', size: '20px', delay: '1.2s', duration: '4.8s' },
          { left: '68%', bottom: '70px', size: '26px', delay: '3.5s', duration: '6.2s' },
          { left: '76%', bottom: '50px', size: '18px', delay: '0.1s', duration: '5.2s' }
        ].map((s, idx) => (
          <div key={idx} className="lens-flare" style={{ left: s.left, bottom: s.bottom, width: s.size, height: s.size, animation: `occasionalSparkle ${s.duration} ease-in-out infinite`, animationDelay: s.delay }}>
            <div className="lens-flare-core" />
          </div>
        ))}

        <div className="h-1.5 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold),var(--color-map-gold-light),var(--color-map-gold),transparent)' }} />
      </div>
    </div>
  )
}
