import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

export default function LoginPage() {
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
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Login failed')
      }
      const data = await res.json()
      localStorage.setItem('token', data.token)
      window.location.assign('/')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md grid gap-3 rounded-2xl border border-slate-800/60 bg-white/5 backdrop-blur-lg p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        <h2 className="m-0 text-2xl font-semibold text-slate-100">Login</h2>
        <label className="grid gap-1.5">
          <span className="text-sm text-slate-400">Email</span>
          <input className="w-full rounded-md border border-slate-700 bg-slate-900/40 text-slate-100 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm text-slate-400">Password</span>
          <input className="w-full rounded-md border border-slate-700 bg-slate-900/40 text-slate-100 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </label>
        <button className="mt-1 w-full rounded-md bg-gradient-to-r from-brand to-cyan-400 px-4 py-2 text-white hover:from-brand/90 hover:to-cyan-300 disabled:opacity-60 shadow-[0_0_18px_rgba(56,189,248,0.35)]" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        {error ? <div className="text-sm text-red-400">{error}</div> : null}
        <div className="text-sm text-slate-400 mt-1">
          Don’t have an account? <Link to="/signup" className="text-cyan-300 hover:underline">Create an account</Link>
        </div>
      </form>
    </div>
  )
}
