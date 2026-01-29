import { useEffect, useMemo, useState } from 'react'
import { useLiveprices } from '../hooks/useLiveprices'
import QuickActions from '../components/ui/QuickActions'
import SkeletonCard from '../components/common/SkeletonCard'
import BalanceCard from '../components/trade/BalanceCard'

export default function Dashboard() {
  const [symbol, setSymbol] = useState('AAPL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])

  const apiBase = useMemo(() => import.meta.env.VITE_API_BASE || 'http://localhost:5000', [])

  
  const trendingSymbols = ['AAPL', 'MSFT', 'GOOG', 'AMZN']
  const [trending, setTrending] = useState([])
  const [trendingLoading, setTrendingLoading] = useState(false)


  const symbols = useMemo(() => ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'NVDA', 'TSLA', 'META', 'NFLX'], [])
  const { prices, connected } = useLiveprices(symbols)

  async function fetchHistory() {
    setError('')
    setLoading(true)
    try {
      const sym = String(symbol || '').trim().toUpperCase()
      if (!sym) throw new Error('Enter a symbol')
      const res = await fetch(`${apiBase}/api/stocks/${encodeURIComponent(sym)}/history`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load history')
      }
      const data = await res.json()
      setHistory(Array.isArray(data.data) ? data.data : [])
    } catch (err) {
      setError(err.message || 'Failed to load history')
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  
  useEffect(() => {
    let active = true
    async function load() {
      setTrendingLoading(true)
      try {
        const results = trendingSymbols.map(sym => {
          const priceData = prices[sym]
          return {
            symbol: sym,
            price: priceData?.price || null,
            change: priceData?.change || 0,
            high: priceData?.high || 0,
            low: priceData?.low || 0,
            series: Array.from({ length: 12 }, () => Math.random() * 100 + 50)
          }
        })
        if (active) setTrending(results)
      } catch (e) {
        if (active) setTrending([])
      } finally {
        if (active) setTrendingLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [prices])

  
  const handleQuickBuy = () => {
    
    setLoading(true)
    setTimeout(() => {
      setHistory(h => {
        const next = [...h]
        next.push({ date: new Date().toLocaleString(), price: (Math.random() * 300 + 50) })
        return next.slice(-24)
      })
      setLoading(false)
    }, 800)
  }

  const handleQuickSell = () => {
    setLoading(true)
    setTimeout(() => {
      setHistory(h => {
        const next = [...h]
        next.push({ date: new Date().toLocaleString(), price: (Math.random() * 300 + 50) })
        return next.slice(-24)
      })
      setLoading(false)
    }, 800)
  }

  return (
    <div className="grid gap-8">
      <div>
        <h2 className="mt-0 text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Dashboard</h2>
        <p className="text-slate-400 text-sm mt-1">Monitor live markets and trending stocks</p>
      </div>

      
      <section className="relative">
       
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600/20 via-blue-600/10 to-transparent rounded-3xl blur-3xl opacity-50"></div>
        
        <div className="relative rounded-3xl border border-cyan-500/30 bg-slate-900/50 backdrop-blur-xl p-8 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white mb-1">LIVE INTERACTIVE CHART</h3>
            <p className="text-cyan-400/70 text-sm">Real-time market data visualization</p>
          </div>
          
          {history.length > 0 ? (
            <div className="space-y-4">
              <div className="h-80 rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-4 overflow-hidden">
               
                <svg width="100%" height="100%" viewBox="0 0 300 200" preserveAspectRatio="none" className="absolute opacity-10">
                  <defs>
                    <pattern id="grid" width="30" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 20" fill="none" stroke="#06b6d4" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="300" height="200" fill="url(#grid)" />
                </svg>
                
                
                <svg width="100%" height="100%" viewBox="0 0 300 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5"/>
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.01"/>
                    </linearGradient>
                  </defs>
                  {(() => {
                    const prices = history.map(h => h.price)
                    const min = Math.min(...prices)
                    const max = Math.max(...prices)
                    const range = max - min || 1
                    const toX = (i) => (i / (history.length - 1)) * 300
                    const toY = (p) => 200 - ((p - min) / range) * 200
                    const d = history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(h.price)}`).join(' ')
                    const pathData = d + ` L 300 200 L 0 200 Z`
                    return (
                      <>
                        <path d={d} fill="none" stroke="#06b6d4" strokeWidth="2" opacity="0.8" />
                        <path d={pathData} fill="url(#chartGradient)" />
                      </>
                    )
                  })()}
                </svg>
              </div>
              
             
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-800/50 border border-cyan-500/20 p-3">
                  <span className="text-cyan-400/70 text-xs">Current Price</span>
                  <div className="text-xl font-bold text-white mt-1">${history[history.length - 1].price.toFixed(2)}</div>
                </div>
                <div className="rounded-lg bg-slate-800/50 border border-cyan-500/20 p-3">
                  <span className="text-cyan-400/70 text-xs">High</span>
                  <div className="text-xl font-bold text-white mt-1">${Math.max(...history.map(h => h.price)).toFixed(2)}</div>
                </div>
                <div className="rounded-lg bg-slate-800/50 border border-cyan-500/20 p-3">
                  <span className="text-cyan-400/70 text-xs">Low</span>
                  <div className="text-xl font-bold text-white mt-1">${Math.min(...history.map(h => h.price)).toFixed(2)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-80 rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-slate-800/50 to-slate-900/50 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-cyan-500/40 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-slate-400">Load a stock symbol to view live chart</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">Top Trending Stocks</h3>
            <p className="text-slate-400 text-sm mt-1">Market leaders and movers</p>
          </div>
          {trendingLoading && <span className="text-sm text-cyan-400/70 animate-pulse">Loading…</span>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {trending.map((t) => (
            <div 
              key={t.symbol} 
              className="group relative rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-md p-5 shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            >
             
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-blue-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
               
                <div className="flex items-baseline justify-between mb-4">
                  <div className="text-cyan-300 font-bold text-lg">{t.symbol}</div>
                  <div className="text-white font-black text-2xl">{t.price != null ? `$${t.price.toFixed(2)}` : '—'}</div>
                </div>

               
                <div className={`inline-block px-2 py-1 rounded text-xs font-bold mb-3 ${t.change >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {t.change >= 0 ? '+' : ''}{t.change?.toFixed(2) || '0.00'}% {t.change >= 0 ? '📈' : '📉'}
                </div>
                
               
                <div className="h-12 rounded-lg bg-slate-900/30 border border-cyan-500/10 overflow-hidden p-1">
                  <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
                    {(() => {
                      const series = t.series && t.series.length ? t.series : [1]
                      const min = Math.min(...series)
                      const max = Math.max(...series)
                      const range = max - min || 1
                      const toX = (i) => (i / (series.length - 1)) * 100
                      const toY = (p) => 40 - ((p - min) / range) * 40
                      const d = series.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p)}`).join(' ')
                      return (
                        <g>
                          <path d={d} fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.9" />
                          <path d={d + ' L 100 40 L 0 40 Z'} fill="url(#miniGradient)" />
                          <defs>
                            <linearGradient id="miniGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3"/>
                              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.01"/>
                            </linearGradient>
                          </defs>
                        </g>
                      )
                    })()}
                  </svg>
                </div>

               
                <div className="mt-2 text-xs text-slate-400 flex justify-between">
                  <span>H: ${t.high?.toFixed(2) || '—'}</span>
                  <span>L: ${t.low?.toFixed(2) || '—'}</span>
                </div>
              </div>
            </div>
          ))}
          {!trendingLoading && trending.length === 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-slate-500">Connecting to live prices...</p>
            </div>
          )}
        </div>
      </section>

     
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
        <span className="text-slate-400">{connected ? '✓ Live prices connected' : '⟳ Connecting to live prices...'}</span>
      </div>

    
      <section className="mt-4">
        <QuickActions onBuy={handleQuickBuy} onSell={handleQuickSell} symbols={trendingSymbols.concat(['NVDA','META','NFLX'])} />
      </section>

      
      <section className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-64">
          <label className="text-sm font-medium text-slate-300 block mb-2">Search Stock Symbol</label>
          <input 
            className="w-full rounded-lg border border-cyan-500/30 bg-slate-900/30 text-white px-4 py-3 outline-none transition-all duration-300 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:border-cyan-500/50 placeholder-slate-500" 
            value={symbol} 
            onChange={(e) => setSymbol(e.target.value)} 
            placeholder="Enter symbol (e.g., AAPL, MSFT, GOOG)" 
          />
        </div>
        <button 
          className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold px-6 py-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]" 
          onClick={fetchHistory} 
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Load Chart'}
        </button>
      </section>
      
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 p-4">
          {error}
        </div>
      )}
      
      {history.length > 0 && (
        <section className="grid gap-4">
          <h3 className="text-xl font-bold text-white">Price History - {symbol}</h3>
          <div className="overflow-x-auto rounded-lg border border-cyan-500/20 bg-slate-900/30">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-500/20 bg-slate-800/50">
                  <th className="text-left p-4 text-cyan-300 font-semibold">Date</th>
                  <th className="text-right p-4 text-cyan-300 font-semibold">Price</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row, idx) => (
                  <tr key={idx} className="border-b border-cyan-500/10 hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-slate-300">{row.date}</td>
                    <td className="p-4 text-right text-cyan-400 font-semibold">${row.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
