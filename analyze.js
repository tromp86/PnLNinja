import { scenarios } from './scenarios.js';
import { entrySignals } from './entrySignals.js';

// =======================
// ✅ Перевірка Entry Signals
// =======================
function evaluateEntrySignals(ctx) {
    return entrySignals
        .map(sig => {
            const passed = sig.conditions(ctx).every(Boolean);
            return { ...sig, active: passed };
        })
        .filter(sig => sig.active)
        .sort((a, b) => b.priority - a.priority);
}

// =======================
// ✅ Market Alignment (FULL / PARTIAL / MIXED / CONFLICTED / NONE)
// =======================
function getMarketAlignmentType(activeScenarios) {
    if (!activeScenarios || activeScenarios.length === 0) return "none";

    const categories = activeScenarios.map(s => s.category);
    const unique = [...new Set(categories)];

    // ✅ FULL ALIGNMENT: всі сценарії однієї категорії
    if (unique.length === 1) return "full";

    // ✅ CONFLICTED: протилежні категорії
    const conflictPairs = [
        ["Trend", "Reversion"],
        ["Breakout", "Range"],
        ["Momentum", "Range"]
    ];

    const isConflicted = conflictPairs.some(([a, b]) =>
        unique.includes(a) && unique.includes(b)
    );

    if (isConflicted) return "conflicted";

    // ✅ PARTIAL ALIGNMENT: є домінуюча категорія
    const counts = unique.map(cat => ({
        cat,
        count: categories.filter(c => c === cat).length
    }));

    const maxCount = Math.max(...counts.map(c => c.count));
    if (maxCount >= activeScenarios.length * 0.6) return "partial";

    // ✅ MIXED MARKET: різні категорії без прямого конфлікту
    return "mixed";
}

// =======================
// ✅ Market Strength Score (0–100) — оновлена модель
// =======================
function computeMarketStrength(data, THRESHOLDS, activeScenarios, compositeActive) {
    const clamp01 = v => Math.max(0, Math.min(1, v));

    // ✅ Trend Strength (EMA alignment + MACD)
    const emaDiff = Math.abs(data.EMA8 - data.EMA21);
    const emaSlope = emaDiff / (data.ATR || 1);
    const macdTrend = data.MACD && data.MACD_Signal
        ? clamp01(Math.abs(data.MACD - data.MACD_Signal) / (Math.abs(data.MACD_Signal) || 1))
        : 0;
    const trendStrength = clamp01(emaSlope * 0.6 + macdTrend * 0.4) * 25;

    // ✅ Momentum Strength (RSI + Stoch)
    const rsiNorm = clamp01(Math.abs((data.RSI || 50) - 50) / 30);
    const stochNorm = clamp01(Math.abs((data.Stochastic || 50) - 50) / 50);
    const momentumStrength = ((rsiNorm + stochNorm) / 2) * 20;

    // ✅ Volatility Strength (ATR regime)
    const atrNorm = clamp01((data.ATR || 0) / (THRESHOLDS.ATR_LOW * 1.2 || 1));
    const volatilityStrength = atrNorm * 15;

    // ✅ Liquidity Strength (volume + OI)
    const volNorm = clamp01((data.volume || 0) / (data.avgVolume || 1));
    const oiNorm = clamp01((data.openInterest || 0) / (THRESHOLDS.OI_HIGH || 1));
    const liquidityStrength = ((volNorm * 0.7) + (oiNorm * 0.3)) * 20;

    // ✅ Market Structure Score (по активних сценаріях)
    const structureStrength = activeScenarios.some(s => ["Trend", "Breakout"].includes(s.category))
        ? 10
        : activeScenarios.some(s => ["Range", "Reversion"].includes(s.category))
            ? 5
            : 0;

    // ✅ Risk Conditions Score (funding, OI spikes, composite)
    let riskStrength = 10;
    if (Math.abs(data.funding || 0) > THRESHOLDS.FUNDING_SQUEEZE) riskStrength -= 5;
    if ((data.openInterest || 0) > THRESHOLDS.OI_HIGH * 1.2) riskStrength -= 5;
    if (compositeActive) riskStrength += 5;

    const total = trendStrength + momentumStrength + volatilityStrength + liquidityStrength + structureStrength + riskStrength;
    const score = Math.round(clamp01(total / 100) * 100);

    let label = "Weak";
    if (score >= 85) label = "Explosive";
    else if (score >= 65) label = "Strong";
    else if (score >= 45) label = "Normal";

    return { score, label };
}


