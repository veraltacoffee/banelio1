import crypto from 'crypto';

/**
 * BANELIO - Autenticación Servidor a Servidor con el Puente PHP (IONOS)
 *
 * Utiliza firma HMAC-SHA256 con ventana de tolerancia de 300 segundos (5 min).
 * Clave compartida: PHP_BRIDGE_SECRET o RESELLER_BRIDGE_SECRET.
 * NUNCA se expone al cliente web ni se loguean secretos en texto plano.
 */

export function getBridgeSecret(): string {
  const secret = process.env.PHP_BRIDGE_SECRET || process.env.RESELLER_BRIDGE_SECRET || '';
  return secret.trim();
}

export function buildBridgeAuthHeaders(
  method: string,
  urlOrPath: string,
  rawBody: string = '',
  timestampSec: number = Math.floor(Date.now() / 1000),
  secretOverride?: string
): Record<string, string> {
  const secret = secretOverride !== undefined ? secretOverride : getBridgeSecret();
  if (!secret) {
    return {};
  }

  let path = urlOrPath;
  try {
    const parsed = new URL(urlOrPath, 'http://localhost');
    path = parsed.pathname;
  } catch {
    // Mantener path como string
  }

  const canonicalString = `${method.toUpperCase()}|${path}|${timestampSec}|${rawBody}`;
  const signature = crypto.createHmac('sha256', secret).update(canonicalString).digest('hex');

  return {
    'X-Banelio-Timestamp': String(timestampSec),
    'X-Banelio-Signature': signature
  };
}

export function verifyBridgeAuth(
  method: string,
  path: string,
  rawBody: string = '',
  timestampHeader?: string,
  signatureHeader?: string,
  secretOverride?: string,
  nowSec: number = Math.floor(Date.now() / 1000)
): { valid: boolean; error?: string } {
  const secret = secretOverride !== undefined ? secretOverride : getBridgeSecret();
  if (!secret) {
    return { valid: false, error: 'Configuración de seguridad del servidor no establecida.' };
  }

  if (!timestampHeader || !signatureHeader) {
    return { valid: false, error: 'Acceso denegado: firma de autenticación requerida.' };
  }

  const cleanTimestamp = timestampHeader.trim();
  if (!/^\d+$/.test(cleanTimestamp)) {
    return { valid: false, error: 'Acceso denegado: marca de tiempo inválida o expirada.' };
  }

  const timestamp = Number(cleanTimestamp);
  if (!Number.isFinite(timestamp) || Math.abs(nowSec - timestamp) > 300) {
    return { valid: false, error: 'Acceso denegado: marca de tiempo inválida o expirada.' };
  }

  const cleanSig = signatureHeader.trim();
  if (!/^[a-f0-9]{64}$/i.test(cleanSig)) {
    return { valid: false, error: 'Acceso denegado: firma de autenticación inválida.' };
  }

  let normalizedPath = path;
  try {
    const parsed = new URL(path, 'http://localhost');
    normalizedPath = parsed.pathname;
  } catch {}

  const canonicalString = `${method.toUpperCase()}|${normalizedPath}|${timestamp}|${rawBody}`;
  const expectedSig = crypto.createHmac('sha256', secret).update(canonicalString).digest('hex');

  const sigBuffer = Buffer.from(cleanSig, 'hex');
  const expectedBuffer = Buffer.from(expectedSig, 'hex');

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, error: 'Acceso denegado: firma de autenticación inválida.' };
  }

  return { valid: true };
}
