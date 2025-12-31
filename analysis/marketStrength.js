// =======================
// ✅ Market Strength Score (0–100) — оновлена модель
// =======================

export function computeMarketStrength(
  data,
  THRESHOLDS,
  activeScenarios,
  compositeActive
) {
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  // ✅ Trend Strength (EMA alignment + MACD)
  const emaDiff = Math.abs(data.EMA8 - data.EMA21);
  const emaSlope = emaDiff / (data.ATR || 1);
  const macdTrend =
    data.MACD && data.MACD_Signal
      ? clamp01(
          Math.abs(data.MACD - data.MACD_Signal) /
            (Math.abs(data.MACD_Signal) || 1)
        )
      : 0;
  const trendStrength = clamp01(emaSlope * 0.6 + macdTrend * 0.4) * 25;

  // ✅ Momentum Strength (RSI + Stoch)
  const rsiNorm = clamp01(Math.abs((data.RSI || 50) - 50) / 30);
  const stochNorm = clamp01(Math.abs((data.Stochastic || 50) - 50) / 50);
  const momentumStrength = ((rsiNorm + stochNorm) / 2) * 20;

  // ✅ Volatility Strength (ATR regime)
  const atrNorm = clamp01((data.ATR || 0) / (THRESHOLDS.ATR_LOW * 1.2 || 1));
  const volatilityStrength = atrNorm * 15;

  // ✅ Liquidity Strength (volume + OI)
  const volNorm = clamp01((data.volume || 0) / (data.avgVolume || 1));
  const oiNorm = clamp01((data.openInterest || 0) / (THRESHOLDS.OI_HIGH || 1));
  const liquidityStrength = (volNorm * 0.7 + oiNorm * 0.3) * 20;

  // ✅ Market Structure Score (по активних сценаріях)
  const structureStrength = activeScenarios.some((s) =>
    ["Trend", "Breakout"].includes(s.category)
  )
    ? 10
    : activeScenarios.some((s) => ["Range", "Reversion"].includes(s.category))
    ? 5
    : 0;

  // ✅ Risk Conditions Score (funding, OI spikes, composite)
  let riskStrength = 10;
  if (Math.abs(data.funding || 0) > THRESHOLDS.FUNDING_SQUEEZE)
    riskStrength -= 5;
  if ((data.openInterest || 0) > THRESHOLDS.OI_HIGH * 1.2) riskStrength -= 5;
  if (compositeActive) riskStrength += 5;

  const total =
    trendStrength +
    momentumStrength +
    volatilityStrength +
    liquidityStrength +
    structureStrength +
    riskStrength;
  const score = Math.round(clamp01(total / 100) * 100);

  let label = "Weak";
  if (score >= 85) label = "Explosive";
  else if (score >= 65) label = "Strong";
  else if (score >= 45) label = "Normal";

  return { score, label };
}
