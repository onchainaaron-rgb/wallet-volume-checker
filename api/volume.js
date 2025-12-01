
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
        const MAX_PAGES = 20; // Scan up to 2000 events

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
                    hasMore = false;
                    break;
                }

                const pageVolume = items.reduce((acc, item) => {
                    if (isSolana) {
                        let val = item.value_quote || 0;
                        if (item.fees_paid && item.fees_paid.quote) val += item.fees_paid.quote;
                        return acc + val;
                    } else {
                        if (item.transfers && item.transfers.length > 0) {
                            return acc + item.transfers.reduce((tAcc, transfer) => tAcc + (transfer.quote || 0), 0);
                        }
                        return acc;
                    }
                }, 0);

                totalVolume += pageVolume;
                txCount += items.length;

                if (!response.data.data.pagination || !response.data.data.pagination.has_more) {
                    hasMore = false;
                } else {
                    pageNumber++;
                }
            } catch (err) {
                if (err.response && [400, 410, 501].includes(err.response.status)) {
                    hasMore = false;
                    break;
                }
                throw err;
            }
        }

        // FALLBACK: If Volume is very low (< $1) and it's NOT Solana (EVM), try transactions_v3
        let isSolana = chain === '1399811149';
        if (totalVolume < 1 && !isSolana) {
            console.log(`Volume is low ($${totalVolume.toFixed(2)}) for ${chain}. Attempting Fallback to transactions_v3...`);

            let fallbackVolume = 0;
            hasMore = true;
            pageNumber = 0;

            while (hasMore && pageNumber < 5) { // Limit fallback to 5 pages
                let url = `${BASE_URL}/${chain}/address/${address}/transactions_v3/?key=${API_KEY}&page-number=${pageNumber}&page-size=100&quote-currency=USD`;

                try {
                    const response = await axios.get(url);
                    const items = response.data.data.items;

                    if (!items || items.length === 0) {
                        hasMore = false;
                        break;
                    }

                    const pageVolume = items.reduce((acc, item) => {
                        return acc + (item.value_quote || 0);
                    }, 0);

                    fallbackVolume += pageVolume;

                    if (!response.data.data.pagination || !response.data.data.pagination.has_more) {
                        hasMore = false;
                    } else {
                        pageNumber++;
                    }
                } catch (err) {
                    console.warn(`Fallback failed for ${chain}:`, err.message);
                    hasMore = false;
                }
            }

            if (fallbackVolume > totalVolume) {
                console.log(`Fallback yielded higher volume: $${fallbackVolume.toFixed(2)} vs $${totalVolume.toFixed(2)}`);
                totalVolume = fallbackVolume;
            }
        }

        console.log(`Deep Scan Complete for ${chain}. Total Volume: $${totalVolume.toFixed(2)}`);
        res.json({ volume: totalVolume, txCount });

    } catch (error) {
        console.error(`Error fetching data for ${chain}:`, error.message);
        res.json({ volume: 0, error: error.message });
    }
}
