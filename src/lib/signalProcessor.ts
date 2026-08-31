import { sendSignalPushNotification } from "@/lib/pushNotifications";
import { scanMarket } from "@/lib/scanner";
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

  const currentPairs = new Set(
    scannerSignals.map((signal) => signal.pair)
  );

  for (const scannedSignal of scannerSignals) {
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