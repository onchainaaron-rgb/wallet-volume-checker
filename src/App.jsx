import { useState, useEffect } from 'react'
import './App.css'
import { Activity, Play, LogOut, User } from 'lucide-react'
import WalletInput from './components/WalletInput'
import ChainSelector from './components/ChainSelector'
import ResultsTable from './components/ResultsTable'
import AuthModal from './components/AuthModal'
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

    return () => subscription.unsubscribe()
  }, [])

  const handleAnalyze = async () => {
    console.log("Analyze clicked. Session:", !!session);
    setError(null)

    // AUTH GATE
    if (!session) {
      setIsAuthModalOpen(true)
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
      }

      const elapsed = Date.now() - startTime
      if (elapsed < 1500) {
        await new Promise(r => setTimeout(r, 1500 - elapsed))
      }

    } catch (error) {
      console.error("Error during analysis:", error);
      setError(error.message || "An error occurred during analysis.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="app-container">
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <header className="main-header">
        <div className="logo">
          <Activity className="icon-accent" />
          <span>VOLUME<span className="text-accent">SCAN</span></span>
        </div>

        <div className="header-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            className="mode-toggle"
            onClick={() => setUseRealData(!useRealData)}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: useRealData ? 'var(--text-accent)' : 'var(--text-secondary)',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {useRealData ? 'REAL DATA' : 'MOCK DATA'}
          </button>

          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                {session.user.user_metadata.avatar_url ? (
                  <img
                    src={session.user.user_metadata.avatar_url}
                    alt="Avatar"
                    style={{ width: 24, height: 24, borderRadius: '50%' }}
                  />
                ) : (
                  <User size={20} />
                )}
                <span className="text-accent">{session.user.user_metadata.full_name || session.user.email}</span>
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
              style={{
                cursor: isLoading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '1.1rem',
                padding: '1rem',
                opacity: isLoading ? 0.7 : 1,
                zIndex: 1000,
                position: 'relative'
              }}
            >
              {isLoading ? 'SCANNING...' : <><Play size={20} fill="currentColor" /> START ANALYSIS</>}
            </button>
          </div>
        </div>

        <ResultsTable
          results={results}
          isLoading={isLoading}
          selectedChains={selectedChains}
        />

      </main>

      <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
        v1.2 - Secure & Linked
      </div>
    </div >
  )
}

export default App
