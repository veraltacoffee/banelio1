import { Prisma } from '@prisma/client';
import { prisma, PrismaClientType } from './db';
import {
  INITIAL_PROVIDER_COSTS,
  BANELIO_SOLUTIONS_CONFIG,
  ACTIVE_COMMERCIAL_OFFERS,
  FX_CONFIGS,
  PRICING_PROFILES,
  getProductPriceResult,
  calculateGrossMarginPrice,
  applyCommercialRounding,
  PricingQuantityDurationOptions,
  convertUsdToLocal,
  computeInternalMetrics,
  ProviderCost,
  PriceResult,
  SolutionPrice,
  EntitlementRecord,
  InternalPricingMetrics
} from '../src/services/pricingEngine';
import { Currency } from '../src/types';

/**
 * BANELIO - Server-Side Commercial Pricing Module
 *
 * Implements server-authoritative pricing storage and calculations:
 * - Prisma database seeding of pricing profiles, costs, solutions and offers
 * - Solution entitlements lifecycle management
 * - Safe internal metrics recording
 * - Admin pricing controls
 * - Partner vs Retail separation
 */

/**
 * Seeds commercial pricing tables idempotently.
 * Never resets or deletes existing tables or rows.
 */
export async function seedPricingData(db: PrismaClientType = prisma): Promise<void> {
  // 1. Seed Pricing Profiles (Partner & Retail)
  for (const profile of Object.values(PRICING_PROFILES)) {
    await db.pricingProfile.upsert({
      where: { id: profile.id },
      create: {
        id: profile.id,
        name: profile.name,
        targetMargin: new Prisma.Decimal(profile.targetMargin),
        minMargin: new Prisma.Decimal(profile.minMargin),
        active: true
      },
      update: {
        name: profile.name,
        targetMargin: new Prisma.Decimal(profile.targetMargin),
        minMargin: new Prisma.Decimal(profile.minMargin)
      }
    });
  }

  // 2. Seed FX Configurations
  for (const fx of Object.values(FX_CONFIGS)) {
    await db.fxProtectionConfig.upsert({
      where: { currency: fx.currency },
      create: {
        currency: fx.currency,
        referenceRate: new Prisma.Decimal(fx.referenceRate),
        currentRate: fx.currentRate ? new Prisma.Decimal(fx.currentRate) : null,
        fxBufferPercent: new Prisma.Decimal(fx.fxBufferPercent),
        fxThresholdPercent: new Prisma.Decimal(fx.fxThresholdPercent),
        version: fx.version
      },
      update: {
        referenceRate: new Prisma.Decimal(fx.referenceRate),
        fxBufferPercent: new Prisma.Decimal(fx.fxBufferPercent),
        fxThresholdPercent: new Prisma.Decimal(fx.fxThresholdPercent),
        version: fx.version
      }
    });
  }

  // 3. Seed Provider Costs & Baseline Price Versions
  for (const cost of Object.values(INITIAL_PROVIDER_COSTS)) {
    const existing = await db.providerCostRecord.findUnique({ where: { sku: cost.sku } });
    const costRecord = await db.providerCostRecord.upsert({
      where: { sku: cost.sku },
      create: {
        sku: cost.sku,
        productName: cost.productName,
        category: cost.category as any,
        operation: cost.operation,
        providerCostUSD: new Prisma.Decimal(cost.providerCostUSD),
        providerRenewalCostUSD: cost.providerRenewalCostUSD
          ? new Prisma.Decimal(cost.providerRenewalCostUSD)
          : null,
        providerTransferCostUSD: cost.providerTransferCostUSD
          ? new Prisma.Decimal(cost.providerTransferCostUSD)
          : null,
        costKnown: cost.providerCostKnown,
        internalSource: cost.internalSource,
        active: cost.active
      },
      update: {
        productName: cost.productName,
        category: cost.category as any,
        operation: cost.operation,
        providerCostUSD: new Prisma.Decimal(cost.providerCostUSD),
        providerRenewalCostUSD: cost.providerRenewalCostUSD
          ? new Prisma.Decimal(cost.providerRenewalCostUSD)
          : null,
        providerTransferCostUSD: cost.providerTransferCostUSD
          ? new Prisma.Decimal(cost.providerTransferCostUSD)
          : null,
        costKnown: cost.providerCostKnown,
        internalSource: cost.internalSource,
        active: cost.active
      }
    });

    if (!existing) {
      // Calculate initial partner and retail prices
      const partnerUSD = calculateGrossMarginPrice(cost.providerCostUSD, 0.35, 0.20);
      const retailUSD = calculateGrossMarginPrice(cost.providerCostUSD, 0.55, 0.20);

      await db.productPriceVersion.create({
        data: {
          sku: cost.sku,
          version: 'v1.0',
          providerCostId: costRecord.id,
          partnerPriceUSD: new Prisma.Decimal(applyCommercialRounding(partnerUSD, 'USD')),
          retailPriceUSD: new Prisma.Decimal(applyCommercialRounding(retailUSD, 'USD')),
          changeReason: 'Initial baseline pricing engine seed',
          active: true
        }
      });
    }
  }

  // 4. Seed Solutions & Components
  for (const sol of Object.values(BANELIO_SOLUTIONS_CONFIG)) {
    const totalExpectedCost = sol.components.reduce(
      (sum, c) => sum + c.expectedCostUSD * c.quantity,
      0
    );
    const partnerUSD = applyCommercialRounding(
      calculateGrossMarginPrice(totalExpectedCost, 0.35, 0.20),
      'USD'
    );
    const retailUSD = applyCommercialRounding(
      calculateGrossMarginPrice(totalExpectedCost, sol.targetMargin, 0.20),
      'USD'
    );

    const solutionRecord = await db.solutionDefinition.upsert({
      where: { code: sol.code },
      create: {
        id: `SOL-${sol.code}`,
        code: sol.code,
        name: sol.name,
        tagline: sol.tagline,
        description: sol.description,
        expectedCostUSD: new Prisma.Decimal(totalExpectedCost),
        partnerPriceUSD: new Prisma.Decimal(partnerUSD),
        retailPriceUSD: new Prisma.Decimal(retailUSD),
        targetMargin: new Prisma.Decimal(sol.targetMargin),
        active: true,
        version: 'v1.0'
      },
      update: {
        name: sol.name,
        tagline: sol.tagline,
        description: sol.description,
        expectedCostUSD: new Prisma.Decimal(totalExpectedCost),
        partnerPriceUSD: new Prisma.Decimal(partnerUSD),
        retailPriceUSD: new Prisma.Decimal(retailUSD),
        targetMargin: new Prisma.Decimal(sol.targetMargin)
      }
    });

    // Delete existing components for this solution and recreate them idempotently
    await db.solutionComponent.deleteMany({ where: { solutionId: solutionRecord.id } });
    for (const comp of sol.components) {
      await db.solutionComponent.create({
        data: {
          solutionId: solutionRecord.id,
          componentSku: comp.sku,
          name: comp.name,
          category: comp.category as any,
          quantity: comp.quantity,
          expectedCostUSD: new Prisma.Decimal(comp.expectedCostUSD),
          costKnown: comp.costKnown,
          autoProvision: comp.autoProvision
        }
      });
    }
  }

  // 5. Seed Commercial Offers
  for (const offer of ACTIVE_COMMERCIAL_OFFERS) {
    await db.commercialOffer.upsert({
      where: { code: offer.code },
      create: {
        id: offer.id,
        code: offer.code,
        name: offer.name,
        description: offer.description,
        discountPercent: offer.discountPercent ? new Prisma.Decimal(offer.discountPercent) : null,
        validFrom: new Date(offer.validFrom),
        validTo: offer.validTo ? new Date(offer.validTo) : null,
        version: offer.version,
        active: offer.active
      },
      update: {
        name: offer.name,
        description: offer.description,
        discountPercent: offer.discountPercent ? new Prisma.Decimal(offer.discountPercent) : null,
        active: offer.active
      }
    });
  }
}

