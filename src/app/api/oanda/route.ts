import { NextResponse } from "next/server";
import { scanMarket } from "@/lib/scanner";

export async function GET() {
  try {
    const signals = await scanMarket();

    return NextResponse.json({
      totalSignals: signals.length,
      signals,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}