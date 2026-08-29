import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const SCANNER_PRODUCT_ID = "prod_UwdOmOPiFUt0zz";

function stripeStatusGrantsAccess(status: string | null | undefined) {
  return status === "ACTIVE" || status === "TRIALING";
}

function appleStatusGrantsAccess(
  status: string | null | undefined,
  expiresAt: Date | null | undefined
) {
  if (status !== "ACTIVE" && status !== "GRACE_PERIOD") {
    return false;
  }

  if (!expiresAt) {
    return status === "ACTIVE" || status === "GRACE_PERIOD";
  }

  return expiresAt.getTime() > Date.now();
}

async function refreshOverallAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripeSubscriptionStatus: true,
      appleSubscriptionStatus: true,
      appleSubscriptionExpiresAt: true,
    },
  });

  if (!user) {
    return;
  }

  const stripeActive = stripeStatusGrantsAccess(
    user.stripeSubscriptionStatus
  );

  const appleActive = appleStatusGrantsAccess(
    user.appleSubscriptionStatus,
    user.appleSubscriptionExpiresAt
  );

  const hasAccess = stripeActive || appleActive;

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: hasAccess ? "ACTIVE" : "INACTIVE",
      isActive: hasAccess,
    },
  });
}

async function refreshUsers(userIds: string[]) {
  for (const userId of userIds) {
    await refreshOverallAccess(userId);
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured.");

    return NextResponse.json(
      { error: "Webhook secret not configured." },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error("Stripe webhook verification failed:", error);

    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const email =
          session.customer_details?.email ??
          session.customer_email;

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        const subscription = subscriptionId
          ? await stripe.subscriptions.retrieve(subscriptionId)
          : null;

        const purchasedProductId =
          subscription?.items.data[0]?.price?.product;

        if (purchasedProductId !== SCANNER_PRODUCT_ID) {
          console.log(
            `Ignoring non-scanner purchase: ${purchasedProductId}`
          );
          break;
        }

        if (!email) {
          console.error("Checkout completed without customer email.");
          break;
        }

        const normalizedEmail = email.trim().toLowerCase();

        const fullName =
          session.customer_details?.name?.trim() ?? "";

        const nameParts = fullName
          .split(/\s+/)
          .filter(Boolean);

        const firstName = nameParts[0] || null;

        const lastName =
          nameParts.length > 1
            ? nameParts.slice(1).join(" ")
            : null;

        const user = await prisma.user.upsert({
          where: {
            email: normalizedEmail,
          },
          update: {
            firstName,
            lastName,
            stripeCustomerId: customerId ?? null,
            stripeSubscriptionId: subscriptionId ?? null,
            stripeSubscriptionStatus: "ACTIVE",
          },
          create: {
            email: normalizedEmail,
            firstName,
            lastName,
            stripeCustomerId: customerId ?? null,
            stripeSubscriptionId: subscriptionId ?? null,
            stripeSubscriptionStatus: "ACTIVE",
            subscriptionStatus: "ACTIVE",
            isActive: true,
          },
        });

        await refreshOverallAccess(user.id);

        console.log(
          `Scanner subscription activated for ${normalizedEmail}.`
        );

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription =
          event.data.object as Stripe.Subscription;

        const purchasedProductId =
          subscription.items.data[0]?.price?.product;

        if (purchasedProductId !== SCANNER_PRODUCT_ID) {
          console.log(
            `Ignoring non-scanner subscription: ${purchasedProductId}`
          );
          break;
        }

        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const status = subscription.status.toUpperCase();

        const users = await prisma.user.findMany({
          where: {
            OR: [
              {
                stripeSubscriptionId: subscription.id,
              },
              {
                stripeCustomerId: customerId,
              },
            ],
          },
          select: {
            id: true,
          },
        });

        await prisma.user.updateMany({
          where: {
            id: {
              in: users.map((user) => user.id),
            },
          },
          data: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionStatus: status,
          },
        });

        await refreshUsers(users.map((user) => user.id));

        break;
      }

      case "customer.subscription.deleted": {
        const subscription =
          event.data.object as Stripe.Subscription;

        const purchasedProductId =
          subscription.items.data[0]?.price?.product;

        if (purchasedProductId !== SCANNER_PRODUCT_ID) {
          console.log(
            `Ignoring non-scanner cancellation: ${purchasedProductId}`
          );
          break;
        }

        const users = await prisma.user.findMany({
          where: {
            stripeSubscriptionId: subscription.id,
          },
          select: {
            id: true,
          },
        });

        await prisma.user.updateMany({
          where: {
            id: {
              in: users.map((user) => user.id),
            },
          },
          data: {
            stripeSubscriptionStatus: "CANCELED",
          },
        });

        await refreshUsers(users.map((user) => user.id));

        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | { id: string };
        };

        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id;

        if (!subscriptionId) {
          break;
        }

        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);

        const purchasedProductId =
          subscription.items.data[0]?.price?.product;

        if (purchasedProductId !== SCANNER_PRODUCT_ID) {
          console.log(
            `Ignoring non-scanner invoice: ${purchasedProductId}`
          );
          break;
        }

        const users = await prisma.user.findMany({
          where: {
            stripeSubscriptionId: subscription.id,
          },
          select: {
            id: true,
          },
        });

        await prisma.user.updateMany({
          where: {
            id: {
              in: users.map((user) => user.id),
            },
          },
          data: {
            stripeSubscriptionStatus: "ACTIVE",
          },
        });

        await refreshUsers(users.map((user) => user.id));

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | { id: string };
        };

        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id;

        if (!subscriptionId) {
          break;
        }

        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);

        const purchasedProductId =
          subscription.items.data[0]?.price?.product;

        if (purchasedProductId !== SCANNER_PRODUCT_ID) {
          console.log(
            `Ignoring non-scanner failed payment: ${purchasedProductId}`
          );
          break;
        }

        const users = await prisma.user.findMany({
          where: {
            stripeSubscriptionId: subscription.id,
          },
          select: {
            id: true,
          },
        });

        await prisma.user.updateMany({
          where: {
            id: {
              in: users.map((user) => user.id),
            },
          },
          data: {
            stripeSubscriptionStatus: "PAST_DUE",
          },
        });

        // Remove scanner access while the Stripe payment is past due.
        await refreshUsers(users.map((user) => user.id));

        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Stripe webhook processing error:",
      error
    );

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}