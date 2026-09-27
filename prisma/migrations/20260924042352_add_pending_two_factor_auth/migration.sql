-- CreateTable
CREATE TABLE "PendingTwoFactorAuth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PendingTwoFactorAuth_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PendingTwoFactorAuth_customerId_idx" ON "PendingTwoFactorAuth"("customerId");

-- CreateIndex
CREATE INDEX "PendingTwoFactorAuth_expiresAt_idx" ON "PendingTwoFactorAuth"("expiresAt");
