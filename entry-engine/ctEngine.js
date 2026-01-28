import { clamp } from "./marketUtils.js";
import { computeMLWeights } from "./mlWeighting.js";

// =======================
// CONFIG
// =======================

const CT_CONFIG = {
  MIN_SIGNALS: 2,
  MIN_SCORE: 38,
  CONF_WATCH: 48,
  CONF_ENTER: 65,
};

// const CT_WEIGHTS = {
//   weakImpulse: 10,
//   weakTrend: 10,
//   absorption: 12,
//   htfExhaustion: 8,
//   wickSignal: 10,
//   rsiDiv: 12,
//   structureShift: 8,
// };

const CT_LABELS = {
  weakImpulse: "Impulse weakening",
  weakTrend: "Trend losing structure",
  absorption: "Volume absorption detected",
  htfExhaustion: "Higher TF exhaustion",
  wickSignal: "Rejection wick",
  rsiDiv: "RSI divergence",
  structureShift: "Local structure shift",
};

// =======================
// CORE ENGINE
// =======================
// rawScore 
export function runCTEngine({ direction, derived, data, recent }) {
  const reasons = [];

  if (!derived || !recent || !data) {
    return {
      active: false,
      reason: ["Insufficient market data"],
    };
  }

  const impulse =
    direction === "long" ? derived.impulseLong : derived.impulseShort;

  // =======================
  // KILL SWITCH
  // =======================

  const trendTooStrong =
    derived.trendStability > 0.85 &&
    impulse > 0.65 &&
    derived.volatilityRegime < 1.8;

  if (trendTooStrong) {
    return {
      active: false,
      reason: [
        "Strong directional trend",
        "Impulse momentum still dominant",
      ],
    };
  }

  // =======================
  // FACTOR DETECTION
  // =======================

  const vp = derived.volumePressure;
  const last = recent.candles?.at(-1);
  let wickSignal = false;

  if (last) {
    const upperWick = last.High - Math.max(last.Close, last.Open);
    const lowerWick = Math.min(last.Close, last.Open) - last.Low;
    const range = last.High - last.Low;

    const wickThreshold =
      derived.volatilityRegime > 2 ? 0.35 : 0.25;

    wickSignal =
      (direction === "long" && lowerWick > range * wickThreshold) ||
      (direction === "short" && upperWick > range * wickThreshold);
  }

  const ctSignals = {
    weakImpulse: impulse < 0.22,
    weakTrend: derived.trendStability < 0.4,
    absorption:
      (direction === "long" && vp < -0.1) ||
      (direction === "short" && vp > 0.1),
    htfExhaustion:
      data.higherTF?.atrSlope < 0 ||
      data.higherTF?.momentum < 0,
    wickSignal,
    rsiDiv:
      (direction === "long" &&
        data.RSI < data.prevRSI &&
        data.Price > data.prevPrice) ||
      (direction === "short" &&
        data.RSI > data.prevRSI &&
        data.Price < data.prevPrice),
    structureShift:
      (direction === "long" &&
        data.localLow > data.prevLocalLow) ||
      (direction === "short" &&
        data.localHigh < data.prevLocalHigh),
  };

  const activeSignals = Object.entries(ctSignals)
    .filter(([, v]) => v)
    .map(([k]) => k);

  // =======================
  // QUALITY CHECKS
  // =======================

  if (activeSignals.length < CT_CONFIG.MIN_SIGNALS) {
    reasons.push(
      `Only ${activeSignals.length} counter-trend factor(s) detected`
    );
  }

const mlWeights = computeMLWeights({
  signals: activeSignals,
  derived,
  context: {
    direction: "counter",
    marketStrength: data.marketStrength,
  },
});

const rawScore = activeSignals.reduce(
  (s, k) => s + (mlWeights[k] || 0),
  0
);

  if (rawScore < CT_CONFIG.MIN_SCORE) {
    reasons.push("Combined counter-trend strength is too weak");
  }

  if (reasons.length > 0) {
    return {
      active: false,
      signals: activeSignals,
      score: rawScore,
      reason: reasons,
    };
  }

  // =======================
  // CONFIDENCE
  // =======================

  let confidence = 25 + rawScore;
  if (derived.volatilityRegime > 2.0) confidence -= 8;
  confidence = clamp(confidence, 5, 97);

  // =======================
  // ACTION
  // =======================

  let action = "IGNORE";
  if (confidence >= CT_CONFIG.CONF_ENTER) action = "ENTER";
  else if (confidence >= CT_CONFIG.CONF_WATCH) action = "WATCH";

  const ctDirection = direction === "long" ? "short" : "long";

  return {
    active: true,
    direction: ctDirection,
    action,
    confidence,
    score: rawScore,
    signals: activeSignals,
    html: renderCTHtml({
      ctDirection,
      action,
      confidence,
      signals: activeSignals,
    }),
  };
}

// =======================
// HTML RENDER
// =======================

function renderCTHtml({ ctDirection, action, confidence, signals }) {
  return `
<div class="ct-block">
  <div class="ct-header">
    🔄 <strong>COUNTER-TREND | ${ctDirection.toUpperCase()}</strong>
  </div>

  <div class="ct-line"><strong>Confidence:</strong> ${confidence}%</div>
  <div class="ct-line"><strong>Action:</strong> ${action}</div>

  <div class="ct-section">
    <div class="ct-title">⚠ Factors:</div>
    ${signals.map(s => `<div>• ${CT_LABELS[s]}</div>`).join("")}
  </div>
</div>
`;
}

// =======================
// DOM INTEGRATION
// =======================

export function renderCTEngine(params) {
  const el = document.getElementById("outputCt");
  if (!el) return;

  const ct = runCTEngine(params);

  if (!ct || !ct.active) {
    const reasons = ct?.reason ?? ["No valid counter-trend conditions"];
    el.innerHTML = `
<div class="ct-block ct-muted">
  <div class="ct-header">🚫 COUNTER-TREND NOT ACTIVE</div>
  <div class="ct-section">
    ${reasons.map(r => `<div>• ${r}</div>`).join("")}
  </div>
</div>`;
    return;
  }

  el.innerHTML = ct.html;
}
