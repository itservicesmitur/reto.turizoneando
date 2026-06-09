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

// Requires Firestore rule: allow create: if request.auth.uid == playerId
export async function savePlayerProfile(uid: string, profile: PlayerProfile): Promise<void> {
  await setDoc(
    doc(db, 'players', uid),
    {
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
    },
    { merge: true },
  )
}
