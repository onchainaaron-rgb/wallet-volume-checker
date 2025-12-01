import { useState, useEffect } from 'react'
import './App.css'
import { Activity, Play, LogOut, User, History, Search, Trophy, List, CheckCircle } from 'lucide-react'
import XLogo from './components/XLogo'
import WalletInput from './components/WalletInput'
import ChainSelector from './components/ChainSelector'
import ResultsTable from './components/ResultsTable'
import AuthModal from './components/AuthModal'
import CookieConsent from './components/CookieConsent'
import TelegramGateModal from './components/TelegramGateModal'
import ScanHistory from './components/ScanHistory'
import GlobalLeaderboard from './components/GlobalLeaderboard'
import VerificationModal from './components/VerificationModal'
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
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false)

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

  // Debug State
  const [debugLogs, setDebugLogs] = useState([])

  const addLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 50))
    console.log(`[DEBUG] ${msg}`)
  }

  const saveScanToHistory = async (walletData) => {
    if (!session) {
      addLog("Skipping save: No active session")
      return
    }

    addLog(`Saving scan for ${walletData.address}...`)
    try {
      const { error } = await supabase.from('scans').insert({
        user_id: session.user.id,
        wallet_address: walletData.address,
        chains: selectedChains,
        total_volume: walletData.totalVolume,
        // Include verified status and handle if available in metadata
        verified: true,
        x_handle: session.user.user_metadata?.x_handle || null
      })
      if (error) {
        addLog(`Error saving scan: ${error.message}`)
        console.error('Error saving scan:', error)
      } else {
        addLog("Scan saved successfully to DB")
      }
    } catch (err) {
      addLog(`Failed to save scan (Exception): ${err.message}`)
      console.error('Failed to save scan:', err)
    }
  }

  const handleAnalyze = async () => {
    addLog("Analyze started")
    setError(null)

    // AUTH GATE
    if (!session) {
      addLog("Auth Gate: User not logged in")
      setIsAuthModalOpen(true)
      return
    }

    // TELEGRAM GATE (Trigger after 1st search if not unlocked)
    if (searchCount >= 1 && !isTelegramUnlocked) {
      addLog("Telegram Gate: Locked")
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
        addLog(`Fetching data for ${wallet} on ${selectedChains.length} chains...`)
        let data;
        if (useRealData) {
          try {
            data = await fetchRealWalletData(wallet, selectedChains)

            // Display Backend Logs
            if (data.debugLogs && data.debugLogs.length > 0) {
              data.debugLogs.forEach(log => addLog(`[BACKEND] ${log}`));
            }

            addLog(`Data fetched: $${data.totalVolume?.toFixed(2)} volume`)
          } catch (fetchErr) {
            addLog(`Fetch failed: ${fetchErr.message}`)
            throw fetchErr
          }
        } else {
          data = await fetchMockData(wallet, selectedChains)
        }
        newResults.push(data)
        setResults([...newResults])

        // Auto-save to history
        await saveScanToHistory(data)
      }

      const elapsed = Date.now() - startTime
      if (elapsed < 1500) {
        await new Promise(r => setTimeout(r, 1500 - elapsed))
      }

      // Increment search count on success
      setSearchCount(prev => prev + 1)
      addLog("Analysis complete")

    } catch (error) {
      addLog(`Analysis Error: ${error.message}`)
      console.error("Error during analysis:", error);
      setError(error.message || "An error occurred during analysis.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setActiveView('scan')
    addLog("User logged out")
  }

  const handleVerificationComplete = (handle) => {
    // Update local session state to reflect change immediately
    if (session) {
      const newSession = { ...session }
      if (handle) {
        newSession.user.user_metadata.x_handle = handle
        newSession.user.user_metadata.id_verified = true
      } else {
        // Disconnect
        newSession.user.user_metadata.x_handle = null
        newSession.user.user_metadata.id_verified = false
      }
      setSession(newSession)
    }
  }

  return (
    <div className="app-container">
      <CookieConsent />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        session={session}
        onVerificationComplete={handleVerificationComplete}
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
          <h1>Volume Daddy<span className="text-accent">.xyz</span></h1>
        </div>
        <div className="header-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => setActiveView('leaderboard')}
            className={`nav-btn ${activeView === 'leaderboard' ? 'active' : ''}`}
          >
            <Trophy size={18} /> Volume Daddies
          </button>

          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {session.user.user_metadata?.id_verified ? (
                <button
                  onClick={() => setIsVerificationModalOpen(true)}
                  className="btn-verify"
                >
                  <XLogo size={16} color="#fff" />
                  <span>@{session.user.user_metadata.x_handle}</span>
                  <CheckCircle size={16} color="#1DA1F2" />
                </button>
              ) : (
                <button
                  onClick={() => setIsVerificationModalOpen(true)}
                  className="btn-verify"
                >
                  <XLogo size={16} />
                  <span>Verify ID</span>
                </button>
              )}

              <button
                onClick={() => setActiveView('scan')}
                className={`nav-btn ${activeView === 'scan' ? 'active' : ''}`}
              >
                <Search size={18} /> Scan
              </button>
              <button
                onClick={() => setActiveView('my-scans')}
                className={`nav-btn ${activeView === 'my-scans' ? 'active' : ''}`}
              >
                <List size={18} /> My Alpha
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
              <h1 className="hero-title">How Heavy Are <span className="text-gradient">Your Bags?</span></h1>
              <p className="hero-subtitle">Check your Daddy Status across all chains.</p>
              <p style={{ marginTop: '1rem', color: '#000000', fontSize: '1rem', fontWeight: '600' }}>
                See if you're a Volume Daddy or just a shrimp. 🦐 vs 🐳
              </p>
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
              <h1 className="hero-title">My <span className="text-gradient">Alpha</span></h1>
              <p className="hero-subtitle">Track your past analyses and identify high-potential wallets.</p>
            </div>
            <ScanHistory session={session} />
          </div>
        )}

        {activeView === 'leaderboard' && (
          <div className="history-section" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            <div className="hero-section">
              <h1 className="hero-title">Volume <span className="text-gradient">Daddies</span></h1>
              <p className="hero-subtitle">Top Gs by volume across all users.</p>
            </div>
            <GlobalLeaderboard />
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '1rem', borderTop: 'var(--border-width) solid var(--border-color)', marginTop: 'auto', fontFamily: 'var(--font-mono)' }}>
        <p>Volume Daddy &copy; {new Date().getFullYear()} • v1.4 (Build {new Date().toLocaleTimeString()})</p>
      </footer>
    </div>
  )
}

export default App