/**
 * Returns public/client pricing for solutions in requested currency.
 * Internal wholesale costs and provider details are strictly omitted.
 */
export async function getPublicSolutions(currency: Currency = 'USD', db: PrismaClientType = prisma) {
  const solutions = await db.solutionDefinition.findMany({
    where: { active: true },
    include: {
      components: {
        select: {
          componentSku: true,
          name: true,
          category: true,
          quantity: true,
          autoProvision: true
        }
      }
    },
    orderBy: { code: 'asc' }
  });

  return solutions.map((sol) => {
    const partnerUSD = Number(sol.partnerPriceUSD);
    const retailUSD = Number(sol.retailPriceUSD);
    const partnerLocal = convertUsdToLocal(partnerUSD, currency);
    const retailLocal = convertUsdToLocal(retailUSD, currency);

    return {
      id: sol.id,
      code: sol.code,
      sku: `sol-${sol.code.toLowerCase()}`,
      name: sol.name,
      tagline: sol.tagline,
      description: sol.description,
      retailPriceUSD: retailUSD,
      partnerPriceUSD: partnerUSD,
      retailPriceLocal: retailLocal,
      partnerPriceLocal: partnerLocal,
      currency,
      components: sol.components.map((c) => ({
        sku: c.componentSku,
        name: c.name,
        category: c.category,
        quantity: c.quantity
      }))
    };
  });
}

