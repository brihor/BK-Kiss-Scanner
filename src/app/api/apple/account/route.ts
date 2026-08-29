import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
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

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    /*
     * Existing BK customer:
     * Do not overwrite their password or existing subscription information.
     */
    if (existingUser) {
      if (existingUser.passwordHash) {
        return NextResponse.json(
          {
            error:
              "An account already exists for this email. Please sign in instead.",
          },
          { status: 409 }
        );
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await prisma.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          passwordHash,
          appleAppAccountToken:
            existingUser.appleAppAccountToken ?? randomUUID(),
        },
      });

      return NextResponse.json({
        success: true,
        userId: user.id,
        appAccountToken: user.appleAppAccountToken,
      });
    }

    /*
     * New Apple customer:
     * Create the BK account before beginning the Apple purchase.
     * Access remains inactive until Apple verifies the subscription.
     */
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        appleAppAccountToken: randomUUID(),
        appleSubscriptionStatus: "INACTIVE",
        subscriptionStatus: "INACTIVE",
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      appAccountToken: user.appleAppAccountToken,
    });
  } catch (error) {
    console.error("APPLE ACCOUNT ERROR:", error);

    return NextResponse.json(
      { error: "Unable to create your BK KiSS Scanner account." },
      { status: 500 }
    );
  }
}