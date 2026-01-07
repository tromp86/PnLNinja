
// ─── fib-chart.js        # Головний файл (експорт)
// fibonacci-chart/
// ├── fib-core.js          # Основна логіка розрахунків
// ├── fib-renderer.js      # Малювання на canvas
// ├── fib-ui.js           # UI та взаємодія


// ===============================
// Fibonacci Chart - Main Entry Point
// ===============================

import { FibonacciUI } from './fibonacci-chart/fib-ui.js';

// Глобальні змінні
let fibUI = null;

// Ініціалізація при завантаженні сторінки
function initFibonacciChart() {
    fibUI = new FibonacciUI();
    fibUI.init();
}

// Глобальні функції для виклику з HTML
window.loadFibChart = (symbol) => {
    if (fibUI) {
        fibUI.updateSymbol(symbol);
    }
};

window.loadFibChartFromInput = () => {
    if (fibUI) {
        fibUI.loadFromInput();
    }
};

window.initFibChart = initFibonacciChart;

// Автоматична ініціалізація при завантаженні сторінки
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFibonacciChart);
} else {
    initFibonacciChart();
}

// Експорт для використання як модуля
export { fibUI, initFibonacciChart };