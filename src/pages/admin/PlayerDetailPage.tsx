import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  fetchPlayerDetail,
  updatePlayerBannedStatus,
  updatePlayerActiveStatus,
  fetchPlayerAttempts,
  resetPlayerProgress,
  deletePlayerAccount,
  sendAdminPasswordResetEmail,
  sendAdminCustomEmail,
  getMyPositionsRanking,
  fetchPlayerStatus,
  type PlayerData,
  type QuestionAttemptSummary,
  type PlayerStatusResult
} from '../../services/adminService'

export default function PlayerDetailPage() {
  const { playerId } = useParams<{ playerId: string }>()
  const navigate = useNavigate()
  
  const [player, setPlayer] = useState<PlayerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeLoading, setActiveLoading] = useState(false)
  
  // Ranking states
  const [ranking, setRanking] = useState<number | null>(null)
  const [rankingLoading, setRankingLoading] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [attempts, setAttempts] = useState<QuestionAttemptSummary[]>([])
  const [attemptsLoading, setAttemptsLoading] = useState(true)
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
  const [attemptsError, setAttemptsError] = useState<string | null>(null)

  // Player status states
  const [playerStatus, setPlayerStatus] = useState<PlayerStatusResult | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [statusExpanded, setStatusExpanded] = useState(false)

  // Email action states
  const [emailLoading, setEmailLoading] = useState(false)
  const [customEmailModal, setCustomEmailModal] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)


  // Fetch player details and attempts on mount
  useEffect(() => {
    async function load() {
      if (!playerId) return
      try {
        setLoading(true)
        const data = await fetchPlayerDetail(playerId)
        setPlayer(data)

        // Load ranking position
        setRankingLoading(true)
        const posData = await getMyPositionsRanking(playerId)
        setRanking(posData.ranking)
        if (posData.score !== undefined) {
          setPlayer(prev => prev ? { ...prev, score: posData.score, baseScore: prev.score } : null)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al cargar los detalles del jugador'
        setError(msg)
      } finally {
        setLoading(false)
        setRankingLoading(false)
      }
    }
    async function loadAttempts() {
      if (!playerId) return
      try {
        setAttemptsLoading(true)
        const data = await fetchPlayerAttempts(playerId)
        setAttempts(data)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[fetchPlayerAttempts]', err)
        setAttemptsError(msg)
      } finally {
        setAttemptsLoading(false)
      }
    }
    async function loadStatus() {
      if (!playerId) return
      setStatusLoading(true)
      setStatusError(null)
      try {
        const data = await fetchPlayerStatus(playerId)
        setPlayerStatus(data)
      } catch (err) {
        setStatusError(err instanceof Error ? err.message : 'Error al consultar el status')
      } finally {
        setStatusLoading(false)
      }
    }

    load()
    loadAttempts()
    loadStatus()
  }, [playerId])

  // Handle Ban / Unban Toggle
  async function handleToggleBan() {
    if (!player || !playerId) return
    const newBanStatus = !player.banned
    try {
      setActionLoading(true)
      await updatePlayerBannedStatus(playerId, newBanStatus)
      setPlayer(prev => prev ? { ...prev, banned: newBanStatus } : null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar el estado de baneo')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Active / Inactive Toggle
  async function handleToggleActive() {
    if (!player || !playerId) return
    const newActive = player.active === false ? true : false
    try {
      setActiveLoading(true)
      await updatePlayerActiveStatus(playerId, newActive)
      setPlayer(prev => prev ? { ...prev, active: newActive } : null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar el estado del jugador')
    } finally {
      setActiveLoading(false)
    }
  }

  async function handleReset() {
    if (!playerId) return
    try {
      setResetLoading(true)
      const { attemptsDeleted, seasonsDeleted } = await resetPlayerProgress(playerId)
      setPlayer(prev => prev ? { ...prev, score: 0, mapProgress: {}, currentNodeId: null } : null)
      setAttempts([])
      setResetConfirm(false)
      setResetSuccess(`Jugador reiniciado correctamente. ${attemptsDeleted} intento(s) y ${seasonsDeleted} premio(s) eliminado(s).`)
      setTimeout(() => setResetSuccess(null), 5000)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al reiniciar el jugador')
    } finally {
      setResetLoading(false)
    }
  }

  async function handleDeleteAccount() {
    if (!playerId) return
    try {
      setDeleteLoading(true)
      await deletePlayerAccount(playerId)
      navigate('/admin/players')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar la cuenta')
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleFetchStatus() {
    if (!playerId) return
    setStatusLoading(true)
    setStatusError(null)
    try {
      const data = await fetchPlayerStatus(playerId)
      setPlayerStatus(data)
      setStatusExpanded(true)
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Error al consultar el status')
    } finally {
      setStatusLoading(false)
    }
  }

  async function handleSendPasswordReset() {
    if (!player || !player.email) return
    if (emailLoading) return
    setEmailLoading(true)
    setEmailStatus(null)
    try {
      await sendAdminPasswordResetEmail(player.email)
      setEmailStatus({
        type: 'success',
        text: `Enlace de restablecimiento de contraseña enviado a ${player.email}`
      })
      setTimeout(() => setEmailStatus(null), 6000)
    } catch (err) {
      console.error(err)
      setEmailStatus({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al enviar el correo'
      })
      setTimeout(() => setEmailStatus(null), 6000)
    } finally {
      setEmailLoading(false)
    }
  }

  async function handleSendCustomEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!player || !player.email) return
    if (!emailSubject.trim() || !emailBody.trim()) return
    if (emailLoading) return
    setEmailLoading(true)
    setEmailStatus(null)
    try {
      await sendAdminCustomEmail(player.email, emailSubject, emailBody)
      setEmailStatus({
        type: 'success',
        text: `Correo personalizado enviado a ${player.email}`
      })
      setCustomEmailModal(false)
      setEmailSubject('')
      setEmailBody('')
      setTimeout(() => setEmailStatus(null), 6000)
    } catch (err) {
      console.error(err)
      setEmailStatus({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al enviar el correo'
      })
      setTimeout(() => setEmailStatus(null), 6000)
    } finally {
      setEmailLoading(false)
    }
  }


  // Helper to get initials
  const initials = player?.displayName
    ? player.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'P'

  // Stops counter: use live status when available, fall back to denormalized field
  const completedStops = playerStatus
    ? playerStatus.stages.reduce((sum, s) => sum + s.completedStops, 0)
    : (player?.completedStopsCount ?? 0)
  const totalStops = playerStatus
    ? playerStatus.stages.reduce((sum, s) => sum + s.totalStops, 0)
    : null

  function formatMs(ms: number | null) {
    if (ms === null) return '-'
    if (ms < 1000) return `${ms}ms`
    const s = Math.floor(ms / 1000)
    const rem = Math.floor((ms % 1000) / 100)
    return `${s}.${rem}s`
  }

  // Format date
  function formatDate(isoStr: string | null) {
    if (!isoStr) return '-'
    const date = new Date(isoStr)
    return date.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '4px solid rgba(27,43,110,0.1)',
            borderTopColor: 'var(--color-yellow)',
            animation: 'spin-circle 0.8s linear infinite'
          }} />
          <div style={{ color: 'var(--color-navy)', fontWeight: 700, fontSize: 15 }}>
            Cargando expediente del jugador...
          </div>
        </div>
        <style>{`@keyframes spin-circle { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error || !player) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-error)' }}>
        <i className="ri-error-warning-line" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
        <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: 20 }}>
          No se pudo encontrar el expediente
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: 15 }}>{error || 'El jugador no existe o fue eliminado.'}</p>
        <button
          onClick={() => navigate('/admin/players')}
          style={{
            height: 38, padding: '0 16px', borderRadius: 8,
            background: 'var(--color-navy)', border: 'none',
            color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Volver a la Lista
        </button>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fade-in 0.3s ease-out', maxWidth: 1000, margin: '0 auto' }}>
      
      {/* Top back button */}
      <button
        onClick={() => navigate('/admin/players')}
        style={{
          background: 'none', border: 'none', color: 'var(--color-navy)',
          fontSize: 14, fontWeight: 700, display: 'inline-flex', alignItems: 'center',
          gap: 6, cursor: 'pointer', padding: '8px 0', marginBottom: 16,
          transition: 'transform 150ms ease'
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(-3px)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
      >
        <i className="ri-arrow-left-line" style={{ fontSize: 16 }} />
        Volver a la lista de jugadores
      </button>

      {/* Main card header */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 16,
        padding: '24px 28px',
        boxShadow: 'var(--shadow-card)',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Initials Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--color-navy)', color: 'var(--color-yellow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700,
            boxShadow: '0 4px 12px rgba(27, 43, 110, 0.15)'
          }}>
            {initials}
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 26, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {player.displayName || `${player.firstName} ${player.lastName}`.trim() || 'Jugador Anónimo'}
              {rankingLoading ? (
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  background: 'rgba(0,0,0,0.05)',
                  padding: '4px 10px',
                  borderRadius: 20,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <i className="ri-loader-4-line ri-spin" />
                  Cargando puesto...
                </span>
              ) : ranking !== null ? (
                <span style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: ranking === 1 
                    ? '#b45309' 
                    : ranking === 2 
                    ? '#475569' 
                    : ranking === 3 
                    ? '#c2410c' 
                    : 'var(--color-navy)',
                  background: ranking === 1 
                    ? '#fef3c7' 
                    : ranking === 2 
                    ? '#f1f5f9' 
                    : ranking === 3 
                    ? '#ffedd5' 
                    : 'rgba(27,43,110,0.08)',
                  border: ranking === 1 
                    ? '1px solid rgba(251,191,36,0.5)' 
                    : ranking === 2 
                    ? '1px solid rgba(148,163,184,0.4)' 
                    : ranking === 3 
                    ? '1px solid rgba(249,115,22,0.4)' 
                    : '1px solid rgba(27,43,110,0.15)',
                  padding: '4px 12px',
                  borderRadius: 20,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                }}>
                  <i className="ri-medal-fill" style={{ 
                    color: ranking === 1 
                      ? '#d97706' 
                      : ranking === 2 
                      ? '#64748b' 
                      : ranking === 3 
                      ? '#ea580c' 
                      : 'var(--color-navy)',
                    fontSize: 15 
                  }} />
                  {ranking === 1 ? '1er Puesto (Oro)' : ranking === 2 ? '2do Puesto (Plata)' : ranking === 3 ? '3er Puesto (Bronce)' : `Puesto #${ranking}`}
                </span>
              ) : (
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--color-gray-dark)',
                  background: 'rgba(160,168,184,0.15)',
                  padding: '4px 10px',
                  borderRadius: 20
                }}>
                  Sin Clasificación
                </span>
              )}
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ri-mail-line" style={{ color: 'var(--color-gray-mid)' }} />
              {player.email}
              <span style={{ color: 'var(--color-border)' }}>|</span>
              <span style={{ fontSize: 12, color: 'var(--color-gray-mid)' }}>ID: {player.uid}</span>
            </p>
          </div>
        </div>

        {/* Banned status tag */}
        <div>
          {player.banned ? (
            <span style={{
              background: 'rgba(230,51,41,0.1)', color: 'var(--color-error)',
              padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 800,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              border: '1px solid rgba(230,51,41,0.2)'
            }}>
              <i className="ri-prohibited-line" />
              CUENTA SUSPENDIDA
            </span>
          ) : (
            <span style={{
              background: 'rgba(60,173,66,0.1)', color: 'var(--color-green)',
              padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 800,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              border: '1px solid rgba(60,173,66,0.2)'
            }}>
              <i className="ri-checkbox-circle-line" />
              ACTIVO
            </span>
          )}
        </div>
      </div>

      {/* Main details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        
        {/* Left column: Profile inputs */}
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 16,
          padding: 24,
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: 18
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: '0 0 8px', borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
            Información del Perfil
          </h2>

          {/* Row components */}
          {[
            { label: 'Nombre Completo', value: player.displayName || '-' },
            { label: 'Correo Electrónico', value: player.email || '-' },
            { label: 'Nacionalidad', value: player.nationality || 'No especificada' },
            { label: 'Género', value: player.gender || 'No especificado' },
            { label: 'Rango de Edad', value: player.ageRange || 'No especificado' },
            { label: 'Idioma de Preferencia', value: player.preferredLang === 'es' ? 'Español (ES)' : 'Inglés (EN)' },
            { label: 'Fecha de Registro', value: formatDate(player.createdAt) }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-gray-mid)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {item.label}
              </label>
              <input
                type="text"
                readOnly
                value={item.value}
                style={{
                  width: '100%', height: 38, borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  background: '#f8f9fb', color: 'var(--color-text)',
                  padding: '0 12px', fontSize: 14,
                  fontFamily: 'var(--font-body)', outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          ))}
        </div>

        {/* Right column: Progress stats & ban controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Card 1: Stats */}
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 16,
            padding: 24,
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: '0 0 8px', borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
              Progreso en el Desafío Cultural
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12 }}>
              {/* Score indicator */}
              <div style={{ background: 'rgba(27,43,110,0.04)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Puntaje Real
                </span>
                <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--color-navy)', marginTop: 4 }}>
                  {player.score.toLocaleString()}
                </div>
                {player.baseScore !== undefined ? (
                  <span style={{ fontSize: 11, color: 'var(--color-gray-mid)' }}>Base: {player.baseScore.toLocaleString()} pts</span>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--color-gray-mid)' }}>puntos</span>
                )}
              </div>

              {/* Ranking Position indicator */}
              <div style={{ 
                background: ranking === 1 
                  ? 'rgba(251,191,36,0.1)' 
                  : ranking === 2 
                  ? 'rgba(148,163,184,0.1)' 
                  : ranking === 3 
                  ? 'rgba(249,115,22,0.1)' 
                  : 'rgba(27,43,110,0.04)', 
                borderRadius: 12, 
                padding: 14, 
                textAlign: 'center' 
              }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Puesto Global
                </span>
                <div style={{ 
                  fontSize: 24, 
                  fontFamily: 'var(--font-display)', 
                  color: ranking === 1 
                    ? '#b45309' 
                    : ranking === 2 
                    ? '#475569' 
                    : ranking === 3 
                    ? '#c2410c' 
                    : 'var(--color-navy)', 
                  marginTop: 4 
                }}>
                  {rankingLoading ? (
                    <i className="ri-loader-4-line ri-spin" style={{ fontSize: 20 }} />
                  ) : ranking !== null ? (
                    `#${ranking}`
                  ) : (
                    '-'
                  )}
                </div>
                <span style={{ fontSize: 11, color: 'var(--color-gray-mid)' }}>ranking</span>
              </div>

              {/* Stops indicator */}
              <div style={{ background: 'rgba(43,191,184,0.06)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Paradas
                </span>
                <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--color-teal)', marginTop: 4 }}>
                  {completedStops} / {totalStops ?? '—'}
                </div>
                <span style={{ fontSize: 11, color: 'var(--color-gray-mid)' }}>completadas</span>
              </div>
            </div>

            {/* Current node */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-gray-mid)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Parada Actual
              </label>
              <div style={{
                minHeight: 38, borderRadius: 8,
                border: `1px solid ${playerStatus ? 'rgba(27,43,110,0.25)' : 'var(--color-border)'}`,
                background: playerStatus ? 'rgba(27,43,110,0.03)' : '#f8f9fb',
                color: 'var(--color-text)',
                padding: '0 12px', fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <i className="ri-map-pin-2-line" style={{ color: 'var(--color-orange)' }} />
                {playerStatus ? (() => {
                  const currentStage = playerStatus.stages.find(s => s.number === playerStatus.currentStageNumber)
                  const currentStop = currentStage?.stops.find(s => s.visited && !s.completed)
                    ?? currentStage?.stops.find(s => !s.visited)
                    ?? currentStage?.stops[currentStage.stops.length - 1]
                  return playerStatus.finished
                    ? <span style={{ color: 'var(--color-teal)', fontWeight: 700 }}>Desafío completado</span>
                    : currentStop
                      ? <span><strong>{currentStop.name}</strong>{currentStop.nameEn ? ` / ${currentStop.nameEn}` : ''}</span>
                      : <span style={{ color: 'var(--color-text-muted)' }}>Sin iniciar</span>
                })() : (
                  <span style={{ color: 'var(--color-text-muted)' }}>{player.currentNodeId || 'Consulta el status para ver la parada actual'}</span>
                )}
              </div>
            </div>

            {/* Status button & error */}
            {statusError && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(230,51,41,0.07)', border: '1px solid rgba(230,51,41,0.2)', color: 'var(--color-error)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ri-error-warning-line" />
                {statusError}
              </div>
            )}

            <button
              onClick={handleFetchStatus}
              disabled={statusLoading}
              style={{
                height: 38, borderRadius: 8, border: 'none',
                background: 'var(--color-navy)', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: statusLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '0 16px', opacity: statusLoading ? 0.7 : 1,
                alignSelf: 'flex-start', transition: 'opacity 150ms ease',
                boxShadow: '0 4px 12px rgba(27,43,110,0.15)'
              }}
            >
              {statusLoading
                ? <><i className="ri-loader-4-line" style={{ animation: 'spin-circle 0.8s linear infinite' }} />Consultando...</>
                : <><i className="ri-map-2-line" />{playerStatus ? 'Actualizar Status' : 'Ver Status del Jugador'}</>
              }
            </button>

            {/* Status panel — stages breakdown */}
            {playerStatus && statusExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-gray-mid)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Desglose por Etapa
                  </span>
                  <button
                    onClick={() => setStatusExpanded(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-mid)', fontSize: 12, padding: '2px 6px' }}
                  >
                    <i className="ri-eye-off-line" /> Ocultar
                  </button>
                </div>

                {playerStatus.finished && (
                  <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(43,191,184,0.08)', border: '1px solid rgba(43,191,184,0.25)', color: 'var(--color-teal)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="ri-trophy-line" style={{ fontSize: 15 }} />
                    Desafío completado — todas las etapas finalizadas
                  </div>
                )}

                {playerStatus.stages.map(stage => {
                  const pct = stage.totalStops > 0 ? Math.round((stage.completedStops / stage.totalStops) * 100) : 0
                  const isCurrent = stage.number === playerStatus.currentStageNumber
                  return (
                    <div key={stage.id} style={{
                      borderRadius: 10,
                      border: `1.5px solid ${stage.completed ? 'rgba(43,191,184,0.3)' : isCurrent ? 'rgba(27,43,110,0.25)' : 'var(--color-border)'}`,
                      background: stage.completed ? 'rgba(43,191,184,0.04)' : isCurrent ? 'rgba(27,43,110,0.03)' : '#fafbfd',
                      overflow: 'hidden'
                    }}>
                      {/* Stage header */}
                      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            width: 22, height: 22, borderRadius: '50%', fontSize: 11, fontWeight: 800,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: stage.completed ? 'var(--color-teal)' : isCurrent ? 'var(--color-navy)' : '#d1d5db',
                            color: '#fff', flexShrink: 0
                          }}>
                            {stage.completed ? <i className="ri-check-line" style={{ fontSize: 12 }} /> : stage.number}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: 13, color: stage.completed ? 'var(--color-teal)' : 'var(--color-navy)' }}>
                            Etapa {stage.number}
                            {isCurrent && !stage.completed && (
                              <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, background: 'rgba(27,43,110,0.1)', color: 'var(--color-navy)', padding: '1px 6px', borderRadius: 4 }}>
                                ACTUAL
                              </span>
                            )}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                          {stage.completedStops}/{stage.totalStops} paradas · {pct}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div style={{ height: 3, background: '#e5e7eb', margin: '0 14px 10px' }}>
                        <div style={{
                          height: '100%', borderRadius: 2,
                          width: `${pct}%`,
                          background: stage.completed ? 'var(--color-teal)' : 'var(--color-navy)',
                          transition: 'width 400ms ease'
                        }} />
                      </div>

                      {/* Stops list */}
                      <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {stage.stops.map(stop => (
                          <div key={stop.id} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '5px 8px', borderRadius: 6,
                            background: stop.completed
                              ? 'rgba(43,191,184,0.07)'
                              : stop.visited
                              ? 'rgba(251,191,36,0.07)'
                              : 'transparent'
                          }}>
                            <i
                              className={stop.completed ? 'ri-checkbox-circle-fill' : stop.visited ? 'ri-time-line' : 'ri-map-pin-line'}
                              style={{
                                fontSize: 14, flexShrink: 0,
                                color: stop.completed ? 'var(--color-teal)' : stop.visited ? '#d97706' : '#d1d5db'
                              }}
                            />
                            <span style={{ fontSize: 12, fontWeight: stop.visited || stop.completed ? 600 : 400, color: stop.completed ? 'var(--color-teal)' : stop.visited ? 'var(--color-text)' : 'var(--color-text-muted)', flex: 1 }}>
                              {stop.name || stop.id}
                            </span>
                            <span style={{
                              fontSize: 10, fontWeight: 700,
                              color: stop.completed ? 'var(--color-teal)' : stop.visited ? '#d97706' : 'var(--color-gray-mid)'
                            }}>
                              {stop.completed ? 'Completada' : stop.visited ? 'En progreso' : 'Pendiente'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Card 2: Active / Inactive status */}
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 16,
            padding: 24,
            boxShadow: 'var(--shadow-card)',
            border: player.active === false ? '1.5px solid rgba(160,168,184,0.4)' : '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: 0 }}>
              Estado de Cuenta
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
              Activa o desactiva la cuenta del jugador para controlar su acceso al desafío cultural sin suspenderla permanentemente.
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 10,
              background: player.active === false ? 'rgba(160,168,184,0.08)' : 'rgba(43,191,184,0.05)',
              marginTop: 4
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: player.active === false ? 'var(--color-gray-dark)' : 'var(--color-teal)' }}>
                  {player.active === false ? 'Cuenta Inactiva' : 'Cuenta Activa'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-gray-mid)', marginTop: 2 }}>
                  {player.active === false ? 'El jugador no puede participar en el rally' : 'El jugador tiene acceso completo al desafío cultural'}
                </div>
              </div>

              <button
                onClick={handleToggleActive}
                disabled={activeLoading}
                style={{
                  height: 38, padding: '0 16px', borderRadius: 8,
                  border: 'none',
                  background: player.active === false ? 'var(--color-teal)' : '#6b7280',
                  color: '#fff', fontSize: 13, fontWeight: 800,
                  cursor: activeLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'background 150ms ease, transform 150ms ease',
                  opacity: activeLoading ? 0.7 : 1,
                  boxShadow: player.active === false
                    ? '0 4px 12px rgba(43,191,184,0.25)'
                    : '0 4px 12px rgba(107,114,128,0.2)'
                }}
                onMouseDown={e => { if (!activeLoading) e.currentTarget.style.transform = 'scale(0.97)' }}
                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                {activeLoading ? (
                  <>
                    <i className="ri-loader-4-line" style={{ animation: 'spin-circle 0.8s linear infinite' }} />
                    Procesando...
                  </>
                ) : player.active === false ? (
                  <>
                    <i className="ri-toggle-line" />
                    Activar Cuenta
                  </>
                ) : (
                  <>
                    <i className="ri-toggle-fill" />
                    Desactivar Cuenta
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 3: Security ban management */}
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 16,
            padding: 24,
            boxShadow: 'var(--shadow-card)',
            border: player.banned ? '1.5px solid rgba(230,51,41,0.3)' : '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: 0 }}>
              Acciones de Seguridad
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
              Si suspendes esta cuenta, el jugador será desconectado inmediatamente del desafío cultural y no podrá volver a iniciar sesión, escanear paradas, ni reclamar premios.
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 10,
              background: player.banned ? 'rgba(230,51,41,0.05)' : 'rgba(160,168,184,0.05)',
              marginTop: 4
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: player.banned ? 'var(--color-error)' : 'var(--color-text)' }}>
                  {player.banned ? 'Estado: Suspendido' : 'Estado: Activo'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-gray-mid)', marginTop: 2 }}>
                  {player.banned ? 'Acceso bloqueado en todo el sistema' : 'El jugador tiene acceso normal'}
                </div>
              </div>

              {/* Ban / Unban Button */}
              <button
                onClick={handleToggleBan}
                disabled={actionLoading}
                style={{
                  height: 38, padding: '0 16px', borderRadius: 8,
                  border: 'none',
                  background: player.banned ? 'var(--color-teal)' : 'var(--color-red)',
                  color: '#fff', fontSize: 13, fontWeight: 800,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'background 150ms ease, transform 150ms ease',
                  boxShadow: player.banned
                    ? '0 4px 12px rgba(43,191,184,0.25)'
                    : '0 4px 12px rgba(230,51,41,0.25)'
                }}
                onMouseDown={e => { if (!actionLoading) e.currentTarget.style.transform = 'scale(0.97)' }}
                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                {actionLoading ? (
                  <>
                    <i className="ri-loader-4-line" style={{ animation: 'spin-circle 0.8s linear infinite' }} />
                    Procesando...
                  </>
                ) : player.banned ? (
                  <>
                    <i className="ri-key-line" />
                    Reactivar Cuenta
                  </>
                ) : (
                  <>
                    <i className="ri-prohibited-line" />
                    Banear Jugador
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card: Email Communication actions */}
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 16,
            padding: 24,
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: 0 }}>
              Acciones de Comunicación
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
              Envía correos electrónicos utilizando la pasarela de SendGrid con plantillas de diseño premium.
            </p>

            {emailStatus && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: emailStatus.type === 'success' ? 'rgba(60,173,66,0.08)' : 'rgba(230,51,41,0.08)',
                border: `1.5px solid ${emailStatus.type === 'success' ? 'rgba(60,173,66,0.25)' : 'rgba(230,51,41,0.25)'}`,
                color: emailStatus.type === 'success' ? 'var(--color-green)' : 'var(--color-error)'
              }}>
                <i className={emailStatus.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'} style={{ fontSize: 16 }} />
                <span>{emailStatus.text}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {/* Password Reset Action Button */}
              <button
                onClick={handleSendPasswordReset}
                disabled={emailLoading}
                style={{
                  height: 38,
                  padding: '0 16px',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  background: '#f8f9fb',
                  color: 'var(--color-navy)',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: emailLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'background 150ms ease, transform 150ms ease',
                  opacity: emailLoading ? 0.7 : 1
                }}
                onMouseEnter={e => { if (!emailLoading) e.currentTarget.style.background = '#f1f3f7' }}
                onMouseLeave={e => { if (!emailLoading) e.currentTarget.style.background = '#f8f9fb' }}
              >
                {emailLoading ? <i className="ri-loader-4-line ri-spin" /> : <i className="ri-mail-line" />}
                Enviar Cambio de Contraseña
              </button>

              {/* Custom Email Action Button */}
              <button
                onClick={() => {
                  setEmailStatus(null);
                  setCustomEmailModal(true);
                }}
                disabled={emailLoading}
                style={{
                  height: 38,
                  padding: '0 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--color-navy)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: emailLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'background 150ms ease, transform 150ms ease',
                  boxShadow: '0 4px 12px rgba(27,43,110,0.15)',
                  opacity: emailLoading ? 0.7 : 1
                }}
                onMouseEnter={e => { if (!emailLoading) e.currentTarget.style.background = 'rgba(27,43,110,0.9)' }}
                onMouseLeave={e => { if (!emailLoading) e.currentTarget.style.background = 'var(--color-navy)' }}
              >
                <i className="ri-chat-new-line" />
                Enviar Mensaje Personalizado
              </button>
            </div>
          </div>

          {/* Card: Eliminar cuenta */}
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 16,
            padding: 24,
            boxShadow: 'var(--shadow-card)',
            border: '1.5px solid rgba(230,51,41,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-error)', fontSize: 18, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ri-delete-bin-line" />
              Eliminar Cuenta
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
              Elimina permanentemente este jugador de Firestore y de Firebase Auth. Se borrarán todos sus intentos, premios y códigos de canje. <strong style={{ color: 'var(--color-error)' }}>Esta acción es irreversible.</strong>
            </p>

            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                style={{
                  height: 40, padding: '0 18px', borderRadius: 10,
                  border: 'none',
                  background: 'var(--color-error)',
                  color: '#fff', fontSize: 13, fontWeight: 800,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
                  alignSelf: 'flex-start',
                  boxShadow: '0 4px 14px rgba(230,51,41,0.35)',
                  transition: 'opacity 150ms ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                <i className="ri-delete-bin-fill" style={{ fontSize: 16 }} />
                Eliminar jugador
              </button>
            ) : (
              <div style={{ background: 'rgba(230,51,41,0.06)', border: '1.5px solid rgba(230,51,41,0.3)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ri-alert-line" style={{ fontSize: 18 }} />
                  ¿Eliminar permanentemente a <span style={{ fontStyle: 'italic', marginLeft: 4 }}>{player?.displayName || 'este jugador'}</span>?
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  Se borrará su cuenta de Auth, todos sus datos en Firestore y sus códigos de premio. No hay forma de recuperar esta información.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    style={{
                      height: 38, padding: '0 18px', borderRadius: 8,
                      border: 'none', background: 'var(--color-error)',
                      color: '#fff', fontSize: 13, fontWeight: 800,
                      cursor: deleteLoading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      opacity: deleteLoading ? 0.7 : 1,
                      transition: 'opacity 150ms ease',
                    }}
                  >
                    {deleteLoading ? (
                      <><i className="ri-loader-4-line" style={{ animation: 'spin-circle 0.8s linear infinite' }} />Eliminando...</>
                    ) : (
                      <><i className="ri-delete-bin-fill" />Sí, eliminar</>
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    disabled={deleteLoading}
                    style={{
                      height: 38, padding: '0 18px', borderRadius: 8,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)', fontSize: 13, fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card 4: Reset player */}

          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 16,
            padding: 24,
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: 0 }}>
              Reiniciar Jugador
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
              Borra todos los intentos, reinicia el puntaje a 0, el progreso del mapa y la parada actual. Esta acción es irreversible.
            </p>

            {resetSuccess && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(60,173,66,0.08)', border: '1.5px solid rgba(60,173,66,0.25)', color: 'var(--color-green)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ri-checkbox-circle-line" style={{ fontSize: 16 }} />
                {resetSuccess}
              </div>
            )}

            {!resetConfirm ? (
              <button
                onClick={() => setResetConfirm(true)}
                style={{
                  height: 40, padding: '0 18px', borderRadius: 10,
                  border: '1.5px solid rgba(230,51,41,0.35)',
                  background: 'rgba(230,51,41,0.05)',
                  color: 'var(--color-error)', fontSize: 13, fontWeight: 800,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
                  alignSelf: 'flex-start',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(230,51,41,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(230,51,41,0.05)' }}
              >
                <i className="ri-restart-line" style={{ fontSize: 16 }} />
                Reiniciar desde cero
              </button>
            ) : (
              <div style={{ background: 'rgba(230,51,41,0.05)', border: '1.5px solid rgba(230,51,41,0.25)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ri-alert-line" style={{ fontSize: 18 }} />
                  ¿Confirmar reinicio de <span style={{ fontStyle: 'italic' }}>{player?.displayName || 'este jugador'}</span>?
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  Se eliminarán todos sus intentos y su progreso volverá a cero. No se puede deshacer.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleReset}
                    disabled={resetLoading}
                    style={{
                      height: 38, padding: '0 18px', borderRadius: 8,
                      border: 'none', background: 'var(--color-error)',
                      color: '#fff', fontSize: 13, fontWeight: 800,
                      cursor: resetLoading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      opacity: resetLoading ? 0.7 : 1,
                      transition: 'opacity 150ms ease',
                    }}
                  >
                    {resetLoading ? (
                      <><i className="ri-loader-4-line" style={{ animation: 'spin-circle 0.8s linear infinite' }} /> Reiniciando...</>
                    ) : (
                      <><i className="ri-restart-line" /> Sí, reiniciar</>
                    )}
                  </button>
                  <button
                    onClick={() => setResetConfirm(false)}
                    disabled={resetLoading}
                    style={{
                      height: 38, padding: '0 18px', borderRadius: 8,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)', fontSize: 13, fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ── Attempts section ── */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 22, margin: '0 0 4px' }}>
              Historial de Intentos
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
              Desglose por pregunta: intentos, tiempo de respuesta y puntos obtenidos.
            </p>
          </div>
          {attempts.length > 0 && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(27,43,110,0.05)', borderRadius: 10, padding: '8px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-navy)' }}>
                  {attempts.length}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Preguntas</div>
              </div>
              <div style={{ background: 'rgba(43,191,184,0.06)', borderRadius: 10, padding: '8px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-teal)' }}>
                  {attempts.filter(a => a.solved).length}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Resueltas</div>
              </div>
              <div style={{ background: 'rgba(251,191,36,0.08)', borderRadius: 10, padding: '8px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#d97706' }}>
                  {attempts.reduce((s, a) => s + a.totalAttempts, 0)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Intentos</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ background: 'var(--color-surface)', borderRadius: 16, boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          {attemptsLoading ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(27,43,110,0.1)', borderTopColor: 'var(--color-yellow)', animation: 'spin-circle 0.8s linear infinite', margin: '0 auto 12px' }} />
              <div style={{ color: 'var(--color-navy)', fontWeight: 700, fontSize: 14 }}>Cargando historial...</div>
            </div>
          ) : attemptsError ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <i className="ri-error-warning-line" style={{ fontSize: 44, color: 'var(--color-error)', display: 'block', marginBottom: 12 }} />
              <div style={{ fontWeight: 700, color: 'var(--color-error)', fontSize: 16, marginBottom: 4 }}>Error al cargar intentos</div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 13, maxWidth: 480, margin: '0 auto', wordBreak: 'break-word' }}>{attemptsError}</div>
            </div>
          ) : attempts.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <i className="ri-survey-line" style={{ fontSize: 44, color: 'var(--color-gray-mid)', display: 'block', marginBottom: 12 }} />
              <div style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: 16, marginBottom: 4 }}>Sin intentos registrados</div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Este jugador no ha respondido ninguna pregunta aún.</div>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 90px 100px 36px', gap: 0, background: '#f8f9fb', borderBottom: '1px solid var(--color-border)', padding: '10px 20px' }}>
                {['Pregunta', 'Intentos', 'Mejor tiempo', 'Puntos', 'Estado', ''].map((h, i) => (
                  <div key={i} style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: i > 0 ? 'center' : 'left' }}>{h}</div>
                ))}
              </div>

              {attempts.map((q, idx) => {
                const isExpanded = expandedQuestion === q.questionId
                return (
                  <div key={q.questionId} style={{ borderBottom: idx === attempts.length - 1 ? 'none' : '1px solid var(--color-border)' }}>
                    {/* Summary row */}
                    <div
                      style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 90px 100px 36px', gap: 0, padding: '14px 20px', alignItems: 'center', cursor: 'pointer', transition: 'background 150ms' }}
                      className="table-row-hover"
                      onClick={() => setExpandedQuestion(isExpanded ? null : q.questionId)}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {q.questionText || q.questionId}
                          {q.isBonus && (
                            <span style={{ background: 'rgba(251,191,36,0.15)', color: '#d97706', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>BONUS</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-gray-mid)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {q.stageNumber != null && (
                            <span style={{ background: 'rgba(27,43,110,0.08)', color: 'var(--color-navy)', padding: '1px 6px', borderRadius: 4, fontWeight: 700, fontSize: 10 }}>
                              Etapa {q.stageNumber}
                            </span>
                          )}
                          <span>{q.stopName || q.stopId}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 14, color: q.totalAttempts > 1 ? 'var(--color-orange)' : 'var(--color-text)' }}>
                        {q.totalAttempts}
                      </div>
                      <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)' }}>
                        {formatMs(q.bestTimeMs)}
                      </div>
                      <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 14, color: q.pointsEarned > 0 ? 'var(--color-navy)' : 'var(--color-gray-mid)' }}>
                        {q.pointsEarned > 0 ? `+${q.pointsEarned}` : '0'}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        {q.solved ? (
                          <span style={{ background: 'rgba(43,191,184,0.1)', color: 'var(--color-teal)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                            <i className="ri-checkbox-circle-line" /> Correcta
                          </span>
                        ) : (
                          <span style={{ background: 'rgba(230,51,41,0.08)', color: 'var(--color-error)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                            <i className="ri-close-circle-line" /> Sin resolver
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <i className={isExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 18, color: 'var(--color-gray-mid)' }} />
                      </div>
                    </div>

                    {/* Expanded: individual attempts */}
                    {isExpanded && (
                      <div style={{ background: '#fafbfd', borderTop: '1px solid var(--color-border)', padding: '12px 20px 16px 36px' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-gray-mid)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                          Detalle de intentos
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {q.attempts.map((a, ai) => (
                            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8, background: a.correct ? 'rgba(43,191,184,0.06)' : 'rgba(230,51,41,0.04)', border: `1px solid ${a.correct ? 'rgba(43,191,184,0.2)' : 'rgba(230,51,41,0.12)'}` }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-gray-mid)', minWidth: 60 }}>
                                Intento #{ai + 1}
                              </span>
                              <span style={{ fontSize: 13, color: a.correct ? 'var(--color-teal)' : 'var(--color-error)', fontWeight: 700, minWidth: 80 }}>
                                {a.correct ? '✓ Correcta' : '✗ Incorrecta'}
                              </span>
                              <span style={{ fontSize: 12, color: 'var(--color-text-muted)', minWidth: 80 }}>
                                <i className="ri-time-line" style={{ marginRight: 4 }} />
                                {formatMs(a.timeMs)}
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: a.pointsAwarded > 0 ? 'var(--color-navy)' : 'var(--color-gray-mid)' }}>
                                {a.pointsAwarded > 0 ? `+${a.pointsAwarded} pts` : '0 pts'}
                              </span>
                              {(a.clientAnsweredAt || a.answeredAt) && (
                                <span style={{ fontSize: 11, color: 'var(--color-gray-mid)', marginLeft: 'auto' }}>
                                  {new Date(a.clientAnsweredAt ?? a.answeredAt!).toLocaleString('es-DO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin-circle { to { transform: rotate(360deg); } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .table-row-hover:hover { background: #f5f6fa !important; }
      `}</style>

      {/* ── CUSTOM EMAIL MODAL ─────────────────── */}
      {customEmailModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(13,21,38,0.5)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100, padding: 16
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 16,
            width: '100%', maxWidth: 500, boxShadow: 'var(--shadow-pop)',
            overflow: 'hidden', animation: 'slide-up 0.2s ease-out'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: 0 }}>
                Enviar Correo Personalizado
              </h3>
              <button onClick={() => { setCustomEmailModal(false); setEmailSubject(''); setEmailBody(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-mid)', padding: 4 }}>
                <i className="ri-close-line" style={{ fontSize: 20 }} />
              </button>
            </div>
            
            <form onSubmit={handleSendCustomEmail} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Target email (read only) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  Destinatario
                </label>
                <input
                  type="text"
                  readOnly
                  value={player.email}
                  style={{
                    height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                    padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
                    background: '#f8f9fb', color: 'var(--color-text-muted)'
                  }}
                />
              </div>

              {/* Subject */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  Asunto del Correo
                </label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder="Escribe el asunto del correo..."
                  style={{
                    height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                    padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none'
                  }}
                />
              </div>

              {/* Message body */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  Mensaje
                </label>
                <textarea
                  required
                  rows={6}
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  placeholder="Escribe el contenido del correo aquí..."
                  style={{
                    borderRadius: 8, border: '1.5px solid var(--color-border)',
                    padding: '12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => { setCustomEmailModal(false); setEmailSubject(''); setEmailBody(''); }}
                  disabled={emailLoading}
                  style={{
                    height: 40, padding: '0 16px', borderRadius: 8,
                    background: 'none', border: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={emailLoading || !emailSubject.trim() || !emailBody.trim()}
                  style={{
                    height: 40, padding: '0 20px', borderRadius: 8,
                    background: 'var(--color-navy)', color: '#fff', border: 'none',
                    fontWeight: 600, fontSize: 13, cursor: emailLoading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                    opacity: emailLoading ? 0.7 : 1
                  }}
                >
                  {emailLoading && <i className="ri-loader-4-line ri-spin" />}
                  Enviar Correo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>

  )
}
