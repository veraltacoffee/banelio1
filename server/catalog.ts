import { Prisma } from '@prisma/client';
import { BillingPeriod, CatalogCategory, PrismaClientType } from './db';
import {
  getProductPriceResult,
  calculateSolutionPrice,
  INITIAL_PROVIDER_COSTS
} from '../src/services/pricingEngine';

/**
 * BANELIO - Catálogo Comercial Server-Side
 *
 * Fuente autoritativa y centralizada del catálogo comercial de BANELIO.
 *
 * ARQUITECTURA DE PRECIOS Y COSTOS:
 * - El costo del proveedor (providerCostUSD) reside en ProviderCostRecord y pricingEngine.ts.
 * - El precio público (retailPriceUSD) reside en CatalogItem.price.
 * - El precio partner (partnerPriceUSD) y márgenes residen en ProductPriceVersion y PricingProfile.
 * - El cliente público NUNCA recibe costos de proveedor ni márgenes internos.
 * - Si un precio no está configurado, el producto es NO vendible (precio 0).
 */

export type CommercialCategory =
  | 'DOMAIN_REGISTRATION'
  | 'DOMAIN_TRANSFER'
  | 'DOMAIN_RENEWAL'
  | 'WEB_HOSTING'
  | 'CLOUD_HOSTING'
  | 'BUSINESS_EMAIL'
  | 'SSL'
  | 'ADDON'
  | 'SOLUTION';

export type ProductOperationType =
  | 'REGISTRATION'
  | 'TRANSFER'
  | 'RENEWAL'
  | 'MONTHLY'
  | 'YEARLY'
  | 'ONETIME';

export type CommercialProvider =
  | 'resellerclub'
  | 'banelio_internal'
  | 'pending_validation';

export interface CommercialMetadata {
  commercialCategory: CommercialCategory;
  provider: CommercialProvider;
  operation: ProductOperationType;
  billingPeriodUnit: 'year' | 'month';
  status: 'ACTIVE' | 'PENDING_CONFIG' | 'DISCONTINUED';

  // Dominios
  tld?: string;
  allowedDurationsYears?: number[];
  requiresEppCode?: boolean;
  requiresRegistrantData?: boolean;
  allowsTransfer?: boolean;
  allowsRenewal?: boolean;
  isPopular?: boolean;
  isPromo?: boolean;
  tldCategory?: string;

  // Hosting
  platform?: 'linux' | 'cloud';
  requiresAssociatedDomain?: boolean;
  requiresLocation?: boolean;
  planId?: string;

  // Email
  numberOfMailboxes?: number;

  // SSL
  sslType?: 'dv' | 'wildcard' | 'ev';
  requiresCsr?: boolean;

  // Soluciones / Bundles
  code?: 'START' | 'BUSINESS' | 'PRO';
  version?: string;
  isBundle?: boolean;
  components?: Array<{ sku: string; name: string; quantity: number }>;

  // Addons
  target?: string;
  kind?: string;

  [key: string]: unknown;
}

export interface CatalogItemDef {
  sku: string;
  name: string;
  description?: string;
  category: CatalogCategory;
  price: number; // USD retail por unidad de facturación
  currency?: string;
  billingPeriod: BillingPeriod;
  active?: boolean;
  metadata: CommercialMetadata;
}

// TLDs comerciales soportados en el catálogo interno de BANELIO.
// El proveedor real está marcado como 'pending_validation' hasta comprobar sincronización con ResellerClub.
const TLD_CONFIGS: Array<{
  tld: string;
  isPopular?: boolean;
  isPromo?: boolean;
  category: 'Popular' | 'Tech' | 'Global' | 'Geo';
}> = [
  { tld: 'com', isPopular: true, category: 'Popular' },
  { tld: 'net', isPopular: true, category: 'Popular' },
  { tld: 'org', isPopular: true, category: 'Popular' },
  { tld: 'mx', isPopular: true, category: 'Geo' },
  { tld: 'com.mx', isPopular: false, category: 'Geo' },
  { tld: 'ai', isPopular: true, category: 'Tech' },
  { tld: 'io', isPopular: true, category: 'Tech' },
  { tld: 'dev', isPopular: false, category: 'Tech' },
  { tld: 'app', isPopular: false, category: 'Tech' },
  { tld: 'online', isPromo: true, category: 'Global' },
  { tld: 'cloud', isPromo: true, category: 'Global' },
  { tld: 'shop', isPromo: true, category: 'Global' }
];

