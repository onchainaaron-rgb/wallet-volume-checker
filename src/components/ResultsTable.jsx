import { ArrowRight, Plus } from 'lucide-react'
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
        <div className="glass-panel results-container">
            <div className="results-header">
                <h3><span className="text-accent">03.</span> Analysis Results</h3>
                <div className="results-meta">
                    {results.length > 0 && <span>Processed {results.length} Wallets</span>}
                </div>
            </div>

            <div className="table-responsive">
                <table className="results-table">
                    <thead>
                        <tr>
                            <th>Wallet Address</th>
                            {selectedChains.map(chain => (
                                <th key={chain} className="chain-col">{chain.toUpperCase()}</th>
                            ))}
                            <th className="total-col">TOTAL VOL</th>
                            <th>AIRDROP EST.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((row, idx) => (
                            <tr key={`${row.address}-${idx}`} className="result-row">
                                <td className="wallet-col">
                                    <span className="mono">{row.address}</span>
                                </td>
                                {selectedChains.map(chain => (
                                    <td key={chain} className="mono">
                                        {formatCurrency(row.chainVolumes[chain] || 0)}
                                    </td>
                                ))}
                                <td className="total-col mono text-accent">
                                    {formatCurrency(row.totalVolume)}
                                </td>
                                <td>
                                    <AirdropBadge potential={row.airdropPotential} />
                                </td>
                            </tr>
                        ))}
                        {isLoading && (
                            <tr className="loading-row">
                                <td colSpan={selectedChains.length + 3}>
                                    <div className="loading-indicator">
                                        <span className="dot"></span> Scanning Blockchain Data...
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default ResultsTable
