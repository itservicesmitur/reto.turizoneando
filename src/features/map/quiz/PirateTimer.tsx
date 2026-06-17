import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const TOTAL = 60
const R = 29
const CIRC = 2 * Math.PI * R

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
  const audioCtxRef  = useRef<AudioContext | null>(null)
  const rafRef       = useRef(0)

  pausedRef.current   = paused
  onTimeUpRef.current = onTimeUp

  const playTick = (type: 'normal' | 'warning' | 'critical') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') ctx.resume()
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

  useEffect(() => {
    return () => { audioCtxRef.current?.close() }
  }, [])

  const pct        = seconds / TOTAL
  const isCritical = seconds <= 5
  const isWarning  = seconds > 5 && seconds <= 15
  const ringColor  = isCritical ? '#dc2626' : isWarning ? '#d97706' : '#a87f2a'
  const dashOffset = CIRC * (1 - pct)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 10 }}>
      <div
        style={{
          position: 'relative',
          width: 70,
          height: 70,
          animation: isCritical ? 'timerPulse 0.45s ease-in-out infinite' : undefined,
        }}
      >
        {/* SVG progress ring */}
        <svg
          width={70} height={70}
          style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
        >
          {/* Rope-style background track */}
          {/* <circle
            cx={35} cy={35} r={R}
            fill="none"
            stroke="rgba(168,127,42,0.18)"
            strokeWidth={4.5}
            strokeDasharray="4.5 3"
          /> */}
          {/* Animated progress arc */}
          <circle
            cx={35} cy={35} r={R}
            fill="none"
            stroke={ringColor}
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeDasharray={`${CIRC} ${CIRC}`}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.4s ease' }}
          />
        </svg>

        {/* Inner disc */}
        <div style={{
          position: 'absolute', inset: 8, borderRadius: '50%',
          background: 'radial-gradient(circle at 38% 34%, rgba(252,248,238,0.98), rgba(232,218,192,0.92))',
          boxShadow: `inset 0 2px 8px rgba(0,0,0,0.14), inset 0 -1px 2px rgba(255,255,255,0.45), 0 0 0 1px ${ringColor}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: 'var(--font-map-parchment)',
            fontSize: seconds >= 10 ? 24 : 28,
            fontWeight: 900,
            color: ringColor,
            lineHeight: 1,
            transition: 'color 0.4s, font-size 0.15s',
          }}>
            {seconds}
          </span>
        </div>
      </div>

      {/* Urgency label */}
      <p style={{
        marginTop: 5,
        fontFamily: 'var(--font-map-parchment)',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.26em',
        textTransform: 'uppercase',
        color: `${ringColor}bb`,
        transition: 'color 0.4s',
      }}>
        {isCritical ? t('map.timer_hurry') : isWarning ? t('map.timer_warning') : t('map.timer_normal')}
      </p>

      <style>{`
        @keyframes timerPulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.07); }
        }
      `}</style>
    </div>
  )
}
