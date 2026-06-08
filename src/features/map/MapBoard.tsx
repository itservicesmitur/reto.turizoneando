import { useEffect, useRef, useState } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

declare global {
  namespace google {
    namespace maps {
      type Map = any;
      type Polygon = any;
      type Polyline = any;
    }
  }
}

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

interface BoatColorTheme {
  woodColor: number
  sailsColor: number
  flagColor: number
}

function createProceduralBoat(theme: BoatColorTheme): THREE.Group {
  const boatGroup = new THREE.Group()

  // Materiales
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: theme.woodColor,
    roughness: 0.7,
    metalness: 0.1
  })
  
  const deckMaterial = new THREE.MeshStandardMaterial({
    color: 0xd2b48c, // Cubierta color arena/madera clara
    roughness: 0.8,
    metalness: 0.1
  })

  const darkWoodMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(theme.woodColor).multiplyScalar(0.5).getHex(),
    roughness: 0.9,
    metalness: 0.1
  })

  const sailMaterial = new THREE.MeshStandardMaterial({
    color: theme.sailsColor,
    roughness: 0.8,
    metalness: 0.0,
    side: THREE.DoubleSide
  })

  const flagMaterial = new THREE.MeshStandardMaterial({
    color: theme.flagColor,
    roughness: 0.6,
    metalness: 0.1,
    side: THREE.DoubleSide
  })

  // 1. CASCO DEL BARCO (Hull)
  // Cuerpo principal (caja central)
  const hullBodyGeom = new THREE.BoxGeometry(3.5, 9, 2.2)
  const hullBody = new THREE.Mesh(hullBodyGeom, woodMaterial)
  hullBody.position.z = 1.1
  boatGroup.add(hullBody)

  // Cubierta (Deck)
  const deckGeom = new THREE.BoxGeometry(3.3, 8.8, 0.1)
  const deck = new THREE.Mesh(deckGeom, deckMaterial)
  deck.position.set(0, 0, 2.2)
  boatGroup.add(deck)

  // Proa afilada (Bow) - Cono apuntando hacia +Y (adelante)
  const bowGeom = new THREE.ConeGeometry(1.75, 3.5, 4)
  const bow = new THREE.Mesh(bowGeom, woodMaterial)
  bow.rotation.y = Math.PI / 4 // Alinear caras laterales con el casco
  bow.position.set(0, 4.5 + 1.75, 1.1)
  bow.scale.set(1.41, 1, 0.88) // Escalar para coincidir exactamente con el casco (3.5 ancho, 2.2 alto)
  boatGroup.add(bow)

  // Castillo de Popa (Stern Castle) - Estructura elevada en la parte trasera
  const sternGeom = new THREE.BoxGeometry(3.5, 2.8, 1.5)
  const stern = new THREE.Mesh(sternGeom, darkWoodMaterial)
  stern.position.set(0, -3.1, 2.2 + 0.75)
  boatGroup.add(stern)

  // Helper para crear velas curvadas físicamente correctas y centradas
  const createCurvedSail = (width: number, height: number, depth: number) => {
    const sailGeom = new THREE.PlaneGeometry(width, height, 10, 2)
    const posAttr = sailGeom.attributes.position
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i)
      // Curva tipo coseno: 0 en los bordes, máximo en el centro
      const bulge = Math.cos((x / width) * Math.PI) * depth
      posAttr.setZ(i, posAttr.getZ(i) - bulge) // Bulge negativo para que al rotar X apunte a +Y (adelante)
    }
    sailGeom.computeVertexNormals()
    
    const sailMesh = new THREE.Mesh(sailGeom, sailMaterial)
    sailMesh.rotation.x = Math.PI / 2 // Rotar para ponerla vertical sobre el plano X-Z
    sailMesh.rotation.z = Math.PI / 2 // Alinear paralela a las vergas (izquierda-derecha)
    return sailMesh
  }

  // 2. MÁSTILES Y VERGAS (Masts & Yards)
  // Helper para crear mástil con vergas y velas onduladas
  const addMast = (yPos: number, mastHeight: number, zStart: number, mastRadius: number) => {
    const mastGroup = new THREE.Group()
    mastGroup.position.set(0, yPos, zStart)

    // Mástil vertical
    const mastGeom = new THREE.CylinderGeometry(mastRadius * 0.7, mastRadius, mastHeight, 8)
    const mast = new THREE.Mesh(mastGeom, darkWoodMaterial)
    mast.rotation.x = Math.PI / 2 // Alinear verticalmente con eje Z
    mast.position.z = mastHeight / 2
    mastGroup.add(mast)

    // Verga inferior (Crossbeam) - Horizontal a lo largo del eje X
    const yardGeom1 = new THREE.CylinderGeometry(0.08, 0.08, mastRadius * 25, 8)
    const yard1 = new THREE.Mesh(yardGeom1, darkWoodMaterial)
    yard1.position.z = mastHeight * 0.4
    yard1.rotation.z = Math.PI / 2 // Rotar 90 grados para alinear izquierda-derecha (X)
    mastGroup.add(yard1)

    // Verga superior
    const yardGeom2 = new THREE.CylinderGeometry(0.06, 0.06, mastRadius * 18, 8)
    const yard2 = new THREE.Mesh(yardGeom2, darkWoodMaterial)
    yard2.position.z = mastHeight * 0.8
    yard2.rotation.z = Math.PI / 2
    mastGroup.add(yard2)

    // Velas curvadas
    const sailW1 = mastRadius * 24
    const sailH1 = mastHeight * 0.35
    const sail1 = createCurvedSail(sailW1, sailH1, 0.8)
    sail1.position.set(0, 0.3, mastHeight * 0.4)
    mastGroup.add(sail1)

    const sailW2 = mastRadius * 17
    const sailH2 = mastHeight * 0.3
    const sail2 = createCurvedSail(sailW2, sailH2, 0.6)
    sail2.position.set(0, 0.2, mastHeight * 0.8)
    mastGroup.add(sail2)

    boatGroup.add(mastGroup)
    return mastGroup
  }

  // Mástil de Proa (Trinquete)
  addMast(2.2, 8.5, 2.0, 0.12)

  // Mástil Mayor (Centro)
  addMast(-0.5, 11, 2.2, 0.16)

  // Mástil de Popa (Mesana) - Vela latina triangular
  const mizzenMastGroup = new THREE.Group()
  mizzenMastGroup.position.set(0, -3.1, 3.7)
  
  const mizzenMastGeom = new THREE.CylinderGeometry(0.08, 0.1, 6.5, 8)
  const mizzenMast = new THREE.Mesh(mizzenMastGeom, darkWoodMaterial)
  mizzenMast.rotation.x = Math.PI / 2
  mizzenMast.position.z = 3.25
  mizzenMastGroup.add(mizzenMast)

  // Vela latina triangular inclinada
  const triangularSailGeom = new THREE.ConeGeometry(1.6, 5, 4)
  const triangularSail = new THREE.Mesh(triangularSailGeom, sailMaterial)
  triangularSail.rotation.z = Math.PI
  triangularSail.rotation.y = Math.PI / 4
  triangularSail.rotation.x = Math.PI / 2.2
  triangularSail.position.set(0, -0.4, 3.25)
  triangularSail.scale.set(0.1, 1, 1)
  mizzenMastGroup.add(triangularSail)

  boatGroup.add(mizzenMastGroup)

  // 3. BANDERA (Flag)
  const flagGroup = new THREE.Group()
  flagGroup.position.set(0, -0.5, 13.2)
  const flagGeom = new THREE.BoxGeometry(1.4, 0.04, 0.6)
  const flag = new THREE.Mesh(flagGeom, flagMaterial)
  flag.position.set(0, -0.7, 0)
  flagGroup.add(flag)
  boatGroup.add(flagGroup)

  return boatGroup
}

