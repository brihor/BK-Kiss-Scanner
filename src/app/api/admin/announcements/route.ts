import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

async function getAdminUser() {
  const session = await getSession();
  const userId =
    typeof session?.userId === "string" ? session.userId : null;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      isActive: true,
    },
    select: {
      id: true,
      email: true,
    },
  });
}

export async function GET() {
  try {
    const admin = await getAdminUser();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const announcements = await prisma.announcement.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("Unable to load announcements:", error);

    return NextResponse.json(
      { error: "Unable to load announcements." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminUser();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    const buttonText =
      typeof body.buttonText === "string" && body.buttonText.trim()
        ? body.buttonText.trim()
        : null;

    const buttonUrl =
      typeof body.buttonUrl === "string" && body.buttonUrl.trim()
        ? body.buttonUrl.trim()
        : null;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Headline and message are required." },
        { status: 400 }
      );
    }

    if (title.length > 120 || message.length > 2000) {
      return NextResponse.json(
        { error: "Announcement is too long." },
        { status: 400 }
      );
    }

    if (buttonText && buttonText.length > 40) {
      return NextResponse.json(
        { error: "Button text is too long." },
        { status: 400 }
      );
    }

    if (buttonUrl) {
      try {
        const url = new URL(buttonUrl);

        if (url.protocol !== "https:" && url.protocol !== "http:") {
          throw new Error("Invalid protocol");
        }
      } catch {
        return NextResponse.json(
          { error: "Please enter a valid button link." },
          { status: 400 }
        );
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        message,
        buttonText,
        buttonUrl,
        isActive: true,
      },
    });

    // Only the newest announcement is retained.
    // Related dismissal records are removed by the cascade relation.
    await prisma.announcement.deleteMany({
      where: {
        id: {
          not: announcement.id,
        },
      },
    });

    return NextResponse.json(
      { announcement },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unable to publish announcement:", error);

    return NextResponse.json(
      { error: "Unable to publish announcement." },
      { status: 500 }
    );
  }
}
