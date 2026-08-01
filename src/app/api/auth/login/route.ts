import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    console.log("========== LOGIN ATTEMPT ==========");
    console.log("Email entered:", email);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    console.log("User found:", !!user);

    if (!user) {
      return NextResponse.json(
        { error: "USER_NOT_FOUND" },
        { status: 401 }
      );
    }

    console.log("Password hash exists:", !!user.passwordHash);

    if (!user.passwordHash) {
      return NextResponse.json(
        {
          error:
            "Please complete your BK KiSS Scanner account setup before signing in.",
        },
        { status: 403 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    console.log("Password matched:", passwordMatches);
    console.log("isActive:", user.isActive);
    console.log("subscriptionStatus:", user.subscriptionStatus);

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "PASSWORD_FAILED" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "ACCOUNT_INACTIVE" },
        { status: 403 }
      );
    }

    if (user.subscriptionStatus !== "ACTIVE") {
      return NextResponse.json(
        { error: "SUBSCRIPTION_INACTIVE" },
        { status: 403 }
      );
    }

    console.log("Creating session...");

    const sessionToken = await createSessionToken(user.id);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus,
      },
    });

    response.cookies.set("bk_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    console.log("LOGIN SUCCESS");
    console.log("==============================");

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      { error: "Unable to sign in." },
      { status: 500 }
    );
  }
}