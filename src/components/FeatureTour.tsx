import React from 'react'
import { Joyride, STATUS, type EventData, type Step, type TooltipRenderProps } from 'react-joyride'

const TOUR_KEY = 'turizoneando_tour_done'

// ─── Joyride steps (fase 1) ────────────────────────────────────────────────

const steps: Step[] = [
  {
    target: '#tour-map',
    placement: 'center',
    skipBeacon: true,
    title: '¡Bienvenido al mapa!',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 72, lineHeight: 1, animation: 'tour-bounce 1.2s ease-in-out infinite' }}>🗺️</div>
        <p style={{ margin: 0, fontSize: 14, color: 'rgba(50,30,15,0.72)', lineHeight: 1.6, textAlign: 'center' }}>
          Este es el mapa de la Zona Colonial. Aquí encontrarás todas las paradas del recorrido histórico.
        </p>
      </div>
    ),
  },
  {
    target: '#tour-stages',
    placement: 'bottom',
    skipBeacon: true,
    spotlightRadius: 9999,
    title: 'Etapas del recorrido',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 72, lineHeight: 1, animation: 'tour-pulse 1s ease-in-out infinite' }}>🏅</div>
        <p style={{ margin: 0, fontSize: 14, color: 'rgba(50,30,15,0.72)', lineHeight: 1.6, textAlign: 'center' }}>
          Navega entre las etapas del tour. Cada etapa tiene sus propias paradas y desafíos que completar.
        </p>
      </div>
    ),
  },
  {
    target: '#tour-fullscreen',
    placement: 'bottom',
    skipBeacon: true,
    spotlightRadius: 9999,
    title: 'Pantalla completa',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 72, lineHeight: 1, animation: 'tour-pulse 1s ease-in-out infinite' }}>⛶</div>
        <p style={{ margin: 0, fontSize: 14, color: 'rgba(50,30,15,0.72)', lineHeight: 1.6, textAlign: 'center' }}>
          Activa la pantalla completa para una experiencia más inmersiva mientras exploras el mapa.
        </p>
      </div>
    ),
  },
  {
    target: '#tour-menu',
    placement: 'bottom-end',
    skipBeacon: true,
    spotlightRadius: 9999,
    title: 'Tu perfil y premios',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 72, lineHeight: 1, animation: 'tour-bounce 1.2s ease-in-out infinite' }}>🏆</div>
        <p style={{ margin: 0, fontSize: 14, color: 'rgba(50,30,15,0.72)', lineHeight: 1.6, textAlign: 'center' }}>
          Desde aquí accedes a tu perfil, tus premios ganados, el ranking de jugadores y las reglas del rally.
        </p>
      </div>
    ),
  },
]

// ─── Custom tooltip (fase 1) ───────────────────────────────────────────────

