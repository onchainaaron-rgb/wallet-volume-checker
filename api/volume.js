
import axios from 'axios';

const BASE_URL = 'https://api.covalenthq.com/v1';
const API_KEY = process.env.COVALENT_API_KEY;

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { chain, address } = req.query;

    if (!chain || !address) {
        return res.status(400).json({ error: 'Missing chain or address' });
    }

    if (!API_KEY) {
        return res.status(500).json({ error: "Server configuration error: Missing API Key" });
    }

    try {
        let hasMore = true;
        let pageNumber = 0;
        let totalVolume = 0;
        let txCount = 0;
        const MAX_PAGES = 20; // Increased to scan up to 2000 events

        console.log(`Starting Deep Scan for Chain ${chain} - ${address}`);

        while (hasMore && pageNumber < MAX_PAGES) {
            let url;
            let isSolana = chain === '1399811149';

            if (isSolana) {
                url = `${BASE_URL}/${chain}/address/${address}/transactions_v2/?key=${API_KEY}&page-number=${pageNumber}&page-size=100&quote-currency=USD`;
            } else {
                url = `${BASE_URL}/${chain}/address/${address}/transfers_v2/?key=${API_KEY}&page-number=${pageNumber}&page-size=100&quote-currency=USD`;
            }

            console.log(`Fetching Page ${pageNumber} for Chain ${chain}...`);

            try {
                const response = await axios.get(url);
                const items = response.data.data.items;

                if (!items || items.length === 0) {
                    console.log(`No items found on page ${pageNumber} for chain ${chain}`);
                    hasMore = false;
                    break;
                }

                console.log(`Page ${pageNumber}: Found ${items.length} items.`);

                const pageVolume = items.reduce((acc, item) => {
                    if (isSolana) {
                        let val = item.value_quote || 0;
                        if (item.fees_paid && item.fees_paid.quote) {
                            val += item.fees_paid.quote;
                        }
                        return acc + val;
                    } else {
                        if (item.transfers && item.transfers.length > 0) {
                            const transferVal = item.transfers.reduce((tAcc, transfer) => tAcc + (transfer.quote || 0), 0);
                            return acc + transferVal;
                        }
                        return acc;
                    }
                }, 0);

                console.log(`Page ${pageNumber} Volume: $${pageVolume.toFixed(2)}`);

                totalVolume += pageVolume;
                txCount += items.length;

                if (!response.data.data.pagination || !response.data.data.pagination.has_more) {
                    hasMore = false;
                } else {
                    pageNumber++;
                }

            } catch (err) {
                if (err.response) {
                    const status = err.response.status;
                    if (status === 400 || status === 410 || status === 501) {
                        console.warn(`Skipping chain ${chain} due to API status ${status}`);
                        hasMore = false;
                        break;
                    }
                }
                throw err;
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
}