// =======================
// ✅ signal risk profile (indicator-based)
// =======================
function computeSignalRisk(sig, data) {
    const atr = data.ATR || 0;
    const atrUnit = atr || 1; // щоб уникнути ділення на 0

    let entryPrice;
    let entryType;      // "limit" | "retest" | "market"
    let stopLow;
    let stopHigh;
    let tp1;
    let tp2;
    let tp3;

    switch (sig.id) {
        // 1. bollinger oversold reversal
        case 1: {
            entryPrice = data.Bollinger_L;
            entryType = "limit";

            stopLow = data.Bollinger_L - atr * 0.3;
            stopHigh = data.Bollinger_L - atr * 0.1;

            const mid = data.Bollinger_M || (data.EMA21 || data.Price);
            const upper = data.Bollinger_U || (mid + atr);

            tp1 = mid;
            tp2 = upper;
            tp3 = upper + atr;
            break;
        }

        // 2. ema pullback in uptrend
        case 2: {
            entryPrice = data.EMA21;
            entryType = "limit";

            const ema50 = data.EMA50 || (data.EMA21 - atr);
            stopLow = ema50 - atr * 0.3;
            stopHigh = ema50;

            const ema8 = data.EMA8 || data.EMA21;
            tp1 = ema8;
            tp2 = ema8 + atr;
            tp3 = ema8 + 2 * atr;
            break;
        }

        // 3. mean reversion to ema50
        case 3: {
            entryPrice = data.EMA50;
            entryType = "limit";

            stopLow = data.EMA50 - atr * 0.5;
            stopHigh = data.EMA50 - atr * 0.2;

            const ema21 = data.EMA21 || data.EMA50;
            const ema8 = data.EMA8 || ema21;

            tp1 = ema21;
            tp2 = ema8;
            tp3 = ema8 + atr;
            break;
        }

        // 4. vwap reclaim (intraday)
        case 4: {
            entryPrice = data.VWAP;
            entryType = "retest";

            stopLow = data.VWAP - atr * 0.6;
            stopHigh = data.VWAP - atr * 0.3;

            tp1 = data.VWAP + atr * 0.8;
            tp2 = data.VWAP + atr * 1.6;
            tp3 = data.VWAP + atr * 2.5;
            break;
        }

        // 5. oversold momentum pop
        case 5: {
            entryPrice = data.Price;
            entryType = "market";

            const kLower = data.keltnerLower || (data.Bollinger_L || (data.Price - atr));
            stopLow = kLower - atr * 0.3;
            stopHigh = kLower;

            tp1 = data.Price + atr * 1.0;
            tp2 = data.Price + atr * 2.0;
            tp3 = data.Price + atr * 3.0;
            break;
        }

        // 6. keltner lower band reversion
        case 6: {
            entryPrice = data.keltnerLower;
            entryType = "limit";

            stopLow = data.keltnerLower - atr * 0.3;
            stopHigh = data.keltnerLower - atr * 0.1;

            tp1 = data.keltnerLower + atr * 1.0;
            tp2 = data.keltnerLower + atr * 2.0;
            tp3 = data.keltnerLower + atr * 3.0;
            break;
        }

        default: {
            entryPrice = data.Price;
            entryType = "market";

            stopLow = data.Price - atr;
            stopHigh = data.Price - atr * 0.5;

            tp1 = data.Price + atr;
            tp2 = data.Price + atr * 2;
            tp3 = data.Price + atr * 3;
            break;
        }
    }

    const entryZoneLow = entryPrice - atr * 0.15;
    const entryZoneHigh = entryPrice + atr * 0.15;

    const riskPerUnit = Math.max(0.01, entryPrice - stopLow);
    const rewardPerUnit = Math.max(0.01, tp2 - entryPrice);
    const rr = rewardPerUnit / riskPerUnit;

    return {
        entryPrice,
        entryZoneLow,
        entryZoneHigh,
        entryType,
        stopLow,
        stopHigh,
        tp1,
        tp2,
        tp3,
        rr
    };
}


