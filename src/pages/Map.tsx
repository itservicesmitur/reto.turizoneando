import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import MapBoard, { type MapBoardHandle, type RouteInfo } from '../features/map/MapBoard'
import type { Monumento } from '../features/map/types/map.types'
import { MONUMENTS_DATA } from '../features/map/data/monumentsData'
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

const STOPS_PER_STAGE = 4
const COINS_PER_STOP  = 100

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

type QuizStep =
  | { step: 'idle' }
  | { step: 'history';  stopIndex: number; monument: Monumento }
  | { step: 'quiz';     stopIndex: number; monument: Monumento }
  | { step: 'roulette'; stopIndex: number; monument: Monumento }
  | { step: 'prize';    stopIndex: number; monument: Monumento }
  | { step: 'levelup';  stopIndex: number; monument: Monumento }

export default function Map() {
  const [selectedMonument, setSelectedMonument] = useState<Monumento | null>(null)
  const [mapLoading, setMapLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)
  const [timerFinished, setTimerFinished] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [navPhase, setNavPhase] = useState<'idle' | 'preview' | 'navigating'>('idle')
  const [isHudExpanded, setIsHudExpanded] = useState(false)
  const [expandedStage, setExpandedStage] = useState<number | null>(0)
  const mapControlsRef = useRef<MapBoardHandle>(null)

  const [completedStops, setCompletedStops] = useState<boolean[]>(Array(MONUMENTS_DATA.length).fill(false))
  const [lockedAlert, setLockedAlert] = useState<
    { type: 'stage'; blockedStageIdx: number } |
    { type: 'stop'; availableStopName: string } |
    null
  >(null)

  const activeStageIndex = useMemo(() => {
    const stageCount = MONUMENTS_DATA.length / STOPS_PER_STAGE
    for (let s = 0; s < stageCount - 1; s++) {
      if (!completedStops.slice(s * STOPS_PER_STAGE, (s + 1) * STOPS_PER_STAGE).every(Boolean)) return s
    }
    return stageCount - 1
  }, [completedStops])

  useEffect(() => {
    setExpandedStage(activeStageIndex)
  }, [activeStageIndex])

  const stages = useMemo<{ roman: string; status: StageStatus }[]>(() => [
    { roman: 'I'   },
    { roman: 'II'  },
    { roman: 'III' },
  ].map((s, idx) => {
    const allDone = completedStops.slice(idx * STOPS_PER_STAGE, (idx + 1) * STOPS_PER_STAGE).every(Boolean)
    const status: StageStatus = allDone ? 'done' : idx === activeStageIndex ? 'active' : 'locked'
    return { ...s, status }
  }), [completedStops, activeStageIndex])

  const { t, i18n } = useTranslation()

  // ── Menu pantalla completa ────────────────────────────────────
  const [showMenu, setShowMenu] = useState(false)
  const [menuView, setMenuView] = useState<MenuView>('main')
  const [menuBtnAnimating, setMenuBtnAnimating] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [locationEnabled, setLocationEnabled] = useState(true)
  const [soundLevel, setSoundLevel] = useState(75)

  const openMenu = useCallback(() => {
    setMenuBtnAnimating(true)
    setShowMenu(true)
    setMenuView('main')
    setTimeout(() => setMenuBtnAnimating(false), 450)
  }, [])

  // ── Quiz flow ────────────────────────────────────────────────
  const [quizFlow, setQuizFlow] = useState<QuizStep>({ step: 'idle' })

  const selectedStopIndex = useMemo(() => {
    if (!selectedMonument) return -1
    return MONUMENTS_DATA.findIndex(m => m.nombre === selectedMonument.nombre)
  }, [selectedMonument])

  const selectedMonumentIsAvailable = useMemo(() => {
    if (!selectedMonument || selectedStopIndex < 0 || completedStops[selectedStopIndex]) return false
    const stageIdx = Math.floor(selectedStopIndex / STOPS_PER_STAGE)
    const prevStagesDone = stageIdx === 0 ? true : completedStops.slice(0, stageIdx * STOPS_PER_STAGE).every(Boolean)
    return prevStagesDone && stageIdx === activeStageIndex
  }, [selectedMonument, selectedStopIndex, completedStops, activeStageIndex])

  const handleStartQuiz = useCallback(() => {
    if (!selectedMonument || selectedStopIndex < 0) return
    setQuizFlow({ step: 'history', stopIndex: selectedStopIndex, monument: selectedMonument })
  }, [selectedMonument, selectedStopIndex])

  const handleQuizComplete = useCallback((stopIndex: number, monument: Monumento) => {
    const isLastStop = stopIndex === MONUMENTS_DATA.length - 1
    if (isLastStop) {
      setQuizFlow({ step: 'roulette', stopIndex, monument })
    } else {
      setQuizFlow({ step: 'levelup', stopIndex, monument })
    }
  }, [])

  const handleStopComplete = useCallback((stopIndex: number) => {
    setCompletedStops(prev => {
      const next = [...prev]
      next[stopIndex] = true
      return next
    })
    setQuizFlow({ step: 'idle' })
    setSelectedMonument(null)
  }, [])

  const prevCompletedStopsRef = useRef<boolean[]>(completedStops)
  useEffect(() => {
    const prev = prevCompletedStopsRef.current
    prevCompletedStopsRef.current = completedStops
    if (prev === completedStops) return
    const stageStart = activeStageIndex * STOPS_PER_STAGE
    for (let i = stageStart; i < stageStart + STOPS_PER_STAGE; i++) {
      if (!completedStops[i]) {
        mapControlsRef.current?.focusOnStop(i)
        break
      }
    }
  }, [completedStops, activeStageIndex])

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
      mapControlsRef.current?.returnToOrigin()
    }
    setRouteInfo(null)
    setNavPhase('idle')
    setIsHudExpanded(false)
    setSelectedMonument(null)
  }, [navPhase])

  // "IR AL RETO": traza ruta y transiciona a fase preview
  const handleStartRoute = useCallback(() => {
    if (!selectedMonument) return
    setRouteInfo(null)
    setNavPhase('preview')
    mapControlsRef.current?.startNavigation(
      selectedMonument.lat,
      selectedMonument.lng,
      (info) => setRouteInfo(info)
    )
  }, [selectedMonument])

  // "INICIAR": enfoca cámara en posición del usuario y activa HUD de navegación
  const handleStartNavigation = useCallback(() => {
    mapControlsRef.current?.focusOnUser()
    mapControlsRef.current?.setNavActive(true)
    setNavPhase('navigating')
    setIsHudExpanded(true)
  }, [])

  // Resetea estado de navegación al seleccionar un monumento diferente
  useEffect(() => {
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
    const timer = setTimeout(() => setTimerFinished(true), 2500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (mapReady && timerFinished) setMapLoading(false)
  }, [mapReady, timerFinished])


  return (
    <div className="relative h-screen w-screen overflow-hidden bg-map-wood-deep font-sans">

      {/* ── Pantalla de Carga Inmersiva ──────────────────────────── */}
      {mapLoading && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-4"
          style={{ background: 'radial-gradient(circle, var(--color-map-wood-mid) 0%, var(--color-map-wood-deep) 100%)' }}
        >
          <div className="load-skull mb-6 select-none animate-skull">
            <img
              src="/assets/img/logo1.png"
              alt="Logo Turizoneando"
              className="h-22 md:h-28 object-contain"
              style={{ filter: 'sepia(0.6) saturate(1.3) contrast(1.05) brightness(0.95) drop-shadow(0 6px 16px rgba(252,211,77,0.25))' }}
            />
          </div>
          <h2
            className="text-2xl md:text-2xl font-normal text-map-gold-light tracking-wider animate-glow-text"
            style={{ fontFamily: "'UnifrakturMaguntia', cursive" }}
          >
            {t('map.loading_title')}
          </h2>
          <p className="mt-3 text-xs md:text-sm italic text-[#fff3d1]/70 tracking-wider font-serif">
            {t('map.loading_subtitle')}
          </p>
        </div>
      )}

      {/* ── Marco decorativo vintage ─────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 z-30">
        <div className="absolute inset-0 shadow-[inset_0_0_60px_30px_var(--color-map-wood-deep)]" />
        <svg viewBox="0 0 1200 700" preserveAspectRatio="none" className="h-full w-full absolute inset-0" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="roughen">
              <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="2" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={3} />
            </filter>
          </defs>
          <rect x="8" y="8" width="1185" height="685" fill="none" stroke="var(--color-map-gold)" strokeWidth="2" rx="4" filter="url(#roughen)" />
          <rect x="13" y="13" width="1175" height="675" fill="none" stroke="var(--color-map-wood-dark)" strokeWidth="1.2" rx="3.5" opacity="0.75" />
        </svg>
      </div>


      {/* ── Botón pantalla completa top-left ─────────────────────── */}
      {!mapLoading && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-7.5 left-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border-2 border-map-gold bg-map-wood-mid/95 backdrop-blur-md text-map-gold-light active:scale-90 transition-all"
          style={{ boxShadow: '0 4px 24px rgba(168,127,42,0.45), inset 0 1px 0 rgba(252,211,77,0.12)' }}
          aria-label={isFullscreen ? t('map.aria_fullscreen_exit') : t('map.aria_fullscreen_enter')}
        >
          <i className={isFullscreen ? 'ri-fullscreen-exit-line text-xl' : 'ri-fullscreen-line text-xl'} />
        </button>
      )}

      {/* ── Botón menú top-right ─────────────────────────────────── */}
      {!mapLoading && (
        <button
          onClick={openMenu}
          className={`absolute top-7.5 right-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border-2 border-map-gold bg-map-wood-mid/95 backdrop-blur-md text-map-gold-light transition-all ${menuBtnAnimating ? 'menu-btn-pulse' : ''}`}
          style={{ boxShadow: '0 4px 24px rgba(168,127,42,0.45), inset 0 1px 0 rgba(252,211,77,0.12)' }}
          aria-label={t('map.aria_open_menu')}
        >
          <i className="ri-menu-line text-xl" />
        </button>
      )}

      {/* ── Barra top-center: Menú + Etapas + Ajustes ─────────────── */}
      {!mapLoading && navPhase !== 'navigating' && (
        <div className="absolute top-7.5 left-1/2 -translate-x-1/2 z-30">
          <div
            className="flex items-center gap-2 rounded-full border-2 border-map-gold bg-map-wood-mid/95 backdrop-blur-md px-2 py-1.5"
            style={{ boxShadow: '0 4px 24px rgba(168,127,42,0.45), inset 0 1px 0 rgba(252,211,77,0.12)' }}
          >
            {/* Etapas */}
            <div className="flex items-center gap-2">
              {stages.map((stage, idx) => {
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
                      boxShadow: open ? '0 0 10px rgba(252,211,77,0.35), 0 2px 8px rgba(0,0,0,0.5)' : '0 2px 6px rgba(0,0,0,0.4)',
                    }}
                    className={`relative h-8 rounded-full bg-linear-to-b from-yellow-300 to-amber-600 border border-yellow-400 flex items-center justify-center overflow-hidden active:scale-90 ${open ? 'px-3 gap-1.5' : 'w-8'}`}>
                    <i className={`ri-checkbox-circle-line text-map-wood-dark shrink-0 ${open ? 'text-xs' : 'text-base'}`} />
                    {open && <span className="text-[10px] font-black text-map-wood-dark uppercase tracking-wide whitespace-nowrap stage-text-reveal">{t('map.stage', { n: idx + 1 })}</span>}
                  </button>
                )

                if (stage.status === 'active') return (
                  <button key={idx} onClick={toggle}
                    style={{
                      ...STAGE_BTN_TRANSITION,
                      boxShadow: open ? '0 0 12px rgba(252,211,77,0.4), 0 2px 8px rgba(0,0,0,0.5)' : '0 0 5px rgba(252,211,77,0.15), 0 2px 6px rgba(0,0,0,0.4)',
                    }}
                    className={`h-8 rounded-full border flex items-center justify-center overflow-hidden active:scale-90 ${open ? 'px-3 gap-1.5 border-map-gold-light bg-map-wood-dark' : 'w-8 border-map-gold-light bg-map-wood-dark'}`}>
                    <i className="ri-compass-3-fill text-xs text-map-gold-light shrink-0" />
                    {open && <span className="text-[10px] font-black text-map-gold-light uppercase tracking-wide whitespace-nowrap stage-text-reveal">{t('map.stage', { n: idx + 1 })}</span>}
                  </button>
                )

                return (
                  <button key={idx} onClick={toggle}
                    style={{
                      ...STAGE_BTN_TRANSITION,
                      boxShadow: open ? '0 0 8px rgba(107,84,36,0.35), 0 2px 8px rgba(0,0,0,0.5)' : '0 2px 6px rgba(0,0,0,0.4)',
                    }}
                    className={`h-8 rounded-full border flex items-center justify-center overflow-hidden active:scale-90 ${open ? 'px-3 gap-1.5 border-map-gold bg-map-wood-dark' : 'w-8 border-map-gold bg-map-wood-mid'}`}>
                    <i className="ri-lock-fill text-xs text-map-gold shrink-0" />
                    {open && <span className="text-[10px] font-black text-map-gold uppercase tracking-wide whitespace-nowrap stage-text-reveal">{t('map.stage', { n: idx + 1 })}</span>}
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
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.5rem)] max-w-[420px] animate-slide-up">
            <div className="rounded-xl overflow-hidden border border-map-gold shadow-2xl bg-map-cream-light">

              {/* Sección expandible: info del monumento */}
              <div
                style={{
                  maxHeight: isHudExpanded ? '160px' : '0px',
                  transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden',
                }}
              >
                <div className="flex items-center gap-4 p-3.5 border-b border-map-gold/30">
                  {/* Foto del monumento */}
                  <div className="h-22 w-30 shrink-0 rounded-sm overflow-hidden border-2 border-map-gold shadow-md">
                    <img
                      src={selectedMonument?.imagen}
                      alt={selectedMonument?.nombre}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {/* Destino → Parada 1 */}
                  <div className="flex flex-col flex-1 gap-1">
                    <div className="flex items-start gap-2">
                      <div>
                        <div className="text-[10px] font-bold text-map-gold uppercase tracking-widest leading-none mb-1">{t('map.destination')}</div>
                        <div className="text-sm font-bold text-map-wood-dark leading-tight font-serif mb-2">{selectedMonument?.nombre}</div>
                        <button
                          onClick={handleStartQuiz}
                          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-map-wood-dark text-map-gold-light rounded-sm w-full active:scale-95 transition-all"
                          style={{ border: '1px solid var(--color-map-gold)', boxShadow: '0 2px 12px rgba(252,211,77,0.15)' }}
                        >
                          <i className="ri-play-circle-line text-xl"></i>
                          <span className="font-bold text-sm">{t('map.start_challenge')}</span>
                        </button>   
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra principal: siempre visible */}
              <div className="flex items-center justify-between gap-2.5 p-3">

                {/* Izquierda: icono modo + distancia + tiempo */}
                <div className="flex items-center gap-4 flex-1">
                  {/* Icono modo de viaje */}
                  <div className="flex flex-col items-center justify-center h-10 w-10 shrink-0 rounded-full bg-map-wood-dark">
                    <i
                      className={`text-xl text-map-gold-light ${routeInfo.travelMode === 'DRIVE' ? 'ri-roadster-fill' : 'ri-walk-line'}`}
                    />
                  </div>

                  {/* Distancia */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-map-gold uppercase tracking-wide leading-none mb-0.5">{t('map.distance')}</span>
                    <span className="text-sm font-extrabold text-map-wood-dark leading-tight">{routeInfo.distanceKm} km</span>
                  </div>

                  <div className="w-px h-8 bg-map-gold/40 shrink-0" />

                  {/* Tiempo */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-map-gold uppercase tracking-wide leading-none mb-0.5">{t('map.time')}</span>
                    <span className="text-sm font-extrabold text-map-wood-dark leading-tight">
                      {formatDuration(routeInfo.durationMin)}
                    </span>
                  </div>
                </div>

                {/* Derecha: X + expandir */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={closeCard}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-map-wood-dark bg-map-gold/20 transition-colors active:scale-90 shadow-lg"
                    aria-label="Cancelar navegación"
                  >
                    <i className="ri-close-large-line"></i>
                  </button>
                  <button
                    onClick={() => setIsHudExpanded(prev => !prev)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-map-wood-dark bg-map-gold/20 shadow-lg transition-all active:scale-90"
                    aria-label={isHudExpanded ? 'Colapsar info' : 'Ver destino'}
                  >
                    <i
                      className="ri-arrow-up-s-line text-2xl"
                      style={{
                        display: 'inline-block',
                        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isHudExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </>
      )}

      {/* ── Tablero del Mapa ─────────────────────────────────────── */}
      <main className="h-full w-full">
        <MapBoard
          ref={mapControlsRef}
          onSelectMonument={setSelectedMonument}
          selectedMonument={selectedMonument}
          onLoadComplete={() => setMapReady(true)}
          startIntroAnimation={!mapLoading}
visibleStage={expandedStage ?? 0}
          completedStops={completedStops}
          onLockedStopClick={handleLockedStopClick}
        />
      </main>


      {/* ── Tarjeta de monumento (fases idle y preview) ──────────── */}
      {selectedMonument && navPhase !== 'navigating' && (
        <div
          key={selectedMonument.nombre}
          className="absolute bottom-6 left-1/2 z-20 w-[calc(100%-1.5rem)] max-w-[370px] -translate-x-1/2 rounded-xl bg-map-cream border border-map-gold shadow-2xl flex flex-col animate-fade-in"
        >
          {/* ── Cabecera de imagen (compartida entre fases) ── */}
          <div className="relative h-36 w-full bg-stone-900 shrink-0 rounded-t-xl overflow-hidden">
            <img
              key={selectedMonument.nombre}
              src={selectedMonument.imagen}
              alt={selectedMonument.nombre}
              className="h-full w-full object-cover animate-fade-in"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-black/30" />
            <div className="absolute bottom-3 left-3 right-10">
              <h2 className="text-base font-bold font-serif text-map-gold-light tracking-wide leading-tight">
                {selectedMonument.nombre}
              </h2>
            </div>
            <button
              onClick={closeCard}
              className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-map-gold-light hover:bg-black/80 transition-colors backdrop-blur-xs"
              aria-label="Cerrar"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── FASE IDLE: descripción + botón IR AL RETO ── */}
          {navPhase === 'idle' && (
            <div className="p-3.5 space-y-3.5 flex-1 overflow-y-auto max-h-[50vh]">
              <div className="bg-map-cream-light border border-map-gold/30 rounded-sm p-3 shadow-inner">
                <p className="text-[11.5px] text-map-wood-dark leading-relaxed font-serif font-medium">
                  {selectedMonument.descripcion}
                </p>
              </div>
              {selectedStopIndex >= 0 && completedStops[selectedStopIndex] ? (
                <div className="flex items-center justify-center gap-1.5 px-1 py-1">
                  <i className="ri-information-line text-sm text-map-gold" />
                  <span className="text-[11.5px] text-map-gold font-serif italic">{t('map.stop_done')}</span>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleStartRoute}
                    className="w-full flex items-center justify-center gap-2 rounded-sm bg-linear-to-r from-map-wood-dark to-map-wood-mid py-2.5 text-sm font-bold text-map-gold-light border border-map-gold/40 shadow-md hover:from-map-wood-mid hover:to-map-wood-dark active:scale-98 transition-all"
                  >
                    <i className="ri-footprint-fill text-xl"></i>
                    {t('map.go_now')}
                  </button>
                  {selectedMonumentIsAvailable && (
                    <button
                      onClick={handleStartQuiz}
                      className="w-full flex items-center justify-center gap-2 rounded-sm py-2.5 text-sm font-black text-map-gold-light active:scale-95 transition-all"
                      style={{
                        background: 'linear-gradient(90deg,#3a1f08,#503019,#3a1f08)',
                        border: '1.5px solid var(--color-map-gold-light)',
                        boxShadow: '0 4px 20px rgba(252,211,77,0.2)',
                      }}
                    >
                      <i className="ri-sword-line text-xl"></i>
                      {t('map.start_quiz')}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── FASE PREVIEW: estilo Google Maps adaptado al tema vintage ── */}
          {navPhase === 'preview' && (
            <div className="p-3.5 space-y-2.5 flex-1 animate-fade-in">
              {routeInfo ? (
                <div className="flex items-stretch gap-2 pb-1">
                  {/* Distancia */}
                  <div className="flex flex-col items-center justify-center gap-1 bg-map-wood-dark/10 hover:bg-map-wood-dark/18 rounded-sm py-2 flex-1 transition-all active:scale-95">
                    <i className="ri-route-line text-xl text-map-gold"></i>
                    <span className="text-xs font-bold text-map-wood-dark tracking-wide leading-none">
                      {routeInfo.distanceKm} km
                    </span>
                  </div>
                  {/* Tiempo */}
                  <div className="flex flex-col items-center justify-center gap-1 bg-map-wood-dark/10 hover:bg-map-wood-dark/18 rounded-sm py-2 flex-1 transition-all active:scale-95">
                    <i className="ri-time-line text-xl text-map-gold"></i>
                    <span className="text-xs font-bold text-map-wood-dark tracking-wide leading-none">
                      {formatDuration(routeInfo.durationMin)}
                    </span>
                  </div>
                  {/* INICIAR — botón principal más grande */}
                  <button
                    onClick={handleStartNavigation}
                    className="flex flex-col items-center justify-center gap-1 bg-map-wood-dark hover:bg-map-wood-dark/80 rounded-sm py-2 px-5 shadow-lg transition-all active:scale-95 flex-[1.6]"
                  >
                    <i className="ri-ship-line text-xl text-map-gold-light"></i>
                    <span className="text-sm font-bold text-map-gold-light tracking-widest leading-none">
                      {t('map.navigate')}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center py-3">
                  <span className="text-xs text-map-gold/60 italic animate-pulse">{t('map.calculating')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Quiz Flow ────────────────────────────────────────────── */}
      {quizFlow.step === 'history' && (() => {
        const advance = () => setQuizFlow({ step: 'quiz', stopIndex: quizFlow.stopIndex, monument: quizFlow.monument })
        return (
          <HistoryCard
            stopIndex={quizFlow.stopIndex}
            monumentName={quizFlow.monument.nombre}
            monumentImage={quizFlow.monument.imagen}
            onSkip={advance}
            onContinue={advance}
          />
        )
      })()}
      {quizFlow.step === 'quiz' && (
        <QuizCard
          stopIndex={quizFlow.stopIndex}
          onComplete={() => handleQuizComplete(quizFlow.stopIndex, quizFlow.monument)}
          onClose={() => setQuizFlow({ step: 'idle' })}
        />
      )}
      {quizFlow.step === 'roulette' && (
        <RouletteCard
          stopIndex={quizFlow.stopIndex}
          onSpinComplete={() => setQuizFlow({ step: 'prize', stopIndex: quizFlow.stopIndex, monument: quizFlow.monument })}
        />
      )}
      {quizFlow.step === 'prize' && (
        <PrizeCard
          stopIndex={quizFlow.stopIndex}
          monumentImage={quizFlow.monument.imagen}
          onContinue={() => handleStopComplete(quizFlow.stopIndex)}
        />
      )}
      {quizFlow.step === 'levelup' && (
        <LevelUpCard
          level={completedStops.filter(Boolean).length + 1}
          coins={COINS_PER_STOP}
          stopNumber={quizFlow.stopIndex + 1}
          stopName={quizFlow.monument.nombre}
          onContinue={() => handleStopComplete(quizFlow.stopIndex)}
          onBackToMap={() => handleStopComplete(quizFlow.stopIndex)}
        />
      )}

      {/* ── Menú pantalla completa ───────────────────────────────── */}
      {showMenu && menuView === 'main' && (
        <div
          className="fixed inset-0 z-50 flex flex-col menu-fullscreen-enter overflow-hidden"
          style={{ background: 'var(--color-map-cream-light)' }}
        >
          {/* Franja dorada superior */}
          <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold),var(--color-map-gold-light),var(--color-map-gold),transparent)' }} />

          {/* Header con perfil */}
          <div
            className="menu-section-in flex items-center gap-3 px-4 py-3 shrink-0"
            style={{ borderBottom: '1px solid rgba(168,127,42,0.2)', animationDelay: '0s' }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center border border-map-gold shrink-0"
                style={{ background: 'linear-gradient(135deg,var(--color-map-wood-dark),var(--color-map-wood-mid))' }}
              >
                <span className="text-sm font-black text-map-gold-light leading-none" style={{ fontFamily: 'Georgia, serif' }}>CM</span>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-map-wood-dark truncate" style={{ fontFamily: 'Georgia, serif' }}>Capitán Marco</h3>
                <p className="text-[10px] text-map-gold truncate">marco.p@explorador.do</p>
              </div>
            </div>
            <button
              onClick={() => setShowMenu(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-map-wood-dark active:scale-90 transition-all shrink-0"
              style={{ background: 'rgba(168,127,42,0.1)', border: '1px solid rgba(168,127,42,0.3)' }}
            >
              <i className="ri-close-line text-xl" />
            </button>
          </div>

          {/* Contenido scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 min-h-0">

            {/* ── Cuenta ── */}
            <section className="menu-section-in" style={{ animationDelay: '0.06s' }}>
              <h4 className="text-xs font-black text-map-gold uppercase tracking-widest mb-2 px-1">{t('map.menu_account')}</h4>
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-map-cream-light)', border: '1px solid rgba(168,127,42,0.2)' }}>
                {([
                  { icon: 'ri-user-3-line',        label: t('map.menu_edit_profile'),    action: () => setMenuView('edit_profile') },
                  { icon: 'ri-lock-password-line', label: t('map.menu_change_password'), action: () => setMenuView('change_password') },
                ] as { icon: string; label: string; action: () => void }[]).map((item, i, arr) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors active:bg-map-gold/10"
                    style={i < arr.length - 1 ? { borderBottom: '1px solid rgba(168,127,42,0.12)' } : undefined}
                  >
                    <i className={`${item.icon} text-lg text-map-gold shrink-0`} style={{ width: '20px' }} />
                    <span className="text-sm font-semibold text-map-wood-dark flex-1">{item.label}</span>
                    <i className="ri-arrow-right-s-line text-xl" style={{ color: 'rgba(168,127,42,0.5)' }} />
                  </button>
                ))}
              </div>
            </section>

            {/* ── Preferencias ── */}
            <section className="menu-section-in" style={{ animationDelay: '0.13s' }}>
              <h4 className="text-xs font-black text-map-gold uppercase tracking-widest mb-2 px-1">{t('map.menu_preferences')}</h4>
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-map-cream-light)', border: '1px solid rgba(168,127,42,0.2)' }}>
                {/* Idioma */}
                <div className="flex items-center gap-3.5 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(168,127,42,0.12)' }}>
                  <i className="ri-global-line text-lg text-map-gold shrink-0" style={{ width: '20px' }} />
                  <span className="text-sm font-semibold text-map-wood-dark flex-1">{t('map.menu_language')}</span>
                  <div className="flex rounded-full overflow-hidden" style={{ background: 'var(--color-map-cream)', border: '1px solid rgba(168,127,42,0.3)' }}>
                    {(['ES', 'EN'] as const).map(lang => (
                      <button
                        key={lang}
                        onClick={() => i18n.changeLanguage(lang.toLowerCase())}
                        className="px-3.5 py-1 text-xs font-black transition-all"
                        style={i18n.language === lang.toLowerCase() ? { background: 'var(--color-map-wood-dark)', color: 'var(--color-map-gold-light)' } : { color: 'var(--color-map-gold)' }}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Notificaciones */}
                <div className="flex items-center gap-3.5 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(168,127,42,0.12)' }}>
                  <i className="ri-notification-3-line text-lg text-map-gold shrink-0" style={{ width: '20px' }} />
                  <span className="text-sm font-semibold text-map-wood-dark flex-1">{t('map.menu_notifications')}</span>
                  <button
                    onClick={() => setNotificationsEnabled(p => !p)}
                    className="relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0"
                    style={{ background: notificationsEnabled ? 'var(--color-map-wood-dark)' : 'var(--color-map-tan)' }}
                  >
                    <span
                      className="absolute top-0.5 rounded-full shadow transition-all duration-200"
                      style={{ width: '20px', height: '20px', background: 'var(--color-map-gold-light)', left: notificationsEnabled ? 'calc(100% - 22px)' : '2px' }}
                    />
                  </button>
                </div>
                {/* Ubicación */}
                <div className="flex items-center gap-3.5 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(168,127,42,0.12)' }}>
                  <i className="ri-map-pin-2-line text-lg text-map-gold shrink-0" style={{ width: '20px' }} />
                  <span className="text-sm font-semibold text-map-wood-dark flex-1">{t('map.menu_location')}</span>
                  <button
                    onClick={() => setLocationEnabled(p => !p)}
                    className="relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0"
                    style={{ background: locationEnabled ? 'var(--color-map-wood-dark)' : 'var(--color-map-tan)' }}
                  >
                    <span
                      className="absolute top-0.5 rounded-full shadow transition-all duration-200"
                      style={{ width: '20px', height: '20px', background: 'var(--color-map-gold-light)', left: locationEnabled ? 'calc(100% - 22px)' : '2px' }}
                    />
                  </button>
                </div>
                {/* Sonido de Narración */}
                <div className="flex items-center gap-3.5 px-4 py-4">
                  <i className="ri-volume-up-line text-lg text-map-gold shrink-0" style={{ width: '20px' }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-map-wood-dark block mb-2">{t('map.menu_sound')}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={soundLevel}
                        onChange={e => setSoundLevel(Number(e.target.value))}
                        className="flex-1 h-1.5 cursor-pointer"
                        style={{ accentColor: 'var(--color-map-gold)' }}
                      />
                      <span className="text-xs font-bold text-map-gold w-8 text-right shrink-0">{soundLevel}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Información ── */}
            <section className="menu-section-in" style={{ animationDelay: '0.20s' }}>
              <h4 className="text-xs font-black text-map-gold uppercase tracking-widest mb-2 px-1">{t('map.menu_info')}</h4>
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-map-cream-light)', border: '1px solid rgba(168,127,42,0.2)' }}>
                {([
                  { icon: 'ri-book-2-line',        label: t('map.menu_rules'),   action: () => setMenuView('rally_rules') },
                  { icon: 'ri-file-shield-2-line', label: t('map.menu_privacy'), action: () => setMenuView('privacy') },
                  { icon: 'ri-information-line',   label: t('map.menu_about'),   action: () => setMenuView('about') },
                ] as { icon: string; label: string; action: () => void }[]).map((item, i, arr) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors active:bg-map-gold/10"
                    style={i < arr.length - 1 ? { borderBottom: '1px solid rgba(168,127,42,0.12)' } : undefined}
                  >
                    <i className={`${item.icon} text-lg text-map-gold shrink-0`} style={{ width: '20px' }} />
                    <span className="text-sm font-semibold text-map-wood-dark flex-1">{item.label}</span>
                    <i className="ri-arrow-right-s-line text-xl" style={{ color: 'rgba(168,127,42,0.5)' }} />
                  </button>
                ))}
              </div>
            </section>

            {/* ── Juego ── */}
            <section className="menu-section-in" style={{ animationDelay: '0.27s' }}>
              <h4 className="text-xs font-black text-map-gold uppercase tracking-widest mb-2 px-1">{t('map.menu_game')}</h4>
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-map-cream-light)', border: '1px solid rgba(168,127,42,0.2)' }}>
                {([
                  { icon: 'ri-bar-chart-2-line',       label: t('map.menu_progress'), action: () => setMenuView('progress') },
                  { icon: 'ri-trophy-line',            label: t('map.menu_ranking'),  action: () => setMenuView('ranking') },
                  { icon: 'ri-gift-2-line',            label: t('map.menu_prizes'),   action: () => setMenuView('my_prizes') },
                ] as { icon: string; label: string; action?: () => void }[]).map((item, i, arr) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors active:bg-map-gold/10"
                    style={i < arr.length - 1 ? { borderBottom: '1px solid rgba(168,127,42,0.12)' } : undefined}
                  >
                    <i className={`${item.icon} text-lg text-map-gold shrink-0`} style={{ width: '20px' }} />
                    <span className="text-sm font-semibold text-map-wood-dark flex-1">{item.label}</span>
                    <i className="ri-arrow-right-s-line text-xl" style={{ color: 'rgba(168,127,42,0.5)' }} />
                  </button>
                ))}
              </div>
            </section>

          </div>

          {/* Botón Cerrar Sesión */}
          <div className="menu-section-in px-4 pb-8 pt-3 shrink-0" style={{ background: 'var(--color-map-cream-light)', animationDelay: '0.33s' }}>
            <div className="h-px mb-4" style={{ background: 'linear-gradient(90deg,transparent,rgba(168,127,42,0.3),transparent)' }} />
            <button
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-95"
              style={{ background: 'rgba(168,127,42,0.08)', border: '1.5px solid var(--color-map-tan)', color: 'var(--color-map-wood-dark)' }}
            >
              <i className="ri-logout-box-r-line text-lg" />
              {t('map.menu_logout')}
            </button>
          </div>

          {/* Franja dorada inferior */}
          <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold),var(--color-map-gold-light),var(--color-map-gold),transparent)' }} />
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
      {showMenu && menuView === 'progress'        && <Progress       onBack={() => setMenuView('main')} completedStops={completedStops} />}
      {showMenu && menuView === 'my_prizes'       && <MyPrizes      onBack={() => setMenuView('main')} />}
      {showMenu && menuView === 'rally_rules'     && <RallyRules    onBack={() => setMenuView('main')} />}
      {showMenu && menuView === 'privacy'         && <PrivacyTerms  onBack={() => setMenuView('main')} />}
      {showMenu && menuView === 'about'           && <AboutApp      onBack={() => setMenuView('main')} />}

      {/* ── Card de alerta: parada/etapa bloqueada ─────────────── */}
      {lockedAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(10,5,2,0.75)' }}
          onClick={() => setLockedAlert(null)}
        >
          <div
            className="lock-alert-pop relative w-full max-w-[320px] rounded-2xl border-2 border-map-gold-light overflow-hidden"
            style={{ background: 'linear-gradient(160deg,var(--color-map-wood-dark) 0%,var(--color-map-wood-deep) 100%)', boxShadow: '0 0 40px rgba(252,211,77,0.25), 0 20px 60px rgba(0,0,0,0.8)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Franja superior dorada */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold-light),transparent)' }} />

            <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
              {/* Ícono candado grande */}
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-map-gold-light"
                style={{ background: 'radial-gradient(circle,var(--color-map-wood-dark),var(--color-map-wood-deep))', boxShadow: '0 0 20px rgba(252,211,77,0.3)' }}
              >
                <svg className="h-8 w-8 text-map-gold-light" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              </div>

              {/* Título */}
              <div>
                <p className="text-[10px] font-bold tracking-[3px] text-map-gold uppercase mb-1">
                  {lockedAlert.type === 'stage' ? t('map.stage', { n: lockedAlert.blockedStageIdx + 1 }) : t('map.locked_stop_label')}
                </p>
                <h3 className="text-lg font-black text-map-gold-light tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
                  {t('map.locked_title')}
                </h3>
              </div>

              {/* Mensaje */}
              <p className="text-[12px] text-[#fff3d1]/80 leading-relaxed font-serif">
                {lockedAlert.type === 'stage'
                  ? t('map.locked_stage_msg', { n: activeStageIndex + 1 })
                  : t('map.locked_stop_msg', { name: lockedAlert.availableStopName })
                }
              </p>

              {/* Botón cerrar */}
              <button
                onClick={() => setLockedAlert(null)}
                className="mt-1 w-full rounded-lg border border-map-gold-light/40 py-2.5 text-xs font-black tracking-widest text-map-gold-light uppercase transition-all active:scale-95"
                style={{ background: 'linear-gradient(90deg,var(--color-map-wood-dark),var(--color-map-wood-mid))' }}
              >
                {t('map.understood')}
              </button>
            </div>

            {/* Franja inferior dorada */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold-light),transparent)' }} />
          </div>
        </div>
      )}

    </div>
  )
}
