import { httpsCallable } from 'firebase/functions'
import { doc, getDoc, updateDoc, collection, getDocs, addDoc, deleteDoc, writeBatch, query, where } from 'firebase/firestore'
import { functions, db } from '../config/firebase'


export interface PlayerData {
  uid: string
  displayName: string
  firstName: string
  lastName: string
  email: string
  gender: string
  nationality: string
  ageRange: string
  preferredLang: string
  score: number
  mapProgress: Record<string, 'locked' | 'active' | 'completed'>
  currentNodeId: string | null
  createdAt: string | null
  banned?: boolean
  active?: boolean
}

export async function fetchPlayers(): Promise<PlayerData[]> {
  const getPlayersFn = httpsCallable<unknown, { players: PlayerData[] }>(
    functions,
    'getPlayers'
  )
  const response = await getPlayersFn()
  return response.data.players
}

export async function fetchPlayerDetail(uid: string): Promise<PlayerData> {
  const docRef = doc(db, 'players', uid)
  const snap = await getDoc(docRef)
  if (!snap.exists()) {
    throw new Error('El jugador no existe.')
  }
  const data = snap.data()

  // Format Timestamp to ISO String
  let createdAtStr: string | null = null
  if (data.createdAt && typeof data.createdAt.toDate === 'function') {
    createdAtStr = data.createdAt.toDate().toISOString()
  } else if (data.createdAt && typeof data.createdAt.seconds === 'number') {
    createdAtStr = new Date(data.createdAt.seconds * 1000).toISOString()
  }

  return {
    uid: snap.id,
    displayName: data.displayName || '',
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    gender: data.gender || '',
    nationality: data.nationality || '',
    ageRange: data.ageRange || '',
    preferredLang: data.preferredLang || 'es',
    score: typeof data.score === 'number' ? data.score : 0,
    mapProgress: data.mapProgress || {},
    currentNodeId: data.currentNodeId || null,
    banned: data.banned === true,
    active: data.active !== false,
    createdAt: createdAtStr,
  }
}

export async function resetPlayerProgress(uid: string): Promise<{ attemptsDeleted: number }> {
  const fn = httpsCallable<{ playerId: string }, { success: boolean; attemptsDeleted: number }>(
    functions,
    'resetPlayer'
  )
  const response = await fn({ playerId: uid })
  return { attemptsDeleted: response.data.attemptsDeleted }
}

export async function updatePlayerBannedStatus(uid: string, banned: boolean): Promise<void> {
  const docRef = doc(db, 'players', uid)
  await updateDoc(docRef, { banned })
}

export async function updatePlayerActiveStatus(uid: string, active: boolean): Promise<void> {
  const docRef = doc(db, 'players', uid)
  await updateDoc(docRef, { active })
}

export interface AttemptData {
  id: string
  questionId: string
  stopId: string
  seasonId: string
  questionText: string
  questionTextEn: string
  selectedIndex: number
  correct: boolean
  timeMs: number
  pointsAwarded: number
  isBonus: boolean
  attemptNumber: number
  answeredAt: string | null
  clientAnsweredAt: string | null
  stopName: string
  stopNameEn: string
  stageNumber: number | null
}

export interface QuestionAttemptSummary {
  questionId: string
  questionText: string
  questionTextEn: string
  stopId: string
  stopName: string
  stopNameEn: string
  stageNumber: number | null
  isBonus: boolean
  totalAttempts: number
  solved: boolean
  pointsEarned: number
  bestTimeMs: number | null
  attempts: AttemptData[]
}

export async function fetchPlayerAttempts(playerId: string): Promise<QuestionAttemptSummary[]> {
  const getPlayerAttemptsFn = httpsCallable<{ playerId: string }, { attempts: AttemptData[] }>(
    functions,
    'getPlayerAttempts'
  )
  const response = await getPlayerAttemptsFn({ playerId })
  const attempts: AttemptData[] = response.data.attempts

  // Group by questionId preserving first-seen order
  const order: string[] = []
  const groups = new Map<string, AttemptData[]>()
  for (const a of attempts) {
    if (!groups.has(a.questionId)) {
      groups.set(a.questionId, [])
      order.push(a.questionId)
    }
    groups.get(a.questionId)!.push(a)
  }

  return order.map(questionId => {
    const qAttempts = groups.get(questionId)!
    const first = qAttempts[0]
    const solved = qAttempts.some(a => a.correct)
    const pointsEarned = qAttempts.reduce((sum, a) => sum + a.pointsAwarded, 0)
    const correctAttempts = qAttempts.filter(a => a.correct)
    const bestTimeMs = correctAttempts.length > 0
      ? Math.min(...correctAttempts.map(a => a.timeMs))
      : null
    return {
      questionId,
      questionText: first.questionText,
      questionTextEn: first.questionTextEn,
      stopId: first.stopId,
      stopName: first.stopName,
      stopNameEn: first.stopNameEn,
      stageNumber: first.stageNumber,
      isBonus: first.isBonus,
      totalAttempts: qAttempts.length,
      solved,
      pointsEarned,
      bestTimeMs,
      attempts: qAttempts,
    }
  })
}