// =======================
// ✅ Основний аналіз BTC
// =======================
export function analyzeBTC(data) {

    const THRESHOLDS = {
        RSI_OVERBOUGHT: 75,
        RSI_OVERSOLD: 25,
        STOCH_OVERBOUGHT: 90,
        STOCH_OVERSOLD: 10,
        MFI_OVERSOLD: 5,
        MFI_OVERBOUGHT: 95,
        OI_HIGH: 90000,
        FUNDING_SQUEEZE: 0.005,
        ATR_LOW: 400,
        BOLLINGER_SQUEEZE_FACTOR: 0.01
    };

    // ✅ Активні сценарії
    const activeScenarios = scenarios(data, THRESHOLDS).filter(s => s.active);

    // ✅ Активні Entry Signals
    const activeEntrySignals = evaluateEntrySignals(data);

    // ✅ Composite (ID 60)
    const compositeActive = activeScenarios.some(s => s.id === 60);

    // ✅ Легкий фільтр (НЕ блокує сигнали)
    const strongMarket =
        data.ATR > THRESHOLDS.ATR_LOW * 0.6 ||
        Math.abs(data.EMA8 - data.EMA21) > data.ATR * 0.15 ||
        compositeActive;

    // ✅ Market Strength Score
    const marketStrength = computeMarketStrength(
        data,
        THRESHOLDS,
        activeScenarios,
        compositeActive
    );

    // ✅ Оновлення HTML індикатора
    document.getElementById("marketStrengthValue").textContent = `${marketStrength.score} / 100`;
    document.getElementById("marketStrengthFill").style.width = `${marketStrength.score}%`;
    document.getElementById("marketStrengthStatus").textContent = marketStrength.label;
document.title = `Analyzer — ${data.Price}`;

    // ✅ Текст сценаріїв
    let scenarioText =
        "📊" +
        new Date().toLocaleString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Denver"
        }) +
        " (MST):\n";

    if (activeScenarios.length === 0) {
        scenarioText += "There are currently no active scenarios.\n";
    } else {
        const categorizedScenarios = activeScenarios.reduce((acc, scenario) => {
            const category = scenario.category;
            if (!acc[category]) acc[category] = [];
            acc[category].push(scenario);
            return acc;
        }, {});

        for (const category in categorizedScenarios) {
            scenarioText += `\n${category}\n`;
            categorizedScenarios[category].forEach(s => {
                scenarioText += `[${s.id}: ${s.name}]\n`;
            });
        }
    }

 // ✅ визначаємо тип ринкової узгодженості
const alignmentType = getMarketAlignmentType(activeScenarios);

// =======================
// ✅ ENTRY SIGNALS TEXT (MARKET CONTEXT FIRST)
// =======================
let entrySignalsText = "";

// =======================
// ✅ MARKET CONTEXT
// =======================
entrySignalsText += "";


switch (alignmentType) {
    case "full":
        entrySignalsText += "✅ <strong>Full alignment</strong> — market structure is unified (ринок узгоджений).\n";
        entrySignalsText += "   → High directional clarity.\n";
        break;

    case "partial":
        entrySignalsText += "🟡 <strong>Partial alignment</strong> — one structure dominates (домінує одна структура).\n";
        entrySignalsText += "   → Moderate clarity.\n";
        break;

    case "mixed":
        entrySignalsText += "🟠 <strong>Mixed market</strong> — multiple structures active (змішаний ринок).\n";
        entrySignalsText += "   → Reduced predictability.\n";
        break;

    case "conflicted":
        entrySignalsText += "🔴 <strong>Conflicted market</strong> — opposing structures (конфліктуючі сценарії).\n";
        entrySignalsText += "   → High instability.\n";
        break;

    case "none":
        entrySignalsText += "⚪ <strong>No active structure</strong> — no clear context (немає структури).\n";
        entrySignalsText += "   → Low‑quality environment.\n";
        break;
}

entrySignalsText += "\n";
//  =======================
// ✅ ENTRY SIGNALS (AFTER MARKET CONTEXT)
// =======================
entrySignalsText += "📥 <strong>Entry Signals</strong>\n";

