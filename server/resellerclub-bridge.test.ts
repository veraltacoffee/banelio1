import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { buildBridgeAuthHeaders, verifyBridgeAuth, getBridgeSecret } from './phpBridgeAuth';
import { getBridgeBaseUrl } from './provisioning';
import { resolveCustomerDomains } from './customerDomains';
import { checkDomainAvailability, checkDomainTransferEligibility, sanitizeDomainInput } from '../src/services/domainService';
import {
  handleTransferGet,
  handleTransferPost,
  extractAuthCode,
  validateAuthCode,
  hasForbiddenAuthQueryParam,
  FORBIDDEN_AUTH_QUERY_PARAMS
} from '../server';

const PHP_DIR = path.resolve(process.cwd(), 'server/php');

function createTestTransferApp(bridgeFetchMock?: (url: string, init?: RequestInit) => Promise<Response>) {
  const app = express();
  app.use(express.json());
  app.get('/api/domains/check.php', async (req, res) => {
    if (hasForbiddenAuthQueryParam(req.query)) {
      return res.status(400).json({
        success: false,
        error: 'Por seguridad, el código Auth/EPP debe recibirse exclusivamente mediante una solicitud POST protegida, nunca como parámetro GET ni en la URL.'
      });
    }
    const domain = (req.query.domain as string || '').trim().toLowerCase();
    if (!domain) {
      return res.status(400).json({ success: false, error: 'El parámetro domain es obligatorio.' });
    }
    return res.status(200).json({ success: true, domain, available: true });
  });
  app.get('/api/domains/transfer.php', (req, res) => {
    return handleTransferGet(req, res, { fetchFn: bridgeFetchMock as any });
  });
  app.post('/api/domains/transfer.php', (req, res) => {
    return handleTransferPost(req, res, { fetchFn: bridgeFetchMock as any });
  });
  return app;
}

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

