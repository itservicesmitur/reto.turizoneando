import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { auth } from '../../../config/firebase'
import { getTopTen, getMyPositionsRanking, type RankedPlayerData } from '../../../services/adminService'
import GameButton from './GameButton'

interface Props {
  onClose: () => void
  onContinue: () => void
}

interface MyPosition {
  uid: string
  ranking: number | null
  score: number
}

const MEDAL_CONFIG: Record<1 | 2 | 3, {
  borderColor: string; outerRing: string; bg: string; textColor: string; glow: string
}> = {
  1: {
    borderColor: '#fcd34d',
    outerRing: '#22150c',
    bg: 'linear-gradient(135deg, #a75a28 0%, #52250d 100%)',
    textColor: '#fcd34d',
    glow: 'rgba(252,211,77,0.5)',
  },
  2: {
    borderColor: '#fcd34d',
    outerRing: '#22150c',
    bg: 'linear-gradient(135deg, #7a5c20 0%, #3d2e10 100%)',
    textColor: '#fcd34d',
    glow: 'rgba(252,211,77,0.3)',
  },
  3: {
    borderColor: '#fcd34d',
    outerRing: '#22150c',
    bg: 'linear-gradient(135deg, #5a4415 0%, #2d2208 100%)',
    textColor: '#fcd34d',
    glow: 'rgba(252,211,77,0.2)',
  },
}

function Avatar({ photoURL, displayName, size = 40, rank }: {
  photoURL?: string; displayName: string; size?: number; rank?: 1 | 2 | 3
}) {
  const [imgError, setImgError] = useState(false)
  const initial = displayName?.charAt(0)?.toUpperCase() || '?'
  const cfg = rank ? MEDAL_CONFIG[rank] : null

  const borderStyle = cfg ? {
    border: `5px solid #fcd34d`,
    outline: `1.5px solid #b8860b`,
    outlineOffset: `2px`,
    boxShadow: `inset 0 0 0 1px rgba(255,245,150,0.6), 0 0 14px rgba(252,211,77,0.55), 0 0 28px rgba(252,211,77,0.25)`,
    flexShrink: 0 as const,
  } : {
    border: '2px solid rgba(199,163,97,0.6)',
    flexShrink: 0 as const,
  }

  if (photoURL && !imgError) {
    return (
      <img
        src={photoURL}
        alt={displayName}
        onError={() => setImgError(true)}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover',
          ...borderStyle,
        }}
      />
    )
  }
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, fontWeight: 900,
        background: cfg ? cfg.bg : 'rgba(199,163,97,0.12)',
        color: cfg ? cfg.textColor : '#c7a361',
        fontFamily: 'var(--font-map-ui)',
        ...borderStyle,
      }}
    >
      {initial}
    </div>
  )
}

