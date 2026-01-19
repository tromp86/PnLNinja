// // entrySignals.js

// // ✅ Допоміжна функція: усі умови з масиву повинні бути true
// const allTrue = (arr) => arr.every(Boolean);

// // ✅ Balanced набір сигналів з трьох рівнів: setup / trigger / confirmation
// export const entrySignals = [
//   // =========================
//   // LONG SETUPS

//   // ============================================================
//   // 1. Bollinger Oversold Reversal
//   // Логіка: ціна в зоні перепроданості + перший імпульс вгору.
//   // ============================================================
//   {
//     id: 1,
//     type: "long",
//     name: "Bollinger Oversold Reversal",
//     priority: 5,

//     setup: (ctx) => [
//       ctx.Price <= ctx.Bollinger_L,     // нижня смуга Боллінджера
//       ctx.RSI < 40,                     // слабкий імпульс вниз
//     ],

//     trigger: (ctx) => [
//       ctx.Stochastic < 30,              // локальне дно
//     ],

//     confirmation: (ctx) => [
//       ctx.MACD > ctx.MACD_Signal,       // розворот імпульсу
//       ctx.volume > ctx.avgVolume,       // підтвердження покупця
//     ],

//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },

//     context: "reversion",
//   },

//   // ============================================================
//   // 2. EMA Pullback in Uptrend
//   // Логіка: класичний відкат у сильному тренді.
//   // ============================================================
//   {
//     id: 2,
//     type: "long",
//     name: "EMA Pullback in Uptrend",
//     priority: 5,

//     setup: (ctx) => [
//       ctx.EMA8 > ctx.EMA21 &&
//       ctx.EMA21 > ctx.EMA50 &&
//       ctx.EMA50 > ctx.EMA200,           // структурний ап-тренд
//     ],

//     trigger: (ctx) => [
//       ctx.Price <= ctx.EMA21,           // здоровий відкат
//     ],

//     confirmation: (ctx) => [
//       ctx.RSI > 50,                     // імпульс відновлюється
//       ctx.MACD > ctx.MACD_Signal,
//     ],

//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },

//     context: "trend",
//   },

//   // ============================================================
//   // 3. Mean Reversion to EMA50
//   // Логіка: повернення до середньої в помірному тренді.
//   // ============================================================
//   {
//     id: 3,
//     type: "long",
//     name: "Mean Reversion to EMA50",
//     priority: 4,

//     setup: (ctx) => [
//       ctx.RSI < 45,                     // слабкість, але не крах
//       ctx.EMA21 > ctx.EMA50,            // тренд не зламаний
//     ],

//     trigger: (ctx) => [
//       ctx.Price <= ctx.EMA50,           // торкання середньої
//     ],

//     confirmation: (ctx) => [
//       ctx.MACD > ctx.MACD_Signal,       // імпульс розвертається
//     ],

//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },

//     context: "reversion",
//   },

//   // ============================================================
//   // 4. VWAP Reclaim (Intraday)
//   // Логіка: повернення над VWAP — сильний інтрадеєвий сигнал.
//   // ============================================================
//   {
//     id: 4,
//     type: "long",
//     name: "VWAP Reclaim (Intraday)",
//     priority: 4,

//     setup: (ctx) => [
//       ctx.Price < ctx.VWAP,             // під VWAP → слабкість
//     ],

//     trigger: (ctx) => [
//       ctx.Price > ctx.VWAP,             // повернення над VWAP
//     ],

//     confirmation: (ctx) => [
//       ctx.volume > ctx.avgVolume * 1.2, // агресивний покупець
//     ],

//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },

//     context: "intraday",
//   },


//   // ============================================================
//   // 6. Keltner Lower Band Reversion
//   // Логіка: ціна нижче каналу → перепроданість → розворот.
//   // ============================================================
//   {
//     id: 6,
//     type: "long",
//     name: "Keltner Lower Band Reversion",
//     priority: 3,

//     setup: (ctx) => [
//       ctx.Price < ctx.keltnerLower,
//     ],

//     trigger: (ctx) => [
//       ctx.RSI > 35,
//     ],

//     confirmation: (ctx) => [
//       ctx.MACD > ctx.MACD_Signal,
//     ],

//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },

//     context: "reversion",
//   },

//   // ============================================================
//   // 7. Range Low Bounce
//   // Логіка: робота в боковику — купуємо від нижньої межі.
//   // ============================================================
//   {
//     id: 7,
//     type: "long",
//     name: "Range Low Bounce",
//     priority: 4,

