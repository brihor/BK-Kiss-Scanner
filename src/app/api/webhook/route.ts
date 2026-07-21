import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AssetType } from "@prisma/client";

function getAssetType(symbol: string): AssetType {
  const s = symbol.toUpperCase();

  if (s === "XAUUSD") return AssetType.GOLD;

  if (
    s.includes("BTC") ||
    s.includes("ETH") ||
    s.includes("SOL") ||
    s.includes("XRP")
  ) {
    return AssetType.CRYPTO;
  }

  if (
    s.includes("NAS") ||
    s.includes("US30") ||
    s.includes("SPX") ||
    s.includes("GER40") ||
    s.includes("UK100")
  ) {
    return AssetType.INDICES;
  }

  return AssetType.FOREX;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const signal = await prisma.signal.create({
      data: {
        pair: body.symbol,

        assetType: getAssetType(body.symbol),

        direction: body.action,

        entry: body.price,

        takeProfit: body.price,

        stopLoss: body.price,

        session: "Unknown",

        signalTime: new Date(),

        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),

        strength: 100,
      },
    });

    console.log("New Signal:", signal);

    return NextResponse.json({
      success: true,
      signal,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Invalid webhook payload.",
      },
      { status: 400 }
    );
  }
}