/*
  Warnings:

  - You are about to drop the column `ageMinutes` on the `Signal` table. All the data in the column will be lost.
  - Added the required column `assetType` to the `Signal` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Signal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pair" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "entry" REAL NOT NULL,
    "takeProfit" REAL NOT NULL,
    "stopLoss" REAL NOT NULL,
    "session" TEXT NOT NULL,
    "signalTime" DATETIME NOT NULL,
    "lockedUntil" DATETIME NOT NULL,
    "strength" INTEGER NOT NULL
);
INSERT INTO "new_Signal" ("direction", "entry", "id", "lockedUntil", "pair", "session", "signalTime", "stopLoss", "strength", "takeProfit") SELECT "direction", "entry", "id", "lockedUntil", "pair", "session", "signalTime", "stopLoss", "strength", "takeProfit" FROM "Signal";
DROP TABLE "Signal";
ALTER TABLE "new_Signal" RENAME TO "Signal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
