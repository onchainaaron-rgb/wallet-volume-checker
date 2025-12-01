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

        log(`Starting Universal Deep Scan: Chain ${chain}, Address ${address}`);

        // PHASE 1: Transfers V2 (Tokens + Native)
        while (hasMore && pageNumber < MAX_PAGES) {
            // TIME CHECK
            if (Date.now() - START_TIME > TIME_LIMIT) {
                log(`Time Limit Reached (${Date.now() - START_TIME}ms). Stopping Phase 1 at page ${pageNumber}.`);
                break;
            }

            let url;
            let isSolana = chain === '1399811149';

            if (isSolana) {
                url = `${BASE_URL}/${chain}/address/${address}/transactions_v2/?key=${API_KEY}&page-number=${pageNumber}&page-size=100&quote-currency=USD`;
            } else {
                url = `${BASE_URL}/${chain}/address/${address}/transfers_v2/?key=${API_KEY}&page-number=${pageNumber}&page-size=100&quote-currency=USD`;
            }

            log(`[Phase 1] Fetching Page ${pageNumber}...`);

            try {
                const response = await axios.get(url, AXIOS_CONFIG);
                const items = response.data.data.items;

                if (!items || items.length === 0) {
                    log(`[Phase 1] Page ${pageNumber} empty. Stopping.`);
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

                log(`[Phase 1] Page ${pageNumber} Vol: $${pageVolume.toFixed(2)}`);
                totalVolume += pageVolume;
                txCount += items.length;

                if (!response.data.data.pagination || !response.data.data.pagination.has_more) {
                    hasMore = false;
                } else {
                    pageNumber++;
                }
            } catch (err) {
                if (err.code === 'ECONNABORTED') {
                    log(`[Phase 1] Timeout fetching page ${pageNumber}`);
                    hasMore = false;
                    break;
                }
                if (err.response && [400, 410, 501].includes(err.response.status)) {
                    log(`[Phase 1] API Error ${err.response.status} on page ${pageNumber}`);
                    hasMore = false;
                    break;
                }
                log(`[Phase 1] Unknown Error on page ${pageNumber}: ${err.message}`);
                hasMore = false;
            }
        }

        // PHASE 2: Universal Fallback (Transactions V3)
        // Run this for ALL EVM chains if we have time left, to catch missing native volume
        let isSolana = chain === '1399811149';
        let timeLeft = TIME_LIMIT - (Date.now() - START_TIME);

        if (!isSolana && timeLeft > 1000) {
            log(`[Phase 2] Starting Universal Fallback Check. Time left: ${timeLeft}ms`);

            let fallbackVolume = 0;
            hasMore = true;
            pageNumber = 0;

            while (hasMore && pageNumber < 10) { // Limit fallback to 10 pages (1000 txs) to be quick
                if (Date.now() - START_TIME > TIME_LIMIT) {
                    log(`[Phase 2] Time Limit Reached. Stopping.`);
                    break;
                }

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
                    // log(`[Phase 2] Page ${pageNumber} Vol: $${pageVolume.toFixed(2)}`);

                    if (!response.data.data.pagination || !response.data.data.pagination.has_more) {
                        hasMore = false;
                    } else {
                        pageNumber++;
                    }
                } catch (err) {
                    log(`[Phase 2] Failed: ${err.message}`);
                    hasMore = false;
                }
            }

            if (fallbackVolume > totalVolume) {
                log(`[Phase 2] FOUND MORE VOLUME! Updating from $${totalVolume.toFixed(2)} to $${fallbackVolume.toFixed(2)}`);
                totalVolume = fallbackVolume;
            } else {
                log(`[Phase 2] No extra volume found (Fallback: $${fallbackVolume.toFixed(2)} vs Original: $${totalVolume.toFixed(2)})`);
            }
        }

        log(`Scan Complete. Final Total: $${totalVolume.toFixed(2)}`);
        res.json({ volume: totalVolume, txCount, debugLogs });

    } catch (error) {
        log(`Fatal Error: ${error.message}`);
        res.json({ volume: 0, error: error.message, debugLogs });
    }
}
