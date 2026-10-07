import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function sanitizeAnnouncementHtml(input: string) {
  let html = input;

  // Remove dangerous elements and their contents.
  html = html.replace(
    /<(script|style|iframe|object|embed|svg|math)[^>]*>[\s\S]*?<\/\1\s*>/gi,
    ""
  );

  // Remove standalone dangerous elements.
  html = html.replace(
    /<(script|style|iframe|object|embed|svg|math)[^>]*\/?>/gi,
    ""
  );

  // Keep only the tags our editor needs.
  html = html.replace(
    /<(?!\/?(?:b|strong|i|em|u|div|p|br|ul|ol|li|a)(?:\s|>|\/))[^>]*>/gi,
    ""
  );

  // Remove all event handlers.
  html = html.replace(
    /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
    ""
  );

  // Remove javascript/data/vbscript URLs.
  html = html.replace(
    /\s+(href|src)\s*=\s*(["'])\s*(?:javascript|data|vbscript):[\s\S]*?\2/gi,
    ""
  );

  // Sanitize links separately.
  html = html.replace(
    /<a\b([^>]*)>/gi,
    (_match, attributes: string) => {
      const hrefMatch = attributes.match(
        /\bhref\s*=\s*(["'])(.*?)\1/i
      );

      if (!hrefMatch) {
        return "<span>";
      }

      const href = hrefMatch[2].trim();

      try {
        const url = new URL(href);

        if (url.protocol !== "https:" && url.protocol !== "http:") {
          return "<span>";
        }

        const escapedHref = href
          .replace(/&/g, "&amp;")
          .replace(/"/g, "&quot;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

        return `<a href="${escapedHref}" target="_blank" rel="noopener noreferrer">`;
      } catch {
        return "<span>";
      }
    }
  );

  html = html.replace(/<\/a>/gi, "</a>");

  // Only preserve text-align:center from editor-generated style attributes.
  html = html.replace(
    /\s+style\s*=\s*(["'])(.*?)\1/gi,
    (_match, _quote, styles: string) => {
      return /text-align\s*:\s*center/i.test(styles)
        ? ' style="text-align: center;"'
        : "";
    }
  );

  // Remove every attribute except:
  // - href/target/rel on links
  // - center alignment style on div/p
  html = html.replace(
    /<(b|strong|i|em|u|div|p|br|ul|ol|li)\b([^>]*)>/gi,
    (_match, tag: string, attributes: string) => {
      const lowerTag = tag.toLowerCase();

      if (
        (lowerTag === "div" || lowerTag === "p") &&
        /style\s*=\s*["']text-align:\s*center;?["']/i.test(attributes)
      ) {
        return `<${lowerTag} style="text-align: center;">`;
      }

      return `<${lowerTag}>`;
    }
  );

  return html.trim();
}

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

    const rawMessage =
      typeof body.message === "string" ? body.message.trim() : "";

    const message = sanitizeAnnouncementHtml(rawMessage);

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
