import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLiveprices } from '../hooks/useLiveprices'
import ChartSection from '../components/trade/ChartSection'
import QuickActions from '../components/ui/QuickActions'
import BalanceCard from '../components/trade/BalanceCard'
import MarketMoverCard from '../components/trade/MarketMoverCard'

const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX']

const STOCK_INFO = {
  AAPL: { name: 'Apple Inc.' },
  MSFT: { name: 'Microsoft Corp.' },
  GOOG: { name: 'Alphabet Inc.' },
  AMZN: { name: 'Amazon.com, Inc.' },
  TSLA: { name: 'Tesla, Inc.' },
  NVDA: { name: 'NVIDIA Corporation' },
  META: { name: 'Meta Platforms, Inc.' },
  NFLX: { name: 'Netflix, Inc.' }
}

const DUMMY_RECENT_TRADES = [
  { id: 'd1', symbol: 'AAPL', type: 'buy', quantity: 10, price: 149.5, timestamp: new Date(Date.now() - 1000 * 60 * 45) },
  { id: 'd2', symbol: 'AAPL', type: 'sell', quantity: 2, price: 151.2, timestamp: new Date(Date.now() - 1000 * 60 * 30) },
  { id: 'd3', symbol: 'TSLA', type: 'buy', quantity: 1, price: 620.0, timestamp: new Date(Date.now() - 1000 * 60 * 20) }
]

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

