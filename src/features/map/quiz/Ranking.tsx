import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { auth } from '../../../config/firebase'
import { getTopTen, getMyPositionsRanking, type RankedPlayerData } from '../../../services/adminService'

interface Props {
  onClose: () => void
  onContinue: () => void
  hasMoreStages?: boolean
}

interface MyPosition {
  uid: string
  ranking: number | null
  score: number
}

const MEDAL: Record<1 | 2 | 3, { border: string; shadow: string }> = {
  1: { border: '#ffffff', shadow: 'rgba(255,255,255,0.5)' },
  2: { border: '#ffffff', shadow: 'rgba(255,255,255,0.4)' },
  3: { border: '#ffffff', shadow: 'rgba(255,255,255,0.4)' },
}

function Avatar({ photoURL, displayName, size = 40, rank }: {
  photoURL?: string; displayName: string; size?: number; rank?: 1 | 2 | 3
}) {
  const [imgError, setImgError] = useState(false)
  const initial = displayName?.charAt(0)?.toUpperCase() || '?'
  const m = rank ? MEDAL[rank] : null

  const borderStyle = m ? {
    border: `4px solid ${m.border}`,
    boxShadow: rank === 1
      ? '0 0 0 5px #ff9447, 0 0 18px rgba(255,148,71,0.55)'
      : `0 0 14px ${m.shadow}, 0 0 28px ${m.shadow}`,
    flexShrink: 0 as const,
  } : {
    border: '2px solid rgba(0,187,180,0.3)',
    flexShrink: 0 as const,
  }

  if (photoURL && !imgError) {
    return (
      <img
        src={photoURL}
        alt={displayName}
        onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', ...borderStyle }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 900,
      background: m ? 'rgba(0,187,180,0.12)' : 'rgba(0,187,180,0.08)',
      color: '#096d7d',
      ...borderStyle,
    }}>
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
      border: `2px solid ${isSelf ? 'rgba(0,187,180,0.5)' : 'rgba(0,187,180,0.15)'}`,
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
          background: 'rgba(0,187,180,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 900, color: '#096d7d',
        }}>
          {displayName?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
    </div>
  )
}

const BANNER_CFG: Record<1 | 2 | 3, { bg: string; glowColor: string; h: number }> = {
  1: { bg: 'linear-gradient(180deg,#34ddd6 0%,#00bbb4 50%,#009390 100%)', glowColor: 'rgba(0,187,180,0.5)',  h: 260 },
  2: { bg: 'linear-gradient(180deg,#22cfc8 0%,#00bbb4 50%,#009390 100%)', glowColor: 'rgba(0,187,180,0.35)', h: 220 },
  3: { bg: 'linear-gradient(180deg,#00bbb4 0%,#00a29a 50%,#096d7d 100%)', glowColor: 'rgba(9,109,125,0.4)',  h: 220 },
}

const BADGE_BG: Record<1 | 2 | 3, string> = {
  1: 'rgba(255,255,255,0.28)',
  2: 'rgba(255,255,255,0.22)',
  3: 'rgba(255,255,255,0.22)',
}

const BANNER_AVA: Record<1 | 2 | 3, number> = { 1: 72, 2: 58, 3: 58 }

