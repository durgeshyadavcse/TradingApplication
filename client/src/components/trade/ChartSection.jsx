
import { useEffect, useRef, useState } from 'react'
import '../../styles/animations.css'

function generateInitialSeries(range, startPrice = 100) {
  const points = []
  const now = Date.now()
  let price = startPrice
  let count = 0
  let interval = 60 * 1000 // 1 minute
  if (range === '1D') {
    count = 24 * 60 // minutes in a day
    interval = 60 * 1000
  } else if (range === '1W') {
    count = 7 * 24 // hourly for a week
    interval = 60 * 60 * 1000
  } else if (range === '1M') {
    count = 30 // daily for a month
    interval = 24 * 60 * 60 * 1000
  }

  for (let i = count - 1; i >= 0; i--) {
    const t = now - i * interval
   
    price = Number((price * (1 + (Math.random() - 0.5) * 0.006)).toFixed(2))
    points.push({ time: t, price })
  }
  return { points, interval }
}

export default function ChartSection({ symbol = 'AAPL', price = 150.5, change = 0, status = 'online', loading = false }) {
  const containerRef = useRef(null)
  const [range, setRange] = useState('1D')
  const [series, setSeries] = useState(() => generateInitialSeries('1D', price).points)
  const [intervalMs, setIntervalMs] = useState(() => generateInitialSeries('1D', price).interval)
  const [size, setSize] = useState({ width: 800, height: 240 })
  const [hover, setHover] = useState(null) 

  
  useEffect(() => {
    const { points, interval } = generateInitialSeries(range, price)
    setSeries(points)
    setIntervalMs(interval)
  }, [symbol, range])

  // periodic update to simulate real-time price ticks
  useEffect(() => {
    if (loading) return
    let mounted = true
    const tick = () => {
      setSeries(prev => {
        if (!mounted) return prev
        const last = prev[prev.length - 1]
        const t = Date.now()
        // simulate small move based on last price
        const nextPrice = Number((last.price * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2))
        const next = [...prev, { time: t, price: nextPrice }]
        // keep length appropriate for range
        let maxLen = 0
        if (range === '1D') maxLen = 24 * 60
        if (range === '1W') maxLen = 7 * 24
        if (range === '1M') maxLen = 30
        if (next.length > maxLen) next.shift()
        return next
      })
    }

    const handle = setInterval(tick, Math.max(2000, Math.floor(intervalMs / 4)))
    return () => { mounted = false; clearInterval(handle) }
  }, [intervalMs, range, loading])

  // responsive sizing
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        setSize({ width: Math.max(300, w), height: Math.max(180, Math.round(w * 0.35)) })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef])

 
  const prices = series.map(p => p.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const pad = (max - min) * 0.1 || max * 0.02
  const yMin = min - pad
  const yMax = max + pad

  const w = size.width
  const h = size.height
  const inner = { left: 40, right: 20, top: 20, bottom: 28 }
  const plotW = Math.max(10, w - inner.left - inner.right)
  const plotH = Math.max(10, h - inner.top - inner.bottom)

  const toX = (time) => {
    const t0 = series[0]?.time || Date.now()
    const t1 = series[series.length - 1]?.time || Date.now()
    const pct = t1 === t0 ? 1 : (time - t0) / (t1 - t0)
    return inner.left + pct * plotW
  }
  const toY = (p) => {
    const pct = (p - yMin) / (yMax - yMin)
    return inner.top + (1 - pct) * plotH
  }

  const linePath = series.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${toX(pt.time).toFixed(2)} ${toY(pt.price).toFixed(2)}`).join(' ')
  const areaPath = linePath + ` L ${inner.left + plotW} ${inner.top + plotH} L ${inner.left} ${inner.top + plotH} Z`

 
  const handleMouse = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
  
    let nearest = series[0]
    let nearestDx = Infinity
    for (const pt of series) {
      const dx = Math.abs(toX(pt.time) - x)
      if (dx < nearestDx) { nearestDx = dx; nearest = pt }
    }
    setHover({ x: toX(nearest.time), y: toY(nearest.price), point: nearest })
  }
  const handleLeave = () => setHover(null)

  
  const formatTime = (t) => {
    const d = new Date(t)
    if (range === '1D') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString()
  }

  return (
    <div ref={containerRef} className="rounded-2xl bg-gradient-to-br from-[#051026]/40 to-[#071127]/30 backdrop-blur-xl border border-white/6 p-4 sm:p-6 overflow-hidden neon-glow">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-white">{symbol} <span className="text-white/60 text-sm">{status === 'online' ? 'Live' : 'Offline'}</span></h3>
            <p className="text-sm text-white/60">Price chart — {range}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">${series[series.length-1]?.price?.toFixed(2) || price.toFixed(2)}</div>
            <div className={`text-sm font-semibold ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%</div>
          </div>
        </div>

     
        <div className="flex items-center gap-2 mb-3">
          {['1D','1W','1M'].map(r => (
            <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-md text-sm font-semibold ${range===r ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/70'}`}>
              {r}
            </button>
          ))}
        </div>

       
        <div className="rounded-xl bg-[#061025]/40 border border-white/6 overflow-hidden" onMouseMove={handleMouse} onMouseLeave={handleLeave}>
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="liveArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#0096FF" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#0096FF" stopOpacity="0.02" />
              </linearGradient>
            </defs>

          
            {Array.from({ length: 4 }).map((_, i) => (
              <line key={i} x1={inner.left} x2={inner.left + plotW} y1={inner.top + (i * plotH) / 3} y2={inner.top + (i * plotH) / 3} stroke="#ffffff10" />
            ))}

           
            <path d={areaPath} fill="url(#liveArea)" stroke="none" />
            
            <path d={linePath} fill="none" stroke="#0096FF" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            
            {series.map((pt, i) => (
              <circle key={i} cx={toX(pt.time)} cy={toY(pt.price)} r={2} fill="#fff0" />
            ))}

            
            {hover && (
              <g>
                <line x1={hover.x} x2={hover.x} y1={inner.top} y2={inner.top + plotH} stroke="#ffffff22" strokeDasharray="4" />
                <circle cx={hover.x} cy={hover.y} r={4} fill="#fff" stroke="#0096FF" strokeWidth={2} />
              </g>
            )}
          </svg>

          {hover && (
            <div className="absolute" style={{ left: Math.min(w - 180, Math.max(8, hover.x - 90)), top: hover.y - 70 }}>
              <div className="bg-[#071127] border border-white/6 text-white p-2 rounded-md text-xs shadow-lg">
                <div className="font-semibold">${hover.point.price.toFixed(2)}</div>
                <div className="text-white/60">{formatTime(hover.point.time)}</div>
              </div>
            </div>
          )}
        </div>

       
        <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-white/60">
          <div>Low: ${yMin.toFixed(2)}</div>
          <div className="text-center">Range: ${(yMax - yMin).toFixed(2)}</div>
          <div className="text-right">High: ${yMax.toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
};
  
