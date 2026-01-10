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
    isBullishImpulse,
    goldenPocket,
    retracementType,
    impulseBars,
    isVolumeClimax,
    last,
  } = fibData;

  // ===============================
  // BASE INFO
  // ===============================

  const retrKey = normalizeRetrKey(retracementType);
  const retrInfo = fibMetricInfo.retracement[retrKey] || {
    label: "Retracement",
  };

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
        <div class="mini-value depth-wrapper">
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
  <div class="mini-label">${fibMetricInfo.volumeStrength.label}</div>

<div class="mini-value volume-wrapper">
  ${volumeStrength.toFixed(2)}x
  <div class="volume-ring" style="animation-duration: ${getVolumePulseSpeed(volumeStrength)};"></div>
</div>
  <div class="mini-desc">${fibMetricInfo.volumeStrength.short}</div>
</div>

      <div class="mini-item">
        <div class="mini-label">Volume Pressure</div>
        <div class="mini-value">${volumePressure.toFixed(2)}</div>
        <div class="mini-desc">Volume support factor</div>
      </div>

      <div class="mini-item">
        <div class="mini-label">Trend Stability</div>
        <div class="mini-value">${trendStability.toFixed(2)}</div>
        <div class="mini-desc">Trend consistency score</div>
      </div>

      <div class="mini-item">
        <div class="mini-label">${fibMetricInfo.volumeClimax.label}</div>
        <div class="mini-value">${isVolumeClimax ? "Yes" : "No"}</div>
        <div class="mini-desc">${fibMetricInfo.volumeClimax.short}</div>
      </div>

      <div class="mini-item">
        <div class="mini-label">Retracement Risk</div>
        <div class="mini-value">${riskLevel}</div>
        <div class="mini-desc">Risk based on pullback depth</div>
      </div>

    </div>
  `;
}

// ===============================
// HELPERS
// ===============================

function getImpulseArrows(strength) {
  if (strength < 20) return "↑";
  if (strength < 40) return "↑↑";
  if (strength < 60) return "↑↑↑";
  return "↑↑↑↑";
}

// ===============================
// HEARTBEAT — CORRECTION POWER
// ===============================
function getDurationSegments({ bars, depthPct, speed }) {
  // ---- SAFE CLAMP
  bars = Math.max(1, bars || 1);
  depthPct = Math.max(0, depthPct || 0);
  speed = Math.max(0.3, speed || 1);

  // ---- SEGMENTS COUNT
  const count =
    bars < 10 ? 2 :
    bars < 20 ? 3 :
    bars < 30 ? 4 :
    bars < 40 ? 5 : 6;

  // ---- NORMALIZED POWER
  const durationFactor = Math.min(bars / 40, 1);
  const depthFactor = Math.min(depthPct / 10, 1);
  const speedFactor = Math.min(speed / 2, 1);

  const correctionPower =
    durationFactor * 0.4 +
    depthFactor * 0.4 +
    speedFactor * 0.2;

  // ---- HEIGHT RANGE
  const minH = 4;
  const maxH = 10 + correctionPower * 20;

  const heights = [];

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);

    // ---- PANIC SPIKE
    if (i === 0 && correctionPower > 0.6) {
      heights.push(Math.round(maxH * 0.9));
      continue;
    }

    // ---- ASYMMETRIC WAVE
    const skew = 0.6 + correctionPower * 0.6;
    const wave = Math.sin(Math.pow(t, skew) * Math.PI);

    // ---- DECAY
    const decay = 1 - t * 0.35;

    const h = minH + wave * (maxH - minH) * decay;
    heights.push(Math.round(h));
  }

  return heights;
}

function getVolumePulseSpeed(volumeStrength) {
  const minSpeed = 0.8;   // найшвидший пульс
  const maxSpeed = 1.5;   // найповільніший пульс
  const maxStrength = 1.8; // після цього швидкість не росте

  const normalized = Math.min(volumeStrength, maxStrength) / maxStrength;

  const speed = maxSpeed - (maxSpeed - minSpeed) * normalized;

  return speed.toFixed(2) + "s";
}
function normalizeRetrKey(raw) {
  if (!raw) return "normal";
  const v = raw.toLowerCase();
  if (v.includes("shallow")) return "shallow";
  if (v.includes("deep")) return "deep";
  if (v.includes("over")) return "overextended";
  return "normal";
}


      // <div class="short-label gp-${gpStatusObj.key}">
      //     ${gpInfo.label}
      //   </div>
      //   <div class="mini-desc">${gpStatusObj.desc}</div>