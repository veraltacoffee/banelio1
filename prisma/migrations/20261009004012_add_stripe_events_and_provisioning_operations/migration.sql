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
