// pentagonRenderer.js

export function renderPentagonFromIndicators(ind) {
    const shape = document.getElementById("pentagonShape");
    const labels = document.querySelectorAll(".pentagon-label");
    if (!shape || !labels) return;

    // ===============================
    // 0. Якщо даних немає — ховаємо все
    // ===============================
    if (!ind) {
        // П'ятикутник в центрі, невидимий
        shape.style.clipPath = "polygon(50% 50%,50% 50%,50% 50%,50% 50%,50% 50%)";
        shape.style.background = "transparent";
        shape.style.transition = "clip-path 0.6s ease, background 0.6s ease";

        // Підписи прозорі
        labels.forEach(label => {
            label.style.opacity = 0;
            label.style.transition = "left 0.6s ease, top 0.6s ease, opacity 0.6s ease";
        });
        return;
    }

    // ===============================
    // 1. HELPERS
    // ===============================
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const norm = (v, min, max) => clamp((v - min) / (max - min), 0, 1);

    // ===============================
    // 2. AXES (0..1)
    // ===============================
    const trend =
        (ind.EMA8 > ind.EMA21 ? 0.25 : 0) +
        (ind.EMA21 > ind.EMA50 ? 0.25 : 0) +
        (ind.lastPrice > ind.VWAP ? 0.25 : 0) +
        (ind.currentTF?.trend === "bull" ? 0.25 : 0);

    const momentum =
        norm(ind.rsi, 35, 65) * 0.5 +
        norm(ind.stoch, 25, 75) * 0.3 +
        (ind.macd?.macd > ind.macd?.signal ? 0.2 : 0);

    const bbWidth = (ind.bb.upper - ind.bb.lower) / ind.bb.middle;
    const volatility =
        norm(ind.atr, 250, 1100) * 0.6 +
        norm(bbWidth, 0.006, 0.045) * 0.4;

    const volRatio = ind.avgVolume ? ind.volume / ind.avgVolume : 1;
    const volume =
        (volRatio > 1 ? 0.4 : 0) +
        norm(volRatio, 0.6, 2) * 0.4 +
        (ind.oiSignals?.[0] ? 0.2 : 0);

    const risk =
        (ind.rsi > 70 || ind.rsi < 30 ? 0.35 : 0) +
        (ind.mfi > 85 || ind.mfi < 15 ? 0.35 : 0) +
        (ind.lastPrice > ind.bb.upper || ind.lastPrice < ind.bb.lower ? 0.3 : 0);

    const axes = [
        clamp(trend, 0, 1),
        clamp(momentum, 0, 1),
        clamp(volatility, 0, 1),
        clamp(volume, 0, 1),
        clamp(risk, 0, 1)
    ];

    // ===============================
    // 3. BASE GEOMETRY
    // ===============================
    const BASE_RADIUS = 46;
    const BASE_LEVEL = 0.75;
    const DEVIATION = 0.25;
    const baseAngles = [-90, -18, 54, 126, 198];

    const angleOffsets = [
        clamp((ind.EMA8 - ind.EMA21) * 0.6, -15, 15),
        clamp((ind.rsi - 50) * 0.25, -12, 12),
        clamp((volatility - 0.5) * 25, -18, 18),
        clamp((volRatio - 1) * 18, -15, 15),
        clamp((risk - 0.5) * 20, -20, 20)
    ];

    // ===============================
    // 4. BUILD POLYGON POINTS
    // ===============================
    const points = baseAngles.map((base, i) => {
        const angle = (base + angleOffsets[i]) * Math.PI / 180;
        const r = BASE_RADIUS * (BASE_LEVEL + (axes[i] - 0.5) * DEVIATION);
        const x = 50 + Math.cos(angle) * r;
        const y = 50 + Math.sin(angle) * r;
        return `${x}% ${y}%`;
    });

    // ===============================
    // 5. COLOR
    // ===============================
    const danger = axes[4];
    const energy = axes[1] + axes[2];
    let color;

    if (danger > 0.9) color = "rgba(231,15,15,0.45)";
    else if (danger > 0.75) color = "rgba(213,47,47,0.45)";
    else if (danger > 0.6) color = "rgba(245,136,136,0.45)";
    else if (energy > 1.3) color = "rgba(0,232,147,0.63)";
    else if (energy > 1.15) color = "rgba(0,180,110,0.45)";
    else if (energy > 1.05) color = "rgba(43,141,102,0.45)";
    else if (danger > 0.45) color = "rgba(255,180,80,0.45)";
    else if (danger > 0.3) color = "rgba(255,200,110,0.45)";
    else color = "rgba(255,220,160,0.45)";

    // ===============================
    // 6. APPLY POLYGON & COLOR WITH ANIMATION
    // ===============================
    shape.style.transition = "clip-path 0.6s ease, background 0.6s ease";
    shape.style.clipPath = `polygon(${points.join(",")})`;
    shape.style.background = color;

    // ===============================
    // 7. LABEL POSITIONS WITH FADE-IN
    // ===============================
    labels.forEach((label, i) => {
        const angle = (baseAngles[i] + angleOffsets[i]) * Math.PI / 180;
        const rLabel = BASE_RADIUS * (1.05 + (axes[i] - 0.5) * 0.25);
        const x = 50 + Math.cos(angle) * rLabel;
        const y = 50 + Math.sin(angle) * rLabel;

        label.style.transition = "left 0.6s ease, top 0.6s ease, opacity 0.6s ease";
        label.style.left = `${x}%`;
        label.style.top = `${y}%`;
        label.style.opacity = 1; // fade-in
    });
}
