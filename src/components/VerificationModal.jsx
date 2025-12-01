import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { ShieldCheck, X } from 'lucide-react'
import XLogo from './XLogo'

export default function VerificationModal({ isOpen, onClose, session, onVerificationComplete }) {
    const [handle, setHandle] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // Basic validation
        let cleanHandle = handle.trim()
        if (cleanHandle.startsWith('@')) cleanHandle = cleanHandle.substring(1)

        if (cleanHandle.length < 3) {
            setError("Handle must be at least 3 characters")
            setLoading(false)
            return
        }

        try {
            // 1. Update User Metadata
            const { error: userError } = await supabase.auth.updateUser({
                data: { x_handle: cleanHandle, id_verified: true }
            })
            if (userError) throw userError

            // 2. Retroactively update all user's scans
            const { error: scanError } = await supabase
                .from('scans')
                .update({ x_handle: cleanHandle })
                .eq('user_id', session.user.id)

            if (scanError) throw scanError

            onVerificationComplete(cleanHandle)
            onClose()
        } catch (err) {
            console.error('Verification failed:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                cursor: 'default'
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#1a1b1e',
                    border: '1px solid #333',
                    borderRadius: '16px',
                    padding: '2rem',
                    width: '100%',
                    maxWidth: '400px',
                    textAlign: 'center',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    position: 'relative'
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'none',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer'
                    }}
                >
                    <X size={20} />
                </button>

                {session?.user?.user_metadata?.id_verified ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem'
                            }}>
                                <ShieldCheck size={32} color="#10b981" />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>ID Verified</h2>
                            <p style={{ color: '#888', fontSize: '0.9rem' }}>
                                Connected as <span style={{ color: '#fff', fontWeight: 'bold' }}>@{session.user.user_metadata.x_handle}</span>
                            </p>
                        </div>

                        <button
                            onClick={async () => {
                                if (!window.confirm('Are you sure you want to disconnect your X account?')) return;
                                setLoading(true);
                                try {
                                    // 1. Update User Metadata
                                    const { error: userError } = await supabase.auth.updateUser({
                                        data: { x_handle: null, id_verified: false }
                                    })
                                    if (userError) throw userError

                                    // 2. Update scans
                                    const { error: scanError } = await supabase
                                        .from('scans')
                                        .update({ x_handle: null })
                                        .eq('user_id', session.user.id)

                                    if (scanError) throw scanError

                                    onVerificationComplete(null) // Pass null to clear
                                    onClose()
                                } catch (err) {
                                    console.error('Disconnect failed:', err)
                                    setError(err.message)
                                } finally {
                                    setLoading(false)
                                }
                            }}
                            disabled={loading}
                            className="btn-secondary"
                            style={{
                                width: '100%',
                                justifyContent: 'center',
                                padding: '0.875rem',
                                borderColor: '#ef4444',
                                color: '#ef4444'
                            }}
                        >
                            {loading ? 'Disconnecting...' : 'Disconnect Account'}
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem'
                            }}>
                                <XLogo size={32} color="#fff" />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>Verify ID with X</h2>
                            <p style={{ color: '#888', fontSize: '0.9rem' }}>
                                Link your X account to get the <span style={{ color: '#fff' }}>ID Verified</span> badge on the leaderboard.
                            </p>
                        </div>

                        {error && (
                            <div style={{
                                background: 'rgba(255, 50, 50, 0.1)',
                                color: '#ff4444',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                marginBottom: '1rem'
                            }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>@</span>
                                <input
                                    type="text"
                                    placeholder="username"
                                    value={handle}
                                    onChange={(e) => setHandle(e.target.value)}
                                    className="input-field"
                                    style={{ paddingLeft: '2.5rem', width: '100%' }}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                                style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    padding: '0.875rem',
                                    background: '#fff',
                                    color: '#000',
                                    border: 'none'
                                }}
                            >
                                {loading ? 'Verifying...' : 'Link Account'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    )
}
