import { Candle, calculateIndicators } from "./indicators";

export interface KissSignal {
  direction: "BUY" | "SELL" | "NONE";

  entry: number;

  atr: number;

  takeProfit: number;

  stopLoss: number;

  rsi: number;

  stochasticK: number;

  stochasticD: number;

  upperBand: number;

  lowerBand: number;

  high: number;

  low: number;
}

function getMinimumDistance(
  pair: string,
  atr: number
) {
  const symbol = pair.toUpperCase();

  // JPY Pairs
  if (symbol.includes("JPY")) {
    return Math.max(atr * 1.25, 0.20);
  }

  // Gold
  if (symbol.startsWith("XAU")) {
    return Math.max(atr * 1.25, 2.50);
  }

  // Silver
  if (symbol.startsWith("XAG")) {
    return Math.max(atr * 1.25, 0.20);
  }

  // NAS100
if (symbol.startsWith("NAS100")) {
  return Math.max(atr * 1.25, 20);
}

// US30
if (symbol.startsWith("US30")) {
  return Math.max(atr * 1.25, 20);
}

// SPX500
if (symbol.startsWith("US_SPX500")) {
  return Math.max(atr * 1.25, 20);
}

  // Standard Forex
  return Math.max(atr * 1.25, 0.0020);
}

export function evaluateSignal(
  candles: Candle[],
  pair: string
): KissSignal {

  const indicators =
    calculateIndicators(candles);

  if (
    !indicators.bollinger ||
    !indicators.stochastic ||
    indicators.rsi === null ||
    indicators.atr === null
  ) {
    return {
      direction: "NONE",

      entry: 0,

      atr: 0,

      takeProfit: 0,

      stopLoss: 0,

      rsi: 0,

      stochasticK: 0,

      stochasticD: 0,

      upperBand: 0,

      lowerBand: 0,

      high: 0,

      low: 0,
    };
  }

  const latest =
    candles[candles.length - 1];

  const high =
    Number(latest.mid.h);

  const low =
    Number(latest.mid.l);

  const entry =
    Number(latest.mid.c);

  const atr =
    indicators.atr;

  const distance =
    getMinimumDistance(
      pair,
      atr
    );

  const rsi =
    indicators.rsi;

  const k =
    indicators.stochastic.k;

  const d =
    indicators.stochastic.d;

  const upper =
    indicators.bollinger.upper;

  const lower =
    indicators.bollinger.lower;

  const buy =
    low <= lower &&
    rsi <= 20 &&
    k <= 20;

  const sell =
    high >= upper &&
    rsi >= 80 &&
    k >= 80;

  let takeProfit = 0;

  let stopLoss = 0;

  if (buy) {
    takeProfit =
      entry + distance;

    stopLoss =
      entry - distance;
  }

  if (sell) {
    takeProfit =
      entry - distance;

    stopLoss =
      entry + distance;
  }

  return {
    direction:
      buy
        ? "BUY"
        : sell
        ? "SELL"
        : "NONE",

    entry,

    atr,

    takeProfit,

    stopLoss,

    rsi,

    stochasticK: k,

    stochasticD: d,

    upperBand: upper,

    lowerBand: lower,

    high,

    low,
  };
}