import { useState, useRef } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import './WalletInput.css'

const WalletInput = ({ onWalletsChange }) => {
    const [input, setInput] = useState('')
    const fileInputRef = useRef(null)

    const handleTextChange = (e) => {
        const value = e.target.value
        setInput(value)
        parseAndEmit(value)
    }

    const parseAndEmit = (text) => {
        // Split by newlines or commas, trim, and filter empty
        const wallets = text.split(/[\n,]+/).map(w => w.trim()).filter(w => w.length > 0)
        onWalletsChange(wallets)
    }

    const handleFileUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const text = event.target.result
            setInput(text)
            parseAndEmit(text)
        }
        reader.readAsText(file)
    }

    const clearInput = () => {
        setInput('')
        onWalletsChange([])
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <div className="glass-panel wallet-input-container">
            <div className="input-header">
                <h3><span className="text-accent">01.</span> Input Wallets</h3>
                <div className="input-actions">
                    <button
                        className="action-btn"
                        onClick={() => fileInputRef.current.click()}
                    >
                        <Upload size={16} /> Import File
                    </button>
                    {input && (
                        <button className="action-btn danger" onClick={clearInput}>
                            <X size={16} /> Clear
                        </button>
                    )}
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".txt,.csv"
                    style={{ display: 'none' }}
                />
            </div>

            <textarea
                className="input-field wallet-textarea"
                placeholder="Paste wallet addresses here (one per line or comma separated)...&#10;0x123...&#10;0x456..."
                value={input}
                onChange={handleTextChange}
                spellCheck="false"
            />

            <div className="input-footer">
                <span className="count-badge">
                    {input.split(/[\n,]+/).filter(w => w.trim().length > 0).length} Wallets Detected
                </span>
            </div>
        </div>
    )
}

export default WalletInput
