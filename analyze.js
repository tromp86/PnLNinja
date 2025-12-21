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
// =======================
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
            volatility: "🌪️"
        };
        const ctxIcon = contextIcons[sig.context] || "•";

        const boost = compositeActive ? " (+Composite Boost)" : "";

        entrySignalsText += `${star}${typeColor} | ${ctxIcon} ${sig.name} (priority ${sig.priority})${boost}\n`;

        const setupPassed = sig.setup ? sig.setup(data).every(Boolean) : false;
        const triggerPassed = sig.trigger ? sig.trigger(data).every(Boolean) : false;
        const confirmPassed = sig.confirmation ? sig.confirmation(data).every(Boolean) : false;

        entrySignalsText += `  SETUP: ${setupPassed ? "✅" : "❌"}\n`;
        entrySignalsText += `  TRIGGER: ${triggerPassed ? "✅" : "❌"}\n`;
        entrySignalsText += `  CONFIRMATION: ${confirmPassed ? "✅" : "❌"}\n\n`;
    });
}

// ✅ ALWAYS RETURN
return {
    scenarios: scenarioText,
    entrySignals: entrySignalsText
};
}


// import { scenarios } from './scenarios.js';
// import { entrySignals } from './entrySignals.js';

// // =======================
// // 🧭 MARKET CONTEXT HELPERS
// // =======================
// function detectMarketContext(ctx, T) {
//     return {
//         trend: Math.abs(ctx.emaFast - ctx.emaSlow) > ctx.atr * 0.3,
//         range: ctx.atr < T.ATR_LOW && Math.abs(ctx.rsi - 50) < 10,
//         volatility: ctx.atr > T.ATR_LOW * 1.8,
//         reversion: ctx.rsi > T.RSI_OVERBOUGHT || ctx.rsi < T.RSI_OVERSOLD
//     };
// }


// // =======================
// // 🧪 ANTI-CHOP FILTER (м’якший, адекватний)
// // =======================
// function antiChopFilter(ctx, T) {
//     const lowATR = ctx.atr < T.ATR_LOW * 0.7;
//     const flatEMA = Math.abs(ctx.emaFast - ctx.emaSlow) < ctx.atr * 0.1;
//     const midRSI = ctx.rsi > 47 && ctx.rsi < 53;

//     // chop тільки якщо ВСІ три умови одночасно
//     const isChop = lowATR && flatEMA && midRSI;
//     return !isChop; // true = МОЖНА торгувати
// }


// // =======================
// // 🚦 ENTRY ALLOWED / FORBIDDEN (розумний фільтр)
// // =======================
// function isEntryAllowed(ctx, T, activeScenarios) {
//     const antiChopOk = antiChopFilter(ctx, T);

//     // Composite як бонус, а не обов’язкова умова
//     const compositeOk = activeScenarios.some(s => s.id === 60);

//     // Сильний сценарій — будь-який із важливих категорій
//     const strongScenario = activeScenarios.some(s =>
//         ["Trend", "Momentum", "Breakout", "Reversion"].includes(s.category)
//     );

//     // Entry дозволяємо, якщо:
//     //   1) ринок не в глухому chop (antiChopOk)
//     //   2) є сильний сценарій АБО активний composite
//     const allowed = antiChopOk && (strongScenario || compositeOk);

//     return {
//         allowed,
//         reasons: {
//             antiChopOk,
//             strongScenario,
//             compositeOk
//         }
//     };
// }


// // =======================
// // ✅ Перевірка Entry Signals
// // =======================
// function evaluateEntrySignals(ctx) {
//     return entrySignals
//         .map(sig => {
//             const passed = sig.conditions(ctx).every(Boolean);
//             return { ...sig, active: passed };
//         })
//         .filter(sig => sig.active)
//         .sort((a, b) => b.priority - a.priority);
// }


// // =======================
// // ✅ Основний аналіз BTC (переписаний, оптимізований)
// // =======================
// export function analyzeBTC(data) {

//     const THRESHOLDS = {
//         RSI_OVERBOUGHT: 75,
//         RSI_OVERSOLD: 25,
//         STOCH_OVERBOUGHT: 90,
//         STOCH_OVERSOLD: 10,
//         MFI_OVERSOLD: 5,
//         MFI_OVERBOUGHT: 95,
//         OI_HIGH: 90000,
//         FUNDING_SQUEEZE: 0.005,
//         ATR_LOW: 400,
//         BOLLINGER_SQUEEZE_FACTOR: 0.01
//     };

//     // =======================
//     // 🧭 Market Context
//     // =======================
//     const marketContext = detectMarketContext(data, THRESHOLDS);

//     // =======================
//     // ✅ Активні сценарії
//     // =======================
//     const allScenarios = scenarios(data, THRESHOLDS);
//     const activeScenarios = allScenarios.filter(s => s.active);

//     // =======================
//     // 🚦 Entry Permission (НОВА ЛОГІКА)
//     // =======================
//     const entryPermission = isEntryAllowed(data, THRESHOLDS, activeScenarios);

//     // =======================
//     // ✅ Активні Entry Signals
//     // =======================
//     const activeEntrySignals = evaluateEntrySignals(data);

