export function haversineM(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) *
      Math.cos(b.lat * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

export function ptSegDistM(
  p: { lat: number; lng: number },
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dx = b.lng - a.lng
  const dy = b.lat - a.lat
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return haversineM(p, a)
  const t = Math.max(0, Math.min(1, ((p.lng - a.lng) * dx + (p.lat - a.lat) * dy) / lenSq))
  return haversineM(p, { lat: a.lat + t * dy, lng: a.lng + t * dx })
}

export function computeLastMilePath(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  stopRatio = 0.80
): { path: { lat: number; lng: number }[]; endLat: number; endLng: number } {
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
      lat: (1 - t) * (1 - t) * fromLat + 2 * (1 - t) * t * ctrlLat + t * t * endLat,
      lng: (1 - t) * (1 - t) * fromLng + 2 * (1 - t) * t * ctrlLng + t * t * endLng,
    })
  }
  return { path: pts, endLat, endLng }
}

export function getRemainingRoute(
  pos: { lat: number; lng: number },
  path: Array<{ lat: number; lng: number }>
): { remainingM: number; offRouteM: number } {
  let minDist = Infinity
  let closestIdx = 0
  for (let i = 0; i < path.length - 1; i++) {
    const d = ptSegDistM(pos, path[i], path[i + 1])
    if (d < minDist) { minDist = d; closestIdx = i }
  }
  let remainingM = haversineM(pos, path[closestIdx + 1] ?? path[path.length - 1])
  for (let i = closestIdx + 1; i < path.length - 1; i++) {
    remainingM += haversineM(path[i], path[i + 1])
  }
  return { remainingM, offRouteM: minDist }
}