//     setup: (ctx) => [
//       ctx.rangeState === "range",       // підтверджений боковику
//       ctx.Price <= ctx.Bollinger_M,     // нижня половина діапазону
//       ctx.RSI < 50,
//     ],

//     trigger: (ctx) => [
//       ctx.Stochastic > 30,
//     ],

//     confirmation: (ctx) => [
//       ctx.volume >= ctx.avgVolume,
//     ],

//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },

//     context: "range",
//   },

//   // ============================================================
//   // 8. Higher Timeframe Bull Alignment
//   // Логіка: HTF → LTF синхронізація тренду.
//   // ============================================================
//   {
//     id: 8,
//     type: "long",
//     name: "Higher Timeframe Bull Alignment",
//     priority: 5,

//     setup: (ctx) => [
//       ctx.higherTF?.trend === "bull",
//     ],

//     trigger: (ctx) => [
//       ctx.currentTF?.trend === "bull",
//     ],

//     confirmation: (ctx) => [
//       ctx.EMA21 > ctx.EMA50,
//     ],

//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },

//     context: "trend",
//   },

//   // =========================
// // SHORT SETUPS
// // =========================

//   // ============================================================
//   // 11. Bollinger Overbought Reversal
//   // Логіка: ціна в зоні перекупленості + перший імпульс вниз.
//   // ============================================================
//   {
//     id: 11,
//     type: "short",
//     name: "Bollinger Overbought Reversal",
//     priority: 5,

//     setup: (ctx) => [
//       ctx.Price >= ctx.Bollinger_U,     // верхня смуга Боллінджера
//       ctx.RSI > 60,                     // перекупленість
//     ],

//     trigger: (ctx) => [
//       ctx.Stochastic > 70,              // локальний пік
//     ],

//     confirmation: (ctx) => [
//       ctx.MACD < ctx.MACD_Signal,       // імпульс вниз
//       ctx.volume > ctx.avgVolume,       // продавець активний
//     ],

//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },

//     context: "reversion",
//   },

//   // ============================================================
//   // 12. EMA Pullback in Downtrend
//   // Логіка: відкат у сильному даунтренді.
//   // ============================================================
//   {
//     id: 12,
//     type: "short",
//     name: "EMA Pullback in Downtrend",
//     priority: 5,

//     setup: (ctx) => [
//       ctx.EMA8 < ctx.EMA21 &&
//       ctx.EMA21 < ctx.EMA50 &&
//       ctx.EMA50 < ctx.EMA200,           // структурний даунтренд
//     ],

//     trigger: (ctx) => [
//       ctx.Price >= ctx.EMA21,           // відкат до EMA21
//     ],

//     confirmation: (ctx) => [
//       ctx.RSI < 50,                     // імпульс вниз відновлюється
//       ctx.MACD < ctx.MACD_Signal,
//     ],

//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },

//     context: "trend",
//   },

//   // ============================================================
//   // 13. Mean Reversion From Upper Band
//   // Логіка: повернення від верхньої межі Боллінджера.
//   // ============================================================
//   {
//     id: 13,
//     type: "short",
//     name: "Mean Reversion From Upper Band",
//     priority: 4,

//     setup: (ctx) => [
//       ctx.RSI > 55,                     // перекупленість
//     ],

//     trigger: (ctx) => [
//       ctx.Price >= ctx.Bollinger_U,     // торкання верхньої межі
//     ],

//     confirmation: (ctx) => [
//       ctx.MACD < ctx.MACD_Signal,       // імпульс вниз
//     ],

//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },

//     context: "reversion",
//   },

//   // ============================================================
//   // 14. VWAP Rejection (Intraday)
//   // Логіка: відскок вниз після невдалого пробою VWAP.
//   // ============================================================
//   {
//     id: 14,
//     type: "short",
//     name: "VWAP Rejection (Intraday)",
//     priority: 4,

//     setup: (ctx) => [
//       ctx.Price > ctx.VWAP,             // вище VWAP → слабкий пробій
//     ],

//     trigger: (ctx) => [
//       ctx.Price < ctx.VWAP,             // повернення під VWAP
//     ],

//     confirmation: (ctx) => [
//       ctx.volume > ctx.avgVolume,       // продавець підтверджує
//     ],

//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },

//     context: "intraday",
//   },

