import { useEffect, useState, useMemo, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  fetchSeasons,
  fetchPrizesList,
  createSeason,
  updateSeason,
  deleteSeason,
  createPrize,
  type SeasonData,
  type PrizeData
} from '../../services/adminService'

interface FormStagePrize {
  prizeId: string
  stock: number
}

interface FormStageState {
  id?: string
  pointsCount: number
  prizes: FormStagePrize[]
}

export default function SeasonsPage() {
  const { t } = useTranslation()

  // Data states
  const [seasons, setSeasons] = useState<SeasonData[]>([])
  const [prizes, setPrizes] = useState<PrizeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search & filter states
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'>('date-desc')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState<SeasonData | null>(null)

  // Form states
  const [formName, setFormName] = useState('')
  const [formStatus, setFormStatus] = useState<'active' | 'upcoming' | 'archived'>('upcoming')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')
  const [formStages, setFormStages] = useState<FormStageState[]>([
    { pointsCount: 0, prizes: [{ prizeId: '', stock: 0 }] },
    { pointsCount: 0, prizes: [{ prizeId: '', stock: 0 }] },
    { pointsCount: 0, prizes: [{ prizeId: '', stock: 0 }] },
  ])
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [activeStageTab, setActiveStageTab] = useState<number>(0)

  // Quick Create Prize States
  const [showQuickPrizeModal, setShowQuickPrizeModal] = useState(false)
  const [quickPrizeName, setQuickPrizeName] = useState('')
  const [quickPrizeDesc, setQuickPrizeDesc] = useState('')
  const [quickPrizeImg, setQuickPrizeImg] = useState('')
  const [quickPrizeRelevance, setQuickPrizeRelevance] = useState<number>(1)
  const [quickPrizeRequiresAdult, setQuickPrizeRequiresAdult] = useState(false)
  const [quickPrizeTarget, setQuickPrizeTarget] = useState<{ stageIndex: number; prizeIndex: number } | null>(null)
  const [quickPrizeLoading, setQuickPrizeLoading] = useState(false)
  const [quickPrizeError, setQuickPrizeError] = useState<string | null>(null)

  // Load data on mount
  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const [seasonsData, prizesData] = await Promise.all([
        fetchSeasons(),
        fetchPrizesList()
      ])
      setSeasons(seasonsData)
      setPrizes(prizesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  // Filtered & sorted seasons
  const processedSeasons = useMemo(() => {
    let result = [...seasons]

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        s => s.name.toLowerCase().includes(q)
      )
    }

    // Status filter
    if (statusFilter) {
      result = result.filter(s => s.status === statusFilter)
    }

    // Sorting logic
    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return timeB - timeA
      }
      if (sortBy === 'date-asc') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return timeA - timeB
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name)
      }
      return 0
    })

    return result
  }, [seasons, search, statusFilter, sortBy])

  // Pagination bounds
  const totalPages = Math.ceil(processedSeasons.length / pageSize)
  const paginatedSeasons = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return processedSeasons.slice(start, start + pageSize)
  }, [processedSeasons, currentPage, pageSize])

  // Clear filters
  function handleClearFilters() {
    setSearch('')
    setStatusFilter('')
    setSortBy('date-desc')
    setCurrentPage(1)
  }

  // Handle open Create Modal
  function handleOpenCreate() {
    setFormName('')
    setFormStatus('upcoming')
    setFormStartDate('')
    setFormEndDate('')
    setFormStages([
      { pointsCount: 0, prizes: [{ prizeId: '', stock: 0 }] },
      { pointsCount: 0, prizes: [{ prizeId: '', stock: 0 }] },
      { pointsCount: 0, prizes: [{ prizeId: '', stock: 0 }] },
    ])
    setFormError(null)
    setFormLoading(false)
    setActiveStageTab(0)
    setShowCreateModal(true)
  }

  // Helper to format ISO Date to YYYY-MM-DD for date inputs
  function formatDateForInput(isoStr: string) {
    if (!isoStr) return ''
    return isoStr.split('T')[0]
  }

  // Handle open Edit Modal
  function handleOpenEdit(season: SeasonData) {
    setSelectedSeason(season)
    setFormName(season.name)
    setFormStatus(season.status)
    setFormStartDate(formatDateForInput(season.startDate))
    setFormEndDate(formatDateForInput(season.endDate))
    if (season.stages && season.stages.length === 3) {
      setFormStages(season.stages.map(s => ({
        id: s.id,
        pointsCount: s.pointsCount,
        prizes: (Array.isArray(s.prizes) && s.prizes.length > 0)
          ? s.prizes.map(p => ({ prizeId: p.prizeId, stock: p.stock || 0 }))
          : [{ prizeId: '', stock: 0 }]
      })))
    } else {
      setFormStages([
        { pointsCount: 0, prizes: [{ prizeId: '', stock: 0 }] },
        { pointsCount: 0, prizes: [{ prizeId: '', stock: 0 }] },
        { pointsCount: 0, prizes: [{ prizeId: '', stock: 0 }] },
      ])
    }
    setFormError(null)
    setFormLoading(false)
    setActiveStageTab(0)
    setShowEditModal(true)
  }

  // Handle open Quick Create
  function handleOpenQuickPrize(stageIndex: number, prizeIndex: number) {
    setQuickPrizeName('')
    setQuickPrizeDesc('')
    setQuickPrizeImg('')
    setQuickPrizeRelevance(1)
    setQuickPrizeRequiresAdult(false)
    setQuickPrizeTarget({ stageIndex, prizeIndex })
    setQuickPrizeError(null)
    setQuickPrizeLoading(false)
    setShowQuickPrizeModal(true)
  }

  // Handle submit Quick Create
  async function handleQuickPrizeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!quickPrizeName.trim()) {
      setQuickPrizeError('El nombre del premio es requerido.')
      return
    }
    if (!quickPrizeTarget) return

    try {
      setQuickPrizeLoading(true)
      setQuickPrizeError(null)

      // Create new prize document in catalog
      const newPrizeId = await createPrize({
        name: quickPrizeName,
        description: quickPrizeDesc,
        imageUrl: quickPrizeImg,
        relevance: quickPrizeRelevance,
        requiresAdult: quickPrizeRequiresAdult
      })

      // Fetch fresh list of catalog prizes
      const freshPrizes = await fetchPrizesList()
      setPrizes(freshPrizes)

      // Auto-assign new prize to target slot in formStages
      const nextStages = [...formStages]
      const targetStage = nextStages[quickPrizeTarget.stageIndex]
      const nextPrizes = [...targetStage.prizes]
      nextPrizes[quickPrizeTarget.prizeIndex] = {
        ...nextPrizes[quickPrizeTarget.prizeIndex],
        prizeId: newPrizeId
      }
      nextStages[quickPrizeTarget.stageIndex] = {
        ...targetStage,
        prizes: nextPrizes
      }
      setFormStages(nextStages)

      // Close modal
      setShowQuickPrizeModal(false)
    } catch (err) {
      setQuickPrizeError(err instanceof Error ? err.message : 'Error al crear el premio')
    } finally {
      setQuickPrizeLoading(false)
    }
  }

  // Update points count for stage at index
  function handleStagePointsChange(stageIndex: number, pointsCount: number) {
    const nextStages = [...formStages]
    nextStages[stageIndex] = {
      ...nextStages[stageIndex],
      pointsCount
    }
    setFormStages(nextStages)
  }

  // Update specific field of a prize inside a stage
  function handleStagePrizeChange(stageIndex: number, prizeIndex: number, field: keyof FormStagePrize, value: any) {
    const nextStages = [...formStages]
    const nextPrizes = [...nextStages[stageIndex].prizes]
    nextPrizes[prizeIndex] = {
      ...nextPrizes[prizeIndex],
      [field]: value
    }
    nextStages[stageIndex] = {
      ...nextStages[stageIndex],
      prizes: nextPrizes
    }
    setFormStages(nextStages)
  }

  // Add an empty prize row to a stage
  function handleAddPrizeToStage(stageIndex: number) {
    const nextStages = [...formStages]
    const nextPrizes = [...nextStages[stageIndex].prizes, { prizeId: '', stock: 0 }]
    nextStages[stageIndex] = {
      ...nextStages[stageIndex],
      prizes: nextPrizes
    }
    setFormStages(nextStages)
  }

  // Remove a prize row from a stage
  function handleRemovePrizeFromStage(stageIndex: number, prizeIndex: number) {
    const nextStages = [...formStages]
    const nextPrizes = nextStages[stageIndex].prizes.filter((_, idx) => idx !== prizeIndex)
    nextStages[stageIndex] = {
      ...nextStages[stageIndex],
      prizes: nextPrizes
    }
    setFormStages(nextStages)
  }

  // Submit form validation
  function validateForm(): boolean {
    if (!formName.trim()) {
      setFormError(t('seasonManagement.errRequired'))
      return false
    }
    if (!formStartDate || !formEndDate) {
      setFormError(t('seasonManagement.errRequired'))
      return false
    }
    if (new Date(formStartDate).getTime() > new Date(formEndDate).getTime()) {
      setFormError(t('seasonManagement.errInvalidDates'))
      return false
    }

    for (let i = 0; i < 3; i++) {
      const s = formStages[i]
      if (typeof s.pointsCount !== 'number' || s.pointsCount < 0) {
        setFormError(t('seasonManagement.errStagePoints'))
        return false
      }
      if (!s.prizes || s.prizes.length === 0) {
        setFormError(t('seasonManagement.errStageNoPrizes'))
        return false
      }
      for (const p of s.prizes) {
        if (!p.prizeId) {
          setFormError(t('seasonManagement.errStagePrize'))
          return false
        }
        if (typeof p.stock !== 'number' || p.stock < 0) {
          setFormError(t('seasonManagement.errStageStock'))
          return false
        }
      }
    }

    return true
  }

  // Submit Create Form
  async function handleCreateSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!validateForm()) return

    try {
      setFormLoading(true)
      await createSeason({
        name: formName,
        status: formStatus,
        startDate: formStartDate,
        endDate: formEndDate,
        stages: formStages.map(s => ({
          pointsCount: Number(s.pointsCount),
          prizes: s.prizes.map(p => ({
            prizeId: p.prizeId,
            stock: Number(p.stock)
          }))
        }))
      })
      setShowCreateModal(false)
      load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear la temporada'
      setFormError(message)
    } finally {
      setFormLoading(false)
    }
  }

  // Submit Edit Form
  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selectedSeason) return
    setFormError(null)

    if (!validateForm()) return

    try {
      setFormLoading(true)
      await updateSeason({
        id: selectedSeason.id,
        name: formName,
        status: formStatus,
        startDate: formStartDate,
        endDate: formEndDate,
        stages: formStages.map(s => ({
          id: s.id || '',
          pointsCount: Number(s.pointsCount),
          prizes: s.prizes.map(p => ({
            prizeId: p.prizeId,
            stock: Number(p.stock)
          }))
        }))
      })
      setShowEditModal(false)
      load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar la temporada'
      setFormError(message)
    } finally {
      setFormLoading(false)
    }
  }

  // Handle Delete Season
  async function handleDelete(season: SeasonData) {
    if (!window.confirm(t('seasonManagement.confirmDelete'))) {
      return
    }

    try {
      setFormLoading(true)
      await deleteSeason(season.id)
      load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar la temporada'
      alert(message)
    } finally {
      setFormLoading(false)
    }
  }

  // Format Dates
  function formatDateRange(startStr: string, endStr: string) {
    const start = new Date(startStr)
    const end = new Date(endStr)
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
    return `${start.toLocaleDateString('es-DO', options)} — ${end.toLocaleDateString('es-DO', options)}`
  }

  function formatDateCreated(isoStr: string | null) {
    if (!isoStr) return '-'
    const date = new Date(isoStr)
    return date.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div style={{ animation: 'fade-in 0.3s ease-out' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 28, margin: '0 0 4px' }}>
            {t('seasonManagement.title')}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
            {t('seasonManagement.subtitle')}
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
              {t('seasonManagement.totalSeasons')}
            </span>
            <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--color-navy)' }}>
              {seasons.length}
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
            <i className="ri-calendar-todo-line" style={{ fontSize: 16 }} />
            {t('seasonManagement.btnCreate')}
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
            placeholder={t('seasonManagement.searchPlaceholder')}
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

        {/* Status Filter */}
        <div style={{ flex: '1 1 160px' }}>
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value)
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
            <option value="">{t('seasonManagement.statusAll')}</option>
            <option value="active">{t('seasonManagement.statusActive')}</option>
            <option value="upcoming">{t('seasonManagement.statusUpcoming')}</option>
            <option value="archived">{t('seasonManagement.statusArchived')}</option>
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
            <option value="date-desc">Creación (Reciente)</option>
            <option value="date-asc">Creación (Antiguo)</option>
            <option value="name-asc">Nombre (A - Z)</option>
            <option value="name-desc">Nombre (Z - A)</option>
          </select>
        </div>

        {/* Clear filters */}
        {(search || statusFilter || sortBy !== 'date-desc') && (
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
              <div style={{ color: 'var(--color-navy)', fontWeight: 700, fontSize: 15 }}>Cargando temporadas...</div>
            </div>
          </div>
        ) : error ? (
          /* Error State */
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-error)' }}>
            <i className="ri-error-warning-line" style={{ fontSize: 44, display: 'block', marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: 18 }}>Error al cargar</h3>
            <p style={{ margin: 0, fontSize: 14 }}>{error}</p>
          </div>
        ) : processedSeasons.length === 0 ? (
          /* Empty State */
          <div style={{ padding: 60, textAlign: 'center' }}>
            <i className="ri-calendar-event-line" style={{ fontSize: 48, color: 'var(--color-gray-mid)', display: 'block', marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 6px', color: 'var(--color-navy)', fontFamily: 'var(--font-display)', fontSize: 18 }}>
              No se encontraron temporadas
            </h3>
            <p style={{ margin: '0 0 16px', color: 'var(--color-text-muted)', fontSize: 14 }}>
              Crea una temporada para inicializar etapas y premios en el rally.
            </p>
          </div>
        ) : (
          /* Table View */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8f9fb', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('seasonManagement.colName')}
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('seasonManagement.colStatus')}
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('seasonManagement.colDates')}
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Etapas (Paradas, Stock y Premios)
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('seasonManagement.colCreated')}
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>
                    {t('seasonManagement.colActions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedSeasons.map((season, idx) => {
                  return (
                    <tr
                      key={season.id}
                      style={{
                        borderBottom: idx === paginatedSeasons.length - 1 ? 'none' : '1px solid var(--color-border)',
                        transition: 'background 150ms ease'
                      }}
                      className="table-row-hover"
                    >
                      {/* Name */}
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--color-navy)', fontSize: 14 }}>
                        {season.name}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 20px' }}>
                        {season.status === 'active' ? (
                          <span style={{
                            background: 'rgba(60,173,66,0.1)', color: 'var(--color-green)',
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800
                          }}>
                            {t('seasonManagement.statusActive')}
                          </span>
                        ) : season.status === 'upcoming' ? (
                          <span style={{
                            background: 'rgba(27,43,110,0.1)', color: 'var(--color-navy)',
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800
                          }}>
                            {t('seasonManagement.statusUpcoming')}
                          </span>
                        ) : (
                          <span style={{
                            background: 'rgba(108,117,125,0.1)', color: '#6c757d',
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800
                          }}>
                            {t('seasonManagement.statusArchived')}
                          </span>
                        )}
                      </td>

                      {/* Dates */}
                      <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--color-text)' }}>
                        {formatDateRange(season.startDate, season.endDate)}
                      </td>

                      {/* Stages details */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {season.stages && season.stages.map(stage => {
                            return (
                              <div key={stage.id} style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{
                                    background: stage.number === 1 ? 'rgba(43,191,184,0.15)' : stage.number === 2 ? 'rgba(244,118,43,0.15)' : 'rgba(245,200,0,0.15)',
                                    color: stage.number === 1 ? '#1a8b86' : stage.number === 2 ? '#b74f11' : '#b28e00',
                                    padding: '1px 5px', borderRadius: 4, fontWeight: 700
                                  }}>
                                    E{stage.number}
                                  </span>
                                  <span style={{ color: 'var(--color-navy)', fontWeight: 700 }}>{stage.pointsCount} paradas</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 12, borderLeft: '1.5px solid var(--color-border)', marginLeft: 8, marginTop: 2 }}>
                                  {stage.prizes && stage.prizes.map((sp, pIdx) => {
                                    const prize = prizes.find(p => p.id === sp.prizeId)
                                    return (
                                      <div key={pIdx} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 11 }}>
                                        <span style={{ fontWeight: 600 }}>Qty: {sp.stock || 0}</span>
                                        <span style={{ color: 'var(--color-border)' }}>•</span>
                                        <span style={{ color: 'var(--color-text)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: 140 }} title={prize?.name}>
                                          {prize?.name || 'Cargando...'}
                                        </span>
                                        {prize?.requiresAdult && (
                                          <span style={{ background: 'rgba(230,51,41,0.1)', color: 'var(--color-red)', padding: '0px 4px', borderRadius: 4, fontSize: 9, fontWeight: 800 }}>
                                            +18
                                          </span>
                                        )}
                                      </div>
                                    )
                                  })}
                                  {(!stage.prizes || stage.prizes.length === 0) && (
                                    <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: 11 }}>
                                      Sin premios
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </td>

                      {/* Created Date */}
                      <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                        {formatDateCreated(season.createdAt)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenEdit(season)}
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
                            {t('seasonManagement.actionEdit')}
                          </button>
                          <button
                            onClick={() => handleDelete(season)}
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
                            {t('seasonManagement.actionDelete')}
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
        {!loading && !error && processedSeasons.length > 0 && (
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
                Mostrando {Math.min((currentPage - 1) * pageSize + 1, processedSeasons.length)} - {Math.min(currentPage * pageSize, processedSeasons.length)} de {processedSeasons.length} registros
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

      {/* ── CREATE SEASON MODAL ─────────────────── */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(13,21,38,0.5)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100, padding: 16
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 16,
            width: '100%', maxWidth: 540, boxShadow: 'var(--shadow-pop)',
            maxHeight: '90vh', overflowY: 'auto', animation: 'slide-up 0.2s ease-out'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: 0 }}>
                {t('seasonManagement.modalCreateTitle')}
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-mid)', padding: 4 }}>
                <i className="ri-close-line" style={{ fontSize: 20 }} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  {t('seasonManagement.formName')}
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

              {/* Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  {t('seasonManagement.formStatus')}
                </label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as any)}
                  style={{
                    height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                    padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer'
                  }}
                >
                  <option value="upcoming">{t('seasonManagement.statusUpcoming')}</option>
                  <option value="active">{t('seasonManagement.statusActive')}</option>
                  <option value="archived">{t('seasonManagement.statusArchived')}</option>
                </select>
                {formStatus === 'active' && (
                  <span style={{ fontSize: 11, color: 'var(--color-orange)', fontWeight: 600 }}>
                    {t('seasonManagement.activeNotice')}
                  </span>
                )}
              </div>

              {/* Dates */}
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    {t('seasonManagement.formStartDate')}
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    style={{
                      height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                      padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none'
                    }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    {t('seasonManagement.formEndDate')}
                  </label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={e => setFormEndDate(e.target.value)}
                    style={{
                      height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                      padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* 3 Stages config */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, marginTop: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-navy)', display: 'block', marginBottom: 12 }}>
                  Configuración de Etapas (Exactamente 3)
                </span>

                {/* Tab switcher */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
                  {[0, 1, 2].map(idx => {
                    const stage = formStages[idx]
                    const isActive = activeStageTab === idx
                    const prizeCount = stage.prizes.length
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveStageTab(idx)}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: isActive ? '1.5px solid var(--color-navy)' : '1px solid var(--color-border)',
                          background: isActive ? 'rgba(27,43,110,0.04)' : '#fff',
                          color: isActive ? 'var(--color-navy)' : 'var(--color-text-muted)',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer',
                          transition: 'all 150ms ease',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          boxShadow: isActive ? '0 2px 8px rgba(27,43,110,0.06)' : 'none'
                        }}
                      >
                        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.8 }}>
                          Etapa {idx + 1}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.9 }}>
                          {stage.pointsCount || 0} paradas • {prizeCount} {prizeCount === 1 ? 'premio' : 'premios'}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Active Stage Config Panel */}
                {formStages[activeStageTab] && (() => {
                  const stage = formStages[activeStageTab]
                  return (
                    <div style={{
                      background: '#f8f9fb',
                      borderRadius: 12,
                      padding: 16,
                      border: '1px solid var(--color-border)',
                      animation: 'fade-in 0.2s ease-out'
                    }}>
                      {/* Points / Stops selector */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 12, background: '#fff',
                        padding: 12, borderRadius: 10, border: '1px solid var(--color-border)',
                        marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.01)'
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8, background: 'rgba(27,43,110,0.08)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-navy)'
                        }}>
                          <i className="ri-map-pin-2-line" style={{ fontSize: 18 }} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-navy)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {t('seasonManagement.stagePoints')} (Paradas del Rally)
                          </label>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                            Número de paradas de esta etapa.
                          </span>
                        </div>
                        <input
                          type="number"
                          required
                          min={0}
                          value={stage.pointsCount}
                          onChange={e => handleStagePointsChange(activeStageTab, Number(e.target.value))}
                          style={{
                            width: 70, height: 34, borderRadius: 6, border: '1.5px solid var(--color-border)',
                            padding: '0 8px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
                            textAlign: 'center', fontWeight: 700, color: 'var(--color-navy)'
                          }}
                        />
                      </div>

                      {/* Header for Prizes */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-navy)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Premios de la Etapa
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          {stage.prizes.length} configurado(s)
                        </span>
                      </div>

                      {/* Prizes List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                        {stage.prizes.map((pConfig, pIdx) => (
                          <div
                            key={pIdx}
                            style={{
                              background: '#fff',
                              border: '1px solid var(--color-border)',
                              borderRadius: 10,
                              padding: 12,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 10,
                              position: 'relative',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.01)'
                            }}
                          >
                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => handleRemovePrizeFromStage(activeStageTab, pIdx)}
                              style={{
                                position: 'absolute', top: 10, right: 10,
                                height: 26, width: 26, borderRadius: 6,
                                border: 'none',
                                background: 'rgba(230,51,41,0.06)',
                                color: 'var(--color-red)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 150ms ease'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(230,51,41,0.12)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(230,51,41,0.06)' }}
                              title={t('seasonManagement.btnRemovePrize')}
                            >
                              <i className="ri-delete-bin-line" style={{ fontSize: 13 }} />
                            </button>

                            <div style={{ display: 'flex', gap: 10, paddingRight: 28, alignItems: 'center' }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: '50%', background: 'rgba(27,43,110,0.05)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-navy)',
                                flexShrink: 0
                              }}>
                                <i className="ri-gift-line" style={{ fontSize: 14 }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-navy)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Premio #{pIdx + 1}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                              {/* Select Prize */}
                              <div style={{ flex: '2 1 200px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                  {t('seasonManagement.stagePrize')}
                                </label>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                  <select
                                    required
                                    value={pConfig.prizeId}
                                    onChange={e => handleStagePrizeChange(activeStageTab, pIdx, 'prizeId', e.target.value)}
                                    style={{
                                      flex: 1, height: 34, borderRadius: 6, border: '1px solid var(--color-border)',
                                      padding: '0 8px', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
                                      background: '#f8f9fb', cursor: 'pointer', boxSizing: 'border-box', minWidth: 0
                                    }}
                                  >
                                    <option value="">Selecciona un premio...</option>
                                    {prizes.map(p => (
                                      <option key={p.id} value={p.id}>
                                        {p.name} {p.requiresAdult ? '(+18)' : ''}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenQuickPrize(activeStageTab, pIdx)}
                                    style={{
                                      height: 34, width: 34, borderRadius: 6,
                                      border: '1px solid rgba(27,43,110,0.15)',
                                      background: 'rgba(27,43,110,0.06)',
                                      color: 'var(--color-navy)',
                                      cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      transition: 'all 150ms ease', flexShrink: 0
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.background = 'rgba(27,43,110,0.12)';
                                      e.currentTarget.style.borderColor = 'var(--color-navy)';
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.background = 'rgba(27,43,110,0.06)';
                                      e.currentTarget.style.borderColor = 'rgba(27,43,110,0.15)';
                                    }}
                                    title="Crear premio nuevo"
                                  >
                                    <i className="ri-add-line" style={{ fontSize: 16, fontWeight: 'bold' }} />
                                  </button>
                                </div>
                              </div>

                              {/* Stock */}
                              <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                  {t('seasonManagement.stageStock')}
                                </label>
                                <div style={{ position: 'relative' }}>
                                  <input
                                    type="number"
                                    required
                                    min={0}
                                    value={pConfig.stock}
                                    onChange={e => handleStagePrizeChange(activeStageTab, pIdx, 'stock', Number(e.target.value))}
                                    style={{
                                      height: 34, borderRadius: 6, border: '1px solid var(--color-border)',
                                      padding: '0 8px 0 24px', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
                                      width: '100%', boxSizing: 'border-box'
                                    }}
                                  />
                                  <i className="ri-archive-line" style={{
                                    position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                                    color: 'var(--color-gray-mid)', fontSize: 13
                                  }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {stage.prizes.length === 0 && (
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '6px 0', textAlign: 'center' }}>
                            {t('seasonManagement.errStageNoPrizes')}
                          </div>
                        )}
                      </div>

                      {/* Add Prize Button */}
                      <button
                        type="button"
                        onClick={() => handleAddPrizeToStage(activeStageTab)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: 8,
                          border: '2px dashed var(--color-border)',
                          background: 'none',
                          color: 'var(--color-navy)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          transition: 'all 150ms ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--color-navy)'
                          e.currentTarget.style.background = 'rgba(27,43,110,0.02)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--color-border)'
                          e.currentTarget.style.background = 'none'
                        }}
                      >
                        <i className="ri-add-line" style={{ fontSize: 14 }} />
                        {t('seasonManagement.btnAddPrize')}
                      </button>
                    </div>
                  )
                })()}
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
                  {t('seasonManagement.btnCancel')}
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
                  {formLoading ? t('seasonManagement.btnSaving') : t('seasonManagement.btnSave')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT SEASON MODAL ─────────────────── */}
      {showEditModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(13,21,38,0.5)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100, padding: 16
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 16,
            width: '100%', maxWidth: 540, boxShadow: 'var(--shadow-pop)',
            maxHeight: '90vh', overflowY: 'auto', animation: 'slide-up 0.2s ease-out'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: 0 }}>
                {t('seasonManagement.modalEditTitle')}
              </h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-mid)', padding: 4 }}>
                <i className="ri-close-line" style={{ fontSize: 20 }} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  {t('seasonManagement.formName')}
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

              {/* Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  {t('seasonManagement.formStatus')}
                </label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as any)}
                  style={{
                    height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                    padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer'
                  }}
                >
                  <option value="upcoming">{t('seasonManagement.statusUpcoming')}</option>
                  <option value="active">{t('seasonManagement.statusActive')}</option>
                  <option value="archived">{t('seasonManagement.statusArchived')}</option>
                </select>
                {formStatus === 'active' && (
                  <span style={{ fontSize: 11, color: 'var(--color-orange)', fontWeight: 600 }}>
                    {t('seasonManagement.activeNotice')}
                  </span>
                )}
              </div>

              {/* Dates */}
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    {t('seasonManagement.formStartDate')}
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    style={{
                      height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                      padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none'
                    }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    {t('seasonManagement.formEndDate')}
                  </label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={e => setFormEndDate(e.target.value)}
                    style={{
                      height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                      padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* 3 Stages config */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, marginTop: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-navy)', display: 'block', marginBottom: 12 }}>
                  Configuración de Etapas (Exactamente 3)
                </span>

                {/* Tab switcher */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
                  {[0, 1, 2].map(idx => {
                    const stage = formStages[idx]
                    const isActive = activeStageTab === idx
                    const prizeCount = stage.prizes.length
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveStageTab(idx)}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: isActive ? '1.5px solid var(--color-navy)' : '1px solid var(--color-border)',
                          background: isActive ? 'rgba(27,43,110,0.04)' : '#fff',
                          color: isActive ? 'var(--color-navy)' : 'var(--color-text-muted)',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer',
                          transition: 'all 150ms ease',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          boxShadow: isActive ? '0 2px 8px rgba(27,43,110,0.06)' : 'none'
                        }}
                      >
                        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.8 }}>
                          Etapa {idx + 1}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.9 }}>
                          {stage.pointsCount || 0} paradas • {prizeCount} {prizeCount === 1 ? 'premio' : 'premios'}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Active Stage Config Panel */}
                {formStages[activeStageTab] && (() => {
                  const stage = formStages[activeStageTab]
                  return (
                    <div style={{
                      background: '#f8f9fb',
                      borderRadius: 12,
                      padding: 16,
                      border: '1px solid var(--color-border)',
                      animation: 'fade-in 0.2s ease-out'
                    }}>
                      {/* Points / Stops selector */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 12, background: '#fff',
                        padding: 12, borderRadius: 10, border: '1px solid var(--color-border)',
                        marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.01)'
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8, background: 'rgba(27,43,110,0.08)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-navy)'
                        }}>
                          <i className="ri-map-pin-2-line" style={{ fontSize: 18 }} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-navy)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {t('seasonManagement.stagePoints')} (Paradas del Rally)
                          </label>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                            Número de paradas de esta etapa.
                          </span>
                        </div>
                        <input
                          type="number"
                          required
                          min={0}
                          value={stage.pointsCount}
                          onChange={e => handleStagePointsChange(activeStageTab, Number(e.target.value))}
                          style={{
                            width: 70, height: 34, borderRadius: 6, border: '1.5px solid var(--color-border)',
                            padding: '0 8px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
                            textAlign: 'center', fontWeight: 700, color: 'var(--color-navy)'
                          }}
                        />
                      </div>

                      {/* Header for Prizes */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-navy)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Premios de la Etapa
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          {stage.prizes.length} configurado(s)
                        </span>
                      </div>

                      {/* Prizes List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                        {stage.prizes.map((pConfig, pIdx) => (
                          <div
                            key={pIdx}
                            style={{
                              background: '#fff',
                              border: '1px solid var(--color-border)',
                              borderRadius: 10,
                              padding: 12,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 10,
                              position: 'relative',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.01)'
                            }}
                          >
                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => handleRemovePrizeFromStage(activeStageTab, pIdx)}
                              style={{
                                position: 'absolute', top: 10, right: 10,
                                height: 26, width: 26, borderRadius: 6,
                                border: 'none',
                                background: 'rgba(230,51,41,0.06)',
                                color: 'var(--color-red)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 150ms ease'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(230,51,41,0.12)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(230,51,41,0.06)' }}
                              title={t('seasonManagement.btnRemovePrize')}
                            >
                              <i className="ri-delete-bin-line" style={{ fontSize: 13 }} />
                            </button>

                            <div style={{ display: 'flex', gap: 10, paddingRight: 28, alignItems: 'center' }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: '50%', background: 'rgba(27,43,110,0.05)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-navy)',
                                flexShrink: 0
                              }}>
                                <i className="ri-gift-line" style={{ fontSize: 14 }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-navy)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Premio #{pIdx + 1}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                              {/* Select Prize */}
                              <div style={{ flex: '2 1 200px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                  {t('seasonManagement.stagePrize')}
                                </label>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                  <select
                                    required
                                    value={pConfig.prizeId}
                                    onChange={e => handleStagePrizeChange(activeStageTab, pIdx, 'prizeId', e.target.value)}
                                    style={{
                                      flex: 1, height: 34, borderRadius: 6, border: '1px solid var(--color-border)',
                                      padding: '0 8px', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
                                      background: '#f8f9fb', cursor: 'pointer', boxSizing: 'border-box', minWidth: 0
                                    }}
                                  >
                                    <option value="">Selecciona un premio...</option>
                                    {prizes.map(p => (
                                      <option key={p.id} value={p.id}>
                                        {p.name} {p.requiresAdult ? '(+18)' : ''}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenQuickPrize(activeStageTab, pIdx)}
                                    style={{
                                      height: 34, width: 34, borderRadius: 6,
                                      border: '1px solid rgba(27,43,110,0.15)',
                                      background: 'rgba(27,43,110,0.06)',
                                      color: 'var(--color-navy)',
                                      cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      transition: 'all 150ms ease', flexShrink: 0
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.background = 'rgba(27,43,110,0.12)';
                                      e.currentTarget.style.borderColor = 'var(--color-navy)';
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.background = 'rgba(27,43,110,0.06)';
                                      e.currentTarget.style.borderColor = 'rgba(27,43,110,0.15)';
                                    }}
                                    title="Crear premio nuevo"
                                  >
                                    <i className="ri-add-line" style={{ fontSize: 16, fontWeight: 'bold' }} />
                                  </button>
                                </div>
                              </div>

                              {/* Stock */}
                              <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                  {t('seasonManagement.stageStock')}
                                </label>
                                <div style={{ position: 'relative' }}>
                                  <input
                                    type="number"
                                    required
                                    min={0}
                                    value={pConfig.stock}
                                    onChange={e => handleStagePrizeChange(activeStageTab, pIdx, 'stock', Number(e.target.value))}
                                    style={{
                                      height: 34, borderRadius: 6, border: '1px solid var(--color-border)',
                                      padding: '0 8px 0 24px', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
                                      width: '100%', boxSizing: 'border-box'
                                    }}
                                  />
                                  <i className="ri-archive-line" style={{
                                    position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                                    color: 'var(--color-gray-mid)', fontSize: 13
                                  }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {stage.prizes.length === 0 && (
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '6px 0', textAlign: 'center' }}>
                            {t('seasonManagement.errStageNoPrizes')}
                          </div>
                        )}
                      </div>

                      {/* Add Prize Button */}
                      <button
                        type="button"
                        onClick={() => handleAddPrizeToStage(activeStageTab)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: 8,
                          border: '2px dashed var(--color-border)',
                          background: 'none',
                          color: 'var(--color-navy)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          transition: 'all 150ms ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--color-navy)'
                          e.currentTarget.style.background = 'rgba(27,43,110,0.02)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--color-border)'
                          e.currentTarget.style.background = 'none'
                        }}
                      >
                        <i className="ri-add-line" style={{ fontSize: 14 }} />
                        {t('seasonManagement.btnAddPrize')}
                      </button>
                    </div>
                  )
                })()}
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
                  {t('seasonManagement.btnCancel')}
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
                  {formLoading ? t('seasonManagement.btnSaving') : t('seasonManagement.btnSave')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── QUICK CREATE PRIZE MODAL ───────────── */}
      {showQuickPrizeModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(13,21,38,0.6)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 120, padding: 16
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 16,
            width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-pop)',
            maxHeight: '90vh', overflowY: 'auto', animation: 'slide-up 0.2s ease-out'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ri-gift-line" style={{ color: 'var(--color-navy)' }} />
                Crear Premio Rápido
              </h4>
              <button onClick={() => setShowQuickPrizeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-mid)', padding: 4 }}>
                <i className="ri-close-line" style={{ fontSize: 20 }} />
              </button>
            </div>
            <form onSubmit={handleQuickPrizeSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Nombre del Premio
                </label>
                <input
                  type="text"
                  required
                  value={quickPrizeName}
                  onChange={e => setQuickPrizeName(e.target.value)}
                  style={{
                    height: 36, borderRadius: 8, border: '1.5px solid var(--color-border)',
                    padding: '0 10px', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none'
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Descripción
                </label>
                <input
                  type="text"
                  value={quickPrizeDesc}
                  onChange={e => setQuickPrizeDesc(e.target.value)}
                  style={{
                    height: 36, borderRadius: 8, border: '1.5px solid var(--color-border)',
                    padding: '0 10px', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none'
                  }}
                />
              </div>

              {/* Image URL */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  URL de la Imagen
                </label>
                <input
                  type="url"
                  placeholder="https://ejemplo.com/imagen.png"
                  value={quickPrizeImg}
                  onChange={e => setQuickPrizeImg(e.target.value)}
                  style={{
                    height: 36, borderRadius: 8, border: '1.5px solid var(--color-border)',
                    padding: '0 10px', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none'
                  }}
                />
              </div>

              {/* Relevance & Age restriction row */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {/* Relevance */}
                <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Relevancia
                  </label>
                  <select
                    value={quickPrizeRelevance}
                    onChange={e => setQuickPrizeRelevance(Number(e.target.value))}
                    style={{
                      height: 36, borderRadius: 8, border: '1.5px solid var(--color-border)',
                      padding: '0 8px', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
                      background: '#fff', cursor: 'pointer'
                    }}
                  >
                    <option value={1}>Básica (1)</option>
                    <option value={2}>Intermedia (2)</option>
                    <option value={3}>Alta (3)</option>
                    <option value={4}>Premium (4)</option>
                    <option value={5}>Gran Premio (5)</option>
                  </select>
                </div>

                {/* Requires Adult Check */}
                <div style={{ flex: '1 1 140px', display: 'flex', alignItems: 'center', paddingTop: 18 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--color-navy)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={quickPrizeRequiresAdult}
                      onChange={e => setQuickPrizeRequiresAdult(e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                    Solo +18 (Mayor de edad)
                  </label>
                </div>
              </div>

              {/* Error */}
              {quickPrizeError && (
                <div style={{
                  padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(230,51,41,0.07)', border: '1px solid rgba(230,51,41,0.15)',
                  color: 'var(--color-error)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6
                }}>
                  <i className="ri-error-warning-line" />
                  {quickPrizeError}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowQuickPrizeModal(false)}
                  disabled={quickPrizeLoading}
                  style={{
                    height: 36, padding: '0 14px', borderRadius: 8,
                    border: '1px solid var(--color-border)', background: 'none',
                    color: 'var(--color-gray-dark)', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  {t('seasonManagement.btnCancel')}
                </button>
                <button
                  type="submit"
                  disabled={quickPrizeLoading}
                  style={{
                    height: 36, padding: '0 16px', borderRadius: 8,
                    border: 'none', background: 'var(--color-navy)',
                    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  {quickPrizeLoading && <i className="ri-loader-4-line" style={{ animation: 'spin-circle 0.8s linear infinite' }} />}
                  {quickPrizeLoading ? t('seasonManagement.btnSaving') : t('seasonManagement.btnSave')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
