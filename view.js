// // --- Mini Chart (Canvas) ---

let animationProgress = 0;
let animationFrame = null;
let colorShiftTime = 0;
let isMinimized = false;

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

  function drawGrid() {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;

    // Вертикальні лінії
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }

    // Горизонтальні лінії
    for (let i = 0; i < height; i += 25) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
  }

function getSegmentColor(prev, curr, shift) {
    const t = (shift / 18) % 360;
    const wave = Math.sin(t * Math.PI / 180);

    if (curr > prev) {
        // ✅ Пастельна зелено-бірюзова палітра
        const hue = 150 + wave * 12;   // м’який зелено-м’ятний
        const sat = 45 + wave * 8;     // пастельна насиченість
        const light = 70 + wave * 6;   // світлий, повітряний
        return `hsl(${hue}, ${sat}%, ${light}%)`;
    }

    if (curr < prev) {
        // ✅ Пастельна коралово-рожева палітра
        const hue = 5 + wave * 10;     // теплий пастельний червоний
        const sat = 50 + wave * 6;
        const light = 72 + wave * 5;
        return `hsl(${hue}, ${sat}%, ${light}%)`;
    }

    // ✅ Пастельний нейтральний синьо-сірий
    const hue = 210 + wave * 5;
    const sat = 12 + wave * 3;
    const light = 75 + wave * 4;
    return `hsl(${hue}, ${sat}%, ${light}%)`;
}
function createMovingGradient(x1, y1, x2, y2, direction) {
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    const offset = (colorShiftTime / 100) % 1;

    if (direction === "up") {
        g.addColorStop(offset, "#1dd1a1");
        g.addColorStop((offset + 0.25) % 1, "#10ac84");
        g.addColorStop((offset + 0.5) % 1, "#0abde3");
        g.addColorStop((offset + 0.75) % 1, "#10ac84");
        g.addColorStop((offset + 1) % 1, "#2b7983ff");
    }
    else if (direction === "down") {
        g.addColorStop(offset, "#ff6b6b");
        g.addColorStop((offset + 0.25) % 1, "#ee5253");
        g.addColorStop((offset + 0.5) % 1, "#ff4757");
        g.addColorStop((offset + 0.75) % 1, "#ee5253");
        g.addColorStop((offset + 1) % 1, "#ff8800ff");
    }
    else {
        g.addColorStop(offset, "#a4b0be");
        g.addColorStop((offset + 0.25) % 1, "#8395a7");
        g.addColorStop((offset + 0.5) % 1, "#576574");
        g.addColorStop((offset + 0.75) % 1, "#8395a7");
        g.addColorStop((offset + 1) % 1, "#a4b0be");
    }

    return g;
}


  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Radial background
    const bg = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, width
    );
    bg.addColorStop(0, "#080c1a");
    bg.addColorStop(1, "#02040a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Сітка
    drawGrid();

    // Мінімізований режим
    if (isMinimized) {
      const last = prices[prices.length - 1];
      const txt = last.toFixed(4);
      const color = getSegmentColor(prices[0], last, colorShiftTime);

      ctx.font = `bold 24px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.shadowBlur = 2;
      ctx.shadowColor = color;

      ctx.fillStyle = color;
      ctx.fillText(txt, width / 2, height / 2);

      ctx.shadowBlur = 20;

      colorShiftTime += 0.77;
      animationFrame = requestAnimationFrame(animate);
      return;
    }

    // Основний режим
    animationProgress = Math.min(animationProgress + 0.02, 1);
    colorShiftTime += 1.77;

    const pointsToShow = Math.floor((prices.length - 1) * animationProgress);

    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // Малюємо лінію
    for (let i = 0; i < pointsToShow; i++) {
      const x1 = i * scaleX;
      const y1 = priceToY(prices[i]);
      const x2 = (i + 1) * scaleX;
      const y2 = priceToY(prices[i + 1]);

      let direction = "neutral";
      if (prices[i + 1] > prices[i]) direction = "up";
      else if (prices[i + 1] < prices[i]) direction = "down";

      const gradient = createMovingGradient(x1, y1, x2, y2, direction);

      const delta = Math.abs(prices[i + 1] - prices[i]);
      const glow = Math.min(35, 8 + delta * 3500);
      ctx.shadowBlur = glow;

ctx.shadowColor =
    direction === "up" ? "#0a4a39" :
    direction === "down" ? "#461920" :
    "rgba(0,0,0,0)"; 
    
      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.shadowBlur = 15;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    ctx.shadowBlur = 0;

    // Остання точка
    if (pointsToShow >= 1) {
      const lastX = pointsToShow * scaleX;
      const lastY = priceToY(prices[pointsToShow]);

      const dotHue = (colorShiftTime / 15) % 360;

      ctx.shadowBlur = 10;
      ctx.shadowColor = `hsla(${dotHue}, 70%, 60%, 0.8)`;

      ctx.beginPath();
      ctx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${dotHue}, 80%, 70%)`;
      ctx.fill();

      ctx.shadowBlur = 0;
    }

    // Бокс з ціною (зліва)
// Бокс з ціною (зліва)
const last = prices[prices.length - 1];
const txt = last.toFixed(4);

// ✅ Визначаємо напрямок ринку для індикатора
let direction;
if (last > prices[prices.length - 2]) direction = "up";
else if (last < prices[prices.length - 2]) direction = "down";
else direction = "neutral";

ctx.font = `${fontSize}px ${fontFamily}`;
ctx.textBaseline = "middle";

const globalColor = getSegmentColor(prices[0], last, colorShiftTime);
const textWidth = ctx.measureText(txt).width;

const boxWidth = textWidth + textPadding * 12;
const boxHeight = fontSize + textPadding * 2;

const boxX = 5;          // ✅ Зліва
const boxY = 5;

const extraPadding = 35;

ctx.fillStyle = "rgba(5, 8, 16, 0.7)";
ctx.beginPath();
const r = 4;

// ✅ Дзеркальна форма зліва
ctx.moveTo(boxX + r, boxY);
ctx.lineTo(boxX + boxWidth + extraPadding - r, boxY);
ctx.quadraticCurveTo(
    boxX + boxWidth + extraPadding,
    boxY,
    boxX + boxWidth + extraPadding,
    boxY + r
);
ctx.lineTo(boxX + boxWidth + extraPadding, boxY + boxHeight - r);
ctx.quadraticCurveTo(
    boxX + boxWidth + extraPadding,
    boxY + boxHeight,
    boxX + boxWidth + extraPadding - r,
    boxY + boxHeight
);
ctx.lineTo(boxX + r, boxY + boxHeight);
ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - r);
ctx.lineTo(boxX, boxY + r);
ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
ctx.closePath();
ctx.fill();

// ✅ Текст
ctx.fillStyle = "#ffffff";
ctx.fillText(txt, boxX + textPadding + 0, boxY + boxHeight / 2);

    // Індикатор
    const dirRadius = 5;
    const dirX = boxX + boxWidth - textPadding - dirRadius;
    const dirY = boxY + boxHeight / 2;

 ctx.beginPath();
ctx.arc(dirX, dirY, dirRadius, 0, Math.PI * 2);
ctx.fillStyle = globalColor;
ctx.fill();

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
