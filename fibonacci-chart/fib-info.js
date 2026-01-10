// ===============================
// Fibonacci Metrics — Professional Explanations
// Institutional / TradingView Style
// ===============================

export const fibMetricInfo = {

    // ===============================
    // Retracement Depth Classification
    // ===============================
    retracement: {
        shallow: {
            label: "Shallow Retracement (<38%)",
            short: "Strong trend continuation (Сильне продовження тренду)"
        },
        normal: {
            label: "Normal Retracement (38–61%)",
            short: "Balanced pullback (Збалансований відкат)"
        },
        deep: {
            label: "Deep Retracement (61–100%)",
            short: "Trend vulnerability (Вразливість тренду)"
        },
        overextended: {
            label: "Structure Break (>100%)",
            short: "Trend invalidation (Скасування тренду)"
        }
    },

    // ===============================
    // Impulse Strength
    // ===============================
    impulseStrength: {
        label: "Impulse Strength",
        short: "Directional momentum (Сила імпульсу)"
    },

    // ===============================
    // Volume Strength
    // ===============================
    volumeStrength: {
        label: "Volume Strength",
        short: "Participation level (Рівень об'єму)"
    },

    // ===============================
    // Correction Depth
    // ===============================
    correctionDepth: {
        label: "Correction Depth",
        short: "Pullback magnitude (Глибина корекції)"
    },

    // ===============================
    // Impulse Duration (Bars)
    // ===============================
    impulseBars: {
        label: "Impulse Duration",
        short: "Impulse Velocity (Швидкість імпульсу)"
    },

    // ===============================
    // Volume Climax
    // ===============================
    volumeClimax: {
        label: "Volume Climax",
        short: "Decision point"
    },

    // ===============================
    // NEW PRO METRICS
    // ===============================

    // 1. Impulse Velocity
    impulseVelocity: {
        label: "Impulse Velocity",
        short: "Movement speed (Швидкість імпульсу)"
    },

    // 2. ATR-Normalized Distance
    atrNormalizedDistance: {
        label: "ATR Distance",
        short: "Volatility-adjusted range (Діапазон з урахуванням ATR)"
    },

    // 3. Impulse Exhaustion
    impulseExhaustion: {
        label: "Impulse Exhaustion",
        short: "Fatigue level (Рівень втоми імпульсу)"
    },

    // 4. Impulse Maturity
    impulseMaturity: {
        label: "Impulse Maturity",
        short: "Lifecycle phase (Фаза життєвого циклу імпульсу)"
    },

    // 5. Impulse Quality (NEW)
    impulseQualityPro: {
        label: "Impulse Quality (Pro)",
        short: "Velocity + Volume + Structure (Комплексна якість імпульсу)"
    }
};