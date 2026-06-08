import { Outlet, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface NavItem {
  to: string
  icon: string
  labelKey: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/map',     icon: 'ri-treasure-map-line', labelKey: 'nav.map' },
  { to: '/prizes',  icon: 'ri-gift-line',          labelKey: 'nav.prizes' },
  { to: '/scanner', icon: 'ri-qr-scan-2-line',     labelKey: 'nav.scanner' },
  { to: '/profile', icon: 'ri-user-line',           labelKey: 'nav.profile' },
]

export default function MainLayout() {
  const { t } = useTranslation()

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: 'var(--bottom-nav-height)',
          paddingTop: 'var(--safe-top)',
        }}
      >
        <Outlet />
      </main>

      <nav
        aria-label={t('nav.map')}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'var(--bottom-nav-height)',
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          boxShadow: '0 -2px 12px rgba(27,43,110,0.08)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          paddingBottom: 'var(--safe-bottom)',
          zIndex: 50,
        }}
      >
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
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  height: 56,
                  color: isActive ? 'var(--color-navy)' : 'var(--color-gray-mid)',
                  transition: 'color 150ms ease, transform 150ms ease',
                  transform: isActive ? 'scale(1)' : 'scale(1)',
                }}
              >
                <i
                  className={icon}
                  style={{
                    fontSize: 22,
                    lineHeight: 1,
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 150ms ease',
                  }}
                />
                <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: 0.2 }}>
                  {t(labelKey)}
                </span>
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 'var(--safe-bottom)',
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: 'var(--color-navy)',
                    }}
                  />
                )}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
