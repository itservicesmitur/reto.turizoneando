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
const StopsPage = lazy(() => Promise.resolve({ default: () => <div style={{ padding: 0 }}>Paradas (coming soon)</div> }))
const AdminPrizesPage = lazy(() => Promise.resolve({ default: () => <div style={{ padding: 0 }}>Premios admin (coming soon)</div> }))
const PlayersPage = lazy(() => import('./pages/admin/PlayersPage'))
const PlayerDetailPage = lazy(() => import('./pages/admin/PlayerDetailPage'))
const AdminsPage = lazy(() => import('./pages/admin/AdminsPage'))

const router = createBrowserRouter([
  // ── Public landing ─────────────────────────────────────────────
  { path: '/', element: <LandingPage /> },

  // ── Auth routes (no layout) ────────────────────────────────────
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/admin/login', element: <AdminLoginPage /> },

  // ── Protected client routes ────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      // Full-screen scanner (no bottom nav)
      {
        path: '/scanner',
        element: (
          <Suspense fallback={null}>
            <ScannerPage />
          </Suspense>
        ),
      },

      // Main app shell (bottom nav)
      {
        element: <MainLayout />,
        children: [
          {
            path: 'map',
            element: (
              <Suspense fallback={null}>
                <MapPage />
              </Suspense>
            ),
          },
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
