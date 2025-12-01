import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { ArrowUpRight, Calendar, DollarSign, Wallet } from 'lucide-react'

export default function ScanHistory({ session }) {
    const [scans, setScans] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (session) {
            fetchScans()
        }
    }, [session])

    const fetchScans = async () => {
        try {
            const { data, error } = await supabase
                .from('scans')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setScans(data)
        } catch (error) {
            console.error('Error fetching scans:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="text-center p-4">Loading history...</div>

    if (scans.length === 0) {
        return (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: '#888' }}>No scans yet. Start analyzing wallets!</p>
            </div>
        )
    }

    return (
        <div className="glass-panel">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ActivityIcon /> Scan History
                <span style={{ fontSize: '0.8rem', background: '#333', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#888' }}>
                    {scans.length} Total
                </span>
            </h3>

            <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                            <th style={{ padding: '1rem', color: '#888', fontWeight: '500' }}>Wallet</th>
                            <th style={{ padding: '1rem', color: '#888', fontWeight: '500' }}>Date</th>
                            <th style={{ padding: '1rem', color: '#888', fontWeight: '500', textAlign: 'right' }}>Total Volume</th>
                            <th style={{ padding: '1rem', color: '#888', fontWeight: '500', textAlign: 'right' }}>Potential</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scans.map((scan) => (
                            <tr key={scan.id} style={{ borderBottom: '1px solid #222' }}>
                                <td style={{ padding: '1rem', fontFamily: 'monospace' }}>
                                    {scan.wallet_address.slice(0, 6)}...{scan.wallet_address.slice(-4)}
                                </td>
                                <td style={{ padding: '1rem', color: '#666', fontSize: '0.9rem' }}>
                                    {new Date(scan.created_at).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#fff' }}>
                                    ${Number(scan.total_volume).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    {Number(scan.total_volume) > 10000 ? (
                                        <span style={{ color: '#00f0ff', background: 'rgba(0, 240, 255, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                                            HIGH
                                        </span>
                                    ) : Number(scan.total_volume) > 1000 ? (
                                        <span style={{ color: '#f3ba2f', background: 'rgba(243, 186, 47, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                                            MEDIUM
                                        </span>
                                    ) : (
                                        <span style={{ color: '#666', fontSize: '0.8rem' }}>LOW</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function ActivityIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
    )
}
