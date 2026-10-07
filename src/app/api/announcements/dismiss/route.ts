import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const userId =
      typeof session?.userId === "string" ? session.userId : null;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const announcementId =
      typeof body.announcementId === "string"
        ? body.announcementId
        : "";

    if (!announcementId) {
      return NextResponse.json(
        { error: "Announcement ID is required." },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.findUnique({
      where: {
        id: announcementId,
      },
      select: {
        id: true,
      },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found." },
        { status: 404 }
      );
    }

    await prisma.announcementDismissal.upsert({
      where: {
        announcementId_userId: {
          announcementId,
          userId,
        },
      },
      update: {},
      create: {
        announcementId,
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unable to dismiss announcement:", error);

    return NextResponse.json(
      { error: "Unable to dismiss announcement." },
      { status: 500 }
    );
  }
}
