<?php
/**
 * BANELIO - Configuración Centralizada de ResellerClub
 * Archivo: server/php/reseller/config.php
 *
 * Administra credenciales, autenticación HMAC y CORS sin exponer secretos al navegador.
 */

// Bloqueo estricto de acceso HTTP directo a este archivo de biblioteca
if (isset($_SERVER['SCRIPT_FILENAME']) && realpath($_SERVER['SCRIPT_FILENAME']) === realpath(__FILE__)) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'error' => 'Acceso directo denegado.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// 1. Manejo estricto de CORS para Banelio
function apply_banelio_cors() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
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

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

// 2. Helper de respuesta JSON estandarizada
function send_json_response($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// 3. Carga de configuración local (IONOS)
function load_banelio_local_config() {
    static $loaded = false;
    if ($loaded) return;
    $loaded = true;

    // 1) Fuera del web root (nivel superior seguro)
    $parentPath2 = dirname(__DIR__, 2) . '/config.local.php';
    if (file_exists($parentPath2)) {
        require_once $parentPath2;
        return;
    }

    // 2) En /api/ (raíz del puente de API)
    $parentPath1 = dirname(__DIR__, 1) . '/config.local.php';
    if (file_exists($parentPath1)) {
        require_once $parentPath1;
        return;
    }

    // 3) En /api/reseller/ (directorio de biblioteca)
    $localPath = __DIR__ . '/config.local.php';
    if (file_exists($localPath)) {
        require_once $localPath;
    }
}

// 4. Traducción y sanitización de errores de ResellerClub
function translate_resellerclub_error($rawMsg) {
    if (empty($rawMsg) || !is_string($rawMsg)) {
        return 'Error en la operación solicitada al proveedor mayorista.';
    }

    $lower = strtolower($rawMsg);

    if (strpos($lower, 'already registered') !== false) {
        return 'El dominio ya se encuentra registrado.';
    }
    if (strpos($lower, 'invalid domain') !== false) {
        return 'El nombre de dominio es inválido o no está soportado.';
    }
    if (strpos($lower, 'invalid customer') !== false || strpos($lower, 'customer does not exist') !== false) {
        return 'El cliente especificado no existe o es inválido en el proveedor.';
    }
    if (strpos($lower, 'auth code') !== false || strpos($lower, 'secret key') !== false || strpos($lower, 'epp') !== false) {
        return 'El código Auth/EPP proporcionado es incorrecto o inválido.';
    }
    if (strpos($lower, 'locked') !== false || strpos($lower, 'transfer prohibited') !== false) {
        return 'El dominio se encuentra bloqueado para transferencias en el registrador actual.';
    }
    if (strpos($lower, 'pending transfer') !== false || strpos($lower, 'already in progress') !== false) {
        return 'Ya existe una solicitud de transferencia en proceso para este dominio.';
    }
    if (strpos($lower, '60 day') !== false || strpos($lower, 'age of domain') !== false) {
        return 'El dominio no cumple el tiempo mínimo requerido (60 días) para ser transferido.';
    }
    if (strpos($lower, 'contact') !== false && (strpos($lower, 'invalid') !== false || strpos($lower, 'missing') !== false)) {
        return 'Los datos de contacto WHOIS son inválidos o incompletos.';
    }
    if (strpos($lower, 'phone') !== false || strpos($lower, 'tel-no') !== false) {
        return 'El formato del número telefónico o código de país es inválido.';
    }
    if (strpos($lower, 'nameserver') !== false || strpos($lower, 'invalid ns') !== false) {
        return 'Los servidores de nombres (DNS) proporcionados no son válidos.';
    }
    if (strpos($lower, 'insufficient funds') !== false || strpos($lower, 'balance') !== false) {
        return 'Operación no disponible temporalmente en el proveedor mayorista.';
    }

    // Filtrar fugas técnicas (rutas, curl, php, trazas de pila)
    if (preg_match('/curl|httpapi\.com|stack trace|exception|\.php|sql|database|path/i', $rawMsg)) {
        return 'Error en el procesamiento del proveedor mayorista.';
    }

    $clean = trim(preg_replace('/[^\p{L}\p{N}\s\.\,\-\_\:\?\!\(\)]/u', '', strip_tags($rawMsg)));
    return strlen($clean) > 160 ? substr($clean, 0, 160) . '...' : ($clean ?: 'Error en la operación solicitada al proveedor mayorista.');
}

// 5. Sanitizador general de excepciones
function sanitize_exception_message(Exception $e, $defaultMessage = 'Error en el procesamiento del proveedor mayorista.') {
    $code = $e->getCode();
    if ($code === 503) return 'Servicio de integración temporalmente no disponible.';
    if ($code === 502) return 'No fue posible establecer comunicación con el proveedor del registro de dominios.';
    if ($code === 401 || $code === 403) return 'Error de autenticación o autorización con el proveedor.';
    if ($code === 404) return 'El recurso solicitado no fue encontrado en el proveedor.';
    if ($code === 400) return translate_resellerclub_error($e->getMessage());

    return $defaultMessage;
}

// 6. Resolución de clave compartida HMAC (compatible con IONOS Apache/FastCGI/FPM)
function get_bridge_secret() {
    load_banelio_local_config();
    if (defined('PHP_BRIDGE_SECRET')) return trim((string)PHP_BRIDGE_SECRET);
    if ($s = getenv('PHP_BRIDGE_SECRET')) return trim((string)$s);
    if (!empty($_ENV['PHP_BRIDGE_SECRET'])) return trim((string)$_ENV['PHP_BRIDGE_SECRET']);
    if (!empty($_SERVER['PHP_BRIDGE_SECRET'])) return trim((string)$_SERVER['PHP_BRIDGE_SECRET']);

    if (defined('RESELLER_BRIDGE_SECRET')) return trim((string)RESELLER_BRIDGE_SECRET);
    if ($s = getenv('RESELLER_BRIDGE_SECRET')) return trim((string)$s);
    if (!empty($_ENV['RESELLER_BRIDGE_SECRET'])) return trim((string)$_ENV['RESELLER_BRIDGE_SECRET']);
    if (!empty($_SERVER['RESELLER_BRIDGE_SECRET'])) return trim((string)$_SERVER['RESELLER_BRIDGE_SECRET']);

    return '';
}

// 7. Verificación estricta de autenticación HMAC-SHA256 (Server-to-Server)
function verify_banelio_bridge_auth() {
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        return true;
    }

    $secret = get_bridge_secret();
    if (empty($secret)) {
        send_json_response(['success' => false, 'error' => 'Configuración de seguridad del servidor no establecida.'], 503);
    }

    $timestamp = trim((string)($_SERVER['HTTP_X_BANELIO_TIMESTAMP'] ?? ''));
    $receivedSig = trim((string)($_SERVER['HTTP_X_BANELIO_SIGNATURE'] ?? ''));

    if (empty($timestamp) || empty($receivedSig)) {
        send_json_response(['success' => false, 'error' => 'Acceso denegado: firma de autenticación requerida.'], 401);
    }

    if (!ctype_digit($timestamp) || abs(time() - (int)$timestamp) > 300) {
        send_json_response(['success' => false, 'error' => 'Acceso denegado: marca de tiempo inválida o expirada.'], 401);
    }

    if (!preg_match('/^[a-f0-9]{64}$/i', $receivedSig)) {
        send_json_response(['success' => false, 'error' => 'Acceso denegado: firma de autenticación inválida.'], 401);
    }

    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: ($_SERVER['SCRIPT_NAME'] ?? '');
    $rawBody = file_get_contents('php://input');
    $rawBody = $rawBody === false ? '' : $rawBody;

    // Rutas canónicas candidatas para compatibilidad exacta entre Node y las rutas de IONOS
    $candidatePaths = [$uriPath];

    if (strpos($uriPath, '/api/') !== 0) {
        $candidatePaths[] = '/api/' . ltrim($uriPath, '/');
    }
    if (strpos($uriPath, '/server/php') === 0) {
        $stripped = substr($uriPath, strlen('/server/php'));
        $candidatePaths[] = $stripped;
        $candidatePaths[] = '/api/' . ltrim($stripped, '/');
    }
    if (!empty($_SERVER['SCRIPT_NAME']) && !in_array($_SERVER['SCRIPT_NAME'], $candidatePaths, true)) {
        $candidatePaths[] = $_SERVER['SCRIPT_NAME'];
        if (strpos($_SERVER['SCRIPT_NAME'], '/api/') !== 0) {
            $candidatePaths[] = '/api/' . ltrim($_SERVER['SCRIPT_NAME'], '/');
        }
    }

    $matched = false;
    foreach (array_unique($candidatePaths) as $cPath) {
        $canonical = "{$method}|{$cPath}|{$timestamp}|{$rawBody}";
        $expectedSig = hash_hmac('sha256', $canonical, $secret);
        if (hash_equals($expectedSig, $receivedSig)) {
            $matched = true;
            break;
        }
    }

    if (!$matched) {
        send_json_response(['success' => false, 'error' => 'Acceso denegado: firma de autenticación inválida.'], 401);
    }

    return true;
}

