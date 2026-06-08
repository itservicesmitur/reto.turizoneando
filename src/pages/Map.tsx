import { useState, useEffect } from 'react'
import MapBoard from '../features/map/MapBoard'

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

  // Garantizar que la pantalla de carga se muestre al menos 2.5 segundos para la inmersión
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimerFinished(true)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (mapReady && timerFinished) {
      setMapLoading(false)
    }
  }, [mapReady, timerFinished])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#1a0f07] font-sans">
      {/* Pantalla de Carga Inmersiva */}
      {mapLoading && (
        <div 
          id="loading" 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-4"
          style={{
            background: 'radial-gradient(circle, #25140a 0%, #0d0603 100%)'
          }}
        >
          <style>{`
            @keyframes skullFloat {
              0%, 100% { 
                transform: translateY(0px) rotate(-3deg) scale(1); 
                filter: drop-shadow(0 5px 8px rgba(0,0,0,0.9)); 
              }
              50% { 
                transform: translateY(-12px) rotate(3deg) scale(1.06); 
                filter: drop-shadow(0 8px 12px rgba(0,0,0,0.95)); 
              }
            }
            .animate-skull {
              animation: skullFloat 3.2s ease-in-out infinite;
            }
            @keyframes textGlow {
              0%, 100% { 
                text-shadow: 0 0 4px rgba(252, 211, 77, 0.3), 0 2px 4px rgba(0,0,0,0.9);
              }
              50% { 
                text-shadow: 0 0 16px rgba(252, 211, 77, 0.8), 0 0 25px rgba(168,127,42,0.6), 0 2px 4px rgba(0,0,0,0.9);
              }
            }
            .animate-glow-text {
              animation: textGlow 2.4s ease-in-out infinite;
            }
          `}</style>
          <div className="load-skull mb-6 select-none animate-skull">
            <img 
              src="/assets/img/logo1.png" 
              alt="Logo Turizoneando" 
              className="h-22 md:h-28 object-contain"
              style={{
                filter: 'sepia(0.6) saturate(1.3) contrast(1.05) brightness(0.95) drop-shadow(0 6px 16px rgba(252, 211, 77, 0.25))'
              }}
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

      {/* Marco decorativo de estilo pirata antiguo */}
      <div id="frame" className="pointer-events-none absolute inset-0 z-30">
        {/* Degradado oscuro (vignette rectangular) en las orillas para fundir suavemente los bordes con el mapa */}
        <div className="absolute inset-0 shadow-[inset_0_0_60px_30px_#160d08]" />

        <svg viewBox="0 0 1200 700" preserveAspectRatio="none" className="h-full w-full absolute inset-0" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="roughen">
              <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="2" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={3} />
            </filter>
          </defs>
          
          {/* Borde exterior dorado con el filtro aplicado para que se vea rugoso */}
          <rect x="8" y="8" width="1185" height="685" fill="none" stroke="#c8962a" strokeWidth="2" rx="4" filter="url(#roughen)" />
          
          {/* Borde interior marrón más fino pegado más al marco */}
          <rect x="13" y="13" width="1175" height="675" fill="none" stroke="#6b3a1f" strokeWidth="1.2" rx="3.5" opacity="0.75" />
        </svg>
      </div>

      {/* Indicadores Flotantes del Jugador (Estilo Madera/Parchamiento Vintage) */}
      <div className="absolute top-32 left-3 md:top-8 md:left-8 z-20 flex flex-col gap-2.5 pointer-events-auto">
        {/* Monumentos */}
        <div className="w-11 h-11 md:w-auto md:h-auto flex items-center justify-center rounded-full md:rounded-xl border border-[#a87f2a] bg-[#321e0f]/95 shadow-xl md:px-3 md:py-2">
          <i className="ri-government-fill text-lg md:text-xl text-[#fcd34d]"></i>

          <div className="hidden md:flex flex-col ml-3">
            <span className="text-[8px] font-extrabold tracking-wider text-[#c7a361] uppercase font-serif">
              Monumentos
            </span>
            <span className="text-xs font-extrabold text-[#fff3d1]">
              150
            </span>
          </div>
        </div>

        {/* Tesoro */}
        <div className="w-11 h-11 md:w-auto md:h-auto flex items-center justify-center rounded-full md:rounded-xl border border-[#a87f2a] bg-[#321e0f]/95 shadow-xl md:px-3 md:py-2">
          <i className="ri-trophy-fill text-lg md:text-xl text-[#fcd34d]"></i>

          <div className="hidden md:flex flex-col ml-3">
            <span className="text-[8px] font-extrabold tracking-wider text-[#c7a361] uppercase font-serif">
              Tesoro
            </span>
            <span className="text-xs font-extrabold text-[#fff3d1]">
              0 / 12
            </span>
          </div>
        </div>

        {/* Rango */}
        <div className="w-11 h-11 md:w-auto md:h-auto flex items-center justify-center rounded-full md:rounded-xl border border-[#a87f2a] bg-[#321e0f]/95 shadow-xl md:px-3 md:py-2">
          <i className="ri-medal-fill text-lg md:text-xl text-[#fcd34d]"></i>

          <div className="hidden md:flex flex-col ml-3">
            <span className="text-[8px] font-extrabold tracking-wider text-[#c7a361] uppercase font-serif">
              Rango
            </span>
            <span className="text-xs font-extrabold text-[#fff3d1]">
              Explorador
            </span>
          </div>
        </div>
      </div>

      {/* Banner Superior Central Vintage */}
      <div className="absolute top-8 left-1/2 z-20 -translate-x-1/2 rounded-xl border-2 border-[#a87f2a] bg-[#22150c]/95 px-8 py-2.5 shadow-2xl text-center min-w-[280px]">
        <h1 className="text-xs font-extrabold tracking-widest text-[#fcd34d] font-serif uppercase">
          ⚜️ Rally Histórico ⚜️
        </h1>
        <p className="mt-1 text-[7.5px] font-bold tracking-[0.25em] text-[#fff3d1]/80 uppercase">
          Zona Colonial · Santo Domingo
        </p>
      </div>

      {/* Tablero del Mapa */}
      <main className="h-full w-full">
        <MapBoard 
          onSelectMonument={setSelectedMonument} 
          selectedMonument={selectedMonument} 
          onLoadComplete={() => setMapReady(true)} 
          startIntroAnimation={!mapLoading}
        />
      </main>

      {/* Detalle del Monumento Seleccionado (Tarjeta flotante abajo sin overlay, diseño compacto vintage crema) */}
      {selectedMonument && (
        <div 
          key={selectedMonument.nombre}
          className="absolute bottom-6 left-1/2 z-20 w-[calc(100%-1.5rem)] max-w-[310px] -translate-x-1/2 overflow-y-auto max-h-[85vh] rounded-xl bg-[#ebdcc3] border border-[#a87f2a] shadow-2xl transition-all duration-300 flex flex-col scrollbar-thin animate-fade-in"
        >
            
            {/* Cabecera de la Imagen */}
            <div className="relative h-36 w-full bg-stone-900 shrink-0">
              <img
                key={selectedMonument.nombre}
                src={selectedMonument.imagen}
                alt={selectedMonument.nombre}
                className="h-full w-full object-cover animate-fade-in"
              />
            {/* Degradado oscuro en la base de la imagen */}
            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-black/30" />
 
            {/* Título en tipografía Serif gruesa en la parte inferior de la foto */}
            <div className="absolute bottom-3 left-3 right-3">
              <h2 className="text-base font-bold font-serif text-[#fcd34d] tracking-wide text-shadow-md">
                {selectedMonument.nombre}
              </h2>
            </div>
            
            {/* Botón de Cerrar */}
            <button
              onClick={() => setSelectedMonument(null)}
              className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-[#fcd34d] hover:bg-black/80 transition-colors backdrop-blur-xs"
              aria-label="Cerrar"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
 
          {/* Cuerpo de Información */}
          <div className="p-3.5 space-y-3.5 flex-1 overflow-y-auto">
            
            {/* Caja de descripción rústica/arena */}
            <div className="bg-[#fcf7ed] border border-[#a87f2a]/30 rounded-lg p-3 shadow-inner">
              <p className="text-[11.5px] text-[#321e0f] leading-relaxed font-serif font-medium">
                {selectedMonument.descripcion}
              </p>
            </div>
 
            {/* Botón Principal: IR AL RETO */}
            <button
              onClick={() => alert(`¡Comenzando el reto en el ${selectedMonument.nombre}! 🚀`)}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#321e0f] to-[#503019] py-2.5 text-xs font-bold text-[#fcd34d] border border-[#a87f2a]/40 shadow-md hover:from-[#22150c] hover:to-[#321e0f] hover:scale-102 active:scale-98 transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              IR AL RETO
            </button>
 
          </div>
        </div>
      )}
    </div>
  )
}
