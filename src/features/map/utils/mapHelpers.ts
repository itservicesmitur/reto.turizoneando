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
  dot.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:#e8341a;border:3px solid #fff;box-shadow:0 2px 10px rgba(232,52,26,0.60);position:relative;`
  const ring = document.createElement('div')
  ring.style.cssText = `position:absolute;inset:${inset}px;border-radius:50%;background:rgba(232,52,26,0.25);animation:pulse-ring 1.6s ease-out infinite;`
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
  const isAvailable = !isCompleted && prevStagesDone && safeStageIdx === activeStageIndex

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
    labelText = 'COMPLETADO'
  } else if (isAvailable) {
    medallionStyle = 'border-color:#fcd34d;box-shadow:0 0 14px rgba(252,211,77,0.55),0 8px 16px rgba(34,21,12,0.65),inset 0 2px 4px rgba(255,255,255,0.4);'
    labelStyle = 'border-color:#fcd34d;background-color:#321e0f;color:#fcd34d;'
    innerBadge = ''
    outerBadge = '<div class="treasure-pulse-ring"></div>'
    labelText = 'DISPONIBLE'
  } else {
    medallionStyle = 'border-color:#6b4a20;'
    labelStyle = 'border-color:#6b4a20;color:#8a6b2f;'
    innerBadge = `<div class="treasure-lock-badge"><svg style="width:9px;height:9px;fill:currentColor;" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg></div>`
    outerBadge = ''
    labelText = `PARADA ${indexWithinStage + 1}`
  }

  const completedOverlay = isCompleted
    ? `<div style="position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,rgba(252,211,77,0.55) 0%,rgba(168,127,42,0.45) 100%);pointer-events:none;"></div>`
    : ''

  return `
    <div style="position:relative;display:inline-flex;align-items:center;justify-content:center;">
      ${outerBadge}
      <div class="treasure-medallion" style="${medallionStyle}">
        <img src="${monumento.imagen}" alt="${monumento.nombre}" />
        ${completedOverlay}
        ${innerBadge}
      </div>
    </div>
    <div class="treasure-label" style="${labelStyle}">${labelText}</div>
  `
}
