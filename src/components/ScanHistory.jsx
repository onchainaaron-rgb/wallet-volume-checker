import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Wallet, Calendar, Layers, Trash2, Twitter } from 'lucide-react'
import './ResultsTable.css'
import './FlexCards.css'

export default function ScanHistory({ session }) {
    const [scans, setScans] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortOrder, setSortOrder] = useState('highest')

    useEffect(() => {
        if (session) {
            fetchScans()
        }
    }, [session])

    const fetchScans = async () => {
        setLoading(true)
        setError(null)
        try {
            const { data, error } = await supabase
                .from('scans')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            // Deduplicate and Retroactively Verify
            const uniqueScans = [];
            const seenWallets = new Set();

            for (const scan of data) {
                if (!seenWallets.has(scan.wallet_address)) {
                    seenWallets.add(scan.wallet_address);
                    // User Request: "make everything we have scanned to date with the verifcation badge"
                    uniqueScans.push({ ...scan, verified: true });
                }
            }

            setScans(uniqueScans)
        } catch (error) {
            console.error('Error fetching scans:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (scanId, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this scan?')) return;

        try {
            const { error } = await supabase
                .from('scans')
                .delete()
                .eq('id', scanId);

            if (error) throw error;

            setScans(scans.filter(scan => scan.id !== scanId));
        } catch (error) {
            console.error('Error deleting scan:', error);
            alert('Failed to delete scan');
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(val)
    }

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
                        className="input-field control-bar-item"
                    />
                </div>

                <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="input-field control-bar-item"
                    style={{
                        width: 'auto',
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
                    className="btn-primary control-bar-item"
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
                <div className="flex-card-grid">
                    {filteredScans.map((scan) => {
                        const isWhale = scan.total_volume > 100000;
                        const isDegen = scan.total_volume > 10000 && scan.total_volume <= 100000;
                        const cardClass = isWhale ? 'flex-card whale' : isDegen ? 'flex-card degen' : 'flex-card';

                        return (
                            <div key={scan.id} className={cardClass}>
                                <div className="card-watermark">VOLUME</div>

                                <div className="card-top">
                                    <div className="wallet-pill">
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
                                            <span style={{ color: '#1DA1F2', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Twitter size={12} /> @{scan.x_handle}
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => handleDelete(scan.id, e)}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                                color: '#ef4444',
                                                padding: '4px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title="Delete Scan"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>

                                <div className="card-main">
                                    <div className="volume-label">Verified Volume</div>
                                    <div className="volume-amount">
                                        {formatCurrency(scan.total_volume)}
                                    </div>
                                </div>

                                <div className="card-footer">
                                    <div className="brand-tag">VolumeScan</div>
                                    <div className="status-badges">
                                        {isWhale && <span className="badge whale">WHALE</span>}
                                        {isDegen && <span className="badge degen">DEGEN</span>}
                                        <button
                                            className="badge chains"
                                            style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                alert('Saving card image... (Feature coming soon)');
                                            }}
                                        >
                                            Share ↗
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div >
            )}
        </div >
    )
}
