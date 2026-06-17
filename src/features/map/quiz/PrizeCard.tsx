import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ClaimedPrize } from '../types/quiz.types'
import Ranking from './Ranking'
import GameButton from './GameButton'

const CONFETTI_COLORS = ['#fcd34d', '#a87f2a', '#ebdcc3', '#321e0f', '#c7a361']

interface Props {
  prize: ClaimedPrize
  monumentImage: string
  stopIndex: number
  onContinue: () => void
}

export default function PrizeCard({ prize, monumentImage, stopIndex, onContinue }: Props) {
  const { t, i18n } = useTranslation()
  const [showRanking, setShowRanking] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleDownload = () => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(prize.code)}&color=50-30-15`
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        const url = canvas.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = url
        a.download = `qr-turizoneando-${prize.code}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(prize.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const bannerImage = prize.prizeImageUrl || monumentImage

  return (
    <div
      className="fixed inset-0 z-999 flex flex-col items-center justify-between w-full h-full p-4 overflow-hidden"
      style={{
        backgroundImage: "url('/assets/img/fonto_textura.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Confetti pantalla completa */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {Array.from({ length: 50 }).map((_, i) => {
          const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
          const isRound = i % 2 === 0
          const size = `${(3 + (i * 2) % 7)}px`
          return (
            <div
              key={i}
              className="absolute pointer-events-none"
              style={{
                left: `${(i * 7) % 100}%`,
                top: '-15px',
                width: size,
                height: isRound ? size : `${parseInt(size) * 1.5}px`,
                backgroundColor: color,
                borderRadius: isRound ? '50%' : '1.5px',
                opacity: 0.85,
                animation: `confettiFall ${(2.5 + (i * 0.4) % 4).toFixed(2)}s linear infinite`,
                animationDelay: `${((i * 0.15) % 3.5).toFixed(2)}s`,
              }}
            />
          )
        })}
      </div>

      {/* X para salir */}
      <button
        onClick={onContinue}
        className="absolute top-6 right-6 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-map-wood-dark/80 text-map-cream-light hover:bg-map-wood-dark active:scale-95 transition-all shadow-md"
      >
        <i className="ri-close-line text-lg" />
      </button>

      <div className="flex-1 flex-col flex items-center justify-center w-full gap-4">
        <p className="text-2xl text-map-wood-dark font-medium uppercase">{t('map.congrats')}</p>

        {/* Ticket */}
        <div className="relative w-full max-w-[360px] bg-map-cream-light rounded-md shadow-xl flex flex-col overflow-hidden">

          {/* Banner image */}
          <div className="w-full h-65 relative">
            <img src={bannerImage} alt={prize.prizeName} className="w-full h-full object-cover" />
            <div className="absolute -bottom-1 left-0 right-0 h-50 bg-linear-to-t from-map-cream-light via-map-cream-light/20 to-transparent" />
            <div className="absolute top-0 left-0 right-0 h-30 bg-linear-to-b from-black/70 via-black/30 to-transparent" />
            <div className="absolute top-4 left-4 flex flex-col gap-0.5">
              <p className="text-[12px] text-map-gold-light font-black uppercase tracking-widest" style={{ textShadow: '0 1px 6px rgba(0,0,0,1)' }}>{t('map.prize_label')}</p>
              <h2 className="text-lg font-black text-white tracking-wide leading-tight max-w-[220px]" style={{ textShadow: '0 2px 8px rgba(0,0,0,1)' }}>
                {prize.prizeName || t('map.prize_label')}
              </h2>
            </div>
          </div>

          {/* Notch 1 */}
          <div className="relative w-full flex items-center justify-between px-5 my-1 shrink-0">
            <div className="absolute left-[-12px] w-6 h-6 rounded-full bg-cover bg-center z-20 shadow-[inset_-3px_0_4px_rgba(0,0,0,0.1)]" style={{ backgroundImage: "url('/assets/img/fonto_textura.jpg')" }} />
            <div className="absolute right-[-12px] w-6 h-6 rounded-full bg-cover bg-center z-20 shadow-[inset_3px_0_4px_rgba(0,0,0,0.1)]" style={{ backgroundImage: "url('/assets/img/fonto_textura.jpg')" }} />
            {/* <div className="w-full border-t border-dashed border-map-gold/30" /> */}
          </div>

          {/* QR + código */}
          <div className=" w-full px-6 py-4 flex flex-row items-center justify-center gap-6  shrink-0">
            <div className="flex w-full items-center justify-center gap-5 p-4 border border-map-gold/30 rounded bg-white shadow-sm">
              {prize.code ? (
                <>
                  <div className="flex w-full flex-col items-center gap-1">
                    <p className="text-[11px] mb-2 text-map-gold font-semibold block uppercase">{t('map.redeem_code')}</p>
                    <span className="font-mono text-5xl font-bold text-map-wood-dark">{prize.code}</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2 px-4 w-full">
                  <i className="ri-error-warning-line text-3xl text-map-gold/60" />
                  <p className="text-[12px] text-map-wood-dark/60 text-center">
                    {t('map.prize_no_code_msg1')}
                    <br />{t('map.prize_no_code_msg2')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notch 2 */}
          <div className="relative w-full flex items-center justify-between px-5 my-1 shrink-0">
            <div className="absolute left-[-12px] w-6 h-6 rounded-full bg-cover bg-center z-20 shadow-[inset_-3px_0_4px_rgba(0,0,0,0.1)]" style={{ backgroundImage: "url('/assets/img/fonto_textura.jpg')" }} />
            <div className="absolute right-[-12px] w-6 h-6 rounded-full bg-cover bg-center z-20 shadow-[inset_3px_0_4px_rgba(0,0,0,0.1)]" style={{ backgroundImage: "url('/assets/img/fonto_textura.jpg')" }} />
            {/* <div className="w-full border-t border-dashed border-map-gold/30" /> */}
          </div>

          {/* Footer del ticket */}
          <div className="px-5 py-3 w-full flex items-center justify-between shrink-0 bg-map-cream/15 mt-5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-map-wood-dark/45 font-semibold uppercase tracking-wider">{t('map.valid_label')}</span>
              <span className="text-[13px] font-bold text-map-wood-dark">
                {new Date().toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, transparent, #a87f2a55, transparent)' }} />
            <div className="flex flex-col gap-0.5 items-center">
              <span className="text-[9px] text-map-wood-dark/45 font-semibold uppercase tracking-wider">{t('map.stage_badge')}</span>
              <span className="text-[13px] font-bold text-map-wood-dark">{Math.floor(stopIndex / 4) + 1}</span>
            </div>
            <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, transparent, #a87f2a55, transparent)' }} />
            <div className="flex flex-col gap-0.5 items-center">
              <span className="text-[9px] text-map-wood-dark/45 font-semibold uppercase tracking-wider">{t('map.stop_short')}</span>
              <span className="text-[13px] font-bold text-map-wood-dark">{(stopIndex % 4) + 1}</span>
            </div>
            <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, transparent, #a87f2a55, transparent)' }} />
            <img src="/assets/img/logo1.png" className="w-13 h-13" />
          </div>
        </div>

        {/* Botones justo bajo la card */}
        <div className="w-full max-w-[360px] flex flex-row gap-2 mt-5">
          {prize.code && (
            <>
              <GameButton variant="tan" className="flex-1 h-12 text-[10px]" onClick={handleDownload}>
                <i className="ri-download-2-line text-sm mr-1.5" />
                {t('map.download')}
              </GameButton>
              <GameButton variant="tan" className="flex-1 h-12 text-[10px]" onClick={handleCopy}>
                <i className={copied ? 'ri-check-line text-sm mr-1.5' : 'ri-file-copy-line text-sm mr-1.5'} />
                {copied ? t('map.copied') : t('map.copy')}
              </GameButton>
            </>
          )}
          <GameButton variant="dark" className="flex-1 h-12 text-[10px] rounded-md" onClick={() => setShowRanking(true)}>
            <i className="ri-trophy-line text-sm mr-1.5" />
            Ranking
          </GameButton>
        </div>
      </div>

      {showRanking && (
        <Ranking onClose={() => setShowRanking(false)} onContinue={onContinue} />
      )}
    </div>
  )
}
