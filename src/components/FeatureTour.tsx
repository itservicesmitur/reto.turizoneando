import React from 'react'
import { Joyride, STATUS, type EventData, type Step, type TooltipRenderProps } from 'react-joyride'
import { useTranslation } from 'react-i18next'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAudioPlayer } from '../features/map/quiz/useAudioPlayer'

const TOUR_KEY = 'turizoneando_tour_done_users'
const NARRATION_DURATION = 28

// ─── Context para pasar datos de audio al tooltip ─────────────────────────
interface TourAudioCtx { audioUrl: string; welcomeText: string; lang: 'es' | 'en' }
const TourAudioContext = React.createContext<TourAudioCtx>({ audioUrl: '', welcomeText: '', lang: 'es' })

// ─── Joyride steps ────────────────────────────────────────────────────────

const STEP_ICONS = ['ri-road-map-fill', 'ri-flag-fill', 'ri-fullscreen-line', 'ri-trophy-fill']

const steps: Step[] = [
  {
    target: '#tour-map',
    placement: 'center',
    skipBeacon: true,
    title: '¡Bienvenido al mapa!',
    content: (
      <p style={{ margin: 0, fontSize: 13, color: 'rgba(9,109,125,0.72)', lineHeight: 1.65 }}>
        Este es el mapa de la Ciudad Colonial. Aquí encontrarás todas las paradas del recorrido histórico.
      </p>
    ),
  },
  {
    target: '#tour-stages',
    placement: 'bottom',
    skipBeacon: true,
    spotlightRadius: 9999,
    title: 'Etapas del recorrido',
    content: (
      <p style={{ margin: 0, fontSize: 13, color: 'rgba(9,109,125,0.72)', lineHeight: 1.65 }}>
        Navega entre las etapas del tour. Cada etapa tiene sus propias paradas y desafíos que completar.
      </p>
    ),
  },
  {
    target: '#tour-fullscreen',
    placement: 'bottom',
    skipBeacon: true,
    spotlightRadius: 9999,
    title: 'Pantalla completa',
    content: (
      <p style={{ margin: 0, fontSize: 13, color: 'rgba(9,109,125,0.72)', lineHeight: 1.65 }}>
        Activa la pantalla completa para una experiencia más inmersiva mientras exploras el mapa.
      </p>
    ),
  },
  {
    target: '#tour-menu',
    placement: 'bottom-end',
    skipBeacon: true,
    spotlightRadius: 9999,
    title: 'Tu perfil y premios',
    content: (
      <p style={{ margin: 0, fontSize: 13, color: 'rgba(9,109,125,0.72)', lineHeight: 1.65 }}>
        Desde aquí accedes a tu perfil, tus premios ganados, el ranking y las reglas del Desafío Cultural.
      </p>
    ),
  },
]

// ─── Custom tooltip ────────────────────────────────────────────────────────

