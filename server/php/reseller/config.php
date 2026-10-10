<?php
/**
 * BANELIO - Configuración Centralizada de ResellerClub
 * Archivo: server/php/reseller/config.php
 *
 * Administra credenciales y entorno sin exponer secretos al navegador.
 */

// Bloqueo estricto de acceso HTTP directo a este archivo de biblioteca
if (isset($_SERVER['SCRIPT_FILENAME']) && realpath($_SERVER['SCRIPT_FILENAME']) === realpath(__FILE__)) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'error' => 'Acceso directo denegado.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!defined('BANELIO_BRIDGE_LOADED')) {
    define('BANELIO_BRIDGE_LOADED', true);
}

// 1. Manejo estricto de CORS para Banelio
function apply_banelio_cors() {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    $allowedOrigins = [
        'https://banelio.com',
        'https://www.banelio.com',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ];

    if (in_array($origin, $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: {$origin}");
        header('Access-Control-Allow-Credentials: true');
    } else {
        header('Access-Control-Allow-Origin: https://banelio.com');
    }

    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With, User-Agent, X-Banelio-Signature, X-Banelio-Timestamp');
    header('Content-Type: application/json; charset=utf-8');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

// 2. Helper de respuesta JSON estandarizada
function send_json_response($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// 2a. Carga segura y unificada de configuración local
function load_banelio_local_config() {
    static $loaded = false;
    if ($loaded) return;
    $loaded = true;

    // 1. Intentar cargar desde un directorio superior fuera de la raíz web pública (óptimo en IONOS)
    $parentPath = dirname(__DIR__, 2) . '/config.local.php';
    if (file_exists($parentPath)) {
        require_once $parentPath;
        return;
    }

    // 2. Cargar desde el directorio reseller local (protegido por .htaccess)
    $localConfigPath = __DIR__ . '/config.local.php';
    if (file_exists($localConfigPath)) {
        require_once $localConfigPath;
    }
}

// 2b. Traducción segura de errores de ResellerClub a mensajes limpios para clientes
function translate_resellerclub_error($rawMsg) {
    if (empty($rawMsg) || !is_string($rawMsg)) {
        return 'Error en la operación solicitada al proveedor mayorista.';
    }

    $rawLower = strtolower($rawMsg);

    // Mapeo seguro a mensajes en español sin exponer datos internos
    if (strpos($rawLower, 'domain already registered') !== false || strpos($rawLower, 'already registered') !== false) {
        return 'El dominio ya se encuentra registrado.';
    }
    if (strpos($rawLower, 'invalid domain') !== false || strpos($rawLower, 'domain name is invalid') !== false) {
        return 'El nombre de dominio es inválido o no está soportado.';
    }
    if (strpos($rawLower, 'invalid customer') !== false || strpos($rawLower, 'customer does not exist') !== false) {
        return 'El cliente especificado no existe o es inválido en el proveedor.';
    }
    if (strpos($rawLower, 'auth code') !== false || strpos($rawLower, 'secret key') !== false || strpos($rawLower, 'epp') !== false) {
        return 'El código Auth/EPP proporcionado es incorrecto o inválido.';
    }
    if (strpos($rawLower, 'locked') !== false || strpos($rawLower, 'transfer prohibited') !== false) {
        return 'El dominio se encuentra bloqueado para transferencias en el registrador actual.';
    }
    if (strpos($rawLower, 'contact') !== false && (strpos($rawLower, 'invalid') !== false || strpos($rawLower, 'missing') !== false)) {
        return 'Los datos de contacto WHOIS son inválidos o incompletos.';
    }
    if (strpos($rawLower, 'phone') !== false || strpos($rawLower, 'tel-no') !== false) {
        return 'El formato del número telefónico o código de país es inválido.';
    }
    if (strpos($rawLower, 'insufficient funds') !== false || strpos($rawLower, 'balance') !== false) {
        return 'Operación no disponible temporalmente en el proveedor mayorista.';
    }

    // Filtrar fugas técnicas (rutas, curl, php, trazas de pila)
    if (stripos($rawMsg, 'curl') !== false ||
        stripos($rawMsg, 'httpapi.com') !== false ||
        stripos($rawMsg, 'stack trace') !== false ||
        stripos($rawMsg, 'exception') !== false ||
        stripos($rawMsg, '.php') !== false ||
        stripos($rawMsg, 'sql') !== false ||
        stripos($rawMsg, 'database') !== false ||
        stripos($rawMsg, 'path') !== false) {
        return 'Error en el procesamiento del proveedor mayorista.';
    }

    // Sanitizar longitud y caracteres especiales
    $clean = strip_tags($rawMsg);
    $clean = preg_replace('/[^\p{L}\p{N}\s\.\,\-\_\:\?\!\(\)]/u', '', $clean);
    $clean = trim($clean);
    if (strlen($clean) > 160) {
        $clean = substr($clean, 0, 160) . '...';
    }

    return !empty($clean) ? $clean : 'Error en la operación solicitada al proveedor mayorista.';
}

// 2c. Sanitizador general de excepciones para evitar fugas de información
function sanitize_exception_message(Exception $e, $defaultMessage = 'Error en el procesamiento del proveedor mayorista.') {
    $code = $e->getCode();

    if ($code === 503) {
        return 'Servicio de integración temporalmente no disponible.';
    }
    if ($code === 502) {
        return 'No fue posible establecer comunicación con el proveedor del registro de dominios.';
    }
    if ($code === 401 || $code === 403) {
        return 'Error de autenticación o autorización con el proveedor.';
    }
    if ($code === 404) {
        return 'El recurso solicitado no fue encontrado en el proveedor.';
    }
    if ($code === 400) {
        return translate_resellerclub_error($e->getMessage());
    }

    return $defaultMessage;
}

// 2d. Resolución de clave compartida HMAC servidor a servidor
function get_bridge_secret() {
    load_banelio_local_config();

    $secret = defined('PHP_BRIDGE_SECRET') ? PHP_BRIDGE_SECRET : (
        defined('RESELLER_BRIDGE_SECRET') ? RESELLER_BRIDGE_SECRET : (
            getenv('PHP_BRIDGE_SECRET') ?: (
                getenv('RESELLER_BRIDGE_SECRET') ?: ''
            )
        )
    );
    return trim((string)$secret);
}

// 2e. Verificación estricta de autenticación HMAC-SHA256 (Server-to-Server)
function verify_banelio_bridge_auth() {
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        return true;
    }

    $secret = get_bridge_secret();
    if (empty($secret)) {
        send_json_response([
            'success' => false,
            'error' => 'Configuración de seguridad del servidor no establecida.'
        ], 503);
    }

    $timestamp = isset($_SERVER['HTTP_X_BANELIO_TIMESTAMP']) ? trim((string)$_SERVER['HTTP_X_BANELIO_TIMESTAMP']) : '';
    $receivedSig = isset($_SERVER['HTTP_X_BANELIO_SIGNATURE']) ? trim((string)$_SERVER['HTTP_X_BANELIO_SIGNATURE']) : '';

    if (empty($timestamp) || empty($receivedSig)) {
        send_json_response([
            'success' => false,
            'error' => 'Acceso denegado: firma de autenticación requerida.'
        ], 401);
    }

    $timeVal = (int)$timestamp;
    $now = time();
    if (abs($now - $timeVal) > 300) {
        send_json_response([
            'success' => false,
            'error' => 'Acceso denegado: marca de tiempo inválida o expirada.'
        ], 401);
    }

    $method = strtoupper(isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET');
    $uriPath = parse_url(isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '', PHP_URL_PATH);
    if (empty($uriPath)) {
        $uriPath = isset($_SERVER['SCRIPT_NAME']) ? $_SERVER['SCRIPT_NAME'] : '';
    }

    $rawInput = file_get_contents('php://input');
    $rawBody = $rawInput === false ? '' : $rawInput;

    // Verificación directa contra la ruta canónica solicitada
    $canonical = "{$method}|{$uriPath}|{$timestamp}|{$rawBody}";
    $expectedSig = hash_hmac('sha256', $canonical, $secret);

    $matched = hash_equals($expectedSig, $receivedSig);

    // Fallback estricto únicamente si el servidor web omite el prefijo /api en REQUEST_URI
    if (!$matched && strpos($uriPath, '/api/') !== 0) {
        $apiPath = '/api/' . ltrim($uriPath, '/');
        $canonicalFallback = "{$method}|{$apiPath}|{$timestamp}|{$rawBody}";
        $matched = hash_equals(hash_hmac('sha256', $canonicalFallback, $secret), $receivedSig);
    }

    if (!$matched) {
        send_json_response([
            'success' => false,
            'error' => 'Acceso denegado: firma de autenticación inválida.'
        ], 401);
    }

    return true;
}

// 3. Resolución segura de credenciales
function get_resellerclub_config() {
    load_banelio_local_config();

    // Extraer de constantes o variables de entorno oficiales del repositorio
    $resellerId = defined('RESELLERCLUB_RESELLER_ID') ? RESELLERCLUB_RESELLER_ID : (
        defined('RESELLER_ID') ? RESELLER_ID : (
            getenv('RESELLERCLUB_RESELLER_ID') ?: (
                getenv('RESELLER_ID') ?: ''
            )
        )
    );

    $apiKey = defined('RESELLERCLUB_API_KEY') ? RESELLERCLUB_API_KEY : (
        defined('API_KEY') ? API_KEY : (
            getenv('RESELLERCLUB_API_KEY') ?: (
                getenv('API_KEY') ?: ''
            )
        )
    );

    $environment = defined('RESELLERCLUB_ENVIRONMENT') ? RESELLERCLUB_ENVIRONMENT : (
        getenv('RESELLERCLUB_ENVIRONMENT') ?: 'sandbox'
    );

    $isLive = strtolower(trim((string)$environment)) === 'live';
    $baseUrl = $isLive ? 'https://httpapi.com/api/' : 'https://test.httpapi.com/api/';

    return [
        'resellerId' => trim((string)$resellerId),
        'apiKey' => trim((string)$apiKey),
        'environment' => $isLive ? 'live' : 'sandbox',
        'baseUrl' => $baseUrl,
        'configured' => !empty($resellerId) && !empty($apiKey)
    ];
}
