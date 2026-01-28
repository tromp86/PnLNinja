// entrySignalsRenderer

import {
  extractRecentContext,
  clamp,
  normalize,
} from "./marketUtils.js";

import {
  calcTrendStability,
  calcImpulseQuality,
  calcRetracementRisk,
  calcVolumePressureSymmetric,
  calcVolatilityRegime,
} from "./derivedMetrics.js";

import { runCTEngine } from "./ctEngine.js";

// =======================
// ENTRY SIGNALS RENDERER
// =======================
export function renderEntrySignals({
  activeEntrySignals,
  compositeActive,
  marketStrength,
  data,
}) {
  const el = document.getElementById("outputFuaters");
  const ctEl = document.getElementById("outputCt");

  if (!el) return;

  // =======================
  // NO ENTRY SIGNALS
  // =======================
  if (!Array.isArray(activeEntrySignals) || activeEntrySignals.length === 0) {
    el.innerHTML = `
      <div class="no-signals">
        No valid entry conditions detected
      </div>
    `;

    if (ctEl) {
      ctEl.innerHTML = `
        <div class="ct-block ct-muted">
          Counter-trend analysis not available (no primary direction)
        </div>
      `;
    }
    return;
  }

  let out = "";
  const recent = extractRecentContext(data, 12);

  // =======================
  // DERIVED METRICS
  // =======================
  const derived = {
    trendStability: clamp(calcTrendStability(recent), 0.01, 1.5),
    impulseLong: clamp(calcImpulseQuality(recent, "long"), 0.01, 1.5),
    impulseShort: clamp(calcImpulseQuality(recent, "short"), 0.01, 1.5),
    retracementRisk: clamp(calcRetracementRisk(recent), 0.01, 2),
    volumePressure: clamp(calcVolumePressureSymmetric(recent), -1, 1),
    volatilityRegime: clamp(calcVolatilityRegime(recent), 0.5, 2.5),
  };

  const CONF_MIN = 58;

  // primary context for CT
  let primaryDirection = activeEntrySignals[0]?.type ?? "long";
  let primaryStops = [];

  // =======================
  // CONTEXT DESCRIPTIONS
  // =======================
  const CONTEXT_MAP = {
    trend_add: "Trend-following continuation setup",
    reversal: "Mean-reversion / reversal setup",
    htf_add: "Higher timeframe confirmation",
    range: "Range-based setup",
    breakout: "Breakout setup: volatility expansion",
    breakdown: "Breakdown setup: momentum failure",
    pullback: "Pullback entry into trend",
    momentum: "Momentum ignition setup",
    volatility: "Volatility-based setup",
    liquidity_grab: "Liquidity grab / stop-hunt",
    sweep: "Local sweep of highs/lows",
    compression: "Price compression phase",
    exhaustion: "Trend exhaustion setup",
    imbalanced: "Orderflow imbalance detected",
  };

  // =======================
  // MAIN ENTRY LOOP
  // =======================
  activeEntrySignals.forEach((sig, idx) => {
    let direction = sig.type;
    const reasons = [];
    const warnings = [];
    const stops = [];

    const impulse =
      direction === "long"
        ? derived.impulseLong
        : derived.impulseShort;

    const vp = derived.volumePressure;

    // =======================
    // AUTO-FLIP LOGIC
    // =======================
    if (
      sig.context === "reversal" &&
      derived.trendStability > 0.85 &&
      impulse < 0.22
    ) {
      direction = direction === "long" ? "short" : "long";
      warnings.push(
        "Auto-flip: strong trend against weak reversal impulse"
      );
    }

    // =======================
    // CONTEXT
    // =======================
    reasons.push(
      CONTEXT_MAP[sig.context] ?? "General market setup"
    );

    // =======================
    // IMPULSE THRESHOLDS
    // =======================
    let impulseStop = 0.04;
    if (sig.context === "reversal") impulseStop = 0.08;
    if (sig.context === "range") impulseStop = 0.02;

    if (impulse < impulseStop) {
      warnings.push("Impulse is weak for this setup");
    }

    // =======================
    // HARD STOPS
    // =======================
    if (derived.trendStability < 0.08)
      stops.push("Market structure unstable");

    if (derived.volatilityRegime > 2.3)
      stops.push("Extreme volatility regime");

    if (derived.retracementRisk > 1.95)
      stops.push("Retracement risk extremely high");

    if (
      marketStrength?.score != null &&
      marketStrength.score < 20
    ) {
      stops.push("Weak global market environment");
    }

    if (direction === "long" && vp < -0.55)
      stops.push("Strong sell-side dominance");

    if (direction === "short" && vp > 0.55)
      stops.push("Strong buy-side dominance");

    // =======================
    // CONFIDENCE ENGINE
    // =======================
    let confidence = 40;

    confidence += sig.priority * 5;
    confidence += Math.floor(
      normalize(derived.trendStability, 0, 1.5) * 20
    );

    confidence +=
      direction === "long"
        ? Math.floor(vp * 10)
        : Math.floor(-vp * 10);

    confidence += Math.floor(
      normalize(impulse, 0, 1.5) * 18
    );

    if (marketStrength?.score != null) {
      confidence += Math.min(
        10,
        Math.floor(marketStrength.score * 0.1)
      );
    }

    if (compositeActive) confidence += 6;

    confidence = clamp(confidence, 5, 97);

    let action = "WAIT";
    if (confidence >= CONF_MIN && stops.length === 0)
      action = "ENTER";
    else if (confidence >= CONF_MIN && stops.length > 0)
      action = "AVOID";

    const dot = direction === "long" ? "🟢" : "🔴";

    // primary reference for CT
    if (idx === 0) {
      primaryDirection = direction;
      primaryStops = stops.slice();
    }

    // =======================
    // HTML OUTPUT
    // =======================
    out += `
<div class="entry-block">
  <div class="entry-header">
    <span class="dot">${dot}</span>
    <span class="direction">${direction.toUpperCase()}</span>
    <span class="name">${sig.name}</span>
    <span class="priority">priority ${sig.priority}</span>
  </div>

  <div class="entry-line"><strong>Confidence:</strong> ${confidence}%</div>
  <div class="entry-line"><strong>Action:</strong> ${action}</div>
`;

    if (reasons.length) {
      out += `
  <div class="entry-section">
    <div class="section-title">📌 Context</div>
    ${reasons.map(r => `<div>${r}</div>`).join("")}
  </div>`;
    }

    if (stops.length) {
      out += `
  <div class="entry-section stops">
    <div class="section-title">🧠 Why NOT entering</div>
    ${stops.map(s => `<div>${s}</div>`).join("")}
  </div>`;
    }

    if (warnings.length) {
      out += `
  <div class="entry-section warnings">
    <div class="section-title">⚠ Warnings</div>
    ${warnings.map(w => `<div>${w}</div>`).join("")}
  </div>`;
    }

    out += `</div>`;
  });

  el.innerHTML = out;

  // =======================
  // COUNTER-TREND ENGINE
  // =======================
  if (!ctEl) return;

  const ct = runCTEngine({
    direction: primaryDirection,
    derived,
    data,
    recent,
    primaryStops,
  });

  // ❗ SAFE HANDLING (NO trim)
  if (!ct || ct.active !== true) {
    const reasons = Array.isArray(ct?.reason)
      ? ct.reason
      : ["Counter-trend conditions not satisfied"];

    ctEl.innerHTML = `
<div class="ct-block ct-muted">
  <div class="ct-header">🚫 COUNTER-TREND NOT ACTIVE</div>
  <div class="ct-section">
    ${reasons.map(r => `<div>• ${r}</div>`).join("")}
  </div>
</div>`;
    return;
  }

  // ACTIVE CT
  if (typeof ct.html === "string") {
    ctEl.innerHTML = ct.html;
  } else {
    ctEl.innerHTML = `
<div class="ct-block ct-muted">
  Counter-trend active but no renderable HTML
</div>`;
  }
}
