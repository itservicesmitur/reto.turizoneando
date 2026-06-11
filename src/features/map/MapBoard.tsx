import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
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

export interface RouteInfo {
  distanceKm: string
  durationMin: number
  travelMode: 'WALK' | 'DRIVE'
}

export interface MapBoardHandle {
  rotateLeft: () => void
  rotateRight: () => void
  resetRotation: () => void
  startNavigation: (destLat: number, destLng: number, onReady?: (info: RouteInfo) => void) => void
  clearNavigation: () => void
  focusOnUser: () => void
  returnToOrigin: () => void
  focusAerial: () => void
  setNavActive: (active: boolean) => void
  focusOnStage: (stageIdx: number) => void
  focusOnStop: (stopIndex: number) => void
}

// ── Helpers de navegación ─────────────────────────────────────
function haversineM(a: {lat:number,lng:number}, b: {lat:number,lng:number}): number {
  const R = 6371000
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const s = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1-s))
}

function ptSegDistM(p: {lat:number,lng:number}, a: {lat:number,lng:number}, b: {lat:number,lng:number}): number {
  const dx = b.lng - a.lng, dy = b.lat - a.lat
  const lenSq = dx*dx + dy*dy
  if (lenSq === 0) return haversineM(p, a)
  const t = Math.max(0, Math.min(1, ((p.lng-a.lng)*dx + (p.lat-a.lat)*dy) / lenSq))
  return haversineM(p, { lat: a.lat + t*dy, lng: a.lng + t*dx })
}

function computeLastMilePath(fromLat: number, fromLng: number, toLat: number, toLng: number, stopRatio = 0.80) {
  const endLat = fromLat + (toLat - fromLat) * stopRatio
  const endLng = fromLng + (toLng - fromLng) * stopRatio
  const dLat = endLat - fromLat
  const dLng = endLng - fromLng
  const curvature = 0.45
  const ctrlLat = (fromLat + endLat) / 2 + (-dLng * curvature)
  const ctrlLng = (fromLng + endLng) / 2 + (dLat * curvature)
  const pts: { lat: number; lng: number }[] = []
  for (let i = 0; i <= 16; i++) {
    const t = i / 16
    pts.push({
      lat: (1-t)*(1-t)*fromLat + 2*(1-t)*t*ctrlLat + t*t*endLat,
      lng: (1-t)*(1-t)*fromLng + 2*(1-t)*t*ctrlLng + t*t*endLng,
    })
  }
  return { path: pts, endLat, endLng }
}

function updateXStroke(map: any, lines: any[]) {
  const z = map.getZoom() ?? 17
  const w = z >= 20 ? 12 : z >= 19 ? 9 : z >= 18 ? 6 : z >= 17 ? 3 : 2
  lines.forEach((l: any) => l.setOptions({ strokeWeight: w }))
}

function createDotElement(nav = false): HTMLDivElement {
  const size = nav ? 26 : 18
  const inset = nav ? -8 : -6
  const dot = document.createElement('div')
  dot.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:#e8341a;border:3px solid #fff;box-shadow:0 2px 10px rgba(232,52,26,0.60);position:relative;`
  const ring = document.createElement('div')
  ring.style.cssText = `position:absolute;inset:${inset}px;border-radius:50%;background:rgba(232,52,26,0.25);animation:pulse-ring 1.6s ease-out infinite;`
  dot.appendChild(ring)
  return dot
}

function getRemainingRoute(pos: {lat:number,lng:number}, path: Array<{lat:number,lng:number}>): { remainingM: number, offRouteM: number } {
  let minDist = Infinity, closestIdx = 0
  for (let i = 0; i < path.length - 1; i++) {
    const d = ptSegDistM(pos, path[i], path[i+1])
    if (d < minDist) { minDist = d; closestIdx = i }
  }
  let remainingM = haversineM(pos, path[closestIdx + 1] ?? path[path.length - 1])
  for (let i = closestIdx + 1; i < path.length - 1; i++) remainingM += haversineM(path[i], path[i+1])
  return { remainingM, offRouteM: minDist }
}

interface MapBoardProps {
  onSelectMonument: (monumento: Monumento | null) => void
  selectedMonument: Monumento | null
  onLoadComplete?: () => void
  startIntroAnimation?: boolean
  onHeadingChange?: (heading: number) => void
  visibleStage?: number
  completedStops?: boolean[]
  onLockedStopClick?: (info: { stageIdx: number; isStageBlocked: boolean; availableStopName: string }) => void
}

function buildMarkerHTML(
  monumento: Pick<Monumento, 'imagen' | 'nombre'>,
  index: number,
  completedStops: boolean[]
): string {
  const stageIdx = Math.floor(index / 4)
  const stageStart = stageIdx * 4
  const indexWithinStage = index % 4
  const isCompleted = completedStops[index] ?? false
  const prevStagesDone = stageIdx === 0 ? true : completedStops.slice(0, stageStart).every(Boolean)
  const prevInStageDone = indexWithinStage === 0
    ? true
    : completedStops.slice(stageStart, index).every(Boolean)
  const isAvailable = !isCompleted && prevStagesDone && prevInStageDone

  let medallionStyle: string
  let labelStyle: string
  let innerBadge: string
  let outerBadge: string
  let labelText: string

  if (isCompleted) {
    medallionStyle = 'border-color:#fcd34d;box-shadow:0 0 18px rgba(252,211,77,0.7),0 8px 16px rgba(34,21,12,0.65),inset 0 2px 4px rgba(255,255,255,0.4);'
    labelStyle = 'border-color:#a87f2a;background-color:#22150c;color:#fcd34d;'
    innerBadge = `<div class="treasure-check-badge"><svg style="width:11px;height:11px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>`
    outerBadge = ''
    labelText = `✓ PARADA ${indexWithinStage + 1}`
  } else if (isAvailable) {
    medallionStyle = 'border-color:#fcd34d;box-shadow:0 0 14px rgba(252,211,77,0.55),0 8px 16px rgba(34,21,12,0.65),inset 0 2px 4px rgba(255,255,255,0.4);'
    labelStyle = 'border-color:#fcd34d;background-color:#321e0f;color:#fcd34d;'
    innerBadge = ''
    outerBadge = '<div class="treasure-pulse-ring"></div>'
    labelText = 'DISPONIBLE'
  } else {
    medallionStyle = 'filter:brightness(0.6);border-color:#6b4a20;'
    labelStyle = 'opacity:0.6;border-color:#6b4a20;'
    innerBadge = `<div class="treasure-lock-badge"><svg style="width:9px;height:9px;fill:currentColor;" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg></div>`
    outerBadge = ''
    labelText = `PARADA ${indexWithinStage + 1}`
  }

  return `
    <div style="position:relative;display:inline-flex;align-items:center;justify-content:center;">
      ${outerBadge}
      <div class="treasure-medallion" style="${medallionStyle}">
        <img src="${monumento.imagen}" alt="${monumento.nombre}" />
        ${innerBadge}
      </div>
    </div>
    <div class="treasure-label" style="${labelStyle}">${labelText}</div>
  `
}

let isGoogleMapsInitialized = false