export interface AdminUserData {
  uid: string
  email: string
  displayName: string
  status: 'active' | 'inactive'
  createdAt: string | null
}

export async function fetchAdmins(): Promise<AdminUserData[]> {
  const getAdminsFn = httpsCallable<unknown, { admins: AdminUserData[] }>(
    functions,
    'getAdmins'
  )
  const response = await getAdminsFn()
  return response.data.admins
}

export async function createAdmin(email: string, password: string, displayName: string): Promise<void> {
  const createAdminFn = httpsCallable<{ email: string; password: string; displayName: string }, unknown>(
    functions,
    'createAdmin'
  )
  await createAdminFn({ email, password, displayName })
}

export async function updateAdmin(uid: string, displayName: string, status: 'active' | 'inactive'): Promise<void> {
  const updateAdminFn = httpsCallable<{ uid: string; displayName: string; status: 'active' | 'inactive' }, unknown>(
    functions,
    'updateAdmin'
  )
  await updateAdminFn({ uid, displayName, status })
}

export async function deleteAdmin(uid: string): Promise<void> {
  const deleteAdminFn = httpsCallable<{ uid: string }, unknown>(
    functions,
    'deleteAdmin'
  )
  await deleteAdminFn({ uid })
}

export interface UpdateSelfAdminInput {
  displayName?: string
  photoURL?: string
  email?: string
  deactivate?: boolean
  deleteAccount?: boolean
}

export async function updateSelfAdminProfile(input: UpdateSelfAdminInput): Promise<{ success: boolean; action: string; emailChanged?: boolean }> {
  const updateSelfAdminFn = httpsCallable<UpdateSelfAdminInput, { success: boolean; action: string; emailChanged?: boolean }>(
    functions,
    'updateSelfAdmin'
  )
  const response = await updateSelfAdminFn(input)
  return response.data
}


export interface StagePrizeConfig {
  prizeId: string
  stock: number
}

export interface StageStopData {
  id: string
  name: string
  nameEn: string
  lat: number
  lng: number
  imageUrl: string
  order: number
  active: boolean
}

export interface StageData {
  id: string
  number: number
  pointsCount: number
  prizeIds: string[]
  prizes: StagePrizeConfig[]
  stops?: StageStopData[]
}

export interface SeasonData {
  id: string
  name: string
  status: 'active' | 'upcoming' | 'archived'
  startDate: string
  endDate: string
  createdAt: string | null
  createdBy?: string
  stages: StageData[]
  prizeStocks?: Record<string, number>
}

export type PrizeCategoria = 'Bares' | 'Hoteles' | 'Restaurantes' | 'Museos' | 'Actividades' | 'Experiencias'

export const PRIZE_CATEGORIAS: PrizeCategoria[] = [
  'Bares', 'Hoteles', 'Restaurantes', 'Museos', 'Actividades', 'Experiencias'
]

export interface PrizeData {
  id: string
  name: string
  description: string
  imageUrl: string
  categoria: PrizeCategoria | ''
  relevance: number
  requiresAdult: boolean
  createdAt: string | null
}

export interface CreateStageInput {
  pointsCount: number
  prizes: StagePrizeConfig[]
}

export interface CreateSeasonInput {
  name: string
  status: 'active' | 'upcoming' | 'archived'
  startDate: string
  endDate: string
  stages: CreateStageInput[]
}

export interface UpdateStageInput {
  id?: string
  pointsCount: number
  prizes: StagePrizeConfig[]
}

export interface UpdateSeasonInput {
  id: string
  name: string
  status: 'active' | 'upcoming' | 'archived'
  startDate: string
  endDate: string
  stages: UpdateStageInput[]
}

