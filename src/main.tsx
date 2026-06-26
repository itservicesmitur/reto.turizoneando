import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './config/i18n'
import App from './App.tsx'

// ── Stale-deploy detection ────────────────────────────────────────────────────
//
// Problem: After a Firebase deploy, Vite generates new content-hashed chunk
// filenames. Users who already have the app open (or have index.html cached)
// will try to load the old chunk URLs which no longer exist. Firebase's SPA
// rewrite returns index.html (text/html) instead, causing a MIME type crash.
//
// Three-layer fix:
//  1. unhandledrejection  — catches any chunk error that escapes React Router.
//  2. lazyLoad() in App   — catches per-route import errors before ErrorBoundary.
//  3. visibilitychange    — reloads when the tab comes back after 30 min away,
//     covering long-lived sessions where a deploy happened while tab was idle.

// Layer 1 — global chunk error handler
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  const msg: string = event.reason?.message ?? ''
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module')
  ) {
    window.location.reload()
  }
})

// Layer 3 — reload after the tab has been hidden for 30+ minutes
const STALE_MS = 30 * 60 * 1000
let hiddenAt = 0
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    hiddenAt = Date.now()
  } else if (hiddenAt > 0 && Date.now() - hiddenAt > STALE_MS) {
    window.location.reload()
  }
})

// Layer 4 — Force reload if server version is different
declare const __APP_VERSION__: number

if (typeof window !== 'undefined') {
  fetch(`/version.json?t=${Date.now()}`)
    .then(res => res.json())
    .then(data => {
      if (data && data.version && data.version !== __APP_VERSION__) {
        console.log('New version detected! Reloading to update...', data.version, 'local:', __APP_VERSION__)
        window.location.reload()
      }
    })
    .catch(() => { /* silent */ })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <App />
    </Suspense>
  </StrictMode>,
)
