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
    p === "US30" ||
    p === "US30USD"
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
