
import { useState, useEffect } from 'react'
import './App.css'
import { Activity, Play, LogOut, User, History, Search, Trophy, List } from 'lucide-react'
import WalletInput from './components/WalletInput'
import ChainSelector from './components/ChainSelector'
import ResultsTable from './components/ResultsTable'
import AuthModal from './components/AuthModal'
import CookieConsent from './components/CookieConsent'
import TelegramGateModal from './components/TelegramGateModal'
import ScanHistory from './components/ScanHistory'
import GlobalLeaderboard from './components/GlobalLeaderboard'
import { fetchRealWalletData } from './utils/covalentService'
import { fetchWalletData as fetchMockData } from './utils/mockDataService'
import { supabase } from './supabaseClient'

function App() {
  const [wallets, setWallets] = useState([])
  const [selectedChains, setSelectedChains] = useState([])
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [useRealData, setUseRealData] = useState(true)
  const [error, setError] = useState(null)

  // Auth State
  const [session, setSession] = useState(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Telegram Gate State
  const [searchCount, setSearchCount] = useState(0)
  const [isTelegramGateOpen, setIsTelegramGateOpen] = useState(false)
  const [isTelegramUnlocked, setIsTelegramUnlocked] = useState(false)

  // View State
  const [activeView, setActiveView] = useState('scan') // 'scan', 'my-scans', 'leaderboard'

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // Check local storage for Telegram unlock
    const unlocked = localStorage.getItem('telegramGateUnlocked')
    if (unlocked === 'true') {
      setIsTelegramUnlocked(true)
    }

    return () => subscription.unsubscribe()
  }, [])

  const handleUnlockTelegram = () => {
    localStorage.setItem('telegramGateUnlocked', 'true')
    setIsTelegramUnlocked(true)
    setIsTelegramGateOpen(false)
  }

  const saveScanToHistory = async (walletData) => {
    if (!session) return

    try {
      const { error } = await supabase.from('scans').insert({
        user_id: session.user.id,
        wallet_address: walletData.wallet,
        chains: selectedChains,
        total_volume: walletData.totalVolume
      })
      if (error) console.error('Error saving scan:', error)
    } catch (err) {
      console.error('Failed to save scan:', err)
    }
  }

  const handleAnalyze = async () => {
    console.log("Analyze clicked. Session:", !!session);
    setError(null)

    // AUTH GATE
    if (!session) {
      setIsAuthModalOpen(true)
      return
    }

    // TELEGRAM GATE (Trigger after 1st search if not unlocked)
    if (searchCount >= 1 && !isTelegramUnlocked) {
      setIsTelegramGateOpen(true)
      return
    }

    if (wallets.length === 0) {
      setError("Please enter at least one wallet address.");
      return;
    }

    if (selectedChains.length === 0) {
      setError("Please select at least one chain.");
      return;
    }

    setIsLoading(true)
    setResults([])

    const startTime = Date.now()

    try {
      const newResults = []
      for (const wallet of wallets) {
        let data;
        if (useRealData) {
          data = await fetchRealWalletData(wallet, selectedChains)
        } else {
          data = await fetchMockData(wallet, selectedChains)
        }
        newResults.push(data)
        setResults([...newResults])

        // Auto-save to history
        await saveScanToHistory(data)
      }

      const elapsed = Date.Now() - startTime
      if (elapsed < 1500) {
        await new Promise(r => setTimeout(r, 1500 - elapsed))
      }

      // Increment search count on success
      setSearchCount(prev => prev + 1)

    } catch (error) {
      console.error("Error during analysis:", error);
      setError(error.message || "An error occurred during analysis.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setActiveView('scan')
  }

  return (
    <div className="app-container">
      <CookieConsent />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      <TelegramGateModal
        isOpen={isTelegramGateOpen}
        onUnlock={handleUnlockTelegram}
      />

      <header className="main-header">
        <div
          className="logo"
          onClick={() => setActiveView('scan')}
          style={{ cursor: 'pointer' }}
        >
          <Activity className="logo-icon" />
          <h1>VolumeScan<span className="text-accent">.xyz</span></h1>
        </div>
        <div className="header-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => setActiveView('leaderboard')}
            className={activeView === 'leaderboard' ? 'nav-btn active' : 'nav-btn'}
            style={{ background: 'none', border: 'none', color: activeView === 'leaderboard' ? '#00f0ff' : '#666', cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <Trophy size={18} /> Leaderboard
          </button>

          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => setActiveView('scan')}
                className={activeView === 'scan' ? 'nav-btn active' : 'nav-btn'}
                style={{ background: 'none', border: 'none', color: activeView === 'scan' ? '#00f0ff' : '#666', cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
              >
                <Search size={18} /> Scan
              </button>
              <button
                onClick={() => setActiveView('my-scans')}
                className={activeView === 'my-scans' ? 'nav-btn active' : 'nav-btn'}
                style={{ background: 'none', border: 'none', color: activeView === 'my-scans' ? '#00f0ff' : '#666', cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
              >
                <List size={18} /> My Scans
              </button>
              <div className="user-badge">
                {session.user.user_metadata.avatar_url ? (
                  <img src={session.user.user_metadata.avatar_url} alt="User" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                ) : (
                  <User size={18} />
                )}
                <span>{session.user.user_metadata.full_name || session.user.email?.split('@')[0]}</span>
              </div>
              <button
                onClick={handleLogout}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="btn-secondary"
              style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <main className="container">
        {activeView === 'scan' && (
          <>
            <div className="hero-section">
              <h1 className="hero-title">Lifetime Volume <span className="text-gradient">Checker</span></h1>
              <p className="hero-subtitle">Analyze cross-chain transaction history for any wallet address.</p>
            </div>

            <div className="grid-layout">
              <WalletInput onWalletsChange={setWallets} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <ChainSelector onChainsChange={setSelectedChains} />

                {error && (
                  <div style={{
                    background: 'rgba(255, 50, 50, 0.1)',
                    border: '1px solid #ff4444',
                    color: '#ff4444',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}>
                    <strong>Error:</strong> {error}
                  </div>
                )}

                <button
                  className="btn-primary"
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '1rem',
                    fontSize: '1.1rem'
                  }}
                >
                  {isLoading ? (
                    <>
                      <div className="spinner"></div>
                      Scanning Chains...
                    </>
                  ) : (
                    <>
                      <Play size={20} />
                      Start Volume Analysis
                    </>
                  )}
                </button>
              </div>
            </div>

            {results.length > 0 && (
              <div className="results-section">
                <ResultsTable
                  results={results}
                  selectedChains={selectedChains}
                />
              </div>
            )}
          </>
        )}

        {activeView === 'my-scans' && (
          <div className="history-section" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            <div className="hero-section">
              <h1 className="hero-title">My <span className="text-gradient">Scans</span></h1>
              <p className="hero-subtitle">Track your past analyses and identify high-potential wallets.</p>
            </div>
            <ScanHistory session={session} />
          </div>
        )}

        {activeView === 'leaderboard' && (
          <div className="history-section" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            <div className="hero-section">
              <h1 className="hero-title">Global <span className="text-gradient">Leaderboard</span></h1>
              <p className="hero-subtitle">Top wallets by volume across all users.</p>
            </div>
            <GlobalLeaderboard />
          </div>
        )}
      </main>
    </div>
  )
}

export default App

