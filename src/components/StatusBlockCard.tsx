import { useNavigate } from 'react-router-dom'
import { auth } from '../config/firebase'

export type StatusBlockType = 'user_banned' | 'season_ended' | 'stop_deactivated' | 'stage_deactivated'

interface Props {
  type: StatusBlockType
  name?: string      // nombre de parada / etapa / temporada
  reason?: string    // razón de bloqueo de usuario
  onDismiss?: () => void  // para parada / etapa (botón "Continuar" / "Ir al mapa")
}

export default function StatusBlockCard({ type, name, reason, onDismiss }: Props) {
  const navigate = useNavigate()
  const isFull = type === 'user_banned' || type === 'season_ended'

  const handleGoHome = async () => {
    try { await auth.signOut() } catch { /* ignore */ }
    navigate('/', { replace: true })
  }

  if (isFull) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(8, 14, 30, 0.97)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        fontFamily: 'var(--font-body, sans-serif)',
      }}>
        <div style={{
          width: '100%', maxWidth: 380,
          background: 'linear-gradient(160deg, #13203a 0%, #0f172a 100%)',
          borderRadius: 24,
          border: '1.5px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}>
          {/* Franja de color */}
          <div style={{
            height: 4,
            background: type === 'user_banned'
              ? 'linear-gradient(90deg, #ef4444, #b91c1c)'
              : 'linear-gradient(90deg, #f59e0b, #d97706)',
          }} />

          <div style={{ padding: '28px 24px 24px' }}>
            {/* Icono */}
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: type === 'user_banned' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <i
                className={type === 'user_banned' ? 'ri-user-forbid-line' : 'ri-flag-2-line'}
                style={{
                  fontSize: 28,
                  color: type === 'user_banned' ? '#ef4444' : '#f59e0b',
                }}
              />
            </div>

            {/* Título */}
            <h2 style={{
              margin: '0 0 8px',
              fontFamily: 'var(--font-display, Georgia, serif)',
              fontSize: 20, fontWeight: 800,
              color: '#fff',
              lineHeight: 1.25,
            }}>
              {type === 'user_banned' ? 'Cuenta suspendida' : 'Temporada finalizada'}
            </h2>

            {/* Descripción */}
            <p style={{
              margin: '0 0 16px',
              fontSize: 14, color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.55,
            }}>
              {type === 'user_banned'
                ? 'Tu cuenta ha sido suspendida y no puedes acceder a la aplicación en este momento.'
                : `La temporada${name ? ` "${name}"` : ''} ha concluido. Mantente atento a la próxima edición.`}
            </p>

            {/* Razón de bloqueo (solo user_banned) */}
            {type === 'user_banned' && reason && (
              <div style={{
                marginBottom: 16, padding: '10px 14px',
                borderRadius: 12,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                  <strong style={{ color: '#fca5a5' }}>Motivo: </strong>{reason}
                </p>
              </div>
            )}

            {/* Política (solo user_banned) */}
            {type === 'user_banned' && (
              <div style={{
                marginBottom: 24, padding: '10px 14px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Política de uso:</strong>{' '}
                  El uso fraudulento de la plataforma, la creación de cuentas múltiples, el comportamiento
                  abusivo o la violación de los términos de servicio puede resultar en la suspensión
                  permanente de la cuenta. Para apelar esta decisión, contacta al soporte del evento.
                </p>
              </div>
            )}

            {/* Botón */}
            <button
              onClick={handleGoHome}
              style={{
                width: '100%', height: 48,
                borderRadius: 14,
                border: 'none', cursor: 'pointer',
                background: type === 'user_banned'
                  ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                  : 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff',
                fontSize: 15, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: type === 'user_banned'
                  ? '0 4px 16px rgba(239,68,68,0.35)'
                  : '0 4px 16px rgba(245,158,11,0.35)',
              }}
            >
              <i className="ri-home-4-line" style={{ fontSize: 18 }} />
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Card pequeña (parada / etapa desactivada) ────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0 16px 32px',
      background: 'rgba(0,0,0,0.45)',
      backdropFilter: 'blur(4px)',
      fontFamily: 'var(--font-body, sans-serif)',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'linear-gradient(160deg, #1a2a44 0%, #0f172a 100%)',
        borderRadius: 20,
        border: '1.5px solid rgba(255,255,255,0.1)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}>
        {/* Franja ámbar */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />

        <div style={{ padding: '20px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            {/* Icono */}
            <div style={{
              flexShrink: 0,
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(245,158,11,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i
                className={type === 'stop_deactivated' ? 'ri-map-pin-2-line' : 'ri-route-line'}
                style={{ fontSize: 22, color: '#f59e0b' }}
              />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                margin: '0 0 4px',
                fontFamily: 'var(--font-display, Georgia, serif)',
                fontSize: 16, fontWeight: 800, color: '#fff',
              }}>
                {type === 'stop_deactivated' ? 'Parada no disponible' : 'Etapa no disponible'}
              </h3>
              <p style={{
                margin: 0, fontSize: 13,
                color: 'rgba(255,255,255,0.6)', lineHeight: 1.5,
              }}>
                {type === 'stop_deactivated'
                  ? `La parada${name ? ` "${name}"` : ''} ha sido desactivada por el organizador.`
                  : `${name ?? 'La etapa actual'} ha sido desactivada por el organizador.`}
                {' '}Puedes continuar explorando otras paradas disponibles.
              </p>
            </div>
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button
              onClick={onDismiss}
              style={{
                flex: 1, height: 44,
                borderRadius: 12,
                border: '1.5px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Continuar
            </button>
            <button
              onClick={onDismiss}
              style={{
                flex: 1, height: 44,
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
                color: '#fff',
                fontSize: 14, fontWeight: 700,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: '0 4px 12px rgba(29,78,216,0.4)',
              }}
            >
              <i className="ri-map-2-line" style={{ fontSize: 16 }} />
              Ir al mapa
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
