import { NextResponse } from "next/server";
import { processSignals } from "@/lib/signalProcessor";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (
      !cronSecret ||
      authHeader !== `Bearer ${cronSecret}`
    ) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const signals = await processSignals();

    return NextResponse.json({
      ok: true,
      signalCount: signals.length,
    });
  } catch (error) {
    console.error("Scheduled scanner failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Scheduled scanner failed.",
      },
      { status: 500 }
    );
  }
}