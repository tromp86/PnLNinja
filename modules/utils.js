// ===============================
// UTILITY FUNCTIONS
// ===============================

let countdown = 60;
let countdownInterval = null;

export function startCountdown() {
    countdown = 60;
    
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    countdownInterval = setInterval(() => {
        countdown--;
        
        const countdownEl = document.getElementById('countdown');
        if (countdownEl) {
            countdownEl.textContent = `Update in ${countdown}s`;
        }
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);
}

export function formatNumber(num, decimals = 2) {
    if (num === 'N/A' || num === undefined) return 'N/A';
    return Number(num).toFixed(decimals);
}

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
