import { Prisma } from '@prisma/client';
import { prisma, PrismaClientType } from './db';
import {
  BANELIO_SOLUTIONS_CONFIG,
  computeInternalMetrics,
  EntitlementRecord,
  InternalPricingMetrics,
  calculatePartnerCommission,
  PartnerCommissionResult
} from '../src/services/pricingEngine';

export {
  calculatePartnerCommission
};
export type {
  PartnerCommissionResult
};

/**
 * BANELIO - Server-Side Commercial Pricing Module
 *
 * Administra el catálogo de precios comerciales y la asignación de entitlements
 * basándose directamente en CatalogItem y Entitlement sin duplicar ResellerClub.
 */

/**
 * Función no-op para compatibilidad de arranque.
 * La fuente autoritativa del catálogo es seedCatalog() en server/catalog.ts.
 */
export async function seedPricingData(_db?: PrismaClientType): Promise<void> {
  // Los precios comerciales residen directamente en CatalogItem
}

/**
 * Vista de administración de precios basada en los ítems reales del catálogo.
 */
export async function getAdminPricingOverview(db: PrismaClientType = prisma) {
  const items = await db.catalogItem.findMany({
    orderBy: { sku: 'asc' }
  });

  return items.map((item) => {
    const rawMeta = (item.metadata as Record<string, any>) || {};
    const retailPriceUSD = Number(item.price);
    const costUSD = rawMeta.providerCostUSD !== undefined
      ? Number(rawMeta.providerCostUSD)
      : Math.round(retailPriceUSD * 0.45 * 100) / 100;
    const partnerMargin = rawMeta.partnerMarginPercent !== undefined ? Number(rawMeta.partnerMarginPercent) : 35;
    const retailMargin = rawMeta.retailMarginPercent !== undefined ? Number(rawMeta.retailMarginPercent) : 55;
    const partnerPriceUSD = rawMeta.partnerPriceUSD !== undefined
      ? Number(rawMeta.partnerPriceUSD)
      : Math.round(retailPriceUSD * 0.70 * 100) / 100;

    return {
      sku: item.sku,
      productName: item.name,
      category: item.category,
      operation: rawMeta.operation || 'YEARLY',
      providerCostUSD: costUSD,
      providerRenewalCostUSD: rawMeta.providerRenewalCostUSD ?? null,
      providerTransferCostUSD: rawMeta.providerTransferCostUSD ?? null,
      costKnown: rawMeta.providerCostUSD !== undefined,
      internalSource: 'CATALOG_ITEM',
      partnerMarginPercent: partnerMargin,
      partnerPriceUSD,
      retailMarginPercent: retailMargin,
      retailPriceUSD,
      protectedFxRate: 19.5,
      currency: item.currency || 'USD',
      version: 'v1.0',
      active: item.active,
      updatedAt: item.updatedAt.toISOString()
    };
  });
}

/**
 * Actualiza el precio o márgenes de un ítem en el catálogo comercial.
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
  const existing = await db.catalogItem.findUnique({ where: { sku: input.sku } });
  if (!existing) {
    throw new Error(`SKU ${input.sku} no encontrado en el catálogo.`);
  }

  const rawMeta = (existing.metadata as Record<string, any>) || {};
  const costUSD = input.providerCostUSD !== undefined ? input.providerCostUSD : Number(rawMeta.providerCostUSD || 0);
  const partnerMargin = input.partnerMargin !== undefined ? input.partnerMargin : (rawMeta.partnerMarginPercent || 35);
  const retailMargin = input.retailMargin !== undefined ? input.retailMargin : (rawMeta.retailMarginPercent || 55);

  const partnerPriceUSD = costUSD > 0 && partnerMargin < 100
    ? Math.round((costUSD / (1 - partnerMargin / 100)) * 100) / 100
    : Number(existing.price) * 0.7;

  const retailPriceUSD = costUSD > 0 && retailMargin < 100
    ? Math.round((costUSD / (1 - retailMargin / 100)) * 100) / 100
    : Number(existing.price);

  const updatedMeta = {
    ...rawMeta,
    providerCostUSD: costUSD,
    providerRenewalCostUSD: input.providerRenewalCostUSD !== undefined ? input.providerRenewalCostUSD : rawMeta.providerRenewalCostUSD,
    providerTransferCostUSD: input.providerTransferCostUSD !== undefined ? input.providerTransferCostUSD : rawMeta.providerTransferCostUSD,
    partnerMarginPercent: partnerMargin,
    retailMarginPercent: retailMargin,
    partnerPriceUSD
  };

  await db.catalogItem.update({
    where: { sku: input.sku },
    data: {
      price: new Prisma.Decimal(retailPriceUSD),
      active: input.active !== undefined ? input.active : existing.active,
      metadata: updatedMeta as Prisma.InputJsonValue
    }
  });

  return { success: true, sku: input.sku, partnerPriceUSD, retailPriceUSD };
}

/**
 * Crea entitlements comerciales cuando se adquiere una solución o servicio.
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
    } else {
      const lineItem = item as {
        sku: string;
        name?: string;
        category?: string;
        domain?: string;
        isTransfer?: boolean;
      };
      const isDomain = lineItem.category === 'DOMAIN' || sku.startsWith('domain-') || sku === 'domain_transfer';
      if (isDomain) {
        const domainName = lineItem.domain || '';
        await db.entitlement.create({
          data: {
            orderId,
            customerId,
            serviceType: 'DOMAIN',
            sku: item.sku,
            name: lineItem.name || (domainName ? `Dominio: ${domainName}` : `Dominio ${item.sku}`),
            status: 'GRANTED',
            grantedAt: new Date(),
            config: {
              ...(domainName ? { domain: domainName } : {}),
              isTransfer: Boolean(lineItem.isTransfer),
              createdAt: new Date().toISOString()
            }
          }
        });
        createdCount++;
      }
    }
  }

  return createdCount;
}

/**
 * Calcula métricas internas de administración sobre órdenes y entitlements.
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
