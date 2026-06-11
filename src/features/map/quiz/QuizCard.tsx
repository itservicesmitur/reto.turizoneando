import { useState } from 'react'
import { STOP_QUIZ_DATA } from './quizData'

interface Props {
  stopIndex: number
  monumentName: string
  monumentImage: string
  onComplete: () => void
  onClose: () => void
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']

export default function QuizCard({ stopIndex, monumentName, monumentImage, onComplete, onClose }: Props) {
  const data = STOP_QUIZ_DATA[stopIndex]
  const totalQuestions = data.questions.length

  const [questionIdx, setQuestionIdx] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isWrong, setIsWrong] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)

  const question = data.questions[questionIdx]

  const handleCheck = () => {
    if (selectedOption === null) return
    if (selectedOption === question.correctIndex) {
      if (questionIdx + 1 >= totalQuestions) {
        onComplete()
      } else {
        setQuestionIdx(q => q + 1)
        setSelectedOption(null)
        setIsWrong(false)
      }
    } else {
      setIsWrong(true)
      setShakeKey(k => k + 1)
    }
  }

  const handleRetry = () => {
    setQuestionIdx(0)
    setSelectedOption(null)
    setIsWrong(false)
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

        {/* TOP STRIPE */}
        <div
          className="h-1.5 shrink-0"
          style={{ background: 'linear-gradient(90deg,transparent,#fcd34d,#a87f2a,#fcd34d,transparent)' }}
        />

        {/* HERO IMAGE */}
        <div className="relative h-44 shrink-0 overflow-hidden">
          <img
            src={monumentImage}
            alt={monumentName}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 55%, rgba(235,220,195,0) 100%)' }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-28"
            style={{ background: 'linear-gradient(to bottom, transparent 0%, #ebdcc3 100%)' }}
          />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-90"
            style={{ background: 'rgba(0,0,0,0.5)', border: '1.5px solid rgba(168,127,42,0.6)', color: '#fcd34d' }}
          >
            <i className="ri-close-line text-lg" />
          </button>

          {/* Monument name */}
          <div className="absolute bottom-10 left-0 right-0 px-5">
            <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: '#fcd34d', opacity: 0.85 }}>
            Pregunta {String(questionIdx + 1).padStart(2, '0')} de {totalQuestions}
            </p>
            <h2 className="text-xl font-black text-white leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
              {monumentName}
            </h2>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4 -mt-6">

          {/* Progress bar — segmented */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-all duration-500"
                style={{ background: i <= questionIdx ? '#a87f2a' : 'rgba(168,127,42,0.2)' }}
              />
            ))}
          </div>

          {/* Question card — premium pirate parchment nailed map */}
          <div
            className="relative rounded-2xl px-6 pb-6 pt-10 mt-6 transition-all duration-300"
            style={{
              background: '#fcf7ed',
              border: '2px solid #a87f2a',
              boxShadow: '0 8px 24px rgba(80, 48, 25, 0.12), inset 0 0 20px rgba(168, 127, 42, 0.05)',
            }}
          >
            {/* SVG Decorative Corner Frames (Old Parchment Style) */}
            <svg className="absolute top-2 left-2 w-7 h-7 pointer-events-none text-[#a87f2a] opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 10V2h8M4 6V4h2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <svg className="absolute top-2 right-2 w-7 h-7 pointer-events-none text-[#a87f2a] opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 10V2h-8M20 6V4h-2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <svg className="absolute bottom-2 left-2 w-7 h-7 pointer-events-none text-[#a87f2a] opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 14v8h8M4 18v-2h2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <svg className="absolute bottom-2 right-2 w-7 h-7 pointer-events-none text-[#a87f2a] opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 14v8h-8M20 18v-2h-2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

            {/* Overhanging Pirate / Explorer Gold-Brown Badge */}
            <div className="absolute -top-4.5 left-1/2 -translate-x-1/2 z-10 flex">
              <span
                className="px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] flex items-center gap-1.5"
                style={{
                  background: 'linear-gradient(135deg, #321e0f 0%, #22150c 100%)',
                  border: '2.5px solid #fcd34d',
                  color: '#fcd34d',
                  fontFamily: 'Georgia, serif',
                  boxShadow: '0 4px 10px rgba(50,30,15,0.45)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.6)'
                }}
              >
                <i className="ri-skull-line text-[12px]" style={{ color: '#fcd34d' }} />
                Parada {String(questionIdx + 1).padStart(2, '0')}
              </span>
            </div>

            <p
              className="text-center font-bold leading-relaxed mt-1"
              style={{ color: '#321e0f', fontFamily: 'Georgia, serif', fontSize: '18px' }}
            >
              ¿{question.question.replace(/^[¿?"'“]+|[?"'”]+$/g, '')}?
            </p>

            {/* Footer decoration */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="h-[1.5px] w-8 bg-[#a87f2a]/20" />
              <i className="ri-shield-line text-xs text-[#a87f2a]/50 animate-pulse" />
              <div className="h-[1.5px] w-8 bg-[#a87f2a]/20" />
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3">
            {question.options.map((option, i) => {
              const isSelected = selectedOption === i
              const isIncorrect = isWrong && isSelected
              const label = OPTION_LABELS[i]

              return (
                <button
                  key={`${questionIdx}-${i}-${shakeKey}`}
                  onClick={() => { if (!isWrong) setSelectedOption(i) }}
                  className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all duration-150 option-slide-in cursor-pointer hover:scale-[1.01] active:scale-[0.98] ${
                    isIncorrect ? 'quiz-option-wrong' : ''
                  }`}
                  style={{
                    animationDelay: `${i * 80}ms`,
                    background: isIncorrect
                      ? 'rgba(220,38,38,0.09)'
                      : isSelected
                      ? '#fff3d1'
                      : 'rgba(255,255,255,0.65)',
                    border: `2px solid ${
                      isIncorrect ? '#dc2626'
                      : isSelected ? '#a87f2a'
                      : 'rgba(168,127,42,0.25)'
                    }`,
                    borderBottomWidth: '4px',
                    borderBottomColor: isIncorrect ? '#b91c1c' : isSelected ? '#a87f2a' : 'rgba(168,127,42,0.35)',
                    transform: isSelected && !isIncorrect ? 'translateY(1px)' : 'none'
                  }}
                >
                  {/* Letter medallion */}
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black transition-all duration-150"
                    style={{
                      background: isIncorrect
                        ? '#dc2626'
                        : isSelected
                        ? '#321e0f'
                        : 'rgba(168,127,42,0.14)',
                      color: isSelected
                        ? '#fcd34d'
                        : isIncorrect
                        ? 'white'
                        : '#a87f2a',
                    }}
                  >
                    {label}
                  </div>

                  <span
                    className="flex-1 text-[15px] font-semibold leading-snug"
                    style={{
                      color: isIncorrect ? '#dc2626'
                        : isSelected ? '#321e0f'
                        : '#503019',
                    }}
                  >
                    {option}
                  </span>

                  {isSelected && !isIncorrect && (
                    <i className="ri-sword-line text-lg shrink-0" style={{ color: '#a87f2a' }} />
                  )}
                  {isIncorrect && (
                    <i className="ri-skull-line text-lg shrink-0 text-red-500" />
                  )}
                  {!isSelected && !isIncorrect && (
                    <div
                      className="h-6 w-6 shrink-0 rounded-full transition-all duration-150 group-hover:border-amber-700"
                      style={{ border: '2px solid rgba(168,127,42,0.28)' }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Wrong feedback */}
          {isWrong && (
            <div
              className="flex items-center gap-3 rounded-2xl px-4 py-3 animate-fade-in"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <i className="ri-skull-2-line text-red-500 text-xl shrink-0" />
              <p className="text-sm text-red-700 font-bold leading-snug">
                ¡Has fallado la misión! Debes comenzar desde el inicio.
              </p>
            </div>
          )}

          <div className="h-1 shrink-0" />
        </div>

        {/* FOOTER */}
        <div
          className="shrink-0 px-4 pb-6 pt-3"
          style={{ background: '#ebdcc3', borderTop: '1px solid rgba(168,127,42,0.2)' }}
        >
          {isWrong ? (
            <button
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2 rounded-3xl py-4 font-black text-base uppercase tracking-widest transition-all duration-100 hover:scale-[1.02] active:scale-95 active:translate-y-[2px] cursor-pointer"
              style={{
                background: '#321e0f',
                border: '2px solid #a87f2a',
                borderBottom: '6px solid #1a0f07',
                color: '#fcd34d',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              }}
            >
              <i className="ri-restart-line text-lg" />
              Reiniciar misión
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleCheck}
                disabled={selectedOption === null}
                className="grow flex items-center justify-center gap-2 rounded-3xl py-4 font-black text-lg uppercase tracking-wide transition-all duration-100 disabled:opacity-30 disabled:pointer-events-none hover:scale-[1.02] active:scale-95 active:translate-y-[2px] cursor-pointer"
                style={{
                  background: selectedOption !== null ? '#321e0f' : 'rgba(50,30,15,0.07)',
                  border: `2px solid ${selectedOption !== null ? '#a87f2a' : 'rgba(168,127,42,0.15)'}`,
                  borderBottom: selectedOption !== null ? '6px solid #1a0f07' : '2px solid rgba(168,127,42,0.15)',
                  color: selectedOption !== null ? '#fcd34d' : '#a87f2a',
                  boxShadow: selectedOption !== null ? '0 6px 20px rgba(50,30,15,0.4)' : 'none',
                }}
              >
                {questionIdx + 1 >= totalQuestions ? '¡Completar!' : 'Siguiente'}
                {questionIdx + 1 < totalQuestions && <i className="ri-arrow-right-line text-xl" />}
              </button>

              <button
                onClick={() => setSelectedOption(question.correctIndex)}
                className="shrink-0 flex items-center justify-center rounded-full w-20 h-20 transition-all duration-100 hover:scale-105 active:scale-90 cursor-pointer"
                style={{
                  background: 'rgba(168,127,42,0.12)',
                  border: '1.5px solid rgba(168,127,42,0.25)',
                  borderBottom: '4px solid rgba(168,127,42,0.4)',
                  color: '#6b4a20',
                }}
              >
                <i className="ri-play-fill text-xl" />
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM STRIPE */}
        <div
          className="h-1.5 shrink-0"
          style={{ background: 'linear-gradient(90deg,transparent,#fcd34d,#a87f2a,#fcd34d,transparent)' }}
        />
      </div>
    </div>
  )
}
