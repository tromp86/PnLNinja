// Elements
const notionalInput = document.getElementById("notionalInput");
const pctNum = document.getElementById("pctNum");
const pctRange = document.getElementById("pctRange");
const marginEl = document.getElementById("margin");
const pnlEl = document.getElementById("pnl");
const pnlPctEl = document.getElementById("pnlPct");

const price1El = document.getElementById("price1");
const price2El = document.getElementById("price2");
const priceDiffEl = document.getElementById("priceDiff");

const pctMinus = document.getElementById("pctMinus");
const pctPlus = document.getElementById("pctPlus");

const LEVERAGE = 10;

// Formatters
function formatUSD(n) {
  return n.toFixed(2) + "$";
}
function formatPct(n) {
  return n.toFixed(2) + "%";
}

function parseNumber(n) {
  let num = parseFloat(n);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

// === CORE FUNCTIONS ===

// % -> price2
function updatePriceFromPct() {
  const price1 = parseNumber(price1El.value);
  const pct = parseNumber(pctNum.value);

  if (price1 === 0) return;

  const price2 = parseNumber(price1 * (1 + pct / 100));
  price2El.value = price2.toFixed(2);
}

// price2 -> %
function updatePctFromPrice() {
  const price1 = parseNumber(price1El.value);
  const price2 = parseNumber(price2El.value);

  if (price1 === 0) return;

  const pct = parseNumber(((price2 - price1) / price1) * 100);
  pctNum.value = pct.toFixed(2);
  pctRange.value = pct.toFixed(2);
}

// Full recalculation
function recalc() {
  const notional = parseNumber(notionalInput.value);
  const pct = parseNumber(pctNum.value);

  const margin = notional / LEVERAGE;
  const pnl = notional * (pct / 100);
  const pnlPct = margin > 0 ? (pnl / margin) * 100 : 0;

  marginEl.textContent = formatUSD(margin);
  pnlEl.textContent = (pnl >= 0 ? "+" : "") + formatUSD(pnl);
  pnlPctEl.textContent = formatPct(pnlPct);

  // animation
  pnlEl.classList.remove("pulse");
  void pnlEl.offsetWidth;
  pnlEl.classList.add("pulse");

  // diff %
  const price1 = parseNumber(price1El.value);
  const price2 = parseNumber(price2El.value);

  if (price1 !== 0) {
    const diffPct = ((price2 - price1) / price1) * 100;
    priceDiffEl.textContent =
      (diffPct >= 0 ? "+" : "") + diffPct.toFixed(2) + "%";
    priceDiffEl.className = "value " + (diffPct >= 0 ? "good" : "bad");
  }
}

// === EVENTS ===

// Manual % input
pctNum.addEventListener("input", () => {
  pctRange.value = pctNum.value;
  updatePriceFromPct();
  recalc();
});

// Slider %
pctRange.addEventListener("input", () => {
  pctNum.value = pctRange.value;
  updatePriceFromPct();
  recalc();
});

// Buttons
pctMinus.addEventListener("click", () => {
  let val = parseNumber(pctNum.value);
  val = Math.max(val - 1, -150);   // мінімум -150%
  pctNum.value = val.toFixed(2);
  pctRange.value = val.toFixed(2);
  updatePriceFromPct();
  recalc();
});

pctPlus.addEventListener("click", () => {
  let val = parseNumber(pctNum.value);
  val = Math.min(val + 1, 150);   // максимум +150%
  pctNum.value = val.toFixed(2);
  pctRange.value = val.toFixed(2);
  updatePriceFromPct();
  recalc();
});

// Price inputs
price1El.addEventListener("input", () => {
  updatePriceFromPct();
  recalc();
});

price2El.addEventListener("input", () => {
  updatePctFromPrice();
  recalc();
});
// Notional input - MUST recalc everything instantly
notionalInput.addEventListener("input", () => {
  updatePriceFromPct();
  recalc();
});

// Price1 input
price1El.addEventListener("input", () => {
  updatePctFromPrice();  // ensure pct is always synced
  updatePriceFromPct();  // ensure price2 recalculates (optional)
  recalc();
});

// Price2 input
price2El.addEventListener("input", () => {
  updatePctFromPrice();
  recalc();
});

// Initial
recalc();

document.getElementById("sendBtn").addEventListener("click", () => {
    const price1 = price1El.value;
    const price2 = price2El.value;
    const notional = notionalInput.value;

    sendToTelegram(price1, price2, notional);
});






const APP_VERSION = "1.0";

document.getElementById("appVersion").textContent = "Version " + APP_VERSION;
