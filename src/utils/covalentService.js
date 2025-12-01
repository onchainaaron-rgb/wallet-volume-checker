// Covalent API Service (Backend Proxy Version)

// Map our internal chain IDs to Covalent Chain IDs (Numeric)
const CHAIN_MAP = {
    'ethereum': '1',
    'base': '8453',
    'arbitrum': '42161',
    'optimism': '10',
    'bsc': '56',
    'polygon': '137',
    'avalanche': '43114',
    'solana': '1399811149',
    'zora': '7777777',
    'scroll': '534352',
    'blast': '81457',
    'fantom': '250'
};

const BACKEND_URL = '/api/volume';

export const fetchRealWalletData = async (wallet, chains) => {
    const results = {};
    let totalVolume = 0;

    const promises = chains.map(async (chain) => {
        const chainName = CHAIN_MAP[chain];
        if (!chainName) return { chain, volume: 0 };

        try {
            // Call our own backend instead of Covalent directly
            const response = await fetch(`${BACKEND_URL}/${chainName}/${wallet}`);
            const data = await response.json();

            return { chain, volume: data.volume || 0 };
        } catch (err) {
            console.error(`Failed to fetch ${chain}`, err);
            return { chain, volume: 0 };
        }
    });

    const chainResults = await Promise.all(promises);

    chainResults.forEach(item => {
        results[item.chain] = item.volume;
        totalVolume += item.volume;
    });

    return {
        address: wallet,
        chainVolumes: results,
        totalVolume: totalVolume,
        airdropPotential: calculateAirdropPotential(totalVolume)
    };
};

const calculateAirdropPotential = (volume) => {
    if (volume > 250000) return { label: 'High', value: '$2,500+', color: '#00f0ff' };
    if (volume > 100000) return { label: 'Medium-High', value: '$1,200', color: '#7000ff' };
    if (volume > 10000) return { label: 'Medium', value: '$450', color: '#F3BA2F' };
    if (volume > 1000) return { label: 'Low', value: '$50', color: '#888' };
    return { label: 'None', value: '$0', color: '#333' };
};
