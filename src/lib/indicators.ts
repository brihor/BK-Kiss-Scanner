export interface Candle {
  mid: {
    o: string;
    h: string;
    l: string;
    c: string;
  };
}

function closes(candles: Candle[]) {
  return candles.map((candle) =>
    Number(candle.mid.c)
  );
}

function highs(candles: Candle[]) {
  return candles.map((candle) =>
    Number(candle.mid.h)
  );
}

function lows(candles: Candle[]) {
  return candles.map((candle) =>
    Number(candle.mid.l)
  );
}

function sma(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return (
    values.reduce(
      (sum, value) => sum + value,
      0
    ) / values.length
  );
}

function stdDev(values: number[]) {
  const average = sma(values);

  const variance =
    values.reduce((sum, value) => {
      return (
        sum +
        Math.pow(
          value - average,
          2
        )
      );
    }, 0) / values.length;

  return Math.sqrt(variance);
}

/* =======================================================
   RSI (Length 7)
======================================================= */

export function rsi(
  candles: Candle[],
  length = 7
) {
  const data = closes(candles);

  if (data.length < length + 1) {
    return null;
  }

  let gains = 0;
  let losses = 0;

  for (
    let i = data.length - length;
    i < data.length;
    i++
  ) {
    const change =
      data[i] - data[i - 1];

    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const averageGain =
    gains / length;

  const averageLoss =
    losses / length;

  if (averageLoss === 0) {
    return 100;
  }

  const relativeStrength =
    averageGain / averageLoss;

  return (
    100 -
    100 / (1 + relativeStrength)
  );
}

/* =======================================================
   Bollinger Bands (14, 2)
======================================================= */

export function bollingerBands(
  candles: Candle[],
  length = 14,
  deviation = 2
) {
  const data = closes(candles);

  if (data.length < length) {
    return null;
  }

  const slice =
    data.slice(-length);

  const middle = sma(slice);
  const deviationValue =
    stdDev(slice);

  return {
    upper:
      middle +
      deviationValue * deviation,

    middle,

    lower:
      middle -
      deviationValue * deviation,
  };
}

/* =======================================================
   Stochastic (5, 3, 3)
======================================================= */

export function stochastic(
  candles: Candle[],
  length = 5,
  smoothK = 3,
  smoothD = 3
) {
  if (
    candles.length <
    length + smoothK + smoothD
  ) {
    return null;
  }

  const candleHighs =
    highs(candles);

  const candleLows =
    lows(candles);

  const candleCloses =
    closes(candles);

  const rawK: number[] = [];

  for (
    let i = length - 1;
    i < candles.length;
    i++
  ) {
    const highest = Math.max(
      ...candleHighs.slice(
        i - length + 1,
        i + 1
      )
    );

    const lowest = Math.min(
      ...candleLows.slice(
        i - length + 1,
        i + 1
      )
    );

    const denominator =
      highest - lowest;

    if (denominator === 0) {
      rawK.push(50);
      continue;
    }

    rawK.push(
      ((candleCloses[i] - lowest) /
        denominator) *
        100
    );
  }

  const smoothedK: number[] = [];

  for (
    let i = smoothK - 1;
    i < rawK.length;
    i++
  ) {
    smoothedK.push(
      sma(
        rawK.slice(
          i - smoothK + 1,
          i + 1
        )
      )
    );
  }

  const smoothedD: number[] = [];

  for (
    let i = smoothD - 1;
    i < smoothedK.length;
    i++
  ) {
    smoothedD.push(
      sma(
        smoothedK.slice(
          i - smoothD + 1,
          i + 1
        )
      )
    );
  }

  return {
    k: smoothedK.at(-1) ?? 0,
    d: smoothedD.at(-1) ?? 0,
  };
}

/* =======================================================
   ATR (Length 14)
======================================================= */

export function atr(
  candles: Candle[],
  length = 14
) {
  if (
    candles.length <
    length + 1
  ) {
    return null;
  }

  const trueRanges: number[] = [];

  for (
    let i = 1;
    i < candles.length;
    i++
  ) {
    const currentHigh =
      Number(candles[i].mid.h);

    const currentLow =
      Number(candles[i].mid.l);

    const previousClose =
      Number(candles[i - 1].mid.c);

    const highLowRange =
      currentHigh - currentLow;

    const highPreviousClose =
      Math.abs(
        currentHigh -
          previousClose
      );

    const lowPreviousClose =
      Math.abs(
        currentLow -
          previousClose
      );

    const trueRange = Math.max(
      highLowRange,
      highPreviousClose,
      lowPreviousClose
    );

    trueRanges.push(trueRange);
  }

  const recentTrueRanges =
    trueRanges.slice(-length);

  return sma(recentTrueRanges);
}

/* =======================================================
   BK KiSS Indicator Bundle
======================================================= */

export function calculateIndicators(
  candles: Candle[]
) {
  return {
    rsi: rsi(candles),

    bollinger:
      bollingerBands(candles),

    stochastic:
      stochastic(candles),

    atr: atr(candles),
  };
}