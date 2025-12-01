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
    const debugLogs = [];
    const log = (msg) => {
        console.log(msg);
        debugLogs.push(msg);
    }

    if (!chain || !address) {
        return res.status(400).json({ error: 'Missing chain or address', debugLogs });
    }

    if (!API_KEY) {
        log("Error: Missing API Key");
        return res.status(500).json({ error: "Server configuration error: Missing API Key", debugLogs });
    }

    try {
        const START_TIME = Date.now();
        const TIME_LIMIT = 8500; // 8.5 seconds hard limit
        const MAX_PAGES = 100; // Try to get 10,000 txs if time permits
        const AXIOS_CONFIG = { timeout: 9000 };

        let hasMore = true;
        let pageNumber = 0;
        let totalVolume = 0;
        let txCount = 0;

        log(`Starting Deep Scan: Chain ${chain}, Address ${address}`);

        while (hasMore && pageNumber < MAX_PAGES) {
            // TIME CHECK
            if (Date.now() - START_TIME > TIME_LIMIT) {
                log(`Time Limit Reached (${Date.now() - START_TIME}ms). Stopping scan at page ${pageNumber}.`);
                break;
            }

            let url;
            let isSolana = chain === '1399811149';

            if (isSolana) {
                url = `${BASE_URL}/${chain}/address/${address}/transactions_v2/?key=${API_KEY}&page-number=${pageNumber}&page-size=100&quote-currency=USD`;
            } else {
                url = `${BASE_URL}/${chain}/address/${address}/transfers_v2/?key=${API_KEY}&page-number=${pageNumber}&page-size=100&quote-currency=USD`;
            }

            log(`Fetching Page ${pageNumber}...`);

            try {
                const response = await axios.get(url, AXIOS_CONFIG);
                const items = response.data.data.items;

                if (!items || items.length === 0) {
                    log(`Page ${pageNumber} empty. Stopping.`);
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

                log(`Page ${pageNumber} Vol: $${pageVolume.toFixed(2)}`);
                totalVolume += pageVolume;
                txCount += items.length;

                if (!response.data.data.pagination || !response.data.data.pagination.has_more) {
                    hasMore = false;
                } else {
                    pageNumber++;
                }
            } catch (err) {
                if (err.code === 'ECONNABORTED') {
                    log(`Timeout fetching page ${pageNumber}`);
                    hasMore = false;
                    break;
                }
                if (err.response && [400, 410, 501].includes(err.response.status)) {
                    log(`API Error ${err.response.status} on page ${pageNumber}`);
                    hasMore = false;
                    break;
                }
                log(`Unknown Error on page ${pageNumber}: ${err.message}`);
                // Don't throw, just return what we have
                hasMore = false;
            }
        }

        // FALLBACK LOGIC (Only if we have time left)
        let isSolana = chain === '1399811149';
        let isBSC = chain === '56';
        let timeLeft = TIME_LIMIT - (Date.now() - START_TIME);

        // Aggressive Fallback for BSC or extremely low volume chains
        // If BSC volume is suspiciously low (<$1000) OR we just want to be sure, check transactions_v3
        if ((totalVolume < 1000 || isBSC) && !isSolana && timeLeft > 1000) {
            log(`Checking Fallback (transactions_v3) for ${chain}. Time left: ${timeLeft}ms`);

            let fallbackVolume = 0;
            hasMore = true;
            pageNumber = 0;

            while (hasMore && pageNumber < 5) { // Limit fallback depth to save time
                if (Date.now() - START_TIME > TIME_LIMIT) break;

                let url = `${BASE_URL}/${chain}/address/${address}/transactions_v3/?key=${API_KEY}&page-number=${pageNumber}&page-size=100&quote-currency=USD`;

                try {
                    const response = await axios.get(url, AXIOS_CONFIG);
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
                    log(`Fallback failed: ${err.message}`);
                    hasMore = false;
                }
            }

            if (fallbackVolume > totalVolume) {
                log(`Fallback yielded higher volume: $${fallbackVolume.toFixed(2)} vs $${totalVolume.toFixed(2)}`);
                totalVolume = fallbackVolume;
            } else {
                log(`Fallback yielded lower/equal volume: $${fallbackVolume.toFixed(2)}. Keeping original.`);
            }
        }

        log(`Scan Complete. Total: $${totalVolume.toFixed(2)}`);
        res.json({ volume: totalVolume, txCount, debugLogs });

    } catch (error) {
        log(`Fatal Error: ${error.message}`);
        res.json({ volume: 0, error: error.message, debugLogs });
    }
}
