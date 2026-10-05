/**
 * Banelio Domain Service
 * Conexión oficial y exclusiva con los endpoints backend de Banelio:
 * - GET /api/domains/check.php?domain={domain}
 * - GET /api/domains/transfer.php?domain={domain}
 * - GET /api/transfers/pricing
 *
 * Cumple estrictamente con la arquitectura de backend seguro:
 * - Sin almacenamiento ni exposición de Auth/EPP Code en localStorage, sessionStorage o URLs.
 * - Sin exposición de IDs internos de Reseller o claves privadas.
 * - Manejo robusto de estados (Loading, Success, Error, Timeout, Offline).
 */

export interface DomainCheckRawResponse {
  success: boolean;
  domain?: string;
  error?: string;
  result?: Record<
    string,
    {
      classkey?: string;
      status?: string;
    }
  >;
}

export interface DomainSearchResult {
  domain: string;
  tld: string;
  isAvailable: boolean;
  status: 'available' | 'unavailable' | 'unknown' | 'error';
  rawStatus?: string;
  statusText: string;
  priceUSD: number;
  isPromo?: boolean;
  suggestion?: boolean;
  errorMsg?: string;
}

export interface DomainTransferCheckResult {
  domain: string;
  tld: string;
  canTransfer: boolean;
  status: 'regthroughothers' | 'available' | 'regthroughus' | 'error' | 'unknown';
  rawStatus?: string;
  message: string;
  priceUSD: number;
  errorMsg?: string;
}

export interface SanitizeDomainResult {
  valid: boolean;
  cleanDomain: string;
  domainNameOnly: string;
  tld: string;
  error?: string;
}

/**
 * Sanitiza y normaliza las entradas de búsqueda de dominio
 */
