import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId as string,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionStatus: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user,
    });
  } catch (error) {
    console.error("GET CURRENT USER ERROR:", error);

    return NextResponse.json(
      { error: "Unable to retrieve account." },
      { status: 500 }
    );
  }
}