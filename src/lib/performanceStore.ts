import { prisma } from "@/lib/prisma";
import { AssetType } from "@prisma/client";
import type { Signal } from "@/types/signal";

function getAssetType(pair: string): AssetType {
  const p = pair.toUpperCase();

  if (p.startsWith("XAU") || p.startsWith("XAG")) {
    return AssetType.GOLD;
  }

  if (
    p === "NAS100" ||
    p === "NAS100USD" ||
    p === "NAS100_USD" ||
    p === "US30" ||
    p === "US30USD" ||
    p === "US30_USD"
  ) {
    return AssetType.INDICES;
  }

  return AssetType.FOREX;
}

export async function recordPerformanceSignal(
  signal: Signal
): Promise<void> {
  await prisma.signalPerformance.create({
    data: {
      pair: signal.pair,
      assetType: getAssetType(signal.pair),
      direction: signal.direction,
      entry: signal.entry,
      takeProfit: signal.takeProfit ?? signal.entry,
      stopLoss: signal.stopLoss ?? signal.entry,
      signalTime: new Date(signal.signalTime),
    },
  });
}

export async function getPendingPerformanceSignals() {
  return prisma.signalPerformance.findMany({
    where: {
      outcome: null,
    },
    orderBy: {
      signalTime: "asc",
    },
  });
}

export async function markPerformanceOutcome(
  id: string,
  outcome: "TP" | "SL" | "AMBIGUOUS"
): Promise<void> {
  await prisma.signalPerformance.update({
    where: { id },
    data: {
      outcome,
      outcomeTime: new Date(),
    },
  });
}

export async function clearPerformanceHistory(): Promise<void> {
  await prisma.signalPerformance.deleteMany({});
}
