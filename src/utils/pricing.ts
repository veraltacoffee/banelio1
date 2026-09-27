import { Currency, CurrencyConfig, Language, TldConfig } from '../types';
import {
  calculateGrossMarginPrice,
  calculateCommercialDiscount,
  applyCommercialRounding,
  DEFAULT_DISCOUNT_CONFIG,
  getProtectedFxRate
} from '../services/pricingEngine';

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  MXN: {
    code: 'MXN',
    symbol: '$',
    rate: 1.0,
    name: 'Peso Mexicano (MXN)',
    flag: '🇲🇽'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    rate: 1.0,
    name: 'US Dollar (USD)',
    flag: '🇺🇸'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    rate: 1.0,
    name: 'Euro (EUR)',
    flag: '🇪🇺'
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    rate: 1.0,
    name: 'British Pound (GBP)',
    flag: '🇬🇧'
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    rate: 1.0,
    name: 'Canadian Dollar (CAD)',
    flag: '🇨🇦'
  },
  COP: {
    code: 'COP',
    symbol: 'COL$',
    rate: 1.0,
    name: 'Peso Colombiano (COP)',
    flag: '🇨🇴'
  },
  ARS: {
    code: 'ARS',
    symbol: 'AR$',
    rate: 1.0,
    name: 'Peso Argentino (ARS)',
    flag: '🇦🇷'
  },
  CLP: {
    code: 'CLP',
    symbol: 'CLP$',
    rate: 1.0,
    name: 'Peso Chileno (CLP)',
    flag: '🇨🇱'
  },
  PEN: {
    code: 'PEN',
    symbol: 'S/',
    rate: 1.0,
    name: 'Sol Peruano (PEN)',
    flag: '🇵🇪'
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    rate: 1.0,
    name: 'Real Brasileño (BRL)',
    flag: '🇧🇷'
  }
};

export const COUNTRY_TAX_RATES: Record<string, { rate: number; name: string; currency: Currency; language: Language }> = {
  MX: { rate: 0.16, name: 'México (IVA 16%)', currency: 'MXN', language: 'es' },
  US: { rate: 0.0, name: 'Estados Unidos (Sales Tax 0%)', currency: 'USD', language: 'en' },
  ES: { rate: 0.21, name: 'España (IVA 21%)', currency: 'EUR', language: 'es' },
  CO: { rate: 0.19, name: 'Colombia (IVA 19%)', currency: 'COP', language: 'es' },
  AR: { rate: 0.21, name: 'Argentina (IVA 21%)', currency: 'ARS', language: 'es' },
  CL: { rate: 0.19, name: 'Chile (IVA 19%)', currency: 'CLP', language: 'es' },
  PE: { rate: 0.18, name: 'Perú (IGV 18%)', currency: 'PEN', language: 'es' },
  BR: { rate: 0.17, name: 'Brasil (ICMS 17%)', currency: 'BRL', language: 'es' },
  GB: { rate: 0.20, name: 'Reino Unido (VAT 20%)', currency: 'GBP', language: 'en' },
  CA: { rate: 0.13, name: 'Canadá (HST/GST 13%)', currency: 'CAD', language: 'en' },
  DE: { rate: 0.19, name: 'Alemania (MwSt 19%)', currency: 'EUR', language: 'en' },
  OTHER: { rate: 0.0, name: 'Internacional (0% Tax)', currency: 'USD', language: 'es' }
};

/**
 * Detect user locale, timezone, and country to auto-select Currency and Language
 */
