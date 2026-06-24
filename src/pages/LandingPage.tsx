import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import logoImg    from '../assets/logo1.png'

// ── Animated counter ───────────────────────────────────────────────
function Counter({ to, suffix = '', run }: { to: number; suffix?: string; run: boolean }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!run) return
    let cur = 0
    const step = Math.max(1, Math.ceil(to / 45))
    const id = setInterval(() => {
      cur = Math.min(cur + step, to)
      setVal(cur)
      if (cur >= to) clearInterval(id)
    }, 28)
    return () => clearInterval(id)
  }, [run, to])
  return <>{val}{suffix}</>
}

// ── Step data ──────────────────────────────────────────────────────
const STEPS = {
  es: [
    { icon: 'ri-user-add-line',     title: 'Regístrate',           desc: 'Ingresa tu nombre, edad y correo. Recibes confirmación automática.' },
    { icon: 'ri-translate-2',       title: 'Elige tu idioma',       desc: 'Español o inglés. Todo se adapta: preguntas, narraciones y correos.' },
    { icon: 'ri-treasure-map-line', title: 'Explora el mapa',       desc: 'Ve todas las paradas. Mira cuáles completaste y cuáles te faltan.' },
    { icon: 'ri-radar-line',         title: 'Elige el stage cercano', desc: 'Todos los participantes iniciarán su aventura de manera unificada en el Primer punto o desafío.' },
    { icon: 'ri-headphone-line',    title: 'Escucha la historia',    desc: 'Narración al estilo cronista colonial en tu idioma elegido.' },
    { icon: 'ri-question-line',     title: 'Responde el reto',       desc: 'Preguntas educativas sobre el sitio + datos curiosos entre cada una.' },
    { icon: 'ri-gift-2-line',       title: 'Gira la ruleta',         desc: 'Al completar una etapa, giras la ruleta. El sistema verifica tu edad.' },
    { icon: 'ri-coupon-2-line',     title: 'Canjea tu premio',       desc: 'Recibes un código único por correo para presentar en el punto de canje.' },
  ],
  en: [
    { icon: 'ri-user-add-line',     title: 'Register',              desc: 'Enter your name, age and email. You receive automatic confirmation.' },
    { icon: 'ri-translate-2',       title: 'Choose language',        desc: 'Spanish or English. Everything adapts: questions, narrations, emails.' },
    { icon: 'ri-treasure-map-line', title: 'Explore the map',        desc: 'See all the stops. Check which ones you\'ve completed and which are left.' },
    { icon: 'ri-radar-line',         title: 'Choose nearby stage',    desc: 'All participants will begin their adventure together at the First stop or challenge.' },
    { icon: 'ri-headphone-line',    title: 'Listen to the story',    desc: 'Narration in colonial chronicler style in your chosen language.' },
    { icon: 'ri-question-line',     title: 'Answer the challenge',   desc: 'Educational questions about the site + fun facts between each one.' },
    { icon: 'ri-gift-2-line',       title: 'Spin the prize wheel',   desc: 'After completing a stage, spin the wheel. The system checks your age.' },
    { icon: 'ri-coupon-2-line',     title: 'Redeem your prize',      desc: 'Receive a unique code by email to present at the redemption point.' },
  ],
}

// ── Stop data ──────────────────────────────────────────────────────
const STOPS = {
  es: [
    { icon: '🏛️', cat: 'Museos',              places: 'Alcázar de Colón · Casas Reales · Panteón de la Patria · Museo Fortaleza de Santo Domingo (Ozama)' },
    { icon: '⛪',  cat: 'Templos e iglesias',   places: 'Catedral Primada de América · Iglesia de Nuestra Señora de la Altagracia · Iglesia y Convento Regina Angelorum · Plaza Tirso de Molina — Iglesia Las Mercedes · Parque Duarte — Iglesia de los Dominicos' },
    { icon: '🌿',  cat: 'Parques y monumentos', places: 'Las Escalinatas de la Calle El Conde · Calle Pellerano Alfau (De los Nichos) · Calle Las Damas · Plaza María de Toledo · El Reloj de Sol · La Puerta de San Diego · Plaza de España (Plaza de la Hispanidad) · Ruinas de San Nicolás de Bari · Plaza Tirso de Molina — Iglesia Las Mercedes · Calle El Conde — Edificio Saviñón · Parque Duarte — Iglesia de los Dominicos' },
  ],
  en: [
    { icon: '🏛️', cat: 'Museums',              places: 'Alcázar de Colón · Casas Reales · Pantheon of the Homeland · Fort Santo Domingo Museum (Ozama)' },
    { icon: '⛪',  cat: 'Temples & Churches',   places: 'Cathedral Primada of America · Church of Our Lady of Altagracia · Church & Convent Regina Angelorum · Plaza Tirso de Molina — Las Mercedes Church · Parque Duarte — Church of the Dominicans' },
    { icon: '🌿',  cat: 'Parks & Monuments',    places: 'Las Escalinatas de la Calle El Conde · Calle Pellerano Alfau (De los Nichos) · Calle Las Damas · Plaza María de Toledo · El Reloj de Sol · La Puerta de San Diego · Plaza de España (Plaza de la Hispanidad) · Ruinas de San Nicolás de Bari · Plaza Tirso de Molina — Las Mercedes Church · Calle El Conde — Edificio Saviñón · Parque Duarte — Church of the Dominicans' },
  ],
}

