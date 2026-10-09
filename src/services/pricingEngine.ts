import { Currency } from '../types';

/**
 * BANELIO Commercial Pricing Engine (Core Source of Truth)
 *
 * Implements centralized commercial pricing architecture:
 * - Gross margin pricing: precio = costo / (1 - margen)
 * - Strict floor margin protection (never sell below cost / (1 - minMargin))
 * - Partner (35% target) vs Retail (55% target) profiles
 * - Multi-currency support with psychological commercial rounding
 * - FX Protection (reference rate, buffer, threshold)
 * - Banelio Solutions (START, BUSINESS, PRO) with component tracking
 * - Entitlement lifecycle (GRANTED -> ACTIVATED -> PROVISIONED -> SUSPENDED -> EXPIRED)
 * - Internal metrics (utilization, activation rate, expected vs actual provider cost)
 * - Versioning & commercial offers
 * - NO exposure of internal provider names, wholesale costs, or margins to public clients
 */

export type PricingOperation =
  | 'REGISTRATION'
  | 'RENEWAL'
  | 'TRANSFER'
  | 'RESTORE'
  | 'PREMIUM'
  | 'MONTHLY'
  | 'YEARLY';

export type CatalogCategory =
  | 'DOMAIN'
  | 'HOSTING'
  | 'EMAIL'
  | 'SSL'
  | 'BACKUP'
  | 'SOLUTION'
  | 'ADDON';

export type PricingProfileId = 'PARTNER' | 'RETAIL';

export interface PricingProfile {
  id: PricingProfileId;
  name: string;
  targetMargin: number; // e.g. 0.35 Partner, 0.55 Retail
  minMargin: number;    // e.g. 0.20
  isConfigurable: boolean;
}

export const PRICING_PROFILES: Record<PricingProfileId, PricingProfile> = {
  PARTNER: {
    id: 'PARTNER',
    name: 'Partner / Reseller',
    targetMargin: 0.35,
    minMargin: 0.20,
    isConfigurable: true
  },
  RETAIL: {
    id: 'RETAIL',
    name: 'Retail / Direct',
    targetMargin: 0.55,
    minMargin: 0.20,
    isConfigurable: true
  }
};

export interface ProviderCost {
  sku: string;
  productName: string;
  category: CatalogCategory;
  operation: PricingOperation;
  providerCostUSD: number;
  providerRenewalCostUSD?: number;
  providerTransferCostUSD?: number;
  providerCostKnown: boolean;
  internalSource: string;
  updatedAt: string;
  active: boolean;
}

export interface FxProtectionConfig {
  currency: Currency;
  referenceRate: number;
  currentRate?: number;
  fxBufferPercent: number;    // e.g. 0.05 (5% safety buffer)
  fxThresholdPercent: number; // e.g. 0.03 (3% change triggers price review)
  updatedAt: string;
  version: string;
}

export const FX_CONFIGS: Record<Currency, FxProtectionConfig> = {
  USD: {
    currency: 'USD',
    referenceRate: 1.0,
    currentRate: 1.0,
    fxBufferPercent: 0,
    fxThresholdPercent: 0.02,
    updatedAt: '2026-09-25T00:00:00Z',
    version: 'fx-2026.1'
  },
  MXN: {
    currency: 'MXN',
    referenceRate: 18.25,
    currentRate: 18.25,
    fxBufferPercent: 0.05,
    fxThresholdPercent: 0.03,
    updatedAt: '2026-09-25T00:00:00Z',
    version: 'fx-2026.1'
  },
  EUR: {
    currency: 'EUR',
    referenceRate: 0.92,
    currentRate: 0.92,
    fxBufferPercent: 0.03,
    fxThresholdPercent: 0.03,
    updatedAt: '2026-09-25T00:00:00Z',
    version: 'fx-2026.1'
  },
  GBP: {
    currency: 'GBP',
    referenceRate: 0.79,
    currentRate: 0.79,
    fxBufferPercent: 0.03,
    fxThresholdPercent: 0.03,
    updatedAt: '2026-09-25T00:00:00Z',
    version: 'fx-2026.1'
  },
  CAD: {
    currency: 'CAD',
    referenceRate: 1.38,
    currentRate: 1.38,
    fxBufferPercent: 0.04,
    fxThresholdPercent: 0.03,
    updatedAt: '2026-09-25T00:00:00Z',
    version: 'fx-2026.1'
  },
  COP: {
    currency: 'COP',
    referenceRate: 4120.0,
    currentRate: 4120.0,
    fxBufferPercent: 0.06,
    fxThresholdPercent: 0.04,
    updatedAt: '2026-09-25T00:00:00Z',
    version: 'fx-2026.1'
  },
  ARS: {
    currency: 'ARS',
    referenceRate: 980.0,
    currentRate: 980.0,
    fxBufferPercent: 0.08,
    fxThresholdPercent: 0.05,
    updatedAt: '2026-09-25T00:00:00Z',
    version: 'fx-2026.1'
  },
  CLP: {
    currency: 'CLP',
    referenceRate: 940.0,
    currentRate: 940.0,
    fxBufferPercent: 0.05,
    fxThresholdPercent: 0.04,
    updatedAt: '2026-09-25T00:00:00Z',
    version: 'fx-2026.1'
  },
  PEN: {
    currency: 'PEN',
    referenceRate: 3.75,
    currentRate: 3.75,
    fxBufferPercent: 0.04,
    fxThresholdPercent: 0.03,
    updatedAt: '2026-09-25T00:00:00Z',
    version: 'fx-2026.1'
  },
  BRL: {
    currency: 'BRL',
    referenceRate: 5.45,
    currentRate: 5.45,
    fxBufferPercent: 0.05,
    fxThresholdPercent: 0.04,
    updatedAt: '2026-09-25T00:00:00Z',
    version: 'fx-2026.1'
  }
};

export interface PriceResult {
  sku: string;
  operation: PricingOperation;
  currency: Currency;
  providerCostUSD: number;
  providerCostKnown: boolean;
  partnerPriceUSD: number;
  retailPriceUSD: number;
  partnerPriceLocal: number;
  retailPriceLocal: number;
  commercialSavingsLocal: number;
  commercialSavingsPercent: number;
  partnerGrossMargin: number;
  retailGrossMargin: number;
  priceVersion: string;
}

