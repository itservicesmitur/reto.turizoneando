import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAudioPlayer } from './useAudioPlayer'
import mascotImg from '../../../assets/mascota.png'

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

  useEffect(() => {
    const el = scrollRef.current
    if (!el || progress <= 0) return
    const scrollHeight = el.scrollHeight - el.clientHeight
    if (scrollHeight > 0) {
      el.scrollTo({ top: progress * scrollHeight, behavior: 'smooth' })
    }
  }, [progress])

  const litWords = Math.floor(progress * words.length)
  const done     = progress >= 1

  return (
    <div
      className="fixed inset-0 z-999 flex flex-col justify-end"
      style={{ background: 'rgba(5,18,50,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
    >
      {/* ── Controles + mascota flotando sobre la card ── */}
      <div className="shrink-0 flex items-end justify-between px-5 pb-0" style={{ height: 100 }}>
        <button
          onClick={handleMute}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform mb-3"
          style={{ background: 'rgba(255,255,255,0.92)', boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}
        >
          <i className={`text-lg ${muted ? 'ri-volume-mute-fill' : 'ri-volume-up-fill'}`} style={{ color: '#096d7d' }} />
        </button>

        {/* Mascota centrada */}
        <img
          src={mascotImg}
          alt="Mascota Turizoneando"
          style={{
            height: 100,
            objectFit: 'contain',
            filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.45))',
            marginBottom: -22,
            zIndex: 10,
            position: 'relative',
          }}
        />

        <button
          onClick={onContinue}
          className="flex items-center gap-1 px-3 h-8 rounded-full active:scale-95 transition-transform text-xs font-bold mb-3"
          style={{ background: 'rgba(255,255,255,0.92)', color: '#096d7d', boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}
        >
          {lang === 'en' ? 'Skip' : 'Saltar'}
          <i className="ri-skip-forward-line text-sm" />
        </button>
      </div>

      {/* ── CARD bottom-sheet ── */}
      <div
        className="mx-3 rounded-3xl overflow-hidden flex flex-col animate-card-boing"
        style={{
          background: '#ffffff',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.28)',
          marginBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
          flex: 1,
        }}
      >
        {/* ── HEADER compacto ── */}
        <div
          className="shrink-0 pt-6 pb-4 px-6 text-center"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,187,180,0.07), transparent)',
            borderBottom: '1.5px solid rgba(9,109,125,0.08)',
          }}
        >
          {/* Pill badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-2"
            style={{ background: 'linear-gradient(135deg,#f5c800,#ffb300)', boxShadow: '0 3px 10px rgba(245,200,0,0.4)' }}
          >
            <i className="ri-map-2-fill" style={{ fontSize: 11, color: '#1b2b6e' }} />
            <span style={{ fontSize: 10, fontWeight: 900, color: '#1b2b6e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Turizoneando
            </span>
          </div>

          <h2 className="font-black leading-tight m-0" style={{ color: '#096d7d', fontSize: 17 }}>
            {lang === 'en'
              ? 'Ready to explore the Colonial City?'
              : '¿Listo para explorar la Ciudad Colonial?'}
          </h2>
        </div>

        {/* ── TEXTO NARRADO ── */}
        <div className="relative flex-1 min-h-0">
          <div
            ref={scrollRef}
            className="absolute inset-0 overflow-y-auto px-5 pt-4 pb-6"
            style={{ scrollbarWidth: 'none' }}
          >
            <p className="leading-[2] text-[15px] text-justify hyphens-auto" lang={lang}>
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
          <div
            className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent, #ffffff)' }}
          />
        </div>

        {/* ── FOOTER ── */}
        <div
          className="shrink-0 px-5 pt-3"
          style={{
            borderTop: '1.5px solid rgba(9,109,125,0.08)',
            paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <button
            onClick={done ? onContinue : handleToggle}
            className="w-full rounded-[18px] text-base font-black text-white flex items-center justify-center gap-2 active:translate-y-[4px] transition-all"
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
                <span>{lang === 'en' ? 'Start!' : '¡Empezar!'}</span>
              </>
            ) : playing ? (
              <>
                <i className="ri-pause-circle-fill text-xl" />
                <span>{lang === 'en' ? 'Narrating' : 'Narrando'}</span>
                <span className="flex items-center gap-[3px] ml-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '160ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '320ms' }} />
                </span>
              </>
            ) : (
              <>
                <i className="ri-play-circle-fill text-xl" />
                <span>{lang === 'en' ? 'Listen' : 'Escuchar'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
