import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/session";

export async function DELETE(request: NextRequest) {
  try {
    const sessionCookie =
      request.cookies.get("bk_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const session =
      await verifySessionToken(sessionCookie);

    const userId =
      typeof session?.userId === "string"
        ? session.userId
        : null;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    /*
     * Delete the user's registered push notification tokens
     * and then permanently delete the user's BK account.
     *
     * The user's Apple/Stripe subscription itself is
     * NOT canceled here. Account deletion and subscription
     * cancellation are separate actions.
     */
    await prisma.$transaction([
      prisma.pushToken.deleteMany({
        where: { userId },
      }),
      prisma.user.delete({
        where: { id: userId },
      }),
    ]);

    const response = NextResponse.json({
      success: true,
      message:
        "Your BK KiSS Scanner account has been deleted.",
    });

    response.cookies.set("bk_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Account deletion error:", error);

    return NextResponse.json(
      {
        error:
          "Unable to delete your account. Please try again.",
      },
      { status: 500 }
    );
  }
}