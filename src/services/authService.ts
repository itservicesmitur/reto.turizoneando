import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '../config/firebase'

export interface PlayerProfile {
  firstName:     string
  lastName:      string
  gender:        string
  nationality:   string
  ageRange:      string
  preferredLang: 'es' | 'en'
  email:         string
  photoURL?:     string
}

const googleProvider = new GoogleAuthProvider()
const appleProvider  = new OAuthProvider('apple.com')

export async function registerWithEmail(email: string, password: string): Promise<User> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  return user
}

export async function signUpWithGoogle(): Promise<{ user: User; isNew: boolean } | null> {
  try {
    const { user } = await signInWithPopup(auth, googleProvider)
    const snap = await getDoc(doc(db, 'players', user.uid))
    return { user, isNew: !snap.exists() }
  } catch (err: any) {
    if (err?.code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, googleProvider)
      return null // page will reload, result handled by getGoogleRedirectResult
    }
    throw err
  }
}

export async function getGoogleRedirectResult(): Promise<{ user: User; isNew: boolean } | null> {
  const result = await getRedirectResult(auth)
  if (!result) return null
  const snap = await getDoc(doc(db, 'players', result.user.uid))
  return { user: result.user, isNew: !snap.exists() }
}

export async function signUpWithApple(): Promise<{ user: User; isNew: boolean }> {
  const { user } = await signInWithPopup(auth, appleProvider)
  const snap = await getDoc(doc(db, 'players', user.uid))
  return { user, isNew: !snap.exists() }
}

export async function syncPlayerSocialProfile(user: User, preferredLang: 'es' | 'en' = 'es'): Promise<void> {
  const docRef = doc(db, 'players', user.uid)
  const snap = await getDoc(docRef)
  
  const dataToSave: any = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    updatedAt: serverTimestamp(),
  }

  const existingData = snap.exists() ? snap.data() : null
  if (user.displayName) {
    const parts = user.displayName.split(' ')
    const googleFirstName = parts[0] || ''
    const googleLastName = parts.slice(1).join(' ') || ''
    
    if (!existingData || !existingData.firstName) {
      dataToSave.firstName = googleFirstName
    }
    if (!existingData || !existingData.lastName) {
      dataToSave.lastName = googleLastName
    }
  }

  if (!snap.exists()) {
    dataToSave.score = 0
    dataToSave.mapProgress = {}
    dataToSave.currentNodeId = null
    dataToSave.preferredLang = preferredLang
    dataToSave.createdAt = serverTimestamp()
    dataToSave.gender = ''
    dataToSave.nationality = ''
    dataToSave.ageRange = ''
  }

  await setDoc(docRef, dataToSave, { merge: true })
}

export async function getPlayerProfile(uid: string): Promise<Partial<PlayerProfile> | null> {
  const snap = await getDoc(doc(db, 'players', uid))
  if (!snap.exists()) return null
  const d = snap.data()
  return {
    firstName:     d.firstName     || '',
    lastName:      d.lastName      || '',
    gender:        d.gender        || '',
    nationality:   d.nationality   || '',
    ageRange:      d.ageRange      || '',
    email:         d.email         || '',
    photoURL:      d.photoURL      || '',
    preferredLang: d.preferredLang || 'es',
  }
}

export async function updatePlayerProfile(
  uid: string,
  fields: Partial<Pick<PlayerProfile, 'firstName' | 'lastName' | 'gender' | 'nationality' | 'ageRange' | 'photoURL'>>
): Promise<void> {
  const displayName = (fields.firstName || fields.lastName)
    ? `${fields.firstName ?? ''} ${fields.lastName ?? ''}`.trim()
    : undefined

  const data: Record<string, unknown> = { ...fields, updatedAt: serverTimestamp() }
  if (displayName) data.displayName = displayName

  await updateDoc(doc(db, 'players', uid), data)

  if (auth.currentUser) {
    const authUpdate: { displayName?: string; photoURL?: string } = {}
    if (displayName) authUpdate.displayName = displayName
    if (fields.photoURL !== undefined) authUpdate.photoURL = fields.photoURL
    if (Object.keys(authUpdate).length > 0) {
      await updateProfile(auth.currentUser, authUpdate)
    }
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser
  if (!user || !user.email) throw new Error('no-email')
  const credential = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, credential)
  await updatePassword(user, newPassword)
}

// Requires Firestore rule: allow create: if request.auth.uid == playerId
export async function savePlayerProfile(uid: string, profile: PlayerProfile): Promise<void> {
  const dataToSave: any = {
    uid,
    displayName:   `${profile.firstName} ${profile.lastName}`.trim(),
    firstName:     profile.firstName,
    lastName:      profile.lastName,
    gender:        profile.gender,
    nationality:   profile.nationality,
    ageRange:      profile.ageRange,
    preferredLang: profile.preferredLang,
    email:         profile.email,
    score:         0,
    mapProgress:   {},
    currentNodeId: null,
    createdAt:     serverTimestamp(),
    updatedAt:     serverTimestamp(),
  }
  if (profile.photoURL) {
    dataToSave.photoURL = profile.photoURL
  }
  await setDoc(doc(db, 'players', uid), dataToSave, { merge: true })
}

export interface PlayerPrizeCode {
  code: string
  prizeName: string
  prizeImageUrl: string
  prizeCategory: string
  localName: string
  seasonName: string
  status: 'active' | 'claimed' | 'inactive'
  claimedAt: string | null
  expiresAt: string | null
}

export async function getPlayerPrizeCodes(uid: string): Promise<PlayerPrizeCode[]> {
  const q = query(collection(db, 'prizeCodes'), where('playerId', '==', uid))
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data()
    const toStr = (ts: any): string | null => {
      if (!ts) return null
      if (typeof ts.toDate === 'function') return ts.toDate().toISOString()
      if (typeof ts.seconds === 'number') return new Date(ts.seconds * 1000).toISOString()
      return null
    }
    return {
      code:          d.id,
      prizeName:     data.prizeName     || '',
      prizeImageUrl: data.prizeImageUrl || '',
      prizeCategory: data.prizeCategory || '',
      localName:     data.localName     || '',
      seasonName:    data.seasonName    || '',
      status:        data.status        || 'active',
      claimedAt:     toStr(data.claimedAt),
      expiresAt:     toStr(data.expiresAt),
    }
  })
}