export async function fetchSeasons(): Promise<SeasonData[]> {
  const seasonsCol = collection(db, 'seasons')
  const seasonsSnap = await getDocs(seasonsCol)

  const seasons: SeasonData[] = []

  for (const sDoc of seasonsSnap.docs) {
    const sData = sDoc.data()

    // Fetch stages subcollection
    const stagesCol = collection(db, 'seasons', sDoc.id, 'stages')
    const stagesSnap = await getDocs(stagesCol)

    // Fetch stops for this season
    const stopsCol = collection(db, 'stops')
    const stopsQ = query(stopsCol, where('seasonIds', 'array-contains', sDoc.id))
    const stopsSnap = await getDocs(stopsQ)
    const seasonStops = stopsSnap.docs.map(stopDoc => {
      const stopData = stopDoc.data()
      return {
        id: stopDoc.id,
        stageId: stopData.stageId || '',
        name: stopData.name || '',
        nameEn: stopData.nameEn || '',
        lat: typeof stopData.lat === 'number' ? stopData.lat : 0,
        lng: typeof stopData.lng === 'number' ? stopData.lng : 0,
        imageUrl: stopData.imageUrl || '',
        order: typeof stopData.order === 'number' ? stopData.order : 0,
        active: stopData.active === true
      }
    })

    const stages = stagesSnap.docs.map(stageDoc => {
      const stageData = stageDoc.data()
      const stageStops = seasonStops
        .filter(stop => stop.stageId === stageDoc.id)
        .sort((a, b) => a.order - b.order)
        .map(({ id, name, nameEn, lat, lng, imageUrl, order, active }) => ({
          id, name, nameEn, lat, lng, imageUrl, order, active
        }))

      return {
        id: stageDoc.id,
        number: stageData.number || 0,
        prizeIds: Array.isArray(stageData.prizeIds) ? stageData.prizeIds : [],
        prizes: Array.isArray(stageData.prizes) ? stageData.prizes : [],
        pointsCount: typeof stageData.pointsCount === 'number' ? stageData.pointsCount : 0,
        stops: stageStops,
      } as StageData
    })

    // Sort stages by stage number
    stages.sort((a, b) => a.number - b.number)

    // Fetch prizes subcollection for season-specific stock mapping
    const prizesSubCol = collection(db, 'seasons', sDoc.id, 'prizes')
    const prizesSnap = await getDocs(prizesSubCol)
    const prizeStocks: Record<string, number> = {}
    prizesSnap.docs.forEach(pDoc => {
      const pData = pDoc.data()
      prizeStocks[pDoc.id] = typeof pData.stock === 'number' ? pData.stock : 0
    })

    // Parse dates
    let startDateStr = ''
    if (sData.startDate && typeof sData.startDate.toDate === 'function') {
      startDateStr = sData.startDate.toDate().toISOString()
    } else if (sData.startDate && typeof sData.startDate.seconds === 'number') {
      startDateStr = new Date(sData.startDate.seconds * 1000).toISOString()
    } else if (typeof sData.startDate === 'string') {
      startDateStr = sData.startDate
    }

    let endDateStr = ''
    if (sData.endDate && typeof sData.endDate.toDate === 'function') {
      endDateStr = sData.endDate.toDate().toISOString()
    } else if (sData.endDate && typeof sData.endDate.seconds === 'number') {
      endDateStr = new Date(sData.endDate.seconds * 1000).toISOString()
    } else if (typeof sData.endDate === 'string') {
      endDateStr = sData.endDate
    }

    let createdAtStr: string | null = null
    if (sData.createdAt && typeof sData.createdAt.toDate === 'function') {
      createdAtStr = sData.createdAt.toDate().toISOString()
    } else if (sData.createdAt && typeof sData.createdAt.seconds === 'number') {
      createdAtStr = new Date(sData.createdAt.seconds * 1000).toISOString()
    }

    seasons.push({
      id: sDoc.id,
      name: sData.name || '',
      status: sData.status || 'upcoming',
      startDate: startDateStr,
      endDate: endDateStr,
      createdAt: createdAtStr,
      createdBy: sData.createdBy || '',
      stages,
      prizeStocks,
    })
  }

  // Sort by createdAt descending, if available, otherwise name
  seasons.sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      return b.createdAt.localeCompare(a.createdAt)
    }
    return a.name.localeCompare(b.name)
  })

  return seasons
}