export default function Trade() {
  
  const { prices, connected } = useLiveprices()
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL')
  const [searchQuery, setSearchQuery] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [orderType, setOrderType] = useState('buy')
  const [orderMode, setOrderMode] = useState('market')
  const [limitPrice, setLimitPrice] = useState('')
  const [balance, setBalance] = useState(10000)
  const [orders, setOrders] = useState(DUMMY_RECENT_TRADES)
  const apiBase = import.meta.env.VITE_API_BASE || ''
  const [holdings, setHoldings] = useState([])

  
  const { token } = useAuth()

  useEffect(() => {
    let mounted = true
    async function loadHoldings() {
      try {
        if (!apiBase) {
          
          const dummy = [
            { symbol: 'AAPL', quantity: 20, averageCost: 150 },
            { symbol: 'TSLA', quantity: 5, averageCost: 620 },
            { symbol: 'NVDA', quantity: 8, averageCost: 420 }
          ]
          if (mounted) setHoldings(dummy)
          return
        }
        const headers = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch(`${apiBase}/api/portfolio`, { headers, credentials: 'include' })
        if (!res.ok) throw new Error('no portfolio')
        const data = await res.json()
        if (!mounted) return
        if (Array.isArray(data.holdings)) setHoldings(data.holdings)
      } catch (e) {
        // fallback to dummy if API fails
        if (mounted && holdings.length === 0) {
          setHoldings([
            { symbol: 'AAPL', quantity: 20, averageCost: 150 },
            { symbol: 'TSLA', quantity: 5, averageCost: 620 },
            { symbol: 'NVDA', quantity: 8, averageCost: 420 }
          ])
        }
      }
    }
    loadHoldings()
    return () => { mounted = false }
  }, [apiBase, token])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [loading, setLoading] = useState(false)
  const [quickSymbol, setQuickSymbol] = useState('AAPL')
  const [quickQuantity, setQuickQuantity] = useState('1')

  // ========== COMPUTED VALUES ==========
  const currentPrice = prices[selectedSymbol]?.price || 150.5
  const change = prices[selectedSymbol]?.change || 2.5
  const isPositive = change >= 0
  const sharePrice = currentPrice
  const orderValue = (parseFloat(quantity) || 0) * sharePrice

  // Stock statistics (mocked when live data not available)
  const previousClose = Number((currentPrice / (1 + (change || 0) / 100)).toFixed(2))
  const openPrice = Number((previousClose * (1 + ((Math.random() - 0.5) * 0.02))).toFixed(2))
  const dayHigh = Number((Math.max(currentPrice, openPrice) * (1 + Math.random() * 0.03)).toFixed(2))
  const dayLow = Number((Math.min(currentPrice, openPrice) * (1 - Math.random() * 0.03)).toFixed(2))
  const volume = Math.round((Math.random() * 5 + 1) * 100000)

  // ========== EVENT HANDLERS ==========
  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const orderData = {
        symbol: selectedSymbol,
        type: orderType,
        quantity: parseFloat(quantity),
        price: orderMode === 'limit' ? parseFloat(limitPrice) : currentPrice,
        mode: orderMode,
        timestamp: new Date()
      }

     
      await new Promise(resolve => setTimeout(resolve, 800))

      // Update balance
      const cost = orderType === 'buy' ? orderValue : -orderValue
      setBalance(prev => prev - cost)

      // Add to orders
      setOrders(prev => [...prev, { ...orderData, id: Date.now() }])

      // Show success message
      setMessage(`${orderType.toUpperCase()} order placed successfully!`)
      setMessageType('success')

      // Reset form
      setQuantity('1')
      setLimitPrice('')

      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Failed to place order. Please try again.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickTrade = async (type) => {
    const tradeData = {
      symbol: quickSymbol,
      type,
      quantity: parseFloat(quickQuantity) || 1,
      price: prices[quickSymbol]?.price || 100,
      mode: 'market',
      timestamp: new Date()
    }

    const cost = type === 'buy' 
      ? (parseFloat(quickQuantity) || 1) * (prices[quickSymbol]?.price || 100)
      : -((parseFloat(quickQuantity) || 1) * (prices[quickSymbol]?.price || 100))

    setBalance(prev => prev - cost)
    setOrders(prev => [...prev, { ...tradeData, id: Date.now() }])
    setQuickQuantity('1')
  }

  // Fetch recent trades from server (if available) and merge with local orders
  useEffect(() => {
    let mounted = true
    async function loadTrades() {
      try {
        if (!apiBase) return
        const headers = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch(`${apiBase}/api/portfolio/trades`, { headers, credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        if (!mounted) return
        if (Array.isArray(data.trades)) {
          
          const mapped = data.trades.map(t => ({
            id: t._id || Date.now() + Math.random(),
            symbol: t.symbol,
            type: t.type === 'BUY' ? 'buy' : 'sell',
            quantity: t.quantity,
            price: t.price,
            timestamp: new Date(t.timestamp)
          }))
          setOrders(prev => {
           
            const localUnsynced = prev.filter(o => !String(o.id).startsWith('server:'))
            return [...mapped, ...localUnsynced]
          })
        }
      } catch (e) {
        
      }
    }
    loadTrades()
    return () => { mounted = false }
  }, [apiBase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0B1223] to-[#020617] p-4 sm:p-6 md:p-8 lg:p-10">
     
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
      `}</style>

      
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

      
      <div className="mb-10 lg:mb-12 fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="w-full max-w-6xl px-2 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-xl flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{STOCK_INFO[selectedSymbol]?.name || selectedSymbol}</h2>
                  <p className="text-sm text-white/60">{selectedSymbol} • {connected ? 'Market Open' : 'Market Closed'}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">${currentPrice.toFixed(2)}</div>
                  <div className={`text-sm font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>{isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%</div>
                </div>
              </div>

            
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
                  <h4 className="text-sm font-semibold text-white/80 mb-3">Stock Stats</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-white/60">
                    <div>
                      <div className="text-xs">Open</div>
                      <div className="font-medium text-white">${openPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs">Prev Close</div>
                      <div className="font-medium text-white">${previousClose.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs">Day High</div>
                      <div className="font-medium text-white">${dayHigh.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs">Day Low</div>
                      <div className="font-medium text-white">${dayLow.toFixed(2)}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs">Volume</div>
                      <div className="font-medium text-white">{volume.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <ChartSection symbol={selectedSymbol} price={currentPrice} change={change} status={connected ? 'online' : 'offline'} />
                </div>
              </div>
            </div>

            <aside className="lg:col-span-1 space-y-4">
              <BalanceCard balance={balance} orderValue={orderValue} orderType={orderType} loading={loading} />
              <QuickActions onBuy={() => handleQuickTrade('buy')} onSell={() => handleQuickTrade('sell')} symbols={STOCK_SYMBOLS} />
            </aside>
          </div>
        </div>
      </div>

     
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

            const sparklineData = Array.from({ length: 12 }, (_, i) => {
              const base = 50
              const variance = Math.sin(i * 0.5 + (isPositive ? 1 : -1)) * 40
              return base + variance
            })

            return (
              <button
                key={symbol}
                onClick={() => setSelectedSymbol(symbol)}
                className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 fade-in"
                style={{ animationDelay: `${0.4 + idx * 0.05}s` }}
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
          })}
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 lg:mb-10 fade-in" style={{ animationDelay: '0.5s' }}>
       
        <div className="md:col-span-2 lg:col-span-2">
          <form onSubmit={handlePlaceOrder} className="space-y-6">
          
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
              <p className="text-white/60 text-sm mt-2">Total: ${orderValue.toFixed(2)} USD</p>
            </div>

            
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

           
            {message && (
              <div className={`rounded-2xl p-4 border ${
                messageType === 'success'
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {message}
              </div>
            )}

           
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

        
        <div className="space-y-6">
         
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

         
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:shadow-[0_0_20px_rgba(0,150,255,0.3)] transition-shadow duration-300">
            <h3 className="text-white/80 font-semibold mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Quantity</span>
                <span className="text-white font-medium">{quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Price per Share</span>
                <span className="text-white font-medium">${sharePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-white/10">
                <span className="text-white/60">Subtotal</span>
                <span className="text-white font-medium">${(quantity * sharePrice).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-white/10">
                <span className="text-white font-semibold">Total</span>
                <span className="text-2xl font-bold text-blue-400">${orderValue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

     
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl overflow-x-auto hover:shadow-[0_0_20px_rgba(0,150,255,0.3)] transition-shadow duration-300 mb-8">
        <h3 className="text-white/80 font-semibold mb-4">Recent Trades</h3>
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
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 px-4 text-center text-white/60">No recent trades yet. Place an order to populate this list.</td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">{order.symbol}</td>
                  <td className={`py-3 px-4 font-semibold ${order.type === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {order.type.toUpperCase()}
                  </td>
                  <td className="py-3 px-4 text-right text-white/80">{order.quantity}</td>
                  <td className="py-3 px-4 text-right text-blue-400">${order.price.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-white">${(order.quantity * order.price).toFixed(2)}</td>
                  <td className="py-3 px-4 text-white/60 text-xs">{new Date(order.timestamp).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl overflow-x-auto hover:shadow-[0_0_20px_rgba(0,150,255,0.3)] transition-shadow duration-300 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white/80 font-semibold">Portfolio Holdings</h3>
          <p className="text-sm text-white/60">Overview of positions</p>
        </div>
        <div className="overflow-hidden rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-blue-400">Symbol</th>
                <th className="text-right py-3 px-4 text-blue-400">Qty</th>
                <th className="text-right py-3 px-4 text-blue-400">Avg Cost</th>
                <th className="text-right py-3 px-4 text-blue-400">Mark</th>
                <th className="text-right py-3 px-4 text-blue-400">Unrealized P/L</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map(h => {
                const mark = prices[h.symbol]?.price || h.averageCost || 0
                const qty = Number(h.quantity || 0)
                const avg = Number(h.averageCost || 0)
                const pl = (mark - avg) * qty
                const plClass = pl >= 0 ? 'text-emerald-400' : 'text-red-400'
                return (
                  <tr key={h.symbol} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">{h.symbol}</td>
                    <td className="py-3 px-4 text-right text-white/80">{qty}</td>
                    <td className="py-3 px-4 text-right text-white/80">${avg.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-blue-400">${mark.toFixed(2)}</td>
                    <td className={`py-3 px-4 text-right font-semibold ${plClass}`}>${pl.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

     
      {orders.length === 0 && (
        <div className="text-center py-12 mb-8">
          <p className="text-white/60 text-lg">No orders yet. Start trading to see your order history.</p>
        </div>
      )}

    
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
          })}
        </div>
      </div>

      
      <div className="fixed bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-8 z-50">
        <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-2xl shadow-2xl hover:shadow-[0_0_50px_rgba(0,150,255,0.2)] transition-all duration-300 w-72 sm:w-80 max-w-[calc(100vw-2rem)] fade-in" style={{ animationDelay: '0.8s' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse"></div>
            <h3 className="text-lg font-bold text-white">Quick Trade</h3>
          </div>

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

          <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-white/60 text-xs mb-1">Current Price</p>
            <p className="text-xl font-bold text-blue-400">${(prices[quickSymbol]?.price || 0).toFixed(2)}</p>
          </div>

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

          <div className="mb-6 p-3 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-white/60 text-xs mb-1">Total Cost</p>
            <p className="text-lg font-bold text-white">
              ${((parseFloat(quickQuantity) || 0) * (prices[quickSymbol]?.price || 0)).toFixed(2)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleQuickTrade('buy')}
              className="group relative py-3 px-4 rounded-xl font-bold text-white text-sm overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.6),inset_0_0_25px_rgba(16,185,129,0.2)] transition-all duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 -skew-x-12 group-hover:translate-x-full transition-all duration-500"></div>
              <span className="relative flex items-center justify-center gap-1">
                📈 Buy
              </span>
            </button>

            <button
              onClick={() => handleQuickTrade('sell')}
              className="group relative py-3 px-4 rounded-xl font-bold text-white text-sm overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 group-hover:shadow-[0_0_25px_rgba(239,68,68,0.6),inset_0_0_25px_rgba(239,68,68,0.2)] transition-all duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 -skew-x-12 group-hover:translate-x-full transition-all duration-500"></div>
              <span className="relative flex items-center justify-center gap-1">
                📉 Sell
              </span>
            </button>
          </div>

          <div className="my-4 border-t border-white/10"></div>

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
