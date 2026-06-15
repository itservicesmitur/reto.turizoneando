export interface QuizQuestion {
  id?: string
  text: string
  options: [string, string, string, string]
  isBonus?: boolean
  pointsAwarded?: number
  correctIndex?: number
}

export interface StopPrize {
  name: string
  description: string
  icon: string
  code: string
  validUntil: string
}

export interface StopQuizData {
  questions: [QuizQuestion, QuizQuestion]
  prize: StopPrize
  narration: string
  audioUrl?: string
}
