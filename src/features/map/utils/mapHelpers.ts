import type { Monumento } from '../types/map.types'

export function updateXStroke(map: any, lines: any[]): void {
  const z = map.getZoom() ?? 17
  const w = z >= 20 ? 12 : z >= 19 ? 9 : z >= 18 ? 6 : z >= 17 ? 3 : 2
  lines.forEach((l: any) => l.setOptions({ strokeWeight: w }))
}

export function createDotElement(nav = false): HTMLDivElement {
  const size = nav ? 26 : 18
  const inset = nav ? -8 : -6
  const dot = document.createElement('div')
  dot.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:#ff9447;border:3px solid #fff;box-shadow:0 2px 12px rgba(255,148,71,0.7),0 8px 28px rgba(255,148,71,0.35),0 18px 48px rgba(255,148,71,0.15);position:relative;`
  const ring = document.createElement('div')
  ring.style.cssText = `position:absolute;inset:${inset}px;border-radius:50%;background:rgba(255,148,71,0.28);animation:pulse-ring 1.6s ease-out infinite;`
  dot.appendChild(ring)
  return dot
}

export function getStopState(
  index: number,
  completedStops: boolean[],
  stageGroups: number[][]
): 'completed' | 'available' | 'locked' {
  const stageIdx = stageGroups.length > 0
    ? stageGroups.findIndex(g => g.includes(index))
    : Math.floor(index / 4)
  const safeStageIdx = Math.max(stageIdx, 0)
  const isCompleted = completedStops[index] ?? false
  const prevStagesDone = safeStageIdx === 0 ? true
    : stageGroups.length > 0
      ? stageGroups.slice(0, safeStageIdx).every(g => g.every(i => completedStops[i]))
      : completedStops.slice(0, safeStageIdx * 4).every(Boolean)
  let activeStageIndex: number
  if (stageGroups.length > 0) {
    activeStageIndex = stageGroups.length - 1
    for (let s = 0; s < stageGroups.length; s++) {
      if (!stageGroups[s].every(i => completedStops[i])) { activeStageIndex = s; break }
    }
  } else {
    activeStageIndex = 2
    for (let s = 0; s < 3; s++) {
      if (!completedStops.slice(s * 4, s * 4 + 4).every(Boolean)) { activeStageIndex = s; break }
    }
  }
  const posInStage = stageGroups[safeStageIdx]?.indexOf(index) ?? 0
  const prevStopsInStageDone = posInStage <= 0
    || (stageGroups[safeStageIdx]?.slice(0, posInStage).every(i => completedStops[i]) ?? true)
  const isAvailable = !isCompleted && prevStagesDone && safeStageIdx === activeStageIndex && prevStopsInStageDone
  if (isCompleted) return 'completed'
  if (isAvailable) return 'available'
  return 'locked'
}

export function getMarkerContainerWidth(state: 'completed' | 'available' | 'locked'): string {
  if (state === 'available') return '190px'
  if (state === 'completed') return '50px'
  return '38px'
}

export function getMarkerZIndex(state: 'completed' | 'available' | 'locked'): number {
  if (state === 'available') return 200
  if (state === 'completed') return 20
  return 5
}

export function buildMarkerHTML(
  monumento: Pick<Monumento, 'imagen' | 'nombre'>,
  index: number,
  completedStops: boolean[],
  stageGroups: number[][] = [],
  t?: (key: string) => string
): string {
  const translate = t || ((key: string) => {
    if (key === 'map.completed') return 'COMPLETADO'
    if (key === 'map.available') return 'DISPONIBLE'
    if (key === 'map.locked') return 'BLOQUEADA'
    if (key === 'map.stop_short') return 'Parada'
    return key
  })

  const state = getStopState(index, completedStops, stageGroups)

  if (state === 'completed') {
    return `
      <div class="gmap-pin-wrapper">
        <div class="gmap-pin-head" style="width:38px;height:38px;">
          <div class="gmap-pin-circle" style="width:38px;height:38px;border-width:3px;border-color:#16a34a;box-shadow:0 0 0 2px white,0 0 0 4px #16a34a,0 3px 10px rgba(22,163,74,0.28);">
            <img src="${monumento.imagen}" alt="${monumento.nombre}" style="filter:grayscale(0.65) brightness(0.9);" />
          </div>
          <div style="position:absolute;top:-3px;right:-3px;width:16px;height:16px;background:#16a34a;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:10;">
            <svg style="width:8px;height:8px;fill:white;" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          </div>
        </div>
        <div class="gmap-pin-tip" style="border-left:10px solid transparent;border-right:10px solid transparent;border-top:8px solid #16a34a;margin-top:-4px;filter:drop-shadow(0 2px 1px rgba(0,0,0,0.12));"></div>
      </div>
    `
  }

  if (state === 'available') {
    return `
      <div class="gmap-pin-wrapper">
        <div class="gmap-pin-head">
          <div class="gmap-pulse-ring"></div>
          <div class="gmap-pin-circle" style="border-color:#096d7d;box-shadow:0 4px 18px rgba(9,109,125,0.55),0 6px 14px rgba(0,0,0,0.22);">
            <img src="${monumento.imagen}" alt="${monumento.nombre}" />
          </div>
        </div>
        <div class="gmap-pin-tip" style="border-top-color:#096d7d;"></div>
      </div>
      <div class="gmap-info-card">
        <div class="gmap-info-left" style="color:#096d7d;">
          <i class="ri-map-pin-2-fill"></i>
          <span class="gmap-info-badge">${translate('map.available').toUpperCase()}</span>
        </div>
        <div class="gmap-info-divider"></div>
        <span class="gmap-info-name">${monumento.nombre}</span>
      </div>
    `
  }

  // locked
  return `
    <div class="gmap-pin-wrapper">
      <div class="gmap-pin-head" style="width:28px;height:28px;">
        <div class="gmap-pin-circle" style="width:28px;height:28px;border-width:2px;border-color:rgba(9,109,125,0.4);box-shadow:0 2px 6px rgba(9,109,125,0.10);">
          <img src="${monumento.imagen}" alt="${monumento.nombre}" style="filter:grayscale(0.55) brightness(0.8);" />
        </div>
        <div style="position:absolute;top:-2px;right:-2px;width:12px;height:12px;background:rgba(9,109,125,0.72);border:1.5px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:10;">
          <svg style="width:6px;height:6px;fill:white;" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
        </div>
      </div>
      <div class="gmap-pin-tip" style="border-left:8px solid transparent;border-right:8px solid transparent;border-top:6px solid rgba(9,109,125,0.4);margin-top:-3px;filter:drop-shadow(0 2px 1px rgba(0,0,0,0.10));"></div>
    </div>
  `
}
