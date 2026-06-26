import { useState, useEffect, useRef } from 'react'
import type { QuizQuestion } from '../types/quiz.types'
import { getCorrectAnswer, registerAttempt } from '../services/quizApi'

type QuizSave = { questionIdx: number; wrongAnswer: number | null }

interface ShuffledQuestion {
  shuffled: [string, string, string, string]
  originalIndices: number[] // originalIndices[shuffledPos] = originalPos
}

function shuffleOptions(options: [string, string, string, string]): ShuffledQuestion {
  const indices = [0, 1, 2, 3]
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return {
    shuffled: indices.map(i => options[i]) as [string, string, string, string],
    originalIndices: indices,
  }
}

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

  // Shuffle computed once per mount (per stop visit). New shuffle each time the player enters.
  const shuffleRef = useRef<ShuffledQuestion[] | null>(null)
  if (shuffleRef.current === null) {
    shuffleRef.current = questions.map(q => shuffleOptions(q.options))
  }

  const [questionIdx,    setQuestionIdx]    = useState(() => {
    const saved = loadProgress(stopId)?.questionIdx ?? 0
    return Math.min(saved, Math.max(0, questions.length - 1))
  })
  // Always start with no pre-selected option — the shuffle changes each visit so restoring the
  // saved index would highlight the wrong option.
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isWrong,             setIsWrong]             = useState(false)
  const [correctAnswerIndex,  setCorrectAnswerIndex]  = useState<number | null>(null)
  const [isCorrect,           setIsCorrect]           = useState(false)
  const [shakeKey,            setShakeKey]            = useState(0)
  const [needsSelection, setNeedsSelection] = useState(false)
  const [needsShakeKey,  setNeedsShakeKey]  = useState(0)
  const [hasAnimated,    setHasAnimated]    = useState(false)
  const [checking,       setChecking]       = useState(false)
  const [networkError,   setNetworkError]   = useState(false)
  const questionStartRef  = useRef(Date.now())
  const earnedPointsRef   = useRef(0)
  const wrongCountRef     = useRef(0)
  const autoTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setHasAnimated(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    return () => { if (autoTimerRef.current) clearTimeout(autoTimerRef.current) }
  }, [])

  useEffect(() => {
    questionStartRef.current = Date.now()
  }, [questionIdx])

  const rawQuestion = questions[questionIdx]
  // Present the question with shuffled options so the displayed order changes each visit
  const question = {
    ...rawQuestion,
    options: shuffleRef.current![questionIdx].shuffled,
  }
  const skipIntro = questionIdx > 0 || hasAnimated

  const handleCheck = async () => {
    if (selectedOption === null) {
      setNeedsSelection(true)
      setNeedsShakeKey(k => k + 1)
      return
    }
    setNeedsSelection(false)
    setNetworkError(false)
    setChecking(true)

    // Map the shuffled position back to the original index before hitting the server
    const originalIndex = shuffleRef.current![questionIdx].originalIndices[selectedOption]

    try {
      const timeMs = Date.now() - questionStartRef.current
      const { correct } = await getCorrectAnswer(rawQuestion.id || '', originalIndex)
      const attemptPayload = { questionId: rawQuestion.id || '', selectedIndex: originalIndex, timeMs, seasonId, stopId }
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
        autoTimerRef.current = setTimeout(handleContinueCorrect, 1000)
      } else {
        saveProgress(stopId, questionIdx, null)
        setIsWrong(true)
        setShakeKey(k => k + 1)
        autoTimerRef.current = setTimeout(handleContinueWrong, 1500)
      }
    } catch {
      setNetworkError(true)
    } finally {
      setChecking(false)
    }
  }

  const handleContinueCorrect = () => {
    if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null }
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
    if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null }
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
    networkError,
    handleCheck,
    handleContinueCorrect,
    handleContinueWrong,
  }
}
