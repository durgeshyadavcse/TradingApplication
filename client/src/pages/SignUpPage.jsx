import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

export default function SignUpPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const apiBase = useMemo(() => import.meta.env.VITE_API_BASE || 'http://localhost:5000', [])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      console.log('[Signup] submitting', { apiBase, username, email })
      const res = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })
      console.log('[Signup] response status', res.status)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error('[Signup] error payload', data)
        throw new Error(data.error || `Registration failed (status ${res.status})`)
      }
      const data = await res.json()
      console.log('[Signup] success', data)
      localStorage.setItem('token', data.token)
      window.location.assign('/')
    } catch (err) {
      console.error('[Signup] exception', err)
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        
        
        <div className="relative">
       
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl blur-2xl opacity-75 -z-10"></div>
          
          <form onSubmit={onSubmit} className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <h2 className="text-4xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-slate-400 text-sm mb-8">Join us to start trading today</p>
            
            
            <label className="grid gap-2 mb-6">
              <span className="text-sm font-medium text-slate-300">Username</span>
              <input 
                className="w-full rounded-lg border border-cyan-500/30 bg-slate-900/30 text-white px-4 py-3 outline-none transition-all duration-300 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:border-cyan-500/50 placeholder-slate-500" 
                name="username"
                autoComplete="username"
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Enter your username" 
                required 
              />
            </label>
            
           
            <label className="grid gap-2 mb-6">
              <span className="text-sm font-medium text-slate-300">Email</span>
              <input 
                className="w-full rounded-lg border border-cyan-500/30 bg-slate-900/30 text-white px-4 py-3 outline-none transition-all duration-300 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:border-cyan-500/50 placeholder-slate-500" 
                type="email" 
                name="email"
                autoComplete="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com" 
                required 
              />
            </label>
            
          
            <label className="grid gap-2 mb-8">
              <span className="text-sm font-medium text-slate-300">Password</span>
              <input 
                className="w-full rounded-lg border border-cyan-500/30 bg-slate-900/30 text-white px-4 py-3 outline-none transition-all duration-300 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:border-cyan-500/50 placeholder-slate-500" 
                type="password" 
                name="password"
                autoComplete="new-password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                required 
              />
            </label>
            
           
            <button 
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold px-4 py-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] mb-4" 
              type="submit" 
              onClick={(e) => { console.log('[Signup] button clicked'); }}
              disabled={loading}
            >
              {loading ? 'Creating…' : 'Sign up'}
            </button>
            
         
            {error ? (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                {error}
              </div>
            ) : null}
            
          
            <p className="text-center text-sm text-slate-400">
              Already have an account? <Link to="/login" className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium transition-colors">Log in here</Link>
            </p>
          </form>
        </div>
        
       
        <div className="hidden lg:flex items-center justify-center">
          <div className="relative w-full h-96">
         
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-2xl blur-3xl opacity-50"></div>
          
            <div className="relative rounded-2xl border border-cyan-500/30 bg-slate-900/40 backdrop-blur-md p-6 h-full flex flex-col items-center justify-center shadow-[0_0_30px_#0ea5e9]">
              <div className="text-center">
                <div className="text-cyan-400/60 text-sm font-medium mb-2">LIVE INTERACTIVE CHART</div>
                <div className="w-48 h-32 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded-lg flex items-center justify-center border border-cyan-500/20">
                  <svg className="w-16 h-16 text-cyan-500/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-xs mt-4">Chart component coming soon</p>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}