if (activeEntrySignals.length === 0) {
    entrySignalsText += "No valid entry conditions detected (умови для входу відсутні).\n";
} else {
activeEntrySignals.forEach(sig => {
    const star = sig.priority === 5 ? "⭐ " : "";
    const typeColor = sig.type === "long" ? "🟢 LONG" : "🔴 SHORT";

    const contextIcons = {
        trend: "📈",
        squeeze: "🧨",
        range: "📊",
        sr: "📉",
        intraday: "⏱️",
        reversion: "🔄",
        volatility: "🌪️",
        momentum: "⚡"
    };
    const ctxIcon = contextIcons[sig.context] || "•";

    const boost = compositeActive ? " (+Composite Boost)" : "";

    // ============================
    // ENTRY PRICE
    // ============================
    const entryPrice = sig.entryPrice ? sig.entryPrice(data) : data.Price;

    // ============================
    // INDICATOR-BASED STOP LOGIC
    // ============================
    let stopLow, stopHigh, tp1;
    const atr = data.ATR || 0;

    // ---------- LONG ----------
    if (sig.type === "long") {
        switch (sig.id) {
            case 1: // bollinger reversal
                stopLow = data.Bollinger_L - atr * 0.3;
                stopHigh = data.Bollinger_L - atr * 0.1;
                tp1 = data.Bollinger_M || data.EMA21 || data.Price;
                break;

            case 2: // ema pullback
                stopLow = data.EMA50 - atr * 0.3;
                stopHigh = data.EMA50;
                tp1 = data.EMA8 || (data.EMA21 + atr);
                break;

            case 3: // mean reversion ema50
                stopLow = data.EMA50 - atr * 0.5;
                stopHigh = data.EMA50 - atr * 0.2;
                tp1 = data.EMA21 || (data.EMA50 + atr);
                break;

            case 4: // vwap reclaim
                stopLow = data.VWAP - atr * 0.6;
                stopHigh = data.VWAP - atr * 0.3;
                tp1 = data.VWAP + atr * 0.8;
                break;

            case 5: // momentum pop
                const kLower = data.keltnerLower || data.Bollinger_L || (data.Price - atr);
                stopLow = kLower - atr * 0.3;
                stopHigh = kLower;
                tp1 = data.Price + atr * 1.0;
                break;

            case 6: // keltner reversion
                stopLow = data.keltnerLower - atr * 0.3;
                stopHigh = data.keltnerLower - atr * 0.1;
                tp1 = data.keltnerLower + atr * 1.0;
                break;

            default:
                stopLow = entryPrice - atr;
                stopHigh = entryPrice - atr * 0.5;
                tp1 = entryPrice + atr;
                break;
        }
    }

    // ---------- SHORT ----------
    if (sig.type === "short") {
        switch (sig.id) {
            case 1: // bollinger overbought reversal
                stopLow = data.Bollinger_U + atr * 0.1;
                stopHigh = data.Bollinger_U + atr * 0.3;
                tp1 = data.Bollinger_M || data.EMA21 || data.Price;
                break;

            case 2: // ema pullback downtrend
                stopLow = data.EMA50;
                stopHigh = data.EMA50 + atr * 0.3;
                tp1 = data.EMA8 || (data.EMA21 - atr);
                break;

            case 3: // mean reversion ema50
                stopLow = data.EMA50 + atr * 0.2;
                stopHigh = data.EMA50 + atr * 0.5;
                tp1 = data.EMA21 || (data.EMA50 - atr);
                break;

            case 4: // vwap reject
                stopLow = data.VWAP + atr * 0.3;
                stopHigh = data.VWAP + atr * 0.6;
                tp1 = data.VWAP - atr * 0.8;
                break;

            case 5: // momentum pop (overbought)
                const kUpper = data.keltnerUpper || data.Bollinger_U || (data.Price + atr);
                stopLow = kUpper;
                stopHigh = kUpper + atr * 0.3;
                tp1 = data.Price - atr * 1.0;
                break;

            case 6: // keltner upper band reversion
                stopLow = data.keltnerUpper + atr * 0.1;
                stopHigh = data.keltnerUpper + atr * 0.3;
                tp1 = data.keltnerUpper - atr * 1.0;
                break;

            default:
                stopLow = entryPrice + atr * 0.5;
                stopHigh = entryPrice + atr;
                tp1 = entryPrice - atr;
                break;
        }
    }

    // ============================
    // CONFIDENCE SCORE
    // ============================
    let confidence = 50;

    confidence += sig.priority * 5;
    if (sig.context === "trend") confidence += 10;
    if (sig.context === "reversion") confidence += 5;
    if (sig.context === "intraday") confidence += 8;
    if (sig.context === "momentum") confidence += 12;

    confidence += Math.floor(marketStrength.score * 0.2);
    if (compositeActive) confidence += 10;

    confidence = Math.max(0, Math.min(100, confidence));

    // ============================
    // OUTPUT
    // ============================
    entrySignalsText += `${star}${typeColor} | ${ctxIcon} ${sig.name} (priority ${sig.priority})${boost}\n`;

entrySignalsText += `
<div class="signal-block">
  entry price: ${entryPrice.toFixed(2)}<br>
  stop: ${stopHigh.toFixed(2)}<br>
  tp1: ${tp1.toFixed(2)}<br>
  confidence: ${confidence}%<br>
</div>
`;


});
}


// ✅ ALWAYS RETURN
return {
    scenarios: scenarioText,
    entrySignals: entrySignalsText
};
}
