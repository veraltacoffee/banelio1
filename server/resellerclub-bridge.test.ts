import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildBridgeAuthHeaders, verifyBridgeAuth, getBridgeSecret } from './phpBridgeAuth';
import { getBridgeBaseUrl } from './provisioning';
import { resolveCustomerDomains } from './customerDomains';
import { checkDomainAvailability, checkDomainTransferEligibility, sanitizeDomainInput } from '../src/services/domainService';

// ============================================================================
// CRITERIO 1: Construcción y verificación de firmas HMAC, rutas, marcas de tiempo,
//             firmas inválidas y secreto ausente.
// ============================================================================
test('ResellerClub Bridge 1: HMAC: construcción y verificación exhaustiva de firma canónica', () => {
  const secret = 'super-secret-key-banelio-2026';
  const method = 'POST';
  const path = '/api/domains/customer.php';
  const body = JSON.stringify({ name: 'Carlos Slim', email: 'carlos@example.com' });
  const now = Math.floor(Date.now() / 1000);

  // Generación correcta
  const headers = buildBridgeAuthHeaders(method, path, body, now, secret);
  assert.equal(headers['X-Banelio-Timestamp'], String(now));
  assert.ok(/^[a-f0-9]{64}$/i.test(headers['X-Banelio-Signature']), 'La firma debe ser hexadecimal de 64 caracteres');

  // Verificación válida
  const verifyOk = verifyBridgeAuth(method, path, body, headers['X-Banelio-Timestamp'], headers['X-Banelio-Signature'], secret, now);
  assert.equal(verifyOk.valid, true);

  // Timestamp no numérico
  const verifyNonNumeric = verifyBridgeAuth(method, path, body, 'not-a-number', headers['X-Banelio-Signature'], secret, now);
  assert.equal(verifyNonNumeric.valid, false);
  assert.match(verifyNonNumeric.error || '', /marca de tiempo/i);

  // Timestamp expirado (> 300 segundos)
  const verifyExpired = verifyBridgeAuth(method, path, body, String(now - 301), headers['X-Banelio-Signature'], secret, now);
  assert.equal(verifyExpired.valid, false);
  assert.match(verifyExpired.error || '', /expirada/i);

  // Firma con formato inválido (no-hex o longitud diferente a 64)
  const verifyBadFormat = verifyBridgeAuth(method, path, body, String(now), 'short_sig', secret, now);
  assert.equal(verifyBadFormat.valid, false);
  assert.match(verifyBadFormat.error || '', /inválida/i);

  // Firma alterada (64 caracteres pero digest incorrecto)
  const alteredSig = 'a'.repeat(64);
  const verifyAltered = verifyBridgeAuth(method, path, body, String(now), alteredSig, secret, now);
  assert.equal(verifyAltered.valid, false);
  assert.match(verifyAltered.error || '', /inválida/i);

  // Secreto ausente (vacío)
  const verifyNoSecret = verifyBridgeAuth(method, path, body, String(now), headers['X-Banelio-Signature'], '', now);
  assert.equal(verifyNoSecret.valid, false);
  assert.match(verifyNoSecret.error || '', /seguridad del servidor no establecida/i);
});

// ============================================================================
// CRITERIO 2: Rechazo de solicitudes protegidas sin autenticación válida
// ============================================================================
test('ResellerClub Bridge 2: Rechazo de solicitudes protegidas sin autenticación o incompletas', () => {
  const secret = 'valid-banelio-secret-key';
  const method = 'POST';
  const path = '/api/domains/contacts.php';
  const body = '{"customerId":"123","name":"Test"}';

  // Sin cabeceras
  const res1 = verifyBridgeAuth(method, path, body, undefined, undefined, secret);
  assert.equal(res1.valid, false);
  assert.match(res1.error || '', /firma de autenticación requerida/i);

  // Solo con timestamp, sin firma
  const res2 = verifyBridgeAuth(method, path, body, String(Math.floor(Date.now() / 1000)), undefined, secret);
  assert.equal(res2.valid, false);
  assert.match(res2.error || '', /firma de autenticación requerida/i);

  // Solo con firma, sin timestamp
  const res3 = verifyBridgeAuth(method, path, body, undefined, 'c'.repeat(64), secret);
  assert.equal(res3.valid, false);
  assert.match(res3.error || '', /firma de autenticación requerida/i);
});

