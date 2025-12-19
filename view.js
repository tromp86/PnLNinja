// // --- Mini Chart (Canvas) ---

// let animationProgress = 0;
// let animationFrame = null;
// let colorShiftTime = 0;

// // Малювання графіка з анімацією і кольорами за напрямком
// function drawMiniChart(prices) {
//   const canvas = document.getElementById("miniChart");
//   if (!canvas || !prices || prices.length < 2) return;

//   const ctx = canvas.getContext("2d");

//   // Адаптивне під retina
//   const rect = canvas.getBoundingClientRect();
//   const dpr = window.devicePixelRatio || 1;
//   canvas.width = rect.width * dpr;
//   canvas.height = rect.height * dpr;
//   ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

//   const width = rect.width;
//   const height = rect.height;

//   const max = Math.max(...prices);
//   const min = Math.min(...prices);
//   const range = max - min || 1;

//   const scaleX = width / (prices.length - 1);
//   const scaleY = height / range;

//   // Скидаємо прогрес анімації
//   animationProgress = 0;
//   colorShiftTime = 0;

//   // Налаштування шрифту та стилю тексту
//   const fontFamily = `'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
//   const fontSize = 12;
//   const textPadding = 8;

//   function priceToY(price) {
//     return height - (price - min) * scaleY;
//   }

//   function getSegmentColor(prevPrice, currPrice, hueShift) {
//     const baseHue = (hueShift / 20) % 360;
    
//     if (currPrice > prevPrice) {
//       // Бірюзовий з переливанням (160-180 градусів)
//       const hue = 170 + Math.sin(baseHue * Math.PI / 180) * 15;
//       return `hsl(${hue}, 70%, 55%)`;
//     }
//     if (currPrice < prevPrice) {
//       // Червоно-рожевий з переливанням (350-10 градусів)
//       const hue = 355 + Math.sin(baseHue * Math.PI / 180) * 10;
//       return `hsl(${hue}, 75%, 60%)`;
//     }
//     // Нейтральний сірий
//     return "#a4b0be";
//   }

//   function createMovingGradient(x1, y1, x2, y2, direction) {
//     const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
//     const offset = (colorShiftTime / 100) % 1;
    
//     if (direction === 'up') {
//       // Бірюзовий градієнт
//       gradient.addColorStop(offset, "#1dd1a1");
//       gradient.addColorStop((offset + 0.3) % 1, "#10ac84");
//       gradient.addColorStop((offset + 0.6) % 1, "#0abde3");
//       gradient.addColorStop((offset + 1) % 1, "#1dd1a1");
//     } else if (direction === 'down') {
//       // Червоний градієнт
//       gradient.addColorStop(offset, "#ee5a6f");
//       gradient.addColorStop((offset + 0.3) % 1, "#c23616");
//       gradient.addColorStop((offset + 0.6) % 1, "#ff6348");
//       gradient.addColorStop((offset + 1) % 1, "#ee5a6f");
//     } else {
//       // Сірий градієнт
//       gradient.addColorStop(offset, "#a4b0be");
//       gradient.addColorStop((offset + 0.5) % 1, "#8395a7");
//       gradient.addColorStop((offset + 1) % 1, "#a4b0be");
//     }
    
//     return gradient;
//   }

//   function animate() {
//     ctx.clearRect(0, 0, width, height);

//     // Збільшуємо прогрес
//     animationProgress += 0.02;
//     if (animationProgress > 1) animationProgress = 1;

//     // Час для переливання кольорів та руху градієнта
//     colorShiftTime += 0.77; // Збільшено швидкість з 1 до 2

//     const pointsToShow = Math.floor((prices.length - 1) * animationProgress);

//     // Трохи фону, щоб виглядало як елемент інтерфейсу
//     ctx.fillStyle = "#050810";
//     ctx.fillRect(0, 0, width, height);

//     // Малюємо лінію сегментами з рухомим градієнтом + неон + розброс
//     ctx.lineWidth = 2.5;
//     ctx.lineJoin = "round";
//     ctx.lineCap = "round";

//     for (let i = 0; i < pointsToShow; i++) {
//       const x1 = i * scaleX;
//       const y1 = priceToY(prices[i]);
//       const x2 = (i + 1) * scaleX;
//       const y2 = priceToY(prices[i + 1]);