function SquareAvatar({ photoURL, displayName, isSelf }: {
  photoURL?: string; displayName: string; isSelf: boolean
}) {
  const [imgError, setImgError] = useState(false)
  return (
    <div style={{
      flexShrink: 0, width: 38, height: 38,
      borderRadius: 10, overflow: 'hidden',
      border: `2px solid ${isSelf ? 'rgba(199,163,97,0.6)' : 'rgba(199,163,97,0.2)'}`,
    }}>
      {photoURL && !imgError ? (
        <img
          src={photoURL}
          alt={displayName}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          background: 'rgba(199,163,97,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 900, color: '#c7a361',
          fontFamily: 'var(--font-map-ui)',
        }}>
          {displayName?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
    </div>
  )
}

function PodiumScene({
  entries,
  myUid,
  t,
}: {
  entries: (RankedPlayerData | null)[]
  myUid?: string
  t: ReturnType<typeof useTranslation>['t']
}) {
  const slots: { rank: 1 | 2 | 3; idx: number; h: number }[] = [
    { rank: 2, idx: 0, h: 90 },
    { rank: 1, idx: 1, h: 132 },
    { rank: 3, idx: 2, h: 68 },
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4, padding: '28px 4px 0' }}>
      {slots.map(({ rank, idx, h }) => {
        const p = entries[idx]
        const isSelf = p?.uid === myUid
        const isFirst = rank === 1
        const avatarSize = isFirst ? 58 : 48

        return (
          <div key={rank} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: isFirst ? '0 0 38%' : '0 0 29%' }}>
            {/* Avatar + info */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingBottom: 10 }}>
              {p ? (
                <>
                  <div style={{ position: 'relative' }}>
                    {isFirst && (
                      <i className="ri-vip-crown-2-fill" style={{
                        position: 'absolute', top: -34, left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: 32, lineHeight: 1,
                        color: '#fcd34d',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6)) drop-shadow(0 0 8px rgba(252,211,77,0.6))',
                      }} />
                    )}
                    <Avatar photoURL={p.photoURL} displayName={p.displayName} size={avatarSize} rank={rank} />
                  </div>
                  <span style={{
                    fontSize: isFirst ? 12 : 11, fontWeight: 800,
                    color: '#321e0f',
                    maxWidth: isFirst ? 110 : 86,
                    textAlign: 'center',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {isSelf ? t('map.ranking_you') : p.displayName}
                  </span>
                </>
              ) : (
                <div style={{
                  width: avatarSize, height: avatarSize, borderRadius: '50%',
                  border: '2px dashed rgba(199,163,97,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="ri-question-line" style={{ color: 'rgba(199,163,97,0.4)', fontSize: 14 }} />
                </div>
              )}
            </div>

            {/* Pedestal */}
            <div style={{
              width: '100%', height: h,
              background: 'linear-gradient(180deg, #c7a361 0%, #9b7230 55%, #6b4c1e 100%)',
              borderRadius: '10px 10px 0 0',
              position: 'relative',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              boxShadow: 'inset -4px 0 8px rgba(80,40,0,0.15), inset 2px 2px 6px rgba(255,255,255,0.2)',
              overflow: 'hidden',
              WebkitMaskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
            }}>
              <span style={{ fontSize: h * 0.36, fontWeight: 900, color: 'rgba(255,255,255,0.55)', lineHeight: 1, userSelect: 'none' }}>
                {rank}
              </span>
              {p && (
                <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.6)', lineHeight: 1, userSelect: 'none', letterSpacing: 0.3 }}>
                  ×{p.score}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Badge reutilizable para puntaje ────────────────────────────────────────────
function ScoreBadge({ score }: { score: number | string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
      background: '#1a0f07',
      border: '1.5px solid #5a3612',
      borderRadius: 10,
      padding: '5px 10px',
      boxShadow: '0 3px 0 #0d0703, inset 0 1px 0 rgba(255,255,255,0.07)',
    }}>
      <i className="ri-copper-coin-fill" style={{ color: '#fcd34d', fontSize: 12 }} />
      <span style={{ fontSize: 11, fontWeight: 900, color: '#faf6eb', fontFamily: 'var(--font-map-ui)', letterSpacing: 0.3 }}>
        {score}
      </span>
    </div>
  )
}

export default function Ranking({ onClose, onContinue }: Props) {
  const { t } = useTranslation()
  const myUid = auth.currentUser?.uid

  const [topTen, setTopTen] = useState<RankedPlayerData[]>([])
  const [myPosition, setMyPosition] = useState<MyPosition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    Promise.all([
      getTopTen(),
      getMyPositionsRanking(),
    ])
      .then(([top, my]) => {
        if (cancelled) return
        setTopTen(top)
        setMyPosition(my)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const podium = topTen.filter(p => (p.ranking ?? 99) <= 3).sort((a, b) => (a.ranking ?? 99) - (b.ranking ?? 99))
  const podiumOrdered: (RankedPlayerData | null)[] = [
    podium.find(p => p.ranking === 2) ?? null,
    podium.find(p => p.ranking === 1) ?? null,
    podium.find(p => p.ranking === 3) ?? null,
  ]
  const listPlayers = topTen.filter(p => (p.ranking ?? 99) > 3).sort((a, b) => (a.ranking ?? 99) - (b.ranking ?? 99))
  const userInTopTen = topTen.some(p => p.uid === myUid)
  const showMyRow = !userInTopTen && myPosition && myPosition.ranking !== null

  return (
    <div
      className="absolute inset-0 z-70 flex items-center justify-center animate-fade-in animate-duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full overflow-hidden flex flex-col quiz-card-enter"
        style={{
          background: '#ebdcc3',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Metal Corners */}
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

        {/* Close Button */}
        <div className="absolute top-4 right-4 z-40">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-map-wood-dark text-map-gold-light border border-map-gold active:scale-90 transition-all shadow-md"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Top stripe */}
        <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold-light),var(--color-map-gold),var(--color-map-gold-light),transparent)' }} />

        {/* Header */}
        <div className="text-center mt-8 mb-2 shrink-0">
          <h2
            className="text-2xl font-black font-serif tracking-wide leading-none"
            style={{ color: '#321e0f' }}
          >
            {t('map.ranking_title')}
          </h2>
          <p
            className="text-xs italic mt-1.5 font-serif font-bold"
            style={{ color: '#6b4410' }}
          >
            {t('map.ranking_subtitle')}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: '#c7a361', borderTopColor: 'transparent' }} />
              <span className="text-xs font-bold font-serif" style={{ color: '#a87f2a' }}>
                {t('map.ranking_loading')}
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center">
              <i className="ri-wifi-off-line text-3xl mb-2" style={{ color: 'rgba(199,163,97,0.5)' }} />
              <p className="text-sm font-serif" style={{ color: '#a87f2a' }}>
                {t('map.ranking_error')}
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Sticky Controls */}
            <div className="px-4 pt-3 flex flex-col gap-4 shrink-0">
              {/* Podium (Top 3) */}
              {podiumOrdered.some(Boolean) && (
                <PodiumScene entries={podiumOrdered} myUid={myUid} t={t} />
              )}

              {/* Separador */}
              {listPlayers.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(199,163,97,0.3))' }} />
                  <i className="ri-copper-coin-fill" style={{ fontSize: 11, color: '#c7a361' }} />
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(199,163,97,0.3), transparent)' }} />
                </div>
              )}
            </div>

            {/* Scrollable Player List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 min-h-0">
              {listPlayers.map((p) => {
                const isSelf = p.uid === myUid
                return (
                  <div
                    key={p.uid}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px',
                      borderRadius: 14,
                      background: isSelf
                        ? 'linear-gradient(180deg, #f0e0c0 0%, #d9c090 100%)'
                        : 'linear-gradient(180deg, #f5ece0 0%, #e0cdb0 100%)',
                      border: `1.5px solid ${isSelf ? '#c7a361' : '#c4a46a'}`,
                      boxShadow: isSelf
                        ? '0 4px 0 rgba(100,65,20,0.4), inset 0 1px 0 rgba(255,255,255,0.7), 0 0 8px rgba(199,163,97,0.25)'
                        : '0 3px 0 rgba(100,65,20,0.3), inset 0 1px 0 rgba(255,255,255,0.7)',
                    }}
                  >
                    {/* Círculo posición */}
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: '#321e0f',
                      border: '1.5px solid #5a3612',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}>
                      <span style={{ color: '#faf6eb', fontSize: 12, fontWeight: 900, lineHeight: 1 }}>
                        {p.ranking}
                      </span>
                    </div>

                    <SquareAvatar photoURL={p.photoURL} displayName={p.displayName} isSelf={isSelf} />

                    {/* Nombre */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        display: 'block',
                        fontSize: 11, fontWeight: 900,
                        color: isSelf ? '#a87f2a' : '#321e0f',
                        textTransform: 'uppercase', letterSpacing: 0.4,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        fontFamily: 'var(--font-map-ui)',
                      }}>
                        {isSelf ? t('map.ranking_you') : p.displayName}
                      </span>
                    </div>

                    <ScoreBadge score={p.score} />
                  </div>
                )
              })}

              {/* Mi posición fuera del top 10 */}
              {showMyRow && myPosition && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                    <div style={{ flex: 1, borderTop: '1px dashed rgba(199,163,97,0.25)' }} />
                    <span style={{ fontSize: 9, color: 'rgba(199,163,97,0.55)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {t('map.ranking_your_position')}
                    </span>
                    <div style={{ flex: 1, borderTop: '1px dashed rgba(199,163,97,0.25)' }} />
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px',
                    borderRadius: 14,
                    background: 'linear-gradient(180deg, #f0e0c0 0%, #d9c090 100%)',
                    border: '1.5px solid #c7a361',
                    boxShadow: '0 4px 0 rgba(100,65,20,0.4), inset 0 1px 0 rgba(255,255,255,0.7), 0 0 8px rgba(199,163,97,0.25)',
                  }}>
                    {/* Círculo posición */}
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: '#321e0f',
                      border: '1.5px solid #5a3612',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}>
                      <span style={{ color: '#fcd34d', fontSize: 12, fontWeight: 900, lineHeight: 1 }}>
                        {myPosition.ranking}
                      </span>
                    </div>

                    <SquareAvatar
                      photoURL={auth.currentUser?.photoURL ?? undefined}
                      displayName={auth.currentUser?.displayName ?? '?'}
                      isSelf={true}
                    />

                    {/* Nombre */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        display: 'block',
                        fontSize: 11, fontWeight: 900,
                        color: '#a87f2a',
                        textTransform: 'uppercase', letterSpacing: 0.4,
                        fontFamily: 'var(--font-map-ui)',
                      }}>
                        {t('map.ranking_you')}
                      </span>
                    </div>

                    <ScoreBadge score={myPosition.score} />
                  </div>
                </>
              )}

              {/* Sin datos */}
              {topTen.length === 0 && (
                <div className="flex-1 flex items-center justify-center py-8">
                  <p className="text-sm font-serif text-center" style={{ color: '#a87f2a' }}>
                    {t('map.ranking_empty')}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Action Button */}
        <div
          className="px-5 pb-6 pt-3 shrink-0 z-10"
          style={{ background: 'transparent', borderTop: '1px solid rgba(168,127,42,0.3)' }}
        >
          <GameButton variant="dark" className="w-full h-16 text-base" onClick={onContinue}>
            {t('map.back_to_adventure')}
          </GameButton>
        </div>

        {/* Bottom stripe */}
        <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold),var(--color-map-gold-light),var(--color-map-gold),transparent)' }} />
      </div>
    </div>
  )
}