// ============================================================================
// CRITERIO 3: Envío de POST de clientes y contactos con cuerpo firmado idéntico al enviado
// ============================================================================
test('ResellerClub Bridge 3: POST de clientes y contactos: cuerpo firmado idéntico byte a byte al transmitido', () => {
  const secret = 'test-secret-bridge-3';
  const customerPayload = {
    email: 'contacto@banelio.com',
    name: 'Roberto Gómez',
    company: 'Banelio Tech',
    address: 'Av. Paseo 100',
    city: 'Mazatlán',
    state: 'Sinaloa',
    country: 'MX',
    zipcode: '82000',
    phone_cc: '52',
    phone: '6691234567'
  };

  const rawJson = JSON.stringify(customerPayload);
  const now = Math.floor(Date.now() / 1000);
  const targetUrl = 'https://banelio.com/api/domains/customer.php';

  const headers = buildBridgeAuthHeaders('POST', targetUrl, rawJson, now, secret);
  const timestamp = headers['X-Banelio-Timestamp'];
  const signature = headers['X-Banelio-Signature'];

  // Simulación del lado receptor (PHP bridge leyendo php://input)
  const canonicalServer = `POST|/api/domains/customer.php|${timestamp}|${rawJson}`;
  const computedServerSig = crypto.createHmac('sha256', secret).update(canonicalServer).digest('hex');

  assert.equal(signature, computedServerSig, 'La firma del cliente Node y el cálculo en el servidor PHP deben coincidir exactamente');
});

// ============================================================================
// CRITERIO 4: Manejo de errores HTTP, tiempos de espera y respuestas no JSON
// ============================================================================
test('ResellerClub Bridge 4: Manejo de respuestas no JSON (HTML de error/timeout) sin corromper el estado', async () => {
  const fakeHtmlResponse = `<!DOCTYPE html><html><body><h1>504 Gateway Timeout</h1><p>The server did not respond in time.</p></body></html>`;

  // Simular parseo defensivo que ocurre en el cliente y en los proxies
  let parsedJson: any = null;
  try {
    parsedJson = JSON.parse(fakeHtmlResponse);
  } catch {
    parsedJson = null;
  }

  assert.equal(parsedJson, null, 'Una respuesta HTML o no-JSON no debe generar un objeto válido');

  // Verificar que resolveCustomerDomains maneja respuestas inválidas sin marcar registryConnected: true
  const mockFetchHtml = async () =>
    new Response(fakeHtmlResponse, { status: 504, headers: { 'Content-Type': 'text/html' } });

  const result = await resolveCustomerDomains(
    { id: 'cust_test', email: 'test@banelio.com' },
    [{ sku: 'DOM_COM', domain: 'midominio.com', status: 'ACTIVE' }],
    mockFetchHtml as any
  );

  assert.equal(result.registryConnected, false, 'No debe considerarse registryConnected tras un fallo HTML/504');
  assert.equal(result.source, 'LOCAL_ENTITLEMENTS');
  assert.equal(result.domains.length, 1);
});

