-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('FOREX', 'INDICES', 'GOLD', 'CRYPTO');

-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "direction" TEXT NOT NULL,
    "entry" DOUBLE PRECISION NOT NULL,
    "takeProfit" DOUBLE PRECISION NOT NULL,
    "stopLoss" DOUBLE PRECISION NOT NULL,
    "session" TEXT NOT NULL,
    "signalTime" TIMESTAMP(3) NOT NULL,
    "lockedUntil" TIMESTAMP(3) NOT NULL,
    "strength" INTEGER NOT NULL,

    CONSTRAINT "Signal_pkey" PRIMARY KEY ("id")
);
