// let lastPrice = null;

// Отримання поточної ціни з Binance
async function getPrice(symbol) {
  try {
    const resp = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
    );
    const data = await resp.json();
    return data.price ? parseFloat(data.price) : null;
  } catch (e) {
    return null;
  }
}

// Відслідковування процентної зміни
async function trackPrice() {
  let symbol = document
    .getElementById("symbol")
    .value.trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ""); // прибираємо / - _ пробіли
  if (!symbol) {
    return;
  }

  // ✅ Автоматично додаємо USDT, якщо немає
  if (!symbol.endsWith("USDT")) {
    symbol = symbol + "USDT";
  }

  const price = await getPrice(symbol);
  if (!price) return;

  // Якщо lastPrice ще не встановлено, беремо першу ціну
  if (lastPrice === null) {
    lastPrice = price;
    return;
  }

  const change = ((price - lastPrice) / lastPrice) * 100;

  // Повідомляємо тільки якщо зміна >= 0.02%
  if (Math.abs(change) >= 0.02) {
    const sign = change > 0 ? "+" : "";
    appendMessage(`🔔 ${symbol}: ${sign}${change.toFixed(2)}%`);
    lastPrice = price; // оновлюємо останню відому ціну
  }
}

// ===============================
// STATE
// ===============================
let priceHistory = [];
let lastPrice = null;

let progressContainer = null;
let indicator = null;
let changeValueSpan = null;
let marketStateDiv = null;
let isInitialized = false;


// ===============================
// PURE FUNCTIONS
// ===============================

// ✅ Генерація кольору індикатора
function getIndicatorColor(intensity) {
  const green = Math.round(200 - intensity * 70);
  const red = Math.round(130 + intensity * 70);
  const blue = Math.round(160 - intensity * 10);
  return `rgb(${red}, ${green}, ${blue})`;
}

// ✅ Стан ринку
function getMarketState(absChange) {
  if (absChange < 0.015) return { state: "Consolidation", color: "#88c9a1" };
  if (absChange < 0.03) return { state: "Moderate movement", color: "#c9a188" };
  return { state: "Fast movement", color: "#c98899" };
}

// ✅ Адаптивна чутливість (плавність)
function getSensitivity(historyLength) {
  if (historyLength <= 10) return 1200;
  if (historyLength <= 20) return 800;
  if (historyLength <= 30) return 500;
  if (historyLength <= 40) return 300;
  return 200; // ✅ для 50 значень — плавно
}


// ===============================
// PRICE HISTORY
// ===============================
function updatePriceHistory(price) {
  priceHistory.push(price);
  if (priceHistory.length > 100) priceHistory.shift();
}


// ===============================
// UI: PROGRESS LINE INIT
// ===============================
function initProgressLine() {
  progressContainer = document.createElement("div");
  progressContainer.id = "progressLine";
  progressContainer.style.cssText = `
    margin: 11px 0;
    padding: 10px;
    background: rgba(30, 35, 45, 0.4);
    border-radius: 12px;
    border: 1px solid rgba(157, 189, 178, 0.2);
  `;

  // ---------- Top row ----------
  const topRow = document.createElement("div");
  topRow.style.cssText =
    "display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;";

  const changeLabel = document.createElement("div");
  changeLabel.style.cssText =
    "font-size: 12px; color: #a8b5c0; font-family: 'Orbitron', monospace;";
  changeLabel.textContent = "Change: ";

  changeValueSpan = document.createElement("span");
  changeValueSpan.style.cssText =
    "font-weight: bold; font-size: 14px; transition: color 1.3s ease;";
  changeValueSpan.textContent = "+0.0000%";

  changeLabel.appendChild(changeValueSpan);

  marketStateDiv = document.createElement("div");
  marketStateDiv.style.cssText =
    "font-size: 11px; font-weight: bold; font-family: 'Orbitron', monospace; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 6px; transition: all 1.3s ease;";
  marketStateDiv.textContent = "Consolidation";

  topRow.appendChild(changeLabel);
  topRow.appendChild(marketStateDiv);

  // ---------- Progress bar ----------
  const progressBar = document.createElement("div");
  progressBar.style.cssText = `
    position: relative;
    width: 100%;
    height: 26px;
    background: linear-gradient(to right, #c98899 0%, #b99aa5 15%, #a8aca8 30%, #88c9a1 50%, #a8aca8 70%, #b99aa5 85%, #c98899 100%);
    border-radius: 13px;
    overflow: visible;
    border: 2px solid rgba(157, 189, 178, 0.15);
    box-shadow: inset 0 2px 8px rgba(0,0,0,0.2);
  `;

  indicator = document.createElement("div");
  indicator.style.cssText = `
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 4px;
    height: 30px;
    background: rgb(165, 185, 175);
    box-shadow: 0 0 10px rgb(165, 185, 175), 0 0 18px rgba(165, 185, 175, 0.5);
    border-radius: 3px;
    border: 2px solid rgba(255, 255, 255, 0.6);
    transition: all 1.6s ease;
  `;

  progressBar.appendChild(indicator);

  // ---------- Bottom row ----------
  const bottomRow = document.createElement("div");
  bottomRow.style.cssText =
    "display: flex; justify-content: space-between; font-size: 10px; color: #8a95a0; margin-top: 6px; font-family: 'Orbitron', monospace;";

  const leftLabel = document.createElement("span");
  leftLabel.style.color = "#c98899";
  leftLabel.textContent = "-0.1% 🔴";

  const centerLabel = document.createElement("span");
  centerLabel.style.color = "#88c9a1";
  centerLabel.textContent = "0% 🟢";

  const rightLabel = document.createElement("span");
  rightLabel.style.color = "#c98899";
  rightLabel.textContent = "+0.1% 🔴";

  bottomRow.appendChild(leftLabel);
  bottomRow.appendChild(centerLabel);
  bottomRow.appendChild(rightLabel);

  // ---------- Assembly ----------
  progressContainer.appendChild(topRow);
  progressContainer.appendChild(progressBar);
  progressContainer.appendChild(bottomRow);

const messagesContainer = document.getElementById("priceMessages");
const parent = messagesContainer ? messagesContainer.parentElement : document.querySelector(".container") || document.body;

parent.insertBefore(progressContainer, messagesContainer || parent.firstChild);

  isInitialized = true;
}


