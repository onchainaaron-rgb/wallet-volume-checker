import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Wallet, Calendar, Layers } from 'lucide-react'
import './ResultsTable.css' // Reuse the card styles

export default function ScanHistory({ session }) {
    const [scans, setScans] = useState([])
    const [loading, setLoading] = useState(true)

    const [error, setError] = useState(null)

    useEffect(() => {
        if (session) {
            fetchScans()
        }
    }, [session])

    const fetchScans = async () => {
        console.log("Fetching scans for user:", session.user.id);
        setLoading(true)
        setError(null)
        try {
            const { data, error } = await supabase
                .from('scans')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            console.log("Fetched scans:", data);
            setScans(data)
        } catch (error) {
            console.error('Error fetching scans:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(val)
    }

    if (loading && scans.length === 0) return <div className="text-center p-4">Loading history...</div>

    if (error) {
        return (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem', borderColor: '#ff4444' }}>
                <p style={{ color: '#ff4444', marginBottom: '1rem' }}>Error loading scans: {error}</p>
                <button onClick={fetchScans} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                    Try Again
                </button>
            </div>
        )
    }

    if (scans.length === 0) {
        return (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: '#888', marginBottom: '1rem' }}>No scans yet. Start analyzing wallets!</p>
                <button onClick={fetchScans} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    Refresh List
                </button>
            </div>
        )
    }

    return (
        <div className="scan-history-container">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button
                    onClick={fetchScans}
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    disabled={loading}
                >
                    {loading ? 'Refreshing...' : 'Refresh List'}
                </button>
            </div>
            <div className="cards-container">
                {scans.map((scan) => (
                    <div key={scan.id} className="result-card">
                        <div className="card-header">
                            <div className="wallet-info">
                                <Wallet size={16} className="text-secondary" />
                                <span className="mono">{scan.wallet_address}</span>
                            </div>
                            <div className="scan-date" style={{ fontSize: '0.8rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={14} />
                                {new Date(scan.created_at).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="card-body">
                            <div className="total-volume-section">
                                <span className="label">Total Volume</span>
                                <div className="total-value text-gradient">{formatCurrency(scan.total_volume)}</div>
                            </div>

                            <div className="chain-grid">
                                {/* We only stored the list of chains, not the breakdown per chain in the DB for now. 
                                If we want breakdown, we need to update the DB schema to store it. 
                                For now, we show the chains that were scanned. */}
                                {Array.isArray(scan.chains) && scan.chains.map(chain => (
                                    <div key={chain} className="chain-item">
                                        <span className="chain-name">{chain}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
