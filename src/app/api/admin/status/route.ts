import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    const userId =
      typeof session?.userId === "string" ? session.userId : null;

    if (!userId) {
      return NextResponse.json({ isAdmin: false });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        isActive: true,
      },
    });

    const isAdmin =
      user?.isActive === true &&
      user.role === "ADMIN";

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error("Admin status check failed:", error);
    return NextResponse.json({ isAdmin: false });
  }
}
