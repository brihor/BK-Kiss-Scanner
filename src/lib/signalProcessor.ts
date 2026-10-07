import { sendSignalPushNotification } from "@/lib/pushNotifications";
import { recordPerformanceSignal } from "@/lib/performanceStore";
import { scanMarket } from "@/lib/scanner";
import { getHigherTimeframeTrend } from "@/lib/trendFilter";
import {
  addSignal,
  findSignal,
  getSignals,
  removeSignal,
  updateSignal,
} from "@/lib/signalStore";
import type { Signal } from "@/types/signal";

const LOCK_MINUTES = 15;
const LOCK_DURATION_MS = LOCK_MINUTES * 60 * 1000;

function isMarketClosed() {
  const now = new Date();

  const nyParts = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    hour12: false,
    timeZone: "America/New_York",
  }).formatToParts(now);

  const nyDay =
    nyParts.find((part) => part.type === "weekday")?.value ?? "";

  const nyHour = Number(
    nyParts.find((part) => part.type === "hour")?.value ?? "0"
  );

  const fridayAfterClose = nyDay === "Fri" && nyHour >= 17;
  const saturday = nyDay === "Sat";
  const sundayBeforeOpen = nyDay === "Sun" && nyHour < 16;

  return fridayAfterClose || saturday || sundayBeforeOpen;
}

function isForexPair(pair: string) {
  const symbol = pair.toUpperCase();

  if (symbol.startsWith("XAU") || symbol.startsWith("XAG")) {
    return false;
  }

  if (
    symbol.startsWith("NAS100") ||
    symbol.startsWith("US30") ||
    symbol.startsWith("US_SPX500") ||
    symbol.startsWith("SPX500")
  ) {
    return false;
  }

  return true;
}

async function passesTrendFilter(
  pair: string,
  direction: "BUY" | "SELL"
) {
  // Trend experiment applies to Forex only.
  // Metals and indices keep their existing behavior.
  if (!isForexPair(pair)) {
    return true;
  }

  try {
    const { trend } = await getHigherTimeframeTrend(pair);

    if (direction === "BUY") {
      return trend === "BULLISH";
    }

    if (direction === "SELL") {
      return trend === "BEARISH";
    }

    return false;
  } catch (error) {
    console.error(`Trend filter skipped signal for ${pair}:`, error);

    // Fail closed for Forex during the experiment.
    // If trend cannot be confirmed, do not release the signal.
    return false;
  }
}

function withSignalAge(signals: Signal[], now: number) {
  return signals.map((signal) => ({
    ...signal,

    ageMinutes: Math.max(
      0,
      Math.floor(
        (now - new Date(signal.signalTime).getTime()) / 60000
      )
    ),
  }));
}

export async function processSignals(): Promise<Signal[]> {
  const now = Date.now();

  // Do not scan or generate new alerts while
  // the global trading market is closed.
  if (isMarketClosed()) {
    return withSignalAge(await getSignals(), now);
  }

  const scannerSignals = await scanMarket();

  const approvedSignals = [];

  for (const scannedSignal of scannerSignals) {
    const approved = await passesTrendFilter(
      scannedSignal.pair,
      scannedSignal.direction
    );

    if (approved) {
      approvedSignals.push(scannedSignal);
    }
  }

  const currentPairs = new Set(
    approvedSignals.map((signal) => signal.pair)
  );

  for (const scannedSignal of approvedSignals) {
    const existingSignal = await findSignal(scannedSignal.pair);

    if (!existingSignal) {
      const newSignal: Signal = {
        id: "",

        pair: scannedSignal.pair,

        direction: scannedSignal.direction,

        signal: scannedSignal.direction,

        entry: scannedSignal.entry,

        takeProfit: scannedSignal.takeProfit,

        stopLoss: scannedSignal.stopLoss,

        signalTime: new Date(now).toISOString(),

        lockedUntil: new Date(
          now + LOCK_DURATION_MS
        ).toISOString(),

        ageMinutes: 0,

        rsi: scannedSignal.rsi,

        stochasticK: scannedSignal.stochasticK,

        upperBand: scannedSignal.upperBand,

        lowerBand: scannedSignal.lowerBand,

        high: scannedSignal.high,

        low: scannedSignal.low,
      };

      await addSignal(newSignal);

      await recordPerformanceSignal(newSignal);

      await sendSignalPushNotification(newSignal);

      continue;
    }

    const lockExpired =
      now >= new Date(existingSignal.lockedUntil).getTime();

    if (!lockExpired) {
      continue;
    }

    const refreshedSignal: Signal = {
      ...existingSignal,

      direction: scannedSignal.direction,

      signal: scannedSignal.direction,

      entry: scannedSignal.entry,

      takeProfit: scannedSignal.takeProfit,

      stopLoss: scannedSignal.stopLoss,

      signalTime: new Date(now).toISOString(),

      lockedUntil: new Date(
        now + LOCK_DURATION_MS
      ).toISOString(),

      ageMinutes: 0,

      rsi: scannedSignal.rsi,

      stochasticK: scannedSignal.stochasticK,

      upperBand: scannedSignal.upperBand,

      lowerBand: scannedSignal.lowerBand,

      high: scannedSignal.high,

      low: scannedSignal.low,
    };

    await updateSignal(refreshedSignal);

    await sendSignalPushNotification(refreshedSignal);
  }

  const storedSignals = await getSignals();

  for (const storedSignal of storedSignals) {
    const lockExpired =
      now >= new Date(storedSignal.lockedUntil).getTime();

    if (
      lockExpired &&
      !currentPairs.has(storedSignal.pair)
    ) {
      await removeSignal(storedSignal.pair);
    }
  }

  return withSignalAge(await getSignals(), now);
}