function MapTooltip({ index, isLastStep, size, step, backProps, primaryProps, skipProps, tooltipProps }: TooltipRenderProps) {
  const { t } = useTranslation()
  const { audioUrl, welcomeText } = React.useContext(TourAudioContext)

  const STEP_TITLES = ['', t('map.tour_stages_title'), t('map.tour_fullscreen_title'), t('map.tour_profile_title')]
  const STEP_BODIES  = ['', t('map.tour_stages_body'),  t('map.tour_fullscreen_body'),  t('map.tour_profile_body')]

  // Audio — activo solo en card 0; hook siempre se llama (reglas de hooks)
  const { playing, progress, muted, handleToggle, handleMute } = useAudioPlayer({
    audioUrl: index === 0 ? audioUrl : '',
    duration: NARRATION_DURATION,
  })

  // Parar audio al salir de card 0
  const playingRef = React.useRef(playing)
  playingRef.current = playing
  React.useEffect(() => {
    if (index !== 0 && playingRef.current) handleToggle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  // Texto animado (card 0)
  const displayText = welcomeText || t('map.tour_turi_body')
  const words = React.useMemo(() => displayText.split(' '), [displayText])
  const litWords = Math.floor(progress * words.length)

  const scrollRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = scrollRef.current
    if (!el || progress <= 0) return
    const scrollHeight = el.scrollHeight - el.clientHeight
    if (scrollHeight > 0) el.scrollTo({ top: progress * scrollHeight, behavior: 'smooth' })
  }, [progress])

  return (
    <div
      {...tooltipProps}
      style={{
        width: 'calc(100vw - 32px)',
        maxWidth: 380,
        background: '#ffffff',
        borderRadius: 22,
        boxShadow: '0 16px 48px rgba(0,0,0,0.16), 0 4px 16px rgba(9,109,125,0.08)',
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
      }}
    >
      {/* Botón cerrar — solo en cards 1-3 */}
      {index > 0 && (
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
          <button
            {...skipProps}
            style={{
              background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%',
              cursor: 'pointer', color: '#096d7d', fontSize: 13,
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
              boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
            }}
          >✕</button>
        </div>
      )}

      {index === 0 ? (
        /* ── Card 0: ciudad + Turi + audio narrado ── */
        <div style={{ display: 'flex', flexDirection: 'column' }}>

          {/* Zona imagen */}
          <div style={{ position: 'relative', height: 210, overflow: 'hidden', padding: 8 }}>
            <img
              src="/assets/img/cityZone.webp"
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 50%', display: 'block', borderRadius: 16 }}
            />
            {/* Overlay */}
            <div style={{ position: 'absolute', inset: 8, borderRadius: 16, background: 'linear-gradient(to right, rgba(7,95,110,0.78) 0%, rgba(7,95,110,0.32) 42%, transparent 68%)', zIndex: 2, pointerEvents: 'none' }} />

            {/* Turi */}
            <div style={{ position: 'absolute', bottom: 4, left: '67%', transform: 'translateX(-50%)', width: 220, zIndex: 3, background: 'transparent' }}>
              <video autoPlay loop muted playsInline style={{ width: '100%', display: 'block', background: 'transparent' }}>
                <source src="/assets/img/turiguaia_safari.mov" type='video/mp4; codecs="hvc1"' />
                <source src="/assets/img/turiguaia.webm" type="video/webm" />
              </video>
            </div>

            {/* Mute — arriba izquierda */}
            <button
              onClick={handleMute}
              style={{
                position: 'absolute', top: 18, left: 18, zIndex: 10,
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.92)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.22)',
                color: '#096d7d', fontSize: 16,
              }}
            >
              <i className={muted ? 'ri-volume-mute-fill' : 'ri-volume-up-fill'} />
            </button>

            {/* Saltar — arriba derecha (avanza solo a card 1, NO sale del tour) */}
            <button
              {...primaryProps}
              style={{
                position: 'absolute', top: 18, right: 18, zIndex: 10,
                height: 32, paddingLeft: 12, paddingRight: 12, borderRadius: 9999,
                background: 'rgba(255,255,255,0.92)', border: 'none',
                display: 'flex', alignItems: 'center', gap: 5,
                cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.22)',
                color: '#096d7d', fontSize: 12, fontWeight: 700,
              }}
            >
              {t('map.tour_skip')}
              <i className="ri-skip-forward-line" style={{ fontSize: 13 }} />
            </button>
          </div>

          {/* Zona blanca */}
          <div style={{ background: '#fff', padding: '14px 18px 16px' }}>
            {/* Burbuja con texto animado */}
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <div style={{ position: 'absolute', top: -9, left: 24, width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '10px solid #e6f9f8' }} />
              <div
                ref={scrollRef}
                style={{
                  background: '#e6f9f8', border: '1.5px solid rgba(0,187,180,0.2)',
                  borderRadius: 14, padding: '11px 14px',
                  boxShadow: '0 3px 12px rgba(0,187,180,0.1)',
                  maxHeight: 100, overflowY: 'auto', scrollbarWidth: 'none',
                }}
              >
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.65 }}>
                  {words.map((word, i) => {
                    const isLit = i < litWords
                    const isCurrent = isLit && i >= litWords - 3
                    return (
                      <span
                        key={i}
                        className="transition-all duration-200"
                        style={{
                          fontWeight: isLit ? 700 : 400,
                          color: isLit ? '#096d7d' : 'rgba(9,109,125,0.55)',
                          background: isCurrent ? 'rgba(0,187,180,0.22)' : 'transparent',
                          borderRadius: isCurrent ? 4 : 0,
                          padding: isCurrent ? '0 2px' : '0',
                        }}
                      >
                        {word}{' '}
                      </span>
                    )
                  })}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(9,109,125,0.38)' }}>{index + 1} / {size}</span>
              {progress >= 1 ? (
                <button
                  {...primaryProps}
                  style={{
                    background: 'linear-gradient(135deg, #e0344b 0%, #ff9447 100%)',
                    border: 'none', borderRadius: 9999, color: '#fff',
                    fontWeight: 800, fontSize: 13, padding: '9px 22px',
                    cursor: 'pointer', boxShadow: '0 4px 14px rgba(224,52,75,0.32)',
                    lineHeight: 1, whiteSpace: 'nowrap',
                  }}
                >
                  {isLastStep ? t('map.tour_profile_btn') : t('map.tour_continue')}
                </button>
              ) : (
                <button
                  onClick={handleToggle}
                  style={{
                    background: 'linear-gradient(135deg,#096d7d 0%,#00bbb4 100%)',
                    border: 'none', borderRadius: 9999, color: '#fff',
                    fontWeight: 800, fontSize: 13, padding: '9px 22px',
                    cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,187,180,0.35)',
                    lineHeight: 1, whiteSpace: 'nowrap',
                  }}
                >
                  {playing ? t('map.tour_pause') : t('map.tour_listen')}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── Cards 1-3 ── */
        <div style={{ padding: '20px 22px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg,#18d5cd 0%,#096d7d 100%)',
            boxShadow: '0 6px 18px rgba(0,187,180,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <i className={STEP_ICONS[index]} style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#096d7d', lineHeight: 1.3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {STEP_TITLES[index] || (step.title as React.ReactNode)}
          </h3>
          {STEP_BODIES[index]
            ? <p style={{ margin: 0, fontSize: 13, color: 'rgba(9,109,125,0.72)', lineHeight: 1.65 }}>{STEP_BODIES[index]}</p>
            : step.content}
        </div>
      )}

      {/* Separador y footer — solo cards 1-3 */}
      {index > 0 && <div style={{ margin: '14px 22px 0', height: 1, background: 'linear-gradient(90deg,transparent,rgba(0,187,180,0.28),transparent)' }} />}

      {index > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px 20px', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(9,109,125,0.38)' }}>{index + 1} / {size}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {index > 0 && (
              <button
                {...backProps}
                style={{
                  background: '#f5fdfc', border: '1.5px solid rgba(0,187,180,0.22)',
                  borderRadius: 9999, color: '#096d7d',
                  fontWeight: 700, fontSize: 13,
                  padding: '10px 20px', cursor: 'pointer', lineHeight: 1,
                }}
              >{t('map.tour_back')}</button>
            )}
            <button
              {...primaryProps}
              style={{
                background: 'linear-gradient(135deg,#096d7d 0%,#00bbb4 100%)',
                border: 'none', borderRadius: 9999,
                color: '#ffffff', fontWeight: 800, fontSize: 13,
                padding: '10px 22px', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,187,180,0.32)',
                lineHeight: 1, whiteSpace: 'nowrap',
              }}
            >
              {isLastStep ? t('map.tour_profile_btn') : t('map.tour_next')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Mini card shared styles ───────────────────────────────────────────────

const S = {
  wrap: {
    borderRadius: 12,
    overflow: 'hidden' as const,
    border: '1px solid rgba(0,187,180,0.18)',
    boxShadow: '0 4px 20px rgba(9,109,125,0.1)',
    background: '#ffffff',
  },
  btnLight: {
    height: 33, borderRadius: 8,
    background: '#f5fdfc',
    border: '1.5px solid rgba(0,187,180,0.22)',
    display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
    fontSize: 9, fontWeight: 800, color: '#096d7d',
    cursor: 'default' as const, userSelect: 'none' as const, flexShrink: 0 as const, gap: 4,
  },
  btnTeal: {
    height: 33, borderRadius: 8,
    background: 'linear-gradient(135deg,#096d7d 0%,#00bbb4 100%)',
    border: 'none',
    display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
    fontSize: 9, fontWeight: 800, color: '#ffffff',
    cursor: 'default' as const, userSelect: 'none' as const, gap: 4,
    boxShadow: '0 3px 10px rgba(0,187,180,0.3)',
  },
  btnTealGlow: {
    height: 33, borderRadius: 8,
    background: 'linear-gradient(135deg,#096d7d 0%,#00bbb4 100%)',
    border: 'none',
    display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
    fontSize: 9, fontWeight: 800, color: '#ffffff',
    animation: 'demo-glow 1.4s ease-in-out infinite',
    cursor: 'default' as const, userSelect: 'none' as const, gap: 4,
  },
  footer: {
    borderTop: '1px solid rgba(0,187,180,0.12)',
    padding: '8px 10px',
    display: 'flex' as const, gap: 7,
  },
}

// ─── Mini HistoryCard ──────────────────────────────────────────────────────

function MiniHistoryCard() {
  return (
    <div style={S.wrap}>
      <div style={{ padding: '10px 15px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#00bbb4', marginTop: '2.5px', marginBottom: '8px', textTransform: 'uppercase' as const }}>Parada 1</p>
        <h3 style={{ fontSize: 10, fontWeight: 900, color: '#096d7d', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 10px', lineHeight: 1.3 }}>
          Las Escalinatas de la Calle El Conde
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(0,187,180,0.3)' }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(0,187,180,0.5)' }} />
          <div style={{ flex: 1, height: 1, background: 'rgba(0,187,180,0.3)' }} />
        </div>
        <p style={{ fontSize: 10, color: 'rgba(9,109,125,0.65)', lineHeight: 1.6, margin: 0, textAlign: 'left' }}>
          Tu travesía continúa por las históricas calles de Santo Domingo, frente a las famosas Escalinatas de la Calle El Conde...
        </p>
      </div>
      <div style={S.footer}>
        <div style={{ ...S.btnLight, width: 58 }}>OMITIR</div>
        <div style={{ ...S.btnTealGlow, flex: 1 }}><span style={{ fontSize: 9 }}>▶</span> NARRACIÓN</div>
      </div>
    </div>
  )
}

// ─── Mini QuizCard ─────────────────────────────────────────────────────────

function MiniQuizCard() {
  const options = [
    { label: 'A', text: '1521', sel: false },
    { label: 'B', text: '1496', sel: true },
    { label: 'C', text: '1492', sel: false },
    { label: 'D', text: '1620', sel: false },
  ]
  return (
    <div style={S.wrap}>
      <div style={{ padding: '9px 14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right,transparent,rgba(0,187,180,0.4))' }} />
          <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.12em', color: '#00bbb4', textTransform: 'uppercase' as const }}>Pregunta 1 de 3</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left,transparent,rgba(0,187,180,0.4))' }} />
        </div>
      </div>
      <div style={{ padding: '4px 12px 8px' }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: '#096d7d', textAlign: 'center', lineHeight: 1.5, margin: '0 0 8px' }}>
          ¿En qué año fue fundada la Ciudad Colonial de Santo Domingo?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
          {options.map(o => (
            <div key={o.label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 9px', borderRadius: 6,
              background: o.sel ? 'rgba(0,187,180,0.08)' : 'rgba(245,253,252,0.8)',
              border: `1.5px solid ${o.sel ? '#00bbb4' : 'rgba(0,187,180,0.15)'}`,
            }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, background: o.sel ? '#096d7d' : 'rgba(0,187,180,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color: o.sel ? '#fff' : '#00bbb4' }}>
                {o.label}
              </div>
              <span style={{ fontSize: 9, fontWeight: o.sel ? 700 : 500, color: o.sel ? '#096d7d' : 'rgba(9,109,125,0.65)', flex: 1 }}>{o.text}</span>
              {o.sel && <span style={{ fontSize: 9, color: '#00bbb4', fontWeight: 700 }}>✓</span>}
            </div>
          ))}
        </div>
      </div>
      <div style={S.footer}>
        <div style={{ ...S.btnLight, width: 50 }}>SALIR</div>
        <div style={{ ...S.btnTealGlow, flex: 1 }}>COMPROBAR</div>
      </div>
    </div>
  )
}

