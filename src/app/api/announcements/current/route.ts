import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    const userId =
      typeof session?.userId === "string" ? session.userId : null;

    if (!userId) {
      return NextResponse.json({ announcement: null });
    }

    // Only the newest published announcement is current.
    // Older announcements never queue behind newer ones.
    const announcement = await prisma.announcement.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        message: true,
        buttonText: true,
        buttonUrl: true,
        createdAt: true,
        dismissals: {
          where: {
            userId,
          },
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    if (!announcement || announcement.dismissals.length > 0) {
      return NextResponse.json({ announcement: null });
    }

    const { dismissals, ...currentAnnouncement } = announcement;

    return NextResponse.json({
      announcement: currentAnnouncement,
    });
  } catch (error) {
    console.error("Unable to load current announcement:", error);

    // Announcement problems must never interfere with the scanner.
    return NextResponse.json(
      { announcement: null },
      { status: 500 }
    );
  }
}
