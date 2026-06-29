import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import logoImg    from '../assets/logo1.png'

// ── Step icons (sin traducción) ────────────────────────────────────
const STEP_ICONS = [
  'ri-user-add-line', 'ri-translate-2', 'ri-treasure-map-line', 'ri-radar-line',
  'ri-headphone-line', 'ri-question-line', 'ri-gift-2-line', 'ri-coupon-2-line',
]

// ── Stage colors/números (sin traducción) ──────────────────────────
const STAGE_DATA = [
  { n: 1, color: 'var(--color-primary)',       q: 5, stops: 5 },
  { n: 2, color: 'var(--color-accent-orange)', q: 6, stops: 6 },
  { n: 3, color: 'var(--color-accent-red)',    q: 7, stops: 7 },
]

// ── Lugares de paradas (nombres propios, no se traducen) ───────────
const STOP_PLACES = [
  'Alcázar de Colón · Casas Reales · Panteón de la Patria · Museo Fortaleza de Santo Domingo (Ozama)',
  'Catedral Primada de América · Iglesia de Nuestra Señora de la Altagracia · Iglesia y Convento Regina Angelorum',
  'Las Escalinatas de la Calle El Conde · Calle Pellerano Alfau (De los Nichos) · Calle Las Damas · Plaza María de Toledo · El Reloj de Sol · La Puerta de San Diego · Plaza de España (Plaza de la Hispanidad) · Ruinas de San Nicolás de Bari · Plaza Tirso de Molina · Calle El Conde — Edificio Saviñón',
]

// ── Floating particles config ──────────────────────────────────────
const PARTICLES = [
  { top: '12%', left:  '7%',  w: 10, c: 'rgba(255,148,71,0.7)',  d: '0s',   dur: '2.4s' },
  { top: '22%', right: '16%', w:  7, c: 'rgba(0,187,180,0.6)',   d: '0.5s', dur: '2.9s' },
  { top: '38%', left:  '5%',  w:  5, c: 'rgba(255,255,255,0.3)', d: '0.9s', dur: '3.2s' },
  { top:  '8%', left: '54%',  w:  9, c: 'rgba(224,52,75,0.5)',   d: '0.3s', dur: '2.6s' },
  { top: '62%', right: '11%', w:  6, c: 'rgba(255,148,71,0.4)',  d: '1.1s', dur: '2.2s' },
  { top: '75%', left: '14%',  w:  8, c: 'rgba(0,187,180,0.35)',  d: '0.7s', dur: '3.5s' },
  { top: '48%', right:  '6%', w:  5, c: 'rgba(224,52,75,0.4)',   d: '1.4s', dur: '2.8s' },
  { top: '18%', left: '35%',  w:  4, c: 'rgba(255,255,255,0.2)', d: '1.8s', dur: '3.0s' },
  { top: '55%', left: '42%',  w:  6, c: 'rgba(255,148,71,0.5)',  d: '0.6s', dur: '2.7s' },
  { top: '28%', right:  '4%', w:  9, c: 'rgba(0,187,180,0.45)', d: '1.2s', dur: '3.1s' },
  { top: '84%', right: '26%', w:  5, c: 'rgba(224,52,75,0.38)', d: '0.2s', dur: '2.5s' },
  { top:  '4%', right: '40%', w:  7, c: 'rgba(255,255,255,0.22)',d: '1.6s', dur: '3.3s' },
]