// ─── Mini RouletteCard ─────────────────────────────────────────────────────

const SEG_COLORS = ['#e5f9f8','#096d7d','#00bbb4','#18d5cd','#e5f9f8','#096d7d','#00bbb4','#18d5cd']
const SEG_TEXT   = ['#096d7d','#ffffff','#ffffff','#096d7d','#096d7d','#ffffff','#ffffff','#096d7d']
const SEG_EMOJIS = ['🎁','⭐','🏆','🎀','💳','🌟','🎊','🎖️']
const SEG_LABELS = ['REGALO','BONUS','PREMIO','EXTRA','BONO','PUNTOS','OFERTA','HONOR']
const toRad = (d: number) => d * Math.PI / 180
function segPath(i: number, r: number) {
  const s = toRad(i * 45 - 90), e = toRad((i + 1) * 45 - 90)
  return `M 0 0 L ${(r * Math.cos(s)).toFixed(1)} ${(r * Math.sin(s)).toFixed(1)} A ${r} ${r} 0 0 1 ${(r * Math.cos(e)).toFixed(1)} ${(r * Math.sin(e)).toFixed(1)} Z`
}

function MiniRouletteCard() {
  const R = 54
  return (
    <div style={{ ...S.wrap, background: '#f5fdfc' }}>
      <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '12px 12px 10px', gap: 8 }}>
        <h3 style={{ fontSize: 12, fontWeight: 900, color: '#096d7d', margin: 0, textAlign: 'center' }}>¡Etapa 1 completada!</h3>
        <p style={{ fontSize: 8.5, color: 'rgba(9,109,125,0.6)', margin: -5, textAlign: 'center' }}>¡Gira para reclamar tu premio!</p>
        <div style={{ position: 'relative', width: R * 2 + 28, height: R * 2 + 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className='mt-5'>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', width: 5, height: 5, borderRadius: '50%', background: '#00bbb4', boxShadow: '0 0 5px #00bbb4', transform: `rotate(${i * 45}deg) translate(0,${-(R + 13)}px)`, transformOrigin: 'center center', zIndex: 5 }} />
          ))}
          <svg width={R * 2} height={R * 2} viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`} style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="mwG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#096d7d" />
                <stop offset="100%" stopColor="#075f6e" />
              </linearGradient>
              <linearGradient id="mgG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#18d5cd" />
                <stop offset="100%" stopColor="#00bbb4" />
              </linearGradient>
            </defs>
            {Array.from({ length: 8 }).map((_, i) => (
              <path key={i} d={segPath(i, R - 6)} fill={SEG_COLORS[i]} stroke="#054f5c" strokeWidth="1.5" />
            ))}
            <circle r={R - 5} fill="none" stroke="url(#mgG)" strokeWidth="2" />
            <circle r={R} fill="none" stroke="url(#mwG)" strokeWidth="12" />
            <circle r={R + 5} fill="none" stroke="#054f5c" strokeWidth="1.2" />
            <circle r={R - 4} fill="none" stroke="#054f5c" strokeWidth="1.2" />
            {Array.from({ length: 8 }).map((_, i) => (
              <g key={i} transform={`rotate(${i * 45 + 22.5}) translate(0,${-R})`}>
                <circle r="3.5" fill="url(#mgG)" stroke="#054f5c" strokeWidth="0.8" />
                <circle r="2.2" fill="#18d5cd" />
              </g>
            ))}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = toRad(i * 45 + 22.5 - 90)
              const rx = ((R - 22) * Math.cos(angle)).toFixed(1)
              const ry = ((R - 22) * Math.sin(angle)).toFixed(1)
              return (
                <g key={i} transform={`translate(${rx},${ry}) rotate(${i * 45 + 22.5})`}>
                  <text textAnchor="middle" y="-3" fontSize="9" style={{ fontFamily: 'system-ui' }}>{SEG_EMOJIS[i]}</text>
                  <text textAnchor="middle" y="7" fontSize="4" fontWeight="900" fill={SEG_TEXT[i]} stroke={SEG_TEXT[i] === '#ffffff' ? '#054f5c' : '#e5f9f8'} strokeWidth="1.5" paintOrder="stroke">{SEG_LABELS[i]}</text>
                </g>
              )
            })}
            <circle r="20" fill="url(#mgG)" stroke="#054f5c" strokeWidth="2" />
            <circle r="16" fill="#096d7d" />
            <circle r="11" fill="url(#mgG)" stroke="#054f5c" strokeWidth="1" />
            <circle cx="-3" cy="-3" r="3" fill="#fff" opacity="0.4" />
          </svg>
          <div style={{ position: 'absolute', top: 5, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
            <svg width="14" height="17" viewBox="0 0 28 34">
              <path d="M14 32 L2 6 Q14 1 26 6 Z" fill="url(#mgG)" stroke="#054f5c" strokeWidth="2" />
              <circle cx="14" cy="9" r="4.5" fill="#096d7d" stroke="#18d5cd" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
        <div style={{ ...S.btnTealGlow, width: '100%', fontSize: 10, height: 33, letterSpacing: '0.06em' }} className='mt-5'>
          ¡GIRAR!
        </div>
      </div>
    </div>
  )
}

// ─── Mini PrizeCard ────────────────────────────────────────────────────────

function MiniPrizeCard() {
  return (
    <div style={S.wrap}>
      <div style={{ padding: '8px 12px 5px', textAlign: 'center' }}>
        <p style={{ fontSize: 9.5, fontWeight: 800, color: '#096d7d', margin: 0, letterSpacing: '0.03em', textTransform: 'uppercase' as const }}>¡Felicidades, Turiexplorer!</p>
      </div>
      <div style={{ margin: '0 8px 6px', background: '#f5fdfc', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(9,109,125,0.1)', border: '1px solid rgba(0,187,180,0.18)' }}>
        <div style={{ height: 50, background: 'linear-gradient(135deg,#096d7d,#00bbb4)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <i className="ri-gift-line" style={{ fontSize: 28, color: '#ffffff' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.2),transparent)' }} />
        </div>
        <div style={{ padding: '5px 10px 4px', textAlign: 'center' }}>
          <p style={{ fontSize: 7, color: '#00bbb4', fontWeight: 700, margin: '0 0 2px', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>Premio</p>
          <p style={{ fontSize: 9.5, fontWeight: 700, color: '#096d7d', margin: 0 }}>DAY PASS HOTEL WYNDHAM</p>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '3px 8px' }}>
          <div style={{ position: 'absolute', left: -5, width: 10, height: 10, borderRadius: '50%', background: '#f5fdfc' }} />
          <div style={{ position: 'absolute', right: -5, width: 10, height: 10, borderRadius: '50%', background: '#f5fdfc' }} />
          <div style={{ flex: 1, borderTop: '1.5px dashed rgba(0,187,180,0.3)' }} />
        </div>
        <div style={{ padding: '4px 10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p style={{ fontSize: 8, color: '#00bbb4', margin: '0 0 2px', fontWeight: 600 }}>Canjea con este código</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#096d7d', margin: 0 }}>HT-00120</p>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, justifyContent: 'flex-end', width: '100%' }}>
            <div style={{ fontSize: 8.5, fontWeight: 600, color: '#096d7d', border: '1px solid rgba(0,187,180,0.3)', borderRadius: 4, padding: '2px 6px', background: 'rgba(0,187,180,0.07)' }}>⬇ Descargar</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Demo overlay ──────────────────────────────────────────────────────────

function DemoOverlay({ onFinish }: { onFinish: () => void }) {
  const { t } = useTranslation()
  const [idx, setIdx] = React.useState(0)

  const DEMO_SLIDES = React.useMemo(() => [
    { title: t('map.demo_slide1_title'), subtitle: t('map.demo_slide1_body'), mockUI: <MiniHistoryCard /> },
    { title: t('map.demo_slide2_title'), subtitle: t('map.demo_slide2_body'), mockUI: <MiniQuizCard /> },
    { title: t('map.demo_slide3_title'), subtitle: t('map.demo_slide3_body'), mockUI: <MiniRouletteCard /> },
    { title: t('map.demo_slide4_title'), subtitle: t('map.demo_slide4_body'), mockUI: <MiniPrizeCard /> },
  ], [t])

  const slide = DEMO_SLIDES[idx]
  const total = DEMO_SLIDES.length
  const isLast = idx === total - 1

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px',
      fontFamily: 'system-ui, sans-serif',
      overflowY: 'auto',
    }}>
      <div style={{
        width: '100%', maxWidth: 340,
        background: '#ffffff',
        borderRadius: 22,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 4px 16px rgba(9,109,125,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 14px 0' }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
            color: '#00bbb4', textTransform: 'uppercase' as const,
            background: 'rgba(0,187,180,0.08)', border: '1px solid rgba(0,187,180,0.25)',
            borderRadius: 6, padding: '3px 8px',
          }}>
            {t('map.demo_label')}
          </span>
          <button
            onClick={onFinish}
            style={{
              background: 'rgba(0,187,180,0.09)', border: 'none',
              borderRadius: 8, cursor: 'pointer', color: '#096d7d',
              fontSize: 14, width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}
          >✕</button>
        </div>

        <div style={{ padding: '10px 18px 0' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#096d7d' }}>
            {slide.title}
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(9,109,125,0.65)', lineHeight: 1.5 }}>
            {slide.subtitle}
          </p>
        </div>

        <div style={{ margin: '12px 0 0', background: 'linear-gradient(to bottom,#d8f5f3,#edfbfa)', padding: '16px 14px' }}>
          <div style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 6px 24px rgba(9,109,125,0.2)' }}>
            {slide.mockUI}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '12px 16px 16px' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(9,109,125,0.38)' }}>{idx + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {idx > 0 && (
              <button
                onClick={() => setIdx(i => i - 1)}
                style={{
                  background: '#f5fdfc', border: '1.5px solid rgba(0,187,180,0.22)',
                  borderRadius: 9999, color: '#096d7d',
                  fontWeight: 700, fontSize: 13,
                  padding: '10px 18px', cursor: 'pointer', lineHeight: 1,
                }}
              >{t('map.demo_back')}</button>
            )}
            <button
              onClick={isLast ? onFinish : () => setIdx(i => i + 1)}
              style={{
                background: 'linear-gradient(135deg,#096d7d 0%,#00bbb4 100%)',
                border: 'none', borderRadius: 9999,
                color: '#ffffff', fontWeight: 800,
                fontSize: 13, padding: '10px 22px',
                cursor: 'pointer', lineHeight: 1,
                boxShadow: '0 4px 14px rgba(0,187,180,0.35)',
                whiteSpace: 'nowrap',
              }}
            >
              {isLast ? t('map.demo_done') : t('map.demo_next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────

type Phase = 'tour' | 'demo' | 'done'

interface WelcomeData { text_es: string; text_en: string; audioUrl_es: string; audioUrl_en: string }

interface Props { ready: boolean; userId?: string }

function getDoneUsers(): string[] {
  try { return JSON.parse(localStorage.getItem(TOUR_KEY) ?? '[]') } catch { return [] }
}

function markUserDone(userId: string) {
  const users = getDoneUsers()
  if (!users.includes(userId)) {
    localStorage.setItem(TOUR_KEY, JSON.stringify([...users, userId]))
  }
}

export default function FeatureTour({ ready, userId }: Props) {
  const { i18n } = useTranslation()
  const lang: 'es' | 'en' = i18n.language?.startsWith('en') ? 'en' : 'es'
  const alreadyDone = userId ? getDoneUsers().includes(userId) : false
  const [run,     setRun]     = React.useState(false)
  const [phase,   setPhase]   = React.useState<Phase>('tour')
  const [welcome, setWelcome] = React.useState<WelcomeData | null>(null)

  // Cargar texto y audio de bienvenida desde Firestore (se muestra en card 0)
  React.useEffect(() => {
    if (alreadyDone) return
    getDoc(doc(db, 'appConfig', 'welcomeMessage'))
      .then(snap => {
        if (snap.exists()) {
          const d = snap.data()
          const bust = `_cb=${Date.now()}`
          const addBust = (url: string) => url ? `${url}${url.includes('?') ? '&' : '?'}${bust}` : ''
          setWelcome({
            text_es:     d.text_es     || '',
            text_en:     d.text_en     || '',
            audioUrl_es: addBust(d.audioUrl_es || ''),
            audioUrl_en: addBust(d.audioUrl_en || ''),
          })
        }
      })
      .catch(() => {})
  }, [alreadyDone])

  // No arrancar el tour hasta que userId esté definido (Firebase Auth es asíncrono)
  React.useEffect(() => {
    if (!ready || phase !== 'tour' || !userId) return
    if (getDoneUsers().includes(userId)) {
      setPhase('done')
      return
    }
    const t = setTimeout(() => setRun(true), 600)
    return () => clearTimeout(t)
  }, [ready, phase, userId])

  const handleEvent = (data: EventData) => {
    const { status } = data
    if (status === STATUS.FINISHED) {
      if (userId) markUserDone(userId)
      setRun(false)
      setPhase('demo')
    } else if (status === STATUS.SKIPPED) {
      if (userId) markUserDone(userId)
      setRun(false)
      setPhase('done')
    }
  }

  const handleDemoFinish = () => {
    if (userId) markUserDone(userId)
    setPhase('done')
  }

  if (phase === 'done') return null

  const welcomeText = lang === 'en' ? (welcome?.text_en || '') : (welcome?.text_es || '')
  const audioUrl    = lang === 'en' ? (welcome?.audioUrl_en || '') : (welcome?.audioUrl_es || '')

  return (
    <>
      <style>{`
        @keyframes tour-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes tour-pulse  { 0%,100%{transform:scale(1)}       50%{transform:scale(1.18)} }
        @keyframes demo-glow   {
          0%,100% { box-shadow: 0 3px 10px rgba(0,187,180,0.25); }
          50%     { box-shadow: 0 4px 18px rgba(0,187,180,0.55); }
        }
        .__floater__arrow { display: none !important; }
      `}</style>

      <TourAudioContext.Provider value={{ audioUrl, welcomeText, lang }}>
        {phase === 'tour' && (
          <Joyride
            steps={steps}
            run={run}
            continuous
            tooltipComponent={MapTooltip}
            options={{ zIndex: 10000, overlayColor: 'rgba(0,0,0,0.48)', skipBeacon: true, skipScroll: true, arrowColor: 'transparent' }}
            onEvent={handleEvent}
          />
        )}
      </TourAudioContext.Provider>

      {phase === 'demo' && <DemoOverlay onFinish={handleDemoFinish} />}
    </>
  )
}
