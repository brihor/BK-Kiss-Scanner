import { NextResponse } from "next/server";
import { updatePerformanceOutcomes } from "@/lib/performanceTracker";
import { clearPerformanceHistory } from "@/lib/performanceStore";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const newYorkDay = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "long",
    }).format(new Date());

    if (newYorkDay === "Saturday") {
      await clearPerformanceHistory();

      return NextResponse.json({
        ok: true,
        weeklyReset: true,
      });
    }

    await updatePerformanceOutcomes();

    return NextResponse.json({
      ok: true,
      weeklyReset: false,
    });
  } catch (error) {
    console.error("Performance tracking failed:", error);

    return NextResponse.json(
      { ok: false, error: "Performance tracking failed." },
      { status: 500 }
    );
  }
}