interface MapBoardProps {
  onSelectMonument: (monumento: Monumento | null) => void
  selectedMonument: Monumento | null
  onLoadComplete?: () => void
  startIntroAnimation?: boolean
}

let isGoogleMapsInitialized = false

export default function MapBoard({ onSelectMonument, selectedMonument, onLoadComplete, startIntroAnimation }: MapBoardProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRotationControls, setShowRotationControls] = useState(false)
  const [heading, setHeading] = useState(90)
  const mapInstanceRef = useRef<any>(null)

  // Secuencia de animación de introducción cinematográfica AAA
  useEffect(() => {
    if (startIntroAnimation && mapInstanceRef.current) {
      const map = mapInstanceRef.current
      
      // Deshabilitar controles de usuario durante la animación de entrada
      map.setOptions({ gestureHandling: 'none' })

      const missionCenter = { lat: 18.477485383157326, lng: -69.88274578583231 }

      // Definir la secuencia del archivo JSON
      const steps = [
        // Paso 1: Iniciar sobre la ciudad (suficientemente cerca para ver el 3D)
        {
          duration: 1000,
          start: { zoom: 17.5, tilt: 65, heading: 0, lat: missionCenter.lat, lng: missionCenter.lng },
          end: { zoom: 17.5, tilt: 65, heading: 0, lat: missionCenter.lat, lng: missionCenter.lng },
          ease: (t: number) => t
        },
        // Paso 2: Giro suave de 360 grados alrededor de la Zona Colonial
        {
          duration: 8000,
          start: { zoom: 17.5, tilt: 65, heading: 0, lat: missionCenter.lat, lng: missionCenter.lng },
          end: { zoom: 17.5, tilt: 65, heading: 360, lat: missionCenter.lat, lng: missionCenter.lng },
          ease: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 // easeInOutCubic
        },
        // Paso 3: Descender hacia el centro histórico
        {
          duration: 6000,
          start: { zoom: 17.5, tilt: 65, heading: 360, lat: missionCenter.lat, lng: missionCenter.lng },
          end: { zoom: 18.8, tilt: 75, heading: 450, lat: missionCenter.lat, lng: missionCenter.lng },
          ease: (t: number) => 1 - Math.pow(1 - t, 3) // easeOutCubic
        }
      ]

      const startTime = performance.now()

      const animateCamera = (now: number) => {
        const elapsed = now - startTime
        
        let currentElapsed = 0
        let activeStep = null
        
        for (const step of steps) {
          if (elapsed >= currentElapsed && elapsed < currentElapsed + step.duration) {
            activeStep = { ...step, offset: elapsed - currentElapsed }
            break
          }
          currentElapsed += step.duration
        }

        if (activeStep) {
          const t = activeStep.ease(activeStep.offset / activeStep.duration)
          
          const zoom = activeStep.start.zoom + (activeStep.end.zoom - activeStep.start.zoom) * t
          const tilt = activeStep.start.tilt + (activeStep.end.tilt - activeStep.start.tilt) * t
          const heading = activeStep.start.heading + (activeStep.end.heading - activeStep.start.heading) * t
          const lat = activeStep.start.lat + (activeStep.end.lat - activeStep.start.lat) * t
          const lng = activeStep.start.lng + (activeStep.end.lng - activeStep.start.lng) * t

          map.moveCamera({
            center: { lat, lng },
            zoom,
            tilt,
            heading: heading % 360
          })

          requestAnimationFrame(animateCamera)
        } else {
          // Orientación y posición final del juego
          map.moveCamera({
            center: missionCenter,
            zoom: 18.8,
            tilt: 75,
            heading: 90
          })
          
          // Habilitar restricciones y controles de usuario al terminar la animación
          const colonialBounds = {
            north: 18.482,
            south: 18.467,
            west: -69.8925,
            east: -69.880
          }
          map.setOptions({ 
            gestureHandling: 'greedy',
            minZoom: 16.5,
            restriction: {
              latLngBounds: colonialBounds,
              strictBounds: true
            }
          })
        }
      }

      requestAnimationFrame(animateCamera)
    }
  }, [startIntroAnimation])

  // Centrar si cambia desde fuera (por ejemplo al hacer click en algún botón o restaurar) sin forzar el zoom
  useEffect(() => {
    if (mapInstanceRef.current && selectedMonument) {
      mapInstanceRef.current.panTo({ lat: selectedMonument.lat, lng: selectedMonument.lng })
      mapInstanceRef.current.setTilt(67)
    }
  }, [selectedMonument])

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID

    let intervalId: any = null
    let threeRendererRef: THREE.WebGLRenderer | null = null
    let webGLOverlayRef: any = null
    const boatMarkersRefList: any[] = []

    const completeLoading = () => {
      setLoading(false)
      onLoadComplete?.()
    }

    if (!apiKey) {
      setMapError('Falta la API Key de Google Maps (VITE_GOOGLE_MAPS_API_KEY).')
      completeLoading()
      return
    }

    try {
      if (!isGoogleMapsInitialized) {
        setOptions({
          key: apiKey,
          v: 'weekly',
        })
        isGoogleMapsInitialized = true
      }

      Promise.all([importLibrary('maps'), importLibrary('marker')])
        .then(([{ Map, Polygon, Polyline }, { AdvancedMarkerElement }]) => {
          if (!mapRef.current) return

          // Coordenadas del Alcázar de Colón (Punto inicial enfocado en 3D)
          const center = { lat: 18.477485383157326, lng: -69.88274578583231 }

          const map = new Map(mapRef.current, {
            center: center,
            zoom: 11, // Empezar alto (Paso 1)
            minZoom: 11, // Permitir zoom inicial alto de 11
            maxZoom: 21,
            tilt: 65, // Inclinación inicial (Paso 1)
            heading: 0, // Orientación inicial (Paso 1)
            mapId: mapId || undefined,
            disableDefaultUI: true,
            gestureHandling: 'none' // Deshabilitado inicialmente
          })

          // Mantener la inclinación (tilt) dentro del rango cinematográfico 3D aceptable
          map.addListener('tilt_changed', () => {
            const currentTilt = map.getTilt() || 0
            if (currentTilt < 60 || currentTilt > 85) {
              map.setTilt(80)
            }
          })

          // Actualizar orientación de la brújula al girar el mapa
          map.addListener('heading_changed', () => {
            setHeading(map.getHeading() || 0)
          })

          mapInstanceRef.current = map

          // Coordenadas precisas suministradas por el usuario
          const colonialZoneCoords = [
            { lat: 18.481220, lng: -69.884301 }, // Norte: Entrada a Santa Bárbara / Puente Mella
            { lat: 18.480076, lng: -69.882917 }, // Av. del Puerto / Frente al Fuerte de Santa Bárbara
            { lat: 18.477899, lng: -69.882057 }, // Av. del Puerto / Altura C. Vicente Celestino Duarte
            { lat: 18.475438, lng: -69.881741 }, // Av. del Puerto / Frente a Atarazanas Reales
            { lat: 18.474371, lng: -69.881576 }, // Av. del Puerto / Plaza de la Hispanidad (Alcázar)
            { lat: 18.473068, lng: -69.881082 }, // Av. del Puerto / Altura C. El Conde
            { lat: 18.472469, lng: -69.880794 }, // Av. del Puerto / Frente a Casas Reales
            { lat: 18.471727, lng: -69.880780 }, // Av. del Puerto / Murallas de Fortaleza Ozama
            { lat: 18.470529, lng: -69.881837 }, // Esquina de carga de la Fortaleza Ozama
            { lat: 18.470516, lng: -69.881808 }, // Muelle Don Diego (Este)
            { lat: 18.470010, lng: -69.881619 }, // Extremo sur de la Terminal Don Diego
            { lat: 18.468531, lng: -69.884005 }, // Paseo Pres. Billini / Lateral sur de Fortaleza Ozama
            { lat: 18.467444, lng: -69.884191 }, // Sur: Curva del monumento a Montesinos
            { lat: 18.468392, lng: -69.886244 }, // Paseo Pres. Billini / Altura C. Hostos (Malecón)
            { lat: 18.467469, lng: -69.889576 }, // Paseo Pres. Billini / Altura C. Estrelleta
            { lat: 18.469277, lng: -69.890496 }, // Oeste: Baluarte de la Misericordia / Palo Hincado
            { lat: 18.472993, lng: -69.891895 }, // Calle Palo Hincado / Puerta del Conde
            { lat: 18.475471, lng: -69.890122 }, // Esquina Palo Hincado / Av. Mella
            { lat: 18.479466, lng: -69.885351 }, // Av. Mella / Altura C. España (Santa Bárbara)
            { lat: 18.481210, lng: -69.884324 }, // Retorno a Puente Mella
            { lat: 18.481286, lng: -69.883618 }, // Cierre de delimitación en el Río Ozama
          ]

          // Dibuja el relleno del polígono sin borde sólido
          new Polygon({
            paths: colonialZoneCoords,
            strokeOpacity: 0,
            fillColor: '#ef4444',
            fillOpacity: 0.04, // Sombreado rojo muy ligero
            map: map,
          })

          // Define la línea de guiones (dashed) para simular el estilo de Google Maps
          const lineSymbol = {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            scale: 2,
          }

          // Dibuja la línea discontinua roja por encima del límite
          new Polyline({
            path: colonialZoneCoords,
            strokeOpacity: 0,
            icons: [
              {
                icon: lineSymbol,
                offset: '0',
                repeat: '10px',
              },
            ],
            strokeColor: '#ef4444',
            strokeWeight: 2,
            map: map,
          })

          // Listado de monumentos con detalles completos
          const monumentosZonaColonial: Monumento[] = [
            {
              nombre: "Alcázar de Colón",
              lat: 18.477485383157326,
              lng: -69.88274578583231,
              icono: "🏰",
              imagen: "/assets/img/Alcázar_de_Colón .jpg",
              categoria: "Museo e Historia",
              horario: "Martes a Domingo: 9:00 AM - 5:00 PM",
              abiertoInfo: "Abierto · Cierra a las 5 p.m.",
              esGratis: false,
              costo: "$100 DOP / $2 USD",
              rating: 4.7,
              reviews: 3240,
              descripcion: "Construido entre 1511 y 1514 por Diego Colón, hijo del Almirante Cristóbal Colón. Este palacio de estilo gótico mudéjar es el único ejemplo de su tipo en América y albergó a la corte virreinal durante décadas."
            },
            {
              nombre: "Plaza de España",
              lat: 18.477058894853517,
              lng: -69.88324087156973,
              icono: "⛲",
              imagen: "/assets/img/Plaza_de_España.jpg",
              categoria: "Plaza Pública",
              horario: "Abierto las 24 horas",
              abiertoInfo: "Abierto las 24 horas",
              esGratis: true,
              costo: "Gratis",
              rating: 4.8,
              reviews: 4510,
              descripcion: "Una amplia plaza rodeada de restaurantes y centros culturales, con vistas espectaculares al Alcázar y al Río Ozama."
            },
            {
              nombre: "Fortaleza Ozama",
              lat: 18.473195287512446,
              lng: -69.88182453318161,
              icono: "🛡️",
              imagen: "/assets/img/Fortaleza_Ozama .jpg",
              categoria: "Fortaleza Militar / Monumento",
              horario: "Todos los días: 9:00 AM - 6:00 PM",
              abiertoInfo: "Abierto · Cierra a las 6 p.m.",
              esGratis: false,
              costo: "$70 DOP / $1.5 USD",
              rating: 4.7,
              reviews: 1890,
              descripcion: "La estructura militar europea más antigua de las Américas, construida en 1502 para proteger la ciudad."
            },
            {
              nombre: "Calle Las Damas",
              lat: 18.47317875037892,
              lng: -69.88260593338455,
              icono: "🛣️",
              imagen: "/assets/img/Calle_Las_Damas .jpg",
              categoria: "Calle Histórica",
              horario: "Abierto las 24 horas",
              abiertoInfo: "Abierto las 24 horas",
              esGratis: true,
              costo: "Gratis",
              rating: 4.9,
              reviews: 2100,
              descripcion: "La primera calle empedrada del Nuevo Mundo, llamada así por las damas de la corte de María de Toledo."
            },
            {
              nombre: "Museo de las Casas Reales",
              lat: 18.475883452952615,
              lng: -69.88299960332994,
              icono: "🏛️",
              imagen: "/assets/img/Museo_de_Casas Reales .jpg",
              categoria: "Museo Histórico",
              horario: "Martes a Domingo: 9:00 AM - 5:00 PM",
              abiertoInfo: "Abierto · Cierra a las 5 p.m.",
              esGratis: false,
              costo: "$100 DOP / $2 USD",
              rating: 4.7,
              reviews: 1520,
              descripcion: "Sede de la Real Audiencia y el Palacio de los Gobernadores durante la época colonial."
            },
            {
              nombre: "Reloj de Sol",
              lat: 18.475736862055204,
              lng: -69.88282602909312,
              icono: "🕰️",
              imagen: "/assets/img/Reloj_de_Sol .jpg",
              categoria: "Monumento Científico",
              horario: "Abierto las 24 horas",
              abiertoInfo: "Abierto las 24 horas",
              esGratis: true,
              costo: "Gratis",
              rating: 4.5,
              reviews: 420,
              descripcion: "Construido en 1753 durante la gobernación de Francisco de Rubio y Peñaranda."
            },
            {
              nombre: "Panteón Nacional",
              lat: 18.47514403379121,
              lng: -69.88326660725454,
              icono: "🏛️",
              imagen: "/assets/img/Panteón_Nacional .jpg",
              categoria: "Monumento Nacional / Mausoleo",
              horario: "Martes a Domingo: 9:00 AM - 5:00 PM",
              abiertoInfo: "Abierto · Cierra a las 5 p.m.",
              esGratis: true,
              costo: "Gratis",
              rating: 4.8,
              reviews: 2230,
              descripcion: "Antigua iglesia jesuita convertida en el mausoleo nacional de los héroes patrios."
            },
            {
              nombre: "Catedral Primada de América",
              lat: 18.47308392901038,
              lng: -69.88394116073748,
              icono: "⛪",
              imagen: "/assets/img/Catedral_Primada_de_América .jpg",
              categoria: "Catedral / Templo Religioso",
              horario: "Lunes a Sábado: 9:00 AM - 4:30 PM",
              abiertoInfo: "Abierto · Cierra a las 4:30 p.m.",
              esGratis: true,
              costo: "Gratis (Donación voluntaria)",
              rating: 4.8,
              reviews: 5890,
              descripcion: "La catedral más antigua de las Américas, consagrada por el Papa Julio II en 1504."
            },
            {
              nombre: "Parque Colón",
              lat: 18.47351311581127,
              lng: -69.88420139692717,
              icono: "🌳",
              imagen: "/assets/img/Parque_Colon .jpg",
              categoria: "Parque / Plaza Pública",
              horario: "Abierto las 24 horas",
              abiertoInfo: "Abierto las 24 horas",
              esGratis: true,
              costo: "Gratis",
              rating: 4.7,
              reviews: 7630,
              descripcion: "El centro social y de recreación de la Zona Colonial, con la emblemática estatua de Colón."
            },
            {
              nombre: "Ruinas de San Francisco",
              lat: 18.476961778888914,
              lng: -69.88585108304535,
              icono: "🏛️",
              imagen: "/assets/img/Ruinas_de_San_Francisco .jpg",
              categoria: "Ruinas Arqueológicas",
              horario: "Abierto las 24 horas",
              abiertoInfo: "Abierto las 24 horas",
              esGratis: true,
              costo: "Gratis",
              rating: 4.6,
              reviews: 1120,
              descripcion: "Los restos del primer monasterio franciscano del Nuevo Mundo, construido en 1508."
            },
            {
              nombre: "Puerta de la Misericordia",
              lat: 18.468369320711368,
              lng: -69.89010341138663,
              icono: "🚪",
              imagen: "/assets/img/Puerta_de_la_Misericordia .jpg",
              categoria: "Monumento Histórico",
              horario: "Abierto las 24 horas",
              abiertoInfo: "Abierto las 24 horas",
              esGratis: true,
              costo: "Gratis",
              rating: 4.5,
              reviews: 580,
              descripcion: "Lugar del trabucazo de Matías Ramón Mella que proclamó la Independencia Nacional en 1844."
            },
            {
              nombre: "Puerta del Conde",
              lat: 18.47151360510624,
              lng: -69.89154461561613,
              icono: "🚪",
              imagen: "/assets/img/Puerta_del_Conde.jpg",
              categoria: "Monumento Nacional / Baluarte",
              horario: "Todos los días: 8:00 AM - 6:00 PM",
              abiertoInfo: "Abierto · Cierra a las 6 p.m.",
              esGratis: true,
              costo: "Gratis",
              rating: 4.8,
              reviews: 3400,
              descripcion: "Un baluarte histórico que formaba parte de la defensa de la ciudad."
            }
          ]

          // Crear los marcadores estilo mapa del tesoro
          monumentosZonaColonial.forEach((monumento, index) => {
            const markerDiv = document.createElement('div')
            markerDiv.className = 'treasure-pin-container'
            
            // Forzar estilos CSS en línea del contenedor principal del pin
            markerDiv.style.width = '120px'
            markerDiv.style.height = '95px'
            markerDiv.style.display = 'flex'
            markerDiv.style.flexDirection = 'column'
            markerDiv.style.alignItems = 'center'
            markerDiv.style.justifyContent = 'center'
            markerDiv.style.pointerEvents = 'auto'
            markerDiv.style.cursor = 'pointer'

            markerDiv.innerHTML = `
              <div class="treasure-medallion">
                <img src="${monumento.imagen}" alt="${monumento.nombre}" />
                <div class="treasure-lock-badge">
                  <!-- Candado de bloqueo SVG -->
                  <svg style="width: 9px; height: 9px; fill: currentColor;" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                </div>
              </div>
              <div class="treasure-label">DESAFÍO ${index + 1}</div>
            `

            // Manejador del click
            markerDiv.addEventListener('click', () => {
              map.panTo({ lat: monumento.lat, lng: monumento.lng })
              onSelectMonument(monumento)
            })

            new AdvancedMarkerElement({
              map: map,
              position: { lat: monumento.lat, lng: monumento.lng },
              title: monumento.nombre,
              content: markerDiv,
            })
          })

          // --- ANIMACIÓN DE MÚLTIPLES BARCOS EN EL RÍO OZAMA ---
          const ninaCoords = [
            { lat: 18.463653, lng: -69.884868 },
            { lat: 18.464644, lng: -69.887003 },
            { lat: 18.468206, lng: -69.885678 },
            { lat: 18.467416, lng: -69.884437 },
            { lat: 18.467143, lng: -69.883558 },
            { lat: 18.469048, lng: -69.882180 },
            { lat: 18.470150, lng: -69.878445 },
            { lat: 18.470687, lng: -69.877034 }
          ]

          const pintaCoords = [
            { lat: 18.470010, lng: -69.881619 }, // Puerto de inicio (Oeste)
            { lat: 18.472469, lng: -69.880200 }, // Río Centro
            { lat: 18.474371, lng: -69.880800 }, // Río Centro
            { lat: 18.476500, lng: -69.880600 }, // Río Centro
            { lat: 18.479540, lng: -69.881187 }  // Puerto de llegada (Este)
          ]

          const santaMariaCoords = [
            { lat: 18.467958, lng: -69.879312 },
            { lat: 18.472382, lng: -69.878671 },
            { lat: 18.474895, lng: -69.880554 },
            { lat: 18.479391, lng: -69.881626 },
            { lat: 18.481098, lng: -69.882924 }
          ]

          interface BoatInstance {
            id: string
            name: string
            emoji: string
            coords: { lat: number; lng: number }[]
            baseSpeed: number
            sizeInMeters: number
            theme: BoatColorTheme
            // Animación
            currentSegment: number
            segmentProgress: number
            goingForward: boolean
            isWaiting: boolean
            currentLat: number
            currentLng: number
            currentRotation: number
            bubbleElement: HTMLDivElement | null
            bubbleMarker: any
            model3D: THREE.Group | null
            innerModel3D: THREE.Group | null
          }

          const boats: BoatInstance[] = [
            {
              id: 'nina',
              name: 'La Niña',
              emoji: '⛵',
              coords: ninaCoords,
              baseSpeed: 0.85,
              sizeInMeters: 22,
              theme: {
                woodColor: 0x8b5a2b, // Madera más clara
                sailsColor: 0xffffff,
                flagColor: 0x1d4ed8 // Azul
              },
              currentSegment: 0,
              segmentProgress: 0,
              goingForward: true,
              isWaiting: false,
              currentLat: ninaCoords[0].lat,
              currentLng: ninaCoords[0].lng,
              currentRotation: 0,
              bubbleElement: null,
              bubbleMarker: null,
              model3D: null,
              innerModel3D: null
            },
            {
              id: 'pinta',
              name: 'La Pinta',
              emoji: '📦',
              coords: pintaCoords,
              baseSpeed: 0.60,
              sizeInMeters: 26,
              theme: {
                woodColor: 0x3e2718, // Madera oscura
                sailsColor: 0xf5f2eb, // Crema
                flagColor: 0xb91c1c // Rojo
              },
              currentSegment: 0,
              segmentProgress: 0,
              goingForward: true,
              isWaiting: false,
              currentLat: pintaCoords[0].lat,
              currentLng: pintaCoords[0].lng,
              currentRotation: 0,
              bubbleElement: null,
              bubbleMarker: null,
              model3D: null,
              innerModel3D: null
            },
            {
              id: 'santa_maria',
              name: 'Santa María',
              emoji: '👑',
              coords: santaMariaCoords,
              baseSpeed: 0.45,
              sizeInMeters: 33,
              theme: {
                woodColor: 0x5c3a21, // Madera estándar
                sailsColor: 0xe2e8f0, // Blanco sucio
                flagColor: 0xd97706 // Dorado/Ámbar
              },
              currentSegment: 0,
              segmentProgress: 0,
              goingForward: true,
              isWaiting: false,
              currentLat: santaMariaCoords[0].lat,
              currentLng: santaMariaCoords[0].lng,
              currentRotation: 0,
              bubbleElement: null,
              bubbleMarker: null,
              model3D: null,
              innerModel3D: null
            }
          ]

          // Los marcadores de burbuja se acumulan en boatMarkersRefList (declarado arriba)

          // Inicializar los globos de texto flotantes para cada barco
          boats.forEach((boat) => {
            const boatBubbleDiv = document.createElement('div')
            boatBubbleDiv.className = `pirate-boat-bubble-${boat.id}`
            boatBubbleDiv.style.position = 'absolute'
            boatBubbleDiv.style.pointerEvents = 'none'
            
            const borderCol = boat.id === 'nina' ? '#1d4ed8' : boat.id === 'pinta' ? '#b91c1c' : '#d97706'
            
            boatBubbleDiv.innerHTML = `
              <div class="boat-bubble" style="background: rgba(15, 23, 42, 0.95); border: 1.8px solid ${borderCol}; color: #fef3c7; font-family: Georgia, serif; font-size: 8px; font-weight: 900; padding: 3px 8px; border-radius: 6px; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.4); text-transform: uppercase; letter-spacing: 0.5px; z-index: 10;">
                ${boat.name}
              </div>
            `

            const bubbleMarker = new AdvancedMarkerElement({
              map: map,
              position: boat.coords[0],
              title: boat.name,
              content: boatBubbleDiv
            })
            
            boat.bubbleMarker = bubbleMarker
            boat.bubbleElement = boatBubbleDiv.querySelector('.boat-bubble') as HTMLDivElement
            boatMarkersRefList.push(bubbleMarker)
          })

          // --- WebGLOverlayView e integración con Three.js ---
          const threeScene = new THREE.Scene()
          const threeCamera = new THREE.PerspectiveCamera()

          // Modelo 3D de la Fortaleza Ozama (Meshy AI)
          let fortalezaModel3D: THREE.Group | null = null
          const fortalezaLat = 18.473195287512446
          const fortalezaLng = -69.88182453318161

          // Modelo 3D de la Catedral Primada de las Américas
          let catedralModel3D: THREE.Group | null = null
          const catedralLat = 18.47308392901038
          const catedralLng = -69.88394116073748

          // Helper para crear gaviota procedural de bajo rendimiento (AAA visuales, móvil-friendly)
          const createSeagullMesh = () => {
            const seagullGroup = new THREE.Group()
            const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
            const beakMat = new THREE.MeshBasicMaterial({ color: 0xffa500 })

            // Cuerpo
            const bodyGeom = new THREE.BoxGeometry(0.12, 0.35, 0.08)
            const body = new THREE.Mesh(bodyGeom, whiteMat)
            seagullGroup.add(body)

            // Pico
            const beakGeom = new THREE.ConeGeometry(0.04, 0.12, 4)
            const beak = new THREE.Mesh(beakGeom, beakMat)
            beak.position.set(0, 0.22, 0)
            beak.rotation.x = Math.PI / 2
            seagullGroup.add(beak)

            // Ala izquierda
            const wingGeom = new THREE.PlaneGeometry(0.45, 0.12)
            wingGeom.translate(-0.225, 0, 0)
            const leftWing = new THREE.Mesh(wingGeom, whiteMat)
            leftWing.name = "leftWing"
            leftWing.position.set(-0.06, 0, 0)
            seagullGroup.add(leftWing)

            // Ala derecha
            const rightWing = new THREE.Mesh(wingGeom, whiteMat)
            rightWing.name = "rightWing"
            rightWing.scale.x = -1
            rightWing.position.set(0.06, 0, 0)
            seagullGroup.add(rightWing)

            seagullGroup.scale.set(4, 4, 4)
            return seagullGroup
          }

          interface SeagullInstance {
            mesh: THREE.Group
            leftWing: THREE.Mesh
            rightWing: THREE.Mesh
            angle: number
            speed: number
            radius: number
            centerLat: number
            centerLng: number
            height: number
            wingPhase: number
            wingSpeed: number
          }

          const seagulls: SeagullInstance[] = []

          // Partículas flotantes de polen y neblina (mist/dust) en coordenadas GPS estables
          interface ParticleInstance {
            lat: number
            lng: number
            alt: number
            speedLat: number
            speedLng: number
            speedAlt: number
          }

          const particles: ParticleInstance[] = []
          const particleCount = 150
          for (let i = 0; i < particleCount; i++) {
            particles.push({
              lat: 18.474 + (Math.random() - 0.5) * 0.012,
              lng: -69.881 + (Math.random() - 0.5) * 0.010,
              alt: 2.0 + Math.random() * 20.0,
              speedLat: (Math.random() - 0.5) * 0.000002,
              speedLng: (Math.random() - 0.5) * 0.000002,
              speedAlt: (Math.random() - 0.5) * 0.01
            })
          }

          const particleGeometry = new THREE.BufferGeometry()
          const particlePositions = new Float32Array(particleCount * 3)
          particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))

          const createParticleTexture = () => {
            const canvas = document.createElement('canvas')
            canvas.width = 16
            canvas.height = 16
            const ctx = canvas.getContext('2d')
            if (ctx) {
              const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8)
              grad.addColorStop(0, 'rgba(254, 243, 199, 1)')
              grad.addColorStop(0.4, 'rgba(254, 243, 199, 0.4)')
              grad.addColorStop(1, 'rgba(254, 243, 199, 0)')
              ctx.fillStyle = grad
              ctx.fillRect(0, 0, 16, 16)
            }
            return new THREE.CanvasTexture(canvas)
          }

          const particleMaterial = new THREE.PointsMaterial({
            size: 1.5,
            map: createParticleTexture(),
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          })

          const particleSystem = new THREE.Points(particleGeometry, particleMaterial)

          const webGLOverlay = new (window as any).google.maps.WebGLOverlayView()
          webGLOverlayRef = webGLOverlay

          webGLOverlay.onAdd = () => {
            // Luces para resaltar texturas tridimensionales en WebGL
            const ambientLight = new THREE.AmbientLight(0xffffff, 1.6)
            threeScene.add(ambientLight)

            const dirLight = new THREE.DirectionalLight(0xffffff, 2.2)
            dirLight.position.set(2000, 4000, 3000)
            threeScene.add(dirLight)

            // Añadir partículas
            threeScene.add(particleSystem)

            // Inicializar las 25 gaviotas
            for (let i = 0; i < 25; i++) {
              const mesh = createSeagullMesh()
              const leftWing = mesh.getObjectByName('leftWing') as THREE.Mesh
              const rightWing = mesh.getObjectByName('rightWing') as THREE.Mesh

              const latOffset = (Math.random() - 0.5) * 0.008
              const lngOffset = (Math.random() - 0.5) * 0.006

              seagulls.push({
                mesh,
                leftWing,
                rightWing,
                angle: Math.random() * Math.PI * 2,
                speed: 0.005 + Math.random() * 0.01,
                radius: 15.0 + Math.random() * 30.0,
                centerLat: 18.474 + latOffset,
                centerLng: -69.881 + lngOffset,
                height: 10.0 + Math.random() * 12.0,
                wingPhase: Math.random() * Math.PI * 2,
                wingSpeed: 10.0 + Math.random() * 6.0
              })

              threeScene.add(mesh)
            }

            // Instanciar modelos 3D usando GLTFLoader con fallback procedimental
            const loader = new GLTFLoader()
            loader.load(
              '/assets/model/ship_k_ii_caravel.glb',
              (gltf) => {
                const loadedModel = gltf.scene

                // Configurar sombras y doble cara para los materiales (necesario para las velas)
                loadedModel.traverse((child) => {
                  if ((child as any).isMesh) {
                    const mesh = child as THREE.Mesh
                    mesh.castShadow = true
                    mesh.receiveShadow = true
                    mesh.frustumCulled = false
                    
                    if (mesh.material) {
                      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
                      materials.forEach((mat: any) => {
                        mat.side = THREE.DoubleSide
                        mat.transparent = false
                        mat.opacity = 1.0
                        if (mat.alphaTest !== undefined) mat.alphaTest = 0
                        if (mat.depthWrite !== undefined) mat.depthWrite = true
                      })
                    }
                  }
                })

                boats.forEach((boat) => {
                  // Contenedor intermedio para que las animaciones en onDraw modifiquen el wrapper
                  // y no sobrescriban la rotación/escala de alineación del propio modelo GLB
                  const wrapper = new THREE.Group()
                  const modelClone = loadedModel.clone()
                  
                  // Rotación base para convertir de Y-up (GLTF estándar) a Z-up (Google Maps/Three.js)
                  modelClone.rotation.x = Math.PI / 2
                  
                  // Si el barco navega marcha atrás, rotamos 180 grados en el eje Z (que ahora apunta hacia arriba)
                  modelClone.rotation.y = Math.PI
                  
                  // Ajuste de escala base de este modelo GLB específico
                  const glbBaseScale = 0.5
                  modelClone.scale.set(glbBaseScale, glbBaseScale, glbBaseScale)

                  wrapper.add(modelClone)

                  const boatGroup = new THREE.Group()
                  boatGroup.add(wrapper)

                  boat.innerModel3D = wrapper
                  boat.model3D = boatGroup
                  threeScene.add(boatGroup)
                })
                webGLOverlay.requestRedraw()
              },
              undefined,
              (error) => {
                console.error('Error al cargar ship_k_ii_caravel.glb, usando barcos procedimentales:', error)
                // Fallback a los modelos procedimentales
                boats.forEach((boat) => {
                  const model = createProceduralBoat(boat.theme)
                  const boatGroup = new THREE.Group()
                  boatGroup.add(model)

                  boat.innerModel3D = model
                  boat.model3D = boatGroup
                  threeScene.add(boatGroup)
                })
                webGLOverlay.requestRedraw()
              }
            )

            // Cargar modelo 3D de castillo en la Fortaleza Ozama
            const fortalezaLoader = new GLTFLoader()
            fortalezaLoader.load(
              '/assets/model/castillo.glb',
              (gltf) => {
                const model = gltf.scene

                // Tinte cálido para mezclar con la paleta del mapa (tonos arena/dorado colonial)
                const warmTint = new THREE.Color(0.95, 0.88, 0.75) // Arena cálido
                
                // Configurar materiales del modelo para que se integre con el mapa
                model.traverse((child) => {
                  if ((child as any).isMesh) {
                    const mesh = child as THREE.Mesh
                    mesh.castShadow = true
                    mesh.receiveShadow = true
                    mesh.frustumCulled = false

                    if (mesh.material) {
                      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
                      materials.forEach((mat: any) => {
                        mat.side = THREE.DoubleSide
                        mat.depthWrite = true
                        mat.transparent = false
                        mat.opacity = 1.0

                        // Mezclar el color original con el tinte cálido del mapa
                        if (mat.color) {
                          mat.color.multiply(warmTint)
                        }

                        // Reducir la saturación y aumentar la calidez de las texturas
                        if (mat.emissive) {
                          mat.emissive.set(0x1a1208) // Emisión sutil dorada
                          mat.emissiveIntensity = 0.15
                        }

                        // Suavizar el contraste del modelo
                        if (mat.roughness !== undefined) {
                          mat.roughness = Math.min(mat.roughness + 0.15, 1.0)
                        }
                        if (mat.metalness !== undefined) {
                          mat.metalness = Math.max(mat.metalness - 0.1, 0.0)
                        }
                      })
                    }
                  }
                })

                // Rotación de Y-up (GLTF) a Z-up (Google Maps)
                model.rotation.x = Math.PI / 2

                // Forzar actualización de las matrices después de la rotación
                model.updateMatrixWorld(true)

                // Medir el tamaño real del modelo DESPUÉS de rotar
                const box = new THREE.Box3().setFromObject(model)
                const size = new THREE.Vector3()
                const center = new THREE.Vector3()
                box.getSize(size)
                box.getCenter(center)
                console.log('Tamaño del castillo (x,y,z):', size.x, size.y, size.z)
                console.log('Centro del castillo:', center.x, center.y, center.z)

                // Centrar el modelo en su propio origen para que la coordenada GPS
                // coincida con el centro del castillo
                model.position.set(-center.x, -center.y, -center.z)

                // Escala del modelo - ajustada para que sea bien visible en el mapa
                const desiredSize = 80 // metros deseados
                const maxDim = Math.max(size.x, size.y, size.z)
                const scale = maxDim > 0 ? desiredSize / maxDim : 5.0
                console.log('Escala aplicada al castillo:', scale)

                const wrapper = new THREE.Group()
                wrapper.add(model)
                wrapper.scale.set(scale, scale, scale)

                fortalezaModel3D = wrapper
                threeScene.add(wrapper)
                webGLOverlay.requestRedraw()
                console.log('Modelo castillo (Fortaleza Ozama) cargado correctamente')
              },
              (progress) => {
                console.log('Cargando castillo:', Math.round((progress.loaded / (progress.total || 1)) * 100) + '%')
              },
              (error) => {
                console.error('Error al cargar castillo.glb para la Fortaleza Ozama:', error)
              }
            )

            // Cargar modelo 3D de la Catedral Primada
            const catedralLoader = new GLTFLoader()
            catedralLoader.load(
              '/assets/model/castillo.glb',
              (gltf) => {
                const model = gltf.scene

                // Tinte cálido para mezclar con la paleta del mapa (tonos arena/dorado colonial)
                const warmTint = new THREE.Color(0.95, 0.88, 0.75)

                model.traverse((child) => {
                  if ((child as any).isMesh) {
                    const mesh = child as THREE.Mesh
                    mesh.castShadow = true
                    mesh.receiveShadow = true
                    mesh.frustumCulled = false

                    if (mesh.material) {
                      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
                      materials.forEach((mat: any) => {
                        mat.side = THREE.DoubleSide
                        mat.depthWrite = true
                        mat.transparent = false
                        mat.opacity = 1.0

                        if (mat.color) {
                          mat.color.multiply(warmTint)
                        }

                        if (mat.emissive) {
                          mat.emissive.set(0x1a1208)
                          mat.emissiveIntensity = 0.15
                        }

                        if (mat.roughness !== undefined) {
                          mat.roughness = Math.min(mat.roughness + 0.15, 1.0)
                        }
                        if (mat.metalness !== undefined) {
                          mat.metalness = Math.max(mat.metalness - 0.1, 0.0)
                        }
                      })
                    }
                  }
                })

                // Rotación de Y-up (GLTF) a Z-up (Google Maps)
                model.rotation.x = Math.PI / 2
                model.updateMatrixWorld(true) 

                // Medir el tamaño real del modelo
                const box = new THREE.Box3().setFromObject(model)
                const size = new THREE.Vector3()
                const center = new THREE.Vector3()
                box.getSize(size)
                box.getCenter(center)
                console.log('Tamaño de la catedral (x,y,z):', size.x, size.y, size.z)

                // Centrar
                model.position.set(-center.x, -center.y, -center.z)

                // Escalar (deseamos unos 75 metros de tamaño en el mapa para que luzca bien)
                const desiredSize = 40
                const maxDim = Math.max(size.x, size.y, size.z)
                const scale = maxDim > 0 ? desiredSize / maxDim : 5.0
                console.log('Escala aplicada a la catedral:', scale)

                const wrapper = new THREE.Group()
                wrapper.add(model)
                wrapper.scale.set(scale, scale, scale)

                catedralModel3D = wrapper
                threeScene.add(wrapper)
                webGLOverlay.requestRedraw()
                console.log('Modelo catedral (Catedral Primada) cargado correctamente')
              },
              (progress) => {
                console.log('Cargando catedral:', Math.round((progress.loaded / (progress.total || 1)) * 100) + '%')
              },
              (error) => {
                console.error('Error al cargar catedral.glb:', error)
              }
            )
          }

          webGLOverlay.onContextRestored = ({ gl }: any) => {
            const renderer = new THREE.WebGLRenderer({
              canvas: gl.canvas,
              context: gl,
              ...gl.getContextAttributes()
            })
            renderer.autoClear = false
            threeRendererRef = renderer
          }

          webGLOverlay.onDraw = ({ transformer }: any) => {
            const renderer = threeRendererRef
            if (!renderer) return

            // Usamos un punto de anclaje dinámico en el centro del mapa para evitar desalineación por precisión y recortes de la cámara (clipping)
            const center = map.getCenter()
            const anchorLat = center ? center.lat() : 18.475
            const anchorLng = center ? center.lng() : -69.882

            const pos = transformer.fromLatLngAltitude({ lat: anchorLat, lng: anchorLng, altitude: 0 })
            if (pos) {
              threeCamera.projectionMatrix.fromArray(pos)
            }

            renderer.resetState()

            try {
              const time = Date.now()
              const latRad = (anchorLat * Math.PI) / 180

              // Actualizar y animar partículas de polen/neblina
              const posAttr = particleGeometry.attributes.position as THREE.BufferAttribute
              for (let i = 0; i < particleCount; i++) {
                const p = particles[i]
                p.lat += p.speedLat
                p.lng += p.speedLng
                p.alt += p.speedAlt

                if (Math.abs(p.lat - 18.474) > 0.006) p.speedLat *= -1
                if (Math.abs(p.lng - -69.881) > 0.005) p.speedLng *= -1
                if (p.alt < 1.5 || p.alt > 22.0) p.speedAlt *= -1

                const dx = (p.lng - anchorLng) * 111139 * Math.cos(latRad)
                const dy = (p.lat - anchorLat) * 111139
                const dz = p.alt
                posAttr.setXYZ(i, dx, dy, dz)
              }
              posAttr.needsUpdate = true

              // Actualizar y animar gaviotas volando sobre el río y barcos
              seagulls.forEach((gull) => {
                gull.angle += gull.speed
                
                const cx = (gull.centerLng - anchorLng) * 111139 * Math.cos(latRad)
                const cy = (gull.centerLat - anchorLat) * 111139
                
                const x = cx + Math.cos(gull.angle) * gull.radius
                const y = cy + Math.sin(gull.angle) * gull.radius
                const z = gull.height + Math.sin(time * 0.0025 + gull.wingPhase) * 2.0
                
                gull.mesh.position.set(x, y, z)
                
                const tx = -Math.sin(gull.angle)
                const ty = Math.cos(gull.angle)
                const rotationZ = Math.atan2(ty, tx)
                gull.mesh.rotation.z = rotationZ - Math.PI / 2
                
                if (gull.leftWing && gull.rightWing) {
                  const flap = Math.sin(time * 0.01 * gull.wingSpeed + gull.wingPhase) * 0.6
                  gull.leftWing.rotation.y = flap
                  gull.rightWing.rotation.y = -flap
                }
              })

              boats.forEach((boat, idx) => {
                if (boat.model3D) {
                  boat.model3D.visible = true

                  // Calcular coordenadas locales en metros relativas al punto de anclaje
                  const latDiff = boat.currentLat - anchorLat
                  const lngDiff = boat.currentLng - anchorLng
                  const latRad = (anchorLat * Math.PI) / 180
                  const dx = lngDiff * 111139 * Math.cos(latRad)
                  const dy = latDiff * 111139

                  boat.model3D.position.set(dx, dy, 0)

                  const scaleFactor = (boat.sizeInMeters / 16) * 1.5

                  if (boat.innerModel3D) {
                    const offsetTime = time + idx * 1200
                    const bobbing = Math.sin(offsetTime * 0.0035) * 0.75

                    // Dirección/Orientación del barco
                    boat.innerModel3D.rotation.z = boat.currentRotation

                    // Inclinación del oleaje (pitch/roll)
                    boat.innerModel3D.rotation.x = Math.sin(offsetTime * 0.002) * 0.04
                    boat.innerModel3D.rotation.y = Math.sin(offsetTime * 0.0015) * 0.02

                    // Altura del balanceo
                    boat.innerModel3D.position.z = bobbing

                    // Escala del modelo
                    boat.innerModel3D.scale.set(scaleFactor, scaleFactor, scaleFactor)
                  }
                }
              })

              // Posicionar modelo 3D de la Fortaleza Ozama
              if (fortalezaModel3D) {
                const fortDx = (fortalezaLng - anchorLng) * 111139 * Math.cos(latRad)
                const fortDy = (fortalezaLat - anchorLat) * 111139
                fortalezaModel3D.position.set(fortDx, fortDy, 2)
              }

              // Posicionar modelo 3D de la Catedral Primada
              if (catedralModel3D) {
                const catDx = (catedralLng - anchorLng) * 111139 * Math.cos(latRad)
                const catDy = (catedralLat - anchorLat) * 111139
                catedralModel3D.position.set(catDx, catDy, 2)
              }

              renderer.render(threeScene, threeCamera)
            } catch (err) {
              if (!(window as any)._hasLoggedDrawError) {
                console.error("Error en onDraw:", err)
                ;(window as any)._hasLoggedDrawError = true
              }
            }

            webGLOverlay.requestRedraw()
          }

          webGLOverlay.setMap(map)

          const getRotationAngle = (p1: {lat: number, lng: number}, p2: {lat: number, lng: number}) => {
            const dy = p2.lat - p1.lat
            const latRad = (p1.lat * Math.PI) / 180
            const dx = (p2.lng - p1.lng) * Math.cos(latRad)
            const angleRad = Math.atan2(dy, dx)
            return angleRad - Math.PI / 2
          }

          const animate = () => {
            boats.forEach((boat) => {
              if (boat.isWaiting) return

              const startNode = boat.coords[boat.goingForward ? boat.currentSegment : boat.currentSegment + 1]
              const endNode = boat.coords[boat.goingForward ? boat.currentSegment + 1 : boat.currentSegment]

              const t = boat.segmentProgress / 100
              boat.currentLat = startNode.lat + (endNode.lat - startNode.lat) * t
              boat.currentLng = startNode.lng + (endNode.lng - startNode.lng) * t
              boat.currentRotation = getRotationAngle(startNode, endNode)

              if (boat.bubbleMarker) {
                boat.bubbleMarker.position = { lat: boat.currentLat, lng: boat.currentLng }
              }

              const progressRatio = boat.segmentProgress / 100
              const speedMultiplier = Math.sin(progressRatio * Math.PI) * 0.75 + 0.25
              boat.segmentProgress += boat.baseSpeed * speedMultiplier

              if (boat.segmentProgress > 100) {
                boat.segmentProgress = 0
                if (boat.goingForward) {
                  boat.currentSegment++
                  if (boat.currentSegment >= boat.coords.length - 1) {
                    boat.isWaiting = true
                    if (boat.bubbleElement) {
                      boat.bubbleElement.style.background = "rgba(13, 122, 112, 0.95)"
                      boat.bubbleElement.style.borderColor = "#ffffff"
                    }
                    setTimeout(() => {
                      boat.goingForward = false
                      boat.currentSegment = boat.coords.length - 2
                      boat.isWaiting = false
                      if (boat.bubbleElement) {
                        boat.bubbleElement.style.background = "rgba(15, 23, 42, 0.9)"
                        boat.bubbleElement.style.borderColor = boat.id === 'nina' ? '#1d4ed8' : boat.id === 'pinta' ? '#b91c1c' : '#d97706'
                      }
                    }, 4000)
                  }
                } else {
                  boat.currentSegment--
                  if (boat.currentSegment < 0) {
                    boat.isWaiting = true
                    setTimeout(() => {
                      boat.goingForward = true
                      boat.currentSegment = 0
                      boat.isWaiting = false
                      if (boat.bubbleElement) {
                        boat.bubbleElement.style.background = "rgba(15, 23, 42, 0.95)"
                        boat.bubbleElement.style.borderColor = boat.id === 'nina' ? '#1d4ed8' : boat.id === 'pinta' ? '#b91c1c' : '#d97706'
                      }
                    }, 4000)
                  }
                }
              }
            })
          }

          intervalId = setInterval(animate, 50)
          completeLoading()
        })
        .catch((err: unknown) => {
          console.error('Error al cargar Google Maps SDK:', err)
          setMapError('Ocurrió un error al cargar el mapa. Verifica la consola.')
          completeLoading()
        })
    } catch (err: unknown) {
      console.error('Error al configurar Google Maps SDK:', err)
      setMapError('Ocurrió un error al configurar el mapa.')
      completeLoading()
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
      boatMarkersRefList.forEach((marker) => {
        if (marker) marker.map = null
      })
      if (webGLOverlayRef) {
        webGLOverlayRef.setMap(null)
      }
      if (threeRendererRef) {
        threeRendererRef.dispose()
      }
    }
  }, [onSelectMonument])

  const handleRotateLeft = () => {
    if (mapInstanceRef.current) {
      const currentHeading = mapInstanceRef.current.getHeading() || 0
      mapInstanceRef.current.setHeading((currentHeading - 45 + 360) % 360)
    }
  }

  const handleRotateRight = () => {
    if (mapInstanceRef.current) {
      const currentHeading = mapInstanceRef.current.getHeading() || 0
      mapInstanceRef.current.setHeading((currentHeading + 45) % 360)
    }
  }

  const handleResetRotation = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setHeading(90)
    }
  }

  if (mapError) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center p-6 text-center text-red-600">
        <svg className="mb-4 h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="font-semibold">{mapError}</p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-200 border-t-sky-500"></div>
        </div>
      )}

      <div className="relative h-full w-full overflow-hidden">
        <div 
          ref={mapRef} 
          className="h-full w-full" 
        />
        
        {/* Viñeteado suave */}
        <div 
          className="pointer-events-none absolute inset-0 z-5"
          style={{
            background:
              'radial-gradient(circle at center, transparent 55%, rgba(0,0,0,0.80) 100%)'
          }}
        />

        {/* Capa cálida suave (look de aventura) */}
        <div 
          className="pointer-events-none absolute inset-0 z-5"
          style={{
            background: '#c9a050',
            opacity: 0.22
          }}
        />
      </div>

      
    
      {/* Controles de Rotación 360 grados Flotantes */}
      {!loading && (
        <div className="absolute right-6 bottom-6 z-10 flex flex-col items-center gap-3">
          {/* Sub-botones desplegables de rotación */}
          {showRotationControls && (
            <div className="flex flex-col gap-3 transition-all duration-300 animate-in slide-in-from-bottom-2 fade-in">
              {/* Botón Girar Izquierda */}
              <button
                onClick={handleRotateLeft}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#a87f2a] bg-[#321e0f]/95 text-[#fcd34d] shadow-lg backdrop-blur-md transition-all hover:bg-[#4a2e18] active:scale-90"
                title="Girar Izquierda (45°)"
              >
                <i className="ri-anticlockwise-fill text-lg text-[#fcd34d]"></i>
              </button>

              {/* Botón Restablecer Orientación (Brújula) */}
              <button
                onClick={handleResetRotation}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#a87f2a] bg-[#321e0f]/95 text-[#fcd34d] shadow-lg backdrop-blur-md transition-all hover:bg-[#4a2e18] active:scale-90"
                title="Restablecer Brújula (90°)"
              >
                <i className="ri-compass-3-fill text-lg text-[#fcd34d]"></i>
              </button>

              {/* Botón Girar Derecha */}
              <button
                onClick={handleRotateRight}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#a87f2a] bg-[#321e0f]/95 text-[#fcd34d] shadow-lg backdrop-blur-md transition-all hover:bg-[#4a2e18] active:scale-90"
                title="Girar Derecha (45°)"
              >
                <i className="ri-clockwise-fill text-lg text-[#fcd34d]"></i>
              </button>
            </div>
          )}

          {/* Botón Maestro "360" (Brújula Interactiva) */}
          <button
            onClick={() => setShowRotationControls(!showRotationControls)}
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#a87f2a] shadow-2xl transition-all active:scale-90 bg-transparent p-0 overflow-hidden"
            title="Mostrar Controles 360"
          >
            <svg className="w-full h-full select-none" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Fondo y Anillo Dorado Externo Estático */}
              <circle cx="50" cy="50" r="45" stroke="#a87f2a" strokeWidth="2.5" fill="#22150c" />
              <circle cx="50" cy="50" r="41" stroke="#a87f2a" strokeDasharray="1, 3" strokeWidth="1" />
              
              {/* Rosa de los Vientos Giratoria que se alinea con el norte real del mapa */}
              <g style={{ transform: `rotate(${-heading}deg)`, transformOrigin: '50px 50px', transition: 'transform 0.15s ease-out' }}>
                {/* Puntas principales */}
                {/* Norte (N) */}
                <polygon points="50,50 50,15 46,50" fill="#fcd34d" />
                <polygon points="50,50 50,15 54,50" fill="#a87f2a" />
                {/* Sur (S) */}
                <polygon points="50,50 50,85 54,50" fill="#fcd34d" />
                <polygon points="50,50 50,85 46,50" fill="#a87f2a" />
                {/* Este (E) */}
                <polygon points="50,50 85,50 50,54" fill="#fcd34d" />
                <polygon points="50,50 85,50 50,46" fill="#a87f2a" />
                {/* Oeste (O) */}
                <polygon points="50,50 15,50 50,46" fill="#fcd34d" />
                <polygon points="50,50 15,50 50,54" fill="#a87f2a" />
                
                {/* Puntas secundarias */}
                <polygon points="50,50 25,25 29,25" fill="#d97706" />
                <polygon points="50,50 25,25 25,29" fill="#78350f" />
                
                <polygon points="50,50 75,25 75,29" fill="#d97706" />
                <polygon points="50,50 75,25 71,25" fill="#78350f" />
                
                <polygon points="50,50 75,75 71,75" fill="#d97706" />
                <polygon points="50,50 75,75 75,71" fill="#78350f" />
                
                <polygon points="50,50 25,75 25,71" fill="#d97706" />
                <polygon points="50,50 25,75 29,75" fill="#78350f" />
                
                {/* Centro */}
                <circle cx="50" cy="50" r="6" fill="#22150c" stroke="#a87f2a" strokeWidth="2" />
                <circle cx="50" cy="50" r="2.5" fill="#fcd34d" />
                
                {/* Letras cardinales en español (N, S, E, O) */}
                <text x="50" y="24" fill="#fcd34d" fontFamily="Georgia, serif" fontSize="8" fontWeight="bold" textAnchor="middle">N</text>
                <text x="50" y="82" fill="#fcd34d" fontFamily="Georgia, serif" fontSize="8" fontWeight="bold" textAnchor="middle">S</text>
                <text x="81" y="53" fill="#fcd34d" fontFamily="Georgia, serif" fontSize="8" fontWeight="bold" textAnchor="middle">E</text>
                <text x="19" y="53" fill="#fcd34d" fontFamily="Georgia, serif" fontSize="8" fontWeight="bold" textAnchor="middle">O</text>
              </g>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