function buildDomainItems(): CatalogItemDef[] {
  return TLD_CONFIGS.map((c) => {
    const sku = `domain-${c.tld}`;
    const pricing = getProductPriceResult(sku);
    const isCostKnown = pricing.providerCostKnown && pricing.providerCostUSD > 0;
    const isVendible = isCostKnown && pricing.retailPriceUSD > 0;
    return {
      sku,
      name: `.${c.tld}`,
      description: `Registro de dominio .${c.tld} (anual)`,
      category: 'DOMAIN',
      price: pricing.retailPriceUSD,
      currency: 'USD',
      billingPeriod: 'YEAR',
      active: isVendible,
      metadata: {
        commercialCategory: 'DOMAIN_REGISTRATION',
        provider: 'resellerclub',
        operation: 'REGISTRATION',
        billingPeriodUnit: 'year',
        status: isVendible ? 'ACTIVE' : 'PENDING_CONFIG',
        tld: c.tld,
        allowedDurationsYears: [1, 2, 3, 5, 10],
        requiresEppCode: false,
        requiresRegistrantData: true,
        allowsTransfer: true,
        allowsRenewal: true,
        isPopular: Boolean(c.isPopular),
        isPromo: Boolean(c.isPromo),
        tldCategory: c.category,
        kind: 'domain-registration'
      }
    };
  });
}

// Transferencia / Renovación de dominios con precios reales configurados
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
    .map((c): CatalogItemDef | null => {
      const sku = `domain-${c.tld.replace(/\./g, '-')}-transfer`;
      const pricing = getProductPriceResult(sku);

      if (!pricing.providerCostKnown || pricing.retailPriceUSD <= 0) {
        return null;
      }

      return {
        sku,
        name: `Transferencia de dominio .${c.tld}`,
        description: `Transferencia de dominio .${c.tld} (incluye 1 año de extensión)`,
        category: 'DOMAIN',
        price: pricing.retailPriceUSD,
        currency: 'USD',
        billingPeriod: 'YEAR',
        active: true,
        metadata: {
          commercialCategory: 'DOMAIN_TRANSFER',
          provider: 'resellerclub',
          operation: 'TRANSFER',
          billingPeriodUnit: 'year',
          status: 'ACTIVE',
          tld: c.tld,
          allowedDurationsYears: [1],
          requiresEppCode: true,
          requiresRegistrantData: true,
          allowsTransfer: true,
          allowsRenewal: true,
          kind: 'domain-transfer'
        }
      };
    })
    .filter((item): item is CatalogItemDef => item !== null);
}

function buildRenewalItems(): CatalogItemDef[] {
  return RENEWAL_TLDS.map((c): CatalogItemDef => {
    const sku = `domain-${c.tld.replace(/\./g, '-')}-renew`;
    const pricing = getProductPriceResult(sku);
    const isCostKnown = pricing.providerCostKnown && pricing.providerCostUSD > 0;
    const isVendible = isCostKnown && pricing.retailPriceUSD > 0;

    return {
      sku,
      name: `Renovación de dominio .${c.tld}`,
      description: `Renovación anual del dominio .${c.tld}`,
      category: 'DOMAIN',
      price: pricing.retailPriceUSD,
      currency: 'USD',
      billingPeriod: 'YEAR',
      active: isVendible,
      metadata: {
        commercialCategory: 'DOMAIN_RENEWAL',
        provider: 'resellerclub',
        operation: 'RENEWAL',
        billingPeriodUnit: 'year',
        status: isVendible ? 'ACTIVE' : 'PENDING_CONFIG',
        tld: c.tld,
        allowedDurationsYears: [1, 2, 3],
        requiresEppCode: false,
        requiresRegistrantData: false,
        allowsTransfer: false,
        allowsRenewal: true,
        kind: 'domain-renewal'
      }
    };
  });
}

