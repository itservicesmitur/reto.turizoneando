import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import logoImg    from '../assets/logo1.png'
import mascotaImg from '../assets/mascota.png'
import mascot3    from '../assets/png/3.png'
import mascot5    from '../assets/png/5.png'
import mascot7    from '../assets/png/7.png'

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
    { icon: 'ri-radar-line',         title: 'Elige el stage cercano', desc: 'En el mapa verás las paradas disponibles. Selecciona la más cercana a tu ubicación.' },
    { icon: 'ri-headphone-line',    title: 'Escucha la historia',    desc: 'Narración al estilo cronista colonial en tu idioma elegido.' },
    { icon: 'ri-question-line',     title: 'Responde el reto',       desc: 'Preguntas educativas sobre el sitio + datos curiosos entre cada una.' },
    { icon: 'ri-gift-2-line',       title: 'Gira la ruleta',         desc: 'Al completar una etapa, giras la ruleta. El sistema verifica tu edad.' },
    { icon: 'ri-coupon-2-line',     title: 'Canjea tu premio',       desc: 'Recibes un código único por correo para presentar en el punto de canje.' },
  ],
  en: [
    { icon: 'ri-user-add-line',     title: 'Register',              desc: 'Enter your name, age and email. You receive automatic confirmation.' },
    { icon: 'ri-translate-2',       title: 'Choose language',        desc: 'Spanish or English. Everything adapts: questions, narrations, emails.' },
    { icon: 'ri-treasure-map-line', title: 'Explore the map',        desc: 'See all the stops. Check which ones you\'ve completed and which are left.' },
    { icon: 'ri-radar-line',         title: 'Choose nearby stage',    desc: 'On the map you\'ll see available stops. Select the one closest to your location.' },
    { icon: 'ri-headphone-line',    title: 'Listen to the story',    desc: 'Narration in colonial chronicler style in your chosen language.' },
    { icon: 'ri-question-line',     title: 'Answer the challenge',   desc: 'Educational questions about the site + fun facts between each one.' },
    { icon: 'ri-gift-2-line',       title: 'Spin the prize wheel',   desc: 'After completing a stage, spin the wheel. The system checks your age.' },
    { icon: 'ri-coupon-2-line',     title: 'Redeem your prize',      desc: 'Receive a unique code by email to present at the redemption point.' },
  ],
}

// ── Stop data ──────────────────────────────────────────────────────
const STOPS = {
  es: [
    { icon: '🏛️', cat: 'Museos',              places: 'Alcázar de Colón · Casas Reales · Memorial de la Resistencia Dominicana' },
    { icon: '⛪',  cat: 'Templos e iglesias',   places: 'Catedral Primada de América · Convento de los Dominicos · Ruinas de San Francisco' },
    { icon: '🌿',  cat: 'Parques y monumentos', places: 'Parque Colón · Parque Duarte · Monumento Fray Antón de Montesinos' },
  ],
  en: [
    { icon: '🏛️', cat: 'Museums',              places: 'Alcázar de Colón · Casas Reales · Memorial de la Resistencia Dominicana' },
    { icon: '⛪',  cat: 'Temples & Churches',   places: 'Cathedral Primada · Convento de los Dominicos · Ruinas de San Francisco' },
    { icon: '🌿',  cat: 'Parks & Monuments',    places: 'Parque Colón · Parque Duarte · Monument Fray Antón de Montesinos' },
  ],
}

