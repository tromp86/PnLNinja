// ===============================
// INDICATOR CALCULATIONS
// ===============================
import { calcMACD, calcRSI, calcOBV, calcStoch, calcBB, calcATR, calcMFI } from '../indicators.js';

export function computeIndicators(klines, closes, OI, funding) {
    const rsi = calcRSI(closes) ?? 'N/A';
    const macd = calcMACD(closes);
    const obv = calcOBV(klines) ?? 'N/A';
    const stoch = calcStoch(klines) ?? 'N/A';
    const bb = calcBB(closes);
    const atr = calcATR(klines) ?? 'N/A';
    const mfi = calcMFI(klines) ?? 'N/A';

    const lastPrice = closes[closes.length - 1] || 0;

    // EMA розрахунки
    const EMA8 = closes.slice(-8).reduce((a, b) => a + b, 0) / 8;
    const EMA21 = closes.slice(-21).reduce((a, b) => a + b, 0) / 21;
    const EMA50 = closes.slice(-50).reduce((a, b) => a + b, 0) / 50;
    const EMA200 = closes.slice(-200).reduce((a, b) => a + b, 0) / 200;
    const emaRibbonWidth = Math.abs(EMA8 - EMA21);

    // VWAP - ВИПРАВЛЕНО: clones → closes
    const VWAP = closes.reduce((sum, c, i) => sum + c * (i + 1), 0) /
                 ((closes.length * (closes.length + 1)) / 2);

    // Keltner канал
    const keltnerUpper = bb.middle + atr * 1.5;
    const keltnerLower = bb.middle - atr * 1.5;

    // True Range
    const trueRange = Math.max(...klines.map(k => parseFloat(k[2]) - parseFloat(k[3])));

    // Об'єм
    const avgVolume = klines.reduce((sum, k) => sum + parseFloat(k[5]), 0) / klines.length;
    const volume = parseFloat(klines[klines.length - 1][5]) || 0;

    // Тренди
    const higherTF = { trend: rsi > 50 ? "bull" : "bear" };
    const currentTF = { trend: rsi > 50 ? "bull" : "bear" };

    return {
        // Базові індикатори
        rsi, macd, obv, stoch, bb, atr, mfi,
        lastPrice,
        
        // Трендові
        EMA8, EMA21, EMA50, EMA200, emaRibbonWidth,
        VWAP,
        
        // Волатильність
        keltnerUpper, keltnerLower,
        trueRange,
        
        // Об'єм
        avgVolume, volume,
        
        // Тренди
        higherTF,
        currentTF,
        
        // Сигнали
        trendSignals: [rsi > 50, macd.macd > macd.signal],
        momentumSignals: [stoch > 50],
        volumeSignals: [volume > avgVolume],
        oiSignals: [OI > 50000]
    };
}