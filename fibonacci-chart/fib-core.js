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

    // 3. Корекція
    const correctionDepth = isBullishImpulse
        ? safeDiv(last - swingLow, range)
        : safeDiv(swingHigh - last, range);

    // 4. Сила імпульсу
    const impulseStrength = safeDiv(Math.abs(range), Math.max(swingHigh, swingLow)) * 100;

    // 5. Сила об'єму
    const volumeStrength = calculateVolumeStrength(volumes, indexHigh, indexLow);

    // 6. Рівні Фібоначчі
    const fibLevels = calculateFibLevels(swingLow, range);

    // 7. Активна зона
    const activeZone = findActiveZone(last, fibLevels);

    // 8. Golden Pocket
    // const goldenPocket = {
    //     from: swingLow + range * 0.618,
    //     to: swingLow + range * 0.65
    // };

    // 9. Тип корекції
    let retracementType = "unknown";
    if (correctionDepth < 0.382) retracementType = "shallow";
    else if (correctionDepth < 0.618) retracementType = "normal";
    else if (correctionDepth <= 1) retracementType = "deep";
    else retracementType = "overextended";

    // ===============================
    // 10. Покращена тривалість імпульсу
    // ===============================
    const priceDistance = Math.abs(swingHigh - swingLow);
    const impulseBars = Math.abs(indexHigh - indexLow);
    const atr = calculateATR(highs, lows, closes) || 1;

    // Швидкість імпульсу
    const impulseVelocity = priceDistance / Math.max(impulseBars, 1);

    // ATR-нормалізована довжина
    const atrNormalizedDistance = priceDistance / atr;

    // ===============================
    // 11. Volume Climax
    // ===============================
    const recentVolumes = volumes.slice(indexLow, indexHigh + 1);
    const maxVolume = Math.max(...recentVolumes);
    const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / Math.max(recentVolumes.length, 1);
    const isVolumeClimax = maxVolume > avgVolume * 2.5;

    // ===============================
    // 12. Нові імпульсні метрики
    // ===============================

    // Exhaustion — втома імпульсу
    const exhaustionRaw =
        (impulseBars / 12) *
        (1 / Math.max(impulseVelocity, 0.1)) *
        (atrNormalizedDistance > 4 ? 1.2 : 1);

    const impulseExhaustion = clamp01(exhaustionRaw);

    // Maturity — фаза імпульсу
    const maturity =
        0.6 * Math.min(1, impulseBars / 10) +
        0.4 * (1 - Math.min(1, impulseVelocity / 3));

    const impulseMaturity = clamp01(maturity);

    // Quality — загальна якість імпульсу
    const impulseQuality =
        0.35 * Math.min(1, impulseVelocity / 2) +
        0.25 * (1 - impulseExhaustion) +
        0.20 * (1 - Math.abs(impulseMaturity - 0.5) * 2) +
        0.20 * Math.min(1, volumeStrength / 3);

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
        retracementType,
        impulseBars,
        impulseVelocity,
        atrNormalizedDistance,
        impulseExhaustion,
        impulseMaturity,
        impulseQuality,
        isVolumeClimax
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
// ATR (14) — для impulse metrics
// ===============================
function calculateATR(highs, lows, closes, period = 14) {
    if (highs.length < period + 1) return 0;

    let trs = [];

    for (let i = highs.length - period; i < highs.length; i++) {
        const high = highs[i];
        const low = lows[i];
        const prevClose = closes[i - 1];

        const tr = Math.max(
            high - low,
            Math.abs(high - prevClose),
            Math.abs(low - prevClose)
        );

        trs.push(tr);
    }

    return trs.reduce((a, b) => a + b, 0) / trs.length;
}


// ===============================
// calculateVolumeStrength
// ===============================
function calculateVolumeStrength(volumes, indexHigh, indexLow) {
  const window = volumes.slice(-80);
  const avg = window.reduce((a, b) => a + b, 0) / window.length;

  const start = Math.min(indexLow, indexHigh);
  const end = Math.max(indexLow, indexHigh);

  let impulseVol = 0;
  let bars = 0;

  for (let i = start; i <= end; i++) {
    impulseVol += volumes[i] || 0;
    bars++;
  }

  bars = Math.max(bars, 1);
  const avgImpulseVol = impulseVol / bars;
  let strength = avgImpulseVol / avg;

  // Покращена гнучка система volume climax
  const maxVol = Math.max(...volumes.slice(start, end + 1));
  const climaxRatio = avg > 0 ? maxVol / avg : 1;
  
  // Градієнтна функція підсилення
  const climaxBoost = calculateClimaxBoost(climaxRatio);
  strength *= climaxBoost;

  // 4) Прискорення (експоненційне)
  strength = Math.pow(strength, 1.18);

  strength = Math.min(strength, 3.0);

  return strength;
}

// Допоміжна функція для climax boost
function calculateClimaxBoost(ratio) {
  // Базова таблиця співвідношень
  const thresholds = [
    { min: 5.0, boost: 1.8, label: "super extreme" },
    { min: 4.5, boost: 1.7, label: "extreme plus" },
    { min: 4.0, boost: 1.5, label: "extreme" },
    { min: 3.5, boost: 1.35, label: "very strong" },
    { min: 3.0, boost: 1.25, label: "strong" },
    { min: 2.5, boost: 1.15, label: "moderate" },
    { min: 2.0, boost: 1.08, label: "weak" },
    { min: 1.5, boost: 1.03, label: "very weak" },
    { min: 1.2, boost: 1.01, label: "minimal" },
    { min: 1.0, boost: 1.0, label: "none" }
  ];
  
  // Знаходимо відповідний діапазон
  for (let i = 0; i < thresholds.length; i++) {
    if (ratio >= thresholds[i].min) {
      // Якщо це не останній поріг, робимо плавний перехід до наступного
      if (i > 0 && ratio < thresholds[i-1].min) {
        const current = thresholds[i];
        const next = thresholds[i-1];
        const range = next.min - current.min;
        const position = (ratio - current.min) / range;
        
        // Лінійна інтерполяція між поточним і наступним значенням
        return current.boost + (next.boost - current.boost) * position;
      }
      return thresholds[i].boost;
    }
  }
  
  return 1.0;
}

// ===============================
// Рівні Фібоначчі
// ===============================
function calculateFibLevels(swingLow, range) {
    const levels = [0, 0.236, 0.382, 0.5, 0.618, 1, 1.272, 1.618, 2];
    return levels.map(lvl => ({
        lvl,
        val: swingLow + range * lvl
    }));
}

// ===============================
// Активна зона
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