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
    readFileSync(join(certsDirectory, "AppleIncRootCertificate.cer")),
    readFileSync(join(certsDirectory, "AppleRootCA-G2.cer")),
    readFileSync(join(certsDirectory, "AppleRootCA-G3.cer")),
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

function stripeGrantsAccess(status: string | null | undefined) {
  return (
    status === "ACTIVE" ||
    status === "TRIALING" ||
    status === "PAST_DUE"
  );
}

async function verifyNotification(signedPayload: string) {
  try {
    const verifier = createVerifier(Environment.PRODUCTION);

    return await verifier.verifyAndDecodeNotification(signedPayload);
  } catch {
    const verifier = createVerifier(Environment.SANDBOX);

    return await verifier.verifyAndDecodeNotification(signedPayload);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const signedPayload = body?.signedPayload;

    if (!signedPayload || typeof signedPayload !== "string") {
      return NextResponse.json(
        { error: "Missing Apple notification." },
        { status: 400 }
      );
    }

    const notification = await verifyNotification(signedPayload);

    const signedTransactionInfo =
      notification.data?.signedTransactionInfo;

    if (!signedTransactionInfo) {
      return NextResponse.json({ received: true });
    }

    let transaction;

    try {
      transaction =
        await createVerifier(
          Environment.PRODUCTION
        ).verifyAndDecodeTransaction(signedTransactionInfo);
    } catch {
      transaction =
        await createVerifier(
          Environment.SANDBOX
        ).verifyAndDecodeTransaction(signedTransactionInfo);
    }

    if (
      transaction.productId !== PRODUCT_ID ||
      !transaction.originalTransactionId
    ) {
      return NextResponse.json({ received: true });
    }

    const user = await prisma.user.findUnique({
      where: {
        appleOriginalTransactionId:
          transaction.originalTransactionId,
      },
    });

    if (!user) {
      console.log(
        `No BK account found for Apple transaction ${transaction.originalTransactionId}.`
      );

      return NextResponse.json({ received: true });
    }

    const expiresAt = transaction.expiresDate
      ? new Date(transaction.expiresDate)
      : null;

    const notificationType = notification.notificationType;

    let appleStatus = "INACTIVE";
    let appleGrantsAccess = false;

    const hasNotExpired =
      !!transaction.expiresDate &&
      transaction.expiresDate > Date.now();

    switch (notificationType) {
      case "SUBSCRIBED":
      case "DID_RENEW":
      case "DID_RECOVER":
        appleStatus = hasNotExpired ? "ACTIVE" : "EXPIRED";
        appleGrantsAccess = hasNotExpired;
        break;

      case "DID_CHANGE_RENEWAL_STATUS":
        // Turning off auto-renew does not end the already-paid period.
        appleStatus = hasNotExpired ? "ACTIVE" : "EXPIRED";
        appleGrantsAccess = hasNotExpired;
        break;

      case "DID_FAIL_TO_RENEW":
        appleStatus = hasNotExpired ? "GRACE_PERIOD" : "BILLING_RETRY";
        appleGrantsAccess = hasNotExpired;
        break;

      case "GRACE_PERIOD_EXPIRED":
      case "EXPIRED":
        appleStatus = "EXPIRED";
        appleGrantsAccess = false;
        break;

      case "REFUND":
      case "REVOKE":
        appleStatus = "REVOKED";
        appleGrantsAccess = false;
        break;

      default:
        appleStatus = hasNotExpired ? "ACTIVE" : "INACTIVE";
        appleGrantsAccess = hasNotExpired;
        break;
    }

    const stripeActive = stripeGrantsAccess(
      user.stripeSubscriptionStatus
    );

    const hasAccess =
      stripeActive || appleGrantsAccess;

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        appleProductId: transaction.productId,
        appleSubscriptionStatus: appleStatus,
        appleSubscriptionExpiresAt: expiresAt,
        subscriptionStatus: hasAccess ? "ACTIVE" : "INACTIVE",
        isActive: hasAccess,
      },
    });

    console.log(
      `Apple notification ${notificationType} processed for ${user.email}.`
    );

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error("APPLE NOTIFICATION ERROR:", error);

    return NextResponse.json(
      { error: "Unable to process Apple notification." },
      { status: 400 }
    );
  }
}