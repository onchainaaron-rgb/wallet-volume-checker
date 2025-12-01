import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Activity, ShieldCheck, Mail } from 'lucide-react'

export default function AuthModal({ isOpen, onClose }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [email, setEmail] = useState('')
    const [showEmailInput, setShowEmailInput] = useState(false)
    const [message, setMessage] = useState(null)

    if (!isOpen) return null

    const handleLogin = async (provider) => {
        setLoading(true)
        setError(null)
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: window.location.origin,
                },
            })
            if (error) throw error
        } catch (err) {
            setError(err.message)
            setLoading(false)
        }
    }

    const handleEmailLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email,
                options: {
                    emailRedirectTo: window.location.origin,
                },
            })
            if (error) throw error
            setMessage('Check your email for the login link!')
        } catch (err) {
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
                cursor: 'pointer'
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
                    cursor: 'default'
                }}
            >
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{
                        background: 'rgba(0, 240, 255, 0.1)',
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem'
                    }}>
                        <ShieldCheck size={32} color="#00f0ff" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>Access Required</h2>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>
                        Sign in to unlock detailed volume analysis and qualify for future airdrops.
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

                {message && (
                    <div style={{
                        background: 'rgba(0, 255, 100, 0.1)',
                        color: '#4ade80',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        marginBottom: '1rem'
                    }}>
                        {message}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                        onClick={() => handleLogin('google')}
                        disabled={loading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            background: '#fff',
                            color: '#000',
                            border: 'none',
                            padding: '0.875rem',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: loading ? 'wait' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'transform 0.1s'
                        }}
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" width="20" alt="Google" />
                        Continue with Google
                    </button>

                    {!showEmailInput ? (
                        <button
                            onClick={() => setShowEmailInput(true)}
                            disabled={loading}
                            className="btn-secondary"
                            style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '0.875rem' }}
                        >
                            <Mail size={20} />
                            Continue with Email
                        </button>
                    ) : (
                        <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="input-field"
                                style={{ fontSize: '1rem', padding: '0.875rem' }}
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                                style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '0.875rem' }}
                            >
                                {loading ? 'Sending...' : 'Send Magic Link'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowEmailInput(false)}
                                className="btn-secondary"
                                style={{ width: '100%', justifyContent: 'center', fontSize: '0.9rem', padding: '0.5rem', border: 'none', background: 'transparent' }}
                            >
                                Cancel
                            </button>
                        </form>
                    )}
                </div>

                <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#555', lineHeight: '1.4' }}>
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                    <br />
                    <span style={{ opacity: 0.7 }}>
                        Disclaimer: This tool is for informational purposes only. We do not guarantee the accuracy of the data.
                        Use at your own risk.
                    </span>
                </p>
            </div>
        </div>
    )
}
