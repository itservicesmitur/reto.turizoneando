import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchPlayerDetail, updatePlayerBannedStatus, updatePlayerActiveStatus, fetchPlayerAttempts, type PlayerData, type QuestionAttemptSummary } from '../../services/adminService'

export default function PlayerDetailPage() {
  const { playerId } = useParams<{ playerId: string }>()
  const navigate = useNavigate()
  
  const [player, setPlayer] = useState<PlayerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeLoading, setActiveLoading] = useState(false)
  const [attempts, setAttempts] = useState<QuestionAttemptSummary[]>([])
  const [attemptsLoading, setAttemptsLoading] = useState(true)
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
  const [attemptsError, setAttemptsError] = useState<string | null>(null)

  // Fetch player details and attempts on mount
  useEffect(() => {
    async function load() {
      if (!playerId) return
      try {
        setLoading(true)
        const data = await fetchPlayerDetail(playerId)
        setPlayer(data)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al cargar los detalles del jugador'
        setError(msg)
      } finally {
        setLoading(false)
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
    load()
    loadAttempts()
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

  // Helper to get initials
  const initials = player?.displayName
    ? player.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'P'

  // Helper to get stops completed count
  const completedStops = player?.mapProgress
    ? Object.values(player.mapProgress).filter(status => status === 'completed').length
    : 0

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
            <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 26, margin: '0 0 4px' }}>
              {player.displayName || `${player.firstName} ${player.lastName}`.trim() || 'Jugador Anónimo'}
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
              Progreso en el Rally
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Score indicator */}
              <div style={{ background: 'rgba(27,43,110,0.04)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Puntaje Total
                </span>
                <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', color: 'var(--color-navy)', marginTop: 4 }}>
                  {player.score.toLocaleString()}
                </div>
                <span style={{ fontSize: 12, color: 'var(--color-gray-mid)' }}>puntos acumulados</span>
              </div>

              {/* Stops indicator */}
              <div style={{ background: 'rgba(43,191,184,0.06)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Paradas Completadas
                </span>
                <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', color: 'var(--color-teal)', marginTop: 4 }}>
                  {completedStops} / 9
                </div>
                <span style={{ fontSize: 12, color: 'var(--color-gray-mid)' }}>nodos del recorrido</span>
              </div>
            </div>

            {/* Current node */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-gray-mid)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Parada Actual
              </label>
              <div style={{
                height: 38, borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: '#f8f9fb', color: 'var(--color-text)',
                padding: '0 12px', fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <i className="ri-map-pin-2-line" style={{ color: 'var(--color-orange)' }} />
                <span>{player.currentNodeId || 'Ninguna (Sin iniciar)'}</span>
              </div>
            </div>
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
              Activa o desactiva la cuenta del jugador para controlar su acceso al rally sin suspenderla permanentemente.
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
                  {player.active === false ? 'El jugador no puede participar en el rally' : 'El jugador tiene acceso completo al rally'}
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
              Si suspendes esta cuenta, el jugador será desconectado inmediatamente del rally y no podrá volver a iniciar sesión, escanear paradas, ni reclamar premios.
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
                        <div style={{ fontSize: 11, color: 'var(--color-gray-mid)', marginTop: 2 }}>Stop: {q.stopId}</div>
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
                              {a.answeredAt && (
                                <span style={{ fontSize: 11, color: 'var(--color-gray-mid)', marginLeft: 'auto' }}>
                                  {new Date(a.answeredAt).toLocaleString('es-DO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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

    </div>
  )
}
