import { pearsonCorrelation, estimateATR } from "./marketUtils.js";

export function calcTrendStability(data) {
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
  const corr = Math.abs(pearsonCorrelation(xs, closes));

  const atrs = candles.map(c => c.ATR ?? c.atr).filter(isFinite);
  const avgAtr = atrs.length
    ? atrs.reduce((a, b) => a + b, 0) / atrs.length
    : data.ATR ?? 1;

  const avgPrice = closes.reduce((a, b) => a + b, 0) / closes.length;
  const atrRatio = avgAtr / Math.max(avgPrice, 1);
  const stabilityFromAtr = 1 / (1 + atrRatio * 20);

  return corr * 0.7 + stabilityFromAtr * 0.3;
}

export function calcImpulseQuality(data, direction) {
  const candles = data.candles || data.klines;
  const last = Array.isArray(candles) ? candles[candles.length - 1] : data;

  const open = last.Open ?? last.open ?? last[1] ?? data.Open ?? data.Price;
  const close = last.Close ?? last.close ?? last[4] ?? data.Close ?? data.Price;
  const high = last.High ?? last.high ?? last[2] ?? close;
  const low = last.Low ?? last.low ?? last[3] ?? open;
  const volume = last.Volume ?? last.volume ?? last[5] ?? 1;

  const range = Math.max(high - low, Math.abs(close) * 0.001, 1e-6);
  let body = close - open;

  if (direction === "long") body = Math.max(body, 0);
  else body = Math.max(open - close, 0);

  const bodyRatio = body / range;
  const volBoost = Math.log(volume + 1);

  return bodyRatio * volBoost;
}

export function calcRetracementRisk(data) {
  const price = data.Price ?? data.Close ?? data.Last;
  const atr = data.ATR || estimateATR(data) || 1;

  const swingHigh = data.SwingHigh;
  const swingLow = data.SwingLow;

  if (swingHigh == null && swingLow == null) return 0.5;

  let ref;
  if (swingHigh != null && swingLow != null) {
    ref =
      Math.abs(price - swingHigh) < Math.abs(price - swingLow)
        ? swingHigh
        : swingLow;
  } else ref = swingHigh ?? swingLow;

  return Math.abs(price - ref) / atr;
}

export function calcVolumePressureSymmetric(data) {
  const candles = data.candles || data.klines;

  let buy = 0;
  let sell = 0;

  if (Array.isArray(candles)) {
    candles.forEach(c => {
      const open = c.Open ?? c.open ?? c[1];
      const close = c.Close ?? c.close ?? c[4];
      const vol = c.Volume ?? c.volume ?? c[5] ?? 0;

      if (close > open) buy += vol;
      else if (close < open) sell += vol;
      else {
        buy += vol * 0.5;
        sell += vol * 0.5;
      }
    });
  }

  const total = buy + sell;
  if (total <= 0) return 0;
  return (buy - sell) / total;
}

export function calcVolatilityRegime(data) {
  const candles = data.candles || data.klines;

  if (Array.isArray(candles) && candles.length >= 5) {
    const ranges = candles.map(c => {
      const h = c.High ?? c.high ?? c[2];
      const l = c.Low ?? c.low ?? c[3];
      return Math.abs(h - l);
    });

    const mean = ranges.reduce((a, b) => a + b, 0) / ranges.length;
    const variance =
      ranges.reduce((a, b) => a + (b - mean) ** 2, 0) / (ranges.length - 1 || 1);
    const std = Math.sqrt(variance);

    return std / Math.max(mean, 1e-6);
  }

  const atr = data.ATR || 1;
  const atrSmooth = data.ATR_smooth || atr;
  return atr / atrSmooth;
}
