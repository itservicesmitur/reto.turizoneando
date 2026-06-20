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

  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (mode !== 'partial' || phase !== 'coins') return
    const timer = setTimeout(() => setBoxPulse(true), 2000)
    return () => clearTimeout(timer)
  }, [phase, mode])

  useEffect(() => {
    const fallback = setTimeout(() => { setChestLoaded(true) }, 1000)
    return () => clearTimeout(fallback)
  }, [])

  useEffect(() => {
    if (!chestLoaded) return
    const t1 = setTimeout(() => setPhase('open'), 3000)
    const t2 = setTimeout(() => setPhase('coins'), 3750)
    const t3 = setTimeout(() => { setFrozenSrc('/assets/img/COFRE_OPEN.png') }, 8100)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [chestLoaded])

  useEffect(() => {
    if (phase !== 'coins') return
    if (mode === 'partial') return
    const duration = 4300
    let startTs: number | null = null
    const tick = (ts: number) => {
      if (!startTs) startTs = ts
      const prog  = Math.min((ts - startTs) / duration, 1)
      const eased = prog < 0.5 ? 2 * prog * prog : 1 - Math.pow(-2 * prog + 2, 2) / 2
      setDisplay(Math.round(eased * coins))
      if (prog < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
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
        background: 'linear-gradient(to bottom, #075f6e 0%, #00bbb4 100%)',
        animation: 'lu-in .3s ease forwards',
      }}
    >
      {/* Glow desde la base */}
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
          background: 'radial-gradient(ellipse 95% 75% at 50% 100%, rgba(0,187,180,.4) 0%, rgba(7,95,110,.18) 50%, transparent 70%)',
          pointerEvents: 'none',
          animation: phase !== 'in' ? 'lu-glow-pulse 2.2s ease-in-out infinite' : undefined,
        }}
      />

      {/* Rayos giratorios */}
      {phase !== 'in' && (
        <div
          style={{
            position: 'absolute', bottom: -150, left: '50%',
            transform: 'translateX(-50%)',
            width: 560, height: 560,
            pointerEvents: 'none', zIndex: 1,
            animation: 'lu-in 1.2s ease-out both',
          }}
        >
          <div style={{ width: '100%', height: '100%', animation: 'lu-ray-spin 24s linear infinite' }}>
            <svg width="560" height="560" viewBox="-280 -280 560 560">
              <defs>
                <filter id="lu-blur"><feGaussianBlur stdDeviation="8" /></filter>
                <radialGradient id="lu-rg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor="#ffffff"  stopOpacity="0.45" />
                  <stop offset="35%"  stopColor="#00bbb4"  stopOpacity="0.22" />
                  <stop offset="70%"  stopColor="#075f6e"  stopOpacity="0.07" />
                  <stop offset="100%" stopColor="#075f6e"  stopOpacity="0" />
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

      {/* Luz volumétrica */}
      {phase !== 'in' && (
        <div
          style={{
            position: 'absolute', bottom: 75, left: '50%',
            transform: 'translateX(-50%)',
            width: 420, height: 300,
            pointerEvents: 'none', zIndex: 9,
            mixBlendMode: 'screen', opacity: 0.45,
            animation: 'lu-in 1.2s ease-out both, lu-glow-pulse 2.2s ease-in-out infinite',
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 420 300">
            <defs>
              <linearGradient id="beam-grad-t" x1="50%" y1="100%" x2="50%" y2="0%">
                <stop offset="0%"   stopColor="#ffffff"  stopOpacity="0.65" />
                <stop offset="25%"  stopColor="#00bbb4"  stopOpacity="0.4" />
                <stop offset="65%"  stopColor="#00bbb4"  stopOpacity="0.14" />
                <stop offset="100%" stopColor="#075f6e"  stopOpacity="0" />
              </linearGradient>
              <filter id="beam-blur-t"><feGaussianBlur stdDeviation="15" /></filter>
            </defs>
            <g filter="url(#beam-blur-t)">
              <polygon points="195,300 225,300 310,0 110,0"  fill="url(#beam-grad-t)" />
              <polygon points="195,300 215,300 70,30 20,60"  fill="url(#beam-grad-t)" />
              <polygon points="205,300 225,300 400,60 350,30" fill="url(#beam-grad-t)" />
            </g>
          </svg>
        </div>
      )}

      {/* Sparkles */}
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
              fill={i % 2 === 0 ? 'rgba(255,255,255,0.92)' : 'rgba(0,187,180,0.85)'} />
          </svg>
        </div>
      ))}

      {/* ══ CONTENIDO ══ */}
      <div
        className="absolute inset-0 flex flex-col items-center px-4"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px) + 16px, 32px)',
          paddingBottom: 'clamp(240px, 40vh, 400px)',
          justifyContent: 'center',
          zIndex: 3,
          animation: 'lu-content-in .5s ease .2s both',
        }}
      >
        {/* Corona + badge de etapa */}
        <div className="relative flex flex-col items-center z-20" style={{ marginBottom: 'clamp(-24px, -3vh, -32px)' }}>

          {/* Corona teal */}
          <div style={{
            zIndex: 12,
            animation: 'lu-crown-drop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s both',
            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))',
          }}>
            <svg width="76" height="41" viewBox="0 0 100 54" fill="none">
              <defs>
                <linearGradient id="crownGradT" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%"   stopColor="#ffffff" />
                  <stop offset="30%"  stopColor="#c0f0ed" />
                  <stop offset="70%"  stopColor="#00bbb4" />
                  <stop offset="100%" stopColor="#075f6e" />
                </linearGradient>
              </defs>
              <path d="M10 50 C 30 46, 70 46, 90 50 L 95 30 L 75 38 L 50 10 L 25 38 L 5 30 Z"
                fill="url(#crownGradT)" stroke="#054f5c" strokeWidth="3" strokeLinejoin="round" />
              <circle cx="5"  cy="30" r="3"   fill="#ffffff" stroke="#054f5c" strokeWidth="1.5" />
              <circle cx="25" cy="38" r="3.5" fill="#ffffff" stroke="#054f5c" strokeWidth="1.5" />
              <circle cx="50" cy="10" r="4.5" fill="#ffffff" stroke="#054f5c" strokeWidth="2" />
              <circle cx="75" cy="38" r="3.5" fill="#ffffff" stroke="#054f5c" strokeWidth="1.5" />
              <circle cx="95" cy="30" r="3"   fill="#ffffff" stroke="#054f5c" strokeWidth="1.5" />
              <path d="M12 47 C 32 44, 68 44, 88 47" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Badge circular de etapa */}
          <div
            style={{
              width: 'clamp(72px, 12vh, 96px)',
              height: 'clamp(72px, 12vh, 96px)',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #18d5cd 0%, #096d7d 100%)',
              border: '6px solid #ffffff',
              boxShadow: '0 0 0 3px #00bbb4, 0 8px 22px rgba(0,0,0,0.35), inset 0 2px 6px rgba(255,255,255,0.3)',
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
              border: '2px solid rgba(255,255,255,0.35)', pointerEvents: 'none',
            }} />
            <span
              className="font-black text-4xl text-white select-none"
              style={{ lineHeight: 1, fontFamily: 'Outfit, Inter, system-ui, sans-serif', transform: 'translateY(-1px)' }}
            >
              {level}
            </span>
            <span
              className="font-black text-white tracking-widest"
              style={{ textTransform: 'uppercase', fontSize: 9, marginTop: -1, opacity: 0.85 }}
            >
              {t('map.stage_badge')}
            </span>
          </div>
        </div>

        {/* ── CARD BLANCA ── */}
        <div
          className="w-full max-w-[340px] rounded-3xl pt-14 pb-6 px-6 flex flex-col items-center"
          style={{
            background: '#ffffff',
            boxShadow: '0 16px 48px rgba(0,0,0,0.32)',
            animation: 'lu-slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both',
            zIndex: 5,
          }}
        >
          {/* Info de la parada */}
          <div className="text-center mb-4">
            <p className="font-black text-xs uppercase tracking-wider" style={{ color: '#00bbb4' }}>
              {mode === 'partial'
                ? t('map.stop_almost_n', { n: stopNumber })
                : t('map.stop_completed_n', { n: stopNumber })}
            </p>
            <p className="font-black text-xl leading-tight mt-2" style={{ color: '#096d7d' }}>
              {stopName}
            </p>
          </div>

          {/* Caja de recompensa */}
          <div
            className="w-full rounded-2xl py-3 px-4 flex flex-row items-center justify-center gap-4 mb-5"
            style={{
              background: 'rgba(0,187,180,0.08)',
              border: '1.5px solid rgba(0,187,180,0.2)',
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
                      color: '#00bbb4',
                      fontFamily: 'Outfit, Inter, system-ui, sans-serif',
                      fontSize: 24,
                      fontWeight: 900,
                      textShadow: '0 1px 0 rgba(0,187,180,0.5), 0 3px 0 rgba(9,109,125,0.45), 0 5px 10px rgba(0,0,0,0.12)',
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
                {/* Monedas volando */}
                <div className="relative w-12 h-12 flex items-center justify-center lu-coin-pop">
                  {phase === 'coins' && !frozenSrc && FLYING.map((c, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      top: '40%', left: '50%',
                      marginLeft: -11, marginTop: -11,
                      pointerEvents: 'none', zIndex: 20,
                      ['--sx' as string]: c.sx,
                      ['--sy' as string]: c.sy,
                      animation: `lu-coin-fly .85s cubic-bezier(.4,0,1,1) ${c.delay} infinite`,
                    }}>
                      <img src="/assets/img/coin_only.png" className="w-5 h-5 object-contain" />
                    </div>
                  ))}
                  <img src="/assets/img/coins.png" className="w-full h-full object-contain" alt="Coins" />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="font-black text-2xl tracking-tight" style={{ color: '#096d7d' }}>+{display}</span>
                </div>
              </>
            )}
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            {/* Cream 3D — Mapa */}
            <button
              onClick={onBackToMap}
              className="flex items-center justify-center active:translate-y-[4px] transition-all"
              style={{
                flex: 1, height: 56,
                padding: '0 14px',
                background: 'linear-gradient(180deg,#f2ead6 0%,#e5dcc6 100%)',
                color: '#8b6f47',
                border: '2px solid #c9bc9e',
                borderRadius: 18,
                fontWeight: 900,
                fontSize: 12,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: 'inset 0 2px 0 rgba(255,255,255,.7), 0 6px 0 #b8a87e, 0 10px 18px rgba(0,0,0,.12)',
              }}
            >
              {t('map.back_map')}
            </button>

            {/* Teal 3D — Siguiente parada / Reintentar */}
            <button
              onClick={onContinue}
              className="flex items-center justify-center active:translate-y-[4px] transition-all"
              style={{
                flex: 2, height: 56,
                padding: '0 16px',
                background: 'linear-gradient(180deg,#18d5cd 0%,#00bbb4 45%,#096d7d 100%)',
                border: '2px solid #0c7f89',
                borderRadius: 18,
                color: '#ffffff',
                fontWeight: 900,
                fontSize: 13,
                letterSpacing: '.04em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                boxShadow: 'inset 0 2px 0 rgba(255,255,255,.35), 0 6px 0 #054f5c, 0 12px 22px rgba(9,109,125,.38)',
              }}
            >
              {mode === 'partial' ? t('map.quiz_retry') : t('map.next_stop')}
            </button>
          </div>
        </div>
      </div>

      {/* ══ COFRE ══ */}
      <div
        style={{
          position: 'absolute',
          bottom: 'min(24px, 2vh)',
          left: '50%',
          transform: 'translateX(-50%)',
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
        {phase !== 'in' && (
          <div style={{
            position: 'absolute',
            top: '55%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '180px', height: '90px',
            background: 'radial-gradient(ellipse at center, rgba(0,187,180,0.65) 0%, rgba(0,187,180,0.22) 50%, transparent 80%)',
            filter: 'blur(8px)',
            pointerEvents: 'none',
            mixBlendMode: 'screen',
            animation: 'lu-glow-pulse 2s ease-in-out infinite',
            zIndex: 11,
          }} />
        )}

        {frozenSrc ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <img
              src={frozenSrc}
              alt="cofre"
              onLoad={() => setChestLoaded(true)}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
            <div style={{
              position: 'absolute', top: '52%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '180px', height: '90px',
              pointerEvents: 'none', zIndex: 12,
            }}>
              {[
                { left: '25%', top: '30%', size: 10, delay: '0s' },
                { left: '45%', top: '15%', size: 14, delay: '0.4s' },
                { left: '70%', top: '40%', size: 8,  delay: '0.8s' },
                { left: '32%', top: '55%', size: 12, delay: '1.2s' },
                { left: '55%', top: '45%', size: 10, delay: '1.6s' },
              ].map((sp, idx) => (
                <div key={idx} style={{
                  position: 'absolute', left: sp.left, top: sp.top,
                  animation: `lu-spark 2.2s ease-in-out ${sp.delay} infinite`,
                }}>
                  <svg width={sp.size} height={sp.size} viewBox="-5 -5 10 10">
                    <path d="M0-5 L1.2-1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2-1.2Z" fill="rgba(255,255,255,0.92)" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <video
            autoPlay loop muted playsInline
            onLoadedData={() => setChestLoaded(true)}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          >
            <source src="/assets/img/COFRE.webm" type="video/webm" />
            <source src="/assets/img/COFRE.gif" type="image/gif" />
          </video>
        )}
      </div>
    </div>
  )
}
