require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const BASE_URL = 'https://api.covalenthq.com/v1';
const API_KEY = process.env.COVALENT_API_KEY;

if (!API_KEY) {
    console.warn("WARNING: COVALENT_API_KEY is not set in .env file!");
}

app.get('/api/volume/:chain/:address', async (req, res) => {
    const { chain, address } = req.params;

    if (!API_KEY) {
        return res.status(500).json({ error: "Server configuration error: Missing API Key" });
    }

    try {
        let hasMore = true;
        let pageNumber = 0;
        let totalVolume = 0;
        let txCount = 0;
        const MAX_PAGES = 5; // Scan up to 500 transfer events per chain for speed

        console.log(`Starting Deep Scan for Chain ${chain} - ${address}`);

        while (hasMore && pageNumber < MAX_PAGES) {
            let url;
            let isSolana = chain === '1399811149';

            if (isSolana) {
                // Solana does not support transactions_v3 (returns 501), so we try transactions_v2
                url = `${BASE_URL}/${chain}/address/${address}/transactions_v2/?key=${API_KEY}&page-number=${pageNumber}&page-size=50`;
            } else {
                // EVM chains support transfers_v2 which is better for "In + Out" volume
                url = `${BASE_URL}/${chain}/address/${address}/transfers_v2/?key=${API_KEY}&page-number=${pageNumber}&page-size=100`;
            }

            console.log(`Fetching Page ${pageNumber} for Chain ${chain}...`);

            try {
                const response = await axios.get(url);
                const items = response.data.data.items;

                if (!items || items.length === 0) {
                    hasMore = false;
                    break;
                }

                // DEBUG: Log structure for the first page
                if (pageNumber === 0 && items.length > 0) {
                    console.log(`Sample TX (${chain}):`, JSON.stringify(items[0], null, 2));
                }

                const pageVolume = items.reduce((acc, item) => {
                    if (isSolana) {
                        // SOLANA LOGIC (transactions_v3)
                        // 1. Native SOL Value
                        let val = item.value_quote || 0;

                        // 2. Fees
                        if (item.fees_paid && item.fees_paid.quote) {
                            val += item.fees_paid.quote;
                        }

                        // 3. Token Transfers (Harder on Solana via transactions_v3 without parsing inner instructions)
                        // Covalent often abstracts this into 'value_quote' for the main action, 
                        // but for complex DeFi, we might miss some internal movements.
                        // We will rely on value_quote + fees for now.
                        return acc + val;
                    } else {
                        // EVM LOGIC (transfers_v2)
                        if (item.transfers && item.transfers.length > 0) {
                            return acc + item.transfers.reduce((tAcc, transfer) => tAcc + (transfer.quote || 0), 0);
                        }
                        return acc;
                    }
                }, 0);

                totalVolume += pageVolume;
                txCount += items.length;

                // Check if we should continue
                if (!response.data.data.pagination || !response.data.data.pagination.has_more) {
                    hasMore = false;
                } else {
                    pageNumber++;
                }

            } catch (err) {
                // Handle specific API errors gracefully
                if (err.response) {
                    const status = err.response.status;
                    // 400: Malformed address (e.g. Solana address on ETH chain) -> Ignore
                    // 410: Chain sunsetted (e.g. Zora) -> Ignore
                    // 501: Not Implemented -> Ignore
                    if (status === 400 || status === 410 || status === 501) {
                        console.warn(`Skipping chain ${chain} due to API status ${status} (likely incompatible address or chain)`);
                        hasMore = false; // Stop trying this chain
                        break;
                    }
                }
                throw err; // Re-throw other errors to be caught by the outer catch
            }
        }

        console.log(`Deep Scan Complete for ${chain}. Scanned ${txCount} Events. Total Volume: $${totalVolume.toFixed(2)}`);
        res.json({ volume: totalVolume, txCount });

    } catch (error) {
        console.error(`Error fetching data for ${chain}:`, error.message);
        if (error.response) {
            console.error("API Response Error:", error.response.data);
        }
        res.json({ volume: 0, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