export async function fetchPrizesList(): Promise<PrizeData[]> {
  const prizesCol = collection(db, 'prizes')
  const prizesSnap = await getDocs(prizesCol)
  return prizesSnap.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      name: data.name || '',
      description: data.description || '',
      imageUrl: data.imageUrl || '',
      categoria: data.categoria || '',
      relevance: typeof data.relevance === 'number' ? data.relevance : 1,
      requiresAdult: data.requiresAdult === true,
      createdAt: data.createdAt && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate().toISOString()
        : null
    }
  })
}

export async function createPrize(prize: Omit<PrizeData, 'id' | 'createdAt'>): Promise<string> {
  const prizesCol = collection(db, 'prizes')
  const docRef = await addDoc(prizesCol, {
    ...prize,
    createdAt: new Date()
  })
  return docRef.id
}

export async function updatePrize(id: string, prize: Partial<PrizeData>): Promise<void> {
  const prizeRef = doc(db, 'prizes', id)
  await updateDoc(prizeRef, prize)
}

export async function deletePrize(id: string): Promise<void> {
  const prizeRef = doc(db, 'prizes', id)
  await deleteDoc(prizeRef)
}

export async function createSeason(input: CreateSeasonInput): Promise<{ id: string }> {
  const createSeasonFn = httpsCallable<CreateSeasonInput, { id: string }>(
    functions,
    'createSeason'
  )
  const response = await createSeasonFn(input)
  return response.data
}

export async function updateSeason(input: UpdateSeasonInput): Promise<{ success: boolean }> {
  const updateSeasonFn = httpsCallable<UpdateSeasonInput, { success: boolean }>(
    functions,
    'updateSeason'
  )
  const response = await updateSeasonFn(input)
  return response.data
}

export async function deleteSeason(id: string): Promise<{ success: boolean }> {
  const deleteSeasonFn = httpsCallable<{ id: string }, { success: boolean }>(
    functions,
    'deleteSeason'
  )
  const response = await deleteSeasonFn({ id })
  return response.data
}


export interface QuestionData {
  id: string
  stopId: string
  text: string
  textEn: string
  options: string[]
  optionsEn: string[]
  correctIndex: number
  difficulty: 'easy' | 'medium' | 'hard'
  explanation: string
  explanationEn: string
  points: number
  isBonus: boolean
  createdAt?: string | null
}

export interface StopData {
  id: string
  /** @deprecated Use seasonIds (array). Kept for backwards-compat reads from old documents. */
  seasonId?: string
  seasonIds: string[]   // ← relación muchos-a-muchos con /seasons
  stageId: string
  name: string
  nameEn: string
  narration: string
  narrationEn: string
  imageUrl: string
  audioUrl?: string
  audioUrlEn?: string
  lat: number
  lng: number
  order: number
  active: boolean
  createdAt?: string | null
  questions?: QuestionData[]
}

export async function fetchStopsList(): Promise<StopData[]> {
  const stopsCol = collection(db, 'stops')
  const stopsSnap = await getDocs(stopsCol)
  return stopsSnap.docs.map(doc => {
    const data = doc.data()
    // Support legacy docs that still have seasonId (single string)
    const seasonIds: string[] = Array.isArray(data.seasonIds)
      ? data.seasonIds
      : data.seasonId
        ? [data.seasonId]
        : []
    return {
      id: doc.id,
      seasonId: data.seasonId || '',   // kept for backward compat display
      seasonIds,
      stageId: data.stageId || '',
      name: data.name || '',
      nameEn: data.nameEn || '',
      narration: data.narration || '',
      narrationEn: data.narrationEn || '',
      imageUrl: data.imageUrl || '',
      audioUrl: data.audioUrl || '',
      audioUrlEn: data.audioUrlEn || '',
      lat: typeof data.lat === 'number' ? data.lat : 0,
      lng: typeof data.lng === 'number' ? data.lng : 0,
      order: typeof data.order === 'number' ? data.order : 0,
      active: data.active === true,
      createdAt: data.createdAt && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate().toISOString()
        : null
    }
  })
}