//       let direction = 'neutral';
//       if (prices[i + 1] > prices[i]) direction = 'up';
//       else if (prices[i + 1] < prices[i]) direction = 'down';

//       // Невеликий рандомний розброс (детермінований на основі індексу)
//       const randomOffset = Math.sin(i * 23 + colorShiftTime / 100);
//       const y1WithNoise = y1 + randomOffset;
//       const y2WithNoise = y2 + randomOffset;

//       const gradient = createMovingGradient(x1, y1WithNoise, x2, y2WithNoise, direction);

//       // Неоновий ефект - малюємо тінь
//       ctx.shadowBlur = 40;
//       ctx.shadowColor = direction === 'up' ? '#0a4a39ff' : direction === 'down' ? '#461920ff' : '#a4b0be';
      
//       ctx.beginPath();
//       ctx.strokeStyle = gradient;
//       ctx.moveTo(x1, y1WithNoise);
//       ctx.lineTo(x2, y2WithNoise);
//       ctx.stroke();

//       // Додатковий шар для посилення неону
//       ctx.shadowBlur = 15;
//       ctx.globalAlpha = 0.5;
//       ctx.stroke();
//       ctx.globalAlpha = 1.0;
//     }
    
//     // Прибираємо тінь після малювання ліній
//     ctx.shadowBlur = 0;

//     // Підсвічення останньої точки з переливанням
//     if (pointsToShow >= 1) {
//       const lastIndex = pointsToShow;
//       const lastX = lastIndex * scaleX;
//       const lastY = priceToY(prices[lastIndex]);

//       const dotHue = (colorShiftTime / 15) % 360;
//       ctx.shadowColor = `hsla(${dotHue}, 70%, 60%, 0.8)`;
//       ctx.shadowBlur = 10;
//       ctx.beginPath();
//       ctx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
//       ctx.fillStyle = `hsl(${dotHue}, 80%, 70%)`;
//       ctx.fill();
//       ctx.shadowBlur = 0;
//     }

//     // Виводимо останню ціну
//     const lastPrice = prices[prices.length - 1];
//     const lastPriceText = lastPrice.toFixed(4);

//     ctx.font = `${fontSize}px ${fontFamily}`;
//     ctx.textBaseline = "middle";

//     // Колір тексту за глобальним напрямком
//     const globalColor = getSegmentColor(prices[0], prices[prices.length - 1], colorShiftTime);
//     const textBgColor = "rgba(0, 0, 0, 0)";
//     const textColor = "#ffffff";

//     const textWidth = ctx.measureText(lastPriceText).width;
//     const boxWidth = textWidth + textPadding * 2;
//     const boxHeight = fontSize + textPadding * 2;

//     const boxX = width - boxWidth - 6;
//     const boxY = 6;

//     // Фон під ціну
//     ctx.fillStyle = textBgColor;
//     ctx.beginPath();
//     const r = 4;
//     ctx.moveTo(boxX + r, boxY);
//     ctx.lineTo(boxX + boxWidth - r, boxY);
//     ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + r);
//     ctx.lineTo(boxX + boxWidth, boxY + boxHeight - r);
//     ctx.quadraticCurveTo(
//       boxX + boxWidth,
//       boxY + boxHeight,
//       boxX + boxWidth - r,
//       boxY + boxHeight
//     );
//     ctx.lineTo(boxX + r, boxY + boxHeight);
//     ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - r);
//     ctx.lineTo(boxX, boxY + r);
//     ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
//     ctx.closePath();
//     ctx.fill();

//     // Малюємо текст ціни
//     ctx.fillStyle = textColor;
//     ctx.fillText(lastPriceText, boxX + textPadding - 32, boxY + boxHeight / 2);

//     // Маленький індикатор напрямку поруч з ціною з переливанням
//     const dirRadius = 3;
//     const dirX = boxX + boxWidth - textPadding - dirRadius;
//     const dirY = boxY + boxHeight / 2;
//     ctx.beginPath();
//     ctx.arc(dirX, dirY, dirRadius, 0, Math.PI * 2);
//     ctx.fillStyle = globalColor;
//     ctx.fill();

