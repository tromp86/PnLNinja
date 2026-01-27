
import { scenarios } from './scenariosEntrySignal/scenarios.js';
import { entrySignals } from './scenariosEntrySignal/entrySignals.js';
import { renderEntrySignals } from "./entry-engine/entrySignalsRenderer.js";

// =======================
// Evaluate Entry Signals
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
// Основний аналіз BTC
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

    // =======================
    // Активні сценарії
    // =======================
    const activeScenarios = scenarios(data, THRESHOLDS).filter(s => s.active);

    // =======================
    // Текст сценаріїв
    // =======================
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

    // =======================
    // Entry Signals
    // =======================
    const activeEntrySignals = evaluateEntrySignals(data);

    // Рендеримо сигнал у div #outputFuaters
    renderEntrySignals({
        activeEntrySignals,
        compositeActive: false,
        marketStrength: null,
        data
    });

    // =======================
    // RETURN
    // =======================
    return {
        scenarios: scenarioText,
        entrySignals: "Rendered directly in #outputFuaters"
    };
}