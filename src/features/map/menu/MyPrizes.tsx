import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { auth } from '../../../config/firebase'
import { getPlayerPrizeCodes, type PlayerPrizeCode } from '../../../services/authService'

interface Props { onBack: () => void }

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MyPrizes({ onBack }: Props) {
  const { t } = useTranslation()
  const [prizes, setPrizes] = useState<PlayerPrizeCode[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  const uid = auth.currentUser?.uid

  useEffect(() => {
    if (!uid) { setLoading(false); return }
    getPlayerPrizeCodes(uid)
      .then(setPrizes)
      .finally(() => setLoading(false))
  }, [uid])

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const active  = prizes.filter(p => p.status === 'active')
  const claimed = prizes.filter(p => p.status !== 'active')

  return (
    <div
      className="fixed inset-0 z-60 flex flex-col menu-view-slide-in"
      style={{ background: 'linear-gradient(to bottom, #075f6e 0%, #00bbb4 100%)' }}
    >
      {/* ── Zona teal ── */}
      <div className="shrink-0 px-5 pt-7">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            <i className="ri-arrow-left-line text-xl text-white" />
          </button>
          <span className="font-black text-sm text-white tracking-widest uppercase">
            {t('map.menu_prizes')}
          </span>
          <div className="w-10" />
        </div>

        {/* Contador */}
        <div className="flex justify-center gap-6 pb-10">
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-black text-white">{active.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.7)' }}>Disponibles</span>
          </div>
          <div className="w-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-black text-white">{claimed.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.7)' }}>Canjeados</span>
          </div>
          <div className="w-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-black text-white">{prizes.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.7)' }}>Total</span>
          </div>
        </div>
      </div>

      {/* ── Card blanca ── */}
      <div
        className="flex-1 min-h-0 rounded-t-3xl flex flex-col overflow-hidden"
        style={{ background: '#ffffff', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)' }}
      >
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <i className="ri-loader-4-line text-3xl animate-spin" style={{ color: '#00bbb4' }} />
          </div>
        ) : prizes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="h-24 w-24 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,187,180,0.08)', border: '2px dashed rgba(0,187,180,0.35)' }}
            >
              <i className="ri-gift-2-line text-4xl" style={{ color: 'rgba(0,187,180,0.45)' }} />
            </div>
            <p className="text-sm font-black" style={{ color: '#096d7d' }}>{t('map.no_prizes_yet')}</p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(9,109,125,0.6)' }}>{t('map.no_prizes_sub')}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 pt-6 pb-6 space-y-3 min-h-0" style={{ scrollbarWidth: 'none' }}>

            {/* Disponibles */}
            {active.length > 0 && (
              <>
                <p className="text-[10px] font-black uppercase tracking-widest px-1" style={{ color: 'rgba(9,109,125,0.5)' }}>Disponibles</p>
                {active.map(prize => <PrizeRow key={prize.code} prize={prize} copied={copied} onCopy={handleCopy} />)}
              </>
            )}

            {/* Canjeados */}
            {claimed.length > 0 && (
              <>
                <p className="text-[10px] font-black uppercase tracking-widest px-1 pt-2" style={{ color: 'rgba(9,109,125,0.5)' }}>Canjeados</p>
                {claimed.map(prize => <PrizeRow key={prize.code} prize={prize} copied={copied} onCopy={handleCopy} />)}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PrizeRow({ prize, copied, onCopy }: { prize: PlayerPrizeCode; copied: string | null; onCopy: (c: string) => void }) {
  const isClaimed = prize.status !== 'active'

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: isClaimed ? '#f8fffe' : '#ffffff',
        border: `1px solid ${isClaimed ? 'rgba(0,187,180,0.1)' : 'rgba(0,187,180,0.22)'}`,
        boxShadow: isClaimed ? 'none' : '0 2px 12px rgba(0,187,180,0.08)',
        opacity: isClaimed ? 0.7 : 1,
      }}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Imagen */}
        <div className="h-14 w-14 rounded-xl overflow-hidden shrink-0" style={{ background: 'rgba(0,187,180,0.08)' }}>
          {prize.prizeImageUrl ? (
            <img src={prize.prizeImageUrl} alt={prize.prizeName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <i className="ri-gift-2-line text-2xl" style={{ color: '#00bbb4' }} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black truncate" style={{ color: '#096d7d', textDecoration: isClaimed ? 'line-through' : 'none' }}>
            {prize.prizeName || 'Premio'}
          </p>
          {prize.localName && (
            <p className="text-[11px] font-semibold truncate" style={{ color: 'rgba(9,109,125,0.6)' }}>{prize.localName}</p>
          )}
          {prize.expiresAt && !isClaimed && (
            <p className="text-[10px] font-bold mt-0.5" style={{ color: '#ff9447' }}>
              Vence {formatDate(prize.expiresAt)}
            </p>
          )}
          {isClaimed && prize.claimedAt && (
            <p className="text-[10px] font-bold mt-0.5" style={{ color: 'rgba(9,109,125,0.4)' }}>
              Canjeado {formatDate(prize.claimedAt)}
            </p>
          )}
        </div>

        {/* Código + copiar */}
        {!isClaimed && (
          <button
            onClick={() => onCopy(prize.code)}
            className="shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl active:scale-95 transition-all"
            style={{ background: copied === prize.code ? 'rgba(0,187,180,0.12)' : 'rgba(0,187,180,0.08)', border: '1px solid rgba(0,187,180,0.2)' }}
          >
            <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: '#096d7d' }}>{prize.code}</span>
            <i className={`text-xs ${copied === prize.code ? 'ri-checkbox-circle-fill' : 'ri-file-copy-line'}`} style={{ color: '#00bbb4' }} />
          </button>
        )}

        {isClaimed && (
          <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,187,180,0.08)' }}>
            <i className="ri-checkbox-circle-fill" style={{ color: 'rgba(0,187,180,0.4)', fontSize: 18 }} />
          </div>
        )}
      </div>
    </div>
  )
}
