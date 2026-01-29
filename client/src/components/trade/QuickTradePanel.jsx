

import { useState } from 'react'

export default function QuickTradePanel({ prices, balance, onTrade, onClose }) {
  const [quickSymbol, setQuickSymbol] = useState('AAPL')
  const [quickQuantity, setQuickQuantity] = useState('1')
  const [quickOrderType, setQuickOrderType] = useState('buy')
  const [quickLoading, setQuickLoading] = useState(false)

  const quickPrice = prices[quickSymbol]?.price || 150.5
  const quickOrderValue = (parseFloat(quickQuantity) || 0) * quickPrice
  const canAfford = balance >= quickOrderValue || quickOrderType === 'sell'

  const handleQuickTrade = async () => {
    setQuickLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 600))
      onTrade({
        symbol: quickSymbol,
        quantity: parseFloat(quickQuantity),
        type: quickOrderType,
        price: quickPrice,
        timestamp: new Date()
      })
      setQuickQuantity('1')
    } finally {
      setQuickLoading(false)
    }
  }

  return (
    <div className="hidden md:block fixed bottom-6 right-6 z-40 max-w-xs animate-in slide-in-up duration-500">
      <div className="relative rounded-2xl bg-gradient-to-br from-blue-400/10 to-blue-500/5 backdrop-blur-xl border border-blue-500/30 shadow-[0_0_30px_rgba(0,150,255,0.3)] overflow-hidden p-5">
       
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/10 transition-colors z-50"
          aria-label="Close quick trade panel"
        >
          <svg className="w-5 h-5 text-white/60 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

       
        <h3 className="text-lg font-bold text-white mb-4 pr-8">Quick Trade</h3>

        <div className="space-y-2 mb-4">
          <label className="text-xs font-semibold text-white/70">Symbol</label>
          <select
            value={quickSymbol}
            onChange={(e) => setQuickSymbol(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30"
          >
            {['AAPL', 'MSFT', 'GOOG', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'].map(symbol => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
          <p className="text-xs text-white/50">
            Price: <span className="text-blue-400 font-semibold">${quickPrice.toFixed(2)}</span>
          </p>
        </div>

       
        <div className="space-y-2 mb-4">
          <label className="text-xs font-semibold text-white/70">Quantity</label>
          <input
            type="number"
            min="1"
            max="1000"
            value={quickQuantity}
            onChange={(e) => setQuickQuantity(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30"
            placeholder="1"
          />
        </div>

     
        <div className="flex gap-2 mb-4 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setQuickOrderType('buy')}
            className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
              quickOrderType === 'buy'
                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setQuickOrderType('sell')}
            className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
              quickOrderType === 'sell'
                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Sell
          </button>
        </div>

        
        <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-white/60">Subtotal:</span>
            <span className="text-white font-semibold">${(quickOrderValue).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-white/50">
            <span>Est. Fee (0.5%):</span>
            <span>${(quickOrderValue * 0.005).toFixed(2)}</span>
          </div>
          <div className="border-t border-white/10 pt-1 mt-1 flex justify-between text-xs font-bold">
            <span className="text-white/70">Total:</span>
            <span className={quickOrderType === 'buy' ? 'text-red-400' : 'text-green-400'}>
              ${(quickOrderValue * 1.005).toFixed(2)}
            </span>
          </div>
        </div>

       
        <p className="text-xs text-white/50 mb-4 text-center">
          Balance: <span className={canAfford ? 'text-green-400' : 'text-red-400'}>
            ${balance.toFixed(2)}
          </span>
        </p>

     
        <button
          onClick={handleQuickTrade}
          disabled={!quickQuantity || quickLoading || (quickOrderType === 'buy' && !canAfford)}
          className={`w-full py-3 rounded-xl font-bold text-white transition-all duration-300 ${
            quickOrderType === 'buy'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-[0_0_25px_rgba(34,197,94,0.4)] disabled:from-green-900/50 disabled:to-emerald-900/50'
              : 'bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] disabled:from-red-900/50 disabled:to-rose-900/50'
          } disabled:cursor-not-allowed disabled:text-white/50`}
        >
          {quickLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            `${quickOrderType === 'buy' ? 'Buy' : 'Sell'} Now`
          )}
        </button>

        
        {quickOrderType === 'buy' && !canAfford && (
          <p className="text-xs text-red-400/70 mt-2 text-center">
            Insufficient balance for this order
          </p>
        )}
      </div>
    </div>
  )
}
