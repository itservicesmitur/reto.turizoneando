import { useState, useEffect, useRef } from 'react'
import type { QuizQuestion } from '../types/quiz.types'
import { getCorrectAnswer, registerAttempt } from '../services/quizApi'

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
  seasonId: string
  questions: QuizQuestion[]
  onComplete: (earnedPoints: number, correctCount: number) => void
}

export function useQuizFlow({ stopId, seasonId, questions, onComplete }: Options) {
  const totalQuestions = questions.length

  const [questionIdx,    setQuestionIdx]    = useState(() => {
    const saved = loadProgress(stopId)?.questionIdx ?? 0
    return Math.min(saved, Math.max(0, questions.length - 1))
  })
  const [selectedOption, setSelectedOption] = useState<number | null>(() => loadProgress(stopId)?.wrongAnswer ?? null)
  const [isWrong,             setIsWrong]             = useState(() => (loadProgress(stopId)?.wrongAnswer ?? null) !== null)
  const [correctAnswerIndex,  setCorrectAnswerIndex]  = useState<number | null>(null)
  const [isCorrect,           setIsCorrect]           = useState(false)
  const [shakeKey,            setShakeKey]            = useState(0)
  const [needsSelection, setNeedsSelection] = useState(false)
  const [needsShakeKey,  setNeedsShakeKey]  = useState(0)
  const [hasAnimated,    setHasAnimated]    = useState(false)
  const [checking,       setChecking]       = useState(false)
  const questionStartRef  = useRef(Date.now())
  const earnedPointsRef   = useRef(0)
  const wrongCountRef     = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => setHasAnimated(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    questionStartRef.current = Date.now()
  }, [questionIdx])

  const question  = questions[questionIdx]
  const skipIntro = questionIdx > 0 || hasAnimated

  const handleCheck = async () => {
    if (selectedOption === null) {
      setNeedsSelection(true)
      setNeedsShakeKey(k => k + 1)
      return
    }
    setNeedsSelection(false)
    setChecking(true)

    try {
      const timeMs = Date.now() - questionStartRef.current
      const { correct } = await getCorrectAnswer(question.id || '', selectedOption)
      const attemptPayload = { questionId: question.id || '', selectedIndex: selectedOption, timeMs, seasonId, stopId }
      const isLastCorrect  = correct && questionIdx + 1 >= totalQuestions

      console.log('[Turizoneando] → registerAttempt payload:', JSON.stringify(attemptPayload, null, 2))

      if (isLastCorrect) {
        // Await para capturar pointsAwarded de la última pregunta antes de cerrar el quiz
        try {
          const data = await registerAttempt(attemptPayload)
          const res = data as { pointsAwarded?: number } | null
          earnedPointsRef.current += (res?.pointsAwarded ?? 0)
          console.log('[Turizoneando] ✅ Intento registrado | CF:', data)
        } catch {}
      } else {
        registerAttempt(attemptPayload)
          .then(data => {
            const res = data as { pointsAwarded?: number } | null
            earnedPointsRef.current += (res?.pointsAwarded ?? 0)
            console.log('[Turizoneando] ✅ Intento registrado | CF:', data)
          })
          .catch(() => {})
      }

      if (correct) {
        setIsCorrect(true)
      } else {
        saveProgress(stopId, questionIdx, selectedOption)

        setIsWrong(true)
        setShakeKey(k => k + 1)
      }
    } catch {
      saveProgress(stopId, questionIdx, selectedOption)
      setCorrectAnswerIndex(null)
      setIsCorrect(false)
      setIsWrong(true)
      setShakeKey(k => k + 1)
    } finally {
      setChecking(false)
    }
  }

  const handleContinueCorrect = () => {
    setIsCorrect(false)
    setCorrectAnswerIndex(null)
    if (questionIdx + 1 >= totalQuestions) {
      clearProgress(stopId)
      onComplete(earnedPointsRef.current, totalQuestions - wrongCountRef.current)
    } else {
      const next = questionIdx + 1
      saveProgress(stopId, next, null)
      setQuestionIdx(next)
      setSelectedOption(null)
      setIsWrong(false)
    }
  }

  const handleContinueWrong = () => {
    wrongCountRef.current += 1
    setCorrectAnswerIndex(null)
    if (questionIdx + 1 >= totalQuestions) {
      clearProgress(stopId)
      onComplete(earnedPointsRef.current, totalQuestions - wrongCountRef.current)
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
    isCorrect,
    correctAnswerIndex,
    shakeKey,
    needsSelection,
    needsShakeKey,
    skipIntro,
    checking,
    handleCheck,
    handleContinueCorrect,
    handleContinueWrong,
  }
}
