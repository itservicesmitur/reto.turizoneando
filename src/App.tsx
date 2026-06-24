import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import { ProtectedRoute, AdminRoute, ProviderRoute } from './components/RouteGuards'

// Wraps lazy() so that a chunk-not-found error (stale deploy) triggers a page
// reload instead of crashing the React Router ErrorBoundary.
function lazyLoad<T extends React.ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((err: Error) => {
      const msg = err?.message ?? ''
      if (
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Importing a module script failed') ||
        msg.includes('error loading dynamically imported module')
      ) {
        window.location.reload()
        return new Promise<never>(() => undefined)
      }
      throw err
    })
  )
}

const LandingPage    = lazyLoad(() => import('./pages/LandingPage'))
const LoginPage      = lazyLoad(() => import('./pages/LoginPage'))
const RegisterPage   = lazyLoad(() => import('./pages/RegisterPage'))
const AdminLoginPage = lazyLoad(() => import('./pages/admin/AdminLoginPage'))

// Lazy-loaded placeholders — replace with real pages as they are built
const MapPage = lazyLoad(() => import('./pages/Map'))
const PrizesPage = lazy(() => Promise.resolve({ default: () => <div style={{ padding: 24 }}>Premios (coming soon)</div> }))
const ProfilePage = lazy(() => Promise.resolve({ default: () => <div style={{ padding: 24 }}>Perfil (coming soon)</div> }))
const ScannerPage = lazy(() => Promise.resolve({ default: () => <div style={{ padding: 24 }}>Scanner (coming soon)</div> }))

const DashboardPage = lazyLoad(() => import('./pages/admin/DashboardPage'))
const StopsPage = lazyLoad(() => import('./pages/admin/StopsPage'))
const AdminPrizesPage = lazyLoad(() => import('./pages/admin/PrizesPage'))
const PlayersPage = lazyLoad(() => import('./pages/admin/PlayersPage'))
const PlayerDetailPage = lazyLoad(() => import('./pages/admin/PlayerDetailPage'))
const AdminsPage = lazyLoad(() => import('./pages/admin/AdminsPage'))
const SeasonsPage = lazyLoad(() => import('./pages/admin/SeasonsPage'))
const SettingsPage = lazyLoad(() => import('./pages/admin/SettingsPage'))
const CodesPage = lazyLoad(() => import('./pages/admin/CodesPage'))
const AttemptsLogPage = lazyLoad(() => import('./pages/admin/AttemptsLogPage'))
const LocalsPage = lazyLoad(() => import('./pages/admin/LocalsPage'))
const WelcomePage = lazyLoad(() => import('./pages/admin/WelcomePage'))
const ProvidersPage = lazyLoad(() => import('./pages/admin/ProvidersPage'))
const ProviderDashboard = lazyLoad(() => import('./pages/provider/ProviderDashboard'))
const PublicValidationPage = lazyLoad(() => import('./pages/PublicValidationPage'))
const ResetPasswordPage  = lazyLoad(() => import('./pages/ResetPasswordPage'))
const VerifyEmailPage   = lazyLoad(() => import('./pages/VerifyEmailPage'))
const EmailPreview = import.meta.env.DEV
  ? lazyLoad(() => import('./pages/dev/EmailPreview'))
  : null

const router = createBrowserRouter([
  // ── Public landing ─────────────────────────────────────────────
  { path: '/', element: <Suspense fallback={null}><LandingPage /></Suspense> },

  // ── Auth routes (no layout) ────────────────────────────────────
  { path: '/login', element: <Suspense fallback={null}><LoginPage /></Suspense> },
  { path: '/register', element: <Suspense fallback={null}><RegisterPage /></Suspense> },
  { path: '/verify-email', element: <Suspense fallback={null}><VerifyEmailPage /></Suspense> },
  { path: '/admin/login', element: <Suspense fallback={null}><AdminLoginPage /></Suspense> },
  {
    path: '/reset-password',
    element: (
      <Suspense fallback={null}>
        <ResetPasswordPage />
      </Suspense>
    )
  },

  // ── Protected client routes ────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      // Full-screen routes (no bottom nav)
      {
        path: '/scanner',
        element: (
          <Suspense fallback={null}>
            <ScannerPage />
          </Suspense>
        ),
      },
      {
        path: '/map',
        element: (
          <Suspense fallback={null}>
            <MapPage />
          </Suspense>
        ),
      },

      // Main app shell (bottom nav)
      {
        element: <MainLayout />,
        children: [
          {
            path: 'prizes',
            element: (
              <Suspense fallback={null}>
                <PrizesPage />
              </Suspense>
            ),
          },
          {
            path: 'profile',
            element: (
              <Suspense fallback={null}>
                <ProfilePage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },

  // ── Protected admin routes (/admin/*) ──────────────────────────
  {
    element: <AdminRoute />,
    children: [
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          {
            path: 'dashboard',
            element: (
              <Suspense fallback={null}>
                <DashboardPage />
              </Suspense>
            ),
          },
          {
            path: 'stops',
            element: (
              <Suspense fallback={null}>
                <StopsPage />
              </Suspense>
            ),
          },
          {
            path: 'prizes',
            element: (
              <Suspense fallback={null}>
                <AdminPrizesPage />
              </Suspense>
            ),
          },
          {
            path: 'players',
            element: (
              <Suspense fallback={null}>
                <PlayersPage />
              </Suspense>
            ),
          },
          {
            path: 'players/:playerId',
            element: (
              <Suspense fallback={null}>
                <PlayerDetailPage />
              </Suspense>
            ),
          },
          {
            path: 'admins',
            element: (
              <Suspense fallback={null}>
                <AdminsPage />
              </Suspense>
            ),
          },
          {
            path: 'seasons',
            element: (
              <Suspense fallback={null}>
                <SeasonsPage />
              </Suspense>
            ),
          },
          {
            path: 'settings',
            element: (
              <Suspense fallback={null}>
                <SettingsPage />
              </Suspense>
            ),
          },
          {
            path: 'codes',
            element: (
              <Suspense fallback={null}>
                <CodesPage />
              </Suspense>
            ),
          },
          {
            path: 'locals',
            element: (
              <Suspense fallback={null}>
                <LocalsPage />
              </Suspense>
            ),
          },
          {
            path: 'providers',
            element: (
              <Suspense fallback={null}>
                <ProvidersPage />
              </Suspense>
            ),
          },
          {
            path: 'live',
            element: (
              <Suspense fallback={null}>
                <AttemptsLogPage />
              </Suspense>
            ),
          },
          {
            path: 'welcome',
            element: (
              <Suspense fallback={null}>
                <WelcomePage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },

  // ── Provider routes (/provider/*, /validar/*) ────────────────
  {
    element: <ProviderRoute />,
    children: [
      {
        path: '/provider',
        element: (
          <Suspense fallback={null}>
            <ProviderDashboard />
          </Suspense>
        ),
      },
      {
        path: '/validar/:code',
        element: (
          <Suspense fallback={null}>
            <PublicValidationPage />
          </Suspense>
        ),
      },
      {
        path: '/validar',
        element: (
          <Suspense fallback={null}>
            <PublicValidationPage />
          </Suspense>
        ),
      },
    ],
  },

  // ── Dev only ────────────────────────────────────────────────────
  ...(import.meta.env.DEV && EmailPreview ? [
    { path: '/email-preview', element: <Suspense fallback={null}><EmailPreview /></Suspense> },
  ] : []),

  // ── Fallback ────────────────────────────────────────────────────
  { path: '*', element: <Navigate to="/" replace /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