//   // ============================================================
//   // 15. Overbought Momentum Fade
//   // Логіка: перекупленість + втрата імпульсу.
//   // ============================================================
//   {
//     id: 15,
//     type: "short",
//     name: "Overbought Momentum Fade",
//     priority: 3,

//     setup: (ctx) => [
//       ctx.RSI > 65 || ctx.Stochastic > 75,   // перекупленість
//     ],

//     trigger: (ctx) => [
//       ctx.Stochastic < 70,                   // імпульс слабшає
//     ],

//     confirmation: (ctx) => [
//       ctx.MACD < ctx.MACD_Signal ||          // MACD вниз
//       ctx.volume > ctx.avgVolume,            // або продавець активний
//     ],

//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },

//     context: "momentum",
//   },

//   // ============================================================
//   // 16. Keltner Upper Band Reversion
//   // Логіка: ціна вище каналу → перекупленість → розворот.
//   // ============================================================
//   {
//     id: 16,
//     type: "short",
//     name: "Keltner Upper Band Reversion",
//     priority: 3,

//     setup: (ctx) => [
//       ctx.Price > ctx.keltnerUpper,
//     ],

//     trigger: (ctx) => [
//       ctx.RSI < 60,                     // імпульс слабшає
//     ],

//     confirmation: (ctx) => [
//       ctx.MACD < ctx.MACD_Signal,       // підтвердження розвороту
//     ],

//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },

//     context: "reversion",
//   },

//   // ============================================================
//   // 17. Range High Rejection
//   // Логіка: робота в боковику — продаємо від верхньої межі.
//   // ============================================================
//   {
//     id: 17,
//     type: "short",
//     name: "Range High Rejection",
//     priority: 4,

//     setup: (ctx) => [
//       ctx.rangeState === "range",       // підтверджений боковик
//       ctx.Price >= ctx.Bollinger_M,     // верхня половина діапазону
//       ctx.RSI > 50,
//     ],

//     trigger: (ctx) => [
//       ctx.Stochastic < 70,              // імпульс вниз
//     ],

//     confirmation: (ctx) => [
//       ctx.volume >= ctx.avgVolume,      // продавець активний
//     ],

//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },

//     context: "range",
//   },

//   // ============================================================
//   // 18. Higher Timeframe Bear Alignment
//   // Логіка: HTF → LTF синхронізація тренду.
//   // ============================================================
//   {
//     id: 18,
//     type: "short",
//     name: "Higher Timeframe Bear Alignment",
//     priority: 5,

//     setup: (ctx) => [
//       ctx.higherTF?.trend === "bear",
//     ],

//     trigger: (ctx) => [
//       ctx.currentTF?.trend === "bear",
//     ],

//     confirmation: (ctx) => [
//       ctx.EMA21 < ctx.EMA50,            // локальний тренд вниз
//     ],

//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },

//     context: "trend",
//   },

//   // ============================================================
//   // 19. Low Volatility Breakdown
//   // Логіка: стискання → пробій вниз.
//   // ============================================================
//   {
//     id: 19,
//     type: "short",
//     name: "Low Volatility Breakdown",
//     priority: 4,

//     setup: (ctx) => [
//       ctx.ATR < 400,                    // низька волатильність
//       ctx.BollingerWidth < ctx.BW_avg,  // стискання
//     ],

//     trigger: (ctx) => [
//       ctx.Price < ctx.Bollinger_L,      // пробій нижньої межі
//     ],

//     confirmation: (ctx) => [
//       ctx.volume > ctx.avgVolume,       // продавець підтверджує
//     ],

//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },

//     context: "volatility",
//   },

//   // ============================================================
// // 20. RSI Mid-Range Push Down
// // Логіка: RSI виходить із середньої зони вниз → імпульс.
// // ============================================================
// {
//   id: 20,
//   type: "short",
//   name: "RSI Mid-Range Push Down",
//   priority: 3,

//   setup: (ctx) => [
//     ctx.RSI >= 45 && ctx.RSI <= 60,     // середня зона RSI
//   ],

//   trigger: (ctx) => [
//     ctx.RSI < 45,                       // вихід у імпульс вниз
//   ],

//   confirmation: (ctx) => [
//     ctx.MACD < ctx.MACD_Signal,         // підтвердження імпульсу
//   ],

//   conditions(ctx) {
//     return [
//       allTrue(this.setup(ctx)),
//       allTrue(this.trigger(ctx)),
//       allTrue(this.confirmation(ctx)),
//     ];
//   },

