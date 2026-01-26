import { clamp } from "./marketUtils.js";

/**
 * 🚀 Основна функція Counter-Trend Engine
 */
export function runCTEngine({ direction, derived, data, recent, stops }) {
  let out = "";

  const ctWarnings = [];
  let ctConf = 0;
  let ctAction = "WAIT";
  let ctDirection = direction;

  const CT_CONF_MIN = 48;
  const impulse =
    direction === "long" ? derived.impulseLong : derived.impulseShort;
  const vp = derived.volumePressure;

  const weakImpulse = impulse < 0.22;
  const weakTrend = derived.trendStability < 0.40;
  const absorption =
    (direction === "long" && vp < -0.1) ||
    (direction === "short" && vp > 0.1);

  const htfExhaustion =
    data.higherTF?.atrSlope < 0 || data.higherTF?.momentum < 0;

  const last = recent.candles?.at(-1);
  let wickSignal = false;

  if (last) {
    const upperWick = last.High - Math.max(last.Close, last.Open);
    const lowerWick = Math.min(last.Close, last.Open) - last.Low;
    const range = last.High - last.Low;

    wickSignal =
      (direction === "long" && lowerWick > range * 0.25) ||
      (direction === "short" && upperWick > range * 0.25);
  }

  const rsiDiv =
    (direction === "long" &&
      data.RSI < data.prevRSI &&
      data.Price > data.prevPrice) ||
    (direction === "short" &&
      data.RSI > data.prevRSI &&
      data.Price < data.prevPrice);

  const structureShift =
    (direction === "long" && data.localLow > data.prevLocalLow) ||
    (direction === "short" && data.localHigh < data.prevLocalHigh);

  const ctFactors = [
    weakImpulse,
    weakTrend,
    absorption,
    htfExhaustion,
    wickSignal,
    rsiDiv,
    structureShift,
  ].filter(Boolean).length;

  if (ctFactors >= 2) {
    ctWarnings.push("Counter-trend conditions detected");

    ctConf = 25;
    ctConf += weakImpulse ? 10 : 0;
    ctConf += weakTrend ? 10 : 0;
    ctConf += absorption ? 12 : 0;
    ctConf += htfExhaustion ? 8 : 0;
    ctConf += wickSignal ? 10 : 0;
    ctConf += rsiDiv ? 12 : 0;
    ctConf += structureShift ? 8 : 0;

    if (derived.volatilityRegime > 2.0) ctConf -= 8;
    ctConf = clamp(ctConf, 5, 97);

    ctDirection = direction === "long" ? "short" : "long";
    ctAction = ctConf >= CT_CONF_MIN ? "ENTER" : "WATCH";

    out += `
<div class="ct-block">
  <div class="ct-header">
    🔄 <strong>COUNTER-TREND | ${ctDirection.toUpperCase()}</strong>
  </div>

  <div class="ct-line"><strong>Confidence:</strong> ${ctConf}%</div>
  <div class="ct-line"><strong>Action:</strong> ${ctAction}</div>

  <div class="ct-section">
    <div class="ct-title">⚠ Warnings:</div>
    ${ctWarnings.map(w => `<div>${w}</div>`).join("")}
  </div>
</div>
`;
  }

  return out;
}

/**
 * 🖥️ Вивід Counter-Trend у DOM
 */
export function renderCTEngine(params) {
  const ctText = runCTEngine(params);
  const el = document.getElementById("outputCt");

  if (!el) return;

  if (!ctText) {
    el.innerHTML = `<div>No counter-trend conditions detected.</div>`;
  } else {
    el.innerHTML = ctText; // ← ЧИСТИЙ HTML
  }
}