/**
 * Returns Reseller portal pricing for products and solutions.
 * Shows Retail reference price, Partner price, and available commercial savings.
 * Strictly hides internal provider cost, BANELIO internal margin, and provider identity.
 */
export async function getResellerPricing(
  currency: Currency = 'USD',
  db: PrismaClientType = prisma,
  options: PricingQuantityDurationOptions = {}
) {
  const costs = await db.providerCostRecord.findMany({
    where: { active: true },
    orderBy: { sku: 'asc' }
  });

  const costMap: Record<string, ProviderCost> = {};

  for (const c of costs) {
    costMap[c.sku] = {
      sku: c.sku,
      productName: c.productName,
      category: c.category as ProviderCost['category'],
      operation: c.operation as ProviderCost['operation'],
      providerCostUSD: Number(c.providerCostUSD),
      providerRenewalCostUSD: c.providerRenewalCostUSD
        ? Number(c.providerRenewalCostUSD)
        : undefined,
      providerTransferCostUSD: c.providerTransferCostUSD
        ? Number(c.providerTransferCostUSD)
        : undefined,
      providerCostKnown: c.costKnown,
      internalSource: c.internalSource ?? 'DATABASE',
      updatedAt: c.updatedAt.toISOString(),
      active: c.active
    };
  }

  const products = costs.map((c) => {
    const price = getProductPriceResult(
      c.sku,
      currency,
      costMap,
      options
    );

    const savingsLocal = Math.max(
      0,
      price.retailPriceLocal - price.partnerPriceLocal
    );

    const marginPercent = price.retailPriceLocal > 0
      ? Math.round((savingsLocal / price.retailPriceLocal) * 100)
      : 0;

    return {
      sku: c.sku,
      productName: c.productName,
      category: c.category,
      operation: c.operation,
      retailPriceLocal: price.retailPriceLocal,
      partnerPriceLocal: price.partnerPriceLocal,
      savingsLocal,
      marginPercent,
      currency
    };
  });

  const solutions = await getPublicSolutions(currency, db);
  const solutionsReseller = solutions.map((s) => ({
    sku: s.sku,
    productName: s.name,
    category: 'SOLUTION',
    operation: 'YEARLY',
    retailPriceLocal: s.retailPriceLocal,
    partnerPriceLocal: s.partnerPriceLocal,
    savingsLocal: Math.max(0, s.retailPriceLocal - s.partnerPriceLocal),
    marginPercent: s.retailPriceLocal > 0
      ? Math.round(((s.retailPriceLocal - s.partnerPriceLocal) / s.retailPriceLocal) * 100)
      : 0,
    currency
  }));

  return [...products, ...solutionsReseller];
}

function partnerPriceLocalOrMin(val: number): number {
  return val;
}

/**
 * Returns Admin pricing view:
 * Shows Cost, Renewal cost, Protected FX, Partner margin & price,
 * Retail margin & price, Operation, Currency, Version, Validity, Status.
 * Uses Gross Margin formula: precio = costo / (1 - margen).
 */
