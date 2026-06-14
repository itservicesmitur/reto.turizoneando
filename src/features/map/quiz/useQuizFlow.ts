import { useState, useEffect } from 'react'
import type { QuizQuestion } from '../types/quiz.types'

type QuizSave = { questionIdx: number; wrongAnswer: number | null }

function loadProgress(stopId: string): QuizSave | null {
  try {
    const raw = localStorage.getItem(`quiz_progress_${stopId}`)
    return raw ? (JSON.parse(raw) as QuizSave) : null
  } catch { return null }
}

function saveProgress(stopId: string, questionIdx: number, wrongAnswer: number | null) {
  localStorage.setItem(`quiz_progress_${stopId}`, JSON.stringify({ questionIdx, wrongAnswer }))
}

function clearProgress(stopId: string) {
  localStorage.removeItem(`quiz_progress_${stopId}`)
}

interface Options {
  stopId: string
  questions: QuizQuestion[]
  onComplete: () => void
}

export function useQuizFlow({ stopId, questions, onComplete }: Options) {
  const totalQuestions = questions.length

  const [questionIdx,    setQuestionIdx]    = useState(() => loadProgress(stopId)?.questionIdx ?? 0)
  const [selectedOption, setSelectedOption] = useState<number | null>(() => loadProgress(stopId)?.wrongAnswer ?? null)
  const [isWrong,        setIsWrong]        = useState(() => (loadProgress(stopId)?.wrongAnswer ?? null) !== null)
  const [shakeKey,       setShakeKey]       = useState(0)
  const [needsSelection, setNeedsSelection] = useState(false)
  const [needsShakeKey,  setNeedsShakeKey]  = useState(0)
  const [hasAnimated,    setHasAnimated]    = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setHasAnimated(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  const question  = questions[questionIdx]
  const skipIntro = questionIdx > 0 || hasAnimated

  const handleCheck = () => {
    if (selectedOption === null) {
      setNeedsSelection(true)
      setNeedsShakeKey(k => k + 1)
      return
    }
    setNeedsSelection(false)

    if (selectedOption === question.correctIndex) {
      if (questionIdx + 1 >= totalQuestions) {
        clearProgress(stopId)
        onComplete()
      } else {
        const next = questionIdx + 1
        saveProgress(stopId, next, null)
        setQuestionIdx(next)
        setSelectedOption(null)
        setIsWrong(false)
      }
    } else {
      saveProgress(stopId, questionIdx, selectedOption)
      setIsWrong(true)
      setShakeKey(k => k + 1)
    }
  }

  const handleContinueWrong = () => {
    if (questionIdx + 1 >= totalQuestions) {
      clearProgress(stopId)
      onComplete()
    } else {
      const next = questionIdx + 1
      saveProgress(stopId, next, null)
      setQuestionIdx(next)
      setSelectedOption(null)
      setIsWrong(false)
    }
  }

  return {
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
  }
}