// ── Stages ─────────────────────────────────────────────────────────
const STAGES = {
  es: [
    { n: 1, color: 'var(--color-teal)',   textDark: false, label: 'Etapa 1', sub: 'Primeras 6 preguntas',   q: 6, stops: 6, prize: 'Ruleta de premios básicos' },
    { n: 2, color: 'var(--color-yellow)', textDark: true,  label: 'Etapa 2', sub: 'Siguientes 6 preguntas', q: 6, stops: 6, prize: 'Ruleta de premios intermedios' },
    { n: 3, color: 'var(--color-orange)', textDark: false, label: 'Etapa 3', sub: 'Últimas 7 preguntas',    q: 7, stops: 7, prize: 'Ruleta de premios finales' },
  ],
  en: [
    { n: 1, color: 'var(--color-teal)',   textDark: false, label: 'Stage 1', sub: 'First 6 questions',  q: 6, stops: 6, prize: 'Basic prize wheel' },
    { n: 2, color: 'var(--color-yellow)', textDark: true,  label: 'Stage 2', sub: 'Next 6 questions',   q: 6, stops: 6, prize: 'Intermediate prize wheel' },
    { n: 3, color: 'var(--color-orange)', textDark: false, label: 'Stage 3', sub: 'Final 7 questions',  q: 7, stops: 7, prize: 'Final prize wheel' },
  ],
}

