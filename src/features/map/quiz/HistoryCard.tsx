import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAudioPlayer } from './useAudioPlayer'
import GameButton from './GameButton'

interface Props {
  stopIndex: number
  narration: string
  audioUrl?: string
  monumentName: string
  monumentImage: string
  onSkip: () => void
  onContinue: () => void
}

const NARRATION_DURATION = 22

export default function HistoryCard({ stopIndex, narration, audioUrl, monumentName, monumentImage, onSkip, onContinue }: Props) {
  const { t } = useTranslation()
  const words = narration.split(' ')

  const { playing, progress, handleToggle } = useAudioPlayer({
    audioUrl,
    duration: NARRATION_DURATION,
  })

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el || progress <= 0) return
    const scrollHeight = el.scrollHeight - el.clientHeight
    if (scrollHeight > 0) {
      el.scrollTo({ top: progress * scrollHeight, behavior: 'smooth' })
    }
  }, [progress])

  const litWords = Math.floor(progress * words.length)

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/50 backdrop-blur-xs p-0">
      <div
        className="relative w-full h-full flex flex-col overflow-hidden quiz-card-enter rounded-none"
        style={{
          backgroundImage: "linear-gradient(rgba(235,220,195,0.58), rgba(235,220,195,0.58)), url('/assets/img/fonto_textura.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '8px solid var(--color-map-wood-dark)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.5), inset 0 0 0 2px var(--color-map-gold), inset 0 0 16px rgba(0,0,0,0.5)'
        }}
      >
        {/* Metal Decorative Corners */}
        <svg className="absolute -top-px -left-px w-9 h-9 pointer-events-none z-30 text-map-gold-light" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 20V3h17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11c3 0 8-5 8-8M3 7c1.5 0 4-2.5 4-4" strokeLinecap="round" />
          <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <svg className="absolute -top-px -right-px w-9 h-9 pointer-events-none z-30 text-map-gold-light transform scale-x-[-1]" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 20V3h17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11c3 0 8-5 8-8M3 7c1.5 0 4-2.5 4-4" strokeLinecap="round" />
          <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <svg className="absolute -bottom-px -left-px w-9 h-9 pointer-events-none z-30 text-map-gold-light transform scale-y-[-1]" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 20V3h17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11c3 0 8-5 8-8M3 7c1.5 0 4-2.5 4-4" strokeLinecap="round" />
          <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <svg className="absolute -bottom-px -right-px w-9 h-9 pointer-events-none z-30 text-map-gold-light transform scale-[-1]" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 20V3h17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11c3 0 8-5 8-8M3 7c1.5 0 4-2.5 4-4" strokeLinecap="round" />
          <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
        </svg>

        {/* Center Clasps */}
        <svg className="absolute -top-px left-1/2 -translate-x-1/2 w-14 h-6 pointer-events-none z-30 text-map-gold-light" viewBox="0 0 56 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3h32M16 3c4 4 8 7 12 7s8-3 12-7" strokeLinecap="round" />
          <circle cx="28" cy="3" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <svg className="absolute -bottom-px left-1/2 -translate-x-1/2 w-14 h-6 pointer-events-none z-30 text-map-gold-light transform scale-y-[-1]" viewBox="0 0 56 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3h32M16 3c4 4 8 7 12 7s8-3 12-7" strokeLinecap="round" />
          <circle cx="28" cy="3" r="1.2" fill="currentColor" stroke="none" />
        </svg>

        {/* TOP STRIPE */}
        <div
          className="h-1.5 shrink-0 z-30"
          style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold-light),var(--color-map-gold),var(--color-map-gold-light),transparent)' }}
        />

        {/* ── HERO ── */}
        <div className="relative h-[180px] shrink-0 z-10">
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={monumentImage}
              alt={monumentName}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${playing ? 'film-flicker' : ''}`}
              style={{ filter: playing ? 'sepia(0.65) contrast(1.12) brightness(0.82) saturate(0.45)' : 'sepia(0.45) contrast(1.06) brightness(0.88) saturate(0.55)' }}
            />

            {playing && (
              <>
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.16, mixBlendMode: 'overlay' }} preserveAspectRatio="xMidYMid slice">
                  <filter id={`grain-hc${stopIndex}`}>
                    <feTurbulence type="fractalNoise" baseFrequency="0.70" numOctaves="4" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                  </filter>
                  <rect width="100%" height="100%" filter={`url(#grain-hc${stopIndex})`} />
                </svg>
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center,transparent 28%,rgba(0,0,0,0.52) 100%)' }} />
                {[13, 47, 76].map(y => (
                  <div key={y} className="absolute w-full pointer-events-none" style={{ top: `${y}%`, height: 1, background: 'rgba(255,255,240,0.08)' }} />
                ))}
                <div className="absolute top-0 bottom-0 pointer-events-none film-scratch-v" style={{ left: '37%', width: 1, background: 'rgba(255,255,240,0.5)' }} />
                <div className="absolute top-0 bottom-0 pointer-events-none film-scratch-v" style={{ left: '72%', width: 1, background: 'rgba(255,255,240,0.35)', animationDelay: '2.1s' }} />
                {[
                  { l: '18%', t: '42%', d: '0s'   },
                  { l: '44%', t: '58%', d: '0.8s'  },
                  { l: '67%', t: '26%', d: '1.4s'  },
                  { l: '82%', t: '64%', d: '0.3s'  },
                  { l: '30%', t: '74%', d: '1.9s'  },
                  { l: '56%', t: '16%', d: '2.2s'  },
                ].map((p, i) => (
                  <div key={i} className="absolute rounded-full pointer-events-none film-dust"
                    style={{ left: p.l, top: p.t, width: 2, height: 2, background: 'rgba(255,248,220,0.9)', animationDelay: p.d }} />
                ))}
              </>
            )}
          </div>

          <div
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: 'calc(100% + 52px)',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.04) 36%, rgba(235,220,195,0.55) 55%, rgba(235,220,195,0.90) 72%, rgba(235,220,195,0.98) 82%, transparent 100%)',
            }}
          />

          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{ background: 'radial-gradient(ellipse 62% 58% at 50% 44%, rgba(0,0,0,0.42) 0%, transparent 72%)' }}
          />
        </div>

        {/* ── CONTENIDO ── */}
        <div className="flex-1 min-h-0 overflow-hidden px-4 pb-2 flex flex-col gap-4">
          <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
            <defs>
              <filter id="torn-paper">
                <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
          </svg>

          <div className="relative px-6 pb-6 pt-10 parchment-unfurl flex-1 min-h-0" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div
              className="absolute inset-x-0 bottom-0 z-0"
              style={{
                top: '-16px',
                background: 'linear-gradient(to bottom, rgba(250,246,235,0) 0%, rgba(250,246,235,0) 16px, rgba(250,246,235,0.7) 28px, var(--color-map-cream-light) 44px)',
                boxShadow: '0 8px 24px rgba(80,48,25,0.12), inset 0 0 20px rgba(168,127,42,0.05)',
                filter: 'url(#torn-paper)',
                clipPath: 'polygon(0% 16px, 100% 16px, 100% 110%, 0% 110%)'
              }}
            />

            <div className="relative z-10 flex flex-col min-h-0 flex-1">
              <svg className="absolute bottom-2 left-2 w-7 h-7 pointer-events-none text-map-gold opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 14v8h8M4 18v-2h2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <svg className="absolute bottom-2 right-2 w-7 h-7 pointer-events-none text-map-gold opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 14v8h-8M20 18v-2h-2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>

              <div className="shrink-0">
                <div className="flex flex-col items-center gap-4">
                  <p className='font-bold mb-4 text-xs tracking-wider' style={{ color: 'var(--color-map-wood-dark)', fontFamily: 'var(--font-map-parchment)' }}>{t('map.stop_label', { n: stopIndex + 1 })}</p>
                  <h2
                    className="text-center font-black uppercase tracking-widest text-lg mb-3"
                    style={{ color: 'var(--color-map-gold)', fontFamily: 'var(--font-map-parchment)', textShadow: '0 1px 3px rgba(0,0,0,0.18)' }}
                  >
                    {monumentName}
                  </h2>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, var(--color-map-gold))' }} />
                  <i className="ri-shield-line text-xs animate-pulse" style={{ color: 'rgba(168,127,42,0.5)' }} />
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, var(--color-map-gold))' }} />
                </div>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 min-h-0 overflow-y-auto pb-10"
                style={{ scrollbarWidth: 'none' }}
              >
                <p className="leading-[1.9] hc-scroll" style={{ fontFamily: 'var(--font-map-parchment)', fontSize: '16px' }}>
                  {words.map((word, i) => {
                    const isLit = i < litWords
                    const isCurrent = isLit && i >= litWords - 3
                    return (
                      <span
                        key={i}
                        className="transition-all duration-200"
                        style={{
                          color: isLit ? 'var(--color-map-wood-dark)' : 'rgba(50,30,15,0.35)',
                          fontWeight: isLit ? 600 : 400,
                          background: isCurrent ? 'rgba(252,211,77,0.4)' : 'transparent',
                          borderRadius: isCurrent ? 3 : 0,
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
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div
          className="shrink-0 p-4 flex gap-3"
          style={{ background: 'transparent', borderTop: '1px solid rgba(168,127,42,0.22)' }}
        >
          <GameButton variant="tan" className="w-28 h-16 text-xs" onClick={onSkip}>
            {t('map.skip')}
          </GameButton>

          <GameButton
            variant="dark"
            className="flex-1 h-16 text-base"
            onClick={progress >= 1 ? onContinue : handleToggle}
          >
            {progress < 1 && <i className={`${playing ? 'ri-pause-fill' : 'ri-play-circle-line'} text-xl mr-2`} />}
            {progress >= 1 ? t('map.continue') : playing ? t('map.narrating') : t('map.narration')}
          </GameButton>
        </div>

        {/* BOTTOM STRIPE */}
        <div
          className="h-1.5 shrink-0 z-30"
          style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold-light),var(--color-map-gold),var(--color-map-gold-light),transparent)' }}
        />
      </div>
    </div>
  )
}
