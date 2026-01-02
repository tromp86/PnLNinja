// ===============================
// IMPORTS
// ===============================
import { analyzeBTC as aiAnalyzeBTC } from './analyze.js';
import { 
  calcMACD, calcRSI, calcOBV, calcStoch, 
  calcBB, calcATR, calcMFI 
} from './indicators.js';
// ===============================
// GLOBAL STATE
// ===============================
let lastData = {};
let countdown = 60;
let countdownInterval = null;

let allSymbols = [];
const output = document.getElementById('output');
// ===============================
// COUNTDOWN LOGIC
// ===============================
function startCountdown() {
  countdown = 60;

  if (countdownInterval) clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    countdown--;

    const countdownEl = document.getElementById('countdown');
    if (countdownEl) {
      countdownEl.textContent = `Update in ${countdown}s`;
    }

    if (countdown <= 0) clearInterval(countdownInterval);
  }, 1000);
}
// ===============================
// API REQUESTS
// ===============================
async function safeJson(resp, fallback) {
  if (!resp.ok) return fallback;
  try {
    return await resp.json();
  } catch {
    return fallback;
  }
}

async function fetchMarketData(symbol) {
  const [oiResp, fResp, kResp] = await Promise.all([
    fetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`),
    fetch(`https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}&limit=2`),
    fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1w&limit=500`)
  ]);

  return {
    oiData: await safeJson(oiResp, {}),
    fArr: await safeJson(fResp, []),
    klines: await safeJson(kResp, [])
  };
}

// ===============================
// INDICATOR CALCULATIONS
// ===============================
function computeIndicators(klines, closes, OI, funding) {
  const rsi = calcRSI(closes) ?? 'N/A';
  const macd = calcMACD(closes);
  const obv = calcOBV(klines) ?? 'N/A';
  const stoch = calcStoch(klines) ?? 'N/A';
  const bb = calcBB(closes);
  const atr = calcATR(klines) ?? 'N/A';
  const mfi = calcMFI(klines) ?? 'N/A';

  const lastPrice = closes[closes.length - 1] || 0;

  const EMA8 = closes.slice(-8).reduce((a,b)=>a+b,0)/8;
  const EMA21 = closes.slice(-21).reduce((a,b)=>a+b,0)/21;
  const EMA50 = closes.slice(-50).reduce((a,b)=>a+b,0)/50;
  const EMA200 = closes.slice(-200).reduce((a,b)=>a+b,0)/200;
  const emaRibbonWidth = Math.abs(EMA8 - EMA21);

  const VWAP = closes.reduce((sum, c, i) => sum + c*(i+1),0) /
               ((closes.length*(closes.length+1))/2);
  const anchoredVWAP = VWAP;

  const keltnerUpper = bb.middle + atr * 1.5;
  const keltnerLower = bb.middle - atr * 1.5;

  const trueRange = Math.max(...klines.map(k => parseFloat(k[2]) - parseFloat(k[3])));
  const avgVolume = klines.reduce((sum,k)=>sum+parseFloat(k[5]),0)/klines.length;
  const volume = parseFloat(klines[klines.length-1][5]) || 0;

  const higherTF = { trend: rsi > 50 ? "bull" : "bear" };
  const currentTF = { trend: rsi > 50 ? "bull" : "bear" };

  const trendSignals = [rsi > 50, macd.macd > macd.signal];
  const momentumSignals = [stoch > 50];
  const volumeSignals = [volume > avgVolume];
  const oiSignals = [OI > 50000];

  return {
    rsi, macd, obv, stoch, bb, atr, mfi,
    lastPrice,
    EMA8, EMA21, EMA50, EMA200, emaRibbonWidth,
    VWAP, anchoredVWAP,
    keltnerUpper, keltnerLower,
    trueRange, avgVolume, volume,
    higherTF, currentTF,
    trendSignals, momentumSignals, volumeSignals, oiSignals
  };
}
// ===============================
// AI ANALYSIS
// ===============================
function runAIAnalysis(data) {
  return aiAnalyzeBTC(data) ?? {
    scenarios: "N/A",
    entrySignals: "N/A"
  };
}
// ===============================
// UI RENDERING
// ===============================
function renderOutput(symbol, lastPrice, OI, funding, indicators, aiResult) {
  output.innerHTML = `
    <div class="collapsible">Market Data (click to expand)</div>

    <div class="content">
      <div><strong>${symbol} – Binance</strong></div>
      <div>Ціна: ${lastPrice}</div>
      <div>OI: ${OI}</div>
      <div>Funding: ${funding}</div>
      <div>RSI: ${indicators.rsi}</div>
      <div>MACD: ${indicators.macd.macd} (Signal: ${indicators.macd.signal})</div>
      <div>OBV/CVD: ${indicators.obv}</div>
      <div>Stochastic: ${indicators.stoch}</div>
      <div>Bollinger: U:${indicators.bb.upper} M:${indicators.bb.middle} L:${indicators.bb.lower}</div>
      <div>ATR: ${indicators.atr}</div>
      <div>MFI: ${indicators.mfi}</div>
    </div>

    <div class="ai-box">
      <div class="flex-row">
        <div class="col">${aiResult.scenarios.replace(/\n/g, '<br>')}</div>
        <div class="col">${aiResult.entrySignals.replace(/\n/g, '<br>')}</div>
      </div>
    </div>
  `;

  const col = output.querySelector(".collapsible");
  const content = output.querySelector(".content");

  col.addEventListener("click", () => {
    col.classList.toggle("active");
    content.style.maxHeight = content.style.maxHeight ? null : content.scrollHeight + "px";
  });
}
// ===============================
// MAIN ANALYZE FUNCTION (MAX POWER VERSION)
// ===============================
let autoSelectTimer = null;


