import { useEffect, useRef, useState, useImperativeHandle, forwardRef, memo } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import { useTranslation } from 'react-i18next'

import type { Monumento, RouteInfo, MapBoardHandle } from './types/map.types'
import { COLONIAL_ZONE_COORDS } from './data/monumentsData'
import { computeLastMilePath, getRemainingRoute } from './utils/geo'
import { updateXStroke, createDotElement, buildMarkerHTML, getStopState, getMarkerContainerWidth, getMarkerZIndex } from './utils/mapHelpers'

export type { RouteInfo, MapBoardHandle }

declare global {
  namespace google {
    namespace maps {
      type Map = any
      type Polygon = any
      type Polyline = any
    }
  }
}

interface MapBoardProps {
  monuments: Monumento[]
  onSelectMonument: (monumento: Monumento | null) => void
  selectedMonument: Monumento | null
  onLoadComplete?: () => void
  startIntroAnimation?: boolean
  onHeadingChange?: (heading: number) => void
  visibleStage?: number
  completedStops?: boolean[]
  onLockedStopClick?: (info: { stageIdx: number; isStageBlocked: boolean; availableStopName: string }) => void
  stageGroups?: number[][]
  introTarget?: { lat: number; lng: number }
  hiddenStopIds?: string[]
}

let isGoogleMapsInitialized = false