//     // Продовжуємо анімацію безкінечно
//     animationFrame = requestAnimationFrame(animate);
//   }

//   // Скасовуємо попередню анімацію
//   if (animationFrame) {
//     cancelAnimationFrame(animationFrame);
//   }

//   animate();
// }

// // Завантаження даних з Binance
// async function loadMiniChart(symbol) {
//   // нормалізація символу
//   symbol = symbol
//     .trim()
//     .toUpperCase()
//     .replace(/[^A-Z0-9]/g, "");

//   if (!symbol.endsWith("USDT")) {
//     symbol = symbol + "USDT";
//   }

//   try {
//     const resp = await fetch(
//       `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=50`
//     );

//     const data = await resp.json();

//     if (!Array.isArray(data)) return;

//     const closes = data.map((c) => parseFloat(c[4]));
//     drawMiniChart(closes);
//   } catch (e) {
//     console.error("Помилка при завантаженні графіка:", e);
//   }
// }

// // Експорт функції
// window.loadMiniChart = loadMiniChart;









//!!!!!!!!!! старий не удалять тут ми переключаємо по кліку
// --- Mini Chart (Canvas) ---

// let animationProgress = 0;
// let animationFrame = null;
// let colorShiftTime = 0;
// let isMinimized = false;

// function drawMiniChart(prices) {
//   const canvas = document.getElementById("miniChart");
//   if (!canvas || !prices || prices.length < 2) return;

//   const ctx = canvas.getContext("2d");

//   // Retina
//   const rect = canvas.getBoundingClientRect();
//   const dpr = window.devicePixelRatio || 1;
//   canvas.width = rect.width * dpr;
//   canvas.height = rect.height * dpr;
//   ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

//   const width = rect.width;
//   const height = rect.height;

//   const max = Math.max(...prices);
//   const min = Math.min(...prices);
//   const range = max - min || 1;

//   const scaleX = width / (prices.length - 1);
//   const scaleY = height / range;

//   animationProgress = 0;
//   colorShiftTime = 0;

//   const fontFamily = `'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
//   const fontSize = 14;
//   const textPadding = 8;

//   const priceToY = (p) => height - (p - min) * scaleY;

//   function getSegmentColor(prev, curr, shift) {
//     const baseHue = (shift / 20) % 360;

//     if (curr > prev) {
//       const hue = 170 + Math.sin(baseHue * Math.PI / 180) * 15;
//       return `hsl(${hue}, 70%, 55%)`;
//     }
//     if (curr < prev) {
//       const hue = 355 + Math.sin(baseHue * Math.PI / 180) * 10;
//       return `hsl(${hue}, 75%, 60%)`;
//     }
//     return "#a4b0be";
//   }

//   function createMovingGradient(x1, y1, x2, y2, direction) {
//     const g = ctx.createLinearGradient(x1, y1, x2, y2);
//     const offset = (colorShiftTime / 100) % 1;

//     if (direction === "up") {
//       g.addColorStop(offset, "#1dd1a1");
//       g.addColorStop((offset + 0.3) % 1, "#10ac84");
//       g.addColorStop((offset + 0.6) % 1, "#0abde3");
//     } else if (direction === "down") {
//       g.addColorStop(offset, "#ee5a6f");
//       g.addColorStop((offset + 0.3) % 1, "#c23616");
//       g.addColorStop((offset + 0.6) % 1, "#ff6348");
//     } else {
//       g.addColorStop(offset, "#a4b0be");
//       g.addColorStop((offset + 0.5) % 1, "#8395a7");
//     }

//     return g;
//   }

//   function animate() {
//     ctx.clearRect(0, 0, width, height);

//     // ✅ Radial background
//     const bg = ctx.createRadialGradient(
//       width / 2, height / 2, 0,
//       width / 2, height / 2, width
//     );
//     bg.addColorStop(0, "#080c1aff");
//     bg.addColorStop(1, "#02040a");
//     ctx.fillStyle = bg;
//     ctx.fillRect(0, 0, width, height);

//     // ✅ Мінімізований режим
//     if (isMinimized) {
//       const last = prices[prices.length - 1];
//       const txt = last.toFixed(4);
//       const color = getSegmentColor(prices[0], last, colorShiftTime);