const MapBoard = forwardRef<MapBoardHandle, MapBoardProps>(function MapBoard(
  { onSelectMonument, selectedMonument, onLoadComplete, startIntroAnimation, onHeadingChange, visibleStage, completedStops = [], onLockedStopClick },
  ref
) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const mapInstanceRef = useRef<any>(null)
  const onHeadingChangeRef = useRef(onHeadingChange)
  onHeadingChangeRef.current = onHeadingChange
  const monumentMarkersRef = useRef<Array<{ marker: any; stageIdx: number; markerDiv: HTMLElement; index: number; monumento: Monumento }>>([])
  const visibleStageRef = useRef<number>(visibleStage ?? 0)
  visibleStageRef.current = visibleStage ?? 0
  const completedStopsRef = useRef<boolean[]>(completedStops)
  completedStopsRef.current = completedStops
  const onLockedStopClickRef = useRef(onLockedStopClick)
  onLockedStopClickRef.current = onLockedStopClick
  const stageFirstPositionsRef = useRef<Array<{ lat: number; lng: number }>>([null!, null!, null!])
  const advancedMarkerClassRef = useRef<any>(null)
  const userLocationMarkerRef = useRef<any>(null)
  const watchIdRef = useRef<number | null>(null)
  const directionsRendererRef = useRef<any>(null)
  const routeBorderRef = useRef<any>(null)
  const navTokenRef = useRef(0)
  const lastKnownPositionRef = useRef<{ lat: number; lng: number } | null>(null)
  const navBearingRef = useRef<number>(90)
  const returnAnimFrameRef = useRef<number | null>(null)
  const introAnimFrameRef = useRef<number | null>(null)
  const introCompletedRef = useRef(false)
  const lastMileRef = useRef<any>(null)
  const lastMileXRef = useRef<any[]>([])
  const lastMileZoomListenerRef = useRef<any>(null)
  const navArrowModeRef = useRef(false)
  const destPositionRef = useRef<{ lat: number; lng: number } | null>(null)
  const routeBoundsRef = useRef<any>(null)
  const routePathRef = useRef<Array<{lat:number,lng:number}>>([])
  const travelModeRef = useRef<'WALK' | 'DRIVE'>('WALK')
  const lastRecalcTimeRef = useRef<number>(0)
  const navActiveRef = useRef<boolean>(false)
  const onRouteUpdateRef = useRef<((info: RouteInfo) => void) | null>(null)
  const speedSamplesRef = useRef<number[]>([])
  const isRecalcingRef = useRef<boolean>(false)
  const doRecalcRef = useRef<(() => void) | null>(null)

  // Función de recálculo de ruta (sin mover cámara)
  doRecalcRef.current = async () => {
    if (isRecalcingRef.current) return
    const pos = lastKnownPositionRef.current
    const dest = destPositionRef.current
    if (!pos || !dest || !mapInstanceRef.current) return
    isRecalcingRef.current = true
    lastRecalcTimeRef.current = Date.now()
    const token = ++navTokenRef.current
    const mode = travelModeRef.current
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    try {
      const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration',
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: pos.lat, longitude: pos.lng } } },
          destination: { location: { latLng: { latitude: dest.lat, longitude: dest.lng } } },
          travelMode: mode,
        }),
      })
      if (navTokenRef.current !== token) return
      const data = await response.json()
      const route = data.routes?.[0]
      const encoded = route?.polyline?.encodedPolyline
      if (!encoded) return
      const distanceM: number = route?.legs?.[0]?.distanceMeters ?? 0
      const durationStr: string = route?.legs?.[0]?.duration ?? '0s'
      const distanceKm = (distanceM / 1000).toFixed(1)
      const durationMin = Math.ceil(parseInt(durationStr.replace('s', ''), 10) / 60)
      const { encoding } = await importLibrary('geometry') as any
      const decodedPath = encoding.decodePath(encoded)
      if (navTokenRef.current !== token) return
      routePathRef.current = decodedPath.map((p: any) => ({ lat: p.lat(), lng: p.lng() }))
      if (routeBorderRef.current) { routeBorderRef.current.setMap(null); routeBorderRef.current = null }
      if (directionsRendererRef.current) { directionsRendererRef.current.setMap(null); directionsRendererRef.current = null }
      if (lastMileRef.current) { lastMileRef.current.setMap(null); lastMileRef.current = null }
      if (lastMileZoomListenerRef.current) { lastMileZoomListenerRef.current.remove(); lastMileZoomListenerRef.current = null }
      lastMileXRef.current.forEach((p: any) => p.setMap(null)); lastMileXRef.current = []
      const { Polyline } = await importLibrary('maps') as any
      const map = mapInstanceRef.current
      if (!map) return
      routeBorderRef.current = new Polyline({ path: decodedPath, map, strokeColor: '#ffffff', strokeWeight: 18, strokeOpacity: 1.0, zIndex: 9 })
      directionsRendererRef.current = new Polyline({ path: decodedPath, map, strokeColor: '#e8341a', strokeWeight: 13, strokeOpacity: 1.0, zIndex: 10 })
      const lastPtRecalc = decodedPath[decodedPath.length - 1]
      if (lastPtRecalc && dest) {
        const { path: lmPath, endLat: lmLat, endLng: lmLng } = computeLastMilePath(lastPtRecalc.lat(), lastPtRecalc.lng(), dest.lat, dest.lng)
        lastMileRef.current = new Polyline({
          path: lmPath, map, strokeOpacity: 0,
          icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3, strokeColor: '#c0392b', strokeWeight: 3 }, offset: '0', repeat: '10px' }],
          zIndex: 11,
        })
        const xS = 0.000015
        lastMileXRef.current = [
          new Polyline({ path: [{ lat: lmLat - xS, lng: lmLng - xS }, { lat: lmLat + xS, lng: lmLng + xS }], map, strokeColor: '#e8341a', strokeWeight: 5, strokeOpacity: 1, zIndex: 8 }),
          new Polyline({ path: [{ lat: lmLat - xS, lng: lmLng + xS }, { lat: lmLat + xS, lng: lmLng - xS }], map, strokeColor: '#e8341a', strokeWeight: 5, strokeOpacity: 1, zIndex: 8 }),
        ]
        if (lastMileZoomListenerRef.current) { lastMileZoomListenerRef.current.remove(); lastMileZoomListenerRef.current = null }
        updateXStroke(map, lastMileXRef.current)
        lastMileZoomListenerRef.current = map.addListener('zoom_changed', () => updateXStroke(map, lastMileXRef.current))
      }
      onRouteUpdateRef.current?.({ distanceKm, durationMin, travelMode: travelModeRef.current })
    } catch { /* silencioso */ } finally {
      isRecalcingRef.current = false
    }
  }

  // Ubicación en tiempo real
  useEffect(() => {
    if (loading) return
    if (!('geolocation' in navigator)) return

    const placeUserMarker = (lat: number, lng: number) => {
      if (!mapInstanceRef.current || !advancedMarkerClassRef.current) return
      if (!userLocationMarkerRef.current) {
        userLocationMarkerRef.current = new advancedMarkerClassRef.current({
          map: mapInstanceRef.current,
          position: { lat, lng },
          content: createDotElement(),
          title: 'Tu ubicación',
          zIndex: 999,
        })
        if (introCompletedRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat, lng })
        }
      } else {
        userLocationMarkerRef.current.position = { lat, lng }
      }
    }

    const onSuccess = (pos: GeolocationPosition) => {
      const { latitude: lat, longitude: lng, speed } = pos.coords
      lastKnownPositionRef.current = { lat, lng }
      placeUserMarker(lat, lng)

      // Detectar modo de viaje por velocidad
      if (speed != null) {
        speedSamplesRef.current = [...speedSamplesRef.current.slice(-3), speed]
        const avg = speedSamplesRef.current.reduce((a, b) => a + b, 0) / speedSamplesRef.current.length
        const newMode = avg >= 2.2 ? 'DRIVE' : 'WALK'
        if (newMode !== travelModeRef.current && navActiveRef.current) {
          travelModeRef.current = newMode
          doRecalcRef.current?.()
          return
        }
        travelModeRef.current = newMode
      }

      // Recálculo inteligente durante navegación activa
      if (!navActiveRef.current || routePathRef.current.length < 2) return
      const { remainingM, offRouteM } = getRemainingRoute({ lat, lng }, routePathRef.current)
      const elapsed = Date.now() - lastRecalcTimeRef.current
      if (offRouteM > 50 || elapsed > 4 * 60 * 1000) {
        doRecalcRef.current?.()
      } else {
        // Actualización local sin API
        const speedKmh = travelModeRef.current === 'DRIVE' ? 30 : 5
        const durationMin = Math.max(1, Math.ceil((remainingM / 1000) / speedKmh * 60))
        const distanceKm = (remainingM / 1000).toFixed(1)
        onRouteUpdateRef.current?.({ distanceKm, durationMin, travelMode: travelModeRef.current })
      }
    }

    let errorCount = 0
    const onError = () => {
      errorCount++
      if (errorCount >= 2 && watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
        // intento único de baja precisión como fallback
        navigator.geolocation.getCurrentPosition(onSuccess, () => {}, {
          enableHighAccuracy: false, maximumAge: 60000, timeout: 30000,
        })
      }
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      { enableHighAccuracy: false, maximumAge: 30000, timeout: 20000 }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.map = null
        userLocationMarkerRef.current = null
      }
    }
  }, [loading])

  // Secuencia de animación de introducción cinematográfica
  useEffect(() => {
    if (!startIntroAnimation || !mapInstanceRef.current) return
    const map = mapInstanceRef.current
    const mapDiv = mapRef.current

    map.setOptions({ gestureHandling: 'none' })

    const missionCenter = { lat: 18.477485383157326, lng: -69.88274578583231 }
    const dominicanRepublicBounds = { north: 19.93, south: 17.47, west: -72.01, east: -68.32 }

    const enableGestures = () => {
      introCompletedRef.current = true
      map.setOptions({
        gestureHandling: 'greedy',
        minZoom: 8,
        restriction: { latLngBounds: dominicanRepublicBounds, strictBounds: true }
      })
    }

    // Cancela la intro si el usuario toca el mapa antes de que termine
    const handleTouch = () => {
      if (introCompletedRef.current) return
      if (introAnimFrameRef.current !== null) {
        cancelAnimationFrame(introAnimFrameRef.current)
        introAnimFrameRef.current = null
      }
      map.moveCamera({ center: missionCenter, zoom: 18.8, tilt: 75, heading: 90 })
      enableGestures()
    }

    if (mapDiv) {
      mapDiv.addEventListener('touchstart', handleTouch, { passive: true })
      mapDiv.addEventListener('mousedown', handleTouch)
    }

    const steps = [
      {
        duration: 800,
        start: { zoom: 17.5, tilt: 65, heading: 0, lat: missionCenter.lat, lng: missionCenter.lng },
        end: { zoom: 17.5, tilt: 65, heading: 0, lat: missionCenter.lat, lng: missionCenter.lng },
        ease: (t: number) => t
      },
      {
        duration: 4000,
        start: { zoom: 17.5, tilt: 65, heading: 0, lat: missionCenter.lat, lng: missionCenter.lng },
        end: { zoom: 17.5, tilt: 65, heading: 360, lat: missionCenter.lat, lng: missionCenter.lng },
        ease: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      },
      {
        duration: 3000,
        start: { zoom: 17.5, tilt: 65, heading: 360, lat: missionCenter.lat, lng: missionCenter.lng },
        end: { zoom: 18.8, tilt: 75, heading: 450, lat: missionCenter.lat, lng: missionCenter.lng },
        ease: (t: number) => 1 - Math.pow(1 - t, 3)
      }
    ]

    const startTime = performance.now()

    const animateCamera = (now: number) => {
      const elapsed = now - startTime

      let currentElapsed = 0
      let activeStep: typeof steps[0] & { offset: number } | null = null

      for (const step of steps) {
        if (elapsed >= currentElapsed && elapsed < currentElapsed + step.duration) {
          activeStep = { ...step, offset: elapsed - currentElapsed }
          break
        }
        currentElapsed += step.duration
      }

      if (activeStep) {
        const t = activeStep.ease(activeStep.offset / activeStep.duration)
        map.moveCamera({
          center: {
            lat: activeStep.start.lat + (activeStep.end.lat - activeStep.start.lat) * t,
            lng: activeStep.start.lng + (activeStep.end.lng - activeStep.start.lng) * t,
          },
          zoom: activeStep.start.zoom + (activeStep.end.zoom - activeStep.start.zoom) * t,
          tilt: activeStep.start.tilt + (activeStep.end.tilt - activeStep.start.tilt) * t,
          heading: (activeStep.start.heading + (activeStep.end.heading - activeStep.start.heading) * t) % 360
        })
        introAnimFrameRef.current = requestAnimationFrame(animateCamera)
      } else {
        introAnimFrameRef.current = null
        if (lastKnownPositionRef.current) {
          map.panTo(lastKnownPositionRef.current)
        }
        map.moveCamera({ center: missionCenter, zoom: 18.8, tilt: 75, heading: 90 })
        enableGestures()
        if (mapDiv) {
          mapDiv.removeEventListener('touchstart', handleTouch)
          mapDiv.removeEventListener('mousedown', handleTouch)
        }
      }
    }

    requestAnimationFrame(animateCamera)

    return () => {
      if (introAnimFrameRef.current !== null) {
        cancelAnimationFrame(introAnimFrameRef.current)
        introAnimFrameRef.current = null
      }
      if (mapDiv) {
        mapDiv.removeEventListener('touchstart', handleTouch)
        mapDiv.removeEventListener('mousedown', handleTouch)
      }
    }
  }, [startIntroAnimation])

  // Mostrar solo los marcadores de la etapa activa
  useEffect(() => {
    if (monumentMarkersRef.current.length === 0) return
    const target = visibleStage ?? 0
    monumentMarkersRef.current.forEach(({ marker, stageIdx }) => {
      marker.map = stageIdx === target ? mapInstanceRef.current : null
    })
  }, [visibleStage])

  // Actualizar visuals de marcadores cuando cambia el progreso
  useEffect(() => {
    if (monumentMarkersRef.current.length === 0) return
    monumentMarkersRef.current.forEach(({ markerDiv, index, monumento }) => {
      markerDiv.innerHTML = buildMarkerHTML(monumento, index, completedStops)
    })
  }, [completedStops])

  // Centrar y hacer zoom suave al monumento seleccionado
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !selectedMonument) return
    const startCenter = map.getCenter()
    const startZoom = map.getZoom() as number
    const startTilt = map.getTilt() as number
    const startHeading = map.getHeading() as number
    const targetZoom = Math.max(startZoom, 17.5)
    const targetTilt = 67
    const duration = 900
    const startTime = performance.now()
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1)
      const e = easeOut(t)
      map.moveCamera({
        center: {
          lat: startCenter.lat() + (selectedMonument.lat - startCenter.lat()) * e,
          lng: startCenter.lng() + (selectedMonument.lng - startCenter.lng()) * e,
        },
        zoom: startZoom + (targetZoom - startZoom) * e,
        tilt: startTilt + (targetTilt - startTilt) * e,
        heading: startHeading,
      })
      if (t < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
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

          // Actualizar orientación de la brújula al girar el mapa
          map.addListener('heading_changed', () => {
            onHeadingChangeRef.current?.(map.getHeading() || 0)
          })

          mapInstanceRef.current = map
          advancedMarkerClassRef.current = AdvancedMarkerElement

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

            markerDiv.style.width = '120px'
            markerDiv.style.height = '95px'
            markerDiv.style.display = 'flex'
            markerDiv.style.flexDirection = 'column'
            markerDiv.style.alignItems = 'center'
            markerDiv.style.justifyContent = 'center'
            markerDiv.style.pointerEvents = 'auto'
            markerDiv.style.cursor = 'pointer'

            markerDiv.innerHTML = buildMarkerHTML(monumento, index, completedStopsRef.current)

            const stageIdx = Math.floor(index / 4)

            // Guardar posición del primer monumento de cada etapa para focusOnStage
            if (index % 4 === 0) {
              stageFirstPositionsRef.current[stageIdx] = { lat: monumento.lat, lng: monumento.lng }
            }

            // Manejador del click
            markerDiv.addEventListener('click', () => {
              if (introAnimFrameRef.current) {
                cancelAnimationFrame(introAnimFrameRef.current)
                introAnimFrameRef.current = null
                map.setOptions({
                  gestureHandling: 'greedy',
                  minZoom: 8,
                  restriction: {
                    latLngBounds: { north: 19.93, south: 17.47, west: -72.01, east: -68.32 },
                    strictBounds: true
                  }
                })
              }

              const current = completedStopsRef.current
              const stageStart = stageIdx * 4
              const indexWithinStage = index % 4
              const isCompleted = current[index] ?? false
              const prevStagesDone = stageIdx === 0 ? true : current.slice(0, stageStart).every(Boolean)
              const prevDone = indexWithinStage === 0 ? true : current.slice(stageStart, index).every(Boolean)
              const isAvailable = !isCompleted && prevStagesDone && prevDone

              if (isAvailable || isCompleted) {
                onSelectMonument(monumento)
              } else {
                // Determinar si la etapa completa está bloqueada
                const computeActiveStage = (done: boolean[]) => {
                  for (let s = 0; s < 3; s++) {
                    if (!done.slice(s * 4, s * 4 + 4).every(Boolean)) return s
                  }
                  return 2
                }
                const activeStage = computeActiveStage(current)
                const isStageBlocked = stageIdx !== activeStage

                // Buscar la parada disponible en la etapa activa
                let availableStopName = 'la parada disponible'
                const activeStart = activeStage * 4
                for (const item of monumentMarkersRef.current) {
                  if (item.stageIdx !== activeStage) continue
                  const iWithin = item.index % 4
                  const iPrevDone = iWithin === 0 ? true : current.slice(activeStart, item.index).every(Boolean)
                  if (!(current[item.index] ?? false) && iPrevDone) {
                    availableStopName = item.monumento.nombre
                    break
                  }
                }

                onLockedStopClickRef.current?.({ stageIdx, isStageBlocked, availableStopName })
              }
            })

            const markerEl = new AdvancedMarkerElement({
              map: stageIdx === visibleStageRef.current ? map : null,
              position: { lat: monumento.lat, lng: monumento.lng },
              title: monumento.nombre,
              content: markerDiv,
            })
            monumentMarkersRef.current.push({ marker: markerEl, stageIdx, markerDiv, index, monumento })
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

  useImperativeHandle(ref, () => ({
    rotateLeft: handleRotateLeft,
    rotateRight: handleRotateRight,
    resetRotation: handleResetRotation,
    clearNavigation: () => {
      navTokenRef.current++
      navActiveRef.current = false
      routePathRef.current = []
      onRouteUpdateRef.current = null
      if (returnAnimFrameRef.current) {
        cancelAnimationFrame(returnAnimFrameRef.current)
        returnAnimFrameRef.current = null
      }
      if (routeBorderRef.current) {
        routeBorderRef.current.setMap(null)
        routeBorderRef.current = null
      }
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
        directionsRendererRef.current = null
      }
      if (lastMileRef.current) {
        lastMileRef.current.setMap(null)
        lastMileRef.current = null
      }
      if (lastMileZoomListenerRef.current) { lastMileZoomListenerRef.current.remove(); lastMileZoomListenerRef.current = null }
      lastMileXRef.current.forEach((p: any) => p.setMap(null))
      lastMileXRef.current = []
      if (navArrowModeRef.current && userLocationMarkerRef.current) {
        navArrowModeRef.current = false
        userLocationMarkerRef.current.content = createDotElement()
      }
    },
    setNavActive: (active: boolean) => {
      navActiveRef.current = active
      if (active && mapInstanceRef.current) {
        if (introAnimFrameRef.current) {
          cancelAnimationFrame(introAnimFrameRef.current)
          introAnimFrameRef.current = null
        }
        mapInstanceRef.current.setOptions({
          gestureHandling: 'greedy',
          minZoom: 8,
        })
        if (userLocationMarkerRef.current) {
          navArrowModeRef.current = true
          userLocationMarkerRef.current.content = createDotElement(true)
        }
      }
    },
    startNavigation: async (destLat: number, destLng: number, onReady?: (info: RouteInfo) => void) => {
      if (!mapInstanceRef.current) return

      const token = ++navTokenRef.current
      if (returnAnimFrameRef.current) {
        cancelAnimationFrame(returnAnimFrameRef.current)
        returnAnimFrameRef.current = null
      }
      const pos = lastKnownPositionRef.current
      if (!pos) return

      destPositionRef.current = { lat: destLat, lng: destLng }
      const dy = destLat - pos.lat
      const dx = (destLng - pos.lng) * Math.cos((pos.lat * Math.PI) / 180)
      const bearingDeg = (Math.atan2(dx, dy) * (180 / Math.PI) + 360) % 360
      navBearingRef.current = bearingDeg

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

      try {
        const response = await fetch(
          'https://routes.googleapis.com/directions/v2:computeRoutes',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration',
            },
            body: JSON.stringify({
              origin: { location: { latLng: { latitude: pos.lat, longitude: pos.lng } } },
              destination: { location: { latLng: { latitude: destLat, longitude: destLng } } },
              travelMode: travelModeRef.current,
            }),
          }
        )

        if (navTokenRef.current !== token) return

        const data = await response.json()
        const route = data.routes?.[0]
        const encoded = route?.polyline?.encodedPolyline
        if (!encoded) return

        const distanceM: number = route?.legs?.[0]?.distanceMeters ?? 0
        const durationStr: string = route?.legs?.[0]?.duration ?? '0s'
        const durationSec = parseInt(durationStr.replace('s', ''), 10)
        const distanceKm = (distanceM / 1000).toFixed(1)
        const durationMin = Math.ceil(durationSec / 60)

        const { encoding } = await importLibrary('geometry') as any
        const path = encoding.decodePath(encoded)

        if (navTokenRef.current !== token) return

        // Limpiar rutas previas
        if (routeBorderRef.current) { routeBorderRef.current.setMap(null); routeBorderRef.current = null }
        if (directionsRendererRef.current) { directionsRendererRef.current.setMap(null); directionsRendererRef.current = null }
        if (lastMileRef.current) { lastMileRef.current.setMap(null); lastMileRef.current = null }
        if (lastMileZoomListenerRef.current) { lastMileZoomListenerRef.current.remove(); lastMileZoomListenerRef.current = null }
        lastMileXRef.current.forEach((p: any) => p.setMap(null)); lastMileXRef.current = []

        const { Polyline } = await importLibrary('maps') as any
        const map = mapInstanceRef.current

        // Borde blanco (da definición a la línea)
        routeBorderRef.current = new Polyline({
          path, map,
          strokeColor: '#ffffff',
          strokeWeight: 18,
          strokeOpacity: 1.0,
          zIndex: 9,
        })

        // Línea roja principal
        directionsRendererRef.current = new Polyline({
          path, map,
          strokeColor: '#e8341a',
          strokeWeight: 13,
          strokeOpacity: 1.0,
          zIndex: 10,
        })

        // Tramo punteado final: del último punto de la ruta al pin exacto
        const lastPt = path[path.length - 1]
        if (lastPt) {
          const { path: lmPath, endLat: lmLat, endLng: lmLng } = computeLastMilePath(lastPt.lat(), lastPt.lng(), destLat, destLng)
          lastMileRef.current = new Polyline({
            path: lmPath, map, strokeOpacity: 0,
            icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3, strokeColor: '#c0392b', strokeWeight: 3 }, offset: '0', repeat: '10px' }],
            zIndex: 11,
          })
          const xS = 0.000015
          lastMileXRef.current = [
            new Polyline({ path: [{ lat: lmLat - xS, lng: lmLng - xS }, { lat: lmLat + xS, lng: lmLng + xS }], map, strokeColor: '#e8341a', strokeWeight: 5, strokeOpacity: 1, zIndex: 8 }),
            new Polyline({ path: [{ lat: lmLat - xS, lng: lmLng + xS }, { lat: lmLat + xS, lng: lmLng - xS }], map, strokeColor: '#e8341a', strokeWeight: 5, strokeOpacity: 1, zIndex: 8 }),
          ]
          if (lastMileZoomListenerRef.current) { lastMileZoomListenerRef.current.remove(); lastMileZoomListenerRef.current = null }
          updateXStroke(map, lastMileXRef.current)
          lastMileZoomListenerRef.current = map.addListener('zoom_changed', () => updateXStroke(map, lastMileXRef.current))
        }

        // Guardar para recálculo inteligente
        routePathRef.current = path.map((p: any) => ({ lat: p.lat(), lng: p.lng() }))
        onRouteUpdateRef.current = onReady ?? null
        lastRecalcTimeRef.current = Date.now()

        onReady?.({ distanceKm, durationMin, travelMode: travelModeRef.current })

        // Mostrar toda la ruta al usuario; la cámara queda aquí hasta que presione INICIAR
        const bounds = new (window as any).google.maps.LatLngBounds()
        path.forEach((p: any) => bounds.extend(p))
        routeBoundsRef.current = bounds
        map.fitBounds(bounds, { top: 80, bottom: 220, left: 60, right: 60 })

      } catch (err) {
        console.warn('Error al trazar ruta:', err)
      }
    },
    focusOnUser: () => {
      const map = mapInstanceRef.current
      const pos = lastKnownPositionRef.current
      if (!map || !pos) return
      if (returnAnimFrameRef.current) cancelAnimationFrame(returnAnimFrameRef.current)
      const startCenter = map.getCenter()
      const startZoom = map.getZoom() as number
      const startTilt = map.getTilt() as number
      const startHeading = map.getHeading() as number
      const targetHeading = navBearingRef.current
      const duration = 1200
      const startTime = performance.now()
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
      const animate = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1)
        const e = easeOut(t)
        map.moveCamera({
          center: {
            lat: startCenter.lat() + (pos.lat - startCenter.lat()) * e,
            lng: startCenter.lng() + (pos.lng - startCenter.lng()) * e,
          },
          zoom: startZoom + (18 - startZoom) * e,
          tilt: startTilt + (65 - startTilt) * e,
          heading: startHeading + (targetHeading - startHeading) * e,
        })
        if (t < 1) {
          returnAnimFrameRef.current = requestAnimationFrame(animate)
        } else {
          returnAnimFrameRef.current = null
        }
      }
      returnAnimFrameRef.current = requestAnimationFrame(animate)
    },
    returnToOrigin: () => {
      const map = mapInstanceRef.current
      if (!map) return
      const missionCenter = { lat: 18.477485383157326, lng: -69.88274578583231 }
      const startCenter = map.getCenter()
      const startZoom = map.getZoom() as number
      const startTilt = map.getTilt() as number
      const startHeading = map.getHeading() as number
      const targetZoom = 18.8
      const targetTilt = 75
      const targetHeading = 90
      const duration = 1400
      const startTime = performance.now()
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
      if (returnAnimFrameRef.current) cancelAnimationFrame(returnAnimFrameRef.current)
      const animate = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1)
        const e = easeOut(t)
        map.moveCamera({
          center: {
            lat: startCenter.lat() + (missionCenter.lat - startCenter.lat()) * e,
            lng: startCenter.lng() + (missionCenter.lng - startCenter.lng()) * e,
          },
          zoom: startZoom + (targetZoom - startZoom) * e,
          tilt: startTilt + (targetTilt - startTilt) * e,
          heading: startHeading + (targetHeading - startHeading) * e,
        })
        if (t < 1) {
          returnAnimFrameRef.current = requestAnimationFrame(animate)
        } else {
          returnAnimFrameRef.current = null
        }
      }
      returnAnimFrameRef.current = requestAnimationFrame(animate)
    },
    focusAerial: () => {
      const map = mapInstanceRef.current
      if (!map) return
      if (returnAnimFrameRef.current) {
        cancelAnimationFrame(returnAnimFrameRef.current)
        returnAnimFrameRef.current = null
      }
      if (routeBoundsRef.current) {
        map.fitBounds(routeBoundsRef.current, { top: 80, bottom: 120, left: 60, right: 60 })
      }
    },
    focusOnStage: (stageIdx: number) => {
      const map = mapInstanceRef.current
      if (!map) return
      const pos = stageFirstPositionsRef.current[stageIdx]
      if (!pos) return
      const startCenter = map.getCenter()
      const startZoom = map.getZoom() as number
      const startTilt = map.getTilt() as number
      const startHeading = map.getHeading() as number
      const duration = 900
      const startTime = performance.now()
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
      const animate = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1)
        const e = easeOut(t)
        map.moveCamera({
          center: {
            lat: startCenter.lat() + (pos.lat - startCenter.lat()) * e,
            lng: startCenter.lng() + (pos.lng - startCenter.lng()) * e,
          },
          zoom: startZoom + (18.5 - startZoom) * e,
          tilt: startTilt + (65 - startTilt) * e,
          heading: startHeading,
        })
        if (t < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    },
    focusOnStop: (stopIndex: number) => {
      const map = mapInstanceRef.current
      if (!map) return
      const entry = monumentMarkersRef.current.find(m => m.index === stopIndex)
      if (!entry) return
      const pos = { lat: entry.monumento.lat, lng: entry.monumento.lng }
      const startCenter = map.getCenter()
      const startZoom = map.getZoom() as number
      const startTilt = map.getTilt() as number
      const startHeading = map.getHeading() as number
      const duration = 900
      const startTime = performance.now()
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
      const animate = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1)
        const e = easeOut(t)
        map.moveCamera({
          center: {
            lat: startCenter.lat() + (pos.lat - startCenter.lat()) * e,
            lng: startCenter.lng() + (pos.lng - startCenter.lng()) * e,
          },
          zoom: startZoom + (18.5 - startZoom) * e,
          tilt: startTilt + (65 - startTilt) * e,
          heading: startHeading,
        })
        if (t < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    },
  }))

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

      
    
    </div>
  )
})

export default MapBoard
