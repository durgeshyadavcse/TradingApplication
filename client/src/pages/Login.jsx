import { useMemo, useState } from 'react'

export default function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  const apiBase = useMemo(() => import.meta.env.VITE_API_BASE || 'http://localhost:5000', [])

  async function handleLogin(e) {
    e.preventDefault()
    setAuthError('')
    setLoading(true)
    try {
      const body = emailOrUsername.includes('@')
        ? { email: emailOrUsername, password }
        : { username: emailOrUsername, password }
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Login failed')
      }
      const data = await res.json()
      localStorage.setItem('token', data.token)
      setPassword('')
      window.location.assign('/')
    } catch (err) {
      setAuthError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <h2 style={{ marginTop: 0 }}>Login</h2>
      <form onSubmit={handleLogin} style={{ display: 'grid', gap: 10 }}>
        <input
          placeholder="email or username"
          value={emailOrUsername}
          onChange={(e) => setEmailOrUsername(e.target.value)}
          name="username"
          autoComplete="username"
        />
        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          name="password"
          autoComplete="current-password"
        />
        <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Login'}</button>
        {authError ? <span style={{ color: 'crimson' }}>{authError}</span> : null}
      </form>
    </div>
  )
}
