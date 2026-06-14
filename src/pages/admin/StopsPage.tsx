import { useEffect, useState, useMemo, useRef, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import {
  fetchStopsList,
  fetchQuestionsForStop,
  createStop,
  updateStop,
  deleteStop,
  fetchSeasons,
  fetchElevenLabsVoices,
  generateElevenLabsAudio,
  type StopData,
  type QuestionData,
  type SeasonData
} from '../../services/adminService'
import ImageUpload from '../../components/ImageUpload'

let isGoogleMapsInitialized = false

export default function StopsPage() {
  const { t } = useTranslation()

  // Data States
  const [stops, setStops] = useState<StopData[]>([])
  const [seasons, setSeasons] = useState<SeasonData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search & Filter States
  const [search, setSearch] = useState('')
  const [seasonFilter, setSeasonFilter] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('') // '', 'active', 'inactive'
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'order-asc' | 'order-desc'>('name-asc')

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedStop, setSelectedStop] = useState<StopData | null>(null)

  // Tab State inside Modal ("info" or "questions")
  const [activeTab, setActiveTab] = useState<'info' | 'questions'>('info')

  // Stop Form States
  const [formName, setFormName] = useState('')
  const [formNameEn, setFormNameEn] = useState('')
  const [formNarration, setFormNarration] = useState('')
  const [formNarrationEn, setFormNarrationEn] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formAudioUrl, setFormAudioUrl] = useState('')
  const [formAudioUrlEn, setFormAudioUrlEn] = useState('')
  const [formLat, setFormLat] = useState<number>(18.4735)
  const [formLng, setFormLng] = useState<number>(-69.8863)
  const [formOrder, setFormOrder] = useState<number>(1)
  const [formSeasonIds, setFormSeasonIds] = useState<string[]>([])
  const [formStageId, setFormStageId] = useState('stage_1')
  const [formActive, setFormActive] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // ElevenLabs States
  const [selectedVoice, setSelectedVoice] = useState('PPzYpIqttlTYA83688JI') // Antoni (Deep Narrator) as default
  const [customVoiceId, setCustomVoiceId] = useState('')
  const [generatingAudio, setGeneratingAudio] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [availableVoices, setAvailableVoices] = useState<{ id: string; name: string; category: string }[]>([])
  const [loadingVoices, setLoadingVoices] = useState(false)

  // ElevenLabs English States
  const [selectedVoiceEn, setSelectedVoiceEn] = useState('PPzYpIqttlTYA83688JI')
  const [customVoiceIdEn, setCustomVoiceIdEn] = useState('')
  const [generatingAudioEn, setGeneratingAudioEn] = useState(false)
  const [audioErrorEn, setAudioErrorEn] = useState<string | null>(null)

  // Fetch ElevenLabs voices on mount/modal open from backend Cloud Function
  useEffect(() => {
    async function loadVoices() {
      if (availableVoices.length > 0) return

      try {
        setLoadingVoices(true)
        const data = await fetchElevenLabsVoices()
        if (data.voices && Array.isArray(data.voices)) {
          const formatted = data.voices.map((v: any) => ({
            id: v.voice_id,
            name: v.name,
            category: v.category
          }))
          setAvailableVoices(formatted)

          // If Capitán Turi is not in the list, set selected voice to the first one
          const turiExists = formatted.some((v: any) => v.id === 'PPzYpIqttlTYA83688JI')
          if (!turiExists && formatted.length > 0) {
            setSelectedVoice(formatted[0].id)
          }
        }
      } catch (err) {
        console.warn('Error fetching ElevenLabs voices from backend (using fallback list):', err)
      } finally {
        setLoadingVoices(false)
      }
    }

    if (showCreateModal || showEditModal) {
      loadVoices()
    }
  }, [showCreateModal, showEditModal, availableVoices.length])

  // Computed word count for narration
  const wordCount = formNarration.trim().split(/\s+/).filter(Boolean).length
  const wordCountEn = formNarrationEn.trim().split(/\s+/).filter(Boolean).length

  // Quiz Questions Form States (Stored locally during edit/create before commit)
  const [formQuestions, setFormQuestions] = useState<Omit<QuestionData, 'stopId'>[]>([])
  const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([])

  // Map Refs
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const autocompleteContainerRef = useRef<HTMLDivElement>(null)

  // Fetch stops and seasons on mount
  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const [stopsData, seasonsData] = await Promise.all([
        fetchStopsList(),
        fetchSeasons()
      ])
      setStops(stopsData)
      setSeasons(seasonsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  // Google Maps Loader Effect inside modal general info tab
  useEffect(() => {
    let active = true
    if ((showCreateModal || showEditModal) && activeTab === 'info' && mapRef.current) {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        setFormError('Falta la API Key de Google Maps (VITE_GOOGLE_MAPS_API_KEY).')
        return
      }

      if (!isGoogleMapsInitialized) {
        setOptions({
          key: apiKey,
          v: 'weekly',
        })
        isGoogleMapsInitialized = true
      }

      Promise.all([importLibrary('maps'), importLibrary('marker'), importLibrary('places')])
        .then(([{ Map }, { AdvancedMarkerElement }, placesLib]) => {
          if (!active || !mapRef.current) return
          const { PlaceAutocompleteElement } = placesLib as any

          const initialLatLng = {
            lat: formLat || 18.4735,
            lng: formLng || -69.8863
          }

          const map = new Map(mapRef.current, {
            center: initialLatLng,
            zoom: 16,
            mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || undefined,
            disableDefaultUI: false,
          })

          mapInstanceRef.current = map

          const marker = new AdvancedMarkerElement({
            map,
            position: initialLatLng,
            gmpDraggable: true,
          })

          markerRef.current = marker

          // Autocomplete for searching places (New API)
          if (autocompleteContainerRef.current) {
            const placeAutocomplete = new PlaceAutocompleteElement()
            placeAutocomplete.setAttribute('placeholder', 'Buscar dirección o lugar...')
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

            autocompleteContainerRef.current.innerHTML = ''
            autocompleteContainerRef.current.appendChild(placeAutocomplete)

            const handlePlaceSelect = async (place: any) => {
              if (!place) return
              try {
                await place.fetchFields({
                  fields: ['location']
                })
                const location = place.location
                if (location) {
                  const newLat = typeof location.lat === 'function' ? location.lat() : location.lat
                  const newLng = typeof location.lng === 'function' ? location.lng() : location.lng
                  setFormLat(newLat)
                  setFormLng(newLng)

                  const coords = { lat: newLat, lng: newLng }
                  marker.position = coords
                  map.panTo(coords)
                  map.setZoom(17)
                }
              } catch (err) {
                console.error("Error fetching place details:", err)
              }
            }

            placeAutocomplete.addEventListener('gmp-select', (e: any) => {
              const placePrediction = e.placePrediction || e.detail?.placePrediction || e.target?.placePrediction
              if (placePrediction) {
                const place = placePrediction.toPlace()
                handlePlaceSelect(place)
              } else {
                const place = e.target?.place || e.detail?.place || e.place
                if (place) handlePlaceSelect(place)
              }
            })

            placeAutocomplete.addEventListener('gmp-placeselect', (e: any) => {
              const placePrediction = e.placePrediction || e.detail?.placePrediction || e.target?.placePrediction
              if (placePrediction) {
                const place = placePrediction.toPlace()
                handlePlaceSelect(place)
              } else {
                const place = e.target?.place || e.detail?.place || e.place
                if (place) handlePlaceSelect(place)
              }
            })
          }

          // Click on map to update coords
          map.addListener('click', (e: any) => {
            if (e.latLng) {
              const newLat = e.latLng.lat()
              const newLng = e.latLng.lng()
              setFormLat(newLat)
              setFormLng(newLng)
              marker.position = e.latLng
            }
          })

          // Drag marker to update coords
          marker.addListener('dragend', () => {
            if (marker.position) {
              const latVal = typeof marker.position.lat === 'function' ? marker.position.lat() : marker.position.lat
              const lngVal = typeof marker.position.lng === 'function' ? marker.position.lng() : marker.position.lng
              setFormLat(latVal)
              setFormLng(lngVal)
            }
          })
        })
        .catch(err => {
          console.error("Error loading Google Maps in admin stops:", err)
        })
    }

    return () => {
      active = false
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }, [showCreateModal, showEditModal, activeTab])

  // Sync text coordinates changes back to Google Map
  const handleLatChange = (val: string) => {
    const num = parseFloat(val)
    if (!isNaN(num)) {
      setFormLat(num)
      if (markerRef.current) {
        markerRef.current.position = { lat: num, lng: formLng }
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo({ lat: num, lng: formLng })
      }
    } else {
      setFormLat(0)
    }
  }

  const handleLngChange = (val: string) => {
    const num = parseFloat(val)
    if (!isNaN(num)) {
      setFormLng(num)
      if (markerRef.current) {
        markerRef.current.position = { lat: formLat, lng: num }
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo({ lat: formLat, lng: num })
      }
    } else {
      setFormLng(0)
    }
  }

  // Filtered & Sorted Stops
  const processedStops = useMemo(() => {
    let result = [...stops]

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.narration.toLowerCase().includes(q)
      )
    }

    // Season filter — a stop belongs to a season if its seasonIds includes it
    if (seasonFilter) {
      result = result.filter(s => Array.isArray(s.seasonIds) ? s.seasonIds.includes(seasonFilter) : s.seasonId === seasonFilter)
    }

    // Stage filter
    if (stageFilter) {
      result = result.filter(s => s.stageId === stageFilter)
    }

    // Active status filter
    if (statusFilter === 'active') {
      result = result.filter(s => s.active === true)
    } else if (statusFilter === 'inactive') {
      result = result.filter(s => s.active === false)
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name)
      }
      if (sortBy === 'order-asc') {
        return a.order - b.order
      }
      if (sortBy === 'order-desc') {
        return b.order - a.order
      }
      return 0
    })

    return result
  }, [stops, search, seasonFilter, stageFilter, statusFilter, sortBy])

  // Pagination Bounds
  const totalPages = Math.ceil(processedStops.length / pageSize)
  const paginatedStops = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return processedStops.slice(start, start + pageSize)
  }, [processedStops, currentPage, pageSize])

  // Clear filters
  function handleClearFilters() {
    setSearch('')
    setSeasonFilter('')
    setStageFilter('')
    setStatusFilter('')
    setSortBy('name-asc')
    setCurrentPage(1)
  }

  // Open Create Stop modal
  function handleOpenCreate() {
    setFormName('')
    setFormNameEn('')
    setFormNarration('')
    setFormNarrationEn('')
    setFormImageUrl('')
    setFormAudioUrl('')
    setFormAudioUrlEn('')
    setFormLat(18.4735)
    setFormLng(-69.8863)
    setFormOrder(1)
    setFormSeasonIds(seasons.length > 0 ? [seasons[0].id] : [])
    setFormStageId('stage_1')
    setFormActive(true)
    setFormQuestions([])
    setDeletedQuestionIds([])
    setActiveTab('info')
    setFormError(null)
    setFormLoading(false)
    setShowCreateModal(true)
  }

  // Open Edit Stop modal
  async function handleOpenEdit(stop: StopData) {
    setSelectedStop(stop)
    setFormName(stop.name)
    setFormNameEn(stop.nameEn || '')
    setFormNarration(stop.narration)
    setFormNarrationEn(stop.narrationEn || '')
    setFormImageUrl(stop.imageUrl)
    setFormAudioUrl(stop.audioUrl || '')
    setFormAudioUrlEn(stop.audioUrlEn || '')
    setFormLat(stop.lat)
    setFormLng(stop.lng)
    setFormOrder(stop.order)
    // Normalize legacy seasonId to seasonIds array
    const existingSeasonIds: string[] = Array.isArray(stop.seasonIds) && stop.seasonIds.length > 0
      ? stop.seasonIds
      : stop.seasonId
        ? [stop.seasonId]
        : []
    setFormSeasonIds(existingSeasonIds)
    setFormStageId(stop.stageId)
    setFormActive(stop.active)
    setDeletedQuestionIds([])
    setActiveTab('info')
    setFormError(null)
    setFormLoading(true)
    setShowEditModal(true)

    try {
      // Load questions for the selected stop
      const qList = await fetchQuestionsForStop(stop.id)
      const formatted = qList.map(q => ({
        ...q,
        textEn: q.textEn || '',
        optionsEn: q.optionsEn && q.optionsEn.length === 4 ? q.optionsEn : ['', '', '', ''],
        explanationEn: q.explanationEn || ''
      }))
      setFormQuestions(formatted)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al cargar preguntas')
    } finally {
      setFormLoading(false)
    }
  }

  // Generate audio via ElevenLabs (calls backend Cloud Function)
  async function handleGenerateAudio() {
    setAudioError(null)
    if (!formNarration.trim()) {
      setAudioError('Por favor, escribe una narración primero.')
      return
    }

    const voiceId = selectedVoice === 'custom' ? customVoiceId.trim() : selectedVoice
    if (!voiceId) {
      setAudioError('Por favor, ingresa un Voice ID de ElevenLabs válido.')
      return
    }

    try {
      setGeneratingAudio(true)
      const result = await generateElevenLabsAudio(formNarration.trim(), voiceId.trim())
      setFormAudioUrl(result.downloadUrl)
    } catch (err: any) {
      console.error('ElevenLabs generation error:', err)
      
      // Parse detailed function/HTTPS errors if present
      let friendlyMessage = 'Error inesperado al generar el audio.'
      if (err instanceof Error) {
        friendlyMessage = err.message
      } else if (err && typeof err.message === 'string') {
        friendlyMessage = err.message
      }
      
      setAudioError(friendlyMessage)
    } finally {
      setGeneratingAudio(false)
    }
  }

  // Generate English audio via ElevenLabs (calls backend Cloud Function)
  async function handleGenerateAudioEn() {
    setAudioErrorEn(null)
    if (!formNarrationEn.trim()) {
      setAudioErrorEn('Por favor, escribe una narración en inglés primero.')
      return
    }

    const voiceId = selectedVoiceEn === 'custom' ? customVoiceIdEn.trim() : selectedVoiceEn
    if (!voiceId) {
      setAudioErrorEn('Por favor, ingresa un Voice ID de ElevenLabs válido.')
      return
    }

    try {
      setGeneratingAudioEn(true)
      const result = await generateElevenLabsAudio(formNarrationEn.trim(), voiceId.trim())
      setFormAudioUrlEn(result.downloadUrl)
    } catch (err: any) {
      console.error('ElevenLabs generation error (EN):', err)
      let friendlyMessage = 'Error inesperado al generar el audio en inglés.'
      if (err instanceof Error) {
        friendlyMessage = err.message
      } else if (err && typeof err.message === 'string') {
        friendlyMessage = err.message
      }
      setAudioErrorEn(friendlyMessage)
    } finally {
      setGeneratingAudioEn(false)
    }
  }

  // Submit Stop Form (Add or Edit)
  async function handleSubmit(e: FormEvent, isEdit: boolean) {
    e.preventDefault()
    setFormError(null)

    // Form Validations
    if (formSeasonIds.length === 0) {
      setFormError('Debes asignar la parada a al menos una temporada.')
      return
    }
    if (!formName.trim() || !formNameEn.trim()) {
      setFormError('El nombre de la parada es obligatorio en ambos idiomas.')
      return
    }
    if (wordCount > 500) {
      setFormError(t('stopsManagement.errNarrationLimit'))
      return
    }
    if (wordCountEn > 500) {
      setFormError('La narración en inglés supera el límite de 500 palabras.')
      return
    }
    if (!formLat || !formLng) {
      setFormError(t('stopsManagement.errCoordinates'))
      return
    }
    if (formQuestions.length === 0) {
      setFormError(t('stopsManagement.errNoQuestions'))
      return
    }

    // Validate Questions Inputs
    for (let i = 0; i < formQuestions.length; i++) {
      const q = formQuestions[i]
      if (!q.text.trim()) {
        setFormError(t('stopsManagement.errEmptyQuestionText', { num: i + 1 }))
        return
      }
      if (!q.textEn?.trim()) {
        setFormError(`Por favor, escribe el texto de la pregunta ${i + 1} en inglés.`)
        return
      }
      if (q.options.some(opt => !opt.trim())) {
        setFormError(t('stopsManagement.errEmptyOptions', { num: i + 1 }))
        return
      }
      const optsEn = q.optionsEn || ['', '', '', '']
      if (optsEn.some(opt => !opt.trim())) {
        setFormError(`Por favor, completa todas las opciones en inglés para la pregunta ${i + 1}.`)
        return
      }
    }

    try {
      setFormLoading(true)

      const stopPayload = {
        name: formName.trim(),
        nameEn: formNameEn.trim(),
        narration: formNarration.trim(),
        narrationEn: formNarrationEn.trim(),
        imageUrl: formImageUrl.trim(),
        audioUrl: formAudioUrl.trim(),
        audioUrlEn: formAudioUrlEn.trim(),
        lat: formLat,
        lng: formLng,
        order: Number(formOrder),
        seasonIds: formSeasonIds,
        stageId: formStageId,
        active: formActive
      }

      if (isEdit && selectedStop) {
        await updateStop(selectedStop.id, stopPayload, formQuestions as any, deletedQuestionIds)
        setShowEditModal(false)
      } else {
        await createStop(stopPayload, formQuestions as any)
        setShowCreateModal(false)
      }

      load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar la parada')
    } finally {
      setFormLoading(false)
    }
  }

  // Handle Delete Stop
  async function handleDelete(stop: StopData) {
    if (!window.confirm(t('stopsManagement.confirmDelete'))) {
      return
    }

    try {
      setFormLoading(true)
      await deleteStop(stop.id)
      load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar la parada')
    } finally {
      setFormLoading(false)
    }
  }

  // Questions List Local Actions
  function handleAddQuestion() {
    const newQuestion: Omit<QuestionData, 'id' | 'stopId'> = {
      text: '',
      textEn: '',
      options: ['', '', '', ''],
      optionsEn: ['', '', '', ''],
      correctIndex: 0,
      difficulty: 'easy',
      explanation: '',
      explanationEn: ''
    }
    setFormQuestions([...formQuestions, newQuestion as any])
  }

  function handleRemoveQuestion(idx: number) {
    const target = formQuestions[idx]
    if (target.id) {
      setDeletedQuestionIds([...deletedQuestionIds, target.id])
    }
    setFormQuestions(formQuestions.filter((_, i) => i !== idx))
  }

  function handleQuestionChange(idx: number, field: keyof Omit<QuestionData, 'id' | 'stopId'>, value: any) {
    const updated = [...formQuestions]
    updated[idx] = {
      ...updated[idx],
      [field]: value
    }
    setFormQuestions(updated)
  }

  function handleOptionChange(qIdx: number, optIdx: number, value: string) {
    const updated = [...formQuestions]
    const updatedOptions = [...updated[qIdx].options]
    updatedOptions[optIdx] = value
    updated[qIdx] = {
      ...updated[qIdx],
      options: updatedOptions
    }
    setFormQuestions(updated)
  }

  function handleOptionChangeEn(qIdx: number, optIdx: number, value: string) {
    const updated = [...formQuestions]
    const updatedOptions = [...(updated[qIdx].optionsEn || ['', '', '', ''])]
    updatedOptions[optIdx] = value
    updated[qIdx] = {
      ...updated[qIdx],
      optionsEn: updatedOptions
    }
    setFormQuestions(updated)
  }

  // Format Stage display label — handles any stageId format
  function getStageLabel(stageId: string) {
    // Try to match stage_N pattern first
    const match = stageId.match(/stage_(\d+)/)
    if (match) return `Etapa ${match[1]}`
    // Try to find in loaded seasons
    for (const s of seasons) {
      const found = s.stages?.find(st => st.id === stageId)
      if (found) return `Etapa ${found.number}`
    }
    return stageId
  }

  // Compute unique stages available across all loaded seasons (for filter dropdown)
  const availableStageOptions = useMemo(() => {
    const seen = new Set<string>()
    const result: { id: string; label: string; number: number }[] = []
    for (const s of seasons) {
      for (const stage of (s.stages || [])) {
        if (!seen.has(stage.id)) {
          seen.add(stage.id)
          result.push({ id: stage.id, label: `Etapa ${stage.number}`, number: stage.number })
        }
      }
    }
    result.sort((a, b) => a.number - b.number)
    return result
  }, [seasons])

  // Compute stages for the currently selected season(s) in the form
  const formAvailableStages = useMemo(() => {
    const seen = new Set<string>()
    const result: { id: string; label: string; number: number }[] = []
    for (const sid of formSeasonIds) {
      const season = seasons.find(s => s.id === sid)
      for (const stage of (season?.stages || [])) {
        if (!seen.has(stage.id)) {
          seen.add(stage.id)
          result.push({ id: stage.id, label: `Etapa ${stage.number}`, number: stage.number })
        }
      }
    }
    result.sort((a, b) => a.number - b.number)
    return result
  }, [formSeasonIds, seasons])

  // Resolve audio storage URLs to the local emulator when running in development
  function resolveAudioUrl(url: string) {
    if (!url) return ''
    const isLocal = window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.') ||
      window.location.hostname.startsWith('10.')
    if (isLocal && url.startsWith('https://firebasestorage.googleapis.com')) {
      return url.replace('https://firebasestorage.googleapis.com', `http://${window.location.hostname}:9199`)
    }
    return url
  }

  return (
    <div style={{ animation: 'fade-in 0.3s ease-out' }}>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 28, margin: '0 0 4px' }}>
            {t('stopsManagement.title')}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
            {t('stopsManagement.subtitle')}
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
              {t('stopsManagement.totalStops')}
            </span>
            <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--color-navy)' }}>
              {stops.length}
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
            <i className="ri-map-pin-add-line" style={{ fontSize: 16 }} />
            {t('stopsManagement.btnCreate')}
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
        <div style={{ flex: '2 1 240px', position: 'relative' }}>
          <i className="ri-search-line" style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-gray-mid)', fontSize: 16
          }} />
          <input
            type="text"
            placeholder={t('stopsManagement.searchPlaceholder')}
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

        {/* Season Filter */}
        <div style={{ flex: '1 1 180px' }}>
          <select
            value={seasonFilter}
            onChange={e => {
              setSeasonFilter(e.target.value)
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
            <option value="">{t('stopsManagement.filterSeason')}</option>
            {seasons.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Stage Filter */}
        <div style={{ flex: '1 1 150px' }}>
          <select
            value={stageFilter}
            onChange={e => {
              setStageFilter(e.target.value)
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
            <option value="">{t('stopsManagement.filterStage')}</option>
            {availableStageOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ flex: '1 1 150px' }}>
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
            <option value="">{t('stopsManagement.filterStatus')}</option>
            <option value="active">{t('stopsManagement.statusActive')}</option>
            <option value="inactive">{t('stopsManagement.statusInactive')}</option>
          </select>
        </div>

        {/* Sort By */}
        <div style={{ flex: '1 1 160px' }}>
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
            <option value="order-asc">Orden en Etapa</option>
            <option value="order-desc">Orden Descendente</option>
          </select>
        </div>

        {/* Clear Filters */}
        {(search || seasonFilter || stageFilter || statusFilter || sortBy !== 'name-asc') && (
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

      {/* Table view */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                border: '4px solid rgba(27,43,110,0.1)',
                borderTopColor: 'var(--color-yellow)',
                animation: 'spin-circle 0.8s linear infinite'
              }} />
              <div style={{ color: 'var(--color-navy)', fontWeight: 700, fontSize: 15 }}>Cargando paradas...</div>
            </div>
          </div>
        ) : error ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-error)' }}>
            <i className="ri-error-warning-line" style={{ fontSize: 44, display: 'block', marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: 18 }}>Error al cargar</h3>
            <p style={{ margin: 0, fontSize: 14 }}>{error}</p>
          </div>
        ) : processedStops.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <i className="ri-map-pin-line" style={{ fontSize: 48, color: 'var(--color-gray-mid)', display: 'block', marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 6px', color: 'var(--color-navy)', fontFamily: 'var(--font-display)', fontSize: 18 }}>
              No se encontraron paradas
            </h3>
            <p style={{ margin: '0 0 16px', color: 'var(--color-text-muted)', fontSize: 14 }}>
              Agrega una nueva parada o cambia las opciones del filtro.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8f9fb', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('stopsManagement.colName')}
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('stopsManagement.colCoordinates')}
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('stopsManagement.colSeasonStage')}
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('stopsManagement.colOrder')}
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('stopsManagement.colStatus')}
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 800, color: 'var(--color-gray-dark)', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>
                    {t('stopsManagement.colActions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedStops.map((stop, idx) => {
                  const seasonIds: string[] = Array.isArray(stop.seasonIds) && stop.seasonIds.length > 0
                    ? stop.seasonIds
                    : stop.seasonId
                      ? [stop.seasonId]
                      : []
                  const seasonNames = seasonIds
                    .map(sid => seasons.find(s => s.id === sid)?.name || sid)
                  return (
                    <tr
                      key={stop.id}
                      style={{
                        borderBottom: idx === paginatedStops.length - 1 ? 'none' : '1px solid var(--color-border)',
                        transition: 'background 150ms ease'
                      }}
                      className="table-row-hover"
                    >
                      {/* Name with Image preview */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {stop.imageUrl ? (
                            <img
                              src={stop.imageUrl}
                              alt={stop.name}
                              style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--color-border)', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{
                              width: 44, height: 44, borderRadius: 8,
                              background: 'rgba(27,43,110,0.06)', border: '1px solid var(--color-border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                              <i className="ri-map-pin-2-line" style={{ color: 'var(--color-navy)', fontSize: 20 }} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: 14 }}>
                              {stop.name}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {stop.narration}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Coordinates */}
                      <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--color-text)', fontFamily: 'monospace' }}>
                        {stop.lat.toFixed(6)}, {stop.lng.toFixed(6)}
                      </td>

                      {/* Season(s) / Stage */}
                      <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--color-text)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                          {seasonNames.length === 0 ? (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>—</span>
                          ) : seasonNames.map((name, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                                background: 'rgba(27,43,110,0.08)', color: 'var(--color-navy)'
                              }}
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{getStageLabel(stop.stageId)}</div>
                      </td>

                      {/* Order */}
                      <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                        #{stop.order}
                      </td>

                      {/* Status badge */}
                      <td style={{ padding: '14px 20px' }}>
                        {stop.active ? (
                          <span style={{
                            background: 'rgba(60,173,66,0.1)', color: 'var(--color-green)',
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800
                          }}>
                            {t('stopsManagement.statusActive')}
                          </span>
                        ) : (
                          <span style={{
                            background: 'rgba(160,168,184,0.15)', color: 'var(--color-gray-dark)',
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800
                          }}>
                            {t('stopsManagement.statusInactive')}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenEdit(stop)}
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
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(stop)}
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
                            Eliminar
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
        {!loading && !error && processedStops.length > 0 && (
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
                Mostrando {Math.min((currentPage - 1) * pageSize + 1, processedStops.length)} - {Math.min(currentPage * pageSize, processedStops.length)} de {processedStops.length} registros
              </span>
            </div>

            {/* Navigation Buttons */}
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

      {/* ── CREATE / EDIT MODAL ─────────────────── */}
      {(showCreateModal || showEditModal) && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(13,21,38,0.5)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100, padding: 16
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 16,
            width: '100%', maxWidth: 720, boxShadow: 'var(--shadow-pop)',
            maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: 0 }}>
                {showCreateModal ? t('stopsManagement.modalCreateTitle') : t('stopsManagement.modalEditTitle')}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setShowEditModal(false)
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-mid)', padding: 4 }}
              >
                <i className="ri-close-line" style={{ fontSize: 20 }} />
              </button>
            </div>

            {/* Tabs Selector */}
            <div style={{ display: 'flex', background: '#f8f9fb', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                style={{
                  flex: 1, padding: '14px 20px', border: 'none', background: 'none',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  color: activeTab === 'info' ? 'var(--color-navy)' : 'var(--color-gray-mid)',
                  borderBottom: activeTab === 'info' ? '3px solid var(--color-navy)' : '3px solid transparent',
                  transition: 'all 150ms ease'
                }}
              >
                <i className="ri-information-line" style={{ marginRight: 6 }} />
                {t('stopsManagement.tabInfo')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('questions')}
                style={{
                  flex: 1, padding: '14px 20px', border: 'none', background: 'none',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  color: activeTab === 'questions' ? 'var(--color-navy)' : 'var(--color-gray-mid)',
                  borderBottom: activeTab === 'questions' ? '3px solid var(--color-navy)' : '3px solid transparent',
                  transition: 'all 150ms ease'
                }}
              >
                <i className="ri-questionnaire-line" style={{ marginRight: 6 }} />
                {t('stopsManagement.tabQuestions')} ({formQuestions.length})
              </button>
            </div>

            <form onSubmit={e => handleSubmit(e, showEditModal)} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

              {/* Form Content body */}
              <div style={{ padding: 24, flex: 1 }}>

                {/* Form Error alert */}
                {formError && (
                  <div style={{ background: 'rgba(230,51,41,0.08)', color: 'var(--color-red)', padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                    <i className="ri-error-warning-line" style={{ marginRight: 6 }} />
                    {formError}
                  </div>
                )}

                {/* Seasons Empty Alert */}
                {seasons.length === 0 && (
                  <div style={{ background: 'rgba(245,158,11,0.08)', color: '#d97706', padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16, border: '1px solid rgba(245,158,11,0.2)' }}>
                    <i className="ri-alert-line" style={{ marginRight: 6 }} />
                    No hay temporadas registradas. Por favor, crea una temporada en el módulo de Temporadas primero para poder crear una parada.
                  </div>
                )}

                {/* Info Tab */}
                {activeTab === 'info' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Name Spanish / English */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                          {t('stopsManagement.formName')} (Español)
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                          Nombre de Parada (Inglés)
                        </label>
                        <input
                          type="text"
                          required
                          value={formNameEn}
                          onChange={e => setFormNameEn(e.target.value)}
                          style={{
                            height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                            padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none'
                          }}
                        />
                      </div>
                    </div>

                    {/* Image Upload */}
                    <ImageUpload
                      value={formImageUrl}
                      onChange={setFormImageUrl}
                      storagePath="stops"
                      label={t('stopsManagement.formImageUrl')}
                    />

                    {/* Spanish Narration Block */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid var(--color-border)', borderRadius: 12, padding: 16, background: '#fcfdfe' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy)' }}>
                          Narración en Español
                        </label>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: wordCount > 500 ? 'var(--color-red)' : 'var(--color-text-muted)'
                        }}>
                          {wordCount} / 500 palabras
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        required
                        value={formNarration}
                        onChange={e => setFormNarration(e.target.value)}
                        style={{
                          borderRadius: 8,
                          border: `1.5px solid ${wordCount > 500 ? 'var(--color-red)' : 'var(--color-border)'}`,
                          padding: '10px 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical', background: '#fff'
                        }}
                      />

                      {/* ElevenLabs Spanish Audio Generation Section */}
                      <div style={{
                        marginTop: 4,
                        padding: 12,
                        borderRadius: 8,
                        background: 'rgba(27,43,110,0.02)',
                        border: '1px dashed var(--color-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <i className="ri-voiceprint-line" style={{ fontSize: 18, color: 'var(--color-navy)' }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy)' }}>
                            Generar Audio (Español)
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          {/* Voice Selector */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                              Seleccionar Voz
                            </label>
                            <select
                              value={selectedVoice}
                              onChange={e => setSelectedVoice(e.target.value)}
                              style={{
                                height: 32, borderRadius: 6, border: '1px solid var(--color-border)',
                                padding: '0 8px', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer', background: '#fff'
                              }}
                            >
                              {loadingVoices ? (
                                <option disabled>Cargando voces...</option>
                              ) : availableVoices.length > 0 ? (
                                <>
                                  {availableVoices.map(v => (
                                    <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
                                  ))}
                                  <option value="custom">Otro (Ingresar Voice ID)</option>
                                </>
                              ) : (
                                <>
                                  <option value="PPzYpIqttlTYA83688JI">Capitán Turi (Recomendado)</option>
                                  <option value="ErXwobaYiN019PkySvjV">Narrador Antoni (Profundo)</option>
                                  <option value="21m00Tcm4TlvDq8ikWAM">Narradora Rachel (Femenina)</option>
                                  <option value="JBFqnCBcaCvXMip5zpqz">Narrador George (Cálido)</option>
                                  <option value="custom">Otro (Ingresar Voice ID)</option>
                                </>
                              )}
                            </select>
                          </div>

                          {/* Custom Voice ID */}
                          {selectedVoice === 'custom' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                                Voice ID Personalizado
                              </label>
                              <input
                                type="text"
                                placeholder="Ej: 2EiwWnXF... "
                                value={customVoiceId}
                                onChange={e => setCustomVoiceId(e.target.value)}
                                style={{
                                  height: 32, borderRadius: 6, border: '1px solid var(--color-border)',
                                  padding: '0 10px', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', background: '#fff'
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <button
                          type="button"
                          onClick={handleGenerateAudio}
                          disabled={generatingAudio || !formNarration.trim()}
                          style={{
                            height: 32,
                            borderRadius: 6,
                            background: generatingAudio ? 'var(--color-gray-mid)' : 'var(--color-navy)',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 700,
                            border: 'none',
                            cursor: generatingAudio ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          {generatingAudio ? (
                            <>
                              <div style={{
                                width: 12, height: 12, borderRadius: '50%',
                                border: '2px solid rgba(255,255,255,0.2)',
                                borderTopColor: '#fff',
                                animation: 'spin-circle 0.8s linear infinite'
                              }} />
                              Generando Audio...
                            </>
                          ) : (
                            <>
                              <i className="ri-mic-line" />
                              Generar Audio Español
                            </>
                          )}
                        </button>

                        {/* Audio Error display */}
                        {audioError && (
                          <div style={{ fontSize: 11, color: 'var(--color-red)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <i className="ri-error-warning-line" />
                            <span>{audioError}</span>
                          </div>
                        )}

                        {/* Generated Audio Player */}
                        {formAudioUrl && (
                          <div style={{
                            padding: 8,
                            borderRadius: 6,
                            background: '#fff',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4
                          }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-teal)' }}>
                              <i className="ri-checkbox-circle-line" /> Audio español listo
                            </span>
                            <audio key={formAudioUrl} src={resolveAudioUrl(formAudioUrl)} controls style={{ width: '100%', height: 32 }} />
                            <button
                              type="button"
                              onClick={() => setFormAudioUrl('')}
                              style={{
                                alignSelf: 'flex-end',
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-red)',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              Eliminar Audio Español
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* English Narration Block */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid var(--color-border)', borderRadius: 12, padding: 16, background: '#fcfdfe' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy)' }}>
                          Narración en Inglés
                        </label>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: wordCountEn > 500 ? 'var(--color-red)' : 'var(--color-text-muted)'
                        }}>
                          {wordCountEn} / 500 palabras
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        required
                        value={formNarrationEn}
                        onChange={e => setFormNarrationEn(e.target.value)}
                        style={{
                          borderRadius: 8,
                          border: `1.5px solid ${wordCountEn > 500 ? 'var(--color-red)' : 'var(--color-border)'}`,
                          padding: '10px 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical', background: '#fff'
                        }}
                      />

                      {/* ElevenLabs English Audio Generation Section */}
                      <div style={{
                        marginTop: 4,
                        padding: 12,
                        borderRadius: 8,
                        background: 'rgba(27,43,110,0.02)',
                        border: '1px dashed var(--color-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <i className="ri-voiceprint-line" style={{ fontSize: 18, color: 'var(--color-navy)' }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy)' }}>
                            Generar Audio (Inglés)
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          {/* Voice Selector */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                              Seleccionar Voz
                            </label>
                            <select
                              value={selectedVoiceEn}
                              onChange={e => setSelectedVoiceEn(e.target.value)}
                              style={{
                                height: 32, borderRadius: 6, border: '1px solid var(--color-border)',
                                padding: '0 8px', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer', background: '#fff'
                              }}
                            >
                              {loadingVoices ? (
                                <option disabled>Cargando voces...</option>
                              ) : availableVoices.length > 0 ? (
                                <>
                                  {availableVoices.map(v => (
                                    <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
                                  ))}
                                  <option value="custom">Otro (Ingresar Voice ID)</option>
                                </>
                              ) : (
                                <>
                                  <option value="PPzYpIqttlTYA83688JI">Capitán Turi (Recomendado)</option>
                                  <option value="ErXwobaYiN019PkySvjV">Narrador Antoni (Profundo)</option>
                                  <option value="21m00Tcm4TlvDq8ikWAM">Narradora Rachel (Femenina)</option>
                                  <option value="JBFqnCBcaCvXMip5zpqz">Narrador George (Cálido)</option>
                                  <option value="custom">Otro (Ingresar Voice ID)</option>
                                </>
                              )}
                            </select>
                          </div>

                          {/* Custom Voice ID */}
                          {selectedVoiceEn === 'custom' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                                Voice ID Personalizado
                              </label>
                              <input
                                type="text"
                                placeholder="Ej: 2EiwWnXF... "
                                value={customVoiceIdEn}
                                onChange={e => setCustomVoiceIdEn(e.target.value)}
                                style={{
                                  height: 32, borderRadius: 6, border: '1px solid var(--color-border)',
                                  padding: '0 10px', fontSize: 12, fontFamily: 'var(--font-body)', outline: 'none', background: '#fff'
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <button
                          type="button"
                          onClick={handleGenerateAudioEn}
                          disabled={generatingAudioEn || !formNarrationEn.trim()}
                          style={{
                            height: 32,
                            borderRadius: 6,
                            background: generatingAudioEn ? 'var(--color-gray-mid)' : 'var(--color-navy)',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 700,
                            border: 'none',
                            cursor: generatingAudioEn ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          {generatingAudioEn ? (
                            <>
                              <div style={{
                                width: 12, height: 12, borderRadius: '50%',
                                border: '2px solid rgba(255,255,255,0.2)',
                                borderTopColor: '#fff',
                                animation: 'spin-circle 0.8s linear infinite'
                              }} />
                              Generando Audio Inglés...
                            </>
                          ) : (
                            <>
                              <i className="ri-mic-line" />
                              Generar Audio Inglés
                            </>
                          )}
                        </button>

                        {/* Audio Error display */}
                        {audioErrorEn && (
                          <div style={{ fontSize: 11, color: 'var(--color-red)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <i className="ri-error-warning-line" />
                            <span>{audioErrorEn}</span>
                          </div>
                        )}

                        {/* Generated Audio Player */}
                        {formAudioUrlEn && (
                          <div style={{
                            padding: 8,
                            borderRadius: 6,
                            background: '#fff',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4
                          }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-teal)' }}>
                              <i className="ri-checkbox-circle-line" /> Audio inglés listo
                            </span>
                            <audio key={formAudioUrlEn} src={resolveAudioUrl(formAudioUrlEn)} controls style={{ width: '100%', height: 32 }} />
                            <button
                              type="button"
                              onClick={() => setFormAudioUrlEn('')}
                              style={{
                                alignSelf: 'flex-end',
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-red)',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              Eliminar Audio Inglés
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                      {/* Season — multi-select checkboxes */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                          {t('stopsManagement.formSeason')} <span style={{ color: 'var(--color-error)', fontWeight: 400, fontSize: 11 }}>(selecciona una o más)</span>
                        </label>
                        {seasons.length === 0 ? (
                          <div style={{
                            padding: '10px 14px', borderRadius: 8, background: 'rgba(230,51,41,0.06)',
                            border: '1.5px solid rgba(230,51,41,0.25)', fontSize: 13, color: 'var(--color-error)'
                          }}>
                            ⚠️ No hay temporadas disponibles. Crea una temporada primero.
                          </div>
                        ) : (
                          <div style={{
                            border: '1.5px solid var(--color-border)', borderRadius: 8,
                            maxHeight: 140, overflowY: 'auto', padding: '6px 2px'
                          }}>
                            {seasons.map(s => {
                              const checked = formSeasonIds.includes(s.id)
                              return (
                                <label
                                  key={s.id}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '7px 14px', cursor: 'pointer', borderRadius: 6,
                                    background: checked ? 'rgba(27,43,110,0.06)' : 'transparent',
                                    transition: 'background 120ms ease'
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        setFormSeasonIds([...formSeasonIds, s.id])
                                      } else {
                                        setFormSeasonIds(formSeasonIds.filter(id => id !== s.id))
                                      }
                                    }}
                                    style={{ width: 15, height: 15, accentColor: 'var(--color-navy)', cursor: 'pointer' }}
                                  />
                                  <span style={{ fontSize: 13, fontWeight: checked ? 700 : 400, color: checked ? 'var(--color-navy)' : 'var(--color-text)' }}>
                                    {s.name}
                                    {s.status === 'active' && (
                                      <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: 'var(--color-green)', background: 'rgba(60,173,66,0.1)', padding: '1px 6px', borderRadius: 10 }}>
                                        ACTIVA
                                      </span>
                                    )}
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* Stage */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                          {t('stopsManagement.formStage')}
                        </label>
                        <select
                          value={formStageId}
                          onChange={e => setFormStageId(e.target.value)}
                          style={{
                            height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                            padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer'
                          }}
                        >
                          {formAvailableStages.length === 0 ? (
                            <option value="">— selecciona temporada primero —</option>
                          ) : (
                            formAvailableStages.map(opt => (
                              <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* Order */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                          {t('stopsManagement.formOrder')}
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={formOrder}
                          onChange={e => setFormOrder(Number(e.target.value))}
                          style={{
                            height: 40, borderRadius: 8, border: '1.5px solid var(--color-border)',
                            padding: '0 12px', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none'
                          }}
                        />
                      </div>
                    </div>

                    {/* Google Maps Container Picker */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                        Ubicación geográfica en el mapa
                      </label>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                        {t('stopsManagement.mapInstruction')}
                      </div>

                      {/* Search Autocomplete input placed naturally above the map */}
                      <div
                        ref={autocompleteContainerRef}
                        style={{
                          width: '100%',
                          minHeight: 38,
                          boxSizing: 'border-box',
                          marginBottom: 4
                        }}
                      />

                      <div style={{ position: 'relative' }}>
                        <div
                          ref={mapRef}
                          style={{
                            height: 250,
                            width: '100%',
                            borderRadius: 8,
                            border: '1.5px solid var(--color-border)',
                            background: '#eef0f4'
                          }}
                        />
                      </div>

                      {/* Numeric fields synced with map marker */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                            {t('stopsManagement.formLatitude')}
                          </span>
                          <input
                            type="number"
                            step="0.000001"
                            required
                            value={formLat}
                            onChange={e => handleLatChange(e.target.value)}
                            style={{
                              height: 36, borderRadius: 6, border: '1px solid var(--color-border)',
                              padding: '0 10px', fontSize: 13, fontFamily: 'monospace', outline: 'none'
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                            {t('stopsManagement.formLongitude')}
                          </span>
                          <input
                            type="number"
                            step="0.000001"
                            required
                            value={formLng}
                            onChange={e => handleLngChange(e.target.value)}
                            style={{
                              height: 36, borderRadius: 6, border: '1px solid var(--color-border)',
                              padding: '0 10px', fontSize: 13, fontFamily: 'monospace', outline: 'none'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Active toggle */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 8 }}>
                      <input
                        type="checkbox"
                        checked={formActive}
                        onChange={e => setFormActive(e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: 'var(--color-navy)', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                        {t('stopsManagement.formActive')}
                      </span>
                    </label>
                  </div>
                )}

                {/* Questions Tab */}
                {activeTab === 'questions' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Add Question Button */}
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      style={{
                        padding: '10px 16px', borderRadius: 8,
                        background: 'rgba(27,43,110,0.06)', border: '1px dashed var(--color-navy)',
                        color: 'var(--color-navy)', fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'all 150ms ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(27,43,110,0.1)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(27,43,110,0.06)'
                      }}
                    >
                      <i className="ri-add-circle-line" />
                      {t('stopsManagement.btnQuestionAdd')}
                    </button>

                    {/* Questions cards list */}
                    {formQuestions.length === 0 ? (
                      <div style={{ padding: '30px 16px', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: 12 }}>
                        <i className="ri-questionnaire-line" style={{ fontSize: 32, color: 'var(--color-gray-mid)', display: 'block', marginBottom: 8 }} />
                        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                          No hay preguntas agregadas a esta parada. Haz clic en "Agregar Pregunta" para crear una.
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {formQuestions.map((q, qIdx) => (
                          <div
                            key={qIdx}
                            style={{
                              background: '#f8f9fb', borderRadius: 12, border: '1px solid var(--color-border)',
                              padding: 16, position: 'relative'
                            }}
                          >
                            {/* Question Title & Remove */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--color-navy)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {t('stopsManagement.questionNum', { num: qIdx + 1 })}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveQuestion(qIdx)}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  color: 'var(--color-red)', fontSize: 12, fontWeight: 700,
                                  display: 'flex', alignItems: 'center', gap: 4
                                }}
                              >
                                <i className="ri-delete-bin-6-line" />
                                {t('stopsManagement.btnQuestionRemove')}
                              </button>
                            </div>

                            {/* Inputs row: Text & Difficulty */}
                            <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                              <div style={{ flex: '2 1 280px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                                  {t('stopsManagement.qText')} (Español)
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={q.text}
                                  onChange={e => handleQuestionChange(qIdx, 'text', e.target.value)}
                                  style={{
                                    height: 36, borderRadius: 6, border: '1px solid var(--color-border)',
                                    padding: '0 10px', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
                                    background: '#fff'
                                  }}
                                />
                              </div>

                              <div style={{ flex: '2 1 280px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                                  Pregunta (Inglés)
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={q.textEn || ''}
                                  onChange={e => handleQuestionChange(qIdx, 'textEn', e.target.value)}
                                  style={{
                                    height: 36, borderRadius: 6, border: '1px solid var(--color-border)',
                                    padding: '0 10px', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
                                    background: '#fff'
                                  }}
                                />
                              </div>

                              <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                                  {t('stopsManagement.qDifficulty')}
                                </label>
                                <select
                                  value={q.difficulty}
                                  onChange={e => handleQuestionChange(qIdx, 'difficulty', e.target.value)}
                                  style={{
                                    height: 36, borderRadius: 6, border: '1px solid var(--color-border)',
                                    padding: '0 8px', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
                                    background: '#fff', cursor: 'pointer'
                                  }}
                                >
                                  <option value="easy">{t('stopsManagement.qDiffEasy')}</option>
                                  <option value="medium">{t('stopsManagement.qDiffMedium')}</option>
                                  <option value="hard">{t('stopsManagement.qDiffHard')}</option>
                                </select>
                              </div>
                            </div>

                            {/* Options fields */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                              {/* Opciones en Español */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-navy)', textTransform: 'uppercase' }}>Opciones en Español</div>
                                {q.options.map((opt, optIdx) => (
                                  <div key={optIdx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                      <span>Opción {String.fromCharCode(65 + optIdx)}</span>
                                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontWeight: 600, color: q.correctIndex === optIdx ? 'var(--color-green)' : 'var(--color-text-muted)' }}>
                                        <input
                                          type="radio"
                                          name={`q-correct-${qIdx}`}
                                          checked={q.correctIndex === optIdx}
                                          onChange={() => handleQuestionChange(qIdx, 'correctIndex', optIdx)}
                                          style={{ accentColor: 'var(--color-green)', cursor: 'pointer' }}
                                        />
                                        <span>Correcta</span>
                                      </label>
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      value={opt}
                                      onChange={e => handleOptionChange(qIdx, optIdx, e.target.value)}
                                      style={{
                                        height: 34, borderRadius: 6, border: '1px solid var(--color-border)',
                                        padding: '0 8px', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
                                        background: '#fff'
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>

                              {/* Opciones en Inglés */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-navy)', textTransform: 'uppercase' }}>Opciones en Inglés</div>
                                {Array.from({ length: 4 }).map((_, optIdx) => {
                                  const optEn = q.optionsEn ? q.optionsEn[optIdx] : ''
                                  return (
                                    <div key={optIdx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                                        Opción {String.fromCharCode(65 + optIdx)} (Inglés)
                                      </label>
                                      <input
                                        type="text"
                                        required
                                        value={optEn || ''}
                                        onChange={e => handleOptionChangeEn(qIdx, optIdx, e.target.value)}
                                        style={{
                                          height: 34, borderRadius: 6, border: '1px solid var(--color-border)',
                                          padding: '0 8px', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
                                          background: '#fff'
                                        }}
                                      />
                                    </div>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Explanation fields */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                                  {t('stopsManagement.qExplanation')} (Español)
                                </label>
                                <textarea
                                  rows={2}
                                  value={q.explanation}
                                  onChange={e => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                                  style={{
                                    borderRadius: 6, border: '1px solid var(--color-border)',
                                    padding: '8px 10px', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
                                    background: '#fff', resize: 'vertical'
                                  }}
                                />
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                                  Explicación (Inglés)
                                </label>
                                <textarea
                                  rows={2}
                                  value={q.explanationEn || ''}
                                  onChange={e => handleQuestionChange(qIdx, 'explanationEn', e.target.value)}
                                  style={{
                                    borderRadius: 6, border: '1px solid var(--color-border)',
                                    padding: '8px 10px', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
                                    background: '#fff', resize: 'vertical'
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Modal Actions Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 12, background: '#f8f9fb', flexShrink: 0 }}>
                <button
                  type="button"
                  disabled={formLoading}
                  onClick={() => {
                    setShowCreateModal(false)
                    setShowEditModal(false)
                  }}
                  style={{
                    height: 38, padding: '0 16px', borderRadius: 8,
                    border: '1px solid var(--color-border)', background: '#fff',
                    color: 'var(--color-text)', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {t('prizeManagement.btnCancel')}
                </button>
                <button
                  type="submit"
                  disabled={formLoading || seasons.length === 0}
                  style={{
                    height: 38, padding: '0 24px', borderRadius: 8,
                    border: 'none', background: seasons.length === 0 ? 'var(--color-gray-mid)' : 'var(--color-navy)',
                    color: '#fff', fontSize: 13, fontWeight: 700,
                    cursor: (formLoading || seasons.length === 0) ? 'not-allowed' : 'pointer',
                    boxShadow: seasons.length === 0 ? 'none' : '0 4px 10px rgba(27,43,110,0.2)',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  {formLoading && (
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.2)',
                      borderTopColor: '#fff',
                      animation: 'spin-circle 0.8s linear infinite'
                    }} />
                  )}
                  {formLoading ? t('prizeManagement.btnSaving') : t('prizeManagement.btnSave')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Global CSS spinner keyframe animation */}
      <style>{`
        @keyframes spin-circle {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .table-row-hover:hover {
          background-color: rgba(27,43,110,0.02) !important;
        }
      `}</style>
    </div>
  )
}