export function sanitizeDomainInput(input: string): SanitizeDomainResult {
  if (!input || !input.trim()) {
    return {
      valid: false,
      cleanDomain: '',
      domainNameOnly: '',
      tld: '',
      error: 'Por favor ingresa un nombre de dominio.'
    };
  }

  let clean = input.trim().toLowerCase();

  // Eliminar protocolo http://, https://, etc.
  clean = clean.replace(/^[a-z]+:\/\//i, '');

  // Eliminar prefijo www.
  clean = clean.replace(/^www\./i, '');

  // Eliminar rutas, parámetros de consulta o hashes
  clean = clean.split('/')[0].split('?')[0].split('#')[0];

  // Eliminar puertos (:80, :443, etc.)
  clean = clean.split(':')[0];

  // Eliminar caracteres no válidos para nombres de dominio (solo a-z, 0-9, guion y punto)
  clean = clean.replace(/[^a-z0-9.-]/g, '');

  // Reducir múltiples puntos consecutivos a uno solo
  clean = clean.replace(/\.{2,}/g, '.');

  // Eliminar puntos o guiones al inicio o al final
  clean = clean.replace(/^[-.]+|[-.]+$/g, '');

  if (!clean) {
    return {
      valid: false,
      cleanDomain: '',
      domainNameOnly: '',
      tld: '',
      error: 'Ingresa un dominio con caracteres válidos.'
    };
  }

  // Si el usuario no especificó una extensión, predeterminar a .com
  if (!clean.includes('.')) {
    const domainNameOnly = clean;
    const cleanDomain = `${clean}.com`;
    return {
      valid: true,
      cleanDomain,
      domainNameOnly,
      tld: 'com'
    };
  }

  const parts = clean.split('.');
  const domainNameOnly = parts[0];
  const tld = parts.slice(1).join('.');

  if (!domainNameOnly || domainNameOnly.length < 1 || !tld || tld.length < 2) {
    return {
      valid: false,
      cleanDomain: clean,
      domainNameOnly,
      tld,
      error: 'El formato del dominio no es válido.'
    };
  }

  return {
    valid: true,
    cleanDomain: clean,
    domainNameOnly,
    tld
  };
}

export interface TransferPricingEntry {
  tld: string;
  operation: 'transfer' | 'renew';
  sku: string;
  name: string;
  price: number;
  currency: string;
  billingPeriod: string;
}

let transferPricingCache: { fetchedAt: number; entries: TransferPricingEntry[] } | null = null;

/**
 * Obtiene el pricing REAL de transferencias/renewal desde el backend.
 * Si no hay precios configurados (TRANSFER_TLDS vacío), devuelve [].
 * El precio JAMÁS se inventa en el cliente: se lee de /api/transfers/pricing.
 */
export async function fetchTransferPricing(force = false): Promise<TransferPricingEntry[]> {
  if (!force && transferPricingCache && Date.now() - transferPricingCache.fetchedAt < 300000) {
    return transferPricingCache.entries;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('/api/transfers/pricing', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      transferPricingCache = { fetchedAt: Date.now(), entries: [] };
      return [];
    }
    const data = await res.json();
    const entries = Array.isArray(data) ? (data as TransferPricingEntry[]) : [];
    transferPricingCache = { fetchedAt: Date.now(), entries };
    return entries;
  } catch {
    transferPricingCache = transferPricingCache || { fetchedAt: Date.now(), entries: [] };
    return transferPricingCache.entries;
  }
}

/**
 * Busca el precio real de transferencia para un TLD dado desde el pricing del servidor.
 * Devuelve null si no está configurado (el frontend debe mostrar un mensaje honesto).
 */
async function getTransferPriceFor(tld: string): Promise<number | null> {
  const entries = await fetchTransferPricing();
  const match = entries.find((e) => e.operation === 'transfer' && e.tld.toLowerCase() === tld.toLowerCase());
  return match ? match.price : null;
}

/**
 * 1. Consulta la disponibilidad de registro de un dominio:
 * GET /api/domains/check.php?domain={domain}
 */
export async function checkDomainAvailability(
  domain: string,
  priceUSD?: number,
  isPromo: boolean = false
): Promise<DomainSearchResult> {
  const normalizedDomain = domain.trim().toLowerCase();
  const tld = normalizedDomain.split('.').slice(1).join('.') || 'com';
  const resolvedPrice = priceUSD ?? null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(`/api/domains/check.php?domain=${encodeURIComponent(normalizedDomain)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        domain: normalizedDomain,
        tld,
        isAvailable: false,
        status: 'error',
        statusText: 'No disponible temporalmente',
        priceUSD: resolvedPrice,
        isPromo,
        errorMsg: 'Estamos verificando el dominio. Inténtalo nuevamente.'
      };
    }

    let data: DomainCheckRawResponse;
    try {
      data = await response.json();
    } catch {
      return {
        domain: normalizedDomain,
        tld,
        isAvailable: false,
        status: 'error',
        statusText: 'No disponible temporalmente',
        priceUSD: resolvedPrice,
        isPromo,
        errorMsg: 'No pudimos completar la consulta. Inténtalo nuevamente.'
      };
    }

    if (!data.success && data.error) {
      return {
        domain: normalizedDomain,
        tld,
        isAvailable: false,
        status: 'error',
        statusText: 'No disponible',
        priceUSD: resolvedPrice,
        isPromo,
        errorMsg: 'Estamos verificando el dominio. Inténtalo en un momento.'
      };
    }

    // Extraer el status del campo result[domain].status
    const domainResult = data.result?.[normalizedDomain] || 
      (data.result ? Object.values(data.result)[0] : null);

    const rawStatus = (domainResult?.status || '').toLowerCase().trim();

    if (rawStatus === 'available') {
      return {
        domain: normalizedDomain,
        tld,
        isAvailable: true,
        status: 'available',
        rawStatus,
        statusText: 'Disponible',
        priceUSD: resolvedPrice,
        isPromo
      };
    } else if (
      rawStatus === 'regthroughothers' ||
      rawStatus === 'regthroughus' ||
      rawStatus === 'registered' ||
      rawStatus === 'unavailable'
    ) {
      return {
        domain: normalizedDomain,
        tld,
        isAvailable: false,
        status: 'unavailable',
        rawStatus,
        statusText: 'No disponible',
        priceUSD: resolvedPrice,
        isPromo
      };
    } else {
      return {
        domain: normalizedDomain,
        tld,
        isAvailable: false,
        status: 'unknown',
        rawStatus,
        statusText: 'No disponible',
        priceUSD: resolvedPrice,
        isPromo
      };
    }
  } catch (networkError: any) {
    const isTimeout = networkError?.name === 'AbortError';
    return {
      domain: normalizedDomain,
      tld,
      isAvailable: false,
      status: 'error',
      statusText: isTimeout ? 'Tiempo de espera agotado' : 'Sin conexión',
      priceUSD: resolvedPrice,
      isPromo,
      errorMsg: isTimeout
        ? 'El servidor tardó en responder. Por favor reintenta.'
        : 'No fue posible contactar con el servicio de verificación.'
    };
  }
}

/**
 * 2. Consulta si un dominio es elegible para ser transferido a Banelio:
 * GET /api/domains/transfer.php?domain={domain}
 */
export async function checkDomainTransferEligibility(
  domain: string,
  priceUSD?: number
): Promise<DomainTransferCheckResult> {
  const normalizedDomain = domain.trim().toLowerCase();
  const tld = normalizedDomain.split('.').slice(1).join('.') || 'com';
  const resolvedPrice = priceUSD ?? (await getTransferPriceFor(tld));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(`/api/domains/transfer.php?domain=${encodeURIComponent(normalizedDomain)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        domain: normalizedDomain,
        tld,
        canTransfer: false,
        status: 'error',
        message: 'No pudimos verificar la elegibilidad de transferencia en este momento.',
        priceUSD: resolvedPrice,
        errorMsg: 'El servicio está temporalmente no disponible.'
      };
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      return {
        domain: normalizedDomain,
        tld,
        canTransfer: false,
        status: 'error',
        message: 'No pudimos completar la consulta. Inténtalo nuevamente.',
        priceUSD: resolvedPrice
      };
    }

    const rawStatus = (
      data.status ||
      data.result?.[normalizedDomain]?.status ||
      data.result?.status ||
      ''
    ).toLowerCase().trim();

    if (rawStatus === 'regthroughothers' || rawStatus === 'registered' || rawStatus === 'unavailable') {
      return {
        domain: normalizedDomain,
        tld,
        canTransfer: true,
        status: 'regthroughothers',
        rawStatus,
        message: 'Este dominio está registrado y puede solicitarse su transferencia.',
        priceUSD: resolvedPrice
      };
    } else if (rawStatus === 'available') {
      return {
        domain: normalizedDomain,
        tld,
        canTransfer: false,
        status: 'available',
        rawStatus,
        message: 'Este dominio no está registrado; está disponible para registro nuevo.',
        priceUSD: resolvedPrice
      };
    } else     if (rawStatus === 'regthroughus') {
      return {
        domain: normalizedDomain,
        tld,
        canTransfer: false,
        status: 'regthroughus',
        rawStatus,
        message: 'Este dominio ya se encuentra registrado y administrado en Banelio.',
        priceUSD: resolvedPrice
      };
    }

    // Unknown / empty / unrecognized status: do NOT assume it is transferable.
    return {
      domain: normalizedDomain,
      tld,
      canTransfer: false,
      status: 'unknown',
      rawStatus,
      message: 'No se pudo determinar el estado del dominio. Inténtalo nuevamente.',
      priceUSD: resolvedPrice,
      errorMsg: rawStatus
        ? `Estado no reconocido: ${rawStatus}`
        : 'El registry no devolvió un estado válido.'
    };
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError';
    return {
      domain: normalizedDomain,
      tld,
      canTransfer: false,
      status: 'error',
      message: isTimeout
        ? 'Tiempo de espera agotado al consultar la transferencia.'
        : 'Error de conexión con el servicio de verificación.',
      priceUSD: resolvedPrice,
      errorMsg: err?.message
    };
  }
}

/**
 * Datos del cliente requeridos para contacto del dominio
 */
export interface TransferCustomerData {
  first_name: string;
  last_name: string;
  company?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

