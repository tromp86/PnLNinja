// /entry-engine
// │
// ├─ renderEntrySignals.js        // головний рендер + orchestration
// │
// ├─ contexRender/
// │   └─ extractRecentContext.js
// │
// ├─ metricsRender/
// │   ├─ trendStability.js
// │   ├─ impulseQuality.js
// │   ├─ retracementRisk.js
// │   ├─ volumePressure.js
// │   ├─ volatilityRegime.js
// │
// ├─ ct/
// │   ├─ counterTrendEngine.js
// │   └─ ctLevels.js
// │
// ├─ utils/
// │   ├─ math.js
// │   ├─ stats.js
// │   └─ market.js


export function renderEntrySignals({
  activeEntrySignals,
  compositeActive,
  marketStrength,
  data,
}) {
  if (!activeEntrySignals || activeEntrySignals.length === 0) {
    return "No valid entry conditions detected (умови для входу відсутні).";
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

  // =======================
  // MAIN LOOP
  // =======================
  activeEntrySignals.forEach((sig) => {
    let direction = sig.type;
    const reasons = [];
    const warnings = [];
    const stops = [];

    const impulse =
      direction === "long" ? derived.impulseLong : derived.impulseShort;
    const vp = derived.volumePressure;

    // =======================
    // AUTO-FLIP (soft)
    // =======================
    if (
      sig.context === "reversal" &&
      derived.trendStability > 0.85 &&
      impulse < 0.22
    ) {
      direction = direction === "long" ? "short" : "long";
      warnings.push("Auto-flip: strong dominant trend vs weak reversal impulse");
    }

    // =======================
    // CONTEXT REASONS
    // =======================
    if (sig.context === "trend_add") {
      reasons.push("Trend-following continuation setup");
    }

    if (sig.context === "reversal") {
      reasons.push("Mean-reversion / reversal setup");
    }

    if (sig.context === "htf_add") {
      reasons.push("Higher timeframe confirmation");
    }

    if (sig.context === "range") {
      reasons.push("Range-based setup");
    }

    // ============================================================
    // 🔥 CONTEXT-DEPENDENT IMPULSE STOP (ВАРІАНТ D)
    // ============================================================
    let impulseStop = 0.04;
    let impulseWarn = 0.18;

    switch (sig.context) {
      case "htf_add":
        impulseStop = 0.03;
        impulseWarn = 0.10;
        break;

      case "trend_add":
        impulseStop = 0.05;
        impulseWarn = 0.15;
        break;

      case "reversal":
        impulseStop = 0.08;
        impulseWarn = 0.20;
        break;

      case "range":
        impulseStop = 0.02;
        impulseWarn = 0.10;
        break;

      case "momentum":
        impulseStop = 0.05;
        impulseWarn = 0.15;
        break;

      case "volatility":
        impulseStop = 0.04;
        impulseWarn = 0.12;
        break;
    }

if (impulse < impulseStop) {
  warnings.push("Impulse weak for this context");
}


// =======================
// OTHER HARD STOPS
// =======================
if (derived.trendStability < 0.08)
  stops.push("Market structure unstable");

if (derived.volatilityRegime > 2.3)
  stops.push("Extreme volatility regime");

if (derived.retracementRisk > 1.95)
  stops.push("Retracement risk extremely high");

if (marketStrength?.score != null && marketStrength.score < 20)
  stops.push("Weak global market environment");

if (direction === "long" && vp < -0.55)
  stops.push("Strong sell-side dominance");

if (direction === "short" && vp > 0.55)
  stops.push("Strong buy-side dominance");

// =======================
// SOFT WARNINGS (expanded)
// =======================
if (derived.retracementRisk > 1.5)
  warnings.push("High retracement risk");

if (marketStrength?.score != null && marketStrength.score < 20)
  warnings.push("Weak global market environment");

if (derived.volatilityRegime > 1.8)
  warnings.push("Elevated volatility regime");

if (direction === "long" && vp < -0.4)
  warnings.push("Sell pressure against long");

if (direction === "short" && vp > 0.4)
  warnings.push("Buy pressure against short");

    // =======================
    // CONFIDENCE ENGINE
    // =======================
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

    conf = clamp(conf, 5, 97);

    // =======================
    // FINAL ACTION
    // =======================
    let action = "WAIT";
    if (conf >= CONF_MIN && stops.length === 0) action = "ENTER";
    else if (conf >= CONF_MIN && stops.length > 0) action = "AVOID";

    // =======================
    // OUTPUT
    // =======================
    const dot = direction === "long" ? "🟢" : "🔴";

    out += `
${dot} ${direction.toUpperCase()} | ${sig.name} (priority ${sig.priority})

Confidence: ${conf}%
➡ Action: ${action}
`;

    if (reasons.length) {
      out += `
📌 Context: ${reasons.join("\n- ")}
`;
    }

    if (stops.length) {
      out += `
🧠 Why NOT entering: ${stops.join("\n- ")}
`;
    }

    if (warnings.length) {
      out += `
⚠ Warnings: ${warnings.join("\n- ")}
`;
    }


    // ============================================================
    // 🔥 ADVANCED COUNTER-TREND (7 FACTORS, RELAXED)
    // ============================================================
    const ctWarnings = [];
    let ctConf = 0;
    let ctAction = "WAIT";
    let ctDirection = direction;

    const CT_CONF_MIN = 48; // м’якший поріг для контр-тренду

    // 1. Weak impulse (м’якше)
    const weakImpulse = impulse < 0.22;

    // 2. Weak trend structure
    const weakTrend = derived.trendStability < 0.40;

    // 3. Absorption (volume pressure against direction, м’якше)
    const absorption =
      (direction === "long" && vp < -0.1) ||
      (direction === "short" && vp > 0.1);

    // 4. HTF exhaustion
    const htfExhaustion =
      data.higherTF?.atrSlope < 0 || data.higherTF?.momentum < 0;

    // 5. Wick dominance (м’якше: 25% замість 40%)
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

    // 6. RSI divergence
    const rsiDiv =
      (direction === "long" &&
        data.RSI < data.prevRSI &&
        data.Price > data.prevPrice) ||
      (direction === "short" &&
        data.RSI > data.prevRSI &&
        data.Price < data.prevPrice);

    // 7. Micro-structure shift
    const structureShift =
      (direction === "long" &&
        data.localLow > data.prevLocalLow) ||
      (direction === "short" &&
        data.localHigh < data.prevLocalHigh);

    // Count active CT factors (м’якше: ≥2)
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

      // CT confidence (м’якше, але структурно схоже)
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

      // Reverse direction
      ctDirection = direction === "long" ? "short" : "long";

      // CT action (по відношенню до CT_CONF_MIN, НЕ до CONF_MIN)
      if (ctConf >= CT_CONF_MIN) ctAction = "ENTER";
      else ctAction = "WATCH";

      out += `
🔄 COUNTER-TREND | ${ctDirection.toUpperCase()}
Confidence: ${ctConf}%
➡ Action: ${ctAction}
⚠: ${ctWarnings.join("\n- ")}
`;
    }

    // ============================================================
    // 🔥 CT-ENGINE (Balanced Position Building, RELAXED ACTIVATION)
    // ============================================================
    if (ctFactors >= 2) {
      const atr = estimateATR(data);
      const lastClose = getLastClose(data);
      const riskUnit = atr || (lastClose * 0.01) || 1;

      const engineDir = direction === "long" ? "short" : "long";

      // CT MODES
      const CT_MODE = "Balanced"; // "Aggressive" | "Balanced" | "Conservative"

      const CT_MULT = {
        Aggressive: {
          entry: 0.5,
          add: 0.8,
          confirm: 0.1,
          stop: 1.6,
          target: 3.2,
        },
        Balanced: {
          entry: 0.3,
          add: 0.4,
          confirm: 0.2,
          stop: 1.2,
          target: 2.4,
        },
        Conservative: {
          entry: 0.15,
          add: 0.25,
          confirm: 0.3,
          stop: 0.9,
          target: 1.8,
        },
      }[CT_MODE];

      const ctEntryPrice =
        engineDir === "long"
          ? lastClose - riskUnit * CT_MULT.entry
          : lastClose + riskUnit * CT_MULT.entry;

      const ctConfirmPrice =
        engineDir === "long"
          ? lastClose + riskUnit * CT_MULT.confirm
          : lastClose - riskUnit * CT_MULT.confirm;

      const ctAddPrice =
        engineDir === "long"
          ? ctEntryPrice - riskUnit * CT_MULT.add
          : ctEntryPrice + riskUnit * CT_MULT.add;

      const ctStopPrice =
        engineDir === "long"
          ? ctEntryPrice - riskUnit * CT_MULT.stop
          : ctEntryPrice + riskUnit * CT_MULT.stop;

      const ctTargetPrice =
        engineDir === "long"
          ? ctEntryPrice + riskUnit * CT_MULT.target
          : ctEntryPrice - riskUnit * CT_MULT.target;

      let ctEngineAction = "WATCH";

      // ВАЖЛИВО: CT-ENGINE МОЖЕ ПРАЦЮВАТИ НАВІТЬ ПРИ STOPS,
      // але якщо stops.length > 0 — ми не даємо ENTER_PARTIAL, тільки WATCH/CONFIRM
      const hasHardStops = stops.length > 0;

      if (ctConf >= CT_CONF_MIN && !hasHardStops) {
        ctEngineAction = "Enter";
      } else if (ctConf >= CT_CONF_MIN - 6) {
        ctEngineAction = "Wait";
      }

//       out += `
// ⚙️ CT-ENGINE (Balanced) | ${engineDir.toUpperCase()}
// CT-Engine Confidence: ${ctConf}%
// ➡ CT-Engine Action: ${ctEngineAction}

// 📌 CT Position Levels:
// - Entry (partial): ${ctEntryPrice.toFixed(6)}
// - Add (scale-in): ${ctAddPrice.toFixed(6)}
// - Confirm level: ${ctConfirmPrice.toFixed(6)}
// - Stop (structure/ATR): ${ctStopPrice.toFixed(6)}
// - Target (RR≈2:1): ${ctTargetPrice.toFixed(6)}

// 🧩 CT Factors Triggered: ${ctFactors}/7
// `;
    }


  });

  return out;
}



