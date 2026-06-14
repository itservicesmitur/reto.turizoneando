import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  type User,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
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

export async function signUpWithGoogle(): Promise<{ user: User; isNew: boolean }> {
  const { user } = await signInWithPopup(auth, googleProvider)
  const snap = await getDoc(doc(db, 'players', user.uid))
  return { user, isNew: !snap.exists() }
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