// 8. Resolución de credenciales de ResellerClub
function get_resellerclub_config() {
    load_banelio_local_config();

    $resellerId = defined('RESELLERCLUB_RESELLER_ID') ? RESELLERCLUB_RESELLER_ID : (
        defined('RESELLER_ID') ? RESELLER_ID : (
            getenv('RESELLERCLUB_RESELLER_ID') ?: (
                getenv('RESELLER_ID') ?: (
                    $_ENV['RESELLERCLUB_RESELLER_ID'] ?? (
                        $_ENV['RESELLER_ID'] ?? (
                            $_SERVER['RESELLERCLUB_RESELLER_ID'] ?? (
                                $_SERVER['RESELLER_ID'] ?? ''
                            )
                        )
                    )
                )
            )
        )
    );

    $apiKey = defined('RESELLERCLUB_API_KEY') ? RESELLERCLUB_API_KEY : (
        defined('API_KEY') ? API_KEY : (
            getenv('RESELLERCLUB_API_KEY') ?: (
                getenv('API_KEY') ?: (
                    $_ENV['RESELLERCLUB_API_KEY'] ?? (
                        $_ENV['API_KEY'] ?? (
                            $_SERVER['RESELLERCLUB_API_KEY'] ?? (
                                $_SERVER['API_KEY'] ?? ''
                            )
                        )
                    )
                )
            )
        )
    );

    $env = defined('RESELLERCLUB_ENVIRONMENT') ? RESELLERCLUB_ENVIRONMENT : (
        getenv('RESELLERCLUB_ENVIRONMENT') ?: (
            $_ENV['RESELLERCLUB_ENVIRONMENT'] ?? (
                $_SERVER['RESELLERCLUB_ENVIRONMENT'] ?? 'sandbox'
            )
        )
    );
    $isLive = strtolower(trim((string)$env)) === 'live';

    return [
        'resellerId' => trim((string)$resellerId),
        'apiKey' => trim((string)$apiKey),
        'environment' => $isLive ? 'live' : 'sandbox',
        'baseUrl' => $isLive ? 'https://httpapi.com/api/' : 'https://test.httpapi.com/api/',
        'configured' => !empty($resellerId) && !empty($apiKey)
    ];
}
