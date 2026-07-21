-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pair" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "entry" REAL NOT NULL,
    "takeProfit" REAL NOT NULL,
    "stopLoss" REAL NOT NULL,
    "session" TEXT NOT NULL,
    "signalTime" DATETIME NOT NULL,
    "lockedUntil" DATETIME NOT NULL,
    "ageMinutes" INTEGER NOT NULL,
    "strength" INTEGER NOT NULL
);