// ===============================
// UI: PROGRESS LINE UPDATE
// ===============================
function updateProgressLine() {
  if (priceHistory.length < 2) return;
  if (!isInitialized) initProgressLine();

  const firstPrice = priceHistory[0];
  const lastPriceInHistory = priceHistory[priceHistory.length - 1];
  const change = ((lastPriceInHistory - firstPrice) / firstPrice) * 100;

  const sensitivity = getSensitivity(priceHistory.length);
  const normalized = Math.max(0, Math.min(100, 50 + change * sensitivity));

  const absChange = Math.abs(change);
  const { state, color } = getMarketState(absChange);

  const distanceFromCenter = Math.abs(50 - normalized);
  const intensity = distanceFromCenter / 50;
  const indicatorColor = getIndicatorColor(intensity);

  indicator.style.left = `${normalized}%`;
  indicator.style.background = indicatorColor;
  indicator.style.boxShadow = `0 0 10px ${indicatorColor}, 0 0 18px ${indicatorColor}80`;

  changeValueSpan.style.color = indicatorColor;
  changeValueSpan.textContent = `${change > 0 ? "+" : ""}${change.toFixed(4)}%`;

  marketStateDiv.style.color = color;
  marketStateDiv.textContent = state;
}


// ===============================
// PRICE TRACKING
// ===============================
async function trackPrice() {
  let symbol = document
    .getElementById("symbol")
    .value.trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (!symbol) return;
  if (!symbol.endsWith("USDT")) symbol += "USDT";

  const price = await getPrice(symbol);
  if (!price) return;

  updatePriceHistory(price);

  if (lastPrice === null) {
    lastPrice = price;
    updateProgressLine();
    return;
  }

  const change = ((price - lastPrice) / lastPrice) * 100;

  if (Math.abs(change) >= 0.01) {
    lastPrice = price;
  }

  updateProgressLine();
}
// ===============================
// INTERVAL
// ===============================
setInterval(trackPrice, 10000);
// ✅ Малюємо шкалу одразу після завантаження сайту
document.addEventListener("DOMContentLoaded", initProgressLine);





// --- Оновлюємо lastPrice при зміні символу ---
document.getElementById("symbol").addEventListener("change", () => {
  lastPrice = null; // скидаємо, щоб взяти нову ціну
});

function addPriceMessage(price, prevPrice) {
  const container = document.getElementById("priceMessages");

  const item = document.createElement("div");
  item.classList.add("priceItem");

  // напрямок
  if (price > prevPrice) item.classList.add("up");
  else if (price < prevPrice) item.classList.add("down");
  else item.classList.add("neutral");

  const now = new Date();
  const time = now.toLocaleTimeString();

  item.innerHTML = `
        <span class="priceValue">${price.toFixed(4)}</span>
        <span class="priceTime">${time}</span>
    `;

  container.prepend(item); // нові зверху
}
// document.addEventListener("click", (e) => {
//   if (e.target.closest("#progressLine")) {
//     progressContainer.classList.toggle("compact");
//   }
// });

// Додай клас compact на старті

// Десь на початку коду, після завантаження сторінки
window.addEventListener('DOMContentLoaded', () => {
  const progressContainer = document.getElementById("progressLine");
  progressContainer.classList.add("compact");
});

// Твій існуючий код
document.addEventListener("click", (e) => {
  if (e.target.closest("#progressLine")) {
    progressContainer.classList.toggle("compact");
  }
});

