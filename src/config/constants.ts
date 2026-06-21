export const STAGES = {
  1: { stopCount: 6, questionCount: 6 },
  2: { stopCount: 6, questionCount: 6 },
  3: { stopCount: 7, questionCount: 7 },
} as const

export const TOTAL_STOPS = 19

export const VALIDATION_RADIUS_DEFAULT_M = 12   // meters — geo-fence radius to start a challenge
export const NARRATION_SKIP_DELAY_MS     = 5000 // ms before skip button appears
export const ANSWER_REVEAL_DURATION_MS   = 3000 // ms to show result before advancing
export const QR_VALIDATION_TIMEOUT_MS    = 10000 // ms before showing timeout error
