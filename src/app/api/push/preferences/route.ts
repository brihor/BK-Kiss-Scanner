import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

async function getAuthenticatedUser() {
  const session = await getSession();

  if (!session || !session.userId) {
    return null;
  }

  return await prisma.user.findUnique({
    where: {
      id: session.userId as string,
    },
    select: {
      id: true,
      isActive: true,
      subscriptionStatus: true,
      disabledPushInstruments: true,
    },
  });
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (
      !user ||
      !user.isActive ||
      user.subscriptionStatus !== "ACTIVE"
    ) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      disabledInstruments:
        user.disabledPushInstruments ?? [],
    });
  } catch (error) {
    console.error(
      "GET PUSH PREFERENCES ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Unable to retrieve preferences." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (
      !user ||
      !user.isActive ||
      user.subscriptionStatus !== "ACTIVE"
    ) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const disabledInstruments =
      body?.disabledInstruments;

    if (!Array.isArray(disabledInstruments)) {
      return NextResponse.json(
        { error: "Invalid notification preferences." },
        { status: 400 }
      );
    }

    const cleanedInstruments = [
      ...new Set(
        disabledInstruments.filter(
          (instrument): instrument is string =>
            typeof instrument === "string" &&
            instrument.trim().length > 0
        )
      ),
    ];

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        disabledPushInstruments: cleanedInstruments,
      },
    });

    return NextResponse.json({
      success: true,
      disabledInstruments: cleanedInstruments,
    });
  } catch (error) {
    console.error(
      "SAVE PUSH PREFERENCES ERROR:",
      error
    );

    return NextResponse.json(
      { error: "Unable to save preferences." },
      { status: 500 }
    );
  }
}
