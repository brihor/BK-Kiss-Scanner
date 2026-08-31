import { NextResponse } from "next/server";
import { getSignals } from "@/lib/signalStore";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = Date.now();

    const storedSignals = await getSignals();

    const activeSignals = storedSignals.map((signal) => ({
      ...signal,

      ageMinutes: Math.max(
        0,
        Math.floor(
          (now - new Date(signal.signalTime).getTime()) / 60000
        )
      ),
    }));

    return NextResponse.json(activeSignals);
  } catch (error) {
    console.error("Signals API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load signals.",
      },
      {
        status: 500,
      }
    );
  }
}