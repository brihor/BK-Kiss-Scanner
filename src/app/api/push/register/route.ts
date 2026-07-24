import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { token, userId, platform } = await request.json();

    if (!token || !userId) {
      return NextResponse.json(
        { error: "Token and user ID are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid or inactive user." },
        { status: 403 }
      );
    }

    await prisma.pushToken.upsert({
      where: { token },
      update: {
        userId,
        platform: platform || null,
      },
      create: {
        token,
        userId,
        platform: platform || null,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Push registration error:", error);

    return NextResponse.json(
      { error: "Unable to register device." },
      { status: 500 }
    );
  }
}