//   context: "momentum",
// },

// // ============================================================
// // 21. Micro Pullback Continuation
// // Логіка: мікро-відкат у локальному ап-тренді.
// // ============================================================
// {
//   id: 21,
//   type: "long",
//   name: "Micro Pullback Continuation",
//   priority: 4,

//   setup: (ctx) => [
//     ctx.EMA8 > ctx.EMA21,               // локальний ап-тренд
//     ctx.RSI > 50,                       // імпульс вгору
//   ],

//   trigger: (ctx) => [
//     ctx.Price <= ctx.EMA8,              // мікро-відкат до EMA8
//   ],

//   confirmation: (ctx) => [
//     ctx.MACD > ctx.MACD_Signal,         // імпульс відновлюється
//   ],

//   conditions(ctx) {
//     return [
//       allTrue(this.setup(ctx)),
//       allTrue(this.trigger(ctx)),
//       allTrue(this.confirmation(ctx)),
//     ];
//   },

//   context: "trend",
// },

// // ============================================================
// // 22. Momentum Flip
// // Логіка: зміна імпульсу з ведмежого на бичачий.
// // ============================================================
// {
//   id: 22,
//   type: "long",
//   name: "Momentum Flip",
//   priority: 3,

//   setup: (ctx) => [
//     ctx.RSI < 45,                       // слабкість перед розворотом
//   ],

//   trigger: (ctx) => [
//     ctx.RSI > 50,                       // імпульс вгору
//   ],

//   confirmation: (ctx) => [
//     ctx.MACD > ctx.MACD_Signal,         // підтвердження розвороту
//   ],

//   conditions(ctx) {
//     return [
//       allTrue(this.setup(ctx)),
//       allTrue(this.trigger(ctx)),
//       allTrue(this.confirmation(ctx)),
//     ];
//   },

//   context: "momentum",
// },

// // ============================================================
// // 23. Volatility Compression Breakout
// // Логіка: стискання → пробій вгору.
// // ============================================================
// {
//   id: 23,
//   type: "long",
//   name: "Volatility Compression Breakout",
//   priority: 4,

//   setup: (ctx) => [
//     ctx.ATR < 400,                      // низька волатильність
//     ctx.BollingerWidth < ctx.BW_avg,    // стискання
//   ],

//   trigger: (ctx) => [
//     ctx.Price > ctx.Bollinger_U,        // пробій верхньої межі
//   ],

//   confirmation: (ctx) => [
//     ctx.volume > ctx.avgVolume,         // підтвердження покупця
//   ],

//   conditions(ctx) {
//     return [
//       allTrue(this.setup(ctx)),
//       allTrue(this.trigger(ctx)),
//       allTrue(this.confirmation(ctx)),
//     ];
//   },

//   context: "volatility",
// },

// // ============================================================
// // 25. Mid-Band Reclaim
// // Логіка: повернення над середньою смугою в боковику.
// // ============================================================
// {
//   id: 25,
//   type: "long",
//   name: "Mid-Band Reclaim",
//   priority: 4,

//   setup: (ctx) => [
//     ctx.rangeState === "range",         // підтверджений боковик
//     ctx.Price < ctx.Bollinger_M,        // нижня частина діапазону
//   ],

//   trigger: (ctx) => [
//     ctx.Price > ctx.Bollinger_M,        // повернення над середньою
//   ],

//   confirmation: (ctx) => [
//     ctx.volume >= ctx.avgVolume,        // підтвердження покупця
//   ],

//   conditions(ctx) {
//     return [
//       allTrue(this.setup(ctx)),
//       allTrue(this.trigger(ctx)),
//       allTrue(this.confirmation(ctx)),
//     ];
//   },

//   context: "range",
// },

// // ============================================================
// // 26. Micro Pullback Rejection
// // Логіка: мікро-відкат у локальному даун-тренді.
// // ============================================================
// {
//   id: 26,
//   type: "short",
//   name: "Micro Pullback Rejection",
//   priority: 4,

//   setup: (ctx) => [
//     ctx.EMA8 < ctx.EMA21,               // локальний даун-тренд
//     ctx.RSI < 50,                       // імпульс вниз
//   ],

//   trigger: (ctx) => [
//     ctx.Price >= ctx.EMA8,              // мікро-відкат до EMA8
//   ],

