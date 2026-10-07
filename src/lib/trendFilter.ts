import { getCandles } from "@/lib/oanda/candles";

export type TrendDirection = "BULLISH" | "BEARISH" | "NEUTRAL";

function getClose(candle: any): number {
  return Number(candle.mid.c);
}

function calculateSMA(values: number[], period: number): number | null {
  if (values.length < period) return null;

  const slice = values.slice(-period);
  return slice.reduce((sum, value) => sum + value, 0) / period;
}

function determineTrend(candles: any[]): TrendDirection {
  const completed = candles.filter(
    (candle) => candle.complete && candle.mid
  );

  if (completed.length < 55) {
    return "NEUTRAL";
  }

  const closes = completed.map(getClose);

  const currentPrice = closes[closes.length - 1];

  const currentMA50 = calculateSMA(closes, 50);
  const previousMA50 = calculateSMA(closes.slice(0, -5), 50);

  if (currentMA50 === null || previousMA50 === null) {
    return "NEUTRAL";
  }

  const rising = currentMA50 > previousMA50;
  const falling = currentMA50 < previousMA50;

  if (currentPrice > currentMA50 && rising) {
    return "BULLISH";
  }

  if (currentPrice < currentMA50 && falling) {
    return "BEARISH";
  }

  return "NEUTRAL";
}

export async function getHigherTimeframeTrend(instrument: string) {
  const [dailyCandles, weeklyCandles] = await Promise.all([
    getCandles(instrument, 60, "D"),
    getCandles(instrument, 60, "W"),
  ]);

  const daily = determineTrend(dailyCandles);
  const weekly = determineTrend(weeklyCandles);

  let trend: TrendDirection = "NEUTRAL";

  if (daily === "BULLISH" && weekly === "BULLISH") {
    trend = "BULLISH";
  }

  if (daily === "BEARISH" && weekly === "BEARISH") {
    trend = "BEARISH";
  }

  return {
    trend,
    daily,
    weekly,
  };
}
