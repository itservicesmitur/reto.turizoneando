import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ClaimedPrize } from '../types/quiz.types'
import Ranking from './Ranking'
import GameButton from './GameButton'

const CONFETTI_COLORS = ['#fcd34d', '#a87f2a', '#ebdcc3', '#321e0f', '#c7a361']

interface Props {
  prize: ClaimedPrize
  monumentImage: string
  stopIndex: number
  isLastStop?: boolean
  onContinue: () => void
}

export default function PrizeCard({ prize, monumentImage, stopIndex, isLastStop = false, onContinue }: Props) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [showRanking, setShowRanking] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleDownload = async () => {
    const tryLoadViaBlob = (src: string): Promise<HTMLImageElement | null> =>
      fetch(src, { mode: 'cors' })
        .then(r => r.blob())
        .then(blob => new Promise<HTMLImageElement | null>(res => {
          const url = URL.createObjectURL(blob)
          const img = new Image()
          img.onload = () => { URL.revokeObjectURL(url); res(img) }
          img.onerror = () => { URL.revokeObjectURL(url); res(null) }
          img.src = url
        }))
        .catch(() => null)

    const W = 420
    const QR_SIZE = 160
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const [bannerImg, qrImg] = await Promise.all([
      tryLoadViaBlob(bannerImage),
      tryLoadViaBlob(`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(prize.code)}&color=50-30-15&bgcolor=f5ead6`),
    ])

    const BANNER_H = bannerImg ? 220 : 0
    const HEADER_H = bannerImg ? 0 : 110
    const CODE_H = 160
    const QR_H = qrImg ? QR_SIZE + 56 : 0
    const FOOTER_H = 48
    const H = BANNER_H + HEADER_H + CODE_H + QR_H + FOOTER_H
    canvas.width = W
    canvas.height = H

    // Fondo crema
    ctx.fillStyle = '#f5ead6'
    ctx.fillRect(0, 0, W, H)

    if (bannerImg) {
      // Banner foto
      ctx.save()
      ctx.beginPath(); ctx.rect(0, 0, W, BANNER_H); ctx.clip()
      ctx.drawImage(bannerImg, 0, 0, W, BANNER_H)
      ctx.restore()
      // Degradado inferior del banner
      const g1 = ctx.createLinearGradient(0, BANNER_H - 90, 0, BANNER_H)
      g1.addColorStop(0, 'rgba(245,234,214,0)'); g1.addColorStop(1, '#f5ead6')
      ctx.fillStyle = g1; ctx.fillRect(0, BANNER_H - 90, W, 90)
      // Degradado superior oscuro para texto
      const g2 = ctx.createLinearGradient(0, 0, 0, 72)
      g2.addColorStop(0, 'rgba(0,0,0,0.70)'); g2.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, 72)
      // Etiqueta PREMIO
      ctx.fillStyle = '#fcd34d'; ctx.font = 'bold 10px Georgia,serif'
      ctx.textAlign = 'left'; ctx.fillText('PREMIO', 20, 28)
      // Nombre del premio
      ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Georgia,serif'
      ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 6
      ctx.fillText(prize.prizeName || 'Premio', 20, 56, W - 40)
      ctx.shadowBlur = 0
    } else {
      // Header sin imagen: fondo degradado oscuro
      const g = ctx.createLinearGradient(0, 0, 0, HEADER_H)
      g.addColorStop(0, '#22150c'); g.addColorStop(1, '#f5ead6')
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, HEADER_H)
      ctx.fillStyle = '#fcd34d'; ctx.font = 'bold 11px Georgia,serif'
      ctx.textAlign = 'center'; ctx.fillText('TURIZONEANDO · PREMIO', W / 2, 36)
      ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Georgia,serif'
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 4
      ctx.fillText(prize.prizeName || 'Premio', W / 2, 72, W - 40)
      ctx.shadowBlur = 0
    }

    const baseY = BANNER_H + HEADER_H

    // Separador punteado
    ctx.strokeStyle = '#a87f2a66'; ctx.setLineDash([6, 4]); ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(24, baseY + 20); ctx.lineTo(W - 24, baseY + 20); ctx.stroke()
    ctx.setLineDash([])

    // Etiqueta código
    ctx.fillStyle = '#a87f2a'; ctx.font = '700 10px Georgia,serif'; ctx.textAlign = 'center'
    ctx.fillText('CÓDIGO DE CANJE', W / 2, baseY + 48)

    // Código grande
    ctx.fillStyle = '#321e0f'; ctx.font = 'bold 62px monospace'; ctx.textAlign = 'center'
    ctx.fillText(prize.code, W / 2, baseY + 120)

    // Separador punteado
    ctx.strokeStyle = '#a87f2a66'; ctx.setLineDash([6, 4]); ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(24, baseY + CODE_H - 10); ctx.lineTo(W - 24, baseY + CODE_H - 10); ctx.stroke()
    ctx.setLineDash([])

    if (qrImg) {
      const qrX = (W - QR_SIZE) / 2
      const qrY = baseY + CODE_H + 14
      // Fondo blanco QR
      ctx.fillStyle = '#fff'
      ctx.beginPath(); ctx.roundRect(qrX - 10, qrY - 10, QR_SIZE + 20, QR_SIZE + 20, 10); ctx.fill()
      ctx.drawImage(qrImg, qrX, qrY, QR_SIZE, QR_SIZE)
      ctx.fillStyle = '#6b4a20'; ctx.font = '600 10px Georgia,serif'; ctx.textAlign = 'center'
      ctx.fillText('Escanea para validar tu premio', W / 2, qrY + QR_SIZE + 24)
    }

    // Footer
    ctx.fillStyle = '#a87f2a'; ctx.font = 'bold 12px Georgia,serif'; ctx.textAlign = 'center'
    ctx.fillText('turizoneando.com', W / 2, H - 16)

    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `premio-turizoneando-${prize.code}.png`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
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
        <GameButton variant="dark" className="w-full max-w-[360px] h-12 text-[11px]" onClick={() => { onContinue(); navigate('/map') }}>
          {isLastStop ? (
            <><i className="ri-flag-line text-sm mr-1.5" />Finalizar reto</>
          ) : (
            <><i className="ri-map-pin-line text-sm mr-1.5" />Ir a siguiente parada</>
          )}
        </GameButton>
      </div>

      {showRanking && (
        <Ranking onClose={() => setShowRanking(false)} onContinue={onContinue} />
      )}
    </div>
  )
}