export async function getAdminPricingOverview(db: PrismaClientType = prisma) {
  const costs = await db.providerCostRecord.findMany({
    orderBy: { sku: 'asc' }
  });

  const fxConfigs = await db.fxProtectionConfig.findMany();
  const fxMap = new Map(fxConfigs.map((f) => [f.currency, f]));

  return costs.map((c) => {
    const costUSD = Number(c.providerCostUSD);
    const renewalUSD = c.providerRenewalCostUSD ? Number(c.providerRenewalCostUSD) : null;
    const transferUSD = c.providerTransferCostUSD ? Number(c.providerTransferCostUSD) : null;
    const partnerMargin = 0.35;
    const retailMargin = 0.55;

    const partnerPriceUSD = applyCommercialRounding(
      calculateGrossMarginPrice(costUSD, partnerMargin, 0.20),
      'USD'
    );
    const retailPriceUSD = applyCommercialRounding(
      calculateGrossMarginPrice(costUSD, retailMargin, 0.20),
      'USD',
      partnerPriceUSD
    );

    const mxnFx = fxMap.get('MXN');
    const mxnReferenceRate = mxnFx ? Number(mxnFx.referenceRate) : 18.25;
    const mxnCurrentRate = mxnFx?.currentRate
      ? Number(mxnFx.currentRate)
      : mxnReferenceRate;
    const mxnBufferPercent = mxnFx
      ? Number(mxnFx.fxBufferPercent)
      : 0.05;
    const protectedFxRate =
      mxnCurrentRate * (1 + Math.max(0, mxnBufferPercent));

    return {
      sku: c.sku,
      productName: c.productName,
      category: c.category,
      operation: c.operation,
      providerCostUSD: costUSD,
      providerRenewalCostUSD: renewalUSD,
      providerTransferCostUSD: transferUSD,
      costKnown: c.costKnown,
      internalSource: c.internalSource,
      partnerMarginPercent: Math.round(partnerMargin * 100),
      partnerPriceUSD,
      retailMarginPercent: Math.round(retailMargin * 100),
      retailPriceUSD,
      protectedFxRate,
      currency: 'USD',
      version: 'v1.0',
      active: c.active,
      updatedAt: c.updatedAt.toISOString()
    };
  });
}

/**
 * Updates a provider cost and recalculates pricing versions (Admin only).
 */
export async function updateAdminPricing(
  input: {
    sku: string;
    providerCostUSD?: number;
    providerRenewalCostUSD?: number;
    providerTransferCostUSD?: number;
    partnerMargin?: number;
    retailMargin?: number;
    active?: boolean;
  },
  db: PrismaClientType = prisma
) {
  const existing = await db.providerCostRecord.findUnique({ where: { sku: input.sku } });
  if (!existing) {
    throw new Error(`SKU ${input.sku} no encontrado en registros de costos.`);
  }

  const costUSD = input.providerCostUSD !== undefined
    ? input.providerCostUSD
    : Number(existing.providerCostUSD);

  const renewalCostUSD = input.providerRenewalCostUSD !== undefined
    ? input.providerRenewalCostUSD
    : existing.providerRenewalCostUSD ? Number(existing.providerRenewalCostUSD) : null;

  const transferCostUSD = input.providerTransferCostUSD !== undefined
    ? input.providerTransferCostUSD
    : existing.providerTransferCostUSD ? Number(existing.providerTransferCostUSD) : null;

  const partnerMargin = input.partnerMargin !== undefined ? input.partnerMargin : 0.35;
  const retailMargin = input.retailMargin !== undefined ? input.retailMargin : 0.55;

  const partnerUSD = applyCommercialRounding(
    calculateGrossMarginPrice(costUSD, partnerMargin, 0.20),
    'USD'
  );
  const retailUSD = applyCommercialRounding(
    calculateGrossMarginPrice(costUSD, retailMargin, 0.20),
    'USD',
    partnerUSD
  );

  const updatedRecord = await db.providerCostRecord.update({
    where: { sku: input.sku },
    data: {
      providerCostUSD: new Prisma.Decimal(costUSD),
      providerRenewalCostUSD: renewalCostUSD !== null ? new Prisma.Decimal(renewalCostUSD) : null,
      providerTransferCostUSD: transferCostUSD !== null ? new Prisma.Decimal(transferCostUSD) : null,
      costKnown: true,
      active: input.active !== undefined ? input.active : existing.active
    }
  });

  // Create new price version record
  await db.productPriceVersion.create({
    data: {
      sku: input.sku,
      version: `v${Date.now()}`,
      providerCostId: updatedRecord.id,
      partnerPriceUSD: new Prisma.Decimal(partnerUSD),
      retailPriceUSD: new Prisma.Decimal(retailUSD),
      changeReason: 'Admin cost/margin update',
      active: true
    }
  });

  return { success: true, sku: input.sku, partnerPriceUSD: partnerUSD, retailPriceUSD: retailUSD };
}

