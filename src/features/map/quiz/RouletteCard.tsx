import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../../config/firebase'
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

const EMPTY_SEG_INDICES = [2, 6]
const PRIZE_INDICES     = [0, 1, 3, 4, 5, 7]  // slots que no son vacíos
const EMPTY_PRIZE_ID    = '__empty__'

/* Paleta de segmentos — 100% brand palette */
const SEG_COLORS = [
  '#fbbf24',  // 0 amber/yellow
  '#00bbb4',  // 1 teal (primary)
  '#ff9447',  // 2 orange (accent) — VACÍO
  '#e0344b',  // 3 red (accent)
  '#18d5cd',  // 4 teal claro
  '#ffb06f',  // 5 naranja suave
  '#096d7d',  // 6 teal oscuro (primary-dark) — VACÍO
  '#f26619',  // 7 naranja profundo
]

const SEG_TEXT = [
  '#7c3a0a',  // 0 amber → oscuro
  '#ffffff',  // 1 teal → blanco
  '#7c2d12',  // 2 orange → oscuro
  '#ffffff',  // 3 red → blanco
  '#024d47',  // 4 teal claro → oscuro
  '#7c2d12',  // 5 naranja suave → oscuro
  '#ffffff',  // 6 teal dark → blanco
  '#ffffff',  // 7 naranja profundo → blanco
]

/* Partículas estáticas para no recrearlas en cada render */
const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  left:     `${5 + (i * 19) % 90}%`,
  bottom:   `${8 + (i * 13) % 65}%`,
  size:     1.5 + (i * 2.3) % 4.5,
  delay:    `${(i * 0.28).toFixed(2)}s`,
  duration: `${2.4 + (i * 0.48) % 3}s`,
  color:    i % 4 === 0 ? 'rgba(0,187,180,0.85)' : i % 4 === 1 ? 'rgba(255,148,71,0.85)' : i % 4 === 2 ? 'rgba(255,255,255,0.75)' : 'rgba(255,176,111,0.8)',
}))

const toRad = (d: number) => d * Math.PI / 180

function segPath(i: number, r: number) {
  const s = toRad(i * 45 - 90)
  const e = toRad((i + 1) * 45 - 90)
  return `M 0 0 L ${(r * Math.cos(s)).toFixed(1)} ${(r * Math.sin(s)).toFixed(1)} A ${r} ${r} 0 0 1 ${(r * Math.cos(e)).toFixed(1)} ${(r * Math.sin(e)).toFixed(1)} Z`
}

