// ===============================
// API FUNCTIONS
// ===============================

export async function safeJson(resp, fallback) {
    if (!resp.ok) return fallback;
    try {
        return await resp.json();
    } catch {
        return fallback;
    }
}

export async function fetchMarketData(symbol) {
    const [oiResp, fResp, kResp] = await Promise.all([
        fetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`),
        fetch(`https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}&limit=2`),
        fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1h&limit=500`)
    ]);

    return {
        oiData: await safeJson(oiResp, {}),
        fArr: await safeJson(fResp, []),
        klines: await safeJson(kResp, [])
    };
}

export async function fetchAllSymbols() {
    const resp = await fetch("https://api.binance.com/api/v3/exchangeInfo");
    const data = await resp.json();
    
    return data.symbols
        .filter(s => s.symbol.endsWith("USDT"))
        .map(s => s.symbol.replace("USDT", ""));
}