/**
 * Creates entitlements when a Solution is purchased.
 * The included products are GRANTED immediately, but NOT provisioned until the user activates them.
 */
export async function createEntitlementsForOrder(
  orderId: string,
  customerId: string,
  items: Array<{ sku: string; quantity?: number }>,
  db: PrismaClientType = prisma
): Promise<number> {
  let createdCount = 0;

  for (const item of items) {
    const sku = (item.sku || '').toLowerCase();
    let solutionCode: 'START' | 'BUSINESS' | 'PRO' | null = null;

    if (sku === 'sol-start' || sku.includes('start')) solutionCode = 'START';
    else if (sku === 'sol-business' || sku.includes('business')) solutionCode = 'BUSINESS';
    else if (sku === 'sol-pro' || sku.includes('pro')) solutionCode = 'PRO';

    if (solutionCode) {
      const solutionDef = BANELIO_SOLUTIONS_CONFIG[solutionCode];
      if (solutionDef) {
        for (const comp of solutionDef.components) {
          await db.entitlement.create({
            data: {
              orderId,
              customerId,
              solutionId: `SOL-${solutionCode}`,
              serviceType: comp.category as any,
              sku: comp.sku,
              name: comp.name,
              status: comp.autoProvision ? 'ACTIVATED' : 'GRANTED',
              grantedAt: new Date(),
              activatedAt: comp.autoProvision ? new Date() : null,
              expectedCostUSD: new Prisma.Decimal(comp.expectedCostUSD),
              actualCostUSD: comp.autoProvision ? new Prisma.Decimal(comp.expectedCostUSD) : new Prisma.Decimal(0)
            }
          });
          createdCount++;
        }
      }
    }
  }

  return createdCount;
}

/**
 * Activates an entitlement when the client is ready to configure it.
 * This ensures no provider cost is triggered until the client actually requests activation.
 */
export async function activateEntitlement(
  entitlementId: string,
  customerId: string,
  config?: Record<string, unknown>,
  db: PrismaClientType = prisma
) {
  const entitlement = await db.entitlement.findUnique({
    where: { id: entitlementId }
  });

  if (!entitlement || entitlement.customerId !== customerId) {
    throw new Error('Entitlement no encontrado o no pertenece a este cliente.');
  }

  if (entitlement.status === 'ACTIVATED' || entitlement.status === 'PROVISIONED') {
    return { success: true, entitlement, message: 'El servicio ya se encuentra activado.' };
  }

  const updated = await db.entitlement.update({
    where: { id: entitlementId },
    data: {
      status: 'ACTIVATED',
      activatedAt: new Date(),
      actualCostUSD: entitlement.expectedCostUSD, // Real provider cost triggered only on activation
      config: config ? (config as Prisma.InputJsonValue) : undefined
    }
  });

  return { success: true, entitlement: updated, message: 'Servicio incluido activado con éxito.' };
}

/**
 * Computes internal admin metrics across all solutions and entitlements.
 */
export async function getAdminInternalMetrics(db: PrismaClientType = prisma): Promise<InternalPricingMetrics> {
  const entitlements = await db.entitlement.findMany();
  const solutionOrdersCount = await db.order.count({
    where: { status: 'PAID' }
  });

  const mapped: EntitlementRecord[] = entitlements.map((e) => ({
    id: e.id,
    customerId: e.customerId,
    orderId: e.orderId || undefined,
    solutionId: e.solutionId || undefined,
    serviceType: e.serviceType as any,
    sku: e.sku,
    name: e.name,
    status: e.status as any,
    grantedAt: e.grantedAt.toISOString(),
    activatedAt: e.activatedAt ? e.activatedAt.toISOString() : undefined,
    provisionedAt: e.provisionedAt ? e.provisionedAt.toISOString() : undefined,
    expiresAt: e.expiresAt ? e.expiresAt.toISOString() : undefined,
    expectedCostUSD: Number(e.expectedCostUSD),
    actualCostUSD: e.actualCostUSD ? Number(e.actualCostUSD) : 0
  }));

  return computeInternalMetrics(mapped, solutionOrdersCount);
}
