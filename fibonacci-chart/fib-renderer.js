
// ===============================
// Fibonacci Canvas Renderer — Canvas Only
// ===============================

import { safeDiv, clampRGB } from "./fib-core.js";

// Головна функція малювання
export function renderFibonacciChart(canvas, fibData, fibMinimized = false) {
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Retina support
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const width = rect.width;
    const height = rect.height;

    if (!fibData || !fibData.isValid) {
        renderErrorMessage(ctx, width, height, fibData?.error || "No data");
        return;
    }

    if (fibMinimized) {
        renderMinimizedMode(ctx, width, height, fibData);
    } else {
        renderFullMode(ctx, width, height, fibData);
    }
}

// ===============================
// Помилка
// ===============================
function renderErrorMessage(ctx, width, height, message) {
    ctx.clearRect(0, 0, width, height);

    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#05070c");
    grad.addColorStop(0.5, "#0b0f19");
    grad.addColorStop(1, "#05070c");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255, 120, 120, 0.9)";
    ctx.font = "19px 'SF Pro Text', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(message, width / 2, height / 2);
}

// ===============================
// Мінімізований режим
// ===============================
function renderMinimizedMode(ctx, width, height, fibData) {
    ctx.clearRect(0, 0, width, height);

    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#05070c");
    grad.addColorStop(0.5, "#0b111b");
    grad.addColorStop(1, "#05070c");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fillRect(0, 0, width, height);

    if (!fibData.activeZone) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.font = "bold 18px 'Orbitron', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("No zone", width / 2, height / 2);
        return;
    }

    const txt = `${(fibData.activeZone.left.lvl * 100).toFixed(1)}% → ${(fibData.activeZone.right.lvl * 100).toFixed(1)}%`;

    ctx.font = "bold 18px 'Orbitron', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(230, 240, 255, 0.92)";

    ctx.save();
    ctx.scale(1, 1.4);
    ctx.fillText(txt, width / 2, (height / 2) / 1.4);
    ctx.restore();
}

// ===============================
// Повний режим (тільки графік + зона)
// ===============================
function renderFullMode(ctx, width, height, fibData) {
    const {
        swingHigh,
        swingLow,
        last,
        range,
        activeZone,
        fibLevels
    } = fibData;

    const scaleX = (p) => {
        const normalized = safeDiv(p - swingLow, range);
        return Math.max(0, Math.min(width, normalized * width));
    };

    // Фон
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, "#03050a");
    bgGrad.addColorStop(0.35, "#080c14");
    bgGrad.addColorStop(0.7, "#050812");
    bgGrad.addColorStop(1, "#020307");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fillRect(0, 0, width, height);

    // Заголовок
    ctx.fillStyle = "rgba(228, 236, 255, 0.9)";
    ctx.font = "15px 'Orbitron', monospace";
    ctx.textAlign = "left";
    ctx.fillText("Fibonacci Impulse", 12, 16);

    // Активна зона
    if (activeZone) {
        renderActiveZone(ctx, width, height, fibData, scaleX);
    }

    // Лінії Фібоначчі
    ctx.strokeStyle = "rgba(230, 240, 255, 0.16)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgba(230, 235, 250, 0.8)";
    ctx.font = "13px 'SF Pro Text', sans-serif";

    fibLevels.forEach((f) => {
        const x = scaleX(f.val);
        ctx.beginPath();
        ctx.moveTo(x, 26);
        ctx.lineTo(x, height - 4);
        ctx.stroke();
        ctx.fillText((f.lvl * 100).toFixed(1) + "%", x + 2, 38);
    });

    // Маркер поточної ціни
    renderPriceMarker(ctx, width, height, last, scaleX);

    // Текст активної зони
    if (activeZone) {
        const txt = `${(activeZone.left.lvl * 100).toFixed(1)}% → ${(activeZone.right.lvl * 100).toFixed(1)}%`;
        ctx.fillStyle = "rgba(220, 228, 245, 0.82)";
        ctx.font = "13px 'SF Pro Text', sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(txt, width - 12, height - 10);
        ctx.textAlign = "left";
    }

    // Ціни екстремумів
    ctx.fillStyle = "rgba(200, 210, 230, 0.72)";
    ctx.font = "12px 'SF Pro Text', sans-serif";
    ctx.fillText("Low:  " + swingLow.toFixed(2), 12, height - 22);
    ctx.fillText("High: " + swingHigh.toFixed(2), 12, height - 8);
}

// ===============================
// Активна зона
// ===============================
function renderActiveZone(ctx, width, height, fibData, scaleX) {
    const { activeZone, last } = fibData;
    const x1 = scaleX(activeZone.left.val);
    const x2 = scaleX(activeZone.right.val);
    const t = safeDiv(last - activeZone.left.val, activeZone.right.val - activeZone.left.val);

    const r = clampRGB(170 - t * 40);
    const g = clampRGB(200 - t * 10);
    const b = clampRGB(255 - t * 15);

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.10)`;
    ctx.fillRect(x1, 22, x2 - x1, height - 42);

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.45)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(x1, 22, x2 - x1, height - 42);

    ctx.fillStyle = "rgba(220, 230, 250, 0.85)";
    ctx.font = "11px 'SF Pro Text', sans-serif";
    ctx.fillText("Active Reaction Zone", x1 + 4, 58);
}

// ===============================
// Маркер ціни
// ===============================
function renderPriceMarker(ctx, width, height, last, scaleX) {
    const lastX = scaleX(last);
    const cy = height / 2 + 8;

    const glowGrad = ctx.createRadialGradient(lastX, cy, 0, lastX, cy, 22);
    glowGrad.addColorStop(0, "rgba(120, 190, 255, 0.45)");
    glowGrad.addColorStop(1, "rgba(120, 190, 255, 0)");
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(lastX, cy, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(lastX, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(160, 210, 255, 0.95)";
    ctx.fill();
}