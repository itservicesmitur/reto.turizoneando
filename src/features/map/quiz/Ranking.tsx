interface Props {
  onClose: () => void
  onContinue: () => void
}

interface Player {
  rank: number
  name: string
  score: number
  country: string
  flag: string
  avatar: string
  isSelf?: boolean
}

import { useTranslation } from 'react-i18next'

export default function Ranking({ onClose, onContinue }: Props) {
  const { t } = useTranslation()

  const podiumPlayers: Player[] = [
    { rank: 2, name: 'John Adams', score: 23, country: 'Australia', flag: '🇦🇺', avatar: 'ri-user-smile-line' },
    { rank: 1, name: 'Tim Brown', score: 25, country: 'Estados Unidos', flag: '🇺🇸', avatar: 'ri-user-star-line' },
    { rank: 3, name: 'Mike Miller', score: 21, country: 'Canadá', flag: '🇨🇦', avatar: 'ri-user-heart-line' }
  ]

  const listPlayers: Player[] = [
    { rank: 4, name: 'Steve Taylor', score: 19, country: 'Australia', flag: '🇦🇺', avatar: 'ri-user-2-line' },
    { rank: 5, name: 'Rob Weber', score: 18, country: 'Alemania', flag: '🇩🇪', avatar: 'ri-user-4-line' },
    { rank: 6, name: 'Josué (Tú)', score: 17, country: 'Rep. Dominicana', flag: '🇩🇴', avatar: 'ri-user-6-line', isSelf: true },
    { rank: 7, name: 'Serhiy Demchenko', score: 16, country: 'Ucrania', flag: '🇺🇦', avatar: 'ri-user-3-line' },
    { rank: 8, name: 'Anne Bonny', score: 14, country: 'Irlanda', flag: '🇮🇪', avatar: 'ri-user-5-line' },
    { rank: 9, name: 'Barbanegra', score: 12, country: 'Reino Unido', flag: '🇬🇧', avatar: 'ri-user-line' }
  ]

  return (
    <div
      className="absolute inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in animate-duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full rounded-2xl overflow-hidden flex flex-col quiz-card-enter"
        style={{
          background: 'var(--color-map-cream)',
          border: '8px solid var(--color-map-wood-dark)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6), inset 0 0 0 2px var(--color-map-gold), inset 0 0 16px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Metal Corners */}
        <svg className="absolute -top-px -left-px w-9 h-9 pointer-events-none z-30 text-map-gold-light" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 20V3h17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11c3 0 8-5 8-8M3 7c1.5 0 4-2.5 4-4" strokeLinecap="round" />
          <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <svg className="absolute -top-px -right-px w-9 h-9 pointer-events-none z-30 text-map-gold-light transform scale-x-[-1]" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 20V3h17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11c3 0 8-5 8-8M3 7c1.5 0 4-2.5 4-4" strokeLinecap="round" />
          <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <svg className="absolute -bottom-px -left-px w-9 h-9 pointer-events-none z-30 text-map-gold-light transform scale-y-[-1]" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 20V3h17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11c3 0 8-5 8-8M3 7c1.5 0 4-2.5 4-4" strokeLinecap="round" />
          <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <svg className="absolute -bottom-px -right-px w-9 h-9 pointer-events-none z-30 text-map-gold-light transform scale-[-1]" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 20V3h17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11c3 0 8-5 8-8M3 7c1.5 0 4-2.5 4-4" strokeLinecap="round" />
          <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
        </svg>

        {/* Close Button */}
        <div className="absolute top-4 right-4 z-40">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-map-wood-dark text-map-gold-light border border-map-gold active:scale-90 transition-all shadow-md"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Top stripe */}
        <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold-light),var(--color-map-gold),var(--color-map-gold-light),transparent)' }} />

        {/* Header */}
        <div className="text-center mt-6 shrink-0">
          <h2 className="text-2xl font-black text-map-wood-dark font-serif tracking-wide leading-none">{t('map.ranking_title')}</h2>
          <p className="text-xs text-map-gold italic mt-1.5 font-serif font-bold">{t('map.ranking_subtitle')}</p>
        </div>

        {/* Sticky Controls */}
        <div className="px-4 pt-3 flex flex-col gap-4 shrink-0">
          {/* Podium (Top 3) */}
          <div className="flex items-end justify-center gap-2 px-1 py-1">
            {podiumPlayers.map((p) => {
              const isFirst = p.rank === 1
              const cardHeight = isFirst ? 'h-34' : 'h-30'
              const medalColor = p.rank === 1 ? 'var(--color-map-gold-light)' : p.rank === 2 ? 'var(--color-map-cream)' : 'var(--color-map-tan)'
              const borderColor = p.rank === 1 ? 'var(--color-map-gold-light)' : 'var(--color-map-gold)'

              return (
                <div
                  key={p.rank}
                  className={`flex-1 ${cardHeight} rounded-xl flex flex-col items-center justify-center relative p-2 text-center`}
                  style={{
                    background: 'var(--color-map-cream-light)',
                    border: `2px solid ${borderColor}`,
                    boxShadow: isFirst ? '0 6px 16px rgba(252,211,77,0.3), inset 0 0 6px rgba(0,0,0,0.05)' : '0 4px 10px rgba(0,0,0,0.15)',
                  }}
                >
                  {/* Rank Badge */}
                  <div
                    className="absolute -top-3.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-md border-2 border-map-wood-dark"
                    style={{ background: medalColor, color: 'var(--color-map-wood-dark)' }}
                  >
                    {p.rank === 1 ? <i className="ri-vip-crown-fill text-[11px]" /> : p.rank}
                  </div>

                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl mb-1 mt-1 border-2 border-map-wood-dark"
                    style={{
                      background: p.rank === 1 ? 'radial-gradient(circle, var(--color-map-gold-light), var(--color-map-gold))' : 'rgba(50,30,15,0.08)',
                      color: p.rank === 1 ? 'var(--color-map-wood-dark)' : 'var(--color-map-gold)'
                    }}
                  >
                    <i className={p.avatar} />
                  </div>

                  {/* Name */}
                  <span className="text-[10px] font-black text-map-wood-dark truncate w-full max-w-[70px]">
                    {p.name}
                  </span>

                  {/* Score */}
                  <span className="text-xs font-black text-map-gold leading-none my-0.5">
                    {p.score}
                  </span>

                  {/* Flag */}
                  <div className="flex items-center gap-0.5 text-[8px] text-map-gold/80 font-bold truncate max-w-[75px]">
                    <span>{p.flag}</span>
                    <span className="truncate">{p.country}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Table Header */}
          <div className="flex border-b border-map-gold/30 pb-1 text-[10px] font-black uppercase tracking-wider text-map-gold mt-1 shrink-0">
            <span className="w-8 text-center shrink-0">{t('map.ranking_pos')}</span>
            <span className="flex-1 pl-10">{t('map.ranking_user')}</span>
            <span className="w-12 text-right shrink-0">{t('map.ranking_challenges')}</span>
          </div>
        </div>

        {/* Scrollable Player List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5 min-h-0">
          {listPlayers.map((p) => (
            <div
              key={p.rank}
              className="flex items-center justify-between px-4 py-3 rounded-xl border transition-all"
              style={{
                background: p.isSelf ? 'linear-gradient(90deg, var(--color-map-cream-light) 0%, var(--color-map-cream) 100%)' : 'var(--color-map-cream-light)',
                borderColor: p.isSelf ? 'var(--color-map-gold)' : 'var(--color-map-tan)',
                borderWidth: p.isSelf ? '2.5px' : '1.5px',
                boxShadow: p.isSelf ? '0 4px 12px rgba(168,127,42,0.25)' : '0 2px 6px rgba(0,0,0,0.05)',
              }}
            >
              <div className="flex-1 flex items-center min-w-0">
                {/* Rank */}
                <span
                  className={`text-sm font-black w-8 text-center shrink-0 ${p.isSelf ? 'text-map-gold' : 'text-map-wood-dark'}`}
                >
                  {p.rank}
                </span>

                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-base border border-map-wood-dark shrink-0 ml-2"
                  style={{
                    background: p.isSelf ? 'radial-gradient(circle, var(--color-map-gold-light), var(--color-map-gold))' : 'var(--color-map-cream)',
                    color: p.isSelf ? 'var(--color-map-wood-dark)' : 'var(--color-map-gold)'
                  }}
                >
                  <i className={p.avatar} />
                </div>

                {/* Name and flag */}
                <div className="flex flex-col ml-3 min-w-0">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs font-serif leading-none truncate ${p.isSelf ? 'font-black text-map-wood-dark' : 'font-bold text-map-wood-dark'}`}
                    >
                      {p.name}
                    </span>
                    {p.isSelf && <i className="ri-star-fill text-map-gold text-[10px]" />}
                  </div>
                  <div className="flex items-center gap-0.5 text-[8px] text-map-gold/75 font-bold mt-0.5">
                    <span>{p.flag}</span>
                    <span className="truncate">{p.country}</span>
                  </div>
                </div>
              </div>

              {/* Score */}
              <span className="text-xs font-black text-map-wood-dark w-12 text-right shrink-0">
                {p.score}
              </span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div
          className="px-5 pb-6 pt-3 shrink-0 z-10"
          style={{ background: 'var(--color-map-cream)', borderTop: '1px solid rgba(168,127,42,0.15)' }}
        >
          <button
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-xs font-black uppercase tracking-widest transition-all active:scale-95"
            style={{
              background: 'linear-gradient(90deg,var(--color-map-wood-dark),var(--color-map-wood-mid),var(--color-map-wood-dark))',
              border: '2px solid var(--color-map-gold)',
              color: 'var(--color-map-gold-light)',
              boxShadow: 'inset 0 0 8px rgba(252,211,77,0.25), 0 6px 16px rgba(0,0,0,0.35)',
            }}
          >
            {t('map.back_to_adventure')}
            <i className="ri-arrow-right-line text-base" />
          </button>
        </div>

        {/* Bottom stripe */}
        <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,var(--color-map-gold),var(--color-map-gold-light),var(--color-map-gold),transparent)' }} />
      </div>
    </div>
  )
}