export default function RouletteCard({ stopIndex, seasonId, stageId, onSpinComplete }: Props) {
  const { t } = useTranslation()

  const [spinning, setSpinning]       = useState(false)
  const [spinDone, setSpinDone]       = useState(false)
  const [wheelAngle, setWheelAngle]   = useState(0)
  const [claimResult, setClaimResult] = useState<ClaimedPrize | null>(null)
  const [prizes, setPrizes]           = useState<PrizeInfo[]>([])
  const [landedSeg, setLandedSeg]     = useState(stopIndex % 8)
  const [prizeWinCount, setPrizeWinCount] = useState(0)
  const [playerScore, setPlayerScore]     = useState(0)
  const rafRef         = useRef<number | null>(null)
  const segIdxRef      = useRef<number>(stopIndex % 8)
  const claimPrizeIdRef = useRef<string>('')
  const prizesRef      = useRef<PrizeInfo[]>([])

  useEffect(() => {
    getPrizesForStage({ seasonId, stageId })
      .then(data => { console.log('[getPrizesForStage] respuesta:', data); setPrizes(data) })
      .catch(err => console.error('[getPrizesForStage] error:', err))
  }, [seasonId, stageId])

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return
    Promise.all([
      getDoc(doc(db, 'players', user.uid)),
      getDoc(doc(db, 'players', user.uid, 'seasons', seasonId)),
    ]).then(([playerSnap, seasonSnap]) => {
      const score = playerSnap.data()?.score
      setPlayerScore(typeof score === 'number' ? score : 0)
      setPrizeWinCount((seasonSnap.data()?.prizesWon ?? []).length)
    }).catch(() => {})
  }, [seasonId])

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
      if (EMPTY_SEG_INDICES.includes(i)) return { emoji: '😔', label: 'VACÍO', prizeId: EMPTY_PRIZE_ID }
      if (prizes.length === 0) return { emoji, label: fallback[i] ?? '', prizeId: '' }
      const prize = prizes[i % prizes.length]
      const name  = prize.name
      const label = name.length > 9 ? name.slice(0, 8) + '…' : name
      return { emoji, label: label.toUpperCase(), prizeId: prize.id }
    })
  }, [prizes, t])

  const segmentsRef = useRef(segments)
  useEffect(() => { segmentsRef.current = segments }, [segments])
  useEffect(() => { prizesRef.current = prizes }, [prizes])

  // La navegación al premio ya NO es automática — el usuario debe pulsar "Reclamar Premio"

  const stageNum      = parseInt(stageId.replace('stage_', '')) || Math.floor(stopIndex / 4) + 1
  const stopInStage   = (stopIndex % 4) + 1
  const isLastInStage = (stopIndex % 4) === 3

  const emptyPrize = (): ClaimedPrize => ({
    code: EMPTY_PRIZE_ID, prizeId: EMPTY_PRIZE_ID, prizeName: '', prizeImageUrl: '', prizeCategory: '', description: '',
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

    // El resultado se decide antes de girar
    // Si ya ganó 1 premio → siempre vacío
    // Si no → probabilidad según score: score 0 = 40%, score 200+ = 85%
    const limitReached = prizeWinCount >= 1
    let randomSlot: number
    if (limitReached) {
      randomSlot = EMPTY_SEG_INDICES[Math.floor(Math.random() * EMPTY_SEG_INDICES.length)]
    } else {
      const prob  = 0.40 + (Math.min(playerScore, 200) / 200) * 0.45
      const wins  = Math.random() < prob
      randomSlot  = wins
        ? PRIZE_INDICES[Math.floor(Math.random() * PRIZE_INDICES.length)]
        : EMPTY_SEG_INDICES[Math.floor(Math.random() * EMPTY_SEG_INDICES.length)]
    }
    const isEmptySlot = EMPTY_SEG_INDICES.includes(randomSlot)

    if (isEmptySlot) {
      segIdxRef.current      = randomSlot
      claimPrizeIdRef.current = EMPTY_PRIZE_ID
      // setClaimResult aquí no muestra nada hasta que spinDone sea true
      setClaimResult({ code: EMPTY_PRIZE_ID, prizeId: EMPTY_PRIZE_ID, prizeName: '', prizeImageUrl: '', prizeCategory: '', description: '' })
      // La animación sigue igual abajo — no hay API que llamar
    } else {
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
      .catch((err: unknown) => {
        // 409 = ya existe un reclamo para este usuario+etapa (premio ya asignado antes)
        const code = (err as { code?: string })?.code
        const msg  = (err as { message?: string })?.message ?? ''
        if (code === 'already-exists' || msg.includes('409') || msg.toLowerCase().includes('conflict')) {
          // El servidor ya tiene el premio — usamos un resultado vacío para que el usuario
          // pueda igualmente presionar "Reclamar Premio" y ver su pantalla de premio
          setClaimResult(emptyPrize())
        } else {
          setClaimResult(emptyPrize())
        }
        console.warn('[claimPrizeAndNotify] error (posiblemente ya reclamado):', err)
      })
    } // end else (non-empty slot)

    const startAngle = wheelAngle
    const startTime  = performance.now()
    const PHASE1_MS  = 4000
    const PHASE2_MS  = 1400

    let phase2Active = false
    let p2Start = 0
    let p2End   = 0
    let p2Time  = 0

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
        p2Time  = now
        p2Start = startAngle + 2880
        const seg        = segIdxRef.current
        const desiredMod = (360 - (seg * 45 + 22.5) + 360) % 360
        const currentMod = p2Start % 360
        const delta      = (desiredMod - currentMod + 360) % 360
        p2End = p2Start + delta + (delta < 135 ? 360 : 0)
      }

      const p2Elapsed = now - p2Time
      if (p2Elapsed >= PHASE2_MS) {
        rafRef.current = null
        setWheelAngle(p2End)
        setLandedSeg(segIdxRef.current)
        setSpinDone(true)
        setSpinning(false)
        return
      }
      const progress = easeOutQuart(p2Elapsed / PHASE2_MS)
      setWheelAngle(p2Start + progress * (p2End - p2Start))
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
  }

  const diff     = ((wheelAngle + 22.5) % 45) - 22.5
  const pinAngle = (spinning && diff < 0 && diff > -16) ? (diff + 16) * -1.3 : 0

  const wheelSize = 360

  return (
    <div
      className="fixed inset-0 z-999 flex flex-col items-center justify-center gap-6 overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #075f6e 0%, #043d4a 45%, #021e25 100%)' }}
    >
      {/* ── Keyframes locales ── */}
      <style>{`
        @keyframes rouParticle {
          0%   { transform: translateY(0) scale(1);   opacity: 0.9; }
          60%  { opacity: 0.6; }
          100% { transform: translateY(-120px) scale(0.4); opacity: 0; }
        }
        @keyframes wheelShimmer {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes claimPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: inset 0 2px 0 rgba(255,255,255,.35), 0 6px 0 #054f5c, 0 14px 28px rgba(9,109,125,.45);
          }
          50% {
            transform: scale(1.05) translateY(-2px);
            box-shadow: inset 0 2px 0 rgba(255,255,255,.35), 0 8px 0 #054f5c, 0 18px 36px rgba(0,187,180,.7), 0 0 32px rgba(0,187,180,.4);
          }
        }
        @keyframes topBeamPulse {
          0%, 100% { opacity: 0.75; }
          50%      { opacity: 1; }
        }
        @keyframes emptyBounce {
          0%   { transform: scale(0) rotate(-12deg); opacity: 0; }
          55%  { transform: scale(1.3) rotate(6deg);  opacity: 1; }
          75%  { transform: scale(0.88) rotate(-3deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes emptySlideUp {
          from { transform: translateY(18px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes emptyCardIn {
          from { transform: scale(0.88) translateY(12px); opacity: 0; }
          to   { transform: scale(1)    translateY(0);    opacity: 1; }
        }
        @keyframes emptyRing {
          0%   { transform: scale(0.4); opacity: 0.55; }
          100% { transform: scale(3.2); opacity: 0; }
        }
        @keyframes emptyFloat {
          0%, 100% { transform: translateY(0px)   rotate(0deg);  opacity: 0.05; }
          50%      { transform: translateY(-18px) rotate(6deg);  opacity: 0.10; }
        }
      `}</style>

      {/* ── HAZ DE LUZ desde arriba — sin clipPath, todo gradientes suaves ── */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{ zIndex: 1, height: '82%', animation: 'topBeamPulse 3.5s ease-in-out infinite' }}
      >
        {/* Aureola grande */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '100%',
          background: 'radial-gradient(ellipse 75% 85% at 50% 0%, rgba(255,148,71,0.30) 0%, rgba(255,176,111,0.14) 30%, rgba(0,187,180,0.05) 60%, transparent 80%)',
          filter: 'blur(64px)',
        }} />
        {/* Haz medio */}
        <div style={{
          position: 'absolute', top: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: 280, height: '100%',
          background: 'radial-gradient(ellipse 100% 90% at 50% 0%, rgba(255,255,255,0.22) 0%, rgba(255,148,71,0.16) 28%, rgba(0,187,180,0.06) 58%, transparent 80%)',
          filter: 'blur(40px)',
        }} />
        {/* Núcleo fino */}
        <div style={{
          position: 'absolute', top: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: 60, height: '65%',
          background: 'radial-gradient(ellipse 100% 80% at 50% 0%, rgba(255,255,255,0.38) 0%, rgba(255,210,140,0.18) 45%, transparent 80%)',
          filter: 'blur(24px)',
        }} />
      </div>

      {/* ── PARTÍCULAS flotantes ── */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute pointer-events-none rounded-full"
          style={{
            left: p.left,
            bottom: p.bottom,
            width:  p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            animation: `rouParticle ${p.duration} ease-out ${p.delay} infinite`,
            zIndex: 2,
          }}
        />
      ))}

      {/* ── Glow ambiental principal ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '45%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 560, height: 560,
          borderRadius: '50%',
          background: spinning
            ? 'radial-gradient(circle, rgba(255,148,71,0.28) 0%, rgba(0,187,180,0.20) 40%, transparent 70%)'
            : 'radial-gradient(circle, rgba(0,187,180,0.22) 0%, rgba(255,148,71,0.10) 50%, transparent 72%)',
          filter: 'blur(36px)',
          transition: 'background 0.8s ease',
          animation: spinning ? 'pulseGlow 1s ease-in-out infinite' : 'pulseGlow 3s ease-in-out infinite',
          zIndex: 1,
        }}
      />
      {/* Glow naranja en la base */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '40%',
          background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(255,148,71,0.18) 0%, transparent 70%)',
          zIndex: 1,
        }}
      />

      {/* ── TÍTULO + RUEDA — se ocultan cuando el resultado es vacío ── */}
      {!(spinDone && claimResult?.prizeId === EMPTY_PRIZE_ID) && <>

      {/* ── TÍTULO ── */}
      <div className="flex flex-col items-center gap-1.5 z-10 px-6 text-center">
        {/* Chip de etapa */}
        <div
          className="px-4 py-1 rounded-full mb-1"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          <span className="text-xs font-black tracking-widest uppercase text-white" style={{ opacity: 0.85 }}>
            {isLastInStage
              ? t('map.stage_completed_final', { n: stageNum })
              : t('map.stage_completed', { n: stopInStage })}
          </span>
        </div>

        {/* Título principal — ¡GIRA Y GANA! */}
        <h1
          className="font-black leading-none"
          style={{
            fontFamily: 'Outfit, Inter, system-ui, sans-serif',
            fontSize: 'clamp(36px, 10vw, 52px)',
            background: 'linear-gradient(135deg, #ff9447 0%, #fbbf24 55%, #ffffff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 3px 14px rgba(255,148,71,0.55))',
            letterSpacing: '-0.02em',
          }}
        >
          ¡GIRA Y GANA!
        </h1>

        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {isLastInStage ? t('map.roulette_msg_final') : t('map.roulette_msg_normal')}
        </p>
      </div>

      {/* ── RUEDA ── */}
      <div className="relative flex items-center justify-center select-none z-10" style={{ width: wheelSize, height: wheelSize }}>

        {/* Glow ring exterior */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: spinning
              ? '0 0 60px rgba(0,187,180,0.7), 0 0 100px rgba(0,187,180,0.35)'
              : spinDone
                ? `0 0 60px ${SEG_COLORS[landedSeg]}88, 0 0 100px ${SEG_COLORS[landedSeg]}44`
                : '0 0 32px rgba(0,187,180,0.3), 0 0 64px rgba(0,187,180,0.12)',
            transition: 'box-shadow 0.5s ease',
          }}
        />

        {/* Rueda giratoria */}
        <div
          style={{
            width: wheelSize, height: wheelSize,
            transform: `rotate(${wheelAngle}deg)`,
            willChange: 'transform',
          }}
        >
          <svg
            width={wheelSize}
            height={wheelSize}
            viewBox="-160 -160 320 320"
            style={{ display: 'block', overflow: 'visible' }}
          >
            <defs>
              {SEG_COLORS.map((c, i) => (
                <radialGradient key={i} id={`sg${i}`} cx="40%" cy="35%" r="75%">
                  <stop offset="0%"   stopColor={c} stopOpacity="1" />
                  <stop offset="100%" stopColor={c} stopOpacity="0.78" />
                </radialGradient>
              ))}
            </defs>

            {/* Segmentos */}
            {segments.map((_, i) => (
              <path
                key={i}
                d={segPath(i, 132)}
                fill={`url(#sg${i})`}
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="1.5"
              />
            ))}

            {/* Flash en segmento ganador */}
            {spinDone && (
              <path
                d={segPath(landedSeg, 132)}
                fill="rgba(255,255,255,0.25)"
                stroke="#ffffff"
                strokeWidth="3"
                style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.9))', animation: 'pulseGlow 0.55s ease-in-out infinite', pointerEvents: 'none' }}
              />
            )}

            {/* Aro exterior blanco */}
            <circle r="132" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="7" />
            {/* Línea interior sutil */}
            <circle r="128" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />

            {/* Puntitos en el aro */}
            {Array.from({ length: 24 }).map((_, i) => {
              const a = toRad(i * 15)
              return (
                <circle
                  key={i}
                  cx={(141 * Math.cos(a)).toFixed(1)}
                  cy={(141 * Math.sin(a)).toFixed(1)}
                  r="3"
                  fill="rgba(255,255,255,0.7)"
                />
              )
            })}

            {/* Etiquetas de segmento */}
            {segments.map((p, i) => {
              const bisector = i * 45 + 22.5
              const svgRad   = toRad(bisector - 90)
              const x        = (86 * Math.cos(svgRad)).toFixed(1)
              const y        = (86 * Math.sin(svgRad)).toFixed(1)
              const rot      = bisector <= 180 ? bisector - 90 : bisector + 90
              return (
                <g key={i} transform={`translate(${x},${y}) rotate(${rot})`}>
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="8"
                    fontWeight="900"
                    fill={SEG_TEXT[i]}
                    style={{ fontFamily: 'Outfit, Inter, system-ui, sans-serif', letterSpacing: '0.05em' }}
                  >
                    {p.label}
                  </text>
                </g>
              )
            })}

            {/* Hub central */}
            <circle r="32" fill="white" />
            <circle r="28" fill="rgba(0,187,180,0.15)" />
            <circle r="18" fill="#00bbb4" />
            <circle r="10" fill="white" />
            <circle cx="-4" cy="-4" r="3.5" fill="rgba(255,255,255,0.7)" />
          </svg>
        </div>

        {/* Brillo giratorio — un solo arco luminoso */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: 0, left: 0,
            width: wheelSize, height: wheelSize,
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.05) 8%, rgba(255,255,255,0.20) 14%, rgba(255,255,255,0.05) 20%, transparent 30%)',
            animation: 'wheelShimmer 3.5s linear infinite',
            zIndex: 18,
          }}
        />

        {/* Puntero fijo — no gira */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: 4,
            left: '50%',
            transform: `translateX(-50%) rotate(${pinAngle}deg)`,
            transformOrigin: '50% 15%',
            zIndex: 20,
            transition: spinning ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <svg width="26" height="36" viewBox="0 0 26 36" style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))' }}>
            <path d="M13 34 L1 7 Q13 1 25 7 Z" fill="#00bbb4" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx="13" cy="10" r="5" fill="white" />
            <circle cx="11" cy="8"  r="2" fill="rgba(0,187,180,0.5)" />
          </svg>
        </div>
      </div>

      </>} {/* fin título + rueda */}

      {/* ── Decoración fondo estado vacío ── */}
      {spinDone && claimResult?.prizeId === EMPTY_PRIZE_ID && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 3 }}>
          {/* Emoji gigante de fondo */}
          <div style={{ fontSize: 260, lineHeight: 1, animation: 'emptyFloat 4.5s ease-in-out infinite', userSelect: 'none' }}>
            😔
          </div>
          {/* Anillos pulsantes */}
          {[0, 0.85, 1.7].map((delay, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 180, height: 180,
                border: '2px solid rgba(224,52,75,0.45)',
                animation: `emptyRing 2.6s ease-out ${delay}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── ESTADO / BOTÓN ── */}
      <div className="flex flex-col items-center gap-3 z-10">

        {/* Mensaje de estado mientras gira o prepara */}
        {spinning && (
          <p className="text-sm font-black tracking-widest uppercase" style={{ color: '#00bbb4', animation: 'stage-blink 0.7s ease-in-out infinite' }}>
            {t('map.spinning_msg')}
          </p>
        )}
        {spinDone && !claimResult && (
          <p className="text-sm font-black tracking-wide" style={{ color: '#ff9447', animation: 'stage-blink 0.7s ease-in-out infinite' }}>
            {t('map.roulette_preparing')}
          </p>
        )}

        {/* Botón GIRAR — visible solo antes de girar */}
        {!spinDone && (
          <button
            onClick={handleSpin}
            disabled={spinning || prizes.length === 0}
            className="active:translate-y-[4px] transition-all"
            style={{
              width: 240, height: 62,
              borderRadius: 31,
              background: (spinning || prizes.length === 0)
                ? 'linear-gradient(180deg,#4b5563 0%,#374151 100%)'
                : 'linear-gradient(180deg,#ffb06f 0%,#ff9447 45%,#e07830 100%)',
              border: '2px solid',
              borderColor: spinning ? '#374151' : '#d46f2b',
              boxShadow: (spinning || prizes.length === 0)
                ? '0 6px 0 #1f2937'
                : 'inset 0 2px 0 rgba(255,255,255,.4), 0 6px 0 #b85e1c, 0 14px 28px rgba(255,148,71,.55)',
              color: '#ffffff',
              fontFamily: 'Outfit, Inter, system-ui, sans-serif',
              fontWeight: 900,
              fontSize: 20,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: spinning ? 'not-allowed' : 'pointer',
              opacity: prizes.length === 0 ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {spinning ? (
              <><i className="ri-loader-4-line animate-spin text-xl" />{t('map.spinning')}</>
            ) : prizes.length === 0 ? (
              <><i className="ri-loader-4-line animate-spin text-xl" />{t('map.roulette_loading')}</>
            ) : (
              t('map.spin')
            )}
          </button>
        )}

        {/* Sin premio */}
        {spinDone && claimResult?.prizeId === EMPTY_PRIZE_ID && (
          <div className="flex flex-col items-center gap-4 z-10">

            {/* Chip de etapa */}
            <div
              className="px-4 py-1 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                animation: 'emptySlideUp 0.4s ease 0.05s both',
              }}
            >
              <span className="text-xs font-black tracking-widest uppercase text-white" style={{ opacity: 0.85 }}>
                {isLastInStage
                  ? t('map.stage_completed_final', { n: stageNum })
                  : t('map.stage_completed', { n: stopInStage })}
              </span>
            </div>

          <div
            className="flex flex-col items-center gap-3"
            style={{
              background: 'rgba(2,30,37,0.72)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 28,
              padding: '28px 44px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
              animation: 'emptyCardIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
            }}
          >
            {/* Emoji con bounce */}
            <div style={{ fontSize: 58, lineHeight: 1, animation: 'emptyBounce 0.65s cubic-bezier(0.36,0.07,0.19,0.97) 0.1s both' }}>
              💪
            </div>

            {/* Título */}
            <p
              className="font-black text-center"
              style={{
                fontFamily: 'Outfit, Inter, system-ui, sans-serif',
                fontSize: 26,
                color: '#00bbb4',
                textShadow: '0 2px 12px rgba(0,0,0,0.7), 0 0 28px rgba(0,187,180,0.35)',
                letterSpacing: '-0.01em',
                animation: 'emptySlideUp 0.45s ease 0.28s both',
              }}
            >
              {t('map.no_prize_title')}
            </p>

            {/* Subtítulo */}
            <p
              className="text-center"
              style={{
                fontFamily: 'Outfit, Inter, system-ui, sans-serif',
                fontSize: 13,
                color: 'rgba(255,255,255,0.68)',
                letterSpacing: '0.02em',
                lineHeight: 1.55,
                maxWidth: 220,
                animation: 'emptySlideUp 0.45s ease 0.42s both',
              }}
            >
              {t('map.no_prize_subtitle')}
            </p>

            {/* Botón */}
            <button
              onClick={() => onSpinComplete(claimResult)}
              className="active:translate-y-[3px] transition-transform"
              style={{
                marginTop: 10,
                width: 220, height: 56,
                borderRadius: 28,
                background: 'linear-gradient(180deg,#18d5cd 0%,#00bbb4 45%,#096d7d 100%)',
                border: '2px solid #0c7f89',
                boxShadow: 'inset 0 2px 0 rgba(255,255,255,.22), 0 5px 0 #054f5c, 0 12px 24px rgba(0,187,180,0.32)',
                color: '#ffffff',
                fontFamily: 'Outfit, Inter, system-ui, sans-serif',
                fontWeight: 800,
                fontSize: 16,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                animation: 'emptySlideUp 0.45s ease 0.56s both',
              }}
            >
              <i className="ri-arrow-right-circle-fill text-xl" />
              {t('map.no_prize_btn')}
            </button>
          </div>
          </div>
        )}

        {/* Botón RECLAMAR PREMIO — aparece cuando el giro terminó y el resultado ya llegó */}
        {spinDone && claimResult && claimResult.prizeId !== EMPTY_PRIZE_ID && (
          <button
            onClick={() => onSpinComplete(claimResult)}
            className="animate-fade-in"
            style={{
              width: 260, height: 62,
              borderRadius: 31,
              background: 'linear-gradient(180deg,#18d5cd 0%,#00bbb4 45%,#096d7d 100%)',
              border: '2px solid #0c7f89',
              animation: 'claimPulse 1.6s ease-in-out infinite',
              color: '#ffffff',
              fontFamily: 'Outfit, Inter, system-ui, sans-serif',
              fontWeight: 900,
              fontSize: 18,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <i className="ri-gift-fill text-xl" />
            {t('map.claim_prize')}
          </button>
        )}
      </div>
    </div>
  )
}
