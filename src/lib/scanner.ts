import { instruments } from "@/lib/config/instruments";
import { getCandles } from "@/lib/oanda/candles";
import { evaluateSignal } from "@/lib/kissEngine";

export interface ScannerSignal {
  pair: string;
  direction: "BUY" | "SELL";

  entry: number;
  atr: number;
  takeProfit: number;
  stopLoss: number;

  rsi: number;
  stochasticK: number;
  upperBand: number;
  lowerBand: number;
  high: number;
  low: number;
}

export async function scanMarket(): Promise<ScannerSignal[]> {
  const signals: ScannerSignal[] = [];

  await Promise.all(
    instruments.map(async (pair) => {
      try {
        const candles = await getCandles(pair);

        const result = evaluateSignal(
          candles,
          pair
        );

        if (result.direction === "NONE") {
          return;
        }

        signals.push({
          pair,
          direction: result.direction,

          entry: result.entry,
          atr: result.atr,
          takeProfit: result.takeProfit,
          stopLoss: result.stopLoss,

          rsi: result.rsi,
          stochasticK: result.stochasticK,
          upperBand: result.upperBand,
          lowerBand: result.lowerBand,
          high: result.high,
          low: result.low,
        });
      } catch (error) {
        console.error(
          `Scanner Error (${pair})`,
          error
        );
      }
    })
  );

  return signals;
}