// Hosting Web (Linux cPanel y Cloud Hosting)
const HOSTING_PLANS = [
  {
    id: 'plan-starter',
    name: 'Cloud Starter NVMe',
    monthlySku: 'hosting-plan-starter-month',
    annualSku: 'hosting-plan-starter-year',
    platform: 'linux' as const
  },
  {
    id: 'plan-pro',
    name: 'Cloud NVMe Pro Ultra',
    monthlySku: 'hosting-plan-pro-month',
    annualSku: 'hosting-plan-pro-year',
    platform: 'linux' as const
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise Cloud NVMe',
    monthlySku: 'hosting-plan-enterprise-month',
    annualSku: 'hosting-plan-enterprise-year',
    platform: 'cloud' as const
  }
];

function buildHostingItems(): CatalogItemDef[] {
  const items: CatalogItemDef[] = [];

  for (const p of HOSTING_PLANS) {
    const monthlyPrice = getProductPriceResult(p.monthlySku).retailPriceUSD;
    const annualPrice = getProductPriceResult(p.annualSku).retailPriceUSD;
    const commercialCategory: CommercialCategory = p.platform === 'cloud' ? 'CLOUD_HOSTING' : 'WEB_HOSTING';

    items.push({
      sku: p.monthlySku,
      name: `${p.name} (Mensual)`,
      description: `Plan de hosting ${p.name} - tarifa mensual`,
      category: 'HOSTING',
      price: monthlyPrice,
      currency: 'USD',
      billingPeriod: 'MONTH',
      active: monthlyPrice > 0,
      metadata: {
        commercialCategory,
        provider: 'banelio_internal',
        operation: 'MONTHLY',
        billingPeriodUnit: 'month',
        status: monthlyPrice > 0 ? 'ACTIVE' : 'PENDING_CONFIG',
        planId: p.id,
        platform: p.platform,
        requiresAssociatedDomain: true,
        requiresLocation: true,
        kind: 'hosting-plan'
      }
    });

    items.push({
      sku: p.annualSku,
      name: `${p.name} (Anual)`,
      description: `Plan de hosting ${p.name} - tarifa anual`,
      category: 'HOSTING',
      price: annualPrice,
      currency: 'USD',
      billingPeriod: 'YEAR',
      active: annualPrice > 0,
      metadata: {
        commercialCategory,
        provider: 'banelio_internal',
        operation: 'YEARLY',
        billingPeriodUnit: 'year',
        status: annualPrice > 0 ? 'ACTIVE' : 'PENDING_CONFIG',
        planId: p.id,
        platform: p.platform,
        requiresAssociatedDomain: true,
        requiresLocation: true,
        kind: 'hosting-plan'
      }
    });
  }

  return items;
}

// Correo Profesional (Business / Enterprise Email)
const EMAIL_PLANS = [
  {
    id: 'eml-starter',
    name: 'Email Profesional (5 Buzones)',
    sku: 'email-eml-starter',
    period: 'YEAR' as const,
    mailboxes: 5
  },
  {
    id: 'eml-pro',
    name: 'Email Suite Enterprise (10 Buzones)',
    sku: 'email-eml-pro',
    period: 'YEAR' as const,
    mailboxes: 10
  },
  {
    id: 'email-starter',
    name: 'Email Starter Pro (por buzón/mes)',
    sku: 'email-email-starter',
    period: 'MONTH' as const,
    mailboxes: 1
  },
  {
    id: 'email-business',
    name: 'Email Business Suite (por buzón/mes)',
    sku: 'email-email-business',
    period: 'MONTH' as const,
    mailboxes: 1
  },
  {
    id: 'email-email-starter-year',
    name: 'Email Starter Pro (por buzón/año)',
    sku: 'email-email-starter-year',
    period: 'YEAR' as const,
    mailboxes: 1
  },
  {
    id: 'email-email-business-year',
    name: 'Email Business Suite (por buzón/año)',
    sku: 'email-email-business-year',
    period: 'YEAR' as const,
    mailboxes: 1
  }
];

