// ===============================
// Fibonacci Core Calculations (Pro Version)
// ===============================

export const safeDiv = (a, b) => (b !== 0 ? a / b : 0);
export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const clampRGB = (value) => Math.max(0, Math.min(255, value));

// ===============================
// Основна функція
// ===============================
export function calculateFibonacciData(highs, lows, closes, volumes) {
    if (highs.length < 80 || lows.length < 80) {
        return { isValid: false, error: "Insufficient data" };
    }

    // 1. Знайти останній імпульс
    const { swingHigh, swingLow, indexHigh, indexLow } = findLastImpulse(highs, lows);

    if (!isFinite(swingHigh) || !isFinite(swingLow)) {
        return { isValid: false, error: "Invalid price data" };
    }

    const last = closes[closes.length - 1] || 0;
    const range = swingHigh - swingLow;

    if (Math.abs(range) < 0.000001) {
        return { isValid: false, error: "No price movement" };
    }

    // 2. Напрямок імпульсу
    const isBullishImpulse = indexLow < indexHigh;

    // 3. Корекція (залежно від напрямку)
    const correctionDepth = isBullishImpulse
        ? safeDiv(last - swingLow, range)
        : safeDiv(swingHigh - last, range);

    // 4. Сила імпульсу
    const impulseStrength = safeDiv(Math.abs(range), Math.max(swingHigh, swingLow)) * 100;

    // 5. Сила об'єму
    const volumeStrength = calculateVolumeStrength(volumes, indexHigh, indexLow);

    // 6. Розширені рівні Фібоначчі
    const fibLevels = calculateFibLevels(swingLow, range);

    // 7. Активна зона
    const activeZone = findActiveZone(last, fibLevels);

    // 8. Golden Pocket
    const goldenPocket = {
        from: swingLow + range * 0.618,
        to: swingLow + range * 0.65
    };

    // 9. Тип корекції
    let retracementType = "unknown";
    if (correctionDepth < 0.382) retracementType = "shallow";
    else if (correctionDepth < 0.618) retracementType = "normal";
    else if (correctionDepth <= 1) retracementType = "deep";
    else retracementType = "overextended";

    // 10. Тривалість імпульсу
    const impulseBars = Math.abs(indexHigh - indexLow);

    // 11. Volume Climax
    const recentVolumes = volumes.slice(indexLow, indexHigh + 1);
    const maxVolume = Math.max(...recentVolumes);
    const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / Math.max(recentVolumes.length, 1);
    const isVolumeClimax = maxVolume > avgVolume * 2.5;

    // 12. Якість імпульсу
    const impulseQuality = clamp01(
        (impulseStrength / 100) * 0.5 +
        volumeStrength * 0.3 +
        (1 - correctionDepth) * 0.2
    );

    return {
        isValid: true,
        swingHigh,
        swingLow,
        last,
        range,
        correctionDepth,
        impulseStrength,
        volumeStrength,
        fibLevels,
        activeZone,
        isBullishImpulse,
        goldenPocket,
        retracementType,
        impulseBars,
        isVolumeClimax,
        impulseQuality
    };
}

// ===============================
// Знайти останній імпульс
// ===============================
function findLastImpulse(highs, lows) {
    let swingHigh = -Infinity;
    let swingLow = Infinity;
    let indexHigh = -1;
    let indexLow = -1;

    const startIdx = Math.max(0, highs.length - 80);

    for (let i = startIdx; i < highs.length; i++) {
        const high = highs[i];
        const low = lows[i];

        if (high > swingHigh && isFinite(high)) {
            swingHigh = high;
            indexHigh = i;
        }
        if (low < swingLow && isFinite(low)) {
            swingLow = low;
            indexLow = i;
        }
    }

    return { swingHigh, swingLow, indexHigh, indexLow };
}

// ===============================
// Розрахунок сили об'єму
// ===============================
function calculateVolumeStrength(volumes, indexHigh, indexLow) {
    const recentVolumes = volumes.slice(-80);
    const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / Math.max(recentVolumes.length, 1);

    let impulseVolume = avgVolume;
    let bars = 1;

    if (indexLow !== -1 && indexHigh !== -1) {
        const start = Math.min(indexLow, indexHigh);
        const end = Math.max(indexLow, indexHigh);

        if (start >= 0 && end < volumes.length && start <= end) {
            impulseVolume = 0;
            bars = 0;
            for (let i = start; i <= end; i++) {
                impulseVolume += volumes[i] || 0;
                bars++;
            }
            bars = Math.max(bars, 1);
        }
    }

    return safeDiv(impulseVolume, avgVolume * bars);
}

// ===============================
// Розширені рівні Фібоначчі
// ===============================
function calculateFibLevels(swingLow, range) {
    const levels = [0, 0.236, 0.382, 0.5, 0.618, 1, 1.272, 1.618, 2];
    return levels.map(lvl => ({
        lvl,
        val: swingLow + range * lvl
    }));
}

// ===============================
// Знайти активну зону
// ===============================
function findActiveZone(last, fibLevels) {
    for (let i = 0; i < fibLevels.length - 1; i++) {
        if (last >= fibLevels[i].val && last <= fibLevels[i + 1].val) {
            return { left: fibLevels[i], right: fibLevels[i + 1] };
        }
    }
    return null;
}
export async function loadDataFromBinance(symbol) {
    symbol = symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!symbol.endsWith("USDT")) symbol = symbol + "USDT";

    const resp = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=4h&limit=300`
    );

    if (!resp.ok) throw new Error(`HTTP error: ${resp.status}`);

    const data = await resp.json();

    return {
        highs: data.map(c => parseFloat(c[2]) || 0),
        lows: data.map(c => parseFloat(c[3]) || 0),
        closes: data.map(c => parseFloat(c[4]) || 0),
        volumes: data.map(c => parseFloat(c[5]) || 0),
        rawData: data
    };
}