// project/
// ├── index.html          # Головна HTML сторінка
// ├── main.js            # Головний файл ініціалізації
// ├── modules/
// │   ├── api.js         # API запити
// │   ├── indicators.js  # Розрахунок індикаторів
// │   ├── analyzer.js    # Головна логіка аналізу
// │   ├── ui.js          # UI рендеринг
// │   ├── animations.js  # Анімації та ефекти
// │   ├── symbols.js     # Робота з символами
// │   └── utils.js       # Допоміжні функції

// ===============================
// MAIN ENTRY POINT
// ===============================
import { analyze } from './modules/analyzer.js';
import { initSymbols } from './modules/symbols.js';
import { setupEventListeners } from './modules/ui.js';

// Глобальні змінні
let isAutoRefresh = false;
let autoUpdateInterval = null;
let lastSymbol = '';
let isManualUpdate = false;

// Експорт глобальних змінних для інших модулів
export { isAutoRefresh };

// 🔥 МИТТЄВЕ ОНОВЛЕННЯ ПРИ ЗМІНІ МОНЕТИ
function manualUpdateWithCharts() {
    const inputEl = document.getElementById("symbol");
    const symbol = inputEl.value.trim().toUpperCase();
    
    if (!symbol) return;
    
    // Скидаємо таймер автооновлення і запускаємо новий
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
    }
    
    isManualUpdate = true;
    lastSymbol = symbol;
    
    // Виконуємо миттєве оновлення
    autoUpdateEverything(true);
    
    // Перезапускаємо автооновлення з нового моменту
    startAutoUpdateInterval();
    
    isManualUpdate = false;
}

// Функція для запуску інтервалу автооновлення
function startAutoUpdateInterval() {
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
    }
    
    autoUpdateInterval = setInterval(() => {
        const inputEl = document.getElementById("symbol");
        if (inputEl.value.trim()) {
            // console.log(`⏰ Планове автооновлення`);
            autoUpdateEverything(false);
        }
    }, 60000); // 60 секунд
}

// Основна функція оновлення
async function autoUpdateEverything(isInstant = false) {
    const inputEl = document.getElementById("symbol");
    const currentSymbol = inputEl.value.trim().toUpperCase();
    
    if (!currentSymbol) return;
    
    // Якщо символ не змінився і це не миттєве оновлення
    if (currentSymbol === lastSymbol && !isInstant && lastSymbol !== '') {
    } else {
        lastSymbol = currentSymbol;
    }
    
    isAutoRefresh = true;
    
    try {
        // ОНОВЛЮЄМО МІНІ-ГРАФІК
        if (window.loadMiniChart) {
            await window.loadMiniChart(currentSymbol);
        }
        
        // ОНОВЛЮЄМО FIB-ГРАФІК
        if (window.loadFibChartFromInput) {
            window.loadFibChartFromInput();
        }
        
        // ОНОВЛЮЄМО АНАЛІЗ
        await analyze();
        
        console.log(`✅ Оновлення завершено для: ${currentSymbol}`);
    } catch (error) {
        console.error("❌ Помилка оновлення:", error);
    } finally {
        isAutoRefresh = false;
    }
}

// Головна ініціалізація
window.onload = async () => {
    const out = document.getElementById("output");    
    // Ініціалізація систем
    await initSymbols();
    setupEventListeners(analyze);
    
    // Ініціалізація графіків
    setTimeout(() => {
        if (window.initMiniChart) window.initMiniChart();
        if (window.initFibChart) window.initFibChart();
        if (window.initPriceTracker) window.initPriceTracker();
    }, 100);
    
    // Перший запуск
    setTimeout(async () => {
        isAutoRefresh = false;
        
        const inputEl = document.getElementById("symbol");
        let initialSymbol = inputEl.value.trim().toUpperCase();
        
        // Якщо input порожній, ставимо BTC
        if (!initialSymbol) {
            initialSymbol = 'BTC';
            inputEl.value = 'BTC';
        }
        
        lastSymbol = initialSymbol;
        await autoUpdateEverything(true); // Миттєве оновлення при запуску

        
        // Запускаємо автооновлення
        startAutoUpdateInterval();
        
    }, 300);
    
    // Експорт функцій для глобального використання
    window.manualUpdateWithCharts = manualUpdateWithCharts;
    window.autoUpdateEverything = autoUpdateEverything;
};

// Обробник Enter для швидкого оновлення
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.id === 'symbol') {
        if (window.manualUpdateWithCharts) {
            window.manualUpdateWithCharts();
        }
    }
});

// Оновлення при зміні символу через інші механізми
window.addEventListener('symbolChanged', () => {
    if (window.manualUpdateWithCharts) {
        window.manualUpdateWithCharts();
    }
});
