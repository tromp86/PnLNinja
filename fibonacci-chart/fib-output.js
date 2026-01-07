// ===============================
// Fibonacci Output Panel Renderer
// ===============================

import { fibMetricInfo } from "./fib-info.js";

// Головна функція оновлення панелі
export function updateFibonacciOutput(fibData) {
  const container = document.getElementById("outputFibonacci");
  if (!container) return;

  if (!fibData || !fibData.isValid) {
    container.innerHTML = "";
    return;
  }

  const {
    correctionDepth,
    impulseStrength,
    volumeStrength,
    isBullishImpulse,
    goldenPocket,
    retracementType,
    impulseBars,
    isVolumeClimax,
    last,
  } = fibData;

  // ===============================
  // 1. Підготовка базових даних
  // ===============================

  const impulseKey = isBullishImpulse ? "bullish" : "bearish";
  const impulseInfo = fibMetricInfo.impulseDirection[impulseKey];

  const retrKey = normalizeRetrKey(retracementType);
  const retrInfo = fibMetricInfo.retracement[retrKey];

  const gpStatusObj = getGoldenPocketStatus(last, goldenPocket);

  const gpDesc = gpStatusObj.desc;

  const gpStatus = gpStatusObj.key;
  const gpInfo = fibMetricInfo.goldenPocket[gpStatus];

  const impulseStrengthInfo = fibMetricInfo.impulseStrength;
  const volumeStrengthInfo = fibMetricInfo.volumeStrength;
  const correctionDepthInfo = fibMetricInfo.correctionDepth;
  const impulseBarsInfo = fibMetricInfo.impulseBars;
  const volumeClimaxInfo = fibMetricInfo.volumeClimax;

  // ===============================
  // 2. SAFE FALLBACKS
  // ===============================

  const impulseInfoSafe = impulseInfo || { label: "Impulse" };
  const retrInfoSafe = retrInfo || { label: "Retracement" };
  const gpInfoSafe = gpInfo || { label: "Golden Pocket" };

  // ===============================
  // 3. ПОХІДНІ МЕТРИКИ
  // ===============================

  // Volume Pressure — наскільки об’єм підтримує рух
  const volumePressure = volumeStrength * (isVolumeClimax ? 1.3 : 1);

  // Trend Stability — стабільність тренду
  const barsFactor = impulseBars <= 4 ? 1 : impulseBars <= 8 ? 0.7 : 0.4;
  const trendStability =
    (barsFactor *
      (1 - Math.min(Math.max(correctionDepth, 0), 1)) *
      Math.min(volumeStrength, 3)) /
    2;

  // Retracement Risk — рівень ризику за глибиною корекції
  const riskLevel =
    correctionDepth < 0.38
      ? "Low"
      : correctionDepth < 0.61
      ? "Medium"
      : correctionDepth < 1.0
      ? "High"
      : "Very High";

  // ===============================
  // 4. Генерація HTML
  // ===============================

  container.innerHTML = `

        <!-- SHORT GRID: Golden Pocket + Direction + Retracement -->
        <div class="short-grid">

            <div class="short-item">
<div class="short-label gp-${gpStatus}">${gpInfoSafe.label}</div>
<div class="mini-desc">${gpDesc}</div>

            </div>

        </div>

        <!-- MINI GRID: ключові числові + похідні -->
        <div class="mini-grid">

            <div class="mini-item">
                <div class="mini-label">${impulseStrengthInfo.label}</div>
                <div class="mini-value">${impulseStrength.toFixed(1)}%</div>
                <div class="mini-desc">${impulseStrengthInfo.short}</div>
            </div>

            <div class="mini-item">
                <div class="mini-label">${correctionDepthInfo.label}</div>
                <div class="mini-value">${(correctionDepth * 100).toFixed(
                  1
                )}%</div>
                <div class="mini-desc">${correctionDepthInfo.short}</div>
            </div>

            <div class="mini-item">
                <div class="mini-label">${impulseBarsInfo.label}</div>
                <div class="mini-value">${impulseBars}</div>
                <div class="mini-desc">${impulseBarsInfo.short}</div>
            </div>

            <div class="mini-item">
                <div class="mini-label">${volumeStrengthInfo.label}</div>
                <div class="mini-value">${volumeStrength.toFixed(2)}x</div>
                <div class="mini-desc">${volumeStrengthInfo.short}</div>
            </div>

            <div class="mini-item">
                <div class="mini-label">Volume Pressure</div>
                <div class="mini-value">${volumePressure.toFixed(2)}</div>
                <div class="mini-desc">Volume support factor</div>
            </div>

            <div class="mini-item">
                <div class="mini-label">Trend Stability</div>
                <div class="mini-value">${trendStability.toFixed(2)}</div>
                <div class="mini-desc">Trend consistency score</div>
            </div>

            <div class="mini-item">
                <div class="mini-label">${volumeClimaxInfo.label}</div>
                <div class="mini-value">${isVolumeClimax ? "Yes" : "No"}</div>
                <div class="mini-desc">${volumeClimaxInfo.short}</div>
            </div>

            <div class="mini-item">
                <div class="mini-label">Retracement Risk</div>
                <div class="mini-value">${riskLevel}</div>
                <div class="mini-desc">Risk based on pullback depth</div>
            </div>

        </div>
    `;
}

// ===============================
// HELPERS
// ===============================

function getGoldenPocketStatus(normalizedPrice, goldenPocket) {
  if (!goldenPocket) {
    return { key: "unknown", desc: "Немає даних про Golden Pocket" };
  }

  const { from, to } = goldenPocket;

  const width = to - from;
  const center = (from + to) / 2;

  // 1) Deep below GP
  if (normalizedPrice < from - width * 2) {
    return {
      key: "far-below",
      desc: "Ціна значно нижче Golden Pocket — структура сильно ослаблена",
    };
  }

  // 2) Below GP
  if (normalizedPrice < from - width * 0.5) {
    return {
      key: "below",
      desc: "Ціна нижче Golden Pocket — слабка зона",
    };
  }

  // 3) Near lower boundary
  if (normalizedPrice < from) {
    return {
      key: "near-lower",
      desc: "Ціна підходить до Golden Pocket знизу — потенційна зона реакції",
    };
  }

  // 4) Inside GP
  if (normalizedPrice >= from && normalizedPrice <= to) {
    return {
      key: "inside",
      desc: "Ціна всередині Golden Pocket — золота зона реакції",
    };
  }

  // 5) Near upper boundary
  if (normalizedPrice <= to + width * 0.5) {
    return {
      key: "near-upper",
      desc: "Ціна підходить до Golden Pocket зверху — можливий відкат",
    };
  }

  // 6) Above GP
  if (normalizedPrice <= to + width * 2) {
    return {
      key: "above",
      desc: "Ціна вище Golden Pocket — тренд продовжується",
    };
  }

  // 7) Far above GP
  return {
    key: "far-above",
    desc: "Ціна значно вище Golden Pocket — імпульс перегрітий",
  };
}
function normalizeRetrKey(raw) {
  if (!raw) return "normal";
  const v = raw.toLowerCase();
  if (v.includes("shallow")) return "shallow";
  if (v.includes("deep")) return "deep";
  if (v.includes("over")) return "overextended";
  return "normal";
}
