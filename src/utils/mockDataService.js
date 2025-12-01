// Simulates fetching volume data for a wallet across chains
export const fetchWalletData = async (wallet, chains) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1000));

    const results = {};
    let totalVolume = 0;

    chains.forEach(chain => {
        // Generate random volume between $0 and $500,000
        // Bias towards lower numbers for realism, but some whales
        const isWhale = Math.random() > 0.9;
        const baseVolume = Math.random() * 10000;
        const volume = isWhale ? baseVolume * 50 : baseVolume;

        // 20% chance of 0 volume on a specific chain
        const finalVolume = Math.random() > 0.8 ? 0 : Math.floor(volume);

        results[chain] = finalVolume;
        totalVolume += finalVolume;
    });

    return {
        address: wallet,
        chainVolumes: results,
        totalVolume: totalVolume,
        airdropPotential: calculateAirdropPotential(totalVolume)
    };
};

const calculateAirdropPotential = (volume) => {
    if (volume > 250000) return { label: 'High', value: '$2,500+', color: '#00f0ff' }; // Cyan
    if (volume > 100000) return { label: 'Medium-High', value: '$1,200', color: '#7000ff' }; // Purple
    if (volume > 10000) return { label: 'Medium', value: '$450', color: '#F3BA2F' }; // Yellow/Gold
    if (volume > 1000) return { label: 'Low', value: '$50', color: '#888' };
    return { label: 'None', value: '$0', color: '#333' };
};