//     // =======================
//     // 📊 SCENARIOS TEXT
//     // =======================
//     let scenarioText =
//         "📊" +
//         new Date().toLocaleString("en-US", {
//             weekday: "long",
//             year: "numeric",
//             month: "long",
//             day: "numeric",
//             hour: "2-digit",
//             minute: "2-digit",
//             timeZone: "America/Denver"
//         }) +
//         " (MST):\n";

//     if (activeScenarios.length === 0) {
//         scenarioText += "Наразі активних сценаріїв немає.\n";
//     } else {
//         // групуємо сценарії по категоріях
//         const categorizedScenarios = activeScenarios.reduce((acc, scenario) => {
//             const category = scenario.category || "Other";
//             if (!acc[category]) acc[category] = [];
//             acc[category].push(scenario);
//             return acc;
//         }, {});

//         for (const category in categorizedScenarios) {
//             scenarioText += `\n${category}\n`;
//             categorizedScenarios[category].forEach(s => {
//                 scenarioText += `[${s.id}: ${s.name}]\n`;
//             });
//         }
//     }

//     // =======================
//     // 🧭 MARKET CONTEXT TEXT
//     // =======================
//     scenarioText += "\n🧭 MARKET CONTEXT\n";
//     scenarioText += "━━━━━━━━━━━━━━━━━━━━\n";
//     scenarioText += `Trend: ${marketContext.trend ? "📈 YES" : "❌ NO"}\n`;
//     scenarioText += `Range: ${marketContext.range ? "📊 YES" : "❌ NO"}\n`;
//     scenarioText += `Volatility: ${marketContext.volatility ? "🌪️ HIGH" : "LOW"}\n`;
//     scenarioText += `Reversion zone: ${marketContext.reversion ? "🔄 YES" : "NO"}\n`;

//     // =======================
//     // 📥 ENTRY SIGNALS TEXT
//     // =======================
//     let entrySignalsText = "";
//     entrySignalsText += "━━━━━━━━━━━━━━━━━━━━\n";
//     entrySignalsText += "📥 ENTRY SIGNALS\n";
//     entrySignalsText += "━━━━━━━━━━━━━━━━━━━━\n";

//     const { antiChopOk, strongScenario, compositeOk } = entryPermission.reasons;

//     entrySignalsText += entryPermission.allowed
//         ? "🚦 ENTRY ALLOWED — умови сприятливі\n"
//         : "⛔ ENTRY FORBIDDEN — chop / немає узгодження\n";

//     entrySignalsText += `🧪 Anti-chop: ${antiChopOk ? "✅ PASS" : "❌ FAIL"}\n`;
//     entrySignalsText += `📊 Strong scenario: ${strongScenario ? "✅ YES" : "❌ NO"}\n`;
//     entrySignalsText += `🧩 Composite (ID 60): ${compositeOk ? "✅ ACTIVE" : "❌ INACTIVE"}\n\n`;

//     // =======================
//     // 🧩 Composite Signal
//     // =======================
//     const compositeActive = activeScenarios.some(s => s.id === 60);

//     // ❌ Якщо entry заборонений — не показуємо детальні сигнали
//     if (!entryPermission.allowed) {
//         entrySignalsText += "⚠️ Сигнали проігноровані через фільтри.\n";
//         return {
//             scenarios: scenarioText,
//             entrySignals: entrySignalsText
//         };
//     }

//     if (activeEntrySignals.length === 0) {
//         entrySignalsText += "Немає активних сигналів входу.\n";
//     } else {
//         activeEntrySignals.forEach(sig => {
//             const star = sig.priority === 5 ? "⭐ " : "";
//             const typeColor = sig.type === "long" ? "🟢 LONG" : "🔴 SHORT";

//             const contextIcons = {
//                 trend: "📈",
//                 squeeze: "🧨",
//                 range: "📊",
//                 sr: "📉",
//                 intraday: "⏱️",
//                 reversion: "🔄",
//                 volatility: "🌪️"
//             };

//             const ctxIcon = contextIcons[sig.context] || "•";
//             const boost = compositeActive ? " (+Composite Boost)" : "";

//             entrySignalsText += `${star}${typeColor} | ${ctxIcon} ${sig.name} (priority ${sig.priority})${boost}\n`;

//             const setupPassed = sig.setup ? sig.setup(data).every(Boolean) : false;
//             const triggerPassed = sig.trigger ? sig.trigger(data).every(Boolean) : false;
//             const confirmPassed = sig.confirmation ? sig.confirmation(data).every(Boolean) : false;

//             entrySignalsText += `  SETUP: ${setupPassed ? "✅" : "❌"}\n`;
//             entrySignalsText += `  TRIGGER: ${triggerPassed ? "✅" : "❌"}\n`;
//             entrySignalsText += `  CONFIRMATION: ${confirmPassed ? "✅" : "❌"}\n\n`;
//         });
//     }

//     // =======================
//     // ✅ RETURN
//     // =======================
//     return {
//         scenarios: scenarioText,
//         entrySignals: entrySignalsText
//     };
// }