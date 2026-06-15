import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPlayers, updatePlayerActiveStatus, getTopTen, type PlayerData, type RankedPlayerData } from '../../services/adminService'

export default function PlayersPage() {
  const navigate = useNavigate()
  const [players, setPlayers] = useState<PlayerData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Top 10 Modal states
  const [showTopTenModal, setShowTopTenModal] = useState(false)
  const [topTenPlayers, setTopTenPlayers] = useState<RankedPlayerData[]>([])
  const [topTenLoading, setTopTenLoading] = useState(false)
  const [topTenError, setTopTenError] = useState<string | null>(null)

  async function handleOpenTopTen() {
    setShowTopTenModal(true)
    setTopTenLoading(true)
    setTopTenError(null)
    try {
      const data = await getTopTen()
      setTopTenPlayers(data)
    } catch (err) {
      setTopTenError(err instanceof Error ? err.message : 'Error al cargar el Top 10')
    } finally {
      setTopTenLoading(false)
    }
  }
  
  // Search and filter states
  const [search, setSearch] = useState('')
  const [natFilter, setNatFilter] = useState('')
  const [ageFilter, setAgeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'score-desc' | 'score-asc'>('date-desc')
  const [togglingUid, setTogglingUid] = useState<string | null>(null)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Fetch players on mount
  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const data = await fetchPlayers()
        setPlayers(data)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al cargar los jugadores'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Extract unique nationalities for filtering
  const nationalities = useMemo(() => {
    const nats = players.map(p => p.nationality).filter(Boolean)
    return Array.from(new Set(nats)).sort()
  }, [players])

  // Extract unique age ranges
  const ageRanges = useMemo(() => {
    const ages = players.map(p => p.ageRange).filter(Boolean)
    return Array.from(new Set(ages)).sort()
  }, [players])

  // Filtered & sorted players
  const processedPlayers = useMemo<PlayerData[]>(() => {
    let result = [...players]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        p =>
          p.displayName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.uid.toLowerCase().includes(q)
      )
    }

    // Status filter
    if (statusFilter === 'active') {
      result = result.filter(p => p.active !== false)
    } else if (statusFilter === 'inactive') {
      result = result.filter(p => p.active === false)
    }

    // Nationality filter
    if (natFilter) {
      result = result.filter(p => p.nationality === natFilter)
    }

    // Age range filter
    if (ageFilter) {
      result = result.filter(p => p.ageRange === ageFilter)
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      }
      if (sortBy === 'date-asc') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      }
      if (sortBy === 'score-desc') {
        return b.score - a.score
      }
      if (sortBy === 'score-asc') {
        return a.score - b.score
      }
      return 0
    })

    return result
  }, [players, search, natFilter, ageFilter, statusFilter, sortBy])

  // Total pages
  const totalPages = Math.ceil(processedPlayers.length / pageSize)

  // Paginated players
  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return processedPlayers.slice(start, start + pageSize)
  }, [processedPlayers, currentPage, pageSize])

  // Count completed stops for a player
  function getCompletedStopsCount(mapProgress: Record<string, string>): number {
    return Object.values(mapProgress).filter(status => status === 'completed').length
  }

  // Formatting date
  function formatDate(isoStr: string | null) {
    if (!isoStr) return '-'
    const date = new Date(isoStr)
    return date.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  async function handleToggleActive(e: React.MouseEvent, player: PlayerData) {
    e.stopPropagation()
    const newActive = !(player.active !== false)
    setTogglingUid(player.uid)
    try {
      await updatePlayerActiveStatus(player.uid, newActive)
      setPlayers(prev => prev.map(p => p.uid === player.uid ? { ...p, active: newActive } : p))
    } catch {
      // silent — user stays unchanged
    } finally {
      setTogglingUid(null)
    }
  }

  // Clear all filters
  function handleClearFilters() {
    setSearch('')
    setNatFilter('')
    setAgeFilter('')
    setStatusFilter('all')
    setSortBy('date-desc')
    setCurrentPage(1)
  }

  return (
    <div style={{ animation: 'fade-in 0.3s ease-out' }}>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 28, margin: '0 0 4px' }}>
            Panel de Jugadores
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
            Visualiza, filtra y analiza la participación de los jugadores registrados en el rally cultural.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Button "Ver Top 10" */}
          <button
            onClick={handleOpenTopTen}
            style={{
              height: 44,
              padding: '0 20px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, var(--color-navy) 0%, #2b3b80 100%)',
              color: 'var(--color-yellow)',
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 15px rgba(27,43,110,0.25)',
              transition: 'transform 150ms ease, box-shadow 150ms ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(27,43,110,0.35)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(27,43,110,0.25)'
            }}
          >
            <i className="ri-trophy-fill" style={{ fontSize: 18 }} />
            Ver Top 10
          </button>

          <div style={{
            background: 'rgba(27,43,110,0.06)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '10px 16px',
            textAlign: 'right'
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Total Registrados
            </span>
            <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--color-navy)' }}>
              {players.length}
            </div>
          </div>
        </div>
      </div>

      {/* Legend Banner / Formula Explanation */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(27,43,110,0.04) 0%, rgba(43,191,184,0.03) 100%)',
        border: '1px solid rgba(27,43,110,0.1)',
        borderRadius: 16,
        padding: '16px 20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.01)'
      }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: 'rgba(27,43,110,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-navy)',
          flexShrink: 0,
          marginTop: 2
        }}>
          <i className="ri-information-line" style={{ fontSize: 22 }} />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 6px 0', fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 15, fontWeight: 700 }}>
            Fórmula de Clasificación y Puntaje Real
          </h4>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            El ranking global y la posición del jugador se calculan utilizando el <strong>Puntaje Real</strong> de la partida. 
            Este se calcula por cada pregunta respondida correctamente usando la fórmula: 
            <span style={{ 
              display: 'inline-block', 
              background: '#fff', 
              padding: '2px 8px', 
              borderRadius: 6, 
              border: '1px solid var(--color-border)', 
              margin: '4px 6px',
              fontFamily: 'monospace',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--color-navy)'
            }}>
              Puntaje Real = (Puntos Base / Intentos) × (0.8 + 0.2 × Factor de Tiempo)
            </span>
          </p>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, fontSize: 12.5, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            <li><strong>Intentos</strong>: Los intentos fallidos dividen los puntos base (ej: resolver al 2do intento divide los puntos en 2).</li>
            <li><strong>Factor de Tiempo</strong>: Responder rápido dentro de la ventana de 60s conserva hasta el 100% de la puntuación (aporta una bonificación del 20% de velocidad), mientras que tomarse todo el tiempo reduce el factor al 80%.</li>
          </ul>
        </div>
      </div>

      {/* Control panel (search + filters) */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 16,
        padding: 20,
        boxShadow: 'var(--shadow-card)',
        marginBottom: 24,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <i className="ri-search-line" style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-gray-mid)', fontSize: 16
          }} />
          <input
            type="text"
            placeholder="Buscar por nombre, email o ID..."
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            style={{
              width: '100%', height: 40, borderRadius: 8,
              border: '1px solid var(--color-border)',
              paddingLeft: 38, paddingRight: 14, fontSize: 14,
              fontFamily: 'var(--font-body)', color: 'var(--color-text)',
              background: '#f8f9fb', outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Nationality Filter */}
        <div style={{ flex: '1 1 160px' }}>
          <select
            value={natFilter}
            onChange={e => {
              setNatFilter(e.target.value)
              setCurrentPage(1)
            }}
            style={{
              width: '100%', height: 40, borderRadius: 8,
              border: '1px solid var(--color-border)',
              paddingLeft: 12, paddingRight: 12, fontSize: 14,
              fontFamily: 'var(--font-body)', color: 'var(--color-text)',
              background: '#f8f9fb', outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="">Nacionalidad (Todas)</option>
            {nationalities.map(nat => (
              <option key={nat} value={nat}>{nat}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ flex: '1 1 150px' }}>
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value as typeof statusFilter)
              setCurrentPage(1)
            }}
            style={{
              width: '100%', height: 40, borderRadius: 8,
              border: '1px solid var(--color-border)',
              paddingLeft: 12, paddingRight: 12, fontSize: 14,
              fontFamily: 'var(--font-body)', color: 'var(--color-text)',
              background: '#f8f9fb', outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="all">Estado (Todos)</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>

        {/* Age Range Filter */}
        <div style={{ flex: '1 1 160px' }}>
          <select
            value={ageFilter}
            onChange={e => {
              setAgeFilter(e.target.value)
              setCurrentPage(1)
            }}
            style={{
              width: '100%', height: 40, borderRadius: 8,
              border: '1px solid var(--color-border)',
              paddingLeft: 12, paddingRight: 12, fontSize: 14,
              fontFamily: 'var(--font-body)', color: 'var(--color-text)',
              background: '#f8f9fb', outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="">Rango de edad (Todos)</option>
            {ageRanges.map(age => (
              <option key={age} value={age}>{age}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div style={{ flex: '1 1 180px' }}>
          <select
            value={sortBy}
            onChange={e => {
              setSortBy(e.target.value as typeof sortBy)
              setCurrentPage(1)
            }}
            style={{
              width: '100%', height: 40, borderRadius: 8,
              border: '1px solid var(--color-border)',
              paddingLeft: 12, paddingRight: 12, fontSize: 14,
              fontFamily: 'var(--font-body)', color: 'var(--color-text)',
              background: '#f8f9fb', outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="date-desc">Registro (Reciente)</option>
            <option value="date-asc">Registro (Antiguo)</option>
            <option value="score-desc">Puntaje (Mayor)</option>
            <option value="score-asc">Puntaje (Menor)</option>
          </select>
        </div>

        {/* Clear filters */}
        {(search || natFilter || ageFilter || statusFilter !== 'all' || sortBy !== 'date-desc') && (
          <button
            onClick={handleClearFilters}
            style={{
              height: 40, padding: '0 16px', borderRadius: 8,
              background: 'none', border: '1px solid var(--color-red)',
              color: 'var(--color-red)', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'background 150ms ease, color 150ms ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(230,51,41,0.06)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'none'
            }}
          >
            <i className="ri-filter-off-line" />
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* Main content table area */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden'
      }}>
        {loading ? (
          /* Loading State */
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div className="mascot-loading-pulse" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                border: '4px solid rgba(27,43,110,0.1)',
                borderTopColor: 'var(--color-yellow)',
                animation: 'spin-circle 0.8s linear infinite'
              }} />
              <div style={{ color: 'var(--color-navy)', fontWeight: 700, fontSize: 15 }}>Cargando jugadores registrados...</div>
            </div>
          </div>
        ) : error ? (
          /* Error State */
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-error)' }}>
            <i className="ri-error-warning-line" style={{ fontSize: 44, display: 'block', marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: 18 }}>Error al cargar</h3>
            <p style={{ margin: 0, fontSize: 14 }}>{error}</p>
          </div>
        ) : processedPlayers.length === 0 ? (
          /* Empty State */
          <div style={{ padding: 60, textAlign: 'center' }}>
            <i className="ri-group-line" style={{ fontSize: 48, color: 'var(--color-gray-mid)', display: 'block', marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 6px', color: 'var(--color-navy)', fontFamily: 'var(--font-display)', fontSize: 18 }}>
              No se encontraron jugadores
            </h3>
            <p style={{ margin: '0 0 16px', color: 'var(--color-text-muted)', fontSize: 14 }}>
              Intenta ajustar tus términos de búsqueda o filtros.
            </p>
            {(search || natFilter || ageFilter) && (
              <button
                onClick={handleClearFilters}
                style={{
                  height: 36, padding: '0 16px', borderRadius: 8,
                  background: 'var(--color-navy)', border: 'none',
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Resetear Filtros
              </button>
            )}
          </div>
        ) : (
          /* Table View */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8f9fb', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center', width: 70 }}>
                    Puesto
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Jugador
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Nacionalidad
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Género
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Rango Edad
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>
                    Paradas
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>
                    Puntaje
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Fecha Registro
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedPlayers.map((player, idx) => {
                  const initials = player.displayName ? player.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'P'
                  const completedStops = getCompletedStopsCount(player.mapProgress)

                  return (
                    <tr
                      key={player.uid}
                      style={{
                        borderBottom: idx === paginatedPlayers.length - 1 ? 'none' : '1px solid var(--color-border)',
                        transition: 'background 150ms ease',
                        cursor: 'pointer'
                      }}
                      className="table-row-hover"
                      onClick={() => navigate(`/admin/players/${player.uid}`)}
                    >
                      {/* Rank cell — permanent */}
                      <td style={{ padding: '14px 20px', textAlign: 'center', width: 70 }}>
                        {player.ranking === 1 ? (
                          <span style={{ fontSize: 18 }} title="1er Puesto (Oro)">🥇</span>
                        ) : player.ranking === 2 ? (
                          <span style={{ fontSize: 18 }} title="2do Puesto (Plata)">🥈</span>
                        ) : player.ranking === 3 ? (
                          <span style={{ fontSize: 18 }} title="3er Puesto (Bronce)">🥉</span>
                        ) : player.ranking ? (
                          <span style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--color-gray-dark)',
                            background: 'rgba(160,168,184,0.15)',
                            padding: '3px 8px',
                            borderRadius: 6
                          }}>
                            #{player.ranking}
                          </span>
                        ) : (
                          <span style={{ fontSize: 13, color: 'var(--color-gray-mid)' }}>-</span>
                        )}
                      </td>

                      {/* Player Avatar, Name and Email */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: '50%',
                            background: player.active === false ? 'var(--color-gray-mid)' : 'var(--color-navy)',
                            color: 'var(--color-yellow)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              {player.displayName || `${player.firstName} ${player.lastName}`.trim() || 'Jugador Anónimo'}
                              {player.banned && (
                                <span style={{
                                  background: 'rgba(230,51,41,0.1)',
                                  color: 'var(--color-error)',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  fontSize: 10,
                                  fontWeight: 700
                                }}>
                                  BANEADO
                                </span>
                              )}
                              {player.active === false && (
                                <span style={{
                                  background: 'rgba(160,168,184,0.15)',
                                  color: 'var(--color-gray-dark)',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  fontSize: 10,
                                  fontWeight: 700
                                }}>
                                  INACTIVO
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 1 }}>
                              {player.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Nationality */}
                      <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--color-text)' }}>
                        {player.nationality || <span style={{ color: 'var(--color-gray-mid)' }}>N/D</span>}
                      </td>

                      {/* Gender */}
                      <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--color-text)' }}>
                        {player.gender || <span style={{ color: 'var(--color-gray-mid)' }}>N/D</span>}
                      </td>

                      {/* Age range */}
                      <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--color-text)' }}>
                        {player.ageRange || <span style={{ color: 'var(--color-gray-mid)' }}>N/D</span>}
                      </td>

                      {/* Completed stops */}
                      <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: 'var(--color-text)', textAlign: 'center' }}>
                        <span style={{
                          background: completedStops > 0 ? 'rgba(43,191,184,0.1)' : 'rgba(160,168,184,0.1)',
                          color: completedStops > 0 ? 'var(--color-teal)' : 'var(--color-gray-dark)',
                          padding: '3px 10px', borderRadius: 20, fontSize: 12
                        }}>
                          {completedStops} / 9
                        </span>
                      </td>

                      {/* Score */}
                      <td style={{ padding: '14px 20px', fontSize: 14, color: 'var(--color-navy)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700 }}>{player.score.toLocaleString()} pts</div>
                        {player.baseScore !== undefined && (
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                            Base: {player.baseScore.toLocaleString()} pts
                          </div>
                        )}
                      </td>

                      {/* Created date */}
                      <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                        {formatDate(player.createdAt)}
                      </td>

                      {/* Active toggle */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <button
                          onClick={e => handleToggleActive(e, player)}
                          disabled={togglingUid === player.uid}
                          title={player.active === false ? 'Activar jugador' : 'Desactivar jugador'}
                          style={{
                            width: 44, height: 24, borderRadius: 12,
                            border: 'none',
                            background: player.active === false ? '#d1d5db' : 'var(--color-teal)',
                            cursor: togglingUid === player.uid ? 'wait' : 'pointer',
                            position: 'relative',
                            transition: 'background 200ms ease',
                            flexShrink: 0,
                            opacity: togglingUid === player.uid ? 0.6 : 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{
                            position: 'absolute',
                            width: 18, height: 18, borderRadius: '50%',
                            background: '#fff',
                            top: 3,
                            left: player.active === false ? 3 : 23,
                            transition: 'left 200ms ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          }} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && !error && processedPlayers.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderTop: '1px solid var(--color-border)',
            background: '#f8f9fb',
            flexWrap: 'wrap',
            gap: 12
          }}>
            {/* Page size selector & current range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--color-text-muted)' }}>
              <span>Mostrar</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                style={{
                  height: 32, borderRadius: 6,
                  border: '1px solid var(--color-border)',
                  padding: '0 8px', fontSize: 13,
                  fontFamily: 'var(--font-body)', color: 'var(--color-text)',
                  background: '#fff', outline: 'none', cursor: 'pointer'
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>registros por página</span>
              <span style={{ margin: '0 8px', color: 'var(--color-border)' }}>|</span>
              <span>
                Mostrando {Math.min((currentPage - 1) * pageSize + 1, processedPlayers.length)} - {Math.min(currentPage * pageSize, processedPlayers.length)} de {processedPlayers.length} jugadores
              </span>
            </div>

            {/* Navigation buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  height: 32, padding: '0 10px', borderRadius: 6,
                  border: '1px solid var(--color-border)',
                  background: currentPage === 1 ? '#eef0f4' : '#fff',
                  color: currentPage === 1 ? 'var(--color-gray-mid)' : 'var(--color-navy)',
                  fontSize: 13, fontWeight: 700,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  transition: 'background 150ms ease'
                }}
              >
                <i className="ri-arrow-left-s-line" />
                Anterior
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                const isPageVisible = 
                  totalPages <= 5 || 
                  page === 1 || 
                  page === totalPages || 
                  Math.abs(page - currentPage) <= 1;

                if (!isPageVisible) {
                  if (page === 2 && currentPage > 3) {
                    return <span key="ellipsis-start" style={{ padding: '0 4px', color: 'var(--color-gray-mid)' }}>...</span>
                  }
                  if (page === totalPages - 1 && currentPage < totalPages - 2) {
                    return <span key="ellipsis-end" style={{ padding: '0 4px', color: 'var(--color-gray-mid)' }}>...</span>
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: 32, height: 32, borderRadius: 6,
                      border: '1px solid var(--color-border)',
                      background: currentPage === page ? 'var(--color-navy)' : '#fff',
                      color: currentPage === page ? '#fff' : 'var(--color-navy)',
                      fontSize: 13, fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'background 150ms ease, color 150ms ease'
                    }}
                  >
                    {page}
                  </button>
                )
              })}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                style={{
                  height: 32, padding: '0 10px', borderRadius: 6,
                  border: '1px solid var(--color-border)',
                  background: currentPage === totalPages || totalPages === 0 ? '#eef0f4' : '#fff',
                  color: currentPage === totalPages || totalPages === 0 ? 'var(--color-gray-mid)' : 'var(--color-navy)',
                  fontSize: 13, fontWeight: 700,
                  cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  transition: 'background 150ms ease'
                }}
              >
                Siguiente
                <i className="ri-arrow-right-s-line" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top 10 Modal */}
      {showTopTenModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          animation: 'fade-in 0.25s ease-out'
        }} onClick={() => setShowTopTenModal(false)}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            borderRadius: 24,
            width: '100%',
            maxWidth: 500,
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15), inset 0 0 0 1px rgba(255,255,255,0.4)',
            overflow: 'hidden',
            animation: 'scale-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{
              padding: '24px 28px 20px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(27,43,110,0.05) 0%, rgba(27,43,110,0.02) 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--color-navy)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(27,43,110,0.2)'
                }}>
                  <i className="ri-trophy-line" style={{ color: 'var(--color-yellow)', fontSize: 18 }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 20 }}>
                    Clasificación Top 10
                  </h3>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>Rally Cultural Turizoneando</span>
                </div>
              </div>
              <button
                onClick={() => setShowTopTenModal(false)}
                style={{
                  background: 'rgba(0,0,0,0.05)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--color-navy)',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
              >
                <i className="ri-close-line" style={{ fontSize: 18 }} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 28px 28px', overflowY: 'auto', flex: 1 }}>
              {topTenLoading ? (
                <div style={{ padding: '60px 0', textAlign: 'center' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    border: '3px solid rgba(27,43,110,0.1)',
                    borderTopColor: 'var(--color-yellow)',
                    animation: 'spin-circle 0.8s linear infinite',
                    margin: '0 auto 16px'
                  }} />
                  <div style={{ color: 'var(--color-navy)', fontWeight: 700, fontSize: 14 }}>Calculando tabla de clasificación...</div>
                </div>
              ) : topTenError ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-error)' }}>
                  <i className="ri-error-warning-line" style={{ fontSize: 36, display: 'block', marginBottom: 10 }} />
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Error al cargar los datos</div>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>{topTenError}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {topTenPlayers.map((player, idx) => {
                    const isTopThree = idx < 3;
                    const initials = player.displayName ? player.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'P';
                    
                    return (
                      <div key={player.uid} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: 16,
                        background: idx === 0 
                          ? 'linear-gradient(90deg, rgba(254,243,199,0.5) 0%, rgba(255,255,255,0.7) 100%)' 
                          : idx === 1
                          ? 'linear-gradient(90deg, rgba(241,245,249,0.6) 0%, rgba(255,255,255,0.7) 100%)'
                          : idx === 2
                          ? 'linear-gradient(90deg, rgba(255,237,213,0.5) 0%, rgba(255,255,255,0.7) 100%)'
                          : 'rgba(255, 255, 255, 0.4)',
                        border: idx === 0 
                          ? '1px solid rgba(251,191,36,0.3)' 
                          : idx === 1
                          ? '1px solid rgba(148,163,184,0.2)'
                          : idx === 2
                          ? '1px solid rgba(249,115,22,0.2)'
                          : '1px solid rgba(0, 0, 0, 0.03)',
                        boxShadow: isTopThree ? '0 4px 10px rgba(0,0,0,0.02)' : 'none',
                        transition: 'transform 150ms ease, background 150ms ease',
                      }}
                      className="top-ten-row"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          {/* Rank indicator (emoji/number) */}
                          <div style={{ width: 32, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                            {idx === 0 ? (
                              <span style={{ fontSize: 22 }}>🥇</span>
                            ) : idx === 1 ? (
                              <span style={{ fontSize: 22 }}>🥈</span>
                            ) : idx === 2 ? (
                              <span style={{ fontSize: 22 }}>🥉</span>
                            ) : (
                              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-muted)' }}>
                                #{idx + 1}
                              </span>
                            )}
                          </div>

                          {/* Avatar / Photo */}
                          {player.photoURL ? (
                            <img
                              src={player.photoURL}
                              alt={player.displayName}
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: isTopThree ? '2px solid var(--color-yellow)' : '1px solid var(--color-border)'
                              }}
                              onError={e => {
                                e.currentTarget.style.display = 'none'
                                const sibling = e.currentTarget.nextElementSibling as HTMLElement
                                if (sibling) sibling.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#f97316' : 'var(--color-navy)',
                            color: idx === 0 || idx === 1 || idx === 2 ? '#1e293b' : 'var(--color-yellow)',
                            display: player.photoURL ? 'none' : 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'var(--font-display)',
                            fontSize: 13,
                            fontWeight: 700
                          }}>
                            {initials}
                          </div>

                          {/* Name */}
                          <div>
                            <div style={{
                              fontWeight: 700,
                              color: 'var(--color-navy)',
                              fontSize: 14,
                              maxWidth: 180,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {player.displayName}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                              ID: {player.uid.substring(0, 8)}...
                            </div>
                          </div>
                        </div>

                        {/* Points */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 15,
                            fontWeight: 800,
                            color: idx === 0 ? '#b45309' : 'var(--color-navy)'
                          }}>
                            {player.score.toLocaleString()}
                          </div>
                          {player.baseScore !== undefined && (
                            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 1 }}>
                              Base: {player.baseScore} pts
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div style={{
              padding: '16px 28px',
              borderTop: '1px solid rgba(0, 0, 0, 0.06)',
              display: 'flex',
              justifyContent: 'flex-end',
              background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 100%)'
            }}>
              <button
                onClick={() => setShowTopTenModal(false)}
                style={{
                  height: 38,
                  padding: '0 20px',
                  borderRadius: 10,
                  border: '1px solid var(--color-border)',
                  background: '#fff',
                  color: 'var(--color-navy)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      <style>{`
        @keyframes spin-circle {
          to { transform: rotate(360deg); }
        }
        @keyframes scale-up {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .table-row-hover:hover {
          background: #fafbfd !important;
        }
        .top-ten-row:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.8) !important;
          box-shadow: 0 6px 15px rgba(0,0,0,0.04) !important;
        }
      `}</style>
    </div>
  )
}
