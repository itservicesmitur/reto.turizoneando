import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import GameButton from './quiz/GameButton'

interface Props {
  onGranted: () => void
  onDismiss?: () => void
}

type Status = 'requesting' | 'denied'

export default function LocationGate({ onGranted }: Props) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<Status>('requesting')

  useEffect(() => {
    if (!navigator.geolocation) { onGranted(); return }

    // Lanza el popup del navegador en background siempre.
    // Solo code 1 (PERMISSION_DENIED real) muestra el aviso;
    // code 2 (kCLErrorLocationUnknown / señal débil) y code 3 (timeout) dejan pasar.
    navigator.geolocation.getCurrentPosition(
      () => onGranted(),
      (err) => { if (err.code === 1) { setStatus('denied') } else { onGranted() } },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 15000 }
    )

    // Atajo rápido: si el navegador ya sabe que el permiso está concedido, cerrar sin esperar
    navigator.permissions
      ?.query({ name: 'geolocation' as PermissionName })
      .then(result => { if (result.state === 'granted') onGranted() })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center px-6"
      style={{ background: 'rgba(10,5,2,0.65)', backdropFilter: 'blur(3px)' }}
    >
      <style>{`
        @keyframes gate-pin-bounce {
          0%, 100% { transform: translate(60px, 38px) scale(1.3) translateY(0); }
          50% { transform: translate(60px, 38px) scale(1.3) translateY(-8px); }
        }
        @keyframes gate-cloud-drift-left {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(6px) translateY(-2px); }
        }
        @keyframes gate-cloud-drift-right {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-6px) translateY(2px); }
        }
        @keyframes gate-cloud-cross-front {
          0% { transform: translate(-45px, 45px) scale(1.15); opacity: 0; }
          20% { transform: translate(-10px, 43px) scale(1.15); opacity: 0.8; }
          70% { transform: translate(80px, 43px) scale(1.15); opacity: 0.8; }
          90% { transform: translate(115px, 45px) scale(1.15); opacity: 0; }
          100% { transform: translate(155px, 45px) scale(1.15); opacity: 0; }
        }
      `}</style>

      <div
        className="w-full max-w-[320px] rounded-md overflow-hidden animate-fade-in relative"
        style={{
          background: 'var(--color-map-cream-light)',
          border: '1.5px solid rgba(82, 49, 22, 0.15)',
          boxShadow: '0 20px 50px rgba(10,5,2,0.35), inset 0 0 20px rgba(168,127,42,0.03)',
        }}
      >
        <div className="p-6 flex flex-col items-center text-center gap-4">

          {/* Ilustración SVG */}
          <div className="flex justify-center mt-2">
            <svg viewBox="0 0 120 90" className="w-28 h-20" style={{ overflow: 'visible' }}>
              <defs>
                <radialGradient id="pinShadow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(82,49,22,0.3)" />
                  <stop offset="100%" stopColor="rgba(82,49,22,0)" />
                </radialGradient>
                <linearGradient id="pinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="var(--color-map-wood-dark)" />
                </linearGradient>
              </defs>

              <g stroke="var(--color-map-tan)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <g style={{ animation: 'gate-cloud-drift-left 7s ease-in-out infinite' }} opacity="0.6">
                  <path d="M5 40 a7 7 0 0 1 7 -7 a10.5 10.5 0 0 1 17.5 0 a7 7 0 0 1 7 7 a4.5 4.5 0 0 1 -4.5 4.5 h-22.5 a4.5 4.5 0 0 1 -4.5 -4.5 z" fill="rgba(250, 246, 235, 0.75)" />
                </g>
                <g style={{ animation: 'gate-cloud-drift-right 8s ease-in-out infinite' }} opacity="0.55">
                  <path d="M82 32 a5.5 5.5 0 0 1 5.5 -5.5 a8.5 8.5 0 0 1 14.5 0 a5.5 5.5 0 0 1 5.5 5.5 a3.5 3.5 0 0 1 -3.5 3.5 h-18.5 a3.5 3.5 0 0 1 -3.5 -3.5 z" fill="rgba(250, 246, 235, 0.75)" />
                </g>
              </g>

              <g opacity="0.45" fill="var(--color-map-tan)">
                <path d="M40 22 l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1 z" />
                <path d="M80 50 l0.8 1.5 l1.5 0.8 l-1.5 0.8 l-0.8 1.5 l-0.8 -1.5 l-1.5 -0.8 l1.5 -0.8 z" />
              </g>

              <g style={{ animation: 'gate-pin-bounce 2.2s ease-in-out infinite' }}>
                <ellipse cx="0" cy="30" rx="10" ry="3" fill="url(#pinShadow)" />
                <path
                  d="M0-20 C-11-20 -19-12 -19 0 C-19 11 0 29 0 29 C0 29 19 11 19 0 C19-12 11-20 0-20 Z"
                  fill="var(--color-map-wood-dark)"
                  stroke="var(--color-map-gold-light)"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  filter="drop-shadow(0 3px 5px rgba(0,0,0,0.2))"
                />
                <path
                  d="M0-16 C-8-16 -14-10 -14 0 C-14 8 0 23 0 23 C0 23 14 8 14 0 C14-10 8-16 0-16 Z"
                  fill="url(#pinGrad)"
                />
                <circle cx="0" cy="-2" r="4.5" fill="var(--color-map-gold-light)" stroke="var(--color-map-wood-dark)" strokeWidth="1.2" />
              </g>

              <g stroke="var(--color-map-tan)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <g style={{ animation: 'gate-cloud-cross-front 11s linear infinite' }}>
                  <path d="M-20 8 a8.5 8.5 0 0 1 8.5 -8.5 a13 13 0 0 1 21.5 0 a8.5 8.5 0 0 1 8.5 8.5 a5.5 5.5 0 0 1 -5.5 5.5 h-27.5 a5.5 5.5 0 0 1 -5.5 -5.5 z" fill="rgba(250, 246, 235, 0.8)" />
                </g>
              </g>
            </svg>
          </div>

          {/* Textos */}
          <div className="flex flex-col gap-1 px-1">
            <h3
              className="text-base font-black tracking-normal"
              style={{ color: 'var(--color-map-wood-dark)', fontFamily: 'var(--font-map-ui)' }}
            >
              {t('map.location_gate_title')}
            </h3>
            <p
              className="text-xs leading-relaxed"
              style={{ color: 'var(--color-map-wood-mid)', fontFamily: 'var(--font-map-parchment)' }}
            >
              {t('map.location_gate_desc')}
            </p>
          </div>

          {/* Alerta de permiso denegado */}
          {status === 'denied' && (
            <div
              className="flex items-start gap-2 px-3 py-2.5 rounded-xl w-full animate-fade-in"
              style={{
                background: 'rgba(239,68,68,0.05)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <i className="ri-error-warning-line text-sm shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
              <p className="text-[10.5px] text-left leading-normal font-medium" style={{ color: '#991b1b', fontFamily: 'var(--font-map-ui)' }}>
                {t('map.location_gate_denied')}
              </p>
            </div>
          )}

          {/* Botón único */}
          <div className="flex w-full pt-2">
            <GameButton
              variant="tan"
              className="h-12 w-full text-[11px]"
              onClick={() => onGranted()}
            >
              {t('map.location_gate_understood')}
            </GameButton>
          </div>

        </div>
      </div>
    </div>
  )
}
