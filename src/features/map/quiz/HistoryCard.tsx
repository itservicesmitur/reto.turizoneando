import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAudioPlayer } from './useAudioPlayer'

interface Props {
  stopIndex: number
  narration: string
  audioUrl?: string
  monumentName: string
  monumentImage: string
  isMuted?: boolean
  onClose: () => void
  onContinue: () => void
}

const NARRATION_DURATION = 22

export default function HistoryCard({ stopIndex, narration, audioUrl, monumentName, monumentImage, isMuted, onClose, onContinue }: Props) {
  const { t } = useTranslation()
  const words = narration.split(' ')

  const { playing, progress, muted, handleToggle, handleMute } = useAudioPlayer({
    audioUrl,
    duration: NARRATION_DURATION,
    initialMuted: isMuted,
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
  const done = progress >= 1

  return (
    <div
      className="fixed inset-0 z-999 flex flex-col animate-card-boing"
      style={{ background: 'linear-gradient(to bottom, #075f6e 0%, #00bbb4 100%)' }}
    >

      {/* ── NAV BAR ── */}
      <div className="shrink-0 flex items-center justify-between px-5 pt-7 pb-5">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: 'rgba(255,255,255,0.18)' }}
        >
          <i className="ri-arrow-left-line text-xl text-white" />
        </button>

        <span className="font-bold text-white text-base tracking-wide">
          {t('map.stop_label', { n: stopIndex + 1 })}
        </span>

        <button
          onClick={handleMute}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: 'rgba(255,255,255,0.18)' }}
        >
          <i className={`text-xl text-white ${muted ? 'ri-volume-mute-fill' : 'ri-volume-up-fill'}`} />
        </button>
      </div>

      {/* ── CARD UNIFICADA: imagen + historia ── */}
      <div
        className="flex-1 h-full mx-3 rounded-3xl overflow-hidden flex flex-col bg-accent-red"
        style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.32)', background: '#ffffff', marginBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Imagen */}
        <img
          src={monumentImage || undefined}
          alt={monumentName}
          className="shrink-0 w-full object-cover rounded-3xl p-2 "
          style={{ height: 200 }}
        />

        {/* Nombre */}
        <div className="shrink-0 px-5 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(9,109,125,0.08)' }}>
          <h2 className="font-black text-xl leading-tight text-center" style={{ color: '#096d7d' }}>
            {monumentName}
          </h2>
        </div>

        {/* Historia scroll */}
        <div className="relative flex-1 min-h-0">
          <div
            ref={scrollRef}
            className="absolute inset-0 overflow-y-auto px-5 pt-4 pb-6"
            style={{ scrollbarWidth: 'none' }}
          >
            <p className="leading-[1.9] text-[16px] text-justify hyphens-auto" lang="es">
              {words.map((word, i) => {
                const isLit     = i < litWords
                const isCurrent = isLit && i >= litWords - 3
                return (
                  <span
                    key={i}
                    className="transition-all duration-200"
                    style={{
                      fontWeight: isLit ? 700 : 400,
                      color: isLit ? '#096d7d' : 'rgba(55,65,81,0.35)',
                      background: isCurrent ? 'rgba(0,187,180,0.18)' : 'transparent',
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
          {/* Degradado fade bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent, #ffffff)' }}
          />
        </div>

        {/* ── FOOTER dentro de la card ── */}
        <div className="shrink-0 flex items-center gap-3 px-5 pt-3" style={{ borderTop: '1px solid rgba(9,109,125,0.08)', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}>

        {/* Saltar — cream 3D */}
        <button
          onClick={onContinue}
          className="flex items-center justify-center px-5 rounded-[18px] text-sm font-black active:translate-y-[4px] transition-all"
          style={{
            height: 56,
            background: 'linear-gradient(180deg,#f2ead6 0%,#e5dcc6 100%)',
            color: '#8b6f47',
            border: '2px solid #c9bc9e',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,.7), 0 6px 0 #b8a87e, 0 10px 18px rgba(0,0,0,.12)',
          }}
        >
          <span>{t('map.skip')}</span>
        </button>

        {/* Main action — teal / orange 3D */}
        <button
          onClick={done ? onContinue : handleToggle}
          className="flex-1 rounded-[18px] text-base font-black text-white flex items-center justify-center gap-2 active:translate-y-[4px] transition-all"
          style={
            done
              ? {
                  height: 56,
                  background: 'linear-gradient(180deg,#ffb06f 0%,#ff9447 45%,#e07830 100%)',
                  border: '2px solid #d46f2b',
                  boxShadow: 'inset 0 2px 0 rgba(255,255,255,.35), 0 6px 0 #b85e1c, 0 12px 22px rgba(255,148,71,.45)',
                }
              : {
                  height: 56,
                  background: 'linear-gradient(180deg,#18d5cd 0%,#00bbb4 45%,#096d7d 100%)',
                  border: '2px solid #0c7f89',
                  boxShadow: 'inset 0 2px 0 rgba(255,255,255,.35), 0 6px 0 #054f5c, 0 12px 22px rgba(9,109,125,.38)',
                }
          }
        >
          {done ? (
            <>
              <i className="ri-arrow-right-circle-fill text-xl" />
              <span>{t('map.continue')}</span>
            </>
          ) : playing ? (
            <>
              <i className="ri-pause-circle-fill text-xl" />
              <span>{t('map.narrating')}</span>
              <span className="flex items-center gap-[3px] ml-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '160ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '320ms' }} />
              </span>
            </>
          ) : (
            <>
              <i className="ri-play-circle-fill text-xl" />
              <span>{t('map.tour_listen')}</span>
            </>
          )}
        </button>
        </div>
      </div>
    </div>
  )
}
