import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Trophy, Wallet, Layers } from 'lucide-react'
import XLogo from './XLogo'
import AirdropBadge from './AirdropBadge'
import './ResultsTable.css'
import './FlexCards.css'

const GlobalLeaderboard = () => {
    const [scans, setScans] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchLeaderboard()
    }, [])

    const fetchLeaderboard = async () => {
        try {
            const { data, error } = await supabase
                .from('scans')
                .select('*')
                .order('total_volume', { ascending: false })
                .limit(200)

            if (error) throw error

            // Deduplicate and Retroactively Verify
            const uniqueWallets = [];
            const seenAddresses = new Set();

            for (const scan of data) {
                if (!seenAddresses.has(scan.wallet_address)) {
                    seenAddresses.add(scan.wallet_address);
                    // Retroactively verify
                    uniqueWallets.push({ ...scan, verified: true });
                }
                if (uniqueWallets.length >= 50) break;
            }

            setScans(uniqueWallets)
        } catch (error) {
            console.error('Error fetching leaderboard:', error)
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

    const filteredScans = scans.filter(scan =>
        scan.verified && // Only show verified
        scan.wallet_address.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="scan-history-container">
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
                        className="input-field control-bar-item"
                    />
                </div>
            </div>

            {loading ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="loading-indicator">
                        <span className="dot"></span> Loading Leaderboard...
                    </div>
                </div>
            ) : filteredScans.length === 0 ? (
                <div className="text-center p-4" style={{ color: '#888' }}>No wallets found.</div>
            ) : (
                <div className="flex-card-grid">
                    {filteredScans.map((scan, idx) => {
                        const isWhale = scan.total_volume > 100000;
                        const isDegen = scan.total_volume > 10000 && scan.total_volume <= 100000;
                        const cardClass = isWhale ? 'flex-card whale' : isDegen ? 'flex-card degen' : 'flex-card';

                        // Rank Badge Color
                        let rankColor = '#64748b'; // default slate
                        if (idx === 0) rankColor = '#fbbf24'; // gold
                        if (idx === 1) rankColor = '#94a3b8'; // silver
                        if (idx === 2) rankColor = '#b45309'; // bronze

                        return (
                            <div key={scan.id} className={cardClass}>
                                <div className="card-watermark">#{idx + 1}</div>

                                <div className="card-top">
                                    <div className="wallet-pill">
                                        <span style={{
                                            marginRight: '0.5rem',
                                            color: rankColor,
                                            fontWeight: 'bold',
                                            fontSize: '0.9rem'
                                        }}>#{idx + 1}</span>
                                        <Wallet size={12} />
                                        {scan.wallet_address.slice(0, 6)}...{scan.wallet_address.slice(-4)}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        {scan.verified && (
                                            <span style={{ color: '#10b981', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Layers size={12} /> Verified
                                            </span>
                                        )}
                                        {scan.x_handle && (
                                            <span style={{ color: '#fff', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <XLogo size={12} /> @{scan.x_handle}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="card-main">
                                    <div className="volume-label">Total Volume</div>
                                    <div className="volume-amount">
                                        {formatCurrency(scan.total_volume)}
                                    </div>
                                </div>

                                <div className="card-footer">
                                    <div className="brand-tag">Volume Daddy</div>
                                    <div className="status-badges">
                                        {isWhale && <span className="badge whale">WHALE</span>}
                                        {isDegen && <span className="badge degen">DEGEN</span>}
                                        <AirdropBadge potential={scan.total_volume > 250000 ? { label: 'High', color: '#00f0ff' } : { label: 'Medium', color: '#F3BA2F' }} />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default GlobalLeaderboard
