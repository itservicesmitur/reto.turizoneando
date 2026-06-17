import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  level: number
  coins: number
  stopNumber: number
  stopName: string
  mode?: 'complete' | 'partial'
  onContinue: () => void
  onBackToMap: () => void
}

// Monedas vuelan desde el cofre (abajo) al contador (arriba)
// El contenedor se ancla en el contador; sy positivo = empieza debajo (en el cofre)
const FLYING = [
  { sx: '-70px',  sy: '420px', delay: '0.00s' },
  { sx:  '60px',  sy: '415px', delay: '0.12s' },
  { sx: '-110px', sy: '390px', delay: '0.22s' },
  { sx:  '100px', sy: '395px', delay: '0.32s' },
  { sx: '-45px',  sy: '440px', delay: '0.42s' },
  { sx:  '40px',  sy: '435px', delay: '0.52s' },
  { sx: '-85px',  sy: '375px', delay: '0.60s' },
  { sx:  '75px',  sy: '380px', delay: '0.68s' },
  { sx:  '12px',  sy: '455px', delay: '0.76s' },
  { sx: '-28px',  sy: '405px', delay: '0.84s' },
]

export default function LevelUpCard({
  level,
  coins,
  stopNumber,
  stopName,
  mode = 'complete',
  onContinue,
  onBackToMap,
}: Props) {
  const { t } = useTranslation()
  const [display, setDisplay]         = useState(0)
  const [phase, setPhase]             = useState<'in' | 'open' | 'coins'>('in')
  const [frozenSrc, setFrozenSrc]     = useState<string | null>(null)
  const [chestLoaded, setChestLoaded] = useState(false)
  const [boxPulse, setBoxPulse]       = useState(false)

  const rafRef  = useRef<number>(0)

  // En modo partial: cuando el texto ya aterrizó dentro del recuadro, activar pulso suave
  useEffect(() => {
    if (mode !== 'partial' || phase !== 'coins') return
    // última letra (índice ~13) aterriza en ~1.74s → esperar 2s para asegurar
    const timer = setTimeout(() => setBoxPulse(true), 2000)
    return () => clearTimeout(timer)
  }, [phase, mode])

  useEffect(() => {
    // Safety fallback: if load event doesn't fire in 1s, trigger anyway
    const fallback = setTimeout(() => {
      setChestLoaded(true)
    }, 1000)
    return () => clearTimeout(fallback)
  }, [])

  useEffect(() => {
    if (!chestLoaded) return

    // 1. fase "open": aparecen los rayos cuando el cofre se abre (frame 100 = 3.0s)
    const t1 = setTimeout(() => setPhase('open'), 3000)

    // 2. fase "coins": vuelan las monedas (frame 125 = 3.75s)
    const t2 = setTimeout(() => setPhase('coins'), 3750)

    // 3. congelar el GIF: después de que todo se calma (frame 270 = 8.1s)
    const t3 = setTimeout(() => {
      setFrozenSrc('/assets/img/COFRE_OPEN.png')
    }, 8100)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [chestLoaded])

  // Contador arranca al entrar en fase 'coins'
  useEffect(() => {
    if (phase !== 'coins') return
    if (mode === 'partial') return
    const duration = 4300
    let startTs: number | null = null
    const tick = (ts: number) => {
      if (!startTs) startTs = ts
      const prog  = Math.min((ts - startTs) / duration, 1)
      // ease-in-out: llega al valor final a la vez que las monedas dejan de volar
      const eased = prog < 0.5 ? 2 * prog * prog : 1 - Math.pow(-2 * prog + 2, 2) / 2
      setDisplay(Math.round(eased * coins))
      if (prog < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        // Sincronizar: congelar GIF en el mismo frame que el contador termina
        setFrozenSrc('/assets/img/COFRE_OPEN.png')
      }
    }
    const d2 = setTimeout(() => { rafRef.current = requestAnimationFrame(tick) }, 100)
    return () => { clearTimeout(d2); cancelAnimationFrame(rafRef.current) }
  }, [phase, coins, mode])

  return (
      <div
        className="fixed inset-0 z-999 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg,var(--color-map-wood-deep) 0%,var(--color-map-wood-mid) 45%,var(--color-map-wood-deep) 100%)',
          animation: 'lu-in .3s ease forwards',
        }}
      >
        {/* Glow dorado desde la base (donde está el cofre) */}
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '62%',
            background: 'radial-gradient(ellipse 95% 75% at 50% 100%, rgba(255,193,7,.26) 0%, rgba(168,127,42,.10) 45%, transparent 68%)',
            pointerEvents: 'none',
            animation: phase !== 'in' ? 'lu-glow-pulse 2.2s ease-in-out infinite' : undefined,
          }}
        />

        {/* Rayos giratorios — visibles desde fase "open" */}
        {phase !== 'in' && (
          <div
            style={{
              position: 'absolute',
              bottom: -150,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 560, height: 560,
              pointerEvents: 'none',
              zIndex: 1,
              animation: 'lu-in 1.2s ease-out both',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                animation: 'lu-ray-spin 24s linear infinite',
              }}
            >
              <svg width="560" height="560" viewBox="-280 -280 560 560">
                <defs>
                  <filter id="lu-blur">
                    <feGaussianBlur stdDeviation="8" />
                  </filter>
                  <radialGradient id="lu-rg" cx="50%" cy="50%" r="50%">
                    <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.5" />
                    <stop offset="35%"  stopColor="#fcd34d" stopOpacity="0.25" />
                    <stop offset="70%"  stopColor="#a87f2a" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#5a3e0a" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <g filter="url(#lu-blur)">
                  {Array.from({ length: 18 }, (_, i) => {
                    const a  = i * (360 / 18) * Math.PI / 180
                    const w  = i % 9 === 0 ? 38 : i % 3 === 0 ? 20 : 10
                    const op = i % 9 === 0 ? 0.35 : i % 3 === 0 ? 0.22 : 0.12
                    return (
                      <line key={i}
                        x1="0" y1="0"
                        x2={(Math.cos(a) * 268).toFixed(1)}
                        y2={(Math.sin(a) * 268).toFixed(1)}
                        stroke="url(#lu-rg)"
                        strokeWidth={w}
                        strokeOpacity={op}
                      />
                    )
                  })}
                </g>
              </svg>
            </div>
          </div>
        )}

        {/* Luz volumétrica que viene de abajo (boca del cofre) */}
        {phase !== 'in' && (
          <div
            style={{
              position: 'absolute',
              bottom: 75,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 420,
              height: 300,
              pointerEvents: 'none',
              zIndex: 9,
              mixBlendMode: 'screen',
              opacity: 0.55,
              animation: 'lu-in 1.2s ease-out both, lu-glow-pulse 2.2s ease-in-out infinite',
            }}
          >
            <svg width="100%" height="100%" viewBox="0 0 420 300">
              <defs>
                <linearGradient id="beam-grad-1" x1="50%" y1="100%" x2="50%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                  <stop offset="25%" stopColor="#ffe96a" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#fcd34d" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#a87f2a" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="beam-grad-2" x1="50%" y1="100%" x2="50%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
                  <stop offset="30%" stopColor="#ffb3d9" stopOpacity="0.3" />
                  <stop offset="70%" stopColor="#fcd34d" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#a87f2a" stopOpacity="0" />
                </linearGradient>
                <filter id="beam-blur">
                  <feGaussianBlur stdDeviation="15" />
                </filter>
              </defs>
              <g filter="url(#beam-blur)">
                <polygon points="195,300 225,300 310,0 110,0" fill="url(#beam-grad-1)" />
                <polygon points="195,300 215,300 70,30 20,60" fill="url(#beam-grad-2)" />
                <polygon points="205,300 225,300 400,60 350,30" fill="url(#beam-grad-2)" />
                <polygon points="190,300 210,300 20,130 -10,160" fill="url(#beam-grad-1)" />
                <polygon points="210,300 230,300 430,160 400,130" fill="url(#beam-grad-1)" />
              </g>
            </svg>
          </div>
        )}

        {/* Sparkles alrededor del cofre */}
        {phase !== 'in' && [
          { x: '20%', y: '68%', s: 6, d: '0s',    t: '1.6s' },
          { x: '75%', y: '65%', s: 5, d: '0.35s', t: '1.9s' },
          { x: '12%', y: '75%', s: 4, d: '0.65s', t: '1.4s' },
          { x: '82%', y: '76%', s: 5, d: '0.9s',  t: '1.7s' },
          { x: '50%', y: '62%', s: 7, d: '0.2s',  t: '2.0s' },
          { x: '33%', y: '85%', s: 4, d: '1.1s',  t: '1.4s' },
          { x: '65%', y: '83%', s: 4, d: '0.5s',  t: '1.8s' },
          { x: '88%', y: '70%', s: 3, d: '0.8s',  t: '2.1s' },
          { x:  '7%', y: '72%', s: 3, d: '1.3s',  t: '1.6s' },
        ].map((sp, i) => (
          <div key={i} className="pointer-events-none" style={{
            position: 'absolute', left: sp.x, top: sp.y, zIndex: 2,
            animation: `lu-spark ${sp.t} ease-in-out ${sp.d} infinite`,
          }}>
            <svg width={sp.s * 2} height={sp.s * 2} viewBox="-5 -5 10 10">
              <path d="M0-5 L1.2-1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2-1.2Z"
                fill={i % 2 === 0 ? '#fcd34d' : '#fff8d1'} />
            </svg>
          </div>
        ))}

        {/* ══ CONTENIDO (encima del cofre) ══ */}
        <div
          className="absolute inset-0 flex flex-col items-center px-6"
          style={{
            paddingTop: 'max(env(safe-area-inset-top, 0px) + 16px, 32px)',
            paddingBottom: 'clamp(240px, 40vh, 400px)',
            justifyContent: 'center',
            zIndex: 3,
            animation: 'lu-content-in .5s ease .2s both',
          }}
        >
          {/* CROWN & BADGE CONTAINER */}
          <div className="relative flex flex-col items-center z-20" style={{ marginTop: 0, marginBottom: 'clamp(-24px, -3vh, -32px)' }}>
            {/* GOLDEN CROWN */}
            <div 
              style={{
                zIndex: 12,
                animation: 'lu-crown-drop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s both',
                filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.4))'
              }}
            >
              <svg width="76" height="41" viewBox="0 0 100 54" fill="none">
                <defs>
                  <linearGradient id="crownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFF275" />
                    <stop offset="30%" stopColor="#FCD34D" />
                    <stop offset="70%" stopColor="#D97706" />
                    <stop offset="100%" stopColor="#92400E" />
                  </linearGradient>
                </defs>
                <path d="M10 50 C 30 46, 70 46, 90 50 L 95 30 L 75 38 L 50 10 L 25 38 L 5 30 Z" fill="url(#crownGrad)" stroke="#523116" strokeWidth="3" strokeLinejoin="round" />
                <circle cx="5" cy="30" r="3" fill="#FFE140" stroke="#523116" strokeWidth="1.5" />
                <circle cx="25" cy="38" r="3.5" fill="#FFE140" stroke="#523116" strokeWidth="1.5" />
                <circle cx="50" cy="10" r="4.5" fill="#FFE140" stroke="#523116" strokeWidth="2" />
                <circle cx="75" cy="38" r="3.5" fill="#FFE140" stroke="#523116" strokeWidth="1.5" />
                <circle cx="95" cy="30" r="3" fill="#FFE140" stroke="#523116" strokeWidth="1.5" />
                <path d="M12 47 C 32 44, 68 44, 88 47" stroke="#FFF8D1" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* CIRCULAR LEVEL BADGE */}
            <div
              style={{
                width: 'clamp(72px, 12vh, 96px)',
                height: 'clamp(72px, 12vh, 96px)',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #a75a28 0%, #52250d 100%)',
                border: '8px solid var(--color-map-gold-light)',
                boxShadow: '0 0 0 5px var(--color-map-wood-mid), 0 6px 15px rgba(0,0,0,0.6), inset 0 2px 6px rgba(255,255,255,0.3), 0 0 8px rgba(252,211,77,0.4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: -10,
                zIndex: 10,
                position: 'relative',
                animation: 'lu-scale-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
              }}
            >
              <div style={{
                position: 'absolute', inset: 3, borderRadius: '50%',
                border: '2px solid var(--color-map-gold-light)', opacity: 0.8, pointerEvents: 'none'
              }} />
              <span 
                className="font-black text-4xl text-yellow-300 select-none lu-text-outline-gold"
                style={{
                  lineHeight: 1,
                  fontFamily: 'Outfit, Inter, system-ui, sans-serif',
                  transform: 'translateY(-1px)'
                }}
              >
                {level}
              </span>
              <span 
                className="font-black text-white tracking-widest lu-text-outline-dark"
                style={{
                  textTransform: 'uppercase',
                  fontSize: 9,
                  marginTop: -1
                }}
              >
                {t('map.stage_badge')}
              </span>
            </div>
          </div>

          {/* PARCHMENT CARD */}
          <div
            className="lu-parchment-bg w-full max-w-[340px] rounded-2xl pt-14 pb-6 px-6 flex flex-col items-center relative"
            style={{
              border: '5px solid var(--color-map-gold-light)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.6), inset 0 0 0 2px var(--color-map-wood-dark), inset 0 0 20px rgba(82, 49, 22, 0.2)',
              animation: 'lu-slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both',
              zIndex: 5,
            }}
          >
            {/* Scroll style lines */}
            <div style={{
              position: 'absolute', top: -3, bottom: -3, left: 12, right: 12,
              borderTop: '5px solid var(--color-map-gold-light)', borderBottom: '5px solid var(--color-map-gold-light)',
              pointerEvents: 'none'
            }} />

            {/* Stop Information */}
            <div className="text-center mb-4">
              <p className="text-map-gold font-black text-xs uppercase tracking-wider">
                {mode === 'partial'
                  ? t('map.stop_almost_n', { n: stopNumber })
                  : t('map.stop_completed_n', { n: stopNumber })}
              </p>
              <p className="text-map-wood-dark font-black text-xl leading-tight mt-2">
                {stopName}
              </p>
            </div>

            {/* Reward box containing coins details */}
            <div
              className="w-full rounded-xl py-3 px-4 flex flex-row items-center justify-center gap-4 mb-4"
              style={{
                background: 'rgba(82, 49, 22, 0.08)',
                border: '2px solid rgba(82, 49, 22, 0.15)',
                ...(mode === 'partial' && {
                  animation: boxPulse
                    ? 'lu-box-pulse 2.2s ease-in-out infinite'
                    : 'lu-box-pop 0.85s cubic-bezier(.34,1.56,.64,1) both',
                }),
              }}
            >
              {mode === 'partial' ? (
                <div
                  className="flex flex-wrap justify-center items-center py-2 w-full"
                  style={{ minHeight: 40 }}
                  aria-label={t('map.quiz_try_again_msg')}
                >
                  {phase === 'coins' && t('map.quiz_try_again_msg').toUpperCase().split('').map((char, i) => (
                    <span
                      key={i}
                      style={{
                        display: 'inline-block',
                        ['--lx' as string]: `${Math.round(Math.sin(i * 1.8) * 55)}px`,
                        ['--ly' as string]: '360px',
                        ['--lr' as string]: `${Math.round(Math.sin(i * 2.3) * 18)}deg`,
                        animation: `lu-letter-fly 0.6s cubic-bezier(.16,1,.3,1) ${0.1 + i * 0.08}s both`,
                        color: '#ffe87a',
                        fontFamily: 'Outfit, Inter, system-ui, sans-serif',
                        fontSize: 24,
                        fontWeight: 900,
                        textShadow: '0 1px 0 #fff0a0, 0 2px 0 #d4a000, 0 3px 0 #8b6600, 0 4px 0 #5a3e0a, 0 6px 14px rgba(0,0,0,0.9)',
                        letterSpacing: '0.04em',
                        whiteSpace: 'pre',
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </div>
              ) : (
                <>
                  {/* Coin stack image */}
                  <div className="relative w-12 h-12 flex items-center justify-center lu-coin-pop">
                    {/* Flying coins anchor */}
                    {phase === 'coins' && !frozenSrc && FLYING.map((c, i) => (
                      <div key={i} style={{
                        position: 'absolute',
                        top: '40%', left: '50%',
                        marginLeft: -11, marginTop: -11,
                        pointerEvents: 'none',
                        zIndex: 20,
                        ['--sx' as string]: c.sx,
                        ['--sy' as string]: c.sy,
                        animation: `lu-coin-fly .85s cubic-bezier(.4,0,1,1) ${c.delay} infinite`,
                      }}>
                        <img src="/assets/img/coin_only.png" className="w-5 h-5 object-contain" />
                      </div>
                    ))}
                    <img src="/assets/img/coins.png" className="w-full h-full object-contain" alt="Coins" />
                  </div>

                  {/* Coins counter value */}
                  <div className="flex flex-col justify-center">
                    <span className="text-map-gold font-black text-2xl tracking-tight">+{display}</span>
                  </div>
                </>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <button
                onClick={onBackToMap}
                className="flex items-center justify-center gap-2"
                style={{
                  flex: 1, height: 48,
                  padding: '0 14px',
                  background: 'var(--color-map-tan)',
                  border: '3px solid var(--color-map-wood-dark)',
                  borderBottom: '7px solid var(--color-map-wood-mid)',
                  borderRadius: 8,
                  color: 'var(--color-map-wood-dark)',
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.08s ease',
                  boxShadow: 'inset 0 3px 0 var(--color-map-gold-light), 0 4px 8px rgba(0,0,0,0.25)',
                }}
                onPointerDown={e => { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.borderBottomWidth = '3px' }}
                onPointerUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderBottomWidth = '7px' }}
              >
                {t('map.back_map')}
              </button>
              <button
                onClick={onContinue}
                className="flex items-center justify-center gap-2"
                style={{
                  flex: 2, height: 48,
                  padding: '0 16px',
                  background: 'var(--color-map-wood-dark)',
                  border: '3px solid var(--color-map-wood-mid)',
                  borderBottom: '7px solid var(--color-map-wood-deep)',
                  borderRadius: 8,
                  color: 'var(--color-map-gold-light)',
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: '.04em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  textShadow: '0 2.5px 0 var(--color-map-wood-deep)',
                  cursor: 'pointer',
                  transition: 'all 0.08s ease',
                  boxShadow: 'inset 0 3.5px 0 var(--color-map-tan), 0 4px 8px rgba(0,0,0,0.3)',
                }}
                onPointerDown={e => { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.borderBottomWidth = '3px' }}
                onPointerUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderBottomWidth = '7px' }}
              >
                {mode === 'partial' ? t('map.quiz_retry') : t('map.next_stop')}
              </button>
            </div>
          </div>
        </div>

        {/* ══ COFRE — fijo en la parte inferior, en frente ══ */}
        <div
          style={{
            position: 'absolute',
            bottom: 'min(24px, 2vh)',
            left: '50%',
            width: 'min(95vw, 420px)',
            height: 'clamp(240px, 40vh, 380px)',
            zIndex: 10,
            opacity: chestLoaded ? 1 : 0,
            animation: chestLoaded
              ? 'lu-chest-pop .85s cubic-bezier(.34,1.56,.64,1) forwards, lu-chest-idle 5s ease-in-out infinite 0.85s'
              : 'none',
            transition: 'opacity 0.2s ease-in-out',
          }}
        >
          {/* Destello de luz dentro del cofre (activo de forma permanente para dar vida al freeze frame) */}
          {phase !== 'in' && (
            <div
              style={{
                position: 'absolute',
                top: '55%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '180px',
                height: '90px',
                background: 'radial-gradient(ellipse at center, rgba(255,233,106,0.7) 0%, rgba(252,211,77,0.25) 50%, transparent 80%)',
                filter: 'blur(8px)',
                pointerEvents: 'none',
                mixBlendMode: 'screen',
                animation: 'lu-glow-pulse 2s ease-in-out infinite',
                zIndex: 11,
              }}
            />
          )}

          {frozenSrc ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <img
                src={frozenSrc}
                alt="cofre"
                onLoad={() => setChestLoaded(true)}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
              {/* Permanent sparkles inside the chest opening (active after freeze frame) */}
              <div
                style={{
                  position: 'absolute',
                  top: '52%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '180px',
                  height: '90px',
                  pointerEvents: 'none',
                  zIndex: 12,
                }}
              >
                {[
                  { left: '25%', top: '30%', size: 10, delay: '0s' },
                  { left: '45%', top: '15%', size: 14, delay: '0.4s' },
                  { left: '70%', top: '40%', size: 8, delay: '0.8s' },
                  { left: '32%', top: '55%', size: 12, delay: '1.2s' },
                  { left: '55%', top: '45%', size: 10, delay: '1.6s' },
                ].map((sp, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: sp.left,
                      top: sp.top,
                      animation: `lu-spark 2.2s ease-in-out ${sp.delay} infinite`,
                    }}
                  >
                    <svg width={sp.size} height={sp.size} viewBox="-5 -5 10 10">
                      <path d="M0-5 L1.2-1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2-1.2Z" fill="#fffae0" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <video
              autoPlay
              loop
              muted
              playsInline
              onLoadedData={() => setChestLoaded(true)}
              style={{
                width: '100%', height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            >
              <source src="/assets/img/COFRE.webm" type="video/webm" />
              <source src="/assets/img/COFRE.gif" type="image/gif" />
            </video>
          )}
        </div>
      </div>
    )
}