export interface SolutionComponentDef {
  sku: string;
  name: string;
  category: CatalogCategory;
  quantity: number;
  expectedCostUSD: number;
  costKnown: boolean;
  autoProvision: boolean; // false = wait for user activation
}

export interface SolutionPrice {
  solutionId: 'START' | 'BUSINESS' | 'PRO';
  code: 'START' | 'BUSINESS' | 'PRO';
  name: string;
  tagline: string;
  description: string;
  components: SolutionComponentDef[];
  expectedCostUSD: number;
  partnerPriceUSD: number;
  retailPriceUSD: number;
  targetMargin: number;
  version: string;
  active: boolean;
}

export interface CommercialOffer {
  id: string;
  code: string;
  name: string;
  description: string;
  targetSku?: string;
  targetCategory?: string;
  promoPriceUSD?: number;
  discountPercent?: number;
  validFrom: string;
  validTo?: string;
  version: string;
  active: boolean;
}

export type EntitlementStatus =
  | 'GRANTED'
  | 'ACTIVATED'
  | 'PROVISIONED'
  | 'SUSPENDED'
  | 'EXPIRED';

export interface EntitlementRecord {
  id: string;
  customerId: string;
  orderId?: string;
  solutionId?: string;
  serviceType: CatalogCategory;
  sku: string;
  name: string;
  status: EntitlementStatus;
  grantedAt: string;
  activatedAt?: string;
  provisionedAt?: string;
  expiresAt?: string;
  expectedCostUSD: number;
  actualCostUSD?: number;
  config?: Record<string, unknown>;
}

export interface InternalPricingMetrics {
  totalSolutionsSold: number;
  totalEntitlementsGranted: number;
  totalEntitlementsActivated: number;
  activationRate: number;
  totalExpectedProviderCostUSD: number;
  totalActualProviderCostUSD: number;
  costSavingsFromUnactivatedUSD: number;
  averageBundleGrossMargin: number;
}

/**
 * CENTRAL COMMERCIAL DISCOUNT CONFIGURATION
 *
 * Discounts are commercial only. Provider costs never change.
 * Quantity and duration discounts may combine, subject to maxCombinedDiscountPercent.
 */
export interface DiscountTier {
  minValue: number;
  discountPercent: number;
}

export interface DiscountConfig {
  quantityTiers: DiscountTier[];
  durationTiers: DiscountTier[];
  maxCombinedDiscountPercent: number;
}

export interface DiscountCalculationResult {
  quantity: number;
  periods: number;
  quantityDiscountPercent: number;
  durationDiscountPercent: number;
  combinedDiscountPercent: number;
}

export const DEFAULT_DISCOUNT_CONFIG: DiscountConfig = {
  quantityTiers: [
    { minValue: 50, discountPercent: 20 },
    { minValue: 25, discountPercent: 15 },
    { minValue: 10, discountPercent: 10 },
    { minValue: 5, discountPercent: 5 },
    { minValue: 3, discountPercent: 2.5 },
  ],
  durationTiers: [
    { minValue: 5, discountPercent: 10 },
    { minValue: 3, discountPercent: 6 },
    { minValue: 2, discountPercent: 3 },
  ],
  maxCombinedDiscountPercent: 25,
};

function getTierDiscount(value: number, tiers: DiscountTier[]): number {
  const normalizedValue = Math.max(1, Math.floor(value || 1));

  for (const tier of tiers) {
    if (normalizedValue >= tier.minValue) {
      return tier.discountPercent;
    }
  }

  return 0;
}

export function calculateCommercialDiscount(
  quantity: number = 1,
  periods: number = 1,
  config: DiscountConfig = DEFAULT_DISCOUNT_CONFIG
): DiscountCalculationResult {
  const normalizedQuantity = Math.max(1, Math.floor(quantity || 1));
  const normalizedPeriods = Math.max(1, Math.floor(periods || 1));

  const quantityDiscountPercent = getTierDiscount(
    normalizedQuantity,
    config.quantityTiers
  );

  const durationDiscountPercent = getTierDiscount(
    normalizedPeriods,
    config.durationTiers
  );

  const combinedDiscountPercent = Math.min(
    config.maxCombinedDiscountPercent,
    quantityDiscountPercent + durationDiscountPercent
  );

  return {
    quantity: normalizedQuantity,
    periods: normalizedPeriods,
    quantityDiscountPercent,
    durationDiscountPercent,
    combinedDiscountPercent,
  };
}

export interface PricingQuantityDurationOptions {
  quantity?: number;
  periods?: number;
  discountConfig?: DiscountConfig;
}

/**
 * 1. GROSS MARGIN FORMULA:
 * precio = costo / (1 - margen)
 *
 * Never drops below cost / (1 - minMargin).
 */
export function calculateGrossMarginPrice(
  costUSD: number,
  targetMargin: number,
  minMargin: number = 0.20
): number {
  if (costUSD <= 0) return 0;
  const clampedMargin = Math.max(minMargin, Math.min(0.95, targetMargin));
  const rawPrice = costUSD / (1 - clampedMargin);
  const floorPrice = costUSD / (1 - minMargin);
  return Math.max(rawPrice, floorPrice);
}

/**
 * Derives the actual gross margin realized:
 * margen = (precio - costo) / precio
 */
export function calculateRealizedGrossMargin(priceUSD: number, costUSD: number): number {
  if (priceUSD <= 0) return 0;
  return Math.max(0, (priceUSD - costUSD) / priceUSD);
}

/**
 * 2. FX RATE CONVERSION WITH FX PROTECTION
 */
export function getProtectedFxRate(currency: Currency): number {
  const cfg = FX_CONFIGS[currency];
  if (!cfg) return 1.0;

  const currentRate =
    typeof cfg.currentRate === 'number' && Number.isFinite(cfg.currentRate)
      ? cfg.currentRate
      : cfg.referenceRate;

  const bufferMultiplier = 1 + Math.max(0, cfg.fxBufferPercent || 0);

  return currentRate * bufferMultiplier;
}

