import { NextResponse } from "next/server";
import { getCandles } from "@/lib/oanda/candles";

export async function GET() {
  try {
    const candles = await getCandles("EUR_USD", 100);

    return NextResponse.json({
      success: true,
      count: candles.length,
      first: candles[0],
      last: candles[candles.length - 1],
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