import { useEffect, useState, useMemo, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  fetchPrizesList,
  createPrize,
  updatePrize,
  deletePrize,
  type PrizeData
} from '../../services/adminService'
import ImageUpload from '../../components/ImageUpload'

export default function PrizesPage() {
  const { t } = useTranslation()

  // State
  const [prizes, setPrizes] = useState<PrizeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search & filter states
  const [search, setSearch] = useState('')
  const [relevanceFilter, setRelevanceFilter] = useState('')
  const [ageFilter, setAgeFilter] = useState('') // '', 'adult', 'all'
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'relevance-desc' | 'relevance-asc'>('name-asc')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedPrize, setSelectedPrize] = useState<PrizeData | null>(null)

  // Form states
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formRelevance, setFormRelevance] = useState<number>(1)
  const [formRequiresAdult, setFormRequiresAdult] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Fetch prizes on mount
  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchPrizesList()
      setPrizes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los premios')
    } finally {
      setLoading(false)
    }
  }

  // Filtered & sorted prizes
  const processedPrizes = useMemo(() => {
    let result = [...prizes]

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
    }

    // Relevance filter
    if (relevanceFilter) {
      const relevanceNum = Number(relevanceFilter)
      result = result.filter(p => p.relevance === relevanceNum)
    }

    // Age requirement filter
    if (ageFilter === 'adult') {
      result = result.filter(p => p.requiresAdult === true)
    } else if (ageFilter === 'all') {
      result = result.filter(p => p.requiresAdult === false)
    }

    // Sorting logic
    result.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name)
      }
      if (sortBy === 'relevance-desc') {
        return b.relevance - a.relevance
      }
      if (sortBy === 'relevance-asc') {
        return a.relevance - b.relevance
      }
      return 0
    })

    return result
  }, [prizes, search, relevanceFilter, ageFilter, sortBy])

  // Pagination bounds
  const totalPages = Math.ceil(processedPrizes.length / pageSize)
  const paginatedPrizes = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return processedPrizes.slice(start, start + pageSize)
  }, [processedPrizes, currentPage, pageSize])

  // Clear filters
  function handleClearFilters() {
    setSearch('')
    setRelevanceFilter('')
    setAgeFilter('')
    setSortBy('name-asc')
    setCurrentPage(1)
  }

  // Handle open Create Modal
  function handleOpenCreate() {
    setFormName('')
    setFormDescription('')
    setFormImageUrl('')
    setFormRelevance(1)
    setFormRequiresAdult(false)
    setFormError(null)
    setFormLoading(false)
    setShowCreateModal(true)
  }

  // Submit Create Form
  async function handleCreateSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!formName.trim()) {
      setFormError(t('prizeManagement.errRequired'))
      return
    }

    try {
      setFormLoading(true)
      await createPrize({
        name: formName.trim(),
        description: formDescription.trim(),
        imageUrl: formImageUrl.trim(),
        relevance: Number(formRelevance),
        requiresAdult: formRequiresAdult
      })
      setShowCreateModal(false)
      load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al crear el premio')
    } finally {
      setFormLoading(false)
    }
  }

  // Handle open Edit Modal
  function handleOpenEdit(prize: PrizeData) {
    setSelectedPrize(prize)
    setFormName(prize.name)
    setFormDescription(prize.description)
    setFormImageUrl(prize.imageUrl)
    setFormRelevance(prize.relevance)
    setFormRequiresAdult(prize.requiresAdult)
    setFormError(null)
    setFormLoading(false)
    setShowEditModal(true)
  }

  // Submit Edit Form
  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selectedPrize) return
    setFormError(null)

    if (!formName.trim()) {
      setFormError(t('prizeManagement.errRequired'))
      return
    }

    try {
      setFormLoading(true)
      await updatePrize(selectedPrize.id, {
        name: formName.trim(),
        description: formDescription.trim(),
        imageUrl: formImageUrl.trim(),
        relevance: Number(formRelevance),
        requiresAdult: formRequiresAdult
      })
      setShowEditModal(false)
      load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar cambios')
    } finally {
      setFormLoading(false)
    }
  }

  // Handle Delete
  async function handleDelete(prize: PrizeData) {
    if (!window.confirm(t('prizeManagement.confirmDelete'))) {
      return
    }

    try {
      setFormLoading(true)
      await deletePrize(prize.id)
      load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el premio')
    } finally {
      setFormLoading(false)
    }
  }

  // Format Created Date
  function formatDate(isoStr: string | null) {
    if (!isoStr) return '-'
    const date = new Date(isoStr)
    return date.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Relevance Badge Label
  function getRelevanceLabel(relevance: number) {
    switch (relevance) {
      case 1: return t('prizeManagement.relevance1')
      case 2: return t('prizeManagement.relevance2')
      case 3: return t('prizeManagement.relevance3')
      case 4: return t('prizeManagement.relevance4')
      case 5: return t('prizeManagement.relevance5')
      default: return `Nivel ${relevance}`
    }
  }

  return (
    <div style={{ animation: 'fade-in 0.3s ease-out' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 28, margin: '0 0 4px' }}>
            {t('prizeManagement.title')}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
            {t('prizeManagement.subtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{
            background: 'rgba(27,43,110,0.06)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: '10px 16px',
            textAlign: 'right'
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('prizeManagement.totalPrizes')}
            </span>
            <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--color-navy)' }}>
              {prizes.length}
            </div>
          </div>
          <button
            onClick={handleOpenCreate}
            style={{
              height: 48,
              padding: '0 20px',
              borderRadius: 12,
              background: 'var(--color-navy)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(27,43,110,0.3)',
              transition: 'transform 150ms ease, box-shadow 150ms ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
          >
            <i className="ri-gift-line" style={{ fontSize: 16 }} />
            {t('prizeManagement.btnCreate')}
          </button>
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
            placeholder={t('prizeManagement.searchPlaceholder')}
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

        {/* Relevance Filter */}
        <div style={{ flex: '1 1 160px' }}>
          <select
            value={relevanceFilter}
            onChange={e => {
              setRelevanceFilter(e.target.value)
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
            <option value="">{t('prizeManagement.relevanceAll')}</option>
            <option value="1">1 — {t('prizeManagement.relevance1')}</option>
            <option value="2">2 — {t('prizeManagement.relevance2')}</option>
            <option value="3">3 — {t('prizeManagement.relevance3')}</option>
            <option value="4">4 — {t('prizeManagement.relevance4')}</option>
            <option value="5">5 — {t('prizeManagement.relevance5')}</option>
          </select>
        </div>

        {/* Age Restriction Filter */}
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
            <option value="">Restricción Edad (Todos)</option>
            <option value="adult">{t('prizeManagement.ageAdult')}</option>
            <option value="all">{t('prizeManagement.ageAll')}</option>
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
            <option value="name-asc">Nombre (A - Z)</option>
            <option value="name-desc">Nombre (Z - A)</option>
            <option value="relevance-desc">Importancia (Mayor primero)</option>
            <option value="relevance-asc">Importancia (Menor primero)</option>
          </select>
        </div>

        {/* Clear filters */}
        {(search || relevanceFilter || ageFilter || sortBy !== 'name-asc') && (
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
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                border: '4px solid rgba(27,43,110,0.1)',
                borderTopColor: 'var(--color-yellow)',
                animation: 'spin-circle 0.8s linear infinite'
              }} />
              <div style={{ color: 'var(--color-navy)', fontWeight: 700, fontSize: 15 }}>Cargando premios...</div>
            </div>
          </div>
        ) : error ? (
          /* Error State */
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-error)' }}>
            <i className="ri-error-warning-line" style={{ fontSize: 44, display: 'block', marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: 18 }}>Error al cargar</h3>
            <p style={{ margin: 0, fontSize: 14 }}>{error}</p>
          </div>
        ) : processedPrizes.length === 0 ? (
          /* Empty State */
          <div style={{ padding: 60, textAlign: 'center' }}>
            <i className="ri-gift-line" style={{ fontSize: 48, color: 'var(--color-gray-mid)', display: 'block', marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 6px', color: 'var(--color-navy)', fontFamily: 'var(--font-display)', fontSize: 18 }}>
              No se encontraron premios
            </h3>
            <p style={{ margin: '0 0 16px', color: 'var(--color-text-muted)', fontSize: 14 }}>
              Intenta ajustar tus términos de búsqueda o filtros.
            </p>
          </div>
        ) : (
          /* Table View */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8f9fb', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('prizeManagement.colName')}
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('prizeManagement.colRelevance')}
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('prizeManagement.colAgeReq')}
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('prizeManagement.colCreated')}
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>
                    {t('prizeManagement.colActions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedPrizes.map((prize, idx) => {
                  return (
                    <tr
                      key={prize.id}
                      style={{
                        borderBottom: idx === paginatedPrizes.length - 1 ? 'none' : '1px solid var(--color-border)',
                        transition: 'background 150ms ease'
                      }}
                      className="table-row-hover"
                    >
                      {/* Name with Image preview */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {prize.imageUrl ? (
                            <img
                              src={prize.imageUrl}
                              alt={prize.name}
                              style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--color-border)', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{
                              width: 44, height: 44, borderRadius: 8,
                              background: 'rgba(27,43,110,0.06)', border: '1px solid var(--color-border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                              <i className="ri-gift-2-line" style={{ color: 'var(--color-navy)', fontSize: 20 }} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: 14 }}>
                              {prize.name}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {prize.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Relevance badge */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          background: prize.relevance >= 4 ? 'rgba(245,200,0,0.15)' : prize.relevance === 3 ? 'rgba(244,118,43,0.15)' : 'rgba(27,43,110,0.08)',
                          color: prize.relevance >= 4 ? '#b28e00' : prize.relevance === 3 ? '#b74f11' : 'var(--color-navy)',
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800
                        }}>
                          {getRelevanceLabel(prize.relevance)}
                        </span>
                      </td>

                      {/* Requires adult badge */}
                      <td style={{ padding: '14px 20px' }}>
                        {prize.requiresAdult ? (
                          <span style={{
                            background: 'rgba(230,51,41,0.1)', color: 'var(--color-red)',
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800
                          }}>
                            {t('prizeManagement.ageAdult')}
                          </span>
                        ) : (
                          <span style={{
                            background: 'rgba(60,173,66,0.1)', color: 'var(--color-green)',
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800
                          }}>
                            {t('prizeManagement.ageAll')}
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                        {formatDate(prize.createdAt)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenEdit(prize)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              background: 'rgba(27,43,110,0.06)',
                              border: '1px solid var(--color-border)',
                              color: 'var(--color-navy)',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <i className="ri-pencil-line" />
                            {t('prizeManagement.actionEdit')}
                          </button>
                          <button
                            onClick={() => handleDelete(prize)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              background: 'rgba(230,51,41,0.06)',
                              border: '1px solid rgba(230,51,41,0.15)',
                              color: 'var(--color-red)',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <i className="ri-delete-bin-line" />
                            {t('prizeManagement.actionDelete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && !error && processedPrizes.length > 0 && (
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
            {/* Page size selector */}
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
                Mostrando {Math.min((currentPage - 1) * pageSize + 1, processedPrizes.length)} - {Math.min(currentPage * pageSize, processedPrizes.length)} de {processedPrizes.length} registros
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
                  display: 'flex', alignItems: 'center', gap: 4
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
                  Math.abs(page - currentPage) <= 1

                if (!isPageVisible) {
                  if (page === 2 && currentPage > 3) {
                    return <span key="ellipsis-start" style={{ padding: '0 4px', color: 'var(--color-gray-mid)' }}>...</span>
                  }
                  if (page === totalPages - 1 && currentPage < totalPages - 2) {
                    return <span key="ellipsis-end" style={{ padding: '0 4px', color: 'var(--color-gray-mid)' }}>...</span>
                  }
                  return null
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
                      cursor: 'pointer'
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
                  display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                Siguiente
                <i className="ri-arrow-right-s-line" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── CREATE PRIZE MODAL ─────────────────── */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(13,21,38,0.5)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100, padding: 16
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 16,
            width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-pop)',
            maxHeight: '90vh', overflowY: 'auto', animation: 'slide-up 0.2s ease-out'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: 0 }}>
                {t('prizeManagement.modalCreateTitle')}
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-mid)', padding: 4 }}>
                <i className="ri-close-line" style={{ fontSize: 20 }} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  {t('prizeManagement.formName')}
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  style={{
                    height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                    padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none'
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  {t('prizeManagement.formDescription')}
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  style={{
                    borderRadius: 8, border: '1.5px solid var(--color-border)',
                    padding: '10px 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical'
                  }}
                />
              </div>

              {/* Image Upload */}
              <ImageUpload
                value={formImageUrl}
                onChange={setFormImageUrl}
                storagePath="prizes"
                label={t('prizeManagement.formImageUrl')}
              />

              {/* Relevance Level */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  {t('prizeManagement.formRelevance')}
                </label>
                <select
                  value={formRelevance}
                  onChange={e => setFormRelevance(Number(e.target.value))}
                  style={{
                    height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                    padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer'
                  }}
                >
                  <option value={1}>1 — {t('prizeManagement.relevance1')}</option>
                  <option value={2}>2 — {t('prizeManagement.relevance2')}</option>
                  <option value={3}>3 — {t('prizeManagement.relevance3')}</option>
                  <option value={4}>4 — {t('prizeManagement.relevance4')}</option>
                  <option value={5}>5 — {t('prizeManagement.relevance5')}</option>
                </select>
              </div>

              {/* Requires Adult Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
                <input
                  type="checkbox"
                  id="create-requires-adult"
                  checked={formRequiresAdult}
                  onChange={e => setFormRequiresAdult(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <label htmlFor="create-requires-adult" style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
                  {t('prizeManagement.formRequiresAdult')}
                </label>
              </div>

              {/* Error */}
              {formError && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(230,51,41,0.07)', border: '1px solid rgba(230,51,41,0.15)',
                  color: 'var(--color-error)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <i className="ri-error-warning-line" />
                  {formError}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={formLoading}
                  style={{
                    height: 38, padding: '0 16px', borderRadius: 8,
                    border: '1px solid var(--color-border)', background: 'none',
                    color: 'var(--color-gray-dark)', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  {t('prizeManagement.btnCancel')}
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    height: 38, padding: '0 18px', borderRadius: 8,
                    border: 'none', background: 'var(--color-navy)',
                    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  {formLoading && <i className="ri-loader-4-line" style={{ animation: 'spin-circle 0.8s linear infinite' }} />}
                  {formLoading ? t('prizeManagement.btnSaving') : t('prizeManagement.btnSave')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT PRIZE MODAL ─────────────────── */}
      {showEditModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(13,21,38,0.5)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100, padding: 16
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 16,
            width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-pop)',
            maxHeight: '90vh', overflowY: 'auto', animation: 'slide-up 0.2s ease-out'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: 0 }}>
                {t('prizeManagement.modalEditTitle')}
              </h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-mid)', padding: 4 }}>
                <i className="ri-close-line" style={{ fontSize: 20 }} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  {t('prizeManagement.formName')}
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  style={{
                    height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                    padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none'
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  {t('prizeManagement.formDescription')}
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  style={{
                    borderRadius: 8, border: '1.5px solid var(--color-border)',
                    padding: '10px 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical'
                  }}
                />
              </div>

              {/* Image Upload */}
              <ImageUpload
                value={formImageUrl}
                onChange={setFormImageUrl}
                storagePath="prizes"
                label={t('prizeManagement.formImageUrl')}
              />

              {/* Relevance Level */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  {t('prizeManagement.formRelevance')}
                </label>
                <select
                  value={formRelevance}
                  onChange={e => setFormRelevance(Number(e.target.value))}
                  style={{
                    height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                    padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer'
                  }}
                >
                  <option value={1}>1 — {t('prizeManagement.relevance1')}</option>
                  <option value={2}>2 — {t('prizeManagement.relevance2')}</option>
                  <option value={3}>3 — {t('prizeManagement.relevance3')}</option>
                  <option value={4}>4 — {t('prizeManagement.relevance4')}</option>
                  <option value={5}>5 — {t('prizeManagement.relevance5')}</option>
                </select>
              </div>

              {/* Requires Adult Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
                <input
                  type="checkbox"
                  id="edit-requires-adult"
                  checked={formRequiresAdult}
                  onChange={e => setFormRequiresAdult(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <label htmlFor="edit-requires-adult" style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer' }}>
                  {t('prizeManagement.formRequiresAdult')}
                </label>
              </div>

              {/* Error */}
              {formError && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(230,51,41,0.07)', border: '1px solid rgba(230,51,41,0.15)',
                  color: 'var(--color-error)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <i className="ri-error-warning-line" />
                  {formError}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={formLoading}
                  style={{
                    height: 38, padding: '0 16px', borderRadius: 8,
                    border: '1px solid var(--color-border)', background: 'none',
                    color: 'var(--color-gray-dark)', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  {t('prizeManagement.btnCancel')}
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    height: 38, padding: '0 18px', borderRadius: 8,
                    border: 'none', background: 'var(--color-navy)',
                    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  {formLoading && <i className="ri-loader-4-line" style={{ animation: 'spin-circle 0.8s linear infinite' }} />}
                  {formLoading ? t('prizeManagement.btnSaving') : t('prizeManagement.btnSave')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
