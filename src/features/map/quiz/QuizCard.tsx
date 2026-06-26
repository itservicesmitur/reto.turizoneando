import { useTranslation } from 'react-i18next'
import { useQuizFlow } from './useQuizFlow'
import PirateTimer from './PirateTimer'
import type { QuizQuestion } from '../types/quiz.types'

interface Props {
  stopId: string
  seasonId: string
  questions: QuizQuestion[]
  onComplete: (earnedPoints: number, correctCount: number) => void
  onClose: () => void
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']

export default function QuizCard({ stopId, seasonId, questions, onComplete, onClose }: Props) {
  const { t } = useTranslation()
  const {
    question, questionIdx, totalQuestions,
    selectedOption, setSelectedOption,
    isWrong, isCorrect, correctAnswerIndex,
    shakeKey, needsSelection, needsShakeKey,
    skipIntro, checking, networkError,
    handleCheck, handleContinueCorrect, handleContinueWrong,
  } = useQuizFlow({ stopId, seasonId, questions, onComplete })

  if (!question) return null

  return (
    <div
      className="fixed inset-0 z-999 flex flex-col animate-card-boing"
      style={{ background: 'linear-gradient(to bottom, #075f6e 0%, #00bbb4 100%)' }}
    >
      {/* Columna centrada con max-width */}
      <div className="flex-1 min-h-0 w-full max-w-lg mx-auto flex flex-col">

        {/* ── HEADER ── */}
        <div className="shrink-0 flex items-center justify-between px-5 pt-4 pb-3 min-[430px]:px-8 min-[430px]:pt-6 min-[430px]:pb-4">
          <button
            onClick={onClose}
            className="w-10 h-10 min-[430px]:w-13 min-[430px]:h-13 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            <i className="ri-close-line text-xl min-[430px]:text-2xl text-white" />
          </button>

          <span className="font-black text-sm min-[430px]:text-lg text-white tracking-wide">
            PREGUNTA {questionIdx + 1}
            <span className="font-normal" style={{ color: 'rgba(255,255,255,0.55)' }}> / {totalQuestions}</span>
          </span>

          <div className="flex flex-col items-center">
            <PirateTimer
              questionIdx={questionIdx}
              paused={isWrong || isCorrect || checking}
              onTimeUp={handleContinueWrong}
            />
          </div>
        </div>

        {/* ── CARD BLANCA ── */}
        <div
          className="flex-1 min-h-0 mx-3 min-[430px]:mx-4 rounded-3xl overflow-hidden flex flex-col"
          style={{
            background: '#ffffff',
            boxShadow: '0 16px 48px rgba(0,0,0,0.32)',
            marginBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
          }}
        >

          {/* Pregunta */}
          <div
            className="shrink-0 mx-4 mt-3 min-[430px]:mx-6 min-[430px]:mt-5 rounded-2xl px-5 min-[430px]:px-8 flex flex-col items-center"
            style={{
              background: question.isBonus ? 'rgba(255,148,71,0.10)' : 'rgba(0,187,180,0.1)',
              paddingTop: question.isBonus ? '0.875rem' : '1.25rem',
              paddingBottom: '1.25rem',
            }}
          >
            {question.isBonus && (
              <div
                className="mb-4 px-5 py-1.5 rounded-full flex items-center gap-2"
                style={{ background: '#ff9447', boxShadow: '0 4px 14px rgba(255,148,71,0.45)' }}
              >
                <i className="ri-star-fill text-sm min-[430px]:text-base text-white" />
                <span className="text-xs min-[430px]:text-sm font-black tracking-widest uppercase text-white">BONUS</span>
                <i className="ri-star-fill text-sm min-[430px]:text-base text-white" />
              </div>
            )}
            <p className="text-center font-black text-base min-[430px]:text-lg leading-snug" style={{ color: '#096d7d' }}>
              {question.text}
            </p>
          </div>

          {/* Opciones + feedback */}
          <div
            className="flex-1 min-h-0 overflow-y-auto px-4 min-[430px]:px-6 pt-4 min-[430px]:pt-5 pb-4 flex flex-col gap-2.5 min-[430px]:gap-4"
            style={{ scrollbarWidth: 'none' }}
          >
            <div
              className={`flex flex-col gap-3 min-[430px]:gap-4 ${needsSelection ? 'quiz-option-wrong' : ''}`}
              key={needsShakeKey}
            >
              {question.options.map((option, i) => {
                const isSelected     = selectedOption === i
                const isIncorrect    = isWrong && isSelected
                const isCorrectFlash = isCorrect && isSelected
                const isReveal       = isWrong && correctAnswerIndex === i && !isSelected

                const bg = isIncorrect
                  ? '#fde8eb'
                  : (isCorrectFlash || isReveal)
                    ? '#e6f9f6'
                    : isSelected
                      ? '#e0f7f6'
                      : '#ffffff'

                const borderColor = isIncorrect
                  ? '#e0344b'
                  : (isCorrectFlash || isReveal)
                    ? '#00bbb4'
                    : isSelected
                      ? '#096d7d'
                      : 'rgba(0,187,180,0.2)'

                const textColor = isIncorrect ? '#e0344b' : '#096d7d'

                const badgeBg = isIncorrect
                  ? '#e0344b'
                  : (isCorrectFlash || isReveal)
                    ? '#00bbb4'
                    : isSelected
                      ? '#096d7d'
                      : 'rgba(0,187,180,0.13)'

                const badgeColor = (isSelected || isIncorrect || isCorrectFlash || isReveal)
                  ? '#fff'
                  : '#00bbb4'

                return (
                  <button
                    key={`${questionIdx}-${i}-${shakeKey}`}
                    onClick={() => { if (!isWrong && !isCorrect) setSelectedOption(i) }}
                    className="w-full flex items-center gap-3 min-[430px]:gap-4 px-4 min-[430px]:px-5 py-3 min-[430px]:py-4 rounded-2xl text-left font-bold text-sm min-[430px]:text-base active:scale-[0.98] transition-all duration-150"
                    style={{
                      background: bg,
                      color: textColor,
                      border: `2px solid ${borderColor}`,
                      boxShadow: '0 4px 16px rgba(9,109,125,0.08)',
                      animationDelay: skipIntro ? '0s' : `${i * 0.08}s`,
                    }}
                  >
                    <span
                      className="w-7 h-7 min-[430px]:w-9 min-[430px]:h-9 rounded-full flex items-center justify-center text-xs min-[430px]:text-sm font-black shrink-0 transition-all duration-150"
                      style={{ background: badgeBg, color: badgeColor }}
                    >
                      {OPTION_LABELS[i]}
                    </span>
                    <span className="flex-1 leading-snug">{option}</span>
                    {isIncorrect && <i className="ri-close-circle-fill text-lg min-[430px]:text-xl shrink-0" style={{ color: '#e0344b' }} />}
                    {(isCorrectFlash || isReveal) && <i className="ri-checkbox-circle-fill text-lg min-[430px]:text-xl shrink-0" style={{ color: '#00bbb4' }} />}
                    {isSelected && !isIncorrect && !isCorrectFlash && <i className="ri-checkbox-circle-fill text-lg min-[430px]:text-xl shrink-0" style={{ color: '#096d7d' }} />}
                  </button>
                )
              })}
            </div>

            {isWrong && (
              <div
                className="flex items-center justify-center gap-2 px-4 py-3 min-[430px]:py-4 rounded-2xl animate-fade-in"
                style={{ background: '#fde8eb', border: '1px solid rgba(224,52,75,0.3)' }}
              >
                <i className="ri-close-circle-fill min-[430px]:text-lg" style={{ color: '#e0344b' }} />
                <p className="text-sm min-[430px]:text-base font-bold" style={{ color: '#e0344b' }}>{t('map.wrong_answer')}</p>
              </div>
            )}
            {isCorrect && (
              <div
                className="flex items-center justify-center gap-2 px-4 py-3 min-[430px]:py-4 rounded-2xl animate-fade-in"
                style={{ background: '#e6f9f6', border: '1px solid rgba(0,187,180,0.35)' }}
              >
                <i className="ri-checkbox-circle-fill min-[430px]:text-lg" style={{ color: '#00bbb4' }} />
                <p className="text-sm min-[430px]:text-base font-bold" style={{ color: '#096d7d' }}>{t('map.correct_answer')}</p>
              </div>
            )}
            {needsSelection && !isWrong && (
              <div
                className="flex items-center justify-center gap-2 px-4 py-3 min-[430px]:py-4 rounded-2xl animate-fade-in"
                style={{ background: 'rgba(255,148,71,0.1)', border: '1px solid rgba(255,148,71,0.4)' }}
              >
                <i className="ri-alert-fill min-[430px]:text-lg" style={{ color: '#ff9447' }} />
                <p className="text-sm min-[430px]:text-base font-bold" style={{ color: '#ff9447' }}>{t('map.pick_option')}</p>
              </div>
            )}
            {networkError && (
              <div
                className="flex items-center justify-center gap-2 px-4 py-3 min-[430px]:py-4 rounded-2xl animate-fade-in"
                style={{ background: 'rgba(224,52,75,0.08)', border: '1px solid rgba(224,52,75,0.35)' }}
              >
                <i className="ri-wifi-off-line min-[430px]:text-lg" style={{ color: '#e0344b' }} />
                <p className="text-sm min-[430px]:text-base font-bold" style={{ color: '#e0344b' }}>{t('map.network_error_retry')}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="shrink-0 px-4 min-[430px]:px-6 pb-4 min-[430px]:pb-6 pt-2 min-[430px]:pt-4 flex gap-2.5 min-[430px]:gap-3"
            style={{ borderTop: '1px solid rgba(9,109,125,0.08)' }}
          >
            <button
              onClick={onClose}
              className="w-20 min-[430px]:w-24 h-11 min-[430px]:h-12 rounded-2xl text-sm min-[430px]:text-base font-black active:translate-y-[4px] transition-all"
              style={{
                background: 'linear-gradient(180deg,#f2ead6 0%,#e5dcc6 100%)',
                color: '#8b6f47',
                border: '2px solid #c9bc9e',
                boxShadow: 'inset 0 2px 0 rgba(255,255,255,.7), 0 6px 0 #b8a87e, 0 10px 18px rgba(0,0,0,.10)',
              }}
            >
              {t('map.exit')}
            </button>

            {(() => {
              const handleAction = isWrong ? handleContinueWrong : isCorrect ? handleContinueCorrect : handleCheck
              const label = checking
                ? <i className="ri-loader-4-line animate-spin text-xl" />
                : networkError
                  ? t('map.retry')
                  : (questionIdx + 1 >= totalQuestions ? t('map.complete') : isWrong || isCorrect ? t('map.continue') : t('map.next'))
              return (
                <button
                  onClick={handleAction}
                  disabled={checking}
                  className={`flex-1 h-11 min-[430px]:h-12 rounded-2xl text-sm min-[430px]:text-base font-black text-white flex items-center justify-center active:translate-y-[4px] transition-all ${checking ? 'opacity-60' : ''}`}
                  style={{
                    background: 'linear-gradient(180deg,#18d5cd 0%,#00bbb4 45%,#096d7d 100%)',
                    border: '2px solid #0c7f89',
                    boxShadow: 'inset 0 2px 0 rgba(255,255,255,.35), 0 6px 0 #054f5c, 0 12px 22px rgba(9,109,125,.25)',
                  }}
                >
                  {label}
                </button>
              )
            })()}
          </div>

        </div>

      </div>{/* fin columna centrada */}
    </div>
  )
}
