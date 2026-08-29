import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { SignJWT } from "jose";
import {
  Environment,
  SignedDataVerifier,
} from "@apple/app-store-server-library";
import { prisma } from "@/lib/prisma";

const BUNDLE_ID = "com.bktradingacademy.bkkissscanner";
const APPLE_APP_ID = 6795382295;
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

function loadAppleRootCertificates() {
  const certsDirectory = join(
    process.cwd(),
    "certs"
  );

  return [
    readFileSync(
      join(
        certsDirectory,
        "AppleIncRootCertificate.cer"
      )
    ),
    readFileSync(
      join(
        certsDirectory,
        "AppleRootCA-G2.cer"
      )
    ),
    readFileSync(
      join(
        certsDirectory,
        "AppleRootCA-G3.cer"
      )
    ),
  ];
}

function createVerifier(
  environment: Environment
) {
  return new SignedDataVerifier(
    loadAppleRootCertificates(),
    true,
    environment,
    BUNDLE_ID,
    environment === Environment.PRODUCTION
      ? APPLE_APP_ID
      : undefined
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const signedTransactionInfo =
      body?.signedTransactionInfo;

    if (
      !signedTransactionInfo ||
      typeof signedTransactionInfo !== "string"
    ) {
      return NextResponse.json(
        {
          error:
            "Missing signed Apple transaction.",
        },
        { status: 400 }
      );
    }

    let transaction;

    /*
     * Try Production first.
     * Sandbox/TestFlight/App Review falls back
     * to the Sandbox verifier.
     */
    try {
      const productionVerifier =
        createVerifier(
          Environment.PRODUCTION
        );

      transaction =
        await productionVerifier
          .verifyAndDecodeTransaction(
            signedTransactionInfo
          );
    } catch {
      const sandboxVerifier =
        createVerifier(
          Environment.SANDBOX
        );

      transaction =
        await sandboxVerifier
          .verifyAndDecodeTransaction(
            signedTransactionInfo
          );
    }

    if (
      transaction.productId !== PRODUCT_ID
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid Apple subscription product.",
        },
        { status: 400 }
      );
    }

    if (
      !transaction.originalTransactionId
    ) {
      return NextResponse.json(
        {
          error:
            "Apple transaction is missing its original transaction ID.",
        },
        { status: 400 }
      );
    }

    if (!transaction.expiresDate) {
      return NextResponse.json(
        {
          error:
            "Apple subscription expiration information is missing.",
        },
        { status: 400 }
      );
    }

    /*
     * The Apple subscription must currently
     * be active before we allow account creation.
     */
    const appleActive =
      transaction.expiresDate > Date.now();

    if (!appleActive) {
      return NextResponse.json(
        {
          error:
            "This Apple subscription is not active.",
        },
        { status: 400 }
      );
    }

    /*
     * Make sure this Apple subscription has not
     * already been attached to another BK user.
     */
    const existingTransactionOwner =
      await prisma.user.findUnique({
        where: {
          appleOriginalTransactionId:
            transaction.originalTransactionId,
        },
      });

    if (existingTransactionOwner) {
      return NextResponse.json(
        {
          error:
            "This Apple subscription is already linked to a BK account. Please sign in or use Restore Purchases.",
        },
        { status: 409 }
      );
    }

    /*
     * Apple has verified the payment.
     *
     * IMPORTANT:
     * We still DO NOT create a User here.
     *
     * Instead we create a short-lived secure
     * setup token that allows the customer
     * to create their BK login next.
     */
    const setupToken = await new SignJWT({
      purpose: "apple-account-setup",

      appleOriginalTransactionId:
        transaction.originalTransactionId,

      appleProductId:
        transaction.productId,

      appleExpiresDate:
        transaction.expiresDate,
    })
      .setProtectedHeader({
        alg: "HS256",
      })
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(getKey());

    return NextResponse.json({
      success: true,
      purchaseVerified: true,
      setupToken,
      expiresAt: new Date(
        transaction.expiresDate
      ).toISOString(),
    });
  } catch (error) {
    console.error(
      "APPLE VERIFY ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to verify Apple purchase.",
      },
      { status: 400 }
    );
  }
}