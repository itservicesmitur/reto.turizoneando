import { useEffect, useState, useMemo, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  fetchPrizeCodes,
  updatePrizeCodeStatus,
  generateTestPrizeCode,
  fetchPrizesList,
  fetchSeasons,
  sendAdminPrizeCodeEmail,
  type PrizeCodeData,
  type PrizeData,
  type SeasonData
} from '../../services/adminService'

export default function CodesPage() {
  const { t } = useTranslation()

  // Data States
  const [codes, setCodes] = useState<PrizeCodeData[]>([])
  const [prizes, setPrizes] = useState<PrizeData[]>([])
  const [seasons, setSeasons] = useState<SeasonData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // DataTable States
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'code-asc' | 'code-desc'>('date-desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modal States
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showRedeemConfirm, setShowRedeemConfirm] = useState<string | null>(null)
  
  // Toast Notification States
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  function showToast(text: string, type: 'success' | 'error' | 'info' = 'success') {
    setToast({ type, text })
  }

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => {
      setToast(null)
    }, 4000)
    return () => clearTimeout(timer)
  }, [toast])

  // Test Generation Form States
  const [formEmail, setFormEmail] = useState('')
  const [formPrizeId, setFormPrizeId] = useState('')
  const [formSeasonId, setFormSeasonId] = useState('')
  const [formStageId, setFormStageId] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [generatedSuccessCode, setGeneratedSuccessCode] = useState<string | null>(null)
  const [sendingEmailCode, setSendingEmailCode] = useState<string | null>(null)


  // Load initial datasets
  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const [codesData, prizesData, seasonsData] = await Promise.all([
        fetchPrizeCodes(),
        fetchPrizesList(),
        fetchSeasons()
      ])
      setCodes(codesData)
      setPrizes(prizesData)
      setSeasons(seasonsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('adminCodes.errGeneric'))
    } finally {
      setLoading(false)
    }
  }

  // Filter stage choices based on selected season
  const availableStages = useMemo(() => {
    const selected = seasons.find(s => s.id === formSeasonId)
    return selected ? selected.stages : []
  }, [seasons, formSeasonId])

  // Filtered and Sorted list
  const processedCodes = useMemo(() => {
    let result = [...codes]

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        c =>
          c.code.toLowerCase().includes(q) ||
          c.playerEmail.toLowerCase().includes(q) ||
          c.playerDisplayName.toLowerCase().includes(q) ||
          c.prizeName.toLowerCase().includes(q)
      )
    }

    // Status filter
    if (statusFilter) {
      result = result.filter(c => c.status === statusFilter)
    }

    // Category filter
    if (categoryFilter) {
      result = result.filter(c => c.prizeCategory === categoryFilter)
    }

    // Sort by criteria
    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      }
      if (sortBy === 'date-asc') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      }
      if (sortBy === 'code-asc') {
        return a.code.localeCompare(b.code)
      }
      if (sortBy === 'code-desc') {
        return b.code.localeCompare(a.code)
      }
      return 0
    })

    return result
  }, [codes, search, statusFilter, categoryFilter, sortBy])

  // Pagination calculations
  const totalPages = Math.ceil(processedCodes.length / pageSize)
  const paginatedCodes = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return processedCodes.slice(start, start + pageSize)
  }, [processedCodes, currentPage, pageSize])

  // Clear filters
  function handleClearFilters() {
    setSearch('')
    setStatusFilter('')
    setCategoryFilter('')
    setSortBy('date-desc')
    setCurrentPage(1)
  }

  // Toggle status
  async function handleToggleStatus(code: string, currentStatus: 'active' | 'inactive' | 'claimed') {
    if (currentStatus === 'claimed') return
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      await updatePrizeCodeStatus(code, newStatus)
      // Update local state directly
      setCodes(prev => prev.map(c => c.code === code ? { ...c, status: newStatus } : c))
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('adminCodes.errGeneric'), 'error')
    }
  }

  // Redeem code directly
  async function handleRedeemDirect(code: string) {
    try {
      await updatePrizeCodeStatus(code, 'claimed')
      // Update local state directly
      setCodes(prev => prev.map(c => c.code === code ? { ...c, status: 'claimed', claimedAt: new Date().toISOString(), claimedBy: 'admin' } : c))
      setShowRedeemConfirm(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('adminCodes.errGeneric'), 'error')
    }
  }

  // Submit test code generation
  async function handleGenerateSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setGeneratedSuccessCode(null)

    if (!formEmail.trim() || !formPrizeId || !formSeasonId || !formStageId) {
      setFormError(t('adminCodes.errRequired'))
      return
    }

    try {
      setFormLoading(true)
      const result = await generateTestPrizeCode({
        email: formEmail.trim(),
        prizeId: formPrizeId,
        seasonId: formSeasonId,
        stageId: formStageId
      })
      setGeneratedSuccessCode(result.code)
      setFormEmail('')
      // Reload the codes list
      const updatedCodes = await fetchPrizeCodes()
      setCodes(updatedCodes)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('adminCodes.errGeneric'))
    } finally {
      setFormLoading(false)
    }
  }

  // Format date helper
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

  // Copy validation link helper
  function handleCopyLink(code: string) {
    const valLink = `${window.location.origin}/validar/${code}`
    navigator.clipboard.writeText(valLink)
    showToast('Enlace copiado al portapapeles con éxito', 'success')
  }

  // Copy public validation link for establishments
  function handleCopyPublicLink() {
    const valLink = `${window.location.origin}/validar`
    navigator.clipboard.writeText(valLink)
    showToast(t('adminCodes.successCopyPublicLink', { link: valLink }), 'success')
  }

  async function handleSendEmail(code: string) {
    if (sendingEmailCode) return
    try {
      setSendingEmailCode(code)
      await sendAdminPrizeCodeEmail(code)
      showToast(t('adminCodes.successEmailSent'), 'success')
    } catch (err) {
      console.error(err)
      showToast(t('adminCodes.errEmailFailed') || 'Error al enviar el correo.', 'error')
    } finally {
      setSendingEmailCode(null)
    }
  }


  return (
    <div style={{ animation: 'fade-in 0.3s ease-out' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 28, margin: '0 0 4px' }}>
            {t('adminCodes.title')}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
            {t('adminCodes.subtitle')}
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
              {t('adminCodes.totalCodes')}
            </span>
            <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--color-navy)' }}>
              {processedCodes.length}
            </div>
          </div>
          <button
            onClick={handleCopyPublicLink}
            style={{
              height: 48,
              padding: '0 20px',
              borderRadius: 12,
              background: 'rgba(27,43,110,0.06)',
              color: 'var(--color-navy)',
              fontSize: 14,
              fontWeight: 700,
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'transform 150ms ease, background 150ms ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.background = 'rgba(27,43,110,0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.background = 'rgba(27,43,110,0.06)'
            }}
          >
            <i className="ri-file-copy-line" style={{ fontSize: 16 }} />
            {t('adminCodes.btnCopyPublicLink')}
          </button>
          <button
            onClick={() => {
              setFormError(null)
              setGeneratedSuccessCode(null)
              setShowGenerateModal(true)
            }}
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
            <i className="ri-add-circle-line" style={{ fontSize: 16 }} />
            {t('adminCodes.btnGenerateTest')}
          </button>
        </div>
      </div>

      {/* Control Panel (DataTable filters) */}
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
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder={t('adminCodes.searchPlaceholder')}
            style={{
              width: '100%', height: 40, paddingLeft: 40, paddingRight: 16,
              borderRadius: 10, border: '1.5px solid var(--color-border)',
              fontSize: 14, outline: 'none', background: 'var(--color-gray-light)',
              fontFamily: 'var(--font-body)'
            }}
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          style={{
            height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--color-border)',
            fontSize: 14, color: 'var(--color-text-muted)', outline: 'none', background: '#fff',
            fontFamily: 'var(--font-body)', cursor: 'pointer'
          }}
        >
          <option value="">{t('adminCodes.filterStatus')}</option>
          <option value="active">{t('adminCodes.statusActive')}</option>
          <option value="inactive">{t('adminCodes.statusInactive')}</option>
          <option value="claimed">{t('adminCodes.statusClaimed')}</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
          style={{
            height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--color-border)',
            fontSize: 14, color: 'var(--color-text-muted)', outline: 'none', background: '#fff',
            fontFamily: 'var(--font-body)', cursor: 'pointer'
          }}
        >
          <option value="">{t('adminCodes.filterCategory')}</option>
          <option value="Bares">Bares</option>
          <option value="Hoteles">Hoteles</option>
          <option value="Restaurantes">Restaurantes</option>
          <option value="Museos">Museos</option>
          <option value="Actividades">Actividades</option>
          <option value="Experiencias">Experiencias</option>
        </select>

        {/* Sort selector */}
        <select
          value={sortBy}
          onChange={e => { setSortBy(e.target.value as any); setCurrentPage(1); }}
          style={{
            height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--color-border)',
            fontSize: 14, color: 'var(--color-text-muted)', outline: 'none', background: '#fff',
            fontFamily: 'var(--font-body)', cursor: 'pointer'
          }}
        >
          <option value="date-desc">Fecha: Reciente → Antiguo</option>
          <option value="date-asc">Fecha: Antiguo → Reciente</option>
          <option value="code-asc">Código: A → Z</option>
          <option value="code-desc">Código: Z → A</option>
        </select>

        {/* Clear Filters */}
        {(search || statusFilter || categoryFilter) && (
          <button
            onClick={handleClearFilters}
            style={{
              background: 'none', border: 'none', color: 'var(--color-navy)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '8px 12px'
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Main Table area */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <i className="ri-loader-4-line ri-spin" style={{ fontSize: 36, color: 'var(--color-navy)' }} />
            <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Cargando códigos de canje...</span>
          </div>
        ) : error ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-red)' }}>
            <i className="ri-error-warning-line" style={{ fontSize: 36, marginBottom: 8 }} />
            <p>{error}</p>
          </div>
        ) : paginatedCodes.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <i className="ri-ticket-2-line" style={{ fontSize: 48, color: 'var(--color-gray-mid)', marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>No se encontraron códigos</p>
            <p style={{ margin: '4px 0 0', fontSize: 13 }}>Intenta modificando los filtros de búsqueda.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--color-gray-light)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      {t('adminCodes.colCode')}
                    </th>
                    <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      {t('adminCodes.colPrize')}
                    </th>
                    <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      {t('adminCodes.colPlayer')}
                    </th>
                    <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      {t('adminCodes.colSeason')}
                    </th>
                    <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      {t('adminCodes.colStatus')}
                    </th>
                    <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      {t('adminCodes.colDate')}
                    </th>
                    <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>
                      {t('adminCodes.colActions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCodes.map(codeDoc => {
                    // Status styling
                    let statusBg = 'rgba(160,168,184,0.15)'
                    let statusColor = 'var(--color-gray-dark)'
                    if (codeDoc.status === 'active') {
                      statusBg = 'rgba(60,173,66,0.1)'
                      statusColor = 'var(--color-green)'
                    } else if (codeDoc.status === 'claimed') {
                      statusBg = 'rgba(27,43,110,0.1)'
                      statusColor = 'var(--color-navy)'
                    } else if (codeDoc.status === 'inactive') {
                      statusBg = 'rgba(230,51,41,0.1)'
                      statusColor = 'var(--color-red)'
                    }

                    return (
                      <tr key={codeDoc.code} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 150ms ease' }}>
                        {/* Code */}
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-navy)', fontSize: 15 }}>
                            {codeDoc.code}
                          </span>
                        </td>
                        
                        {/* Prize */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {codeDoc.prizeImageUrl && (
                              <img
                                src={codeDoc.prizeImageUrl}
                                alt={codeDoc.prizeName}
                                style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--color-border)' }}
                              />
                            )}
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{codeDoc.prizeName}</div>
                              <span style={{ fontSize: 11, background: 'rgba(27,43,110,0.06)', color: 'var(--color-navy)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                                {codeDoc.prizeCategory}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Player */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                            {codeDoc.playerDisplayName}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                            {codeDoc.playerEmail}
                          </div>
                        </td>

                        {/* Season */}
                        <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                          {codeDoc.seasonName}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{
                            display: 'inline-block', padding: '4px 8px', borderRadius: 6,
                            fontSize: 12, fontWeight: 700, background: statusBg, color: statusColor
                          }}>
                            {t(`adminCodes.status${codeDoc.status.charAt(0).toUpperCase() + codeDoc.status.slice(1)}`)}
                          </span>
                        </td>

                        {/* Date */}
                        <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                          {formatDate(codeDoc.createdAt)}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                             {/* Send Email */}
                            <button
                              onClick={() => handleSendEmail(codeDoc.code)}
                              disabled={sendingEmailCode === codeDoc.code}
                              title={t('adminCodes.actionSendEmail') || 'Enviar por Correo'}
                              style={{
                                width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-border)',
                                background: '#fff', color: 'var(--color-navy)', cursor: sendingEmailCode === codeDoc.code ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms',
                                opacity: sendingEmailCode === codeDoc.code ? 0.7 : 1
                              }}
                            >
                              {sendingEmailCode === codeDoc.code ? (
                                <i className="ri-loader-4-line ri-spin" />
                              ) : (
                                <i className="ri-mail-send-line" />
                              )}
                            </button>

                            {/* Copy Link */}
                            <button
                              onClick={() => handleCopyLink(codeDoc.code)}
                              title="Copiar enlace de validación"
                              style={{
                                width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-border)',
                                background: '#fff', color: 'var(--color-navy)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms'
                              }}
                            >
                              <i className="ri-file-copy-line" />
                            </button>


                            {/* Toggle active / inactive */}
                            {codeDoc.status !== 'claimed' && (
                              <button
                                onClick={() => handleToggleStatus(codeDoc.code, codeDoc.status)}
                                title={codeDoc.status === 'active' ? t('adminCodes.actionDeactivate') : t('adminCodes.actionActivate')}
                                style={{
                                  width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-border)',
                                  background: codeDoc.status === 'active' ? 'rgba(230,51,41,0.06)' : 'rgba(60,173,66,0.06)',
                                  color: codeDoc.status === 'active' ? 'var(--color-red)' : 'var(--color-green)',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms'
                                }}
                              >
                                <i className={codeDoc.status === 'active' ? 'ri-close-circle-line' : 'ri-checkbox-circle-line'} />
                              </button>
                            )}

                            {/* Redeem direct */}
                            {codeDoc.status === 'active' && (
                              <button
                                onClick={() => setShowRedeemConfirm(codeDoc.code)}
                                style={{
                                  height: 32, padding: '0 10px', borderRadius: 8, border: 'none',
                                  background: 'var(--color-navy)', color: '#fff', fontSize: 12, fontWeight: 700,
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                                }}
                              >
                                <i className="ri-check-line" />
                                {t('adminCodes.actionRedeem')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination / Table footer (DataTable Standard) */}
            <div style={{
              padding: '16px 20px', borderTop: '1px solid var(--color-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Page Size Selector */}
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  style={{
                    height: 32, padding: '0 8px', borderRadius: 6, border: '1px solid var(--color-border)',
                    fontSize: 13, color: 'var(--color-text-muted)', outline: 'none', background: '#fff', cursor: 'pointer'
                  }}
                >
                  <option value={5}>5 por página</option>
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                </select>
                
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  Mostrando {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, processedCodes.length)} de {processedCodes.length} items
                </span>
              </div>

              {/* Navigation buttons */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    style={{
                      height: 32, padding: '0 12px', borderRadius: 6, border: '1px solid var(--color-border)',
                      background: currentPage === 1 ? 'var(--color-gray-light)' : '#fff',
                      color: currentPage === 1 ? 'var(--color-gray-mid)' : 'var(--color-text)',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600
                    }}
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      style={{
                        width: 32, height: 32, borderRadius: 6, border: 'none',
                        background: currentPage === idx + 1 ? 'var(--color-navy)' : 'transparent',
                        color: currentPage === idx + 1 ? '#fff' : 'var(--color-text)',
                        cursor: 'pointer', fontSize: 13, fontWeight: 700
                      }}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    style={{
                      height: 32, padding: '0 12px', borderRadius: 6, border: '1px solid var(--color-border)',
                      background: currentPage === totalPages ? 'var(--color-gray-light)' : '#fff',
                      color: currentPage === totalPages ? 'var(--color-gray-mid)' : 'var(--color-text)',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600
                    }}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── GENERATE TEST CODE MODAL ─────────────────── */}
      {showGenerateModal && (
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
                {t('adminCodes.generateModalTitle')}
              </h3>
              <button onClick={() => { setShowGenerateModal(false); setGeneratedSuccessCode(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-mid)', padding: 4 }}>
                <i className="ri-close-line" style={{ fontSize: 20 }} />
              </button>
            </div>
            
            <form onSubmit={handleGenerateSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {formError && (
                <div style={{ padding: '10px 14px', background: 'rgba(230,51,41,0.06)', border: '1px solid rgba(230,51,41,0.2)', color: 'var(--color-red)', borderRadius: 8, fontSize: 13 }}>
                  {formError}
                </div>
              )}

              {generatedSuccessCode && (
                <div style={{ padding: '12px 14px', background: 'rgba(60,173,66,0.06)', border: '1px solid rgba(60,173,66,0.2)', color: 'var(--color-green)', borderRadius: 8, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div><strong>{t('adminCodes.successGenerate', { code: generatedSuccessCode })}</strong></div>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(generatedSuccessCode)}
                    style={{
                      alignSelf: 'flex-start', background: 'var(--color-green)', color: '#fff', border: 'none',
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    Copiar enlace de canje
                  </button>
                </div>
              )}

              {/* Player Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  {t('adminCodes.formPlayerEmail')}
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  style={{
                    height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                    padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none'
                  }}
                />
              </div>

              {/* Prize Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  {t('adminCodes.formPrize')}
                </label>
                <select
                  required
                  value={formPrizeId}
                  onChange={e => setFormPrizeId(e.target.value)}
                  style={{
                    height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                    padding: '0 8px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
                    background: '#fff', cursor: 'pointer'
                  }}
                >
                  <option value="">-- Seleccionar Premio --</option>
                  {prizes.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.categoria})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Season Selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    {t('adminCodes.formSeason')}
                  </label>
                  <select
                    required
                    value={formSeasonId}
                    onChange={e => { setFormSeasonId(e.target.value); setFormStageId(''); }}
                    style={{
                      height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                      padding: '0 8px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
                      background: '#fff', cursor: 'pointer'
                    }}
                  >
                    <option value="">-- Seleccionar --</option>
                    {seasons.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stage Selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    {t('adminCodes.formStage')}
                  </label>
                  <select
                    required
                    disabled={!formSeasonId}
                    value={formStageId}
                    onChange={e => setFormStageId(e.target.value)}
                    style={{
                      height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                      padding: '0 8px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
                      background: '#fff', cursor: 'pointer'
                    }}
                  >
                    <option value="">-- Seleccionar --</option>
                    {availableStages.map(st => (
                      <option key={st.id} value={st.id}>
                        Etapa #{st.number} ({st.pointsCount} pts)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => { setShowGenerateModal(false); setGeneratedSuccessCode(null); }}
                  style={{
                    height: 40, padding: '0 16px', borderRadius: 8,
                    background: 'none', border: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    height: 40, padding: '0 16px', borderRadius: 8,
                    background: 'var(--color-navy)', color: '#fff', border: 'none',
                    fontWeight: 600, fontSize: 13, cursor: formLoading ? 'not-allowed' : 'pointer',
                    opacity: formLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  {formLoading && <i className="ri-loader-4-line ri-spin" />}
                  {formLoading ? t('adminCodes.btnGenerating') : t('adminCodes.btnGenerate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DIRECT REDEEM CONFIRMATION MODAL ─────────── */}
      {showRedeemConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(13,21,38,0.5)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100, padding: 16
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 16,
            width: '100%', maxWidth: 460, boxShadow: 'var(--shadow-pop)',
            overflow: 'hidden', animation: 'slide-up 0.2s ease-out'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: 0 }}>
                {t('adminCodes.confirmRedeemTitle')}
              </h3>
              <button onClick={() => setShowRedeemConfirm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-mid)', padding: 4 }}>
                <i className="ri-close-line" style={{ fontSize: 20 }} />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ margin: '0 0 24px', color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.5 }}>
                {t('adminCodes.confirmRedeem')} (Código: <strong>{showRedeemConfirm}</strong>)
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  onClick={() => setShowRedeemConfirm(null)}
                  style={{
                    height: 40, padding: '0 16px', borderRadius: 8,
                    background: 'none', border: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  {t('adminCodes.btnCancel')}
                </button>
                <button
                  onClick={() => handleRedeemDirect(showRedeemConfirm)}
                  style={{
                    height: 40, padding: '0 16px', borderRadius: 8,
                    background: 'var(--color-navy)', color: '#fff', border: 'none',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  {t('adminCodes.btnConfirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Custom Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: toast.type === 'success' 
            ? '1px solid rgba(60,173,66,0.3)' 
            : toast.type === 'error' 
            ? '1px solid rgba(230,51,41,0.3)' 
            : '1px solid rgba(27,43,110,0.2)',
          borderRadius: 14,
          padding: '12px 18px',
          boxShadow: '0 10px 25px rgba(27, 43, 110, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          zIndex: 2000,
          animation: 'slide-in-toast 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          maxWidth: '90vw',
          width: 380
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: toast.type === 'success' 
              ? 'rgba(60,173,66,0.1)' 
              : toast.type === 'error' 
              ? 'rgba(230,51,41,0.1)' 
              : 'rgba(27,43,110,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {toast.type === 'success' ? (
              <i className="ri-checkbox-circle-fill" style={{ color: 'var(--color-green)', fontSize: 16 }} />
            ) : toast.type === 'error' ? (
              <i className="ri-error-warning-fill" style={{ color: 'var(--color-red)', fontSize: 16 }} />
            ) : (
              <i className="ri-information-fill" style={{ color: 'var(--color-navy)', fontSize: 16 }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: 'var(--color-navy)',
              lineHeight: 1.4
            }}>
              {toast.text}
            </div>
          </div>
          <button 
            onClick={() => setToast(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-gray-mid)',
              fontSize: 16,
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background 150ms ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <i className="ri-close-line" />
          </button>
        </div>
      )}

      <style>{`
        @keyframes slide-in-toast {
          from { transform: translateY(-20px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
