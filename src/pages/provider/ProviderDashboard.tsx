import { useEffect, useRef, useState, useMemo, type FormEvent } from 'react'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../config/firebase'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import { fetchProviderCodes, validatePrizeCode, fetchLocals, updateLocal, type PrizeCodeData } from '../../services/adminService'
import ImageUpload from '../../components/ImageUpload'

const CATEGORIES = ['Bares', 'Hoteles', 'Restaurantes', 'Museos', 'Actividades', 'Experiencias', 'Otro']
const ZONA_COLONIAL = { lat: 18.4735, lng: -69.8863 }
const ZONA_COLONIAL_BOUNDS = { north: 18.482, south: 18.464, east: -69.876, west: -69.897 }

let mapsInitialized = false

const inputStyle: React.CSSProperties = {
  height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
  padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box',
}

function field(label: string, children: React.ReactNode) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>{label}</label>
      {children}
    </div>
  )
}

type EditForm = {
  name: string; description: string; address: string; phone: string
  email: string; imageUrl: string; category: string
  lat: number | null; lng: number | null
}

type LocalPin = { id: string; name: string; lat: number | null; lng: number | null; imageUrl: string; category: string }

function EditLocalForm({
  form, setForm, onSubmit, formError, formLoading, onCancel, otherLocals, currentLocalId,
}: {
  form: EditForm
  setForm: React.Dispatch<React.SetStateAction<EditForm>>
  onSubmit: (e: FormEvent) => void
  formError: string | null
  formLoading: boolean
  onCancel: () => void
  otherLocals: LocalPin[]
  currentLocalId: string
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const autocompleteContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    if (!mapRef.current) return
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) return

    if (!mapsInitialized) {
      setOptions({ key: apiKey, v: 'weekly' })
      mapsInitialized = true
    }

    const initialLatLng = { lat: form.lat ?? ZONA_COLONIAL.lat, lng: form.lng ?? ZONA_COLONIAL.lng }

    Promise.all([importLibrary('maps'), importLibrary('marker'), importLibrary('places')])
      .then(([{ Map }, { AdvancedMarkerElement }, placesLib]) => {
        if (!active || !mapRef.current) return
        const { PlaceAutocompleteElement } = placesLib as any

        const map = new Map(mapRef.current, {
          center: initialLatLng,
          zoom: 17,
          mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || undefined,
          restriction: { latLngBounds: ZONA_COLONIAL_BOUNDS, strictBounds: false },
        })
        mapInstanceRef.current = map

        const marker = new AdvancedMarkerElement({ map, position: initialLatLng, gmpDraggable: true })
        markerRef.current = marker

        if (autocompleteContainerRef.current) {
          const placeAutocomplete = new PlaceAutocompleteElement()
          placeAutocomplete.setAttribute('placeholder', 'Buscar dirección...')
          placeAutocomplete.style.width = '100%'
          placeAutocomplete.style.height = '40px'
          placeAutocomplete.style.borderRadius = '8px'
          placeAutocomplete.style.border = '1.5px solid var(--color-border)'
          placeAutocomplete.style.backgroundColor = '#ffffff'
          placeAutocomplete.style.setProperty('--gmp-mat-color-surface', '#ffffff')
          placeAutocomplete.style.setProperty('color-scheme', 'light')
          placeAutocomplete.includedRegionCodes = ['do']
          placeAutocomplete.locationBias = ZONA_COLONIAL_BOUNDS

          autocompleteContainerRef.current.innerHTML = ''
          autocompleteContainerRef.current.appendChild(placeAutocomplete)

          const handlePlaceSelect = async (place: any) => {
            if (!place) return
            try {
              await place.fetchFields({ fields: ['location', 'formattedAddress'] })
              const location = place.location
              if (location) {
                const newLat = typeof location.lat === 'function' ? location.lat() : location.lat
                const newLng = typeof location.lng === 'function' ? location.lng() : location.lng
                const formattedAddress = place.formattedAddress || ''
                setForm(f => ({ ...f, lat: newLat, lng: newLng, address: formattedAddress || f.address }))
                const coords = { lat: newLat, lng: newLng }
                marker.position = coords
                map.panTo(coords)
                map.setZoom(18)
              }
            } catch (err) { console.error(err) }
          }

          const onSelect = (e: any) => {
            const pred = e.placePrediction || e.detail?.placePrediction || e.target?.placePrediction
            if (pred) { handlePlaceSelect(pred.toPlace()); return }
            const place = e.target?.place || e.detail?.place || e.place
            if (place) handlePlaceSelect(place)
          }
          placeAutocomplete.addEventListener('gmp-select', onSelect)
          placeAutocomplete.addEventListener('gmp-placeselect', onSelect)
        }

        map.addListener('click', (e: any) => {
          if (e.latLng) {
            setForm(f => ({ ...f, lat: e.latLng.lat(), lng: e.latLng.lng() }))
            marker.position = e.latLng
          }
        })

        marker.addListener('dragend', () => {
          if (marker.position) {
            const latVal = typeof marker.position.lat === 'function' ? marker.position.lat() : marker.position.lat
            const lngVal = typeof marker.position.lng === 'function' ? marker.position.lng() : marker.position.lng
            setForm(f => ({ ...f, lat: latVal, lng: lngVal }))
          }
        })

        // Marcadores de otros locales
        otherLocals.forEach(local => {
          if (!local.lat || !local.lng || local.id === currentLocalId) return
          const el = document.createElement('div')
          el.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:default;'
          el.innerHTML = `
            <div style="background:#fff;border:2px solid #096d7d;border-radius:50%;width:32px;height:32px;overflow:hidden;box-shadow:0 2px 8px rgba(9,109,125,0.35);">
              ${local.imageUrl
                ? `<img src="${local.imageUrl}" style="width:100%;height:100%;object-fit:cover;" />`
                : `<div style="width:100%;height:100%;background:#e8f5f6;display:flex;align-items:center;justify-content:center;font-size:14px;">🏪</div>`
              }
            </div>
            <div style="background:#096d7d;color:#fff;font-size:9px;font-weight:700;padding:1px 5px;border-radius:4px;margin-top:2px;white-space:nowrap;max-width:80px;overflow:hidden;text-overflow:ellipsis;">${local.name}</div>
            <div style="width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid #096d7d;margin-top:1px;"></div>
          `
          new AdvancedMarkerElement({ map, position: { lat: local.lat, lng: local.lng }, content: el, title: local.name })
        })
      })
      .catch(console.error)

    return () => { active = false; mapInstanceRef.current = null; markerRef.current = null }
  }, [])

  return (
    <form onSubmit={onSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {formError && (
        <div style={{ padding: '10px 14px', background: 'rgba(230,51,41,0.06)', border: '1px solid rgba(230,51,41,0.2)', color: 'var(--color-red)', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ri-error-warning-line" />{formError}
        </div>
      )}

      {field('Nombre *', <input required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />)}
      {field('Descripción', <textarea rows={3} style={{ ...inputStyle, height: 'auto', padding: '8px 12px', resize: 'vertical' as const }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />)}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {field('Teléfono', <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />)}
        {field('Email', <input type="email" style={{ ...inputStyle, background: 'var(--color-gray-light)', color: 'var(--color-text-muted)', cursor: 'not-allowed' }} value={form.email} readOnly />)}
      </div>

      {field('Categoría', (
        <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
          <option value="">-- Sin categoría --</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      ))}

      {/* Mapa */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>Ubicación en el mapa</label>
        <div ref={autocompleteContainerRef} style={{ width: '100%' }} />
        <div ref={mapRef} style={{ width: '100%', height: 240, borderRadius: 10, border: '1.5px solid var(--color-border)', overflow: 'hidden' }} />
        <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)' }}>
          Busca tu dirección o haz clic en el mapa para ajustar la ubicación.
        </p>
      </div>

      {field('Imagen', (
        <ImageUpload value={form.imageUrl} storagePath="locals" onChange={(url: string) => setForm(f => ({ ...f, imageUrl: url }))} />
      ))}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
        <button type="button" onClick={onCancel}
          style={{ height: 40, padding: '0 16px', borderRadius: 8, background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button type="submit" disabled={formLoading}
          style={{ height: 40, padding: '0 20px', borderRadius: 8, background: 'var(--color-navy)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: formLoading ? 'not-allowed' : 'pointer', opacity: formLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          {formLoading && <i className="ri-loader-4-line ri-spin" />}
          {formLoading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}

export default function ProviderDashboard() {
  const navigate = useNavigate()

  const [codes, setCodes] = useState<PrizeCodeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Provider info from token
  const [providerName, setProviderName] = useState('')
  const [localName, setLocalName] = useState('')
  const [localId, setLocalId] = useState('')

  // Edit local modal
  const [showEditLocal, setShowEditLocal] = useState(false)
  const [editLocalForm, setEditLocalForm] = useState<EditForm>({ name: '', description: '', address: '', phone: '', email: '', imageUrl: '', category: '', lat: null, lng: null })
  const [editLocalLoading, setEditLocalLoading] = useState(false)
  const [editLocalFetching, setEditLocalFetching] = useState(false)
  const [editLocalError, setEditLocalError] = useState<string | null>(null)
  const [allLocals, setAllLocals] = useState<LocalPin[]>([])

  // DataTable
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Validate flow
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
        setLocalId((claims.localId as string) || '')
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

  async function openEditLocal() {
    setEditLocalError(null)
    setEditLocalForm({ name: localName, description: '', address: '', phone: '', email: '', imageUrl: '', category: '', lat: null, lng: null })
    setShowEditLocal(true)
    setEditLocalFetching(true)
    try {
      const locals = await fetchLocals()
      setAllLocals(locals.map(l => ({ id: l.id, name: l.name, lat: l.lat, lng: l.lng, imageUrl: l.imageUrl, category: l.category })))
      const local = locals.find(l => l.id === localId)
      if (local) {
        setEditLocalForm({
          name: local.name,
          description: local.description,
          address: local.address,
          phone: local.phone,
          email: local.email,
          imageUrl: local.imageUrl,
          category: local.category,
          lat: local.lat ?? null,
          lng: local.lng ?? null,
        })
      }
    } catch {
      // use partial pre-fill
    } finally {
      setEditLocalFetching(false)
    }
  }

  async function handleSaveLocal(e: FormEvent) {
    e.preventDefault()
    if (!localId) { setEditLocalError('No se encontró el ID del local.'); return }
    if (!editLocalForm.name.trim()) { setEditLocalError('El nombre es obligatorio.'); return }
    setEditLocalError(null)
    try {
      setEditLocalLoading(true)
      await updateLocal(localId, {
        name: editLocalForm.name.trim(),
        description: editLocalForm.description.trim(),
        address: editLocalForm.address.trim(),
        phone: editLocalForm.phone.trim(),
        email: editLocalForm.email.trim(),
        imageUrl: editLocalForm.imageUrl.trim(),
        category: editLocalForm.category,
        active: true,
        lat: editLocalForm.lat,
        lng: editLocalForm.lng,
      })
      setLocalName(editLocalForm.name.trim())
      setShowEditLocal(false)
      showToast('Información actualizada correctamente.')
    } catch (err) {
      setEditLocalError(err instanceof Error ? err.message : 'Error al guardar los cambios.')
    } finally {
      setEditLocalLoading(false)
    }
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
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 28, margin: '0 0 4px' }}>
              {localName ? `Panel — ${localName}` : 'Panel de Validación'}
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>Valida los códigos de premios de tus clientes.</p>
          </div>
          <button onClick={openEditLocal}
            style={{ height: 38, padding: '0 16px', borderRadius: 10, background: 'var(--color-navy)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0, boxShadow: '0 4px 14px rgba(27,43,110,0.25)' }}>
            <i className="ri-edit-line" style={{ fontSize: 15 }} />
            Editar info
          </button>
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

      {/* Edit Local Modal */}
      {showEditLocal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,21,38,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 16, width: '100%', maxWidth: 680, boxShadow: 'var(--shadow-pop)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: '0 0 2px' }}>Editar información del local</h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>Actualiza los datos de tu establecimiento.</p>
              </div>
              <button onClick={() => setShowEditLocal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-mid)', padding: 4 }}>
                <i className="ri-close-line" style={{ fontSize: 20 }} />
              </button>
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {editLocalFetching ? (
                <div style={{ padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <i className="ri-loader-4-line ri-spin" style={{ fontSize: 28, color: 'var(--color-navy)' }} />
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Cargando información...</span>
                </div>
              ) : (
                <EditLocalForm
                  form={editLocalForm}
                  setForm={setEditLocalForm}
                  onSubmit={handleSaveLocal}
                  formError={editLocalError}
                  formLoading={editLocalLoading}
                  onCancel={() => setShowEditLocal(false)}
                  otherLocals={allLocals}
                  currentLocalId={localId}
                />
              )}
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