//   confirmation: (ctx) => [
//     ctx.MACD < ctx.MACD_Signal,         // імпульс вниз відновлюється
//   ],

//   conditions(ctx) {
//     return [
//       allTrue(this.setup(ctx)),
//       allTrue(this.trigger(ctx)),
//       allTrue(this.confirmation(ctx)),
//     ];
//   },

//   context: "trend",
// },

// // ============================================================
// // 27. Momentum Breakdown
// // Логіка: імпульс слабшає → пробій вниз.
// // ============================================================
// {
//   id: 27,
//   type: "short",
//   name: "Momentum Breakdown",
//   priority: 3,

//   setup: (ctx) => [
//     ctx.RSI > 55,                       // перекупленість
//   ],

//   trigger: (ctx) => [
//     ctx.RSI < 50,                       // імпульс вниз
//   ],

//   confirmation: (ctx) => [
//     ctx.MACD < ctx.MACD_Signal,         // підтвердження імпульсу
//   ],

//   conditions(ctx) {
//     return [
//       allTrue(this.setup(ctx)),
//       allTrue(this.trigger(ctx)),
//       allTrue(this.confirmation(ctx)),
//     ];
//   },

//   context: "momentum",
// },

// // ============================================================
// // 30. Mid-Band Rejection
// // Логіка: відскок від середньої смуги в боковику.
// // ============================================================
// {
//   id: 30,
//   type: "short",
//   name: "Mid-Band Rejection",
//   priority: 4,

//   setup: (ctx) => [
//     ctx.rangeState === "range",         // підтверджений боковик
//     ctx.Price > ctx.Bollinger_M,        // верхня частина діапазону
//   ],

//   trigger: (ctx) => [
//     ctx.Price < ctx.Bollinger_M,        // повернення під середню
//   ],

//   confirmation: (ctx) => [
//     ctx.volume >= ctx.avgVolume,        // продавець підтверджує
//   ],

//   conditions(ctx) {
//     return [
//       allTrue(this.setup(ctx)),
//       allTrue(this.trigger(ctx)),
//       allTrue(this.confirmation(ctx)),
//     ];
//   },

//   context: "range",
// },
// ];







/// entrySignals.js — Professional Reversal & Add-on Model

// const allTrue = (arr) => arr.every(Boolean);

// // ===============================
// // HELPERS
// // ===============================
// const bullishDivergence = (ctx) =>
//   ctx.Price_LL === true && ctx.RSI_LL === false && ctx.RSI < 45;

// const bearishDivergence = (ctx) =>
//   ctx.Price_HH === true && ctx.RSI_HH === false && ctx.RSI > 55;

// const trendStrengthBull = (ctx) =>
//   ctx.EMA21 > ctx.EMA50 && (ctx.EMA21 - ctx.EMA50) / ctx.Price > 0.002;

// const trendStrengthBear = (ctx) =>
//   ctx.EMA21 < ctx.EMA50 && (ctx.EMA50 - ctx.EMA21) / ctx.Price > 0.002;

// const volumeHealthy = (ctx) =>
//   ctx.volume >= ctx.avgVolume * 0.85;

// const momentumShiftUp = (ctx) =>
//   ctx.MACD_hist > ctx.MACD_hist_prev;

// const momentumShiftDown = (ctx) =>
//   ctx.MACD_hist < ctx.MACD_hist_prev;

// // ===============================
// // ENTRY SIGNALS
// // ===============================
// export const entrySignals = [

//   // ===============================
//   // 🔵 LONG — ADD ON IN UPTREND
//   // ===============================
//   {
//     id: 1,
//     type: "long",
//     name: "Uptrend Pullback Add-on",
//     priority: 10,
//     setup: (ctx) => [
//       ctx.trend === "bull",
//       trendStrengthBull(ctx),
//       ctx.Price < ctx.EMA21,                 // корекція
//       ctx.Price > ctx.EMA50 * 0.97,          // не глибока
//       ctx.RSI > 35 && ctx.RSI < 55,          // здоровий pullback
//     ],
//     trigger: (ctx) => [
//       ctx.Price > ctx.EMA21,
//       momentumShiftUp(ctx),
//     ],
//     confirmation: (ctx) => [
//       ctx.MACD > ctx.MACD_Signal,
//       volumeHealthy(ctx),
//     ],
//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },
//     context: "trend_add",
//   },

