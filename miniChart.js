// ===============================
//   miniChart.js — Vertical Fib Bar (PRO VERSION)
// ===============================
let fibMinimized = false;
let fibColorShift = 0;
let fibAnimationFrame = null;

// ===============================
// 1. LOAD FIB FROM INPUT
// ===============================
function loadFibChartFromInput() {
  const input = document.getElementById("symbol");
  if (!input) return;

  let symbol = input.value.trim().toUpperCase();
  if (!symbol) return;

  loadFibChart(symbol);
}

// ===============================
// 2. LOAD DATA FROM BINANCE (4H)
// ===============================
async function loadFibChart(symbol) {
  symbol = symbol
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (!symbol.endsWith("USDT")) {
    symbol = symbol + "USDT";
  }

  try {
    const resp = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=4h&limit=300`
    );

    const data = await resp.json();
    if (!Array.isArray(data)) return;

    // ✅ HIGH / LOW / CLOSE
    const highs = data.map((c) => parseFloat(c[2]));
    const lows = data.map((c) => parseFloat(c[3]));
    const closes = data.map((c) => parseFloat(c[4]));

    drawFibChart(highs, lows, closes, data);
  } catch (e) {
    console.error("Помилка Fib:", e);
  }
}

// ===============================
// 3. FIND LAST IMPULSE (SWING HIGH → SWING LOW)
// ===============================
function findLastImpulse(highs, lows) {
  const recentHighs = highs.slice(-80);
  const recentLows = lows.slice(-80);

  const swingHigh = Math.max(...recentHighs);
  const swingLow = Math.min(...recentLows);

  return { swingHigh, swingLow };
}

// ===============================
// 4. DRAW VERTICAL FIB BAR
// ===============================
function drawFibChart(highs, lows, closes, data) {
  const canvas = document.getElementById("fibChart");
  const ctx = canvas.getContext("2d");

  // Retina
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = rect.width;
  const height = rect.height;

 // ============================
// 1) LAST IMPULSE (optimized)
// ============================
let swingHigh = -Infinity;
let swingLow = Infinity;
let indexHigh = -1;
let indexLow = -1;

for (let i = highs.length - 80; i < highs.length; i++) {
    if (highs[i] > swingHigh) {
        swingHigh = highs[i];
        indexHigh = i;
    }
    if (lows[i] < swingLow) {
        swingLow = lows[i];
        indexLow = i;
    }
}

const last = closes[closes.length - 1];
const range = swingHigh - swingLow;
if (range === 0) return;

// ============================
// 2) CORRECTION DEPTH
// ============================
const correctionDepth = (last - swingLow) / range;

// ============================
// 3) IMPULSE STRENGTH
// ============================
const impulseStrength = ((swingHigh - swingLow) / swingHigh) * 100;

// ============================
// 4) VOLUME FILTER
// ============================
const volumes = data.map(c => parseFloat(c[5]));
const avgVolume = volumes.slice(-80).reduce((a,b)=>a+b,0) / 80;

let impulseVolume = 0;
let bars = 0;

for (let i = Math.min(indexLow, indexHigh); i <= Math.max(indexLow, indexHigh); i++) {
    impulseVolume += volumes[i];
    bars++;
}

const volumeStrength = impulseVolume / (avgVolume * bars);

// ============================
// 6) FIB LEVELS
// ============================
const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 1];
const fib = fibLevels.map(lvl => ({
    lvl,
    val: swingLow + range * lvl
}));

const scaleX = p => ((p - swingLow) / range) * width;

// ============================
// 7) FIND ACTIVE ZONE
// ============================
let activeZone = null;
for (let i = 0; i < fib.length - 1; i++) {
    if (last >= fib[i].val && last <= fib[i + 1].val) {
        activeZone = { left: fib[i], right: fib[i + 1] };
        break;
    }
}

/// ============================
// MINIMIZED MODE (STATIC TEXT)
// ============================
if (fibMinimized) {
    if (!activeZone) return;

    const txt = `${(activeZone.left.lvl * 100).toFixed(1)}% → ${(activeZone.right.lvl * 100).toFixed(1)}%`;

    // Внутрішній розмір canvas = CSS-висота (30px) × dpr
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, width, height);

    ctx.font = "bold 18px 'Orbitron', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";

    // Витягування по вертикалі
    ctx.save();
    ctx.scale(1, 1.6);
    ctx.fillText(txt, width / 2, (height / 2) / 1.6);
    ctx.restore();

    return;
}


// ============================
// FULL MODE
// ============================

// BACKGROUND
ctx.fillStyle = "rgba(30, 35, 45, 0.4)";
ctx.fillRect(0, 0, width, height);

// TITLE
ctx.fillStyle = "#c6d5e3ff";
ctx.font = "13px 'Orbitron', monospace";
ctx.fillText("Fibonacci Impulse", 10, 12);

// ACTIVE ZONE
if (activeZone) {
    const x1 = scaleX(activeZone.left.val);
    const x2 = scaleX(activeZone.right.val);
    ctx.fillStyle = "rgba(0, 150, 255, 0.12)";
    ctx.fillRect(x1, 20, x2 - x1, height - 20);
}

// FIB LINES
ctx.strokeStyle = "rgba(255,255,255,0.25)";
ctx.lineWidth = 1;
ctx.fillStyle = "rgba(255,255,255,0.7)";
ctx.font = "11px 'SF Pro Text', sans-serif";

fib.forEach(f => {
    const x = scaleX(f.val);
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x, height);
    ctx.stroke();
    ctx.fillText((f.lvl * 100).toFixed(1) + "%", x + 2, 32);
});

// PRICE MARKER
const lastX = scaleX(last);
ctx.beginPath();
ctx.arc(lastX, height / 2 + 10, 5, 0, Math.PI * 2);
ctx.fillStyle = "#00aaff";
ctx.fill();

// ACTIVE ZONE TEXT
if (activeZone) {
    const txt = `${(activeZone.left.lvl * 100).toFixed(1)}% → ${(activeZone.right.lvl * 100).toFixed(1)}%`;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "11px 'SF Pro Text', sans-serif";
    ctx.fillText(txt, width - 90, height - 6);
}

// SWING PRICES
ctx.fillStyle = "rgba(255,255,255,0.55)";
ctx.font = "12px 'SF Pro Text', sans-serif";
ctx.fillText("Low:  " + swingLow.toFixed(2), 10, height - 20);
ctx.fillText("High: " + swingHigh.toFixed(2), 10, height - 8);

/// ============================
// TRADINGVIEW PANEL (right block)
// ============================

// Адаптивні параметри
const isMobile = width < 500;

// Панельні параметри
const panelWidth = isMobile ? 100 : 200;
const panelHeight = isMobile ? 70 : 100;
const panelX = isMobile ? width - panelWidth - 0 : width - panelWidth - 8;
const panelY = 8;
const panelRadius = 8;

// Фон панелі
ctx.fillStyle = "rgba(20, 24, 33, 0.65)";
ctx.beginPath();
ctx.moveTo(panelX + panelRadius, panelY);
ctx.lineTo(panelX + panelWidth - panelRadius, panelY);
ctx.quadraticCurveTo(panelX + panelWidth, panelY, panelX + panelWidth, panelY + panelRadius);
ctx.lineTo(panelX + panelWidth, panelY + panelHeight - panelRadius);
ctx.quadraticCurveTo(panelX + panelWidth, panelY + panelHeight, panelX + panelWidth - panelRadius, panelY + panelHeight);
ctx.lineTo(panelX + panelRadius, panelY + panelHeight);
ctx.quadraticCurveTo(panelX, panelY + panelHeight, panelX, panelY + panelHeight - panelRadius);
ctx.lineTo(panelX, panelY + panelRadius);
ctx.quadraticCurveTo(panelX, panelY, panelX + panelRadius, panelY);
ctx.fill();

// Внутрішній падінг
const padX = panelX + 12;
let py = panelY + (isMobile ? 13 : 18);

function strengthColor(v) {
    if (v >= 1.5) return "#00eaffff";      // very strong (неон зелений)
    if (v >= 1.2) return "#4cff8f";      // strong (зелений)
    if (v >= 0.9) return "#ffe066";      // medium (жовтий)
    if (v >= 0.7) return "#ff9f40";      // weak (помаранчевий)
    return "#ff6b6b";                    // very weak (червоний)
}

// Заголовок
ctx.fillStyle = "rgba(255,255,255,0.85)";
ctx.font = isMobile ? "10px 'Orbitron', monospace" : "12px 'Orbitron', monospace";
ctx.fillText("Market Metrics", padX, py);
py += isMobile ? 18 : 20;

// Correction
ctx.fillStyle = strengthColor(correctionDepth);
ctx.font = isMobile ? "10px 'SF Pro Text', sans-serif" : "12px 'SF Pro Text', sans-serif";
ctx.fillText("Correction: " + (correctionDepth * 100).toFixed(1) + "%", padX, py);
py += isMobile ? 16 : 18;

// Impulse
ctx.fillStyle = strengthColor(impulseStrength / 100);
ctx.fillText("Impulse: " + impulseStrength.toFixed(1) + "%", padX, py);
py += isMobile ? 16 : 18;

// Volume
ctx.fillStyle = strengthColor(volumeStrength);
ctx.fillText("Volume: " + volumeStrength.toFixed(2) + "x", padX, py);
py += isMobile ? 16 : 18;
}

// ===============================
// 5. AUTO REFRESH EVERY 5 MINUTES
// ===============================
setInterval(() => {
  loadFibChartFromInput();
}, 10 * 60 * 1000);

// ===============================
// EXPORT
// ===============================
window.loadFibChart = loadFibChart;
window.loadFibChartFromInput = loadFibChartFromInput;



document.getElementById("fibChart").addEventListener("click", () => {
    fibMinimized = !fibMinimized;

    const canvas = document.getElementById("fibChart");

    if (fibMinimized) {
        canvas.classList.add("minimized");
    } else {
        canvas.classList.remove("minimized");
    }

    loadFibChartFromInput();
});