// =======================
// CONTEXT EXTRACTION
// =======================
function extractRecentContext(data, lookbackCount = 12) {
  if (!data) return {};
  if (Array.isArray(data.candles) && data.candles.length > 0) {
    return { ...data, candles: data.candles.slice(-lookbackCount) };
  }
  if (Array.isArray(data.klines) && data.klines.length > 0) {
    return { ...data, klines: data.klines.slice(-lookbackCount) };
  }
  return data;
}

// =======================
// INTERNAL METRICS
// =======================

function calcTrendStability(data) {
  const candles = data.candles || data.klines;
  if (!Array.isArray(candles) || candles.length < 3) {
    const atr = Math.max(data.ATR ?? 1, 1);
    const emaDiff = Math.abs(
      (data.EMA21 ?? data.Price) - (data.EMA50 ?? data.Price)
    );
    const chop = data.chopIndex ?? 0.5;
    return (emaDiff / (atr * 8)) * (1 - chop);
  }

  const closes = candles.map(c => c.Close ?? c.close ?? c[4]).filter(isFinite);
  if (closes.length < 3) return 0.4;

  const n = closes.length;
  const xs = Array.from({ length: n }, (_, i) => i);
  const corr = Math.abs(pearsonCorrelation(xs, closes)); // симетрично для ап/даун

  const atrs = candles.map(c => c.ATR ?? c.atr).filter(isFinite);
  const avgAtr =
    atrs.length > 0
      ? atrs.reduce((a, b) => a + b, 0) / atrs.length
      : data.ATR ?? 1;

  const avgPrice =
    closes.reduce((a, b) => a + b, 0) / Math.max(closes.length, 1);
  const atrRatio = avgAtr / Math.max(avgPrice, 1);

  const stabilityFromAtr = 1 / (1 + atrRatio * 20); // 0–1

  return corr * 0.7 + stabilityFromAtr * 0.3;
}