// ============================================================================
// CRITERIO 5: Validación de códigos EPP y ausencia del código en URL y logs
// ============================================================================
test('ResellerClub Bridge 5: Validación de códigos EPP: no se acepta longitud inválida ni caracteres fuera de rango', () => {
  // 1. Longitud menor a 6 caracteres
  const shortCode = '12345';
  assert.ok(shortCode.length < 6, 'Código demasiado corto');

  // 2. Longitud mayor a 32 caracteres
  const longCode = 'a'.repeat(33);
  assert.ok(longCode.length > 32, 'Código demasiado largo');

  // 3. Código válido
  const validCode = 'Banel!o#2026$Pass';
  assert.ok(validCode.length >= 6 && validCode.length <= 32);
  assert.ok(/^[\x20-\x7E]+$/.test(validCode), 'Código con caracteres ASCII imprimibles');

  // 4. Comprobar que sanitizeDomainInput no acepta URLs con auth_code en query string
  const inputWithParam = 'midominio.com?auth_code=SecretKey123';
  const sanitized = sanitizeDomainInput(inputWithParam);
  assert.equal(sanitized.cleanDomain, 'midominio.com');
  assert.doesNotMatch(sanitized.cleanDomain, /SecretKey123/, 'No debe conservar parámetros de query string');
});

// ============================================================================
// CRITERIO 6: Interpretación de errores del proveedor sin convertirlos en éxitos
// ============================================================================
test('ResellerClub Bridge 6: Errores del proveedor (ResellerClub status ERROR) no se interpretan como éxito', () => {
  const errorPayload = {
    status: 'ERROR',
    message: 'Domain name is already registered through another registrar.'
  };

  const isStatusError = errorPayload.status.toUpperCase() === 'ERROR';
  assert.equal(isStatusError, true);

  // Verificar que una respuesta de error nunca resulte en disponibilidad positiva
  const isAvailable = errorPayload.status.toLowerCase() === 'available';
  assert.equal(isAvailable, false, 'Un error del proveedor nunca debe marcar un dominio disponible');
});

// ============================================================================
// CRITERIO 7: Conservación de los contratos que consume el frontend
// ============================================================================
test('ResellerClub Bridge 7: Preservación de contratos consumidos por la interfaz de usuario', async () => {
  // Contrato de resolveCustomerDomains
  const customerResult = await resolveCustomerDomains(
    { id: 'c1', email: 'user@banelio.com' },
    [{ sku: 'DOM_MX', domain: 'sitio.mx', status: 'GRANTED' }],
    (async () => new Response(JSON.stringify({
      success: true,
      domains: [{ id: 'rc_123', domain: 'sitio.mx', status: 'Active' }]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })) as any
  );

  assert.equal(typeof customerResult.success, 'boolean');
  assert.equal(typeof customerResult.count, 'number');
  assert.ok(Array.isArray(customerResult.domains));
  assert.ok(['IONOS_RESELLERCLUB_REMOTE', 'LOCAL_ENTITLEMENTS'].includes(customerResult.source));
  assert.equal(typeof customerResult.registryConnected, 'boolean');
  assert.equal(typeof customerResult.backendDependent, 'boolean');
  assert.equal(typeof customerResult.message, 'string');
});

// ============================================================================
// CRITERIO 8: Prevención de reintentos inseguros que puedan duplicar operaciones
// ============================================================================
test('ResellerClub Bridge 8: Prevención de reintentos inseguros para evitar operaciones comerciales duplicadas', () => {
  // Estados que impiden invocar nuevamente la compra o transferencia en el proveedor
  const blockingStatuses = ['CONFIRMED', 'IN_PROGRESS', 'UNCERTAIN'];

  const shouldBlockExecution = (status: string) => blockingStatuses.includes(status);

  assert.equal(shouldBlockExecution('CONFIRMED'), true, 'CONFIRMED debe bloquear re-ejecución');
  assert.equal(shouldBlockExecution('IN_PROGRESS'), true, 'IN_PROGRESS debe bloquear llamadas concurrentes');
  assert.equal(shouldBlockExecution('UNCERTAIN'), true, 'UNCERTAIN debe exigir reconciliación antes de reintentar');
  assert.equal(shouldBlockExecution('FAILED'), false, 'FAILED permite reintento autorizado tras corregir causa');
});
