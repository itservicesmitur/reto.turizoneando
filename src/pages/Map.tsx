import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { haversineM } from '../features/map/utils/geo'
import { VALIDATION_RADIUS_DEFAULT_M } from '../config/constants'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import MapBoard, { type MapBoardHandle, type RouteInfo } from '../features/map/MapBoard'
import LocationGate from '../features/map/LocationGate'
import type { Monumento } from '../features/map/types/map.types'
import { collection, getDocs, query, where, doc, onSnapshot } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { auth, db } from '../config/firebase'
import { getStopWithQuestions, fetchMyPlayerStatus, type StopData, type QuestionData } from '../services/adminService'
import type { QuizQuestion, ClaimedPrize } from '../features/map/types/quiz.types'
import QuizCard from '../features/map/quiz/QuizCard'
import HistoryCard from '../features/map/quiz/HistoryCard'
import RouletteCard from '../features/map/quiz/RouletteCard'
import PrizeCard from '../features/map/quiz/PrizeCard'
import LevelUpCard from '../features/map/quiz/LevelUpCard'
import Ranking from '../features/map/quiz/Ranking'
import EditProfile from '../features/map/menu/EditProfile'
import ChangePassword from '../features/map/menu/ChangePassword'
import Progress from '../features/map/menu/Progress'
import MyPrizes from '../features/map/menu/MyPrizes'
import RallyRules from '../features/map/menu/RallyRules'
import PrivacyTerms from '../features/map/menu/PrivacyTerms'
import AboutApp from '../features/map/menu/AboutApp'
import { useRealtimeStatus } from '../features/map/middleware/useRealtimeStatus'
import StatusBlockCard from '../components/StatusBlockCard'
import FeatureTour from '../components/FeatureTour'
import '../features/map/quiz/quiz.css'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

