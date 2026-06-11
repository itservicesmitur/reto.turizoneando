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

export default function Ranking({ onClose, onContinue }: Props) {
  

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

  // Order podium as: 2nd, 1st, 3rd for visual rendering left-to-right
  const visualPodium = [podiumPlayers[0], podiumPlayers[1], podiumPlayers[2]]

  return (
    <div
      className="absolute inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in animate-duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full rounded-2xl overflow-hidden flex flex-col quiz-card-enter"
        style={{
          background: '#ebdcc3',
          border: '8px solid #321e0f',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6), inset 0 0 0 2px #a87f2a, inset 0 0 16px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Metal Corners */}
        <svg className="absolute -top-px -left-px w-9 h-9 pointer-events-none z-30 text-[#fcd34d]" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 20V3h17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11c3 0 8-5 8-8M3 7c1.5 0 4-2.5 4-4" strokeLinecap="round" />
          <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <svg className="absolute -top-px -right-px w-9 h-9 pointer-events-none z-30 text-[#fcd34d] transform scale-x-[-1]" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 20V3h17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11c3 0 8-5 8-8M3 7c1.5 0 4-2.5 4-4" strokeLinecap="round" />
          <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <svg className="absolute -bottom-px -left-px w-9 h-9 pointer-events-none z-30 text-[#fcd34d] transform scale-y-[-1]" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 20V3h17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11c3 0 8-5 8-8M3 7c1.5 0 4-2.5 4-4" strokeLinecap="round" />
          <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        <svg className="absolute -bottom-px -right-px w-9 h-9 pointer-events-none z-30 text-[#fcd34d] transform scale-[-1]" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 20V3h17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11c3 0 8-5 8-8M3 7c1.5 0 4-2.5 4-4" strokeLinecap="round" />
          <circle cx="5" cy="5" r="1.2" fill="currentColor" stroke="none" />
        </svg>

        {/* Top Gold Clasp & Close Button */}
        <div className="absolute top-4 right-4 z-40">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#321e0f] text-[#fcd34d] border border-[#a87f2a] active:scale-90 transition-all shadow-md"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Top stripe */}
        <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,#fcd34d,#a87f2a,#fcd34d,transparent)' }} />

        {/* Header */}
        <div className="text-center mt-6 shrink-0">
          <h2 className="text-2xl font-black text-[#321e0f] font-serif tracking-wide leading-none">Clasificación</h2>
          <p className="text-xs text-[#6b4a20] italic mt-1.5 font-serif font-bold">Los piratas mas duros del Caribe</p>
        </div>

        {/* Sticky Controls (Podium + Tabs + Table Header) */}
        <div className="px-4 pt-3 flex flex-col gap-4 shrink-0">
          {/* Podium (Top 3) */}
          <div className="flex items-end justify-center gap-2 px-1 py-1">
            {visualPodium.map((p) => {
              const isFirst = p.rank === 1
              const cardHeight = isFirst ? 'h-34' : 'h-30'
              const medalColor = p.rank === 1 ? '#fcd34d' : p.rank === 2 ? '#d1d5db' : '#c7a361'
              const borderColor = p.rank === 1 ? '#fcd34d' : '#a87f2a'
              
              return (
                <div
                  key={p.rank}
                  className={`flex-1 ${cardHeight} rounded-xl flex flex-col items-center justify-center relative p-2 text-center`}
                  style={{
                    background: '#fcf7ed',
                    border: `2px solid ${borderColor}`,
                    boxShadow: isFirst ? '0 6px 16px rgba(252,211,77,0.3), inset 0 0 6px rgba(0,0,0,0.05)' : '0 4px 10px rgba(0,0,0,0.15)',
                  }}
                >
                  {/* Rank Crown/Star Icon */}
                  <div
                    className="absolute -top-3.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-md border-2 border-[#321e0f]"
                    style={{ background: medalColor, color: '#321e0f' }}
                  >
                    {p.rank === 1 ? <i className="ri-vip-crown-fill text-[11px]" /> : p.rank}
                  </div>

                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl mb-1 mt-1 border-2"
                    style={{
                      background: p.rank === 1 ? 'radial-gradient(circle, #fcd34d, #a87f2a)' : 'rgba(50,30,15,0.08)',
                      borderColor: '#321e0f',
                      color: p.rank === 1 ? '#321e0f' : '#6b4a20'
                    }}
                  >
                    <i className={p.avatar} />
                  </div>

                  {/* Name */}
                  <span className="text-[10px] font-black text-[#321e0f] truncate w-full max-w-[70px]">
                    {p.name}
                  </span>

                  {/* Score */}
                  <span className="text-xs font-black text-[#a87f2a] leading-none my-0.5">
                    {p.score}
                  </span>

                  {/* Flag / Country */}
                  <div className="flex items-center gap-0.5 text-[8px] text-[#6b4a20]/80 font-bold truncate max-w-[75px]">
                    <span>{p.flag}</span>
                    <span className="truncate">{p.country}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Table Header Columns (Styled like clean tabs) */}
          <div className="flex border-b border-[#a87f2a]/30 pb-1 text-[10px] font-black uppercase tracking-wider text-[#a87f2a] mt-1 shrink-0">
            <span className="w-8 text-center shrink-0">Puesto</span>
            <span className="flex-1 pl-10">Usuario</span>
            <span className="w-12 text-right shrink-0">Retos</span>
          </div>
        </div>

        {/* Scrollable Player List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5 min-h-0">
          {listPlayers.map((p) => (
            <div
              key={p.rank}
              className="flex items-center justify-between px-4 py-3 rounded-xl border transition-all"
              style={{
                background: p.isSelf ? 'linear-gradient(90deg, #fdfbf7 0%, #f7ecd8 100%)' : '#fcf7ed',
                borderColor: p.isSelf ? '#a87f2a' : '#dfd5bf',
                borderWidth: p.isSelf ? '2.5px' : '1.5px',
                boxShadow: p.isSelf ? '0 4px 12px rgba(168,127,42,0.25)' : '0 2px 6px rgba(0,0,0,0.05)',
              }}
            >
              <div className="flex-1 flex items-center min-w-0">
                {/* Rank */}
                <span
                  className={`text-sm font-black w-8 text-center shrink-0 ${p.isSelf ? 'text-[#a87f2a]' : 'text-[#321e0f]'}`}
                >
                  {p.rank}
                </span>

                {/* Avatar inside circle */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-base border shrink-0 ml-2"
                  style={{
                    background: p.isSelf ? 'radial-gradient(circle, #fcd34d, #a87f2a)' : '#ebdcc3',
                    borderColor: '#321e0f',
                    color: p.isSelf ? '#321e0f' : '#6b4a20'
                  }}
                >
                  <i className={p.avatar} />
                </div>

                {/* Name and flag */}
                <div className="flex flex-col ml-3 min-w-0">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs font-serif leading-none truncate ${p.isSelf ? 'font-black text-[#321e0f]' : 'font-bold text-[#321e0f]'}`}
                    >
                      {p.name}
                    </span>
                    {p.isSelf && <i className="ri-star-fill text-[#a87f2a] text-[10px]" />}
                  </div>
                  <div className="flex items-center gap-0.5 text-[8px] text-[#6b4a20]/75 font-bold mt-0.5">
                    <span>{p.flag}</span>
                    <span className="truncate">{p.country}</span>
                  </div>
                </div>
              </div>

              {/* Score */}
              <span className="text-xs font-black text-[#321e0f] w-12 text-right shrink-0">
                {p.score}
              </span>
            </div>
          ))}
        </div>

        {/* Action Button at the bottom */}
        <div
          className="px-5 pb-6 pt-3 shrink-0 z-10"
          style={{ background: '#ebdcc3', borderTop: '1px solid rgba(168,127,42,0.15)' }}
        >
          <button
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-xs font-black uppercase tracking-widest transition-all active:scale-95"
            style={{
              background: 'linear-gradient(90deg,#321e0f,#503019,#321e0f)',
              border: '2px solid #a87f2a',
              color: '#fcd34d',
              boxShadow: 'inset 0 0 8px rgba(252,211,77,0.25), 0 6px 16px rgba(0,0,0,0.35)',
            }}
          >
          
            Volver a la aventura
            <i className="ri-arrow-right-line text-base" />
          </button>
        </div>

        {/* Bottom stripe */}
        <div className="h-1 shrink-0" style={{ background: 'linear-gradient(90deg,transparent,#a87f2a,#fcd34d,#a87f2a,transparent)' }} />
      </div>
    </div>
  )
}