//   // ===============================
//   // 🟢 LONG — BULLISH RSI DIVERGENCE
//   // ===============================
//   {
//     id: 2,
//     type: "long",
//     name: "Bullish RSI Divergence",
//     priority: 9,
//     setup: (ctx) => [
//       bullishDivergence(ctx),
//       ctx.Price <= ctx.Bollinger_L * 1.03,
//       ctx.RSI < 42,
//       ctx.MACD_hist_prev < 0,                // слабкість імпульсу вниз
//     ],
//     trigger: (ctx) => [
//       ctx.RSI > ctx.RSI_prev,
//       ctx.Price > ctx.Price_prev,
//       momentumShiftUp(ctx),
//     ],
//     confirmation: (ctx) => [
//       ctx.MACD > ctx.MACD_Signal,
//       volumeHealthy(ctx),
//     ],
//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },
//     context: "reversal",
//   },

//   // ===============================
//   // 🔷 LONG — HTF TREND + LTF REVERSAL
//   // ===============================
//   {
//     id: 3,
//     type: "long",
//     name: "HTF Bull + LTF Reversal",
//     priority: 8,
//     setup: (ctx) => [
//       ctx.higherTF?.trend === "bull",
//       ctx.Price <= ctx.EMA50 * 1.02,
//       ctx.RSI < 48,
//       ctx.MACD_hist_prev < ctx.MACD_hist_prev2, // уповільнення падіння
//     ],
//     trigger: (ctx) => [
//       ctx.Price > ctx.EMA21,
//       momentumShiftUp(ctx),
//     ],
//     confirmation: (ctx) => [
//       ctx.MACD > ctx.MACD_Signal,
//       volumeHealthy(ctx),
//     ],
//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },
//     context: "htf_add",
//   },

//   // ===============================
//   // 🔴 SHORT — ADD ON IN DOWNTREND
//   // ===============================
//   {
//     id: 4,
//     type: "short",
//     name: "Downtrend Pullback Add-on",
//     priority: 10,
//     setup: (ctx) => [
//       ctx.trend === "bear",
//       trendStrengthBear(ctx),
//       ctx.Price > ctx.EMA21,                 // корекція
//       ctx.Price < ctx.EMA50 * 1.03,          // не надто високо
//       ctx.RSI < 65 && ctx.RSI > 45,
//     ],
//     trigger: (ctx) => [
//       ctx.Price < ctx.EMA21,
//       momentumShiftDown(ctx),
//     ],
//     confirmation: (ctx) => [
//       ctx.MACD < ctx.MACD_Signal,
//       volumeHealthy(ctx),
//     ],
//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },
//     context: "trend_add",
//   },

//   // ===============================
//   // 🔻 SHORT — BEARISH RSI DIVERGENCE
//   // ===============================
//   {
//     id: 5,
//     type: "short",
//     name: "Bearish RSI Divergence",
//     priority: 9,
//     setup: (ctx) => [
//       bearishDivergence(ctx),
//       ctx.Price >= ctx.Bollinger_U * 0.97,
//       ctx.RSI > 58,
//       ctx.MACD_hist_prev > 0,
//     ],
//     trigger: (ctx) => [
//       ctx.RSI < ctx.RSI_prev,
//       ctx.Price < ctx.Price_prev,
//       momentumShiftDown(ctx),
//     ],
//     confirmation: (ctx) => [
//       ctx.MACD < ctx.MACD_Signal,
//       volumeHealthy(ctx),
//     ],
//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },
//     context: "reversal",
//   },

//   // ===============================
//   // 🔶 SHORT — HTF BEAR + LTF REVERSAL
//   // ===============================
//   {
//     id: 6,
//     type: "short",
//     name: "HTF Bear + LTF Reversal",
//     priority: 8,
//     setup: (ctx) => [
//       ctx.higherTF?.trend === "bear",
//       ctx.Price >= ctx.EMA50 * 0.98,
//       ctx.RSI > 52,
//       ctx.MACD_hist_prev > ctx.MACD_hist_prev2,
//     ],
//     trigger: (ctx) => [
//       ctx.Price < ctx.EMA21,
//       momentumShiftDown(ctx),
//     ],
//     confirmation: (ctx) => [
//       ctx.MACD < ctx.MACD_Signal,
//       volumeHealthy(ctx),
//     ],
//     conditions(ctx) {
//       return [
//         allTrue(this.setup(ctx)),
//         allTrue(this.trigger(ctx)),
//         allTrue(this.confirmation(ctx)),
//       ];
//     },
//     context: "htf_add",
//   },

