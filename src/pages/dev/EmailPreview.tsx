import { useState } from 'react'
import {
  buildOtpEmail,
  buildResetPasswordEmail,
  buildClaimPrizeEmail,
  buildMultiplePrizesEmail,
  buildCustomEmail,
  buildLowStockEmail,
  buildAdminPrizeCodeEmail,
} from '../../email-templates/templates'

const TEMPLATES = [
  { id: 'otp',           label: 'OTP Verificación',     html: () => buildOtpEmail() },
  { id: 'reset',         label: 'Reset Contraseña',      html: () => buildResetPasswordEmail() },
  { id: 'claim',         label: 'Premio Ganado',         html: () => buildClaimPrizeEmail('Antonio de la Cruz', 'Cena para 2 en La Atarazana', 'Restaurantes', 'RT-48291', '/assets/img/fondoGrid3.webp') },
  { id: 'multi',         label: 'Múltiples Premios',     html: () => buildMultiplePrizesEmail() },
  { id: 'custom',        label: 'Mensaje Admin',         html: () => buildCustomEmail() },
  { id: 'stock',         label: 'Alerta Stock Crítico',  html: () => buildLowStockEmail('Cena para 2 en La Atarazana', 'Restaurantes', 'La Atarazana', 4, 5) },
  { id: 'stockWarn',    label: 'Alerta Stock Bajo',     html: () => buildLowStockEmail('Cena para 2 en La Atarazana', 'Restaurantes', 'La Atarazana', 8, 10) },
  { id: 'adminPrize',   label: 'Reenvío Código Admin',  html: () => buildAdminPrizeCodeEmail() },
]

export default function EmailPreview() {
  const [active, setActive] = useState(TEMPLATES[0].id)
  const current = TEMPLATES.find(t => t.id === active)!

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif', background: '#0f172a' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#1e293b', borderBottom: '1px solid #334155', flexShrink: 0 }}>
        <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginRight: 8 }}>
          📧 Email Preview
        </span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              style={{
                padding: '5px 14px',
                borderRadius: 20,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                background: active === t.id ? '#00bbb4' : '#334155',
                color: active === t.id ? '#fff' : '#94a3b8',
                transition: 'all .15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview iframe */}
      <iframe
        key={active}
        srcDoc={current.html()}
        style={{ flex: 1, border: 'none', background: '#fff' }}
        title={current.label}
      />
    </div>
  )
}
