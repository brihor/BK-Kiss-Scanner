import { getCandles } from "@/lib/oanda";
import {
  getPendingPerformanceSignals,
  markPerformanceOutcome,
} from "@/lib/performanceStore";

export async function updatePerformanceOutcomes() {
  const pending = await getPendingPerformanceSignals();

  const byPair = new Map<string, typeof pending>();

  for (const signal of pending) {
    const signals = byPair.get(signal.pair) ?? [];
    signals.push(signal);
    byPair.set(signal.pair, signals);
  }

  for (const [pair, signals] of byPair) {
    try {
      // Performance tracking only.
      // One OANDA request per instrument, not per alert.
      const data = await getCandles(pair, "M1", 500);
      const candles = data.candles ?? [];

      for (const signal of signals) {
        for (const candle of candles) {
          if (!candle.complete || !candle.mid) continue;

          const candleTime = new Date(candle.time);

          if (candleTime < signal.signalTime) continue;

          const high = Number(candle.mid.h);
          const low = Number(candle.mid.l);

          const tpHit =
            signal.direction === "BUY"
              ? high >= signal.takeProfit
              : low <= signal.takeProfit;

          const slHit =
            signal.direction === "BUY"
              ? low <= signal.stopLoss
              : high >= signal.stopLoss;

          // Never guess if both levels occur inside the same minute.
          if (tpHit && slHit) {
            await markPerformanceOutcome(signal.id, "AMBIGUOUS");
            break;
          }

          if (tpHit) {
            await markPerformanceOutcome(signal.id, "TP");
            break;
          }

          if (slHit) {
            await markPerformanceOutcome(signal.id, "SL");
            break;
          }
        }
      }
    } catch (error) {
      console.error(`Performance tracking skipped for ${pair}:`, error);
    }
  }
}
