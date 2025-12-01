
import { useState, useEffect } from 'react'

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const consent = localStorage.getItem('cookieConsent')
        if (!consent) {
            setIsVisible(true)
        }
    }, [])

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'accepted')
        setIsVisible(false)
    }

    const handleDecline = () => {
        localStorage.setItem('cookieConsent', 'declined')
        setIsVisible(false)
    }

    if (!isVisible) return null

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#1a1b1e',
            borderTop: '1px solid #333',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            zIndex: 10000,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.5)'
        }}>
            <div style={{ maxWidth: '800px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#ccc' }}>
                    We use cookies to enhance your experience, analyze site traffic, and assist in our marketing efforts.
                    By clicking "Accept", you agree to the storing of cookies on your device.
                </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    onClick={handleDecline}
                    style={{
                        background: 'transparent',
                        border: '1px solid #555',
                        color: '#aaa',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    Decline
                </button>
                <button
                    onClick={handleAccept}
                    style={{
                        background: '#00f0ff',
                        border: 'none',
                        color: '#000',
                        padding: '0.5rem 1.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                    }}
                >
                    Accept
                </button>
            </div>
        </div>
    )
}
