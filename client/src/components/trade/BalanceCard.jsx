

export default function BalanceCard({ balance, orderValue, orderType, loading }) {
  const totalWithOrder = balance - (orderType === 'buy' ? orderValue : -orderValue)
  const percentageUsed = (orderValue / balance * 100).toFixed(1)

  return (
    <div className="rounded-2xl bg-gradient-to-br from-blue-400/10 to-blue-500/5 backdrop-blur-xl border border-blue-500/30 p-6 overflow-hidden group hover:shadow-[0_0_25px_rgba(0,150,255,0.3)] transition-all duration-300">
      
      <div className="absolute -inset-1 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300 bg-blue-500/20"></div>

     
      <div className="relative z-10 space-y-4">
       
        <div>
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">Account Balance</p>
          <h3 className="text-3xl sm:text-4xl font-bold text-white">
            ${balance.toFixed(2)}
          </h3>
        </div>

        
        <div className="space-y-3">
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-white/70">Available</span>
              <span className="text-xs font-semibold text-blue-400">100%</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <div className="h-full w-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"></div>
            </div>
          </div>

         
          {orderValue > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-white/70">
                  After {orderType === 'buy' ? 'Purchase' : 'Sale'}
                </span>
                <span className={`text-xs font-semibold ${
                  totalWithOrder >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {percentageUsed}%
                </span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    orderType === 'buy'
                      ? 'bg-gradient-to-r from-red-500/50 to-rose-500/50'
                      : 'bg-gradient-to-r from-green-500/50 to-emerald-500/50'
                  }`}
                  style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                ></div>
              </div>
              {totalWithOrder < 0 && (
                <p className="text-xs text-red-400 mt-1 font-semibold">⚠️ Insufficient balance</p>
              )}
            </div>
          )}
        </div>

       
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-white/60 mb-1">Order Value</p>
            <p className="text-lg font-bold text-white">${orderValue.toFixed(2)}</p>
          </div>
          <div className={`rounded-lg p-3 ${
            totalWithOrder >= 0
              ? 'bg-emerald-500/10 border border-emerald-500/30'
              : 'bg-red-500/10 border border-red-500/30'
          }`}>
            <p className="text-xs mb-1 text-white/60">Remaining</p>
            <p className={`text-lg font-bold ${
              totalWithOrder >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              ${totalWithOrder.toFixed(2)}
            </p>
          </div>
        </div>

       
        {loading && (
          <div className="flex items-center justify-center gap-2 py-2">
            <svg className="w-4 h-4 animate-spin text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xs text-blue-400 font-semibold">Processing order...</span>
          </div>
        )}
      </div>

      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-[inset_0_0_20px_rgba(100,150,255,0.1)]"></div>
    </div>
  )
}
