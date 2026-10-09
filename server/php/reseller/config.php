<?php
/**
 * BANELIO - Configuración Centralizada de ResellerClub
 * Archivo: server/php/reseller/config.php
 *
 * Administra credenciales y entorno sin exponer secretos al navegador.
 */

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

// 2b. Resolución de clave compartida HMAC servidor a servidor
function get_bridge_secret() {
    $localConfigPath = __DIR__ . '/config.local.php';
    if (file_exists($localConfigPath)) {
        require_once $localConfigPath;
    }

    $secret = defined('PHP_BRIDGE_SECRET') ? PHP_BRIDGE_SECRET : (
        defined('RESELLER_BRIDGE_SECRET') ? RESELLER_BRIDGE_SECRET : (
            getenv('PHP_BRIDGE_SECRET') ?: (
                getenv('RESELLER_BRIDGE_SECRET') ?: (
                    isset($_ENV['PHP_BRIDGE_SECRET']) ? $_ENV['PHP_BRIDGE_SECRET'] : (
                        isset($_ENV['RESELLER_BRIDGE_SECRET']) ? $_ENV['RESELLER_BRIDGE_SECRET'] : (
                            isset($GLOBALS['bridgeSecret']) ? $GLOBALS['bridgeSecret'] : ''
                        )
                    )
                )
            )
        )
    );
    return trim((string)$secret);
}

// 2c. Verificación estricta de autenticación HMAC-SHA256 (Server-to-Server)
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

    // Normalizaciones de ruta posibles para compatibilidad entre proxy y servidor directo
    $normalizedPaths = [
        $uriPath,
        '/' . ltrim($uriPath, '/'),
        preg_replace('#^/api/#', '/', '/' . ltrim($uriPath, '/')),
        '/api/' . ltrim(preg_replace('#^/api/#', '', $uriPath), '/'),
        isset($_SERVER['SCRIPT_NAME']) ? $_SERVER['SCRIPT_NAME'] : ''
    ];

    $matched = false;
    foreach (array_unique(array_filter($normalizedPaths)) as $pathOption) {
        $canonical = "{$method}|{$pathOption}|{$timestamp}|{$rawBody}";
        $expectedSig = hash_hmac('sha256', $canonical, $secret);
        if (hash_equals($expectedSig, $receivedSig)) {
            $matched = true;
            break;
        }
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
    // Si existe archivo local de configuración de servidor no commiteado, cargarlo
    $localConfigPath = __DIR__ . '/config.local.php';
    if (file_exists($localConfigPath)) {
        require_once $localConfigPath;
    }

    // Extraer de constantes o variables de entorno
    $resellerId = defined('RESELLERCLUB_RESELLER_ID') ? RESELLERCLUB_RESELLER_ID : (
        defined('RESELLER_ID') ? RESELLER_ID : (
            getenv('RESELLERCLUB_RESELLER_ID') ?: (
                getenv('RESELLER_ID') ?: (
                    isset($_ENV['RESELLERCLUB_RESELLER_ID']) ? $_ENV['RESELLERCLUB_RESELLER_ID'] : (
                        isset($GLOBALS['resellerId']) ? $GLOBALS['resellerId'] : (
                            isset($GLOBALS['authUserId']) ? $GLOBALS['authUserId'] : ''
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
                    isset($_ENV['RESELLERCLUB_API_KEY']) ? $_ENV['RESELLERCLUB_API_KEY'] : (
                        isset($GLOBALS['apiKey']) ? $GLOBALS['apiKey'] : ''
                    )
                )
            )
        )
    );

    $environment = defined('RESELLERCLUB_ENVIRONMENT') ? RESELLERCLUB_ENVIRONMENT : (
        getenv('RESELLERCLUB_ENVIRONMENT') ?: (
            isset($_ENV['RESELLERCLUB_ENVIRONMENT']) ? $_ENV['RESELLERCLUB_ENVIRONMENT'] : 'live'
        )
    );

    $isLive = strtolower(trim($environment)) === 'live' || strtolower(trim($environment)) === 'production';
    $baseUrl = $isLive ? 'https://httpapi.com/api/' : 'https://test.httpapi.com/api/';

    // Permitir sobreescritura explícita de BASE_URL si se configuró
    $customBase = defined('RESELLERCLUB_BASE_URL') ? RESELLERCLUB_BASE_URL : (
        getenv('RESELLERCLUB_BASE_URL') ?: (
            isset($GLOBALS['baseUrl']) ? $GLOBALS['baseUrl'] : ''
        )
    );
    if (!empty($customBase)) {
        $baseUrl = rtrim($customBase, '/') . '/';
    }

    return [
        'resellerId' => trim((string)$resellerId),
        'apiKey' => trim((string)$apiKey),
        'environment' => $isLive ? 'live' : 'sandbox',
        'baseUrl' => $baseUrl,
        'configured' => !empty($resellerId) && !empty($apiKey)
    ];
}
