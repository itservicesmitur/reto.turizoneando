import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import MapBoard, { type MapBoardHandle, type RouteInfo } from '../features/map/MapBoard'
import QuizCard from '../features/map/quiz/QuizCard'
import CelebrationCard from '../features/map/quiz/CelebrationCard'
import PrizeCard from '../features/map/quiz/PrizeCard'

const MONUMENT_ORDER = [
  'Alcázar de Colón',
  'Plaza de España',
  'Fortaleza Ozama',
  'Calle Las Damas',
  'Museo de las Casas Reales',
  'Reloj de Sol',
  'Panteón Nacional',
  'Catedral Primada de América',
  'Parque Colón',
  'Ruinas de San Francisco',
  'Puerta de la Misericordia',
  'Puerta del Conde',
]

interface Monumento {
  nombre: string
  lat: number
  lng: number
  icono: string
  imagen: string
  categoria: string
  horario: string
  abiertoInfo: string
  esGratis: boolean
  costo: string
  rating: number
  reviews: number
  descripcion: string
}

export default function Map() {
  const [selectedMonument, setSelectedMonument] = useState<Monumento | null>(null)
  const [mapLoading, setMapLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)
  const [timerFinished, setTimerFinished] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mapHeading, setMapHeading] = useState(90)
  const [showRotationControls, setShowRotationControls] = useState(false)
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [navPhase, setNavPhase] = useState<'idle' | 'preview' | 'navigating'>('idle')
  const [isHudExpanded, setIsHudExpanded] = useState(false)
  const [expandedStage, setExpandedStage] = useState<number | null>(null)
  const mapControlsRef = useRef<MapBoardHandle>(null)

  type StageStatus = 'done' | 'active' | 'locked'

  const [completedStops, setCompletedStops] = useState<boolean[]>(Array(12).fill(false))
  const [lockedAlert, setLockedAlert] = useState<
    { type: 'stage'; blockedStageIdx: number } |
    { type: 'stop'; availableStopName: string } |
    null
  >(null)

  const activeStageIndex = useMemo(() => {
    for (let s = 0; s < 3; s++) {
      if (!completedStops.slice(s * 4, s * 4 + 4).every(Boolean)) return s
    }
    return 2
  }, [completedStops])

  const stages = useMemo<{ roman: string; name: string; status: StageStatus }[]>(() => [
    { roman: 'I',   name: 'Alcázar de Colón'  },
    { roman: 'II',  name: 'Plaza de España'   },
    { roman: 'III', name: 'Fortaleza Ozama'   },
  ].map((s, idx) => {
    const allDone = completedStops.slice(idx * 4, idx * 4 + 4).every(Boolean)
    const status: StageStatus = allDone ? 'done' : idx === activeStageIndex ? 'active' : 'locked'
    return { ...s, status }
  }), [completedStops, activeStageIndex])

  // ── Quiz flow ────────────────────────────────────────────────
  type QuizStep =
    | { step: 'idle' }
    | { step: 'quiz'; stopIndex: number; monument: Monumento }
    | { step: 'celebration'; stopIndex: number; monument: Monumento }
    | { step: 'prize'; stopIndex: number; monument: Monumento }

  const [quizFlow, setQuizFlow] = useState<QuizStep>({ step: 'idle' })

  const availableStopIndex = useMemo(() => {
    for (let i = 0; i < 12; i++) {
      if (completedStops[i]) continue
      const stageIdx = Math.floor(i / 4)
      const stageStart = stageIdx * 4
      const iWithin = i % 4
      const prevStagesDone = stageIdx === 0 ? true : completedStops.slice(0, stageStart).every(Boolean)
      const prevInStageDone = iWithin === 0 ? true : completedStops.slice(stageStart, i).every(Boolean)
      if (prevStagesDone && prevInStageDone) return i
    }
    return -1
  }, [completedStops])

  const selectedMonumentIsAvailable = useMemo(() => {
    if (!selectedMonument) return false
    const idx = MONUMENT_ORDER.indexOf(selectedMonument.nombre)
    return idx === availableStopIndex
  }, [selectedMonument, availableStopIndex])

  const handleStartQuiz = useCallback(() => {
    if (!selectedMonument || availableStopIndex < 0) return
    setQuizFlow({ step: 'quiz', stopIndex: availableStopIndex, monument: selectedMonument })
  }, [selectedMonument, availableStopIndex])

  const handleQuizComplete = useCallback((stopIndex: number, monument: Monumento) => {
    setQuizFlow({ step: 'celebration', stopIndex, monument })
  }, [])

  const handleSpinComplete = useCallback((stopIndex: number, monument: Monumento) => {
    setQuizFlow({ step: 'prize', stopIndex, monument })
  }, [])

  const handlePrizeContinue = useCallback((stopIndex: number) => {
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
    // Si ninguna parada cambió (primer render), no animar
    if (prev === completedStops) return
    // Encontrar la parada recién desbloqueada (no completada, etapas previas OK, parada previa OK)
    for (let i = 0; i < 12; i++) {
      if (completedStops[i]) continue
      const stageIdx = Math.floor(i / 4)
      const stageStart = stageIdx * 4
      const indexWithinStage = i % 4
      const prevStagesDone = stageIdx === 0 ? true : completedStops.slice(0, stageStart).every(Boolean)
      const prevInStageDone = indexWithinStage === 0 ? true : completedStops.slice(stageStart, i).every(Boolean)
      if (prevStagesDone && prevInStageDone) {
        mapControlsRef.current?.focusOnStop(i)
        break
      }
    }
  }, [completedStops])

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
    <div className="relative h-screen w-screen overflow-hidden bg-[#1a0f07] font-sans">

      {/* ── Pantalla de Carga Inmersiva ──────────────────────────── */}
      {mapLoading && (
        <div
          id="loading"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-4"
          style={{ background: 'radial-gradient(circle, #25140a 0%, #0d0603 100%)' }}
        >
          <style>{`
            @keyframes skullFloat {
              0%, 100% { transform: translateY(0px) rotate(-3deg) scale(1); filter: drop-shadow(0 5px 8px rgba(0,0,0,0.9)); }
              50% { transform: translateY(-12px) rotate(3deg) scale(1.06); filter: drop-shadow(0 8px 12px rgba(0,0,0,0.95)); }
            }
            .animate-skull { animation: skullFloat 3.2s ease-in-out infinite; }
            @keyframes textGlow {
              0%, 100% { text-shadow: 0 0 4px rgba(252,211,77,0.3), 0 2px 4px rgba(0,0,0,0.9); }
              50% { text-shadow: 0 0 16px rgba(252,211,77,0.8), 0 0 25px rgba(168,127,42,0.6), 0 2px 4px rgba(0,0,0,0.9); }
            }
            .animate-glow-text { animation: textGlow 2.4s ease-in-out infinite; }
          `}</style>
          <div className="load-skull mb-6 select-none animate-skull">
            <img
              src="/assets/img/logo1.png"
              alt="Logo Turizoneando"
              className="h-22 md:h-28 object-contain"
              style={{ filter: 'sepia(0.6) saturate(1.3) contrast(1.05) brightness(0.95) drop-shadow(0 6px 16px rgba(252,211,77,0.25))' }}
            />
          </div>
          <h2
            className="text-2xl md:text-2xl font-normal text-[#fcd34d] tracking-wider animate-glow-text"
            style={{ fontFamily: "'UnifrakturMaguntia', cursive" }}
          >
            Cargando el Mapa del Tesoro
          </h2>
          <p className="mt-3 text-xs md:text-sm italic text-[#fff3d1]/70 tracking-wider font-serif">
            Los secretos de la Ciudad Colonial están por revelarse
          </p>
        </div>
      )}

      {/* ── Marco decorativo vintage ─────────────────────────────── */}
      <div id="frame" className="pointer-events-none absolute inset-0 z-30">
        <div className="absolute inset-0 shadow-[inset_0_0_60px_30px_#160d08]" />
        <svg viewBox="0 0 1200 700" preserveAspectRatio="none" className="h-full w-full absolute inset-0" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="roughen">
              <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="2" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={3} />
            </filter>
          </defs>
          <rect x="8" y="8" width="1185" height="685" fill="none" stroke="#c8962a" strokeWidth="2" rx="4" filter="url(#roughen)" />
          <rect x="13" y="13" width="1175" height="675" fill="none" stroke="#6b3a1f" strokeWidth="1.2" rx="3.5" opacity="0.75" />
        </svg>
      </div>


      {/* ── Barra top-center: Menú + Etapas + Ajustes ─────────────── */}
      {!mapLoading && navPhase !== 'navigating' && (
        <div className="absolute top-7.5 left-1/2 -translate-x-1/2 z-30">
          <div
            className="flex items-center gap-2 rounded-full border-2 border-[#a87f2a] bg-[#22150c]/95 backdrop-blur-md px-2 py-1.5"
            style={{ boxShadow: '0 4px 24px rgba(168,127,42,0.45), inset 0 1px 0 rgba(252,211,77,0.12)' }}
          >
            {/* Etapas */}
            <div className="flex items-center gap-2">
              {stages.map((stage, idx) => {
                const open = expandedStage === idx
                const toggle = () => {
                  if (stage.status === 'locked') {
                    setLockedAlert({ type: 'stage', blockedStageIdx: idx })
                  }
                  setExpandedStage(open ? null : idx)
                  if (!open) {
                    mapControlsRef.current?.focusOnStage(idx)
                  }
                }

                const btnStyle = {
                  transition: 'width 0.3s cubic-bezier(0.34,1.56,0.64,1), padding 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, transform 0.15s ease',
                }

                if (stage.status === 'done') return (
                  <button key={idx} onClick={toggle}
                    style={{
                      ...btnStyle,
                      boxShadow: open ? '0 0 10px rgba(252,211,77,0.35), 0 2px 8px rgba(0,0,0,0.5)' : '0 2px 6px rgba(0,0,0,0.4)',
                    }}
                    className={`relative h-8 rounded-full bg-linear-to-b from-yellow-300 to-amber-600 border border-yellow-400 flex items-center justify-center overflow-hidden active:scale-90 ${open ? 'px-3 gap-1.5' : 'w-8'}`}>
                    <i className="ri-checkbox-circle-line text-xs text-[#2b1608] shrink-0" />
                    {open && <span className="text-[10px] font-black text-[#2b1608] uppercase tracking-wide whitespace-nowrap stage-text-reveal">Etapa {idx + 1}</span>}
                  </button>
                )

                if (stage.status === 'active') return (
                  <button key={idx} onClick={toggle}
                    style={{
                      ...btnStyle,
                      boxShadow: open ? '0 0 12px rgba(252,211,77,0.4), 0 2px 8px rgba(0,0,0,0.5)' : '0 0 5px rgba(252,211,77,0.15), 0 2px 6px rgba(0,0,0,0.4)',
                    }}
                    className={`h-8 rounded-full border flex items-center justify-center overflow-hidden active:scale-90 ${open ? 'px-3 gap-1.5 border-[#fcd34d] bg-[#4a2e10]' : 'w-8 border-[#fcd34d] bg-[#3a2412]'}`}>
                    <i className="ri-compass-3-fill text-xs text-[#fcd34d] shrink-0" />
                    {open && <span className="text-[10px] font-black text-[#fcd34d] uppercase tracking-wide whitespace-nowrap stage-text-reveal">Etapa {idx + 1}</span>}
                  </button>
                )

                return (
                  <button key={idx} onClick={toggle}
                    style={{
                      ...btnStyle,
                      boxShadow: open ? '0 0 8px rgba(107,84,36,0.35), 0 2px 8px rgba(0,0,0,0.5)' : '0 2px 6px rgba(0,0,0,0.4)',
                    }}
                    className={`h-8 rounded-full border flex items-center justify-center overflow-hidden active:scale-90 ${open ? 'px-3 gap-1.5 border-[#8a6b2f] bg-[#2e1e0e]' : 'w-8 border-[#6b5424] bg-[#24160c]'}`}>
                    <i className="ri-lock-fill text-xs text-[#8a6b2f] shrink-0" />
                    {open && <span className="text-[10px] font-black text-[#8a6b2f] uppercase tracking-wide whitespace-nowrap stage-text-reveal">Etapa {idx + 1}</span>}
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
            <div className="rounded-xl overflow-hidden border border-[#a87f2a] shadow-2xl bg-[#fff3d1]">

              {/* Sección expandible: info del monumento */}
              <div
                style={{
                  maxHeight: isHudExpanded ? '160px' : '0px',
                  transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden',
                }}
              >
                <div className="flex items-center gap-4 p-3.5 border-b border-[#a87f2a]/30">
                  {/* Foto del monumento */}
                  <div className="h-22 w-30 shrink-0 rounded-sm overflow-hidden border-2 border-[#a87f2a] shadow-md">
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
                        <div className="text-[10px] font-bold text-[#a87f2a] uppercase tracking-widest leading-none mb-1">Destino</div>
                        <div className="text-sm font-bold text-[#321e0f] leading-tight font-serif mb-2">{selectedMonument?.nombre}</div>
                        <button
                          onClick={handleStartQuiz}
                          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#433300] text-[#fcd34d] rounded-sm w-full active:scale-95 transition-all"
                          style={{ border: '1px solid #a87f2a', boxShadow: '0 2px 12px rgba(252,211,77,0.15)' }}
                        >
                          <i className="ri-play-circle-line text-xl"></i>
                          <span className="font-bold text-sm">Comenzar Reto</span>
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
                  <div className="flex flex-col items-center justify-center h-10 w-10 shrink-0 rounded-full bg-[#321e0f]">
                    <i
                      className={`text-xl text-[#fcd34d] ${routeInfo.travelMode === 'DRIVE' ? 'ri-roadster-fill' : 'ri-walk-line'}`}
                    />
                  </div>

                  {/* Distancia */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-[#a87f2a] uppercase tracking-wide leading-none mb-0.5">Distancia</span>
                   <span className="text-sm font-extrabold text-[#321e0f] leading-tight">{routeInfo.distanceKm} km</span>
                  </div>

                  <div className="w-px h-8 bg-[#a87f2a]/40 shrink-0" />

                  {/* Tiempo */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-[#a87f2a] uppercase tracking-wide leading-none mb-0.5"> Tiempo</span>
                    <span className="text-sm font-extrabold text-[#321e0f] leading-tight">
              {routeInfo.durationMin >= 60
                        ? `${Math.floor(routeInfo.durationMin / 60)}h${routeInfo.durationMin % 60 > 0 ? ` ${routeInfo.durationMin % 60}m` : ''}`
                        : `${routeInfo.durationMin} min`}
                    </span>
                  </div>
                </div>

                {/* Derecha: X + expandir */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={closeCard}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[#321e0f] bg-[#a87f2a]/20 transition-colors active:scale-90 shadow-lg "
                    aria-label="Cancelar navegación"
                  >
                    <i className="ri-close-large-line"></i>
                  </button>
                  <button
                    onClick={() => setIsHudExpanded(prev => !prev)}
                    className="flex h-10 w-10 items-center justify-center rounded-full  text-[#321e0f] bg-[#a87f2a]/20  shadow-lg transition-all active:scale-90"
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
          onHeadingChange={setMapHeading}
          visibleStage={expandedStage !== null ? expandedStage : 0}
          completedStops={completedStops}
          onLockedStopClick={handleLockedStopClick}
        />
      </main>

      {/* ── Controles flotantes: Rotación 360 + Pantalla Completa ── */}
      {!mapLoading && (
        <div className="absolute top-32 left-3 md:top-8 md:left-8 z-20 flex flex-col gap-2.5 pointer-events-auto">
          {showRotationControls && (
            <div className="flex flex-col gap-3 transition-all duration-300 animate-in slide-in-from-bottom-2 fade-in">
              <button
                onClick={() => mapControlsRef.current?.rotateLeft()}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#a87f2a] bg-[#321e0f]/95 text-[#fcd34d] shadow-lg backdrop-blur-md transition-all hover:bg-[#4a2e18] active:scale-90"
                title="Girar Izquierda (45°)"
              >
                <i className="ri-anticlockwise-fill text-lg"></i>
              </button>
              <button
                onClick={() => mapControlsRef.current?.resetRotation()}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#a87f2a] bg-[#321e0f]/95 text-[#fcd34d] shadow-lg backdrop-blur-md transition-all hover:bg-[#4a2e18] active:scale-90"
                title="Restablecer Brújula"
              >
                <i className="ri-compass-3-fill text-lg"></i>
              </button>
              <button
                onClick={() => mapControlsRef.current?.rotateRight()}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#a87f2a] bg-[#321e0f]/95 text-[#fcd34d] shadow-lg backdrop-blur-md transition-all hover:bg-[#4a2e18] active:scale-90"
                title="Girar Derecha (45°)"
              >
                <i className="ri-clockwise-fill text-lg"></i>
              </button>
            </div>
          )}

          {/* Brújula / botón maestro 360 */}
          <button
            onClick={() => setShowRotationControls(!showRotationControls)}
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#a87f2a] shadow-2xl transition-all active:scale-90 bg-transparent p-0 overflow-hidden"
            title="Mostrar Controles 360"
          >
            <svg className="w-full h-full select-none" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="45" stroke="#a87f2a" strokeWidth="2.5" fill="#22150c" />
              <circle cx="50" cy="50" r="41" stroke="#a87f2a" strokeDasharray="1, 3" strokeWidth="1" />
              <g style={{ transform: `rotate(${-mapHeading}deg)`, transformOrigin: '50px 50px', transition: 'transform 0.15s ease-out' }}>
                <polygon points="50,50 50,15 46,50" fill="#fcd34d" />
                <polygon points="50,50 50,15 54,50" fill="#a87f2a" />
                <polygon points="50,50 50,85 54,50" fill="#fcd34d" />
                <polygon points="50,50 50,85 46,50" fill="#a87f2a" />
                <polygon points="50,50 85,50 50,54" fill="#fcd34d" />
                <polygon points="50,50 85,50 50,46" fill="#a87f2a" />
                <polygon points="50,50 15,50 50,46" fill="#fcd34d" />
                <polygon points="50,50 15,50 50,54" fill="#a87f2a" />
                <polygon points="50,50 25,25 29,25" fill="#d97706" />
                <polygon points="50,50 25,25 25,29" fill="#78350f" />
                <polygon points="50,50 75,25 75,29" fill="#d97706" />
                <polygon points="50,50 75,25 71,25" fill="#78350f" />
                <polygon points="50,50 75,75 71,75" fill="#d97706" />
                <polygon points="50,50 75,75 75,71" fill="#78350f" />
                <polygon points="50,50 25,75 25,71" fill="#d97706" />
                <polygon points="50,50 25,75 29,75" fill="#78350f" />
                <circle cx="50" cy="50" r="6" fill="#22150c" stroke="#a87f2a" strokeWidth="2" />
                <circle cx="50" cy="50" r="2.5" fill="#fcd34d" />
                <text x="50" y="24" fill="#fcd34d" fontFamily="Georgia, serif" fontSize="8" fontWeight="bold" textAnchor="middle">N</text>
                <text x="50" y="82" fill="#fcd34d" fontFamily="Georgia, serif" fontSize="8" fontWeight="bold" textAnchor="middle">S</text>
                <text x="81" y="53" fill="#fcd34d" fontFamily="Georgia, serif" fontSize="8" fontWeight="bold" textAnchor="middle">E</text>
                <text x="19" y="53" fill="#fcd34d" fontFamily="Georgia, serif" fontSize="8" fontWeight="bold" textAnchor="middle">O</text>
              </g>
            </svg>
          </button>

          {/* Botón Pantalla Completa */}
          <button
            onClick={toggleFullscreen}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#a87f2a] bg-[#321e0f]/95 shadow-xl text-[#fcd34d] hover:bg-[#22150c] hover:border-[#fcd34d] transition-all active:scale-95"
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* ── Tarjeta de monumento (fases idle y preview) ──────────── */}
      {selectedMonument && navPhase !== 'navigating' && (
        <div
          key={selectedMonument.nombre}
          className="absolute bottom-6 left-1/2 z-20 w-[calc(100%-1.5rem)] max-w-[370px] -translate-x-1/2 rounded-xl bg-[#ebdcc3] border border-[#a87f2a] shadow-2xl flex flex-col animate-fade-in"
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
              <h2 className="text-base font-bold font-serif text-[#fcd34d] tracking-wide leading-tight">
                {selectedMonument.nombre}
              </h2>
            </div>
            <button
              onClick={closeCard}
              className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-[#fcd34d] hover:bg-black/80 transition-colors backdrop-blur-xs"
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
              <div className="bg-[#fcf7ed] border border-[#a87f2a]/30 rounded-sm p-3 shadow-inner">
                <p className="text-[11.5px] text-[#321e0f] leading-relaxed font-serif font-medium">
                  {selectedMonument.descripcion}
                </p>
              </div>
              <button
                onClick={handleStartRoute}
                className="w-full flex items-center justify-center gap-2 rounded-sm bg-linear-to-r from-[#321e0f] to-[#503019] py-2.5 text-sm font-bold text-[#fcd34d] border border-[#a87f2a]/40 shadow-md hover:from-[#22150c] hover:to-[#321e0f] active:scale-98 transition-all"
              >
                <i className="ri-footprint-fill text-xl"></i>
                Ir ahora
              </button>
              {selectedMonumentIsAvailable && (
                <button
                  onClick={handleStartQuiz}
                  className="w-full flex items-center justify-center gap-2 rounded-sm py-2.5 text-sm font-black text-[#fcd34d] active:scale-95 transition-all"
                  style={{
                    background: 'linear-gradient(90deg,#3a1f08,#503019,#3a1f08)',
                    border: '1.5px solid #fcd34d',
                    boxShadow: '0 4px 20px rgba(252,211,77,0.2)',
                  }}
                >
                  <i className="ri-sword-line text-xl"></i>
                  Comenzar Quiz
                </button>
              )}
            </div>
          )}

          {/* ── FASE PREVIEW: estilo Google Maps adaptado al tema vintage ── */}
          {navPhase === 'preview' && (
            <div className="p-3.5 space-y-2.5 flex-1 animate-fade-in">
              {routeInfo ? (
                <div className="flex items-stretch gap-2 pb-1">
                  {/* Distancia */}
                  <div className="flex flex-col items-center justify-center gap-1 bg-[#321e0f]/10 hover:bg-[#321e0f]/18 rounded-sm py-2 flex-1 transition-all active:scale-95">
                    <i className="ri-route-line text-xl text-[#a87f2a]"></i>
                    <span className="text-xs font-bold text-[#321e0f]  tracking-wide leading-none">
                      {routeInfo.distanceKm} km
                    </span>
                  </div>
                  {/* Tiempo */}
                  <div className="flex flex-col items-center justify-center gap-1 bg-[#321e0f]/10 hover:bg-[#321e0f]/18 rounded-sm py-2 flex-1 transition-all active:scale-95">
                    <i className="ri-time-line text-xl text-[#a87f2a]"></i>
                    <span className="text-xs font-bold text-[#321e0f]  tracking-wide leading-none">
                      {routeInfo.durationMin >= 60
                        ? `${Math.floor(routeInfo.durationMin / 60)}h${routeInfo.durationMin % 60 > 0 ? ` ${routeInfo.durationMin % 60}m` : ''}`
                        : `${routeInfo.durationMin} m`}
                    </span>
                  </div>
                  {/* INICIAR — botón principal más grande */}
                  <button
                    onClick={handleStartNavigation}
                    className="flex flex-col items-center justify-center gap-1 bg-[#321e0f] hover:bg-[#321e0f]/80 rounded-sm py-2 px-5 shadow-lg transition-all active:scale-95 flex-[1.6]"
                  >
                    <i className="ri-ship-line text-xl text-[#fcd34d]"></i>
                    <span className="text-sm font-bold text-[#fcd34d]  tracking-widest leading-none">
                      Navegar
                    </span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center py-3">
                  <span className="text-xs text-[#1a73e8]/60 italic animate-pulse">Calculando ruta...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Quiz Flow ────────────────────────────────────────────── */}
      {quizFlow.step === 'quiz' && (
        <QuizCard
          stopIndex={quizFlow.stopIndex}
          monumentName={quizFlow.monument.nombre}
          monumentImage={quizFlow.monument.imagen}
          onComplete={() => handleQuizComplete(quizFlow.stopIndex, quizFlow.monument)}
          onClose={() => setQuizFlow({ step: 'idle' })}
        />
      )}
      {quizFlow.step === 'celebration' && (
        <CelebrationCard
          stopIndex={quizFlow.stopIndex}
          onSpinComplete={() => handleSpinComplete(quizFlow.stopIndex, quizFlow.monument)}
        />
      )}
      {quizFlow.step === 'prize' && (
        <PrizeCard
          stopIndex={quizFlow.stopIndex}
          monumentImage={quizFlow.monument.imagen}
          onContinue={() => handlePrizeContinue(quizFlow.stopIndex)}
        />
      )}

      {/* ── Card de alerta: parada/etapa bloqueada ─────────────── */}
      {lockedAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(10,5,2,0.75)' }}
          onClick={() => setLockedAlert(null)}
        >
          <div
            className="lock-alert-pop relative w-full max-w-[320px] rounded-2xl border-2 border-[#fcd34d] overflow-hidden"
            style={{ background: 'linear-gradient(160deg,#2a1505 0%,#160a02 100%)', boxShadow: '0 0 40px rgba(252,211,77,0.25), 0 20px 60px rgba(0,0,0,0.8)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Franja superior dorada */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,transparent,#fcd34d,transparent)' }} />

            <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
              {/* Ícono candado grande */}
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#fcd34d]"
                style={{ background: 'radial-gradient(circle,#3a1a05,#1a0a02)', boxShadow: '0 0 20px rgba(252,211,77,0.3)' }}
              >
                <svg className="h-8 w-8 text-[#fcd34d]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              </div>

              {/* Título */}
              <div>
                <p className="text-[10px] font-bold tracking-[3px] text-[#a87f2a] uppercase mb-1">
                  {lockedAlert.type === 'stage' ? `Etapa ${lockedAlert.blockedStageIdx + 1}` : 'Parada bloqueada'}
                </p>
                <h3 className="text-lg font-black text-[#fcd34d] tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
                  BLOQUEADO
                </h3>
              </div>

              {/* Mensaje */}
              <p className="text-[12px] text-[#fff3d1]/80 leading-relaxed font-serif">
                {lockedAlert.type === 'stage'
                  ? `Completa todas las paradas de la Etapa ${activeStageIndex + 1} para desbloquear esta etapa.`
                  : `Completa "${lockedAlert.availableStopName}" para desbloquear esta parada.`
                }
              </p>

              {/* Botón cerrar */}
              <button
                onClick={() => setLockedAlert(null)}
                className="mt-1 w-full rounded-lg border border-[#fcd34d]/40 py-2.5 text-xs font-black tracking-widest text-[#fcd34d] uppercase transition-all active:scale-95"
                style={{ background: 'linear-gradient(90deg,#3a1f08,#271505)' }}
              >
                Entendido
              </button>
            </div>

            {/* Franja inferior dorada */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,transparent,#fcd34d,transparent)' }} />
          </div>
        </div>
      )}

    </div>
  )
}
