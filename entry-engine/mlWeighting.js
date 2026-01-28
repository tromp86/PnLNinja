// mlWeighting.js
// =======================
// ML-LIKE WEIGHTING CORE
// =======================

import { clamp, normalize } from "./marketUtils.js";

// Базові "людські" ваги — seed для ML
const BASE_WEIGHTS = {
  weakImpulse: 8,
  weakTrend: 8,
  absorption: 12,
  htfExhaustion: 6,
  wickSignal: 7,
  rsiDiv: 10,
  structureShift: 6,
};

// Пам'ять попередніх ваг для згладжування між тиками
export let previousWeights = {};

// =======================
// REGIME ADJUSTMENTS
// =======================

function regimeMultiplier({ volatilityRegime, trendStability }) {
  return {
    wickSignal:
      volatilityRegime > 2.0 ? 0.6 :
      volatilityRegime < 1.0 ? 1.2 : 1.0,

    rsiDiv:
      trendStability < 0.4 ? 1.3 :
      trendStability > 0.9 ? 0.5 : 1.0,

    absorption:
      volatilityRegime > 1.8 ? 1.3 : 1.0,

    weakImpulse:
      trendStability > 0.8 ? 0.6 : 1.1,

    weakTrend:
      trendStability < 0.35 ? 1.4 : 1.0,

    htfExhaustion:
      volatilityRegime < 1.2 ? 1.2 : 1.0,

    structureShift:
      volatilityRegime > 2.2 ? 0.7 : 1.0,
  };
}

// =======================
// CONTEXT BOOST
// =======================

function contextBoost(signal, context = {}) {
  if (!context) return 1.0;

  const { direction, marketStrength, volatilityRegime } = context;
  let boost = 1.0;

  if (signal === "absorption" && marketStrength?.score < 25)
    boost += 0.2;

  if (signal === "rsiDiv" && direction === "counter")
    boost += 0.15;

  if (signal === "wickSignal" && volatilityRegime > 2.0)
    boost -= 0.2;

  return clamp(boost, 0.5, 1.5);
}

// =======================
// TREND CONTEXT
// =======================

function getTrendContext(trendStability) {
  if (trendStability > 0.75) return "strongTrend";
  if (trendStability < 0.35) return "weakTrend";
  return "chop";
}

// =======================
// MAIN WEIGHT ENGINE
// =======================

export function computeMLWeights({
  signals,      // array of active signal keys
  derived,      // derived metrics (volatilityRegime, trendStability, RSI, volume, avgVolume, ...)
  context = {}, // { direction, marketStrength, debug }
  mode = "adaptive", // static | adaptive | future-ml
}) {
  const weights = {};
  const regime = regimeMultiplier(derived);
  const trendContext = getTrendContext(derived.trendStability);

  // 1) Базові ваги + режим + контекст
  signals.forEach(signal => {
    let w = BASE_WEIGHTS[signal] || 0;

    if (mode !== "static") {
      w *= regime[signal] ?? 1.0;
      w *= contextBoost(signal, {
        ...context,
        volatilityRegime: derived.volatilityRegime,
      });
    }

    weights[signal] = w;
  });

  // 2) Direction asymmetry (short більш агресивний)
  if (context.direction === "short") {
    if (weights.wickSignal) weights.wickSignal *= 1.15;
    if (weights.absorption) weights.absorption *= 1.10;
  }

  // 3) Trend context adjustments
  if (trendContext === "strongTrend") {
    if (weights.weakImpulse) weights.weakImpulse *= 0.8;
    if (weights.weakTrend) weights.weakTrend *= 0.8;
  } else if (trendContext === "weakTrend") {
    if (weights.weakTrend) weights.weakTrend *= 1.2;
    if (weights.rsiDiv) weights.rsiDiv *= 1.1;
  } else if (trendContext === "chop") {
    if (weights.wickSignal) weights.wickSignal *= 1.1;
  }

  // 4) Momentum factor (RSI)
  if (typeof derived.RSI === "number") {
    if (derived.RSI > 70 || derived.RSI < 30) {
      if (weights.rsiDiv) weights.rsiDiv *= 1.25;
    }
  }

  // 5) Anti-noise filter (low volume)
  if (typeof derived.volume === "number" && typeof derived.avgVolume === "number") {
    if (derived.volume < derived.avgVolume * 0.6) {
      if (weights.wickSignal) weights.wickSignal *= 0.7;
      if (weights.absorption) weights.absorption *= 0.8;
    }
  }

  // 6) Signal synergy
  const has = key => signals.includes(key);

  if (has("weakTrend") && has("rsiDiv")) {
    if (weights.rsiDiv) weights.rsiDiv += 3;
    if (weights.weakTrend) weights.weakTrend += 3;
  }

  if (has("absorption") && has("wickSignal")) {
    if (weights.absorption) weights.absorption += 2;
  }

  if (has("structureShift") && has("rsiDiv")) {
    if (weights.structureShift) weights.structureShift += 2;
  }

  // 7) Volatility dampening (логарифмічне згладжування)
  const volReg = derived.volatilityRegime ?? 1.0;
  const volDamp = 1 / Math.log(volReg + 2); // м'яке згладжування

  Object.keys(weights).forEach(k => {
    weights[k] *= volDamp;
  });

  // 8) Confidence decay при надто великій кількості сигналів
  if (signals.length >= 5) {
    Object.keys(weights).forEach(k => {
      weights[k] *= 0.85;
    });
  }

  // 9) Нормалізація ваг у діапазон 1–25
  const rawValues = signals.map(s => weights[s] || 0);
  const normalized = normalize(rawValues, 1, 25);

  signals.forEach((s, i) => {
    weights[s] = clamp(Math.round(normalized[i]), 1, 25);
  });

  // 10) Згладжування між тиками (simple EMA 0.5)
  const smoothed = {};
  signals.forEach(s => {
    const prev = previousWeights[s] ?? weights[s];
    smoothed[s] = Math.round((weights[s] + prev) / 2);
  });

  previousWeights = { ...smoothed };

  // 11) Debug-логування
  if (context.debug) {
    // eslint-disable-next-line no-console
    console.table({
      regime,
      trendContext,
      raw: weights,
      smoothed,
    });
  }

  return smoothed;
}

// =======================
// FUTURE ML STUB
// =======================

export function predictMLWeight({ signal, features }) {
  // 🔮 тут пізніше:
  // return mlModel.predict(features)

  // поки fallback:
  return BASE_WEIGHTS[signal] || 5;
}