export function detectUserLocation(): { countryCode: string; currency: Currency; language: Language } {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const browserLang = (navigator.language || navigator.languages?.[0] || 'es').toLowerCase();

    // 1. Check Mexican Timezones
    if (
      tz.includes('Mexico') ||
      tz.includes('Cancun') ||
      tz.includes('Monterrey') ||
      tz.includes('Tijuana') ||
      tz.includes('Hermosillo') ||
      tz.includes('Chihuahua') ||
      tz.includes('Mazatlan') ||
      tz.includes('Merida') ||
      tz.includes('Matamoros')
    ) {
      return { countryCode: 'MX', currency: 'MXN', language: 'es' };
    }

    // 2. Check Spain
    if (tz.includes('Madrid') || tz.includes('Canary') || browserLang.startsWith('es-es')) {
      return { countryCode: 'ES', currency: 'EUR', language: 'es' };
    }

    // 3. Check Colombia
    if (tz.includes('Bogota') || browserLang.startsWith('es-co')) {
      return { countryCode: 'CO', currency: 'COP', language: 'es' };
    }

    // 4. Check Argentina
    if (tz.includes('Buenos_Aires') || tz.includes('Argentina') || browserLang.startsWith('es-ar')) {
      return { countryCode: 'AR', currency: 'ARS', language: 'es' };
    }

    // 5. Check Chile
    if (tz.includes('Santiago') || browserLang.startsWith('es-cl')) {
      return { countryCode: 'CL', currency: 'CLP', language: 'es' };
    }

    // 6. Check Peru
    if (tz.includes('Lima') || browserLang.startsWith('es-pe')) {
      return { countryCode: 'PE', currency: 'PEN', language: 'es' };
    }

    // 7. Check Brazil
    if (tz.includes('Sao_Paulo') || tz.includes('Rio') || browserLang.startsWith('pt')) {
      return { countryCode: 'BR', currency: 'BRL', language: 'es' };
    }

    // 8. Check UK
    if (tz.includes('London') || browserLang.startsWith('en-gb')) {
      return { countryCode: 'GB', currency: 'GBP', language: 'en' };
    }

    // 9. Check Canada
    if (tz.includes('Toronto') || tz.includes('Vancouver') || tz.includes('Montreal') || browserLang.startsWith('en-ca')) {
      return { countryCode: 'CA', currency: 'CAD', language: 'en' };
    }

    // 10. Check Europe (EUR)
    if (tz.startsWith('Europe/')) {
      return { countryCode: 'DE', currency: 'EUR', language: browserLang.startsWith('es') ? 'es' : 'en' };
    }

    // 11. Generic Spanish detection -> default to MXN or USD
    if (browserLang.startsWith('es')) {
      return { countryCode: 'MX', currency: 'MXN', language: 'es' };
    }

    // Default USA
    return { countryCode: 'US', currency: 'USD', language: 'en' };
  } catch (err) {
    return { countryCode: 'MX', currency: 'MXN', language: 'es' };
  }
}

/**
 * Enforces psychological retail pricing ending in .99 (USD/EUR) or 99 (MXN/Latin currencies)
 */
export function snapToPsychological99(amount: number, currency: Currency): number {
  if (amount <= 0) return 0;

  if (currency === 'MXN') {
    // For small promo amounts (e.g. 59, 49, 79, 99)
    if (amount <= 99) {
      if (Math.abs(amount - 59) <= 10) return 59;
      if (Math.abs(amount - 49) <= 6) return 49;
      if (Math.abs(amount - 79) <= 6) return 79;
      return Math.round(amount);
    }
    const hundreds = Math.round(amount / 100);
    const candidate = Math.max(59, hundreds * 100 - 1); // e.g. 400 - 1 = 399
    // If the candidate is significantly lower than original (> 25 lower), step up
    if (candidate < amount * 0.95) {
      return (hundreds + 1) * 100 - 1;
    }
    return candidate;
  }

  if (currency === 'USD' || currency === 'EUR' || currency === 'GBP' || currency === 'CAD') {
    // Ends in .99 (e.g. 3.99, 14.99, 21.99, 39.99)
    const floorInt = Math.floor(amount);
    return floorInt + 0.99;
  }

  if (currency === 'PEN' || currency === 'BRL') {
    const floorInt = Math.floor(amount);
    return Math.max(9.90, floorInt + 0.90);
  }

  if (currency === 'COP' || currency === 'ARS' || currency === 'CLP') {
    // Thousands ending in 900 or 990
    const thousands = Math.round(amount / 1000);
    return Math.max(990, thousands * 1000 - 10);
  }

  return Math.round(amount * 100) / 100;
}

