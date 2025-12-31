let animationProgress = 0;
let animationFrame = null;
let colorShiftTime = 0;
let isMinimized = false;

// Кешовані фони
let cachedGrid = null;
let cachedBackground = null;

function drawMiniChart(prices) {
  const canvas = document.getElementById("miniChart");
  if (!canvas || !prices || prices.length < 2) return;

  const ctx = canvas.getContext("2d");

  // Retina
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

// ❗ Скидаємо кеш, бо розмір canvas змінився
cachedGrid = null;
cachedBackground = null;


  const width = rect.width;
  const height = rect.height;

  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const range = max - min || 1;

  const scaleX = width / (prices.length - 1);
  const scaleY = height / range;

  animationProgress = 0;
  colorShiftTime = 0;

  const fontFamily = `'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  const fontSize = 14;
  const textPadding = 8;

  const priceToY = (p) => height - (p - min) * scaleY;

  // -----------------------------
  // КЕШУЄМО ФОН
  // -----------------------------
  if (!cachedBackground) {
    const bgCanvas = document.createElement("canvas");
    bgCanvas.width = width;
    bgCanvas.height = height;
    const bgCtx = bgCanvas.getContext("2d");

    const bg = bgCtx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, width
    );
    bg.addColorStop(0, "#080c1a");
    bg.addColorStop(1, "#02040a");

    bgCtx.fillStyle = bg;
    bgCtx.fillRect(0, 0, width, height);

    cachedBackground = bgCanvas;
  }

  // -----------------------------
  // КЕШУЄМО СІТКУ
  // -----------------------------
  if (!cachedGrid) {
    const gridCanvas = document.createElement("canvas");
    gridCanvas.width = width;
    gridCanvas.height = height;
    const gctx = gridCanvas.getContext("2d");

    gctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    gctx.lineWidth = 1;

    for (let i = 0; i < width; i += 40) {
      gctx.beginPath();
      gctx.moveTo(i, 0);
      gctx.lineTo(i, height);
      gctx.stroke();
    }

    for (let i = 0; i < height; i += 25) {
      gctx.beginPath();
      gctx.moveTo(0, i);
      gctx.lineTo(width, i);
      gctx.stroke();
    }

    cachedGrid = gridCanvas;
  }

  // -----------------------------
  // КОЛІР СЕГМЕНТА (оптимізовано)
  // -----------------------------
  function getSegmentColor(prev, curr, shift) {
    const t = (shift * 0.055) % 360;
    const wave = Math.sin(t * 0.01745);

    if (curr > prev) return `hsl(${150 + wave * 12}, 45%, 70%)`;
    if (curr < prev) return `hsl(${5 + wave * 10}, 50%, 72%)`;
    return `hsl(${210 + wave * 5}, 12%, 75%)`;
  }

  // -----------------------------
  // ГРАДІЄНТ (спрощений)
  // -----------------------------
  function createMovingGradient(x1, y1, x2, y2, direction) {
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    const offset = (colorShiftTime * 0.01) % 1;

    if (direction === "up") {
      g.addColorStop(offset, "#1dd1a1");
      g.addColorStop((offset + 0.5) % 1, "#0abde3");
      g.addColorStop((offset + 1) % 1, "#10ac84");
    } else if (direction === "down") {
      g.addColorStop(offset, "#ff6b6b");
      g.addColorStop((offset + 0.5) % 1, "#ff4757");
      g.addColorStop((offset + 1) % 1, "#ee5253");
    } else {
      g.addColorStop(offset, "#a4b0be");
      g.addColorStop((offset + 0.5) % 1, "#576574");
      g.addColorStop((offset + 1) % 1, "#8395a7");
    }

    return g;
  }

  // -----------------------------
  // Анімація
  // -----------------------------
  function animate() {
    ctx.drawImage(cachedBackground, 0, 0);
    ctx.drawImage(cachedGrid, 0, 0);

    // Мінімізований режим
    if (isMinimized) {
      const last = prices[prices.length - 1];
      const txt = last.toFixed(4);
      const color = getSegmentColor(prices[0], last, colorShiftTime);

      ctx.font = `bold 24px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = color;
      ctx.fillText(txt, width / 2, height / 2);

      colorShiftTime += 0.7;
      animationFrame = requestAnimationFrame(animate);
      return;
    }

    // Основний режим
    animationProgress = Math.min(animationProgress + 0.03, 1);
    colorShiftTime += 1.2;

    const pointsToShow = Math.floor((prices.length - 1) * animationProgress);

    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    for (let i = 0; i < pointsToShow; i++) {
      const x1 = i * scaleX;
      const y1 = priceToY(prices[i]);
      const x2 = (i + 1) * scaleX;
      const y2 = priceToY(prices[i + 1]);

      let direction =
        prices[i + 1] > prices[i]
          ? "up"
          : prices[i + 1] < prices[i]
          ? "down"
          : "neutral";

      ctx.strokeStyle = createMovingGradient(x1, y1, x2, y2, direction);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Остання точка
    if (pointsToShow >= 1) {
      const lastX = pointsToShow * scaleX;
      const lastY = priceToY(prices[pointsToShow]);

      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fillStyle = getSegmentColor(
        prices[pointsToShow - 1],
        prices[pointsToShow],
        colorShiftTime
      );
      ctx.fill();
    }

// Бокс з ціною
const last = prices[prices.length - 1];
const txt = last.toFixed(4);

// 🔥 FIX: повертаємо нормальне вирівнювання
ctx.textAlign = "left";
ctx.textBaseline = "middle";

ctx.font = `${fontSize}px ${fontFamily}`;
const textWidth = ctx.measureText(txt).width;

const boxWidth = textWidth + textPadding * 10;
const boxHeight = fontSize + textPadding * 2;

ctx.fillStyle = "rgba(5, 8, 16, 0.7)";
ctx.fillRect(5, 5, boxWidth, boxHeight);

ctx.fillStyle = "#fff";
ctx.fillText(txt, 5 + textPadding, 5 + boxHeight / 2);

    animationFrame = requestAnimationFrame(animate);
  }

  canvas.onclick = () => (isMinimized = !isMinimized);

  if (animationFrame) cancelAnimationFrame(animationFrame);

  animate();
}












// Завантаження даних з Binance
async function loadMiniChart(symbol) {
  symbol = symbol
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (!symbol.endsWith("USDT")) {
    symbol = symbol + "USDT";
  }

  try {
    const resp = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=50`
    );

    const data = await resp.json();

    if (!Array.isArray(data)) return;

    const closes = data.map((c) => parseFloat(c[4]));
    drawMiniChart(closes);
  } catch (e) {
    console.error("Помилка при завантаженні графіка:", e);
  }
}

// Експорт функції
window.loadMiniChart = loadMiniChart;
