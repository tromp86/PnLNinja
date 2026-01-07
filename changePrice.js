// ===============================
// STATE (PER SYMBOL)
// ===============================
const priceTrackers = new Map();
let currentSymbol = '';
let trackerInterval = null;
let isInitialized = false;

// ===============================
// HELPERS
// ===============================
function throttle(fn, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

function getSymbolFromInput() {
  const input = document.getElementById("symbol");
  if (!input) return '';
  
  let symbol = input.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!symbol) return '';
  if (!symbol.endsWith("USDT")) symbol += "USDT";
  
  return symbol;
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
// STATE MANAGEMENT
// ===============================
function getOrCreateTracker(symbol) {
  if (!priceTrackers.has(symbol)) {
    priceTrackers.set(symbol, {
      priceHistory: [],
      lastPrice: null,
      isCompact: false,
      lastUpdateTime: 0,
      ui: {
        container: null,
        indicator: null,
        changeValueSpan: null,
        marketStateDiv: null,
        compactText: null
      }
    });
  }
  return priceTrackers.get(symbol);
}

function cleanupOldTracker(symbol) {
  const oldTracker = priceTrackers.get(symbol);
  if (oldTracker && oldTracker.ui.container) {
    oldTracker.ui.container.remove();
  }
  priceTrackers.delete(symbol);
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
  if (absChange < 0.015) return { state: "Consolidation", color: "#88c9a1", emoji: "⚪" };
  if (absChange < 0.03) return { state: "Moderate", color: "#c9a188", emoji: "🟡" };
  return { state: "Fast move", color: "#c98899", emoji: "🔴" };
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
function updatePriceHistory(tracker, price) {
  tracker.priceHistory.push(price);
  if (tracker.priceHistory.length > 100) tracker.priceHistory.shift();
}

// ===============================
// UI INIT
// ===============================
function initProgressLine(tracker) {
  if (tracker.ui.container) {
    tracker.ui.container.remove();
  }

  const container = document.createElement("div");
  container.className = "progress-line-container";
  container.dataset.symbol = currentSymbol || 'DEFAULT';
  
  container.addEventListener('click', (e) => {
    if (e.target === container || !e.target.closest('.progress-line-change, .progress-line-market-state')) {
      tracker.isCompact = !tracker.isCompact;
      container.classList.toggle('compact', tracker.isCompact);
      updateProgressLine(tracker);
    }
  });

  const headerRow = document.createElement("div");
  headerRow.className = "progress-line-header";

  const changeLabel = document.createElement("div");
  changeLabel.className = "progress-line-change";
  changeLabel.innerHTML = 'Change: <span class="progress-line-change-value">+0.0000%</span>';
  
  tracker.ui.changeValueSpan = changeLabel.querySelector('.progress-line-change-value');

  const marketState = document.createElement("div");
  marketState.className = "progress-line-market-state";
  marketState.textContent = "Waiting data...";
  tracker.ui.marketStateDiv = marketState;

  headerRow.appendChild(changeLabel);
  headerRow.appendChild(marketState);

  const progressBar = document.createElement("div");
  progressBar.className = "progress-line-bar";

  const indicator = document.createElement("div");
  indicator.className = "progress-line-indicator";
  indicator.style.left = "50%";
  indicator.style.background = "rgb(165, 185, 175)";
  indicator.style.boxShadow = "0 0 10px rgb(165, 185, 175), 0 0 18px rgba(165, 185, 175, 0.5)";
  tracker.ui.indicator = indicator;

  progressBar.appendChild(indicator);

  const labelsRow = document.createElement("div");
  labelsRow.className = "progress-line-labels";
  labelsRow.innerHTML = `
    <span style="color:#c98899">-0.1% 🔴</span>
    <span style="color:#88c9a1">0% 🟢</span>
    <span style="color:#c98899">+0.1% 🔴</span>
  `;

  const compactText = document.createElement("div");
  compactText.className = "progress-line-compact-text";
  compactText.style.cssText = `
    display: none;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    white-space: nowrap;
    pointer-events: none;
    font-family: 'Orbitron', monospace;
    letter-spacing: 0.5px;
  `;
  compactText.textContent = "click to expand";
  tracker.ui.compactText = compactText;
  progressBar.appendChild(compactText);

  container.appendChild(headerRow);
  container.appendChild(progressBar);
  container.appendChild(labelsRow);
  
  tracker.ui.container = container;

  container.classList.toggle('compact', tracker.isCompact);

  const canvas = document.getElementById("miniChart");
  if (canvas) {
    canvas.parentNode.insertBefore(container, canvas.nextSibling);
  } else {
    const symbolInput = document.getElementById("symbol");
    if (symbolInput) {
      symbolInput.parentNode.insertBefore(container, symbolInput.nextSibling);
    } else {
      document.body.prepend(container);
    }
  }
}

// ===============================
// UI UPDATE
// ===============================
function updateProgressLine(tracker) {
  if (!tracker.ui.container) return;
  
  if (tracker.priceHistory.length < 2) {
    if (!tracker.isCompact) {
      tracker.ui.changeValueSpan.textContent = "+0.0000%";
      tracker.ui.changeValueSpan.style.color = "#a8b5c0";
      tracker.ui.marketStateDiv.textContent = "Waiting data...";
      tracker.ui.marketStateDiv.style.color = "#88c9a1";
      tracker.ui.indicator.style.left = "50%";
      tracker.ui.indicator.style.background = "rgb(165, 185, 175)";
      tracker.ui.indicator.style.boxShadow = "0 0 10px rgb(165, 185, 175), 0 0 18px rgba(165, 185, 175, 0.5)";
    }
    if (tracker.ui.compactText) {
      tracker.ui.compactText.textContent = "Waiting data...";
      tracker.ui.compactText.style.color = "rgba(255, 255, 255, 0.5)";
    }
    return;
  }

  const first = tracker.priceHistory[0];
  const last = tracker.priceHistory[tracker.priceHistory.length - 1];
  const change = ((last - first) / first) * 100;

  const sensitivity = getSensitivity(tracker.priceHistory.length);
  const normalized = Math.max(0, Math.min(100, 50 + change * sensitivity));

  const absChange = Math.abs(change);
  const { state: marketState, color, emoji } = getMarketState(absChange);

  const distance = Math.abs(50 - normalized);
  const intensity = distance / 50;
  const indicatorColor = getIndicatorColor(intensity);

  tracker.ui.indicator.style.left = `${normalized}%`;
  tracker.ui.indicator.style.background = indicatorColor;
  tracker.ui.indicator.style.boxShadow = `0 0 10px ${indicatorColor}, 0 0 18px ${indicatorColor}80`;

  if (!tracker.isCompact) {
    tracker.ui.changeValueSpan.style.color = indicatorColor;
    tracker.ui.changeValueSpan.textContent = `${change > 0 ? "+" : ""}${change.toFixed(2)}%`;
    tracker.ui.marketStateDiv.style.color = color;
    tracker.ui.marketStateDiv.textContent = marketState;
  }
  
  if (tracker.isCompact && tracker.ui.compactText) {
    const changeText = `${change > 0 ? "+" : ""}${change.toFixed(2)}%`;
    tracker.ui.compactText.textContent = `${changeText} ${emoji}`;
    tracker.ui.compactText.style.color = indicatorColor;
    tracker.ui.compactText.style.fontWeight = "bold";
    tracker.ui.compactText.style.display = "block";
  } else if (tracker.ui.compactText) {
    tracker.ui.compactText.style.display = "none";
  }
}

// ===============================
// PRICE TRACKING
// ===============================
async function trackCurrentPrice() {
  const symbol = getSymbolFromInput();
  if (!symbol) {
    if (!currentSymbol) {
      const defaultTracker = getOrCreateTracker('DEFAULT');
      if (!defaultTracker.ui.container) {
        currentSymbol = 'DEFAULT';
        initProgressLine(defaultTracker);
      }
    }
    return;
  }
  
  if (symbol !== currentSymbol) {
    if (currentSymbol) {
      cleanupOldTracker(currentSymbol);
    }
    currentSymbol = symbol;
  }
  
  const tracker = getOrCreateTracker(symbol);
  
  if (!tracker.ui.container) {
    initProgressLine(tracker);
  }
  
  const price = await getPrice(symbol);
  if (!price) {
    updateProgressLine(tracker);
    return;
  }
  
  updatePriceHistory(tracker, price);
  
  if (tracker.lastPrice === null) {
    tracker.lastPrice = price;
  }
  
  updateProgressLine(tracker);
}

// ===============================
// МИТТЄВЕ ОНОВЛЕННЯ
// ===============================
function refreshPriceTracker() {
  const symbol = getSymbolFromInput();
  if (!symbol) return;
  
  if (symbol !== currentSymbol) {
    if (currentSymbol) {
      cleanupOldTracker(currentSymbol);
    }
    currentSymbol = symbol;
  }
  
  const tracker = getOrCreateTracker(symbol);
  
  if (!tracker.ui.container) {
    initProgressLine(tracker);
  }
  
  trackCurrentPrice();
}

// ===============================
// EVENT HANDLERS
// ===============================
function setupEventListeners() {
  const symbolInput = document.getElementById("symbol");
  if (symbolInput) {
    symbolInput.addEventListener("change", () => {
      refreshPriceTracker();
    });
    
    symbolInput.addEventListener("input", () => {
      clearTimeout(window.symbolChangeTimeout);
      window.symbolChangeTimeout = setTimeout(() => {
        refreshPriceTracker();
      }, 500);
    });
  }
}

// ===============================
// CSS STYLES
// ===============================
function addProgressLineStyles() {
  if (document.getElementById('progress-line-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'progress-line-styles';
  style.textContent = `
    .progress-line-container {
      cursor: pointer;
      transition: all 0.3s ease;
      margin: 7px 0;
      padding: 5px;
      background: rgba(30, 35, 45, 0.4);
      border-radius: 12px;
      border: 1px solid rgba(157, 189, 178, 0.2);
      font-family: 'Orbitron', monospace;
      position: relative;
      overflow: hidden;
    }
    
    .progress-line-container:hover {
      opacity: 0.85;
      border-color: rgba(157, 189, 178, 0.4);
    }
    
    .progress-line-container.compact {
      height: 25px !important;
      min-height: 25px !important;
      padding: 5px 10px !important;
      background: rgba(255, 255, 255, 0.08) !important;
      border-radius: 6px !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      overflow: hidden !important;
      position: relative !important;
      cursor: pointer !important;
    }
    
    .progress-line-container.compact .progress-line-header,
    .progress-line-container.compact .progress-line-labels {
      display: none !important;
    }
    
    .progress-line-container:not(.compact) .progress-line-compact-text {
      display: none !important;
    }
    
    .progress-line-bar {
      position: relative;
      width: 100%;
      height: 26px;
    background: linear-gradient(to right, 
        #2a2f42 0%,        /* Темний тон основи */
        #3a415a 25%,       /* Дещо світліший */
        #4a5373 50%,       /* Найсвітліший середній тон */
        #3a415a 75%,       /* Дещо світліший (симетрично) */
        #2a2f42 100%       /* Темний тон основи */
        );
      border-radius: 13px;
      overflow: visible;
      border: 2px solid rgba(157, 189, 178, 0.15);
      box-shadow: inset 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .progress-line-indicator {
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
      z-index: 10;
    }
    
    .progress-line-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    
    .progress-line-change {
      font-size: 12px;
      color: #a8b5c0;
      font-family: 'Orbitron', monospace;
    }
    
    .progress-line-change-value {
      font-weight: bold;
      font-size: 12px;
      transition: color 1.3s ease;
      margin-left: 6px;
    }
    
    .progress-line-market-state {
      font-size: 11px;
      font-weight: bold;
      font-family: 'Orbitron', monospace;
      background: rgba(255, 255, 255, 0.05);
      padding: 4px 10px;
      border-radius: 6px;
      transition: all 1.3s ease;
    }
    
    .progress-line-labels {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #8a95a0;
      margin-top: 6px;
      font-family: 'Orbitron', monospace;
    }
  `;
  
  document.head.appendChild(style);
}

// ===============================
// INITIALIZATION
// ===============================
function initPriceTracker() {
  if (isInitialized) return;
  
  isInitialized = true;
  
  addProgressLineStyles();
  
  const defaultTracker = getOrCreateTracker('DEFAULT');
  if (!defaultTracker.ui.container) {
    currentSymbol = 'DEFAULT';
    initProgressLine(defaultTracker);
  }
  
  setupEventListeners();
  
  const throttledTrack = throttle(trackCurrentPrice, 1500);
  
  if (trackerInterval) {
    clearInterval(trackerInterval);
  }
  
  trackerInterval = setInterval(throttledTrack, 10000);
  
  setTimeout(() => {
    throttledTrack();
  }, 500);
}

// ===============================
// START
// ===============================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initPriceTracker();
  });
} else {
  setTimeout(initPriceTracker, 100);
}

// ===============================
// GLOBAL EXPORTS
// ===============================
window.initPriceTracker = initPriceTracker;
window.refreshPriceTracker = refreshPriceTracker;
window.forceUpdatePriceTracker = refreshPriceTracker;

window.cleanupPriceTracker = function() {
  if (trackerInterval) {
    clearInterval(trackerInterval);
    trackerInterval = null;
  }
  
  for (const [symbol, tracker] of priceTrackers) {
    if (tracker.ui.container) {
      tracker.ui.container.remove();
    }
  }
  priceTrackers.clear();
  currentSymbol = '';
  isInitialized = false;
};