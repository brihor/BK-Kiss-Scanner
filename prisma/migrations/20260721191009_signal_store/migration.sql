/*
  Warnings:

  - You are about to drop the column `session` on the `Signal` table. All the data in the column will be lost.
  - You are about to drop the column `strength` on the `Signal` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[pair]` on the table `Signal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `high` to the `Signal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `low` to the `Signal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lowerBand` to the `Signal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rsi` to the `Signal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stochasticK` to the `Signal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Signal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `upperBand` to the `Signal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Signal" DROP COLUMN "session",
DROP COLUMN "strength",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "high" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "low" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "lowerBand" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "rsi" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "stochasticK" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "upperBand" DOUBLE PRECISION NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Signal_pair_key" ON "Signal"("pair");
