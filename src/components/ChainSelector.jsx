import { useState, useEffect } from 'react'
import './ChainSelector.css'

const AVAILABLE_CHAINS = [
    { id: 'ethereum', name: 'Ethereum', color: '#627EEA' },
    { id: 'base', name: 'Base', color: '#0052FF' },
    { id: 'arbitrum', name: 'Arbitrum', color: '#2D374B' },
    { id: 'optimism', name: 'Optimism', color: '#FF0420' },
    { id: 'bsc', name: 'BSC', color: '#F3BA2F' },
    { id: 'polygon', name: 'Polygon', color: '#8247E5' },
    { id: 'avalanche', name: 'Avalanche', color: '#E84142' },
    { id: 'solana', name: 'Solana', color: '#14F195' },
    { id: 'zora', name: 'Zora', color: '#000000' },
    { id: 'scroll', name: 'Scroll', color: '#FFDB8C' },
    { id: 'blast', name: 'Blast', color: '#FCFC03' },
    { id: 'fantom', name: 'Fantom', color: '#1969FF' },
]

const ChainSelector = ({ onChainsChange }) => {
    const [selectedChains, setSelectedChains] = useState(AVAILABLE_CHAINS.map(c => c.id))

    useEffect(() => {
        onChainsChange(selectedChains)
    }, [selectedChains, onChainsChange])

    const toggleChain = (chainId) => {
        setSelectedChains(prev => {
            if (prev.includes(chainId)) {
                return prev.filter(id => id !== chainId)
            } else {
                return [...prev, chainId]
            }
        })
    }

    const toggleAll = () => {
        if (selectedChains.length === AVAILABLE_CHAINS.length) {
            setSelectedChains([])
        } else {
            setSelectedChains(AVAILABLE_CHAINS.map(c => c.id))
        }
    }

    return (
        <div className="glass-panel chain-selector-container">
            <div className="selector-header">
                <h3><span className="text-accent">02.</span> Select Chains</h3>
                <button className="action-btn" onClick={toggleAll}>
                    {selectedChains.length === AVAILABLE_CHAINS.length ? 'Deselect All' : 'Select All'}
                </button>
            </div>

            <div className="chains-grid">
                {AVAILABLE_CHAINS.map(chain => (
                    <div
                        key={chain.id}
                        className={`chain-card ${selectedChains.includes(chain.id) ? 'active' : ''}`}
                        onClick={() => toggleChain(chain.id)}
                        style={{ '--chain-color': chain.color }}
                    >
                        <div className="chain-indicator"></div>
                        <span className="chain-name">{chain.name}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ChainSelector
