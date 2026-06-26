import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAudioPlayer } from './useAudioPlayer'

interface Props {
  text: string
  audioUrl?: string
  onContinue: () => void
}

const NARRATION_DURATION = 28

export default function WelcomeCard({ text, audioUrl, onContinue }: Props) {
  const { i18n } = useTranslation()
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es'
  const words = text.split(' ')

  const { playing, progress, muted, handleToggle, handleMute } = useAudioPlayer({
    audioUrl,
    duration: NARRATION_DURATION,
  })

  const scrollRef = useRef<HTMLDivElement>(null)
  const isIPhone = typeof window !== 'undefined' && /iPhone|iPod/i.test(navigator.userAgent)

  useEffect(() => {
    const el = scrollRef.current
    if (!el || progress <= 0) return
    const scrollHeight = el.scrollHeight - el.clientHeight
    if (scrollHeight > 0) {
      el.scrollTo({ top: progress * scrollHeight, behavior: 'smooth' })
    }
  }, [progress])

  const litWords = Math.floor(progress * words.length)
  const done = progress >= 1

  return (
    <div
      className="fixed inset-0 z-999 flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.52)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        padding: '0 16px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: '#ffffff',
        borderRadius: 22,
        overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,0.28), 0 4px 16px rgba(9,109,125,0.1)',
        position: 'relative',
      }}>

        {/* ── Zona imagen ── */}
        <div style={{ position: 'relative', height: 210, overflow: 'hidden', padding: 8 }}>
          <img
            src="/assets/img/cityZone.webp"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 50%', display: 'block', borderRadius: 16 }}
          />

          {/* Overlay izquierda → derecha */}
          <div style={{ position: 'absolute', inset: 8, borderRadius: 16, background: 'linear-gradient(to right, rgba(7,95,110,0.78) 0%, rgba(7,95,110,0.32) 42%, transparent 68%)', zIndex: 2, pointerEvents: 'none' }} />

          {/* Turi */}
          <div style={{ position: 'absolute', bottom: 4, left: '67%', transform: 'translateX(-50%)', width: 220, zIndex: 3 }}>
            {isIPhone ? (
              <img
                src="/assets/img/turiguaia_animated.webp"
                alt="Turi"
                style={{ width: '100%', display: 'block' }}
              />
            ) : (
              <video autoPlay loop muted playsInline style={{ width: '100%', display: 'block' }}>
                <source src="/assets/img/turiguaia.webm" type="video/webm" />
              </video>
            )}
          </div>

          {/* Botón mute — arriba izquierda */}
          <button
            onClick={handleMute}
            style={{
              position: 'absolute', top: 18, left: 18, zIndex: 10,
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.92)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.22)',
              color: '#096d7d', fontSize: 16, flexShrink: 0,
            }}
          >
            <i className={muted ? 'ri-volume-mute-fill' : 'ri-volume-up-fill'} />
          </button>

          {/* Botón Saltar — arriba derecha */}
          <button
            onClick={onContinue}
            style={{
              position: 'absolute', top: 18, right: 18, zIndex: 10,
              height: 32, paddingLeft: 12, paddingRight: 12, borderRadius: 9999,
              background: 'rgba(255,255,255,0.92)', border: 'none',
              display: 'flex', alignItems: 'center', gap: 5,
              cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.22)',
              color: '#096d7d', fontSize: 12, fontWeight: 700,
            }}
          >
            {lang === 'en' ? 'Skip' : 'Saltar'}
            <i className="ri-skip-forward-line" style={{ fontSize: 13 }} />
          </button>
        </div>

        {/* ── Zona blanca: texto + botón ── */}
        <div style={{ background: '#fff', padding: '14px 18px 18px' }}>

          {/* Burbuja con texto animado */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <div style={{ position: 'absolute', top: -9, left: 24, width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '10px solid #e6f9f8' }} />
            <div
              ref={scrollRef}
              style={{
                background: '#e6f9f8',
                border: '1.5px solid rgba(0,187,180,0.2)',
                borderRadius: 14,
                padding: '11px 14px',
                boxShadow: '0 3px 12px rgba(0,187,180,0.1)',
                maxHeight: 130,
                overflowY: 'auto',
                scrollbarWidth: 'none',
              }}
            >
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7 }} lang={lang}>
                {words.map((word, i) => {
                  const isLit = i < litWords
                  const isCurrent = isLit && i >= litWords - 3
                  return (
                    <span
                      key={i}
                      className="transition-all duration-200"
                      style={{
                        fontWeight: isLit ? 700 : 400,
                        color: isLit ? '#096d7d' : 'rgba(9,109,125,0.55)',
                        background: isCurrent ? 'rgba(0,187,180,0.22)' : 'transparent',
                        borderRadius: isCurrent ? 4 : 0,
                        padding: isCurrent ? '0 2px' : '0',
                      }}
                    >
                      {word}{' '}
                    </span>
                  )
                })}
              </p>
            </div>
          </div>

          {/* Botón principal */}
          <button
            onClick={done ? onContinue : handleToggle}
            className="active:translate-y-[4px] transition-all"
            style={{
              width: '100%',
              height: 50,
              borderRadius: 9999,
              border: done ? '2px solid #d46f2b' : '2px solid #0c7f89',
              background: done
                ? 'linear-gradient(180deg,#ffb06f 0%,#ff9447 45%,#e07830 100%)'
                : 'linear-gradient(180deg,#18d5cd 0%,#00bbb4 45%,#096d7d 100%)',
              boxShadow: done
                ? 'inset 0 2px 0 rgba(255,255,255,.35), 0 6px 0 #b85e1c, 0 12px 22px rgba(255,148,71,.45)'
                : 'inset 0 2px 0 rgba(255,255,255,.35), 0 6px 0 #054f5c, 0 12px 22px rgba(9,109,125,.38)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            {done ? (
              <>
                <i className="ri-arrow-right-circle-fill" style={{ fontSize: 20 }} />
                <span>{lang === 'en' ? 'Start!' : '¡Empezar!'}</span>
              </>
            ) : playing ? (
              <>
                <i className="ri-pause-circle-fill" style={{ fontSize: 20 }} />
                <span>{lang === 'en' ? 'Narrating' : 'Narrando'}</span>
                <span className="flex items-center gap-[3px] ml-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '160ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '320ms' }} />
                </span>
              </>
            ) : (
              <>
                <i className="ri-play-circle-fill" style={{ fontSize: 20 }} />
                <span>{lang === 'en' ? 'Listen' : 'Escuchar'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