//       ctx.font = `bold 24px ${fontFamily}`;
//       ctx.textAlign = "center";
//       ctx.textBaseline = "middle";

//       ctx.shadowBlur = 2;
//       ctx.shadowColor = color;

//       ctx.fillStyle = color;
//       ctx.fillText(txt, width / 2, height / 2);

//       ctx.shadowBlur = 0;

//       colorShiftTime += 1.77;
//       animationFrame = requestAnimationFrame(animate);
//       return;
//     }

//     // ✅ Основний режим
//     animationProgress = Math.min(animationProgress + 1, 1);
//     colorShiftTime += 1.77;

//     const pointsToShow = Math.floor((prices.length - 1) * animationProgress);

//     ctx.lineWidth = 2;
//     ctx.lineJoin = "round";
//     ctx.lineCap = "round";

//     // ✅ Лінія без розбросу + Adaptive Glow
//     for (let i = 0; i < pointsToShow; i++) {
//       const x1 = i * scaleX;
//       const y1 = priceToY(prices[i]);
//       const x2 = (i + 1) * scaleX;
//       const y2 = priceToY(prices[i + 1]);

//       let direction = "neutral";
//       if (prices[i + 1] > prices[i]) direction = "up";
//       else if (prices[i + 1] < prices[i]) direction = "down";

//       const gradient = createMovingGradient(x1, y1, x2, y2, direction);

//       // ✅ Adaptive Glow
//       const delta = Math.abs(prices[i + 1] - prices[i]);
//       const glow = Math.min(35, 8 + delta * 3500);
//       ctx.shadowBlur = glow;

//       ctx.shadowColor =
//         direction === "up" ? "#0a4a39ff" :
//         direction === "down" ? "#461920ff" :
//         "#a4b0be";

//       ctx.beginPath();
//       ctx.strokeStyle = gradient;
//       ctx.moveTo(x1, y1);
//       ctx.lineTo(x2, y2);
//       ctx.stroke();
//     }

//     ctx.shadowBlur = 0;

//     // ✅ Підсвічення останньої точки
//     if (pointsToShow >= 1) {
//       const lastX = pointsToShow * scaleX;
//       const lastY = priceToY(prices[pointsToShow]);

//       const dotHue = (colorShiftTime / 15) % 360;

//       ctx.shadowBlur = 10;
//       ctx.shadowColor = `hsla(${dotHue}, 70%, 60%, 0.8)`;

//       ctx.beginPath();
//       ctx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
//       ctx.fillStyle = `hsl(${dotHue}, 80%, 70%)`;
//       ctx.fill();

//       ctx.shadowBlur = 0;
//     }

//     // ✅ Бокс з ціною
//     const last = prices[prices.length - 1];
//     const txt = last.toFixed(4);

//     ctx.font = `${fontSize}px ${fontFamily}`;
//     ctx.textBaseline = "middle";

//     const globalColor = getSegmentColor(prices[0], last, colorShiftTime);
//     const textWidth = ctx.measureText(txt).width;

//     const boxWidth = textWidth + textPadding * 12;
//     const boxHeight = fontSize + textPadding * 2;

//     const boxX = width - boxWidth - 5;
//     const boxY = 5;

//     const extraPadding = 35;

//     ctx.fillStyle = "#0508106d";
//     ctx.beginPath();
//     const r = 4;

//     ctx.moveTo(boxX - extraPadding + r, boxY);
//     ctx.lineTo(boxX + boxWidth + extraPadding - r, boxY);
//     ctx.quadraticCurveTo(boxX + boxWidth + extraPadding, boxY, boxX + boxWidth + extraPadding, boxY + r);
//     ctx.lineTo(boxX + boxWidth + extraPadding, boxY + boxHeight - r);
//     ctx.quadraticCurveTo(boxX + boxWidth + extraPadding, boxY + boxHeight, boxX + boxWidth + extraPadding - r, boxY + boxHeight);
//     ctx.lineTo(boxX - extraPadding + r, boxY + boxHeight);
//     ctx.quadraticCurveTo(boxX - extraPadding, boxY + boxHeight, boxX - extraPadding, boxY + boxHeight - r);
//     ctx.lineTo(boxX - extraPadding, boxY + r);
//     ctx.quadraticCurveTo(boxX - extraPadding, boxY, boxX - extraPadding + r, boxY);
//     ctx.closePath();
//     ctx.fill();