export async function fetchQuestionsForStop(stopId: string): Promise<QuestionData[]> {
  const questionsCol = collection(db, 'questions')
  const q = query(questionsCol, where('stopId', '==', stopId))
  const snap = await getDocs(q)
  return snap.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      stopId: data.stopId || '',
      text: data.text || '',
      textEn: data.textEn || '',
      options: Array.isArray(data.options) ? data.options : [],
      optionsEn: Array.isArray(data.optionsEn) ? data.optionsEn : [],
      correctIndex: typeof data.correctIndex === 'number' ? data.correctIndex : 0,
      difficulty: data.difficulty || 'easy',
      explanation: data.explanation || '',
      explanationEn: data.explanationEn || '',
      points: typeof data.points === 'number' ? data.points : 10,
      isBonus: data.isBonus === true,
      createdAt: data.createdAt && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate().toISOString()
        : null
    }
  })
}

export async function getStopWithQuestions(stopId: string): Promise<{ stop: StopData; questions: Omit<QuestionData, 'correctIndex'>[] }> {
  const getStopWithQuestionsFn = httpsCallable<{ stopId: string }, { stop: StopData; questions: Omit<QuestionData, 'correctIndex'>[] }>(
    functions,
    'getStopWithQuestions'
  )
  const response = await getStopWithQuestionsFn({ stopId })
  return response.data
}

export async function createStop(
  stop: Omit<StopData, 'id' | 'createdAt' | 'questions' | 'seasonId'>,
  questions: Omit<QuestionData, 'id' | 'stopId' | 'createdAt'>[]
): Promise<string> {
  const batch = writeBatch(db)

  const stopRef = doc(collection(db, 'stops'))
  // Persist only seasonIds (array); drop legacy seasonId field
  const { seasonId: _ignored, ...stopFields } = stop as any
  batch.set(stopRef, {
    ...stopFields,
    seasonIds: Array.isArray(stop.seasonIds) ? stop.seasonIds : [],
    createdAt: new Date()
  })

  for (const q of questions) {
    const qRef = doc(collection(db, 'questions'))
    batch.set(qRef, {
      ...q,
      stopId: stopRef.id,
      points: typeof q.points === 'number' ? q.points : 10,
      isBonus: q.isBonus === true,
      createdAt: new Date()
    })
  }

  await batch.commit()
  return stopRef.id
}

export async function updateStop(
  stopId: string,
  stop: Partial<Omit<StopData, 'id' | 'createdAt' | 'questions' | 'seasonId'>>,
  questions: (Partial<QuestionData> & Omit<QuestionData, 'stopId'>)[],
  deletedQuestionIds: string[]
): Promise<void> {
  const batch = writeBatch(db)

  // 1. Update stop — ensure seasonIds is always an array, remove legacy seasonId
  const { seasonId: _ignored, ...stopFields } = stop as any
  const stopRef = doc(db, 'stops', stopId)
  batch.update(stopRef, {
    ...stopFields,
    ...(stop.seasonIds !== undefined ? { seasonIds: stop.seasonIds } : {})
  })

  // 2. Add/Update questions
  for (const q of questions) {
    if (q.id) {
      // Update existing question
      const qRef = doc(db, 'questions', q.id)
      const updateData: any = {
        text: q.text,
        textEn: q.textEn,
        options: q.options,
        optionsEn: q.optionsEn,
        correctIndex: q.correctIndex,
        difficulty: q.difficulty,
        explanation: q.explanation,
        explanationEn: q.explanationEn,
        points: typeof q.points === 'number' ? q.points : 10,
        isBonus: q.isBonus === true,
      }
      batch.update(qRef, updateData)
    } else {
      // Create new question
      const qRef = doc(collection(db, 'questions'))
      batch.set(qRef, {
        stopId,
        text: q.text,
        textEn: q.textEn,
        options: q.options,
        optionsEn: q.optionsEn,
        correctIndex: q.correctIndex,
        difficulty: q.difficulty,
        explanation: q.explanation,
        explanationEn: q.explanationEn,
        points: typeof q.points === 'number' ? q.points : 10,
        isBonus: q.isBonus === true,
        createdAt: new Date()
      })
    }
  }

  // 3. Delete questions
  for (const dId of deletedQuestionIds) {
    const qRef = doc(db, 'questions', dId)
    batch.delete(qRef)
  }

  await batch.commit()
}

export async function deleteStop(stopId: string): Promise<void> {
  const batch = writeBatch(db)

  // Delete stop document
  const stopRef = doc(db, 'stops', stopId)
  batch.delete(stopRef)

  // Fetch and delete all related questions
  const questionsCol = collection(db, 'questions')
  const q = query(questionsCol, where('stopId', '==', stopId))
  const snap = await getDocs(q)

  for (const qDoc of snap.docs) {
    batch.delete(qDoc.ref)
  }

  await batch.commit()
}

