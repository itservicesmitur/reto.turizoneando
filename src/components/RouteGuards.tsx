import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'

type ClientStatus = 'pending' | 'auth' | 'unauth'
type AdminStatus  = 'pending' | 'ok'  | 'denied'

// ── Shared spinner ────────────────────────────────────────────────────────
function AuthSpinner() {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-navy)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        border: '3.5px solid rgba(255,255,255,0.12)',
        borderTopColor: 'var(--color-yellow)',
        animation: 'rg-spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes rg-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Client guard: any authenticated Firebase user ─────────────────────────
export function ProtectedRoute() {
  const [status, setStatus] = useState<ClientStatus>('pending')

  useEffect(() => {
    return onAuthStateChanged(auth, async user => {
      if (!user) {
        setStatus('unauth')
        return
      }
      try {
        const snap = await getDoc(doc(db, 'players', user.uid))
        if (snap.exists() && snap.data().banned === true) {
          await auth.signOut()
          setStatus('unauth')
          return
        }
        setStatus('auth')
      } catch {
        // Safe fallback in case of Firestore permissions/network errors
        setStatus('auth')
      }
    })
  }, [])

  if (status === 'pending') return <AuthSpinner />
  if (status === 'unauth')  return <Navigate to="/login" replace />
  return <Outlet />
}

// ── Admin guard: authenticated + custom claim role: 'Admin' ──────────────
export function AdminRoute() {
  const [status, setStatus] = useState<AdminStatus>('pending')

  useEffect(() => {
    return onAuthStateChanged(auth, async user => {
      if (!user) { setStatus('denied'); return }
      try {
        const { claims } = await user.getIdTokenResult()
        setStatus(claims.role === 'Admin' ? 'ok' : 'denied')
      } catch {
        setStatus('denied')
      }
    })
  }, [])

  if (status === 'pending') return <AuthSpinner />
  if (status === 'denied')  return <Navigate to="/admin/login" replace />
  return <Outlet />
}
