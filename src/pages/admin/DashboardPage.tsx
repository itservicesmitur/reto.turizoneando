import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { collectionGroup, getDocs } from 'firebase/firestore'
import { db } from '../../config/firebase'
import {
  fetchPlayers,
  fetchStopsList,
  fetchPrizeCodes
} from '../../services/adminService'
import type {
  PlayerData,
  StopData,
  PrizeCodeData
} from '../../services/adminService'

interface AttemptData {
  correct: boolean
  timeMs: number
  questionId: string
  questionText: string
  stopId: string
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Raw data from Firestore
  const [players, setPlayers] = useState<PlayerData[]>([])
  const [stops, setStops] = useState<StopData[]>([])
  const [prizeCodes, setPrizeCodes] = useState<PrizeCodeData[]>([])
  const [attempts, setAttempts] = useState<AttemptData[]>([])

  // Load dashboard data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        const [playersList, stopsList, codesList] = await Promise.all([
          fetchPlayers(),
          fetchStopsList(),
          fetchPrizeCodes()
        ])

        // Fetch all attempts via Collection Group
        const attemptsCol = collectionGroup(db, 'attempts')
        const attemptsSnap = await getDocs(attemptsCol)
        const attemptsList = attemptsSnap.docs.map(doc => {
          const data = doc.data()
          return {
            correct: data.correct === true,
            timeMs: typeof data.timeMs === 'number' ? data.timeMs : 0,
            questionId: data.questionId || '',
            questionText: data.questionText || '',
            stopId: data.stopId || ''
          }
        })

        setPlayers(playersList)
        setStops(stopsList)
        setPrizeCodes(codesList)
        setAttempts(attemptsList)
      } catch (err) {
        console.error('[Dashboard] Error fetching data:', err)
        setError(err instanceof Error ? err.message : t('adminDashboard.errorText'))
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [t])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60dvh', gap: 16 }}>
        <div className="mascot-loading" style={{
          width: 60, height: 60, borderRadius: '50%',
          background: 'var(--color-navy)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: '#fff',
          fontSize: 24, animation: 'mascot-pulse 1.4s infinite ease-in-out'
        }}>
          🦖
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, fontWeight: 600 }}>
          {t('adminDashboard.loadingText')}
        </p>
        <style>{`
          @keyframes mascot-pulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.15); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center', background: 'rgba(230,51,41,0.06)', border: '1.5px solid rgba(230,51,41,0.2)', borderRadius: 16, maxWidth: 500, margin: '40px auto' }}>
        <i className="ri-error-warning-fill" style={{ fontSize: 48, color: 'var(--color-error)', display: 'block', marginBottom: 12 }} />
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 18, margin: '0 0 8px' }}>
          {t('adminDashboard.errorText')}
        </h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: '0 0 16px', lineHeight: 1.5 }}>
          {error}
        </p>
        <button onClick={() => window.location.reload()} style={{ height: 40, padding: '0 20px', borderRadius: 8, background: 'var(--color-navy)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          Reintentar
        </button>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────────────
  // CALCULATE METRICS & ANALYTICS
  // ────────────────────────────────────────────────────────────────────────

  // 1. Core Counts
  const totalPlayersCount = players.length
  const totalStopsCount = stops.length
  const activeStopsCount = stops.filter(s => s.active).length
  const stopsActivePct = totalStopsCount > 0 ? Math.round((activeStopsCount / totalStopsCount) * 100) : 0

  const totalAttemptsCount = attempts.length
  const correctAttemptsCount = attempts.filter(a => a.correct).length
  const correctRate = totalAttemptsCount > 0 ? Math.round((correctAttemptsCount / totalAttemptsCount) * 100) : 0

  const totalCodesCount = prizeCodes.length
  const claimedCodesCount = prizeCodes.filter(c => c.status === 'claimed').length
  const activeCodesCount = prizeCodes.filter(c => c.status === 'active').length
  const redemptionRate = totalCodesCount > 0 ? Math.round((claimedCodesCount / totalCodesCount) * 100) : 0

  // 2. User Demographics
  // Gender
  let genderCounts: Record<string, number> = { Male: 0, Female: 0, Other: 0 }
  players.forEach(p => {
    const g = (p.gender || '').toLowerCase().trim()
    if (g === 'male' || g === 'masculino' || g === 'm') {
      genderCounts.Male++
    } else if (g === 'female' || g === 'femenino' || g === 'f') {
      genderCounts.Female++
    } else {
      genderCounts.Other++
    }
  })
  const genderData = [
    { label: t('adminDashboard.genderMale'), count: genderCounts.Male, color: 'var(--color-navy)' },
    { label: t('adminDashboard.genderFemale'), count: genderCounts.Female, color: 'var(--color-teal)' },
    { label: t('adminDashboard.genderOther'), count: genderCounts.Other, color: 'var(--color-gray-mid)' }
  ].filter(() => totalPlayersCount > 0)

  // Ages
  const ageMap: Record<string, number> = {}
  players.forEach(p => {
    const age = p.ageRange ? p.ageRange.trim() : 'No especificada'
    ageMap[age] = (ageMap[age] || 0) + 1
  })
  // Sort age keys logically
  const ageOrder = ['<18', '18-24', '25-34', '35-44', '45-54', '55+', 'No especificada']
  const ageData = ageOrder
    .map(key => ({ label: key, count: ageMap[key] || 0 }))
    .filter(d => d.count > 0 || d.label !== 'No especificada')

  // Top Nationalities
  const natMap: Record<string, number> = {}
  players.forEach(p => {
    const nat = p.nationality ? p.nationality.trim() : 'No especificada'
    natMap[nat] = (natMap[nat] || 0) + 1
  })
  const topNationalities = Object.entries(natMap)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // 3. Prizes redemption & category
  const categoryClaimsMap: Record<string, number> = {}
  prizeCodes.forEach(c => {
    if (c.status === 'claimed' && c.prizeCategory) {
      categoryClaimsMap[c.prizeCategory] = (categoryClaimsMap[c.prizeCategory] || 0) + 1
    }
  })
  const categoryClaimsData = Object.entries(categoryClaimsMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  // Top claimed prizes
  const prizeClaimsMap: Record<string, { count: number; category: string }> = {}
  prizeCodes.forEach(c => {
    if (c.status === 'claimed' && c.prizeName) {
      if (!prizeClaimsMap[c.prizeName]) {
        prizeClaimsMap[c.prizeName] = { count: 0, category: c.prizeCategory || '' }
      }
      prizeClaimsMap[c.prizeName].count++
    }
  })
  const topClaimedPrizes = Object.entries(prizeClaimsMap)
    .map(([name, d]) => ({ name, count: d.count, category: d.category }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // 4. Game Engagement
  const avgTimeSecs = totalAttemptsCount > 0
    ? Math.round((attempts.reduce((sum, a) => sum + a.timeMs, 0) / totalAttemptsCount) / 100) / 10
    : 0

  // Hardest Questions (Accuracy rate = correct / total attempts)
  const questionMap: Record<string, { text: string; stopId: string; total: number; correct: number }> = {}
  attempts.forEach(a => {
    if (!a.questionId) return
    if (!questionMap[a.questionId]) {
      questionMap[a.questionId] = { text: a.questionText || 'Pregunta sin texto', stopId: a.stopId, total: 0, correct: 0 }
    }
    questionMap[a.questionId].total++
    if (a.correct) {
      questionMap[a.questionId].correct++
    }
  })
  const hardestQuestions = Object.values(questionMap)
    .filter(q => q.total >= 3) // Filter out noise (require at least 3 attempts)
    .map(q => {
      const rate = Math.round((q.correct / q.total) * 100)
      // Resolve stop name if possible
      const stopName = stops.find(s => s.id === q.stopId)?.name || 'Parada desconocida'
      return { text: q.text, stopName, total: q.total, rate }
    })
    .sort((a, b) => a.rate - b.rate) // Sort by lowest accuracy rate
    .slice(0, 5)

  // Helper values for donut calculations
  const totalGenderCount = genderData.reduce((sum, d) => sum + d.count, 0)

  return (
    <div style={{ animation: 'fade-in 0.3s ease-out' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 28, margin: '0 0 4px' }}>
          {t('adminDashboard.title')}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
          {t('adminDashboard.subtitle')}
        </p>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 1. METRICS GRID */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 20,
        marginBottom: 28
      }}>
        {/* Metric: Players */}
        <div style={cardStyle}>
          <div style={metricIconWrapperStyle('rgba(27,43,110,0.08)', 'var(--color-navy)')}>
            <i className="ri-group-line" style={{ fontSize: 22 }} />
          </div>
          <div>
            <div style={metricLabelStyle}>{t('adminDashboard.totalPlayers')}</div>
            <div style={metricValueStyle}>{totalPlayersCount.toLocaleString()}</div>
            <div style={metricSubtextStyle}>
              <span style={{ color: 'var(--color-green)', fontWeight: 800 }}>+100%</span> activos
            </div>
          </div>
        </div>

        {/* Metric: Stops */}
        <div style={cardStyle}>
          <div style={metricIconWrapperStyle('rgba(43,191,184,0.08)', 'var(--color-teal)')}>
            <i className="ri-map-pin-line" style={{ fontSize: 22 }} />
          </div>
          <div>
            <div style={metricLabelStyle}>{t('adminDashboard.totalStops')}</div>
            <div style={metricValueStyle}>{totalStopsCount}</div>
            <div style={metricSubtextStyle}>
              <span style={{ color: 'var(--color-teal)', fontWeight: 800 }}>{stopsActivePct}%</span> activas en mapa
            </div>
          </div>
        </div>

        {/* Metric: Answers */}
        <div style={cardStyle}>
          <div style={metricIconWrapperStyle('rgba(244,118,43,0.08)', 'var(--color-orange)')}>
            <i className="ri-chat-check-line" style={{ fontSize: 22 }} />
          </div>
          <div>
            <div style={metricLabelStyle}>{t('adminDashboard.totalAttempts')}</div>
            <div style={metricValueStyle}>{totalAttemptsCount.toLocaleString()}</div>
            <div style={metricSubtextStyle}>
              <span style={{ color: 'var(--color-green)', fontWeight: 800 }}>{correctRate}%</span> tasa de aciertos
            </div>
          </div>
        </div>

        {/* Metric: Redeemed Prizes */}
        <div style={cardStyle}>
          <div style={metricIconWrapperStyle('rgba(60,173,66,0.08)', 'var(--color-green)')}>
            <i className="ri-gift-line" style={{ fontSize: 22 }} />
          </div>
          <div>
            <div style={metricLabelStyle}>{t('adminDashboard.prizesClaimed')}</div>
            <div style={metricValueStyle}>{claimedCodesCount}</div>
            <div style={metricSubtextStyle}>
              <span style={{ color: 'var(--color-green)', fontWeight: 800 }}>{redemptionRate}%</span> tasa de redención
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 2. DEMOGRAPHICS GRID */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <h2 style={sectionHeaderStyle}>
        <i className="ri-user-search-line" style={{ marginRight: 8, color: 'var(--color-navy)' }} />
        {t('adminDashboard.demographicsTitle')}
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24,
        marginBottom: 32
      }}>
        {/* Gender Distribution Donut */}
        <div style={glassCardStyle}>
          <h3 style={chartTitleStyle}>{t('adminDashboard.genderDist')}</h3>
          {totalPlayersCount === 0 ? (
            <div style={emptyChartStyle}>{t('adminDashboard.noDemographics')}</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', minHeight: 180, gap: 16 }}>
              {/* SVG Segmented Donut Chart */}
              <div style={{ position: 'relative', width: 140, height: 140 }}>
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                  {/* Background Track */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--color-gray-light)" strokeWidth="11" />
                  {/* Dynamic Segments */}
                  {(() => {
                    let cumulativePct = 0
                    const radius = 38
                    const circ = 2 * Math.PI * radius

                    return genderData.map((d, index) => {
                      const pct = totalGenderCount > 0 ? d.count / totalGenderCount : 0
                      const strokeDashOffset = circ - (pct * circ)
                      const rotation = cumulativePct * 360 - 90
                      cumulativePct += pct

                      if (pct <= 0) return null

                      return (
                        <circle
                          key={index}
                          cx="50"
                          cy="50"
                          r={radius}
                          fill="transparent"
                          stroke={d.color}
                          strokeWidth="11"
                          strokeDasharray={circ}
                          strokeDashoffset={strokeDashOffset}
                          transform={`rotate(${rotation} 50 50)`}
                          strokeLinecap="round"
                          style={{
                            transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s',
                            cursor: 'pointer'
                          }}
                        />
                      )
                    })
                  })()}
                </svg>
                {/* Center Label */}
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'
                }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-navy)', fontFamily: 'var(--font-display)' }}>
                    {totalPlayersCount}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Players
                  </span>
                </div>
              </div>

              {/* Legends */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
                {genderData.map((d, i) => {
                  const pct = totalGenderCount > 0 ? Math.round((d.count / totalGenderCount) * 100) : 0
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
                          {d.label}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          {d.count} ({pct}%)
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Age Groups Bar Chart */}
        <div style={glassCardStyle}>
          <h3 style={chartTitleStyle}>{t('adminDashboard.ageDist')}</h3>
          {ageData.length === 0 ? (
            <div style={emptyChartStyle}>{t('adminDashboard.noDemographics')}</div>
          ) : (
            <div style={{ minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '10px 0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 130, paddingBottom: 8, borderBottom: '1px solid var(--color-border)', gap: 8 }}>
                {(() => {
                  const maxCount = Math.max(...ageData.map(d => d.count), 1)
                  return ageData.map((d, i) => {
                    const heightPct = (d.count / maxCount) * 100
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                        {/* Tooltip on Hover */}
                        <div className="chart-bar-tooltip" style={{
                          position: 'absolute', bottom: `calc(${heightPct}% + 4px)`,
                          background: 'var(--color-navy)', color: '#fff', fontSize: 10,
                          fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                          pointerEvents: 'none', transition: 'opacity 0.2s', opacity: 0,
                          whiteSpace: 'nowrap', zIndex: 5
                        }}>
                          {d.count}
                        </div>
                        {/* Bar */}
                        <div
                          className="chart-bar"
                          style={{
                            width: '100%',
                            maxWidth: 32,
                            height: `${heightPct}%`,
                            background: 'linear-gradient(to top, var(--color-navy), var(--color-teal))',
                            borderRadius: '6px 6px 0 0',
                            transition: 'height 0.8s ease-out, opacity 0.2s',
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    )
                  })
                })()}
              </div>
              {/* Labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, paddingTop: 4 }}>
                {ageData.map((d, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Nationalities Progress List */}
        <div style={glassCardStyle}>
          <h3 style={chartTitleStyle}>{t('adminDashboard.topNationalities')}</h3>
          {topNationalities.length === 0 ? (
            <div style={emptyChartStyle}>{t('adminDashboard.noDemographics')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 180, justifyContent: 'center' }}>
              {topNationalities.map((n, i) => {
                const pct = totalPlayersCount > 0 ? Math.round((n.count / totalPlayersCount) * 100) : 0
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
                      <span>{n.country}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{n.count} ({pct}%)</span>
                    </div>
                    {/* Progress Track */}
                    <div style={{ height: 8, borderRadius: 4, background: 'var(--color-gray-light)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'linear-gradient(to right, var(--color-orange), var(--color-yellow))',
                        borderRadius: 4,
                        transition: 'width 0.8s ease-out'
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 3. PRIZES & REDEMPTION SECTION */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <h2 style={sectionHeaderStyle}>
        <i className="ri-gift-2-line" style={{ marginRight: 8, color: 'var(--color-navy)' }} />
        {t('adminDashboard.prizesTitle')}
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24,
        marginBottom: 32
      }}>
        {/* Code Lifecycle Funnel */}
        <div style={glassCardStyle}>
          <h3 style={chartTitleStyle}>{t('adminDashboard.prizesRedemption')}</h3>
          {totalCodesCount === 0 ? (
            <div style={emptyChartStyle}>{t('adminDashboard.noPrizes')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 180, justifyContent: 'center' }}>
              {/* Stat Block: Generated */}
              <div style={lifecycleBlockStyle('rgba(27,43,110,0.05)', 'var(--color-navy)')}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-navy)', opacity: 0.8 }}>
                  {t('adminDashboard.totalCodes')}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-navy)', fontFamily: 'var(--font-display)' }}>
                    {totalCodesCount}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>100%</span>
                </div>
              </div>

              {/* Stat Block: Ready */}
              <div style={lifecycleBlockStyle('rgba(43,191,184,0.05)', 'var(--color-teal)')}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-teal)' }}>
                  {t('adminDashboard.activeCodes')}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-teal)', fontFamily: 'var(--font-display)' }}>
                    {activeCodesCount}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-teal)' }}>
                    {totalCodesCount > 0 ? Math.round((activeCodesCount / totalCodesCount) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Stat Block: Claimed */}
              <div style={lifecycleBlockStyle('rgba(60,173,66,0.05)', 'var(--color-green)')}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-green)' }}>
                  {t('adminDashboard.claimedCodes')}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-green)', fontFamily: 'var(--font-display)' }}>
                    {claimedCodesCount}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-green)' }}>
                    {redemptionRate}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Redemptions by Category (Horizontal Bar Chart) */}
        <div style={glassCardStyle}>
          <h3 style={chartTitleStyle}>{t('adminDashboard.prizesByCategory')}</h3>
          {categoryClaimsData.length === 0 ? (
            <div style={emptyChartStyle}>{t('adminDashboard.noPrizes')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 180, justifyContent: 'center' }}>
              {(() => {
                const maxCount = Math.max(...categoryClaimsData.map(d => d.count), 1)
                return categoryClaimsData.map((d, i) => {
                  const pct = Math.round((d.count / maxCount) * 100)
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 90, fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {d.category}
                      </span>
                      <div style={{ flex: 1, height: 16, borderRadius: 4, background: 'var(--color-gray-light)', overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: 'linear-gradient(to right, var(--color-navy), var(--color-teal))',
                          borderRadius: 4,
                          transition: 'width 0.8s ease-out'
                        }} />
                        <span style={{
                          position: 'absolute', right: 8, top: 0, bottom: 0,
                          display: 'flex', alignItems: 'center', fontSize: 10,
                          fontWeight: 800, color: pct > 80 ? '#fff' : 'var(--color-text-muted)'
                        }}>
                          {d.count}
                        </span>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          )}
        </div>

        {/* Top Claimed Prizes list */}
        <div style={glassCardStyle}>
          <h3 style={chartTitleStyle}>Premios Más Populares</h3>
          {topClaimedPrizes.length === 0 ? (
            <div style={emptyChartStyle}>{t('adminDashboard.noPrizes')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 180, justifyContent: 'center' }}>
              {topClaimedPrizes.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-gray-light)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--color-gray-mid)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {p.category}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ background: 'var(--color-green)', color: '#fff', fontSize: 11, fontWeight: 900, padding: '3px 8px', borderRadius: 20 }}>
                      {p.count} canjes
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 4. GAME ENGAGEMENT SECTION */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <h2 style={sectionHeaderStyle}>
        <i className="ri-radar-line" style={{ marginRight: 8, color: 'var(--color-navy)' }} />
        {t('adminDashboard.gameStatsTitle')}
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24,
        marginBottom: 32
      }}>
        {/* Engagement circular segments: Correct vs Wrong */}
        <div style={glassCardStyle}>
          <h3 style={chartTitleStyle}>Aciertos vs Errores</h3>
          {totalAttemptsCount === 0 ? (
            <div style={emptyChartStyle}>{t('adminDashboard.noAttempts')}</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', minHeight: 180 }}>
              {/* Donut Chart */}
              <div style={{ position: 'relative', width: 130, height: 130 }}>
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--color-gray-light)" strokeWidth="12" />
                  {(() => {
                    const radius = 38
                    const circ = 2 * Math.PI * radius
                    const correctPct = correctAttemptsCount / totalAttemptsCount
                    const offset = circ - (correctPct * circ)
                    return (
                    <>
                      {/* Correct segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="var(--color-green)"
                        strokeWidth="12"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        transform="rotate(-90 50 50)"
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                      />
                    </>
                  )
                  })()}
                </svg>
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-green)', fontFamily: 'var(--font-display)' }}>
                    {correctRate}%
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 800 }}>
                    ACIERTOS
                  </span>
                </div>
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-green)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700 }}>
                      {t('adminDashboard.correctText')}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>
                      {correctAttemptsCount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-gray-mid)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700 }}>
                      {t('adminDashboard.incorrectText')}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>
                      {(totalAttemptsCount - correctAttemptsCount).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 9, color: 'var(--color-gray-mid)', fontWeight: 800 }}>
                    TIEMPO RESPUESTA
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-navy)' }}>
                    {avgTimeSecs}s promedio
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hardest Questions Top 5 */}
        <div style={{ ...glassCardStyle, gridColumn: 'span 2' }}>
          <h3 style={chartTitleStyle}>{t('adminDashboard.hardestQuestions')}</h3>
          {hardestQuestions.length === 0 ? (
            <div style={emptyChartStyle}>{t('adminDashboard.noAttempts')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 180, justifyContent: 'center' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 150px 100px 100px',
                gap: 8,
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: 6,
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--color-gray-dark)',
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}>
                <span>{t('adminDashboard.questionCol')}</span>
                <span>{t('adminDashboard.stopCol')}</span>
                <span style={{ textAlign: 'center' }}>{t('adminDashboard.attemptsCol')}</span>
                <span style={{ textAlign: 'center' }}>{t('adminDashboard.successRateCol')}</span>
              </div>

              {hardestQuestions.map((q, i) => (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 150px 100px 100px',
                  gap: 8,
                  alignItems: 'center',
                  fontSize: 12,
                  padding: '4px 0',
                  color: 'var(--color-text)'
                }}>
                  <span style={{ fontWeight: 700, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={q.text}>
                    {q.text}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>
                    {q.stopName}
                  </span>
                  <span style={{ textAlign: 'center', fontWeight: 600 }}>
                    {q.total} {t('adminDashboard.attemptsLabel')}
                  </span>
                  <span style={{ textAlign: 'center' }}>
                    <span style={{
                      background: 'rgba(230,51,41,0.08)', color: 'var(--color-error)',
                      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 800
                    }}>
                      {q.rate}%
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Embedded tooltips & bar hovers CSS styling */}
      <style>{`
        .chart-bar:hover {
          opacity: 0.85;
        }
        .chart-bar:hover + .chart-bar-tooltip {
          opacity: 1 ! from { transform: translateY(2px); }
        }
      `}</style>

    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// STYLE OBJECTS
// ────────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  borderRadius: 16,
  padding: '20px 24px',
  boxShadow: 'var(--shadow-card)',
  border: '1px solid var(--color-border)',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  animation: 'slide-up 0.3s ease-out'
}

const metricIconWrapperStyle = (bgColor: string, color: string): React.CSSProperties => ({
  width: 50,
  height: 50,
  borderRadius: 12,
  background: bgColor,
  color: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
})

const metricLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: 'var(--color-gray-mid)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 2
}

const metricValueStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 900,
  color: 'var(--color-navy)',
  fontFamily: 'var(--font-display)',
  lineHeight: 1
}

const metricSubtextStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-muted)',
  marginTop: 4
}

const sectionHeaderStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  color: 'var(--color-navy)',
  fontSize: 20,
  margin: '28px 0 16px',
  display: 'flex',
  alignItems: 'center'
}

const glassCardStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  borderRadius: 20,
  padding: 24,
  boxShadow: 'var(--shadow-card)',
  border: '1px solid var(--color-border)',
  animation: 'slide-up 0.4s ease-out',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
}

const chartTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  color: 'var(--color-navy)',
  fontSize: 15,
  margin: '0 0 16px'
}

const emptyChartStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 180,
  fontSize: 13,
  color: 'var(--color-gray-mid)',
  textAlign: 'center',
  border: '1px dashed var(--color-border)',
  borderRadius: 12,
  padding: 16
}

const lifecycleBlockStyle = (bgColor: string, color: string): React.CSSProperties => ({
  background: bgColor,
  border: `1px solid ${bgColor.replace('0.05', '0.12')}`,
  color: color,
  borderRadius: 12,
  padding: '12px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4
})
