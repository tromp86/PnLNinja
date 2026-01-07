// =======================
// ✅ Market Strength Score (0–100) — розширена модель
// =======================

export function computeMarketStrength(
  data,
  THRESHOLDS,
  activeScenarios,
  compositeActive
) {
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  // =======================
  // 📌 Historical Context
  // =======================
  const hist = data.history || {};

  const getHistoricalAvg = (arr) =>
    Array.isArray(arr) && arr.length > 0
      ? arr.slice(-20).reduce((a, b) => a + b, 0) / Math.min(arr.length, 20)
      : null;

  const getPrevValue = (arr) =>
    Array.isArray(arr) && arr.length > 1 ? arr[arr.length - 2] : null;

  const atrHistAvg = getHistoricalAvg(hist.ATR);
  const rsiHistAvg = getHistoricalAvg(hist.RSI);
  const volHistAvg = getHistoricalAvg(hist.volume);

  const atrVsHist = atrHistAvg ? clamp01((data.ATR || 0) / (atrHistAvg * 1.2)) : 0;
  const rsiVsHist = rsiHistAvg
    ? clamp01(Math.abs((data.RSI || 50) - rsiHistAvg) / 30)
    : 0;
  const volVsHist = volHistAvg
    ? clamp01((data.volume || 0) / (volHistAvg * 1.5))
    : 0;

  const historicalStrength =
    (atrVsHist * 0.4 + rsiVsHist * 0.3 + volVsHist * 0.3) * 10;

  // =======================
  // ⚡ Velocity Metrics
  // =======================
  const prevRSI = getPrevValue(hist.RSI);
  const prevStoch = getPrevValue(hist.Stochastic);
  const prevATR = getPrevValue(hist.ATR);

  const rsiVelocity = prevRSI ? clamp01(Math.abs(data.RSI - prevRSI) / 10) : 0;
  const stochVelocity = prevStoch
    ? clamp01(Math.abs(data.Stochastic - prevStoch) / 15)
    : 0;
  const atrChange = prevATR
    ? clamp01(Math.abs(data.ATR - prevATR) / (prevATR * 0.5))
    : 0;

  const velocityStrength =
    (rsiVelocity * 0.4 + stochVelocity * 0.4 + atrChange * 0.2) * 10;

  // =======================
  // 🎯 Alignment Checks
  // =======================
  const emaDiff = Math.abs(data.EMA8 - data.EMA21);
  const emaSlope = emaDiff / (data.ATR || 1);

  const emaAlignment =
    data.EMA8 > data.EMA21 ? 1 : data.EMA8 < data.EMA21 ? -1 : 0;

  const momentumAlignment =
    prevRSI && prevStoch
      ? Math.sign(data.RSI - prevRSI) === Math.sign(data.Stochastic - prevStoch)
        ? 1
        : 0
      : 0;

  const trendQuality = clamp01(emaDiff / (data.ATR * 0.8 || 1));

  const alignmentStrength =
    (emaAlignment === 1 ? 4 : emaAlignment === -1 ? 2 : 0) +
    (momentumAlignment ? 2 : 0) +
    trendQuality * 4;

  // =======================
  // 📈 Trend Strength (EMA + MACD)
  // =======================
  const macdTrend =
    data.MACD !== undefined && data.MACD_Signal !== undefined
      ? clamp01(
          Math.abs(data.MACD - data.MACD_Signal) /
            Math.max(
              Math.abs(data.MACD_Signal),
              Math.abs(data.MACD),
              0.001
            )
        )
      : 0;

  const trendStrength = clamp01(emaSlope * 0.6 + macdTrend * 0.4) * 25;

  // =======================
  // ⚙️ Momentum Strength
  // =======================
  const rsiNorm = clamp01(Math.abs((data.RSI || 50) - 50) / 30);
  const stochNorm = clamp01(Math.abs((data.Stochastic || 50) - 50) / 50);
  const momentumStrength = ((rsiNorm + stochNorm) / 2) * 20;

  // =======================
  // 🌪 Volatility Strength
  // =======================
  const atrNorm = clamp01((data.ATR || 0) / (THRESHOLDS.ATR_LOW * 1.2 || 1));
  const volatilityStrength = atrNorm * 15;

  // =======================
  // 💧 Liquidity Strength
  // =======================
  const volNorm = clamp01((data.volume || 0) / (data.avgVolume || 1));
  const oiNorm = clamp01((data.openInterest || 0) / (THRESHOLDS.OI_HIGH || 1));
  const liquidityStrength = (volNorm * 0.7 + oiNorm * 0.3) * 20;

  // =======================
  // 🧩 Market Structure
  // =======================
  const structureStrength = activeScenarios.some((s) =>
    ["Trend", "Breakout"].includes(s.category)
  )
    ? 10
    : activeScenarios.some((s) =>
        ["Range", "Reversion"].includes(s.category)
      )
    ? 5
    : 0;

  // =======================
  // ⚠️ Risk Conditions
  // =======================
  let riskStrength = 10;
  if (Math.abs(data.funding || 0) > THRESHOLDS.FUNDING_SQUEEZE) riskStrength -= 5;
  if ((data.openInterest || 0) > THRESHOLDS.OI_HIGH * 1.2) riskStrength -= 5;
  if (compositeActive) riskStrength += 5;
  riskStrength = Math.max(0, riskStrength);

  // =======================
  // 🧮 Final Score
  // =======================
  const total =
    trendStrength +
    momentumStrength +
    volatilityStrength +
    liquidityStrength +
    structureStrength +
    riskStrength +
    historicalStrength +
    velocityStrength +
    alignmentStrength;

  const score = Math.round(clamp01(total / 100) * 100);

  let label = "Weak";
  if (score >= 85) label = "Explosive";
  else if (score >= 65) label = "Strong";
  else if (score >= 45) label = "Normal";

  return { score, label };
}