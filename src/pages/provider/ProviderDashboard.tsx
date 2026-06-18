import { useEffect, useState, useMemo, type FormEvent } from 'react'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../config/firebase'
import { fetchProviderCodes, validatePrizeCode, type PrizeCodeData } from '../../services/adminService'

export default function ProviderDashboard() {
  const navigate = useNavigate()

  const [codes, setCodes] = useState<PrizeCodeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Provider info from token
  const [providerName, setProviderName] = useState('')
  const [localName, setLocalName] = useState('')

  // DataTable
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Validate flow
  const [showValidateModal, setShowValidateModal] = useState(false)
  const [validateCode, setValidateCodeInput] = useState('')
  const [validateLoading, setValidateLoading] = useState(false)
  const [validateError, setValidateError] = useState<string | null>(null)
  const [validateSuccess, setValidateSuccess] = useState<{ prizeName: string; playerDisplayName: string; claimedAt: string } | null>(null)

  // Validate confirm (for codes from the list)
  const [confirmCode, setConfirmCode] = useState<PrizeCodeData | null>(null)

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  function showToast(text: string, type: 'success' | 'error' = 'success') { setToast({ type, text }) }
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    async function init() {
      const user = auth.currentUser
      if (user) {
        setProviderName(user.displayName || user.email || '')
        const { claims } = await user.getIdTokenResult()
        setLocalName((claims.localName as string) || '')
      }
      await load()
    }
    init()
  }, [])

  async function load() {
    try {
      setLoading(true); setError(null)
      setCodes(await fetchProviderCodes())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar códigos.')
    } finally {
      setLoading(false)
    }
  }

  const processed = useMemo(() => {
    let r = [...codes]
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(c => c.code.toLowerCase().includes(q) || c.playerEmail.toLowerCase().includes(q) || c.playerDisplayName.toLowerCase().includes(q) || c.prizeName.toLowerCase().includes(q))
    }
    if (statusFilter) r = r.filter(c => c.status === statusFilter)
    r.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    return r
  }, [codes, search, statusFilter])

  const totalPages = Math.ceil(processed.length / pageSize)
  const paginated = useMemo(() => processed.slice((currentPage - 1) * pageSize, currentPage * pageSize), [processed, currentPage, pageSize])

  const pendingCount = codes.filter(c => c.status === 'active').length
  const claimedCount = codes.filter(c => c.status === 'claimed').length

  async function handleValidateSubmit(e: FormEvent) {
    e.preventDefault()
    setValidateError(null); setValidateSuccess(null)
    const code = validateCode.trim().toUpperCase()
    if (!code) { setValidateError('Ingresa un código.'); return }
    try {
      setValidateLoading(true)
      const result = await validatePrizeCode(code)
      setValidateSuccess({ prizeName: result.prizeName, playerDisplayName: result.playerDisplayName, claimedAt: result.claimedAt })
      setValidateCodeInput('')
      await load()
    } catch (err) {
      setValidateError(err instanceof Error ? err.message : 'Error al validar el código.')
    } finally {
      setValidateLoading(false)
    }
  }

  async function handleConfirmRedeem(code: PrizeCodeData) {
    try {
      await validatePrizeCode(code.code)
      setConfirmCode(null)
      showToast(`Código ${code.code} canjeado correctamente.`)
      await load()
    } catch (err) {
      setConfirmCode(null)
      showToast(err instanceof Error ? err.message : 'Error al canjear el código.', 'error')
    }
  }

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  async function handleLogout() {
    await signOut(auth)
    navigate('/admin/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', fontFamily: 'var(--font-body)' }}>
      {/* Top bar */}
      <header style={{ height: 64, background: 'var(--color-navy)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="ri-compass-3-line" style={{ color: 'var(--color-navy)', fontSize: 18 }} />
        </div>
        <span style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: 16 }}>Turizoneando</span>
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{providerName}</div>
          {localName && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{localName}</div>}
        </div>
        <button onClick={handleLogout} title="Cerrar sesión"
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.7)', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <i className="ri-logout-box-line" style={{ fontSize: 18 }} />
        </button>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 28, margin: '0 0 4px' }}>
            {localName ? `Panel — ${localName}` : 'Panel de Validación'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>Valida los códigos de premios de tus clientes.</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Pendientes', value: pendingCount, color: 'var(--color-green)', bg: 'rgba(60,173,66,0.08)', icon: 'ri-ticket-2-line' },
            { label: 'Canjeados', value: claimedCount, color: 'var(--color-navy)', bg: 'rgba(27,43,110,0.06)', icon: 'ri-checkbox-circle-line' },
            { label: 'Total', value: codes.length, color: 'var(--color-text-muted)', bg: 'var(--color-gray-light)', icon: 'ri-stack-line' },
          ].map(stat => (
            <div key={stat.label} style={{ background: stat.bg, borderRadius: 16, padding: '20px 24px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <i className={stat.icon} style={{ fontSize: 20, color: stat.color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: stat.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</span>
              </div>
              <div style={{ fontSize: 32, fontFamily: 'var(--font-display)', color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Validate Code Panel */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border)', marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: '0 0 16px' }}>
            <i className="ri-qr-scan-2-line" style={{ marginRight: 8 }} />
            Validar Código
          </h2>
          <form onSubmit={handleValidateSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>Código del cliente</label>
              <input
                type="text"
                value={validateCode}
                onChange={e => setValidateCodeInput(e.target.value.toUpperCase())}
                placeholder="Ej: RT-12345"
                style={{ height: 48, borderRadius: 10, border: '1.5px solid var(--color-border)', padding: '0 16px', fontSize: 16, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2, outline: 'none' }}
              />
            </div>
            <button type="submit" disabled={validateLoading}
              style={{ height: 48, padding: '0 28px', borderRadius: 10, background: 'var(--color-navy)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: validateLoading ? 'not-allowed' : 'pointer', opacity: validateLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(27,43,110,0.25)' }}>
              {validateLoading ? <i className="ri-loader-4-line ri-spin" /> : <i className="ri-check-double-line" />}
              {validateLoading ? 'Validando...' : 'Canjear'}
            </button>
          </form>

          {validateError && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(230,51,41,0.06)', border: '1px solid rgba(230,51,41,0.2)', color: 'var(--color-red)', borderRadius: 10, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ri-error-warning-line" style={{ fontSize: 18 }} />
              {validateError}
            </div>
          )}

          {validateSuccess && (
            <div style={{ marginTop: 16, padding: '16px 20px', background: 'rgba(60,173,66,0.06)', border: '1px solid rgba(60,173,66,0.25)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <i className="ri-checkbox-circle-fill" style={{ color: 'var(--color-green)', fontSize: 22 }} />
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-green)' }}>¡Código canjeado con éxito!</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                <strong>Premio:</strong> {validateSuccess.prizeName}<br />
                <strong>Cliente:</strong> {validateSuccess.playerDisplayName}<br />
                <strong>Fecha:</strong> {formatDate(validateSuccess.claimedAt)}
              </div>
            </div>
          )}
        </div>

        {/* Codes Table */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 16, boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          {/* Filters bar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: '1 1 220px', position: 'relative' }}>
              <i className="ri-search-line" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-mid)', fontSize: 15 }} />
              <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} placeholder="Buscar código, cliente o premio..."
                style={{ width: '100%', height: 38, paddingLeft: 36, paddingRight: 12, borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, outline: 'none', background: 'var(--color-gray-light)', fontFamily: 'var(--font-body)' }} />
            </div>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1) }}
              style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', fontSize: 13, outline: 'none', background: '#fff', cursor: 'pointer' }}>
              <option value="">Todos</option>
              <option value="active">Pendientes</option>
              <option value="claimed">Canjeados</option>
              <option value="inactive">Inactivos</option>
            </select>
            {(search || statusFilter) && (
              <button onClick={() => { setSearch(''); setStatusFilter(''); setCurrentPage(1) }} style={{ background: 'none', border: 'none', color: 'var(--color-navy)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Limpiar
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <i className="ri-loader-4-line ri-spin" style={{ fontSize: 36, color: 'var(--color-navy)' }} />
              <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Cargando códigos...</span>
            </div>
          ) : error ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-red)' }}><p>{error}</p></div>
          ) : paginated.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <i className="ri-ticket-2-line" style={{ fontSize: 48, color: 'var(--color-gray-mid)', marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>No hay códigos</p>
              <p style={{ margin: '4px 0 0', fontSize: 13 }}>Aún no se han generado códigos para este local.</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-gray-light)', borderBottom: '1px solid var(--color-border)' }}>
                      {['Código', 'Premio', 'Cliente', 'Estado', 'Generado', 'Vence', 'Acción'].map(h => (
                        <th key={h} style={{ padding: '14px 20px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', textAlign: h === 'Acción' ? 'right' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(c => {
                      const expired = c.status === 'active' && c.expiresAt ? new Date(c.expiresAt) < new Date() : false
                      const statusColor = c.status === 'active' ? 'var(--color-green)' : c.status === 'claimed' ? 'var(--color-navy)' : 'var(--color-red)'
                      const statusBg = c.status === 'active' ? 'rgba(60,173,66,0.1)' : c.status === 'claimed' ? 'rgba(27,43,110,0.1)' : 'rgba(230,51,41,0.1)'
                      const statusLabel = c.status === 'active' ? 'Pendiente' : c.status === 'claimed' ? 'Canjeado' : 'Inactivo'
                      return (
                        <tr key={c.code} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--color-navy)', fontSize: 15, letterSpacing: 1 }}>{c.code}</span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {c.prizeImageUrl && <img src={c.prizeImageUrl} alt={c.prizeName} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--color-border)' }} />}
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{c.prizeName}</div>
                                <span style={{ fontSize: 10, background: 'rgba(27,43,110,0.06)', color: 'var(--color-navy)', padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>{c.prizeCategory}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{c.playerDisplayName}</div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{c.playerEmail}</div>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: statusBg, color: statusColor }}>{statusLabel}</span>
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: 12, color: 'var(--color-text-muted)' }}>{formatDate(c.createdAt)}</td>
                          <td style={{ padding: '14px 20px', fontSize: 12 }}>
                            {c.expiresAt ? (
                              <span style={{ color: expired ? 'var(--color-red)' : 'var(--color-text-muted)', fontWeight: expired ? 700 : 400 }}>
                                {expired && <i className="ri-time-line" style={{ marginRight: 4 }} />}
                                {formatDate(c.expiresAt)}
                              </span>
                            ) : '—'}
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            {c.status === 'active' && !expired && (
                              <button onClick={() => setConfirmCode(c)}
                                style={{ height: 32, padding: '0 12px', borderRadius: 8, border: 'none', background: 'var(--color-navy)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <i className="ri-check-line" />
                                Canjear
                              </button>
                            )}
                            {c.status === 'claimed' && (
                              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                <i className="ri-checkbox-circle-line" style={{ marginRight: 4 }} />
                                {c.claimedAt ? formatDate(c.claimedAt) : 'Canjeado'}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
                    style={{ height: 32, padding: '0 8px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 13, outline: 'none', background: '#fff', cursor: 'pointer' }}>
                    {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n} por página</option>)}
                  </select>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                    {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, processed.length)} de {processed.length}
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
      </main>

      {/* Confirm redeem from table */}
      {confirmCode && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,21,38,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: 0 }}>Confirmar Canje</h3>
              <button onClick={() => setConfirmCode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-mid)', padding: 4 }}>
                <i className="ri-close-line" style={{ fontSize: 20 }} />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ background: 'var(--color-gray-light)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 22, fontFamily: 'monospace', fontWeight: 800, color: 'var(--color-navy)', letterSpacing: 2, marginBottom: 8 }}>{confirmCode.code}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{confirmCode.prizeName}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{confirmCode.playerDisplayName} · {confirmCode.playerEmail}</div>
              </div>
              <p style={{ margin: '0 0 24px', color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.5 }}>
                Al confirmar, el código quedará marcado como <strong>canjeado</strong> y no podrá volver a usarse.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button onClick={() => setConfirmCode(null)} style={{ height: 40, padding: '0 16px', borderRadius: 8, background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={() => handleConfirmRedeem(confirmCode)} style={{ height: 40, padding: '0 20px', borderRadius: 8, background: 'var(--color-navy)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ri-check-double-line" />
                  Confirmar Canje
                </button>
              </div>
            </div>
          </div>
        </div>
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
