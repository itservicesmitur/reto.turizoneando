import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { STOP_QUIZ_DATA } from '../data/quizData'
import Ranking from './Ranking'
import GameButton from './GameButton'


const BUSINESS_ADDRESSES = [
  'Calle La Atarazana #9, Ciudad Colonial',
  'Plaza de España, Ciudad Colonial',
  'Calle Las Damas, Ciudad Colonial',
  'Calle Las Damas #102, Ciudad Colonial',
  'Calle Las Damas, Ciudad Colonial',
  'Calle El Conde #101, Ciudad Colonial',
  'Calle Isabel La Católica, Ciudad Colonial',
  'Calle Isabel La Católica #103, Ciudad Colonial',
  'Calle El Conde (Frente a Parque Colón)',
  'Calle Hostos, Ruinas de San Francisco',
  'Calle Palo Hincado, Ciudad Colonial',
  'Calle El Conde, Ciudad Colonial'
]

const CONFETTI_COLORS = ['#fcd34d', '#a87f2a', '#ebdcc3', '#321e0f', '#c7a361']

interface Props {
  stopIndex: number
  monumentImage: string
  onContinue: () => void
}

export default function PrizeCard({ stopIndex, monumentImage, onContinue }: Props) {
  const { t } = useTranslation()
  const [showRanking, setShowRanking] = useState(false)
  const [copied, setCopied] = useState(false)
  const { prize } = STOP_QUIZ_DATA[stopIndex]
  const isLastStop = stopIndex === 11

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

  return (
    <div
      className="fixed inset-0 z-999 flex flex-col items-center justify-between w-full h-full p-4 overflow-hidden"
      style={{
        backgroundImage: "url('/assets/img/fonto_textura.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Spacer to push card to center */}
      <div className="flex-1 flex-col flex items-center justify-center w-full gap-6">
        <p className="text-2xl text-map-wood-dark font-medium uppercase">{t('map.congrats')}</p>

        {/* Ticket Container */}
        <div className="relative w-full max-w-[360px] bg-map-cream-light rounded-md shadow-xl flex flex-col overflow-hidden">

          {/* Confetti */}
          <div className="absolute top-0 left-0 right-0 h-[280px] pointer-events-none overflow-hidden z-20 rounded-t-md">
            {Array.from({ length: 35 }).map((_, i) => {
              const left = `${(i * 9) % 100}%`
              const delay = `${((i * 0.18) % 3).toFixed(2)}s`
              const duration = `${(2.5 + (i * 0.5) % 3.5).toFixed(2)}s`
              const size = `${(3 + (i * 2) % 6)}px`
              const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
              const isRound = i % 2 === 0
              return (
                <div
                  key={i}
                  className="absolute pointer-events-none"
                  style={{
                    left,
                    top: '-15px',
                    width: size,
                    height: isRound ? size : `${parseInt(size) * 1.5}px`,
                    backgroundColor: color,
                    borderRadius: isRound ? '50%' : '1.5px',
                    opacity: 0.75,
                    animation: `confettiFall ${duration} linear infinite`,
                    animationDelay: delay,
                  }}
                />
              )
            })}
          </div>

          {/* Top Banner Image */}
          <div className="w-full h-40 overflow-hidden relative">
            <img src={monumentImage} alt={prize.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-black/10" />
            <div className="absolute bottom-0 left-0 right-0 h-14 bg-linear-to-t from-map-cream-light via-map-cream-light/70 to-map-cream-light/0" />
          </div>

          {/* Ticket Header */}
          <div className="p-5 flex flex-col items-center text-center relative z-10 bg-map-cream-light -mt-1 mb-3">
            <p className="text-lg text-map-gold font-medium uppercase mb-1">{t('map.prize_label')}</p>
            <h2 className="text-xl font-bold text-map-wood-dark tracking-wide leading-tight">
              {prize.name}
            </h2>
          </div>

          {/* Notch Dashed Line 1 */}
          <div className="relative w-full flex items-center justify-between px-5 my-1 shrink-0">
            <div
              className="absolute left-[-12px] w-6 h-6 rounded-full bg-cover bg-center z-20 shadow-[inset_-3px_0_4px_rgba(0,0,0,0.1)]"
              style={{ backgroundImage: "url('/assets/img/fonto_textura.jpg')" }}
            />
            <div
              className="absolute right-[-12px] w-6 h-6 rounded-full bg-cover bg-center z-20 shadow-[inset_3px_0_4px_rgba(0,0,0,0.1)]"
              style={{ backgroundImage: "url('/assets/img/fonto_textura.jpg')" }}
            />
            <div className="w-full border-t border-dashed border-map-gold/30" />
          </div>

          {/* QR Code Area */}
          <div className="px-6 py-4 flex flex-row items-center justify-center gap-6 w-full shrink-0">
            <div className='flex items-center justify-center gap-5 p-4 border border-map-gold/30 rounded bg-white shadow-sm'>
              <div className="relative p-2.5 flex items-center justify-center shrink-0 shadow-md">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(prize.code)}&color=50-30-15`}
                  alt="QR Code"
                  className="w-14 h-14"
                />
              </div>

              <div className="flex w-full flex-col items-start gap-1">
                <p className='text-[11px] text-map-gold font-semibold block uppercase'>{t('map.redeem_code')}</p>
                <span className="font-mono text-2xl font-bold text-map-wood-dark">{prize.code}</span>
                <div className='flex gap-2 mt-1'>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-map-cream-light/40 hover:bg-map-cream border border-map-gold/10 rounded transition-all cursor-pointer shadow-xs active:scale-95 text-map-wood-dark"
                    title="Descargar código QR"
                  >
                    <i className="ri-download-2-line text-xs"></i>
                    <span className="text-[9px] font-medium uppercase">{t('map.download')}</span>
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-map-cream-light/40 hover:bg-map-cream border border-map-gold/10 rounded transition-all cursor-pointer shadow-xs active:scale-95 text-map-wood-dark"
                    title="Copiar código"
                  >
                    <i className={copied ? "ri-check-line text-map-gold text-xs" : "ri-file-copy-line text-xs"} />
                    <span className="text-[9px] font-medium uppercase">{copied ? t('map.copied') : t('map.copy')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notch Dashed Line 2 */}
          <div className="relative w-full flex items-center justify-between px-5 my-1 shrink-0">
            <div
              className="absolute left-[-12px] w-6 h-6 rounded-full bg-cover bg-center z-20 shadow-[inset_-3px_0_4px_rgba(0,0,0,0.1)]"
              style={{ backgroundImage: "url('/assets/img/fonto_textura.jpg')" }}
            />
            <div
              className="absolute right-[-12px] w-6 h-6 rounded-full bg-cover bg-center z-20 shadow-[inset_3px_0_4px_rgba(0,0,0,0.1)]"
              style={{ backgroundImage: "url('/assets/img/fonto_textura.jpg')" }}
            />
            <div className="w-full border-t border-dashed border-map-gold/30" />
          </div>

          {/* Ticket Details */}
          <div className="px-6 pb-6 pt-3 w-full flex flex-col gap-3 text-left shrink-0 relative">
            <div className='flex flex-col gap-0.5'>
              <span className="text-[10px] text-map-gold font-semibold block uppercase tracking-wider">{t('map.business_location')}</span>
              <span className="text-[11px] font-medium text-map-wood-dark/80 block">
                {BUSINESS_ADDRESSES[stopIndex] || 'Ciudad Colonial, Santo Domingo'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-2">
              <div className='flex flex-col gap-0.5'>
                <span className="text-[10px] text-map-gold font-semibold uppercase tracking-wider">{t('map.validity')}</span>
                <span className="text-[11px] font-medium text-map-wood-dark/80">
                  {t('map.valid_until', { date: prize.validUntil })}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 absolute bottom-4 right-4">
                <img src="/assets/img/logo1.png" className='w-15 h-15' />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-[360px] flex flex-row gap-3 shrink-0 pb-4">
        <GameButton variant="tan" className="flex-1 h-14 text-xs" onClick={onContinue}>
          {isLastStop ? t('map.see_achievements') : t('map.exit')}
        </GameButton>
        <GameButton variant="dark" className="flex-2 h-14 text-xs" onClick={() => setShowRanking(true)}>
          <i className="ri-trophy-line text-base mr-2" />
          {t('map.see_ranking')}
        </GameButton>
      </div>

      {showRanking && (
        <Ranking onClose={() => setShowRanking(false)} onContinue={onContinue} />
      )}
    </div>
  )
}