function calcImpulseQuality(data, direction) {
  const candles = data.candles || data.klines;
  if (!Array.isArray(candles) || candles.length === 0) {
    const open = data.Open ?? data.Price;
    const close = data.Close ?? data.Price;
    const high = data.High ?? close;
    const low = data.Low ?? open;
    const volume = Math.max(data.Volume ?? data.volume ?? 1, 1);

    const range = Math.max(high - low, Math.abs(close) * 0.001, 1e-6);
    let body = close - open;

    if (direction === "long") {
      body = Math.max(body, 0);
    } else {
      body = Math.max(open - close, 0);
    }

    const bodyRatio = body / range;
    const volBoost = Math.log(volume + 1);

    return bodyRatio * volBoost;
  }

  const last = candles[candles.length - 1];
  const open = last.Open ?? last.open ?? last[1];
  const close = last.Close ?? last.close ?? last[4];
  const high = last.High ?? last.high ?? last[2];
  const low = last.Low ?? last.low ?? last[3];
  const volume = last.Volume ?? last.volume ?? last[5] ?? 1;

  const range = Math.max(high - low, Math.abs(close) * 0.001, 1e-6);
  let body = close - open;

  if (direction === "long") {
    body = Math.max(body, 0);
  } else {
    body = Math.max(open - close, 0);
  }

  const bodyRatio = body / range;
  const volBoost = Math.log(volume + 1);

  return bodyRatio * volBoost;
}