// ── Floating particles config ──────────────────────────────────────
const PARTICLES = [
  { top: '12%', left:  '7%',  w: 10, c: 'rgba(245,200,0,0.7)',  d: '0s',   dur: '2.4s' },
  { top: '22%', right: '16%', w:  7, c: 'rgba(43,191,184,0.6)', d: '0.5s', dur: '2.9s' },
  { top: '38%', left:  '5%',  w:  5, c: 'rgba(255,255,255,0.3)',d: '0.9s', dur: '3.2s' },
  { top:  '8%', left: '54%',  w:  9, c: 'rgba(244,118,43,0.5)', d: '0.3s', dur: '2.6s' },
  { top: '62%', right: '11%', w:  6, c: 'rgba(245,200,0,0.4)',  d: '1.1s', dur: '2.2s' },
  { top: '75%', left: '14%',  w:  8, c: 'rgba(43,191,184,0.35)',d: '0.7s', dur: '3.5s' },
  { top: '48%', right:  '6%', w:  5, c: 'rgba(244,118,43,0.4)', d: '1.4s', dur: '2.8s' },
  { top: '18%', left: '35%',  w:  4, c: 'rgba(255,255,255,0.2)',d: '1.8s', dur: '3.0s' },
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
    <div style={{ fontFamily: 'var(--font-body)', overflowX: 'hidden', background: 'var(--color-navy)' }}>

      {/* ══ FIXED NAV ═══════════════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `calc(var(--safe-top) + 10px) 24px 10px`,
        background: navScrolled ? 'rgba(20,33,90,0.95)' : 'transparent',
        backdropFilter: navScrolled ? 'blur(20px)' : 'none',
        borderBottom: navScrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
        transition: 'background 0.35s, backdrop-filter 0.35s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#fff', overflow: 'hidden', flexShrink: 0, boxShadow: '0 0 0 2px rgba(245,200,0,0.4)' }}>
            <img src={logoImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-yellow)', fontSize: 18, letterSpacing: 0.3 }}>
            Turizoneando
          </span>
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
      <section style={{ minHeight: '100dvh', position: 'relative', overflow: 'hidden', background: 'var(--color-navy)' }}>

        {/* Background blobs */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -140, right: -100, width: 440, height: 440, borderRadius: '50%', background: 'rgba(43,191,184,0.11)', animation: 'blobDrift 12s ease-in-out infinite alternate' }} />
          <div style={{ position: 'absolute', bottom: '15%', left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(245,200,0,0.06)', animation: 'blobDrift 16s ease-in-out infinite alternate-reverse' }} />
          <div style={{ position: 'absolute', top: '50%', right: '8%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(244,118,43,0.07)', animation: 'blobDrift 10s ease-in-out infinite alternate' }} />
          {/* Grid overlay */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.025, backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
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
          <div className="lp-hero-content">
            <div className="lp-r" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(43,191,184,0.14)', border: '1px solid rgba(43,191,184,0.3)',
              borderRadius: 20, padding: '6px 14px', marginBottom: 22,
            }}>
              <i className="ri-map-pin-line" style={{ color: 'var(--color-teal)', fontSize: 13 }} />
              <span style={{ color: 'var(--color-teal)', fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase' }}>
                Zona Colonial · Verano 2026
              </span>
            </div>

            <h1 className="lp-r lp-title-hero" style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(50px, 8vw, 74px)',
              margin: '0 0 16px', lineHeight: 1,
              paddingRight: '0.06em',
              transitionDelay: '0.08s',
            }}>
              Turizoneando
            </h1>

            <p className="lp-r" style={{
              color: 'rgba(255,255,255,0.72)', fontSize: 'clamp(15px, 4vw, 19px)',
              margin: '0 0 36px', lineHeight: 1.55, maxWidth: 400,
              transitionDelay: '0.16s',
            }}>
              {t('landing.hero_subtitle')}
            </p>

            <div className="lp-r" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', transitionDelay: '0.26s' }}>
              <Link to="/register"
                className="lp-cta-btn"
                style={{
                  background: 'var(--color-yellow)', color: 'var(--color-navy)',
                  padding: '14px 30px', borderRadius: 16, fontWeight: 800, fontSize: 16,
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 8px 28px rgba(245,200,0,0.4)',
                }}
              >
                <i className="ri-rocket-line" style={{ fontSize: 18 }} />
                {t('landing.hero_cta')}
              </Link>
              <Link to="/login" style={{
                background: 'rgba(255,255,255,0.08)', color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.28)',
                padding: '14px 24px', borderRadius: 16, fontWeight: 700, fontSize: 15,
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
                backdropFilter: 'blur(8px)',
              }}>
                {t('landing.hero_login')}
                <i className="ri-arrow-right-line" />
              </Link>
            </div>

            {/* Mini feature pills */}
            <div className="lp-r lp-hero-pills" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 28, transitionDelay: '0.34s' }}>
              {[
                { icon: 'ri-trophy-line',      label: lang === 'es' ? 'Premios' : 'Prizes' },
                { icon: 'ri-gamepad-line',     label: lang === 'es' ? 'Interactivo' : 'Interactive' },
                { icon: 'ri-question-line',    label: 'Quizz' },
              ].map((p, i) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 20, padding: '5px 12px',
                }}>
                  <i className={p.icon} style={{ color: 'var(--color-teal)', fontSize: 12 }} />
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>{p.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* ── Right: Mascot ── */}
          <div className="lp-hero-mascot-col" aria-hidden>
            {/* Glow ring behind mascot */}
            <div className="lp-mascot-glow-ring" />
            {/* Orbit dot */}
            <div className="lp-orbit-wrap">
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--color-yellow)', boxShadow: '0 0 12px rgba(245,200,0,0.8)' }} />
            </div>
            <div className="lp-orbit-wrap lp-orbit-2">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-teal)', boxShadow: '0 0 10px rgba(43,191,184,0.8)' }} />
            </div>
            <img src={mascotaImg} alt="" className="lp-mascot-float" />
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
      <div ref={statsRef} style={{ background: 'var(--color-yellow)', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative pattern */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle at 2px 2px, var(--color-navy) 2px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div style={{
          display: 'flex', justifyContent: 'space-around',
          flexWrap: 'wrap', gap: 24, maxWidth: 860, margin: '0 auto', position: 'relative',
        }}>
          {([
            { n: 9,  s: '+', k: 'stats_stops',   icon: 'ri-map-pin-fill'   },
            { n: 3,  s: '',  k: 'stats_stages',  icon: 'ri-trophy-fill'    },
            { n: 19, s: '',  k: 'stats_quizz',   icon: 'ri-question-fill'  },
            { n: 9,  s: '',  k: 'stats_stories', icon: 'ri-headphone-fill' },
            { n: 2,  s: '',  k: 'stats_langs',   icon: 'ri-translate-fill' },
          ] as const).map((stat, idx) => (
            <div key={stat.k} className="lp-stat-item" style={{ textAlign: 'center', minWidth: 80 }}>
              <div style={{ marginBottom: 6 }}>
                <i className={stat.icon} style={{ fontSize: 20, color: 'rgba(27,43,110,0.35)' }} />
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 50, color: 'var(--color-navy)', lineHeight: 1 }}>
                <Counter to={stat.n} suffix={stat.s} run={statsRun} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(27,43,110,0.5)', letterSpacing: 1.2, marginTop: 6, textTransform: 'uppercase' }}>
                {t(`landing.${stat.k}`)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ WHAT IS IT ══════════════════════════════════════════════════ */}
      <section style={{ background: '#0c1424', padding: '96px 28px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative corner glow */}
        <div aria-hidden style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(43,191,184,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,200,0,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div className="lp-what-grid">
            <div>
              <div className="lp-r" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(43,191,184,0.1)', border: '1px solid rgba(43,191,184,0.22)',
                borderRadius: 20, padding: '5px 14px', marginBottom: 18,
              }}>
                <span style={{ color: 'var(--color-teal)', fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
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
                  { icon: 'ri-smartphone-line', label: lang === 'es' ? 'Cualquier navegador' : 'Any browser',    color: 'var(--color-teal)'   },
                  { icon: 'ri-qr-code-line',    label: lang === 'es' ? 'QR en cada parada'  : 'QR at each stop', color: 'var(--color-yellow)' },
                  { icon: 'ri-gift-2-line',     label: lang === 'es' ? 'Premios por etapa'  : 'Prizes per stage',color: 'var(--color-orange)' },
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
                <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: 'radial-gradient(circle, rgba(43,191,184,0.18) 0%, transparent 70%)', animation: 'pulseGlow 3s ease-in-out infinite' }} />
                <img src={mascot3} alt="" style={{
                  width: 'min(200px, 55vw)', height: 'auto',
                  filter: 'drop-shadow(0 12px 36px rgba(0,0,0,0.45))',
                  display: 'block', margin: '0 auto', position: 'relative',
                  animation: 'float 4.5s ease-in-out infinite',
                }} />
              </div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--color-teal), var(--color-yellow), var(--color-orange), transparent)' }} />
      </section>

      {/* ══ HOW TO PARTICIPATE — 8 STEPS ════════════════════════════════ */}
      <section style={{ background: '#f2f4f8', padding: '96px 24px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="lp-r" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(27,43,110,0.07)', border: '1px solid rgba(27,43,110,0.13)',
              borderRadius: 20, padding: '5px 14px', marginBottom: 14,
            }}>
              <span style={{ color: 'var(--color-navy)', fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
                02 · Paso a paso
              </span>
            </div>
            <h2 className="lp-r" style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 6vw, 42px)',
              color: 'var(--color-navy)', margin: '0 0 8px', transitionDelay: '0.1s',
            }}>
              {t('landing.how_title')}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(275px, 1fr))', gap: 14 }}>
            {steps.map((step, i) => (
              <div key={i} className="lp-r lp-step-card" style={{
                background: '#fff', borderRadius: 18, padding: '18px 18px',
                boxShadow: '0 2px 16px rgba(27,43,110,0.08)',
                display: 'flex', gap: 14, alignItems: 'flex-start',
                transitionDelay: `${(i % 4) * 0.07}s`,
              }}>
                <div style={{
                  flexShrink: 0, width: 44, height: 44, borderRadius: 13,
                  background: 'var(--color-navy)', position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-yellow)', fontSize: 21, lineHeight: 1 }}>
                    {i + 1}
                  </span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <i className={step.icon} style={{ color: 'var(--color-teal)', fontSize: 14 }} />
                    <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-navy)' }}>{step.title}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text-muted)', lineHeight: 1.55 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lp-r" style={{ textAlign: 'center', marginTop: 44, transitionDelay: '0.2s' }}>
            <img src={mascot7} alt="" style={{
              width: 'min(150px, 38vw)', height: 'auto',
              filter: 'drop-shadow(0 8px 20px rgba(27,43,110,0.18))',
              animation: 'float 4s ease-in-out infinite',
            }} />
          </div>
        </div>
      </section>

      {/* ══ THE 3 STAGES ════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--color-navy)', padding: '96px 24px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(43,191,184,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="lp-r" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(245,200,0,0.1)', border: '1px solid rgba(245,200,0,0.22)',
              borderRadius: 20, padding: '5px 14px', marginBottom: 14,
            }}>
              <span style={{ color: 'var(--color-yellow)', fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {stages.map((stage, i) => (
              <div key={i} className="lp-r lp-stage-card" style={{
                background: 'rgba(255,255,255,0.04)',
                border: `2px solid ${stage.color}`,
                borderRadius: 22, padding: '24px 22px',
                display: 'flex', alignItems: 'flex-start', gap: 18,
                transitionDelay: `${i * 0.1}s`,
              }}>
                <div style={{
                  flexShrink: 0, width: 56, height: 56, borderRadius: 16,
                  background: stage.color, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 6px 24px ${stage.color}50`,
                }}>
                  <span style={{ fontFamily: 'var(--font-display)', color: stage.textDark ? 'var(--color-navy)' : '#fff', fontSize: 26, lineHeight: 1 }}>{stage.n}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-display)', color: stage.color, fontSize: 21 }}>{stage.label}</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginLeft: 8 }}>· {stage.sub}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {[
                      { icon: 'ri-question-line', text: `${stage.q} ${t('landing.stage_q')}` },
                      { icon: 'ri-map-pin-line',  text: `${stage.stops} ${t('landing.stage_stops')}` },
                      { icon: 'ri-gift-2-line',    text: stage.prize },
                      { icon: 'ri-user-3-line',    text: t('landing.stage_age') },
                    ].map((feat, j) => (
                      <span key={j} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '5px 12px',
                      }}>
                        <i className={feat.icon} style={{ color: stage.color, fontSize: 12 }} />
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', fontWeight: 600 }}>{feat.text}</span>
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
              background: 'rgba(27,43,110,0.07)', border: '1px solid rgba(27,43,110,0.12)',
              borderRadius: 20, padding: '5px 14px', marginBottom: 14,
            }}>
              <span style={{ color: 'var(--color-navy)', fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
                04 · Mapa del recorrido
              </span>
            </div>
            <h2 className="lp-r" style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 6vw, 42px)',
              color: 'var(--color-navy)', margin: 0, transitionDelay: '0.1s',
            }}>
              {t('landing.stops_title')}
            </h2>
          </div>

          <div className="lp-r" style={{
            background: 'var(--color-navy)', borderRadius: 24, overflow: 'hidden',
            marginBottom: 24, padding: '28px 24px', position: 'relative',
            transitionDelay: '0.1s',
          }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, position: 'relative', justifyContent: 'center' }}>
              {['Alcázar de Colón', 'Casas Reales', 'Memorial Resistencia', 'Catedral Primada', 'Convento Dominicos', 'Ruinas San Francisco', 'Parque Colón', 'Parque Duarte', 'Monumento Montesinos'].map((place, i) => (
                <div key={i} className="lp-stop-pin" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 20, padding: '7px 14px',
                  animationDelay: `${i * 0.15}s`,
                }}>
                  <i className="ri-map-pin-fill" style={{ color: 'var(--color-yellow)', fontSize: 12 }} />
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{place}</span>
                </div>
              ))}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center', margin: '16px 0 0', letterSpacing: 0.5 }}>
              {lang === 'es' ? '9 paradas activas · Zona Colonial, Santo Domingo' : '9 active stops · Colonial Zone, Santo Domingo'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stops.map((s, i) => (
              <div key={i} className="lp-r lp-stop-card" style={{
                background: '#f7f8fc',
                borderRadius: 18, padding: '20px',
                display: 'flex', gap: 16, alignItems: 'flex-start',
                border: '1px solid rgba(27,43,110,0.08)',
                transitionDelay: `${i * 0.08}s`,
              }}>
                <div style={{ fontSize: 30, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{s.icon}</div>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--color-navy)', marginBottom: 6, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {s.cat}
                    <span style={{
                      fontSize: 11, background: 'rgba(60,173,66,0.1)', color: 'var(--color-green)',
                      border: '1px solid rgba(60,173,66,0.2)', borderRadius: 20,
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
      <section style={{
        background: 'var(--color-navy)', padding: '100px 24px',
        position: 'relative', overflow: 'hidden', textAlign: 'center',
      }}>
        <div aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,200,0,0.08) 0%, transparent 65%)', pointerEvents: 'none', animation: 'pulseGlow 5s ease-in-out infinite' }} />
        <div aria-hidden style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(43,191,184,0.07)', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(244,118,43,0.06)', pointerEvents: 'none' }} />

        <div className="lp-r" style={{ position: 'relative', zIndex: 1, marginBottom: 16 }}>
          <img src={mascot5} alt="" style={{
            width: 'min(170px, 42vw)', height: 'auto',
            filter: 'drop-shadow(0 8px 28px rgba(0,0,0,0.35))',
            display: 'inline-block',
            animation: 'float 4.2s ease-in-out infinite',
          }} />
        </div>

        <h2 className="lp-r" style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 7vw, 56px)',
          color: '#fff', margin: '0 0 14px', position: 'relative', zIndex: 1,
          transitionDelay: '0.1s',
        }}>
          {t('landing.cta_title')}
        </h2>

        <p className="lp-r" style={{
          color: 'rgba(255,255,255,0.62)', fontSize: 16, maxWidth: 420,
          margin: '0 auto 36px', lineHeight: 1.6, position: 'relative', zIndex: 1,
          transitionDelay: '0.18s',
        }}>
          {t('landing.cta_body')}
        </p>

        <div className="lp-r" style={{
          display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
          position: 'relative', zIndex: 1, transitionDelay: '0.26s',
        }}>
          <Link to="/register"
            className="lp-cta-btn"
            style={{
              background: 'var(--color-yellow)', color: 'var(--color-navy)',
              padding: '16px 38px', borderRadius: 18, fontWeight: 800, fontSize: 18,
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
              boxShadow: '0 10px 40px rgba(245,200,0,0.45)',
            }}
          >
            <i className="ri-rocket-line" style={{ fontSize: 20 }} />
            {t('landing.cta_register')}
          </Link>
          <Link to="/login" style={{
            background: 'rgba(255,255,255,0.08)', color: '#fff',
            border: '1.5px solid rgba(255,255,255,0.28)',
            padding: '16px 28px', borderRadius: 18, fontWeight: 700, fontSize: 16,
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
            backdropFilter: 'blur(8px)',
          }}>
            {t('landing.cta_login')}
          </Link>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 11, marginTop: 52, letterSpacing: 0.5 }}>
          Turizoneando · MITUR · Zona Colonial, Santo Domingo
        </p>
        <div style={{ height: 'var(--safe-bottom)' }} />
      </section>

      {/* ── Global styles & animations ──────────────────────────────── */}
      <style>{`
        /* ── Keyframes ──────────────────────────── */
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
          right: -8px;
          bottom: 0;
          width: clamp(160px, 44vw, 300px);
          pointer-events: none;
          z-index: 1;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .lp-mascot-glow-ring {
          position: absolute;
          bottom: 10%;
          left: 50%;
          transform: translateX(-50%);
          width: clamp(140px, 38vw, 260px);
          height: clamp(140px, 38vw, 260px);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(245,200,0,0.15) 0%, rgba(43,191,184,0.08) 50%, transparent 70%);
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
          background: linear-gradient(135deg, #F5C800 0%, #ffffff 55%, #F5C800 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── CTA hover ──────────────────────────── */
        .lp-cta-btn {
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .lp-cta-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 14px 40px rgba(245,200,0,0.55) !important;
        }

        /* ── Card hovers ────────────────────────── */
        .lp-step-card {
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .lp-step-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 30px rgba(27,43,110,0.14) !important;
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
          box-shadow: 0 6px 20px rgba(27,43,110,0.1);
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
            align-self: flex-end;
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
