
import {
  detectDivergence,
  detectHiddenDivergence,
  crossUp,
  crossDown,
  priceTouches,
  priceBreaksAbove,
  priceBreaksBelow,
  calculateLiquidationZones,
  countTrue,
} from "./indicators.js";

export const scenarios = (data, thresholds) => {
  const {
    // базові індикатори
    RSI,
    MACD,
    MACD_Signal,
    Stochastic,
    Bollinger_U,
    Bollinger_M,
    Bollinger_L,
    MFI,
    ATR,
    OI,
    Funding,
    OBV_CVD,
    Price,
    PrevMACD,
    PrevMACDSignal,

    // додаткові змінні для сценаріїв 31–60
    EMA8,
    EMA21,
    EMA50,
    EMA200,
    emaRibbonWidth,
    VWAP,
    anchoredVWAP,
    keltnerUpper,
    keltnerLower,
    trueRange,
    avgVolume,
    openingRangeHigh,
    openingRangeLow,
    gapUp,
    gapDown,
    breakoutButCloseInsideRange,
    higherTF,
    currentTF,
    EMA21_cross,
    volumeSpike,
    priceAtSR,
    RSI_divergence,
    OBV_rising,
    OBV_falling,
    priceFlat,
    priceLower,
    priceHigher,
    CVD_spike,
    priceReverses,
    priceAccelerates,
    VWMA_slopeAgree,
    EMA_trend,
    priceAtSRSCluster,
    oscillatorsExtreme,
    preferredReversionWindow,
    sessionTime,
    priceTouchesSR,
    volumeSpikeOnHold,
    priceRejectsResistance,
    bearishVolume,
    priceDepth,
    leverageMap,
    trendSignals,
    momentumSignals,
    volumeSignals,
    oiSignals,

    // історії для дивергенцій
    priceHistoryForRSI,
    RSI_History,
    priceHistoryForMACD,
    MACD_History,
  } = data;

  const currentPrice = Price ?? Bollinger_M;
  const macdIsBullish = MACD > MACD_Signal && MACD > 0;
  const macdIsBearish = MACD < MACD_Signal && MACD < 0;
  const macdNearZero = Math.abs(MACD) < 10;
  const isVolatile = ATR > (thresholds?.ATR_VOLATILE ?? 800);
  const bollingerWidth = (Bollinger_U ?? 0) - (Bollinger_L ?? 0);
  const hasPrevData = PrevMACD !== undefined && PrevMACDSignal !== undefined;

  const isBullishCrossover =
    hasPrevData && PrevMACD < PrevMACDSignal && MACD > MACD_Signal;

  const isBearishCrossover =
    hasPrevData && PrevMACD > PrevMACDSignal && MACD < MACD_Signal;

  return [
    // I. Trend & Momentum (1–6)
    {
      id: 1,
      category: "Trend",
      name: "🔴 Strong Bear Trend (Сильний Ведмежий Тренд) (Confirmed Bear)",
      active: RSI < 35 && macdIsBearish && MFI < 20,
    },
    {
      id: 2,
      category: "Trend",
      name: "🚀 Strong Bull Trend (Сильний Бичачий Тренд) (Confirmed Bull)",
      active: RSI > 65 && macdIsBullish && MFI > 80,
    },
    {
      id: 3,
      category: "Trend",
      name: "⬆️ Bullish Momentum Rising (Бичачий Імпульс Наростає) (Crossover)",
      active: isBullishCrossover && RSI > 50,
    },
    {
      id: 4,
      category: "Trend",
      name: "⬇️ Bearish Momentum Rising (Ведмежий Імпульс Наростає) (Crossover)",
      active: isBearishCrossover && RSI < 50,
    },
    {
      id: 5,
      category: "Trend",
      name: "🐂 Bull Trend Weakening (Бичачий Тренд Слабшає)",
      active: RSI > 60 && MACD > 0 && hasPrevData && MACD < PrevMACD,
    },
    {
      id: 6,
      category: "Trend",
      name: "🐻 Bear Trend Weakening (Ведмежий Тренд Слабшає)",
      active: RSI < 40 && MACD < 0 && hasPrevData && MACD > PrevMACD,
    },

    // II. Reversal & Correction (7–12)
    {
      id: 7,
      category: "Reversal & Correction",
      name: "🟢 Oversold Rebound (Відскок від Екстремальної Перепроданості)",
      active:
        Stochastic < thresholds.STOCH_OVERSOLD || RSI < thresholds.RSI_OVERSOLD,
    },
    {
      id: 8,
      category: "Reversal & Correction",
      name: "🛑 Overbought Correction (Корекція через Екстремальну Перекупленість)",
      active:
        Stochastic > thresholds.STOCH_OVERBOUGHT ||
        RSI > thresholds.RSI_OVERBOUGHT,
    },
    {
      id: 9,
      category: "Reversal & Correction",
      name: "🔄 Mean Reversion (Повернення до Середнього) (Bollinger)",
active:
  (currentPrice > Bollinger_U * 1.01 ||
   currentPrice < Bollinger_L * 0.99) &&
  !EMA_trend &&
  RSI > 30 &&
  RSI < 70
    },
    {
      id: 10,
      category: "Reversal & Correction",
      name: "⚠️ Bear Trap (Ведмежа Пастка)",
      active: currentPrice < Bollinger_L && Stochastic > 20 && RSI > 30,
    },
    {
      id: 11,
      category: "Reversal & Correction",
      name: "🚨 Bull Trap (Бичача Пастка)",
      active: currentPrice > Bollinger_U && Stochastic < 80 && RSI < 70,
    },
    {
      id: 12,
      category: "Reversal & Correction",
      name: "✨ Bearish MACD Reversal (Можливий Низхідний Розворот)",
      active: isBearishCrossover && RSI > 50,
    },

    // III. Divergence (13–16)
    {
      id: 13,
      category: "Divergence",
      name: "📉 Bearish Divergence (Класична Ведмежа Розбіжність)",
      active: detectDivergence("bear", priceHistoryForRSI, RSI_History),
    },
    {
      id: 14,
      category: "Divergence",
      name: "📈 Bullish Divergence (Класична Бичача Розбіжність)",
      active: detectDivergence("bull", priceHistoryForRSI, RSI_History),
    },
    {
      id: 15,
      category: "Divergence",
      name: "🔁 Hidden Bearish Divergence (Прихована Ведмежа Розбіжність)",
      active: detectHiddenDivergence("bear", priceHistoryForMACD, MACD_History),
    },
    {
      id: 16,
      category: "Divergence",
      name: "🔁 Hidden Bullish Divergence (Прихована Бичача Розбіжність)",
      active: detectHiddenDivergence("bull", priceHistoryForMACD, MACD_History),
    },

    // IV. Volume & Futures (17–22)
    {
      id: 17,
      category: "Volume & Futures",
      name: "🔥 Short Squeeze (Стиснення Шортів)",
active:
  OI > thresholds.OI_HIGH &&
  Funding < -thresholds.FUNDING_SQUEEZE &&
  RSI > 40 &&
  priceHigher
    },
    {
      id: 18,
      category: "Volume & Futures",
      name: "🥶 Long Squeeze (Стиснення Лонгів)",
      // active:
      //   OI > thresholds.OI_HIGH &&
      //   Funding > thresholds.FUNDING_SQUEEZE &&
      //   RSI > 60,
      active:
  OI > thresholds.OI_HIGH &&
  Funding > thresholds.FUNDING_SQUEEZE &&
  RSI < 60 &&
  priceLower
    },
    {
      id: 19,
      category: "Volume & Futures",
      name: "💵 Bullish Accumulation (Бичаче Накопичення)",
      active: RSI < 40 && OBV_CVD > -500 && MFI > 10,
    },
    {
      id: 20,
      category: "Volume & Futures",
      name: "💸 Capitulation (Паніка та Капітуляція)",
      active: MFI < thresholds.MFI_OVERSOLD && OBV_CVD < -20000,
    },
    {
      id: 21,
      category: "Volume & Futures",
      name: "⚠️ Liquidation Risk (Ризик Каскадних Ліквідацій)",
      active: OI > 100000 && Math.abs(Funding) > 0.02,
    },
    {
      id: 22,
      category: "Volume & Futures",
      name: "⚖️ Neutral Futures Market (Нейтральний Ринок Ф'ючерсів)",
      active: Math.abs(Funding) < 0.0001,
    },

    // V. Volatility & Range (23–28)
    {
      id: 23,
      category: "Volatility & Range",
      name: "🧊 Bollinger Squeeze (Стиснення Боллінджера, Низька Волатильність)",
      active:
        ATR < thresholds.ATR_LOW &&
        bollingerWidth < Bollinger_M * thresholds.BOLLINGER_SQUEEZE_FACTOR,
    },
    {
      id: 24,
      category: "Volatility & Range",
      name: "⚠️ Volatility Breakout (Прорив Волатильності)",
      active:
        isVolatile &&
        (currentPrice >= Bollinger_U || currentPrice <= Bollinger_L),
    },
    {
      id: 25,
      category: "Volatility & Range",
      name: "🔎 Upper Bollinger Test (Тест Верхньої Межі Боллінджера)",
active:
  Math.abs(currentPrice - Bollinger_U) < ATR * 0.2
    },
    {
      id: 26,
      category: "Volatility & Range",
      name: "🔎 Lower Bollinger Test (Тест Нижньої Межі Боллінджера)",
active:
  Math.abs(currentPrice - Bollinger_L) < ATR * 0.2
    },
    {
      id: 27,
      category: "Volatility & Range",
      name: "🧊 Consolidation (Консолідація)",
 active:
  RSI > 45 &&
  RSI < 55 &&
  Math.abs(MACD) < ATR * 0.02 &&
  Math.abs(currentPrice - Bollinger_M) < ATR
    },
    {
      id: 28,
      category: "Volatility & Range",
      name: "📉 Range Trading (Торгівля в Діапазоні)",
      active:
        !isVolatile && currentPrice > Bollinger_L && currentPrice < Bollinger_U,
    },

    // VI. Enter points (29–30)
    {
      id: 29,
      category: "Enter Long",
      name: "✅ Optimal Long Entry (Оптимальна Точка Входу Long)",
active:
  currentPrice <= Bollinger_L &&
  Stochastic < 20 &&
  isBullishCrossover &&
  RSI > 30 &&
  !macdIsBearish
    },
    {
      id: 30,
      category: "Enter Short",
      name: "✅ Optimal Short Entry (Оптимальна Точка Входу Short)",
      // active:
      //   currentPrice >= Bollinger_U && Stochastic > 80 && isBearishCrossover,
      active:
  currentPrice >= Bollinger_U &&
  Stochastic > 80 &&
  isBearishCrossover &&
  RSI < 70 &&
  !macdIsBullish
    },

    // VII. MA Strategies (31–35)
    {
      id: 31,
      category: "MA Strategies",
      name: "📈 EMA Ribbon Bullish Cluster (EMA Ribbon Бичачий Кластер)",
      active: EMA8 > EMA21 && EMA21 > EMA50 && EMA50 > EMA200,
    },
    {
      id: 32,
      category: "MA Strategies",
      name: "📉 EMA Ribbon Bearish Cluster (EMA Ribbon Ведмежий Кластер)",
      active: EMA8 < EMA21 && EMA21 < EMA50 && EMA50 < EMA200,
    },
    {
      id: 33,
      category: "MA Strategies",
      name: "🔁 EMA50-200 Death/Golden Cross (EMA50-200 Перехрестя Death/Golden Cross)",
      active:
        (EMA50 > EMA200 &&
          crossUp(PrevMACD, PrevMACDSignal, MACD, MACD_Signal)) ||
        (EMA50 < EMA200 &&
          crossDown(PrevMACD, PrevMACDSignal, MACD, MACD_Signal)),
    },
    {
      id: 34,
      category: "MA Strategies",
      name: "🎯 Moving Average Pullback Trade (Відкат до Ковзної Середньої)",
      active: priceTouches(currentPrice, EMA21) && macdIsBullish,
    },
    {
      id: 35,
      category: "MA Strategies",
      name: "🌀 Moving Average Squeeze Breakout (Прорив після Стискання MA)",
      active: emaRibbonWidth < thresholds.RIBBON_SQUEEZE && isVolatile,
    },

    // VIII. VWAP & Anchors & Keltner & Breakouts (36–44)
    {
      id: 36,
      category: "VWAP & Anchors",
      name: "📊 Price Above VWAP (Ціна Вище VWAP, Інституційний Нахил Вгору)",
      active: currentPrice > VWAP,
    },
    {
      id: 37,
      category: "VWAP & Anchors",
      name: "📉 Price Below VWAP (Ціна Нижче VWAP, Інституційний Нахил Вниз)",
      active: currentPrice < VWAP,
    },
    {
      id: 38,
      category: "VWAP & Anchors",
      name: "⚓ Anchored VWAP Reversion (Повернення до Прив'язаного VWAP)",
      active: Math.abs(currentPrice - anchoredVWAP) <= ATR * 0.5,
    },
    {
      id: 39,
      category: "Keltner",
      name: "🔔 Keltner Breakout (Прорив Каналу Келтнера)",
      active: currentPrice > keltnerUpper || currentPrice < keltnerLower,
    },
    {
      id: 40,
      category: "Keltner",
      name: "🔄 Keltner Mean Reversion (Повернення до Середнього Keltner)",
      active:
        (currentPrice < keltnerLower || currentPrice > keltnerUpper) &&
        RSI >= 40 &&
        RSI <= 60,
    },
    {
      id: 41,
      category: "Breakout",
      name: "💥 ATR Breakout (Прорив ATR, Розширення Волатильності)",
active:
  trueRange > ATR * thresholds.ATR_MULT &&
  data.volume > avgVolume * 1.5 &&
  (priceAccelerates ||
   priceBreaksAbove(currentPrice, openingRangeHigh) ||
   priceBreaksBelow(currentPrice, openingRangeLow))
    },
    {
      id: 42,
      category: "Breakout",
      name: "🛡 Opening Range Breakout (Прорив Діапазону Відкриття)",
      active:
        priceBreaksAbove(currentPrice, openingRangeHigh) ||
        priceBreaksBelow(currentPrice, openingRangeLow),
    },
    {
      id: 43,
      category: "Breakout",
      name: "🧨 Gap & Run (Геп і Продовження Руху)",
      active: gapUp || gapDown,
    },
    {
      id: 44,
      category: "Breakout",
      name: "🔍 False Breakout Detection (Виявлення Хибного Прориву)",
      active: breakoutButCloseInsideRange,
    },

    // IX. Multi-Timeframe & Confluence (45–48)
    {
      id: 45,
      category: "Multi-Timeframe",
      name: "🧭 MTF Trend Alignment (Bull) (Узгодженість Тренду MTF — Бичача)",
      active: higherTF?.trend === "bull" && currentTF?.trend === "bull",
    },
    {
      id: 46,
      category: "Multi-Timeframe",
      name: "🧭 MTF Trend Alignment (Bear) (Узгодженість Тренду MTF — Ведмежа)",
      active: higherTF?.trend === "bear" && currentTF?.trend === "bear",
    },
    {
      id: 47,
      category: "Confluence",
      name: "⚗️ Multi-Indicator Confluence (Конфлюенція Декількох Індикаторів)",
      active: EMA21_cross && RSI > 50 && volumeSpike,
    },
    {
      id: 48,
      category: "Confluence",
      name: "🔗 Support/Resistance + Oscillator (Підтримка/Опір + Осцилятор)",
      active: priceAtSR && RSI_divergence,
    },

    // X. Orderflow (49–52)
    {
      id: 49,
      category: "Orderflow",
      name: "📈 OBV Divergence Bullish (Бичача Розбіжність OBV)",
      active: OBV_rising && (priceFlat || priceLower),
    },
    {
      id: 50,
      category: "Orderflow",
      name: "📉 OBV Divergence Bearish (Ведмежа Розбіжність OBV)",
      active: OBV_falling && (priceFlat || priceHigher),
    },
    {
      id: 51,
      category: "Orderflow",
      name: "🔬 CVD Spike with Price Reaction (Сплеск CVD з Реакцією Ціни)",
      active: CVD_spike && (priceReverses || priceAccelerates),
    },
    {
      id: 52,
      category: "Orderflow",
      name: "⚖️ Volume-Weighted Momentum (Обʼємно-Зважений Моментум)",
      active: VWMA_slopeAgree && EMA_trend,
    },

    // XI. Mean Reversion (53–54)
    {
      id: 53,
      category: "Mean Reversion",
      name: "🔁 Mean Reversion at Key S/R Cluster (Повернення до Середнього на Ключовому Кластері S/R)",
      active: priceAtSRSCluster && oscillatorsExtreme,
    },
    {
      id: 54,
      category: "Mean Reversion",
      name: "⏳ Time-of-day Mean Reversion (Часове Повернення до Середнього)",
      active:
        preferredReversionWindow?.includes(sessionTime) && data.priceExtreme,
    },

    // XII. SR Zones (55–56)
    {
      id: 55,
      category: "SR Zones",
      name: "🔐 High-Quality Support Zone (Високоякісна Зона Підтримки)",
      active: priceTouchesSR && volumeSpikeOnHold,
    },
    {
      id: 56,
      category: "SR Zones",
      name: "🔒 Strong Resistance Rejection (Сильне Відбиття від Опору)",
      active: priceRejectsResistance && bearishVolume,
    },

    // XIII. Risk / Funding (57–58)
    {
      id: 57,
      category: "Risk / Funding",
      name: "📛 Funding Rate Extremes (Long Skew) (Екстремальний Фандінг — Перевага Лонгів)",
      active: Funding > thresholds.FUNDING_EXTREME_POS,
    },
    {
      id: 58,
      category: "Risk / Funding",
      name: "📛 Funding Rate Extremes (Short Skew) (Екстремальний Фандінг — Перевага Шортів)",
      active: Funding < -thresholds.FUNDING_EXTREME_POS,
    },

    // XIV. Liquidations (59)
    {
      id: 59,
      category: "Liquidations",
      name: "⚠️ Liquidation Levels Identification (Ідентифікація Рівнів Ліквідацій)",
      active: calculateLiquidationZones(priceDepth, leverageMap) !== null,
    },

    // XV. Meta / Signals (60)
    {
      id: 60,
      category: "Meta / Signals",
      name: "🔎 Composite Signal (Ринок синхронно показує напрям)",
active:
  trendSignals * 2 +
  momentumSignals +
  volumeSignals +
  oiSignals >= 4
    },
  ];
};
