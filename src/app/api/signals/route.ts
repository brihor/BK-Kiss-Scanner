import { NextResponse } from "next/server";
import { scanMarket } from "@/lib/scanner";
import {
  addSignal,
  findSignal,
  getSignals,
  removeSignal,
  updateSignal,
} from "@/lib/signalStore";
import type { Signal } from "@/types/signal";

export const dynamic = "force-dynamic";

const LOCK_MINUTES = 15;
const LOCK_DURATION_MS =
  LOCK_MINUTES * 60 * 1000;

export async function GET() {
  try {
    const scannerSignals =
      await scanMarket();

    const now = Date.now();

    const currentPairs = new Set(
      scannerSignals.map(
        (signal) => signal.pair
      )
    );

    for (
      const scannedSignal of scannerSignals
    ) {
      const existingSignal =
        findSignal(scannedSignal.pair);

      if (!existingSignal) {
        const newSignal: Signal = {
          id: `${scannedSignal.pair}-${scannedSignal.direction}-${now}`,

          pair: scannedSignal.pair,

          direction:
            scannedSignal.direction,

          signal:
            scannedSignal.direction,

          entry:
            scannedSignal.entry,

          takeProfit:
            scannedSignal.takeProfit,

          stopLoss:
            scannedSignal.stopLoss,

          signalTime:
            new Date(now).toISOString(),

          lockedUntil:
            new Date(
              now + LOCK_DURATION_MS
            ).toISOString(),

          ageMinutes: 0,

          rsi:
            scannedSignal.rsi,

          stochasticK:
            scannedSignal.stochasticK,

          upperBand:
            scannedSignal.upperBand,

          lowerBand:
            scannedSignal.lowerBand,

          high:
            scannedSignal.high,

          low:
            scannedSignal.low,
        };

        addSignal(newSignal);

        continue;
      }

      const lockExpired =
        now >=
        new Date(
          existingSignal.lockedUntil
        ).getTime();

      if (!lockExpired) {
        continue;
      }

      const refreshedSignal: Signal = {
        ...existingSignal,

        id: `${scannedSignal.pair}-${scannedSignal.direction}-${now}`,

        direction:
          scannedSignal.direction,

        signal:
          scannedSignal.direction,

        entry:
          scannedSignal.entry,

        takeProfit:
          scannedSignal.takeProfit,

        stopLoss:
          scannedSignal.stopLoss,

        signalTime:
          new Date(now).toISOString(),

        lockedUntil:
          new Date(
            now + LOCK_DURATION_MS
          ).toISOString(),

        ageMinutes: 0,

        rsi:
          scannedSignal.rsi,

        stochasticK:
          scannedSignal.stochasticK,

        upperBand:
          scannedSignal.upperBand,

        lowerBand:
          scannedSignal.lowerBand,

        high:
          scannedSignal.high,

        low:
          scannedSignal.low,
      };

      updateSignal(refreshedSignal);
    }

    for (
      const storedSignal of [
        ...getSignals(),
      ]
    ) {
      const lockExpired =
        now >=
        new Date(
          storedSignal.lockedUntil
        ).getTime();

      if (
        lockExpired &&
        !currentPairs.has(
          storedSignal.pair
        )
      ) {
        removeSignal(
          storedSignal.pair
        );
      }
    }

    const activeSignals =
      getSignals().map((signal) => ({
        ...signal,

        ageMinutes: Math.max(
          0,
          Math.floor(
            (now -
              new Date(
                signal.signalTime
              ).getTime()) /
              60000
          )
        ),
      }));

    return NextResponse.json(
      activeSignals
    );
  } catch (error) {
    console.error(
      "Signals API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to scan the market.",
      },
      {
        status: 500,
      }
    );
  }
}