function calcRetracementRisk(data) {
  const price = data.Price ?? data.Close ?? data.Last ?? getLastClose(data);
  const atr = data.ATR || estimateATR(data) || 1;

  const swingHigh = data.SwingHigh;
  const swingLow = data.SwingLow;

  if (swingHigh == null && swingLow == null) {
    return 0.5;
  }

  let ref;
  if (swingHigh != null && swingLow != null) {
    const distHigh = Math.abs(price - swingHigh);
    const distLow = Math.abs(price - swingLow);
    ref = distHigh < distLow ? swingHigh : swingLow;
  } else {
    ref = swingHigh ?? swingLow;
  }

  return Math.abs(price - ref) / atr;
}

// symmetric volume pressure: -1..+1
function calcVolumePressureSymmetric(data) {
  const candles = data.candles || data.klines;

  let buy = 0;
  let sell = 0;

  if (Array.isArray(candles) && candles.length > 0) {
    candles.forEach(c => {
      const open = c.Open ?? c.open ?? c[1];
      const close = c.Close ?? c.close ?? c[4];
      const vol = c.Volume ?? c.volume ?? c[5] ?? 0;

      if (!isFinite(open) || !isFinite(close) || !isFinite(vol)) return;

      if (close > open) buy += vol;
      else if (close < open) sell += vol;
      else {
        buy += vol * 0.5;
        sell += vol * 0.5;
      }
    });
  } else {
    buy = data.buyVolume ?? 0;
    sell = data.sellVolume ?? 0;
  }

  const total = buy + sell;
  if (total <= 0) return 0;

  // -1 (pure sell) → +1 (pure buy)
  return (buy - sell) / total;
}

function calcVolatilityRegime(data) {
  const candles = data.candles || data.klines;

  if (Array.isArray(candles) && candles.length >= 5) {
    const ranges = candles
      .map(c => {
        const high = c.High ?? c.high ?? c[2];
        const low = c.Low ?? c.low ?? c[3];
        return isFinite(high) && isFinite(low) ? Math.abs(high - low) : null;
      })
      .filter(v => v != null);

    if (ranges.length >= 5) {
      const mean =
        ranges.reduce((a, b) => a + b, 0) / Math.max(ranges.length, 1);
      const variance =
        ranges.reduce((a, b) => a + (b - mean) ** 2, 0) /
        Math.max(ranges.length - 1, 1);
      const std = Math.sqrt(variance);

      return std / Math.max(mean, 1e-6);
    }
  }

  const atr = data.ATR || 1;
  const atrSmooth = data.ATR_smooth || data.ATR || 1;
  return atr / atrSmooth;
}

// =======================
// HELPERS
// =======================

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function normalize(v, min, max) {
  if (max === min) return 0.5;
  return clamp((v - min) / (max - min), 0, 1);
}

function pearsonCorrelation(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;

  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = xs[i] - xMean;
    const dy = ys[i] - yMean;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY) || 1;
  return num / den;
}

function getLastClose(data) {
  const candles = data.candles || data.klines;
  if (!Array.isArray(candles) || candles.length === 0)
    return data.Price ?? data.Close;
  const last = candles[candles.length - 1];
  return last.Close ?? last.close ?? last[4];
}

function estimateATR(data) {
  const candles = data.candles || data.klines;
  if (!Array.isArray(candles) || candles.length < 2) return data.ATR ?? 1;

  const trs = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const cur = candles[i];

    const prevClose = prev.Close ?? prev.close ?? prev[4];
    const high = cur.High ?? cur.high ?? cur[2];
    const low = cur.Low ?? cur.low ?? cur[3];

    if (!isFinite(prevClose) || !isFinite(high) || !isFinite(low)) continue;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trs.push(tr);
  }

  if (trs.length === 0) return data.ATR ?? 1;

  return trs.reduce((a, b) => a + b, 0) / trs.length;
}