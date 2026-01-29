import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header.jsx'
import Dashboard from './pages/Dashboard.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'
import TradePage from './pages/TradePage.jsx'
import PortfolioPage from './pages/PortfolioPage.jsx'
import WatchlistPage from './pages/WatchlistPage.jsx'
import './App.css'

function App() {
  return (
    <div className="mx-auto max-w-7xl px-4">
      <Header />
      <main className="py-6 md:py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/trade" element={<TradePage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
