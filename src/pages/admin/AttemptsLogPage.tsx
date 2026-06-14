import { useEffect, useRef, useState } from 'react'
import { collectionGroup, query, orderBy, limit, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'

interface LiveAttempt {
  id: string
  playerId: string
  questionText: string
  questionTextEn: string
  stopId: string
  seasonId: string
  correct: boolean
  timeMs: number
  pointsAwarded: number
  isBonus: boolean
  attemptNumber: number
  answeredAt: Date | null
  clientAnsweredAt: Date | null
}

interface PlayerInfo {
  displayName: string
  email: string
}

interface StopInfo {
  name: string
  nameEn: string
  stageId: string
  stageNumber: number | null
}

function initials(name: string) {
  return name
    .split(' ')
    .map(n => n[0] || '')
    .join('')
    .substring(0, 2)
    .toUpperCase() || '?'
}

function formatMs(ms: number) {
  if (ms < 1000) return `${ms}ms`
  const s = Math.floor(ms / 1000)
  const d = Math.floor((ms % 1000) / 100)
  return `${s}.${d}s`
}

function timeAgo(date: Date | null) {
  if (!date) return '-'
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 5) return 'ahora'
  if (diff < 60) return `hace ${diff}s`
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`
  return `hace ${Math.floor(diff / 3600)}h`
}

const AVATAR_COLORS = [
  '#1B2B6E', '#2BBFB8', '#E63329', '#F4762B', '#3CAD42', '#7C3AED'
]

function avatarColor(uid: string) {
  let h = 0
  for (let i = 0; i < uid.length; i++) h = uid.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

export default function AttemptsLogPage() {
  const [attempts, setAttempts] = useState<LiveAttempt[]>([])
  const [playerCache, setPlayerCache] = useState<Map<string, PlayerInfo>>(new Map())
  const [stopCache, setStopCache] = useState<Map<string, StopInfo>>(new Map())
  const [paused, setPaused] = useState(false)
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all')
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const [indexError, setIndexError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const pausedRef = useRef(false)
  const bufferedRef = useRef<LiveAttempt[]>([])
  const fetchingRef = useRef<Set<string>>(new Set())
  const fetchingStopsRef = useRef<Set<string>>(new Set())

  // Tick every 30s to refresh relative timestamps
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(iv)
  }, [])
  void tick

  // Fetch player info lazily, cached in state
  async function ensurePlayers(ids: string[], cache: Map<string, PlayerInfo>) {
    const missing = ids.filter(id => !cache.has(id) && !fetchingRef.current.has(id))
    if (missing.length === 0) return

    missing.forEach(id => fetchingRef.current.add(id))

    const fetched = await Promise.all(
      missing.map(async id => {
        try {
          const snap = await getDoc(doc(db, 'players', id))
          const d = snap.data()
          return [id, { displayName: d?.displayName || d?.firstName || 'Jugador', email: d?.email || '' }] as const
        } catch {
          return [id, { displayName: 'Jugador', email: '' }] as const
        }
      })
    )

    setPlayerCache(prev => {
      const next = new Map(prev)
      fetched.forEach(([id, info]) => next.set(id, info))
      return next
    })
  }

  // Fetch stop + stage info lazily, cached in state
  async function ensureStops(attempts: LiveAttempt[], cache: Map<string, StopInfo>) {
    const missing = attempts.filter(a => a.stopId && !cache.has(a.stopId) && !fetchingStopsRef.current.has(a.stopId))
    if (missing.length === 0) return

    const uniqueStopIds = [...new Set(missing.map(a => a.stopId))]
    uniqueStopIds.forEach(id => fetchingStopsRef.current.add(id))

    const fetched = await Promise.all(
      uniqueStopIds.map(async stopId => {
        try {
          const snap = await getDoc(doc(db, 'stops', stopId))
          const d = snap.data()
          const stageId = d?.stageId || ''
          let stageNumber: number | null = null

          // Find seasonId from one of the attempts for this stop
          const seasonId = missing.find(a => a.stopId === stopId)?.seasonId || ''
          if (stageId && seasonId) {
            try {
              const stageSnap = await getDoc(doc(db, 'seasons', seasonId, 'stages', stageId))
              stageNumber = stageSnap.exists() ? (stageSnap.data()?.number ?? null) : null
            } catch { /* ignore */ }
          }

          return [stopId, { name: d?.name || stopId, nameEn: d?.nameEn || '', stageId, stageNumber }] as const
        } catch {
          return [stopId, { name: stopId, nameEn: '', stageId: '', stageNumber: null }] as const
        }
      })
    )

    setStopCache(prev => {
      const next = new Map(prev)
      fetched.forEach(([id, info]) => next.set(id, info))
      return next
    })
  }

  useEffect(() => {
    let unsub: (() => void) | undefined

    try {
      const q = query(
        collectionGroup(db, 'attempts'),
        orderBy('answeredAt', 'desc'),
        limit(100)
      )

      unsub = onSnapshot(
        q,
        snap => {
        const incoming: LiveAttempt[] = snap.docs.map(d => {
          const data = d.data()
          const playerId = d.ref.parent.parent?.id || ''
          let answeredAt: Date | null = null
          if (data.answeredAt?.toDate) answeredAt = data.answeredAt.toDate()
          else if (typeof data.answeredAt?.seconds === 'number')
            answeredAt = new Date(data.answeredAt.seconds * 1000)

          let clientAnsweredAt: Date | null = null
          if (data.clientAnsweredAt?.toDate) clientAnsweredAt = data.clientAnsweredAt.toDate()
          else if (typeof data.clientAnsweredAt?.seconds === 'number')
            clientAnsweredAt = new Date(data.clientAnsweredAt.seconds * 1000)

          return {
            id: d.id,
            playerId,
            questionText: data.questionText || '',
            questionTextEn: data.questionTextEn || '',
            stopId: data.stopId || '',
            seasonId: data.seasonId || '',
            correct: data.correct === true,
            timeMs: typeof data.timeMs === 'number' ? data.timeMs : 0,
            pointsAwarded: typeof data.pointsAwarded === 'number' ? data.pointsAwarded : 0,
            isBonus: data.isBonus === true,
            attemptNumber: typeof data.attemptNumber === 'number' ? data.attemptNumber : 1,
            answeredAt,
            clientAnsweredAt,
          }
        })

        if (pausedRef.current) {
          bufferedRef.current = incoming
          return
        }

        // Mark entries added since last render as "new"
        setAttempts(prev => {
          const prevIds = new Set(prev.map(a => a.id))
          const fresh = incoming.filter(a => !prevIds.has(a.id)).map(a => a.id)
          if (fresh.length > 0) {
            setNewIds(n => {
              const next = new Set([...n, ...fresh])
              setTimeout(() => setNewIds(cur => {
                const clean = new Set(cur)
                fresh.forEach(id => clean.delete(id))
                return clean
              }), 2500)
              return next
            })
          }
          return incoming
        })

        const uniquePlayerIds = [...new Set(incoming.map(a => a.playerId))]
        setPlayerCache(cache => { ensurePlayers(uniquePlayerIds, cache); return cache })
        setStopCache(cache => { ensureStops(incoming, cache); return cache })
      },
      err => {
        console.error('[AttemptsLog]', err)
        setIndexError(err.message)
      }
    )
    } catch (err: any) {
      console.error('[AttemptsLog] setup error:', err)
      setIndexError(
        err?.message ||
        'Error al inicializar el live feed. El índice de Firestore probablemente no está desplegado aún.'
      )
    }

    return () => unsub?.()
  }, [])

  function handlePause() {
    pausedRef.current = true
    setPaused(true)
  }

  function handleResume() {
    pausedRef.current = false
    setPaused(false)
    if (bufferedRef.current.length > 0) {
      const incoming = bufferedRef.current
      bufferedRef.current = []
      setAttempts(incoming)
      const uniquePlayerIds = [...new Set(incoming.map(a => a.playerId))]
      setPlayerCache(cache => { ensurePlayers(uniquePlayerIds, cache); return cache })
      setStopCache(cache => { ensureStops(incoming, cache); return cache })
    }
  }

  const displayed = attempts.filter(a =>
    filter === 'all' ? true : filter === 'correct' ? a.correct : !a.correct
  )

  const totalToday = attempts.filter(a => {
    if (!a.answeredAt) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return a.answeredAt >= today
  }).length

  const correctRate = attempts.length > 0
    ? Math.round((attempts.filter(a => a.correct).length / attempts.length) * 100)
    : 0

  return (
    <div style={{ animation: 'fade-in 0.3s ease-out' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          {/* Live indicator */}
          <div style={{ position: 'relative', width: 10, height: 10 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: paused ? 'var(--color-gray-mid)' : 'var(--color-green)',
            }} />
            {!paused && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'var(--color-green)',
                animation: 'live-ping 1.4s ease-out infinite',
              }} />
            )}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 26, margin: 0 }}>
            Live Feed · Intentos
          </h1>
          {paused && (
            <span style={{
              background: 'rgba(160,168,184,0.15)', color: 'var(--color-gray-dark)',
              padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800,
              border: '1px solid var(--color-border)'
            }}>
              PAUSADO
            </span>
          )}
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
          Registro en tiempo real de los intentos de todos los jugadores
        </p>
      </div>

      {/* Stats + controls bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>

        {/* Stats chips */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--shadow-card)' }}>
            <i className="ri-list-check-3" style={{ color: 'var(--color-navy)', fontSize: 15 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy)' }}>{attempts.length}</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>total</span>
          </div>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--shadow-card)' }}>
            <i className="ri-calendar-line" style={{ color: 'var(--color-teal)', fontSize: 15 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-teal)' }}>{totalToday}</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>hoy</span>
          </div>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--shadow-card)' }}>
            <i className="ri-percent-line" style={{ color: 'var(--color-green)', fontSize: 15 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-green)' }}>{correctRate}%</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>aciertos</span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Filter pills */}
        <div style={{ display: 'flex', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 3, gap: 2 }}>
          {(['all', 'correct', 'incorrect'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                height: 32, padding: '0 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
                background: filter === f ? 'var(--color-navy)' : 'transparent',
                color: filter === f ? '#fff' : 'var(--color-text-muted)',
                transition: 'background 150ms ease, color 150ms ease',
              }}
            >
              {f === 'all' ? 'Todos' : f === 'correct' ? '✓ Correctos' : '✗ Incorrectos'}
            </button>
          ))}
        </div>

        {/* Pause / Resume */}
        <button
          onClick={paused ? handleResume : handlePause}
          style={{
            height: 38, padding: '0 16px', borderRadius: 10,
            border: '1px solid var(--color-border)',
            background: paused ? 'var(--color-green)' : 'var(--color-surface)',
            color: paused ? '#fff' : 'var(--color-navy)',
            fontSize: 13, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: 'var(--shadow-card)',
            transition: 'background 150ms ease, color 150ms ease',
          }}
        >
          <i className={paused ? 'ri-play-line' : 'ri-pause-line'} style={{ fontSize: 15 }} />
          {paused ? 'Reanudar' : 'Pausar'}
        </button>
      </div>

      {/* Index error */}
      {indexError && (
        <div style={{ background: 'rgba(230,51,41,0.06)', border: '1.5px solid rgba(230,51,41,0.25)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontWeight: 800, color: 'var(--color-error)', fontSize: 14, marginBottom: 4 }}>
            <i className="ri-error-warning-line" style={{ marginRight: 6 }} />
            Error de Firestore — probablemente falta un índice de collection group
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', wordBreak: 'break-word' }}>{indexError}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
            Si el error incluye un enlace, ábrelo en Firebase Console para crear el índice automáticamente.
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 16, boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>

        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr 130px 100px 70px 70px 70px 80px',
          gap: 0,
          background: '#f8f9fb',
          borderBottom: '1px solid var(--color-border)',
          padding: '10px 20px',
        }}>
          {['Jugador', 'Pregunta', 'Parada', 'Resultado', 'Tiempo', 'Puntos', 'Intento', 'Hace'].map((h, i) => (
            <div key={h} style={{
              fontSize: 11, fontWeight: 800, color: 'var(--color-gray-dark)',
              textTransform: 'uppercase', letterSpacing: 0.5,
              textAlign: i > 1 ? 'center' : 'left',
            }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {displayed.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <i className="ri-radar-line" style={{ fontSize: 48, color: 'var(--color-gray-mid)', display: 'block', marginBottom: 12 }} />
            <div style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: 16, marginBottom: 4 }}>
              {indexError ? 'Error al conectar el feed' : 'Esperando intentos...'}
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
              {indexError ? 'Revisa el error arriba.' : 'Los intentos aparecerán aquí en tiempo real.'}
            </div>
          </div>
        ) : (
          displayed.map(a => {
            const player = playerCache.get(a.playerId)
            const name = player?.displayName || '...'
            const email = player?.email || ''
            const isNew = newIds.has(a.id)
            const bg = avatarColor(a.playerId)

            return (
              <div
                key={a.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '220px 1fr 130px 100px 70px 70px 70px 80px',
                  gap: 0,
                  padding: '12px 20px',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--color-border)',
                  background: isNew ? 'rgba(245,200,0,0.07)' : 'transparent',
                  transition: 'background 0.8s ease',
                  animation: isNew ? 'slide-in 0.3s ease-out' : 'none',
                }}
              >
                {/* Player */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: bg, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-display)',
                  }}>
                    {initials(name)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {name}
                      {isNew && (
                        <span style={{ marginLeft: 6, background: 'var(--color-yellow)', color: 'var(--color-navy)', padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 800, verticalAlign: 'middle' }}>
                          NEW
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-gray-mid)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {email}
                    </div>
                  </div>
                </div>

                {/* Question */}
                <div style={{ paddingRight: 16, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {a.questionText || a.questionTextEn || '—'}
                  </div>
                  {a.isBonus && (
                    <span style={{ background: 'rgba(251,191,36,0.15)', color: '#d97706', padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, display: 'inline-block', marginTop: 3 }}>
                      BONUS
                    </span>
                  )}
                </div>

                {/* Stop */}
                <div style={{ textAlign: 'center' }}>
                  {(() => {
                    const stop = stopCache.get(a.stopId)
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        {stop?.stageNumber != null && (
                          <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(27,43,110,0.1)', color: 'var(--color-navy)', padding: '1px 5px', borderRadius: 4 }}>
                            ETAPA {stop.stageNumber}
                          </span>
                        )}
                        <span style={{ fontSize: 11, background: 'rgba(27,43,110,0.06)', color: 'var(--color-navy)', padding: '2px 7px', borderRadius: 6, fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {stop?.name || a.stopId}
                        </span>
                      </div>
                    )
                  })()}
                </div>

                {/* Result */}
                <div style={{ textAlign: 'center' }}>
                  {a.correct ? (
                    <span style={{ background: 'rgba(60,173,66,0.1)', color: 'var(--color-green)', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <i className="ri-checkbox-circle-fill" style={{ fontSize: 13 }} /> Correcta
                    </span>
                  ) : (
                    <span style={{ background: 'rgba(230,51,41,0.08)', color: 'var(--color-error)', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <i className="ri-close-circle-fill" style={{ fontSize: 13 }} /> Incorrecta
                    </span>
                  )}
                </div>

                {/* Time */}
                <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  {formatMs(a.timeMs)}
                </div>

                {/* Points */}
                <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 800, color: a.pointsAwarded > 0 ? 'var(--color-navy)' : 'var(--color-gray-mid)' }}>
                  {a.pointsAwarded > 0 ? `+${a.pointsAwarded}` : '0'}
                </div>

                {/* Attempt # */}
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    fontSize: 12, fontWeight: 800,
                    color: a.attemptNumber === 1 ? 'var(--color-teal)' : 'var(--color-orange)',
                    background: a.attemptNumber === 1 ? 'rgba(43,191,184,0.08)' : 'rgba(244,118,43,0.08)',
                    padding: '3px 8px', borderRadius: 6,
                  }}>
                    #{a.attemptNumber}
                  </span>
                </div>

                {/* Timestamp */}
                <div
                  style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-gray-mid)', cursor: 'default' }}
                  title={(a.clientAnsweredAt ?? a.answeredAt)?.toLocaleString('es-DO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) ?? ''}
                >
                  {timeAgo(a.clientAnsweredAt ?? a.answeredAt)}
                </div>
              </div>
            )
          })
        )}
      </div>

      {displayed.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--color-gray-mid)' }}>
          Mostrando los últimos {displayed.length} intentos · Las entradas más recientes aparecen primero
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes slide-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        @keyframes live-ping {
          0%   { transform: scale(1);   opacity: 0.8; }
          80%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
