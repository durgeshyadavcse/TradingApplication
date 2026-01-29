import React from 'react'

export default function QuickActions({ onBuy, onSell, symbols = ['AAPL','MSFT','GOOG','TSLA'] }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#05060a]/60 to-[#071127]/50 border border-white/6 p-4 neon-glow">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-white">Quick Actions</h4>
        <p className="text-xs text-white/50">Instant trade</p>
      </div>

      <div className="flex gap-2 mb-3">
        <select className="flex-1 bg-[#071127] border border-white/6 rounded-lg px-3 py-2 text-white/80" defaultValue={symbols[0]}>
          {symbols.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input className="w-20 bg-[#071127] border border-white/6 rounded-lg px-3 py-2 text-white/80" type="number" defaultValue={1} min={1} />
      </div>

      <div className="flex gap-2">
        <button onClick={onBuy} className="flex-1 py-2 rounded-lg font-bold text-black bg-gradient-to-r from-green-300 to-emerald-300 hover:scale-[1.02] transform transition shadow-[0_8px_30px_rgba(34,197,94,0.16)]">
          Buy
        </button>
        <button onClick={onSell} className="flex-1 py-2 rounded-lg font-bold text-black bg-gradient-to-r from-pink-400 to-rose-400 hover:scale-[1.02] transform transition shadow-[0_8px_30px_rgba(255,112,114,0.16)]">
          Sell
        </button>
      </div>
    </div>
  )
}