function PodiumScene({ entries, myUid, t }: {
  entries: (RankedPlayerData | null)[]
  myUid?: string
  t: ReturnType<typeof useTranslation>['t']
}) {
  const slots: { rank: 1 | 2 | 3; idx: number }[] = [
    { rank: 2, idx: 0 },
    { rank: 1, idx: 1 },
    { rank: 3, idx: 2 },
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, padding: '12px 4px 8px' }}>
      {slots.map(({ rank, idx }) => {
        const p = entries[idx]
        const isSelf = p?.uid === myUid
        const isFirst = rank === 1
        const aSize = BANNER_AVA[rank]
        const cfg = BANNER_CFG[rank]

        return (
          <div key={rank} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            flex: isFirst ? '0 0 36%' : '0 0 32%',
            position: 'relative',
          }}>
            {/* Crown pegada al borde naranja — rank 1 only */}
            {isFirst && (
              <i className="ri-vip-crown-2-fill" style={{
                fontSize: 28, color: '#ff9447', lineHeight: 1,
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35)) drop-shadow(0 0 10px rgba(255,148,71,0.7))',
                visibility: p ? 'visible' : 'hidden',
                position: 'relative', zIndex: 6,
                marginBottom: -69,
              }} />
            )}

            {/* Banner ribbon */}
            <div style={{
              width: '100%',
              height: cfg.h,
              background: cfg.bg,
              clipPath: 'polygon(0 0, 100% 0, 100% 88%, 50% 100%, 0 88%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              paddingTop: isFirst ? 74 : 62,
              gap: 6,
              position: 'relative',
              boxShadow: `0 8px 28px ${cfg.glowColor}`,
            }}>

              {/* 3D shine — top highlight */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.28) 0%, transparent 100%)',
                pointerEvents: 'none',
              }} />
              {/* 3D side shadows */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to right, rgba(0,0,0,0.14) 0%, transparent 28%, transparent 72%, rgba(0,0,0,0.14) 100%)',
                pointerEvents: 'none',
              }} />

              {/* No.X badge — top right corner */}
              <div style={{
                position: 'absolute', top: 0, right: 0,
                background: BADGE_BG[rank],
                border: '1px solid rgba(255,255,255,0.5)',
                borderRadius: '0px 0 0px 8px',
                padding: '4px 9px 5px',
                backdropFilter: 'blur(4px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                zIndex: 4,
              }}>
                <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.9)', lineHeight: 1, letterSpacing: 0.3 }}>No.</span>
                <span style={{ fontSize: 30, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{rank}</span>
              </div>

              {/* Avatar */}
              {p ? (
                <Avatar photoURL={p.photoURL} displayName={p.displayName} size={aSize} rank={rank} />
              ) : (
                <div style={{
                  width: aSize, height: aSize, borderRadius: '50%',
                  border: '2px dashed rgba(255,255,255,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="ri-question-line" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }} />
                </div>
              )}

              {/* Name */}
              <span style={{
                fontSize: isFirst ? 13 : 11, fontWeight: 900,
                color: '#fff',
                textAlign: 'center',
                paddingLeft: 8, paddingRight: 8,
                maxWidth: '90%',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                textShadow: '0 1px 4px rgba(0,0,0,0.35)',
              }}>
                {p ? (isSelf ? t('map.ranking_you') : p.displayName) : '—'}
              </span>

              {/* Score */}
              {p && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: 'rgba(255,255,255,0.75)',
                }}>
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


function ScoreBadge({ score }: { score: number | string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
      background: 'rgba(0,187,180,0.07)',
      border: '1.5px solid rgba(0,187,180,0.22)',
      borderRadius: 10,
      padding: '5px 10px',
    }}>
      <i className="ri-star-fill" style={{ color: '#ff9447', fontSize: 12 }} />
      <span style={{ fontSize: 11, fontWeight: 900, color: '#096d7d', letterSpacing: 0.3 }}>
        {score}
      </span>
    </div>
  )
}

export default function Ranking({ onClose, onContinue, hasMoreStages: _hasMoreStages = true }: Props) {
  const { t } = useTranslation()
  const myUid = auth.currentUser?.uid

  const [topTen, setTopTen] = useState<RankedPlayerData[]>([])
  const [myPosition, setMyPosition] = useState<MyPosition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [listAtBottom, setListAtBottom] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    Promise.all([getTopTen(), getMyPositionsRanking()])
      .then(([top, my]) => {
        if (cancelled) return
        setTopTen(top)
        setMyPosition(my)
      })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })

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
      className="fixed inset-0 z-999 flex flex-col animate-card-boing"
      style={{ background: 'linear-gradient(to bottom, #075f6e 0%, #00bbb4 100%)' }}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 pt-7 pb-5">
        <button
          onClick={onContinue}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: 'rgba(255,255,255,0.18)' }}
        >
          <i className="ri-map-2-line text-xl text-white" />
        </button>
        <span className="font-black text-white text-base tracking-widest uppercase">
          {t('map.ranking_title')}
        </span>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: 'rgba(255,255,255,0.18)' }}
        >
          <i className="ri-close-line text-xl text-white" />
        </button>
      </div>

      {/* White card */}
      <div
        className="flex-1 min-h-0 rounded-t-3xl overflow-hidden flex flex-col"
        style={{
          background: '#ffffff',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
        }}
      >
        {/* Loading */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div
                className="h-8 w-8 animate-spin rounded-full border-4"
                style={{ borderColor: '#00bbb4', borderTopColor: 'transparent' }}
              />
              <span className="text-xs font-bold" style={{ color: '#096d7d' }}>
                {t('map.ranking_loading')}
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center">
              <i className="ri-wifi-off-line text-3xl mb-2" style={{ color: 'rgba(0,187,180,0.35)' }} />
              <p className="text-sm" style={{ color: '#096d7d' }}>
                {t('map.ranking_error')}
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            <div className="px-4 pt-12 flex flex-col gap-4 shrink-0">
              {podiumOrdered.some(Boolean) && (
                <PodiumScene entries={podiumOrdered} myUid={myUid} t={t} />
              )}

            </div>

            {/* Mi posición — fija arriba, siempre visible */}
            {showMyRow && myPosition && (
              <div className="shrink-0 px-4 pt-3 pb-2">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,187,180,0.25))' }} />
                  <span style={{ fontSize: 9, color: 'rgba(9,109,125,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('map.ranking_your_position')}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(0,187,180,0.25), transparent)' }} />
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px',
                  borderRadius: 14,
                  background: 'rgba(0,187,180,0.09)',
                  border: '1.5px solid rgba(0,187,180,0.4)',
                  boxShadow: '0 4px 14px rgba(0,187,180,0.14)',
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: '#096d7d',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ color: '#fff', fontSize: 12, fontWeight: 900, lineHeight: 1 }}>
                      {myPosition.ranking}
                    </span>
                  </div>
                  <SquareAvatar
                    photoURL={auth.currentUser?.photoURL ?? undefined}
                    displayName={auth.currentUser?.displayName ?? '?'}
                    isSelf={true}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      display: 'block',
                      fontSize: 11, fontWeight: 900,
                      color: '#096d7d',
                      textTransform: 'uppercase', letterSpacing: 0.4,
                    }}>
                      {t('map.ranking_you')}
                    </span>
                  </div>
                  <ScoreBadge score={myPosition.score} />
                </div>
              </div>
            )}


            {/* Scrollable list */}
            <div className="flex-1 min-h-0 relative">
              {/* Fade bottom overlay — dinámico */}
              <div
                className="absolute bottom-0 left-0 right-0 pointer-events-none z-10 transition-opacity duration-300"
                style={{
                  height: 64,
                  background: 'linear-gradient(to bottom, transparent, #ffffff)',
                  opacity: listAtBottom ? 0 : 1,
                }}
              />
              <div
                className="h-full overflow-y-auto px-4 py-3 flex flex-col gap-2"
                style={{ scrollbarWidth: 'none' }}
                onScroll={(e) => {
                  const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
                  setListAtBottom(scrollTop + clientHeight >= scrollHeight - 16)
                }}
              >
              {listPlayers.map((p) => {
                const isSelf = p.uid === myUid
                return (
                  <div
                    key={p.uid}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px',
                      borderRadius: 14,
                      background: isSelf ? 'rgba(0,187,180,0.09)' : 'rgba(0,187,180,0.02)',
                      border: `1.5px solid ${isSelf ? 'rgba(0,187,180,0.4)' : 'rgba(0,187,180,0.1)'}`,
                      boxShadow: isSelf ? '0 4px 14px rgba(0,187,180,0.14)' : '0 2px 6px rgba(9,109,125,0.04)',
                    }}
                  >
                    {/* Position circle */}
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: isSelf ? '#096d7d' : 'rgba(9,109,125,0.07)',
                      border: `1.5px solid ${isSelf ? '#096d7d' : 'rgba(0,187,180,0.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{ color: isSelf ? '#fff' : '#096d7d', fontSize: 12, fontWeight: 900, lineHeight: 1 }}>
                        {p.ranking}
                      </span>
                    </div>

                    <SquareAvatar photoURL={p.photoURL} displayName={p.displayName} isSelf={isSelf} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        display: 'block',
                        fontSize: 11, fontWeight: 900,
                        color: isSelf ? '#096d7d' : '#374151',
                        textTransform: 'uppercase', letterSpacing: 0.4,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {isSelf ? t('map.ranking_you') : p.displayName}
                      </span>
                    </div>

                    <ScoreBadge score={p.score} />
                  </div>
                )
              })}

              {topTen.length === 0 && (
                <div className="flex-1 flex items-center justify-center py-8">
                  <p className="text-sm text-center" style={{ color: '#096d7d' }}>
                    {t('map.ranking_empty')}
                  </p>
                </div>
              )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
