export interface Monumento {
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