const MapBoard = memo(forwardRef<MapBoardHandle, MapBoardProps>(function MapBoard(
  { monuments, onSelectMonument, selectedMonument, onLoadComplete, startIntroAnimation, onHeadingChange, visibleStage, completedStops = [], onLockedStopClick, stageGroups = [], introTarget, hiddenStopIds = [] },
  ref
) {
  const { t } = useTranslation()
  const tRef = useRef(t)
  tRef.current = t
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
  const stageGroupsRef = useRef<number[][]>(stageGroups)
  stageGroupsRef.current = stageGroups
  const stageFirstPositionsRef = useRef<Array<{ lat: number; lng: number }>>([]);
  const monumentsRef = useRef<Monumento[]>(monuments)
  const advancedMarkerClassRef = useRef<any>(null)
  const userLocationMarkerRef = useRef<any>(null)
  const watchIdRef = useRef<number | null>(null)
  const restartGeoWatchRef = useRef<() => void>(() => {})
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
  const routePathRef = useRef<Array<{ lat: number; lng: number }>>([])
  const travelModeRef = useRef<'WALK' | 'DRIVE'>('WALK')
  const lastRecalcTimeRef = useRef<number>(0)
  const navActiveRef = useRef<boolean>(false)
  const onRouteUpdateRef = useRef<((info: RouteInfo) => void) | null>(null)
  const speedSamplesRef = useRef<number[]>([])
  const isRecalcingRef = useRef<boolean>(false)
  const doRecalcRef = useRef<(() => void) | null>(null)
  // Navegación heading-up
  const prevNavPosRef = useRef<{ lat: number; lng: number } | null>(null)
  const smoothedNavHeadingRef = useRef<number>(90)
  const lastNearestIdxRef = useRef<number>(0)
  const lastGpsProcTimeRef = useRef<number>(0)
  const lastGpsProcPosRef = useRef<{ lat: number; lng: number } | null>(null)

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
          computeAlternativeRoutes: true,
          ...(mode === 'DRIVE' && { routingPreference: 'TRAFFIC_AWARE_OPTIMAL' }),
        }),
      })
      if (navTokenRef.current !== token) return
      const data = await response.json()
      const routes: any[] = data.routes ?? []
      const totalDist = (r: any) => (r?.legs ?? []).reduce((s: number, l: any) => s + (l.distanceMeters ?? 0), 0)
      const route = routes.reduce((best: any, r: any) => totalDist(r) < totalDist(best) ? r : best, routes[0])
      const encoded = route?.polyline?.encodedPolyline
      if (!encoded) return
      const distanceM: number = totalDist(route)
      const durationStr: string = route?.legs?.[0]?.duration ?? '0s'
      const distanceKm = (distanceM / 1000).toFixed(1)
      const durationMin = Math.ceil(parseInt(durationStr.replace('s', ''), 10) / 60)
      const { encoding } = await importLibrary('geometry') as any
      const decodedPath = encoding.decodePath(encoded)
      if (navTokenRef.current !== token) return
      routePathRef.current = decodedPath.map((p: any) => ({ lat: p.lat(), lng: p.lng() }))
      lastNearestIdxRef.current = 0
      prevNavPosRef.current = null
      if (routeBorderRef.current) { routeBorderRef.current.setMap(null); routeBorderRef.current = null }
      if (directionsRendererRef.current) { directionsRendererRef.current.setMap(null); directionsRendererRef.current = null }
      if (lastMileRef.current) { lastMileRef.current.setMap(null); lastMileRef.current = null }
      if (lastMileZoomListenerRef.current) { lastMileZoomListenerRef.current.remove(); lastMileZoomListenerRef.current = null }
      lastMileXRef.current.forEach((p: any) => p.setMap(null)); lastMileXRef.current = []
      const { Polyline } = await importLibrary('maps') as any
      const map = mapInstanceRef.current
      if (!map) return
      routeBorderRef.current = new Polyline({ path: decodedPath, map, strokeColor: '#ffffff', strokeWeight: 18, strokeOpacity: 1.0, zIndex: 9 })
      directionsRendererRef.current = new Polyline({ path: decodedPath, map, strokeColor: '#ff9447', strokeWeight: 13, strokeOpacity: 1.0, zIndex: 10 })
      const lastPtRecalc = decodedPath[decodedPath.length - 1]
      if (lastPtRecalc && dest) {
        const { path: lmPath, endLat: lmLat, endLng: lmLng } = computeLastMilePath(lastPtRecalc.lat(), lastPtRecalc.lng(), dest.lat, dest.lng)
        lastMileRef.current = new Polyline({
          path: lmPath, map, strokeOpacity: 0,
          icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3, strokeColor: '#ff9447', strokeWeight: 3 }, offset: '0', repeat: '10px' }],
          zIndex: 11,
        })
        const xS = 0.000015
        lastMileXRef.current = [
          new Polyline({ path: [{ lat: lmLat - xS, lng: lmLng - xS }, { lat: lmLat + xS, lng: lmLng + xS }], map, strokeColor: '#ff9447', strokeWeight: 5, strokeOpacity: 1, zIndex: 8 }),
          new Polyline({ path: [{ lat: lmLat - xS, lng: lmLng + xS }, { lat: lmLat + xS, lng: lmLng - xS }], map, strokeColor: '#ff9447', strokeWeight: 5, strokeOpacity: 1, zIndex: 8 }),
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
      const { latitude: lat, longitude: lng, speed, heading: gpsHeading } = pos.coords

      // Throttle: ignorar updates más rápidos de 500ms que muevan menos de 2m
      const nowGps = Date.now()
      const timeSinceGps = nowGps - lastGpsProcTimeRef.current
      if (timeSinceGps < 200 && lastGpsProcPosRef.current) {
        const dlat = lat - lastGpsProcPosRef.current.lat
        const dlng = (lng - lastGpsProcPosRef.current.lng) * Math.cos(lat * Math.PI / 180)
        if (Math.sqrt(dlat * dlat + dlng * dlng) * 111139 < 1) return
      }
      lastGpsProcTimeRef.current = nowGps
      lastGpsProcPosRef.current = { lat, lng }

      lastKnownPositionRef.current = { lat, lng }
      placeUserMarker(lat, lng)

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

      // ── Heading-up camera + ruta que se acorta ──────────────────────
      if (navActiveRef.current) {
        // 1. Calcular heading: usar GPS directo si está disponible y hay movimiento,
        //    sino calcular desde la diferencia de posición anterior
        let rawBearing = smoothedNavHeadingRef.current
        if (gpsHeading != null && (speed ?? 0) > 0.5) {
          rawBearing = gpsHeading
        } else if (prevNavPosRef.current) {
          const prev = prevNavPosRef.current
          const dy = lat - prev.lat
          const dx = (lng - prev.lng) * Math.cos((lat * Math.PI) / 180)
          const distM = Math.sqrt(dy * dy + dx * dx) * 111139
          if (distM > 3) {
            rawBearing = (Math.atan2(dx, dy) * (180 / Math.PI) + 360) % 360
          }
        }
        prevNavPosRef.current = { lat, lng }

        // Suavizado exponencial con manejo de wraparound 0/360
        let hdiff = rawBearing - smoothedNavHeadingRef.current
        while (hdiff > 180) hdiff -= 360
        while (hdiff < -180) hdiff += 360
        smoothedNavHeadingRef.current = (smoothedNavHeadingRef.current + hdiff * 0.35 + 360) % 360
        navBearingRef.current = smoothedNavHeadingRef.current

        // 2. Recortar la polilínea desde la posición actual hacia adelante
        const path = routePathRef.current
        if (path.length > 1) {
          // Búsqueda local restringida para evitar saltos abruptos (GPS jitter)
          const isFirstSearch = lastNearestIdxRef.current === 0 && prevNavPosRef.current === null
          const searchFrom = isFirstSearch ? 0 : Math.max(0, lastNearestIdxRef.current - 3)
          const searchTo = isFirstSearch ? path.length - 1 : Math.min(path.length - 1, lastNearestIdxRef.current + 6)

          let minDist = Infinity
          let nearestIdx = lastNearestIdxRef.current
          for (let i = searchFrom; i <= searchTo; i++) {
            const dlat = path[i].lat - lat
            const dlng = (path[i].lng - lng) * Math.cos(lat * Math.PI / 180)
            const d = dlat * dlat + dlng * dlng
            if (d < minDist) { minDist = d; nearestIdx = i }
          }
          lastNearestIdxRef.current = nearestIdx
          const remaining = [{ lat, lng }, ...path.slice(lastNearestIdxRef.current + 1)]
          if (remaining.length > 1) {
            routeBorderRef.current?.setPath(remaining)
            directionsRendererRef.current?.setPath(remaining)
          }
        }
      }
      // ────────────────────────────────────────────────────────────────

      if (!navActiveRef.current || routePathRef.current.length < 2) return
      const { remainingM, offRouteM } = getRemainingRoute({ lat, lng }, routePathRef.current)
      const elapsed = Date.now() - lastRecalcTimeRef.current
      if (offRouteM > 50 || elapsed > 4 * 60 * 1000) {
        doRecalcRef.current?.()
      } else {
        const speedKmh = travelModeRef.current === 'DRIVE' ? 30 : 5
        const durationMin = Math.max(1, Math.ceil((remainingM / 1000) / speedKmh * 60))
        const distanceKm = (remainingM / 1000).toFixed(1)
        onRouteUpdateRef.current?.({ distanceKm, durationMin, travelMode: travelModeRef.current })
      }
    }

    const geoOpts = { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 } as const

    let fatalErrorCount = 0
    const onError = (err: GeolocationPositionError) => {
      // PERMISSION_DENIED (1) → fallo definitivo
      if (err.code === 1) {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current)
          watchIdRef.current = null
        }
        return
      }
      // POSITION_UNAVAILABLE (2) = kCLErrorLocationUnknown en iOS → transitorio, ignorar
      if (err.code === 2) return
      // TIMEOUT (3) → contar solo estos como fallos reales
      fatalErrorCount++
      if (fatalErrorCount >= 3 && watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            onSuccess(pos)
            fatalErrorCount = 0
            watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, geoOpts)
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
        )
      }
    }

    restartGeoWatchRef.current = () => {
      if (watchIdRef.current !== null) return
      fatalErrorCount = 0
      watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, geoOpts)
    }

    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, geoOpts)

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

  // Animación de introducción cinematográfica
  useEffect(() => {
    if (!startIntroAnimation || !mapInstanceRef.current) return
    const map = mapInstanceRef.current
    const mapDiv = mapRef.current
    const isVector = () => (map as any).get?.('renderingType') === 'VECTOR'

    map.setOptions({ gestureHandling: 'none' })

    const dominicanRepublicBounds = { north: 19.93, south: 17.47, west: -72.01, east: -68.32 }
    const missionCenter = introTarget ?? { lat: 18.477485383157326, lng: -69.88274578583231 }

    const enableGestures = () => {
      introCompletedRef.current = true
      map.setOptions({
        gestureHandling: 'greedy',
        minZoom: 8,
        restriction: { latLngBounds: dominicanRepublicBounds, strictBounds: true },
      })
    }

    const handleTouch = () => {
      if (introCompletedRef.current) return
      if (introAnimFrameRef.current !== null) {
        cancelAnimationFrame(introAnimFrameRef.current)
        introAnimFrameRef.current = null
      }
      const v = isVector()
      map.moveCamera({ center: missionCenter, zoom: 18.8, ...(v && { tilt: 75, heading: 90 }) })
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
        ease: (t: number) => t,
      },
      {
        duration: 4000,
        start: { zoom: 17.5, tilt: 65, heading: 0, lat: missionCenter.lat, lng: missionCenter.lng },
        end: { zoom: 17.5, tilt: 65, heading: 360, lat: missionCenter.lat, lng: missionCenter.lng },
        ease: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
      },
      {
        duration: 3000,
        start: { zoom: 17.5, tilt: 65, heading: 360, lat: missionCenter.lat, lng: missionCenter.lng },
        end: { zoom: 18.8, tilt: 75, heading: 450, lat: missionCenter.lat, lng: missionCenter.lng },
        ease: (t: number) => 1 - Math.pow(1 - t, 3),
      },
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
        const v = isVector()
        map.moveCamera({
          center: {
            lat: activeStep.start.lat + (activeStep.end.lat - activeStep.start.lat) * t,
            lng: activeStep.start.lng + (activeStep.end.lng - activeStep.start.lng) * t,
          },
          zoom: activeStep.start.zoom + (activeStep.end.zoom - activeStep.start.zoom) * t,
          ...(v && {
            tilt: activeStep.start.tilt + (activeStep.end.tilt - activeStep.start.tilt) * t,
            heading: (activeStep.start.heading + (activeStep.end.heading - activeStep.start.heading) * t) % 360,
          }),
        })
        introAnimFrameRef.current = requestAnimationFrame(animateCamera)
      } else {
        introAnimFrameRef.current = null
        if (lastKnownPositionRef.current) map.panTo(lastKnownPositionRef.current)
        const v = isVector()
        map.moveCamera({ center: missionCenter, zoom: 18.8, ...(v && { tilt: 75, heading: 90 }) })
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

  // Actualizar visuals de marcadores cuando cambia el progreso o el idioma
  useEffect(() => {
    if (monumentMarkersRef.current.length === 0) return
    monumentMarkersRef.current.forEach(({ marker, markerDiv, index, monumento }) => {
      const state = getStopState(index, completedStops, stageGroups)
      markerDiv.className = `treasure-pin-container pin-${state}`
      markerDiv.innerHTML = buildMarkerHTML(monumento, index, completedStops, stageGroups, t)
      markerDiv.style.width = getMarkerContainerWidth(state)
      marker.zIndex = getMarkerZIndex(state)
    })
  }, [completedStops, stageGroups, t])

  // Ocultar inmediatamente marcadores de paradas desactivadas en tiempo real
  useEffect(() => {
    if (monumentMarkersRef.current.length === 0) return
    const hiddenSet = new Set(hiddenStopIds)
    monumentMarkersRef.current.forEach(({ marker, monumento, stageIdx }) => {
      if (hiddenSet.size > 0 && monumento.stopId && hiddenSet.has(monumento.stopId)) {
        marker.map = null
      } else {
        marker.map = stageIdx === visibleStageRef.current ? mapInstanceRef.current : null
      }
    })
  }, [hiddenStopIds])

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
    const isVector = () => (map as any).get?.('renderingType') === 'VECTOR'
    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1)
      const e = easeOut(t)
      const v = isVector()
      map.moveCamera({
        center: {
          lat: startCenter.lat() + (selectedMonument.lat - startCenter.lat()) * e,
          lng: startCenter.lng() + (selectedMonument.lng - startCenter.lng()) * e,
        },
        zoom: startZoom + (targetZoom - startZoom) * e,
        ...(v && {
          tilt: startTilt + (targetTilt - startTilt) * e,
          heading: startHeading,
        }),
      })
      if (t < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [selectedMonument])

  // Inicialización del mapa
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID

    let headingListener: any = null

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
        setOptions({ key: apiKey, v: 'weekly' })
        isGoogleMapsInitialized = true
      }

      Promise.all([importLibrary('maps'), importLibrary('marker')])
        .then(([{ Map, Polygon, Polyline }, { AdvancedMarkerElement }]) => {
          if (!mapRef.current) return

          const center = { lat: 18.477485383157326, lng: -69.88274578583231 }

          const map = new Map(mapRef.current, {
            center,
            zoom: 11,
            minZoom: 11,
            maxZoom: 21,
            tilt: 65,
            heading: 0,
            mapId: mapId || undefined,
            disableDefaultUI: true,
            gestureHandling: 'none',
          })

          headingListener = map.addListener('heading_changed', () => {
            onHeadingChangeRef.current?.(map.getHeading() || 0)
          })

          mapInstanceRef.current = map
          advancedMarkerClassRef.current = AdvancedMarkerElement

          new Polygon({
            paths: COLONIAL_ZONE_COORDS,
            strokeOpacity: 0,
            fillColor: '#ef4444',
            fillOpacity: 0.04,
            map,
          })

          new Polyline({
            path: COLONIAL_ZONE_COORDS,
            strokeOpacity: 0,
            icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 2 }, offset: '0', repeat: '10px' }],
            strokeColor: '#ff9447',
            strokeWeight: 2,
            map,
          })

          monumentsRef.current.forEach((monumento, index) => {
            const markerDiv = document.createElement('div')
            markerDiv.className = 'treasure-pin-container'
            const initState = getStopState(index, completedStopsRef.current, stageGroupsRef.current)
            markerDiv.className = `treasure-pin-container pin-${initState}`
            markerDiv.style.cssText = `width:${getMarkerContainerWidth(initState)};height:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:auto;cursor:pointer;`
            markerDiv.innerHTML = buildMarkerHTML(monumento, index, completedStopsRef.current, stageGroupsRef.current, tRef.current)

            const gs = stageGroupsRef.current
            const stageIdx = gs.length > 0
              ? gs.findIndex(g => g.includes(index))
              : Math.floor(index / 4)

            const isFirstInStage = gs.length > 0 ? gs[stageIdx]?.[0] === index : index % 4 === 0
            if (isFirstInStage) {
              stageFirstPositionsRef.current[stageIdx] = { lat: monumento.lat, lng: monumento.lng }
            }

            markerDiv.addEventListener('click', () => {
              if (introAnimFrameRef.current) {
                cancelAnimationFrame(introAnimFrameRef.current)
                introAnimFrameRef.current = null
                map.setOptions({
                  gestureHandling: 'greedy',
                  minZoom: 8,
                  restriction: { latLngBounds: { north: 19.93, south: 17.47, west: -72.01, east: -68.32 }, strictBounds: true },
                })
              }

              const current = completedStopsRef.current
              const gsCurrent = stageGroupsRef.current
              const isCompleted = current[index] ?? false
              const prevStagesDone = stageIdx === 0 ? true
                : gsCurrent.length > 0
                  ? gsCurrent.slice(0, stageIdx).every(g => g.every(i => current[i]))
                  : current.slice(0, stageIdx * 4).every(Boolean)
              let activeStage: number
              if (gsCurrent.length > 0) {
                activeStage = gsCurrent.length - 1
                for (let s = 0; s < gsCurrent.length; s++) {
                  if (!gsCurrent[s].every(i => current[i])) { activeStage = s; break }
                }
              } else {
                activeStage = 2
                for (let s = 0; s < 3; s++) {
                  if (!current.slice(s * 4, s * 4 + 4).every(Boolean)) { activeStage = s; break }
                }
              }
              // Check sequential order within the stage
              const stageGroup = gsCurrent[stageIdx] ?? []
              const posInStage = stageGroup.indexOf(index)
              const prevStopsInStageDone = posInStage <= 0
                || stageGroup.slice(0, posInStage).every(i => current[i])

              const isAvailable = !isCompleted && prevStagesDone && stageIdx === activeStage && prevStopsInStageDone

              if (isAvailable || isCompleted) {
                onSelectMonument(monumento)
              } else if (!prevStagesDone || stageIdx !== activeStage) {
                onLockedStopClickRef.current?.({ stageIdx, isStageBlocked: true, availableStopName: '' })
              } else {
                // Stop is in active stage but previous stop not done yet
                const firstIncompleteIdx = stageGroup.find(i => !current[i])
                const firstIncompleteName = firstIncompleteIdx !== undefined
                  ? (monumentsRef.current[firstIncompleteIdx]?.nombre ?? '')
                  : ''
                onLockedStopClickRef.current?.({ stageIdx, isStageBlocked: false, availableStopName: firstIncompleteName })
              }
            })

            const markerEl = new AdvancedMarkerElement({
              map: stageIdx === visibleStageRef.current ? map : null,
              position: { lat: monumento.lat, lng: monumento.lng },
              title: monumento.nombre,
              content: markerDiv,
              zIndex: getMarkerZIndex(initState),
            })
            monumentMarkersRef.current.push({ marker: markerEl, stageIdx, markerDiv, index, monumento })
          })

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
      if (headingListener) headingListener.remove()

      monumentMarkersRef.current.forEach(({ marker }) => {
        if (marker) marker.map = null
      })
      monumentMarkersRef.current = []

      if (routeBorderRef.current) { routeBorderRef.current.setMap(null); routeBorderRef.current = null }
      if (directionsRendererRef.current) { directionsRendererRef.current.setMap(null); directionsRendererRef.current = null }
      if (lastMileRef.current) { lastMileRef.current.setMap(null); lastMileRef.current = null }
      if (lastMileZoomListenerRef.current) { lastMileZoomListenerRef.current.remove(); lastMileZoomListenerRef.current = null }
      lastMileXRef.current.forEach((p: any) => p.setMap(null)); lastMileXRef.current = []
    }
  }, [onSelectMonument])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mapInstanceRef.current) {
        ;(window as any).google?.maps?.event?.trigger(mapInstanceRef.current, 'resize')
        restartGeoWatchRef.current()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const handleRotateLeft = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setHeading((mapInstanceRef.current.getHeading() - 45 + 360) % 360)
    }
  }

  const handleRotateRight = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setHeading((mapInstanceRef.current.getHeading() + 45) % 360)
    }
  }

  const handleResetRotation = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.setHeading(90)
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
      lastNearestIdxRef.current = 0
      prevNavPosRef.current = null
      if (returnAnimFrameRef.current) { cancelAnimationFrame(returnAnimFrameRef.current); returnAnimFrameRef.current = null }
      if (routeBorderRef.current) { routeBorderRef.current.setMap(null); routeBorderRef.current = null }
      if (directionsRendererRef.current) { directionsRendererRef.current.setMap(null); directionsRendererRef.current = null }
      if (lastMileRef.current) { lastMileRef.current.setMap(null); lastMileRef.current = null }
      if (lastMileZoomListenerRef.current) { lastMileZoomListenerRef.current.remove(); lastMileZoomListenerRef.current = null }
      lastMileXRef.current.forEach((p: any) => p.setMap(null)); lastMileXRef.current = []
      if (navArrowModeRef.current && userLocationMarkerRef.current) {
        navArrowModeRef.current = false
        userLocationMarkerRef.current.content = createDotElement()
      }
    },
    setNavActive: (active: boolean) => {
      navActiveRef.current = active
      if (active && mapInstanceRef.current) {
        if (introAnimFrameRef.current) { cancelAnimationFrame(introAnimFrameRef.current); introAnimFrameRef.current = null }
        mapInstanceRef.current.setOptions({ gestureHandling: 'greedy', minZoom: 8 })
        if (userLocationMarkerRef.current) {
          navArrowModeRef.current = true
          userLocationMarkerRef.current.content = createDotElement(true)
        }
      }
    },
    startNavigation: async (destLat: number, destLng: number, onReady?: (info: RouteInfo) => void, onError?: () => void) => {
      if (!mapInstanceRef.current) return
      const token = ++navTokenRef.current
      if (returnAnimFrameRef.current) { cancelAnimationFrame(returnAnimFrameRef.current); returnAnimFrameRef.current = null }
      const pos = lastKnownPositionRef.current
      if (!pos) { onError?.(); return }
      // Reset nav state para nueva ruta
      lastNearestIdxRef.current = 0
      prevNavPosRef.current = null
      destPositionRef.current = { lat: destLat, lng: destLng }
      const dy = destLat - pos.lat
      const dx = (destLng - pos.lng) * Math.cos((pos.lat * Math.PI) / 180)
      navBearingRef.current = (Math.atan2(dx, dy) * (180 / Math.PI) + 360) % 360
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
            destination: { location: { latLng: { latitude: destLat, longitude: destLng } } },
            travelMode: travelModeRef.current,
            computeAlternativeRoutes: true,
            ...(travelModeRef.current === 'DRIVE' && { routingPreference: 'TRAFFIC_AWARE_OPTIMAL' }),
          }),
        })
        if (navTokenRef.current !== token) return
        const data = await response.json()
        const routes: any[] = data.routes ?? []
        const totalDistNav = (r: any) => (r?.legs ?? []).reduce((s: number, l: any) => s + (l.distanceMeters ?? 0), 0)
        const route = routes.reduce((best: any, r: any) => totalDistNav(r) < totalDistNav(best) ? r : best, routes[0])
        const encoded = route?.polyline?.encodedPolyline
        if (!encoded) { onError?.(); return }
        const distanceM: number = totalDistNav(route)
        const durationStr: string = route?.legs?.[0]?.duration ?? '0s'
        const distanceKm = (distanceM / 1000).toFixed(1)
        const durationMin = Math.ceil(parseInt(durationStr.replace('s', ''), 10) / 60)
        const { encoding } = await importLibrary('geometry') as any
        const path = encoding.decodePath(encoded)
        if (navTokenRef.current !== token) return
        if (routeBorderRef.current) { routeBorderRef.current.setMap(null); routeBorderRef.current = null }
        if (directionsRendererRef.current) { directionsRendererRef.current.setMap(null); directionsRendererRef.current = null }
        if (lastMileRef.current) { lastMileRef.current.setMap(null); lastMileRef.current = null }
        if (lastMileZoomListenerRef.current) { lastMileZoomListenerRef.current.remove(); lastMileZoomListenerRef.current = null }
        lastMileXRef.current.forEach((p: any) => p.setMap(null)); lastMileXRef.current = []
        const { Polyline } = await importLibrary('maps') as any
        const map = mapInstanceRef.current
        routeBorderRef.current = new Polyline({ path, map, strokeColor: '#ffffff', strokeWeight: 18, strokeOpacity: 1.0, zIndex: 9 })
        directionsRendererRef.current = new Polyline({ path, map, strokeColor: '#ff9447', strokeWeight: 13, strokeOpacity: 1.0, zIndex: 10 })
        const lastPt = path[path.length - 1]
        if (lastPt) {
          const { path: lmPath, endLat: lmLat, endLng: lmLng } = computeLastMilePath(lastPt.lat(), lastPt.lng(), destLat, destLng)
          lastMileRef.current = new Polyline({
            path: lmPath, map, strokeOpacity: 0,
            icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3, strokeColor: '#ff9447', strokeWeight: 3 }, offset: '0', repeat: '10px' }],
            zIndex: 11,
          })
          const xS = 0.000015
          lastMileXRef.current = [
            new Polyline({ path: [{ lat: lmLat - xS, lng: lmLng - xS }, { lat: lmLat + xS, lng: lmLng + xS }], map, strokeColor: '#ff9447', strokeWeight: 5, strokeOpacity: 1, zIndex: 8 }),
            new Polyline({ path: [{ lat: lmLat - xS, lng: lmLng + xS }, { lat: lmLat + xS, lng: lmLng - xS }], map, strokeColor: '#ff9447', strokeWeight: 5, strokeOpacity: 1, zIndex: 8 }),
          ]
          updateXStroke(map, lastMileXRef.current)
          lastMileZoomListenerRef.current = map.addListener('zoom_changed', () => updateXStroke(map, lastMileXRef.current))
        }
        routePathRef.current = path.map((p: any) => ({ lat: p.lat(), lng: p.lng() }))
        onRouteUpdateRef.current = onReady ?? null
        lastRecalcTimeRef.current = Date.now()
        onReady?.({ distanceKm, durationMin, travelMode: travelModeRef.current })
        const bounds = new (window as any).google.maps.LatLngBounds()
        path.forEach((p: any) => bounds.extend(p))
        routeBoundsRef.current = bounds
        map.fitBounds(bounds, { top: 80, bottom: 220, left: 60, right: 60 })
      } catch (err) {
        console.warn('Error al trazar ruta:', err)
        onError?.()
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
      const isVector = () => (map as any).get?.('renderingType') === 'VECTOR'
      const animate = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1)
        const e = easeOut(t)
        const v = isVector()
        map.moveCamera({
          center: { lat: startCenter.lat() + (pos.lat - startCenter.lat()) * e, lng: startCenter.lng() + (pos.lng - startCenter.lng()) * e },
          zoom: startZoom + (18 - startZoom) * e,
          ...(v && {
            tilt: startTilt + (65 - startTilt) * e,
            heading: startHeading + (targetHeading - startHeading) * e,
          }),
        })
        if (t < 1) { returnAnimFrameRef.current = requestAnimationFrame(animate) } else { returnAnimFrameRef.current = null }
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
      const duration = 1400
      const startTime = performance.now()
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
      if (returnAnimFrameRef.current) cancelAnimationFrame(returnAnimFrameRef.current)
      const animate = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1)
        const e = easeOut(t)
        map.moveCamera({
          center: { lat: startCenter.lat() + (missionCenter.lat - startCenter.lat()) * e, lng: startCenter.lng() + (missionCenter.lng - startCenter.lng()) * e },
          zoom: startZoom + (18.8 - startZoom) * e,
          tilt: startTilt + (75 - startTilt) * e,
          heading: startHeading + (90 - startHeading) * e,
        })
        if (t < 1) { returnAnimFrameRef.current = requestAnimationFrame(animate) } else { returnAnimFrameRef.current = null }
      }
      returnAnimFrameRef.current = requestAnimationFrame(animate)
    },
    focusAerial: () => {
      const map = mapInstanceRef.current
      if (!map) return
      if (returnAnimFrameRef.current) { cancelAnimationFrame(returnAnimFrameRef.current); returnAnimFrameRef.current = null }
      if (routeBoundsRef.current) map.fitBounds(routeBoundsRef.current, { top: 80, bottom: 120, left: 60, right: 60 })
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
          center: { lat: startCenter.lat() + (pos.lat - startCenter.lat()) * e, lng: startCenter.lng() + (pos.lng - startCenter.lng()) * e },
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
          center: { lat: startCenter.lat() + (pos.lat - startCenter.lat()) * e, lng: startCenter.lng() + (pos.lng - startCenter.lng()) * e },
          zoom: startZoom + (18.5 - startZoom) * e,
          tilt: startTilt + (65 - startTilt) * e,
          heading: startHeading,
        })
        if (t < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    },
    getUserPosition: () => lastKnownPositionRef.current,
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
        <div ref={mapRef} className="h-full w-full" />
      </div>
    </div>
  )
}))

export default MapBoard
