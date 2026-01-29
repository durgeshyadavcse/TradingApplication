

export default function NewsCard({ news }) {
  const timeAgo = Math.round((Date.now() - news.timestamp.getTime()) / (60 * 1000))
  const hours = Math.floor(timeAgo / 60)
  const minutes = timeAgo % 60
  const timeString = hours > 0 ? `${hours}h ago` : `${minutes}m ago`

  const sentimentColor = {
    positive: 'from-green-500/10 to-emerald-500/5 border-green-500/30 hover:border-green-400/50',
    neutral: 'from-white/5 to-white/5 border-white/10 hover:border-white/20',
    negative: 'from-red-500/10 to-rose-500/5 border-red-500/30 hover:border-red-400/50'
  }

  const sentimentGlow = {
    positive: 'group-hover:shadow-[0_0_25px_rgba(34,197,94,0.2)]',
    neutral: 'group-hover:shadow-[0_0_25px_rgba(100,150,255,0.2)]',
    negative: 'group-hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]'
  }

  const sentimentBadge = {
    positive: 'bg-green-500/20 text-green-400 border border-green-500/50',
    neutral: 'bg-blue-500/20 text-blue-400 border border-blue-500/50',
    negative: 'bg-red-500/20 text-red-400 border border-red-500/50'
  }

  return (
    <div className={`group relative rounded-xl sm:rounded-2xl p-4 sm:p-5 backdrop-blur-xl transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden border bg-gradient-to-br ${sentimentColor[news.sentiment]} ${sentimentGlow[news.sentiment]}`}>
    
      <div className={`absolute -inset-1 opacity-0 group-hover:opacity-100 blur transition-all duration-300 ${
        news.sentiment === 'positive' ? 'bg-green-500/20' :
        news.sentiment === 'neutral' ? 'bg-blue-500/20' :
        'bg-red-500/20'
      }`}></div>

      
      <div className="relative z-10 space-y-3">
        
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2">
              {news.title}
            </h3>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-lg whitespace-nowrap flex-shrink-0 ${sentimentBadge[news.sentiment]}`}>
            {news.sentiment === 'positive' ? '📈' : news.sentiment === 'neutral' ? '➡️' : '📉'}
          </span>
        </div>

       
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="inline-block px-2 py-1 rounded-lg bg-white/5 border border-blue-500/30 text-blue-400 text-xs font-semibold">
              {news.symbol}
            </span>
          </div>
          <p className="text-xs text-white/60 group-hover:text-white/80 transition-colors">
            {timeString}
          </p>
        </div>
      </div>

      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
        news.sentiment === 'positive' ? 'shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]' :
        news.sentiment === 'neutral' ? 'shadow-[inset_0_0_20px_rgba(100,150,255,0.1)]' :
        'shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]'
      }`}></div>
    </div>
  )
}
