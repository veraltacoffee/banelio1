/**
 * BANELIO - Tasas e impuestos server-side (Fase 1B).
 *
 * Fuente: src/utils/pricing.ts (COUNTRY_TAX_RATES). Ninguna tasa fue inventada;
 * se replican exactamente las del frontend actual.
 *
 * El servidor es quien decide la tasa ESCOGIENDO por país; nunca acepta un
 * porcentaje enviado por el cliente. Si el país no está soportado se responde
 * con la configuración neutral "OTHER" (0%).
 */

export interface CountryTax {
  countryCode: string;
  name: string;
  rate: number; // fracción (0.16 = 16%)
  currency: string;
  language: string;
  supported: boolean;
}

const COUNTRY_TAX_RATES: Record<string, { rate: number; name: string; currency: string; language: string }> = {
  MX: { rate: 0.16, name: 'México (IVA 16%)', currency: 'MXN', language: 'es' },
  US: { rate: 0.0, name: 'Estados Unidos (Sales Tax 0%)', currency: 'USD', language: 'en' },
  ES: { rate: 0.21, name: 'España (IVA 21%)', currency: 'EUR', language: 'es' },
  CO: { rate: 0.19, name: 'Colombia (IVA 19%)', currency: 'COP', language: 'es' },
  AR: { rate: 0.21, name: 'Argentina (IVA 21%)', currency: 'ARS', language: 'es' },
  CL: { rate: 0.19, name: 'Chile (IVA 19%)', currency: 'CLP', language: 'es' },
  PE: { rate: 0.18, name: 'Perú (IGV 18%)', currency: 'PEN', language: 'es' },
  BR: { rate: 0.17, name: 'Brasil (ICMS 17%)', currency: 'BRL', language: 'es' },
  GB: { rate: 0.2, name: 'Reino Unido (VAT 20%)', currency: 'GBP', language: 'en' },
  CA: { rate: 0.13, name: 'Canadá (HST/GST 13%)', currency: 'CAD', language: 'en' },
  DE: { rate: 0.19, name: 'Alemania (MwSt 19%)', currency: 'EUR', language: 'en' }
};

const OTHER: { rate: number; name: string; currency: string; language: string } = {
  rate: 0.0,
  name: 'Internacional (0% Tax)',
  currency: 'USD',
  language: 'es'
};

// Código de país ISO 3166-1 alpha-2 (2 letras mayúsculas).
const ISO_ALPHA2 = /^[A-Z]{2}$/;

/**
 * Valida y normaliza el código de país enviado por el cliente.
 * Devuelve null si el formato no es un código ISO 3166-1 alpha-2 válido.
 */
export function normalizeCountryCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toUpperCase();
  if (!ISO_ALPHA2.test(code)) return null;
  return code;
}

/**
 * Devuelve la configuración de impuesto para un país.
 * - País soportado -> su tasa específica.
 * - País con formato válido pero no soportado -> configuración neutral "OTHER".
 */
export function getTaxForCountry(countryCode: string): CountryTax {
  const entry = COUNTRY_TAX_RATES[countryCode];
  if (entry) {
    return { countryCode, ...entry, supported: true };
  }
  return { countryCode, ...OTHER, supported: false };
}

export function getSupportedCountries(): Array<{ countryCode: string; name: string; rate: number; currency: string }> {
  return Object.entries(COUNTRY_TAX_RATES).map(([code, v]) => ({
    countryCode: code,
    name: v.name,
    rate: v.rate,
    currency: v.currency
  }));
}