// ];









// entrySignals.js

const allTrue = (arr) => arr.every(Boolean);

export const entrySignals = [

/* ============================================================
   🔼 TREND CONTINUATION / ADD-ON
============================================================ */

{
  id: 2,
  type: "long",
  name: "EMA Pullback Continuation",
  priority: 9,

  setup: (c) => [
    c.EMA8 > c.EMA21,
    c.EMA21 > c.EMA50,
    c.EMA50 > c.EMA200,
  ],
  trigger: (c) => [ c.Price <= c.EMA21 ],
  confirmation: (c) => [
    c.RSI > 50,
    c.MACD > c.MACD_Signal,
  ],

  conditions(c) {
    return [
      allTrue(this.setup(c)),
      allTrue(this.trigger(c)),
      allTrue(this.confirmation(c)),
    ];
  },

  context: "trend_add",
},

{
  id: 21,
  type: "long",
  name: "Micro Pullback Continuation",
  priority: 8,

  setup: (c) => [
    c.EMA8 > c.EMA21,
    c.RSI > 50,
  ],
  trigger: (c) => [ c.Price <= c.EMA8 ],
  confirmation: (c) => [ c.MACD > c.MACD_Signal ],

  conditions(c) {
    return [
      allTrue(this.setup(c)),
      allTrue(this.trigger(c)),
      allTrue(this.confirmation(c)),
    ];
  },

  context: "trend_add",
},

{
  id: 12,
  type: "short",
  name: "EMA Pullback Continuation (Downtrend)",
  priority: 9,

  setup: (c) => [
    c.EMA8 < c.EMA21,
    c.EMA21 < c.EMA50,
    c.EMA50 < c.EMA200,
  ],
  trigger: (c) => [ c.Price >= c.EMA21 ],
  confirmation: (c) => [
    c.RSI < 50,
    c.MACD < c.MACD_Signal,
  ],

  conditions(c) {
    return [
      allTrue(this.setup(c)),
      allTrue(this.trigger(c)),
      allTrue(this.confirmation(c)),
    ];
  },

  context: "trend_add",
},

/* ============================================================
   🔄 REVERSALS / MEAN REVERSION
============================================================ */

{
  id: 1,
  type: "long",
  name: "Bollinger Oversold Reversal",
  priority: 7,

  setup: (c) => [
    c.Price <= c.Bollinger_L,
    c.RSI < 40,
  ],
  trigger: (c) => [ c.Stochastic < 30 ],
  confirmation: (c) => [
    c.MACD > c.MACD_Signal,
    c.volume > c.avgVolume,
  ],

  conditions(c) {
    return [
      allTrue(this.setup(c)),
      allTrue(this.trigger(c)),
      allTrue(this.confirmation(c)),
    ];
  },

  context: "reversal",
},

{
  id: 11,
  type: "short",
  name: "Bollinger Overbought Reversal",
  priority: 7,

  setup: (c) => [
    c.Price >= c.Bollinger_U,
    c.RSI > 60,
  ],
  trigger: (c) => [ c.Stochastic > 70 ],
  confirmation: (c) => [
    c.MACD < c.MACD_Signal,
    c.volume > c.avgVolume,
  ],

  conditions(c) {
    return [
      allTrue(this.setup(c)),
      allTrue(this.trigger(c)),
      allTrue(this.confirmation(c)),
    ];
  },

  context: "reversal",
},

/* ============================================================
   🌐 HTF ADD-ONS
============================================================ */

{
  id: 8,
  type: "long",
  name: "HTF Bullish Alignment",
  priority: 8,

  setup: (c) => [ c.higherTF?.trend === "bull" ],
  trigger: (c) => [ c.currentTF?.trend === "bull" ],
  confirmation: (c) => [ c.EMA21 > c.EMA50 ],

  conditions(c) {
    return [
      allTrue(this.setup(c)),
      allTrue(this.trigger(c)),
      allTrue(this.confirmation(c)),
    ];
  },

  context: "htf_add",
},

{
  id: 18,
  type: "short",
  name: "HTF Bearish Alignment",
  priority: 8,

  setup: (c) => [ c.higherTF?.trend === "bear" ],
  trigger: (c) => [ c.currentTF?.trend === "bear" ],
  confirmation: (c) => [ c.EMA21 < c.EMA50 ],

  conditions(c) {
    return [
      allTrue(this.setup(c)),
      allTrue(this.trigger(c)),
      allTrue(this.confirmation(c)),
    ];
  },

  context: "htf_add",
},

/* ============================================================
   📊 RANGE TRADING
============================================================ */

{
  id: 7,
  type: "long",
  name: "Range Low Bounce",
  priority: 6,

  setup: (c) => [
    c.rangeState === "range",
    c.Price <= c.Bollinger_M,
  ],
  trigger: (c) => [ c.Stochastic > 30 ],
  confirmation: (c) => [ c.volume >= c.avgVolume ],

  conditions(c) {
    return [
      allTrue(this.setup(c)),
      allTrue(this.trigger(c)),
      allTrue(this.confirmation(c)),
    ];
  },

  context: "range",
},

{
  id: 17,
  type: "short",
  name: "Range High Rejection",
  priority: 6,

  setup: (c) => [
    c.rangeState === "range",
    c.Price >= c.Bollinger_M,
  ],
  trigger: (c) => [ c.Stochastic < 70 ],
  confirmation: (c) => [ c.volume >= c.avgVolume ],

  conditions(c) {
    return [
      allTrue(this.setup(c)),
      allTrue(this.trigger(c)),
      allTrue(this.confirmation(c)),
    ];
  },

  context: "range",
},

/* ============================================================
   ⚡ MOMENTUM
============================================================ */

{
  id: 22,
  type: "long",
  name: "Momentum Flip",
  priority: 6,

  setup: (c) => [ c.RSI < 45 ],
  trigger: (c) => [ c.RSI > 50 ],
  confirmation: (c) => [ c.MACD > c.MACD_Signal ],

  conditions(c) {
    return [
      allTrue(this.setup(c)),
      allTrue(this.trigger(c)),
      allTrue(this.confirmation(c)),
    ];
  },

  context: "momentum",
},

{
  id: 27,
  type: "short",
  name: "Momentum Breakdown",
  priority: 6,

  setup: (c) => [ c.RSI > 55 ],
  trigger: (c) => [ c.RSI < 50 ],
  confirmation: (c) => [ c.MACD < c.MACD_Signal ],

  conditions(c) {
    return [
      allTrue(this.setup(c)),
      allTrue(this.trigger(c)),
      allTrue(this.confirmation(c)),
    ];
  },

  context: "momentum",
},

/* ============================================================
   🌪️ VOLATILITY
============================================================ */

{
  id: 19,
  type: "short",
  name: "Volatility Compression Breakdown",
  priority: 6,

  setup: (c) => [
    c.BollingerWidth < c.BW_avg,
  ],
  trigger: (c) => [ c.Price < c.Bollinger_L ],
  confirmation: (c) => [ c.volume > c.avgVolume ],

  conditions(c) {
    return [
      allTrue(this.setup(c)),
      allTrue(this.trigger(c)),
      allTrue(this.confirmation(c)),
    ];
  },

  context: "volatility",
},

{
  id: 101,
  type: "long",
  name: "Counter-Trend Long (HTF Bearish Exhaustion)",
  priority: 5,

  setup: (c) => [
    c.higherTF?.trend === "bear",        // ❗ проти HTF
    c.RSI < 30,                          // перепроданість
    c.Price <= c.Bollinger_L,
  ],

  trigger: (c) => [
    c.Stochastic > 20,
  ],

  confirmation: (c) => [
    c.MACD > c.MACD_Signal,              // momentum flip
    c.volume > c.avgVolume,
  ],

  conditions(c) {
    return [
      allTrue(this.setup(c)),
      allTrue(this.trigger(c)),
      allTrue(this.confirmation(c)),
    ];
  },

  context: "counter_trend",
  counterTrend: true,
},

{
  id: 102,
  type: "short",
  name: "Counter-Trend Short (HTF Bullish Exhaustion)",
  priority: 5,

  setup: (c) => [
    c.higherTF?.trend === "bull",         // ❗ проти HTF
    c.RSI > 70,
    c.Price >= c.Bollinger_U,
  ],

  trigger: (c) => [
    c.Stochastic < 80,
  ],

  confirmation: (c) => [
    c.MACD < c.MACD_Signal,
    c.volume > c.avgVolume,
  ],

  conditions(c) {
    return [
      allTrue(this.setup(c)),
      allTrue(this.trigger(c)),
      allTrue(this.confirmation(c)),
    ];
  },

  context: "counter_trend",
  counterTrend: true,
},


];
