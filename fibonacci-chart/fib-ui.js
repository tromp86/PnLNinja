// ===============================
// Fibonacci UI Manager
// ===============================
import { loadDataFromBinance, calculateFibonacciData } from './fib-core.js';
import { renderFibonacciChart } from './fib-renderer.js';
import { updateFibonacciOutput } from './fib-output.js';

export class FibonacciUI {
    constructor() {
        this.fibMinimized = false;
        this.refreshInterval = null;
        this.canvas = null;
        this.currentSymbol = '';
    }

    // ===============================
    // Ініціалізація
    // ===============================
    init() {
        this.canvas = document.getElementById("fibChart");
        if (!this.canvas) {
            console.error("Canvas element not found");
            return;
        }

        // Очистити старі слухачі
        this.cleanupEventListeners();

        // Клік для мінімізації
        this.canvas.addEventListener("click", () => this.toggleMinimize());

        // Автооновлення
        this.startAutoRefresh();

        // Початкове завантаження
        this.loadFromInput();
    }

    // ===============================
    // Очищення слухачів подій
    // ===============================
    cleanupEventListeners() {
        const newCanvas = this.canvas.cloneNode(true);
        this.canvas.parentNode.replaceChild(newCanvas, this.canvas);
        this.canvas = newCanvas;
    }

    // ===============================
    // Перемикання режиму мінімалізації
    // ===============================
    toggleMinimize() {
        this.fibMinimized = !this.fibMinimized;

        this.canvas.classList.toggle("minimized", this.fibMinimized);

        // Перемальовуємо з новим режимом
        this.loadFromInput();
    }

    // ===============================
    // Завантаження даних з інпута
    // ===============================
    async loadFromInput() {
        const input = document.getElementById("symbol");
        if (!input) return;

        const symbol = input.value.trim().toUpperCase();
        if (!symbol) return;

        await this.loadChart(symbol);
    }

    // ===============================
    // Завантаження та малювання графіка
    // ===============================
    async loadChart(symbol) {
        try {
            this.currentSymbol = symbol;

            // 1. Завантажити дані
            const { highs, lows, closes, volumes } = await loadDataFromBinance(symbol);

            // 2. Розрахувати Фібоначчі
            const fibData = calculateFibonacciData(highs, lows, closes, volumes);

            // 3. Намалювати канвас
            renderFibonacciChart(this.canvas, fibData, this.fibMinimized);

            // 4. Оновити MARKET METRICS
            updateFibonacciOutput(fibData);

        } catch (error) {
            console.error("Chart loading error:", error);
        }
    }

    // ===============================
    // Автооновлення
    // ===============================
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(() => {
            if (this.currentSymbol) {
                this.loadChart(this.currentSymbol);
            }
        }, 10 * 60 * 1000); // 10 хвилин
    }

    // ===============================
    // Зупинка автооновлення
    // ===============================
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // ===============================
    // Оновлення символу
    // ===============================
    updateSymbol(symbol) {
        this.currentSymbol = symbol.toUpperCase();
        this.loadChart(this.currentSymbol);
    }
}