async function analyze() {
    const inputEl = document.getElementById('symbol');
    const out = document.getElementById('output');

    let symbol = inputEl.value.trim().toUpperCase();
    if (!symbol) {
        out.innerHTML = "<div>Введіть символ...</div>";
        return;
    }

    await loadMiniChart(symbol);
await loadFibChart(symbol);

    if (!symbol.endsWith("USDT")) {
        symbol = symbol + "USDT";
    }

    // -------------------------------
    // 2. UI loading state
    // -------------------------------
    startCountdown();
    out.classList.add('updating');
    setTimeout(() => out.classList.remove('updating'), 500);
    out.innerHTML = "Завантаження...";

    try {
        // -------------------------------
        // 3. Fetch all required data
        // -------------------------------
        const { oiData, fArr, klines } = await fetchMarketData(symbol);

        if (!klines || klines.length < 50) {
            out.innerHTML = "<div class='warning'>Недостатньо даних для аналізу</div>";
            return;
        }

        // -------------------------------
        // 4. Extract base values
        // -------------------------------
        const OI = parseFloat(oiData.openInterest) || 0;
        const funding = fArr[1] ? parseFloat(fArr[1].fundingRate) : 0;

        const closes = klines
            .map(k => parseFloat(k[4]))
            .filter(v => !isNaN(v));

        if (closes.length < 50) {
            out.innerHTML = "<div class='warning'>Недостатньо цінових даних</div>";
            return;
        }

        // -------------------------------
        // 5. Compute all indicators
        // -------------------------------
        const ind = computeIndicators(klines, closes, OI, funding);

        // -------------------------------
        // 6. Prepare full AI data object
        // -------------------------------
        const data = {
            // Base
            OI,
            Funding: funding,
            Price: ind.lastPrice,

            // Indicators
            RSI: ind.rsi,
            MACD: ind.macd.macd,
            MACD_Signal: ind.macd.signal,
            OBV_CVD: ind.obv,
            Stochastic: ind.stoch,
            Bollinger_U: ind.bb.upper,
            Bollinger_M: ind.bb.middle,
            Bollinger_L: ind.bb.lower,
            ATR: ind.atr,
            MFI: ind.mfi,

            // EMA / Trend
            EMA8: ind.EMA8,
            EMA21: ind.EMA21,
            EMA50: ind.EMA50,
            EMA200: ind.EMA200,
            emaRibbonWidth: ind.emaRibbonWidth,

            // Volatility / Channels
            VWAP: ind.VWAP,
            anchoredVWAP: ind.anchoredVWAP,
            keltnerUpper: ind.keltnerUpper,
            keltnerLower: ind.keltnerLower,
            trueRange: ind.trueRange,

            // Volume
            avgVolume: ind.avgVolume,
            volume: ind.volume,

            // Trend structures
            higherTF: ind.higherTF,
            currentTF: ind.currentTF,

            // Signals
            trendSignals: ind.trendSignals,
            momentumSignals: ind.momentumSignals,
            volumeSignals: ind.volumeSignals,
            oiSignals: ind.oiSignals
        };

        // -------------------------------
        // 7. AI analysis
        // -------------------------------
        const aiResult = runAIAnalysis(data);

        // -------------------------------
        // 8. Render UI
        // -------------------------------
        renderOutput(symbol, ind.lastPrice, OI, funding, ind, aiResult);

        // -------------------------------
        // 9. Cache last data
        // -------------------------------
        lastData[symbol] = { OI, funding };

        // -------------------------------
        // 10. Debug info (optional)
        // -------------------------------
        console.log("Indicators:", data);

    } catch (err) {
        console.error(err);
        out.innerHTML = "<div class='warning'>Помилка при отриманні даних</div>";
    }
}
// ===============================
// AUTO START
// ===============================
window.onload = () => {
  analyze();
  setInterval(analyze, 60000);
};
// ===============================
// SYMBOL SUGGESTIONS
// ===============================
async function loadSymbols() {
  const resp = await fetch("https://api.binance.com/api/v3/exchangeInfo");
  const data = await resp.json();

  allSymbols = data.symbols
    .filter(s => s.symbol.endsWith("USDT"))
    .map(s => s.symbol.replace("USDT", ""));
}

loadSymbols();

const input = document.getElementById("symbol");
const box = document.getElementById("suggestions");

// ✅ НОВА ФУНКЦІЯ
function updateFibFromInput() {
  let symbol = input.value.trim().toUpperCase();
  if (!symbol) return;
  loadFibChart(symbol);
}

input.addEventListener("input", () => {
  const value = input.value.trim().toUpperCase();

  if (autoSelectTimer) clearTimeout(autoSelectTimer);

  if (!value) {
    box.style.display = "none";
    return;
  }

  const filtered = allSymbols.filter(sym => sym.startsWith(value));

  if (!filtered.length) {
    box.style.display = "none";
    return;
  }

  box.innerHTML = filtered
    .slice(0, 8)
    .map(sym => `<div>${sym}</div>`)
    .join("");

  box.style.display = "block";

  // ✅ АВТОВИБІР ПЕРШОЇ ПІДСказКИ ЧЕРЕЗ 2 СЕК
  autoSelectTimer = setTimeout(() => {
    input.value = filtered[0];
    box.style.display = "none";
    lastData = {};
    analyze();
    updateFibFromInput();
  }, 1500);
});


box.addEventListener("click", (e) => {
  if (e.target.tagName === "DIV") {
    input.value = e.target.innerText;
    box.style.display = "none";
    lastData = {};
    analyze();
    updateFibFromInput();   // ✅ ДОДАНО
  }
});


// ✅ Fib оновлюється при Enter або blur
input.addEventListener("change", updateFibFromInput);
