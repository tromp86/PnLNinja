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

    // STOP / TP LOGIC
    let stopLow, stopHigh, tp1;
    const atr = data.ATR || 0;

    if (sig.type === "long") {
      switch (sig.id) {
        case 1:
          stopLow = data.Bollinger_L - atr * 0.3;
          stopHigh = data.Bollinger_L - atr * 0.1;
          tp1 = data.Bollinger_M || data.EMA21 || data.Price;
          break;

        case 2:
          stopLow = data.EMA50 - atr * 0.3;
          stopHigh = data.EMA50;
          tp1 = data.EMA8 || data.EMA21 + atr;
          break;

        case 3:
          stopLow = data.EMA50 - atr * 0.5;
          stopHigh = data.EMA50 - atr * 0.2;
          tp1 = data.EMA21 || data.EMA50 + atr;
          break;

        case 4:
          stopLow = data.VWAP - atr * 0.6;
          stopHigh = data.VWAP - atr * 0.3;
          tp1 = data.VWAP + atr * 0.8;
          break;

        case 5:
          const kLower =
            data.keltnerLower || data.Bollinger_L || data.Price - atr;
          stopLow = kLower - atr * 0.3;
          stopHigh = kLower;
          tp1 = data.Price + atr * 1.0;
          break;

        case 6:
          stopLow = data.keltnerLower - atr * 0.3;
          stopHigh = data.keltnerLower - atr * 0.1;
          tp1 = data.keltnerLower + atr * 1.0;
          break;

        default:
          stopLow = entryPrice - atr;
          stopHigh = entryPrice - atr * 0.5;
          tp1 = entryPrice + atr;
          break;
      }
    }

    if (sig.type === "short") {
      switch (sig.id) {
        case 1:
          stopLow = data.Bollinger_U + atr * 0.1;
          stopHigh = data.Bollinger_U + atr * 0.3;
          tp1 = data.Bollinger_M || data.EMA21 || data.Price;
          break;

        case 2:
          stopLow = data.EMA50;
          stopHigh = data.EMA50 + atr * 0.3;
          tp1 = data.EMA8 || data.EMA21 - atr;
          break;

        case 3:
          stopLow = data.EMA50 + atr * 0.2;
          stopHigh = data.EMA50 + atr * 0.5;
          tp1 = data.EMA21 || data.EMA50 - atr;
          break;

        case 4:
          stopLow = data.VWAP + atr * 0.3;
          stopHigh = data.VWAP + atr * 0.6;
          tp1 = data.VWAP - atr * 0.8;
          break;

        case 5:
          const kUpper =
            data.keltnerUpper || data.Bollinger_U || data.Price + atr;
          stopLow = kUpper;
          stopHigh = kUpper + atr * 0.3;
          tp1 = data.Price - atr * 1.0;
          break;

        case 6:
          stopLow = data.keltnerUpper + atr * 0.1;
          stopHigh = data.keltnerUpper + atr * 0.3;
          tp1 = data.keltnerUpper - atr * 1.0;
          break;

        default:
          stopLow = entryPrice + atr * 0.5;
          stopHigh = entryPrice + atr;
          tp1 = entryPrice - atr;
          break;
      }
    }

let confidence = 45;

// priority
confidence += sig.priority * 4;

// context (м’якше)
if (sig.context === "trend") confidence += 8;
if (sig.context === "reversion") confidence += 4;
if (sig.context === "intraday") confidence += 6;
if (sig.context === "momentum") confidence += 9;

// market strength — з обмеженням
confidence += Math.min(15, Math.floor(marketStrength.score * 0.15));

// composite — не домінує
if (compositeActive) confidence += 6;

// фінальний clamp (ВАЖЛИВО)
confidence = Math.max(5, Math.min(95, confidence));


    // OUTPUT
    entrySignalsText += `${star}${typeColor} | ${ctxIcon} ${sig.name} (priority ${sig.priority})${boost}\n`;

entrySignalsText += `
<div class="signal-block">
  <div class="sb-item"><span>entry:</span> <strong>${Number(entryPrice).toFixed(2)}</strong></div>
  <div class="sb-item"><span>stop:</span> <strong>${Number(stopHigh).toFixed(2)}</strong></div>
  <div class="sb-item"><span>tp1:</span> <strong>${Number(tp1).toFixed(2)}</strong></div>
  <div class="sb-item"><span>confidence:</span> <strong>${confidence}%</strong></div>
</div>
`;

  });

  return entrySignalsText;
}
