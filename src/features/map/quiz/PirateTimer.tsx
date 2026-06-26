import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getAudioContext } from './sharedAudioContext'

const TOTAL = 60
const SIZE  = 52
const R     = 20
const CIRC  = 2 * Math.PI * R

interface Props {
  questionIdx: number
  paused: boolean
  onTimeUp: () => void
}

export default function PirateTimer({ questionIdx, paused, onTimeUp }: Props) {
  const { t } = useTranslation()
  const [seconds, setSeconds] = useState(TOTAL)
  const pausedRef    = useRef(paused)
  const onTimeUpRef  = useRef(onTimeUp)
  const rafRef       = useRef(0)

  pausedRef.current   = paused
  onTimeUpRef.current = onTimeUp

  const playTick = (type: 'normal' | 'warning' | 'critical') => {
    try {
      const ctx = getAudioContext()
      if (ctx.state !== 'running') return
      const now = ctx.currentTime

      const beep = (freq: number, offset: number, dur: number, vol: number) => {
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'triangle'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0, now + offset)
        gain.gain.linearRampToValueAtTime(vol, now + offset + 0.008)
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + dur)
        osc.start(now + offset)
        osc.stop(now + offset + dur + 0.01)
      }

      if (type === 'critical') {
        beep(900, 0,    0.06, 0.22)
        beep(1150, 0.14, 0.06, 0.22)
      } else if (type === 'warning') {
        beep(580, 0, 0.09, 0.18)
      } else {
        beep(320, 0, 0.11, 0.12)
      }
    } catch { /* AudioContext not available */ }
  }

  useEffect(() => {
    setSeconds(TOTAL)
    cancelAnimationFrame(rafRef.current)

    let accumulated = 0
    let pauseStart: number | null = null
    let lastTick = TOTAL + 1
    const startTime = Date.now()
    let done = false

    const loop = () => {
      if (done) return

      if (pausedRef.current) {
        if (pauseStart === null) pauseStart = Date.now()
      } else {
        if (pauseStart !== null) {
          accumulated += Date.now() - pauseStart
          pauseStart = null
        }
      }

      const elapsed    = Math.floor((Date.now() - startTime - accumulated) / 1000)
      const remaining  = Math.max(0, TOTAL - elapsed)
      setSeconds(remaining)

      if (remaining < lastTick) {
        lastTick = remaining
        if (!pausedRef.current) {
          const type = remaining <= 5 ? 'critical' : remaining <= 15 ? 'warning' : 'normal'
          playTick(type)
        }
      }

      if (remaining <= 0 && !pausedRef.current) {
        done = true
        onTimeUpRef.current()
        return
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      done = true
      cancelAnimationFrame(rafRef.current)
    }
  }, [questionIdx])

  const pct        = seconds / TOTAL
  const isCritical = seconds <= 5
  const isWarning  = seconds > 5 && seconds <= 15
  const ringColor  = isCritical ? '#e0344b' : isWarning ? '#ff9447' : 'rgba(255,255,255,0.6)'
  const dashOffset = CIRC * (1 - pct)
  const cx         = SIZE / 2

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <div
        style={{
          position: 'relative', width: SIZE, height: SIZE,
          animation: isCritical ? 'timerPulse 0.45s ease-in-out infinite' : undefined,
        }}
      >
        <svg width={SIZE} height={SIZE} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cx} r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={3} />
          <circle
            cx={cx} cy={cx} r={R} fill="none"
            stroke={ringColor} strokeWidth={3} strokeLinecap="round"
            strokeDasharray={`${CIRC} ${CIRC}`} strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.4s ease' }}
          />
        </svg>

        {/* Disco blanco translúcido */}
        <div style={{
          position: 'absolute', inset: 6, borderRadius: '50%',
          background: 'rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: seconds >= 10 ? 15 : 17,
            fontWeight: 900,
            color: isCritical ? '#e0344b' : isWarning ? '#ff9447' : '#ffffff',
            lineHeight: 1,
            transition: 'color 0.4s',
          }}>
            {seconds}
          </span>
        </div>
      </div>

      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.5)',
      }}>
        {isCritical ? t('map.timer_hurry') : isWarning ? t('map.timer_warning') : t('map.timer_normal')}
      </p>

      <style>{`
        @keyframes timerPulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}
