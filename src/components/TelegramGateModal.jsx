import { Send } from 'lucide-react'

export default function TelegramGateModal({ isOpen, onUnlock }) {
    if (!isOpen) return null

    const handleJoin = () => {
        // Open Telegram link in new tab
        window.open('https://t.me/your_channel_placeholder', '_blank')
    }

    const handleContinue = () => {
        onUnlock()
    }

    return (
        <div style={{
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
            zIndex: 9999
        }}>
            <div style={{
                background: '#1a1b1e',
                border: '1px solid #333',
                borderRadius: '16px',
                padding: '2rem',
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{
                        background: 'rgba(0, 136, 204, 0.1)',
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem'
                    }}>
                        <Send size={32} color="#0088cc" style={{ marginLeft: '-2px' }} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>One More Step!</h2>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>
                        To continue performing unlimited searches, please join our Telegram community.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                        onClick={handleJoin}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            background: '#0088cc',
                            color: '#fff',
                            border: 'none',
                            padding: '0.875rem',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'transform 0.1s'
                        }}
                    >
                        <Send size={20} />
                        Join Telegram Channel
                    </button>

                    <button
                        onClick={handleContinue}
                        style={{
                            background: 'transparent',
                            color: '#666',
                            border: '1px solid #333',
                            padding: '0.875rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            marginTop: '0.5rem'
                        }}
                    >
                        I've Joined / Continue
                    </button>
                </div>
            </div>
        </div>
    )
}
