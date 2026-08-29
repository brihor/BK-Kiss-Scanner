import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import {
  Environment,
  SignedDataVerifier,
} from "@apple/app-store-server-library";
import { prisma } from "@/lib/prisma";

const BUNDLE_ID = "com.bktradingacademy.bkkissscanner";
const APPLE_APP_ID = 6795382295;
const PRODUCT_ID = "com.bktradingacademy.bkkissscanner.monthly";

function loadAppleRootCertificates() {
  const certsDirectory = join(process.cwd(), "certs");

  return [
    readFileSync(
      join(certsDirectory, "AppleIncRootCertificate.cer")
    ),
    readFileSync(
      join(certsDirectory, "AppleRootCA-G2.cer")
    ),
    readFileSync(
      join(certsDirectory, "AppleRootCA-G3.cer")
    ),
  ];
}

function createVerifier(environment: Environment) {
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

function appleTransactionIsActive(
  expiresDate: number | undefined
) {
  if (!expiresDate) {
    return false;
  }

  return expiresDate > Date.now();
}

function stripeStatusGrantsAccess(
  status: string | null | undefined
) {
  return (
    status === "ACTIVE" ||
    status === "TRIALING" ||
    status === "PAST_DUE"
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
        { error: "Missing signed Apple transaction." },
        { status: 400 }
      );
    }

    let transaction;

    /*
     * Production purchases verify against production.
     * TestFlight/App Review/Sandbox purchases verify against sandbox.
     */
    try {
      const productionVerifier = createVerifier(
        Environment.PRODUCTION
      );

      transaction =
        await productionVerifier.verifyAndDecodeTransaction(
          signedTransactionInfo
        );
    } catch {
      const sandboxVerifier = createVerifier(
        Environment.SANDBOX
      );

      transaction =
        await sandboxVerifier.verifyAndDecodeTransaction(
          signedTransactionInfo
        );
    }

    if (transaction.productId !== PRODUCT_ID) {
      return NextResponse.json(
        { error: "Invalid Apple subscription product." },
        { status: 400 }
      );
    }

    if (!transaction.originalTransactionId) {
      return NextResponse.json(
        {
          error:
            "Apple transaction is missing its original transaction ID.",
        },
        { status: 400 }
      );
    }

    if (!transaction.appAccountToken) {
      return NextResponse.json(
        {
          error:
            "Apple transaction could not be linked to a BK account.",
        },
        { status: 400 }
      );
    }

    /*
     * Find the BK account using the UUID that was supplied
     * to Apple when the purchase began.
     */
    const user = await prisma.user.findUnique({
      where: {
        appleAppAccountToken:
          transaction.appAccountToken,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "No BK KiSS Scanner account matches this Apple purchase.",
        },
        { status: 404 }
      );
    }

    /*
     * Prevent one Apple subscription from being attached
     * to two different BK accounts.
     */
    const existingTransactionOwner =
      await prisma.user.findUnique({
        where: {
          appleOriginalTransactionId:
            transaction.originalTransactionId,
        },
      });

    if (
      existingTransactionOwner &&
      existingTransactionOwner.id !== user.id
    ) {
      return NextResponse.json(
        {
          error:
            "This Apple subscription is already linked to another account.",
        },
        { status: 409 }
      );
    }

    const appleActive = appleTransactionIsActive(
      transaction.expiresDate
    );

    const stripeActive =
      stripeStatusGrantsAccess(
        user.stripeSubscriptionStatus
      );

    const hasAccess =
      appleActive || stripeActive;

    const expiresAt =
      transaction.expiresDate
        ? new Date(transaction.expiresDate)
        : null;

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        appleOriginalTransactionId:
          transaction.originalTransactionId,

        appleProductId:
          transaction.productId,

        appleSubscriptionStatus:
          appleActive ? "ACTIVE" : "EXPIRED",

        appleSubscriptionExpiresAt:
          expiresAt,

        subscriptionStatus:
          hasAccess ? "ACTIVE" : "INACTIVE",

        isActive:
          hasAccess,
      },
    });

    return NextResponse.json({
      success: true,
      accessGranted: hasAccess,
      appleSubscriptionActive: appleActive,
      expiresAt:
        expiresAt?.toISOString() ?? null,
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