function buildEmailItems(): CatalogItemDef[] {
  return EMAIL_PLANS.map((p) => {
    const price = getProductPriceResult(p.sku).retailPriceUSD;
    return {
      sku: p.sku,
      name: p.name,
      description: `Servicio de correo profesional corporativo (${p.period === 'YEAR' ? 'anual' : 'mensual'})`,
      category: 'EMAIL',
      price,
      currency: 'USD',
      billingPeriod: p.period as BillingPeriod,
      active: price > 0,
      metadata: {
        commercialCategory: 'BUSINESS_EMAIL',
        provider: 'banelio_internal',
        operation: p.period === 'YEAR' ? 'YEARLY' : 'MONTHLY',
        billingPeriodUnit: p.period === 'YEAR' ? 'year' : 'month',
        status: price > 0 ? 'ACTIVE' : 'PENDING_CONFIG',
        planId: p.id,
        numberOfMailboxes: p.mailboxes,
        requiresAssociatedDomain: true,
        kind: 'email-plan'
      }
    };
  });
}

// Certificados Digitales SSL
const SSL_PLANS = [
  {
    id: 'ssl-dv',
    name: 'Sectigo Essential SSL (DV)',
    sku: 'ssl-ssl-dv',
    sslType: 'dv' as const
  },
  {
    id: 'ssl-wildcard',
    name: 'PositiveSSL Wildcard (*.domain)',
    sku: 'ssl-ssl-wildcard',
    sslType: 'wildcard' as const
  },
  {
    id: 'ssl-ev',
    name: 'Comodo EV SSL (Extended Validation)',
    sku: 'ssl-ssl-ev',
    sslType: 'ev' as const
  }
];

function buildSslItems(): CatalogItemDef[] {
  return SSL_PLANS.map((p) => {
    const price = getProductPriceResult(p.sku).retailPriceUSD;
    return {
      sku: p.sku,
      name: p.name,
      description: `Certificado SSL ${p.name}`,
      category: 'SSL',
      price,
      currency: 'USD',
      billingPeriod: 'YEAR',
      active: price > 0,
      metadata: {
        commercialCategory: 'SSL',
        provider: 'pending_validation',
        operation: 'YEARLY',
        billingPeriodUnit: 'year',
        status: price > 0 ? 'ACTIVE' : 'PENDING_CONFIG',
        planId: p.id,
        sslType: p.sslType,
        requiresAssociatedDomain: true,
        requiresCsr: true,
        kind: 'ssl-plan'
      }
    };
  });
}

