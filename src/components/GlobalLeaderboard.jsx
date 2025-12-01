import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Trophy, ExternalLink } from 'lucide-react'
import AirdropBadge from './AirdropBadge'
import './ResultsTable.css' // Reuse table styles

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
                .limit(200) // Fetch more to allow for duplicates

            if (error) throw error

            // Deduplicate by wallet_address
            const uniqueWallets = [];
            const seenAddresses = new Set();

            for (const scan of data) {
                if (!seenAddresses.has(scan.wallet_address)) {
                    seenAddresses.add(scan.wallet_address);
                    uniqueWallets.push(scan);
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

    const formatAddress = (address) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    const filteredScans = scans.filter(scan =>
        scan.wallet_address.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="glass-panel results-container">
            <div className="results-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Trophy className="text-accent" size={24} />
                        <h3>Global Top 50 Wallets</h3>
                    </div>
                    <div className="results-meta">
                        <span>Highest Volume Scans</span>
                    </div>
                </div>

                {/* Search Bar */}
                <div style={{ width: '100%' }}>
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
            </div>

            <div className="table-responsive">
                <table className="results-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Wallet Address</th>
                            <th className="total-col">TOTAL VOL</th>
                            <th>AIRDROP EST.</th>
                            <th>CHAINS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredScans.map((scan, idx) => (
                            <tr key={scan.id} className="result-row">
                                <td className="mono" style={{ color: idx < 3 ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: idx < 3 ? 'bold' : 'normal' }}>
                                    #{idx + 1}
                                </td>
                                <td className="wallet-col">
                                    <span className="mono" title={scan.wallet_address}>
                                        {formatAddress(scan.wallet_address)}
                                    </span>
                                </td>
                                <td className="total-col mono text-accent">
                                    {formatCurrency(scan.total_volume)}
                                </td>
                                <td>
                                    <AirdropBadge potential={scan.total_volume > 250000 ? { label: 'High', color: '#00f0ff' } : { label: 'Medium', color: '#F3BA2F' }} />
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        {scan.chains && scan.chains.slice(0, 3).map(chain => (
                                            <span key={chain} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px' }}>
                                                {chain.slice(0, 3).toUpperCase()}
                                            </span>
                                        ))}
                                        {scan.chains && scan.chains.length > 3 && (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>+{scan.chains.length - 3}</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {loading && (
                            <tr className="loading-row">
                                <td colSpan={5}>
                                    <div className="loading-indicator">
                                        <span className="dot"></span> Loading Leaderboard...
                                    </div>
                                </td>
                            </tr>
                        )}
                        {!loading && filteredScans.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                                    No wallets found matching "{searchTerm}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default GlobalLeaderboard
