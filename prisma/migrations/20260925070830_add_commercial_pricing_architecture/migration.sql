-- CreateTable
CREATE TABLE "PricingProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "targetMargin" DECIMAL NOT NULL DEFAULT 0.55,
    "minMargin" DECIMAL NOT NULL DEFAULT 0.20,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProviderCostRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "operation" TEXT NOT NULL DEFAULT 'REGISTRATION',
    "providerCostUSD" DECIMAL NOT NULL DEFAULT 0,
    "providerRenewalCostUSD" DECIMAL,
    "costKnown" BOOLEAN NOT NULL DEFAULT false,
    "internalSource" TEXT NOT NULL DEFAULT 'config',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ProductPriceVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "providerCostId" TEXT,
    "partnerPriceUSD" DECIMAL NOT NULL,
    "retailPriceUSD" DECIMAL NOT NULL,
    "effectiveFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" DATETIME,
    "changeReason" TEXT NOT NULL DEFAULT 'Initial baseline',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductPriceVersion_providerCostId_fkey" FOREIGN KEY ("providerCostId") REFERENCES "ProviderCostRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SolutionDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "expectedCostUSD" DECIMAL NOT NULL,
    "partnerPriceUSD" DECIMAL NOT NULL,
    "retailPriceUSD" DECIMAL NOT NULL,
    "targetMargin" DECIMAL NOT NULL DEFAULT 0.50,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SolutionComponent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "solutionId" TEXT NOT NULL,
    "componentSku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "expectedCostUSD" DECIMAL NOT NULL DEFAULT 0,
    "costKnown" BOOLEAN NOT NULL DEFAULT false,
    "autoProvision" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SolutionComponent_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "SolutionDefinition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Entitlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT,
    "customerId" TEXT NOT NULL,
    "solutionId" TEXT,
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
    CONSTRAINT "Entitlement_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Entitlement_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "SolutionDefinition" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommercialOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetSku" TEXT,
    "targetCategory" TEXT,
    "promoPriceUSD" DECIMAL,
    "discountPercent" DECIMAL,
    "validFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" DATETIME,
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FxProtectionConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "currency" TEXT NOT NULL,
    "referenceRate" DECIMAL NOT NULL,
    "currentRate" DECIMAL,
    "fxBufferPercent" DECIMAL NOT NULL DEFAULT 0.05,
    "fxThresholdPercent" DECIMAL NOT NULL DEFAULT 0.03,
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PasswordResetToken" ("createdAt", "customerId", "expiresAt", "id", "tokenHash") SELECT "createdAt", "customerId", "expiresAt", "id", "tokenHash" FROM "PasswordResetToken";
DROP TABLE "PasswordResetToken";
ALTER TABLE "new_PasswordResetToken" RENAME TO "PasswordResetToken";
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_customerId_idx" ON "PasswordResetToken"("customerId");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ProviderCostRecord_sku_key" ON "ProviderCostRecord"("sku");

-- CreateIndex
CREATE INDEX "ProductPriceVersion_sku_active_idx" ON "ProductPriceVersion"("sku", "active");

-- CreateIndex
CREATE INDEX "ProductPriceVersion_version_idx" ON "ProductPriceVersion"("version");

-- CreateIndex
CREATE UNIQUE INDEX "SolutionDefinition_code_key" ON "SolutionDefinition"("code");

-- CreateIndex
CREATE INDEX "SolutionComponent_solutionId_idx" ON "SolutionComponent"("solutionId");

-- CreateIndex
CREATE INDEX "Entitlement_customerId_idx" ON "Entitlement"("customerId");

-- CreateIndex
CREATE INDEX "Entitlement_orderId_idx" ON "Entitlement"("orderId");

-- CreateIndex
CREATE INDEX "Entitlement_status_idx" ON "Entitlement"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialOffer_code_key" ON "CommercialOffer"("code");

-- CreateIndex
CREATE INDEX "CommercialOffer_active_idx" ON "CommercialOffer"("active");

-- CreateIndex
CREATE UNIQUE INDEX "FxProtectionConfig_currency_key" ON "FxProtectionConfig"("currency");
