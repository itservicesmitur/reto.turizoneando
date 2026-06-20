import { useEffect, useRef, useState, useMemo, type FormEvent } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import ImageUpload from '../../components/ImageUpload'
import {
  fetchLocals,
  createLocal,
  updateLocal,
  deleteLocal,
  type LocalData,
} from '../../services/adminService'

const CATEGORIES = ['Bares', 'Hoteles', 'Restaurantes', 'Museos', 'Actividades', 'Experiencias', 'Otro']

// Zona Colonial center and bounds
const ZONA_COLONIAL = { lat: 18.4735, lng: -69.8863 }
const ZONA_COLONIAL_BOUNDS = {
  north: 18.482,
  south: 18.464,
  east: -69.876,
  west: -69.897,
}

let isGoogleMapsInitialized = false

const emptyForm = () => ({
  name: '',
  description: '',
  address: '',
  lat: null as number | null,
  lng: null as number | null,
  phone: '',
  email: '',
  imageUrl: '',
  category: '',
  active: true,
})

type FormState = ReturnType<typeof emptyForm>

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

function LocalForm({
  form, setForm, onSubmit, formError, formLoading, showActiveField, onCancel
}: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  onSubmit: (e: FormEvent) => void
  formError: string | null
  formLoading: boolean
  showActiveField: boolean
  onCancel: () => void
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

    if (!isGoogleMapsInitialized) {
      setOptions({ key: apiKey, v: 'weekly' })
      isGoogleMapsInitialized = true
    }

    const initialLatLng = {
      lat: form.lat ?? ZONA_COLONIAL.lat,
      lng: form.lng ?? ZONA_COLONIAL.lng,
    }

    Promise.all([importLibrary('maps'), importLibrary('marker'), importLibrary('places')])
      .then(([{ Map }, { AdvancedMarkerElement }, placesLib]) => {
        if (!active || !mapRef.current) return
        const { PlaceAutocompleteElement } = placesLib as any

        const map = new Map(mapRef.current, {
          center: initialLatLng,
          zoom: 16,
          mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || undefined,
          restriction: {
            latLngBounds: ZONA_COLONIAL_BOUNDS,
            strictBounds: false,
          },
        })
        mapInstanceRef.current = map

        const marker = new AdvancedMarkerElement({
          map,
          position: initialLatLng,
          gmpDraggable: true,
        })
        markerRef.current = marker

        // Autocomplete restricted to Zona Colonial
        if (autocompleteContainerRef.current) {
          const placeAutocomplete = new PlaceAutocompleteElement()
          placeAutocomplete.setAttribute('placeholder', 'Buscar en la Zona Colonial...')
          placeAutocomplete.style.width = '100%'
          placeAutocomplete.style.height = '38px'
          placeAutocomplete.style.borderRadius = '8px'
          placeAutocomplete.style.border = '1.5px solid var(--color-border)'
          placeAutocomplete.style.backgroundColor = '#ffffff'
          placeAutocomplete.style.color = '#1a1a1a'
          placeAutocomplete.style.outline = 'none'
          placeAutocomplete.style.boxSizing = 'border-box'
          placeAutocomplete.style.setProperty('--gmp-mat-color-surface', '#ffffff')
          placeAutocomplete.style.setProperty('color-scheme', 'light')
          placeAutocomplete.includedRegionCodes = ['do']
          placeAutocomplete.locationBias = {
            west: ZONA_COLONIAL_BOUNDS.west,
            east: ZONA_COLONIAL_BOUNDS.east,
            south: ZONA_COLONIAL_BOUNDS.south,
            north: ZONA_COLONIAL_BOUNDS.north,
          }

          autocompleteContainerRef.current.innerHTML = ''
          autocompleteContainerRef.current.appendChild(placeAutocomplete)

          const handlePlaceSelect = async (place: any) => {
            if (!place) return
            try {
              await place.fetchFields({ fields: ['location'] })
              const location = place.location
              if (location) {
                const newLat = typeof location.lat === 'function' ? location.lat() : location.lat
                const newLng = typeof location.lng === 'function' ? location.lng() : location.lng
                setForm(f => ({ ...f, lat: newLat, lng: newLng }))
                const coords = { lat: newLat, lng: newLng }
                marker.position = coords
                map.panTo(coords)
                map.setZoom(18)
              }
            } catch (err) {
              console.error('Error fetching place details:', err)
            }
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

        // Click on map
        map.addListener('click', (e: any) => {
          if (e.latLng) {
            const newLat = e.latLng.lat()
            const newLng = e.latLng.lng()
            setForm(f => ({ ...f, lat: newLat, lng: newLng }))
            marker.position = e.latLng
          }
        })

        // Drag marker
        marker.addListener('dragend', () => {
          if (marker.position) {
            const latVal = typeof marker.position.lat === 'function' ? marker.position.lat() : marker.position.lat
            const lngVal = typeof marker.position.lng === 'function' ? marker.position.lng() : marker.position.lng
            setForm(f => ({ ...f, lat: latVal, lng: lngVal }))
          }
        })
      })
      .catch(err => console.error('Error loading Google Maps in locals form:', err))

    return () => {
      active = false
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }, []) // runs once on mount — map handles its own state via refs

  // Sync manual lat/lng inputs → map
  function handleLatChange(val: string) {
    const num = parseFloat(val)
    if (!isNaN(num)) {
      setForm(f => ({ ...f, lat: num }))
      if (markerRef.current) markerRef.current.position = { lat: num, lng: form.lng ?? ZONA_COLONIAL.lng }
      if (mapInstanceRef.current) mapInstanceRef.current.panTo({ lat: num, lng: form.lng ?? ZONA_COLONIAL.lng })
    }
  }

  function handleLngChange(val: string) {
    const num = parseFloat(val)
    if (!isNaN(num)) {
      setForm(f => ({ ...f, lng: num }))
      if (markerRef.current) markerRef.current.position = { lat: form.lat ?? ZONA_COLONIAL.lat, lng: num }
      if (mapInstanceRef.current) mapInstanceRef.current.panTo({ lat: form.lat ?? ZONA_COLONIAL.lat, lng: num })
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {formError && (
        <div style={{ padding: '10px 14px', background: 'rgba(230,51,41,0.06)', border: '1px solid rgba(230,51,41,0.2)', color: 'var(--color-red)', borderRadius: 8, fontSize: 13 }}>
          {formError}
        </div>
      )}

      {field('Nombre *', <input required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />)}
      {field('Descripción', <textarea rows={3} style={{ ...inputStyle, height: 'auto', padding: '8px 12px', resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />)}
      {field('Dirección', <input style={inputStyle} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />)}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {field('Teléfono', <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />)}
        {field('Email', <input type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />)}
      </div>

      {field('Categoría', (
        <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
          <option value="">-- Sin categoría --</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      ))}

      {/* Map with autocomplete */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>Ubicación en el mapa</label>
        <div ref={autocompleteContainerRef} style={{ width: '100%' }} />
        <div ref={mapRef} style={{ width: '100%', height: 260, borderRadius: 10, border: '1.5px solid var(--color-border)', overflow: 'hidden' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {field('Latitud', (
            <input type="number" step="any" style={inputStyle}
              value={form.lat ?? ''}
              onChange={e => handleLatChange(e.target.value)}
              placeholder={String(ZONA_COLONIAL.lat)} />
          ))}
          {field('Longitud', (
            <input type="number" step="any" style={inputStyle}
              value={form.lng ?? ''}
              onChange={e => handleLngChange(e.target.value)}
              placeholder={String(ZONA_COLONIAL.lng)} />
          ))}
        </div>
      </div>

      {field('Imagen', (
        <ImageUpload
          value={form.imageUrl}
          storagePath="locals"
          onChange={(url: string) => setForm(f => ({ ...f, imageUrl: url }))}
        />
      ))}

      {showActiveField && field('Estado', (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
          <span style={{ fontSize: 14 }}>Activo</span>
        </label>
      ))}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
        <button type="button" onClick={onCancel}
          style={{ height: 40, padding: '0 16px', borderRadius: 8, background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button type="submit" disabled={formLoading}
          style={{ height: 40, padding: '0 20px', borderRadius: 8, background: 'var(--color-navy)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: formLoading ? 'not-allowed' : 'pointer', opacity: formLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          {formLoading && <i className="ri-loader-4-line ri-spin" />}
          {formLoading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

export default function LocalsPage() {
  const [locals, setLocals] = useState<LocalData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // DataTable
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'date-desc'>('date-desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modals
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<LocalData | null>(null)
  const [editTarget, setEditTarget] = useState<LocalData | null>(null)

  // Form
  const [form, setForm] = useState(emptyForm())
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  function showToast(text: string, type: 'success' | 'error' = 'success') {
    setToast({ type, text })
  }
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true); setError(null)
      setLocals(await fetchLocals())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar locales.')
    } finally {
      setLoading(false)
    }
  }

  const processed = useMemo(() => {
    let r = [...locals]
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(l => l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q) || l.email.toLowerCase().includes(q))
    }
    if (categoryFilter) r = r.filter(l => l.category === categoryFilter)
    if (statusFilter === 'active') r = r.filter(l => l.active)
    if (statusFilter === 'inactive') r = r.filter(l => !l.active)
    r.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })
    return r
  }, [locals, search, categoryFilter, statusFilter, sortBy])

  const totalPages = Math.ceil(processed.length / pageSize)
  const paginated = useMemo(() => processed.slice((currentPage - 1) * pageSize, currentPage * pageSize), [processed, currentPage, pageSize])

  function openCreate() {
    setForm(emptyForm()); setFormError(null); setShowCreate(true)
  }

  function openEdit(local: LocalData) {
    setEditTarget(local)
    setForm({
      name: local.name,
      description: local.description,
      address: local.address,
      lat: local.lat ?? null,
      lng: local.lng ?? null,
      phone: local.phone,
      email: local.email,
      imageUrl: local.imageUrl,
      category: local.category,
      active: local.active,
    })
    setFormError(null)
    setShowEdit(true)
  }

  async function handleCreateSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!form.name.trim()) { setFormError('El nombre es obligatorio.'); return }
    try {
      setFormLoading(true)
      await createLocal({
        name: form.name.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        lat: form.lat,
        lng: form.lng,
        phone: form.phone.trim(),
        email: form.email.trim(),
        imageUrl: form.imageUrl.trim(),
        category: form.category,
      })
      setShowCreate(false)
      showToast('Local creado correctamente.')
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al crear local.')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault()
    if (!editTarget) return
    setFormError(null)
    if (!form.name.trim()) { setFormError('El nombre es obligatorio.'); return }
    try {
      setFormLoading(true)
      await updateLocal(editTarget.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        lat: form.lat,
        lng: form.lng,
        phone: form.phone.trim(),
        email: form.email.trim(),
        imageUrl: form.imageUrl.trim(),
        category: form.category,
        active: form.active,
      })
      setShowEdit(false)
      showToast('Local actualizado correctamente.')
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al actualizar local.')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete(local: LocalData) {
    try {
      await deleteLocal(local.id)
      setShowDeleteConfirm(null)
      showToast('Local eliminado.')
      await load()
    } catch (err) {
      setShowDeleteConfirm(null)
      showToast(err instanceof Error ? err.message : 'Error al eliminar local.', 'error')
    }
  }

  return (
    <div style={{ animation: 'fade-in 0.3s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 28, margin: '0 0 4px' }}>Locales</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>Gestiona los establecimientos participantes del desafío cultural.</p>
        </div>
        <button onClick={openCreate}
          style={{ height: 48, padding: '0 20px', borderRadius: 12, background: 'var(--color-navy)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(27,43,110,0.3)' }}>
          <i className="ri-add-circle-line" style={{ fontSize: 16 }} />
          Nuevo Local
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-card)', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <i className="ri-search-line" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-mid)', fontSize: 16 }} />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} placeholder="Buscar por nombre, dirección o email..."
            style={{ width: '100%', height: 40, paddingLeft: 40, paddingRight: 16, borderRadius: 10, border: '1.5px solid var(--color-border)', fontSize: 14, outline: 'none', background: 'var(--color-gray-light)', fontFamily: 'var(--font-body)' }} />
        </div>
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1) }}
          style={{ height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--color-border)', fontSize: 14, outline: 'none', background: '#fff', cursor: 'pointer' }}>
          <option value="">Todas las categorías</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
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
          <option value="name-desc">Nombre Z→A</option>
        </select>
        {(search || categoryFilter || statusFilter) && (
          <button onClick={() => { setSearch(''); setCategoryFilter(''); setStatusFilter(''); setCurrentPage(1) }}
            style={{ background: 'none', border: 'none', color: 'var(--color-navy)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 16, boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <i className="ri-loader-4-line ri-spin" style={{ fontSize: 36, color: 'var(--color-navy)' }} />
            <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Cargando locales...</span>
          </div>
        ) : error ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-red)' }}><i className="ri-error-warning-line" style={{ fontSize: 36, marginBottom: 8 }} /><p>{error}</p></div>
        ) : paginated.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <i className="ri-store-2-line" style={{ fontSize: 48, color: 'var(--color-gray-mid)', marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>No se encontraron locales</p>
            <p style={{ margin: '4px 0 0', fontSize: 13 }}>Crea el primer local con el botón "Nuevo Local".</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--color-gray-light)', borderBottom: '1px solid var(--color-border)' }}>
                    {['Local', 'Categoría', 'Contacto', 'Dirección', 'Estado', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', textAlign: h === 'Acciones' ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(local => (
                    <tr key={local.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {local.imageUrl ? (
                            <img src={local.imageUrl} alt={local.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--color-border)' }} />
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--color-gray-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <i className="ri-store-2-line" style={{ color: 'var(--color-gray-mid)', fontSize: 20 }} />
                            </div>
                          )}
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{local.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {local.category ? (
                          <span style={{ fontSize: 11, background: 'rgba(27,43,110,0.06)', color: 'var(--color-navy)', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>{local.category}</span>
                        ) : <span style={{ color: 'var(--color-gray-mid)', fontSize: 13 }}>—</span>}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: 13, color: 'var(--color-text)' }}>{local.phone || '—'}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{local.email || '—'}</div>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 200 }}>
                        <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{local.address || '—'}</span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: local.active ? 'rgba(60,173,66,0.1)' : 'rgba(230,51,41,0.1)', color: local.active ? 'var(--color-green)' : 'var(--color-red)' }}>
                          {local.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <button onClick={() => openEdit(local)} title="Editar"
                            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-border)', background: '#fff', color: 'var(--color-navy)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="ri-edit-line" />
                          </button>
                          <button onClick={() => setShowDeleteConfirm(local)} title="Eliminar"
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
                  Mostrando {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, processed.length)} de {processed.length} items
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,21,38,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 16, width: '100%', maxWidth: 560, boxShadow: 'var(--shadow-pop)', overflow: 'hidden', animation: 'slide-up 0.2s ease-out', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: 0 }}>Nuevo Local</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-mid)', padding: 4 }}>
                <i className="ri-close-line" style={{ fontSize: 20 }} />
              </button>
            </div>
            <div style={{ overflowY: 'auto' }}>
              <LocalForm form={form} setForm={setForm} onSubmit={handleCreateSubmit} formError={formError} formLoading={formLoading} showActiveField={false} onCancel={() => setShowCreate(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,21,38,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 16, width: '100%', maxWidth: 560, boxShadow: 'var(--shadow-pop)', overflow: 'hidden', animation: 'slide-up 0.2s ease-out', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: 0 }}>Editar Local</h3>
              <button onClick={() => setShowEdit(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-mid)', padding: 4 }}>
                <i className="ri-close-line" style={{ fontSize: 20 }} />
              </button>
            </div>
            <div style={{ overflowY: 'auto' }}>
              <LocalForm form={form} setForm={setForm} onSubmit={handleEditSubmit} formError={formError} formLoading={formLoading} showActiveField={true} onCancel={() => setShowEdit(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,21,38,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: 0 }}>Eliminar Local</h3>
              <button onClick={() => setShowDeleteConfirm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-mid)', padding: 4 }}>
                <i className="ri-close-line" style={{ fontSize: 20 }} />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ margin: '0 0 24px', color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.5 }}>
                ¿Eliminar el local <strong>{showDeleteConfirm.name}</strong>? Esta acción no se puede deshacer. Si hay premios asociados, la operación será rechazada.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button onClick={() => setShowDeleteConfirm(null)} style={{ height: 40, padding: '0 16px', borderRadius: 8, background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={() => handleDelete(showDeleteConfirm)} style={{ height: 40, padding: '0 16px', borderRadius: 8, background: 'var(--color-red)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Eliminar
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
