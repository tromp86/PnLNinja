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
// ✅ Market Strength Score (0–100)
// =======================
function computeMarketStrength(data, THRESHOLDS, activeScenarios, compositeActive) {
    const clamp01 = (v) => Math.max(0, Math.min(1, v));

    const emaDiff = Math.abs(data.EMA8 - data.EMA21);
    const trendNorm = clamp01(emaDiff / (data.ATR * 0.5 || 1));

    const macdTrend = data.MACD && data.MACD_Signal
        ? clamp01(Math.abs(data.MACD - data.MACD_Signal) / (Math.abs(data.MACD_Signal) || 1))
        : 0;

    const trendStrength = ((trendNorm + macdTrend) / 2) * 20;

    const rsiNorm = clamp01(Math.abs((data.RSI || 50) - 50) / 30);
    const stochNorm = clamp01(Math.abs((data.Stochastic || 50) - 50) / 50);
    const momentumStrength = ((rsiNorm + stochNorm) / 2) * 20;

    const volNorm = clamp01((data.ATR || 0) / (THRESHOLDS.ATR_LOW || 1));
    const volatilityStrength = volNorm * 20;

    const vol = data.volume || 0;
    const avgVol = data.avgVolume || 1;
    const volumeStrength = clamp01(vol / avgVol) * 20;

    const strongScenario = activeScenarios.some(s =>
        ["Trend", "Momentum", "Breakout", "Reversion"].includes(s.category)
    );

    let alignmentStrength = 0;
    if (strongScenario) alignmentStrength += 10;
    if (compositeActive) alignmentStrength += 10;

    const total = trendStrength + momentumStrength + volatilityStrength + volumeStrength + alignmentStrength;
    const score = Math.round(clamp01(total / 100) * 100);

    let label = "Weak";
    if (score >= 80) label = "Explosive";
    else if (score >= 60) label = "Strong";
    else if (score >= 40) label = "Normal";

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

    // ✅ Market Strength Score (оновлюється ТІЛЬКИ в індикатор)
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

    // ✅ ENTRY SIGNALS TEXT
    let entrySignalsText = "";
    entrySignalsText += "━━━━━━━━━━━━━━━━━━━━\n";
    entrySignalsText += "📥 ENTRY SIGNALS\n";
    entrySignalsText += "━━━━━━━━━━━━━━━━━━━━\n";

    entrySignalsText += compositeActive
        ? "✅ Composite Signal ACTIVE — ринок узгоджений\n"
        : "⚠️ Composite Signal НЕ активний — ринок неузгоджений\n";

    entrySignalsText += strongMarket
        ? "✅ Market conditions acceptable\n\n"
        : "⚠️ Market weak — сигнали можуть бути менш надійні\n\n";

    if (activeEntrySignals.length === 0) {
        entrySignalsText += "Немає активних сигналів входу.\n";
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