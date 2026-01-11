// ===============================
// Fibonacci Output Panel Renderer
// ===============================

import { fibMetricInfo } from "./fib-info.js";

// ===============================
// MAIN RENDER
// ===============================
export function updateFibonacciOutput(fibData) {
  const container = document.getElementById("outputFibonacci");
  if (!container) return;

  if (!fibData || !fibData.isValid) {
    container.innerHTML = "";
    return;
  }

  const {
    correctionDepth,
    impulseStrength,
    volumeStrength,
    impulseBars,
    isVolumeClimax,
  } = fibData;

  // ===============================
  // DERIVED METRICS
  // ===============================

  // Volume Pressure
  const volumePressure = volumeStrength * (isVolumeClimax ? 1.3 : 1);

  // Trend Stability
  const barsFactor = impulseBars <= 4 ? 1 : impulseBars <= 8 ? 0.7 : 0.4;
  const trendStability =
    (barsFactor *
      (1 - Math.min(Math.max(correctionDepth, 0), 1)) *
      Math.min(volumeStrength, 3)) /
    2;

  // Retracement Risk
  const riskLevel =
    correctionDepth < 0.38
      ? "Low"
      : correctionDepth < 0.61
      ? "Medium"
      : correctionDepth < 1
      ? "High"
      : "Very High";

  // ===============================
  // RENDER
  // ===============================
  container.innerHTML = `
    <div class="short-grid">
    </div>

    <div class="mini-grid">

      <div class="mini-item">
        <div class="mini-label">${fibMetricInfo.impulseStrength.label}</div>
        <div class="mini-value">
          ${impulseStrength.toFixed(1)}%
          <span class="impulse-arrows">${getImpulseArrows(
            impulseStrength
          )}</span>
        </div>
        <div class="mini-desc">${fibMetricInfo.impulseStrength.short}</div>
      </div>

      <div class="mini-item">
        <div class="mini-label">${fibMetricInfo.correctionDepth.label}</div>
        <div class="mini-value">
          ${(correctionDepth * 100).toFixed(1)}%
          <div class="depth-meter">
            <div class="depth-level" style="height:${
              correctionDepth * 100
            }%"></div>
          </div>
        </div>
        <div class="mini-desc">${fibMetricInfo.correctionDepth.short}</div>
      </div>

      <div class="mini-item">
        <div class="mini-label">${fibMetricInfo.impulseBars.label}</div>
        <div class="mini-value duration-wrapper">
          ${impulseBars}
          <div class="duration-meter">
            ${getDurationSegments({
              bars: impulseBars,
              depthPct: correctionDepth * 100,
              speed: impulseStrength / 50,
            })
              .map(
                (h) =>
                  `<div class="duration-segment" style="height:${h}px"></div>`
              )
              .join("")}
          </div>
        </div>
        <div class="mini-desc">${fibMetricInfo.impulseBars.short}</div>
      </div>

<div class="mini-item">
  <div class="mini-label">Volume Pressure</div>
  <div class="mini-value">${volumePressure.toFixed(2)}</div>

<div class="volume-pressure-meter">
  <div 
    class="volume-pressure-fill"
    style="width: ${Math.min(volumePressure / 3 * 100, 100)}%"
  >
    <div class="volume-pressure-end-line"></div>
  </div>
</div>


  <div class="mini-desc">Volume amplification factor</div>
</div>

<div class="mini-item">
  <div class="mini-label">Trend Stability</div>
  <div class="mini-value">
    ${trendStability.toFixed(2)}
    <span class="stability-visual">
      ${getStabilityChart(trendStability)}
    </span>
  </div>
  <div class="mini-desc">Trend consistency score</div>
</div>

      <div class="mini-item">
        <div class="mini-label">Retracement Risk</div>
        <div class="mini-value">
  ${riskLevel}
  ${getRiskIndicator(riskLevel)}
</div>

        <div class="mini-desc">Risk based on pullback depth</div>
      </div>

    </div>
  `;
}

// ===============================
// HELPERS
// ===============================

