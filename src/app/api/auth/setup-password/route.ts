import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No BK KiSS Scanner account was found for this email." },
        { status: 404 }
      );
    }

    if (user.subscriptionStatus !== "ACTIVE") {
      return NextResponse.json(
        { error: "An active BK KiSS Scanner subscription is required." },
        { status: 403 }
      );
    }

    if (user.passwordHash) {
      return NextResponse.json(
        { error: "Your password has already been created. Please sign in." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your BK KiSS Scanner password has been created.",
    });
  } catch (error) {
    console.error("Password setup error:", error);

    return NextResponse.json(
      { error: "Unable to complete account setup." },
      { status: 500 }
    );
  }
}