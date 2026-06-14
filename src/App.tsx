import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import LandingPage from './pages/LandingPage'
import { ProtectedRoute, AdminRoute } from './components/RouteGuards'

// Lazy-loaded placeholders — replace with real pages as they are built
const MapPage = lazy(() => import('./pages/Map'))
const PrizesPage = lazy(() => Promise.resolve({ default: () => <div style={{ padding: 24 }}>Premios (coming soon)</div> }))
const ProfilePage = lazy(() => Promise.resolve({ default: () => <div style={{ padding: 24 }}>Perfil (coming soon)</div> }))
const ScannerPage = lazy(() => Promise.resolve({ default: () => <div style={{ padding: 24 }}>Scanner (coming soon)</div> }))

const DashboardPage = lazy(() => Promise.resolve({ default: () => <div style={{ padding: 0 }}>Dashboard (coming soon)</div> }))
const StopsPage = lazy(() => import('./pages/admin/StopsPage'))
const AdminPrizesPage = lazy(() => import('./pages/admin/PrizesPage'))
const PlayersPage = lazy(() => import('./pages/admin/PlayersPage'))
const PlayerDetailPage = lazy(() => import('./pages/admin/PlayerDetailPage'))
const AdminsPage = lazy(() => import('./pages/admin/AdminsPage'))
const SeasonsPage = lazy(() => import('./pages/admin/SeasonsPage'))
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'))
const CodesPage = lazy(() => import('./pages/admin/CodesPage'))
const AttemptsLogPage = lazy(() => import('./pages/admin/AttemptsLogPage'))
const PublicValidationPage = lazy(() => import('./pages/PublicValidationPage'))


const router = createBrowserRouter([
  // ── Public landing ─────────────────────────────────────────────
  { path: '/', element: <LandingPage /> },

  // ── Auth routes (no layout) ────────────────────────────────────
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/admin/login', element: <AdminLoginPage /> },
  {
    path: '/validar/:code',
    element: (
      <Suspense fallback={null}>
        <PublicValidationPage />
      </Suspense>
    )
  },
  {
    path: '/validar',
    element: (
      <Suspense fallback={null}>
        <PublicValidationPage />
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
            path: 'live',
            element: (
              <Suspense fallback={null}>
                <AttemptsLogPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },

  // ── Fallback ────────────────────────────────────────────────────
  { path: '*', element: <Navigate to="/" replace /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
