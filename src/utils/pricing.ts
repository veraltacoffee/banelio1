import { Currency, CurrencyConfig, Language } from '../types';

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
 * Detecta la ubicación del usuario mediante zona horaria e idioma del navegador sin depender de APIs externas.
 */
export function detectUserLocation(): { countryCode: string; currency: Currency; language: Language } {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const browserLang = (typeof navigator !== 'undefined' ? (navigator.language || navigator.languages?.[0] || 'es') : 'es').toLowerCase();

    // 1. Zonas horarias de México
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

    // 2. España
    if (tz.includes('Madrid') || tz.includes('Canary') || browserLang.startsWith('es-es')) {
      return { countryCode: 'ES', currency: 'EUR', language: 'es' };
    }

    // 3. Colombia
    if (tz.includes('Bogota') || browserLang.startsWith('es-co')) {
      return { countryCode: 'CO', currency: 'COP', language: 'es' };
    }

    // 4. Argentina
    if (tz.includes('Buenos_Aires') || tz.includes('Argentina') || browserLang.startsWith('es-ar')) {
      return { countryCode: 'AR', currency: 'ARS', language: 'es' };
    }

    // 5. Chile
    if (tz.includes('Santiago') || browserLang.startsWith('es-cl')) {
      return { countryCode: 'CL', currency: 'CLP', language: 'es' };
    }

    // 6. Perú
    if (tz.includes('Lima') || browserLang.startsWith('es-pe')) {
      return { countryCode: 'PE', currency: 'PEN', language: 'es' };
    }

    // 7. Brasil
    if (tz.includes('Sao_Paulo') || tz.includes('Rio') || browserLang.startsWith('pt')) {
      return { countryCode: 'BR', currency: 'BRL', language: 'es' };
    }

    // 8. Reino Unido
    if (tz.includes('London') || browserLang.startsWith('en-gb')) {
      return { countryCode: 'GB', currency: 'GBP', language: 'en' };
    }

    // 9. Canadá
    if (tz.includes('Toronto') || tz.includes('Vancouver') || tz.includes('Montreal') || browserLang.startsWith('en-ca')) {
      return { countryCode: 'CA', currency: 'CAD', language: 'en' };
    }

    // 10. Europa (EUR)
    if (tz.startsWith('Europe/')) {
      return { countryCode: 'DE', currency: 'EUR', language: browserLang.startsWith('es') ? 'es' : 'en' };
    }

    // 11. Detección genérica de español -> MXN / es
    if (browserLang.startsWith('es')) {
      return { countryCode: 'MX', currency: 'MXN', language: 'es' };
    }

    return { countryCode: 'US', currency: 'USD', language: 'en' };
  } catch {
    return { countryCode: 'MX', currency: 'MXN', language: 'es' };
  }
}
