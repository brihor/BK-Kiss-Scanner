import { prisma } from "@/lib/prisma";
import {
  AssetType,
  type Signal as PrismaSignal,
} from "@prisma/client";
import type { Signal } from "@/types/signal";

function toSignal(
  signal: PrismaSignal
): Signal {
  return {
    id: signal.id,

    pair: signal.pair,

    direction:
      signal.direction as "BUY" | "SELL",

    signal:
      signal.direction as "BUY" | "SELL",

    entry: signal.entry,

    takeProfit: signal.takeProfit,

    stopLoss: signal.stopLoss,

    signalTime:
      signal.signalTime.toISOString(),

    lockedUntil:
      signal.lockedUntil.toISOString(),

    ageMinutes: 0,

    rsi: signal.rsi,

    stochasticK:
      signal.stochasticK,

    upperBand:
      signal.upperBand,

    lowerBand:
      signal.lowerBand,

    high: signal.high,

    low: signal.low,
  };
}

function getAssetType(
  pair: string
): AssetType {
  const p = pair.toUpperCase();

  if (
    p.startsWith("XAU") ||
    p.startsWith("XAG")
  ) {
    return AssetType.GOLD;
  }

  if (
    p === "NAS100" ||
    p === "NAS100USD" ||
    p === "US30" ||
    p === "US30USD"
  ) {
    return AssetType.INDICES;
  }

  return AssetType.FOREX;
}

export async function getSignals(): Promise<
  Signal[]
> {
  const signals =
    await prisma.signal.findMany({
      orderBy: {
        signalTime: "desc",
      },
    });

  return signals.map(toSignal);
}

export async function findSignal(
  pair: string
): Promise<Signal | undefined> {
  const signal =
    await prisma.signal.findUnique({
      where: {
        pair,
      },
    });

  return signal
    ? toSignal(signal)
    : undefined;
}

export async function addSignal(
  signal: Signal
): Promise<void> {
  await prisma.signal.upsert({
    where: {
      pair: signal.pair,
    },

    update: {
      direction:
        signal.direction,

      entry: signal.entry,

      takeProfit:
        signal.takeProfit ??
        signal.entry,

      stopLoss:
        signal.stopLoss ??
        signal.entry,

      signalTime: new Date(
        signal.signalTime
      ),

      lockedUntil: new Date(
        signal.lockedUntil
      ),

      rsi: signal.rsi,

      stochasticK:
        signal.stochasticK,

      upperBand:
        signal.upperBand,

      lowerBand:
        signal.lowerBand,

      high: signal.high,

      low: signal.low,
    },

    create: {
      pair: signal.pair,

      assetType:
        getAssetType(
          signal.pair
        ),

      direction:
        signal.direction,

      entry: signal.entry,

      takeProfit:
        signal.takeProfit ??
        signal.entry,

      stopLoss:
        signal.stopLoss ??
        signal.entry,

      signalTime: new Date(
        signal.signalTime
      ),

      lockedUntil: new Date(
        signal.lockedUntil
      ),

      rsi: signal.rsi,

      stochasticK:
        signal.stochasticK,

      upperBand:
        signal.upperBand,

      lowerBand:
        signal.lowerBand,

      high: signal.high,

      low: signal.low,
    },
  });
}

export async function updateSignal(
  signal: Signal
): Promise<void> {
  await prisma.signal.update({
    where: {
      pair: signal.pair,
    },

    data: {
      direction:
        signal.direction,

      entry: signal.entry,

      takeProfit:
        signal.takeProfit ??
        signal.entry,

      stopLoss:
        signal.stopLoss ??
        signal.entry,

      signalTime: new Date(
        signal.signalTime
      ),

      lockedUntil: new Date(
        signal.lockedUntil
      ),

      rsi: signal.rsi,

      stochasticK:
        signal.stochasticK,

      upperBand:
        signal.upperBand,

      lowerBand:
        signal.lowerBand,

      high: signal.high,

      low: signal.low,
    },
  });
}

export async function removeSignal(
  pair: string
): Promise<void> {
  await prisma.signal.delete({
    where: {
      pair,
    },
  });
}