// Addons y Complementos
const ADDON_ITEMS: CatalogItemDef[] = [
  {
    sku: 'addon-workspace',
    name: 'Google Workspace Starter',
    description: 'Google Workspace (por usuario, mensual)',
    category: 'ADDON',
    price: getProductPriceResult('addon-workspace').retailPriceUSD,
    currency: 'USD',
    billingPeriod: 'MONTH',
    active: true,
    metadata: {
      commercialCategory: 'ADDON',
      provider: 'banelio_internal',
      operation: 'MONTHLY',
      billingPeriodUnit: 'month',
      status: 'ACTIVE',
      target: 'email',
      kind: 'addon'
    }
  },
  {
    sku: 'addon-mail-pro',
    name: 'Banelio Mail Pro',
    description: 'Buzón de correo Banelio (por buzón, mensual)',
    category: 'ADDON',
    price: getProductPriceResult('addon-mail-pro').retailPriceUSD,
    currency: 'USD',
    billingPeriod: 'MONTH',
    active: true,
    metadata: {
      commercialCategory: 'ADDON',
      provider: 'pending_validation',
      operation: 'MONTHLY',
      billingPeriodUnit: 'month',
      status: 'ACTIVE',
      target: 'email',
      kind: 'addon'
    }
  },
  {
    sku: 'addon-backup',
    name: 'Cloud Backup Diario Automatizado',
    description: 'Copia de seguridad diaria (mensual)',
    category: 'ADDON',
    price: getProductPriceResult('addon-backup').retailPriceUSD,
    currency: 'USD',
    billingPeriod: 'MONTH',
    active: true,
    metadata: {
      commercialCategory: 'ADDON',
      provider: 'banelio_internal',
      operation: 'MONTHLY',
      billingPeriodUnit: 'month',
      status: 'ACTIVE',
      target: 'hosting',
      kind: 'addon'
    }
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
    metadata: {
      commercialCategory: 'ADDON',
      provider: 'banelio_internal',
      operation: 'YEARLY',
      billingPeriodUnit: 'year',
      status: 'ACTIVE',
      target: 'email',
      kind: 'addon'
    }
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
    metadata: {
      commercialCategory: 'ADDON',
      provider: 'pending_validation',
      operation: 'YEARLY',
      billingPeriodUnit: 'year',
      status: 'ACTIVE',
      target: 'email',
      kind: 'addon'
    }
  },
  {
    sku: 'addon-backup-year',
    name: 'Cloud Backup Diario Automatizado (Anual)',
    description: 'Copia de seguridad diaria (anual)',
    category: 'ADDON',
    price: getProductPriceResult('addon-backup-year').retailPriceUSD,
    currency: 'USD',
    billingPeriod: 'YEAR',
    active: true,
    metadata: {
      commercialCategory: 'ADDON',
      provider: 'banelio_internal',
      operation: 'YEARLY',
      billingPeriodUnit: 'year',
      status: 'ACTIVE',
      target: 'hosting',
      kind: 'addon'
    }
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
    metadata: {
      commercialCategory: 'ADDON',
      provider: 'pending_validation',
      operation: 'MONTHLY',
      billingPeriodUnit: 'month',
      status: 'ACTIVE',
      target: 'hosting',
      kind: 'addon'
    }
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
    metadata: {
      commercialCategory: 'ADDON',
      provider: 'pending_validation',
      operation: 'YEARLY',
      billingPeriodUnit: 'year',
      status: 'ACTIVE',
      target: 'hosting',
      kind: 'addon'
    }
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
    metadata: {
      commercialCategory: 'ADDON',
      provider: 'pending_validation',
      operation: 'MONTHLY',
      billingPeriodUnit: 'month',
      status: 'ACTIVE',
      target: 'hosting',
      kind: 'addon'
    }
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
    metadata: {
      commercialCategory: 'ADDON',
      provider: 'pending_validation',
      operation: 'YEARLY',
      billingPeriodUnit: 'year',
      status: 'ACTIVE',
      target: 'hosting',
      kind: 'addon'
    }
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
    metadata: {
      commercialCategory: 'ADDON',
      provider: 'pending_validation',
      operation: 'YEARLY',
      billingPeriodUnit: 'year',
      status: 'ACTIVE',
      target: 'ssl',
      kind: 'addon'
    }
  }
];