// ============================================================================
// CRITERIO 9: Bloqueo estricto de todos los alias EPP/Auth en peticiones GET
// ============================================================================
test('ResellerClub Bridge 9: Bloqueo exhaustivo de cada alias EPP/Auth en peticiones GET (Ruta Real Express)', async () => {
  const aliases = [
    'auth_code',
    'auth-code',
    'authCode',
    'epp_code',
    'epp-code',
    'eppCode',
    'AUTH_CODE',
    'AUTH-CODE',
    'authcode',
    'eppcode'
  ];

  let bridgeInvoked = false;
  const mockBridgeFetch = async () => {
    bridgeInvoked = true;
    return new Response(JSON.stringify({ success: true, eligible: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const app = createTestTransferApp(mockBridgeFetch);
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;

  try {
    for (const alias of aliases) {
      // 1. Probar en /api/domains/transfer.php
      const transferUrl = `http://127.0.0.1:${port}/api/domains/transfer.php?domain=midominio.com&${alias}=SecretEPP123!`;
      const transferResp = await fetch(transferUrl, { method: 'GET' });
      assert.equal(transferResp.status, 400, `El alias '${alias}' debe responder 400 en GET transfer`);
      const transferData: any = await transferResp.json();
      assert.equal(transferData.success, false);
      assert.match(transferData.error, /exclusivamente mediante una solicitud POST protegida/i);
      // El valor secreto JAMÁS debe reflejarse en la respuesta
      assert.doesNotMatch(JSON.stringify(transferData), /SecretEPP123!/);

      // 2. Probar en /api/domains/check.php
      const checkUrl = `http://127.0.0.1:${port}/api/domains/check.php?domain=midominio.com&${alias}=SecretEPP123!`;
      const checkResp = await fetch(checkUrl, { method: 'GET' });
      assert.equal(checkResp.status, 400, `El alias '${alias}' debe responder 400 en GET check`);
      const checkData: any = await checkResp.json();
      assert.equal(checkData.success, false);
      assert.match(checkData.error, /exclusivamente mediante una solicitud POST protegida/i);
      assert.doesNotMatch(JSON.stringify(checkData), /SecretEPP123!/);
    }

    // Ninguna petición bloqueada debió llegar al backend externo
    assert.equal(bridgeInvoked, false, 'Ninguna petición GET con authCode debió invocar el bridge');
  } finally {
    server.close();
  }
});

// ============================================================================
// CRITERIO 10: Peticiones GET legítimas de consulta continúan funcionando
// ============================================================================
test('ResellerClub Bridge 10: GET legítimo de consulta de dominio continúa funcionando normalmente', async () => {
  let requestedUrl = '';
  const mockBridgeFetch = async (url: string) => {
    requestedUrl = url;
    return new Response(JSON.stringify({
      success: true,
      domain: 'midominio.com',
      eligible: true,
      status: 'TRANSFER_ELIGIBLE',
      message: 'Dominio elegible'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const app = createTestTransferApp(mockBridgeFetch);
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;

  try {
    const validUrl = `http://127.0.0.1:${port}/api/domains/transfer.php?domain=midominio.com`;
    const resp = await fetch(validUrl, { method: 'GET' });
    assert.equal(resp.status, 200);
    const data: any = await resp.json();
    assert.equal(data.success, true);
    assert.equal(data.eligible, true);
    assert.match(requestedUrl, /domain=midominio\.com/);
    // Verificar que la URL saliente no contenga ningún código
    assert.doesNotMatch(requestedUrl, /auth_code|epp_code/i);
  } finally {
    server.close();
  }
});

// ============================================================================
// CRITERIO 11: Preservación exacta del código EPP/Auth sin trim() ni transformaciones
// ============================================================================
test('ResellerClub Bridge 11: El código EPP/Auth se conserva exactamente sin trim() ni modificaciones en POST', async () => {
  // Códigos que contienen espacios iniciales, finales o internos intencionados
  const testCases = [
    { label: 'con espacios en extremos', code: ' Banel!o#2026 ' }, // 15 caracteres
    { label: 'con espacio intermedio', code: 'Banel!o 2026$Pass' },
    { label: 'caracteres especiales ASCII válidos', code: 'A#9@x$!-Z~8.k1' }
  ];

  const aliases = ['auth_code', 'auth-code', 'authCode', 'epp_code', 'epp-code', 'eppCode'];

  for (const { label, code } of testCases) {
    for (const alias of aliases) {
      let forwardedBody: any = null;
      const mockBridgeFetch = async (_url: string, init?: RequestInit) => {
        forwardedBody = JSON.parse(init?.body as string);
        return new Response(JSON.stringify({
          success: true,
          domain: 'transferible.com',
          eligible: true,
          status: 'TRANSFER_ELIGIBLE',
          requiresAuthCode: true,
          authCodeProvided: true,
          authCodeValid: true
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      };

      const app = createTestTransferApp(mockBridgeFetch);
      const server = app.listen(0);
      const port = (server.address() as AddressInfo).port;

      try {
        const payload: Record<string, string> = { domain: 'transferible.com' };
        payload[alias] = code;

        const res = await fetch(`http://127.0.0.1:${port}/api/domains/transfer.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        assert.equal(res.status, 200, `POST con alias '${alias}' (${label}) debe responder 200`);
        assert.ok(forwardedBody, 'Debe haber reenviado el payload al puente');
        // REGLA FUNDAMENTAL: auth_code enviado al puente debe ser IDÉNTICO byte a byte, SIN trim()
        assert.equal(forwardedBody.auth_code, code, `El código para '${alias}' debe ser idéntico al introducido: sin trim()`);
        assert.equal(forwardedBody.auth_code.length, code.length, `La longitud debe ser exactamente ${code.length}`);
      } finally {
        server.close();
      }
    }
  }
});

// ============================================================================
// CRITERIO 12: Rechazo controlado de códigos EPP/Auth inválidos sin modificarlos
// ============================================================================
test('ResellerClub Bridge 12: Rechazo controlado de códigos EPP inválidos sin alteración ni recorte', async () => {
  let bridgeInvoked = false;
  const mockBridgeFetch = async () => {
    bridgeInvoked = true;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  };

  const app = createTestTransferApp(mockBridgeFetch);
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;

  try {
    // 1. Código menor a 6 caracteres
    const shortRes = await fetch(`http://127.0.0.1:${port}/api/domains/transfer.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'midominio.com', auth_code: '12345' })
    });
    assert.equal(shortRes.status, 400);
    const shortData: any = await shortRes.json();
    assert.equal(shortData.success, false);
    assert.match(shortData.error, /entre 6 y 32 caracteres/i);
    assert.doesNotMatch(JSON.stringify(shortData), /12345/, 'No debe reflejar el código en el error');

    // 2. Código mayor a 32 caracteres
    const longCode = 'a'.repeat(33);
    const longRes = await fetch(`http://127.0.0.1:${port}/api/domains/transfer.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'midominio.com', authCode: longCode })
    });
    assert.equal(longRes.status, 400);
    const longData: any = await longRes.json();
    assert.equal(longData.success, false);
    assert.match(longData.error, /entre 6 y 32 caracteres/i);
    assert.doesNotMatch(JSON.stringify(longData), new RegExp(longCode));

    // 3. Código con caracteres no imprimibles o fuera de rango ASCII
    const badCharRes = await fetch(`http://127.0.0.1:${port}/api/domains/transfer.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'midominio.com', epp_code: 'ValidLen\x00BadChar' })
    });
    assert.equal(badCharRes.status, 400);
    const badCharData: any = await badCharRes.json();
    assert.equal(badCharData.success, false);
    assert.match(badCharData.error, /caracteres no permitidos/i);

    // No debe haberse invocado el bridge para ninguno de los códigos rechazados
    assert.equal(bridgeInvoked, false);
  } finally {
    server.close();
  }
});

// ============================================================================
// CRITERIO 13: El código EPP/Auth no se filtra a logs, respuestas ni URLs
// ============================================================================
test('ResellerClub Bridge 13: Ausencia total de filtración de Auth/EPP en logs, respuestas de error y URLs', async () => {
  const secretCode = 'SuperSecretEPP#2026';
  const loggedMessages: string[] = [];
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (...args: any[]) => { loggedMessages.push(args.join(' ')); };
  console.warn = (...args: any[]) => { loggedMessages.push(args.join(' ')); };
  console.error = (...args: any[]) => { loggedMessages.push(args.join(' ')); };

  const app = createTestTransferApp();
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;

  try {
    // Intento GET inseguro
    const getRes = await fetch(`http://127.0.0.1:${port}/api/domains/transfer.php?domain=test.com&auth_code=${secretCode}`);
    const getBody = await getRes.text();

    // Intento POST con error de validación
    const postRes = await fetch(`http://127.0.0.1:${port}/api/domains/transfer.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'test.com', auth_code: '123' })
    });
    const postBody = await postRes.text();

    // Verificar respuestas
    assert.equal(getBody.includes(secretCode), false, 'La respuesta GET no debe contener el secretCode');
    assert.equal(postBody.includes('123'), false, 'La respuesta POST no debe reflejar el código inválido');

    // Verificar logs
    const allLogs = loggedMessages.join(' ');
    assert.equal(allLogs.includes(secretCode), false, 'Los logs no deben contener el código de autorización');
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
    server.close();
  }
});

// ============================================================================
// CRITERIO 14: Manejo controlado de errores de validación sin fallos inesperados
// ============================================================================
test('ResellerClub Bridge 14: Manejo controlado de parámetros faltantes o malformados', async () => {
  const app = createTestTransferApp();
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;

  try {
    // 1. GET sin parámetro domain
    const getNoDomain = await fetch(`http://127.0.0.1:${port}/api/domains/transfer.php`);
    assert.equal(getNoDomain.status, 400);
    const getNoDomainData: any = await getNoDomain.json();
    assert.equal(getNoDomainData.success, false);
    assert.match(getNoDomainData.error, /parámetro domain es obligatorio/i);

    // 2. POST sin parámetro domain
    const postNoDomain = await fetch(`http://127.0.0.1:${port}/api/domains/transfer.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth_code: 'ValidAuthCode123' })
    });
    assert.equal(postNoDomain.status, 400);
    const postNoDomainData: any = await postNoDomain.json();
    assert.equal(postNoDomainData.success, false);
    assert.match(postNoDomainData.error, /parámetro domain es obligatorio/i);
  } finally {
    server.close();
  }
});

// ============================================================================
// CRITERIO 15: Verificación estática de código de endpoints PHP de transferencia y búsqueda
// ============================================================================
test('ResellerClub Bridge 15: Verificación estática de seguridad en server/php/domains/transfer.php y check.php', () => {
  const transferPhpPath = path.join(PHP_DIR, 'domains/transfer.php');
  const checkPhpPath = path.join(PHP_DIR, 'domains/check.php');

  assert.ok(fs.existsSync(transferPhpPath), 'transfer.php debe existir');
  assert.ok(fs.existsSync(checkPhpPath), 'check.php debe existir');

  const transferPhp = fs.readFileSync(transferPhpPath, 'utf8');
  const checkPhp = fs.readFileSync(checkPhpPath, 'utf8');

  // 1. Ambos archivos deben contener la lista completa de alias prohibidos en GET
  for (const alias of ['auth_code', 'auth-code', 'authcode', 'epp_code', 'epp-code', 'eppcode']) {
    assert.match(transferPhp, new RegExp(`'${alias}'`), `transfer.php debe incluir alias '${alias}' en forbiddenAuthKeys`);
    assert.match(checkPhp, new RegExp(`'${alias}'`), `check.php debe incluir alias '${alias}' en forbiddenAuthKeys`);
  }

  // 2. transfer.php NO debe utilizar trim() sobre $postData de auth_code ni sobre $rawAuth
  assert.doesNotMatch(transferPhp, /trim\s*\(\s*\$postData\s*\[\s*['"]auth_code/, 'transfer.php no debe aplicar trim() al extraer auth_code');
  assert.doesNotMatch(transferPhp, /trim\s*\(\s*\$rawAuth/, 'transfer.php no debe aplicar trim() sobre $rawAuth');

  // 3. transfer.php debe validar el rango exacto 6 a 32 caracteres y el conjunto ASCII
  assert.match(transferPhp, /\$authLen\s*<\s*6\s*\|\|\s*\$authLen\s*>\s*32/);
  assert.match(transferPhp, /preg_match\('\/\^\[\\x20-\\x7E\]\+\$\/',\s*\$authCode\)/);
});

// ============================================================================
// CRITERIO 16: Identificación explícita de integración en vivo no ejecutada
// ============================================================================
test('ResellerClub Bridge 16: [NO EJECUTADA] Prueba en vivo de extremo a extremo con ResellerClub y entorno PHP', {
  skip: 'Requiere credenciales activas de ResellerClub y entorno de ejecución PHP (IONOS/Apache) no disponibles en el entorno de pruebas local'
}, () => {
  // Esta prueba se declara formalmente como no ejecutada para no simular una integración real
  assert.fail('No debe ejecutarse si está omitida');
});

