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
        const MAX_PAGES = 50; // Deep scan
        const AXIOS_CONFIG = { timeout: 9000 };

        log(`Starting Parallel Dual-Source Scan (v2/v3): Chain ${chain}, Address ${address}`);

        // Helper function to scan an endpoint
        const scanEndpoint = async (type) => {
            let hasMore = true;
            let pageNumber = 0;
            let volume = 0;
            let txs = 0;
            let endpointLogs = [];
            let useV2 = false; // Flag to switch to v2 if v3 fails

            const eLog = (m) => endpointLogs.push(`[${type}${useV2 ? '-v2' : ''}] ${m}`);

            while (hasMore && pageNumber < MAX_PAGES) {
                if (Date.now() - START_TIME > TIME_LIMIT) {
                    eLog(`Time Limit. Stopping at page ${pageNumber}.`);
                    break;
                }

                let url;
                let isSolana = chain === '1399811149';

                if (isSolana) {
                    // Solana only has transactions_v2
                    if (type === 'transfers') return { volume: 0, txs: 0, logs: [] };
                    url = `${BASE_URL}/${chain}/address/${address}/transactions_v2/?key=${API_KEY}&page-number=${pageNumber}&page-size=100&quote-currency=USD`;
                } else {
                    if (type === 'transfers') {
                        url = `${BASE_URL}/${chain}/address/${address}/transfers_v2/?key=${API_KEY}&page-number=${pageNumber}&page-size=100&quote-currency=USD`;
                    } else {
                        // Transactions: Try v3 first, fallback to v2
                        let version = useV2 ? 'transactions_v2' : 'transactions_v3';
                        url = `${BASE_URL}/${chain}/address/${address}/${version}/?key=${API_KEY}&page-number=${pageNumber}&page-size=100&quote-currency=USD`;
                    }
                }

                try {
                    const response = await axios.get(url, AXIOS_CONFIG);
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
                            if (type === 'transfers') {
                                if (item.transfers && item.transfers.length > 0) {
                                    return acc + item.transfers.reduce((tAcc, transfer) => tAcc + (transfer.quote || 0), 0);
                                }
                                return acc;
                            } else {
                                // Transactions V3/V2 - Native Value
                                return acc + (item.value_quote || 0);
                            }
                        }
                    }, 0);

                    volume += pageVolume;
                    txs += items.length;

                    if (!response.data.data.pagination || !response.data.data.pagination.has_more) {
                        hasMore = false;
                    } else {
                        pageNumber++;
                    }
                } catch (err) {
                    // Handle Fallback to V2 for Transactions
                    if (type === 'transactions' && !useV2 && pageNumber === 0 && err.response && [400, 404, 501].includes(err.response.status)) {
                        eLog(`V3 Failed (${err.response.status}). Switching to transactions_v2...`);
                        useV2 = true;
                        continue; // Retry loop with useV2 = true
                    }

                    if (err.code === 'ECONNABORTED') {
                        eLog(`Timeout page ${pageNumber}`);
                    } else if (err.response && [400, 410, 501].includes(err.response.status)) {
                        eLog(`API Error ${err.response.status}`);
                    } else {
                        eLog(`Error: ${err.message}`);
                    }
                    hasMore = false;
                }
            }
            eLog(`Finished. Vol: $${volume.toFixed(2)}`);
            return { volume, txs, logs: endpointLogs };
        };

        // RUN PARALLEL SCANS
        const [transfersResult, transactionsResult] = await Promise.all([
            scanEndpoint('transfers'),
            scanEndpoint('transactions')
        ]);

        // Merge Logs
        debugLogs.push(...transfersResult.logs);
        debugLogs.push(...transactionsResult.logs);

        // Determine Final Volume (MAX Strategy)
        let finalVolume = Math.max(transfersResult.volume, transactionsResult.volume);
        let finalTxs = Math.max(transfersResult.txs, transactionsResult.txs);

        log(`Scan Complete. Transfers: $${transfersResult.volume.toFixed(2)}, Txs: $${transactionsResult.volume.toFixed(2)}. Final: $${finalVolume.toFixed(2)}`);

        res.json({ volume: finalVolume, txCount: finalTxs, debugLogs });

    } catch (error) {
        log(`Fatal Error: ${error.message}`);
        res.json({ volume: 0, error: error.message, debugLogs });
    }
}