/**
 * 3. COMMERCIAL ROUNDING BY CURRENCY
 *
 * Rules:
 * - MXN: 59, 79, 99 for small amounts; 199, 399, 999, 1499, 2499 for standard products.
 * - USD, EUR, GBP, CAD: ends in .99 (e.g. 1.99, 14.99, 19.99).
 * - COP: ends in 900 (e.g. 89,900).
 * - ARS: ends in 999 or 9,999 (e.g. 19,999).
 * - CLP: ends in 990 (e.g. 19,990).
 * - PEN, BRL: ends in .90 (e.g. 39.90).
 *
 * Crucial constraint: Rounding NEVER reduces the price below the protected cost + min margin floor!
 */
export function applyCommercialRounding(
  amount: number,
  currency: Currency,
  minFloor: number = 0
): number {
  if (amount <= 0) return 0;
  let candidate = amount;

  switch (currency) {
    case 'MXN': {
      if (amount <= 99) {
        if (Math.abs(amount - 59) <= 10) candidate = 59;
        else if (Math.abs(amount - 79) <= 10) candidate = 79;
        else candidate = 99;
      } else {
        const hundreds = Math.round(amount / 100);
        candidate = Math.max(99, hundreds * 100 - 1);
        if (candidate < amount * 0.95) {
          candidate = (hundreds + 1) * 100 - 1;
        }
      }
      break;
    }
    case 'USD':
    case 'EUR':
    case 'GBP':
    case 'CAD': {
      const floorInt = Math.floor(amount);
      candidate = floorInt + 0.99;
      break;
    }
    case 'PEN':
    case 'BRL': {
      const floorInt = Math.floor(amount);
      candidate = Math.max(9.90, floorInt + 0.90);
      break;
    }
    case 'COP': {
      const thousands = Math.round(amount / 1000);
      candidate = Math.max(9900, thousands * 1000 - 100);
      break;
    }
    case 'ARS': {
      const thousands = Math.round(amount / 1000);
      candidate = Math.max(999, thousands * 1000 - 1);
      break;
    }
    case 'CLP': {
      const thousands = Math.round(amount / 1000);
      candidate = Math.max(990, thousands * 1000 - 10);
      break;
    }
    default:
      candidate = Math.round(amount * 100) / 100;
  }

  // Ensure candidate satisfies minFloor
  if (minFloor > 0 && candidate < minFloor) {
    if (currency === 'MXN') {
      const neededHundreds = Math.ceil((minFloor + 1) / 100);
      candidate = neededHundreds * 100 - 1;
    } else if (['USD', 'EUR', 'GBP', 'CAD'].includes(currency)) {
      candidate = Math.floor(minFloor) + 0.99;
      if (candidate < minFloor) candidate += 1.0;
    } else if (['PEN', 'BRL'].includes(currency)) {
      candidate = Math.floor(minFloor) + 0.90;
      if (candidate < minFloor) candidate += 1.0;
    } else {
      candidate = Math.max(candidate, Math.ceil(minFloor));
    }
  }

  return candidate;
}

/**
 * Converts USD amount to target currency with protected FX and commercial rounding.
 */
export function convertUsdToLocal(
  amountUSD: number,
  currency: Currency,
  minAllowedUSD: number = 0
): number {
  if (currency === 'USD') {
    return applyCommercialRounding(amountUSD, 'USD', minAllowedUSD);
  }
  const rate = getProtectedFxRate(currency);
  const rawConverted = amountUSD * rate;
  const minFloorConverted = minAllowedUSD > 0 ? minAllowedUSD * rate : 0;
  return applyCommercialRounding(rawConverted, currency, minFloorConverted);
}

/**
 * 4. CENTRAL PROVIDER COSTS REGISTRY
 *
 * Reflects known real baseline costs. When a cost is not verified from provider contracts,
 * `providerCostKnown` is explicitly set to false and marked as pending configuration.
 */