function MapTooltip({ index, isLastStep, size, step, backProps, primaryProps, skipProps, tooltipProps }: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      style={{
        width: 300,
        background: 'linear-gradient(160deg, #faf6eb 0%, #f0e8d0 100%)',
        borderRadius: 18,
        border: '1.5px solid rgba(168,127,42,0.45)',
        borderBottom: '3px solid rgba(168,127,42,0.6)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.9)',
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ height: 3, background: 'linear-gradient(90deg, #a87f2a, #fcd34d 50%, #a87f2a)' }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 12px 0' }}>
        <button
          {...skipProps}
          style={{
            background: 'none', border: '1.5px solid rgba(168,127,42,0.3)', borderRadius: 8,
            cursor: 'pointer', color: 'rgba(50,30,15,0.5)', fontSize: 16, lineHeight: 1,
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          }}
        >✕</button>
      </div>
      <div style={{ padding: '12px 22px 0' }}>
        {step.content}
        <h3 style={{ margin: '12px 0 0', fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 800, color: '#321e0f', textAlign: 'center', lineHeight: 1.3 }}>
          {step.title as React.ReactNode}
        </h3>
      </div>
      <div style={{ margin: '14px 22px 0', height: 1, background: 'linear-gradient(90deg, transparent, rgba(168,127,42,0.4), transparent)' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px 18px', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(50,30,15,0.45)', minWidth: 36 }}>{index + 1} / {size}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {index > 0 && (
            <button {...backProps} style={{ background: '#c7a361', border: '1.5px solid #a87f2a', borderBottom: '3px solid #22150c', borderRadius: 10, color: '#321e0f', fontWeight: 800, fontSize: 13, padding: '8px 16px', cursor: 'pointer', fontFamily: 'system-ui, sans-serif', boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3)' }}>
              Atrás
            </button>
          )}
          <button {...primaryProps} style={{ background: 'linear-gradient(160deg, #22150c 0%, #1a0f07 100%)', border: '1.5px solid rgba(168,127,42,0.5)', borderBottom: '3px solid rgba(168,127,42,0.65)', borderRadius: 10, color: '#fcd34d', fontWeight: 800, fontSize: 13, padding: '8px 20px', cursor: 'pointer', fontFamily: 'system-ui, sans-serif', boxShadow: 'inset 0 2px 0 rgba(199,163,97,0.18)' }}>
            {isLastStep ? '¡Ver cómo jugar!' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Estilos reutilizables para los minis ──────────────────────────────────

const S = {
  wrap: {
    borderRadius: 8,
    overflow: 'hidden' as const,
    border: '3px solid #321e0f',
    boxShadow: 'inset 0 0 0 1.5px rgba(168,127,42,0.3), 0 6px 24px rgba(0,0,0,0.5)',
  },
  btnTan: {
    height: 33,
    borderRadius: 5,
    background: '#c7a361',
    border: '1.5px solid #a87f2a',
    borderBottom: '2.5px solid #22150c' as string,
    display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
    fontSize: 9, fontWeight: 800, color: '#321e0f',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
    cursor: 'default' as const, userSelect: 'none' as const, flexShrink: 0 as const, gap: 4,
  },
  btnDark: {
    height: 33,
    borderRadius: 5,
    background: 'linear-gradient(160deg,#22150c,#1a0f07)',
    border: '1.5px solid rgba(168,127,42,0.5)',
    borderBottom: '2.5px solid rgba(168,127,42,0.65)' as string,
    display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
    fontSize: 9, fontWeight: 800, color: '#fcd34d',
    boxShadow: 'inset 0 1px 0 rgba(199,163,97,0.18)',
    cursor: 'default' as const, userSelect: 'none' as const, gap: 4,
  },
  btnDarkGlow: {
    height: 33,
    borderRadius: 5,
    background: 'linear-gradient(160deg,#22150c,#1a0f07)',
    border: '1.5px solid rgba(168,127,42,0.5)',
    borderBottom: '2.5px solid rgba(168,127,42,0.65)' as string,
    display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
    fontSize: 9, fontWeight: 800, color: '#fcd34d',
    animation: 'demo-glow 1.4s ease-in-out infinite',
    boxShadow: '0 0 10px rgba(252,211,77,0.4), inset 0 1px 0 rgba(199,163,97,0.18)',
    cursor: 'default' as const, userSelect: 'none' as const, gap: 4,
  },
  footer: {
    borderTop: '1px solid rgba(168,127,42,0.2)',
    padding: '8px 10px',
    display: 'flex' as const, gap: 7, background: 'transparent',
  },
}

// ─── Mini HistoryCard ──────────────────────────────────────────────────────

function MiniHistoryCard() {
  return (
    <div style={{ ...S.wrap, background: '#f5ead0' }}>
      {/* Hero foto */}
      <div style={{ padding: '10px 15px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#321e0f', marginTop: '2.5px', marginBottom: '8px', textTransform: 'uppercase' as const }}>Parada 1</p>
        <h3 style={{ fontSize: 10, fontWeight: 900, color: '#a87f2a', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 10px', lineHeight: 1.3, fontFamily: 'Georgia, serif' }}>
          Las Escalinatas de la Calle El Conde
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(168,127,42,0.35)' }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(168,127,42,0.6)' }} />
          <div style={{ flex: 1, height: 1, background: 'rgba(168,127,42,0.35)' }} />
        </div>
        <p style={{ fontSize: 10, color: 'rgba(50,30,15,0.65)', lineHeight: 1.6, margin: 0, fontFamily: 'Georgia, serif', textAlign: 'left' }}>
          ¡Ahoy, Marinero! Tu travesía continúa por las históricas calles de Santo Domingo, y ahora te encuentras frente a las famosas Escalinatas de la Calle El Conde. Durante siglos, esta emblemática vía ha sido el corazón de la vida comercial y social de la ciudad...
        </p>
      </div>
      {/* Footer */}
      <div style={S.footer}>
        <div style={{ ...S.btnTan, width: 58 }}>OMITIR</div>
        <div style={{ ...S.btnDarkGlow, flex: 1 }}><span style={{ fontSize: 9 }}>▶</span> NARRACIÓN</div>
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
    <div style={{ ...S.wrap, background: '#f5ead0' }}>
      {/* Header oscuro con counter */}
      <div style={{ padding: '9px 14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right,transparent,rgba(168,127,42,0.5))' }} />
          <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.12em', color: '#a87f2a', textTransform: 'uppercase' as const }}>Pregunta 1 de 3</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left,transparent,rgba(168,127,42,0.5))' }} />
        </div>
      </div>
     
      {/* Pregunta y opciones */}
      <div style={{ padding: '4px 12px 8px' }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: '#321e0f', textAlign: 'center', lineHeight: 1.5, margin: '0 0 8px', fontFamily: 'Georgia, serif' }}>
          ¿En qué año fue fundada la Ciudad Colonial de Santo Domingo?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
          {options.map(o => (
            <div key={o.label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 9px', borderRadius: 6,
              background: o.sel ? 'rgba(50,30,15,0.07)' : 'rgba(255,255,255,0.6)',
              border: `1.5px solid ${o.sel ? '#a87f2a' : 'rgba(168,127,42,0.2)'}`,
            }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, background: o.sel ? '#321e0f' : 'rgba(168,127,42,0.12)', border: '1px solid rgba(168,127,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color: o.sel ? '#fcd34d' : '#a87f2a', fontFamily: 'Georgia, serif' }}>
                {o.label}
              </div>
              <span style={{ fontSize: 9, fontWeight: o.sel ? 700 : 500, color: o.sel ? '#321e0f' : 'rgba(50,30,15,0.72)', flex: 1 }}>{o.text}</span>
              {o.sel && <span style={{ fontSize: 9, color: '#a87f2a', fontWeight: 700 }}>✓</span>}
            </div>
          ))}
        </div>
      </div>
      {/* Footer */}
      <div style={S.footer}>
        <div style={{ ...S.btnTan, width: 50 }}>SALIR</div>
        <div style={{ ...S.btnDarkGlow, flex: 1 }}> COMPLETAR</div>
      </div>
    </div>
  )
}

// ─── Mini RouletteCard ─────────────────────────────────────────────────────

const SEG_COLORS = ['#ebdcc3','#321e0f','#fcd34d','#a87f2a','#ebdcc3','#321e0f','#fcd34d','#a87f2a']
const SEG_TEXT   = ['#321e0f','#fff3d1','#321e0f','#fff3d1','#321e0f','#fff3d1','#321e0f','#fff3d1']
const SEG_EMOJIS = ['🪙','🗝️','🧭','🗺️','💰','🛡️','⚔️','💎']
const SEG_LABELS = ['MONEDAS','LLAVE','BRÚJULA','MAPA','COFRE','ESCUDO','ESPADA','GEMA']
const toRad = (d: number) => d * Math.PI / 180
function segPath(i: number, r: number) {
  const s = toRad(i * 45 - 90), e = toRad((i + 1) * 45 - 90)
  return `M 0 0 L ${(r * Math.cos(s)).toFixed(1)} ${(r * Math.sin(s)).toFixed(1)} A ${r} ${r} 0 0 1 ${(r * Math.cos(e)).toFixed(1)} ${(r * Math.sin(e)).toFixed(1)} Z`
}

function MiniRouletteCard() {
  const R = 54
  return (
    <div style={{ ...S.wrap, background: 'linear-gradient(160deg,#faf6eb,#f0e4c8)' }}>
      <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '12px 12px 10px', gap: 8, background: 'radial-gradient(ellipse at 50% 0%,rgba(252,211,77,0.15) 0%,transparent 65%)' }}>
        <h3 style={{ fontSize: 12, fontWeight: 900, color: '#321e0f', fontFamily: 'Georgia, serif', margin: 0, textAlign: 'center' }}>¡Etapa 1 completada!</h3>
        <p style={{ fontSize: 8.5, color: 'rgba(50,30,15,0.6)', margin: -5, textAlign: 'center' }}>Gira el timón para reclamar tu botín</p>
        {/* Rueda */}
        <div style={{ position: 'relative', width: R * 2 + 28, height: R * 2 + 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className='mt-5'>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', width: 5, height: 5, borderRadius: '50%', background: '#fcd34d', boxShadow: '0 0 5px #fcd34d', transform: `rotate(${i * 45}deg) translate(0,${-(R + 13)}px)`, transformOrigin: 'center center', zIndex: 5 }} />
          ))}
          <svg width={R * 2} height={R * 2} viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`} style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="mwG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7a4824" />
                <stop offset="50%" stopColor="#503019" />
                <stop offset="100%" stopColor="#22150c" />
              </linearGradient>
              <linearGradient id="mgG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="40%" stopColor="#fcd34d" />
                <stop offset="100%" stopColor="#a87f2a" />
              </linearGradient>
            </defs>
            {Array.from({ length: 8 }).map((_, i) => (
              <g key={i} transform={`rotate(${i * 45})`}>
                <rect x="-2" y={-R} width="4" height={R} fill="url(#mwG)" stroke="#1a0d05" strokeWidth="0.8" />
                <path d={`M -3 ${-R} C -5 ${-R - 7}, -5 ${-R - 14}, -3 ${-R - 18} L 3 ${-R - 18} C 5 ${-R - 14}, 5 ${-R - 7}, 3 ${-R} Z`} fill="url(#mwG)" stroke="#1a0d05" strokeWidth="0.8" />
                <circle cx="0" cy={-R - 20} r="4" fill="url(#mwG)" stroke="#1a0d05" strokeWidth="0.8" />
              </g>
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <path key={i} d={segPath(i, R - 6)} fill={SEG_COLORS[i]} stroke="#1a0d05" strokeWidth="1.5" />
            ))}
            <circle r={R - 5} fill="none" stroke="url(#mgG)" strokeWidth="2" />
            <circle r={R} fill="none" stroke="url(#mwG)" strokeWidth="12" />
            <circle r={R + 5} fill="none" stroke="#1a0d05" strokeWidth="1.2" />
            <circle r={R - 4} fill="none" stroke="#1a0d05" strokeWidth="1.2" />
            {Array.from({ length: 8 }).map((_, i) => {
              const a = i * 45 + 22.5
              return (
                <g key={i} transform={`rotate(${a}) translate(0,${-R})`}>
                  <circle r="3.5" fill="url(#mgG)" stroke="#1a0d05" strokeWidth="0.8" />
                  <circle r="2.2" fill="#dc2626" />
                </g>
              )
            })}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = toRad(i * 45 + 22.5 - 90)
              const rx = ((R - 22) * Math.cos(angle)).toFixed(1)
              const ry = ((R - 22) * Math.sin(angle)).toFixed(1)
              return (
                <g key={i} transform={`translate(${rx},${ry}) rotate(${i * 45 + 22.5})`}>
                  <text textAnchor="middle" y="-3" fontSize="9" style={{ fontFamily: 'system-ui' }}>{SEG_EMOJIS[i]}</text>
                  <text textAnchor="middle" y="7" fontSize="4" fontWeight="900" fill={SEG_TEXT[i]} stroke={SEG_TEXT[i] === '#fff3d1' ? '#321e0f' : '#ebdcc3'} strokeWidth="1.5" paintOrder="stroke" style={{ fontFamily: 'Georgia, serif' }}>{SEG_LABELS[i]}</text>
                </g>
              )
            })}
            <circle r="20" fill="url(#mgG)" stroke="#1a0d05" strokeWidth="2" />
            <circle r="16" fill="#321e0f" />
            <circle r="11" fill="url(#mgG)" stroke="#1a0d05" strokeWidth="1" />
            <circle cx="-3" cy="-3" r="3" fill="#fff" opacity="0.4" />
          </svg>
          <div style={{ position: 'absolute', top: 5, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
            <svg width="14" height="17" viewBox="0 0 28 34">
              <path d="M14 32 L2 6 Q14 1 26 6 Z" fill="url(#mgG)" stroke="#1a0d05" strokeWidth="2" />
              <circle cx="14" cy="9" r="4.5" fill="#321e0f" stroke="#fcd34d" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
        <div style={{ ...S.btnDarkGlow, width: '100%', fontSize: 10, height: 33, letterSpacing: '0.06em' }} className='mt-5'>
          GIRAR TIMÓN
        </div>
      </div>
    </div>
  )
}

// ─── Mini PrizeCard ────────────────────────────────────────────────────────

function MiniPrizeCard() {
  return (
    <div style={{ ...S.wrap, background: 'linear-gradient(160deg,#ede0c4,#f5ead0)' }}>
      {/* Header */}
      <div style={{ padding: '8px 12px 5px', textAlign: 'center' }}>
        <p style={{ fontSize: 9.5, fontWeight: 800, color: '#321e0f', margin: 0, letterSpacing: '0.03em', textTransform: 'uppercase' as const }}>¡Felicidades, Turiexplore!</p>
      </div>
      {/* Ticket */}
      <div style={{ margin: '0 8px 6px', background: '#faf6eb', borderRadius: 5, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', border: '1px solid rgba(168,127,42,0.15)' }}>
        {/* Foto */}
        <div style={{ height: 50, background: 'linear-gradient(135deg,#3a2010,#6b4a20,#3a2010)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <span style={{ fontSize: 24 }}>🏛️</span>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.3),transparent)' }} />
        </div>
        {/* Premio */}
        <div style={{ padding: '5px 10px 4px', textAlign: 'center' }}>
          <p style={{ fontSize: 7, color: '#a87f2a', fontWeight: 700, margin: '0 0 2px', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>Premio</p>
          <p style={{ fontSize: 9.5, fontWeight: 700, color: '#321e0f', margin: 0 }}>DAY PASS HOTEL WYNDHAM</p>
        </div>
        {/* Notch separador */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '3px 8px' }}>
          <div style={{ position: 'absolute', left: -5, width: 10, height: 10, borderRadius: '50%', background: '#ede0c4' }} />
          <div style={{ position: 'absolute', right: -5, width: 10, height: 10, borderRadius: '50%', background: '#ede0c4' }} />
          <div style={{ flex: 1, borderTop: '1.5px dashed rgba(168,127,42,0.35)' }} />
        </div>
        {/* QR + código */}
        <div style={{ padding: '4px 10px 8px', display: 'flex', alignItems: 'center', gap: 9 }}>
          {/* <div style={{ width: 36, height: 36, background: '#fff', border: '1px solid rgba(168,127,42,0.3)', borderRadius: 3, flexShrink: 0, display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', padding: 3, gap: 1 }}>
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} style={{ background: [0,1,5,6,2,3,4,10,12,14,15,18,20,21,24].includes(i) ? '#321e0f' : 'transparent', borderRadius: 0.5 }} />
            ))}
          </div> */}
          <div className='flex flex-col items-center justify-center w-full'>
            <p className='text-[11px] text-amber-700'>Canjea con este código</p>
            <p className='text-2xl font-black'>HT-00120</p>
            <div className='flex gap-1.5 mt-3 w-full items-center justify-end'>
              <div style={{ fontSize: 8.5, fontWeight: 600, color: '#321e0f', border: '1px solid rgba(168,127,42,0.3)', borderRadius: 3, padding: '2px 5px', background: 'rgba(168,127,42,0.06)' }}>⬇ Descargar</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Demo slides data ──────────────────────────────────────────────────────

const DEMO_SLIDES = [
  {
    title: 'Lee la historia',
    subtitle: 'Al tocar una parada aparece su historia. Escúchala con "NARRACIÓN" o léela antes de responder.',
    mockUI: <MiniHistoryCard />,
  },
  {
    title: 'Responde el quiz',
    subtitle: 'Selecciona la respuesta correcta y toca "COMPROBAR". ¡Cuantas más aciertes, más puntos ganas!',
    mockUI: <MiniQuizCard />,
  },
  {
    title: 'Gira el timón',
    subtitle: 'Al completar una etapa giras el timón para ganar un premio sorpresa del rally.',
    mockUI: <MiniRouletteCard />,
  },
  {
    title: '¡Tu premio te espera!',
    subtitle: 'Recibirás un código QR para canjearlo en los establecimientos participantes. ¡Guárdalo bien!',
    mockUI: <MiniPrizeCard />,
  },
]

// ─── Demo overlay component ────────────────────────────────────────────────

function DemoOverlay({ onFinish }: { onFinish: () => void }) {
  const [idx, setIdx] = React.useState(0)
  const slide = DEMO_SLIDES[idx]
  const total = DEMO_SLIDES.length
  const isLast = idx === total - 1

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(10,5,2,0.88)',
      backdropFilter: 'blur(6px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '14px 14px 18px',
      fontFamily: 'system-ui, sans-serif',
      overflowY: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', color: '#fcd34d', textTransform: 'uppercase' as const, background: 'rgba(168,127,42,0.2)', border: '1px solid rgba(168,127,42,0.4)', borderRadius: 6, padding: '3px 8px' }}>
            Demo del juego
          </span>
          <button
            onClick={onFinish}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.22)', borderRadius: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 16, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            title="Saltar demo"
          >✕</button>
        </div>

        {/* Título + subtítulo */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 4px', fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 800, color: '#faf6eb', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
            {slide.title}
          </h3>
          <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(250,246,235,0.7)', lineHeight: 1.5 }}>
            {slide.subtitle}
          </p>
        </div>

        {/* Mini UI */}
        <div style={{ borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.55)' }}>
          {slide.mockUI}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(250,246,235,0.45)', minWidth: 36 }}>{idx + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {idx > 0 && (
              <button
                onClick={() => setIdx(i => i - 1)}
                style={{ background: '#c7a361', border: '1.5px solid #a87f2a', borderBottom: '3px solid #22150c', borderRadius: 10, color: '#321e0f', fontWeight: 800, fontSize: 13, padding: '8px 16px', cursor: 'pointer', boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3)' }}
              >Atrás</button>
            )}
            <button
              onClick={isLast ? onFinish : () => setIdx(i => i + 1)}
              style={{ background: 'linear-gradient(160deg,#22150c 0%,#1a0f07 100%)', border: '1.5px solid rgba(168,127,42,0.5)', borderBottom: '3px solid rgba(168,127,42,0.65)', borderRadius: 10, color: '#fcd34d', fontWeight: 800, fontSize: 13, padding: '8px 20px', cursor: 'pointer', boxShadow: 'inset 0 2px 0 rgba(199,163,97,0.18)' }}
            >
              {isLast ? '¡Entendido!' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────

type Phase = 'tour' | 'demo' | 'done'

interface Props { ready: boolean }

export default function FeatureTour({ ready }: Props) {
  const alreadyDone = localStorage.getItem(TOUR_KEY) === 'true'
  const [run, setRun] = React.useState(false)
  const [phase, setPhase] = React.useState<Phase>('tour')

  React.useEffect(() => {
    if (ready && !alreadyDone) {
      const t = setTimeout(() => setRun(true), 1200)
      return () => clearTimeout(t)
    }
  }, [ready, alreadyDone])

  const handleEvent = (data: EventData) => {
    const { status } = data
    if (status === STATUS.FINISHED) {
      setRun(false)
      setPhase('demo')
    } else if (status === STATUS.SKIPPED) {
      localStorage.setItem(TOUR_KEY, 'true')
      setRun(false)
      setPhase('done')
    }
  }

  const handleDemoFinish = () => {
    localStorage.setItem(TOUR_KEY, 'true')
    setPhase('done')
  }

  if (alreadyDone || phase === 'done') return null

  return (
    <>
      <style>{`
        @keyframes tour-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes tour-pulse  { 0%,100%{transform:scale(1)}       50%{transform:scale(1.18)} }
        @keyframes demo-glow   {
          0%,100% { box-shadow: 0 0 6px rgba(252,211,77,0.25), inset 0 1px 0 rgba(199,163,97,0.18); }
          50%     { box-shadow: 0 0 14px rgba(252,211,77,0.55), inset 0 1px 0 rgba(199,163,97,0.18); }
        }
      `}</style>

      {phase === 'tour' && (
        <Joyride
          steps={steps}
          run={run}
          continuous
          tooltipComponent={MapTooltip}
          options={{ zIndex: 10000, overlayColor: 'rgba(10,5,2,0.62)', skipBeacon: true, skipScroll: true, arrowColor: '#a87f2a' }}
          onEvent={handleEvent}
        />
      )}

      {phase === 'demo' && <DemoOverlay onFinish={handleDemoFinish} />}
    </>
  )
}
