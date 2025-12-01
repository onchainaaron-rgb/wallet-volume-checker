import { useState, useEffect } from 'react'
import './ChainSelector.css'

const AVAILABLE_CHAINS = [
    { id: 'ethereum', name: 'Ethereum', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=026' },
    { id: 'base', name: 'Base', icon: 'https://cryptologos.cc/logos/base-base-logo.svg?v=026' },
    { id: 'arbitrum', name: 'Arbitrum', icon: 'https://cryptologos.cc/logos/arbitrum-arb-logo.svg?v=026' },
    { id: 'optimism', name: 'Optimism', icon: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.svg?v=026' },
    { id: 'bsc', name: 'BSC', icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=026' },
    { id: 'polygon', name: 'Polygon', icon: 'https://cryptologos.cc/logos/polygon-matic-logo.svg?v=026' },
    { id: 'avalanche', name: 'Avalanche', icon: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg?v=026' },
    { id: 'solana', name: 'Solana', icon: 'https://cryptologos.cc/logos/solana-sol-logo.svg?v=026' },
    { id: 'zora', name: 'Zora', icon: 'https://avatars.githubusercontent.com/u/60056322?s=200&v=4' },
    { id: 'scroll', name: 'Scroll', icon: 'https://cryptologos.cc/logos/scroll-scroll-logo.svg?v=026' },
    { id: 'blast', name: 'Blast', icon: 'https://avatars.githubusercontent.com/u/145060941?s=200&v=4' },
    { id: 'fantom', name: 'Fantom', icon: 'https://cryptologos.cc/logos/fantom-ftm-logo.svg?v=026' },
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
                    >
                        <img
                            src={chain.icon}
                            alt={chain.name}
                            className="chain-icon"
                            style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                        />
                        <span className="chain-name">{chain.name}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ChainSelector
