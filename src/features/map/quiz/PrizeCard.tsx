import { useState } from 'react'
import { STOP_QUIZ_DATA } from './quizData'
import Ranking from './Ranking'

interface Props {
  stopIndex: number
  monumentImage: string
  onContinue: () => void
}

export default function PrizeCard({ stopIndex, monumentImage, onContinue }: Props) {
  const [showRanking, setShowRanking] = useState(false)
  const { prize } = STOP_QUIZ_DATA[stopIndex]
  const isLastStop = stopIndex === 11

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,2,0,0.8)' }}
    >
      <div
        className="prize-card-enter relative w-full h-full rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: '#ebdcc3',
          border: '8px solid #321e0f',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6), inset 0 0 0 2px #a87f2a, inset 0 0 16px rgba(0,0,0,0.5)',
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

        {/* Center Clasps */}
        <svg className="absolute -top-px left-1/2 -translate-x-1/2 w-14 h-6 pointer-events-none z-30 text-[#fcd34d]" viewBox="0 0 56 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3h32M16 3c4 4 8 7 12 7s8-3 12-7" strokeLinecap="round" />
          <circle cx="28" cy="3" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <svg className="absolute -bottom-px left-1/2 -translate-x-1/2 w-14 h-6 pointer-events-none z-30 text-[#fcd34d] transform scale-y-[-1]" viewBox="0 0 56 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3h32M16 3c4 4 8 7 12 7s8-3 12-7" strokeLinecap="round" />
          <circle cx="28" cy="3" r="1.2" fill="currentColor" stroke="none" />
        </svg>

        {/* Top stripe */}
        <div
          className="h-1 shrink-0 z-10"
          style={{ background: 'linear-gradient(90deg,transparent,#fcd34d,#a87f2a,#fcd34d,transparent)' }}
        />

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-5 px-6 py-8 text-center">
          {/* Title */}
          <div className="space-y-1">
            <p className="text-[8px] font-black tracking-[4px] uppercase text-[#a87f2a] mt-2">
              {isLastStop ? '¡Aventura completada!' : '¡Premio desbloqueado!'}
            </p>
            <h2
              className="text-2xl font-black text-[#321e0f]"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              ¡Felicidades, Explorador!
            </h2>
          </div>

          {/* Prize image with Wood Frame & Medal Coin */}
          <div className="relative my-1">
            <div
              className="h-36 w-36 rounded-2xl overflow-hidden"
              style={{
                border: '4px solid #321e0f',
                boxShadow: '0 0 20px rgba(168,127,42,0.35), inset 0 0 0 2px #a87f2a, 0 8px 20px rgba(0,0,0,0.3)',
              }}
            >
              <img src={monumentImage} alt={prize.name} className="h-full w-full object-cover" />
            </div>
            {/* Medal/Coin badge style */}
            <div
              className="absolute -bottom-3 -right-3 flex items-center justify-center rounded-full text-2xl"
              style={{
                width: '54px',
                height: '54px',
                background: 'radial-gradient(circle, #fcd34d 0%, #a87f2a 100%)',
                border: '3.5px solid #321e0f',
                boxShadow: '0 4px 10px rgba(0,0,0,0.35)',
              }}
            >
              {prize.icon}
            </div>
          </div>

          {/* Prize name + description */}
          <div className="space-y-2 pt-1">
            <h3
              className="text-base font-black text-[#321e0f]"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {prize.name}
            </h3>
            <p className="text-[12px] text-[#6b4a20] leading-relaxed max-w-[280px]">
              {prize.description}
            </p>
          </div>

          {/* Code block */}
          <div
            className="w-full rounded-xl px-5 py-4"
            style={{
              background: '#fcf7ed',
              border: '1.5px dashed rgba(168,127,42,0.45)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
            }}
          >
            <p className="text-[8px] text-[#a87f2a] font-bold uppercase tracking-[2px] mb-2">
              Muestra este código al establecimiento
            </p>
            <p
              className="text-xl font-black text-[#321e0f] tracking-widest"
              style={{ fontFamily: 'monospace', letterSpacing: '5px' }}
            >
              {prize.code}
            </p>
            <p className="text-[10px] text-[#a87f2a]/70 mt-2">
              Válido hasta: <span className="text-[#6b4a20] font-bold">{prize.validUntil}</span>
            </p>
          </div>
        </div>

        {/* Buttons — always visible at bottom */}
        <div
          className="px-5 pb-6 pt-3 shrink-0 z-10 flex flex-col gap-2.5"
          style={{ background: '#ebdcc3', borderTop: '1px solid rgba(168,127,42,0.15)' }}
        >
          <button
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-black uppercase tracking-widest transition-all active:scale-95"
            style={{
              background: 'linear-gradient(90deg,#321e0f,#503019,#321e0f)',
              border: '2px solid #a87f2a',
              color: '#fcd34d',
              boxShadow: 'inset 0 0 8px rgba(252,211,77,0.25), 0 6px 16px rgba(0,0,0,0.35)',
            }}
          >

            {isLastStop ? 'Ver mis logros' : 'Continuar la aventura'}
            <i className="ri-arrow-right-line text-base" />
          </button>

          <button
            onClick={() => setShowRanking(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all active:scale-95"
            style={{
              background: 'linear-gradient(90deg,#a87f2a,#c7a361,#a87f2a)',
              border: '2px solid #321e0f',
              color: '#321e0f',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <i className="ri-trophy-line text-base" />
            Ver Ranking
          </button>
        </div>

        {/* Bottom stripe */}
        <div
          className="h-1 shrink-0 z-10"
          style={{ background: 'linear-gradient(90deg,transparent,#a87f2a,#fcd34d,#a87f2a,transparent)' }}
        />
      </div>

      {/* Leaderboard/Ranking Modal Overlay */}
      {showRanking && (
        <Ranking onClose={() => setShowRanking(false)} onContinue={onContinue} />
      )}
    </div>
  )
}
