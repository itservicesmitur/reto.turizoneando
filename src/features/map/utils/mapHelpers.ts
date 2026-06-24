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

export function buildMarkerHTML(
  monumento: Pick<Monumento, 'imagen' | 'nombre'>,
  index: number,
  completedStops: boolean[],
  stageGroups: number[][] = []
): string {
  const stageIdx = stageGroups.length > 0
    ? stageGroups.findIndex(g => g.includes(index))
    : Math.floor(index / 4)
  const safeStageIdx = Math.max(stageIdx, 0)
  const indexWithinStage = stageGroups.length > 0
    ? (stageGroups[safeStageIdx]?.indexOf(index) ?? index % 4)
    : index % 4
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
  // Sequential within stage: all previous stops must be completed
  const posInStage = stageGroups[safeStageIdx]?.indexOf(index) ?? 0
  const prevStopsInStageDone = posInStage <= 0
    || (stageGroups[safeStageIdx]?.slice(0, posInStage).every(i => completedStops[i]) ?? true)

  const isAvailable = !isCompleted && prevStagesDone && safeStageIdx === activeStageIndex && prevStopsInStageDone

  if (isCompleted) {
    return `
      <div class="gmap-pin-wrapper">
        <div class="gmap-pin-head">
          <div class="gmap-pin-circle" style="border-color:#16a34a;box-shadow:0 0 0 3px white,0 0 0 5.5px #16a34a,0 4px 14px rgba(22,163,74,0.35);">
            <img src="${monumento.imagen}" alt="${monumento.nombre}" style="filter:grayscale(0.85);" />
          </div>
        </div>
        <div class="gmap-pin-tip" style="border-top-color:#16a34a;"></div>
      </div>
      <div class="gmap-info-card">
        <div class="gmap-info-left" style="color:#16a34a;">
          <i class="ri-checkbox-circle-fill"></i>
          <span class="gmap-info-badge">COMPLETADO</span>
        </div>
        <div class="gmap-info-divider"></div>
        <span class="gmap-info-name">${monumento.nombre}</span>
      </div>
    `
  }

  if (isAvailable) {
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
          <span class="gmap-info-badge">DISPONIBLE</span>
        </div>
        <div class="gmap-info-divider"></div>
        <span class="gmap-info-name">${monumento.nombre}</span>
      </div>
    `
  }

  return `
    <div class="gmap-pin-wrapper">
      <div class="gmap-pin-head">
        <div class="gmap-pin-circle" style="border-color:rgba(9,109,125,0.7);box-shadow:0 4px 10px rgba(9,109,125,0.2);">
          <img src="${monumento.imagen}" alt="${monumento.nombre}" style="filter:grayscale(0.25) brightness(0.95);" />
        </div>
        <div class="gmap-lock-badge" style="background:rgba(9,109,125,0.7);">
          <svg style="width:9px;height:9px;fill:currentColor;" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
        </div>
      </div>
      <div class="gmap-pin-tip" style="border-top-color:rgba(9,109,125,0.7);"></div>
    </div>
    <div class="gmap-info-card">
      <div class="gmap-info-left" style="color:rgba(9,109,125,0.7);">
        <i class="ri-lock-2-fill"></i>
        <span class="gmap-info-badge">BLOQUEADA</span>
      </div>
      <div class="gmap-info-divider"></div>
      <span class="gmap-info-name" style="color:rgba(9,109,125,0.7);">Parada ${indexWithinStage + 1}</span>
    </div>
  `
}