export interface PrizeCodeData {
  code: string
  playerId: string | null
  playerEmail: string
  playerDisplayName: string
  seasonId: string
  seasonName: string
  stageId: string
  prizeId: string
  prizeName: string
  prizeCategory: string
  prizeImageUrl: string
  status: 'active' | 'inactive' | 'claimed'
  createdAt: string | null
  claimedAt: string | null
  claimedBy?: string | null
}

export async function fetchPrizeCodes(): Promise<PrizeCodeData[]> {
  const codesCol = collection(db, 'prizeCodes')
  const snap = await getDocs(codesCol)

  return snap.docs.map(doc => {
    const data = doc.data()

    let createdAtStr: string | null = null
    if (data.createdAt && typeof data.createdAt.toDate === 'function') {
      createdAtStr = data.createdAt.toDate().toISOString()
    } else if (data.createdAt && typeof data.createdAt.seconds === 'number') {
      createdAtStr = new Date(data.createdAt.seconds * 1000).toISOString()
    }

    let claimedAtStr: string | null = null
    if (data.claimedAt && typeof data.claimedAt.toDate === 'function') {
      claimedAtStr = data.claimedAt.toDate().toISOString()
    } else if (data.claimedAt && typeof data.claimedAt.seconds === 'number') {
      claimedAtStr = new Date(data.claimedAt.seconds * 1000).toISOString()
    }

    return {
      code: doc.id,
      playerId: data.playerId || null,
      playerEmail: data.playerEmail || '',
      playerDisplayName: data.playerDisplayName || '',
      seasonId: data.seasonId || '',
      seasonName: data.seasonName || '',
      stageId: data.stageId || '',
      prizeId: data.prizeId || '',
      prizeName: data.prizeName || '',
      prizeCategory: data.prizeCategory || '',
      prizeImageUrl: data.prizeImageUrl || '',
      status: data.status || 'active',
      createdAt: createdAtStr,
      claimedAt: claimedAtStr,
      claimedBy: data.claimedBy || null
    }
  })
}

export async function updatePrizeCodeStatus(code: string, status: 'active' | 'inactive' | 'claimed'): Promise<void> {
  const docRef = doc(db, 'prizeCodes', code)
  const updates: any = { status }
  if (status === 'claimed') {
    updates.claimedAt = new Date()
    updates.claimedBy = 'admin'
  }
  await updateDoc(docRef, updates)
}

export async function generateTestPrizeCode(input: {
  email: string
  prizeId: string
  seasonId: string
  stageId: string
}): Promise<{ code: string }> {
  const generateTestPrizeCodeFn = httpsCallable<typeof input, { success: boolean; code: string }>(
    functions,
    'generateTestPrizeCode'
  )
  const response = await generateTestPrizeCodeFn(input)
  return { code: response.data.code }
}

export async function getPublicPrizeCode(code: string): Promise<PrizeCodeData> {
  const getPublicPrizeCodeFn = httpsCallable<{ code: string }, PrizeCodeData>(
    functions,
    'getPublicPrizeCode'
  )
  const response = await getPublicPrizeCodeFn({ code })
  return response.data
}

export async function redeemPublicPrizeCode(code: string): Promise<{ success: boolean; claimedAt: string }> {
  const redeemPublicPrizeCodeFn = httpsCallable<{ code: string }, { success: boolean; claimedAt: string }>(
    functions,
    'redeemPublicPrizeCode'
  )
  const response = await redeemPublicPrizeCodeFn({ code })
  return response.data
}

export interface ElevenLabsVoice {
  voice_id: string
  name: string
  category: string
}

export async function fetchElevenLabsVoices(): Promise<{ voices: ElevenLabsVoice[] }> {
  const getVoicesFn = httpsCallable<unknown, { voices: ElevenLabsVoice[] }>(
    functions,
    'getElevenLabsVoices'
  )
  const response = await getVoicesFn()
  return response.data
}

export async function generateElevenLabsAudio(text: string, voiceId: string): Promise<{ downloadUrl: string }> {
  const generateAudioFn = httpsCallable<{ text: string; voiceId: string }, { downloadUrl: string }>(
    functions,
    'generateElevenLabsAudio'
  )
  const response = await generateAudioFn({ text, voiceId })
  return response.data
}