export const INITIAL_PROVIDER_COSTS: Record<string, ProviderCost> = {
  // DOMAINS - Registration & Transfer
  'tld-com': {
    sku: 'tld-com',
    productName: '.com',
    category: 'DOMAIN',
    operation: 'REGISTRATION',
    providerCostUSD: 9.80,
    providerRenewalCostUSD: 10.20,
    providerTransferCostUSD: 9.80,
    providerCostKnown: true,
    internalSource: 'wholesale-contract-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'tld-net': {
    sku: 'tld-net',
    productName: '.net',
    category: 'DOMAIN',
    operation: 'REGISTRATION',
    providerCostUSD: 11.20,
    providerRenewalCostUSD: 11.80,
    providerTransferCostUSD: 11.20,
    providerCostKnown: true,
    internalSource: 'wholesale-contract-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'tld-org': {
    sku: 'tld-org',
    productName: '.org',
    category: 'DOMAIN',
    operation: 'REGISTRATION',
    providerCostUSD: 10.50,
    providerRenewalCostUSD: 11.00,
    providerTransferCostUSD: 10.50,
    providerCostKnown: true,
    internalSource: 'wholesale-contract-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'tld-mx': {
    sku: 'tld-mx',
    productName: '.mx',
    category: 'DOMAIN',
    operation: 'REGISTRATION',
    providerCostUSD: 18.50,
    providerRenewalCostUSD: 19.00,
    providerTransferCostUSD: 18.50,
    providerCostKnown: true,
    internalSource: 'nic-mx-partner',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'tld-com-mx': {
    sku: 'tld-com-mx',
    productName: '.com.mx',
    category: 'DOMAIN',
    operation: 'REGISTRATION',
    providerCostUSD: 14.00,
    providerRenewalCostUSD: 14.50,
    providerTransferCostUSD: 14.00,
    providerCostKnown: true,
    internalSource: 'nic-mx-partner',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'tld-ai': {
    sku: 'tld-ai',
    productName: '.ai',
    category: 'DOMAIN',
    operation: 'REGISTRATION',
    providerCostUSD: 65.00,
    providerRenewalCostUSD: 65.00,
    providerTransferCostUSD: 65.00,
    providerCostKnown: true,
    internalSource: 'wholesale-contract-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'tld-io': {
    sku: 'tld-io',
    productName: '.io',
    category: 'DOMAIN',
    operation: 'REGISTRATION',
    providerCostUSD: 34.00,
    providerRenewalCostUSD: 36.00,
    providerTransferCostUSD: 34.00,
    providerCostKnown: true,
    internalSource: 'wholesale-contract-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'tld-dev': {
    sku: 'tld-dev',
    productName: '.dev',
    category: 'DOMAIN',
    operation: 'REGISTRATION',
    providerCostUSD: 12.00,
    providerRenewalCostUSD: 12.00,
    providerCostKnown: true,
    internalSource: 'wholesale-contract-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'tld-app': {
    sku: 'tld-app',
    productName: '.app',
    category: 'DOMAIN',
    operation: 'REGISTRATION',
    providerCostUSD: 14.50,
    providerRenewalCostUSD: 14.50,
    providerCostKnown: true,
    internalSource: 'wholesale-contract-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'tld-online': {
    sku: 'tld-online',
    productName: '.online',
    category: 'DOMAIN',
    operation: 'REGISTRATION',
    providerCostUSD: 1.80,
    providerRenewalCostUSD: 24.00,
    providerCostKnown: true,
    internalSource: 'radix-promo-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'tld-cloud': {
    sku: 'tld-cloud',
    productName: '.cloud',
    category: 'DOMAIN',
    operation: 'REGISTRATION',
    providerCostUSD: 4.50,
    providerRenewalCostUSD: 16.00,
    providerCostKnown: true,
    internalSource: 'wholesale-contract-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'tld-shop': {
    sku: 'tld-shop',
    productName: '.shop',
    category: 'DOMAIN',
    operation: 'REGISTRATION',
    providerCostUSD: 2.90,
    providerRenewalCostUSD: 28.00,
    providerCostKnown: true,
    internalSource: 'wholesale-contract-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },

  // HOSTING
  'hosting-plan-starter-month': {
    sku: 'hosting-plan-starter-month',
    productName: 'Cloud Starter NVMe (Mensual)',
    category: 'HOSTING',
    operation: 'MONTHLY',
    providerCostUSD: 1.80,
    providerCostKnown: true,
    internalSource: 'cpanel-nvme-node-share',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'hosting-plan-starter-year': {
    sku: 'hosting-plan-starter-year',
    productName: 'Cloud Starter NVMe (Anual)',
    category: 'HOSTING',
    operation: 'YEARLY',
    providerCostUSD: 18.00, // $1.50/mo wholesale * 12
    providerCostKnown: true,
    internalSource: 'cpanel-nvme-node-share',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'hosting-plan-pro-month': {
    sku: 'hosting-plan-pro-month',
    productName: 'Cloud NVMe Pro Ultra (Mensual)',
    category: 'HOSTING',
    operation: 'MONTHLY',
    providerCostUSD: 3.00,
    providerCostKnown: true,
    internalSource: 'cpanel-nvme-node-share',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'hosting-plan-pro-year': {
    sku: 'hosting-plan-pro-year',
    productName: 'Cloud NVMe Pro Ultra (Anual)',
    category: 'HOSTING',
    operation: 'YEARLY',
    providerCostUSD: 30.00,
    providerCostKnown: true,
    internalSource: 'cpanel-nvme-node-share',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'hosting-plan-enterprise-month': {
    sku: 'hosting-plan-enterprise-month',
    productName: 'Enterprise Cloud NVMe (Mensual)',
    category: 'HOSTING',
    operation: 'MONTHLY',
    providerCostUSD: 6.00,
    providerCostKnown: true,
    internalSource: 'cpanel-nvme-node-share',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'hosting-plan-enterprise-year': {
    sku: 'hosting-plan-enterprise-year',
    productName: 'Enterprise Cloud NVMe (Anual)',
    category: 'HOSTING',
    operation: 'YEARLY',
    providerCostUSD: 60.00,
    providerCostKnown: true,
    internalSource: 'cpanel-nvme-node-share',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },

  // EMAIL
  'email-email-starter': {
    sku: 'email-email-starter',
    productName: 'Email Starter Pro (por buzón/mes)',
    category: 'EMAIL',
    operation: 'MONTHLY',
    providerCostUSD: 0.60,
    providerCostKnown: true,
    internalSource: 'mail-cluster-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'email-email-business': {
    sku: 'email-email-business',
    productName: 'Email Business Suite (por buzón/mes)',
    category: 'EMAIL',
    operation: 'MONTHLY',
    providerCostUSD: 1.50,
    providerCostKnown: true,
    internalSource: 'mail-cluster-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'email-email-starter-year': {
    sku: 'email-email-starter-year',
    productName: 'Email Starter Pro (por buzón/año)',
    category: 'EMAIL',
    operation: 'YEARLY',
    providerCostUSD: 7.20,
    providerCostKnown: true,
    internalSource: 'mail-cluster-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'email-email-business-year': {
    sku: 'email-email-business-year',
    productName: 'Email Business Suite (por buzón/año)',
    category: 'EMAIL',
    operation: 'YEARLY',
    providerCostUSD: 18.00,
    providerCostKnown: true,
    internalSource: 'mail-cluster-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'email-eml-starter': {
    sku: 'email-eml-starter',
    productName: 'Email Profesional 5 Buzones (Anual)',
    category: 'EMAIL',
    operation: 'YEARLY',
    providerCostUSD: 7.20,
    providerCostKnown: true,
    internalSource: 'mail-cluster-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'email-eml-pro': {
    sku: 'email-eml-pro',
    productName: 'Email Suite Enterprise 10 Buzones (Anual)',
    category: 'EMAIL',
    operation: 'YEARLY',
    providerCostUSD: 15.00,
    providerCostKnown: true,
    internalSource: 'mail-cluster-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },

  // SSL
  'ssl-ssl-dv': {
    sku: 'ssl-ssl-dv',
    productName: 'Sectigo Essential SSL DV',
    category: 'SSL',
    operation: 'YEARLY',
    providerCostUSD: 4.50,
    providerCostKnown: true,
    internalSource: 'cert-distributor-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'ssl-ssl-wildcard': {
    sku: 'ssl-ssl-wildcard',
    productName: 'PositiveSSL Wildcard',
    category: 'SSL',
    operation: 'YEARLY',
    providerCostUSD: 18.00,
    providerCostKnown: true,
    internalSource: 'cert-distributor-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'ssl-ssl-ev': {
    sku: 'ssl-ssl-ev',
    productName: 'Comodo EV SSL',
    category: 'SSL',
    operation: 'YEARLY',
    providerCostUSD: 45.00,
    providerCostKnown: true,
    internalSource: 'cert-distributor-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },

  // ADDONS & BACKUPS
  'addon-workspace': {
    sku: 'addon-workspace',
    productName: 'Google Workspace Starter (Mes)',
    category: 'ADDON',
    operation: 'MONTHLY',
    providerCostUSD: 4.20,
    providerCostKnown: true,
    internalSource: 'google-partner-direct',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'addon-workspace-year': {
    sku: 'addon-workspace-year',
    productName: 'Google Workspace Starter (Año)',
    category: 'ADDON',
    operation: 'YEARLY',
    providerCostUSD: 50.40,
    providerCostKnown: true,
    internalSource: 'google-partner-direct',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'addon-mail-pro': {
    sku: 'addon-mail-pro',
    productName: 'Banelio Mail Pro (Mes)',
    category: 'ADDON',
    operation: 'MONTHLY',
    providerCostUSD: 0.60,
    providerCostKnown: true,
    internalSource: 'mail-cluster-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'addon-mail-pro-year': {
    sku: 'addon-mail-pro-year',
    productName: 'Banelio Mail Pro (Año)',
    category: 'ADDON',
    operation: 'YEARLY',
    providerCostUSD: 7.20,
    providerCostKnown: true,
    internalSource: 'mail-cluster-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'addon-backup': {
    sku: 'addon-backup',
    productName: 'Cloud Backup Diario Automatizado (Mes)',
    category: 'BACKUP',
    operation: 'MONTHLY',
    providerCostUSD: 0.40,
    providerCostKnown: true,
    internalSource: 'storage-s3-tier',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'addon-backup-year': {
    sku: 'addon-backup-year',
    productName: 'Cloud Backup Diario Automatizado (Año)',
    category: 'BACKUP',
    operation: 'YEARLY',
    providerCostUSD: 4.50,
    providerCostKnown: true,
    internalSource: 'storage-s3-tier',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'addon-hosting-starter-month': {
    sku: 'addon-hosting-starter-month',
    productName: 'Hosting Cloud Starter (Complemento Mes)',
    category: 'ADDON',
    operation: 'MONTHLY',
    providerCostUSD: 1.50,
    providerCostKnown: true,
    internalSource: 'cpanel-nvme-node-share',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'addon-hosting-starter-year': {
    sku: 'addon-hosting-starter-year',
    productName: 'Hosting Cloud Starter (Complemento Año)',
    category: 'ADDON',
    operation: 'YEARLY',
    providerCostUSD: 15.00,
    providerCostKnown: true,
    internalSource: 'cpanel-nvme-node-share',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'addon-hosting-business-month': {
    sku: 'addon-hosting-business-month',
    productName: 'Hosting Cloud Business (Complemento Mes)',
    category: 'ADDON',
    operation: 'MONTHLY',
    providerCostUSD: 3.50,
    providerCostKnown: true,
    internalSource: 'cpanel-nvme-node-share',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'addon-hosting-business-year': {
    sku: 'addon-hosting-business-year',
    productName: 'Hosting Cloud Business (Complemento Año)',
    category: 'ADDON',
    operation: 'YEARLY',
    providerCostUSD: 35.00,
    providerCostKnown: true,
    internalSource: 'cpanel-nvme-node-share',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  },
  'addon-ssl-wildcard': {
    sku: 'addon-ssl-wildcard',
    productName: 'SSL Wildcard (Complemento)',
    category: 'ADDON',
    operation: 'YEARLY',
    providerCostUSD: 4.50,
    providerCostKnown: true,
    internalSource: 'cert-distributor-2026',
    updatedAt: '2026-09-25T00:00:00Z',
    active: true
  }
};

/**
 * Calculates complete pricing breakdown for a product given its SKU.
 */
export function getProductPriceResult(
  sku: string,
  currency: Currency = 'USD',
  customCostMap?: Record<string, ProviderCost>,
  options: PricingQuantityDurationOptions & { operation?: PricingOperation } = {}
): PriceResult {
  const costMap = customCostMap || INITIAL_PROVIDER_COSTS;

  let resolvedSku = sku;
  let resolvedOperation = options.operation;

  // Normalización de SKUs de dominios hacia las claves de costos del catálogo
  if (!costMap[resolvedSku]) {
    if (resolvedSku.startsWith('domain-') && resolvedSku.endsWith('-transfer')) {
      const tldClean = resolvedSku.slice(7, -9).replace(/\./g, '-');
      resolvedSku = `tld-${tldClean}`;
      resolvedOperation = resolvedOperation ?? 'TRANSFER';
    } else if (resolvedSku.startsWith('domain-') && resolvedSku.endsWith('-renew')) {
      const tldClean = resolvedSku.slice(7, -6).replace(/\./g, '-');
      resolvedSku = `tld-${tldClean}`;
      resolvedOperation = resolvedOperation ?? 'RENEWAL';
    } else if (resolvedSku.startsWith('domain-')) {
      const tldClean = resolvedSku.slice(7).replace(/\./g, '-');
      resolvedSku = `tld-${tldClean}`;
      resolvedOperation = resolvedOperation ?? 'REGISTRATION';
    }
  }

  const cost = costMap[resolvedSku];

  if (!cost || !cost.active) {
    // PRECIO NO CONFIGURADO: producto no vendible.
    // NUNCA inventar un precio fallback arbitrario.
    return {
      sku,
      operation: resolvedOperation ?? 'REGISTRATION',
      currency,
      providerCostUSD: 0,
      providerCostKnown: false,
      partnerPriceUSD: 0,
      retailPriceUSD: 0,
      partnerPriceLocal: 0,
      retailPriceLocal: 0,
      commercialSavingsLocal: 0,
      commercialSavingsPercent: 0,
      partnerGrossMargin: 0,
      retailGrossMargin: 0,
      priceVersion: 'unconfigured'
    };
  }

  const operation = resolvedOperation ?? cost.operation;

  const costUSD =
    operation === 'RENEWAL'
      ? (cost.providerRenewalCostUSD ?? cost.providerCostUSD)
      : operation === 'TRANSFER'
        ? (cost.providerTransferCostUSD ?? cost.providerRenewalCostUSD ?? cost.providerCostUSD)
        : cost.providerCostUSD;

  if (
    (operation === 'RENEWAL' || operation === 'TRANSFER') &&
    (typeof costUSD !== 'number' || !Number.isFinite(costUSD) || costUSD <= 0)
  ) {
    return {
      sku,
      operation,
      currency,
      providerCostUSD: 0,
      providerCostKnown: false,
      partnerPriceUSD: 0,
      retailPriceUSD: 0,
      partnerPriceLocal: 0,
      retailPriceLocal: 0,
      commercialSavingsLocal: 0,
      commercialSavingsPercent: 0,
      partnerGrossMargin: 0,
      retailGrossMargin: 0,
      priceVersion: 'unconfigured'
    };
  }

  const resolvedCostUSD = typeof costUSD === 'number' && Number.isFinite(costUSD) && costUSD > 0
    ? costUSD
    : 0;

  if (resolvedCostUSD <= 0) {
    return {
      sku,
      operation,
      currency,
      providerCostUSD: 0,
      providerCostKnown: false,
      partnerPriceUSD: 0,
      retailPriceUSD: 0,
      partnerPriceLocal: 0,
      retailPriceLocal: 0,
      commercialSavingsLocal: 0,
      commercialSavingsPercent: 0,
      partnerGrossMargin: 0,
      retailGrossMargin: 0,
      priceVersion: 'unconfigured'
    };
  }

  const partnerProfile = PRICING_PROFILES.PARTNER;
  const retailProfile = PRICING_PROFILES.RETAIL;

  const discount = calculateCommercialDiscount(
    options.quantity ?? 1,
    options.periods ?? 1,
    options.discountConfig ?? DEFAULT_DISCOUNT_CONFIG
  );

  const discountMultiplier = 1 - discount.combinedDiscountPercent / 100;

  // Calculate gross-margin base prices before commercial discounts.
  const rawPartnerUSD = calculateGrossMarginPrice(
    resolvedCostUSD,
    partnerProfile.targetMargin,
    partnerProfile.minMargin
  );

  const rawRetailUSD = calculateGrossMarginPrice(
    resolvedCostUSD,
    retailProfile.targetMargin,
    retailProfile.minMargin
  );

  const floorUSD = resolvedCostUSD / (1 - partnerProfile.minMargin);

  // Apply commercial discount without changing provider cost.
  const discountedPartnerUSD = rawPartnerUSD * discountMultiplier;
  const discountedRetailUSD = rawRetailUSD * discountMultiplier;

  const partnerPriceUSD = applyCommercialRounding(
    discountedPartnerUSD,
    'USD',
    floorUSD
  );

  const retailPriceUSD = applyCommercialRounding(
    discountedRetailUSD,
    'USD',
    partnerPriceUSD
  ); // Retail must be >= Partner

  // Convert to target currency
  const partnerPriceLocal = convertUsdToLocal(partnerPriceUSD, currency, floorUSD);
  const retailPriceLocal = convertUsdToLocal(retailPriceUSD, currency, partnerPriceUSD);

  const commercialSavingsLocal = Math.max(0, retailPriceLocal - partnerPriceLocal);
  const commercialSavingsPercent = retailPriceLocal > 0
    ? Math.round((commercialSavingsLocal / retailPriceLocal) * 100)
    : 0;

  return {
    sku,
    operation,
    currency,
    providerCostUSD: costUSD,
    providerCostKnown: cost.providerCostKnown,
    partnerPriceUSD,
    retailPriceUSD,
    partnerPriceLocal,
    retailPriceLocal,
    commercialSavingsLocal,
    commercialSavingsPercent,
    partnerGrossMargin: calculateRealizedGrossMargin(partnerPriceUSD, costUSD),
    retailGrossMargin: calculateRealizedGrossMargin(retailPriceUSD, costUSD),
    priceVersion: 'v1.0'
  };
}

/**
 * 5. EMAIL VOLUME PRICING (Conserving 1, 3, 5, 10, 25, 50 tiers)
 */
export interface EmailVolumeTier {
  unitPriceUSD: number;
  discountPercent: number;
  monthlyTotalUSD: number;
}

export function getEmailVolumePricing(
  planId: 'email-starter' | 'email-business' | string,
  mailboxCount: number
): EmailVolumeTier {
  const sku = planId === 'email-business'
    ? 'email-email-business'
    : 'email-email-starter';

  const basePriceUSD = getProductPriceResult(sku).retailPriceUSD;

  const discount = calculateCommercialDiscount(
    mailboxCount,
    1,
    DEFAULT_DISCOUNT_CONFIG
  );

  const unitPriceUSD = Number((
    basePriceUSD *
    (1 - discount.combinedDiscountPercent / 100)
  ).toFixed(2));

  const monthlyTotalUSD = Number((
    unitPriceUSD * mailboxCount
  ).toFixed(2));

  return {
    unitPriceUSD,
    discountPercent: discount.combinedDiscountPercent,
    monthlyTotalUSD
  };
}

/**
 * 6. SOLUCIONES BANELIO
 *
 * Solutions combine products. Component breakdown is tracked internally
 * for expected cost, margin, and entitlement tracking without exposing
 * wholesale breakdown to public clients.
 */
export const BANELIO_SOLUTIONS_CONFIG: Record<'START' | 'BUSINESS' | 'PRO', {
  code: 'START' | 'BUSINESS' | 'PRO';
  name: string;
  tagline: string;
  description: string;
  targetMargin: number;
  components: SolutionComponentDef[];
}> = {
  START: {
    code: 'START',
    name: 'Solución Banelio Start',
    tagline: 'Presencia digital profesional todo-en-uno para emprendedores y nuevos proyectos.',
    description: 'Incluye Dominio .com, 1 Buzón Corporativo Pro de 10GB, Hosting Cloud NVMe de alta velocidad y Certificado SSL.',
    targetMargin: 0.50,
    components: [
      { sku: 'tld-com', name: 'Dominio .com (1er Año)', category: 'DOMAIN', quantity: 1, expectedCostUSD: 9.80, costKnown: true, autoProvision: true },
      { sku: 'email-email-starter', name: 'Buzón Banelio Mail Pro (10 GB)', category: 'EMAIL', quantity: 1, expectedCostUSD: 7.20, costKnown: true, autoProvision: false },
      { sku: 'hosting-plan-starter-year', name: 'Hosting Cloud NVMe Starter (Anual)', category: 'HOSTING', quantity: 1, expectedCostUSD: 18.00, costKnown: true, autoProvision: false },
      { sku: 'ssl-ssl-dv', name: 'Certificado SSL DV Positivo', category: 'SSL', quantity: 1, expectedCostUSD: 4.50, costKnown: true, autoProvision: true }
    ]
  },
  BUSINESS: {
    code: 'BUSINESS',
    name: 'Solución Banelio Business',
    tagline: 'Infraestructura sólida para pymes, marcas en crecimiento y comercio electrónico.',
    description: 'Incluye Dominio .com, 5 Buzones Corporativos Suite, Hosting Cloud NVMe Pro Ultra con recursos dedicados y Certificado SSL Wildcard.',
    targetMargin: 0.50,
    components: [
      { sku: 'tld-com', name: 'Dominio .com (1er Año)', category: 'DOMAIN', quantity: 1, expectedCostUSD: 9.80, costKnown: true, autoProvision: true },
      { sku: 'email-eml-starter', name: 'Suite 5 Buzones Corporativos', category: 'EMAIL', quantity: 1, expectedCostUSD: 7.20, costKnown: true, autoProvision: false },
      { sku: 'hosting-plan-pro-year', name: 'Hosting Cloud NVMe Pro Ultra (Anual)', category: 'HOSTING', quantity: 1, expectedCostUSD: 30.00, costKnown: true, autoProvision: false },
      { sku: 'ssl-ssl-wildcard', name: 'Certificado SSL Wildcard Pro', category: 'SSL', quantity: 1, expectedCostUSD: 18.00, costKnown: true, autoProvision: true }
    ]
  },
  PRO: {
    code: 'PRO',
    name: 'Solución Banelio Pro',
    tagline: 'Potencia empresarial para agencias, fintechs y portales de alta demanda.',
    description: 'Incluye Dominio .com, 10 Buzones Enterprise con cifrado masivo, Hosting Cloud NVMe Enterprise y Certificado SSL EV con validación bancaria.',
    targetMargin: 0.52,
    components: [
      { sku: 'tld-com', name: 'Dominio .com (1er Año)', category: 'DOMAIN', quantity: 1, expectedCostUSD: 9.80, costKnown: true, autoProvision: true },
      { sku: 'email-eml-pro', name: 'Suite 10 Buzones Enterprise', category: 'EMAIL', quantity: 1, expectedCostUSD: 15.00, costKnown: true, autoProvision: false },
      { sku: 'hosting-plan-enterprise-year', name: 'Hosting Cloud NVMe Enterprise (Anual)', category: 'HOSTING', quantity: 1, expectedCostUSD: 60.00, costKnown: true, autoProvision: false },
      { sku: 'ssl-ssl-ev', name: 'Certificado Comodo EV SSL', category: 'SSL', quantity: 1, expectedCostUSD: 45.00, costKnown: true, autoProvision: true }
    ]
  }
};

/**
 * Calculates dynamic solution pricing based on component costs and gross margin.
 */
export function calculateSolutionPrice(
  code: 'START' | 'BUSINESS' | 'PRO',
  currency: Currency = 'USD',
  quantity: number = 1,
  periods: number = 1
): SolutionPrice & {
  partnerPriceLocal: number;
  retailPriceLocal: number;
  commercialSavingsLocal: number;
  discount: DiscountCalculationResult;
} {
  const def = BANELIO_SOLUTIONS_CONFIG[code];

  const expectedCostUSD = def.components.reduce(
    (sum, c) => sum + c.expectedCostUSD * c.quantity,
    0
  );

  const partnerProfile = PRICING_PROFILES.PARTNER;
  const retailMargin = def.targetMargin;

  const discount = calculateCommercialDiscount(
    quantity,
    periods,
    DEFAULT_DISCOUNT_CONFIG
  );

  const discountMultiplier = 1 - (
    discount.combinedDiscountPercent / 100
  );

  const rawPartnerUSD = calculateGrossMarginPrice(
    expectedCostUSD,
    partnerProfile.targetMargin,
    partnerProfile.minMargin
  );

  const rawRetailUSD = calculateGrossMarginPrice(
    expectedCostUSD,
    retailMargin,
    partnerProfile.minMargin
  );

  const floorUSD = expectedCostUSD / (1 - partnerProfile.minMargin);

  const partnerPriceUSD = applyCommercialRounding(
    rawPartnerUSD * discountMultiplier,
    'USD',
    floorUSD
  );

  const retailPriceUSD = applyCommercialRounding(
    rawRetailUSD * discountMultiplier,
    'USD',
    partnerPriceUSD
  );

  const partnerPriceLocal = convertUsdToLocal(
    partnerPriceUSD,
    currency,
    floorUSD
  );

  const retailPriceLocal = convertUsdToLocal(
    retailPriceUSD,
    currency,
    partnerPriceUSD
  );

  const commercialSavingsLocal = Math.max(
    0,
    retailPriceLocal - partnerPriceLocal
  );

  return {
    solutionId: code,
    code,
    name: def.name,
    tagline: def.tagline,
    description: def.description,
    components: def.components,
    expectedCostUSD,
    partnerPriceUSD,
    retailPriceUSD,
    partnerPriceLocal,
    retailPriceLocal,
    commercialSavingsLocal,
    targetMargin: retailMargin,
    version: 'v1.0',
    active: true,
    discount
  };
}

/**
 * 7. ENTITLEMENT MANAGEMENT (Lifecycle: GRANTED -> ACTIVATED -> PROVISIONED)
 */
export function createEntitlementsForSolution(
  solutionCode: 'START' | 'BUSINESS' | 'PRO',
  customerId: string,
  orderId: string
): Array<Omit<EntitlementRecord, 'id'>> {
  const def = BANELIO_SOLUTIONS_CONFIG[solutionCode];
  if (!def) return [];

  return def.components.map((comp) => ({
    customerId,
    orderId,
    solutionId: `SOL-${solutionCode}`,
    serviceType: comp.category,
    sku: comp.sku,
    name: comp.name,
    status: comp.autoProvision ? 'ACTIVATED' : 'GRANTED',
    grantedAt: new Date().toISOString(),
    activatedAt: comp.autoProvision ? new Date().toISOString() : undefined,
    expectedCostUSD: comp.expectedCostUSD,
    actualCostUSD: comp.autoProvision ? comp.expectedCostUSD : 0
  }));
}

/**
 * 8. INTERNAL PRICING METRICS COMPUTATION (Admin only)
 */
export function computeInternalMetrics(
  entitlements: EntitlementRecord[],
  solutionOrdersCount: number = 0
): InternalPricingMetrics {
  const totalGranted = entitlements.length;
  const activated = entitlements.filter(
    (e) => e.status === 'ACTIVATED' || e.status === 'PROVISIONED'
  );
  const totalActivated = activated.length;
  const activationRate = totalGranted > 0 ? totalActivated / totalGranted : 0;

  const totalExpectedProviderCostUSD = entitlements.reduce(
    (sum, e) => sum + (e.expectedCostUSD || 0),
    0
  );
  const totalActualProviderCostUSD = entitlements.reduce(
    (sum, e) => sum + (e.actualCostUSD || 0),
    0
  );
  const costSavingsFromUnactivatedUSD = Math.max(
    0,
    totalExpectedProviderCostUSD - totalActualProviderCostUSD
  );

  return {
    totalSolutionsSold: solutionOrdersCount,
    totalEntitlementsGranted: totalGranted,
    totalEntitlementsActivated: totalActivated,
    activationRate: Math.round(activationRate * 100) / 100,
    totalExpectedProviderCostUSD: Number(totalExpectedProviderCostUSD.toFixed(2)),
    totalActualProviderCostUSD: Number(totalActualProviderCostUSD.toFixed(2)),
    costSavingsFromUnactivatedUSD: Number(costSavingsFromUnactivatedUSD.toFixed(2)),
    averageBundleGrossMargin: 0.51
  };
}

/**
 * 9. COMMERCIAL OFFERS
 */
export const ACTIVE_COMMERCIAL_OFFERS: CommercialOffer[] = [
  {
    id: 'offer-welcome20',
    code: 'WELCOME20',
    name: 'Bono de Bienvenida Banelio',
    description: '20% de descuento en el primer pedido sobre productos calificados.',
    discountPercent: 0.20,
    validFrom: '2026-01-01T00:00:00Z',
    validTo: '2026-12-31T23:59:59Z',
    version: 'offer-2026.1',
    active: true
  },
  {
    id: 'offer-partner30',
    code: 'PARTNER30',
    name: 'Descuento Comercial de Afiliado',
    description: 'Tarifa preferencial para clientes referidos por partners.',
    discountPercent: 0.15,
    validFrom: '2026-01-01T00:00:00Z',
    validTo: '2026-12-31T23:59:59Z',
    version: 'offer-2026.1',
    active: true
  },
  {
    id: 'offer-hotsale',
    code: 'HOTSALE',
    name: 'Campaña HotSale Digital',
    description: '25% de ahorro comercial por temporada.',
    discountPercent: 0.25,
    validFrom: '2026-05-01T00:00:00Z',
    validTo: '2026-11-30T23:59:59Z',
    version: 'offer-2026.2',
    active: true
  }
];

/**
 * 10. PARTNER / AFFILIATE COMMISSIONS
 *
 * Implements strict separation between:
 * - PARTNER PRICE: Wholesale purchase rate with partner target margin (35%), where savings = retailPrice - partnerPrice.
 * - PARTNER COMMISSION: Percentage referral payout on retail sales attributed to a partner.
 *
 * ANTI-DOUBLE-DIPPING CONSTRAINT:
 * If an order already benefited from Partner wholesale pricing, no referral commission is granted on top.
 */
export interface PartnerCommissionResult {
  eligible: boolean;
  commissionRate: number;
  baseAmountUSD: number;
  commissionAmountUSD: number;
  currency: 'USD';
  reason?: string;
}

export function calculatePartnerCommission(
  orderSubtotalUSD: number,
  discountUSD: number,
  isPartnerPriceApplied: boolean = false,
  customRate?: number
): PartnerCommissionResult {
  if (isPartnerPriceApplied) {
    return {
      eligible: false,
      commissionRate: 0,
      baseAmountUSD: 0,
      commissionAmountUSD: 0,
      currency: 'USD',
      reason: 'No duplicate benefit: Order already received Partner wholesale pricing'
    };
  }

  const baseUSD = Math.max(0, orderSubtotalUSD - discountUSD);
  if (baseUSD <= 0) {
    return {
      eligible: false,
      commissionRate: 0,
      baseAmountUSD: 0,
      commissionAmountUSD: 0,
      currency: 'USD',
      reason: 'Order base amount is zero'
    };
  }

  const rate =
    typeof customRate === 'number' && Number.isFinite(customRate) && customRate >= 0 && customRate <= 0.50
      ? customRate
      : 0.20; // 20% standard recurring commission

  const commissionAmountUSD = Math.round(baseUSD * rate * 100) / 100;

  return {
    eligible: true,
    commissionRate: rate,
    baseAmountUSD: Number(baseUSD.toFixed(2)),
    commissionAmountUSD,
    currency: 'USD'
  };
}
