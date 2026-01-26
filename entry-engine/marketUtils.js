// =======================
// CONTEXT EXTRACTION
// =======================
export function extractRecentContext(data, lookbackCount = 12) {
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
// HELPERS
// =======================
export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export function normalize(v, min, max) {
  if (max === min) return 0.5;
  return clamp((v - min) / (max - min), 0, 1);
}

export function pearsonCorrelation(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;

  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0, denX = 0, denY = 0;

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

export function getLastClose(data) {
  const candles = data.candles || data.klines;
  if (!Array.isArray(candles) || candles.length === 0)
    return data.Price ?? data.Close;
  const last = candles[candles.length - 1];
  return last.Close ?? last.close ?? last[4];
}

export function estimateATR(data) {
  const candles = data.candles || data.klines;
  if (!Array.isArray(candles) || candles.length < 2) return data.ATR ?? 1;

  const trs = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const cur = candles[i];

    const prevClose = prev.Close ?? prev.close ?? prev[4];
    const high = cur.High ?? cur.high ?? cur[2];
    const low = cur.Low ?? cur.low ?? cur[3];

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trs.push(tr);
  }

  if (!trs.length) return data.ATR ?? 1;
  return trs.reduce((a, b) => a + b, 0) / trs.length;
}
