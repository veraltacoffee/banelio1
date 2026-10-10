import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { buildBridgeAuthHeaders } from './phpBridgeAuth';

const PHP_DIR = path.resolve(process.cwd(), 'server/php');

test('PHP Security 1: Archivos de biblioteca config.php y client.php tienen bloqueo de ejecución HTTP directa', () => {
  const configContent = fs.readFileSync(path.join(PHP_DIR, 'reseller/config.php'), 'utf8');
  const clientContent = fs.readFileSync(path.join(PHP_DIR, 'reseller/client.php'), 'utf8');

  assert.match(configContent, /SCRIPT_FILENAME.*SCRIPT_FILENAME.*Acceso directo denegado/s, 'config.php debe bloquear acceso directo');
  assert.match(clientContent, /SCRIPT_FILENAME.*SCRIPT_FILENAME.*Acceso directo denegado/s, 'client.php debe bloquear acceso directo');
});

test('PHP Security 2: Ningún endpoint PHP en el alcance devuelve $e->getMessage() sin sanitizar', () => {
  const targetFiles = [
    'reseller/test-connection.php',
    'domains/my-domains.php',
    'domains/customer.php',
    'domains/contacts.php',
    'domains/provision.php',
    'domains/transfer.php'
  ];

  for (const relPath of targetFiles) {
    const fullPath = path.join(PHP_DIR, relPath);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');
    assert.doesNotMatch(content, /'error'\s*=>\s*\$e->getMessage\(\)/, `${relPath} no debe devolver \$e->getMessage() sin filtrar`);
    assert.match(content, /sanitize_exception_message/, `${relPath} debe utilizar sanitize_exception_message`);
  }
});

test('PHP Security 3: client.php no expone $curlError ni rutas internas en excepciones de cURL', () => {
  const clientContent = fs.readFileSync(path.join(PHP_DIR, 'reseller/client.php'), 'utf8');
  assert.doesNotMatch(clientContent, /\$curlError/, 'client.php no debe interpolar $curlError en excepciones');
  assert.match(clientContent, /No fue posible establecer conexión con el proveedor mayorista/, 'client.php debe usar mensaje genérico seguro');
});

test('PHP Security 4: provision.php no expone payloads sin filtrar ("raw" => $resellerResponse)', () => {
  const provisionContent = fs.readFileSync(path.join(PHP_DIR, 'domains/provision.php'), 'utf8');
  assert.doesNotMatch(provisionContent, /'raw'\s*=>\s*\$resellerResponse/, 'provision.php no debe incluir "raw" => $resellerResponse');
  assert.match(provisionContent, /translate_resellerclub_error/, 'provision.php debe traducir errores con translate_resellerclub_error');
});

test('PHP Security 5: my-domains.php distingue errores de infraestructura de consultas válidas de 0 dominios', () => {
  const myDomainsContent = fs.readFileSync(path.join(PHP_DIR, 'domains/my-domains.php'), 'utf8');
  assert.match(myDomainsContent, /if\s*\(!\$client->isConfigured\(\)\)/, 'my-domains.php debe validar credenciales antes de procesar');
  assert.match(myDomainsContent, /errCode === 502 \|\| \$errCode === 503 \|\| \$errCode === 401/, 'my-domains.php no debe convertir errores 502/503/401 en 0 dominios');
});

test('PHP Security 6: Reglas .htaccess existen y bloquean archivos sensibles (.env, .local.php, config.php, client.php, .json)', () => {
  const rootHtaccessPath = path.join(PHP_DIR, '.htaccess');
  const resellerHtaccessPath = path.join(PHP_DIR, 'reseller/.htaccess');

  assert.ok(fs.existsSync(rootHtaccessPath), 'Debe existir server/php/.htaccess');
  assert.ok(fs.existsSync(resellerHtaccessPath), 'Debe existir server/php/reseller/.htaccess');

  const rootHtaccess = fs.readFileSync(rootHtaccessPath, 'utf8');
  assert.match(rootHtaccess, /Options -Indexes/, 'Debe desactivar Indexes');
  assert.match(rootHtaccess, /local.*php/i, 'Debe bloquear archivos local.php');
  assert.match(rootHtaccess, /config.*client/, 'Debe bloquear config.php y client.php');
  assert.match(rootHtaccess, /Require all denied/, 'Debe contener directivas Apache 2.4');
  assert.match(rootHtaccess, /Deny from all/, 'Debe contener directivas Apache 2.2 compat');

  const resellerHtaccess = fs.readFileSync(resellerHtaccessPath, 'utf8');
  assert.match(resellerHtaccess, /test-connection\.php/, 'Debe permitir solo test-connection.php');
});

test('PHP Security 7: .gitignore protege config.local.php y variantes locales contra commits accidentales', () => {
  const gitignore = fs.readFileSync(path.resolve(process.cwd(), '.gitignore'), 'utf8');
  assert.match(gitignore, /config\.local\.php/, '.gitignore debe incluir config.local.php');
  assert.match(gitignore, /\*\.local\.php/, '.gitignore debe incluir *.local.php');
});

test('PHP Security 8: Compatibilidad estricta de firma HMAC-SHA256 entre Node y el puente PHP', () => {
  const secret = 'test-secret-banelio-hmac-12345';
  process.env.PHP_BRIDGE_SECRET = secret;

  const url = 'https://banelio.com/api/domains/my-domains.php?email=usuario@test.com&customer_id=123';
  const body = '';
  const headers = buildBridgeAuthHeaders('GET', url, body);

  const timestamp = headers['X-Banelio-Timestamp'];
  const signature = headers['X-Banelio-Signature'];

  assert.ok(timestamp, 'Debe generar X-Banelio-Timestamp');
  assert.ok(signature, 'Debe generar X-Banelio-Signature');

  // Simular la verificación canónica implementada en config.php
  const uriPath = '/api/domains/my-domains.php';
  const canonical = `GET|${uriPath}|${timestamp}|${body}`;
  const expectedSig = crypto.createHmac('sha256', secret).update(canonical).digest('hex');

  assert.equal(signature, expectedSig, 'La firma generada en Node.js debe coincidir con la calculada en PHP config.php');
});
