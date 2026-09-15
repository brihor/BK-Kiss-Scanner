import { NextRequest, NextResponse } from "next/server";
import { AssetType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function getETParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);

  return {
    weekday: parts.find((p) => p.type === "weekday")?.value ?? "",
    hour: Number(parts.find((p) => p.type === "hour")?.value ?? 0),
  };
}

function getTradingDayNumber(date: Date): number | null {
  const { weekday, hour } = getETParts(date);

  if (weekday === "Sunday") return 1;

  if (weekday === "Monday") return hour < 12 ? 1 : 2;
  if (weekday === "Tuesday") return hour < 12 ? 2 : 3;
  if (weekday === "Wednesday") return hour < 12 ? 3 : 4;
  if (weekday === "Thursday") return hour < 12 ? 4 : 5;
  if (weekday === "Friday") return hour < 12 ? 5 : 6;

  return null;
}

export async function GET(request: NextRequest) {
  const selectedDay = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get("days")) || 1, 1),
    6
  );

  const filter = request.nextUrl.searchParams.get("filter") || "all";

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

  const nowET = getETParts(new Date());

  // Saturday is the weekly reset/closed period.
  if (nowET.weekday === "Saturday") {
    return NextResponse.json({
      days: selectedDay,
      totalAlerts: 0,
      selectedDayAlerts: 0,
      tp: 0,
      sl: 0,
      completed: 0,
      winRate: 0,
      dailyAlerts: [],
    });
  }

  // Performance history is cleared every Saturday by the existing cron.
  // Therefore the remaining records belong to the current scanner week.
  const weeklySignals = await prisma.signalPerformance.findMany({
    where: {
      ...assetFilter,
    },
    orderBy: { signalTime: "asc" },
  });

  const selectedSignals = weeklySignals.filter(
    (signal) => getTradingDayNumber(signal.signalTime) === selectedDay
  );

  const tp = selectedSignals.filter((s) => s.outcome === "TP").length;
  const sl = selectedSignals.filter((s) => s.outcome === "SL").length;
  const completed = tp + sl;

  const winRate =
    completed > 0 ? Math.round((tp / completed) * 1000) / 10 : 0;

  const dailyMap = new Map<string, number>();

  for (const signal of weeklySignals) {
    const dayNumber = getTradingDayNumber(signal.signalTime);

    if (dayNumber !== null) {
      const key = `Day ${dayNumber}`;
      dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
    }
  }

  return NextResponse.json({
    days: selectedDay,
    totalAlerts: weeklySignals.length,
    selectedDayAlerts: selectedSignals.length,
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
