/**
 * Banelio Domain Service
 * Conexión oficial y exclusiva con los endpoints backend de Banelio:
 * - GET  /api/domains/check.php?domain={domain}
 * - GET  /api/domains/transfer.php?domain={domain}
 * - POST /api/domains/transfer-order.php
 * - POST /api/domains/transfer-auth.php
 * - GET  /api/domains/transfer-status.php?domain={domain}
 * - GET/POST /api/domains/customer.php
 * - GET  /api/domains/contacts.php
 * - POST /api/domains/contact-create.php
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

/**
 * Payload enviado a POST /api/domains/transfer-order.php
 * NUNCA envía customer_id, contact_id, API keys ni credenciales.
 */
export interface TransferOrderPayload {
  domain: string;
  auth_code?: string;
  auto_renew?: boolean;
  customer: TransferCustomerData;
}

export interface TransferOrderResponse {
  success: boolean;
  domain?: string;
  order_id?: string | number;
  status?: string;
  message?: string;
  error?: string;
  requires_auth?: boolean;
}

/**
 * 3. Crea una orden de transferencia en el backend oficial:
 * POST /api/domains/transfer-order.php
 * Content-Type: application/json
 */
export async function createTransferOrder(
  payload: TransferOrderPayload
): Promise<TransferOrderResponse> {
  const normalizedDomain = (payload.domain || '').trim().toLowerCase();

  if (!normalizedDomain) {
    return {
      success: false,
      error: 'El nombre de dominio es obligatorio.'
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch('/api/domains/transfer-order.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        domain: normalizedDomain,
        auth_code: payload.auth_code?.trim() || '',
        auto_renew: Boolean(payload.auto_renew),
        customer: payload.customer
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    let data: any;
    try {
      data = await response.json();
    } catch {
      if (response.ok) {
        return {
          success: true,
          domain: normalizedDomain,
          status: 'Pending',
          message: 'Solicitud de transferencia recibida correctamente.'
        };
      }
      return {
        success: false,
        error: 'No fue posible iniciar la transferencia. Inténtalo nuevamente.'
      };
    }

    if (!response.ok || !data.success) {
      return {
        success: false,
        domain: normalizedDomain,
        status: data.status || 'Failed',
        error: data.error || data.message || 'No fue posible iniciar la transferencia.'
      };
    }

    return {
      success: true,
      domain: normalizedDomain,
      order_id: data.order_id || data.transfer_id || data.id,
      status: data.status || 'Pending',
      message: data.message || 'Solicitud de transferencia iniciada exitosamente.',
      requires_auth: Boolean(data.requires_auth)
    };
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError';
    return {
      success: false,
      domain: normalizedDomain,
      error: isTimeout
        ? 'La solicitud tardó más de lo esperado. Por favor verifica el estado en unos momentos.'
        : 'Error de conexión al procesar la transferencia.'
    };
  }
}

/**
 * 4. Actualiza o proporciona el Auth/EPP Code de forma segura:
 * POST /api/domains/transfer-auth.php
 * NUNCA se almacena en localStorage, sessionStorage ni en la URL.
 */
export async function updateTransferAuthCode(
  domain: string,
  authCode: string
): Promise<{ success: boolean; message: string; error?: string }> {
  const normalizedDomain = (domain || '').trim().toLowerCase();

  if (!normalizedDomain || !authCode.trim()) {
    return {
      success: false,
      message: 'El dominio y el código Auth/EPP son obligatorios.'
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch('/api/domains/transfer-auth.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        domain: normalizedDomain,
        auth_code: authCode.trim()
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    let data: any;
    try {
      data = await response.json();
    } catch {
      return {
        success: response.ok,
        message: response.ok
          ? 'Código Auth/EPP actualizado correctamente.'
          : 'No se pudo actualizar el código de autorización.'
      };
    }

    if (!response.ok || !data.success) {
      return {
        success: false,
        message: data.error || data.message || 'No fue posible guardar el código Auth/EPP.'
      };
    }

    return {
      success: true,
      message: data.message || 'Código Auth/EPP verificado y registrado.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Error de conexión al actualizar el Auth Code.'
    };
  }
}

/**
 * 5. Consulta el estado de una transferencia:
 * GET /api/domains/transfer-status.php?domain={domain} o ?order_id={id}
 */
export interface TransferStatusResult {
  success: boolean;
  domain?: string;
  order_id?: string | number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'unknown';
  rawStatus?: string;
  statusLabel: string;
  details?: string;
  updated_at?: string;
}

export async function getTransferStatus(
  identifier: { domain?: string; order_id?: string | number }
): Promise<TransferStatusResult> {
  const params = new URLSearchParams();
  if (identifier.domain) params.set('domain', identifier.domain.trim().toLowerCase());
  if (identifier.order_id) params.set('order_id', String(identifier.order_id));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`/api/domains/transfer-status.php?${params.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        domain: identifier.domain,
        status: 'unknown',
        statusLabel: 'Estado no disponible',
        details: 'No pudimos consultar el estado de la transferencia.'
      };
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      return {
        success: false,
        domain: identifier.domain,
        status: 'unknown',
        statusLabel: 'Respuesta inválida'
      };
    }

    const raw = (data.status || data.current_status || '').toLowerCase().trim();
    let normalizedStatus: TransferStatusResult['status'] = 'unknown';
    let label = 'Transferencia en revisión';

    if (raw.includes('pending') || raw.includes('waiting') || raw.includes('queued')) {
      normalizedStatus = 'pending';
      label = 'Transferencia pendiente';
    } else if (raw.includes('process') || raw.includes('progress') || raw.includes('transferring')) {
      normalizedStatus = 'processing';
      label = 'Transferencia en proceso';
    } else if (raw.includes('complete') || raw.includes('success') || raw.includes('approved')) {
      normalizedStatus = 'completed';
      label = 'Transferencia completada';
    } else if (raw.includes('fail') || raw.includes('reject') || raw.includes('error')) {
      normalizedStatus = 'failed';
      label = 'Transferencia no completada';
    } else if (raw.includes('cancel')) {
      normalizedStatus = 'cancelled';
      label = 'Transferencia cancelada';
    }

    return {
      success: true,
      domain: data.domain || identifier.domain,
      order_id: data.order_id || identifier.order_id,
      status: normalizedStatus,
      rawStatus: raw,
      statusLabel: label,
      details: data.message || data.details,
      updated_at: data.updated_at
    };
  } catch (err: any) {
    return {
      success: false,
      domain: identifier.domain,
      status: 'unknown',
      statusLabel: 'Sin conexión',
      details: 'Error de red al consultar el estado.'
    };
  }
}

/**
 * Traduce estados técnicos a etiquetas claras y comprensibles
 */
export function translateTransferStatus(status: string, language: 'es' | 'en' = 'es'): string {
  const s = (status || '').toLowerCase().trim();

  if (s.includes('pending')) {
    return language === 'en' ? 'Transfer pending' : 'Transferencia pendiente';
  }
  if (s.includes('process') || s.includes('progress')) {
    return language === 'en' ? 'Transfer in process' : 'Transferencia en proceso';
  }
  if (s.includes('complete') || s.includes('success')) {
    return language === 'en' ? 'Transfer completed' : 'Transferencia completada';
  }
  if (s.includes('fail') || s.includes('reject')) {
    return language === 'en' ? 'Transfer not completed' : 'Transferencia no completada';
  }
  if (s.includes('cancel')) {
    return language === 'en' ? 'Transfer cancelled' : 'Transferencia cancelada';
  }
  return language === 'en' ? 'Under review' : 'En revisión';
}
