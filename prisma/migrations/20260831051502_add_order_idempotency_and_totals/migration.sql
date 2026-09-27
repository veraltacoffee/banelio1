-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idempotencyKey" TEXT,
    "customerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "provisionStatus" TEXT NOT NULL DEFAULT 'NONE',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotal" DECIMAL NOT NULL,
    "discount" DECIMAL NOT NULL DEFAULT 0,
    "taxBase" DECIMAL DEFAULT 0,
    "taxRate" DECIMAL DEFAULT 0,
    "tax" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "failureReason" TEXT,
    "gatewayReference" TEXT,
    "paymentMethod" TEXT,
    "items" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "currency", "customerId", "gatewayReference", "id", "items", "paymentMethod", "paymentStatus", "provisionStatus", "status", "subtotal", "tax", "total", "updatedAt") SELECT "createdAt", "currency", "customerId", "gatewayReference", "id", "items", "paymentMethod", "paymentStatus", "provisionStatus", "status", "subtotal", "tax", "total", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
