import { useState, useRef, useEffect, useCallback } from 'react'

interface Options {
  audioUrl?: string
  /** Duración simulada en segundos cuando no hay archivo de audio real. */
  duration?: number
}

/** Controla la reproducción de narración: audio real o simulación RAF cuando no hay archivo. */
export function useAudioPlayer({ audioUrl, duration = 22 }: Options) {
  const [playing,  setPlaying]  = useState(false)
  const [progress, setProgress] = useState(0)

  const audioRef   = useRef<HTMLAudioElement | null>(null)
  const rafRef     = useRef<number | null>(null)
  // Marca de tiempo del último play/resume para calcular el delta en cada tick.
  const startRef   = useRef<number>(0)
  // Acumula el tiempo transcurrido entre pausas para reanudar desde donde se dejó.
  const elapsedRef = useRef<number>(0)

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  /** Loop RAF que avanza el progreso (0→1) durante `duration` segundos. */
  const runTick = useCallback(() => {
    startRef.current = performance.now()
    const tick = (now: number) => {
      const elapsed = elapsedRef.current + (now - startRef.current) / 1000
      const p = Math.min(elapsed / duration, 1)
      setProgress(p)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setPlaying(false)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [duration])

  const handleToggle = () => {
    if (!audioUrl) {
      // Sin archivo de audio: simular progreso con RAF.
      if (playing) {
        stopRaf()
        elapsedRef.current += (performance.now() - startRef.current) / 1000
        setPlaying(false)
      } else {
        if (progress >= 1) {
          // Reiniciar si ya terminó.
          stopRaf()
          elapsedRef.current = 0
          setProgress(0)
        }
        setPlaying(true)
        runTick()
      }
      return
    }

    // Con archivo de audio: instanciar una sola vez y usar eventos nativos.
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl)
      audioRef.current.addEventListener('timeupdate', () => {
        const a = audioRef.current!
        if (a.duration > 0) setProgress(a.currentTime / a.duration)
      })
      audioRef.current.addEventListener('ended', () => {
        setProgress(1)
        setPlaying(false)
      })
    }

    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      if (progress >= 1) {
        audioRef.current.currentTime = 0
        setProgress(0)
      }
      setPlaying(true)
      audioRef.current.play()
    }
  }

  // Limpieza al desmontar: cancelar RAF y pausar audio para evitar memory leaks.
  useEffect(() => {
    return () => {
      stopRaf()
      audioRef.current?.pause()
    }
  }, [stopRaf])

  return { playing, progress, handleToggle }
}
