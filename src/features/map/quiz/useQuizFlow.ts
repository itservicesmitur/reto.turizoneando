import { useState, useEffect } from 'react'
import { STOP_QUIZ_DATA } from '../data/quizData'

/** Gestiona el flujo de preguntas, validación de respuestas y persistencia del progreso por parada. */

// ── Persistencia en localStorage ──────────────────────────────────────────────

type QuizSave = { questionIdx: number; wrongAnswer: number | null }

function loadProgress(stopIndex: number): QuizSave | null {
  try {
    const raw = localStorage.getItem(`quiz_progress_${stopIndex}`)
    return raw ? (JSON.parse(raw) as QuizSave) : null
  } catch { return null }
}

function saveProgress(stopIndex: number, questionIdx: number, wrongAnswer: number | null) {
  localStorage.setItem(`quiz_progress_${stopIndex}`, JSON.stringify({ questionIdx, wrongAnswer }))
}

function clearProgress(stopIndex: number) {
  localStorage.removeItem(`quiz_progress_${stopIndex}`)
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface Options {
  stopIndex: number
  onComplete: () => void
}

export function useQuizFlow({ stopIndex, onComplete }: Options) {
  const data           = STOP_QUIZ_DATA[stopIndex]
  const totalQuestions = data.questions.length

  // Inicializar desde localStorage para reanudar si el usuario cerró el quiz a medias.
  const [questionIdx,    setQuestionIdx]    = useState(() => loadProgress(stopIndex)?.questionIdx ?? 0)
  const [selectedOption, setSelectedOption] = useState<number | null>(() => loadProgress(stopIndex)?.wrongAnswer ?? null)
  const [isWrong,        setIsWrong]        = useState(() => (loadProgress(stopIndex)?.wrongAnswer ?? null) !== null)
  const [shakeKey,       setShakeKey]       = useState(0)
  const [needsSelection, setNeedsSelection] = useState(false)
  const [needsShakeKey,  setNeedsShakeKey]  = useState(0)
  const [hasAnimated,    setHasAnimated]    = useState(false)

  // Tras la animación de entrada (1.5 s), las preguntas siguientes no repiten el unfurl.
  useEffect(() => {
    const timer = setTimeout(() => setHasAnimated(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  const question  = data.questions[questionIdx]
  // Omitir la animación de pergamino si ya pasó la primera pregunta o terminó la intro.
  const skipIntro = questionIdx > 0 || hasAnimated

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCheck = () => {
    if (selectedOption === null) {
      // Sacudir las opciones para indicar que hay que seleccionar una.
      setNeedsSelection(true)
      setNeedsShakeKey(k => k + 1)
      return
    }
    setNeedsSelection(false)

    if (selectedOption === question.correctIndex) {
      if (questionIdx + 1 >= totalQuestions) {
        clearProgress(stopIndex)
        onComplete()
      } else {
        const next = questionIdx + 1
        saveProgress(stopIndex, next, null)
        setQuestionIdx(next)
        setSelectedOption(null)
        setIsWrong(false)
      }
    } else {
      // Respuesta incorrecta: guardar para mostrar el estado de error al reanudar.
      saveProgress(stopIndex, questionIdx, selectedOption)
      setIsWrong(true)
      setShakeKey(k => k + 1)
    }
  }

  const handleContinueWrong = () => {
    if (questionIdx + 1 >= totalQuestions) {
      clearProgress(stopIndex)
      onComplete()
    } else {
      const next = questionIdx + 1
      saveProgress(stopIndex, next, null)
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
