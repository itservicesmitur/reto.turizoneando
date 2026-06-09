import { httpsCallable } from 'firebase/functions'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
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
    createdAt: createdAtStr,
  }
}

export async function updatePlayerBannedStatus(uid: string, banned: boolean): Promise<void> {
  const docRef = doc(db, 'players', uid)
  await updateDoc(docRef, { banned })
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
