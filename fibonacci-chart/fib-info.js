// ===============================
// Fibonacci Metrics — Professional Explanations
// Institutional / TradingView Style
// ===============================

export const fibMetricInfo = {

    // ===============================
    // Impulse Direction
    // ===============================
    impulseDirection: {
        bullish: {
            label: "Bullish Impulse",
            short: "Buy-side control",
            long: "Ціна формує вищі мінімуми та пробиває ключові рівні без глибоких відкатів. Попит домінує, структура ринку зберігається бичачою."
        },
        bearish: {
            label: "Bearish Impulse",
            short: "Sell-side control",
            long: "Ціна формує нижчі максимуми та слабкі корекції. Пропозиція переважає, ринок перебуває під тиском продавців."
        }
    },

    // ===============================
    // Retracement Depth Classification
    // ===============================
    retracement: {
        shallow: {
            label: "Shallow Retracement (<38%)",
            short: "Strong trend continuation",
            long: "Корекція обмежується рівнями до 38%. Це свідчить про агресивний тренд, де ринок не дає глибоких можливостей для входу."
        },
        normal: {
            label: "Normal Retracement (38–61%)",
            short: "Balanced pullback",
            long: "Корекція в зоні 38–61% від імпульсу. Типова поведінка здорового тренду з контрольованим ризиком."
        },
        deep: {
            label: "Deep Retracement (61–100%)",
            short: "Trend vulnerability",
            long: "Глибока корекція, що свідчить про ослаблення імпульсу. Ймовірність продовження тренду знижується."
        },
        overextended: {
            label: "Structure Break (>100%)",
            short: "Trend invalidation",
            long: "Ціна перекриває весь попередній імпульс. Трендова структура зламана, сценарій продовження неактуальний."
        }
    },

    // ===============================
    // Golden Pocket Analysis
    // ===============================
    goldenPocket: {
        inside: {
            label: "Inside Golden Pocket (0.618–0.65)",
            short: "Optimal reaction zone",
            long: "Ціна знаходиться в зоні максимальної ймовірності реакції. Часто використовується для продовження тренду при підтвердженні об’ємом або структурою."
        },
        near: {
            label: "Near Golden Pocket",
            short: "Conditional setup",
            long: "Ціна наближається до Golden Pocket, але ще не в ключовій зоні. Потрібне додаткове підтвердження."
        },
        outside: {
            label: "Outside Golden Pocket",
            short: "Low structural relevance",
            long: "Ціна поза зоною Golden Pocket. Фібоначчі-підтримка слабка або відсутня."
        }
    },

    // ===============================
    // Impulse Quality
    // ===============================
    impulseQuality: {
        label: "Impulse Quality",
        short: "Structure & efficiency",
        long: "Оцінює чистоту руху: мінімальні відкатні бари, стабільний напрямок, відсутність хаотичної волатильності."
    },

    // ===============================
    // Impulse Strength
    // ===============================
    impulseStrength: {
        label: "Impulse Strength",
        short: "Directional momentum",
        long: "Порівнює поточний імпульс із попередніми рухами. Високе значення означає домінування однієї сторони ринку."
    },

    // ===============================
    // Volume Strength
    // ===============================
    volumeStrength: {
        label: "Volume Strength",
        short: "Participation level",
        long: "Показує, наскільки рух підтриманий торговим об’ємом. Сильний імпульс без об’єму вважається нестійким."
    },

    // ===============================
    // Correction Depth
    // ===============================
    correctionDepth: {
        label: "Correction Depth",
        short: "Pullback magnitude",
        long: "Вимірює відсоток корекції відносно всього імпульсу. Використовується для оцінки ризику продовження руху."
    },

    // ===============================
    // Impulse Duration
    // ===============================
    impulseBars: {
        label: "Impulse Duration",
        short: "Impulse development speed",
        long: "Кількість барів, за які сформувався імпульс. Короткі імпульси — агресивні, довші — контрольовані та стабільні."
    },

    // ===============================
    // Volume Climax
    // ===============================
    volumeClimax: {
        label: "Volume Climax",
        short: "Decision point",
        long: "Різкий сплеск об’єму. У тренді — часто сигнал кульмінації, у консолідації — можливий початок імпульсу."
    }
};