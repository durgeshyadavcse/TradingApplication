import { Link, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function Header() {
  const [token, setToken] = useState(typeof window !== 'undefined' ? localStorage.getItem('token') : '')
  const [menuOpen, setMenuOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [dropdown, setDropdown] = useState('Lato')

  useEffect(() => {
    const onStorage = () => setToken(localStorage.getItem('token') || '')
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  function handleLogout() {
    localStorage.removeItem('token')
    setUserOpen(false)
    setMenuOpen(false)
    window.location.assign('/login')
  }

  const navLink = ({ isActive }) =>
    'px-2 py-1 rounded-md transition-colors relative ' +
    (isActive
      ? 'text-brand after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:bg-brand after:shadow-[0_0_8px_#6B46C1]'
      : 'text-slate-300 hover:text-brand')

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-900/60 backdrop-blur-lg supports-[backdrop-filter]:bg-slate-900/40">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        
        <div className="flex items-center gap-2">
          <Link to="/" className="text-xl font-semibold bg-gradient-to-r from-cyan-300 via-sky-400 to-brand bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(56,189,248,0.45)]">
            Stock Trading
          </Link>
        </div>

       
        <nav className="hidden md:flex items-center gap-6 text-slate-300">
          <NavLink className={navLink} to="/" end>Home</NavLink>
          <NavLink className={navLink} to="/trade">Trade</NavLink>
          <NavLink className={navLink} to="/portfolio">Portfolio</NavLink>
          <NavLink className={navLink} to="/watchlist">Watchlist</NavLink>
         
          <div className="relative">
            <select
              aria-label="Options"
              value={dropdown}
              onChange={(e) => setDropdown(e.target.value)}
              className="appearance-none rounded-md border border-slate-700 bg-slate-900/40 px-3 py-1.5 pr-8 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option className="bg-slate-900" value="Lato">Lato</option>
              <option className="bg-slate-900" value="Roboto">Roboto</option>
              <option className="bg-slate-900" value="Inter">Inter</option>
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
          </div>
        </nav>

        
        <div className="hidden md:flex items-center gap-3">
          {!token ? (
            <>
              <Link className="px-3 py-1.5 rounded-md text-slate-300 hover:text-brand" to="/login">Login</Link>
              <Link className="px-3 py-1.5 rounded-md bg-brand text-white hover:bg-brand-dark shadow-[0_0_12px_#6B46C1]" to="/signup">Sign Up</Link>
            </>
          ) : (
            <div className="relative">
              <button onClick={() => setUserOpen((v) => !v)} className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-800/60">
                <div className="h-8 w-8 rounded-full bg-brand/20 grid place-items-center text-brand font-semibold shadow-[0_0_10px_#6B46C1]">U</div>
                <span className="text-slate-200">Account</span>
              </button>
              {userOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-2xl border border-slate-800/60 bg-slate-900/70 backdrop-blur-lg shadow-[0_0_18px_rgba(107,70,193,0.35)]">
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 hover:bg-slate-800/60">Logout</button>
                </div>
              )}
            </div>
          )}
        </div>

       
        <button aria-label="Menu" className="md:hidden p-2 rounded-md hover:bg-slate-800/60" onClick={() => setMenuOpen((v) => !v)}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      
      {menuOpen && (
        <div className="md:hidden border-t border-slate-800/60 bg-slate-900/70 backdrop-blur-lg">
          <div className="mx-auto max-w-6xl px-4 py-3 grid gap-2">
            <NavLink onClick={() => setMenuOpen(false)} className={navLink} to="/" end>Home</NavLink>
            <NavLink onClick={() => setMenuOpen(false)} className={navLink} to="/trade">Trade</NavLink>
            <NavLink onClick={() => setMenuOpen(false)} className={navLink} to="/portfolio">Portfolio</NavLink>
        
            <div className="pt-1">
              <select
                aria-label="Options"
                value={dropdown}
                onChange={(e) => setDropdown(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option className="bg-slate-900" value="Lato">Lato</option>
                <option className="bg-slate-900" value="Roboto">Roboto</option>
                <option className="bg-slate-900" value="Inter">Inter</option>
              </select>
            </div>
            {!token ? (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link onClick={() => setMenuOpen(false)} className="px-3 py-2 text-center rounded-md text-slate-200 hover:text-brand" to="/login">Login</Link>
                <Link onClick={() => setMenuOpen(false)} className="px-3 py-2 text-center rounded-md bg-brand text-white hover:bg-brand-dark shadow-[0_0_12px_#6B46C1]" to="/signup">Sign Up</Link>
              </div>
            ) : (
              <button onClick={handleLogout} className="mt-2 px-3 py-2 rounded-md bg-slate-800 text-white hover:bg-slate-700">Logout</button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
