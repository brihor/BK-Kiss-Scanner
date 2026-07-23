const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "test@bktradingacademy.com";
  const password = "Test1234!";

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      isActive: true,
      subscriptionStatus: "ACTIVE",
    },
    create: {
      email,
      passwordHash,
      firstName: "Test",
      lastName: "User",
      role: "USER",
      isActive: true,
      subscriptionStatus: "ACTIVE",
    },
  });

  console.log("Test user created:", user.email);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });