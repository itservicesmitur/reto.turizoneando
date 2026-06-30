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

export interface ClaimedPrize {
  code: string
  prizeId: string
  prizeName: string
  prizeImageUrl: string
  prizeCategory: string
  description: string
  localName?: string
  localAddress?: string
  localPhone?: string
  expiresAt?: string
}