// ── Stages ─────────────────────────────────────────────────────────
const STAGES = {
  es: [
    { n: 1, color: 'var(--color-primary)',       textDark: false, label: 'Etapa 1', sub: 'Primeras 6 preguntas',   q: 6, stops: 6, prize: 'Ruleta de premios básicos' },
    { n: 2, color: 'var(--color-accent-orange)', textDark: false, label: 'Etapa 2', sub: 'Siguientes 6 preguntas', q: 6, stops: 6, prize: 'Ruleta de premios intermedios' },
    { n: 3, color: 'var(--color-accent-red)',    textDark: false, label: 'Etapa 3', sub: 'Últimas 7 preguntas',    q: 7, stops: 7, prize: 'Ruleta de premios finales' },
  ],
  en: [
    { n: 1, color: 'var(--color-primary)',       textDark: false, label: 'Stage 1', sub: 'First 6 questions',  q: 6, stops: 6, prize: 'Basic prize wheel' },
    { n: 2, color: 'var(--color-accent-orange)', textDark: false, label: 'Stage 2', sub: 'Next 6 questions',   q: 6, stops: 6, prize: 'Intermediate prize wheel' },
    { n: 3, color: 'var(--color-accent-red)',    textDark: false, label: 'Stage 3', sub: 'Final 7 questions',  q: 7, stops: 7, prize: 'Final prize wheel' },
  ],
}

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
  const [navScrolled, setNavScrolled] = useState(false)
  const [statsRun, setStatsRun]       = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)
  const lang = (i18n.language || 'es').startsWith('en') ? 'en' : 'es'

  const steps  = STEPS[lang]
  const stops  = STOPS[lang]
  const stages = STAGES[lang]

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStatsRun(true); obs.disconnect() }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useLayoutEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('lp-on'); obs.unobserve(e.target) }
      }),
      { threshold: 0.07, rootMargin: '0px 0px -40px 0px' },
    )
    document.querySelectorAll('.lp-r, .lp-rl, .lp-rr').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <div style={{ fontFamily: 'var(--font-body)', overflowX: 'hidden', background: 'var(--color-primary-dark)' }}>

      {/* ══ FIXED NAV ═══════════════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `calc(var(--safe-top) + 10px) 24px 10px`,
        background: navScrolled ? 'rgba(9,109,125,0.96)' : 'transparent',
        backdropFilter: navScrolled ? 'blur(20px)' : 'none',
        borderBottom: navScrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
        transition: 'background 0.35s, backdrop-filter 0.35s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', overflow: 'hidden', flexShrink: 0, boxShadow: '0 0 0 2px rgba(255,148,71,0.5)' }}>
            <img src={logoImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <img
            src="/assets/img/logoSoloLetras.png"
            alt="Turizoneando"
            className="lp-nav-wordmark"
            style={{ height: 90, width: 'auto', marginTop: -30, marginBottom: -30, filter: 'brightness(0) invert(1)' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => i18n.changeLanguage(lang === 'es' ? 'en' : 'es')}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.22)',
              borderRadius: 20, color: '#fff', padding: '7px 14px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', lineHeight: 1,
              display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
              height: 36, boxSizing: 'border-box',
            }}
          >
            <i className="ri-global-line" style={{ fontSize: 14 }} />
            {lang === 'es' ? 'EN' : 'ES'}
          </button>
          <Link to="/login" style={{
            padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, lineHeight: 1,
            border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff',
            textDecoration: 'none', background: 'rgba(255,255,255,0.06)',
            display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            height: 36, boxSizing: 'border-box',
          }}>
            {t('landing.nav_login')}
          </Link>
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════════════════════════════ */}
      <section className="lp-hero-bg-section" style={{ minHeight: '100dvh', position: 'relative', overflow: 'hidden' }}>

        {/* Background blobs + overlays */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {/* Blobs */}
          <div style={{ position: 'absolute', top: -140, right: -100, width: 560, height: 560, borderRadius: '50%', background: 'rgba(0,187,180,0.2)', filter: 'blur(48px)', animation: 'blobDrift 12s ease-in-out infinite alternate' }} />
          <div style={{ position: 'absolute', bottom: '10%', left: -100, width: 420, height: 420, borderRadius: '50%', background: 'rgba(255,148,71,0.13)', filter: 'blur(40px)', animation: 'blobDrift 16s ease-in-out infinite alternate-reverse' }} />
          <div style={{ position: 'absolute', top: '45%', right: '6%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(224,52,75,0.13)', filter: 'blur(32px)', animation: 'blobDrift 10s ease-in-out infinite alternate' }} />
          <div style={{ position: 'absolute', bottom: '-8%', left: '28%', width: 460, height: 220, borderRadius: '50%', background: 'rgba(255,148,71,0.09)', filter: 'blur(52px)', animation: 'blobDrift 14s ease-in-out infinite alternate' }} />
          {/* Palm leaves – left */}
          <img src="/assets/img/palm_leaves_shadow.png" alt="" style={{ position: 'absolute', top: 0, left: -10, height: '72%', width: 'auto', opacity: 0.55, objectFit: 'contain', objectPosition: 'top left', mixBlendMode: 'multiply' }} />
          {/* Palm leaves – right (mirrored) */}
          <img src="/assets/img/palm_leaves_shadow.png" alt="" style={{ position: 'absolute', top: 0, right: -10, height: '58%', width: 'auto', opacity: 0.35, objectFit: 'contain', objectPosition: 'top right', transform: 'scaleX(-1)', mixBlendMode: 'multiply' }} />
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
                src="/assets/img/logoSoloLetras.png"
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
            <img src="/assets/img/turiguiaSinFondo.png" alt="" className="lp-mascot-float" />
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
      </section>

      {/* ══ STATS BAND ══════════════════════════════════════════════════ */}
      <div ref={statsRef} style={{ background: 'var(--gradient-primary)', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative pattern */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.8) 2px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div style={{
          display: 'flex', justifyContent: 'space-around',
          flexWrap: 'wrap', gap: 24, maxWidth: 860, margin: '0 auto', position: 'relative',
        }}>
          {([
            { n: 9,  s: '+', k: 'stats_stops',   icon: 'ri-map-pin-fill'   },
            { n: 3,  s: '',  k: 'stats_stages',  icon: 'ri-trophy-fill'    },
            { n: 19, s: '',  k: 'stats_quizz',   icon: 'ri-question-fill'  },
            { n: 9,  s: '',  k: 'stats_stories', icon: 'ri-headphone-fill' },
            { n: 2,  s: '',  k: 'stats_langs',   icon: 'ri-translate-2' },
          ] as const).map((stat) => (
            <div key={stat.k} className="lp-stat-item" style={{ textAlign: 'center', minWidth: 80 }}>
              <div style={{ marginBottom: 6 }}>
                <i className={stat.icon} style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)' }} />
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 50, color: '#fff', lineHeight: 1 }}>
                <Counter to={stat.n} suffix={stat.s} run={statsRun} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2, marginTop: 6, textTransform: 'uppercase' }}>
                {t(`landing.${stat.k}`)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ WHAT IS IT ══════════════════════════════════════════════════ */}
      <section style={{ background: '#063f4a', padding: '96px 28px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative corner glow */}
        <div aria-hidden style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,187,180,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,148,71,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div className="lp-what-grid">
            <div>
              <div className="lp-r" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(0,187,180,0.12)', border: '1px solid rgba(0,187,180,0.25)',
                borderRadius: 20, padding: '5px 14px', marginBottom: 18,
              }}>
                <span style={{ color: 'var(--color-primary)', fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
                  01 · ¿De qué se trata?
                </span>
              </div>
              <h2 className="lp-r" style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 7vw, 44px)',
                color: '#fff', margin: '0 0 20px', lineHeight: 1.15,
                transitionDelay: '0.1s',
              }}>
                {t('landing.what_title')}
              </h2>
              <p className="lp-r" style={{
                color: 'rgba(255,255,255,0.62)', fontSize: 16, lineHeight: 1.72,
                margin: '0 0 28px', transitionDelay: '0.18s',
              }}>
                {t('landing.what_body')}
              </p>
              <div className="lp-r" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', transitionDelay: '0.26s' }}>
                {[
                  { icon: 'ri-smartphone-line', label: lang === 'es' ? 'Cualquier navegador' : 'Any browser',    color: 'var(--color-primary)'       },
                  { icon: 'ri-gift-2-line',     label: lang === 'es' ? 'Premios por etapa'  : 'Prizes per stage', color: 'var(--color-accent-orange)' },
                  { icon: 'ri-map-pin-2-line',  label: lang === 'es' ? 'Paradas históricas' : 'Historic stops',  color: 'var(--color-accent-red)'    },
                ].map((p, i) => (
                  <span key={i} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 20, padding: '7px 14px',
                  }}>
                    <i className={p.icon} style={{ color: p.color, fontSize: 14 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.78)' }}>{p.label}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="lp-rr lp-mascot-col" style={{ transitionDelay: '0.1s' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,187,180,0.2) 0%, transparent 70%)', animation: 'pulseGlow 3s ease-in-out infinite' }} />
                <img src="/assets/img/turiguiaSinFondo.png" alt="" style={{
                  width: 'min(280px, 65vw)', height: 'auto',
                  filter: 'drop-shadow(0 12px 36px rgba(0,0,0,0.45))',
                  display: 'block', margin: '0 auto', position: 'relative',
                  animation: 'float 4.5s ease-in-out infinite',
                }} />
              </div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--color-primary), var(--color-accent-orange), var(--color-accent-red), transparent)' }} />
      </section>

      {/* ══ HOW TO PARTICIPATE — 8 STEPS ════════════════════════════════ */}
      <section style={{ background: '#f2f4f8', padding: '96px 24px' }}>
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
            <img src="/assets/img/turiguiaSinFondo.png" alt="" style={{
              width: 'min(150px, 38vw)', height: 'auto',
              filter: 'drop-shadow(0 8px 20px rgba(9,109,125,0.2))',
              animation: 'float 4s ease-in-out infinite',
            }} />
          </div>
        </div>
      </section>

      {/* ══ THE 3 STAGES ════════════════════════════════════════════════ */}
      <section style={{ background: '#054f5c', padding: '96px 24px', position: 'relative', overflow: 'hidden' }}>
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
                {/* Número */}
                <div style={{
                  flexShrink: 0, width: 60, height: 60, borderRadius: 18,
                  background: `linear-gradient(135deg, ${stage.color} 0%, ${stage.color}bb 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 6px 20px ${stage.color}55`,
                }}>
                  <span style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: 28, lineHeight: 1 }}>{stage.n}</span>
                </div>

                {/* Contenido */}
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
      </section>

      {/* ══ THE STOPS ═══════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: '96px 24px' }}>
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

      {/* ══ CTA ═════════════════════════════════════════════════════════ */}
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
            src="/assets/img/LogoMultiple.png"
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
            <img src="/assets/img/turiguiaSinFondo.png" alt="" style={{
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

        /* ── Reveal classes ─────────────────────── */
        .lp-r {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.65s ease, transform 0.65s ease;
        }
        .lp-r.lp-on { opacity: 1; transform: none; }

        .lp-rl {
          opacity: 0;
          transform: translateX(-36px);
          transition: opacity 0.65s ease, transform 0.65s ease;
        }
        .lp-rl.lp-on { opacity: 1; transform: none; }

        .lp-rr {
          opacity: 0;
          transform: translateX(36px);
          transition: opacity 0.65s ease, transform 0.65s ease;
        }
        .lp-rr.lp-on { opacity: 1; transform: none; }

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
          background-image: linear-gradient(to bottom, rgba(46, 171, 173, 0.25) 0%, rgba(6, 63, 74, 0.6) 100%), url('/assets/img/hero_bg_mobile.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        @media (min-width: 760px) {
          .lp-hero-bg-section {
            background-image: linear-gradient(to bottom, rgba(46, 171, 173, 0.15) 0%, rgba(6, 63, 74, 0.55) 100%), url('/assets/img/hero_bg_desktop.png');
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
    </div>
  )
}