export function calculateTldRetailPrice(
  config: TldConfig,
  quantity: number = 1,
  periods: number = 1
): number {
  const wholesale = config.providerCost || 10.0;
  const rawMargin = typeof config.marginPercent === 'number' ? config.marginPercent : 0.55;
  const fixed = config.fixedMarkup || 0;
  const decimalMargin = rawMargin > 1 ? rawMargin / 100 : rawMargin;
  const effectiveMargin = Math.max(0.20, Math.min(0.90, decimalMargin));

  const basePrice = calculateGrossMarginPrice(
    wholesale,
    effectiveMargin,
    0.20
  ) + fixed;

  const discount = calculateCommercialDiscount(
    quantity,
    periods,
    DEFAULT_DISCOUNT_CONFIG
  );

  const discountedPrice = basePrice * (
    1 - discount.combinedDiscountPercent / 100
  );

  const floorPrice = wholesale / 0.80;

  return applyCommercialRounding(
    Math.max(discountedPrice, floorPrice),
    'USD',
    floorPrice
  );
}

/**
 * Banelio Automated Gross Margin Calculator
 * Applies gross margin over wholesale cost: price = cost / (1 - margin)
 * and enforces local commercial rounding.
 */
export function calculateRegistryRetail(
  baseCostUSD: number,
  targetCurrency: Currency = 'MXN',
  marginPercent: number = 0.55 // 55% retail gross margin by default
): {
  baseCostUSD: number;
  marginPercent: number;
  retailUSD: number;
  retailConverted: number;
  formatted: string;
} {
  // Gross margin formula: price = cost / (1 - margin)
  const effectiveMargin = Math.max(0.20, Math.min(0.90, marginPercent > 1 ? marginPercent / 100 : marginPercent));
  const rawRetailUSD = baseCostUSD / (1 - effectiveMargin);
  const floorUSD = baseCostUSD / 0.80;
  const retailUSD = snapToPsychological99(Math.max(rawRetailUSD, floorUSD), 'USD');

  // Convert to Target Currency with psychological rounding
  const retailConverted = convertCurrency(retailUSD, targetCurrency);
  const formatted = formatMoney(retailUSD, targetCurrency);

  return {
    baseCostUSD,
    marginPercent: effectiveMargin,
    retailUSD,
    retailConverted,
    formatted
  };
}

export function convertCurrency(amountInUSD: number, targetCurrency: Currency): number {
  const rate = getProtectedFxRate(targetCurrency);
  const rawConverted = amountInUSD * rate;
  return applyCommercialRounding(rawConverted, targetCurrency);
}

export function formatMoneyExact(amountInUSD: number, currency: Currency = 'MXN'): string {
  const rate = getProtectedFxRate(currency);
  const converted = amountInUSD * rate;
  const sym = CURRENCIES[currency]?.symbol || '$';

  if (currency === 'MXN' || currency === 'COP' || currency === 'ARS' || currency === 'CLP') {
    const formattedNumber = Math.round(converted).toLocaleString();
    return `${sym}${formattedNumber} ${currency}`;
  }

  const formattedNumber = converted.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return `${sym}${formattedNumber} ${currency}`;
}

export function formatMoney(amountInUSD: number, currency: Currency = 'MXN'): string {
  const converted = convertCurrency(amountInUSD, currency);
  const sym = CURRENCIES[currency]?.symbol || '$';
  
  if (currency === 'MXN' || currency === 'COP' || currency === 'ARS' || currency === 'CLP') {
    const formattedNumber = Math.round(converted).toLocaleString();
    return `${sym}${formattedNumber} ${currency}`;
  }

  // Format with standard two decimal digits for USD/EUR/GBP/CAD
  const formattedNumber = converted.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return `${sym}${formattedNumber} ${currency}`;
}

export function formatUSD(amountInUSD: number): string {
  const rounded = snapToPsychological99(amountInUSD, 'USD');
  return `$${rounded.toFixed(2)} USD`;
}
