// =======================
// ✅ ENTRY SIGNALS RENDERER
// =======================
export function renderEntrySignals({
  activeEntrySignals,
  compositeActive,
  marketStrength,
  data,
}) {
  let entrySignalsText = "";

  if (activeEntrySignals.length === 0) {
    entrySignalsText +=
      "No valid entry conditions detected (умови для входу відсутні).\n";
    return entrySignalsText;
  }

// =======================
// DERIVED CONTEXT METRICS
// =======================
const derived = {
  trendStability: calcTrendStability(data),
  impulseQuality: calcImpulseQuality(data),
  retracementRisk: calcRetracementRisk(data),
  volumePressure: calcVolumePressure(data),
  volatilityRegime: calcVolatilityRegime(data),
};



  // =======================
  // ENTRY SIGNALS LOOP
  // =======================
  activeEntrySignals.forEach((sig) => {
    const star = sig.priority === 5 ? "⭐ " : "";
    const typeColor = sig.type === "long" ? "🟢 LONG" : "🔴 SHORT";

    const contextIcons = {
      trend: "📈",
      squeeze: "🧨",
      range: "📊",
      sr: "📉",
      intraday: "⏱️",
      reversion: "🔄",
      volatility: "🌪️",
      momentum: "⚡",
    };
    const ctxIcon = contextIcons[sig.context] || "•";

    const boost = compositeActive ? " (+Composite Boost)" : "";

    // ENTRY PRICE
    const entryPrice = sig.entryPrice ? sig.entryPrice(data) : data.Price;

    // =======================
    // BASIC STOP/TP (без адаптивних)
    // =======================
    const { stopHigh, tp1 } = basicStops(sig, data, entryPrice);

// =======================
// ENTRY VALIDITY REASONS / WARNINGS
// =======================
const reasons = [];
const warnings = [];

if (derived.trendStability > 0.6 && sig.context === "trend")
  reasons.push("Strong trend alignment");

if (derived.volumePressure > 1.2)
  reasons.push("Positive volume pressure");

if (derived.impulseQuality > 0.55)
  reasons.push("Healthy impulse structure");

if (derived.retracementRisk > 1.4)
  warnings.push("High retracement risk");

if (derived.volatilityRegime > 1.3)
  warnings.push("High volatility regime");

if (marketStrength.score < 30)
  warnings.push("Weak market environment");
    // =======================
    // CONFIDENCE (без quality engine)
    // =======================
    let confidence = 45;

    confidence += sig.priority * 4;

    if (sig.context === "trend") confidence += 8;
    if (sig.context === "reversion") confidence += 4;
    if (sig.context === "intraday") confidence += 6;
    if (sig.context === "momentum") confidence += 9;

    confidence += Math.min(15, Math.floor(marketStrength.score * 0.15));

    if (compositeActive) confidence += 6;

    confidence = Math.max(5, Math.min(95, confidence));

    // =======================
    // OUTPUT
    // =======================
    entrySignalsText += `${star}${typeColor} | ${ctxIcon} ${sig.name} (priority ${sig.priority})${boost}\n`;

//     entrySignalsText += `
// <div class="signal-block">
//   <div class="sb-item"><span>entry:</span> <strong>${Number(entryPrice).toFixed(2)}</strong></div>
//   <div class="sb-item"><span>stop:</span> <strong>${Number(stopHigh).toFixed(2)}</strong></div>
//   <div class="sb-item"><span>tp1:</span> <strong>${Number(tp1).toFixed(2)}</strong></div>
//   <div class="sb-item"><span>confidence:</span> <strong>${confidence}%</strong></div>
// </div>
// `;

    if (reasons.length > 0) {
      entrySignalsText += `<div class="reasons">Reasons: ${reasons.join(", ")}</div>`;
    }

    if (warnings.length > 0) {
      entrySignalsText += `<div class="warnings">Warnings: ${warnings.join(", ")}</div>`;
    }
  });

  return entrySignalsText;
}

// =======================
// HELPERS
// =======================

function basicStops(sig, data, entryPrice) {
  const atr = data.ATR || 0;
  let stopHigh, tp1;

  if (sig.type === "long") {
    stopHigh = entryPrice - atr * 0.5;
    tp1 = entryPrice + atr;
  } else {
    stopHigh = entryPrice + atr * 0.5;
    tp1 = entryPrice - atr;
  }

  return { stopHigh, tp1 };
}

// =======================
// DERIVED METRICS
// =======================

function calcTrendStability(data) {
  const slope = Math.abs(data.EMA21 - data.EMA50) / (data.ATR || 1);
  const chop = data.chopIndex || 0.5;
  return slope * (1 - chop);
}

function calcImpulseQuality(data) {
  const body = Math.abs(data.Close - data.Open);
  const range = data.High - data.Low;
  const volume = data.Volume || 1;
  return (body / range) * Math.log(volume + 1);
}

function calcRetracementRisk(data) {
  const dist = Math.abs(data.Price - data.SwingHigh);
  return dist / (data.ATR || 1);
}

function calcVolumePressure(data) {
  return (data.buyVolume || 1) / (data.sellVolume + 1);
}

function calcVolatilityRegime(data) {
  return (data.ATR || 1) / (data.ATR_smooth || 1);
}