// Soluciones BANELIO: BUNDLES comerciales compuestos por productos individuales de la plataforma
function buildSolutionItems(): CatalogItemDef[] {
  const solutionCodes: Array<'START' | 'BUSINESS' | 'PRO'> = ['START', 'BUSINESS', 'PRO'];

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
        commercialCategory: 'SOLUTION',
        provider: 'banelio_internal',
        operation: 'YEARLY',
        billingPeriodUnit: 'year',
        status: 'ACTIVE',
        code,
        version: solution.version,
        isBundle: true,
        components: solution.components.map((c) => ({
          sku: c.sku,
          name: c.name,
          quantity: c.quantity
        })),
        kind: 'solution'
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
 */
export async function getTransferPricing(prisma: PrismaClientType) {
  const rows = await prisma.catalogItem.findMany({
    where: { active: true, sku: { startsWith: 'domain-' } },
    orderBy: { sku: 'asc' }
  });

  const items = rows
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

  return {
    configured: items.length > 0,
    items
  };
}

/**
 * Devuelve el catálogo completo de precios de dominios por TLD (desde Prisma y motor de pricing).
 * Mantiene estrictamente separados:
 * - precio de coste ResellerClub (providerCostUSD / providerTransferCostUSD)
 * - precio comercial Banelio (registrationPriceUSD / transferPriceUSD / renewalPriceUSD)
 * - operación registro vs transferencia vs renovación
 */
export async function getDomainCatalogPricing(prisma: PrismaClientType) {
  const rows = await prisma.catalogItem.findMany({
    where: { active: true, category: 'DOMAIN' },
    orderBy: { sku: 'asc' }
  });

  const byTld = new Map<string, {
    tld: string;
    sku: string;
    registrationPriceUSD: number;
    transferPriceUSD: number | null;
    renewalPriceUSD: number | null;
    providerCostUSD: number;
    providerTransferCostUSD: number | null;
    providerRenewalCostUSD: number | null;
    currency: string;
    isPopular: boolean;
    isPromo: boolean;
    category?: string;
  }>();

  for (const r of rows) {
    const m = r.metadata && typeof r.metadata === 'object' ? (r.metadata as Record<string, unknown>) : {};
    const tld = typeof m.tld === 'string' && m.tld ? m.tld : (r.name.startsWith('.') ? r.name.slice(1) : '');
    if (!tld) continue;

    if (!byTld.has(tld)) {
      const costMap = INITIAL_PROVIDER_COSTS;
      const cleanTldKey = tld.replace(/\./g, '-');
      const providerEntry = costMap[`tld-${cleanTldKey}`];

      byTld.set(tld, {
        tld,
        sku: `domain-${cleanTldKey}`,
        registrationPriceUSD: 0,
        transferPriceUSD: null,
        renewalPriceUSD: null,
        providerCostUSD: providerEntry ? providerEntry.providerCostUSD : 0,
        providerTransferCostUSD: providerEntry?.providerTransferCostUSD ?? null,
        providerRenewalCostUSD: providerEntry?.providerRenewalCostUSD ?? null,
        currency: r.currency || 'USD',
        isPopular: Boolean(m.isPopular),
        isPromo: Boolean(m.isPromo),
        category: typeof m.tldCategory === 'string' ? m.tldCategory : undefined
      });
    }

    const entry = byTld.get(tld)!;
    const priceNum = Number(r.price);

    if (String(r.sku).endsWith('-transfer') || m.operation === 'TRANSFER') {
      entry.transferPriceUSD = priceNum;
    } else if (String(r.sku).endsWith('-renew') || m.operation === 'RENEWAL') {
      entry.renewalPriceUSD = priceNum;
    } else if (m.operation === 'REGISTRATION' || r.sku === `domain-${tld.replace(/\./g, '-')}`) {
      entry.registrationPriceUSD = priceNum;
      if (m.isPopular !== undefined) entry.isPopular = Boolean(m.isPopular);
      if (m.isPromo !== undefined) entry.isPromo = Boolean(m.isPromo);
    }
  }

  const items = Array.from(byTld.values()).filter(
    (item) => item.registrationPriceUSD > 0 || item.transferPriceUSD !== null
  );

  return {
    success: true,
    count: items.length,
    items
  };
}

/**
 * Siembra idempotente del catálogo en la tabla CatalogItem (upsert por sku).
 * Solo crea/actualiza; nunca borra nada.
 */
export async function seedCatalog(prisma: PrismaClientType): Promise<number> {
  let created = 0;
  for (const item of CATALOG_DEFINITION) {
    const existing = await prisma.catalogItem.findUnique({ where: { sku: item.sku } });
    const isVendible = item.active !== false && item.price > 0 && item.metadata.status === 'ACTIVE';
    const data = {
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      currency: item.currency || 'USD',
      billingPeriod: item.billingPeriod,
      active: isVendible,
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
 * Devuelve el catálogo activo listo para exponer por HTTP a clientes públicos.
 * Filtra solo items activos y sanitiza la metadata para JAMÁS exponer costos,
 * márgenes internos ni reglas privadas del negocio.
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

    const publicMetadata: Record<string, unknown> = {};

    // Whitelist estricta de atributos públicos.
    // Costos mayoristas (providerCostUSD), márgenes y fórmulas quedan 100% omitidos.
    const allowedMetadataKeys = [
      'commercialCategory',
      'operation',
      'provider',
      'billingPeriodUnit',
      'status',
      'kind',
      'tld',
      'allowedDurationsYears',
      'requiresEppCode',
      'requiresRegistrantData',
      'allowsTransfer',
      'allowsRenewal',
      'isPopular',
      'isPromo',
      'tldCategory',
      'planId',
      'platform',
      'requiresAssociatedDomain',
      'requiresLocation',
      'numberOfMailboxes',
      'sslType',
      'requiresCsr',
      'target',
      'code',
      'version',
      'isBundle',
      'components'
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
