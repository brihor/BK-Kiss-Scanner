import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import DashboardPage from "./dashboard/page";

export default async function Home() {
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

  return <DashboardPage />;
}