//     ctx.fillStyle = "#ffffff";
//     ctx.fillText(txt, boxX + textPadding - 2, boxY + boxHeight / 2);

//     // ✅ Індикатор напрямку
//     const dirRadius = 5;
//     const dirX = boxX + boxWidth - textPadding - dirRadius;
//     const dirY = boxY + boxHeight / 2;

//     ctx.beginPath();
//     ctx.arc(dirX, dirY, dirRadius, 0, Math.PI * 2);
//     ctx.fillStyle = globalColor;
//     ctx.fill();

//     animationFrame = requestAnimationFrame(animate);
//   }

//   canvas.onclick = () => (isMinimized = !isMinimized);

//   if (animationFrame) cancelAnimationFrame(animationFrame);

//   animate();
// }










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
    const baseHue = (shift / 20) % 360;
    if (curr > prev) {
      const hue = 170 + Math.sin(baseHue * Math.PI / 180) * 15;
      return `hsl(${hue}, 70%, 55%)`;
    }
    if (curr < prev) {
      const hue = 355 + Math.sin(baseHue * Math.PI / 180) * 10;
      return `hsl(${hue}, 75%, 60%)`;
    }
    return "#a4b0be";
  }

  function createMovingGradient(x1, y1, x2, y2, direction) {
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    const offset = (colorShiftTime / 100) % 1;

    if (direction === "up") {
      g.addColorStop(offset, "#1dd1a1");
      g.addColorStop((offset + 0.3) % 1, "#10ac84");
      g.addColorStop((offset + 0.6) % 1, "#0abde3");
    } else if (direction === "down") {
      g.addColorStop(offset, "#ee5a6f");
      g.addColorStop((offset + 0.3) % 1, "#c23616");
      g.addColorStop((offset + 0.6) % 1, "#ff6348");
    } else {
      g.addColorStop(offset, "#a4b0be");
      g.addColorStop((offset + 0.5) % 1, "#8395a7");
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

      ctx.shadowBlur = 15;
      ctx.shadowColor = color;

      ctx.fillStyle = color;
      ctx.fillText(txt, width / 2, height / 2);

      ctx.shadowBlur = 0;

      colorShiftTime += 1.77;
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
        "#a4b0be";

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

    // Бокс з ціною
    const last = prices[prices.length - 1];
    const txt = last.toFixed(4);

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = "middle";

    const globalColor = getSegmentColor(prices[0], last, colorShiftTime);
    const textWidth = ctx.measureText(txt).width;

    const boxWidth = textWidth + textPadding * 12;
    const boxHeight = fontSize + textPadding * 2;

    const boxX = width - boxWidth - 5;
    const boxY = 5;

    const extraPadding = 35;

    ctx.fillStyle = "rgba(5, 8, 16, 0.7)";
    ctx.beginPath();
    const r = 4;

    ctx.moveTo(boxX - extraPadding + r, boxY);
    ctx.lineTo(boxX + boxWidth + extraPadding - r, boxY);
    ctx.quadraticCurveTo(boxX + boxWidth + extraPadding, boxY, boxX + boxWidth + extraPadding, boxY + r);
    ctx.lineTo(boxX + boxWidth + extraPadding, boxY + boxHeight - r);
    ctx.quadraticCurveTo(boxX + boxWidth + extraPadding, boxY + boxHeight, boxX + boxWidth + extraPadding - r, boxY + boxHeight);
    ctx.lineTo(boxX - extraPadding + r, boxY + boxHeight);
    ctx.quadraticCurveTo(boxX - extraPadding, boxY + boxHeight, boxX - extraPadding, boxY + boxHeight - r);
    ctx.lineTo(boxX - extraPadding, boxY + r);
    ctx.quadraticCurveTo(boxX - extraPadding, boxY, boxX - extraPadding + r, boxY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.fillText(txt, boxX + textPadding - 2, boxY + boxHeight / 2);

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
