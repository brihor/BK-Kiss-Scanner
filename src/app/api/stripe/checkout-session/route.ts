import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing checkout session." },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Checkout has not been completed." },
        { status: 403 }
      );
    }

    const email =
      session.customer_details?.email ??
      session.customer_email;

    if (!email) {
      return NextResponse.json(
        { error: "No email was found for this checkout." },
        { status: 404 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        passwordHash: true,
        subscriptionStatus: true,
      },
    });

    if (!user || user.subscriptionStatus !== "ACTIVE") {
      return NextResponse.json(
        { error: "Your BK KiSS Scanner subscription is not active yet." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      email: normalizedEmail,
      returningCustomer: Boolean(user.passwordHash),
    });
  } catch (error) {
    console.error("Checkout session lookup error:", error);

    return NextResponse.json(
      { error: "Unable to verify checkout session." },
      { status: 500 }
    );
  }
}