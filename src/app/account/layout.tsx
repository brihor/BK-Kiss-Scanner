import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || !session.userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId as string,
    },
  });

  if (
    !user ||
    !user.isActive ||
    user.subscriptionStatus !== "ACTIVE"
  ) {
    redirect("/login");
  }

  return <>{children}</>;
}