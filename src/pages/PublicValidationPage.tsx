import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getPublicPrizeCode, validatePrizeCode, type PrizeCodeData } from '../services/adminService'

// Helper to get category icons
function getCategoryIcon(category: string): string {
  const norm = (category || '').trim().toLowerCase()
  switch (norm) {
    case 'bares':
      return 'ri-beer-line'
    case 'hoteles':
      return 'ri-hotel-line'
    case 'restaurantes':
      return 'ri-restaurant-line'
    case 'museos':
      return 'ri-bank-line'
    case 'actividades':
      return 'ri-walk-line'
    case 'experiencias':
      return 'ri-sparkles-line'
    default:
      return 'ri-gift-line'
  }
}

// Helper to get category theme colors
function getCategoryColor(category: string): string {
  const norm = (category || '').trim().toLowerCase()
  switch (norm) {
    case 'bares':
      return 'var(--color-teal)'
    case 'hoteles':
      return 'var(--color-orange)'
    case 'restaurantes':
      return 'var(--color-yellow)'
    case 'museos':
      return 'var(--color-navy)'
    case 'actividades':
      return '#3CAD42' // green
    case 'experiencias':
      return '#8e44ad' // purple
    default:
      return 'var(--color-navy)'
  }
}

export default function PublicValidationPage() {
  const { t, i18n } = useTranslation()
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  // Logic States
  const [data, setData] = useState<PrizeCodeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [redeeming, setRedeeming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successRedeem, setSuccessRedeem] = useState(false)
  const [claimedAtDate, setClaimedAtDate] = useState<string | null>(null)
  const [inputCode, setInputCode] = useState('')

  useEffect(() => {
    if (code) {
      loadCodeDetails(code)
    } else {
      setData(null)
      setError(null)
      setLoading(false)
    }
  }, [code])

  async function loadCodeDetails(codeId: string) {
    try {
      setLoading(true)
      setError(null)
      const details = await getPublicPrizeCode(codeId)
      setData(details)
      if (details.status === 'claimed') {
        setClaimedAtDate(details.claimedAt)
      }
    } catch (err: any) {
      console.error(err)
      // Custom HttpsError mapping or fallback
      if (err && err.code === 'not-found') {
        setError(t('publicValidation.errNotFound'))
      } else {
        setError(err.message || t('publicValidation.errNotFound'))
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle redemption
  async function handleRedeem() {
    if (!code || redeeming) return
    try {
      setRedeeming(true)
      const result = await validatePrizeCode(code)
      if (result.success) {
        setSuccessRedeem(true)
        setClaimedAtDate(result.claimedAt)
        if (data) {
          setData({ ...data, status: 'claimed' })
        }
      }
    } catch (err: any) {
      alert(err.message || t('adminCodes.errGeneric'))
    } finally {
      setRedeeming(false)
    }
  }

  // Format date helper
  function formatDate(isoStr: string | null) {
    if (!isoStr) return '-'
    const date = new Date(isoStr)
    return date.toLocaleDateString(i18n.language.startsWith('es') ? 'es-DO' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isExpired = data?.status === 'active' && !!data.expiresAt && new Date(data.expiresAt) < new Date()

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--color-bg)',
      fontFamily: 'var(--font-body)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 16px',
      boxSizing: 'border-box'
    }}>
      {/* Confetti styles when redeemed */}
      {successRedeem && (
        <style>{`
          .confetti {
            position: absolute;
            width: 10px;
            height: 10px;
            border-radius: 20%;
            animation: fall 2.5s ease-in-out infinite;
            z-index: 50;
          }
          @keyframes fall {
            0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
          }
        `}</style>
      )}

      {/* Confetti rendering */}
      {successRedeem && Array.from({ length: 24 }).map((_, i) => {
        const left = Math.random() * 100
        const delay = Math.random() * 2
        const color = ['var(--color-yellow)', 'var(--color-teal)', 'var(--color-red)', 'var(--color-green)', 'var(--color-orange)'][i % 5]
        return (
          <div
            key={i}
            className="confetti"
            style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              background: color,
              top: 0
            }}
          />
        )
      })}

      {/* Public Header */}
      <header style={{ textAlign: 'center', marginBottom: 24, flexShrink: 0 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-navy)',
          fontSize: 24,
          margin: '0 0 4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}>
          <i className="ri-compass-3-line" style={{ color: 'var(--color-yellow)' }} />
          {t('publicValidation.title')}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0, fontWeight: 600 }}>
          {t('publicValidation.subtitle')}
        </p>
      </header>

      {/* Language Toggle in Corner */}
      <button
        onClick={() => i18n.changeLanguage(i18n.language.startsWith('es') ? 'en' : 'es')}
        style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(27,43,110,0.06)', border: '1px solid var(--color-border)',
          borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 700,
          color: 'var(--color-navy)', cursor: 'pointer'
        }}
      >
        {i18n.language.startsWith('es') ? 'EN' : 'ES'}
      </button>

      {/* Main content card */}
      <main style={{
        width: '100%',
        maxWidth: 480,
        background: 'var(--color-surface)',
        borderRadius: 20,
        boxShadow: 'var(--shadow-pop)',
        border: '1.5px solid var(--color-border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        flex: 1
      }}>
        {loading ? (
          /* 1. Loading State */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 16 }}>
            <i className="ri-loader-4-line ri-spin" style={{ fontSize: 44, color: 'var(--color-navy)' }} />
            <span style={{ color: 'var(--color-text-muted)', fontSize: 14, fontWeight: 600 }}>
              {t('publicValidation.scanningText')}
            </span>
          </div>
        ) : !code ? (
          /* 4. Search Form State */
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 54, height: 54, borderRadius: '50%', background: 'rgba(27,43,110,0.06)',
                color: 'var(--color-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, margin: '0 auto 12px'
              }}>
                <i className="ri-search-2-line" />
              </div>
              <h3 style={{ margin: '0 0 8px', color: 'var(--color-navy)', fontSize: 18, fontWeight: 700 }}>
                Buscar Código de Canje
              </h3>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 13, lineHeight: 1.4 }}>
                Ingresa el código provisto por el participante para comprobar la validez de su premio y realizar el canje.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (inputCode.trim()) {
                  navigate(`/validar/${inputCode.trim().toUpperCase()}`)
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input
                  type="text"
                  required
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="Ej: BR-58194"
                  style={{
                    height: 48,
                    borderRadius: 12,
                    border: '1.5px solid var(--color-border)',
                    padding: '0 16px',
                    fontSize: 16,
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: 1
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!inputCode.trim()}
                style={{
                  height: 48,
                  borderRadius: 12,
                  background: 'var(--color-navy)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  border: 'none',
                  cursor: !inputCode.trim() ? 'not-allowed' : 'pointer',
                  opacity: !inputCode.trim() ? 0.6 : 1,
                  boxShadow: '0 4px 12px rgba(27,43,110,0.2)',
                  transition: 'transform 150ms ease'
                }}
              >
                Buscar Premio
              </button>
            </form>
          </div>
        ) : error ? (
          /* 2. Error State */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: 'rgba(230,51,41,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-red)',
              fontSize: 32, marginBottom: 16
            }}>
              <i className="ri-error-warning-line" />
            </div>
            <h2 style={{ fontSize: 18, color: 'var(--color-navy)', fontWeight: 700, margin: '0 0 10px' }}>
              Código inválido
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.5, margin: '0 0 24px' }}>
              {error}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
              <button
                onClick={() => {
                  setError(null)
                  setInputCode('')
                  navigate('/validar')
                }}
                style={{
                  background: 'var(--color-navy)', color: '#fff', border: 'none',
                  padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer'
                }}
              >
                Volver a buscar
              </button>
            </div>
          </div>
        ) : data ? (
          /* 3. Success / Valid Data State */
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
            
            {/* Status Header Strip */}
            <div style={{
              background: data.status === 'active' ? 'var(--color-green)' : data.status === 'claimed' ? 'var(--color-navy)' : 'var(--color-red)',
              color: '#fff',
              padding: '12px 16px',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}>
              <i className={data.status === 'active' ? 'ri-checkbox-circle-fill' : data.status === 'claimed' ? 'ri-award-fill' : 'ri-close-circle-fill'} />
              {t(`publicValidation.status${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`)}
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
              
              {/* Prize Presentation */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: 'rgba(27,43,110,0.03)', padding: 16, borderRadius: 12 }}>
                {data.prizeImageUrl && (
                  <img
                    src={data.prizeImageUrl}
                    alt={data.prizeName}
                    style={{ width: 70, height: 70, borderRadius: 8, objectFit: 'cover', border: '1.5px solid var(--color-border)', background: '#fff' }}
                  />
                )}
                <div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: '#fff',
                    background: getCategoryColor(data.prizeCategory),
                    padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase'
                  }}>
                    <i className={getCategoryIcon(data.prizeCategory)} style={{ marginRight: 4 }} />
                    {data.prizeCategory || 'Premio'}
                  </span>
                  <h3 style={{ margin: '6px 0 0', color: 'var(--color-navy)', fontSize: 18, fontWeight: 700 }}>
                    {data.prizeName}
                  </h3>
                </div>
              </div>

              {/* Prize Details Info List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-gray-light)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{t('publicValidation.codeLabel')}</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-navy)', fontSize: 15 }}>{data.code}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-gray-light)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{t('publicValidation.playerLabel')}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{data.playerDisplayName}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{data.playerEmail}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-gray-light)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{t('publicValidation.dateLabel')}</span>
                  <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{formatDate(data.createdAt)}</span>
                </div>

                {data.expiresAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-gray-light)', paddingBottom: 8 }}>
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{t('publicValidation.expiresAtLabel')}</span>
                    <span style={{ color: isExpired ? 'var(--color-red)' : 'var(--color-text)', fontWeight: isExpired ? 700 : 500 }}>
                      {formatDate(data.expiresAt)}
                    </span>
                  </div>
                )}

                {claimedAtDate && (
                  <div style={{
                    background: 'rgba(27,43,110,0.04)', padding: 12, borderRadius: 8,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span style={{ color: 'var(--color-navy)', fontWeight: 700 }}>{t('publicValidation.claimedAtLabel')}</span>
                    <span style={{ color: 'var(--color-navy)', fontWeight: 700 }}>{formatDate(claimedAtDate)}</span>
                  </div>
                )}
              </div>

              {/* Claimed/Inactive warnings */}
              {data.status === 'claimed' && !successRedeem && (
                <div style={{
                  padding: 12, borderRadius: 10, background: 'rgba(27,43,110,0.06)',
                  color: 'var(--color-navy)', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center', lineHeight: 1.4
                }}>
                  <i className="ri-information-line" style={{ fontSize: 18, flexShrink: 0 }} />
                  <span>{t('publicValidation.errAlreadyClaimed', { date: formatDate(claimedAtDate) })}</span>
                </div>
              )}

              {data.status === 'inactive' && (
                <div style={{
                  padding: 12, borderRadius: 10, background: 'rgba(230,51,41,0.06)',
                  color: 'var(--color-red)', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center', lineHeight: 1.4
                }}>
                  <i className="ri-error-warning-line" style={{ fontSize: 18, flexShrink: 0 }} />
                  <span>{t('publicValidation.errDeactivated')}</span>
                </div>
              )}

              {isExpired && (
                <div style={{
                  padding: 12, borderRadius: 10, background: 'rgba(230,51,41,0.06)',
                  color: 'var(--color-red)', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center', lineHeight: 1.4
                }}>
                  <i className="ri-time-line" style={{ fontSize: 18, flexShrink: 0 }} />
                  <span>{t('publicValidation.errExpired', { date: formatDate(data.expiresAt) })}</span>
                </div>
              )}

              {/* Celebration Screen inside card when redeemed successfully */}
              {successRedeem && (
                <div style={{
                  textAlign: 'center', padding: '16px 8px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', animation: 'fade-in 0.4s ease-out'
                }}>
                  <div style={{
                    width: 54, height: 54, borderRadius: '50%', background: 'rgba(60,173,66,0.1)',
                    color: 'var(--color-green)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, marginBottom: 12
                  }}>
                    <i className="ri-checkbox-circle-fill" />
                  </div>
                  <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--color-green)' }}>
                    {t('publicValidation.successRedeem')}
                  </h4>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {t('publicValidation.successSubtitle')}
                  </p>
                </div>
              )}

              {/* Action Buttons Footer inside main view */}
              <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                {data.status === 'active' && !isExpired ? (
                  <button
                    onClick={handleRedeem}
                    disabled={redeeming}
                    style={{
                      width: '100%',
                      height: 54,
                      borderRadius: 14,
                      background: 'var(--color-green)',
                      color: '#fff',
                      fontSize: 16,
                      fontWeight: 700,
                      border: 'none',
                      cursor: redeeming ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(60,173,66,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'transform 150ms activeState'
                    }}
                  >
                    {redeeming && <i className="ri-loader-4-line ri-spin" />}
                    {redeeming ? t('publicValidation.btnRedeeming') : t('publicValidation.btnRedeem')}
                  </button>
                ) : (
                  <a
                    href="/"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 48,
                      width: '100%',
                      textDecoration: 'none',
                      background: 'rgba(27,43,110,0.06)',
                      color: 'var(--color-navy)',
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 700
                    }}
                  >
                    {t('publicValidation.goBack')}
                  </a>
                )}
              </div>

            </div>

          </div>
        ) : null}
      </main>
    </div>
  )
}