function stopToMonumento(stop: StopData): Monumento {
  return {
    nombre: stop.name,
    lat: stop.lat,
    lng: stop.lng,
    icono: '⚓',
    imagen: stop.imageUrl || '',
    categoria: '',
    horario: '',
    abiertoInfo: '',
    esGratis: false,
    costo: '',
    rating: 0,
    reviews: 0,
    descripcion: stop.narration,
    stopId: stop.id,
  }
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const STAGE_BTN_TRANSITION = {
  transition: 'width 0.3s cubic-bezier(0.34,1.56,0.64,1), padding 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, transform 0.15s ease',
}

type StageStatus = 'done' | 'active' | 'locked'

type MenuView =
  | 'main' | 'ranking'
  | 'edit_profile' | 'change_password'
  | 'progress' | 'my_prizes'
  | 'rally_rules' | 'privacy' | 'about'

type QuizStopData = {
  stopId: string
  narration: string
  audioUrl?: string
  questions: QuizQuestion[]
}

type QuizStep =
  | { step: 'idle' }
  | { step: 'history';     stopIndex: number; monument: Monumento; quizData: QuizStopData }
  | { step: 'quiz';        stopIndex: number; monument: Monumento; quizData: QuizStopData; retryCount: number }
  | { step: 'quiz_failed'; stopIndex: number; monument: Monumento; quizData: QuizStopData; retryCount: number }
  | { step: 'roulette';    stopIndex: number; monument: Monumento; showRanking: boolean; stageId: string; prizeId: string }
  | { step: 'prize';       stopIndex: number; monument: Monumento; showRanking: boolean; claimedPrize: ClaimedPrize }
  | { step: 'levelup';     stopIndex: number; monument: Monumento; earnedPoints: number; mode: 'complete' | 'partial'; quizData: QuizStopData; retryCount: number }
  | { step: 'ranking_end'; stopIndex: number }

export default function Map() {
  const navigate = useNavigate()
  const [locationGranted, setLocationGranted] = useState(false)
  const [locationDenied, setLocationDenied] = useState(false)
  const [showLocationGate, setShowLocationGate] = useState(false)
  const [locationToggleMsg, setLocationToggleMsg] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [menuView, setMenuView] = useState<MenuView>('main')
  const [menuBtnAnimating, setMenuBtnAnimating] = useState(false)

  // ── Geolocation: initial check (runs once on mount, controls LocationGate modal) ──
  useEffect(() => {
    if (!navigator.geolocation) { setLocationGranted(true); return }

    // Solo code 1 (PERMISSION_DENIED real) activa el gate.
    // code 2 (kCLErrorLocationUnknown / señal débil) y code 3 (timeout) dejan pasar.
    const handleGeoError = (err: GeolocationPositionError) => {
      if (err.code === 1) { setLocationDenied(true); setShowLocationGate(true) }
      else setLocationGranted(true)
    }

    const tryCurrentPosition = () => {
      navigator.geolocation.getCurrentPosition(
        () => setLocationGranted(true),
        handleGeoError,
        { enableHighAccuracy: false, timeout: 5000 }
      )
    }

    const query = navigator.permissions?.query
    if (typeof query === 'function') {
      query({ name: 'geolocation' as PermissionName })
        .then(status => {
          if (status.state === 'granted') {
            navigator.geolocation.getCurrentPosition(
              () => setLocationGranted(true),
              handleGeoError,
              { enableHighAccuracy: false, timeout: 5000 }
            )
          } else if (status.state === 'denied') {
            // Verificar con getCurrentPosition — en macOS puede reportar 'denied'
            // aunque el switch del navegador esté activado (bloqueo a nivel OS)
            navigator.geolocation.getCurrentPosition(
              () => setLocationGranted(true),
              handleGeoError,
              { enableHighAccuracy: false, timeout: 5000 }
            )
          }
          // 'prompt' → no mostrar banner, el usuario explora libremente
        })
        .catch(tryCurrentPosition)
    } else {
      // Fallback (Safari): intentar silenciosamente
      tryCurrentPosition()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Geolocation: real-time sync (toggle only, NEVER the modal) ──
  useEffect(() => {
    if (!navigator.geolocation) return

    let permissionStatus: PermissionStatus | null = null

    const syncToggle = () => {
      const query = navigator.permissions?.query
      if (typeof query === 'function') {
        query({ name: 'geolocation' as PermissionName })
          .then(s => {
            setLocationGranted(s.state === 'granted')
            setLocationDenied(s.state === 'denied')
            setLocationToggleMsg(false)
          })
          .catch(() => {})
      } else {
        navigator.geolocation.getCurrentPosition(
          () => { setLocationGranted(true); setLocationDenied(false); setLocationToggleMsg(false) },
          () => { setLocationGranted(false); setLocationToggleMsg(false) },
          { enableHighAccuracy: false, timeout: 2000 }
        )
      }
    }

    // Listener nativo del PermissionStatus (instantáneo en Chrome)
    const handleChange = (e: Event) => {
      const s = (e.target as PermissionStatus).state
      setLocationGranted(s === 'granted')
      setLocationDenied(s === 'denied')
      setLocationToggleMsg(false)
    }

    const query = navigator.permissions?.query
    if (typeof query === 'function') {
      query({ name: 'geolocation' as PermissionName })
        .then(status => {
          permissionStatus = status
          if (typeof status.addEventListener === 'function') {
            status.addEventListener('change', handleChange)
          } else {
            status.onchange = handleChange
          }
        })
        .catch(() => {})
    }

    // Fallback: re-check cuando el usuario vuelve a la ventana o a la pestaña
    const handleVisibility = () => { if (document.visibilityState === 'visible') syncToggle() }
    window.addEventListener('focus', syncToggle)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('focus', syncToggle)
      document.removeEventListener('visibilitychange', handleVisibility)
      if (permissionStatus) {
        if (typeof permissionStatus.removeEventListener === 'function') {
          permissionStatus.removeEventListener('change', handleChange)
        } else {
          permissionStatus.onchange = null
        }
      }
    }
  }, [])

  // Cierra el gate en tiempo real cuando la ubicación se activa
  useEffect(() => {
    if (locationGranted && showLocationGate) {
      setLocationDenied(false)
      setShowLocationGate(false)
    }
  }, [locationGranted, showLocationGate])

  // Re-sync toggle mientras el menú esté abierto (polling cada 1.5s)
  useEffect(() => {
    if (!showMenu || !navigator.geolocation) return

    let prevGranted: boolean | null = null

    const checkPermission = () => {
      const query = navigator.permissions?.query
      if (typeof query === 'function') {
        query({ name: 'geolocation' as PermissionName })
          .then(s => {
            const nowGranted = s.state === 'granted'
            if (prevGranted !== null && prevGranted !== nowGranted) setLocationToggleMsg(false)
            prevGranted = nowGranted
            setLocationGranted(nowGranted)
            setLocationDenied(s.state === 'denied')
          })
          .catch(() => {})
      } else {
        navigator.geolocation.getCurrentPosition(
          () => {
            if (prevGranted !== null && !prevGranted) setLocationToggleMsg(false)
            prevGranted = true
            setLocationGranted(true)
          },
          () => {
            if (prevGranted !== null && prevGranted) setLocationToggleMsg(false)
            prevGranted = false
            setLocationGranted(false)
          },
          { enableHighAccuracy: false, timeout: 2000 }
        )
      }
    }

    checkPermission() // inmediato al abrir
    const interval = setInterval(checkPermission, 1500)
    return () => clearInterval(interval)
  }, [showMenu])

  const [selectedMonument, setSelectedMonument] = useState<Monumento | null>(null)
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [mapLoading, setMapLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)
  const handleMapReady = useCallback(() => setMapReady(true), [])
  const [timerFinished, setTimerFinished] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [browserChromeHidden, setBrowserChromeHidden] = useState(false)
const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [navPhase, setNavPhase] = useState<'idle' | 'preview' | 'navigating'>('idle')
  const [isHudExpanded, setIsHudExpanded] = useState(false)
  const [expandedStage, setExpandedStage] = useState<number | null>(0)
  const mapControlsRef = useRef<MapBoardHandle>(null)

  const [firestoreStops, setFirestoreStops] = useState<StopData[]>([])
  const [stageIdToPrizeId, setStageIdToPrizeId] = useState<Record<string, string>>({})
  const [stageGroups, setStageGroups] = useState<number[][]>([])
  const [monuments, setMonuments] = useState<Monumento[] | null>(null)
  const [noActiveSeason, setNoActiveSeason] = useState(false)
  const [seasonName, setSeasonName] = useState('')
  const [currentSeasonId, setCurrentSeasonId] = useState('')
  const [geoLimit, setGeoLimit] = useState(false)
  const [geoLimitRadius, setGeoLimitRadius] = useState(VALIDATION_RADIUS_DEFAULT_M)
  const [tooFarAlert, setTooFarAlert] = useState(false)
  const [noQuestionsAlert, setNoQuestionsAlert] = useState(false)
  // Posición del usuario para el badge de distancia en la tarjeta de parada
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        // ── PASO 1: Temporada activa ──────────────────────────────
        // /seasons: allow read if request.auth != null  → siempre OK para usuarios autenticados
        const seasonsSnap = await getDocs(collection(db, 'seasons'))

        // Si hay más de una temporada activa, usamos la de startDate más reciente
        const activeSeasons = seasonsSnap.docs.filter(d => d.data().status === 'active')
        if (activeSeasons.length === 0) {
          console.warn('[Turizoneando] ⚠️ No hay temporada activa en Firestore.')
          setNoActiveSeason(true); setMonuments([]); setCompletedStops([]); return
        }
        const activeSeasonDoc = activeSeasons.sort((a, b) => {
          const toMs = (v: unknown): number => {
            if (!v) return 0
            if (typeof (v as { toDate?: () => Date }).toDate === 'function') return (v as { toDate: () => Date }).toDate().getTime()
            if (typeof (v as { seconds?: number }).seconds === 'number') return (v as { seconds: number }).seconds * 1000
            if (typeof v === 'string') return new Date(v).getTime()
            return 0
          }
          return toMs(b.data().startDate) - toMs(a.data().startDate)
        })[0]

        const activeSeasonId = activeSeasonDoc.id
        const activeSeasonName = String(activeSeasonDoc.data().name ?? '')
        setSeasonName(activeSeasonName)
        setCurrentSeasonId(activeSeasonId)
        setGeoLimit(activeSeasonDoc.data().geoLimit === true)
        setGeoLimitRadius(typeof activeSeasonDoc.data().geoLimitRadius === 'number' ? activeSeasonDoc.data().geoLimitRadius : VALIDATION_RADIUS_DEFAULT_M)

        // ── PASO 2: Stages de la temporada ───────────────────────
        // /seasons/{id}/stages: allow read if request.auth != null  → siempre OK
        const stagesSnap = await getDocs(collection(db, 'seasons', activeSeasonId, 'stages'))
        const stagesRaw = stagesSnap.docs
          .map(d => {
            const data = d.data()
            const prizeIds = Array.isArray(data.prizeIds) ? data.prizeIds as string[] : []
            return { id: d.id, number: Number(data.number) || 0, prizeId: prizeIds[0] ?? '' }
          })
          .sort((a, b) => a.number - b.number)

        // ── PASO 3: Stops activos ─────────────────────────────────
        // Regla: allow read if (auth != null && resource.data.active == true) || isAdmin()
        // Usando where('active', '==', true) todos los docs retornados cumplen la regla
        // → nunca hay error 400 "Property active is undefined"
        const stopsSnap = await getDocs(
          query(collection(db, 'stops'), where('active', '==', true))
        )

        // Conjunto de stage IDs de esta temporada para el filtro por stageId
        const seasonStageIds = new Set(stagesRaw.map(s => s.id))

        const seasonStops: StopData[] = stopsSnap.docs
          .filter(d => {
            const data = d.data()
            // Criterio 1: seasonIds incluye la temporada activa
            const ids = data.seasonIds as string[] | undefined
            if (Array.isArray(ids) && ids.includes(activeSeasonId)) return true
            // Criterio 2 (fallback): stageId pertenece a un stage de esta temporada
            const sid = data.stageId as string | undefined
            return typeof sid === 'string' && seasonStageIds.has(sid)
          })
          .map(d => {
            const data = d.data()
            return {
              id: d.id,
              name: String(data.name ?? ''),
              nameEn: String(data.nameEn ?? ''),
              narration: String(data.narration ?? ''),
              narrationEn: String(data.narrationEn ?? ''),
              imageUrl: String(data.imageUrl ?? ''),
              lat: typeof data.lat === 'number' ? data.lat : 0,
              lng: typeof data.lng === 'number' ? data.lng : 0,
              order: typeof data.order === 'number' ? data.order : 0,
              active: true,
              stageId: String(data.stageId ?? ''),
              seasonIds: Array.isArray(data.seasonIds) ? (data.seasonIds as string[]) : [activeSeasonId],
              audioUrl: data.audioUrl ? String(data.audioUrl) : undefined,
              audioUrlEn: data.audioUrlEn ? String(data.audioUrlEn) : undefined,
            } as StopData
          })

        // ── PASO 4: Agrupar stops por stage ──────────────────────
        const stopsFromStages: StopData[] = []
        const groups: number[][] = []

        for (const stage of stagesRaw) {
          const stageStops = seasonStops
            .filter(s => s.stageId === stage.id)
            .sort((a, b) => a.order - b.order)
          const group: number[] = []
          for (const stop of stageStops) {
            group.push(stopsFromStages.length)
            stopsFromStages.push(stop)
          }
          groups.push(group)
        }

        // ── PASO 5: Preguntas via Cloud Function (bypasa Security Rules) ───
        // /questions: admin-only en Firestore directo → usamos httpsCallable getStopWithQuestions
        // que corre server-side con admin SDK y puede leer questions sin restricción
        const stopsWithQuestions: (StopData & { questions: QuestionData[] })[] = await Promise.all(
          stopsFromStages.map(async stop => {
            try {
              const result = await getStopWithQuestions(stop.id)
              return { ...stop, questions: result.questions as QuestionData[] }
            } catch {
              return { ...stop, questions: [] }
            }
          })
        )

        // ── RESUMEN ──────────────────────────────────────────────
        console.group('[Turizoneando] ✅ Carga completa')
        console.log('Temporada:', activeSeasonName, '| id:', activeSeasonId)
        console.log('Etapas:', stagesRaw.length, '| Paradas:', stopsWithQuestions.length)
        stopsWithQuestions.forEach((s, i) =>
          console.log(`  ${i + 1}. [stage:${s.stageId}] ${s.name} | q:${s.questions.length} | (${s.lat}, ${s.lng})`)
        )
        console.groupEnd()

        setFirestoreStops(stopsWithQuestions)
        setStageIdToPrizeId(Object.fromEntries(stagesRaw.map(s => [s.id, s.prizeId])))
        setStageGroups(groups)
        const mapped = stopsWithQuestions.map(stopToMonumento)
        setMonuments(mapped)

        // ── Hidratar progreso real del jugador desde el servidor ──────────
        try {
          const status = await fetchMyPlayerStatus(activeSeasonId)
          const completedIds = new Set<string>()
          status.stages.forEach(stage => {
            stage.stops.forEach(stop => {
              if (stop.completed) completedIds.add(stop.id)
            })
          })
          setCompletedStops(stopsWithQuestions.map(s => completedIds.has(s.id)))
        } catch {
          setCompletedStops(Array(mapped.length).fill(false))
        }
      } catch (err) {
        console.error('[Turizoneando] ❌ Error al cargar temporada:', err)
        setMonuments([])
        setCompletedStops([])
      }
    })()
  }, [])

  // Suscripción en tiempo real a geoLimit de la temporada activa
  useEffect(() => {
    if (!currentSeasonId) return
    const unsub = onSnapshot(doc(db, 'seasons', currentSeasonId), snap => {
      if (snap.exists()) {
        setGeoLimit(snap.data().geoLimit === true)
        setGeoLimitRadius(typeof snap.data().geoLimitRadius === 'number' ? snap.data().geoLimitRadius : VALIDATION_RADIUS_DEFAULT_M)
      }
    })
    return unsub
  }, [currentSeasonId])

  // Listener en tiempo real: usa query de colección para detectar activación y desactivación.
  // Los listeners individuales por doc fallan porque las security rules lanzan permission-denied
  // cuando active pasa a false, matando el listener y bloqueando futuras reactivaciones.
  useEffect(() => {
    if (firestoreStops.length === 0) return
    const unsub = onSnapshot(
      query(collection(db, 'stops'), where('active', '==', true)),
      (snap) => {
        const nowActiveIds = new Set(snap.docs.map(d => d.id))
        setDeactivatedStopIds(firestoreStops.filter(s => !nowActiveIds.has(s.id)).map(s => s.id))
      },
      () => {} // silencioso en errores de red
    )
    return unsub
  }, [firestoreStops])

  const [completedStops, setCompletedStops] = useState<boolean[]>([])
  const [deactivatedStopIds, setDeactivatedStopIds] = useState<string[]>([])
  const deactivatedStopIdSet = useMemo(() => new Set(deactivatedStopIds), [deactivatedStopIds])

  const [lockedAlert, setLockedAlert] = useState<
    { type: 'stage'; blockedStageIdx: number } |
    { type: 'stop'; availableStopName: string } |
    null
  >(null)

  const activeStageIndex = useMemo(() => {
    for (let s = 0; s < stageGroups.length; s++) {
      if (!stageGroups[s].every(i => completedStops[i] || deactivatedStopIdSet.has(firestoreStops[i]?.id ?? ''))) return s
    }
    return Math.max(stageGroups.length - 1, 0)
  }, [completedStops, stageGroups, deactivatedStopIdSet, firestoreStops])

  const allCompleted = useMemo(() =>
    stageGroups.length > 0 && stageGroups.every(g => g.every(i => completedStops[i] || deactivatedStopIdSet.has(firestoreStops[i]?.id ?? '')))
  , [stageGroups, completedStops, deactivatedStopIdSet, firestoreStops])

  const introTarget = useMemo(() => {
    if (!monuments || monuments.length === 0 || stageGroups.length === 0) return undefined
    const firstIdx = stageGroups[activeStageIndex]?.[0]
    if (firstIdx === undefined || firstIdx >= monuments.length) return undefined
    const m = monuments[firstIdx]
    return { lat: m.lat, lng: m.lng }
  }, [monuments, stageGroups, activeStageIndex])

  useEffect(() => {
    setExpandedStage(activeStageIndex)
  }, [activeStageIndex])

  // ── ID de la etapa activa (para el listener en tiempo real) ──────────────
  const activeStageId = useMemo(() => {
    const firstIdx = stageGroups[activeStageIndex]?.[0]
    if (firstIdx === undefined) return undefined
    return firestoreStops[firstIdx]?.stageId
  }, [firestoreStops, stageGroups, activeStageIndex])

  // ── ID de la parada actualmente abierta (solo cuando hay una seleccionada) ──
  const activeStopId = selectedMonument?.stopId

  // ── Middleware en tiempo real ─────────────────────────────────────────────
  const { block: statusBlock, dismiss: dismissBlock } = useRealtimeStatus({
    seasonId: currentSeasonId,
    stageId:  activeStageId,
    stopId:   activeStopId,
  })

  // Cuando una parada se desactiva: cerrar quiz y card silenciosamente (el listener de colección
  // ya la quitó del mapa). Cuando una etapa se desactiva: cerrar quiz pero mostrar el bloqueo.
  useEffect(() => {
    if (statusBlock?.type === 'stop_deactivated') {
      setQuizFlow({ step: 'idle' })
      setSelectedMonument(null)
      dismissBlock()
    } else if (statusBlock?.type === 'stage_deactivated') {
      setQuizFlow({ step: 'idle' })
    }
  }, [statusBlock, dismissBlock])

  const stages = useMemo<{ roman: string; status: StageStatus }[]>(() => {
    return stageGroups.map((group, idx) => {
      const allDone = group.length > 0 && group.every(i => completedStops[i] || deactivatedStopIdSet.has(firestoreStops[i]?.id ?? ''))
      const status: StageStatus = allDone ? 'done' : idx === activeStageIndex ? 'active' : 'locked'
      return { roman: ROMAN[idx] ?? String(idx + 1), status }
    })
  }, [completedStops, activeStageIndex, stageGroups, deactivatedStopIdSet, firestoreStops])

  const { t, i18n } = useTranslation()

  // ── Menu pantalla completa ────────────────────────────────────
  const [soundEnabled, setSoundEnabled] = useState(true)

  const openMenu = useCallback(() => {
    setMenuBtnAnimating(true)
    setShowMenu(true)
    setMenuView('main')
    setTimeout(() => setMenuBtnAnimating(false), 450)
  }, [])

  // ── Quiz flow ────────────────────────────────────────────────
  const [quizFlow, setQuizFlow] = useState<QuizStep>({ step: 'idle' })

  const selectedStopIndex = useMemo(() => {
    if (!selectedMonument || !monuments) return -1
    return monuments.findIndex(m => m.nombre === selectedMonument.nombre)
  }, [selectedMonument, monuments])

  // Índice de la siguiente parada disponible en la etapa activa (después de la actual)
  const nextAvailableStopIndex = useMemo(() => {
    if (selectedStopIndex < 0) return -1
    const stageStops = stageGroups[activeStageIndex] ?? []
    for (const idx of stageStops) {
      if (idx > selectedStopIndex && !completedStops[idx] && !deactivatedStopIdSet.has(firestoreStops[idx]?.id ?? '')) return idx
    }
    for (const idx of stageStops) {
      if (idx !== selectedStopIndex && !completedStops[idx] && !deactivatedStopIdSet.has(firestoreStops[idx]?.id ?? '')) return idx
    }
    return -1
  }, [selectedStopIndex, stageGroups, activeStageIndex, completedStops, deactivatedStopIdSet, firestoreStops])

  // Dismiss que limpia el bloqueo Y cierra el monumento seleccionado
  const handleLogout = () => signOut(auth).then(() => navigate('/'))

  const handleDismissBlock = useCallback(() => {
    dismissBlock()
    setSelectedMonument(null)
  }, [dismissBlock])

  // Ir a la siguiente parada disponible tras una desactivación
  const handleNextStop = useCallback(() => {
    const nextIdx = nextAvailableStopIndex
    dismissBlock()
    setSelectedMonument(null)
    if (nextIdx >= 0 && monuments) {
      const next = monuments[nextIdx]
      if (next) {
        setSelectedMonument(next)
        mapControlsRef.current?.focusOnStop(nextIdx)
      }
    }
  }, [dismissBlock, nextAvailableStopIndex, monuments])

  const selectedMonumentIsAvailable = useMemo(() => {
    if (!selectedMonument || selectedStopIndex < 0 || completedStops[selectedStopIndex]) return false
    const stopId = selectedMonument.stopId
    if (stopId && deactivatedStopIdSet.has(stopId)) return false
    const stageIdx = stageGroups.findIndex(g => g.includes(selectedStopIndex))
    if (stageIdx < 0) return false
    const prevStagesDone = stageIdx === 0 || stageGroups.slice(0, stageIdx).every(g => g.every(i => completedStops[i] || deactivatedStopIdSet.has(firestoreStops[i]?.id ?? '')))
    if (!prevStagesDone || stageIdx !== activeStageIndex) return false
    // Sequential within stage: all previous stops must be done
    const stageGroup = stageGroups[stageIdx]
    const posInStage = stageGroup.indexOf(selectedStopIndex)
    const prevStopsInStageDone = posInStage <= 0
      || stageGroup.slice(0, posInStage).every(i => completedStops[i] || deactivatedStopIdSet.has(firestoreStops[i]?.id ?? ''))
    return prevStopsInStageDone
  }, [selectedMonument, selectedStopIndex, completedStops, activeStageIndex, stageGroups, deactivatedStopIdSet, firestoreStops])

  // ── Polling de posición del usuario mientras una parada está seleccionada ────
  useEffect(() => {
    if (!selectedMonument) { setUserPosition(null); return }
    const sync = () => {
      const pos = mapControlsRef.current?.getUserPosition()
      if (pos) setUserPosition(pos)
    }
    sync() // inmediato
    const id = setInterval(sync, 3000)
    return () => clearInterval(id)
  }, [selectedMonument])

  // Distancia en metros entre el usuario y la parada seleccionada
  const distanceToSelected = useMemo(() => {
    if (!selectedMonument || !userPosition) return null
    return haversineM(userPosition, { lat: selectedMonument.lat, lng: selectedMonument.lng })
  }, [selectedMonument, userPosition])

  // ¿Puede el usuario iniciar el reto ahora mismo?
  const canStartChallenge = useMemo(() => {
    if (!selectedMonumentIsAvailable) return false
    if (!geoLimit) return true                              // geo OFF → siempre puede
    if (distanceToSelected === null) return false           // sin posición → no puede
    return distanceToSelected <= geoLimitRadius
  }, [selectedMonumentIsAvailable, geoLimit, distanceToSelected, geoLimitRadius])


  const handleStartQuiz = useCallback(async () => {
    if (!selectedMonument || selectedStopIndex < 0) return
    if (locationDenied) { setShowLocationGate(true); return }

    if (geoLimit) {
      const userPos = mapControlsRef.current?.getUserPosition()
      if (!userPos) { setShowLocationGate(true); return }
      const distM = haversineM(userPos, { lat: selectedMonument.lat, lng: selectedMonument.lng })
      if (distM > geoLimitRadius) { setTooFarAlert(true); return }
    }

    const stopId = selectedMonument.stopId
    if (!stopId) return

    let narration = ''
    let audioUrl: string | undefined = undefined
    let questions: QuizQuestion[] = []

    try {
      const lang = i18n.language
      const firestoreStop = firestoreStops.find(s => s.id === stopId)

      // Usa preguntas precargadas al montar; sólo llama CF si faltan (fallback)
      const preloaded: QuestionData[] = firestoreStop?.questions ?? []
      const firestoreQuestions: QuestionData[] = preloaded.length > 0
        ? preloaded
        : (await getStopWithQuestions(stopId)).questions as QuestionData[]

      if (firestoreStop) {
        narration = (lang === 'en' && firestoreStop.narrationEn)
          ? firestoreStop.narrationEn
          : firestoreStop.narration
        audioUrl = (lang === 'en' ? firestoreStop.audioUrlEn : firestoreStop.audioUrl) || undefined
      }

      if (firestoreQuestions.length > 0) {
        questions = firestoreQuestions.map(q => ({
          id: q.id,
          text: (lang === 'en' && q.textEn) ? q.textEn : q.text,
          options: (lang === 'en' && q.optionsEn?.length ? q.optionsEn : q.options) as [string, string, string, string],
          isBonus: (q as QuestionData & { isBonus?: boolean; pointsAwarded?: number }).isBonus ?? false,
          pointsAwarded: (q as QuestionData & { isBonus?: boolean; pointsAwarded?: number }).pointsAwarded,
        }))
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      if (code === 'permission-denied' && stopId) {
        setDeactivatedStopIds(prev => prev.includes(stopId) ? prev : [...prev, stopId])
        setSelectedMonument(null)
      } else {
        setNoQuestionsAlert(true)
      }
      return
    }

    if (questions.length === 0) {
      if (stopId) setDeactivatedStopIds(prev => prev.includes(stopId) ? prev : [...prev, stopId])
      setSelectedMonument(null)
      return
    }

    const quizData: QuizStopData = {
      stopId,
      narration,
      audioUrl,
      questions,
    }

    setQuizFlow({ step: 'history', stopIndex: selectedStopIndex, monument: selectedMonument, quizData })
  }, [selectedMonument, selectedStopIndex, firestoreStops, i18n, locationDenied, geoLimit])

  const handleQuizComplete = useCallback((
    stopIndex: number,
    monument: Monumento,
    earnedPoints: number,
    correctCount: number,
    quizData: QuizStopData,
    retryCount: number,
  ) => {
    const totalQuestions = quizData.questions.length
    if (correctCount < totalQuestions) {
      if (correctCount === 0) {
        setQuizFlow({ step: 'quiz_failed', stopIndex, monument, quizData, retryCount })
      } else {
        setQuizFlow({ step: 'levelup', stopIndex, monument, earnedPoints, mode: 'partial', quizData, retryCount })
      }
      return
    }
    const stageIdx = stageGroups.findIndex(g => g.includes(stopIndex))
    const stageGroup = stageGroups[stageIdx] ?? []
    const completesStage = stageGroup.length > 0 && stageGroup.every(i => i === stopIndex || completedStops[i] || deactivatedStopIdSet.has(firestoreStops[i]?.id ?? ''))
    if (completesStage) {
      const isLastStage = stageIdx === stageGroups.length - 1
      const stageId = firestoreStops[stopIndex]?.stageId ?? ''
      const prizeId = stageIdToPrizeId[stageId] ?? ''
      setQuizFlow({ step: 'roulette', stopIndex, monument, showRanking: isLastStage, stageId, prizeId })
    } else {
      setQuizFlow({ step: 'levelup', stopIndex, monument, earnedPoints, mode: 'complete', quizData, retryCount })
    }
  }, [stageGroups, completedStops, firestoreStops, stageIdToPrizeId, deactivatedStopIdSet])

  const handleStopComplete = useCallback((stopIndex: number) => {
    setCompletedStops(prev => {
      const next = [...prev]
      next[stopIndex] = true
      return next
    })
    setQuizFlow({ step: 'idle' })
    setSelectedMonument(null)
    mapControlsRef.current?.clearNavigation()
    setNavPhase('idle')
    setRouteInfo(null)
    setIsHudExpanded(false)
  }, [])

  useEffect(() => {
    if (!allCompleted) return
    mapControlsRef.current?.clearNavigation()
    setNavPhase('idle')
    setRouteInfo(null)
    setIsHudExpanded(false)
    setSelectedMonument(null)
  }, [allCompleted])

  const prevCompletedStopsRef = useRef<boolean[]>(completedStops)
  useEffect(() => {
    const prev = prevCompletedStopsRef.current
    prevCompletedStopsRef.current = completedStops
    if (prev === completedStops) return
    const stageStops = stageGroups[activeStageIndex] ?? []
    for (const i of stageStops) {
      if (!completedStops[i]) {
        mapControlsRef.current?.focusOnStop(i)
        break
      }
    }
  }, [completedStops, activeStageIndex, stageGroups])

  const handleLockedStopClick = useCallback((info: {
    stageIdx: number
    isStageBlocked: boolean
    availableStopName: string
  }) => {
    if (info.isStageBlocked) {
      setLockedAlert({ type: 'stage', blockedStageIdx: info.stageIdx })
    } else {
      setLockedAlert({ type: 'stop', availableStopName: info.availableStopName })
    }
  }, [])

  // Cierra la tarjeta y limpia todo
  const closeCard = useCallback(() => {
    mapControlsRef.current?.clearNavigation()
    if (navPhase !== 'idle') {
      // Ir a la primera parada disponible del stage activo
      const stageStops = stageGroups[activeStageIndex] ?? []
      const nextIdx = stageStops.find(i => !completedStops[i]) ?? -1
      if (nextIdx >= 0) {
        mapControlsRef.current?.focusOnStop(nextIdx)
      } else {
        mapControlsRef.current?.returnToOrigin()
      }
    }
    setRouteInfo(null)
    setNavPhase('idle')
    setIsHudExpanded(false)
    setSelectedMonument(null)
    setHistoryExpanded(false)
  }, [navPhase, stageGroups, activeStageIndex, completedStops])

  // "IR AL RETO": traza ruta y transiciona a fase preview
  const handleStartRoute = useCallback(() => {
    if (!selectedMonument) return
    if (locationDenied) { setShowLocationGate(true); return }
    setRouteInfo(null)
    setNavPhase('preview')
    mapControlsRef.current?.startNavigation(
      selectedMonument.lat,
      selectedMonument.lng,
      (info) => setRouteInfo(info)
    )
  }, [selectedMonument, locationDenied])

  // "INICIAR": enfoca cámara en posición del usuario y activa HUD de navegación
  const handleStartNavigation = useCallback(() => {
    mapControlsRef.current?.focusOnUser()
    mapControlsRef.current?.setNavActive(true)
    setNavPhase('navigating')
    setIsHudExpanded(true)
  }, [])

  // Resetea estado de navegación al seleccionar un monumento diferente
  useEffect(() => {
    setHistoryExpanded(false)
    if (selectedMonument) {
      mapControlsRef.current?.clearNavigation()
      setNavPhase('idle')
      setRouteInfo(null)
    }
  }, [selectedMonument?.nombre])

  // Cierra tarjeta al cambiar de etapa
  useEffect(() => {
    setSelectedMonument(null)
    mapControlsRef.current?.clearNavigation()
    setNavPhase('idle')
    setRouteInfo(null)
  }, [expandedStage])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  useEffect(() => {
    const check = () => setBrowserChromeHidden(window.screen.height - window.innerHeight < 80)
    window.addEventListener('resize', check)
    check()
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setTimerFinished(true), 2500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (mapReady && timerFinished) setMapLoading(false)
  }, [mapReady, timerFinished])



  return (
    <div className="relative h-screen w-screen overflow-hidden  font-sans ">

      {/* ── Pantalla: Sin temporada activa ──────────────────────── */}
      {noActiveSeason && (
        <div
          className="fixed inset-0 z-60 flex flex-col items-center justify-center text-center px-6"
          style={{ background: 'radial-gradient(circle, var(--color-map-wood-mid) 0%, var(--color-map-wood-deep) 100%)' }}
        >
          <div className="relative flex flex-col items-center gap-6 max-w-xs">
            {/* Logo principal */}
            <img
              src="/assets/img/logo1.webp"
              alt="Logo Turizoneando"
              className="h-22 md:h-28 object-contain animate-skull"
              style={{ filter: 'sepia(0.6) saturate(1.3) contrast(1.05) brightness(0.95) drop-shadow(0 6px 16px rgba(252,211,77,0.25))' }}
            />

            {/* Texto */}
            <div className="space-y-2">
              <h2
                className="text-2xl font-bold text-map-gold-light tracking-wide"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {t('map.no_season_title')}
              </h2>
              <p className="text-xs italic text-[#fff3d1]/60 tracking-wide font-serif">
                {t('map.no_season_subtitle')}
              </p>
            </div>

            {/* Botón volver */}
            <button
              onClick={() => navigate('/')}
              className="mt-2 flex items-center gap-2 rounded-full border border-map-gold/50 bg-map-wood-dark/80 px-6 py-3 text-sm font-bold text-map-gold-light tracking-wide transition-all active:scale-95 backdrop-blur-sm"
              style={{ boxShadow: '0 4px 20px rgba(168,127,42,0.2)' }}
            >
              {t('map.no_season_back')}
            </button>
          </div>
        </div>
      )}

      {/* ── Pantalla de Carga Inmersiva ──────────────────────────── */}
      {mapLoading && !noActiveSeason && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-4"
          style={{ background: 'linear-gradient(to bottom, #075f6e 0%, #00bbb4 100%)' }}
        >
          {/* Logo circular */}
          <div
            className="mb-6 h-auto w-70  overflow-hidden select-none"
          >
            <img
              src="/assets/img/logoConFondo.webp"
              alt="Logo Turizoneando"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Nombre app */}
          <img
            src="/assets/img/logoSoloLetras.webp"
            alt="Turizoneando"
            className="h-40 object-contain -mt-25 "
            style={{ filter: 'brightness(0) invert(1)' }}
          />

          {/* Subtítulo */}
          {/* <p className="text-xs font-semibold tracking-widest uppercase mb-6" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {t('map.loading_subtitle')}
          </p> */}

          {/* Nombre de la temporada */}
          {seasonName && (
            <div
              className="px-5 py-2 rounded-full -mt-14"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              <p className="text-sm font-black text-white tracking-widest uppercase">{seasonName}</p>
            </div>
          )}

          {/* Spinner */}
          <div
            className="mt-8 h-6 w-6 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(255,255,255,0.6)', borderTopColor: 'transparent' }}
          />
        </div>
      )}

      {/* ── Botón pantalla completa top-left ─────────────────────── */}
      {!mapLoading && (
        <button
          id="tour-fullscreen"
          onClick={toggleFullscreen}
          className="absolute left-3 z-30 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 border-primary/70 bg-primary-dark/95 backdrop-blur-md text-white active:scale-90 transition-all"
          style={{ top: 'max(1.5rem, env(safe-area-inset-top))', boxShadow: '0 4px 24px rgba(0,187,180,0.35), inset 0 1px 0 rgba(255,255,255,0.08)' }}
          aria-label={isFullscreen ? t('map.aria_fullscreen_exit') : t('map.aria_fullscreen_enter')}
        >
          <i className={isFullscreen ? 'ri-fullscreen-exit-line text-xl' : 'ri-fullscreen-line text-xl'} />
        </button>
      )}

      {/* ── Botón menú top-right ─────────────────────────────────── */}
      {!mapLoading && (
        <button
          id="tour-menu"
          onClick={openMenu}
          className={`absolute right-3 z-30 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 border-primary/70 bg-primary-dark/95 backdrop-blur-md text-white transition-all ${menuBtnAnimating ? 'menu-btn-pulse' : ''}`}
          style={{ top: 'max(1.5rem, env(safe-area-inset-top))', boxShadow: '0 4px 24px rgba(0,187,180,0.35), inset 0 1px 0 rgba(255,255,255,0.08)' }}
          aria-label={t('map.aria_open_menu')}
        >
          <i className="ri-menu-line text-xl" />
        </button>
      )}

      {/* ── Barra top-center: Menú + Etapas + Ajustes ─────────────── */}
      {!mapLoading && navPhase !== 'navigating' && (
        <div id="tour-stages" className="absolute left-1/2 -translate-x-1/2 z-30" style={{ top: 'max(1.5rem, env(safe-area-inset-top))' }}>
          <div
            className="flex items-center gap-1.5 sm:gap-2 rounded-full border-2 border-primary/70 bg-primary-dark/95 backdrop-blur-md px-2 py-1.5 sm:px-2.5 sm:py-2"
            style={{ boxShadow: '0 4px 24px rgba(0,187,180,0.35), inset 0 1px 0 rgba(255,255,255,0.08)' }}
          >
            {/* Etapas */}
            <div className="flex items-center gap-2">
              {monuments === null && (
                <div className="flex items-center gap-1.5 px-3">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t('map.loading_title')}</span>
                </div>
              )}
              {monuments !== null && monuments.length === 0 && (
                <div className="h-8 flex items-center gap-1.5 px-4 rounded-full border border-white/30 bg-white/10">
                  <i className="ri-map-pin-off-line text-xs text-white/70 shrink-0" />
                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider whitespace-nowrap">{t('map.no_stops')}</span>
                </div>
              )}
              {monuments !== null && monuments.length > 0 && stages.map((stage, idx) => {
                const open = expandedStage === idx
                const toggle = () => {
                  if (stage.status === 'locked') {
                    setLockedAlert({ type: 'stage', blockedStageIdx: idx })
                    return
                  }
                  setExpandedStage(open ? null : idx)
                  if (!open) {
                    mapControlsRef.current?.focusOnStage(idx)
                  }
                }

                if (stage.status === 'done') return (
                  <button key={idx} onClick={toggle}
                    style={{
                      ...STAGE_BTN_TRANSITION,
                      boxShadow: open ? '0 0 10px rgba(0,187,180,0.5), 0 2px 8px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.3)',
                    }}
                    className={`relative h-8 sm:h-9 rounded-full bg-linear-to-b from-primary to-primary-dark border border-primary/80 flex items-center justify-center overflow-hidden active:scale-90 ${open ? 'px-3 sm:px-3.5 gap-1.5 sm:gap-2' : 'w-8 sm:w-9'}`}>
                    <i className={`ri-checkbox-circle-line text-white shrink-0 ${open ? 'text-xs sm:text-sm' : 'text-base sm:text-lg'}`} />
                    {open && <span className="quiz-label text-[10px] sm:text-xs text-white uppercase tracking-wide whitespace-nowrap stage-text-reveal leading-none translate-y-px">{t('map.stage', { n: idx + 1 })}</span>}
                  </button>
                )

                if (stage.status === 'active') return (
                  <button key={idx} onClick={toggle}
                    style={{
                      ...STAGE_BTN_TRANSITION,
                      boxShadow: open ? '0 0 12px rgba(255,255,255,0.3), 0 2px 8px rgba(0,0,0,0.3)' : '0 0 5px rgba(255,255,255,0.12), 0 2px 6px rgba(0,0,0,0.3)',
                    }}
                    className={`h-8 sm:h-9 rounded-full border flex items-center justify-center overflow-hidden active:scale-90 ${open ? 'px-3 sm:px-3.5 gap-1.5 sm:gap-2 border-white bg-white/20' : 'w-8 sm:w-9 border-white bg-white/20'}`}>
                    <i className="ri-flag-fill text-xs sm:text-sm text-white shrink-0" />
                    {open && <span className="quiz-label text-[10px] sm:text-xs text-white uppercase tracking-wide whitespace-nowrap stage-text-reveal leading-none translate-y-px">{t('map.stage', { n: idx + 1 })}</span>}
                  </button>
                )

                return (
                  <button key={idx} onClick={toggle}
                    style={{
                      ...STAGE_BTN_TRANSITION,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    }}
                    className={`h-8 sm:h-9 rounded-full border flex items-center justify-center overflow-hidden active:scale-90 ${open ? 'px-3 sm:px-3.5 gap-1.5 sm:gap-2 border-white/30 bg-white/10' : 'w-8 sm:w-9 border-white/30 bg-white/10'}`}>
                    <i className="ri-lock-fill text-xs sm:text-sm text-white/50 shrink-0" />
                    {open && <span className="text-[10px] sm:text-xs font-black text-white/50 uppercase tracking-wide whitespace-nowrap stage-text-reveal">{t('map.stage', { n: idx + 1 })}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── HUD navegación: bottom full-width en móvil, pill arriba en desktop ── */}
      {navPhase === 'navigating' && routeInfo && (
        <>
          {/* Card flotante (móvil y desktop) */}
          <div className={`absolute ${isFullscreen || browserChromeHidden ? 'bottom-6' : 'bottom-20'} left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.5rem)] max-w-[420px] animate-slide-up`}>
            <div className="rounded-[28px] overflow-hidden bg-white" style={{ border: '1.5px solid rgba(9,109,125,0.25)', boxShadow: '0 8px 32px rgba(9,109,125,0.22), 0 2px 8px rgba(0,0,0,0.10)' }}>

              {/* Sección expandible */}
              <div style={{ maxHeight: isHudExpanded ? '160px' : '0px', transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden' }}>
                <div className="flex items-center gap-3.5 p-3.5" style={{ borderBottom: '1px solid rgba(9,109,125,0.12)' }}>
                  <div className="h-20 w-24 shrink-0 rounded-xl overflow-hidden shadow-md" style={{ border: '2px solid #096d7d' }}>
                    <img src={selectedMonument?.imagen} alt={selectedMonument?.nombre} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-col flex-1 gap-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-widest leading-none" style={{ color: '#00bbb4' }}>{t('map.destination')}</div>
                    <div className="text-sm font-bold leading-tight text-gray-800 mb-0.5">{selectedMonument?.nombre}</div>
                    <button
                      onClick={canStartChallenge ? handleStartQuiz : undefined}
                      disabled={!canStartChallenge}
                      className="flex items-center justify-center gap-2 py-2 px-4 rounded-full w-full active:scale-95 transition-all text-white font-bold text-sm"
                      style={{
                        background: canStartChallenge ? '#096d7d' : 'rgba(0,0,0,0.15)',
                        cursor: canStartChallenge ? 'pointer' : 'not-allowed',
                        opacity: canStartChallenge ? 1 : 0.6,
                      }}
                    >
                      <i className={`text-lg ${canStartChallenge ? 'ri-play-circle-line' : 'ri-map-pin-time-line'}`} />
                      <span>
                        {canStartChallenge
                          ? t('map.start_challenge')
                          : distanceToSelected !== null
                            ? `${Math.round(distanceToSelected)} m · necesitas ${geoLimitRadius} m`
                            : 'Obteniendo ubicación…'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Barra principal */}
              <div className="flex items-center justify-between gap-2 p-3">
                {/* Izquierda: modo + distancia + tiempo */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center h-10 w-10 shrink-0 rounded-full" style={{ background: '#096d7d' }}>
                    <i className={`text-lg text-white ${routeInfo.travelMode === 'DRIVE' ? 'ri-roadster-fill' : 'ri-walk-line'}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-wide leading-none mb-0.5" style={{ color: '#00bbb4' }}>{t('map.distance')}</span>
                    <span className="text-sm font-extrabold" style={{ color: '#096d7d' }}>{routeInfo.distanceKm} km</span>
                  </div>
                  <div className="w-px h-7 shrink-0" style={{ background: 'rgba(0,187,180,0.25)' }} />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-wide leading-none mb-0.5" style={{ color: '#00bbb4' }}>{t('map.time')}</span>
                    <span className="text-sm font-extrabold" style={{ color: '#096d7d' }}>{formatDuration(routeInfo.durationMin)}</span>
                  </div>
                </div>

                {/* Derecha: X + chevron */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={closeCard}
                    className="flex h-9 w-9 items-center justify-center rounded-full active:scale-90 transition-all"
                    style={{ background: '#fff', border: '1.5px solid rgba(9,109,125,0.15)', color: '#096d7d', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                    aria-label="Cancelar navegación"
                  >
                    <i className="ri-close-line text-lg" />
                  </button>
                  <button
                    onClick={() => setIsHudExpanded(prev => !prev)}
                    className="flex h-9 w-9 items-center justify-center rounded-full active:scale-90 transition-all"
                    style={{ background: '#fff', border: '1.5px solid rgba(9,109,125,0.15)', color: '#096d7d', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                    aria-label={isHudExpanded ? 'Colapsar info' : 'Ver destino'}
                  >
                    <i className="ri-arrow-up-s-line text-xl" style={{ display: 'inline-block', transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)', transform: isHudExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </>
      )}

      {/* ── Tablero del Mapa ─────────────────────────────────────── */}
      <main id="tour-map" className="h-full w-full">
        {monuments !== null ? (
          <MapBoard
            ref={mapControlsRef}
            monuments={monuments}
            onSelectMonument={setSelectedMonument}
            selectedMonument={selectedMonument}
            onLoadComplete={handleMapReady}
            startIntroAnimation={!mapLoading && monuments !== null}
            visibleStage={expandedStage ?? 0}
            completedStops={completedStops}
            onLockedStopClick={handleLockedStopClick}
            stageGroups={stageGroups}
            introTarget={introTarget}
            hiddenStopIds={deactivatedStopIds}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center" style={{ background: 'var(--color-map-wood-deep)' }}>
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: 'var(--color-map-gold)', borderTopColor: 'transparent' }} />
          </div>
        )}
      </main>


      {/* ── Tarjeta de monumento (fases idle y preview) ──────────── */}
      {selectedMonument && navPhase !== 'navigating' && (
        <>

        <div
          key={selectedMonument.nombre}
          className={`absolute ${isFullscreen || browserChromeHidden ? 'bottom-4' : 'bottom-20'} left-1/2 z-20 w-[calc(100%-2rem)] max-w-[380px] -translate-x-1/2 rounded-3xl bg-white border border-gray-100 shadow-2xl flex flex-col animate-fade-in overflow-hidden p-1.5 max-h-[calc(100dvh-5rem)]`}
        >
          {/* ── Imagen ── */}
          <div className="relative h-44 w-full shrink-0">
            <img
              key={selectedMonument.nombre}
              src={selectedMonument.imagen}
              alt={selectedMonument.nombre}
              className="h-full w-full object-cover animate-fade-in rounded-3xl"
            />
            {/* Overlay gradiente de abajo hacia arriba */}
            <div
              className="absolute inset-0 rounded-3xl"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)' }}
            />
            {/* Badge de estado – top-left */}
            {selectedStopIndex >= 0 && completedStops[selectedStopIndex] ? (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
                <i className="ri-checkbox-circle-fill text-sm" style={{ color: '#16a34a' }} />
                <span className="text-[10px] font-bold" style={{ color: '#16a34a' }}>Completada</span>
              </div>
            ) : (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
                {selectedMonumentIsAvailable ? (
                  geoLimit && !canStartChallenge ? (
                    <>
                      <i className="ri-map-pin-2-fill text-sm" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} />
                      <span className="text-[10px] font-bold" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {`Necesitas estar a ${geoLimitRadius} m`}
                      </span>
                    </>
                  ) : (
                    <>
                      <i className="ri-map-pin-2-fill text-sm" style={{ color: '#096d7d' }} />
                      <span className="text-[10px] font-bold" style={{ color: '#096d7d' }}>Disponible</span>
                    </>
                  )
                ) : (
                  <>
                    <i className="ri-lock-fill text-sm text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-400">Bloqueada</span>
                  </>
                )}
              </div>
            )}
            {/* Cerrar – top-right */}
            <button
              onClick={closeCard}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-all active:scale-90"
              aria-label="Cerrar"
            >
              <i className="ri-close-line text-lg text-gray-500" />
            </button>
            {/* Nombre sobre el overlay – bottom-left */}
            {!(selectedStopIndex >= 0 && completedStops[selectedStopIndex]) && (
              <div className="absolute bottom-3 left-4 right-12 flex flex-col gap-0.5">
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.7)' }}>Parada</span>
                <p className="text-sm font-extrabold uppercase tracking-wide leading-snug text-white drop-shadow-md">
                  {selectedMonument.nombre}
                </p>
              </div>
            )}
          </div>

          {/* ── Contenido ── */}
          <div className="px-3 pt-2 pb-2.5 space-y-1.5 overflow-y-auto flex-1">

            {/* FASE IDLE */}
            {navPhase === 'idle' && (
              <div className="space-y-3 mt-1.5">
                {selectedStopIndex >= 0 && completedStops[selectedStopIndex] && (
                  <p className={`text-[11px] text-gray-500 leading-relaxed text-justify hyphens-auto${historyExpanded ? '' : ' line-clamp-4'}`} lang="es">
                    {selectedMonument.descripcion ?? ''}
                  </p>
                )}
                {selectedStopIndex >= 0 && completedStops[selectedStopIndex] ? (
                  !historyExpanded && (
                    <button
                      onClick={() => setHistoryExpanded(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 active:opacity-70 transition-opacity"
                    >
                      <i className="ri-book-open-line text-sm" style={{ color: '#00bbb4' }} />
                      <span className="text-xs font-semibold" style={{ color: '#00bbb4' }}>Leer historia de nuevo</span>
                    </button>
                  )
                ) : (
                  <>
                    <button
                      onClick={handleStartRoute}
                      className="w-full rounded-full flex items-center px-2 py-3 active:scale-[0.98] transition-transform"
                      style={{ background: '#096d7d' }}
                    >
                      <span className="flex-1 flex gap-1.5 items-center justify-center text-center text-white text-md font-semibold tracking-wide">
                        <i className="ri-footprint-fill text-lg" /> Como llegar
                      </span>
                    </button>

                    {/* ── Botón Comenzar Reto (geo-fenced) ── */}
                    {selectedMonumentIsAvailable && (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={canStartChallenge ? handleStartQuiz : undefined}
                          disabled={!canStartChallenge}
                          className="w-full rounded-full flex items-center px-2 py-3 transition-all active:scale-[0.98] disabled:active:scale-100"
                          style={{
                            background: canStartChallenge
                              ? 'linear-gradient(135deg,#e0344b 0%,#ff9447 100%)'
                              : 'rgba(0,0,0,0.06)',
                            border: canStartChallenge ? 'none' : '1.5px solid rgba(0,0,0,0.1)',
                            boxShadow: canStartChallenge ? '0 4px 16px rgba(224,52,75,0.28)' : 'none',
                            cursor: canStartChallenge ? 'pointer' : 'not-allowed',
                            opacity: canStartChallenge ? 1 : 0.65,
                          }}
                        >
                          <span
                            className="flex-1 flex gap-1.5 items-center justify-center text-center text-md font-semibold tracking-wide"
                            style={{ color: canStartChallenge ? '#ffffff' : '#64748b' }}
                          >
                            <i className={`text-lg ${canStartChallenge ? 'ri-sword-fill' : 'ri-map-pin-time-line'}`} />
                            {canStartChallenge ? t('map.start_challenge') : 'Comenzar Reto'}
                          </span>
                        </button>

                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* FASE PREVIEW */}
            {navPhase === 'preview' && (
              <div className="space-y-2.5 animate-fade-in">
                {routeInfo ? (
                  <div className="flex items-stretch gap-2">
                    <div className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 flex-1" style={{ background: 'rgba(0,187,180,0.08)' }}>
                      <i className="ri-walk-line text-base" style={{ color: '#096d7d' }} />
                      <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: '#00bbb4' }}>Distancia</span>
                      <span className="text-xs font-extrabold" style={{ color: '#096d7d' }}>{routeInfo.distanceKm} km</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 flex-1" style={{ background: 'rgba(0,187,180,0.08)' }}>
                      <i className="ri-time-line text-base" style={{ color: '#096d7d' }} />
                      <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: '#00bbb4' }}>Tiempo</span>
                      <span className="text-xs font-extrabold" style={{ color: '#096d7d' }}>{formatDuration(routeInfo.durationMin)}</span>
                    </div>
                    <button
                      onClick={handleStartNavigation}
                      className="flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-2xl text-white font-bold text-sm flex-[1.4] transition-all active:scale-95"
                      style={{ background: '#096d7d' }}
                    >
                      <i className="ri-navigation-fill text-xl" />
                      <span>{t('map.navigate')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-3">
                    <span className="text-xs text-gray-400 italic animate-pulse">{t('map.calculating')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </>
      )}

      {/* ── Quiz Flow ────────────────────────────────────────────── */}
      {quizFlow.step === 'history' && (() => {
        const advance = () => setQuizFlow({ step: 'quiz', stopIndex: quizFlow.stopIndex, monument: quizFlow.monument, quizData: quizFlow.quizData, retryCount: 0 })
        return (
          <HistoryCard
            stopIndex={quizFlow.stopIndex}
            narration={quizFlow.quizData.narration}
            audioUrl={quizFlow.quizData.audioUrl}
            monumentName={quizFlow.monument.nombre}
            monumentImage={quizFlow.monument.imagen}
            isMuted={!soundEnabled}
            onClose={() => setQuizFlow({ step: 'idle' })}
            onContinue={advance}
          />
        )
      })()}
      {quizFlow.step === 'quiz' && (
        <QuizCard
          key={quizFlow.retryCount}
          stopId={quizFlow.quizData.stopId}
          seasonId={currentSeasonId}
          questions={quizFlow.quizData.questions}
          onComplete={(earnedPoints, correctCount) =>
            handleQuizComplete(quizFlow.stopIndex, quizFlow.monument, earnedPoints, correctCount, quizFlow.quizData, quizFlow.retryCount)
          }
          onClose={() => setQuizFlow({ step: 'idle' })}
        />
      )}
      {quizFlow.step === 'roulette' && (
        <RouletteCard
          stopIndex={quizFlow.stopIndex}
          seasonId={currentSeasonId}
          stageId={quizFlow.stageId}
          onSpinComplete={(claimedPrize) => {
            if (claimedPrize.prizeId === '__empty__') {
              // Sin premio — ir directo a la siguiente parada sin mostrar PrizeCard
              const idx = quizFlow.stopIndex
              setCompletedStops(prev => { const n = [...prev]; n[idx] = true; return n })
              setSelectedMonument(null)
              if (quizFlow.showRanking) {
                setQuizFlow({ step: 'ranking_end', stopIndex: idx })
              } else {
                setQuizFlow({ step: 'idle' })
              }
            } else {
              setQuizFlow({ step: 'prize', stopIndex: quizFlow.stopIndex, monument: quizFlow.monument, showRanking: quizFlow.showRanking, claimedPrize })
            }
          }}
        />
      )}
      {quizFlow.step === 'prize' && (
        <PrizeCard
          prize={quizFlow.claimedPrize}
          stopIndex={quizFlow.stopIndex}
          monumentImage={quizFlow.monument.imagen}
          isLastStop={quizFlow.showRanking}
          onContinue={() => {
            const showRanking = quizFlow.showRanking
            const idx = quizFlow.stopIndex
            setCompletedStops(prev => { const n = [...prev]; n[idx] = true; return n })
            setSelectedMonument(null)
            if (showRanking) {
              setQuizFlow({ step: 'ranking_end', stopIndex: idx })
            } else {
              setQuizFlow({ step: 'idle' })
            }
          }}
        />
      )}
      {quizFlow.step === 'ranking_end' && (
        <div className="fixed inset-0 z-60">
          <Ranking
            onClose={() => setQuizFlow({ step: 'idle' })}
            onContinue={() => setQuizFlow({ step: 'idle' })}
          />
        </div>
      )}
      {quizFlow.step === 'levelup' && (() => {
        const { stopIndex, monument, earnedPoints, mode, quizData, retryCount } = quizFlow
        const doRetry = () => setQuizFlow({ step: 'quiz', stopIndex, monument, quizData, retryCount: retryCount + 1 })
        return (
          <LevelUpCard
            level={completedStops.filter(Boolean).length + 1}
            coins={earnedPoints}
            stopNumber={stopIndex + 1}
            stopName={monument.nombre}
            mode={mode}
            onContinue={mode === 'complete' ? () => handleStopComplete(stopIndex) : doRetry}
            onBackToMap={mode === 'complete' ? () => handleStopComplete(stopIndex) : () => setQuizFlow({ step: 'idle' })}
          />
        )
      })()}
      {quizFlow.step === 'quiz_failed' && (() => {
        const { stopIndex, monument, quizData, retryCount } = quizFlow
        return (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center px-6"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
          >
            <div
              className="w-full max-w-[320px] rounded-3xl overflow-hidden"
              style={{ background: '#ffffff', boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(9,109,125,0.12)' }}
            >
              <div className="flex flex-col items-center gap-4 px-6 py-6 text-center">
                {/* Ícono */}
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ background: 'linear-gradient(135deg,#ff9447 0%,#e0344b 100%)', boxShadow: '0 8px 24px rgba(224,52,75,0.35)' }}
                >
                  <i className="ri-close-circle-fill text-3xl text-white" />
                </div>

                {/* Texto */}
                <div>
                  <p className="text-base font-black mb-1" style={{ color: '#096d7d' }}>
                    {t('map.quiz_failed_title')}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(9,109,125,0.65)' }}>
                    {t('map.quiz_failed_msg')}
                  </p>
                </div>

                {/* Botones */}
                <div className="flex gap-2.5 w-full mt-1">
                  <button
                    onClick={() => setQuizFlow({ step: 'idle' })}
                    className="flex-1 h-12 rounded-xl text-sm font-bold transition-all active:scale-95"
                    style={{ background: '#f5fdfc', border: '1.5px solid rgba(0,187,180,0.25)', color: '#096d7d' }}
                  >
                    {t('map.back_map')}
                  </button>
                  <button
                    onClick={() => setQuizFlow({ step: 'quiz', stopIndex, monument, quizData, retryCount: retryCount + 1 })}
                    className="flex-[2] h-12 rounded-xl text-sm font-black text-white transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg,#096d7d 0%,#00bbb4 100%)', boxShadow: '0 4px 16px rgba(0,187,180,0.35)' }}
                  >
                    {t('map.quiz_retry')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Menú pantalla completa ───────────────────────────────── */}
      {showMenu && menuView === 'main' && (
        <div
          className="fixed inset-0 z-50 flex flex-col menu-fullscreen-enter overflow-hidden"
          style={{ background: 'linear-gradient(to bottom, #075f6e 0%, #00bbb4 100%)' }}
        >
          {/* ── Zona teal ── */}
          <div className="shrink-0 px-5 pt-5">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: 'rgba(255,255,255,0.18)' }}
              >
                <i className="ri-shut-down-line text-xl text-white" />
              </button>
              <span className="font-black text-sm text-white tracking-widest uppercase">Menú</span>
              <button
                onClick={() => setShowMenu(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: 'rgba(255,255,255,0.18)' }}
              >
                <i className="ri-close-line text-xl text-white" />
              </button>
            </div>

            {/* Avatar + nombre */}
            <div className="flex flex-col items-center gap-1.5 pb-5">
              <div
                className="h-16 w-16 rounded-full overflow-hidden flex items-center justify-center"
                style={{ border: '4px solid #ffffff', boxShadow: '0 8px 28px rgba(0,0,0,0.22)', background: 'linear-gradient(135deg,#18d5cd 0%,#096d7d 100%)' }}
              >
                {auth.currentUser?.photoURL ? (
                  <img src={auth.currentUser.photoURL} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-white leading-none">
                    {auth.currentUser?.displayName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <h3 className="font-black text-base mt-1" style={{ color: '#e5dcc6' }}>
                {auth.currentUser?.displayName || ''}
              </h3>
              <p className="text-[11px]" style={{ color: 'rgba(229,220,198,0.65)' }}>
                {auth.currentUser?.email || ''}
              </p>
            </div>
          </div>

          {/* ── Card blanca ── */}
          <div
            className="flex-1 min-h-0 rounded-t-3xl flex flex-col overflow-hidden"
            style={{ background: '#f5fdfc', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)' }}
          >

          {/* Contenido scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 min-h-0" style={{ scrollbarWidth: 'none' }}>

            {/* ── Cuenta ── */}
            <section className="menu-section-in" style={{ animationDelay: '0.06s' }}>
              <h4 className="text-xs font-black uppercase tracking-widest mb-2 px-1" style={{ color: 'rgba(9,109,125,0.5)' }}>{t('map.menu_account')}</h4>
              <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,187,180,0.18)', boxShadow: '0 2px 12px rgba(0,187,180,0.06)' }}>
                {([
                  { icon: 'ri-user-3-line',        label: t('map.menu_edit_profile'),    action: () => setMenuView('edit_profile') },
                  { icon: 'ri-lock-password-line', label: t('map.menu_change_password'), action: () => setMenuView('change_password') },
                ] as { icon: string; label: string; action: () => void }[]).map((item, i, arr) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors"
                    style={i < arr.length - 1 ? { borderBottom: '1px solid rgba(0,187,180,0.1)' } : undefined}
                  >
                    <i className={`${item.icon} text-lg shrink-0`} style={{ color: '#00bbb4', width: '20px' }} />
                    <span className="text-sm font-semibold flex-1" style={{ color: '#096d7d' }}>{item.label}</span>
                    <i className="ri-arrow-right-s-line text-xl" style={{ color: 'rgba(0,187,180,0.45)' }} />
                  </button>
                ))}
              </div>
            </section>

            {/* ── Juego ── */}
            <section className="menu-section-in" style={{ animationDelay: '0.13s' }}>
              <h4 className="text-xs font-black uppercase tracking-widest mb-2 px-1" style={{ color: 'rgba(9,109,125,0.5)' }}>{t('map.menu_game')}</h4>
              <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,187,180,0.18)', boxShadow: '0 2px 12px rgba(0,187,180,0.06)' }}>
                {([
                  { icon: 'ri-bar-chart-2-line', label: t('map.menu_progress'), action: () => setMenuView('progress') },
                  { icon: 'ri-trophy-line',       label: t('map.menu_ranking'),  action: () => setMenuView('ranking') },
                  { icon: 'ri-gift-2-line',       label: t('map.menu_prizes'),   action: () => setMenuView('my_prizes') },
                ] as { icon: string; label: string; action?: () => void }[]).map((item, i, arr) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors"
                    style={i < arr.length - 1 ? { borderBottom: '1px solid rgba(0,187,180,0.1)' } : undefined}
                  >
                    <i className={`${item.icon} text-lg shrink-0`} style={{ color: '#00bbb4', width: '20px' }} />
                    <span className="text-sm font-semibold flex-1" style={{ color: '#096d7d' }}>{item.label}</span>
                    <i className="ri-arrow-right-s-line text-xl" style={{ color: 'rgba(0,187,180,0.45)' }} />
                  </button>
                ))}
              </div>
            </section>

            {/* ── Preferencias ── */}
            <section className="menu-section-in" style={{ animationDelay: '0.20s' }}>
              <h4 className="text-xs font-black uppercase tracking-widest mb-2 px-1" style={{ color: 'rgba(9,109,125,0.5)' }}>{t('map.menu_preferences')}</h4>
              <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,187,180,0.18)', boxShadow: '0 2px 12px rgba(0,187,180,0.06)' }}>
                {/* Idioma */}
                <div className="flex items-center gap-3.5 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(0,187,180,0.1)' }}>
                  <i className="ri-global-line text-lg shrink-0" style={{ color: '#00bbb4', width: '20px' }} />
                  <span className="text-sm font-semibold flex-1" style={{ color: '#096d7d' }}>{t('map.menu_language')}</span>
                  <div className="flex rounded-full overflow-hidden" style={{ background: 'rgba(0,187,180,0.08)', border: '1px solid rgba(0,187,180,0.25)' }}>
                    {(['ES', 'EN'] as const).map(lang => (
                      <button
                        key={lang}
                        onClick={() => i18n.changeLanguage(lang.toLowerCase())}
                        className="px-3.5 py-1 text-xs font-black transition-all"
                        style={i18n.language === lang.toLowerCase() ? { background: '#00bbb4', color: '#ffffff' } : { color: 'rgba(9,109,125,0.55)' }}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Ubicación */}
                <div className="flex flex-col" style={{ borderBottom: '1px solid rgba(0,187,180,0.1)' }}>
                  <div className="flex items-center gap-3.5 px-4 py-3.5">
                    <i className="ri-map-pin-2-line text-lg shrink-0" style={{ color: '#00bbb4', width: '20px' }} />
                    <span className="text-sm font-semibold flex-1" style={{ color: '#096d7d' }}>{t('map.menu_location')}</span>
                    <button
                      onClick={() => {
                        if (locationGranted) {
                          // No se puede revocar por JS — mostrar/ocultar hint
                          setLocationToggleMsg(p => !p)
                        } else if (!navigator.geolocation) {
                          setLocationGranted(true)
                        } else {
                          navigator.permissions?.query({ name: 'geolocation' as PermissionName })
                            .then(result => {
                              if (result.state === 'granted') {
                                // Ya tiene permiso — sincronizar toggle sin popup
                                setLocationGranted(true)
                                setLocationToggleMsg(false)
                              } else if (result.state === 'prompt') {
                                // Lanza el diálogo nativo del navegador
                                navigator.geolocation.getCurrentPosition(
                                  () => { setLocationGranted(true); setLocationToggleMsg(false) },
                                  () => {},
                                  { enableHighAccuracy: true, timeout: 10000 }
                                )
                              } else {
                                // denied — solo hint inline, sin popup
                                setLocationToggleMsg(true)
                              }
                            })
                            .catch(() => {
                              // Sin API de permisos (Safari) — intentar directamente
                              navigator.geolocation.getCurrentPosition(
                                () => { setLocationGranted(true); setLocationToggleMsg(false) },
                                () => { setLocationToggleMsg(true) },
                                { enableHighAccuracy: true, timeout: 10000 }
                              )
                            })
                        }
                      }}
                      className="relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0"
                      style={{ background: locationGranted ? '#00bbb4' : 'rgba(0,187,180,0.18)' }}
                    >
                      <span
                        className="absolute top-0.5 rounded-full shadow transition-all duration-200"
                        style={{ width: '20px', height: '20px', background: '#ffffff', left: locationGranted ? 'calc(100% - 22px)' : '2px' }}
                      />
                    </button>
                  </div>
                  {locationToggleMsg && (
                    <div className="flex items-center gap-2 px-4 pb-3 animate-fade-in">
                      <i className="ri-alert-line text-sm shrink-0" style={{ color: '#ff9447' }} />
                      <p className="text-[11px] leading-snug flex-1 font-semibold" style={{ color: '#ff9447' }}>
                        {t(locationGranted ? 'map.location_disable_hint' : 'map.location_denied_hint')}
                      </p>
                    </div>
                  )}
                </div>
                {/* Sonido de Narración */}
                <div className="flex items-center gap-3.5 px-4 py-3.5">
                  <i className={`text-lg shrink-0 ${soundEnabled ? 'ri-volume-up-line' : 'ri-volume-mute-line'}`} style={{ color: '#00bbb4', width: '20px' }} />
                  <span className="text-sm font-semibold flex-1" style={{ color: '#096d7d' }}>{t('map.menu_sound')}</span>
                  <button
                    onClick={() => setSoundEnabled(p => !p)}
                    className="relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0"
                    style={{ background: soundEnabled ? '#00bbb4' : 'rgba(0,187,180,0.18)' }}
                  >
                    <span
                      className="absolute top-0.5 rounded-full shadow transition-all duration-200"
                      style={{ width: '20px', height: '20px', background: '#ffffff', left: soundEnabled ? 'calc(100% - 22px)' : '2px' }}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* ── Información ── */}
            <section className="menu-section-in" style={{ animationDelay: '0.20s' }}>
              <h4 className="text-xs font-black uppercase tracking-widest mb-2 px-1" style={{ color: 'rgba(9,109,125,0.5)' }}>{t('map.menu_info')}</h4>
              <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid rgba(0,187,180,0.18)', boxShadow: '0 2px 12px rgba(0,187,180,0.06)' }}>
                {([
                  { icon: 'ri-book-2-line',        label: t('map.menu_rules'),   action: () => setMenuView('rally_rules') },
                  { icon: 'ri-file-shield-2-line', label: t('map.menu_privacy'), action: () => setMenuView('privacy') },
                  { icon: 'ri-information-line',   label: t('map.menu_about'),   action: () => setMenuView('about') },
                ] as { icon: string; label: string; action: () => void }[]).map((item, i, arr) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors"
                    style={i < arr.length - 1 ? { borderBottom: '1px solid rgba(0,187,180,0.1)' } : undefined}
                  >
                    <i className={`${item.icon} text-lg shrink-0`} style={{ color: '#00bbb4', width: '20px' }} />
                    <span className="text-sm font-semibold flex-1" style={{ color: '#096d7d' }}>{item.label}</span>
                    <i className="ri-arrow-right-s-line text-xl" style={{ color: 'rgba(0,187,180,0.45)' }} />
                  </button>
                ))}
              </div>
            </section>

          </div>
          </div>{/* card blanca */}
        </div>
      )}

      {/* ── Ranking desde menú ───────────────────────────────────── */}
      {showMenu && menuView === 'ranking' && (
        <div className="fixed inset-0 z-60">
          <Ranking
            onClose={() => setMenuView('main')}
            onContinue={() => { setMenuView('main'); setShowMenu(false) }}
          />
        </div>
      )}

      {/* ── Vistas del menú ─────────────────────────────────────── */}
      {showMenu && menuView === 'edit_profile'   && <EditProfile   onBack={() => setMenuView('main')} />}
      {showMenu && menuView === 'change_password' && <ChangePassword onBack={() => setMenuView('main')} />}
      {showMenu && menuView === 'progress'        && <Progress       onBack={() => setMenuView('main')} completedStops={completedStops} monuments={monuments ?? []} stageGroups={stageGroups} seasonName={seasonName} />}
      {showMenu && menuView === 'my_prizes'       && <MyPrizes      onBack={() => setMenuView('main')} />}
      {showMenu && menuView === 'rally_rules'     && <RallyRules    onBack={() => setMenuView('main')} />}
      {showMenu && menuView === 'privacy'         && <PrivacyTerms  onBack={() => setMenuView('main')} />}
      {showMenu && menuView === 'about'           && <AboutApp      onBack={() => setMenuView('main')} />}

      {/* ── Location Gate ────────────────────────────────────────── */}
      {showLocationGate && !mapLoading && (
        <LocationGate
          onDismiss={() => setShowLocationGate(false)}
        />
      )}

      {/* ── Card de alerta: parada/etapa bloqueada ─────────────── */}
      {lockedAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
          onClick={() => setLockedAlert(null)}
        >
          <div
            className="lock-alert-pop w-full max-w-[320px] rounded-3xl overflow-hidden"
            style={{ background: '#ffffff', boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(9,109,125,0.12)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Franja superior teal */}
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#075f6e,#00bbb4,#18d5cd)' }} />

            <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
              {/* Ícono candado */}
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: 'linear-gradient(135deg,#18d5cd 0%,#096d7d 100%)', boxShadow: '0 8px 24px rgba(0,187,180,0.35)' }}
              >
                <i className="ri-lock-2-fill text-3xl text-white" />
              </div>

              {/* Etiqueta + título */}
              <div>
                <p className="text-[10px] font-black tracking-widest uppercase mb-1" style={{ color: '#00bbb4' }}>
                  {lockedAlert.type === 'stage' ? t('map.stage', { n: lockedAlert.blockedStageIdx + 1 }) : t('map.locked_stop_label')}
                </p>
                <h3 className="text-lg font-black" style={{ color: '#096d7d' }}>
                  {t('map.locked_title')}
                </h3>
              </div>

              {/* Mensaje */}
              <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(9,109,125,0.7)' }}>
                {lockedAlert.type === 'stage'
                  ? t('map.locked_stage_msg', { n: activeStageIndex + 1 })
                  : t('map.locked_stop_msg', { name: lockedAlert.availableStopName })
                }
              </p>

              {/* Botón */}
              <button
                onClick={() => setLockedAlert(null)}
                className="mt-1 w-full rounded-xl py-3 text-xs font-black tracking-widest text-white uppercase transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg,#096d7d 0%,#00bbb4 100%)', boxShadow: '0 4px 16px rgba(0,187,180,0.35)' }}
              >
                {t('map.understood')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Alerta: usuario demasiado lejos de la parada ──────────── */}
      {tooFarAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
          onClick={() => setTooFarAlert(false)}
        >
          <div
            className="lock-alert-pop w-full max-w-[320px] rounded-3xl overflow-hidden"
            style={{ background: '#ffffff', boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(9,109,125,0.12)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#075f6e,#00bbb4,#18d5cd)' }} />
            <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: 'linear-gradient(135deg,#18d5cd 0%,#096d7d 100%)', boxShadow: '0 8px 24px rgba(0,187,180,0.35)' }}
              >
                <i className="ri-lock-2-fill text-3xl text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-widest uppercase mb-1" style={{ color: '#00bbb4' }}>
                  Reto bloqueado
                </p>
                <h3 className="text-lg font-black" style={{ color: '#096d7d' }}>
                  ¡Estás muy lejos!
                </h3>
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(9,109,125,0.7)' }}>
                Debes estar a menos de <strong>{geoLimitRadius} metros</strong> de la parada para poder iniciar el reto.
              </p>
              <button
                onClick={() => setTooFarAlert(false)}
                className="mt-1 w-full rounded-xl py-3 text-xs font-black tracking-widest text-white uppercase transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg,#096d7d 0%,#00bbb4 100%)', boxShadow: '0 4px 16px rgba(0,187,180,0.35)' }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sin preguntas configuradas ─────────────────────────────── */}
      {noQuestionsAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
          onClick={() => setNoQuestionsAlert(false)}
        >
          <div
            className="lock-alert-pop w-full max-w-[320px] rounded-3xl overflow-hidden"
            style={{ background: '#ffffff', boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(9,109,125,0.12)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#e0344b,#ff9447)' }} />
            <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: 'linear-gradient(135deg,#ff9447 0%,#e0344b 100%)', boxShadow: '0 8px 24px rgba(224,52,75,0.3)' }}
              >
                <i className="ri-tools-fill text-3xl text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-widest uppercase mb-1" style={{ color: '#e0344b' }}>
                  Parada en preparación
                </p>
                <h3 className="text-lg font-black" style={{ color: '#096d7d' }}>
                  ¡Casi lista!
                </h3>
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(9,109,125,0.7)' }}>
                Esta parada aún no tiene preguntas configuradas. Vuelve pronto, ¡estará lista muy pronto!
              </p>
              <button
                onClick={() => setNoQuestionsAlert(false)}
                className="mt-1 w-full rounded-xl py-3 text-xs font-black tracking-widest text-white uppercase transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg,#096d7d 0%,#00bbb4 100%)', boxShadow: '0 4px 16px rgba(0,187,180,0.35)' }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Middleware: bloqueo de temporada / etapa / parada ──────── */}
      {statusBlock && (
        <StatusBlockCard
          type={statusBlock.type}
          name={statusBlock.name}
          onDismiss={handleDismissBlock}
          onNextStop={statusBlock.type === 'stop_deactivated' && nextAvailableStopIndex >= 0 ? handleNextStop : undefined}
        />
      )}

      {/* ── Feature Tour (primera visita) ───────────────────────────── */}
      <FeatureTour ready={!mapLoading} userId={auth.currentUser?.uid} />

    </div>
  )
}
