import { useNavigate } from 'react-router-dom'
import { auth } from '../config/firebase'
import { useTranslation } from 'react-i18next'

export type StatusBlockType = 'user_banned' | 'season_ended' | 'stop_deactivated' | 'stage_deactivated'

interface Props {
  type: StatusBlockType
  name?: string
  reason?: string
  onDismiss?: () => void
  onNextStop?: () => void  // solo para stop_deactivated cuando hay una siguiente disponible
}

export default function StatusBlockCard({ type, name, reason, onDismiss, onNextStop }: Props) {
  const { t } = useTranslation()
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
              ? 'linear-gradient(90deg, #E63329, #a8211b)'
              : 'linear-gradient(90deg, #F5C800, #F4762B)',
          }} />

          <div style={{ padding: '28px 24px 24px' }}>
            {/* Icono */}
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: type === 'user_banned' ? 'rgba(230,51,41,0.15)' : 'rgba(245,200,0,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <i
                className={type === 'user_banned' ? 'ri-user-forbid-line' : 'ri-flag-2-line'}
                style={{
                  fontSize: 28,
                  color: type === 'user_banned' ? '#E63329' : '#F5C800',
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
              {type === 'user_banned' ? t('map.status_banned_title') : t('map.status_season_ended_title')}
            </h2>

            {/* Descripción */}
            <p style={{
              margin: '0 0 16px',
              fontSize: 14, color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.55,
            }}>
              {type === 'user_banned'
                ? t('map.status_banned_desc')
                : name
                  ? t('map.status_season_ended_desc', { name })
                  : t('map.status_season_ended_desc_no_name')}
            </p>

            {/* Razón de bloqueo (solo user_banned) */}
            {type === 'user_banned' && reason && (
              <div style={{
                marginBottom: 16, padding: '10px 14px',
                borderRadius: 12,
                background: 'rgba(230,51,41,0.08)',
                border: '1px solid rgba(230,51,41,0.2)',
              }}>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                  <strong style={{ color: '#f87171' }}>{t('map.status_banned_reason')} </strong>{reason}
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
                  <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{t('map.status_banned_policy_title')}</strong>{' '}
                  {t('map.status_banned_policy_body')}
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
                  ? 'linear-gradient(135deg, #E63329, #a8211b)'
                  : 'linear-gradient(135deg, #F5C800, #F4762B)',
                color: type === 'user_banned' ? '#fff' : '#1B2B6E',
                fontSize: 15, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: type === 'user_banned'
                  ? '0 4px 16px rgba(230,51,41,0.35)'
                  : '0 4px 16px rgba(245,200,0,0.35)',
              }}
            >
              <i className="ri-home-4-line" style={{ fontSize: 18 }} />
              {t('map.status_go_home')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Card pequeña (parada / etapa desactivada) — tema mapa madera/oro ────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0 16px 32px',
      background: 'rgba(10,5,2,0.55)',
      backdropFilter: 'blur(5px)',
      fontFamily: 'var(--font-map-ui, system-ui, sans-serif)',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'linear-gradient(160deg, #faf6eb 0%, #f0e8d0 100%)',
        borderRadius: 18,
        border: '1.5px solid rgba(168,127,42,0.5)',
        borderBottom: '3px solid rgba(168,127,42,0.65)',
        boxShadow: '0 -6px 32px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.9)',
        overflow: 'hidden',
      }}>
        {/* Franja oro */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #a87f2a, #fcd34d 50%, #a87f2a)' }} />

        <div style={{ padding: '18px 18px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            {/* Icono */}
            <div style={{
              flexShrink: 0,
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i
                className={type === 'stop_deactivated' ? 'ri-map-pin-2-line' : 'ri-route-line'}
                style={{ fontSize: 26, color: '#a87f2a' }}
              />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                margin: '0 0 5px',
                fontFamily: 'var(--font-map-parchment, Georgia, serif)',
                fontSize: 16, fontWeight: 800,
                color: '#321e0f',
              }}>
                {type === 'stop_deactivated' ? t('map.status_stop_deactivated_title') : t('map.status_stage_deactivated_title')}
              </h3>
              <p style={{
                margin: 0, fontSize: 13,
                color: 'rgba(50,30,15,0.68)', lineHeight: 1.5,
              }}>
                {type === 'stop_deactivated'
                  ? name
                    ? t('map.status_stop_deactivated_desc', { name })
                    : t('map.status_stop_deactivated_desc_no_name')
                  : name
                    ? t('map.status_stage_deactivated_desc', { name })
                    : t('map.status_stage_deactivated_desc_no_name')}
                {' '}{t('map.status_deactivated_explore_more')}
              </p>
            </div>
          </div>

          {/* Separador oro */}
          <div style={{
            margin: '14px 0 16px',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(168,127,42,0.4), transparent)',
          }} />

          {/* Botones */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onDismiss}
              className="game-btn-tan"
              style={{ flex: 1, height: 52, fontSize: 14 }}
            >
              {t('map.status_back_to_map')}
            </button>
            {type === 'stop_deactivated' && onNextStop && (
              <button
                onClick={onNextStop}
                className="game-btn-dark"
                style={{ flex: 1, height: 52, fontSize: 14 }}
              >
                {t('map.status_go_to_next')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
