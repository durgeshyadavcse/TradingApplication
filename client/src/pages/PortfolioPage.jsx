import { useEffect, useMemo, useState } from 'react'

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState(null)
  const [holdings, setHoldings] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const apiBase = useMemo(() => import.meta.env.VITE_API_BASE || 'http://localhost:5000', [])
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  useEffect(() => {
    const fetchPortfolio = async () => {
      setLoading(true)
      setError('')
      try {
        if (!token) throw new Error('Not authenticated')
        
        const res = await fetch(`${apiBase}/api/portfolio`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to load portfolio')
        }
        
        const data = await res.json()
        setPortfolio({
          balance: data.balance || 0,
          totalValue: data.totalValue || 0,
          gainLoss: data.gainLoss || 0,
          gainLossPercent: data.gainLossPercent || 0
        })
        setHoldings(Array.isArray(data.holdings) ? data.holdings : [])
        setRecentOrders(Array.isArray(data.recentOrders) ? data.recentOrders.slice(0, 5) : [])
      } catch (err) {
        setError(err.message || 'Failed to load portfolio')
        setPortfolio({
          balance: 50000,
          totalValue: 62500,
          gainLoss: 12500,
          gainLossPercent: 25
        })
        setHoldings([
          { symbol: 'AAPL', shares: 50, price: 150, value: 7500, change: 5.2 },
          { symbol: 'MSFT', shares: 30, price: 420, value: 12600, change: -2.1 },
          { symbol: 'GOOG', shares: 20, price: 140, value: 2800, change: 8.5 },
          { symbol: 'AMZN', shares: 15, price: 180, value: 2700, change: 3.2 }
        ])
        setRecentOrders([
          { id: 1, symbol: 'AAPL', type: 'BUY', shares: 10, price: 150, date: '2025-12-01', status: 'Completed' },
          { id: 2, symbol: 'MSFT', type: 'SELL', shares: 5, price: 420, date: '2025-11-30', status: 'Completed' },
          { id: 3, symbol: 'GOOG', type: 'BUY', shares: 20, price: 140, date: '2025-11-29', status: 'Completed' },
          { id: 4, symbol: 'AMZN', type: 'BUY', shares: 15, price: 180, date: '2025-11-28', status: 'Completed' },
          { id: 5, symbol: 'TSLA', type: 'SELL', shares: 8, price: 280, date: '2025-11-27', status: 'Completed' }
        ])
      } finally {
        setLoading(false)
      }
    }
    
    fetchPortfolio()
  }, [apiBase, token])

  if (loading) {
    return (
      <div className="grid gap-8">
        <div className="h-32 rounded-2xl bg-slate-800/30 border border-cyan-500/20 animate-pulse"></div>
        <div className="h-96 rounded-2xl bg-slate-800/30 border border-cyan-500/20 animate-pulse"></div>
      </div>
    )
  }

  const holdingsTotalValue = holdings.reduce((sum, h) => sum + h.value, 0)
  const isGainPositive = portfolio?.gainLoss >= 0

  return (
    <div className="grid gap-8">
     
      <div>
        <h2 className="mt-0 text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Portfolio</h2>
        <p className="text-slate-400 text-sm mt-1">Manage your investments and track performance</p>
      </div>

    
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="relative group rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md p-6 shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-blue-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <span className="text-cyan-400/70 text-sm font-medium">Cash Balance</span>
            <div className="text-3xl font-black text-white mt-2">${portfolio?.balance?.toFixed(2) || '0.00'}</div>
            <p className="text-slate-400 text-xs mt-2">Available to invest</p>
          </div>
        </div>

       
        <div className="relative group rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md p-6 shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-blue-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <span className="text-cyan-400/70 text-sm font-medium">Total Value</span>
            <div className="text-3xl font-black text-white mt-2">${portfolio?.totalValue?.toFixed(2) || '0.00'}</div>
            <p className="text-slate-400 text-xs mt-2">Holdings + cash</p>
          </div>
        </div>

      
        <div className="relative group rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md p-6 shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-blue-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <span className="text-cyan-400/70 text-sm font-medium">Today's Gain/Loss</span>
            <div className={`text-3xl font-black mt-2 ${isGainPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isGainPositive ? '+' : ''}{portfolio?.gainLoss?.toFixed(2) || '0.00'}
            </div>
            <p className={`text-xs mt-2 ${isGainPositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
              {isGainPositive ? '+' : ''}{portfolio?.gainLossPercent?.toFixed(2) || '0.00'}%
            </p>
          </div>
        </div>

       
        <div className="relative group rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md p-6 shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-blue-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <span className="text-cyan-400/70 text-sm font-medium">Holdings Value</span>
            <div className="text-3xl font-black text-white mt-2">${holdingsTotalValue?.toFixed(2) || '0.00'}</div>
            <p className="text-slate-400 text-xs mt-2">{holdings.length} stocks</p>
          </div>
        </div>
      </div>

      <section className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600/20 via-blue-600/10 to-transparent rounded-3xl blur-3xl opacity-50"></div>
        <div className="relative rounded-3xl border border-cyan-500/30 bg-slate-900/50 backdrop-blur-xl p-8 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
          <h3 className="text-2xl font-bold text-white mb-1">Your Holdings</h3>
          <p className="text-cyan-400/70 text-sm mb-6">Current stock positions</p>
          
          {holdings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyan-500/20 bg-slate-800/50">
                    <th className="text-left p-4 text-cyan-300 font-semibold">Symbol</th>
                    <th className="text-right p-4 text-cyan-300 font-semibold">Shares</th>
                    <th className="text-right p-4 text-cyan-300 font-semibold">Price</th>
                    <th className="text-right p-4 text-cyan-300 font-semibold">Value</th>
                    <th className="text-right p-4 text-cyan-300 font-semibold">Change %</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding, idx) => (
                    <tr key={idx} className="border-b border-cyan-500/10 hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-bold text-cyan-300">{holding.symbol}</td>
                      <td className="p-4 text-right text-slate-300">{holding.shares}</td>
                      <td className="p-4 text-right text-slate-300">${holding.price?.toFixed(2) || '0.00'}</td>
                      <td className="p-4 text-right text-white font-semibold">${holding.value?.toFixed(2) || '0.00'}</td>
                      <td className={`p-4 text-right font-semibold ${holding.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {holding.change >= 0 ? '+' : ''}{holding.change?.toFixed(2) || '0.00'}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400">No holdings yet. Start investing to see your portfolio grow!</p>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
       
        <section className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-cyan-600/10 to-transparent rounded-3xl blur-3xl opacity-50"></div>
          <div className="relative rounded-3xl border border-cyan-500/30 bg-slate-900/50 backdrop-blur-xl p-8 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
            <h3 className="text-2xl font-bold text-white mb-1">Portfolio Distribution</h3>
            <p className="text-cyan-400/70 text-sm mb-6">Asset allocation breakdown</p>
            
            <div className="space-y-4">
              {holdings.slice(0, 4).map((holding, idx) => {
                const percentage = (holding.value / holdingsTotalValue) * 100
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-cyan-300 font-semibold">{holding.symbol}</span>
                      <span className="text-slate-300">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-800/50 border border-cyan-500/10 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

      
        <section className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-cyan-600/10 to-transparent rounded-3xl blur-3xl opacity-50"></div>
          <div className="relative rounded-3xl border border-cyan-500/30 bg-slate-900/50 backdrop-blur-xl p-8 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
            <h3 className="text-2xl font-bold text-white mb-1">Recent Orders</h3>
            <p className="text-cyan-400/70 text-sm mb-6">Latest trading activity</p>
            
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-cyan-500/10 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`px-3 py-1 rounded-lg text-xs font-bold ${order.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {order.type}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{order.symbol}</div>
                        <div className="text-slate-400 text-xs">{order.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">{order.shares} @ ${order.price?.toFixed(2) || '0.00'}</div>
                      <div className="text-cyan-400 text-xs">{order.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400">No recent orders</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {error && (
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-4 text-sm">
          {error} (Showing demo data)
        </div>
      )}
    </div>
  )
}
