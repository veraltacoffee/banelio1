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
    header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With, User-Agent');
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
