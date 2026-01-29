

export default function MarketMoverCard({ symbol, price, change, onSelect, isSelected }) {
  const isPositive = change >= 0

  
  const sparklineData = Array.from({ length: 12 }, (_, i) => {
    const base = 50
    const variance = Math.sin(i * 0.5 + (isPositive ? 1 : -1)) * 40
    return base + variance
  })

  return (
    <button
      onClick={onSelect}
      className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 fade-in"
    >
     
      <div className="absolute inset-0 bg-white/5 backdrop-blur-xl"></div>
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
        isPositive 
          ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5' 
          : 'bg-gradient-to-br from-red-500/10 to-red-500/5'
      }`}></div>

      
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
        isPositive 
          ? 'shadow-[0_0_25px_rgba(16,185,129,0.4)]' 
          : 'shadow-[0_0_25px_rgba(239,68,68,0.4)]'
      }`}></div>

     
      <div className={`absolute inset-0 border rounded-2xl pointer-events-none transition-all duration-300 border-white/10 group-hover:border-white/20`}></div>

     
      <div className="relative p-5 z-10">
       
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{symbol}</h3>
            <p className="text-xs text-white/60 mt-1">Stock Market</p>
          </div>
          <div className={`text-xl ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '📈' : '📉'}
          </div>
        </div>

       
        <div className="mb-4 h-12 flex items-end gap-0.5">
          {sparklineData.map((value, idx) => (
            <div
              key={idx}
              className={`flex-1 rounded-t transition-all duration-300 ${
                isPositive 
                  ? 'bg-gradient-to-t from-green-500 to-green-400 group-hover:from-green-400 group-hover:to-emerald-300' 
                  : 'bg-gradient-to-t from-red-500 to-red-400 group-hover:from-red-400 group-hover:to-rose-300'
              }`}
              style={{
                height: `${value}%`,
                opacity: 0.6 + (idx / sparklineData.length) * 0.4
              }}
            ></div>
          ))}
        </div>

     
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/60 text-xs mb-1">Price</p>
            <p className="text-2xl font-bold text-white">${price.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{change.toFixed(2)}%
            </p>
            <p className={`text-xs ${isPositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
              24h
            </p>
          </div>
        </div>

       
        <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
          isPositive 
            ? 'shadow-[inset_0_0_20px_rgba(34,197,94,0.2)]' 
            : 'shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]'
        }`}></div>
      </div>
    </button>
  )
}
