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

export function renderEntrySignals({
  activeEntrySignals,
  compositeActive,
  marketStrength,
  data,
}) {
  const el = document.getElementById("outputFuaters");
  if (!el) return;

  if (!activeEntrySignals || activeEntrySignals.length === 0) {
    el.innerHTML =
      `<div class="no-signals">No valid entry conditions detected</div>`;
    const ctEl = document.getElementById("outputCt");
    if (ctEl) {
      ctEl.innerHTML = `<div>No valid entry conditions detected</div>`;
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

  // будемо використовувати перший сигнал як базовий для CT
  let primaryDirection = activeEntrySignals[0]?.type ?? "long";
  let primaryStops = [];

  // =======================
  // MAIN LOOP
  // =======================
  activeEntrySignals.forEach((sig, idx) => {
    let direction = sig.type;
    const reasons = [];
    const warnings = [];
    const stops = [];

    const impulse =
      direction === "long" ? derived.impulseLong : derived.impulseShort;
    const vp = derived.volumePressure;

    // AUTO-FLIP
    if (
      sig.context === "reversal" &&
      derived.trendStability > 0.85 &&
      impulse < 0.22
    ) {
      direction = direction === "long" ? "short" : "long";
      warnings.push("Auto-flip: strong dominant trend vs weak reversal impulse");
    }

    // CONTEXT REASONS (чисто опис)
    switch (sig.context) {
      case "trend_add":
        reasons.push("Trend-following continuation setup");
        break;
      case "reversal":
        reasons.push("Mean-reversion / reversal setup");
        break;
      case "htf_add":
        reasons.push("Higher timeframe confirmation");
        break;
      case "range":
        reasons.push("Range-based setup");
        break;
      case "breakout":
        reasons.push("Breakout setup: volatility expansion and structure violation");
        break;
      case "breakdown":
        reasons.push("Breakdown setup: structural failure and momentum shift");
        break;
      case "pullback":
        reasons.push("Pullback entry into dominant trend");
        break;
      case "momentum":
        reasons.push("Momentum ignition setup");
        break;
      case "volatility":
        reasons.push("Volatility compression / expansion setup");
        break;
      case "liquidity_grab":
        reasons.push("Liquidity grab / stop-hunt reversal");
        break;
      case "sweep":
        reasons.push("Local sweep of highs/lows — potential reversal zone");
        break;
      case "compression":
        reasons.push("Price compression — potential breakout zone");
        break;
      case "exhaustion":
        reasons.push("Trend exhaustion — weakening impulse and structure");
        break;
      case "imbalanced":
        reasons.push("Orderflow imbalance detected");
        break;
      default:
        reasons.push("General market condition setup");
        break;
    }

    // IMPULSE STOP
    let impulseStop = 0.04;
    switch (sig.context) {
      case "htf_add": impulseStop = 0.03; break;
      case "trend_add": impulseStop = 0.05; break;
      case "reversal": impulseStop = 0.08; break;
      case "range": impulseStop = 0.02; break;
      case "momentum": impulseStop = 0.05; break;
      case "volatility": impulseStop = 0.04; break;
    }

    if (impulse < impulseStop) warnings.push("Impulse weak for this context");

    // HARD STOPS
    if (derived.trendStability < 0.08) stops.push("Market structure unstable");
    if (derived.volatilityRegime > 2.3) stops.push("Extreme volatility regime");
    if (derived.retracementRisk > 1.95) stops.push("Retracement risk extremely high");
    if (marketStrength?.score != null && marketStrength.score < 20)
      stops.push("Weak global market environment");
    if (direction === "long" && vp < -0.55) stops.push("Strong sell-side dominance");
    if (direction === "short" && vp > 0.55) stops.push("Strong buy-side dominance");

    // SOFT WARNINGS
    if (derived.retracementRisk > 1.5) warnings.push("High retracement risk");
    if (marketStrength?.score != null && marketStrength.score < 20)
      warnings.push("Weak global market environment");
    if (derived.volatilityRegime > 1.8) warnings.push("Elevated volatility regime");
    if (direction === "long" && vp < -0.4) warnings.push("Sell pressure against long");
    if (direction === "short" && vp > 0.4) warnings.push("Buy pressure against short");

    // CONFIDENCE ENGINE
    let conf = 40;

    conf += sig.priority * 5;
    if (sig.context === "trend_add") conf += 12;
    if (sig.context === "reversal") conf += 8;
    if (sig.context === "htf_add") conf += 10;

    conf += Math.floor(normalize(derived.trendStability, 0, 1.5) * 20);
    conf += direction === "long" ? Math.floor(vp * 10) : Math.floor(-vp * 10);
    conf += Math.floor(normalize(impulse, 0, 1.5) * 18);

    const volNorm = normalize(derived.volatilityRegime, 0.5, 2.5);
    conf -= Math.floor(Math.abs(volNorm - 0.5) * 10);

    if (marketStrength?.score != null)
      conf += Math.min(10, Math.floor(marketStrength.score * 0.10));

    if (compositeActive) conf += 6;

    // CONTEXT IMPACT (після створення conf)
    switch (sig.context) {
      case "breakout":
        conf += 8;
        if (derived.volatilityRegime < 1.0)
          warnings.push("Low volatility — breakout may fail");
        if (impulse < 0.3)
          warnings.push("Weak impulse for breakout");
        break;

      case "breakdown":
        conf += 8;
        if (impulse < 0.25)
          warnings.push("Weak downside impulse for breakdown");
        break;

      case "pullback":
        conf += 5;
        if (derived.retracementRisk > 1.4)
          warnings.push("Pullback may extend deeper");
        break;

      case "momentum":
        conf += 7;
        if (impulse < 0.35)
          warnings.push("Momentum insufficient for ignition");
        break;

      case "volatility":
        if (derived.volatilityRegime > 2.0) {
          warnings.push("Volatility too high — unstable environment");
          conf -= 6;
        }
        break;

      case "liquidity_grab":
        conf += 4;
        if (derived.trendStability > 1.0)
          warnings.push("Strong trend — liquidity grab may fail");
        break;

      case "sweep":
        conf += 5;
        if (derived.retracementRisk > 1.6)
          warnings.push("Sweep may continue deeper");
        break;

      case "compression":
        conf += 6;
        if (derived.volatilityRegime < 0.8)
          warnings.push("Compression weak — may continue ranging");
        break;

      case "exhaustion":
        conf += 4;
        if (impulse > 0.5)
          warnings.push("Impulse still strong — exhaustion uncertain");
        break;

      case "imbalanced":
        conf += 5;
        if (Math.abs(vp) < 0.25)
          warnings.push("Imbalance weak — may normalize");
        break;
    }

    conf = clamp(conf, 5, 97);

    // FINAL ACTION
    let action = "WAIT";
    if (conf >= CONF_MIN && stops.length === 0) action = "ENTER";
    else if (conf >= CONF_MIN && stops.length > 0) action = "AVOID";

    const dot = direction === "long" ? "🟢" : "🔴";

    // збережемо перший сигнал як базовий для CT
    if (idx === 0) {
      primaryDirection = direction;
      primaryStops = stops.slice();
    }

    // =======================
    // HTML BLOCK
    // =======================
    out += `
<div class="entry-block">

  <div class="entry-header">
    <span class="dot">${dot}</span>
    <span class="direction">${direction.toUpperCase()}</span>
    <span class="name">${sig.name}</span>
    <span class="priority">priority ${sig.priority}</span>
  </div>

  <div class="entry-line"><strong>Confidence:</strong> ${conf}%</div>
  <div class="entry-line"><strong>Action:</strong> ${action}</div>
`;

    if (reasons.length) {
      out += `
  <div class="entry-section">
    <div class="section-title">📌 Context:</div>
    ${reasons.map(r => `<div>${r}</div>`).join("")}
  </div>`;
    }

    if (stops.length) {
      out += `
  <div class="entry-section stops">
    <div class="section-title">🧠 Why NOT entering:</div>
    ${stops.map(s => `<div>${s}</div>`).join("")}
  </div>`;
    }

    if (warnings.length) {
      out += `
  <div class="entry-section warnings">
    <div class="section-title">⚠ Warnings:</div>
    ${warnings.map(w => `<div>${w}</div>`).join("")}
  </div>`;
    }

    out += `</div>`;
  });

  // один раз оновлюємо DOM
  el.innerHTML = out;

  // =======================
  // COUNTER-TREND ENGINE
  // =======================
  const ctHTML = runCTEngine({
    direction: primaryDirection,
    derived,
    data,
    recent,
    stops: primaryStops,
  });

  const ctEl = document.getElementById("outputCt");
  if (ctEl) {
    ctEl.innerHTML =
      ctHTML && ctHTML.trim().length > 0
        ? ctHTML
        : `<div>No valid entry conditions detected</div>`;
  }
}