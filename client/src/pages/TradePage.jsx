import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLiveprices } from '../hooks/useLiveprices'

const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX']

const MARKET_NEWS = [
  {
    id: 1,
    title: 'Apple Inc. announces record quarterly earnings',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    symbol: 'AAPL',
    sentiment: 'positive'
  },
  {
    id: 2,
    title: 'Tesla stock rallies on strong delivery numbers',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    symbol: 'TSLA',
    sentiment: 'positive'
  },
  {
    id: 3,
    title: 'Microsoft expands cloud infrastructure investment',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    symbol: 'MSFT',
    sentiment: 'neutral'
  },
  {
    id: 4,
    title: 'Amazon reports mixed Q3 results',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    symbol: 'AMZN',
    sentiment: 'neutral'
  },
  {
    id: 5,
    title: 'NVIDIA GPU demand remains strong in AI sector',
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
    symbol: 'NVDA',
    sentiment: 'positive'
  },
  {
    id: 6,
    title: 'Meta faces regulatory challenges in EU',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    symbol: 'META',
    sentiment: 'negative'
  }
]

export default function TradePage() {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL')
  const [searchQuery, setSearchQuery] = useState('')
  const [quickSymbol, setQuickSymbol] = useState('AAPL')
  const [quickQuantity, setQuickQuantity] = useState('1')
  const [orderType, setOrderType] = useState('buy')
  const [quantity, setQuantity] = useState('1')
  const [orderMode, setOrderMode] = useState('market')
  const [limitPrice, setLimitPrice] = useState('')
  const [orders, setOrders] = useState([])
  const [balance, setBalance] = useState(50000)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const apiBase = useMemo(() => import.meta.env.VITE_API_BASE || 'http://localhost:5000', [])
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const { prices, connected } = useLiveprices(STOCK_SYMBOLS)

  const navigate = useNavigate()
  const location = useLocation()

  // Read ?symbol= from URL and set selected symbol
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const s = params.get('symbol')
    if (s && STOCK_SYMBOLS.includes(s)) setSelectedSymbol(s)
  }, [location.search])

  // Fetch 30-day history for selected symbol from backend
  useEffect(() => {
    let ignore = false
    async function fetchHistory() {
      try {
        setHistoryLoading(true)
        const res = await fetch(`${apiBase}/api/stocks/${selectedSymbol}/history`)
        if (!res.ok) throw new Error(`Failed to load history (${res.status})`)
        const json = await res.json()
        if (!ignore && Array.isArray(json.data)) {
          setHistory(json.data)
        }
      } catch (e) {
        if (!ignore) setHistory([])
      } finally {
        if (!ignore) setHistoryLoading(false)
      }
    }
    fetchHistory()
    return () => { ignore = true }
  }, [apiBase, selectedSymbol])

  // Get current price for selected symbol
  const currentPrice = prices[selectedSymbol]?.price || 0
  const change = prices[selectedSymbol]?.change || 0
  const isPositive = change >= 0

  // Calculate order value
  const qty = parseFloat(quantity) || 0
  const price = orderMode === 'limit' ? parseFloat(limitPrice) || 0 : currentPrice
  const orderValue = qty * price

  // Load initial balance from localStorage
  useEffect(() => {
    const savedBalance = localStorage.getItem('tradeBalance')
    if (savedBalance) setBalance(parseFloat(savedBalance))
  }, [])

  // Save balance to localStorage
  useEffect(() => {
    localStorage.setItem('tradeBalance', balance)
  }, [balance])

  // Handle order submission
  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    setMessage('')

    if (!quantity || parseFloat(quantity) <= 0) {
      setMessage('Please enter valid quantity')
      setMessageType('error')
      return
    }

    if (orderMode === 'limit' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      setMessage('Please enter valid limit price')
      setMessageType('error')
      return
    }

    const finalPrice = orderMode === 'limit' ? parseFloat(limitPrice) : currentPrice
    const total = parseFloat(quantity) * finalPrice

    if (orderType === 'buy' && total > balance) {
      setMessage(`Insufficient balance. Need $${total.toFixed(2)}, have $${balance.toFixed(2)}`)
      setMessageType('error')
      return
    }

    setLoading(true)

    try {
      if (!token) {
        throw new Error('Login required to place orders')
      }

      const res = await fetch(`${apiBase}/api/portfolio/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          symbol: selectedSymbol,
          quantity: parseFloat(quantity),
          type: orderType.toUpperCase(),
          price: finalPrice
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Order failed (${res.status})`)
      }

      const json = await res.json()
      const trade = json && json.trade ? json.trade : null

      const newOrder = {
        id: trade?._id || Date.now(),
        symbol: selectedSymbol,
        type: orderType,
        quantity: parseFloat(quantity),
        price: finalPrice,
        mode: orderMode,
        timestamp: new Date(),
        status: 'executed'
      }

      if (orderType === 'buy') {
        setBalance(prev => prev - total)
      } else {
        setBalance(prev => prev + total)
      }

      setOrders(prev => [newOrder, ...prev])

      setMessage(`${orderType === 'buy' ? '✓ Buy' : '✓ Sell'} order executed: ${quantity} ${selectedSymbol} @ $${finalPrice.toFixed(2)}`)
      setMessageType('success')

      setQuantity('1')
      setLimitPrice('')

      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error placing order: ' + error.message)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // Handle quick trade
  const handleQuickTrade = async (tradeType) => {
    const quickPrice = prices[quickSymbol]?.price || 0
    const total = parseFloat(quickQuantity) * quickPrice

    if (!quickQuantity || parseFloat(quickQuantity) <= 0) {
      setMessage('Invalid quantity')
      setMessageType('error')
      return
    }

    if (tradeType === 'buy' && total > balance) {
      setMessage(`Insufficient balance. Need $${total.toFixed(2)}, have $${balance.toFixed(2)}`)
      setMessageType('error')
      return
    }

    try {
      if (!token) {
        throw new Error('Login required to place orders')
      }

      const res = await fetch(`${apiBase}/api/portfolio/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          symbol: quickSymbol,
          quantity: parseFloat(quickQuantity),
          type: tradeType.toUpperCase(),
          price: quickPrice
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Order failed (${res.status})`)
      }

      const newOrder = {
        id: Date.now(),
        symbol: quickSymbol,
        type: tradeType,
        quantity: parseFloat(quickQuantity),
        price: quickPrice,
        mode: 'market',
        timestamp: new Date(),
        status: 'executed'
      }

      if (tradeType === 'buy') {
        setBalance(prev => prev - total)
      } else {
        setBalance(prev => prev + total)
      }

      setOrders(prev => [newOrder, ...prev])
      setMessage(`✓ ${tradeType === 'buy' ? 'Buy' : 'Sell'} order executed: ${quickQuantity} ${quickSymbol} @ $${quickPrice.toFixed(2)}`)
      setMessageType('success')
      setQuickQuantity('1')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error placing order: ' + error.message)
      setMessageType('error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0B1223] to-[#020617] p-4 sm:p-6 md:p-8 lg:p-10">
      {/* Global Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in {
          animation: fadeIn 0.6s ease-out;
        }

        .fade-in-slow {
          animation: fadeIn 1s ease-out;
        }

        .slide-in-down {
          animation: slideInDown 0.6s ease-out;
        }

        .slide-in-up {
          animation: slideInUp 0.6s ease-out;
        }

        @media (max-width: 640px) {
          .responsive-padding {
            padding: 1rem;
          }
        }

        @media (min-width: 641px) and (max-width: 1024px) {
          .responsive-padding {
            padding: 1.5rem;
          }
        }

        @media (min-width: 1025px) {
          .responsive-padding {
            padding: 2rem;
          }
        }
      `}</style>

      {/* Header */}
      <div className="mb-8 slide-in-down">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Trading Terminal</h1>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${connected ? 'bg-green-500/10 border border-green-500/30' : 'bg-white/5 border border-white/10'}`}>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-white/40'}`}></div>
            <span className={`text-sm font-medium ${connected ? 'text-green-400' : 'text-white/60'}`}>
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
        <p className="text-white/60">Execute buy and sell orders with real-time prices</p>
      </div>

      {/* Stock Search Bar */}
      <div className="mb-10 lg:mb-12 flex justify-center fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="w-full max-w-2xl px-2 sm:px-0">
          <div className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value.toUpperCase())
                const filtered = STOCK_SYMBOLS.find(s => s.includes(e.target.value.toUpperCase()))
                if (filtered) setSelectedSymbol(filtered)
              }}
              placeholder="Search a stock symbol…"
              className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-3 sm:py-4 text-base sm:text-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-400/60 focus:shadow-[0_0_30px_rgba(0,150,255,0.5)] backdrop-blur-xl transition-all duration-300"
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-400 text-xl">🔍</div>
          </div>
          <p className="text-white/60 text-xs sm:text-sm mt-2 text-center">
            Quick: {STOCK_SYMBOLS.slice(0, 4).join(', ')}...
          </p>
        </div>
      </div>

      {/* Large Live Chart Section */}
      <div className="mb-10 lg:mb-12 flex justify-center fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="w-full max-w-6xl px-2 sm:px-0">
          <div className="bg-white/5 border-2 border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 backdrop-blur-xl shadow-[0_0_40px_rgba(0,150,255,0.15)] hover:shadow-[0_0_60px_rgba(0,150,255,0.25)] transition-all duration-500 overflow-hidden">
            {/* Chart Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 animate-pulse"></div>
                <h2 className="text-2xl font-bold text-white">Live Interactive Chart</h2>
                <span className="text-blue-400 font-semibold">{selectedSymbol}</span>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-400">${currentPrice.toFixed(2)}</p>
                <p className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Chart Visualization Area */}
            <div className="relative w-full h-96 bg-gradient-to-br from-white/5 to-white/5 border border-white/10 rounded-2xl p-6 overflow-hidden">
              {/* Grid Background */}
              <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" stroke="currentColor" strokeWidth="0.5" />
              </svg>

              {/* Placeholder Chart Content */}
              <div className="relative h-full flex flex-col items-center justify-center gap-4">
                {/* Mock Line Chart */}
                <svg className="w-full h-full absolute inset-0" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice">
                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.3 }} />
                      <stop offset="100%" style={{ stopColor: '#0891b2', stopOpacity: 0.05 }} />
                    </linearGradient>
                  </defs>

                  {/* Price line from backend history */}
                  <polyline
                    points={(function(){
                      const width = 800, height = 300
                      if (!history || history.length === 0) return '0,200 800,200'
                      const ps = history.map(h => Number(h.price))
                      const minP = Math.min(...ps), maxP = Math.max(...ps)
                      const range = maxP - minP || 1
                      const stepX = width / (history.length - 1)
                      return history.map((h,i)=>{
                        const x = Math.round(i*stepX)
                        const norm = (Number(h.price)-minP)/range
                        const y = Math.round(height - (norm*(height-40)+20))
                        return `${x},${y}`
                      }).join(' ')
                    })()}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Fill under line */}
                  <polygon
                    points={(function(){
                      const width = 800, height = 300
                      if (!history || history.length === 0) return `0,200 800,200 800,${height} 0,${height}`
                      const ps = history.map(h => Number(h.price))
                      const minP = Math.min(...ps), maxP = Math.max(...ps)
                      const range = maxP - minP || 1
                      const stepX = width / (history.length - 1)
                      const poly = history.map((h,i)=>{
                        const x = Math.round(i*stepX)
                        const norm = (Number(h.price)-minP)/range
                        const y = Math.round(height - (norm*(height-40)+20))
                        return `${x},${y}`
                      }).join(' ')
                      return `${poly} ${width},${height} 0,${height}`
                    })()}
                    fill="url(#chartGradient)"
                  />

                  {/* Current price indicator */}
                  <circle cx="750" cy="115" r="6" fill="#06b6d4" />
                  <circle cx="750" cy="115" r="12" fill="none" stroke="#06b6d4" strokeWidth="2" opacity="0.5">
                    <animate attributeName="r" from="12" to="25" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.8" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                </svg>

                {/* Info Overlay */}
                <div className="absolute bottom-6 left-6 right-6 flex justify-between text-xs text-white/60 pointer-events-none">
                  <span>24h Low: ${(currentPrice * 0.95).toFixed(2)}</span>
                  <span>Average: ${(currentPrice * 0.98).toFixed(2)}</span>
                  <span>24h High: ${(currentPrice * 1.05).toFixed(2)}</span>
                </div>
              </div>

              {/* Connected Status Badge */}
              <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className={`text-xs font-semibold ${connected ? 'text-green-400' : 'text-red-400'}`}>
                  {connected ? 'Live Data' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Chart Info Bar */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(0,150,255,0.3)] transition-all duration-300">
                <p className="text-white/60 text-xs mb-1">Open</p>
                <p className="text-white font-bold">${(currentPrice * 0.98).toFixed(2)}</p>
              </div>
              <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(0,200,150,0.3)] transition-all duration-300">
                <p className="text-white/60 text-xs mb-1">High</p>
                <p className="text-emerald-400 font-bold">${(currentPrice * 1.05).toFixed(2)}</p>
              </div>
              <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,100,100,0.3)] transition-all duration-300">
                <p className="text-white/60 text-xs mb-1">Low</p>
                <p className="text-red-400 font-bold">${(currentPrice * 0.95).toFixed(2)}</p>
              </div>
              <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(0,150,255,0.3)] transition-all duration-300">
                <p className="text-white/60 text-xs mb-1">Volume</p>
                <p className="text-blue-400 font-bold">2.5M</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Movers Grid */}
      <div className="mb-10 lg:mb-12 fade-in" style={{ animationDelay: '0.3s' }}>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-500 rounded-full"></span>
          Market Movers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {STOCK_SYMBOLS.map((symbol, idx) => {
            const price = prices[symbol]?.price || 0
            const change = prices[symbol]?.change || 0
            const isPositive = change >= 0

            // Generate fake mini sparkline data
            const sparklineData = Array.from({ length: 12 }, (_, i) => {
              const base = 50
              const variance = Math.sin(i * 0.5 + (isPositive ? 1 : -1)) * 40
              return base + variance
            })

            return (
              <button
                key={symbol}
                onClick={() => {
                  // navigate to trade page with symbol in query
                  navigate(`/trade?symbol=${symbol}`)
                }}
                className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 fade-in"
                style={{ animationDelay: `${0.4 + idx * 0.05}s` }}
              >
                {/* Background Layers */}
                <div className="absolute inset-0 bg-white/5 backdrop-blur-xl"></div>
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  isPositive 
                    ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5' 
                    : 'bg-gradient-to-br from-red-500/10 to-red-500/5'
                }`}></div>

                {/* Neon Glow on Hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  isPositive 
                    ? 'shadow-[0_0_25px_rgba(16,185,129,0.4)]' 
                    : 'shadow-[0_0_25px_rgba(239,68,68,0.4)]'
                }`}></div>

                {/* Border */}
                <div className={`absolute inset-0 border rounded-2xl pointer-events-none transition-all duration-300 border-white/10 group-hover:border-white/20`}></div>

                {/* Content */}
                <div className="relative p-5 z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{symbol}</h3>
                      <p className="text-xs text-white/60 mt-1">Stock Market</p>
                    </div>
                    <div className={`text-xl ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '📈' : '📉'}
                    </div>
                  </div>

                  {/* Mini Sparkline */}
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

                  {/* Price & Change */}
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

                  {/* Glow Effect on Hover */}
                  <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                    isPositive 
                      ? 'shadow-[inset_0_0_20px_rgba(34,197,94,0.2)]' 
                      : 'shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]'
                  }`}></div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Grid - Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 lg:mb-10 fade-in" style={{ animationDelay: '0.5s' }}>
        {/* Left: Trading Form - Full width on mobile, 2 cols on tablet, 2 cols on desktop */}
        <div className="md:col-span-2 lg:col-span-2">
          <form onSubmit={handlePlaceOrder} className="space-y-6">
            {/* Stock Selector Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:shadow-[0_0_20px_rgba(0,150,255,0.3)] transition-shadow duration-300">
              <label className="block text-white/80 font-semibold mb-3">Select Stock</label>
              <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                {STOCK_SYMBOLS.map(symbol => (
                  <button
                    key={symbol}
                    type="button"
                    onClick={() => setSelectedSymbol(symbol)}
                    className={`py-2 px-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
                      selectedSymbol === symbol
                        ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(0,150,255,0.4)]'
                        : 'bg-white/5 text-white/80 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Display Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:shadow-[0_0_20px_rgba(0,150,255,0.3)] transition-shadow duration-300">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-white/60 text-sm mb-1">Current Price</p>
                  <p className="text-3xl font-bold text-white">${currentPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">24h Change</p>
                  <div className={`text-2xl font-bold flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                  </div>
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">Symbol</p>
                  <p className="text-2xl font-bold text-blue-400">{selectedSymbol}</p>
                </div>
              </div>
            </div>

            {/* Order Type Selection */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:shadow-[0_0_20px_rgba(0,150,255,0.3)] transition-shadow duration-300">
              <label className="block text-white/80 font-semibold mb-3">Order Type</label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setOrderType('buy')}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    orderType === 'buy'
                      ? 'bg-green-500/20 border border-green-500/50 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.2)]'
                      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  📈 Buy
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('sell')}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    orderType === 'sell'
                      ? 'bg-red-500/20 border border-red-500/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  📉 Sell
                </button>
              </div>

              <label className="block text-white/80 font-semibold mb-3">Order Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOrderMode('market')}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    orderMode === 'market'
                      ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  ⚡ Market
                </button>
                <button
                  type="button"
                  onClick={() => setOrderMode('limit')}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    orderMode === 'limit'
                      ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  📍 Limit
                </button>
              </div>
            </div>

            {/* Quantity Input */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:shadow-[0_0_20px_rgba(0,150,255,0.3)] transition-shadow duration-300">
              <label className="block text-white/80 font-semibold mb-3">Quantity (Shares)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-400/60 focus:shadow-[0_0_20px_rgba(0,150,255,0.5)] transition-all backdrop-blur-xl"
                placeholder="Enter quantity"
              />
              <p className="text-white/60 text-sm mt-2">Total: {orderValue.toFixed(2)} USD</p>
            </div>

            {/* Limit Price Input (conditionally shown) */}
            {orderMode === 'limit' && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:shadow-[0_0_20px_rgba(0,150,255,0.3)] transition-shadow duration-300">
                <label className="block text-white/80 font-semibold mb-3">Limit Price ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-400/60 focus:shadow-[0_0_20px_rgba(0,150,255,0.5)] transition-all backdrop-blur-xl"
                  placeholder="Enter limit price"
                />
                <p className="text-white/60 text-sm mt-2">
                  Order will execute at ${limitPrice || currentPrice.toFixed(2)} or better
                </p>
              </div>
            )}

            {/* Message Alert */}
            {message && (
              <div className={`rounded-2xl p-4 border ${
                messageType === 'success'
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                orderType === 'buy'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] disabled:opacity-50'
                  : 'bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] disabled:opacity-50'
              } text-white`}
            >
              {loading ? 'Processing...' : `Place ${orderType.toUpperCase()} Order`}
            </button>
          </form>
        </div>

        {/* Right: Balance & Summary */}
        <div className="space-y-6">
          {/* Balance Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl sticky top-24 hover:shadow-[0_0_20px_rgba(0,150,255,0.3)] transition-shadow duration-300">
            <h3 className="text-white/80 font-semibold mb-4">Account Balance</h3>
            <div className="space-y-3">
              <div>
                <p className="text-white/60 text-sm mb-1">Available Balance</p>
                <p className="text-3xl font-bold text-blue-400">${balance.toFixed(2)}</p>
              </div>
              <div className="pt-3 border-t border-white/10">
                <p className="text-white/60 text-sm mb-1">Order Value</p>
                <p className={`text-2xl font-bold ${orderValue > 0 ? 'text-white' : 'text-white/40'}`}>
                  ${orderValue.toFixed(2)}
                </p>
              </div>
              <div className="pt-3 border-t border-white/10">
                <p className="text-white/60 text-sm mb-1">After Trade</p>
                <p className={`text-2xl font-bold ${
                  orderType === 'buy'
                    ? 'text-red-400'
                    : 'text-emerald-400'
                }`}>
                  ${(orderType === 'buy' ? balance - orderValue : balance + orderValue).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:shadow-[0_0_20px_rgba(0,150,255,0.3)] transition-shadow duration-300">
            <h3 className="text-white/80 font-semibold mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Quantity</span>
                <span className="text-white font-medium">{quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Price per Share</span>
                <span className="text-white font-medium">${price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-white/10">
                <span className="text-white/60">Subtotal</span>
                <span className="text-white font-medium">${(quantity * price).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-white/10">
                <span className="text-white font-semibold">Total</span>
                <span className="text-2xl font-bold text-blue-400">${orderValue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders History */}
      {orders.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl overflow-x-auto hover:shadow-[0_0_20px_rgba(0,150,255,0.3)] transition-shadow duration-300">
          <h3 className="text-white/80 font-semibold mb-4">Recent Orders</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-blue-400">Symbol</th>
                <th className="text-left py-3 px-4 text-blue-400">Type</th>
                <th className="text-right py-3 px-4 text-blue-400">Quantity</th>
                <th className="text-right py-3 px-4 text-blue-400">Price</th>
                <th className="text-right py-3 px-4 text-blue-400">Total</th>
                <th className="text-left py-3 px-4 text-blue-400">Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">{order.symbol}</td>
                  <td className={`py-3 px-4 font-semibold ${order.type === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {order.type.toUpperCase()}
                  </td>
                  <td className="py-3 px-4 text-right text-white/80">{order.quantity}</td>
                  <td className="py-3 px-4 text-right text-blue-400">${order.price.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-white">${(order.quantity * order.price).toFixed(2)}</td>
                  <td className="py-3 px-4 text-white/60 text-xs">{order.timestamp.toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/60 text-lg">No orders yet. Start trading to see your order history.</p>
        </div>
      )}

      {/* Market News Section */}
      <div className="mb-20 lg:mb-8 fade-in" style={{ animationDelay: '0.6s' }}>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-500 rounded-full"></span>
          Market News
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {MARKET_NEWS.map((news, idx) => {
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
              <div
                key={news.id}
                className={`group relative rounded-xl sm:rounded-2xl p-4 sm:p-5 backdrop-blur-xl transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden border bg-gradient-to-br ${sentimentColor[news.sentiment]} ${sentimentGlow[news.sentiment]} fade-in`}
                style={{ animationDelay: `${0.7 + idx * 0.05}s` }}
              >
                {/* Background Glow */}
                <div className={`absolute -inset-1 opacity-0 group-hover:opacity-100 blur transition-all duration-300 ${
                  news.sentiment === 'positive' ? 'bg-green-500/20' :
                  news.sentiment === 'neutral' ? 'bg-blue-500/20' :
                  'bg-red-500/20'
                }`}></div>

                {/* Content */}
                <div className="relative z-10 space-y-3">
                  {/* Header with Sentiment Badge */}
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

                  {/* Footer with Symbol and Timestamp */}
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

                {/* Soft Glow on Hover */}
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                  news.sentiment === 'positive' ? 'shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]' :
                  news.sentiment === 'neutral' ? 'shadow-[inset_0_0_20px_rgba(100,150,255,0.1)]' :
                  'shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]'
                }`}></div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Trade Panel - Fixed Bottom Right - Responsive */}
      <div className="fixed bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-8 z-50">
        <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-2xl shadow-2xl hover:shadow-[0_0_50px_rgba(0,150,255,0.2)] transition-all duration-300 w-72 sm:w-80 max-w-[calc(100vw-2rem)] fade-in" style={{ animationDelay: '0.8s' }}>
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse"></div>
            <h3 className="text-lg font-bold text-white">Quick Trade</h3>
          </div>

          {/* Symbol Selector */}
          <div className="mb-4">
            <label className="block text-white/80 font-semibold mb-2 text-sm">Symbol</label>
            <select
              value={quickSymbol}
              onChange={(e) => setQuickSymbol(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400/60 focus:shadow-[0_0_15px_rgba(0,150,255,0.3)] transition-all text-sm"
            >
              {STOCK_SYMBOLS.map(symbol => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
          </div>

          {/* Current Price Display */}
          <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-white/60 text-xs mb-1">Current Price</p>
            <p className="text-xl font-bold text-blue-400">${(prices[quickSymbol]?.price || 0).toFixed(2)}</p>
          </div>

          {/* Quantity Input */}
          <div className="mb-4">
            <label className="block text-white/80 font-semibold mb-2 text-sm">Quantity</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={quickQuantity}
              onChange={(e) => setQuickQuantity(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-400/60 focus:shadow-[0_0_15px_rgba(0,150,255,0.3)] transition-all text-sm"
              placeholder="Shares"
            />
          </div>

          {/* Total Cost */}
          <div className="mb-6 p-3 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-white/60 text-xs mb-1">Total Cost</p>
            <p className="text-lg font-bold text-white">
              ${((parseFloat(quickQuantity) || 0) * (prices[quickSymbol]?.price || 0)).toFixed(2)}
            </p>
          </div>

          {/* Buy and Sell Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleQuickTrade('buy')}
              className="group relative py-3 px-4 rounded-xl font-bold text-white text-sm overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {/* Green Glow Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.6),inset_0_0_25px_rgba(16,185,129,0.2)] transition-all duration-300"></div>
              {/* Shimmer Effect on Hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 -skew-x-12 group-hover:translate-x-full transition-all duration-500"></div>
              {/* Text */}
              <span className="relative flex items-center justify-center gap-1">
                📈 Buy
              </span>
            </button>

            <button
              onClick={() => handleQuickTrade('sell')}
              className="group relative py-3 px-4 rounded-xl font-bold text-white text-sm overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {/* Red Glow Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 group-hover:shadow-[0_0_25px_rgba(239,68,68,0.6),inset_0_0_25px_rgba(239,68,68,0.2)] transition-all duration-300"></div>
              {/* Shimmer Effect on Hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 -skew-x-12 group-hover:translate-x-full transition-all duration-500"></div>
              {/* Text */}
              <span className="relative flex items-center justify-center gap-1">
                📉 Sell
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-white/10"></div>

          {/* Balance Info */}
          <div className="text-xs">
            <div className="flex justify-between mb-2">
              <span className="text-white/60">Balance:</span>
              <span className="text-blue-400 font-semibold">${balance.toFixed(2)}</span>
            </div>
            <div className="text-white/60 text-center">
              {connected ? '🟢 Live' : '🔴 Offline'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
