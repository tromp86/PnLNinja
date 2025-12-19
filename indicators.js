
// =========================================================
// ====================== EMA ==============================
// =========================================================

export function ema(prices, period) {
    const k = 2 / (period + 1);
    let arr = [prices[0]];
    for (let i = 1; i < prices.length; i++) {
        arr.push(prices[i] * k + arr[i - 1] * (1 - k));
    }
    return arr;
}

// =========================================================
// ====================== MACD =============================
// =========================================================

export function calcMACD(prices, shortP = 12, longP = 26, signalP = 9) {
    if (prices.length < longP) return { macd: null, signal: null };
    const emaShort = ema(prices, shortP);
    const emaLong = ema(prices, longP);
    const macdLine = emaShort.map((v, i) => v - emaLong[i]);
    const signalLine = ema(macdLine.slice(longP - 1), signalP);
    return {
        macd: macdLine[macdLine.length - 1],
        signal: signalLine[signalLine.length - 1]
    };
}

// =========================================================
// ======================= RSI =============================
// =========================================================

export function calcRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;
    let gains = 0, losses = 0;

    for (let i = 1; i <= period; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff >= 0) gains += diff;
        else losses += Math.abs(diff);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
        avgLoss = (avgLoss * (period - 1) + (diff < 0 ? Math.abs(diff) : 0)) / period;
    }

    return 100 - 100 / (1 + avgGain / avgLoss);
}

// =========================================================
// ======================= OBV =============================
// =========================================================

export function calcOBV(klines) {
    if (!klines || klines.length < 2) return null;
    let obv = 0;

    for (let i = 1; i < klines.length; i++) {
        const close = parseFloat(klines[i][4]);
        const prevClose = parseFloat(klines[i - 1][4]);
        const volume = parseFloat(klines[i][5]);

        if (!close || !prevClose || !volume) continue;

        if (close > prevClose) obv += volume;
        else if (close < prevClose) obv -= volume;
    }

    return obv;
}

// =========================================================
// ==================== STOCHASTIC =========================
// =========================================================

export function calcStoch(klines, period = 14) {
    if (!klines || klines.length < period) return null;

    const closes = klines.map(k => parseFloat(k[4]));
    const highs = klines.map(k => parseFloat(k[2]));
    const lows = klines.map(k => parseFloat(k[3]));

    const highestHigh = Math.max(...highs.slice(-period));
    const lowestLow = Math.min(...lows.slice(-period));
    const close = closes[closes.length - 1];

    if (highestHigh === lowestLow) return 50;

    return ((close - lowestLow) / (highestHigh - lowestLow)) * 100;
}

// =========================================================
// ===================== BOLLINGER =========================
// =========================================================

export function calcBB(prices, period = 20) {
    if (prices.length < period) return { upper: null, middle: null, lower: null };

    const slice = prices.slice(-period);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, p) => sum + (p - sma) ** 2, 0) / period;
    const std = Math.sqrt(variance);

    return {
        upper: sma + std * 2,
        middle: sma,
        lower: sma - std * 2
    };
}

// =========================================================
// ======================== ATR ============================
// =========================================================

export function calcATR(klines, period = 14) {
    if (!klines || klines.length < period + 1) return null;

    const trs = [];

    for (let i = 1; i < klines.length; i++) {
        const high = parseFloat(klines[i][2]);
        const low = parseFloat(klines[i][3]);
        const prevClose = parseFloat(klines[i - 1][4]);

        if (!high || !low || !prevClose) continue;

        trs.push(Math.max(
            high - low,
            Math.abs(high - prevClose),
            Math.abs(low - prevClose)
        ));
    }

    const slice = trs.slice(-period);
    return slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : null;
}

// =========================================================
// ========================= MFI ===========================
// =========================================================

export function calcMFI(klines, period = 14) {
    if (!klines || klines.length < period + 1) return null;

    let posMF = 0, negMF = 0;

    for (let i = 1; i < period; i++) {
        const tpPrev = (parseFloat(klines[i - 1][2]) + parseFloat(klines[i - 1][3]) + parseFloat(klines[i - 1][4])) / 3;
        const tpCurr = (parseFloat(klines[i][2]) + parseFloat(klines[i][3]) + parseFloat(klines[i][4])) / 3;
        const vol = parseFloat(klines[i][5]);

        if (!tpCurr || !tpPrev || !vol) continue;

        if (tpCurr > tpPrev) posMF += tpCurr * vol;
        else negMF += tpCurr * vol;
    }

    const mr = negMF === 0 ? 1 : posMF / negMF;

    return 100 - (100 / (1 + mr));
}

// =========================================================
// ====================== CROSS ============================
// =========================================================

export function crossUp(prevA, prevB, a, b) {
    return prevA < prevB && a > b;
}

export function crossDown(prevA, prevB, a, b) {
    return prevA > prevB && a < b;
}

// =========================================================
// ==================== PRICE HELPERS =======================
// =========================================================

export function priceTouches(price, level, tolerance = 0.001) {
    return Math.abs(price - level) <= Math.abs(level) * tolerance;
}

export function priceBreaksAbove(price, level) {
    return price > level;
}

export function priceBreaksBelow(price, level) {
    return price < level;
}

// =========================================================
// ==================== DIVERGENCE ==========================
// =========================================================

export function detectDivergence(type, priceArr, oscArr) {
    if (!priceArr || !oscArr || priceArr.length < 3 || oscArr.length < 3) return false;

    const p1 = priceArr[priceArr.length - 3];
    const p2 = priceArr[priceArr.length - 1];

    const o1 = oscArr[oscArr.length - 3];
    const o2 = oscArr[oscArr.length - 1];

    if (type === "bear") return p2 > p1 && o2 < o1;
    if (type === "bull") return p2 < p1 && o2 > o1;

    return false;
}

export function detectHiddenDivergence(type, priceArr, oscArr) {
    if (!priceArr || !oscArr || priceArr.length < 3 || oscArr.length < 3) return false;

    const p1 = priceArr[priceArr.length - 3];
    const p2 = priceArr[priceArr.length - 1];

    const o1 = oscArr[oscArr.length - 3];
    const o2 = oscArr[oscArr.length - 1];

    if (type === "bear") return p2 < p1 && o2 > o1;
    if (type === "bull") return p2 > p1 && o2 < o1;

    return false;
}

// =========================================================
// ================= LIQUIDATION ZONES ======================
// =========================================================

export function calculateLiquidationZones(priceDepth, leverageMap) {
    if (!priceDepth || !leverageMap) return null;

    const zones = [];

    for (let level in leverageMap) {
        const lev = leverageMap[level];
        if (lev > 0.2) {
            zones.push({
                price: Number(level),
                leverage: lev
            });
        }
    }

    return zones.length ? zones : null;
}

// =========================================================
// ===================== COMPOSITE ==========================
// =========================================================

export function countTrue(arr) {
    return arr.flat().filter(Boolean).length;
}
