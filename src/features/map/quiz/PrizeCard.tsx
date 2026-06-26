import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ClaimedPrize } from '../types/quiz.types'
import Ranking from './Ranking'

const dominicanLogo = 'https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2Fdominican_2.png?alt=media&token=94f82a14-2363-4019-a549-dda291fa972b'
const clusterLogo = 'https://firebasestorage.googleapis.com/v0/b/turizoneando-dev.firebasestorage.app/o/EmailGridImg%2Fcluster_2.png?alt=media&token=54d01e86-158f-4567-9af4-9a5c7b30e9f2'

const CONFETTI_COLORS = ['#00bbb4', '#ff9447', '#ffffff', '#fbbf24', '#18d5cd', '#ffb06f', '#e0344b']

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
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState(false)

  const handleDownload = async () => {
    if (downloading) return
    setDownloading(true)
    setDownloadError(false)
    try {
    const tryLoad = (src: string): Promise<HTMLImageElement | null> =>
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

    const [bannerImg, turizoImg, domImg, cluImg] = await Promise.all([
      tryLoad(bannerImage),
      tryLoad('/assets/img/logoSinFondo.webp'),
      tryLoad(dominicanLogo),
      tryLoad(clusterLogo),
    ])

    const W = 420
    const SCALE = 2
    const PAD = 24

    const BANNER_H  = 210
    const NOTCH_H   = 28
    const CODE_H    = 148
    const hasLocal  = !!(prize.localName || prize.localAddress || prize.localPhone)
    const LOCAL_H   = hasLocal
      ? 30 + (prize.localName ? 22 : 0) + (prize.localAddress ? 18 : 0) + (prize.localPhone ? 18 : 0) + 14
      : 0
    const FOOTER_H  = 68
    const LOGOS_H   = 88
    const H = BANNER_H + NOTCH_H + CODE_H + (hasLocal ? NOTCH_H + LOCAL_H : 0) + FOOTER_H + LOGOS_H

    const canvas = document.createElement('canvas')
    canvas.width  = W * SCALE
    canvas.height = H * SCALE
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(SCALE, SCALE)

    // ── Background ──────────────────────────────────────────────
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    // ── Banner ──────────────────────────────────────────────────
    if (bannerImg) {
      ctx.save()
      ctx.beginPath(); ctx.rect(0, 0, W, BANNER_H); ctx.clip()
      ctx.drawImage(bannerImg, 0, 0, W, BANNER_H)
      ctx.restore()
      const gTop = ctx.createLinearGradient(0, 0, 0, 90)
      gTop.addColorStop(0, 'rgba(0,0,0,0.72)'); gTop.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = gTop; ctx.fillRect(0, 0, W, 90)
      const gBot = ctx.createLinearGradient(0, BANNER_H - 90, 0, BANNER_H)
      gBot.addColorStop(0, 'rgba(255,255,255,0)'); gBot.addColorStop(1, '#ffffff')
      ctx.fillStyle = gBot; ctx.fillRect(0, BANNER_H - 90, W, 90)
      ctx.fillStyle = '#ff9447'; ctx.font = 'bold 10px system-ui,sans-serif'
      ctx.textAlign = 'left'; ctx.letterSpacing = '2px'
      ctx.fillText('PREMIO', PAD, 30)
      ctx.letterSpacing = '0px'
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px system-ui,sans-serif'
      ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 8
      ctx.fillText(prize.prizeName || 'Premio', PAD, 60, W - PAD * 2)
      ctx.shadowBlur = 0
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, BANNER_H)
      g.addColorStop(0, '#075f6e'); g.addColorStop(0.7, '#00bbb4'); g.addColorStop(1, '#ffffff')
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, BANNER_H)
      ctx.fillStyle = '#ff9447'; ctx.font = 'bold 11px system-ui,sans-serif'
      ctx.textAlign = 'center'; ctx.fillText('TURIZONEANDO · PREMIO', W / 2, 50)
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 24px system-ui,sans-serif'
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 6
      ctx.fillText(prize.prizeName || 'Premio', W / 2, 90, W - PAD * 2)
      ctx.shadowBlur = 0
    }

    // ── Notch 1 ─────────────────────────────────────────────────
    const notch1Y = BANNER_H + NOTCH_H / 2
    ctx.strokeStyle = 'rgba(255,148,71,0.4)'; ctx.setLineDash([6, 5]); ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(PAD, notch1Y); ctx.lineTo(W - PAD, notch1Y); ctx.stroke()
    ctx.setLineDash([])

    // ── Código ──────────────────────────────────────────────────
    const codeTop = BANNER_H + NOTCH_H
    ctx.fillStyle = '#00bbb4'; ctx.font = '700 9px system-ui,sans-serif'
    ctx.textAlign = 'center'; ctx.letterSpacing = '2px'
    ctx.fillText('CANJEA CON ESTE CÓDIGO', W / 2, codeTop + 28)
    ctx.letterSpacing = '0px'
    // Code box
    const boxX = PAD, boxY = codeTop + 38, boxW = W - PAD * 2, boxH = 72
    ctx.fillStyle = 'rgba(255,148,71,0.06)'
    ctx.strokeStyle = 'rgba(255,148,71,0.3)'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.roundRect(boxX, boxY, boxW, boxH, 14); ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#096d7d'; ctx.font = 'bold 56px monospace'; ctx.textAlign = 'center'
    ctx.fillText(prize.code, W / 2, boxY + boxH - 14)

    // ── Local info ──────────────────────────────────────────────
    if (hasLocal) {
      const notch2Y = BANNER_H + NOTCH_H + CODE_H + NOTCH_H / 2
      ctx.strokeStyle = 'rgba(255,148,71,0.4)'; ctx.setLineDash([6, 5]); ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(PAD, notch2Y); ctx.lineTo(W - PAD, notch2Y); ctx.stroke()
      ctx.setLineDash([])

      let ly = BANNER_H + NOTCH_H + CODE_H + NOTCH_H + 22
      ctx.fillStyle = 'rgba(0,187,180,0.75)'; ctx.font = '700 9px system-ui,sans-serif'
      ctx.textAlign = 'left'; ctx.letterSpacing = '1.5px'
      ctx.fillText('DÓNDE CANJEAR', PAD, ly)
      ctx.letterSpacing = '0px'
      ly += 18
      if (prize.localName) {
        ctx.fillStyle = '#096d7d'; ctx.font = 'bold 13px system-ui,sans-serif'
        ctx.fillText(prize.localName, PAD, ly); ly += 20
      }
      if (prize.localAddress) {
        ctx.fillStyle = 'rgba(9,109,125,0.72)'; ctx.font = '11px system-ui,sans-serif'
        ctx.fillText(`📌 ${prize.localAddress}`, PAD, ly); ly += 18
      }
      if (prize.localPhone) {
        ctx.fillStyle = 'rgba(9,109,125,0.72)'; ctx.font = '11px system-ui,sans-serif'
        ctx.fillText(`📞 ${prize.localPhone}`, PAD, ly)
      }
    }

    // ── Footer meta ─────────────────────────────────────────────
    const footerY = H - LOGOS_H - FOOTER_H
    ctx.fillStyle = 'rgba(255,148,71,0.05)'; ctx.fillRect(0, footerY, W, FOOTER_H)
    ctx.strokeStyle = 'rgba(255,148,71,0.18)'; ctx.lineWidth = 1; ctx.setLineDash([])
    ctx.beginPath(); ctx.moveTo(0, footerY); ctx.lineTo(W, footerY); ctx.stroke()

    const metaCY = footerY + FOOTER_H / 2
    // Date column
    const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    ctx.fillStyle = 'rgba(255,148,71,0.75)'; ctx.font = '700 8px system-ui,sans-serif'
    ctx.textAlign = 'left'; ctx.letterSpacing = '1px'
    ctx.fillText('VÁLIDO', PAD, metaCY - 8)
    ctx.letterSpacing = '0px'
    ctx.fillStyle = '#096d7d'; ctx.font = 'bold 12px system-ui,sans-serif'
    ctx.fillText(dateStr, PAD, metaCY + 9)
    // Divider
    ctx.strokeStyle = 'rgba(255,148,71,0.3)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(W / 2 - 30, footerY + 14); ctx.lineTo(W / 2 - 30, footerY + FOOTER_H - 14); ctx.stroke()
    // Stage column
    ctx.fillStyle = 'rgba(255,148,71,0.75)'; ctx.font = '700 8px system-ui,sans-serif'
    ctx.textAlign = 'center'; ctx.letterSpacing = '1px'
    ctx.fillText('ETAPA', W / 2, metaCY - 8)
    ctx.letterSpacing = '0px'
    ctx.fillStyle = '#096d7d'; ctx.font = 'bold 16px system-ui,sans-serif'
    ctx.fillText(String(stageNum), W / 2, metaCY + 9)
    // Divider
    ctx.strokeStyle = 'rgba(255,148,71,0.3)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(W / 2 + 30, footerY + 14); ctx.lineTo(W / 2 + 30, footerY + FOOTER_H - 14); ctx.stroke()
    // Turizoneando logo
    if (turizoImg) {
      const tH = 38, tW = turizoImg.naturalWidth * (tH / turizoImg.naturalHeight)
      ctx.drawImage(turizoImg, W - PAD - tW, metaCY - tH / 2, tW, tH)
    } else {
      ctx.fillStyle = '#096d7d'; ctx.font = 'bold 10px system-ui,sans-serif'
      ctx.textAlign = 'right'; ctx.fillText('turizoneando', W - PAD, metaCY + 4)
    }

    // ── Brand logos ─────────────────────────────────────────────
    const logosY = H - LOGOS_H
    ctx.fillStyle = 'rgba(255,148,71,0.03)'; ctx.fillRect(0, logosY, W, LOGOS_H)
    ctx.strokeStyle = 'rgba(255,148,71,0.15)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, logosY); ctx.lineTo(W, logosY); ctx.stroke()

    const lCY = logosY + LOGOS_H / 2
    if (domImg && cluImg) {
      const dH = 52, dW = domImg.naturalWidth * (dH / domImg.naturalHeight)
      const cH = 40, cW = cluImg.naturalWidth * (cH / cluImg.naturalHeight)
      const gap = 20
      const totalW = dW + gap + 1 + gap + cW
      const startX = (W - totalW) / 2
      ctx.drawImage(domImg, startX, lCY - dH / 2, dW, dH)
      ctx.strokeStyle = 'rgba(0,187,180,0.25)'; ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(startX + dW + gap, lCY - 18); ctx.lineTo(startX + dW + gap, lCY + 18); ctx.stroke()
      ctx.drawImage(cluImg, startX + dW + gap * 2, lCY - cH / 2, cW, cH)
    } else {
      ctx.fillStyle = '#096d7d'; ctx.font = '10px system-ui,sans-serif'
      ctx.textAlign = 'center'; ctx.fillText('turizoneando.mitur.gob.do', W / 2, lCY + 4)
    }

    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url; a.download = `premio-turizoneando-${prize.code}.png`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    } catch {
      setDownloadError(true)
    } finally {
      setDownloading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(prize.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const bannerImage = prize.prizeImageUrl || monumentImage
  const stageNum = Math.floor(stopIndex / 4) + 1


  return (
    <div
      className="fixed inset-0 z-999 flex flex-col items-center justify-center gap-5 overflow-x-hidden overflow-y-auto"
      style={{ background: 'linear-gradient(to bottom, #075f6e 0%, #00bbb4 100%)', paddingTop: 16, paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
    >
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes prizeSlideIn {
          from { transform: translateY(28px) scale(0.96); opacity: 0; }
          to   { transform: translateY(0)    scale(1);    opacity: 1; }
        }
      `}</style>

      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10" style={{ touchAction: 'none' }}>
        {Array.from({ length: 40 }).map((_, i) => {
          const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
          const isRound = i % 3 === 0
          const size = `${3 + (i * 2) % 6}px`
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
                opacity: 0.8,
                animation: `confettiFall ${(2.5 + (i * 0.4) % 4).toFixed(2)}s linear infinite`,
                animationDelay: `${((i * 0.15) % 3.5).toFixed(2)}s`,
              }}
            />
          )
        })}
      </div>

      {/* Iconos top-right: Descargar / Copiar / Cerrar */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
        {prize.code && (
          <>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform"
              style={{ background: downloadError ? 'rgba(224,52,75,0.5)' : 'rgba(255,255,255,0.18)', opacity: downloading ? 0.6 : 1 }}
              title={downloadError ? 'Error al descargar — intenta de nuevo' : 'Descargar voucher'}
            >
              <i className={`${downloading ? 'ri-loader-4-line animate-spin' : downloadError ? 'ri-error-warning-line' : 'ri-download-2-line'} text-lg text-white`} />
            </button>
            <button
              onClick={handleCopy}
              className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-all"
              style={{ background: copied ? 'rgba(0,187,180,0.6)' : 'rgba(255,255,255,0.18)' }}
            >
              <i className={`${copied ? 'ri-check-line' : 'ri-file-copy-line'} text-lg text-white`} />
            </button>
          </>
        )}
        <button
          onClick={onContinue}
          className="w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform"
          style={{ background: 'rgba(255,255,255,0.18)' }}
        >
          <i className="ri-close-line text-xl text-white" />
        </button>
      </div>

      {/* Titulo */}
      <div className="flex flex-col items-center gap-1.5 z-20 px-6 text-center">
        <div
          className="px-4 py-1 rounded-full mb-0.5"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          <span className="text-[11px] font-black tracking-widest uppercase text-white" style={{ opacity: 0.9 }}>
            HAS GANADO!
          </span>
        </div>
        <h1
          className="font-black leading-none"
          style={{
            fontFamily: 'Outfit, Inter, system-ui, sans-serif',
            fontSize: 'clamp(24px, 7vw, 36px)',
            background: 'linear-gradient(135deg, #ff9447 0%, #fbbf24 55%, #ffffff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 2px 10px rgba(255,148,71,0.45))',
            letterSpacing: '-0.02em',
          }}
        >
          {t('map.congrats')}
        </h1>
      </div>

      {/* TICKET */}
      <div
        className="w-full z-20"
        style={{ maxWidth: 360, paddingLeft: 16, paddingRight: 16, animation: 'prizeSlideIn 0.45s ease-out' }}
      >
        <div
          className="w-full rounded-3xl overflow-hidden flex flex-col"
          style={{ background: '#ffffff', boxShadow: '0 16px 48px rgba(0,0,0,0.32)' }}
        >
          {/* Banner */}
          <div className="p-2" style={{ height: 190 }}>
            <div className="relative w-full h-full rounded-3xl overflow-hidden">
              <img src={bannerImage} alt={prize.prizeName} className="w-full h-full object-cover" />
              <div
                className="absolute top-0 left-0 right-0"
                style={{ height: 90, background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)' }}
              />
              <div className="absolute top-4 left-4 flex flex-col gap-0.5">
                <span
                  className="text-[10px] font-black tracking-widest uppercase"
                  style={{ color: '#ff9447', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
                >
                  {t('map.prize_label')}
                </span>
                <h2
                  className="text-lg font-black text-white leading-tight"
                  style={{ maxWidth: 220, textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}
                >
                  {prize.prizeName || t('map.prize_label')}
                </h2>
              </div>
            </div>
          </div>

          {/* Notch superior */}
          <div className="relative" style={{ height: 28 }}>
            <div className="absolute rounded-full" style={{ left: -12, top: 2, width: 24, height: 24, background: '#00a29a' }} />
            <div className="absolute rounded-full" style={{ right: -12, top: 2, width: 24, height: 24, background: '#00a29a' }} />
            <div className="absolute left-5 right-5" style={{ top: '50%', borderTop: '1.5px dashed rgba(255,148,71,0.35)' }} />
          </div>

          {/* Codigo */}
          <div className="px-6 py-4 flex flex-col items-center gap-2">
            {prize.code ? (
              <>
                <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#ff9447' }}>
                  {t('map.redeem_code')}
                </span>
                <div
                  className="w-full flex items-center justify-center py-4 rounded-2xl"
                  style={{ background: 'rgba(255,148,71,0.06)', border: '1.5px solid rgba(255,148,71,0.28)' }}
                >
                  <span className="font-mono font-black" style={{ fontSize: 38, color: '#096d7d', letterSpacing: '0.06em' }}>
                    {prize.code}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4 w-full">
                <i className="ri-error-warning-line text-3xl" style={{ color: 'rgba(0,187,180,0.45)' }} />
                <p className="text-[12px] text-center" style={{ color: 'rgba(9,109,125,0.6)' }}>
                  {t('map.prize_no_code_msg1')}<br />{t('map.prize_no_code_msg2')}
                </p>
              </div>
            )}
          </div>

          {/* Info del local */}
          {(prize.localName || prize.localAddress || prize.localPhone) && (
            <div className="px-5 pb-4 flex flex-col gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(0,187,180,0.8)' }}>
                Dónde canjear
              </span>
              {prize.localName && (
                <span className="text-[13px] font-bold leading-tight" style={{ color: '#096d7d' }}>
                  {prize.localName}
                </span>
              )}
              {prize.localAddress && (
                <span className="text-[11px] leading-tight" style={{ color: 'rgba(9,109,125,0.7)' }}>
                  📌 {prize.localAddress}
                </span>
              )}
              {prize.localPhone && (
                <span className="text-[11px]" style={{ color: 'rgba(9,109,125,0.7)' }}>
                  📞 {prize.localPhone}
                </span>
              )}
            </div>
          )}

          {/* Notch inferior */}
          <div className="relative" style={{ height: 28 }}>
            <div className="absolute rounded-full" style={{ left: -12, top: 2, width: 24, height: 24, background: '#00a29a' }} />
            <div className="absolute rounded-full" style={{ right: -12, top: 2, width: 24, height: 24, background: '#00a29a' }} />
            <div className="absolute left-5 right-5" style={{ top: '50%', borderTop: '1.5px dashed rgba(255,148,71,0.35)' }} />
          </div>

          {/* Footer meta */}
          <div className="px-5 py-3 flex items-center justify-between" style={{ background: 'rgba(255,148,71,0.05)' }}>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,148,71,0.7)' }}>
                {t('map.valid_label')}
              </span>
              <span className="text-[12px] font-bold" style={{ color: '#096d7d' }}>
                {new Date().toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,148,71,0.4), transparent)' }} />
            <div className="flex flex-col gap-0.5 items-center">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,148,71,0.7)' }}>
                {t('map.stage_badge')}
              </span>
              <span className="text-[13px] font-bold" style={{ color: '#096d7d' }}>{stageNum}</span>
            </div>
            <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,148,71,0.4), transparent)' }} />
            <img src="/assets/img/logoSinFondo.webp" className="w-20 h-auto object-contain" />
          </div>

          {/* Brand logos */}
          <div
            className="px-6 py-4 flex items-center justify-center gap-6"
            style={{ borderTop: '1px solid rgba(255,148,71,0.12)', background: 'rgba(255,148,71,0.03)' }}
          >
            <img src={dominicanLogo} alt="República Dominicana" className="h-10 w-auto object-contain" />
            <div className="w-px h-8" style={{ background: 'rgba(0,187,180,0.2)' }} />
            <img src={clusterLogo} alt="Cluster Turístico Santo Domingo" className="h-10 w-auto object-contain" />
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="w-full z-20 flex gap-2" style={{ maxWidth: 360, paddingLeft: 16, paddingRight: 16 }}>
        <button
          onClick={() => setShowRanking(true)}
          className="flex-1 h-12 rounded-[18px] text-sm font-black active:translate-y-[4px] transition-all flex items-center justify-center gap-1.5"
          style={{
            touchAction: 'manipulation',
            background: 'linear-gradient(180deg,#f2ead6 0%,#e5dcc6 100%)',
            color: '#8b6f47',
            border: '2px solid #c9bc9e',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,.7), 0 6px 0 #b8a87e, 0 10px 18px rgba(0,0,0,.10)',
          }}
        >
          <i className="ri-trophy-line text-sm" />
          Ranking
        </button>
        <button
          onClick={() => { onContinue(); navigate('/map') }}
          className="flex-1 h-12 rounded-[18px] text-sm font-black text-white active:translate-y-[4px] transition-all flex items-center justify-center gap-1.5"
          style={{
            touchAction: 'manipulation',
            background: 'linear-gradient(180deg,#18d5cd 0%,#00bbb4 45%,#096d7d 100%)',
            border: '2px solid #0c7f89',
            boxShadow: 'inset 0 2px 0 rgba(255,255,255,.35), 0 6px 0 #054f5c, 0 12px 22px rgba(9,109,125,.25)',
          }}
        >
          {isLastStop ? (
            <><i className="ri-flag-line text-sm" />Finalizar</>
          ) : (
            <><i className="ri-map-pin-line text-sm" />Siguiente</>
          )}
        </button>
      </div>

      {showRanking && (
        <Ranking onClose={() => setShowRanking(false)} onContinue={onContinue} hasMoreStages={!isLastStop} />
      )}
    </div>
  )
}
