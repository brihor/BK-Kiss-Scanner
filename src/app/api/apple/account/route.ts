import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const PRODUCT_ID =
  "com.bktradingacademy.bkkissscanner.monthly";

function getKey() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not configured."
    );
  }

  return new TextEncoder().encode(secret);
}

export async function POST(request: Request) {
  try {
    const {
      email,
      password,
      setupToken,
    } = await request.json();

    if (!email || !password || !setupToken) {
      return NextResponse.json(
        {
          error:
            "Email, password, and Apple purchase verification are required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    /*
     * Verify the short-lived token that was
     * created only after Apple verified payment.
     */
    let payload;

    try {
      const result = await jwtVerify(
        setupToken,
        getKey()
      );

      payload = result.payload;
    } catch {
      return NextResponse.json(
        {
          error:
            "Your Apple account setup session has expired. Please restore your purchase or try again.",
        },
        { status: 401 }
      );
    }

    if (
      payload.purpose !==
      "apple-account-setup"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid Apple account setup.",
        },
        { status: 400 }
      );
    }

    const appleOriginalTransactionId =
      payload.appleOriginalTransactionId;

    const appleProductId =
      payload.appleProductId;

    const appleExpiresDate =
      payload.appleExpiresDate;

    if (
      typeof appleOriginalTransactionId !==
        "string" ||
      typeof appleProductId !== "string" ||
      typeof appleExpiresDate !== "number"
    ) {
      return NextResponse.json(
        {
          error:
            "Apple purchase information is incomplete.",
        },
        { status: 400 }
      );
    }

    if (appleProductId !== PRODUCT_ID) {
      return NextResponse.json(
        {
          error:
            "Invalid Apple subscription product.",
        },
        { status: 400 }
      );
    }

    /*
     * The subscription must still be active
     * at the time the BK account is created.
     */
    if (appleExpiresDate <= Date.now()) {
      return NextResponse.json(
        {
          error:
            "Your Apple subscription is no longer active.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    /*
     * Existing BK customers continue signing
     * in normally. Do not overwrite them.
     */
    const existingUser =
      await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "An account already exists for this email. Please sign in instead.",
        },
        { status: 409 }
      );
    }

    /*
     * Prevent one Apple subscription from
     * being linked to multiple BK accounts.
     */
    const existingTransactionOwner =
      await prisma.user.findUnique({
        where: {
          appleOriginalTransactionId,
        },
      });

    if (existingTransactionOwner) {
      return NextResponse.json(
        {
          error:
            "This Apple subscription is already linked to another BK account.",
        },
        { status: 409 }
      );
    }

    /*
     * NOW the customer has paid.
     *
     * This is the point where the BK account
     * is finally created.
     */
    const passwordHash =
      await bcrypt.hash(password, 12);

    const expiresAt = new Date(
      appleExpiresDate
    );

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,

        passwordHash,

        appleOriginalTransactionId,

        appleProductId,

        appleSubscriptionStatus:
          "ACTIVE",

        appleSubscriptionExpiresAt:
          expiresAt,

        /*
         * These are the fields the existing
         * BK login/access system already uses.
         */
        subscriptionStatus:
          "ACTIVE",

        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,

      accountCreated: true,

      userId: user.id,

      email: user.email,

      subscriptionStatus:
        user.subscriptionStatus,

      isActive:
        user.isActive,
    });
  } catch (error) {
    console.error(
      "APPLE ACCOUNT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create your BK KiSS Scanner account.",
      },
      { status: 500 }
    );
  }
}