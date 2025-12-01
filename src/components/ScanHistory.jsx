import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

import { Wallet, Calendar, Layers } from 'lucide-react'
import './ResultsTable.css' // Reuse the card styles

export default function ScanHistory({ session }) {
    const [scans, setScans] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortOrder, setSortOrder] = useState('newest') // newest, oldest, highest, lowest

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

    // Filter and Sort
    const filteredScans = scans
        .filter(scan => scan.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (sortOrder === 'newest') return new Date(b.created_at) - new Date(a.created_at)
            if (sortOrder === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
            if (sortOrder === 'highest') return b.total_volume - a.total_volume
            if (sortOrder === 'lowest') return a.total_volume - b.total_volume
            return 0
        })

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

    return (
        <div className="scan-history-container">
            {/* Controls Bar */}
            <div className="controls-bar" style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <input
                        type="text"
                        placeholder="Search wallet address..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.6rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            background: 'rgba(0, 0, 0, 0.2)',
                            color: '#fff',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>

                <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    style={{
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(0, 0, 0, 0.2)',
                        color: '#fff',
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                    }}
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest">Highest Volume</option>
                    <option value="lowest">Lowest Volume</option>
                </select>

                <button
                    onClick={fetchScans}
                    className="btn-secondary"
                    style={{
                        padding: '0.6rem 1.2rem',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap'
                    }}
                    disabled={loading}
                >
                    <Layers size={16} />
                    {loading ? 'Refreshing...' : 'Refresh List'}
                </button>
            </div>

            {scans.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: '#888', marginBottom: '1rem' }}>No scans yet. Start analyzing wallets!</p>
                </div>
            ) : filteredScans.length === 0 ? (
                <div className="text-center p-4" style={{ color: '#888' }}>No scans match your search.</div>
            ) : (
                <div className="cards-container">
                    {filteredScans.map((scan) => (
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
            )}
        </div>
    )
}
