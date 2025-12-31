// entrySignals.js

// ✅ Допоміжна функція: усі умови з масиву повинні бути true
const allTrue = (arr) => arr.every(Boolean);

// ✅ Balanced набір сигналів з трьох рівнів: setup / trigger / confirmation
export const entrySignals = [
  // =========================
  // LONG SETUPS

  // ============================================================
  // 1. Bollinger Oversold Reversal
  // Логіка: ціна в зоні перепроданості + перший імпульс вгору.
  // ============================================================
  {
    id: 1,
    type: "long",
    name: "Bollinger Oversold Reversal",
    priority: 5,

    setup: (ctx) => [
      ctx.Price <= ctx.Bollinger_L,     // нижня смуга Боллінджера
      ctx.RSI < 40,                     // слабкий імпульс вниз
    ],

    trigger: (ctx) => [
      ctx.Stochastic < 30,              // локальне дно
    ],

    confirmation: (ctx) => [
      ctx.MACD > ctx.MACD_Signal,       // розворот імпульсу
      ctx.volume > ctx.avgVolume,       // підтвердження покупця
    ],

    conditions(ctx) {
      return [
        allTrue(this.setup(ctx)),
        allTrue(this.trigger(ctx)),
        allTrue(this.confirmation(ctx)),
      ];
    },

    context: "reversion",
  },

  // ============================================================
  // 2. EMA Pullback in Uptrend
  // Логіка: класичний відкат у сильному тренді.
  // ============================================================
  {
    id: 2,
    type: "long",
    name: "EMA Pullback in Uptrend",
    priority: 5,

    setup: (ctx) => [
      ctx.EMA8 > ctx.EMA21 &&
      ctx.EMA21 > ctx.EMA50 &&
      ctx.EMA50 > ctx.EMA200,           // структурний ап-тренд
    ],

    trigger: (ctx) => [
      ctx.Price <= ctx.EMA21,           // здоровий відкат
    ],

    confirmation: (ctx) => [
      ctx.RSI > 50,                     // імпульс відновлюється
      ctx.MACD > ctx.MACD_Signal,
    ],

    conditions(ctx) {
      return [
        allTrue(this.setup(ctx)),
        allTrue(this.trigger(ctx)),
        allTrue(this.confirmation(ctx)),
      ];
    },

    context: "trend",
  },

  // ============================================================
  // 3. Mean Reversion to EMA50
  // Логіка: повернення до середньої в помірному тренді.
  // ============================================================
  {
    id: 3,
    type: "long",
    name: "Mean Reversion to EMA50",
    priority: 4,

    setup: (ctx) => [
      ctx.RSI < 45,                     // слабкість, але не крах
      ctx.EMA21 > ctx.EMA50,            // тренд не зламаний
    ],

    trigger: (ctx) => [
      ctx.Price <= ctx.EMA50,           // торкання середньої
    ],

    confirmation: (ctx) => [
      ctx.MACD > ctx.MACD_Signal,       // імпульс розвертається
    ],

    conditions(ctx) {
      return [
        allTrue(this.setup(ctx)),
        allTrue(this.trigger(ctx)),
        allTrue(this.confirmation(ctx)),
      ];
    },

    context: "reversion",
  },

  // ============================================================
  // 4. VWAP Reclaim (Intraday)
  // Логіка: повернення над VWAP — сильний інтрадеєвий сигнал.
  // ============================================================
  {
    id: 4,
    type: "long",
    name: "VWAP Reclaim (Intraday)",
    priority: 4,

    setup: (ctx) => [
      ctx.Price < ctx.VWAP,             // під VWAP → слабкість
    ],

    trigger: (ctx) => [
      ctx.Price > ctx.VWAP,             // повернення над VWAP
    ],

    confirmation: (ctx) => [
      ctx.volume > ctx.avgVolume * 1.2, // агресивний покупець
    ],

    conditions(ctx) {
      return [
        allTrue(this.setup(ctx)),
        allTrue(this.trigger(ctx)),
        allTrue(this.confirmation(ctx)),
      ];
    },

    context: "intraday",
  },

  // ============================================================
  // 5. Oversold Momentum Pop
  // Логіка: перепроданість + перший імпульс вгору.
  // ============================================================
  {
    id: 5,
    type: "long",
    name: "Oversold Momentum Pop",
    priority: 3,

    setup: (ctx) => [
      ctx.RSI < 35 || ctx.Stochastic < 25,   // глибока слабкість
    ],

    trigger: (ctx) => [
      ctx.Stochastic > 30,                   // вихід із перепроданості
    ],

    confirmation: (ctx) => [
      ctx.MACD > ctx.MACD_Signal ||          // MACD розвертається
      ctx.volume > ctx.avgVolume,            // або підтвердження об’ємом
    ],

    conditions(ctx) {
      return [
        allTrue(this.setup(ctx)),
        allTrue(this.trigger(ctx)),
        allTrue(this.confirmation(ctx)),
      ];
    },

    context: "momentum",
  },

  // ============================================================
  // 6. Keltner Lower Band Reversion
  // Логіка: ціна нижче каналу → перепроданість → розворот.
  // ============================================================
  {
    id: 6,
    type: "long",
    name: "Keltner Lower Band Reversion",
    priority: 3,

    setup: (ctx) => [
      ctx.Price < ctx.keltnerLower,
    ],

    trigger: (ctx) => [
      ctx.RSI > 35,
    ],

    confirmation: (ctx) => [
      ctx.MACD > ctx.MACD_Signal,
    ],

    conditions(ctx) {
      return [
        allTrue(this.setup(ctx)),
        allTrue(this.trigger(ctx)),
        allTrue(this.confirmation(ctx)),
      ];
    },

    context: "reversion",
  },

  // ============================================================
  // 7. Range Low Bounce
  // Логіка: робота в боковику — купуємо від нижньої межі.
  // ============================================================
  {
    id: 7,
    type: "long",
    name: "Range Low Bounce",
    priority: 4,

    setup: (ctx) => [
      ctx.rangeState === "range",       // підтверджений боковику
      ctx.Price <= ctx.Bollinger_M,     // нижня половина діапазону
      ctx.RSI < 50,
    ],

    trigger: (ctx) => [
      ctx.Stochastic > 30,
    ],

    confirmation: (ctx) => [
      ctx.volume >= ctx.avgVolume,
    ],

    conditions(ctx) {
      return [
        allTrue(this.setup(ctx)),
        allTrue(this.trigger(ctx)),
        allTrue(this.confirmation(ctx)),
      ];
    },

    context: "range",
  },

  // ============================================================
  // 8. Higher Timeframe Bull Alignment
  // Логіка: HTF → LTF синхронізація тренду.
  // ============================================================
  {
    id: 8,
    type: "long",
    name: "Higher Timeframe Bull Alignment",
    priority: 5,

    setup: (ctx) => [
      ctx.higherTF?.trend === "bull",
    ],

    trigger: (ctx) => [
      ctx.currentTF?.trend === "bull",
    ],

    confirmation: (ctx) => [
      ctx.EMA21 > ctx.EMA50,
    ],

    conditions(ctx) {
      return [
        allTrue(this.setup(ctx)),
        allTrue(this.trigger(ctx)),
        allTrue(this.confirmation(ctx)),
      ];
    },

    context: "trend",
  },

  // ============================================================
  // 9. Low Volatility Breakout Up
  // Логіка: стискання → пробій.
  // ============================================================
  {
    id: 9,
    type: "long",
    name: "Low Volatility Breakout Up",
    priority: 4,

    setup: (ctx) => [
      ctx.ATR < 400,                    // низька волатильність
      ctx.BollingerWidth < ctx.BW_avg,  // стискання
    ],

    trigger: (ctx) => [
      ctx.Price > ctx.Bollinger_U,      // пробій верхньої межі
    ],

    confirmation: (ctx) => [
      ctx.volume > ctx.avgVolume,
    ],

    conditions(ctx) {
      return [
        allTrue(this.setup(ctx)),
        allTrue(this.trigger(ctx)),
        allTrue(this.confirmation(ctx)),
      ];
    },

    context: "volatility",
  },

  // ============================================================
  // 10. RSI Mid-Range Push Up
  // Логіка: RSI виходить із середньої зони → імпульс вгору.
  // ============================================================
  {
    id: 10,
    type: "long",
    name: "RSI Mid-Range Push Up",
    priority: 3,

    setup: (ctx) => [
      ctx.RSI >= 40 && ctx.RSI <= 55,   // середня зона
    ],

    trigger: (ctx) => [
      ctx.RSI > 55,                     // вихід у імпульс
    ],

    confirmation: (ctx) => [
      ctx.MACD > ctx.MACD_Signal,
    ],

    conditions(ctx) {
      return [
        allTrue(this.setup(ctx)),
        allTrue(this.trigger(ctx)),
        allTrue(this.confirmation(ctx)),
      ];
    },

    context: "momentum",
  },


  // =========================
// SHORT SETUPS
// =========================

  // ============================================================
  // 11. Bollinger Overbought Reversal
  // Логіка: ціна в зоні перекупленості + перший імпульс вниз.
  // ============================================================
  {
    id: 11,
    type: "short",
    name: "Bollinger Overbought Reversal",
    priority: 5,

    setup: (ctx) => [
      ctx.Price >= ctx.Bollinger_U,     // верхня смуга Боллінджера
      ctx.RSI > 60,                     // перекупленість
    ],

    trigger: (ctx) => [
      ctx.Stochastic > 70,              // локальний пік
    ],

    confirmation: (ctx) => [
      ctx.MACD < ctx.MACD_Signal,       // імпульс вниз
      ctx.volume > ctx.avgVolume,       // продавець активний
    ],

    conditions(ctx) {
      return [
        allTrue(this.setup(ctx)),
        allTrue(this.trigger(ctx)),
        allTrue(this.confirmation(ctx)),
      ];
    },

    context: "reversion",
  },

  // ============================================================
  // 12. EMA Pullback in Downtrend
  // Логіка: відкат у сильному даунтренді.
  // ============================================================
  {
    id: 12,
    type: "short",
    name: "EMA Pullback in Downtrend",
    priority: 5,

    setup: (ctx) => [
      ctx.EMA8 < ctx.EMA21 &&
      ctx.EMA21 < ctx.EMA50 &&
      ctx.EMA50 < ctx.EMA200,           // структурний даунтренд
    ],

    trigger: (ctx) => [
      ctx.Price >= ctx.EMA21,           // відкат до EMA21
    ],

    confirmation: (ctx) => [
      ctx.RSI < 50,                     // імпульс вниз відновлюється
      ctx.MACD < ctx.MACD_Signal,
    ],

    conditions(ctx) {
      return [
        allTrue(this.setup(ctx)),
        allTrue(this.trigger(ctx)),
        allTrue(this.confirmation(ctx)),
      ];
    },

    context: "trend",
  },

  // ============================================================
  // 13. Mean Reversion From Upper Band
  // Логіка: повернення від верхньої межі Боллінджера.
  // ============================================================
  {
    id: 13,
    type: "short",
    name: "Mean Reversion From Upper Band",
    priority: 4,

    setup: (ctx) => [
      ctx.RSI > 55,                     // перекупленість
    ],

    trigger: (ctx) => [
      ctx.Price >= ctx.Bollinger_U,     // торкання верхньої межі
    ],

    confirmation: (ctx) => [
      ctx.MACD < ctx.MACD_Signal,       // імпульс вниз
    ],

    conditions(ctx) {
      return [
        allTrue(this.setup(ctx)),
        allTrue(this.trigger(ctx)),
        allTrue(this.confirmation(ctx)),
      ];
    },

    context: "reversion",
  },

  // ============================================================
  // 14. VWAP Rejection (Intraday)
  // Логіка: відскок вниз після невдалого пробою VWAP.
  // ============================================================
  {
    id: 14,
    type: "short",
    name: "VWAP Rejection (Intraday)",
    priority: 4,

    setup: (ctx) => [
      ctx.Price > ctx.VWAP,             // вище VWAP → слабкий пробій
    ],

    trigger: (ctx) => [
      ctx.Price < ctx.VWAP,             // повернення під VWAP
    ],

    confirmation: (ctx) => [
      ctx.volume > ctx.avgVolume,       // продавець підтверджує
    ],

    conditions(ctx) {
      return [
        allTrue(this.setup(ctx)),
        allTrue(this.trigger(ctx)),
        allTrue(this.confirmation(ctx)),
      ];
    },

    context: "intraday",
  },

  // ============================================================
  // 15. Overbought Momentum Fade
  // Логіка: перекупленість + втрата імпульсу.
  // ============================================================
  {
    id: 15,
    type: "short",
    name: "Overbought Momentum Fade",
    priority: 3,

    setup: (ctx) => [
      ctx.RSI > 65 || ctx.Stochastic > 75,   // перекупленість
    ],

    trigger: (ctx) => [
      ctx.Stochastic < 70,                   // імпульс слабшає
    ],

    confirmation: (ctx) => [
      ctx.MACD < ctx.MACD_Signal ||          // MACD вниз
      ctx.volume > ctx.avgVolume,            // або продавець активний
    ],

    conditions(ctx) {
      return [
        allTrue(this.setup(ctx)),
        allTrue(this.trigger(ctx)),
        allTrue(this.confirmation(ctx)),
      ];
    },

    context: "momentum",
  },

  // ============================================================
  // 16. Keltner Upper Band Reversion
  // Логіка: ціна вище каналу → перекупленість → розворот.
  // ============================================================
  {
    id: 16,
    type: "short",
    name: "Keltner Upper Band Reversion",
    priority: 3,

    setup: (ctx) => [
      ctx.Price > ctx.keltnerUpper,
    ],

    trigger: (ctx) => [
      ctx.RSI < 60,                     // імпульс слабшає
    ],

    confirmation: (ctx) => [
      ctx.MACD < ctx.MACD_Signal,       // підтвердження розвороту
    ],

    conditions(ctx) {
      return [
        allTrue(this.setup(ctx)),
        allTrue(this.trigger(ctx)),
        allTrue(this.confirmation(ctx)),
      ];
    },

    context: "reversion",
  },

  // ============================================================
  // 17. Range High Rejection
  // Логіка: робота в боковику — продаємо від верхньої межі.
  // ============================================================
  {
    id: 17,
    type: "short",
    name: "Range High Rejection",
    priority: 4,

    setup: (ctx) => [
      ctx.rangeState === "range",       // підтверджений боковик
      ctx.Price >= ctx.Bollinger_M,     // верхня половина діапазону
      ctx.RSI > 50,
    ],

    trigger: (ctx) => [
      ctx.Stochastic < 70,              // імпульс вниз
    ],

    confirmation: (ctx) => [
      ctx.volume >= ctx.avgVolume,      // продавець активний
    ],

    conditions(ctx) {
      return [
        allTrue(this.setup(ctx)),
        allTrue(this.trigger(ctx)),
        allTrue(this.confirmation(ctx)),
      ];
    },

    context: "range",
  },

  // ============================================================
  // 18. Higher Timeframe Bear Alignment
  // Логіка: HTF → LTF синхронізація тренду.
  // ============================================================
  {
    id: 18,
    type: "short",
    name: "Higher Timeframe Bear Alignment",
    priority: 5,

    setup: (ctx) => [
      ctx.higherTF?.trend === "bear",
    ],

    trigger: (ctx) => [
      ctx.currentTF?.trend === "bear",
    ],

    confirmation: (ctx) => [
      ctx.EMA21 < ctx.EMA50,            // локальний тренд вниз
    ],

    conditions(ctx) {
      return [
        allTrue(this.setup(ctx)),
        allTrue(this.trigger(ctx)),
        allTrue(this.confirmation(ctx)),
      ];
    },

    context: "trend",
  },

  // ============================================================
  // 19. Low Volatility Breakdown
  // Логіка: стискання → пробій вниз.
  // ============================================================
  {
    id: 19,
    type: "short",
    name: "Low Volatility Breakdown",
    priority: 4,

    setup: (ctx) => [
      ctx.ATR < 400,                    // низька волатильність
      ctx.BollingerWidth < ctx.BW_avg,  // стискання
    ],

    trigger: (ctx) => [
      ctx.Price < ctx.Bollinger_L,      // пробій нижньої межі
    ],

    confirmation: (ctx) => [
      ctx.volume > ctx.avgVolume,       // продавець підтверджує
    ],

    conditions(ctx) {
      return [
        allTrue(this.setup(ctx)),
        allTrue(this.trigger(ctx)),
        allTrue(this.confirmation(ctx)),
      ];
    },

    context: "volatility",
  },

  // ============================================================
// 20. RSI Mid-Range Push Down
// Логіка: RSI виходить із середньої зони вниз → імпульс.
// ============================================================
{
  id: 20,
  type: "short",
  name: "RSI Mid-Range Push Down",
  priority: 3,

  setup: (ctx) => [
    ctx.RSI >= 45 && ctx.RSI <= 60,     // середня зона RSI
  ],

  trigger: (ctx) => [
    ctx.RSI < 45,                       // вихід у імпульс вниз
  ],

  confirmation: (ctx) => [
    ctx.MACD < ctx.MACD_Signal,         // підтвердження імпульсу
  ],

  conditions(ctx) {
    return [
      allTrue(this.setup(ctx)),
      allTrue(this.trigger(ctx)),
      allTrue(this.confirmation(ctx)),
    ];
  },

  context: "momentum",
},

// ============================================================
// 21. Micro Pullback Continuation
// Логіка: мікро-відкат у локальному ап-тренді.
// ============================================================
{
  id: 21,
  type: "long",
  name: "Micro Pullback Continuation",
  priority: 4,

  setup: (ctx) => [
    ctx.EMA8 > ctx.EMA21,               // локальний ап-тренд
    ctx.RSI > 50,                       // імпульс вгору
  ],

  trigger: (ctx) => [
    ctx.Price <= ctx.EMA8,              // мікро-відкат до EMA8
  ],

  confirmation: (ctx) => [
    ctx.MACD > ctx.MACD_Signal,         // імпульс відновлюється
  ],

  conditions(ctx) {
    return [
      allTrue(this.setup(ctx)),
      allTrue(this.trigger(ctx)),
      allTrue(this.confirmation(ctx)),
    ];
  },

  context: "trend",
},

// ============================================================
// 22. Momentum Flip
// Логіка: зміна імпульсу з ведмежого на бичачий.
// ============================================================
{
  id: 22,
  type: "long",
  name: "Momentum Flip",
  priority: 3,

  setup: (ctx) => [
    ctx.RSI < 45,                       // слабкість перед розворотом
  ],

  trigger: (ctx) => [
    ctx.RSI > 50,                       // імпульс вгору
  ],

  confirmation: (ctx) => [
    ctx.MACD > ctx.MACD_Signal,         // підтвердження розвороту
  ],

  conditions(ctx) {
    return [
      allTrue(this.setup(ctx)),
      allTrue(this.trigger(ctx)),
      allTrue(this.confirmation(ctx)),
    ];
  },

  context: "momentum",
},

// ============================================================
// 23. Volatility Compression Breakout
// Логіка: стискання → пробій вгору.
// ============================================================
{
  id: 23,
  type: "long",
  name: "Volatility Compression Breakout",
  priority: 4,

  setup: (ctx) => [
    ctx.ATR < 400,                      // низька волатильність
    ctx.BollingerWidth < ctx.BW_avg,    // стискання
  ],

  trigger: (ctx) => [
    ctx.Price > ctx.Bollinger_U,        // пробій верхньої межі
  ],

  confirmation: (ctx) => [
    ctx.volume > ctx.avgVolume,         // підтвердження покупця
  ],

  conditions(ctx) {
    return [
      allTrue(this.setup(ctx)),
      allTrue(this.trigger(ctx)),
      allTrue(this.confirmation(ctx)),
    ];
  },

  context: "volatility",
},

// ============================================================
// 24. RSI Reset Bounce
// Логіка: перепроданість → перший імпульс вгору.
// ============================================================
{
  id: 24,
  type: "long",
  name: "RSI Reset Bounce",
  priority: 3,

  setup: (ctx) => [
    ctx.RSI < 40,                       // перепроданість
  ],

  trigger: (ctx) => [
    ctx.RSI > 45,                       // перший імпульс
  ],

  confirmation: (ctx) => [
    ctx.MACD > ctx.MACD_Signal,         // підтвердження імпульсу
  ],

  conditions(ctx) {
    return [
      allTrue(this.setup(ctx)),
      allTrue(this.trigger(ctx)),
      allTrue(this.confirmation(ctx)),
    ];
  },

  context: "reversion",
},

// ============================================================
// 25. Mid-Band Reclaim
// Логіка: повернення над середньою смугою в боковику.
// ============================================================
{
  id: 25,
  type: "long",
  name: "Mid-Band Reclaim",
  priority: 4,

  setup: (ctx) => [
    ctx.rangeState === "range",         // підтверджений боковик
    ctx.Price < ctx.Bollinger_M,        // нижня частина діапазону
  ],

  trigger: (ctx) => [
    ctx.Price > ctx.Bollinger_M,        // повернення над середньою
  ],

  confirmation: (ctx) => [
    ctx.volume >= ctx.avgVolume,        // підтвердження покупця
  ],

  conditions(ctx) {
    return [
      allTrue(this.setup(ctx)),
      allTrue(this.trigger(ctx)),
      allTrue(this.confirmation(ctx)),
    ];
  },

  context: "range",
},

// ============================================================
// 26. Micro Pullback Rejection
// Логіка: мікро-відкат у локальному даун-тренді.
// ============================================================
{
  id: 26,
  type: "short",
  name: "Micro Pullback Rejection",
  priority: 4,

  setup: (ctx) => [
    ctx.EMA8 < ctx.EMA21,               // локальний даун-тренд
    ctx.RSI < 50,                       // імпульс вниз
  ],

  trigger: (ctx) => [
    ctx.Price >= ctx.EMA8,              // мікро-відкат до EMA8
  ],

  confirmation: (ctx) => [
    ctx.MACD < ctx.MACD_Signal,         // імпульс вниз відновлюється
  ],

  conditions(ctx) {
    return [
      allTrue(this.setup(ctx)),
      allTrue(this.trigger(ctx)),
      allTrue(this.confirmation(ctx)),
    ];
  },

  context: "trend",
},

// ============================================================
// 27. Momentum Breakdown
// Логіка: імпульс слабшає → пробій вниз.
// ============================================================
{
  id: 27,
  type: "short",
  name: "Momentum Breakdown",
  priority: 3,

  setup: (ctx) => [
    ctx.RSI > 55,                       // перекупленість
  ],

  trigger: (ctx) => [
    ctx.RSI < 50,                       // імпульс вниз
  ],

  confirmation: (ctx) => [
    ctx.MACD < ctx.MACD_Signal,         // підтвердження імпульсу
  ],

  conditions(ctx) {
    return [
      allTrue(this.setup(ctx)),
      allTrue(this.trigger(ctx)),
      allTrue(this.confirmation(ctx)),
    ];
  },

  context: "momentum",
},

// ============================================================
// 28. Volatility Expansion Breakdown
// Логіка: волатильність росте → пробій вниз.
// ============================================================
{
  id: 28,
  type: "short",
  name: "Volatility Expansion Breakdown",
  priority: 4,

  setup: (ctx) => [
    ctx.ATR > 300,                      // волатильність росте
  ],

  trigger: (ctx) => [
    ctx.Price < ctx.Bollinger_L,        // пробій нижньої межі
  ],

  confirmation: (ctx) => [
    ctx.volume > ctx.avgVolume,         // продавець підтверджує
  ],

  conditions(ctx) {
    return [
      allTrue(this.setup(ctx)),
      allTrue(this.trigger(ctx)),
      allTrue(this.confirmation(ctx)),
    ];
  },

  context: "volatility",
},

// ============================================================
// 29. RSI Reset Drop
// Логіка: перекупленість → перший імпульс вниз.
// ============================================================
{
  id: 29,
  type: "short",
  name: "RSI Reset Drop",
  priority: 3,

  setup: (ctx) => [
    ctx.RSI > 60,                       // перекупленість
  ],

  trigger: (ctx) => [
    ctx.RSI < 55,                       // перший імпульс вниз
  ],

  confirmation: (ctx) => [
    ctx.MACD < ctx.MACD_Signal,         // підтвердження імпульсу
  ],

  conditions(ctx) {
    return [
      allTrue(this.setup(ctx)),
      allTrue(this.trigger(ctx)),
      allTrue(this.confirmation(ctx)),
    ];
  },

  context: "reversion",
},

// ============================================================
// 30. Mid-Band Rejection
// Логіка: відскок від середньої смуги в боковику.
// ============================================================
{
  id: 30,
  type: "short",
  name: "Mid-Band Rejection",
  priority: 4,

  setup: (ctx) => [
    ctx.rangeState === "range",         // підтверджений боковик
    ctx.Price > ctx.Bollinger_M,        // верхня частина діапазону
  ],

  trigger: (ctx) => [
    ctx.Price < ctx.Bollinger_M,        // повернення під середню
  ],

  confirmation: (ctx) => [
    ctx.volume >= ctx.avgVolume,        // продавець підтверджує
  ],

  conditions(ctx) {
    return [
      allTrue(this.setup(ctx)),
      allTrue(this.trigger(ctx)),
      allTrue(this.confirmation(ctx)),
    ];
  },

  context: "range",
},
];
