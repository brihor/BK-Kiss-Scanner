import { createHash, randomBytes } from "crypto";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GENERIC_MESSAGE =
  "If an account exists for that email, a password reset link has been sent.";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    // Always return the same message so people cannot test
    // which email addresses have scanner accounts.
    if (!user) {
      return NextResponse.json({
        success: true,
        message: GENERIC_MESSAGE,
      });
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error("SMTP environment variables are not configured.");

      return NextResponse.json(
        { error: "Password reset email is temporarily unavailable." },
        { status: 500 }
      );
    }

    const rawToken = randomBytes(32).toString("hex");

    const hashedToken = createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: expiresAt,
      },
    });

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL(request.url).origin;

    const resetUrl =
      `${origin}/reset-password?token=${encodeURIComponent(rawToken)}`;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      requireTLS: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"BK KiSS Scanner Support" <${smtpUser}>`,
      to: user.email,
      subject: "Reset Your BK KiSS Scanner Password",
      text: [
        "We received a request to reset your BK KiSS Scanner password.",
        "",
        `Reset your password here: ${resetUrl}`,
        "",
        "This link expires in 30 minutes.",
        "",
        "If you did not request this change, you can ignore this email.",
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; background:#080b10; padding:32px; color:#ffffff;">
          <div style="max-width:560px; margin:0 auto; background:#111821; border:1px solid #303846; border-radius:14px; padding:32px;">
            <h1 style="margin-top:0; color:#ffffff;">Reset Your Password</h1>

            <p style="color:#c2c9d2; line-height:1.6;">
              We received a request to reset your BK KiSS Scanner password.
            </p>

            <p style="margin:30px 0;">
              <a
                href="${resetUrl}"
                style="display:inline-block; background:#b21f24; color:#ffffff; text-decoration:none; padding:14px 24px; border-radius:8px; font-weight:700;"
              >
                Reset Password
              </a>
            </p>

            <p style="color:#c2c9d2; line-height:1.6;">
              This secure link expires in 30 minutes.
            </p>

            <p style="color:#7f8995; font-size:13px; line-height:1.6;">
              If you did not request this change, you can safely ignore this email.
            </p>

            <p style="color:#7f8995; font-size:12px; margin-bottom:0;">
              BK Trading Academy • BK KiSS Scanner
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: GENERIC_MESSAGE,
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return NextResponse.json(
      { error: "Unable to send the password reset email." },
      { status: 500 }
    );
  }
}