import { Prisma } from '@prisma/client';
import { BillingPeriod, CatalogCategory, PrismaClientType } from './db';
import {
  calculateGrossMarginPrice,
  calculateCommercialDiscount,
  applyCommercialRounding,
  DEFAULT_DISCOUNT_CONFIG,
  getProductPriceResult,
  calculateSolutionPrice,
  INITIAL_PROVIDER_COSTS,
} from '../src/services/pricingEngine';

/**
 * BANELIO - Catálogo server-side (Fase 1B).
 *
 * Fuente única del catálogo en el servidor. Los valores NO fueron inventados:
 * se derivan de las fuentes actuales del frontend (ver reporte):
 *   - TLDs:  src/data/mockData.ts (INITIAL_TLDS) + fórmula de
 *            src/utils/pricing.ts (calculateTldRetailPrice + snapToPsychological99),
 *            de modo que el precio retail coincida con el que hoy emite el frontend.
 *   - Hosting: src/components/public/HostingPlans.tsx
 *   - Email:   src/components/public/EmailAndSsl.tsx / EmailLanding.tsx / AddonConfigModal.tsx
 *   - SSL:     src/components/public/EmailAndSsl.tsx
 *   - Addons:  src/components/public/AddonConfigModal.tsx (Google Workspace, Backup, Whois)
 *
 * `price` es el precio retail en USD por unidad del `billingPeriod`
 * (por año para YEAR, por mes para MONTH, único para ONETIME).
 */

// Réplica exacta del motor de precios del frontend (src/utils/pricing.ts).
// Mantiene el catálogo servidor consistente con lo que hoy factura la UI.
export function snapToPsychological99USD(amount: number): number {
  if (amount <= 0) return 0;
  const floorInt = Math.floor(amount);
  return floorInt + 0.99;
}

export function calculateTldRetailPrice(
  providerCost: number,
  marginPercent: number,
  fixedMarkup: number,
  quantity: number = 1,
  periods: number = 1
): number {
  const wholesale = providerCost || 10.0;
  const markup = typeof marginPercent === 'number' ? marginPercent : 1.24;
  const fixed = fixedMarkup || 0;

  // Convierte el markup histórico en su margen bruto equivalente.
  const basePrice = wholesale * (1 + markup) + fixed;
  const equivalentMargin = basePrice > 0
    ? Math.max(0.20, Math.min(0.90, (basePrice - wholesale) / basePrice))
    : 0.55;

  const centralBasePrice = calculateGrossMarginPrice(
    wholesale,
    equivalentMargin,
    0.20
  ) + fixed;

  const discount = calculateCommercialDiscount(
    quantity,
    periods,
    DEFAULT_DISCOUNT_CONFIG
  );

  const discountedPrice = centralBasePrice * (
    1 - discount.combinedDiscountPercent / 100
  );

  const floorPrice = wholesale / 0.80;

  return applyCommercialRounding(
    Math.max(discountedPrice, floorPrice),
    'USD',
    floorPrice
  );
}

