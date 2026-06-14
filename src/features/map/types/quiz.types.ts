export interface QuizQuestion {
  text: string
  options: [string, string, string, string]
  correctIndex: number
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
