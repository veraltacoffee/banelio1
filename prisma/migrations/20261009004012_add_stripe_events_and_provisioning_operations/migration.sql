/*
  Warnings:

  - You are about to drop the `CommercialOffer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FxProtectionConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PricingProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductPriceVersion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProviderCostRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SolutionComponent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SolutionDefinition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `solutionId` on the `Entitlement` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "CommercialOffer_active_idx";

-- DropIndex
DROP INDEX "CommercialOffer_code_key";

-- DropIndex
DROP INDEX "FxProtectionConfig_currency_key";

-- DropIndex
DROP INDEX "ProductPriceVersion_version_idx";

-- DropIndex
DROP INDEX "ProductPriceVersion_sku_active_idx";

-- DropIndex
DROP INDEX "ProviderCostRecord_sku_key";

-- DropIndex
DROP INDEX "SolutionComponent_solutionId_idx";

-- DropIndex
DROP INDEX "SolutionDefinition_code_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CommercialOffer";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "FxProtectionConfig";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PricingProfile";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProductPriceVersion";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProviderCostRecord";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SolutionComponent";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SolutionDefinition";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 1
);

-- CreateTable
CREATE TABLE "ProvisioningOperation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operationKey" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "providerOrderId" TEXT,
    "providerStatus" TEXT,
    "errorMessage" TEXT,
    "uncertainReason" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProvisioningOperation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Entitlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT,
    "customerId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GRANTED',
    "grantedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" DATETIME,
    "provisionedAt" DATETIME,
    "expiresAt" DATETIME,
    "expectedCostUSD" DECIMAL NOT NULL DEFAULT 0,
    "actualCostUSD" DECIMAL DEFAULT 0,
    "config" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Entitlement_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Entitlement" ("activatedAt", "actualCostUSD", "config", "createdAt", "customerId", "expectedCostUSD", "expiresAt", "grantedAt", "id", "name", "orderId", "provisionedAt", "serviceType", "sku", "status", "updatedAt") SELECT "activatedAt", "actualCostUSD", "config", "createdAt", "customerId", "expectedCostUSD", "expiresAt", "grantedAt", "id", "name", "orderId", "provisionedAt", "serviceType", "sku", "status", "updatedAt" FROM "Entitlement";
DROP TABLE "Entitlement";
ALTER TABLE "new_Entitlement" RENAME TO "Entitlement";
CREATE INDEX "Entitlement_customerId_idx" ON "Entitlement"("customerId");
CREATE INDEX "Entitlement_orderId_idx" ON "Entitlement"("orderId");
CREATE INDEX "Entitlement_status_idx" ON "Entitlement"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "StripeWebhookEvent_eventId_key" ON "StripeWebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_status_idx" ON "StripeWebhookEvent"("status");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_eventType_idx" ON "StripeWebhookEvent"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "ProvisioningOperation_operationKey_key" ON "ProvisioningOperation"("operationKey");

-- CreateIndex
CREATE INDEX "ProvisioningOperation_orderId_idx" ON "ProvisioningOperation"("orderId");

-- CreateIndex
CREATE INDEX "ProvisioningOperation_status_idx" ON "ProvisioningOperation"("status");
