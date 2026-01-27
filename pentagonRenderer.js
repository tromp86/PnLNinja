// pentagonRenderer.js

export function renderPentagonFromIndicators(ind) {
    const shape = document.getElementById("pentagonShape");
    const labels = document.querySelectorAll(".pentagon-label");
    if (!shape || !ind) return;

    // ===============================
    // 1. HELPERS
    // ===============================
    const clamp = (v, min, max) =>
        Math.max(min, Math.min(max, v));

    const norm = (v, min, max) =>
        clamp((v - min) / (max - min), 0, 1);

    // ===============================
    // 2. AXES (0..1, where 0.5 = normal)
    // ===============================

    // 🔵 TREND
    const trend =
        (ind.EMA8 > ind.EMA21 ? 0.25 : 0) +
        (ind.EMA21 > ind.EMA50 ? 0.25 : 0) +
        (ind.lastPrice > ind.VWAP ? 0.25 : 0) +
        (ind.currentTF?.trend === "bull" ? 0.25 : 0);

    // 🟢 MOMENTUM
    const momentum =
        norm(ind.rsi, 35, 65) * 0.5 +
        norm(ind.stoch, 25, 75) * 0.3 +
        (ind.macd?.macd > ind.macd?.signal ? 0.2 : 0);

    // 🟠 VOLATILITY
    const bbWidth =
        (ind.bb.upper - ind.bb.lower) / ind.bb.middle;

    const volatility =
        norm(ind.atr, 250, 1100) * 0.6 +
        norm(bbWidth, 0.006, 0.045) * 0.4;

    // 🟣 VOLUME / OI
    const volRatio = ind.avgVolume
        ? ind.volume / ind.avgVolume
        : 1;

    const volume =
        (volRatio > 1 ? 0.4 : 0) +
        norm(volRatio, 0.6, 2) * 0.4 +
        (ind.oiSignals?.[0] ? 0.2 : 0);

    // 🔴 RISK / OVERHEAT
    const risk =
        (ind.rsi > 70 || ind.rsi < 30 ? 0.35 : 0) +
        (ind.mfi > 85 || ind.mfi < 15 ? 0.35 : 0) +
        (ind.lastPrice > ind.bb.upper ||
         ind.lastPrice < ind.bb.lower ? 0.3 : 0);

    const axes = [
        clamp(trend, 0, 1),
        clamp(momentum, 0, 1),
        clamp(volatility, 0, 1),
        clamp(volume, 0, 1),
        clamp(risk, 0, 1)
    ];

    // ===============================
    // 3. BASE GEOMETRY (ETALON)
    // ===============================
    const BASE_RADIUS = 46;
    const BASE_LEVEL = 0.75;     // нормальний стан
    const DEVIATION = 0.25;      // макс деформація

    const baseAngles = [-90, -18, 54, 126, 198];

    // ===============================
    // 4. ANGLE DEVIATIONS (LIMITED)
    // ===============================
    const angleOffsets = [
        clamp((ind.EMA8 - ind.EMA21) * 0.6, -15, 15),
        clamp((ind.rsi - 50) * 0.25, -12, 12),
        clamp((volatility - 0.5) * 25, -18, 18),
        clamp((volRatio - 1) * 18, -15, 15),
        clamp((risk - 0.5) * 20, -20, 20)
    ];

    // ===============================
    // 5. BUILD POLYGON
    // ===============================
    const points = baseAngles.map((base, i) => {
        const angle =
            (base + angleOffsets[i]) * Math.PI / 180;

        const r =
            BASE_RADIUS *
            (BASE_LEVEL + (axes[i] - 0.5) * DEVIATION);

        const x = 50 + Math.cos(angle) * r;
        const y = 50 + Math.sin(angle) * r;

        return `${x}% ${y}%`;
    });

    shape.style.clipPath = `polygon(${points.join(",")})`;

// ===============================
// 6. COLOR = MARKET STATE
// ===============================
const danger = axes[4];
const energy = axes[1] + axes[2];

let color;

// 🔴 ЧЕРВОНІ — ризик
if (danger > 0.9) {
    color = "rgba(231, 15, 15, 0.45)";        // deep red
} else if (danger > 0.75) {
    color = "rgba(213, 47, 47, 0.45)";        // medium red
} else if (danger > 0.6) {
    color = "rgba(245, 136, 136, 0.45)";      // soft red

// 🟢 ЗЕЛЕНІ — енергія
} else if (energy > 1.3) {
    color = "rgba(0, 232, 147, 0.63)";        // deep green
} else if (energy > 1.15) {
    color = "rgba(0,180,110,0.45)";        // medium green
} else if (energy > 1.05) {
    color = "rgba(43, 141, 102, 0.45)";        // soft green

// 🟡 ЖОВТО‑ГАРЯЧІ — нейтральні стани
} else if (danger > 0.45) {
    color = "rgba(255,180,80,0.45)";       // warm amber
} else if (danger > 0.3) {
    color = "rgba(255,200,110,0.45)";      // pastel amber
} else {
    color = "rgba(255,220,160,0.45)";      // soft yellow-orange
}

shape.style.background = color;
    // ===============================
    // 7. LABEL POSITIONS (STABLE)
    // ===============================
    baseAngles.forEach((base, i) => {
        const label = labels[i];
        if (!label) return;

        const angle =
            (base + angleOffsets[i]) * Math.PI / 180;

        const rLabel =
            BASE_RADIUS *
            (1.05 + (axes[i] - 0.5) * 0.25);

        const x = 50 + Math.cos(angle) * rLabel;
        const y = 50 + Math.sin(angle) * rLabel;

        label.style.left = `${x}%`;
        label.style.top = `${y}%`;
    });
}
