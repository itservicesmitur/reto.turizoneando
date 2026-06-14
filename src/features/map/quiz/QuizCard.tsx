import { useTranslation } from 'react-i18next'
import { useQuizFlow } from './useQuizFlow'
import GameButton from './GameButton'
import type { QuizQuestion } from '../types/quiz.types'

interface Props {
  stopId: string
  questions: QuizQuestion[]
  onComplete: () => void
  onClose: () => void
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']

export default function QuizCard({ stopId, questions, onComplete, onClose }: Props) {
  const { t } = useTranslation()
  const {
    question,
    questionIdx,
    totalQuestions,
    selectedOption,
    setSelectedOption,
    isWrong,
    shakeKey,
    needsSelection,
    needsShakeKey,
    skipIntro,
    handleCheck,
    handleContinueWrong,
  } = useQuizFlow({ stopId, questions, onComplete })

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/50 backdrop-blur-xs p-0">
      <div
        className="relative w-full h-full flex flex-col overflow-hidden quiz-card-enter rounded-none"
        style={{
          backgroundImage: "linear-gradient(rgba(235,220,195,0.58), rgba(235,220,195,0.58)), url('/assets/img/fonto_textura.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '8px solid var(--color-map-wood-dark)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.5), inset 0 0 0 2px var(--color-map-gold), inset 0 0 16px rgba(0,0,0,0.5)'
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

        {/* TOP FADE OVERLAY */}
        <div
          className="absolute top-0 inset-x-0 h-10 pointer-events-none z-40"
          style={{ background: 'linear-gradient(to bottom, var(--color-map-wood-dark) 0%, rgba(50,30,15,0.7) 20%, rgba(50,30,15,0) 100%)' }}
        />

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-4 flex flex-col gap-4 relative">

          <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
            <defs>
              <filter id="torn-paper">
                <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
          </svg>

          {/* Question card */}
          <div className={`relative px-6 pb-6 pt-25 mt-4 transition-all duration-300 ${skipIntro ? '' : 'parchment-unfurl'}`}>
            <div
              className="absolute inset-x-0 bottom-0 z-0"
              style={{
                top: '-16px',
                background: 'linear-gradient(to bottom, rgba(250,246,235,0) 0%, rgba(250,246,235,0) 16px, rgba(250,246,235,0.7) 28px, var(--color-map-cream-light) 44px)',
                boxShadow: '0 8px 24px rgba(80, 48, 25, 0.12), inset 0 0 20px rgba(168, 127, 42, 0.05)',
                filter: 'url(#torn-paper)',
                clipPath: 'polygon(0% 16px, 100% 16px, 100% 110%, 0% 110%)'
              }}
            />

            {/* Parchment scroll cylinder */}
            <div
              className="absolute -top-3.5 left-1 right-1 h-[26px] z-20"
              style={{
                background: 'linear-gradient(to bottom, #54361e 0%, #a87e58 15%, var(--color-map-cream) 45%, var(--color-map-cream-light) 55%, var(--color-map-cream) 70%, #a87e58 85%, #54361e 100%)',
                border: '1.5px solid var(--color-map-wood-mid)',
                borderLeft: 'none',
                borderRight: 'none',
                borderRadius: '3px',
                boxShadow: '0 4px 10px rgba(50,30,15,0.35)',
              }}
            />
            <div
              className="absolute -left-2 -top-2.5 w-3.5 h-[22px] rounded-l-md z-30"
              style={{
                background: 'linear-gradient(to bottom, var(--color-map-wood-dark) 0%, #5c3b21 50%, var(--color-map-wood-deep) 100%)',
                border: '1.5px solid var(--color-map-wood-mid)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            />
            <div
              className="absolute -right-2 -top-2.5 w-3.5 h-[22px] rounded-r-md z-30"
              style={{
                background: 'linear-gradient(to bottom, var(--color-map-wood-dark) 0%, #5c3b21 50%, var(--color-map-wood-deep) 100%)',
                border: '1.5px solid var(--color-map-wood-mid)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            />

            <div className="relative z-10 pb-20">
              <svg className="absolute bottom-1 left-1 w-9 h-9 pointer-events-none text-map-gold opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 14v8h8M4 18v-2h2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <svg className="absolute bottom-1 right-1 w-9 h-9 pointer-events-none text-map-gold opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 14v8h-8M20 18v-2h-2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>

              <p className="text-center font-bold text-[11px] tracking-[0.18em] uppercase mb-4" style={{ color: 'var(--color-map-gold)', fontFamily: 'var(--font-map-parchment)' }}>
                {t('map.question_of', { current: questionIdx + 1, total: totalQuestions })}
              </p>

              <p
                className="text-center font-bold leading-relaxed mt-1"
                style={{ color: 'var(--color-map-wood-dark)', fontFamily: 'var(--font-map-parchment)', fontSize: '18px' }}
              >
                ¿{question.text.replace(/^[¿?"'"]+|[?"'"]+$/g, '')}?
              </p>

              {/* Options */}
              <div className={`flex flex-col gap-6 mt-15 ${needsSelection ? 'quiz-option-wrong' : ''}`} key={needsShakeKey}>
                {question.options.map((option, i) => {
                  const isSelected  = selectedOption === i
                  const isIncorrect = isWrong && isSelected
                  return (
                    <button
                      key={`${questionIdx}-${i}-${shakeKey}`}
                      onClick={() => { if (!isWrong) { setSelectedOption(i); } }}
                      className={`game-option-btn option-slide-in ${isSelected ? 'option-selected' : ''} ${isIncorrect ? 'option-incorrect' : ''}`}
                      style={{ animationDelay: skipIntro ? '0s' : `${1.1 + i * 0.12}s` }}
                    >
                      <div className="option-letter-badge">{OPTION_LABELS[i]}</div>
                      <span className="flex-1 text-[15px] font-bold text-map-wood-dark text-left">{option}</span>
                      {isSelected && !isIncorrect && (
                        <div className="option-checkbox-circle bg-map-wood-dark text-map-gold-light">
                          <i className="ri-check-line text-xs font-bold" />
                        </div>
                      )}
                      {isIncorrect && (
                        <div className="option-checkbox-circle bg-map-wood-deep text-map-cream">
                          <i className="ri-close-line text-xs font-bold" />
                        </div>
                      )}
                      {!isSelected && !isIncorrect && (
                        <div className="option-checkbox-circle" />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Wrong feedback */}
              {isWrong && (
                <div
                  className="flex items-center justify-center gap-3 px-4 py-3.5 mt-10 animate-fade-in text-center"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(50,30,15,0.1) 15%, rgba(50,30,15,0.1) 85%, transparent)',
                    borderTop: '1px solid rgba(50,30,15,0.35)',
                    borderBottom: '1px solid rgba(50,30,15,0.35)',
                  }}
                >
                  <i className="ri-close-large-line text-map-wood-dark text-base font-black shrink-0" />
                  <p className="text-sm font-bold leading-snug" style={{ color: 'var(--color-map-wood-dark)', fontFamily: 'var(--font-map-parchment)', letterSpacing: '0.05em' }}>
                    {t('map.wrong_answer')}
                  </p>
                </div>
              )}

              {/* Needs selection feedback */}
              {needsSelection && !isWrong && (
                <div
                  className="flex items-center justify-center gap-3 px-4 py-3.5 mt-10 animate-fade-in text-center"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(168,127,42,0.12) 15%, rgba(168,127,42,0.12) 85%, transparent)',
                    borderTop: '1px solid rgba(168,127,42,0.4)',
                    borderBottom: '1px solid rgba(168,127,42,0.4)',
                  }}
                >
                  <i className="ri-alert-line text-map-gold text-base shrink-0 animate-pulse" />
                  <p className="text-sm font-bold leading-snug" style={{ color: 'var(--color-map-gold)', fontFamily: 'var(--font-map-parchment)', letterSpacing: '0.05em' }}>
                    {t('map.pick_option')}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="h-1 shrink-0" />
        </div>

        {/* FOOTER */}
        <div
          className="shrink-0 p-4 flex gap-3"
          style={{ background: 'transparent', borderTop: '1px solid rgba(168,127,42,0.22)' }}
        >
          {isWrong ? (
            <>
              <GameButton variant="tan" className="w-28 h-16 text-xs" onClick={onClose}>
                {t('map.exit')}
              </GameButton>
              <GameButton variant="dark" className="flex-1 h-16 text-base" onClick={handleContinueWrong}>
                {questionIdx + 1 >= totalQuestions ? t('map.complete') : t('map.continue')}
              </GameButton>
            </>
          ) : (
            <>
              <GameButton variant="tan" className="w-28 h-16 text-xs" onClick={onClose}>
                {t('map.exit')}
              </GameButton>
              <GameButton variant="dark" className="flex-1 h-16 text-base" onClick={handleCheck}>
                {questionIdx + 1 >= totalQuestions ? t('map.complete') : t('map.next')}
              </GameButton>
            </>
          )}
        </div>

        {/* BOTTOM STRIPE */}
        <div
          className="h-1.5 shrink-0"
          style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold-light),var(--color-map-gold),var(--color-map-gold-light),transparent)' }}
        />
      </div>
    </div>
  )
}
