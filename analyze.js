import { scenarios } from './scenariosEntrySignal/scenarios.js';
import { entrySignals } from './scenariosEntrySignal/entrySignals.js';
import { computeMarketStrength } from "./analysis/marketStrength.js";
import { renderEntrySignals } from "./entry-engine/entrySignalsRenderer.js";

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
    if (!activeScenarios || activeScenarios.length === 0)
        return { type: "none", conflicts: [] };

    const categories = activeScenarios.map(s => s.category);
    const unique = [...new Set(categories)];

    // FULL
    if (unique.length === 1)
        return { type: "full", conflicts: [] };

    // CONFLICTED
    const conflictPairs = [
        ["Trend", "Reversion"],
        ["Breakout", "Range"],
        ["Momentum", "Range"]
    ];

    const conflicts = conflictPairs.filter(([a, b]) =>
        unique.includes(a) && unique.includes(b)
    );

    if (conflicts.length > 0)
        return { type: "conflicted", conflicts };

    // PARTIAL
    const counts = unique.map(cat => ({
        cat,
        count: categories.filter(c => c === cat).length
    }));

    const maxCount = Math.max(...counts.map(c => c.count));
    if (maxCount >= activeScenarios.length * 0.6)
        return { type: "partial", conflicts: [] };

    // MIXED
    return { type: "mixed", conflicts: [] };
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
const alignment = getMarketAlignmentType(activeScenarios);

// =======================
// ✅ ENTRY SIGNALS TEXT (MARKET CONTEXT FIRST)
// =======================
let entrySignalsText = "";

// =======================
// ✅ MARKET CONTEXT
// =======================
switch (alignment.type) {
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

        // 🔥 Додаємо деталі конфліктів (якщо є)
        alignment.conflicts.forEach(([a, b]) => {
            entrySignalsText += `   → Conflict detected: ${a} vs ${b}\n`;
        });
        break;

    case "none":
        entrySignalsText += "⚪ <strong>No active structure</strong> — no clear context (немає структури).\n";
        entrySignalsText += "   → Low‑quality environment.\n";
        break;
}

entrySignalsText += "\n";

// =======================
// ❗ ВСЕ, ЩО ЙДЕ ДАЛІ — ТЕПЕР У entrySignalsRenderer.js
// =======================
const renderedSignals = renderEntrySignals({
    activeEntrySignals,
    compositeActive,
    marketStrength,
    data
});

const box = document.getElementById("marketStrengthBox");

computeMarketStrength(
  data,
  THRESHOLDS,
  activeScenarios,
  compositeActive
);
// =======================
// RETURN
// =======================
return {
    scenarios: scenarioText,
    entrySignals: entrySignalsText + renderedSignals
};
}
