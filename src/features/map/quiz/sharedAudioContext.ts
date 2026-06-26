/**
 * Shared AudioContext singleton for the quiz module.
 *
 * iOS Safari requires AudioContext to be created/resumed during a direct user
 * gesture (touchend / click). Strategy:
 *   1. Unlock listener is installed at MODULE LOAD TIME so the very first tap
 *      anywhere on the page creates + resumes the context, even before any
 *      component calls getAudioContext().
 *   2. resumeAudioContext() is async so callers can await it before scheduling
 *      audio — crucial on iOS where ctx.resume() is asynchronous.
 */

let _ctx: AudioContext | null = null
let _unlocked = false

const AudioContextClass: typeof AudioContext =
  window.AudioContext ||
  (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext

/**
 * Create (or return) the shared AudioContext.
 * Safe to call anywhere — the context may still be `suspended` until the
 * unlock listener fires.
 */
export function getAudioContext(): AudioContext {
  if (!_ctx) {
    _ctx = new AudioContextClass()
  }
  return _ctx
}

/**
 * Await this before scheduling audio to guarantee ctx is running on iOS.
 * No-op if ctx is already running.
 */
export async function resumeAudioContext(): Promise<void> {
  if (_ctx && _ctx.state === 'suspended') {
    await _ctx.resume()
  }
}

/**
 * Call this from a click/touchend handler to guarantee iOS unlock.
 * Safe to call multiple times — the unlock buffer only plays once.
 */
export function unlockAudioContext(): void {
  const ctx = getAudioContext()
  if (_unlocked && ctx.state === 'running') return

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }

  // Silent buffer — required to fully unlock audio on iOS Safari.
  try {
    const buf = ctx.createBuffer(1, 1, 22050)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    src.start(0)
    _unlocked = true
  } catch {
    /* best-effort */
  }
}

/* ─── Install unlock listener at module load ─── */
// Fires on the very first user tap anywhere on the page, even before any
// component has called getAudioContext(). This ensures the ctx is created +
// resumed during a valid user gesture, so RAF-based sounds (PirateTimer) work.
;(function _installUnlockListener() {
  const handler = () => {
    unlockAudioContext()
    setTimeout(() => {
      unlockAudioContext()
      document.removeEventListener('touchend', handler, true)
      document.removeEventListener('click', handler, true)
    }, 200)
  }
  document.addEventListener('touchend', handler, { capture: true, passive: true })
  document.addEventListener('click', handler, { capture: true, passive: true } as AddEventListenerOptions)
})()
