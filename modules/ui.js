// ===============================
// UI RENDERING
// ===============================

export function renderOutput(symbol, indicators, aiResult, OI, funding) {
    const output = document.getElementById('output');
    
    output.innerHTML = `
        <div class="collapsible">Market Data (click to expand)</div>
        <div class="content">
            <div><strong>${symbol} – Binance</strong></div>
            <div>Ціна: ${indicators.lastPrice}</div>
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

    // Додаємо обробник для розгортання
    const col = output.querySelector(".collapsible");
    const content = output.querySelector(".content");
    
    col.addEventListener("click", () => {
        col.classList.toggle("active");
        content.style.maxHeight = content.style.maxHeight ? null : content.scrollHeight + "px";
    });
}

export function setupEventListeners(analyzeFunc) {
    const input = document.getElementById("symbol");
    const box = document.getElementById("suggestions");
    
    // Обробник вводу
    input.addEventListener("input", () => {
        // Тут буде логіка підказок з symbols.js
    });
    
    // Аналіз при натисканні Enter
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            analyzeFunc();
        }
    });
}