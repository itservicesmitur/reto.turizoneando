import { useEffect, useState, useMemo, type FormEvent } from 'react'
import {
  fetchProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  changeProviderPassword,
  fetchLocals,
  type ProviderData,
  type LocalData,
} from '../../services/adminService'

const inputStyle: React.CSSProperties = {
  height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
  padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', background: '#fff'
}

function field(label: string, children: React.ReactNode) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>{label}</label>
      {children}
    </div>
  )
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,21,38,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 16, width: '100%', maxWidth: 500, boxShadow: 'var(--shadow-pop)', overflow: 'hidden', animation: 'slide-up 0.2s ease-out' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-mid)', padding: 4 }}>
            <i className="ri-close-line" style={{ fontSize: 20 }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<ProviderData[]>([])
  const [locals, setLocals] = useState<LocalData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // DataTable
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState<'name-asc' | 'date-desc'>('date-desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modals
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState<ProviderData | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<ProviderData | null>(null)
  const [showChangePassword, setShowChangePassword] = useState<ProviderData | null>(null)

  // Change password form
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changePasswordLoading, setChangePasswordLoading] = useState(false)
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null)

  // Form
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formDisplayName, setFormDisplayName] = useState('')
  const [formLocalId, setFormLocalId] = useState('')
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  function showToast(text: string, type: 'success' | 'error' = 'success') { setToast({ type, text }) }
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true); setError(null)
      const [p, l] = await Promise.all([fetchProviders(), fetchLocals()])
      setProviders(p)
      setLocals(l.filter(l => l.active))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar providers.')
    } finally {
      setLoading(false)
    }
  }

  const processed = useMemo(() => {
    let r = [...providers]
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(p => p.displayName.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.localName.toLowerCase().includes(q))
    }
    if (statusFilter) r = r.filter(p => p.status === statusFilter)
    r.sort((a, b) => sortBy === 'name-asc' ? a.displayName.localeCompare(b.displayName) : new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    return r
  }, [providers, search, statusFilter, sortBy])

  const totalPages = Math.ceil(processed.length / pageSize)
  const paginated = useMemo(() => processed.slice((currentPage - 1) * pageSize, currentPage * pageSize), [processed, currentPage, pageSize])

  function resetForm() {
    setFormEmail(''); setFormPassword(''); setFormDisplayName('')
    setFormLocalId(''); setFormStatus('active'); setFormError(null)
  }

  function openCreate() { resetForm(); setShowCreate(true) }

  function openEdit(p: ProviderData) {
    setFormDisplayName(p.displayName)
    setFormLocalId(p.localId)
    setFormStatus(p.status)
    setFormError(null)
    setShowEdit(p)
  }

  const selectedLocal = locals.find(l => l.id === formLocalId)

  async function handleCreateSubmit(e: FormEvent) {
    e.preventDefault(); setFormError(null)
    if (!formDisplayName.trim()) { setFormError('El nombre es obligatorio.'); return }
    if (!formEmail.trim()) { setFormError('El email es obligatorio.'); return }
    if (formPassword.length < 8) { setFormError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (!formLocalId) { setFormError('Debes asignar un local al provider.'); return }
    try {
      setFormLoading(true)
      await createProvider({
        email: formEmail.trim(),
        password: formPassword,
        displayName: formDisplayName.trim(),
        localId: formLocalId,
        localName: selectedLocal?.name || '',
      })
      setShowCreate(false)
      showToast('Provider creado correctamente.')
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al crear provider.')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault()
    if (!showEdit) return
    setFormError(null)
    if (!formDisplayName.trim()) { setFormError('El nombre es obligatorio.'); return }
    if (!formLocalId) { setFormError('Debes asignar un local al provider.'); return }
    try {
      setFormLoading(true)
      await updateProvider({
        uid: showEdit.uid,
        displayName: formDisplayName.trim(),
        localId: formLocalId,
        localName: selectedLocal?.name || '',
        status: formStatus,
      })
      setShowEdit(null)
      showToast('Provider actualizado.')
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al actualizar provider.')
    } finally {
      setFormLoading(false)
    }
  }

  function openChangePassword(p: ProviderData) {
    setNewPassword('')
    setConfirmPassword('')
    setChangePasswordError(null)
    setShowChangePassword(p)
  }

  async function handleChangePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    if (!showChangePassword) return
    setChangePasswordError(null)
    if (newPassword.length < 8) { setChangePasswordError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (newPassword !== confirmPassword) { setChangePasswordError('Las contraseñas no coinciden.'); return }
    try {
      setChangePasswordLoading(true)
      await changeProviderPassword(showChangePassword.uid, newPassword)
      setShowChangePassword(null)
      showToast('Contraseña actualizada correctamente.')
    } catch (err) {
      setChangePasswordError(err instanceof Error ? err.message : 'Error al cambiar la contraseña.')
    } finally {
      setChangePasswordLoading(false)
    }
  }

  async function handleDelete(p: ProviderData) {
    try {
      await deleteProvider(p.uid)
      setShowDeleteConfirm(null)
      showToast('Provider eliminado.')
      await load()
    } catch (err) {
      setShowDeleteConfirm(null)
      showToast(err instanceof Error ? err.message : 'Error al eliminar provider.', 'error')
    }
  }

  return (
    <div style={{ animation: 'fade-in 0.3s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 28, margin: '0 0 4px' }}>Providers</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>Usuarios con acceso para validar códigos de sus locales.</p>
        </div>
        <button onClick={openCreate}
          style={{ height: 48, padding: '0 20px', borderRadius: 12, background: 'var(--color-navy)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(27,43,110,0.3)' }}>
          <i className="ri-add-circle-line" style={{ fontSize: 16 }} />
          Nuevo Provider
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-card)', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <i className="ri-search-line" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-mid)', fontSize: 16 }} />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} placeholder="Buscar por nombre, email o local..."
            style={{ width: '100%', height: 40, paddingLeft: 40, paddingRight: 16, borderRadius: 10, border: '1.5px solid var(--color-border)', fontSize: 14, outline: 'none', background: 'var(--color-gray-light)', fontFamily: 'var(--font-body)' }} />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1) }}
          style={{ height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--color-border)', fontSize: 14, outline: 'none', background: '#fff', cursor: 'pointer' }}>
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
        <select value={sortBy} onChange={e => { setSortBy(e.target.value as typeof sortBy); setCurrentPage(1) }}
          style={{ height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--color-border)', fontSize: 14, outline: 'none', background: '#fff', cursor: 'pointer' }}>
          <option value="date-desc">Más recientes</option>
          <option value="name-asc">Nombre A→Z</option>
        </select>
        {(search || statusFilter) && (
          <button onClick={() => { setSearch(''); setStatusFilter(''); setCurrentPage(1) }} style={{ background: 'none', border: 'none', color: 'var(--color-navy)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 16, boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <i className="ri-loader-4-line ri-spin" style={{ fontSize: 36, color: 'var(--color-navy)' }} />
            <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Cargando providers...</span>
          </div>
        ) : error ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-red)' }}><p>{error}</p></div>
        ) : paginated.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <i className="ri-user-star-line" style={{ fontSize: 48, color: 'var(--color-gray-mid)', marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>No hay providers</p>
            <p style={{ margin: '4px 0 0', fontSize: 13 }}>Crea el primer provider con el botón de arriba.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--color-gray-light)', borderBottom: '1px solid var(--color-border)' }}>
                    {['Provider', 'Local asignado', 'Estado', 'Creado', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', textAlign: h === 'Acciones' ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(p => (
                    <tr key={p.uid} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(27,43,110,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <i className="ri-user-star-line" style={{ color: 'var(--color-navy)', fontSize: 18 }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{p.displayName}</div>
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {p.localName ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className="ri-store-2-line" style={{ color: 'var(--color-navy)', fontSize: 14 }} />
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{p.localName}</span>
                          </div>
                        ) : <span style={{ fontSize: 13, color: 'var(--color-gray-mid)' }}>Sin asignar</span>}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: p.status === 'active' ? 'rgba(60,173,66,0.1)' : 'rgba(230,51,41,0.1)', color: p.status === 'active' ? 'var(--color-green)' : 'var(--color-red)' }}>
                          {p.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <button onClick={() => openEdit(p)} title="Editar"
                            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-border)', background: '#fff', color: 'var(--color-navy)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="ri-edit-line" />
                          </button>
                          <button onClick={() => openChangePassword(p)} title="Cambiar contraseña"
                            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-border)', background: '#fff', color: 'var(--color-teal)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="ri-lock-password-line" />
                          </button>
                          <button onClick={() => setShowDeleteConfirm(p)} title="Eliminar"
                            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-border)', background: 'rgba(230,51,41,0.06)', color: 'var(--color-red)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="ri-delete-bin-line" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
                  style={{ height: 32, padding: '0 8px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 13, outline: 'none', background: '#fff', cursor: 'pointer' }}>
                  {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n} por página</option>)}
                </select>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  Mostrando {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, processed.length)} de {processed.length}
                </span>
              </div>
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                    style={{ height: 32, padding: '0 12px', borderRadius: 6, border: '1px solid var(--color-border)', background: currentPage === 1 ? 'var(--color-gray-light)' : '#fff', color: currentPage === 1 ? 'var(--color-gray-mid)' : 'var(--color-text)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} onClick={() => setCurrentPage(i + 1)}
                      style={{ width: 32, height: 32, borderRadius: 6, border: 'none', background: currentPage === i + 1 ? 'var(--color-navy)' : 'transparent', color: currentPage === i + 1 ? '#fff' : 'var(--color-text)', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                      {i + 1}
                    </button>
                  ))}
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                    style={{ height: 32, padding: '0 12px', borderRadius: 6, border: '1px solid var(--color-border)', background: currentPage === totalPages ? 'var(--color-gray-light)' : '#fff', color: currentPage === totalPages ? 'var(--color-gray-mid)' : 'var(--color-text)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <ModalShell title="Nuevo Provider" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreateSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {formError && <div style={{ padding: '10px 14px', background: 'rgba(230,51,41,0.06)', border: '1px solid rgba(230,51,41,0.2)', color: 'var(--color-red)', borderRadius: 8, fontSize: 13 }}>{formError}</div>}
            {field('Nombre completo *', <input required style={inputStyle} value={formDisplayName} onChange={e => setFormDisplayName(e.target.value)} />)}
            {field('Email *', <input type="email" required style={inputStyle} value={formEmail} onChange={e => setFormEmail(e.target.value)} />)}
            {field('Contraseña * (mín. 8 caracteres)', <input type="password" required minLength={8} style={inputStyle} value={formPassword} onChange={e => setFormPassword(e.target.value)} />)}
            {field('Local asignado *', (
              <select required style={{ ...inputStyle, cursor: 'pointer' }} value={formLocalId} onChange={e => setFormLocalId(e.target.value)}>
                <option value="">-- Seleccionar local --</option>
                {locals.map(l => <option key={l.id} value={l.id}>{l.name}{l.category ? ` (${l.category})` : ''}</option>)}
              </select>
            ))}
            {locals.length === 0 && (
              <div style={{ padding: '8px 12px', background: 'rgba(245,200,0,0.08)', border: '1px solid rgba(245,200,0,0.3)', borderRadius: 8, fontSize: 12, color: '#9a7e00' }}>
                <i className="ri-alert-line" style={{ marginRight: 6 }} />
                No hay locales activos. Crea un local primero en el módulo Locales.
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <button type="button" onClick={() => setShowCreate(false)} style={{ height: 40, padding: '0 16px', borderRadius: 8, background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={formLoading} style={{ height: 40, padding: '0 20px', borderRadius: 8, background: 'var(--color-navy)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: formLoading ? 'not-allowed' : 'pointer', opacity: formLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                {formLoading && <i className="ri-loader-4-line ri-spin" />}
                {formLoading ? 'Creando...' : 'Crear Provider'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <ModalShell title="Editar Provider" onClose={() => setShowEdit(null)}>
          <form onSubmit={handleEditSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {formError && <div style={{ padding: '10px 14px', background: 'rgba(230,51,41,0.06)', border: '1px solid rgba(230,51,41,0.2)', color: 'var(--color-red)', borderRadius: 8, fontSize: 13 }}>{formError}</div>}
            <div style={{ padding: '8px 12px', background: 'var(--color-gray-light)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-muted)' }}>
              <strong>Email:</strong> {showEdit.email}
            </div>
            {field('Nombre completo *', <input required style={inputStyle} value={formDisplayName} onChange={e => setFormDisplayName(e.target.value)} />)}
            {field('Local asignado *', (
              <select required style={{ ...inputStyle, cursor: 'pointer' }} value={formLocalId} onChange={e => setFormLocalId(e.target.value)}>
                <option value="">-- Seleccionar local --</option>
                {locals.map(l => <option key={l.id} value={l.id}>{l.name}{l.category ? ` (${l.category})` : ''}</option>)}
              </select>
            ))}
            {field('Estado', (
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={formStatus} onChange={e => setFormStatus(e.target.value as 'active' | 'inactive')}>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <button type="button" onClick={() => setShowEdit(null)} style={{ height: 40, padding: '0 16px', borderRadius: 8, background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={formLoading} style={{ height: 40, padding: '0 20px', borderRadius: 8, background: 'var(--color-navy)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: formLoading ? 'not-allowed' : 'pointer', opacity: formLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                {formLoading && <i className="ri-loader-4-line ri-spin" />}
                {formLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <ModalShell title="Cambiar Contraseña" onClose={() => setShowChangePassword(null)}>
          <form onSubmit={handleChangePasswordSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '8px 12px', background: 'var(--color-gray-light)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-muted)' }}>
              <strong>{showChangePassword.displayName}</strong> — {showChangePassword.email}
            </div>
            {changePasswordError && (
              <div style={{ padding: '10px 14px', background: 'rgba(230,51,41,0.06)', border: '1px solid rgba(230,51,41,0.2)', color: 'var(--color-red)', borderRadius: 8, fontSize: 13 }}>{changePasswordError}</div>
            )}
            {field('Nueva contraseña * (mín. 8 caracteres)', (
              <input type="password" required minLength={8} style={inputStyle} value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" />
            ))}
            {field('Confirmar contraseña *', (
              <input type="password" required minLength={8} style={inputStyle} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" />
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <button type="button" onClick={() => setShowChangePassword(null)} style={{ height: 40, padding: '0 16px', borderRadius: 8, background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={changePasswordLoading} style={{ height: 40, padding: '0 20px', borderRadius: 8, background: 'var(--color-navy)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: changePasswordLoading ? 'not-allowed' : 'pointer', opacity: changePasswordLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                {changePasswordLoading && <i className="ri-loader-4-line ri-spin" />}
                {changePasswordLoading ? 'Guardando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <ModalShell title="Eliminar Provider" onClose={() => setShowDeleteConfirm(null)}>
          <div style={{ padding: 24 }}>
            <p style={{ margin: '0 0 24px', color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.5 }}>
              ¿Eliminar el provider <strong>{showDeleteConfirm.displayName}</strong>? Esta acción no se puede deshacer y el usuario perderá acceso inmediatamente.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setShowDeleteConfirm(null)} style={{ height: 40, padding: '0 16px', borderRadius: 8, background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} style={{ height: 40, padding: '0 16px', borderRadius: 8, background: 'var(--color-red)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Eliminar</button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', border: `1px solid ${toast.type === 'success' ? 'rgba(60,173,66,0.3)' : 'rgba(230,51,41,0.3)'}`, borderRadius: 14, padding: '12px 18px', boxShadow: '0 10px 25px rgba(27,43,110,0.15)', display: 'flex', alignItems: 'center', gap: 10, zIndex: 2000, maxWidth: 380 }}>
          <i className={toast.type === 'success' ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill'} style={{ color: toast.type === 'success' ? 'var(--color-green)' : 'var(--color-red)', fontSize: 18 }} />
          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-navy)' }}>{toast.text}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-mid)', fontSize: 16, padding: 4, marginLeft: 4 }}>
            <i className="ri-close-line" />
          </button>
        </div>
      )}
    </div>
  )
}
