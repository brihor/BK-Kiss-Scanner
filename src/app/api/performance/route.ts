import { NextRequest, NextResponse } from "next/server";
import { AssetType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const days = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get("days")) || 1, 1),
    5
  );

  const filter = request.nextUrl.searchParams.get("filter") || "all";

  const since = new Date();
  since.setDate(since.getDate() - days);

  let assetFilter = {};

  if (filter === "forex") {
    assetFilter = { assetType: AssetType.FOREX };
  } else if (filter === "metals") {
    assetFilter = { assetType: AssetType.GOLD };
  } else if (filter === "indices") {
    assetFilter = { assetType: AssetType.INDICES };
  } else if (filter !== "all") {
    assetFilter = { pair: filter };
  }

  const signals = await prisma.signalPerformance.findMany({
    where: {
      signalTime: { gte: since },
      ...assetFilter,
    },
    orderBy: { signalTime: "asc" },
  });

  const tp = signals.filter((s) => s.outcome === "TP").length;
  const sl = signals.filter((s) => s.outcome === "SL").length;
  const completed = tp + sl;

  const winRate =
    completed > 0 ? Math.round((tp / completed) * 1000) / 10 : 0;

  const dailyMap = new Map<string, number>();

  for (const signal of signals) {
    const day = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "long",
    }).format(signal.signalTime);

    dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
  }

  return NextResponse.json({
    days,
    totalAlerts: signals.length,
    tp,
    sl,
    completed,
    winRate,
    dailyAlerts: Array.from(dailyMap, ([day, alerts]) => ({
      day,
      alerts,
    })),
  });
}
