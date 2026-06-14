import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPlayers, updatePlayerActiveStatus, type PlayerData } from '../../services/adminService'

export default function PlayersPage() {
  const navigate = useNavigate()
  const [players, setPlayers] = useState<PlayerData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 28, margin: '0 0 4px' }}>
            Panel de Jugadores
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
            Visualiza, filtra y analiza la participación de los jugadores registrados en el rally cultural.
          </p>
        </div>
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
                  {(sortBy === 'score-desc' || sortBy === 'score-asc') && (
                    <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center', width: 56 }}>
                      #
                    </th>
                  )}
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
                      {/* Rank cell — only visible when sorted by score */}
                      {(sortBy === 'score-desc' || sortBy === 'score-asc') && (
                        <td style={{ padding: '14px 20px', textAlign: 'center', width: 56 }}>
                          {idx + (currentPage - 1) * pageSize === 0 ? (
                            <span style={{ fontSize: 18 }}>🥇</span>
                          ) : idx + (currentPage - 1) * pageSize === 1 ? (
                            <span style={{ fontSize: 18 }}>🥈</span>
                          ) : idx + (currentPage - 1) * pageSize === 2 ? (
                            <span style={{ fontSize: 18 }}>🥉</span>
                          ) : (
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-dark)' }}>
                              #{(currentPage - 1) * pageSize + idx + 1}
                            </span>
                          )}
                        </td>
                      )}

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
                      <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: 'var(--color-navy)', textAlign: 'center' }}>
                        {player.score.toLocaleString()} pts
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

      <style>{`
        @keyframes spin-circle {
          to { transform: rotate(360deg); }
        }
        .table-row-hover:hover {
          background: #fafbfd !important;
        }
      `}</style>
    </div>
  )
}
