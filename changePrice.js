// ===============================
// STATE
// ===============================
const state = {
  priceHistory: [],
  lastPrice: null,
  initialized: false,
  lastUpdateTime: 0,
  ui: {
    progressContainer: null,
    indicator: null,
    changeValueSpan: null,
    marketStateDiv: null
  }
};

// ===============================
// HELPERS
// ===============================
function throttle(fn, delay) {
  return function (...args) {
    const now = Date.now();
    if (now - state.lastUpdateTime >= delay) {
      state.lastUpdateTime = now;
      fn.apply(this, args);
    }
  };
}

// ===============================
// API
// ===============================
async function getPrice(symbol) {
  try {
    const resp = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
    );
    const data = await resp.json();
    return data.price ? parseFloat(data.price) : null;
  } catch {
    return null;
  }
}

// ===============================
// PURE FUNCTIONS
// ===============================
function getIndicatorColor(intensity) {
  const green = Math.round(200 - intensity * 70);
  const red = Math.round(130 + intensity * 70);
  const blue = Math.round(160 - intensity * 10);
  return `rgb(${red}, ${green}, ${blue})`;
}

function getMarketState(absChange) {
  if (absChange < 0.015) return { state: "Consolidation", color: "#88c9a1" };
  if (absChange < 0.03) return { state: "Moderate movement", color: "#c9a188" };
  return { state: "Fast movement", color: "#c98899" };
}

function getSensitivity(historyLength) {
  if (historyLength <= 10) return 1200;
  if (historyLength <= 20) return 800;
  if (historyLength <= 30) return 500;
  if (historyLength <= 40) return 300;
  return 200;
}

// ===============================
// PRICE HISTORY
// ===============================
function updatePriceHistory(price) {
  state.priceHistory.push(price);
  if (state.priceHistory.length > 100) state.priceHistory.shift();
}

// ===============================
// UI INIT
// ===============================
function initProgressLine() {
  const container = document.createElement("div");
  container.id = "progressLine";
  container.style.cssText = `
    margin: 11px 0;
    padding: 10px;
    background: rgba(30, 35, 45, 0.4);
    border-radius: 12px;
    border: 1px solid rgba(157, 189, 178, 0.2);
  `;
  state.ui.progressContainer = container;

  // TOP ROW
  const topRow = document.createElement("div");
  topRow.style.cssText =
    "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;";

  const changeLabel = document.createElement("div");
  changeLabel.style.cssText =
    "font-size:12px;color:#a8b5c0;font-family:'Orbitron',monospace;";
  changeLabel.textContent = "Change: ";

  const changeValue = document.createElement("span");
  changeValue.style.cssText =
    "font-weight:bold;font-size:14px;transition:color 1.3s ease;";
  changeValue.textContent = "+0.0000%";
  state.ui.changeValueSpan = changeValue;

  changeLabel.appendChild(changeValue);

  const marketState = document.createElement("div");
  marketState.style.cssText =
    "font-size:11px;font-weight:bold;font-family:'Orbitron',monospace;background:rgba(255,255,255,0.05);padding:4px 10px;border-radius:6px;transition:all 1.3s ease;";
  marketState.textContent = "Consolidation";
  state.ui.marketStateDiv = marketState;

  topRow.appendChild(changeLabel);
  topRow.appendChild(marketState);

  // PROGRESS BAR
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

  const indicator = document.createElement("div");
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
  state.ui.indicator = indicator;

  progressBar.appendChild(indicator);

  // BOTTOM ROW
  const bottomRow = document.createElement("div");
  bottomRow.style.cssText =
    "display:flex;justify-content:space-between;font-size:10px;color:#8a95a0;margin-top:6px;font-family:'Orbitron',monospace;";
  bottomRow.innerHTML = `
    <span style="color:#c98899">-0.1% 🔴</span>
    <span style="color:#88c9a1">0% 🟢</span>
    <span style="color:#c98899">+0.1% 🔴</span>
  `;

  container.appendChild(topRow);
  container.appendChild(progressBar);
  container.appendChild(bottomRow);

  const messagesContainer = document.getElementById("priceMessages");
  const parent = messagesContainer
    ? messagesContainer.parentElement
    : document.body;

  parent.insertBefore(container, messagesContainer || parent.firstChild);

  state.initialized = true;
}

// ===============================
// UI UPDATE
// ===============================
function updateProgressLine() {
  if (state.priceHistory.length < 2) return;
  if (!state.initialized) initProgressLine();

  const first = state.priceHistory[0];
  const last = state.priceHistory[state.priceHistory.length - 1];
  const change = ((last - first) / first) * 100;

  const sensitivity = getSensitivity(state.priceHistory.length);
  const normalized = Math.max(0, Math.min(100, 50 + change * sensitivity));

  const absChange = Math.abs(change);
  const { state: marketState, color } = getMarketState(absChange);

  const distance = Math.abs(50 - normalized);
  const intensity = distance / 50;
  const indicatorColor = getIndicatorColor(intensity);

  state.ui.indicator.style.left = `${normalized}%`;
  state.ui.indicator.style.background = indicatorColor;
  state.ui.indicator.style.boxShadow = `0 0 10px ${indicatorColor}, 0 0 18px ${indicatorColor}80`;

  state.ui.changeValueSpan.style.color = indicatorColor;
  state.ui.changeValueSpan.textContent = `${change > 0 ? "+" : ""}${change.toFixed(4)}%`;

  state.ui.marketStateDiv.style.color = color;
  state.ui.marketStateDiv.textContent = marketState;
}

// ===============================
// PRICE TRACKING (ONE VERSION)
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

  if (state.lastPrice === null) {
    state.lastPrice = price;
    updateProgressLine();
    return;
  }

  const change = ((price - state.lastPrice) / state.lastPrice) * 100;

  if (Math.abs(change) >= 0.01) {
    state.lastPrice = price;
  }

  updateProgressLine();
}

// ===============================
// EVENTS
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  initProgressLine();
  state.ui.progressContainer.classList.add("compact");
});

document.addEventListener("click", (e) => {
  if (e.target.closest("#progressLine")) {
    state.ui.progressContainer.classList.toggle("compact");
  }
});

document.getElementById("symbol").addEventListener("change", () => {
  state.lastPrice = null;
});

// ===============================
// INTERVAL
// ===============================
setInterval(throttle(trackPrice, 1500), 10000);