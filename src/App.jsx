import VerificationModal from './components/VerificationModal'
import { Activity, Play, LogOut, User, History, Search, Trophy, List, CheckCircle, Twitter } from 'lucide-react'

// ... (existing imports)

function App() {
  // ... (existing state)
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false)

  // ... (existing code)

  const handleVerificationComplete = (handle) => {
    // Update local session state to reflect change immediately
    if (session) {
      const newSession = { ...session }
      newSession.user.user_metadata.x_handle = handle
      newSession.user.user_metadata.id_verified = true
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
        {/* ... (Logo) ... */}
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
            className={`nav-btn ${activeView === 'leaderboard' ? 'active' : ''}`}
          >
            <Trophy size={18} /> Leaderboard
          </button>

          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Verification Badge / Button */}
              {session.user.user_metadata?.id_verified ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(29, 161, 242, 0.1)',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: '1px solid rgba(29, 161, 242, 0.2)'
                }}>
                  <Twitter size={14} color="#1DA1F2" />
                  <span style={{ color: '#1DA1F2', fontSize: '0.85rem', fontWeight: '600' }}>
                    @{session.user.user_metadata.x_handle}
                  </span>
                  <CheckCircle size={14} color="#1DA1F2" />
                </div>
              ) : (
                <button
                  onClick={() => setIsVerificationModalOpen(true)}
                  className="btn-secondary"
                  style={{
                    fontSize: '0.85rem',
                    padding: '0.5rem 1rem',
                    borderColor: '#1DA1F2',
                    color: '#1DA1F2'
                  }}
                >
                  <Twitter size={14} style={{ marginRight: '0.5rem' }} />
                  Verify ID
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
              <p style={{ marginTop: '1rem', color: '#00f0ff', fontSize: '1rem', fontWeight: '600' }}>
                Track your wallet now and see where you rank on the Global Leaderboard! 🏆
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

      <footer style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.8rem', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
        <p>VolumeScan.xyz &copy; {new Date().getFullYear()} • v1.2 (Build {new Date().toLocaleTimeString()})</p>
      </footer>
    </div>
  )
}

export default App
