import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/session";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("bk_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const payload = await verifySessionToken(sessionCookie);

    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId as string,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        {
          error: "No Stripe customer is associated with this account.",
        },
        { status: 400 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: "https://bk-kiss-scanner-nu.vercel.app/account",
    });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    console.error("Portal session error:", error);

    return NextResponse.json(
      { error: "Unable to create portal session." },
      { status: 500 }
    );
  }
}