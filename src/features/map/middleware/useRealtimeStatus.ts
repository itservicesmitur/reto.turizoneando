import { useEffect, useRef, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../../config/firebase'

export type BlockType = 'stop_deactivated' | 'stage_deactivated' | 'season_ended'

export interface BlockEvent {
  type: BlockType
  name?: string
}

interface Options {
  seasonId: string
  stageId?: string
  stopId?: string
}

/**
 * Abre listeners en tiempo real contra Firestore para detectar si la temporada,
 * etapa o parada actual ha sido desactivada mientras el usuario está jugando.
 * Devuelve el primer bloqueo detectado (por prioridad: temporada > etapa > parada)
 * y una función para descartarlo.
 */
export function useRealtimeStatus({ seasonId, stageId, stopId }: Options) {
  const [seasonBlock, setSeasonBlock] = useState<BlockEvent | null>(null)
  const [stageBlock,  setStageBlock]  = useState<BlockEvent | null>(null)
  const [stopBlock,   setStopBlock]   = useState<BlockEvent | null>(null)

  // Refs para no re-crear listeners cuando cambia el estado derivado
  const seasonIdRef = useRef(seasonId)
  const stageIdRef  = useRef(stageId)
  const stopIdRef   = useRef(stopId)
  seasonIdRef.current = seasonId
  stageIdRef.current  = stageId
  stopIdRef.current   = stopId

  // ── Temporada ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!seasonId) return
    const unsub = onSnapshot(
      doc(db, 'seasons', seasonId),
      (snap) => {
        if (!snap.exists()) return
        const data = snap.data()
        if (data.status !== 'active') {
          setSeasonBlock({ type: 'season_ended', name: String(data.name ?? '') })
        } else {
          setSeasonBlock(null)
        }
      },
      () => { /* silencioso — no interrumpir la sesión por error de red */ }
    )
    return unsub
  }, [seasonId])

  // ── Etapa ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!seasonId || !stageId) { setStageBlock(null); return }
    const unsub = onSnapshot(
      doc(db, 'seasons', seasonId, 'stages', stageId),
      (snap) => {
        if (!snap.exists()) return
        const data = snap.data()
        if (data.active === false) {
          const num = data.number ? `Etapa ${data.number}` : 'La etapa actual'
          setStageBlock({ type: 'stage_deactivated', name: num })
        } else {
          setStageBlock(null)
        }
      },
      () => {}
    )
    return unsub
  }, [seasonId, stageId])

  // ── Parada ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!stopId) { setStopBlock(null); return }
    const unsub = onSnapshot(
      doc(db, 'stops', stopId),
      (snap) => {
        if (!snap.exists()) return
        const data = snap.data()
        if (data.active === false) {
          setStopBlock({ type: 'stop_deactivated', name: String(data.name ?? '') })
        } else {
          setStopBlock(null)
        }
      },
      () => {}
    )
    return unsub
  }, [stopId])

  // Prioridad: temporada > etapa > parada
  const block: BlockEvent | null = seasonBlock ?? stageBlock ?? stopBlock

  const dismiss = () => {
    // Para parada/etapa el usuario puede continuar; para temporada no (manejado en UI)
    setStopBlock(null)
    setStageBlock(null)
  }

  return { block, dismiss }
}