// ──────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { t, i18n } = useTranslation()
  const [navScrolled, setNavScrolled]     = useState(false)
  const [textExpanded, setTextExpanded]   = useState(false)
  const bodyTextRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    const el = bodyTextRef.current
    if (!el) return
    if (textExpanded) {
      el.classList.remove('line-clamp-4')
    } else {
      el.classList.add('line-clamp-4')
    }
  }, [textExpanded])
  const [activeStopTab, setActiveStopTab] = useState(0)
  const [counters, setCounters]           = useState([0, 0, 0, 0])
  const [statsStarted, setStatsStarted]   = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)
  const lang = (i18n.language || 'es').startsWith('en') ? 'en' : 'es'

  const steps = (t('landing.steps', { returnObjects: true }) as { title: string; desc: string }[])
    .map((s, i) => ({ ...s, icon: STEP_ICONS[i] }))

  const stops = [
    { icon: 'castle',    cat: t('landing.stop_cat_museums'), places: STOP_PLACES[0] },
    { icon: 'church',    cat: t('landing.stop_cat_temples'), places: STOP_PLACES[1] },
    { icon: 'landscape', cat: t('landing.stop_cat_parks'),   places: STOP_PLACES[2] },
  ]

  const stages = STAGE_DATA.map((s, i) => ({
    ...s,
    label: t(`landing.stage_${i + 1}_label`),
    sub:   t(`landing.stage_${i + 1}_sub`),
    prize: t(`landing.stage_${i + 1}_prize`),
  }))

  useEffect(() => {
    const onScroll = () => {
      setNavScrolled(window.scrollY > window.innerHeight - 100)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  useEffect(() => {
    const el = statsRef.current
    if (!el || statsStarted) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsStarted(true); obs.disconnect() } },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [statsStarted])

  useEffect(() => {
    if (!statsStarted) return
    const targets = [18, 3, 18, 2]
    const duration = 1400
    const start = performance.now()
    let raf: number
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCounters(targets.map(t => Math.round(t * eased)))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [statsStarted])

  useLayoutEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('lp-on'); obs.unobserve(e.target) }
      }),
      { threshold: 0.07, rootMargin: '0px 0px -40px 0px' },
    )
    document.querySelectorAll('.lp-r, .lp-rl, .lp-rr, .lp-fade').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <div style={{ fontFamily: 'var(--font-body)', overflowX: 'hidden', background: 'var(--color-primary-dark)' }}>

      {/* ══ FIXED NAV ═══════════════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `calc(var(--safe-top) + 10px) 24px 10px`,
        background: navScrolled ? '#096d7d' : 'transparent',
        backdropFilter: navScrolled ? 'blur(20px)' : 'none',
        borderBottom: navScrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
        transition: 'background 0.35s, backdrop-filter 0.35s',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          opacity: navScrolled ? 1 : 0,
          visibility: navScrolled ? 'visible' : 'hidden',
          transition: 'opacity 0.3s, visibility 0.3s',
        }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', overflow: 'hidden', flexShrink: 0, boxShadow: '0 0 0 2px rgba(255,148,71,0.5)' }}>
            <img src={logoImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <img
            src="/assets/img/logoSoloLetras.webp"
            alt="Turizoneando"
            className="lp-nav-wordmark"
            style={{ height: 90, width: 'auto', marginTop: -30, marginBottom: -30, filter: 'brightness(0) invert(1)' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => i18n.changeLanguage(lang === 'es' ? 'en' : 'es')}
            style={{
              background: navScrolled ? 'rgba(255,255,255,0.12)' : '#0a2857',
              border: navScrolled ? '1px solid rgba(255,255,255,0.25)' : '1.5px solid transparent',
              borderRadius: 20, color: '#fff', padding: '6px 14px',
              fontSize: 11, fontWeight: 800, cursor: 'pointer', lineHeight: 1,
              display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
              height: 35, boxSizing: 'border-box',
              boxShadow: navScrolled ? 'none' : '0 6px 18px rgba(0, 0, 0, 0.5)',
              letterSpacing: '0.05em',
              transition: 'all 0.3s ease',
            }}
          >
            <i className="ri-global-line" style={{ fontSize: 13 }} />
            {lang === 'es' ? 'ES' : 'EN'}
          </button>
          <Link to="/login" style={{
            padding: '6px 18px', borderRadius: 20, fontSize: 11, fontWeight: 900, lineHeight: 1,
            border: navScrolled ? '1px solid rgba(255,255,255,0.25)' : '1.5px solid transparent',
            color: '#fff',
            textDecoration: 'none',
            background: navScrolled ? 'rgba(255,255,255,0.12)' : 'linear-gradient(180deg, #ffc060 0%, #fca330 100%)',
            display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
            height: 35, boxSizing: 'border-box',
            boxShadow: navScrolled ? 'none' : '0 6px 18px rgba(0, 0, 0, 0.5)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            transition: 'all 0.3s ease',
          }}>
            {t('landing.nav_login')}
          </Link>
        </div>
      </nav>

    {/* ══ HERO NUEVO  ════════════════════════════════════════════════════════ */}
      <section className="w-full h-[calc(100vh+50px)] relative snap-start bg-primary-dark">
        {/* Fondos responsivos con fade inferior via mask-image */}
        <img src="/assets/img/fondoHero.webp" alt="" fetchPriority="high" decoding="async" className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none hidden md:block"
          style={{ maskImage: 'linear-gradient(to bottom, black 95%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 95%, transparent 100%)' }} />
        <img src="/assets/img/fondoMobile-hero.webp" alt="" fetchPriority="high" decoding="async" className="absolute w-full h-full object-cover object-top pointer-events-none md:hidden"
          style={{ maskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)' }} />

        {/* Texto: centrado verticalmente, ocupa solo la mitad izquierda */}
        <div className="absolute inset-0 z-10 flex items-center">
          <div className="w-full max-w-6xl mx-auto px-10 sm:px-12 md:px-14">
            <div className="flex flex-col items-start text-left w-full md:w-[52%] pb-40 md:pb-0">
              <img src="/assets/img/logoConFondo.webp" alt="Turizoneando" className="w-36 sm:w-48 md:w-64 h-auto block -ml-12 sm:-ml-11 md:-ml-19 -mb-2 md:-mb-2"
                style={{ alignSelf: 'flex-start', animation: 'heroNewIn 0.65s cubic-bezier(0.22,1,0.36,1) 0.05s both' }} />

              <h1 className="text-white font-black uppercase leading-tight text-[clamp(15px,4.2vw,40px)] mb-2.5 [text-shadow:0_2px_8px_rgba(0,0,0,0.4)] text-left"
                style={{ animation: 'heroNewIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.22s both' }}>
                <span className="block whitespace-nowrap">{t('landing.hero_title_1')}</span>
                <span className="block whitespace-nowrap">{t('landing.hero_title_2')}</span>
              </h1>

              <div className="w-11 h-0.5 bg-accent-orange rounded-full mb-3 md:w-16"
                style={{ animation: 'heroNewIn 0.5s ease 0.38s both' }} />

              <p className="text-[#0a2857]/85 text-[11px] sm:text-xs md:text-sm font-bold uppercase leading-relaxed tracking-[0.4px] mb-5 max-w-xs sm:max-w-md md:max-w-xl text-left"
                style={{ animation: 'heroNewIn 0.65s ease 0.46s both' }}>
                {t('landing.hero_body')}
              </p>

              <div className="flex items-center gap-3 justify-start"
                style={{ animation: 'heroNewIn 0.65s cubic-bezier(0.22,1,0.36,1) 0.6s both' }}>
                <Link
                  to="/register"
                  className="flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-full bg-[radial-gradient(circle,#ffc060_0%,#fca330_100%)] shadow-[0_4px_14px_rgba(255,148,71,0.5)] text-white text-base md:text-xl shrink-0"
                >
                  <i className="ri-arrow-right-line" />
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 md:px-6 md:py-3.5 rounded-full bg-[radial-gradient(circle,#ffc060_0%,#fca330_100%)] text-white font-black text-[11px] md:text-[13px] uppercase tracking-[0.8px] shadow-[0_4px_14px_rgba(255,148,71,0.45)]"
                >
                  {t('landing.hero_cta_short')}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Personaje Turi: siempre pegado al piso, esquina inferior derecha */}
        <div className="absolute bottom-5 right-13 sm:right-30 lg:right-60 z-10 w-[150px] sm:w-[240px] md:w-[25%] max-w-[480px] flex justify-end">
          <img
            src="/assets/img/turiguiaNuevo.webp"
            alt="Turi"
            fetchPriority="high"
            decoding="async"
            className="h-auto object-contain object-bottom pointer-events-none drop-shadow-[28px_16px_12px_rgba(0,0,0,0.35)]"
            style={{ backgroundColor: 'transparent', WebkitTransform: 'translateZ(0)', animation: 'heroMascotNewIn 0.9s cubic-bezier(0.22,1,0.36,1) 0.2s both' }}
          />
        </div>
      </section>

      {/* ══ HERO (old) ══════════════════════════════════════════════════ */}
      {false && <section className="lp-hero-bg-section" style={{ minHeight: '100dvh', position: 'relative', overflow: 'hidden' }}>

        {/* Background blobs + overlays */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {/* Blobs */}
          <div style={{ position: 'absolute', top: -140, right: -100, width: 560, height: 560, borderRadius: '50%', background: 'rgba(0,187,180,0.2)', filter: 'blur(48px)', animation: 'blobDrift 12s ease-in-out infinite alternate' }} />
          <div style={{ position: 'absolute', bottom: '10%', left: -100, width: 420, height: 420, borderRadius: '50%', background: 'rgba(255,148,71,0.13)', filter: 'blur(40px)', animation: 'blobDrift 16s ease-in-out infinite alternate-reverse' }} />
          <div style={{ position: 'absolute', top: '45%', right: '6%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(224,52,75,0.13)', filter: 'blur(32px)', animation: 'blobDrift 10s ease-in-out infinite alternate' }} />
          <div style={{ position: 'absolute', bottom: '-8%', left: '28%', width: 460, height: 220, borderRadius: '50%', background: 'rgba(255,148,71,0.09)', filter: 'blur(52px)', animation: 'blobDrift 14s ease-in-out infinite alternate' }} />
          {/* Palm leaves – left */}
          <img src="/assets/img/palm_leaves_shadow.webp" alt="" style={{ position: 'absolute', top: 0, left: -10, height: '72%', width: 'auto', opacity: 0.55, objectFit: 'contain', objectPosition: 'top left', mixBlendMode: 'multiply' }} />
          {/* Palm leaves – right (mirrored) */}
          <img src="/assets/img/palm_leaves_shadow.webp" alt="" style={{ position: 'absolute', top: 0, right: -10, height: '58%', width: 'auto', opacity: 0.35, objectFit: 'contain', objectPosition: 'top right', transform: 'scaleX(-1)', mixBlendMode: 'multiply' }} />
          {/* Grid overlay */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
          {/* Edge vignette */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(4,30,36,0.55) 100%)' }} />
          {/* Particles */}
          {PARTICLES.map((p, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: p.top,
              left: (p as { left?: string }).left,
              right: (p as { right?: string }).right,
              width: p.w, height: p.w,
              borderRadius: '50%', background: p.c,
              animation: `twinkle ${p.dur} ${p.d} infinite alternate ease-in-out`,
            }} />
          ))}
        </div>

        {/* Hero two-column layout */}
        <div className="lp-hero-wrap">

          {/* ── Left: Content ── */}
          <div className="lp-hero-content" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            maxWidth: '520px',
            background: 'rgba(5, 50, 60, 0.78)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '0 0 28px',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 40px 0 rgba(0,0,0,0.35), 0 0 0 1px rgba(0,187,180,0.1)',
            position: 'relative',
            zIndex: 3,
          }}>
            {/* Gradient top accent bar */}
            <div style={{ width: '100%', height: 3, background: 'linear-gradient(90deg, #ff9447 0%, #00bbb4 50%, #e0344b 100%)', flexShrink: 0, borderRadius: '24px 24px 0 0' }} />

            <div className="lp-hero-inner" style={{ padding: '32px 28px 0', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div className="lp-r" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(0,187,180,0.14)', border: '1px solid rgba(0,187,180,0.32)',
              borderRadius: 20, padding: '6px 14px', marginBottom: 14,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', flexShrink: 0, animation: 'liveBlip 1.5s ease-in-out infinite' }} />
              <i className="ri-map-pin-line" style={{ color: 'var(--color-primary)', fontSize: 13 }} />
              <span style={{ color: 'var(--color-primary)', fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase' }}>
                Ciudad Colonial · Verano 2026
              </span>
            </div>

            <div className="lp-r" style={{ margin: '0', width: 'calc(100% + 44px)', maxWidth: 'min(400px, calc(100% + 44px))', overflow: 'hidden', marginLeft: '-44px' }}>
              <img
                src="/assets/img/logoSoloLetras.webp"
                alt="Turizoneando"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  marginTop: '-23%',
                  marginBottom: '-24%',
                  filter: 'brightness(0) invert(1) drop-shadow(0 2px 8px rgba(0,0,0,0.2))'
                }}
              />
            </div>

            <h2 className="lp-r lp-hero-title-gradient" style={{
              fontFamily: 'var(--font-body)', fontSize: 'clamp(18px, 4vw, 24px)',
              color: '#ffc060', textTransform: 'uppercase', fontWeight: 900,
              lineHeight: 1.2, textAlign: 'left', marginTop: '14px', marginBottom: '12px', letterSpacing: '-0.5px',
              textShadow: '0 2px 6px rgba(0,0,0,0.35)',
            }}>
              {t('landing.hero_subtitle')}
            </h2>

            <p className="lp-r" style={{
              color: '#f2f4f8', fontSize: 'clamp(14px, 3vw, 16px)',
              margin: '0 0 24px', lineHeight: 1.6, maxWidth: '440px',
              textAlign: 'left', fontWeight: 600, opacity: 0.95,
              textShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }}>
              {lang === 'es' 
                ? 'Estás a punto de embarcarte en una aventura por las calles más antiguas del Nuevo Mundo. Cada desafío esconde un secreto que solo los más atentos descubrirán.'
                : 'You are about to embark on an adventure through the oldest streets of the New World. Each challenge hides a secret that only the most attentive will discover.'}
            </p>

            <div className="lp-r lp-hero-btns" style={{ transitionDelay: '0.26s' }}>
              <Link to="/register"
                className="lp-cta-btn lp-hero-btn"
                style={{
                  background: 'linear-gradient(135deg, #ffa826 0%, #ffc060 100%)', color: '#fff',
                  padding: '12px 22px', borderRadius: 24, fontWeight: 800, fontSize: 13,
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7,
                  boxShadow: '0 6px 20px rgba(255,168,38,0.35)',
                  textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.2)',
                  letterSpacing: '0.5px'
                }}
              >
                <i className="ri-rocket-line" style={{ fontSize: 15 }} />
                {t('landing.hero_cta')}
              </Link>
              <Link to="/login" className="lp-hero-btn" style={{
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)',
                padding: '12px 22px', borderRadius: 24, fontWeight: 800, fontSize: 13,
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                {t('landing.hero_login')}
                <i className="ri-arrow-right-line" style={{ fontSize: 15 }} />
              </Link>
            </div>

            </div>{/* end padding wrapper */}
          </div>{/* end lp-hero-content */}

          {/* ── Right: Mascot ── */}
          <div className="lp-hero-mascot-col" aria-hidden>
            {/* Glow ring behind mascot */}
            <div className="lp-mascot-glow-ring" />
            {/* Orbit dot */}
            <div className="lp-orbit-wrap">
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--color-accent-orange)', boxShadow: '0 0 12px rgba(255,148,71,0.8)' }} />
            </div>
            <div className="lp-orbit-wrap lp-orbit-2">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)', boxShadow: '0 0 10px rgba(0,187,180,0.8)' }} />
            </div>
            <img src="/assets/img/turiguiaSinFondo.webp" alt="" className="lp-mascot-float" />
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}>
          <div style={{
            width: 28, height: 46, borderRadius: 14,
            border: '2px solid rgba(255,255,255,0.22)',
            display: 'flex', justifyContent: 'center', paddingTop: 7,
          }}>
            <div style={{
              width: 4, height: 8, borderRadius: 2,
              background: 'rgba(255,255,255,0.5)',
              animation: 'scrollDot 1.7s infinite ease-in-out',
            }} />
          </div>
        </div>
      </section>}



    
      {/* ══ WHAT IS IT (old) ════════════════════════════════════════════ */}
      {false && <section style={{ background: '#063f4a', padding: '96px 28px', position: 'relative', overflow: 'hidden' }}></section>}

      {/* ══ WHAT IS IT (nueva)══════════════════════════════════════════════════ */}
      <section className="bg-gray-50 px-4 md:px-6 overflow-hidden snap-start h-screen flex items-center">
        <div className="w-full max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-20 items-center">

          {/* ── Texto — PRIMERO en móvil, DERECHA en desktop ── */}
          <div className="order-1 md:order-2 max-w-xl">
            {/* Badge + pregunta */}
            <div className="lp-r inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 md:mb-4">
              <span className="text-sm md:text-base font-black text-primary">01</span>
              <span className="w-px h-3.5 bg-primary/30" />
              <span className="text-primary font-extrabold text-[11px] md:text-xs tracking-widest uppercase whitespace-nowrap">
                {t('landing.what_badge')}
              </span>
            </div>

            {/* Titulo */}
            <h2 className="lp-r font-display text-[clamp(22px,5vw,52px)] leading-[1.05] tracking-tight text-navy mb-4 md:mb-6"
              style={{ transitionDelay: '0.12s' }}>
              {t('landing.what_title')}
            </h2>

            {/* Descripcion con Ver mas en movil */}
            <p ref={bodyTextRef} className="lp-r line-clamp-4 md:line-clamp-none text-sm md:text-lg text-gray-600 leading-relaxed max-w-lg text-left"
              style={{ transitionDelay: '0.22s' }}>
              {t('landing.what_body')}
            </p>
            <button
              onClick={() => setTextExpanded(v => !v)}
              className="lp-r md:hidden mt-2 inline-flex items-center gap-1 text-primary font-bold text-sm"
              style={{ transitionDelay: '0.3s' }}
            >
              {textExpanded
                ? <>{t('landing.what_read_less')} <i className="ri-arrow-up-s-line" /></>
                : <>{t('landing.what_read_more')} <i className="ri-arrow-down-s-line" /></>
              }
            </button>
          </div>

          {/* ── Turi + cards — SEGUNDO en móvil, IZQUIERDA en desktop ── */}
          <div className="relative flex justify-center items-center h-[240px] sm:h-[300px] md:h-[520px] order-2 md:order-1">
            {/* Glow detrás del personaje */}
            <div className="absolute bottom-4 md:bottom-10 left-1/2 -translate-x-1/2 w-40 h-40 md:w-64 md:h-64 rounded-full bg-primary/10 blur-3xl" />

            {/* Card: Sin apps */}
            <div className="absolute top-4 left-0 md:top-6 md:-left-6 z-20" style={{ transform: 'rotate(-4deg)' }}>
              <div className="lp-fade" style={{ transitionDelay: '0.15s' }}>
                <div className="bg-white rounded-xl md:rounded-2xl shadow-lg px-2 py-2 md:px-3 md:py-3 flex items-center gap-1.5 md:gap-2.5"
                  style={{ animation: 'floatCard 3.5s ease-in-out infinite', animationDelay: '0s' }}>
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <i className="ri-smartphone-line text-primary text-xs md:text-sm" />
                  </div>
                  <div>
                    <div className="font-semibold text-navy text-[10px] md:text-[12px] leading-tight">{t('landing.card_no_app')}</div>
                    <div className="text-[9px] md:text-[10px] text-gray-400">{t('landing.card_any_browser')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Premios */}
            <div className="absolute top-[42%] right-0 md:top-[45%] md:-right-6 z-20" style={{ transform: 'rotate(3deg)' }}>
              <div className="lp-fade" style={{ transitionDelay: '0.3s' }}>
                <div className="bg-white rounded-xl md:rounded-2xl shadow-lg px-2 py-2 md:px-3 md:py-3 flex items-center gap-1.5 md:gap-2.5"
                  style={{ animation: 'floatCard 4s ease-in-out infinite', animationDelay: '0.8s' }}>
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                    <i className="ri-gift-2-line text-orange-500 text-xs md:text-sm" />
                  </div>
                  <div>
                    <div className="font-semibold text-navy text-[10px] md:text-[12px] leading-tight">{t('landing.card_prizes')}</div>
                    <div className="text-[9px] md:text-[10px] text-gray-400">{t('landing.card_prizes_sub')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Lugares */}
            <div className="absolute bottom-4 left-0 md:bottom-8 md:-left-2 z-20" style={{ transform: 'rotate(-2deg)' }}>
              <div className="lp-fade" style={{ transitionDelay: '0.45s' }}>
                <div className="bg-white rounded-xl md:rounded-2xl shadow-lg px-2 py-2 md:px-3 md:py-3 flex items-center gap-1.5 md:gap-2.5"
                  style={{ animation: 'floatCard 3s ease-in-out infinite', animationDelay: '1.4s' }}>
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <i className="ri-map-pin-2-line text-red-500 text-xs md:text-sm" />
                  </div>
                  <div>
                    <div className="font-semibold text-navy text-[10px] md:text-[12px] leading-tight">{t('landing.card_spots')}</div>
                    <div className="text-[9px] md:text-[10px] text-gray-400">{t('landing.card_spots_sub')}</div>
                  </div>
                </div>
              </div>
            </div>

            <img
              src="/assets/img/turiQueES.webp"
              alt="Turi"
              loading="lazy"
              decoding="async"
              className="lp-r relative z-10 h-[160px] sm:h-[220px] md:h-[450px] w-auto object-contain mt-8 md:mt-16"
              style={{
                maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                backgroundColor: 'transparent',
                WebkitTransform: 'translateZ(0)',
                transitionDelay: '0.08s',
              }}
            />
          </div>

        </div>
      </section>

      {/* ══ HOW TO PARTICIPATE — 8 STEPS (desactivada) ══════════════════ */}
      {false && <section className="snap-start" style={{ background: '#f2f4f8', padding: '96px 24px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="lp-r" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(9,109,125,0.08)', border: '1px solid rgba(9,109,125,0.16)',
              borderRadius: 20, padding: '5px 14px', marginBottom: 14,
            }}>
              <span style={{ color: 'var(--color-primary-dark)', fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
                02 · Paso a paso
              </span>
            </div>
            <h2 className="lp-r" style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 6vw, 42px)',
              color: 'var(--color-primary-dark)', margin: '0 0 8px', transitionDelay: '0.1s',
            }}>
              {t('landing.how_title')}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(275px, 1fr))', gap: 14 }}>
            {steps.map((step, i) => (
              <div key={i} className="lp-r lp-step-card" style={{
                background: '#fff', borderRadius: 18, padding: '18px 18px',
                boxShadow: '0 2px 16px rgba(9,109,125,0.1)',
                display: 'flex', gap: 14, alignItems: 'flex-start',
                transitionDelay: `${(i % 4) * 0.07}s`,
              }}>
                <div style={{
                  flexShrink: 0, width: 44, height: 44, borderRadius: 13,
                  background: 'var(--color-primary-dark)', position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-orange)', fontSize: 21, lineHeight: 1 }}>
                    {i + 1}
                  </span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <i className={step.icon} style={{ color: 'var(--color-primary)', fontSize: 14 }} />
                    <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-primary-dark)' }}>{step.title}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text-muted)', lineHeight: 1.55 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lp-r" style={{ textAlign: 'center', marginTop: 44, transitionDelay: '0.2s' }}>
            <img src="/assets/img/turiguiaSinFondo.webp" alt="" style={{
              width: 'min(150px, 38vw)', height: 'auto',
              filter: 'drop-shadow(0 8px 20px rgba(9,109,125,0.2))',
              animation: 'float 4s ease-in-out infinite',
            }} />
          </div>
        </div>
      </section>}

      {/* ══ HOW TO PARTICIPATE — 8 STEPS (nueva) ═════════════════════ */}
      <section className="snap-start bg-primary-dark py-24 px-6 overflow-hidden relative">
        {/* Background glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/18 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-accent-orange/12 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative">

          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="lp-r inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-2 mb-5">
              <span className="text-sm font-bold uppercase tracking-[2px] text-white/90">
                {t('landing.badge_how')}
              </span>
            </div>
            <h2 className="lp-r font-display text-[clamp(32px,6vw,54px)] text-white leading-[1.05] mb-30"
              style={{ transitionDelay: '0.12s' }}>
              {t('landing.how_title')}
            </h2>
          </div>

          {/* Desktop — 4×2 grid */}
          <div className="hidden lg:grid grid-cols-4 gap-5">
            {steps.map((step, i) => (
              <div key={i} className="lp-r relative bg-white rounded-[28px] p-6 overflow-hidden shadow-xl hover:-translate-y-1 transition-all duration-300"
                style={{ transitionDelay: `${0.05 + (i % 4) * 0.1}s` }}>
                {/* Step number top-right */}
                <div className="absolute top-4 right-5 font-display text-[52px] leading-none font-bold text-yellow">
                  {String(i + 1).padStart(2, '0')}
                </div>
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl bg-primary-dark/10 flex items-center justify-center mb-4 mt-1">
                  <i className={`${step.icon} text-xl text-primary-dark`} />
                </div>
                <h3 className="font-bold text-primary-dark text-[15px] mb-2 leading-snug">{step.title}</h3>
                <p className="text-gray-500 text-[13px] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Mobile — cards */}
          <div className="lg:hidden space-y-4 max-w-md mx-auto">
            {steps.map((step, i) => (
              <div key={i} className="lp-r bg-white rounded-[24px] shadow-xl overflow-hidden flex"
                style={{ transitionDelay: `${i * 0.08}s` }}>
                {/* Contenido izquierdo */}
                <div className="flex-1 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <i className={`${step.icon} text-[18px] text-primary-dark shrink-0`} />
                    <h3 className="font-bold text-primary-dark text-sm leading-snug">{step.title}</h3>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed">{step.desc}</p>
                </div>
                {/* Línea vertical divisoria */}
                <div className="w-px bg-primary-dark/10 my-4" />
                {/* Número derecho */}
                <div className="flex items-center justify-center px-5">
                  <span className="font-display text-[40px] leading-none font-bold text-yellow">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══ THE 3 STAGES (desactivada) ══════════════════════════════════ */}
      {false && <section className="snap-start" style={{ background: '#054f5c', padding: '96px 24px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,187,180,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 680, margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="lp-r" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,148,71,0.15)', border: '1px solid rgba(255,148,71,0.35)',
              borderRadius: 20, padding: '5px 16px', marginBottom: 14,
            }}>
              <i className="ri-map-2-line" style={{ color: 'var(--color-accent-orange)', fontSize: 12 }} />
              <span style={{ color: 'var(--color-accent-orange)', fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
                03 · Recorrido
              </span>
            </div>
            <h2 className="lp-r" style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 6vw, 42px)',
              color: '#fff', margin: 0, transitionDelay: '0.1s',
            }}>
              {t('landing.stages_title')}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {stages.map((stage, i) => (
              <div key={i} className="lp-r lp-stage-card" style={{
                background: 'rgba(255,255,255,0.07)',
                border: '2px solid rgba(255,255,255,0.55)',
                borderLeft: `5px solid ${stage.color}`,
                borderRadius: 20, padding: '22px 24px',
                display: 'flex', alignItems: 'center', gap: 20,
                backdropFilter: 'blur(8px)',
                boxShadow: `0 4px 28px rgba(0,0,0,0.18), 0 0 0 1px ${stage.color}22`,
                transitionDelay: `${i * 0.1}s`,
              }}>
                <div style={{
                  flexShrink: 0, width: 60, height: 60, borderRadius: 18,
                  background: `linear-gradient(135deg, ${stage.color} 0%, ${stage.color}bb 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 6px 20px ${stage.color}55`,
                }}>
                  <span style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: 28, lineHeight: 1 }}>{stage.n}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-display)', color: stage.color, fontSize: 22 }}>{stage.label}</span>
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>· {stage.sub}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {[
                      { icon: 'ri-question-line', text: `${stage.q} ${t('landing.stage_q')}` },
                      { icon: 'ri-map-pin-line',  text: `${stage.stops} ${t('landing.stage_stops')}` },
                      { icon: 'ri-gift-2-line',   text: stage.prize },
                      { icon: 'ri-user-3-line',   text: t('landing.stage_age') },
                    ].map((feat, j) => (
                      <span key={j} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: `${stage.color}18`,
                        border: `1px solid ${stage.color}30`,
                        borderRadius: 20, padding: '4px 11px',
                      }}>
                        <i className={feat.icon} style={{ color: stage.color, fontSize: 11 }} />
                        <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{feat.text}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>}

      {/* ══ THE 3 STAGES (nueva, solo Tailwind) ═════════════════════════ */}
      <section className="snap-start bg-white pt-16 pb-55 px-4 relative overflow-hidden mt-20">
        <div className="max-w-sm lg:max-w-5xl mx-auto">

          {/* Header */}
          <div className="text-center mb-35">
            <div className="lp-r inline-flex items-center gap-2 bg-primary/15 border border-primary/35 rounded-full px-4 py-1.5 mb-4">
              <span className="text-primary text-sm font-extrabold tracking-[2px] uppercase">
                {t('landing.badge_stages')}
              </span>
            </div>
            <h2 className="lp-r font-display text-[clamp(34px,6vw,58px)] text-navy m-0 delay-100">
              {t('landing.stages_title')}
            </h2>
          </div>

          {(() => {
            const sHex  = ['#00bbb4', '#ff9447', '#f5c800']
            const sGrad = ['#00827d', '#d95c0a', '#d4a017']
            const sSub  = [t('landing.stage_route_0'), t('landing.stage_route_1'), t('landing.stage_route_2')]

            const StageCard = ({ stage, i, pipDir, pipH }: { stage: typeof stages[0], i: number, pipDir: 'right' | 'left' | 'down' | 'up', pipH?: { left?: number | string, right?: number | string } }) => {
              const pipColor = (pipDir === 'up' || pipDir === 'left') ? sHex[i] : sGrad[i]
              const hPos: React.CSSProperties = pipH ?? { left: '50%', transform: 'translateX(-50%)' }
              const pipStyle: React.CSSProperties =
                pipDir === 'right'
                  ? { right: -10, top: '50%', transform: 'translateY(-50%)', borderTop: '9px solid transparent', borderBottom: '9px solid transparent', borderLeft: `10px solid ${pipColor}` }
                  : pipDir === 'left'
                  ? { left: -10, top: '50%', transform: 'translateY(-50%)', borderTop: '9px solid transparent', borderBottom: '9px solid transparent', borderRight: `10px solid ${pipColor}` }
                  : pipDir === 'down'
                  ? { bottom: -10, ...hPos, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: `10px solid ${pipColor}` }
                  : { top: -10, ...hPos, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: `10px solid ${pipColor}` }
              return (
                <div className="relative" style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.18))' }}>
                  <div
                    className="relative overflow-hidden rounded-2xl"
                    style={{ background: `linear-gradient(145deg, ${sHex[i]}, ${sGrad[i]})` }}
                  >
                    <div
                      className="absolute bottom-2 right-3 font-display leading-none select-none pointer-events-none"
                      style={{ fontSize: 70, color: 'rgba(255,255,255,0.10)', zIndex: 0 }}
                    >
                      0{stage.n}
                    </div>
                    <div className="relative p-5 lg:p-7 flex flex-col gap-2.5 lg:gap-4" style={{ zIndex: 1 }}>
                      {/* Ícono a la izquierda de título + subtítulo apilados */}
                      <div className="flex items-start gap-2.5 lg:gap-3">
                        <div className="w-9 h-9 lg:w-12 lg:h-12 shrink-0 rounded-full bg-white/20 border border-white/25 flex items-center justify-center mt-0.5">
                          <i className="ri-flag-fill text-white text-[15px] lg:text-[20px]" />
                        </div>
                        <div>
                          <div className="font-display text-white text-[19px] lg:text-[26px] leading-tight">{stage.label}</div>
                          <div className="text-white/70 text-[10.5px] lg:text-[14px] mt-0.5 leading-snug">{sSub[i]}</div>
                        </div>
                      </div>
                      {/* Divisor */}
                      <div className="h-px bg-white/20" />
                      {/* Stats: paradas, preguntas + validación de edad */}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 lg:gap-y-2 text-white/70 text-[10px] lg:text-[13px]">
                        <div className="flex items-center gap-1">
                          <i className="ri-map-pin-2-line text-[11px] lg:text-[14px]" />
                          <span>{stage.stops} {t('landing.stage_stops')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <i className="ri-question-line text-[11px] lg:text-[14px]" />
                          <span>{stage.q} {t('landing.stage_q')}</span>
                        </div>
                        <div className="flex items-center gap-1 col-span-2">
                          <i className="ri-user-3-line text-[11px] lg:text-[14px]" />
                          <span>{t('landing.stage_age')}</span>
                        </div>
                      </div>
                      {/* Premio — una sola línea */}
                      <div className="flex items-center gap-1.5 bg-white/20 border border-white/25 rounded-xl px-3 py-2 lg:px-4 lg:py-3">
                        <i className="ri-gift-2-line text-white/90 text-[10px] lg:text-[14px] shrink-0" />
                        <span className="text-white text-[9px] lg:text-[13px] font-semibold whitespace-nowrap">{stage.prize}</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute w-0 h-0" style={pipStyle} />
                </div>
              )
            }

            return (
              <>
                {/* ═══ MOBILE: serpentina vertical ═══ */}
                <div className="lg:hidden relative h-[900px]">
                  <svg
                    aria-hidden
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 352 900"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M 270 150 C 270 345, 82 255, 82 450 C 82 640, 270 640, 270 750"
                      fill="none" stroke="#dde1eb" strokeWidth="2.5"
                      strokeDasharray="8 8" strokeLinecap="round"
                      style={{
                        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
                        maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)'
                      }}
                    />
                    <circle cx="270" cy="150" r="14" fill="white" stroke="#00bbb4" strokeWidth="3" />
                    <circle cx="270" cy="150" r="6"  fill="#00bbb4" />
                    <circle cx="82"  cy="450" r="14" fill="white" stroke="#ff9447" strokeWidth="3" />
                    <circle cx="82"  cy="450" r="6"  fill="#ff9447" />
                    <circle cx="270" cy="750" r="14" fill="white" stroke="#f5c800" strokeWidth="3" />
                    <circle cx="270" cy="750" r="6"  fill="#f5c800" />
                  </svg>

                  <div className="relative flex flex-col">
                    {stages.map((stage, i) => {
                      const cardOnLeft = i % 2 === 0
                      return (
                        <div key={i} className="lp-r h-[300px] flex items-center gap-8"
                             style={{ transitionDelay: `${i * 0.15}s` }}>
                          <div className={`${cardOnLeft ? 'order-1' : 'order-2'} w-[226px] shrink-0`}>
                            <StageCard stage={stage} i={i} pipDir={cardOnLeft ? 'right' : 'left'} />
                          </div>
                          <div className={`${cardOnLeft ? 'order-2' : 'order-1'} flex-1`} />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* ═══ DESKTOP: horizontal ═══ */}
                <div className="hidden lg:block relative">
                  <div
                    className="absolute left-0 right-0 pointer-events-none"
                    style={{
                      top: 316,
                      height: 2,
                      backgroundImage: 'repeating-linear-gradient(90deg,#dde1eb 0,#dde1eb 8px,transparent 8px,transparent 16px)',
                      WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                      maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                    }}
                  />
                  <div className="flex" style={{ position: 'relative', zIndex: 1 }}>
                    {stages.map((stage, i) => {
                      const hAlign = 'items-center'
                      const pipH = undefined
                      return (
                        <div key={i} className={`lp-r flex-1 flex flex-col ${hAlign}`}
                             style={{ transitionDelay: `${i * 0.15}s` }}>
                          <div className={`h-[300px] w-full flex flex-col ${hAlign} justify-end pb-14`}>
                            <div className="w-[280px]">
                              <StageCard stage={stage} i={i} pipDir="down" pipH={pipH} />
                            </div>
                          </div>

                          <div
                            className="relative z-10 w-8 h-8 rounded-full bg-white shrink-0 flex items-center justify-center"
                            style={{ border: `3px solid ${sHex[i]}` }}
                          >
                            <div className="w-3.5 h-3.5 rounded-full" style={{ background: sHex[i] }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )
          })()}
        </div>
      </section>

      {/* ══ THE STOPS ═══════════════════════════════════════════════════ */}
      {false && (
      <section className="snap-start" style={{ background: '#fff', padding: '96px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="lp-r" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(9,109,125,0.07)', border: '1px solid rgba(9,109,125,0.14)',
              borderRadius: 20, padding: '5px 14px', marginBottom: 14,
            }}>
              <span style={{ color: 'var(--color-primary-dark)', fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
                04 · Mapa del recorrido
              </span>
            </div>
            <h2 className="lp-r" style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 6vw, 42px)',
              color: 'var(--color-primary-dark)', margin: 0, transitionDelay: '0.1s',
            }}>
              {t('landing.stops_title')}
            </h2>
          </div>

          <div className="lp-r" style={{
            background: 'var(--color-primary-dark)', borderRadius: 24, overflow: 'hidden',
            marginBottom: 24, padding: '28px 24px', position: 'relative',
            transitionDelay: '0.1s',
          }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, position: 'relative', justifyContent: 'center' }}>
              {['Alcázar de Colón', 'Casas Reales', 'Panteón de la Patria', 'Fortaleza Ozama', 'Catedral Primada', 'Altagracia', 'Regina Angelorum', 'Escalinatas El Conde', 'Calle Pellerano Alfau', 'Calle Las Damas', 'Plaza Mª de Toledo', 'Reloj de Sol', 'Puerta de San Diego', 'Plaza de España', 'Ruinas San Nicolás', 'Plaza Tirso de Molina — Las Mercedes', 'Calle El Conde — Saviñón', 'Parque Duarte — Dominicos'].map((place, i) => (
                <div key={i} className="lp-stop-pin" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 20, padding: '7px 14px',
                  animationDelay: `${i * 0.15}s`,
                }}>
                  <i className="ri-map-pin-fill" style={{ color: 'var(--color-accent-orange)', fontSize: 12 }} />
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{place}</span>
                </div>
              ))}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center', margin: '16px 0 0', letterSpacing: 0.5 }}>
              {lang === 'es' ? '18 paradas · Zona Colonial, Santo Domingo' : '18 stops · Colonial Zone, Santo Domingo'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stops.map((s, i) => (
              <div key={i} className="lp-r lp-stop-card" style={{
                background: '#f9f7f4',
                borderRadius: 18, padding: '20px',
                display: 'flex', gap: 16, alignItems: 'flex-start',
                border: '1px solid rgba(9,109,125,0.1)',
                transitionDelay: `${i * 0.08}s`,
              }}>
                <div style={{ fontSize: 30, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{s.icon}</div>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 6, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {s.cat}
                    <span style={{
                      fontSize: 11, background: 'rgba(0,187,180,0.1)', color: 'var(--color-primary)',
                      border: '1px solid rgba(0,187,180,0.22)', borderRadius: 20,
                      padding: '2px 8px', fontWeight: 700,
                    }}>
                      {t('landing.stops_scalable')} ✓
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{s.places}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ══ THE STOPS · TAILWIND nueva ════════════════════════════════════════ */}


      {/* ══ STATS BAND ════════════════════════════════════════════ */}
      <div ref={statsRef} className="bg-primary-dark py-8 md:py-10 px-4 my-15 relative">
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_2px_2px,white_2px,transparent_0)] bg-size-[28px_28px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Mobile: grid 2×2 — Desktop: fila horizontal */}
          <div className="grid grid-cols-2 gap-6 md:hidden">
            {([
              { icon: 'ri-map-pin-2-line', label: t('landing.stats_stops') },
              { icon: 'ri-trophy-line',    label: t('landing.stats_stages') },
              { icon: 'ri-question-line',  label: t('landing.stats_quizz') },
              { icon: 'ri-global-line',    label: t('landing.stats_langs') },
            ] as const).map((s, i) => (
              <div key={i} className="lp-r flex items-center gap-3 justify-center"
                style={{ transitionDelay: `${i * 0.1}s` }}>
                <span className="font-display text-5xl font-black text-white leading-none tabular-nums">
                  {counters[i]}
                </span>
                <div className="flex flex-col gap-1">
                  <i className={`${s.icon} text-white/40 text-base leading-none`} />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/50 whitespace-nowrap">{s.label}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:flex items-center justify-center">
            {([
              { icon: 'ri-map-pin-2-line', label: t('landing.stats_stops') },
              { icon: 'ri-trophy-line',    label: t('landing.stats_stages') },
              { icon: 'ri-question-line',  label: t('landing.stats_quizz') },
              { icon: 'ri-global-line',    label: t('landing.stats_langs') },
            ] as const).map((s, i) => (
              <Fragment key={i}>
                {i > 0 && (
                  <div className="shrink-0 mx-7 md:mx-10 w-px h-10 md:h-14"
                    style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.22) 30%, rgba(255,255,255,0.22) 70%, transparent 100%)' }} />
                )}
                <div className="lp-r flex items-center gap-5"
                  style={{ transitionDelay: `${i * 0.1}s` }}>
                  <span className="font-display text-5xl lg:text-7xl font-black text-white leading-none tabular-nums">
                    {counters[i]}
                  </span>
                  <div className="flex flex-col gap-1">
                    <i className={`${s.icon} text-white/40 text-[22px] leading-none`} />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-white/50 whitespace-nowrap">{s.label}</span>
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      <section className="snap-start bg-white pt-52 pb-24 px-6">
        <div className="max-w-[720px] mx-auto">
          <div className="text-center mb-10">
            <div className="lp-r inline-flex items-center gap-2 bg-primary/7 border border-primary/15 rounded-full px-3.5 py-1 mb-3.5">
              <span className="text-primary text-sm font-extrabold tracking-wider uppercase">
                {t('landing.badge_stops')}
              </span>
            </div>
            <h2 className="lp-r font-display text-primary-dark m-0" style={{ fontSize: 'clamp(28px, 6vw, 42px)', transitionDelay: '0.12s' }}>
              {t('landing.stops_title')}
            </h2>
          </div>

          <div className="lp-r rounded-3xl overflow-hidden mb-6 relative min-h-[340px] md:min-h-[520px] border border-primary-dark/10"
            style={{ transitionDelay: '0.2s' }}>
            <div
              className="absolute inset-0 opacity-100 bg-cover bg-center pointer-events-none"
              style={{ backgroundImage: 'url(/assets/img/mapaZona.webp)' }}
            />
            {/* Gradient overlay: right dark (river) → left clear (city) */}
            <div className="absolute inset-0 pointer-events-none z-1 [background:linear-gradient(to_left,rgba(9,109,125,0.92)_0%,rgba(9,109,125,0.5)_30%,transparent_58%)]" />

            {/* Ciudad Colonial label */}
            <div className="absolute bottom-6 right-5 z-10 pointer-events-none text-right">
              <span className="font-display text-white font-black text-[clamp(11px,2vw,16px)] uppercase tracking-[3px] [text-shadow:0_2px_12px_rgba(0,0,0,0.3)]">
                Ciudad Colonial
              </span>
            </div>
            {/* Mobile layout: flex wrap */}
            {/* Pins: absolutely positioned on the map (all screen sizes) */}
            <div className="block absolute inset-0">
              {[
                // ── Museos (cat 0) ──────────────────────────────────────
                { name: 'Alcázar de Colón',    x: '50%', y: '55%', cat: 0 },
                { name: 'Casas Reales',         x: '40%', y: '35%', cat: 0 },
                { name: 'Panteón de la Patria', x: '38%', y: '44%', cat: 0 },
                { name: 'Fortaleza Ozama',      x: '46%', y: '65%', cat: 0 },
                // ── Templos e iglesias (cat 1) ──────────────────────────
                { name: 'Catedral Primada',     x: '25%', y: '30%', cat: 1 },
                { name: 'Altagracia',           x: '22%', y: '46%', cat: 1 }, // Lado oeste
                { name: 'Regina Angelorum',     x: '27%', y: '60%', cat: 1 }, // Suroeste
                // ── Parques y monumentos (cat 2) ────────────────────────
                { name: 'Escalinatas El Conde', x: '25%', y: '75%', cat: 2 }, // Entrada oeste El Conde
                { name: 'Pellerano Alfau',      x: '25%', y: '19%', cat: 2 }, // Norte, zona Alcázar
                { name: 'Calle Las Damas',      x: '50%', y: '63%', cat: 2 }, // Calle este N-S
                { name: 'Plaza Mª de Toledo',   x: '20%', y: '40%', cat: 2 }, // Plaza España area
                { name: 'Reloj de Sol',         x: '35%', y: '60%', cat: 2 }, // Norte de Casas Reales
                { name: 'Puerta de San Diego',  x: '55%', y: '53%', cat: 2 }, // Noreste, cerca Fortaleza
                { name: 'Plaza de España',      x: '16%', y: '60%', cat: 2 }, // Noreste, río
                { name: 'Ruinas San Nicolás',   x: '38%', y: '30%', cat: 2 }, // Centro-norte
                { name: 'El Conde · Saviñón',  x: '42%', y: '43%', cat: 2 }, // Calle El Conde centro
              ]
              .filter(place => place.cat === activeStopTab)
              .map((place, i) => (
                <div
                  key={i}
                  className="lp-stop-pin absolute -translate-x-1/2 -translate-y-full flex flex-col items-center cursor-pointer group hover:z-20 transition-all duration-200"
                  style={{ top: place.y, left: place.x, animationDelay: `${i * 0.08}s` }}
                >
                  {/* Círculo con ícono */}
                  <div className="w-9 h-9 rounded-full bg-primary-dark border-2 border-white/30 shadow-[0_4px_14px_rgba(0,0,0,0.35)] flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: 18 }}>{stops[activeStopTab].icon}</span>
                  </div>
                  {/* Puntero */}
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-[6px] border-l-transparent border-r-transparent border-t-primary-dark" />
                  {/* Etiqueta */}
                  <div className="mt-0.5 bg-primary-dark text-white text-[8px] lg:text-[9px] font-semibold px-2 py-[2px] rounded-full whitespace-nowrap shadow-lg">
                    {place.name}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Category Selector Tabs */}
          <div className="lp-r flex gap-2 mb-5" style={{ transitionDelay: '0.3s' }}>
            {stops.map((s, i) => {
              const isActive = activeStopTab === i
              return (
                <button
                  key={i}
                  onClick={() => setActiveStopTab(i)}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-2xl font-bold text-[11px] md:text-[12px] transition-all duration-200 cursor-pointer border-2 ${
                    isActive
                      ? 'bg-primary-dark/10 text-primary-dark border-primary-dark shadow-md scale-[1.03]'
                      : 'bg-white text-primary-dark border-primary-dark/10 hover:border-primary-dark/25 hover:bg-primary-dark/5 shadow-sm'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 26 }}>{s.icon}</span>
                  <span className="text-center leading-snug">{s.cat}</span>
                </button>
              )
            })}
          </div>

          {/* Tab Content: Active Category Card */}
          {(() => {
            const s = stops[activeStopTab]
            if (!s) return null
            const placeList = s.places.split(' · ')
            return (
              <div
                key={activeStopTab}
                className="bg-white rounded-3xl overflow-hidden shadow-xl border border-primary-dark/8 animate-fade-in"
              >
                {/* Card Header */}
                <div className="bg-primary-dark px-6 py-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: 24 }}>{s.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/50 text-[9px] font-extrabold tracking-[2px] uppercase mb-0.5">{t('landing.stop_category_label')}</p>
                    <h3 className="text-white font-extrabold text-[17px] leading-tight">{s.cat}</h3>
                  </div>
                  <div className="shrink-0">
                    <span className="bg-yellow text-primary-dark text-[9px] font-extrabold px-3 py-1.5 rounded-full tracking-wide uppercase">
                      {t('landing.stop_count', { n: placeList.length })}
                    </span>
                  </div>
                </div>

                {/* Places Grid */}
                <div className="p-5 md:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {placeList.map((place, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-[#f9f7f4] hover:bg-primary-dark/6 transition-colors group">
                        <div className="w-7 h-7 rounded-full bg-primary-dark/10 flex items-center justify-center shrink-0 group-hover:bg-primary-dark/20 transition-colors">
                          <i className="ri-map-pin-2-fill text-primary-dark text-[11px]" />
                        </div>
                        <span className="font-semibold text-primary-dark text-[12.5px] leading-snug">{place}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </section>

      {/* ══ CTA ═════════════════════════════════════════════════════════ */}
      {false && (
      <section 
        className="lp-hero-bg-section"
        style={{
          padding: '120px 24px min(38dvh, 320px)',
          position: 'relative', overflow: 'hidden', textAlign: 'center',
        }}
      >
        {/* Glow behind buildings */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1, pointerEvents: 'none',
          height: 'min(38dvh, 320px)',
          background: 'radial-gradient(circle at 50% 100%, rgba(255, 168, 38, 0.22) 0%, transparent 70%)'
        }} />

        {/* Logos at the bottom of the section */}
        <div style={{
          position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 4,
        }}>
          <img
            src="/assets/img/LogoMultiple.webp"
            alt="Ministerio de Turismo · República Dominicana"
            style={{
              height: 220,
              width: 'auto',
              display: 'block',
              filter: 'brightness(0) invert(1)',
              opacity: 0.9,
            }}
          />
        </div>

        <div style={{
          maxWidth: '560px',
          margin: '0 auto',
          background: 'rgba(6, 63, 74, 0.65)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '36px 28px',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
          position: 'relative',
          zIndex: 3
        }}>
          {/* Mascot in CTA */}
          <div className="lp-r" style={{ position: 'relative', zIndex: 3, marginBottom: 20 }}>
            <img src="/assets/img/turiguiaSinFondo.webp" alt="" style={{
              width: 'min(150px, 35vw)', height: 'auto',
              filter: 'drop-shadow(0 8px 28px rgba(0,0,0,0.25))',
              display: 'inline-block',
              animation: 'float 4.2s ease-in-out infinite',
            }} />
          </div>

          <h2 className="lp-r" style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 7vw, 56px)',
            color: '#fff', margin: '0 0 14px', position: 'relative', zIndex: 3,
            transitionDelay: '0.1s', textShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            {t('landing.cta_title')}
          </h2>

          <p className="lp-r" style={{
            color: '#f2f4f8', fontSize: 16, maxWidth: 420,
            margin: '0 auto 36px', lineHeight: 1.6, position: 'relative', zIndex: 3,
            transitionDelay: '0.18s', fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}>
            {t('landing.cta_body')}
          </p>

          <div className="lp-r" style={{
            display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
            position: 'relative', zIndex: 3, transitionDelay: '0.26s',
          }}>
            <Link to="/register"
              className="lp-cta-btn"
              style={{
                background: 'linear-gradient(to bottom, #ffc060, #ffa826)', color: '#fff',
                padding: '14px 34px', borderRadius: 24, fontWeight: 900, fontSize: 16,
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
                boxShadow: '0 8px 24px rgba(255,168,38,0.4)', border: '1px solid rgba(255,255,255,0.2)',
                textTransform: 'uppercase', letterSpacing: '0.5px'
              }}
            >
              <i className="ri-rocket-line" style={{ fontSize: 18 }} />
              {t('landing.cta_register')}
            </Link>
            <Link to="/login" style={{
              background: 'rgba(255,255,255,0.15)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.25)',
              padding: '14px 28px', borderRadius: 24, fontWeight: 800, fontSize: 15,
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              {t('landing.cta_login')}
            </Link>
          </div>
        </div>

        <p style={{ color: '#ffffff', fontSize: 11, marginTop: 70, letterSpacing: 0.5, position: 'relative', zIndex: 3, fontWeight: 800, opacity: 0.8, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
          Turizoneando · MITUR · Ciudad Colonial, Santo Domingo
        </p>
        <div style={{ height: 'var(--safe-bottom)' }} />
      </section>
      )}

      {/* ── Global styles & animations ──────────────────────────────── */}
      <style>{`
        /* ── Keyframes ──────────────────────────── */
        @keyframes liveBlip {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(74,222,128,0.7); }
          50%       { opacity: 0.8; transform: scale(1.15); box-shadow: 0 0 0 5px rgba(74,222,128,0); }
        }
        @keyframes shimmerMove {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes twinkle {
          from { opacity: 0.15; transform: scale(0.7); }
          to   { opacity: 1;    transform: scale(1.4); }
        }
        @keyframes scrollDot {
          0%, 100% { transform: translateY(0);    opacity: 0.4; }
          50%       { transform: translateY(10px); opacity: 1;  }
        }
        @keyframes float {
          0%,  100% { transform: translateY(0px)   rotate(-1deg); }
          50%        { transform: translateY(-20px) rotate(1.5deg); }
        }
        @keyframes floatCard {
          0%,  100% { transform: translateY(0px); }
          50%        { transform: translateY(-8px); }
        }
        @keyframes blobDrift {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(30px, -20px) scale(1.06); }
        }
        @keyframes pulseGlow {
          0%,  100% { transform: scale(1);    opacity: 0.7; }
          50%        { transform: scale(1.09); opacity: 1;  }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(130px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(130px) rotate(-360deg); }
        }
        @keyframes orbit2 {
          from { transform: rotate(180deg) translateX(90px) rotate(-180deg); }
          to   { transform: rotate(540deg) translateX(90px) rotate(-540deg); }
        }
        @keyframes shimmerNum {
          0%   { opacity: 0.6; }
          50%  { opacity: 1;   }
          100% { opacity: 0.6; }
        }
        @keyframes pinPop {
          0%   { opacity: 0; transform: scale(0.6) translateY(6px); }
          70%  { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ── Hero nuevas entradas ───────────────── */
        @keyframes heroNewIn {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroMascotNewIn {
          from { opacity: 0; transform: translateY(50px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Reveal classes ─────────────────────── */
        .lp-r {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1), transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .lp-r.lp-on { opacity: 1; transform: none; }

        .lp-rl {
          opacity: 0;
          transform: translateX(-36px);
          transition: opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1), transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .lp-rl.lp-on { opacity: 1; transform: none; }

        .lp-rr {
          opacity: 0;
          transform: translateX(36px);
          transition: opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1), transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .lp-rr.lp-on { opacity: 1; transform: none; }

        .lp-fade {
          opacity: 0;
          transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .lp-fade.lp-on { opacity: 1; }

        /* ── Hero buttons ───────────────────────── */
        .lp-hero-btns {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: stretch;
          width: 100%;
        }
        .lp-hero-btn {
          justify-content: center !important;
          white-space: nowrap;
          box-sizing: border-box;
        }
        @media (min-width: 760px) {
          .lp-hero-btns {
            flex-direction: row;
            align-items: center;
            width: auto;
            flex-wrap: wrap;
          }
          .lp-hero-btn {
            justify-content: flex-start !important;
          }
        }

        /* ── Nav wordmark (hidden on mobile) ───── */
        .lp-nav-wordmark {
          display: none;
        }

        /* ── Hero entrance animations ───────────── */
        @keyframes heroCardIn {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes heroMascotIn {
          from { opacity: 0; transform: translateY(60px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .lp-hero-content {
          animation: heroCardIn 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .lp-hero-mascot-col {
          animation: heroMascotIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both;
        }
        .lp-mascot-float {
          animation: float 4.2s ease-in-out infinite, heroMascotIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both;
        }

        /* ── Hero logo ───────────────────────── */
        .lp-hero-logo {
          width: min(480px, 100vw);
          margin: -80px 0 -90px -44px;
        }

        /* ── Section Backgrounds ────────────────── */
        .lp-hero-bg-section {
          background-image: linear-gradient(to bottom, rgba(6, 63, 74, 0.72) 0%, rgba(46, 171, 173, 0.08) 100%), url('/assets/img/hero_bg_mobile.webp');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        @media (min-width: 760px) {
          .lp-hero-bg-section {
            background-image: linear-gradient(to bottom, rgba(6, 63, 74, 0.68) 0%, rgba(46, 171, 173, 0.06) 100%), url('/assets/img/hero_bg_desktop.webp');
          }
        }

        /* ── Hero layout ────────────────────────── */
        .lp-hero-wrap {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          min-height: 100dvh;
          width: 100%;
          padding: calc(var(--safe-top, 0px) + 84px) 28px 80px;
          position: relative;
          z-index: 2;
          box-sizing: border-box;
        }
        .lp-hero-content {
          width: 100%;
          max-width: 480px;
          position: relative;
          z-index: 3;
        }
        .lp-hero-pills {
          max-width: calc(100% - clamp(148px, 42vw, 290px));
        }
        .lp-hero-mascot-col {
          position: absolute;
          right: 0;
          bottom: 0;
          width: clamp(130px, 40vw, 220px);
          pointer-events: none;
          z-index: 4;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        /* card inner content: leave room for mascot on mobile */
        .lp-hero-inner {
          padding-right: clamp(110px, 36vw, 200px);
        }
        .lp-mascot-glow-ring {
          position: absolute;
          bottom: 8%;
          left: 50%;
          transform: translateX(-50%);
          width: clamp(160px, 46vw, 300px);
          height: clamp(160px, 46vw, 300px);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,148,71,0.28) 0%, rgba(0,187,180,0.15) 45%, transparent 70%);
          filter: blur(6px);
          animation: pulseGlow 3.5s ease-in-out infinite;
        }
        .lp-mascot-float {
          width: 100%;
          height: auto;
          display: block;
          filter: drop-shadow(0 -4px 32px rgba(0,0,0,0.2));
          animation: float 4.2s ease-in-out infinite;
          position: relative;
          z-index: 1;
        }
        .lp-orbit-wrap {
          position: absolute;
          bottom: 35%;
          left: 50%;
          width: 0; height: 0;
          animation: orbit 8s linear infinite;
          z-index: 2;
        }
        .lp-orbit-2 {
          animation: orbit2 12s linear infinite;
          bottom: 42%;
        }

        /* ── Hero title gradient ────────────────── */
        .lp-title-hero {
          background: linear-gradient(135deg, #ff9447 0%, #ffffff 55%, #e0344b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Hero title gradient ─────────────────── */
        .lp-hero-title-gradient {
          background: linear-gradient(125deg, #ffc060 0%, #ffffff 55%, #ff9447 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: none !important;
        }

        /* ── CTA shimmer ─────────────────────────── */
        .lp-cta-btn {
          position: relative;
          overflow: hidden;
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .lp-cta-btn::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.28) 50%, transparent 60%);
          transform: translateX(-100%);
          animation: shimmerMove 3s ease-in-out infinite 1.2s;
        }
        .lp-cta-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 14px 40px rgba(224,52,75,0.5) !important;
        }

        /* ── Card hovers ────────────────────────── */
        .lp-step-card {
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .lp-step-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 30px rgba(9,109,125,0.15) !important;
        }
        .lp-stage-card {
          transition: transform 0.22s ease, background 0.22s ease;
        }
        .lp-stage-card:hover {
          transform: translateY(-3px);
          background: rgba(255,255,255,0.07) !important;
        }
        .lp-stop-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .lp-stop-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(9,109,125,0.12);
        }

        /* ── Stop pin pop animation ─────────────── */
        .lp-stop-pin {
          animation: pinPop 0.5s cubic-bezier(.34,1.56,.64,1) both;
        }

        /* ── Stats shimmer on run ───────────────── */
        .lp-stat-item {
          transition: transform 0.2s ease;
        }
        .lp-stat-item:hover {
          transform: scale(1.06);
        }

        /* ── What-is-it grid ────────────────────── */
        .lp-what-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
          align-items: center;
        }
        .lp-mascot-col { display: block; }

        /* ── Desktop breakpoints ────────────────── */
        @media (min-width: 760px) {
          .lp-nav-wordmark {
            display: block;
          }
          .lp-hero-inner {
            padding-right: 28px;
          }
          .lp-hero-logo {
            width: min(520px, 90%);
            margin: -120px 0 -128px -72px;
          }
          .lp-hero-wrap {
            flex-direction: row;
            align-items: center;
            padding: calc(var(--safe-top, 0px) + 90px) 60px 60px;
            max-width: 1100px;
            margin: 0 auto;
            gap: 24px;
          }
          .lp-hero-content {
            flex: 1;
            max-width: 520px;
          }
          .lp-hero-pills {
            max-width: none;
          }
          .lp-hero-mascot-col {
            position: relative;
            right: auto;
            bottom: auto;
            width: 340px;
            flex-shrink: 0;
            align-self: center;
            margin-top: 80px;
          }
          .lp-what-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (min-width: 1024px) {
          .lp-hero-mascot-col {
            width: 400px;
          }
          .lp-hero-content { max-width: 560px; }
        }
      `}</style>


  {/* ── Footer visual ── */}
  <section className="relative w-full overflow-hidden" style={{ background: 'linear-gradient(to bottom, #00d4cc, #054f5c)' }}>

    <div className="w-full px-4 sm:px-8 pt-12 pb-10 md:py-16 flex flex-col md:flex-row items-center md:items-start text-center md:text-left justify-between max-w-md md:max-w-4xl mx-auto gap-6 relative z-10 mt-10">

      {/* Izquierda: Textos y Botones */}
      <div className="flex-1 flex flex-col items-center md:items-start z-10 w-full">
        <h2 className="lp-r text-[1.5rem] sm:text-3xl md:text-[2.8rem] font-black text-white tracking-tight leading-none uppercase mb-4 whitespace-nowrap">
          {t('landing.cta_footer_title')}
        </h2>

        <p className="lp-r text-xs sm:text-sm md:text-lg text-[#0a2857] max-w-lg font-medium mb-8 leading-snug"
          style={{ transitionDelay: '0.12s' }}>
          {t('landing.cta_footer_body')}
        </p>

        <div className="lp-r flex flex-col sm:flex-row gap-4 w-full max-w-[280px] sm:max-w-md justify-center md:justify-start items-center"
          style={{ transitionDelay: '0.24s' }}>
          {/* Registro */}
          <Link
            to="/register"
            className="w-full sm:flex-1 uppercase font-black text-xs md:text-sm tracking-wider text-white rounded-full py-4 bg-[radial-gradient(circle,#ffc060_0%,#fca330_100%)] shadow-[5px_5px_10px_rgba(0,0,0,0.65)] hover:brightness-105 transition-all text-center"
          >
            {t('landing.cta_footer_register')}
          </Link>

          {/* Login */}
          <Link
            to="/login"
            className="w-full sm:flex-1 uppercase font-black text-xs md:text-sm tracking-wider text-white rounded-full py-4 bg-[#0a2857] shadow-[5px_5px_10px_rgba(0,0,0,0.65)] hover:brightness-110 transition-all text-center"
          >
            {t('landing.cta_footer_login')}
          </Link>
        </div>
      </div>

    </div>

    <img
      src="/assets/img/footerVector.webp"
      alt=""
      loading="lazy"
      decoding="async"
      className="w-full h-auto block"
      style={{ backgroundColor: 'transparent' }}
    />

    {/* Logo al nivel del piso */}
    <div className="absolute -bottom-2 md:bottom-0 left-0 right-0 flex justify-center items-end px-8">
      <img
        src="/assets/img/LogoMultiple.webp"
        alt="República Dominicana · Cluster Turístico Santo Domingo"
        loading="lazy"
        decoding="async"
        className="lp-r w-28 md:w-64 h-auto opacity-90"
        style={{ filter: 'brightness(0) invert(1) sepia(1) saturate(0.2) brightness(1.05)', transitionDelay: '0.3s' }}
      />
    </div>

  </section>

    </div>
  )
}
