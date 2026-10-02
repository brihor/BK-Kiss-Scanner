import { NextRequest, NextResponse } from "next/server";
import { getCandles } from "@/lib/oanda/candles";
import { instruments } from "@/lib/config/instruments";

export async function GET(request: NextRequest) {
  try {
    const instrument = request.nextUrl.searchParams.get("instrument");

    if (!instrument || !instruments.includes(instrument)) {
      return NextResponse.json(
        { success: false, error: "Invalid instrument" },
        { status: 400 }
      );
    }

    const candles = await getCandles(instrument, 250, "M15");

    return NextResponse.json({
      success: true,
      instrument,
      candles,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}