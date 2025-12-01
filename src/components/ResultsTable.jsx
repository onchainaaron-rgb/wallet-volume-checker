import { ArrowRight, Wallet, Layers } from 'lucide-react'
import AirdropBadge from './AirdropBadge'
import './ResultsTable.css'

const ResultsTable = ({ results, isLoading, selectedChains }) => {
    if (!results.length && !isLoading) return null

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(val)
    }

    return (
        <div className="results-container">
            <div className="results-header">
                <h3><span className="text-accent">03.</span> Analysis Results</h3>
                <div className="results-meta">
                    {results.length > 0 && <span>Processed {results.length} Wallets</span>}
                </div>
            </div>

            <div className="cards-container">
                {results.map((row, idx) => {
                    // Filter chains with > 0 volume
                    const activeChains = selectedChains.filter(chain => (row.chainVolumes[chain] || 0) > 0);

                    return (
                        <div key={`${row.address}-${idx}`} className="result-card">
                            <div className="card-header">
                                <div className="wallet-info">
                                    <Wallet size={16} className="text-secondary" />
                                    <span className="mono">{row.address}</span>
                                </div>
                                <AirdropBadge potential={row.airdropPotential} />
                            </div>

                            <div className="card-body">
                                <div className="total-volume-section">
                                    <span className="label">Total Volume</span>
                                    <div className="total-value text-gradient">{formatCurrency(row.totalVolume)}</div>
                                </div>

                                <div className="chain-grid">
                                    {selectedChains.map(chain => {
                                        const volume = row.chainVolumes[chain] || 0;
                                        return (
                                            <div key={chain} className="chain-item" style={{ opacity: volume > 0 ? 1 : 0.5 }}>
                                                <span className="chain-name">{chain}</span>
                                                <span className="chain-value">{formatCurrency(volume)}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )
                })}

                {isLoading && (
                    <div className="result-card loading-card">
                        <div className="loading-indicator">
                            <span className="dot"></span> Scanning Blockchain Data...
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ResultsTable
