// ===============================
// SYMBOLS MANAGEMENT
// ===============================
import { fetchAllSymbols } from './api.js';

let allSymbols = [];
let autoSelectTimer = null;
let symbolChangeDebounce = null;
let emptyFieldTimer = null;

export async function initSymbols() {
    allSymbols = await fetchAllSymbols();
    setupSymbolSuggestions();
}

function setupSymbolSuggestions() {
    const input = document.getElementById("symbol");
    const box = document.getElementById("suggestions");
    
    if (!input) return;
    
    input.addEventListener("input", () => {
        const value = input.value.trim().toUpperCase();
        
        // Очищаємо всі таймери
        if (autoSelectTimer) clearTimeout(autoSelectTimer);
        if (symbolChangeDebounce) clearTimeout(symbolChangeDebounce);
        if (emptyFieldTimer) clearTimeout(emptyFieldTimer);
        
        if (!value) {
            box.style.display = "none";
            
            // Якщо поле порожнє, через 3 секунди завантажуємо BTC
            emptyFieldTimer = setTimeout(() => {
                input.value = "BTC";
                if (window.manualUpdateWithCharts) {
                    window.manualUpdateWithCharts();
                } else if (window.autoUpdateEverything) {
                    window.autoUpdateEverything();
                }
            }, 3000);
            
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
        
        // Автовибір через 1.5 секунди
        autoSelectTimer = setTimeout(() => {
            if (filtered.length > 0) {
                input.value = filtered[0];
                box.style.display = "none";
                
                // МИТТЄВЕ ОНОВЛЕННЯ при автовиборі
                if (window.manualUpdateWithCharts) {
                    window.manualUpdateWithCharts();
                } else if (window.autoUpdateEverything) {
                    window.autoUpdateEverything();
                }
            }
        }, 1500);
        
        // Дебаунс для оновлення після введення (500мс)
        symbolChangeDebounce = setTimeout(() => {
            if (value.length >= 2) { // Оновлюємо тільки якщо введено хоча б 2 символи
                if (window.manualUpdateWithCharts) {
                    window.manualUpdateWithCharts();
                }
            }
        }, 500);
    });
    
    box.addEventListener("click", (e) => {
        if (e.target.tagName === "DIV") {
            input.value = e.target.innerText;
            box.style.display = "none";
            
            // МИТТЄВЕ ОНОВЛЕННЯ при кліку
            if (window.manualUpdateWithCharts) {
                window.manualUpdateWithCharts();
            } else if (window.autoUpdateEverything) {
                window.autoUpdateEverything();
            }
        }
    });
    
    // Enter для миттєвого оновлення
    input.addEventListener("keydown", (e) => {
        if (e.key === 'Enter') {
            box.style.display = "none";
            
            // МИТТЄВЕ ОНОВЛЕННЯ при Enter
            if (window.manualUpdateWithCharts) {
                window.manualUpdateWithCharts();
            } else if (window.autoUpdateEverything) {
                window.autoUpdateEverything();
            }
        }
    });
    
    // Оновлення при втраті фокусу
    input.addEventListener("blur", () => {
        setTimeout(() => {
            box.style.display = "none";
            const value = input.value.trim();
            if (value && value.length >= 2) {
                if (window.manualUpdateWithCharts) {
                    window.manualUpdateWithCharts();
                }
            }
        }, 200);
    });
}