export interface CatalogItemDef {
  sku: string;
  name: string;
  description?: string;
  category: CatalogCategory;
  price: number; // USD, per billing period unit
  currency?: string;
  billingPeriod: BillingPeriod;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

// TLD config extraída de INITIAL_TLDS (mockData.ts) para derivar precios.
const TLD_CONFIGS: Array<{
  tld: string;
  providerCost: number;
  marginPercent: number;
  fixedMarkup: number;
  isPopular?: boolean;
  isPromo?: boolean;
  category: 'Popular' | 'Tech' | 'Global' | 'Geo';
}> = [
  { tld: 'com', providerCost: 9.8, marginPercent: 1.24, fixedMarkup: 0, isPopular: true, category: 'Popular' },
  { tld: 'net', providerCost: 11.2, marginPercent: 1.44, fixedMarkup: 0, isPopular: true, category: 'Popular' },
  { tld: 'org', providerCost: 10.5, marginPercent: 1.34, fixedMarkup: 0, isPopular: true, category: 'Popular' },
  { tld: 'mx', providerCost: 18.5, marginPercent: 1.37, fixedMarkup: 0, isPopular: true, category: 'Geo' },
  { tld: 'com.mx', providerCost: 14.0, marginPercent: 1.34, fixedMarkup: 0, isPopular: false, category: 'Geo' },
  { tld: 'ai', providerCost: 65.0, marginPercent: 1.1, fixedMarkup: 0, isPopular: true, category: 'Tech' },
  { tld: 'io', providerCost: 34.0, marginPercent: 1.25, fixedMarkup: 0, isPopular: true, category: 'Tech' },
  { tld: 'dev', providerCost: 12.0, marginPercent: 1.25, fixedMarkup: 0, isPopular: false, category: 'Tech' },
  { tld: 'app', providerCost: 14.5, marginPercent: 1.25, fixedMarkup: 0, isPopular: false, category: 'Tech' },
  { tld: 'online', providerCost: 1.8, marginPercent: 2.01, fixedMarkup: 0, isPromo: true, category: 'Global' },
  { tld: 'cloud', providerCost: 4.5, marginPercent: 1.42, fixedMarkup: 0, isPromo: true, category: 'Global' },
  { tld: 'shop', providerCost: 2.9, marginPercent: 1.81, fixedMarkup: 0, isPromo: true, category: 'Global' }
];

function buildDomainItems(): CatalogItemDef[] {
  return TLD_CONFIGS.map((c) => {
    const sku = `domain-${c.tld}`;
    const pricing = getProductPriceResult(sku);
    return {
      sku,
      name: `.${c.tld}`,
      description: `Registro de dominio .${c.tld} (por año)`,
      category: 'DOMAIN',
 price: Math.round(pricing.retailPriceUSD * 100) / 100,
 currency: 'USD',
 billingPeriod: 'YEAR',
 active: true,
 metadata: {
 kind: 'domain-registration',
 tld: c.tld,
 providerCostUSD: c.providerCost,
 marginPercent: c.marginPercent,
 fixedMarkup: c.fixedMarkup,
 isPopular: Boolean(c.isPopular),
 isPromo: Boolean(c.isPromo),
 tldCategory: c.category
 }
 };
 });
}

// Hosting. El precio base procede exclusivamente del pricingEngine.
const HOSTING_PLANS = [
  {
    id: 'plan-starter',
    name: 'Cloud Starter NVMe',
    monthlySku: 'hosting-plan-starter-month',
    annualSku: 'hosting-plan-starter-year'
  },
  {
    id: 'plan-pro',
    name: 'Cloud NVMe Pro Ultra',
    monthlySku: 'hosting-plan-pro-month',
    annualSku: 'hosting-plan-pro-year'
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise Cloud NVMe',
    monthlySku: 'hosting-plan-enterprise-month',
    annualSku: 'hosting-plan-enterprise-year'
  }
];

function buildHostingItems(): CatalogItemDef[] {
  const items: CatalogItemDef[] = [];

  for (const p of HOSTING_PLANS) {
    const monthlyPrice = getProductPriceResult(p.monthlySku).retailPriceUSD;
    const annualPrice = getProductPriceResult(p.annualSku).retailPriceUSD;

    items.push({
      sku: p.monthlySku,
      name: `${p.name} (Mensual)`,
      description: `Plan de hosting ${p.name} - tarifa mensual`,
      category: 'HOSTING',
      price: monthlyPrice,
      currency: 'USD',
      billingPeriod: 'MONTH',
      active: true,
      metadata: { kind: 'hosting-plan', planId: p.id, period: 'month' }
    });

    items.push({
      sku: p.annualSku,
      name: `${p.name} (Anual)`,
      description: `Plan de hosting ${p.name} - tarifa anual`,
      category: 'HOSTING',
      price: annualPrice,
      currency: 'USD',
      billingPeriod: 'YEAR',
      active: true,
      metadata: { kind: 'hosting-plan', planId: p.id, period: 'year' }
    });
  }

  return items;
}

// Email (EmailAndSsl.tsx - planes anuales) + EmailLanding.tsx (tarifas mensuales).
const EMAIL_PLANS = [
  {
    id: 'eml-starter',
    name: 'Email Profesional (5 Buzones)',
    priceUSD: getProductPriceResult('email-eml-starter').retailPriceUSD,
    period: 'YEAR'
  },
  {
    id: 'eml-pro',
    name: 'Email Suite Enterprise (10 Buzones)',
    priceUSD: getProductPriceResult('email-eml-pro').retailPriceUSD,
    period: 'YEAR'
  },
  {
    id: 'email-starter',
    name: 'Email Starter Pro (por buzón)',
    priceUSD: getProductPriceResult('email-email-starter').retailPriceUSD,
    period: 'MONTH'
  },
  {
    id: 'email-business',
    name: 'Email Business Suite (por buzón)',
    priceUSD: getProductPriceResult('email-email-business').retailPriceUSD,
    period: 'MONTH'
  },
  {
    id: 'email-email-starter-year',
    name: 'Email Starter Pro (por buzón/año)',
    priceUSD: getProductPriceResult('email-email-starter-year').retailPriceUSD,
    period: 'YEAR'
  },
  {
    id: 'email-email-business-year',
    name: 'Email Business Suite (por buzón/año)',
    priceUSD: getProductPriceResult('email-email-business-year').retailPriceUSD,
    period: 'YEAR'
  }
];

function buildEmailItems(): CatalogItemDef[] {
  return EMAIL_PLANS.map((p) => ({
    sku: p.id.startsWith('email-') ? p.id : `email-${p.id}`,
    name: p.name,
    description: `Servicio de email corporativo (${p.period === 'YEAR' ? 'anual' : 'mensual'})`,
    category: 'EMAIL',
    price: p.priceUSD,
    currency: 'USD',
    billingPeriod: p.period as BillingPeriod,
    active: true,
    metadata: { kind: 'email-plan', planId: p.id }
  }));
}

// SSL. El precio base procede exclusivamente del pricingEngine.
const SSL_PLANS = [
  {
    id: 'ssl-dv',
    name: 'Sectigo Essential SSL (DV)',
    sku: 'ssl-ssl-dv'
  },
  {
    id: 'ssl-wildcard',
    name: 'PositiveSSL Wildcard (*.domain)',
    sku: 'ssl-ssl-wildcard'
  },
  {
    id: 'ssl-ev',
    name: 'Comodo EV SSL (Extended Validation)',
    sku: 'ssl-ssl-ev'
  }
];

function buildSslItems(): CatalogItemDef[] {
  return SSL_PLANS.map((p) => ({
    sku: p.sku,
    name: p.name,
    description: `Certificado SSL ${p.name}`,
    category: 'SSL',
    price: getProductPriceResult(p.sku).retailPriceUSD,
    currency: 'USD',
    billingPeriod: 'YEAR',
    active: true,
    metadata: { kind: 'ssl-plan', planId: p.id }
  }));
}

// Addons. El precio base procede exclusivamente del pricingEngine.
const ADDON_ITEMS: CatalogItemDef[] = [
  {
    sku: 'addon-workspace',
    name: 'Google Workspace Starter',
    description: 'Google Workspace (por usuario)',
    category: 'ADDON',
    price: getProductPriceResult('addon-workspace').retailPriceUSD,
    currency: 'USD',
    billingPeriod: 'MONTH',
    active: true,
    metadata: { kind: 'addon', target: 'email', source: 'AddonConfigModal' }
  },
  {
    sku: 'addon-mail-pro',
    name: 'Banelio Mail Pro',
    description: 'Buzón de correo Banelio (por buzón)',
    category: 'ADDON',
    price: getProductPriceResult('addon-mail-pro').retailPriceUSD,
    currency: 'USD',
    billingPeriod: 'MONTH',
    active: true,
    metadata: { kind: 'addon', target: 'email', source: 'AddonConfigModal' }
  },
  {
    sku: 'addon-backup',
    name: 'Cloud Backup Diario Automatizado',
    description: 'Copia de seguridad diaria',
    category: 'ADDON',
    price: getProductPriceResult('addon-backup').retailPriceUSD,
    currency: 'USD',
    billingPeriod: 'MONTH',
    active: true,
    metadata: { kind: 'addon', target: 'hosting', source: 'AddonConfigModal' }
  },
  {
    sku: 'addon-workspace-year',
    name: 'Google Workspace Starter (Anual)',
    description: 'Google Workspace (por usuario, anual)',
    category: 'ADDON',
    price: getProductPriceResult('addon-workspace-year').retailPriceUSD,
    currency: 'USD',
    billingPeriod: 'YEAR',
    active: true,
    metadata: { kind: 'addon', target: 'email', source: 'AddonConfigModal' }
  },
  {
    sku: 'addon-mail-pro-year',
    name: 'Banelio Mail Pro (Anual)',
    description: 'Buzón de correo Banelio (por buzón, anual)',
    category: 'ADDON',
    price: getProductPriceResult('addon-mail-pro-year').retailPriceUSD,
    currency: 'USD',
    billingPeriod: 'YEAR',
    active: true,
    metadata: { kind: 'addon', target: 'email', source: 'AddonConfigModal' }
  },
  {
    sku: 'addon-backup-year',
    name: 'Cloud Backup Diario Automatizado (Anual)',
    description: 'Copia de seguridad diaria anual',
    category: 'ADDON',
    price: getProductPriceResult('addon-backup-year').retailPriceUSD,
    currency: 'USD',
    billingPeriod: 'YEAR',
    active: true,
    metadata: { kind: 'addon', target: 'hosting', source: 'AddonConfigModal' }
  },
  {
    sku: 'addon-hosting-starter-month',
    name: 'Hosting Cloud NVMe Starter (Complemento Mes)',
    description: 'Complemento de hosting Starter (mensual)',
    category: 'ADDON',
    price: getProductPriceResult('addon-hosting-starter-month').retailPriceUSD,
    currency: 'USD',
    billingPeriod: 'MONTH',
    active: true,
    metadata: { kind: 'addon', target: 'hosting', source: 'AddonConfigModal' }
  },
  {
    sku: 'addon-hosting-starter-year',
    name: 'Hosting Cloud NVMe Starter (Complemento Año)',
    description: 'Complemento de hosting Starter (anual)',
    category: 'ADDON',
    price: getProductPriceResult('addon-hosting-starter-year').retailPriceUSD,
    currency: 'USD',
    billingPeriod: 'YEAR',
    active: true,
    metadata: { kind: 'addon', target: 'hosting', source: 'AddonConfigModal' }
  },
  {
    sku: 'addon-hosting-business-month',
    name: 'Hosting Cloud NVMe Business (Complemento Mes)',
    description: 'Complemento de hosting Business (mensual)',
    category: 'ADDON',
    price: getProductPriceResult('addon-hosting-business-month').retailPriceUSD,
    currency: 'USD',
    billingPeriod: 'MONTH',
    active: true,
    metadata: { kind: 'addon', target: 'hosting', source: 'AddonConfigModal' }
  },
  {
    sku: 'addon-hosting-business-year',
    name: 'Hosting Cloud NVMe Business (Complemento Año)',
    description: 'Complemento de hosting Business (anual)',
    category: 'ADDON',
    price: getProductPriceResult('addon-hosting-business-year').retailPriceUSD,
    currency: 'USD',
    billingPeriod: 'YEAR',
    active: true,
    metadata: { kind: 'addon', target: 'hosting', source: 'AddonConfigModal' }
  },
  {
    sku: 'addon-ssl-wildcard',
    name: 'Certificado SSL Wildcard (Complemento)',
    description: 'Certificado SSL Wildcard por dominio (anual)',
    category: 'ADDON',
    price: getProductPriceResult('addon-ssl-wildcard').retailPriceUSD,
    currency: 'USD',
    billingPeriod: 'YEAR',
    active: true,
    metadata: { kind: 'addon', target: 'ssl', source: 'AddonConfigModal' }
  }
];

// Transferencia / Renovación de dominios (Fase Grande - Pricing de operaciones).
// Los precios de OTRA operación distinta al registro (transferir / renovar).
// SOLO existen cuando se declaran con un precio REAL. Mientras no exista una
// entrada aquí, la tienda responde "Transfer/renewal pricing not configured"
// y NUNCA se inventa un precio (lema: no fabricar datos).
//
// Convención de SKU:
//   - Registro:    tld-<tld>              (ver buildDomainItems)
//   - Transferir:  domain-<tld>-transfer  (incluye 1 año de extensión)
//   - Renovar:     domain-<tld>-renew
const TRANSFER_TLDS = Object.values(INITIAL_PROVIDER_COSTS)
  .filter((c) =>
    c.category === 'DOMAIN' &&
    c.providerCostKnown &&
    typeof c.providerTransferCostUSD === 'number' &&
    c.providerTransferCostUSD > 0
  )
  .map((c) => ({
    tld: c.productName.replace(/^\./, ''),
    providerTransferCostUSD: c.providerTransferCostUSD!
  }));
const RENEWAL_TLDS: Array<{ tld: string; renewalPriceUSD: number }> =
  Object.values(INITIAL_PROVIDER_COSTS)
    .filter((c) =>
      c.category === 'DOMAIN' &&
      c.providerCostKnown &&
      typeof c.providerRenewalCostUSD === 'number' &&
      c.providerRenewalCostUSD > 0
    )
    .map((c) => ({
      tld: c.productName.replace(/^\./, ''),
      renewalPriceUSD: c.providerRenewalCostUSD!
    }));

function buildTransferItems(): CatalogItemDef[] {
  return TRANSFER_TLDS
    .map((c) => {
      const registrationSku = `tld-${c.tld.replace(/\./g, '-')}`;
      const pricing = getProductPriceResult(
        registrationSku,
        'USD',
        INITIAL_PROVIDER_COSTS,
        { operation: 'TRANSFER' }
      );

      if (!pricing.providerCostKnown || pricing.retailPriceUSD <= 0) {
        return null;
      }

      return {
        sku: `domain-${c.tld.replace(/\./g, '-')}-transfer`,
        name: `Transferencia de dominio .${c.tld}`,
        description: `Transferencia de dominio .${c.tld} (incluye 1 año de extensión)`,
        category: 'DOMAIN',
        price: pricing.retailPriceUSD,
        currency: 'USD',
        billingPeriod: 'YEAR',
        active: true,
        metadata: {
          kind: 'domain-transfer',
          tld: c.tld,
          operation: 'transfer'
        }
      };
    })
    .filter((item): item is CatalogItemDef => item !== null);
}

function buildRenewalItems(): CatalogItemDef[] {
  return RENEWAL_TLDS.map((c) => ({
    sku: `domain-${c.tld.replace(/\./g, '-')}-renew`,
    name: `Renovación de dominio .${c.tld}`,
    description: `Renovación anual del dominio .${c.tld}`,
    category: 'DOMAIN',
    price: getProductPriceResult(
      `tld-${c.tld.replace(/\./g, '-')}`,
      'USD',
      INITIAL_PROVIDER_COSTS,
      { operation: 'RENEWAL' }
    ).retailPriceUSD,
    currency: 'USD',
    billingPeriod: 'YEAR',
    active: true,
    metadata: { kind: 'domain-renewal', tld: c.tld, operation: 'renew' }
  }));
}

function buildSolutionItems(): CatalogItemDef[] {
  const solutionCodes: Array<'START' | 'BUSINESS' | 'PRO'> = [
    'START',
    'BUSINESS',
    'PRO'
  ];

  return solutionCodes.map((code) => {
    const solution = calculateSolutionPrice(code, 'USD');

    return {
      sku: `sol-${code.toLowerCase()}`,
      name: solution.name,
      description: solution.description,
      category: 'SOLUTION',
      price: solution.retailPriceUSD,
      currency: 'USD',
      billingPeriod: 'YEAR',
      active: true,
      metadata: {
        kind: 'solution',
        code,
        version: solution.version
      }
    };
  });
}

export const CATALOG_DEFINITION: CatalogItemDef[] = [
  ...buildDomainItems(),
  ...buildTransferItems(),
  ...buildRenewalItems(),
  ...buildHostingItems(),
  ...buildEmailItems(),
  ...buildSslItems(),
  ...ADDON_ITEMS,
  ...buildSolutionItems()
];

/**
 * Devuelve el pricing de transferencias CONFIGURADO de forma real (desde Prisma).
 * Solo SKUs activos con prefijo de transferencia; JSON sin secretos.
 * Vacío mientras no exista un precio real definido en TRANSFER_TLDS.
 */
export async function getTransferPricing(prisma: PrismaClientType) {
  const rows = await prisma.catalogItem.findMany({
    where: { active: true, sku: { startsWith: 'domain-' } },
    orderBy: { sku: 'asc' }
  });

  return rows
    .filter((r) => String(r.sku).endsWith('-transfer') || String(r.sku).endsWith('-renew'))
    .map((r) => {
      const m = r.metadata && typeof r.metadata === 'object' ? (r.metadata as Record<string, unknown>) : {};
      const operation = String(r.sku).endsWith('-transfer') ? 'transfer' : 'renew';
      return {
        tld: typeof m.tld === 'string' ? m.tld : '',
        operation,
        sku: r.sku,
        name: r.name,
        price: Number(r.price),
        currency: r.currency,
        billingPeriod: r.billingPeriod
      };
    });
}

/**
 * Siembra idempotente del catálogo en la tabla CatalogItem (upsert por sku).
 * Solo crea/actualiza; nunca borra nada. No toca mocks ni localStorage.
 */
export async function seedCatalog(prisma: PrismaClientType): Promise<number> {
  let created = 0;
  for (const item of CATALOG_DEFINITION) {
    const existing = await prisma.catalogItem.findUnique({ where: { sku: item.sku } });
    const data = {
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      currency: item.currency || 'USD',
      billingPeriod: item.billingPeriod,
      active: item.active !== false,
      metadata: (item.metadata as Prisma.InputJsonValue) || undefined
    };
    if (!existing) {
      await prisma.catalogItem.create({ data: { ...data, sku: item.sku } });
      created++;
    } else {
      await prisma.catalogItem.update({ where: { sku: item.sku }, data });
    }
  }
  return created;
}

/**
 * Devuelve el catálogo activo listo para exponer por HTTP.
 * Filtra solo items activos y serializa Decimal -> number.
 */
export async function getActiveCatalog(prisma: PrismaClientType) {
  const rows = await prisma.catalogItem.findMany({
    where: { active: true },
    orderBy: { sku: 'asc' }
  });

  return rows.map((r) => {
    const rawMetadata =
      r.metadata && typeof r.metadata === 'object'
        ? (r.metadata as Record<string, unknown>)
        : {};

    // Solo metadata comercial/pública. Nunca exponer costos,
    // márgenes, fuentes internas ni reglas de protección.
    const publicMetadata: Record<string, unknown> = {};

    const allowedMetadataKeys = [
      'kind',
      'tld',
      'isPopular',
      'isPromo',
      'tldCategory',
      'planId',
      'period',
      'target',
      'code',
      'version',
      'operation'
    ];

    for (const key of allowedMetadataKeys) {
      if (rawMetadata[key] !== undefined) {
        publicMetadata[key] = rawMetadata[key];
      }
    }

    return {
      sku: r.sku,
      name: r.name,
      description: r.description,
      category: r.category,
      price: Number(r.price),
      currency: r.currency,
      billingPeriod: r.billingPeriod,
      metadata: publicMetadata
    };
  });
}
