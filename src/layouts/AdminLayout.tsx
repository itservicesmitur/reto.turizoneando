import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { signOut } from 'firebase/auth'
import { auth } from '../config/firebase'

interface NavItem {
  to: string
  icon: string
  labelKey: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin/dashboard', icon: 'ri-dashboard-line',  labelKey: 'adminNav.dashboard' },
  { to: '/admin/stops',     icon: 'ri-map-pin-line',    labelKey: 'adminNav.stops' },
  { to: '/admin/prizes',    icon: 'ri-gift-line',       labelKey: 'adminNav.prizes' },
  { to: '/admin/players',   icon: 'ri-group-line',      labelKey: 'adminNav.players' },
  { to: '/admin/admins',    icon: 'ri-shield-user-line', labelKey: 'adminNav.admins' },
]

export default function AdminLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  async function handleLogout() {
    await signOut(auth)
    navigate('/admin/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)', fontFamily: 'var(--font-body)' }}>

      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? 240 : 64,
          minHeight: '100vh',
          background: 'var(--color-navy)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 250ms ease',
          flexShrink: 0,
          zIndex: 40,
        }}
      >
        {/* Logo row */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: sidebarOpen ? '0 16px' : '0 20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--color-yellow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <i className="ri-compass-3-line" style={{ color: 'var(--color-navy)', fontSize: 18 }} />
          </div>
          {sidebarOpen && (
            <span style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              Turizoneando
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle sidebar"
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <i className={sidebarOpen ? 'ri-arrow-left-s-line' : 'ri-arrow-right-s-line'} style={{ fontSize: 18 }} />
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(({ to, icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              aria-label={t(labelKey)}
              style={{ textDecoration: 'none' }}
            >
              {({ isActive }) => (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: isActive ? 'rgba(245,200,0,0.15)' : 'transparent',
                    color: isActive ? 'var(--color-yellow)' : 'rgba(255,255,255,0.7)',
                    transition: 'background 150ms ease, color 150ms ease',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                >
                  <i className={icon} style={{ fontSize: 18, flexShrink: 0 }} />
                  {sidebarOpen && (
                    <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 500 }}>
                      {t(labelKey)}
                    </span>
                  )}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: settings + logout */}
        <div style={{ padding: '8px 8px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NavLink
            to="/admin/settings"
            aria-label={t('adminNav.settings')}
            style={{ textDecoration: 'none' }}
          >
            {({ isActive }) => (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: isActive ? 'rgba(245,200,0,0.15)' : 'transparent',
                  color: isActive ? 'var(--color-yellow)' : 'rgba(255,255,255,0.7)',
                  transition: 'background 150ms ease',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
              >
                <i className="ri-settings-3-line" style={{ fontSize: 18, flexShrink: 0 }} />
                {sidebarOpen && <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 500 }}>{t('adminNav.settings')}</span>}
              </span>
            )}
          </NavLink>

          <button
            onClick={handleLogout}
            aria-label={t('adminNav.logout')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 10,
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              width: '100%',
              textAlign: 'left',
              transition: 'color 150ms ease',
            }}
          >
            <i className="ri-logout-box-line" style={{ fontSize: 18, flexShrink: 0 }} />
            {sidebarOpen && <span style={{ fontSize: 14 }}>{t('adminNav.logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <header
          style={{
            height: 64,
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: 16,
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1 }} />
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-gray-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ri-user-line" style={{ color: 'var(--color-gray-dark)', fontSize: 18 }} />
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
