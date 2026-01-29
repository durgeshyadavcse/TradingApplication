import { useEffect, useMemo, useState } from 'react'
import { useLiveprices } from '../hooks/useLiveprices'

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const apiBase = useMemo(() => import.meta.env.VITE_API_BASE || 'http://localhost:5000', [])
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

 
  const symbols = useMemo(() => watchlist.map(item => item.symbol), [watchlist])
  const { prices, connected } = useLiveprices(symbols)

 
  useEffect(() => {
    const fetchWatchlist = async () => {
      setLoading(true)
      setError('')
      try {
        if (!token) throw new Error('Not authenticated')
        
        const res = await fetch(`${apiBase}/api/watchlist`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to load watchlist')
        }
        
        const data = await res.json()
        setWatchlist(Array.isArray(data.watchlist) ? data.watchlist : [])
      } catch (err) {
        setError(err.message)
     
        setWatchlist([
          { id: 1, symbol: 'AAPL', addedAt: '2025-11-25' },
          { id: 2, symbol: 'MSFT', addedAt: '2025-11-20' },
          { id: 3, symbol: 'GOOG', addedAt: '2025-11-18' },
          { id: 4, symbol: 'AMZN', addedAt: '2025-11-15' },
          { id: 5, symbol: 'TSLA', addedAt: '2025-11-10' }
        ])
      } finally {
        setLoading(false)
      }
    }
    
    fetchWatchlist()
  }, [apiBase, token])

  const handleRemove = async (id, symbol) => {
    try {
      if (token) {
        await fetch(`${apiBase}/api/watchlist/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {})
      }
      setWatchlist(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      console.error('Failed to remove:', err)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 rounded-xl bg-slate-800/30 border border-cyan-500/20 animate-pulse"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-8">
     
      <div>
        <h2 className="mt-0 text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Watchlist</h2>
        <p className="text-slate-400 text-sm mt-1">
          Track your favorite stocks with live price updates
          <span className={`ml-3 inline-block w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
          <span className="ml-2 text-xs">{connected ? 'Live' : 'Connecting...'}</span>
        </p>
      </div>

      
      {watchlist.length > 0 ? (
        <section className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600/20 via-blue-600/10 to-transparent rounded-3xl blur-3xl opacity-50"></div>
          <div className="relative rounded-3xl border border-cyan-500/30 bg-slate-900/50 backdrop-blur-xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.2)]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyan-500/20 bg-slate-800/50">
                    <th className="text-left p-6 text-cyan-300 font-semibold">Symbol</th>
                    <th className="text-right p-6 text-cyan-300 font-semibold">Last Price</th>
                    <th className="text-right p-6 text-cyan-300 font-semibold">Change %</th>
                    <th className="text-right p-6 text-cyan-300 font-semibold">High / Low</th>
                    <th className="text-center p-6 text-cyan-300 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlist.map((item, idx) => {
                    const priceData = prices[item.symbol]
                    const isPositive = priceData?.change >= 0
                    
                    return (
                      <tr 
                        key={idx} 
                        className="border-b border-cyan-500/10 hover:bg-cyan-500/10 hover:shadow-[inset_0_0_20px_rgba(6,182,212,0.2)] transition-all duration-300 group"
                      >
                     
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600/30 to-blue-600/30 border border-cyan-500/30 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
                              <span className="text-cyan-300 font-bold text-sm">{item.symbol[0]}</span>
                            </div>
                            <div>
                              <div className="text-white font-bold">{item.symbol}</div>
                              <div className="text-slate-400 text-xs">Added {item.addedAt}</div>
                            </div>
                          </div>
                        </td>

                       
                        <td className="p-6 text-right">
                          <div className="text-white font-bold text-lg group-hover:text-cyan-300 transition-colors">
                            ${priceData?.price?.toFixed(2) || '—'}
                          </div>
                          <div className={`text-xs ${connected ? 'text-green-400' : 'text-slate-400'}`}>
                            {connected ? '🔴 Live' : 'Updating...'}
                          </div>
                        </td>

                        
                        <td className="p-6 text-right">
                          <div className={`text-lg font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}{priceData?.change?.toFixed(2) || '—'}%
                          </div>
                          <div className={`text-xs ${isPositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
                            {isPositive ? '📈' : '📉'} Today
                          </div>
                        </td>

                      
                        <td className="p-6 text-right">
                          <div className="text-slate-300 text-sm">
                            <div className="text-green-400 font-semibold">${priceData?.high?.toFixed(2) || '—'}</div>
                            <div className="text-red-400 font-semibold">${priceData?.low?.toFixed(2) || '—'}</div>
                          </div>
                        </td>

                     
                        <td className="p-6 text-center">
                          <button
                            onClick={() => handleRemove(item.id, item.symbol)}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800/30 border border-cyan-500/20 text-slate-400 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-300 text-lg font-bold"
                            title="Remove from watchlist"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600/20 via-blue-600/10 to-transparent rounded-3xl blur-3xl opacity-50"></div>
          <div className="relative rounded-3xl border border-cyan-500/30 bg-slate-900/50 backdrop-blur-xl p-12 shadow-[0_0_40px_rgba(6,182,212,0.2)] text-center">
            <p className="text-slate-400 text-lg">Your watchlist is empty</p>
            <p className="text-slate-500 text-sm mt-2">Add stocks to track them here</p>
          </div>
        </section>
      )}

      {error && (
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-4 text-sm">
          {error} (Showing demo data)
        </div>
      )}
    </div>
  )
}
