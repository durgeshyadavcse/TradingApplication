import { useEffect, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

let socketInstance = null

export function useLiveprices(symbols = []) {
  const [prices, setPrices] = useState({})
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000'
    
    const pricesRef = { current: {} }
    let batchTimer = null
    const scheduleFlush = () => {
      if (batchTimer) return
      batchTimer = setTimeout(() => {
        setPrices(prev => ({ ...prev, ...pricesRef.current }))
        pricesRef.current = {}
        batchTimer = null
      }, 200)
    }
    const flushAndClear = () => {
      if (batchTimer) {
        clearTimeout(batchTimer)
        batchTimer = null
      }
      setPrices(prev => ({ ...prev, ...pricesRef.current }))
      pricesRef.current = {}
    }
    
  
    ;(async () => {
      try {
        const res = await fetch(`${apiBase}/api/stocks/prices`)
        if (res.ok) {
          const data = await res.json()
          if (data && typeof data === 'object') {
            const mapped = Object.entries(data).reduce((acc, [sym, v]) => {
              acc[sym] = {
                price: v.price,
                change: v.change,
                high: v.high,
                low: v.low,
                timestamp: Date.now()
              }
              return acc
            }, {})
            setPrices(prev => ({ ...mapped, ...prev }))
          }
        }
      } catch (_) {
      
      }
    })()

   
    if (!socketInstance) {
      socketInstance = io(apiBase, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      })

      socketInstance.on('connect', () => {
        console.log('[Socket.IO] Connected')
        setConnected(true)
       
        symbols.forEach(symbol => {
          if (symbol && socketInstance) {
            socketInstance.emit('subscribe', symbol)
          }
        })
      })

      socketInstance.on('disconnect', () => {
        console.log('[Socket.IO] Disconnected')
        setConnected(false)
      })

      socketInstance.on('priceUpdate', (data) => {
        
        try {
          pricesRef.current[data.symbol] = {
            price: data.price,
            change: data.change,
            high: data.high,
            low: data.low,
            timestamp: data.timestamp
          }
        } catch (e) {
         
        }
        scheduleFlush()
      })

      socketInstance.on('subscribed', (data) => {
        if (typeof data === 'object' && data.symbol && data.data) {
          pricesRef.current[data.symbol] = {
            price: data.data.price,
            change: data.data.change,
            high: data.data.high,
            low: data.data.low,
            timestamp: Date.now()
          }
          scheduleFlush()
        } else if (typeof data === 'string') {
          console.log(`[Socket.IO] Subscribed to ${data}`)
        }
      })

      socketInstance.on('stockList', (stocks) => {
        console.log('[Socket.IO] Available stocks:', stocks)
      })



      socketInstance.on('error', (error) => {
        console.error('[Socket.IO] Error:', error)
      })
    }

   
    // If socket is already connected (re-run with new symbols), subscribe now.
    if (socketInstance && socketInstance.connected) {
      symbols.forEach(symbol => {
        if (symbol) {
          socketInstance.emit('subscribe', symbol)
        }
      })
    }

    return () => {
     
      try { flushAndClear() } catch (e) { /* ignore */ }
      
    }
  }, [symbols])

  const getPrice = useCallback((symbol) => {
    return prices[symbol] || null
  }, [prices])

  const disconnect = useCallback(() => {
    if (socketInstance) {
      socketInstance.disconnect()
      socketInstance = null
      setConnected(false)
    }
  }, [])

  return { prices, connected, getPrice, disconnect }
}
