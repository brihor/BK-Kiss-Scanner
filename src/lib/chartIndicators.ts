import type { Candle } from "./indicators";

export interface ChartCandle extends Candle {
  time: string;
}

export interface ChartIndicatorPoint {
  time: number;
  upperBand: number | null;
  middleBand: number | null;
  lowerBand: number | null;
  rsi: number | null;
  stochasticK: number | null;
  stochasticD: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]) {
  const mean = average(values);
  return Math.sqrt(
    average(values.map((value) => Math.pow(value - mean, 2)))
  );
}

function ema(values: number[], length: number): Array<number | null> {
  const result: Array<number | null> = Array(values.length).fill(null);

  if (values.length < length) return result;

  let current = average(values.slice(0, length));
  result[length - 1] = current;

  const multiplier = 2 / (length + 1);

  for (let i = length; i < values.length; i++) {
    current = (values[i] - current) * multiplier + current;
    result[i] = current;
  }

  return result;
}

export function calculateChartIndicators(
  candles: ChartCandle[]
): ChartIndicatorPoint[] {
  const closes = candles.map((candle) => Number(candle.mid.c));
  const highs = candles.map((candle) => Number(candle.mid.h));
  const lows = candles.map((candle) => Number(candle.mid.l));

  const macdFast = ema(closes, 12);
  const macdSlow = ema(closes, 26);

  const macdValues: Array<number | null> = closes.map((_, index) => {
    if (macdFast[index] === null || macdSlow[index] === null) return null;
    return macdFast[index]! - macdSlow[index]!;
  });

  const validMacd = macdValues.filter(
    (value): value is number => value !== null
  );

  const signalValues = ema(validMacd, 9);
  let signalIndex = 0;

  return candles.map((candle, index) => {
    const time = Math.floor(new Date(candle.time).getTime() / 1000);

    let upperBand: number | null = null;
    let middleBand: number | null = null;
    let lowerBand: number | null = null;

    if (index >= 19) {
      const bbSlice = closes.slice(index - 19, index + 1);
      middleBand = average(bbSlice);
      const deviation = standardDeviation(bbSlice);
      upperBand = middleBand + deviation * 2;
      lowerBand = middleBand - deviation * 2;
    }

    let rsi: number | null = null;

    if (index >= 7) {
      let gains = 0;
      let losses = 0;

      for (let i = index - 6; i <= index; i++) {
        const change = closes[i] - closes[i - 1];
        if (change > 0) gains += change;
        else losses += Math.abs(change);
      }

      const averageGain = gains / 7;
      const averageLoss = losses / 7;

      rsi =
        averageLoss === 0
          ? 100
          : 100 - 100 / (1 + averageGain / averageLoss);
    }

    const rawK: number[] = [];

    for (let i = 4; i <= index; i++) {
      const highest = Math.max(...highs.slice(i - 4, i + 1));
      const lowest = Math.min(...lows.slice(i - 4, i + 1));
      const denominator = highest - lowest;

      rawK.push(
        denominator === 0
          ? 50
          : ((closes[i] - lowest) / denominator) * 100
      );
    }

    const smoothedK: number[] = [];

    for (let i = 2; i < rawK.length; i++) {
      smoothedK.push(average(rawK.slice(i - 2, i + 1)));
    }

    const smoothedD: number[] = [];

    for (let i = 2; i < smoothedK.length; i++) {
      smoothedD.push(average(smoothedK.slice(i - 2, i + 1)));
    }

    const stochasticK =
      smoothedK.length > 0 ? smoothedK[smoothedK.length - 1] : null;

    const stochasticD =
      smoothedD.length > 0 ? smoothedD[smoothedD.length - 1] : null;

    const macd = macdValues[index];

    let macdSignal: number | null = null;

    if (macd !== null) {
      macdSignal = signalValues[signalIndex] ?? null;
      signalIndex++;
    }

    const macdHistogram =
      macd !== null && macdSignal !== null ? macd - macdSignal : null;

    return {
      time,
      upperBand,
      middleBand,
      lowerBand,
      rsi,
      stochasticK,
      stochasticD,
      macd,
      macdSignal,
      macdHistogram,
    };
  });
}