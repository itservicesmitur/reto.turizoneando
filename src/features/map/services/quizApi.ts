import { httpsCallable } from 'firebase/functions'
import { functions } from '../../../config/firebase'

export async function getCorrectAnswer(
  questionId: string,
  selectedIndex: number
): Promise<{ correct: boolean }> {
  const fn = httpsCallable<
    { questionId: string; selectedIndex: number },
    { correct: boolean }
  >(functions, 'getCorrectAnswer')
  const res = await fn({ questionId, selectedIndex })
  return res.data
}

export async function registerAttempt(params: {
  questionId: string
  selectedIndex: number
  timeMs: number
  seasonId: string
  stopId: string
}): Promise<unknown> {
  const fn = httpsCallable<typeof params, unknown>(functions, 'registerAttempt')
  const res = await fn(params)
  return res.data
}
