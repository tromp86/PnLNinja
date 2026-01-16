export function renderEntrySignals({
  activeEntrySignals,
  compositeActive,
  marketStrength,
  data,
}) {
  if (!activeEntrySignals || activeEntrySignals.length === 0) {
    return "No valid entry conditions detected (умови для входу відсутні).";
  }

  let entrySignalsText = "";

  // =======================
  // ⏱ LAST 2 DAYS ONLY (12 × 4H)
  // =======================
  const recentData = extractRecentContext(data, 12);

  // =======================
  // DERIVED METRICS (CLAMPED)
  // =======================
  const derived = {
    trendStability: clamp(calcTrendStability(recentData), 0.01, 1.5),
    impulseQualityLong: clamp(calcImpulseQuality(recentData, "long"), 0.01, 1.5),
    impulseQualityShort: clamp(calcImpulseQuality(recentData, "short"), 0.01, 1.5),
    retracementRisk: clamp(calcRetracementRisk(recentData), 0.01, 2),
    volumePressure: clamp(calcVolumePressureSymmetric(recentData), -1, 1),
    volatilityRegime: clamp(calcVolatilityRegime(recentData), 0.5, 2),
  };

  const CONFIDENCE_MIN = 65;

  // =======================
  // ENTRY SIGNALS LOOP
  // =======================
  activeEntrySignals.forEach((sig) => {
    let direction = sig.type; // "long" / "short"
    const reasons = [];
    const warnings = [];
    const stops = [];

    // =======================
    // PICK DIRECTIONAL METRICS
    // =======================
    const impulseQuality =
      direction === "long"
        ? derived.impulseQualityLong
        : derived.impulseQualityShort;

    // =======================
    // 🔄 SYMMETRIC AUTO-FLIP (DIVERGENCE VS STRONG TREND)
    // =======================
    if (
      sig.context === "reversal" &&
      sig.name.toLowerCase().includes("divergence") &&
      derived.trendStability > 0.85
    ) {
      direction = direction === "long" ? "short" : "long";
      warnings.push("Auto-flip: divergence against strong dominant trend");
    }

    // =======================
    // CONTEXT LOGIC
    // =======================
    if (sig.context === "trend_add") {
      reasons.push("Trend-following continuation setup");
      if (impulseQuality < 0.35)
        warnings.push("Weak impulse for continuation");
    }

    if (sig.context === "reversal") {
      reasons.push("Mean-reversion / reversal setup");
      if (impulseQuality > 0.7)
        warnings.push("Strong opposing impulse");
    }

    if (sig.context === "htf_add") {
      reasons.push("Higher timeframe confirmation");
      if (derived.trendStability < 0.45)
        warnings.push("Weak local structure");
    }

    // =======================
    // CONFIDENCE ENGINE (BALANCED LONG/SHORT)
    // =======================
    let confidence = 40;

    // Base: signal priority
    confidence += sig.priority * 5;

    // Context weight
    if (sig.context === "trend_add") confidence += 12;
    if (sig.context === "reversal") confidence += 8;
    if (sig.context === "htf_add") confidence += 10;

    // Trend stability: 0–1.5 → 0–20
    confidence += Math.floor(normalize(derived.trendStability, 0, 1.5) * 20);

    // Volume pressure (symmetric: -1..+1)
    // LONG хоче vp > 0, SHORT хоче vp < 0
    const vp = derived.volumePressure; // -1..+1
    if (direction === "long") {
      confidence += Math.floor(vp * 10); // -10..+10
    } else {
      confidence += Math.floor(-vp * 10); // -10..+10, але дзеркально
    }

    // Impulse quality: 0–1.5 → 0–18
    confidence += Math.floor(normalize(impulseQuality, 0, 1.5) * 18);

    // Volatility regime: 0.5–2 → penalize extremes
    const volNorm = normalize(derived.volatilityRegime, 0.5, 2); // 0–1
    const volPenalty = Math.abs(volNorm - 0.5) * 12; // max -6
    confidence -= Math.floor(volPenalty);

    // Market strength
    if (marketStrength?.score != null) {
      confidence += Math.min(12, Math.floor(marketStrength.score * 0.12));
    }

    // Composite confluence
    if (compositeActive) confidence += 6;

    // =======================
    // 🧱 HARD STOP FACTORS (OVERRIDE CONFIDENCE)
    // =======================
    if (impulseQuality < 0.12)
      stops.push("Impulse quality too weak");

    if (derived.trendStability < 0.18)
      stops.push("Trend structure unstable / choppy");

    // Volume pressure: не блокуємо SHORT за sell-dominance
    if (direction === "long" && derived.volumePressure < -0.4)
      stops.push("Sell-side volume dominance against long bias");

    if (direction === "short" && derived.volumePressure > 0.4)
      stops.push("Buy-side volume dominance against short bias");

    if (derived.volatilityRegime > 1.7)
      stops.push("Extreme volatility regime");

    if (marketStrength?.score != null && marketStrength.score < 25)
      stops.push("Weak global market environment");

    confidence = clamp(confidence, 5, 97);

    // =======================
    // 🔥 FINAL ACTION DECISION
    // =======================
    let action = "WAIT";

    if (confidence >= CONFIDENCE_MIN && stops.length === 0) {
      action = "ENTER";
    } else if (confidence >= CONFIDENCE_MIN && stops.length > 0) {
      action = "AVOID";
    }

    // =======================
    // OUTPUT (PREMIUM HTML-COMPATIBLE TEXT OR PLAIN TEXT)
    // =======================
const dot = direction === "long" ? "🟢" : "🔴";

entrySignalsText += `
${dot} ${direction.toUpperCase()} | ${sig.name} (priority ${sig.priority})

Confidence: ${confidence}%
➡ Action: ${action}
`;

    if (reasons.length) {
      entrySignalsText += `
📌 Context:
- ${reasons.join("\n- ")}
`;
    }

    if (action === "AVOID" && stops.length) {
      entrySignalsText += `
🧠 Why NOT entering:
- ${stops.join("\n- ")}
`;
    }

    if (warnings.length) {
      entrySignalsText += `
⚠ Warnings:
- ${warnings.join("\n- ")}
`;
    }
  });

  return entrySignalsText;
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