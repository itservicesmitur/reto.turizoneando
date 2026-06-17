import { httpsCallable } from 'firebase/functions'
import { functions } from '../../../config/firebase'
import type { ClaimedPrize } from '../types/quiz.types'

interface ClaimInput {
  prizeId?: string
  seasonId?: string
  stageId?: string
}

interface ClaimRawResult {
  success: boolean
  code: string
  prizeId?: string
  prizeName?: string
  prizeImageUrl?: string
  prizeCategory?: string
}

export interface PrizeInfo {
  id: string
  name: string
  description: string
  imageUrl: string
  categoria: string
}

export async function getPrizes(): Promise<PrizeInfo[]> {
  const fn = httpsCallable<unknown, { prizes: PrizeInfo[] }>(functions, 'getPrizes')
  const res = await fn()
  return res.data.prizes
}

export async function getPrizesForStage(params: { seasonId?: string; stageId?: string }): Promise<PrizeInfo[]> {
  const fn = httpsCallable<{ seasonId?: string; stageId?: string }, { prizes: PrizeInfo[] }>(functions, 'getPrizesForStage')
  const res = await fn(params)
  return res.data.prizes
}

export async function getPrizeById(prizeId: string): Promise<PrizeInfo> {
  const fn = httpsCallable<{ prizeId: string }, PrizeInfo>(functions, 'getPrizeById')
  const res = await fn({ prizeId })
  return res.data
}

export async function claimPrize(params: ClaimInput): Promise<{ success: boolean; code: string }> {
  const fn = httpsCallable<ClaimInput, { success: boolean; code: string }>(functions, 'claimPrize')
  const res = await fn(params)
  return res.data
}

export async function sendPlayerPrizeCodes(email: string): Promise<ClaimedPrize[]> {
  const fn = httpsCallable<{ email: string }, { codes: ClaimedPrize[] }>(functions, 'sendPlayerPrizeCodes')
  const res = await fn({ email })
  return res.data.codes
}

export async function claimPrizeAndNotify(params: ClaimInput): Promise<ClaimedPrize> {
  const fn = httpsCallable<ClaimInput, ClaimRawResult>(functions, 'claimPrizeAndNotify')
  const res = await fn(params)
  const d = res.data
  return {
    code:          d.code,
    prizeId:       d.prizeId       ?? '',
    prizeName:     d.prizeName     ?? '',
    prizeImageUrl: d.prizeImageUrl ?? '',
    prizeCategory: d.prizeCategory ?? '',
    description:   '',
  }
}
