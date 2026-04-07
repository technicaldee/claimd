-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "displayName" TEXT,
    "selectedCountry" TEXT NOT NULL DEFAULT 'Global',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Figure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "summary" TEXT,
    "wikipediaTitle" TEXT,
    "wikipediaPageId" INTEGER,
    "influenceScore" INTEGER NOT NULL DEFAULT 50,
    "searchBias" INTEGER NOT NULL DEFAULT 0,
    "engagementScore" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "body" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceDomain" TEXT NOT NULL,
    "sourceTitle" TEXT,
    "sourcePreviewImageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "country" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "postedByWallet" TEXT NOT NULL,
    "creatorShareBps" INTEGER NOT NULL DEFAULT 7000,
    "platformShareBps" INTEGER NOT NULL DEFAULT 3000,
    "totalReactions" INTEGER NOT NULL DEFAULT 0,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "dislikesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "earnedCusd" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "creatorId" TEXT,
    CONSTRAINT "Claim_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClaimFigure" (
    "claimId" TEXT NOT NULL,
    "figureId" TEXT NOT NULL,
    "primaryFigure" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("claimId", "figureId"),
    CONSTRAINT "ClaimFigure_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClaimFigure_figureId_fkey" FOREIGN KEY ("figureId") REFERENCES "Figure" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amountCusd" REAL NOT NULL,
    "creatorShareCusd" REAL NOT NULL,
    "platformShareCusd" REAL NOT NULL,
    "txHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimId" TEXT NOT NULL,
    "userId" TEXT,
    CONSTRAINT "Reaction_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Figure_slug_key" ON "Figure"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Figure_wikipediaPageId_key" ON "Figure"("wikipediaPageId");

