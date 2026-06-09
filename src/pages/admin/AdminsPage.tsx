import { useEffect, useState, useMemo, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { auth } from '../../config/firebase'
import {
  fetchAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  type AdminUserData
} from '../../services/adminService'

export default function AdminsPage() {
  const { t } = useTranslation()
  const currentAdminUid = auth.currentUser?.uid

  const [admins, setAdmins] = useState<AdminUserData[]>([])
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
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUserData | null>(null)

  // Form states
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Load admins on mount
  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAdmins()
      setAdmins(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los administradores')
    } finally {
      setLoading(false)
    }
  }

  // Filtered & sorted admins
  const processedAdmins = useMemo(() => {
    let result = [...admins]

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        a =>
          a.displayName.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.uid.toLowerCase().includes(q)
      )
    }

    // Status filter
    if (statusFilter) {
      result = result.filter(a => a.status === statusFilter)
    }

    // Sorting logic
    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      }
      if (sortBy === 'date-asc') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      }
      if (sortBy === 'name-asc') {
        return a.displayName.localeCompare(b.displayName)
      }
      if (sortBy === 'name-desc') {
        return b.displayName.localeCompare(a.displayName)
      }
      return 0
    })

    return result
  }, [admins, search, statusFilter, sortBy])

  // Pagination bounds
  const totalPages = Math.ceil(processedAdmins.length / pageSize)
  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return processedAdmins.slice(start, start + pageSize)
  }, [processedAdmins, currentPage, pageSize])

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
    setFormEmail('')
    setFormPassword('')
    setFormError(null)
    setFormLoading(false)
    setShowCreateModal(true)
  }

  // Submit Create Form
  async function handleCreateSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    // Form validations
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      setFormError(t('adminManagement.errRequired'))
      return
    }
    if (!formEmail.includes('@')) {
      setFormError(t('adminManagement.errEmailInvalid'))
      return
    }
    if (formPassword.length < 8) {
      setFormError(t('adminManagement.errPasswordShort'))
      return
    }

    try {
      setFormLoading(true)
      await createAdmin(formEmail, formPassword, formName)
      setShowCreateModal(false)
      load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear administrador'
      setFormError(message)
    } finally {
      setFormLoading(false)
    }
  }

  // Handle open Edit Modal
  function handleOpenEdit(admin: AdminUserData) {
    setSelectedAdmin(admin)
    setFormName(admin.displayName)
    setFormStatus(admin.status)
    setFormError(null)
    setFormLoading(false)
    setShowEditModal(true)
  }

  // Submit Edit Form
  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selectedAdmin) return
    setFormError(null)

    if (!formName.trim()) {
      setFormError(t('adminManagement.errRequired'))
      return
    }

    try {
      setFormLoading(true)
      await updateAdmin(selectedAdmin.uid, formName, formStatus)
      setShowEditModal(false)
      load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar administrador'
      setFormError(message)
    } finally {
      setFormLoading(false)
    }
  }

  // Handle Delete Admin
  async function handleDelete(admin: AdminUserData) {
    if (admin.uid === currentAdminUid) {
      alert(t('adminManagement.selfDeleteBlock'))
      return
    }
    if (!window.confirm(t('adminManagement.confirmDelete'))) {
      return
    }

    try {
      setFormLoading(true)
      await deleteAdmin(admin.uid)
      load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar administrador'
      alert(message)
    } finally {
      setFormLoading(false)
    }
  }

  // Format creation timestamp
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

  return (
    <div style={{ animation: 'fade-in 0.3s ease-out' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 28, margin: '0 0 4px' }}>
            {t('adminManagement.title')}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
            {t('adminManagement.subtitle')}
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
              {t('adminManagement.totalAdmins')}
            </span>
            <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--color-navy)' }}>
              {admins.length}
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
            <i className="ri-user-add-line" style={{ fontSize: 16 }} />
            {t('adminManagement.btnCreate')}
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
            placeholder={t('adminManagement.searchPlaceholder')}
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
            <option value="">{t('adminManagement.statusAll')}</option>
            <option value="active">{t('adminManagement.statusActive')}</option>
            <option value="inactive">{t('adminManagement.statusInactive')}</option>
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
              <div style={{ color: 'var(--color-navy)', fontWeight: 700, fontSize: 15 }}>Cargando administradores...</div>
            </div>
          </div>
        ) : error ? (
          /* Error State */
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-error)' }}>
            <i className="ri-error-warning-line" style={{ fontSize: 44, display: 'block', marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: 18 }}>Error al cargar</h3>
            <p style={{ margin: 0, fontSize: 14 }}>{error}</p>
          </div>
        ) : processedAdmins.length === 0 ? (
          /* Empty State */
          <div style={{ padding: 60, textAlign: 'center' }}>
            <i className="ri-shield-line" style={{ fontSize: 48, color: 'var(--color-gray-mid)', display: 'block', marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 6px', color: 'var(--color-navy)', fontFamily: 'var(--font-display)', fontSize: 18 }}>
              No se encontraron administradores
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
                    {t('adminManagement.colName')}
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('adminManagement.colStatus')}
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('adminManagement.colCreated')}
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>
                    {t('adminManagement.colActions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedAdmins.map((admin, idx) => {
                  const initials = admin.displayName ? admin.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'A'
                  const isSelf = admin.uid === currentAdminUid

                  return (
                    <tr
                      key={admin.uid}
                      style={{
                        borderBottom: idx === paginatedAdmins.length - 1 ? 'none' : '1px solid var(--color-border)',
                        transition: 'background 150ms ease'
                      }}
                      className="table-row-hover"
                    >
                      {/* Name and email */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: '50%',
                            background: isSelf ? 'var(--color-yellow)' : 'var(--color-navy)',
                            color: isSelf ? 'var(--color-navy)' : 'var(--color-yellow)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: 14, display: 'flex', alignItems: 'center' }}>
                              {admin.displayName || 'Administrador'}
                              {isSelf && (
                                <span style={{
                                  marginLeft: 8,
                                  background: 'rgba(27,43,110,0.1)',
                                  color: 'var(--color-navy)',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  fontSize: 10,
                                  fontWeight: 700
                                }}>
                                  TÚ
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 1 }}>
                              {admin.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 20px' }}>
                        {admin.status === 'active' ? (
                          <span style={{
                            background: 'rgba(60,173,66,0.1)', color: 'var(--color-green)',
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800
                          }}>
                            {t('adminManagement.statusActive')}
                          </span>
                        ) : (
                          <span style={{
                            background: 'rgba(230,51,41,0.1)', color: 'var(--color-error)',
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800
                          }}>
                            {t('adminManagement.statusInactive')}
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                        {formatDate(admin.createdAt)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenEdit(admin)}
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
                            {t('adminManagement.actionEdit')}
                          </button>
                          <button
                            onClick={() => handleDelete(admin)}
                            disabled={isSelf}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              background: isSelf ? '#f0f2f5' : 'rgba(230,51,41,0.06)',
                              border: isSelf ? '1px solid #d2d6df' : '1px solid rgba(230,51,41,0.15)',
                              color: isSelf ? 'var(--color-gray-mid)' : 'var(--color-red)',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: isSelf ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <i className="ri-delete-bin-line" />
                            {t('adminManagement.actionDelete')}
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
        {!loading && !error && processedAdmins.length > 0 && (
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
                Mostrando {Math.min((currentPage - 1) * pageSize + 1, processedAdmins.length)} - {Math.min(currentPage * pageSize, processedAdmins.length)} de {processedAdmins.length} registros
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

      {/* ── CREATE ADMINISTRATOR MODAL ─────────────────── */}
      {showCreateModal && (
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
                {t('adminManagement.modalCreateTitle')}
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-mid)', padding: 4 }}>
                <i className="ri-close-line" style={{ fontSize: 20 }} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  {t('adminManagement.formName')}
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

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  {t('adminManagement.formEmail')}
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  style={{
                    height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                    padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none'
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  {t('adminManagement.formPassword')}
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  style={{
                    height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                    padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none'
                  }}
                />
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
                  {t('adminManagement.btnCancel')}
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
                  {formLoading ? t('adminManagement.btnSaving') : t('adminManagement.btnSave')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT ADMINISTRATOR MODAL ───────────────────── */}
      {showEditModal && selectedAdmin && (
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
                {t('adminManagement.modalEditTitle')}
              </h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-mid)', padding: 4 }}>
                <i className="ri-close-line" style={{ fontSize: 20 }} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Email (Readonly reference) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-gray-mid)' }}>
                  {t('adminManagement.formEmail')}
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedAdmin.email}
                  style={{
                    height: 40, borderRadius: 8, border: '1px solid var(--color-border)',
                    padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', background: '#f8f9fb', outline: 'none', color: 'var(--color-gray-mid)'
                  }}
                />
              </div>

              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  {t('adminManagement.formName')}
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
                  {t('adminManagement.formStatus')}
                </label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as 'active' | 'inactive')}
                  disabled={selectedAdmin.uid === currentAdminUid}
                  style={{
                    height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                    padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
                    cursor: selectedAdmin.uid === currentAdminUid ? 'not-allowed' : 'pointer',
                    background: selectedAdmin.uid === currentAdminUid ? '#f8f9fb' : '#fff'
                  }}
                >
                  <option value="active">{t('adminManagement.statusActive')}</option>
                  <option value="inactive">{t('adminManagement.statusInactive')}</option>
                </select>
                {selectedAdmin.uid === currentAdminUid && (
                  <span style={{ fontSize: 11, color: 'var(--color-warning)', marginTop: 2 }}>
                    {t('adminManagement.selfDeactivateBlock')}
                  </span>
                )}
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
                  {t('adminManagement.btnCancel')}
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
                  {formLoading ? t('adminManagement.btnSaving') : t('adminManagement.btnSave')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