function getImpulseArrows(strength) {
  const maxWidth = 280;
  const currentLineWidth = (Math.min(strength, 100) / 100) * maxWidth;
  
  return `
    <div class="arrow-wrapper">
      <div class="arrow-body" style="width: ${currentLineWidth}px;"></div>
      <div class="arrow-tip"></div>
    </div>
  `;
}
function getDurationSegments({ bars, depthPct, speed }) {
  // ---- SAFE CLAMP
  bars = Math.max(1, bars || 1);
  depthPct = Math.max(0, depthPct || 0);
  speed = Math.max(0.3, speed || 1);

  // ---- COUNT (8–20)
  const count = Math.min(Math.floor(bars / 1.7) + 8, 20);

  // ---- CORRECTION POWER
  const durationFactor = Math.min(bars / 60, 1);
  const depthFactor = Math.min(depthPct / 20, 1);
  const speedFactor = Math.min(speed / 4, 1);

  const correctionPower =
    durationFactor * 0.25 +
    depthFactor * 0.55 +
    speedFactor * 0.20;

  // ---- HEIGHT RANGE
  const minH = 3;
  const maxH = 10 + correctionPower * 18;

  const heights = [];

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);

    // ---- SINGLE-DIRECTION WAVE (1–1.5 cycles)
    const frequency = 1 + correctionPower * 0.5;
    const wave = Math.sin(t * Math.PI * frequency);

    // ---- DECAY
    const decay = Math.exp(-t * 2.2);

    // ---- SMALL, DECAYING NOISE
    const noise = (Math.random() - 0.5) * (correctionPower * 1.2) * decay;

    // ---- HEIGHT
    let h = minH + Math.max(0, wave) * (maxH - minH) * decay + noise;

    // ---- FIRST BAR ALWAYS STRONGEST
    if (i === 0) h = maxH;

    heights.push(Math.round(Math.max(minH, h)));
  }

  return heights;
}



function getStabilityChart(score) {
  const points = 15;
  const width = 100;
  const height = 20;

  // Нормалізуємо score у 0–1
  const normalized = Math.min(1, Math.max(0, (score - 0.05) / 0.10));

  // Seed на основі score (щоб графік був стабільним)
  let seed = Math.floor(normalized * 10000);

  function seededRandom() {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  }

  // Підсилена амплітуда хаосу
  const volatility = Math.pow(1 - normalized, 1.5) * 25;

  let pathData = "M 0 10";

  for (let i = 1; i <= points; i++) {
    const x = (i / points) * width;

    // Використовуємо seeded noise замість Math.random()
    const spike = (seededRandom() - 0.5) * volatility;

    const y = 10 + spike;
    pathData += ` L ${x} ${y}`;
  }

  // Плавний перехід кольору
  const color = scoreToColor(normalized);

  return `
    <svg 
  class="stability-svg"
  viewBox="0 0 ${width} ${height}"
  preserveAspectRatio="none"
>
      <path d="${pathData}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
}

function scoreToColor(score) {
  if (score < 0.5) {
    // Червоний → Бурштиновий (TradingView style)
    const t = score / 0.5;
    return lerpColor("#ff2525", "#ffaa0086", t);
  } else {
    // Бурштиновий → Глибокий зелений (TradingView style)
    const t = (score - 0.5) / 0.5;
    return lerpColor("#ffaa0086", "#24ff9c", t);
  }
}

function lerpColor(a, b, t) {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);

  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);

  const rr = Math.round(ar + (br - ar) * t).toString(16).padStart(2, "0");
  const rg = Math.round(ag + (bg - ag) * t).toString(16).padStart(2, "0");
  const rb = Math.round(ab + (bb - ab) * t).toString(16).padStart(2, "0");

  return `#${rr}${rg}${rb}`;
}


function getRiskIndicator(risk) {
  // Визначаємо клас ризику
  let riskClass = "risk-low";
  
  if (risk === "Medium") {
    riskClass = "risk-medium";
  } 
  else if (risk === "High") {
    riskClass = "risk-high";
  } 
  else if (risk === "Very High") {
    riskClass = "risk-very-high";
  }

  return `
    <div class="risk-bar-wrapper ${riskClass}">
      <div class="risk-bar-fill"></div>
    </div>
  `;
}
