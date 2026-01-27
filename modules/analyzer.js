// ===============================
// MAIN ANALYZE LOGIC
// ===============================
import { fetchMarketData } from "./api.js";
import { computeIndicators } from "./indicatorCalculations.js";
import { renderOutput } from "./ui.js";
import { startCountdown } from "./utils.js";
import { isAutoRefresh } from "../main.js";
import { analyzeBTC as aiAnalyzeBTC } from "../analyze.js";

import { renderPentagonFromIndicators } from "../pentagonRenderer.js";

let lastData = {};

export async function analyze() {
  const inputEl = document.getElementById("symbol");
  const out = document.getElementById("output");
  let symbol = inputEl.value.trim().toUpperCase();

  if (!symbol) {
    out.innerHTML = "<div>Введіть символ...</div>";
    return;
  }

  // Додаємо USDT якщо потрібно
  if (!symbol.endsWith("USDT")) {
    symbol = symbol + "USDT";
  }

  // Старт таймера
  startCountdown();

  // UI loading state
  if (!isAutoRefresh) {
    out.innerHTML = "Завантаження...";
    out.classList.add("updating");
    setTimeout(() => out.classList.remove("updating"), 500);
  }

  try {
    // Отримання даних
    const { oiData, fArr, klines } = await fetchMarketData(symbol);

    if (!klines || klines.length < 50) {
      out.innerHTML =
        "<div class='warning'>Недостатньо даних для аналізу</div>";
      return;
    }

    // Підготовка даних
    const OI = parseFloat(oiData.openInterest) || 0;
    const funding = fArr[1] ? parseFloat(fArr[1].fundingRate) : 0;
    const closes = klines.map((k) => parseFloat(k[4])).filter((v) => !isNaN(v));

    if (closes.length < 50) {
      out.innerHTML = "<div class='warning'>Недостатньо цінових даних</div>";
      return;
    }

    // Розрахунок індикаторів
    const indicators = computeIndicators(klines, closes, OI, funding);


    // 🔺 ПЕНТАГОН (інтеграція)
    renderPentagonFromIndicators({
      ...indicators,
      OI,
      funding,
    });
  // 🔺 ПЕНТАГОН (інтеграція)
  
    // AI аналіз
    const aiResult = aiAnalyzeBTC({
      ...indicators,
      OI,
      Funding: funding,
      Price: indicators.lastPrice,
    }) || { scenarios: "N/A", entrySignals: "N/A" };

    // Рендеринг
    renderOutput(symbol, indicators, aiResult, OI, funding);

    // Кешування
    lastData[symbol] = { OI, funding };

    // console.log("Аналіз завершено:", symbol);
  } catch (err) {
    console.error("Помилка аналізу:", err);
    out.innerHTML = "<div class='warning'>Помилка при отриманні даних</div>";
  }
}

// В кінці файлу analyzer.js додайте:
export function forceRefresh() {
  return analyze();
}
