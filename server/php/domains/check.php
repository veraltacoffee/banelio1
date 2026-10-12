<?php
/**
 * BANELIO - Búsqueda Oficial de Disponibilidad de Dominios
 * Archivo: server/php/domains/check.php
 *
 * Consulta en tiempo real a la API de ResellerClub (domains/available.json).
 * Nunca muestra un dominio ocupado como disponible.
 */

require_once __DIR__ . '/../reseller/config.php';
require_once __DIR__ . '/../reseller/client.php';

apply_banelio_cors();

// REGLA: El código Auth/EPP NUNCA debe viajar por GET ni en parámetros de URL
$forbiddenAuthKeys = [
    'auth_code',
    'auth-code',
    'authcode',
    'epp_code',
    'epp-code',
    'eppcode'
];
foreach (array_keys($_GET) as $key) {
    if (in_array(strtolower((string)$key), $forbiddenAuthKeys, true)) {
        send_json_response([
            'success' => false,
            'error' => 'Por seguridad, el código Auth/EPP debe recibirse exclusivamente mediante una solicitud POST protegida, nunca como parámetro GET ni en la URL.'
        ], 400);
    }
}

$domainRaw = trim($_GET['domain'] ?? $_GET['domain-name'] ?? $_GET['domain_name'] ?? '');
if (empty($domainRaw)) {
    send_json_response([
        'success' => false,
        'error' => 'El parámetro domain es obligatorio.'
    ], 400);
}

// Sanitizar dominio
$domainClean = strtolower(preg_replace('/^https?:\/\//i', '', $domainRaw));
$domainClean = preg_replace('/^www\./i', '', $domainClean);
$domainClean = trim($domainClean, '/');
$domainClean = preg_replace('/[^a-z0-9.-]/', '', $domainClean);

if (empty($domainClean)) {
    send_json_response([
        'success' => false,
        'error' => 'Nombre de dominio no válido.'
    ], 400);
}

$parts = explode('.', $domainClean);
$sld = $parts[0];

// TLDs a consultar
$tldsToQuery = [];
if (count($parts) > 1) {
    $tldsToQuery[] = implode('.', array_slice($parts, 1));
}

// Soporte para TLDs complementarios en la misma consulta
$customTlds = $_GET['tlds'] ?? $_GET['tld'] ?? '';
if (!empty($customTlds)) {
    $extraTlds = is_array($customTlds) ? $customTlds : explode(',', (string)$customTlds);
    foreach ($extraTlds as $et) {
        $cleanEt = strtolower(trim(ltrim((string)$et, '.')));
        if (!empty($cleanEt) && !in_array($cleanEt, $tldsToQuery, true)) {
            $tldsToQuery[] = $cleanEt;
        }
    }
}

// Si no se proporcionaron extensiones, consultar las principales por defecto
if (empty($tldsToQuery)) {
    $tldsToQuery = ['com', 'net', 'org', 'mx', 'com.mx'];
}

// Limpiar TLDs
$cleanTlds = [];
foreach ($tldsToQuery as $tld) {
    $t = strtolower(trim(ltrim($tld, '.')));
    $t = preg_replace('/[^a-z0-9.-]/', '', $t);
    if (!empty($t) && !in_array($t, $cleanTlds, true)) {
        $cleanTlds[] = $t;
    }
}

if (empty($sld) || empty($cleanTlds)) {
    send_json_response([
        'success' => false,
        'error' => 'Nombre de dominio o extensiones no válidas.'
    ], 400);
}

try {
    $client = new ResellerClubClient();

    // Preparar llamada GET /domains/available.json hacia ResellerClub
    $params = [
        'domain-name' => $sld,
        'tlds' => $cleanTlds
    ];

    $response = $client->get('domains/available.json', $params);

    if (!is_array($response)) {
        send_json_response([
            'success' => false,
            'error' => 'Respuesta no válida del Registry de dominios.'
        ], 502);
    }

    $results = [];
    $isDirectQueryAvailable = false;
    $targetMatchDomain = count($parts) > 1 ? $domainClean : ($sld . '.' . $cleanTlds[0]);

    foreach ($response as $fullDomain => $details) {
        if (!is_array($details)) continue;

        $statusRaw = isset($details['status']) ? strtolower(trim((string)$details['status'])) : '';
        $isAvailable = ($statusRaw === 'available');

        // Mapeo seguro, autoritativo y estricto de disponibilidad según la respuesta real del proveedor
        $statusStandard = 'unknown';
        if ($isAvailable) {
            $statusStandard = 'available';
        } elseif ($statusRaw === 'regthroughus') {
            $statusStandard = 'regthroughus';
        } elseif ($statusRaw === 'regthroughothers' || $statusRaw === 'registered' || $statusRaw === 'unavailable') {
            $statusStandard = 'regthroughothers';
        } else {
            // Respuestas incompletas o errores del registry no inventan estado ocupado ni libre
            $statusStandard = 'unknown';
        }

        $results[$fullDomain] = [
            'status' => $statusStandard,
            'raw_status' => $statusRaw,
            'available' => $isAvailable,
            'can_register' => $isAvailable,
            'can_transfer' => ($statusStandard === 'regthroughothers'),
            'classkey' => isset($details['classkey']) ? $details['classkey'] : null
        ];

        if ($fullDomain === $targetMatchDomain && $isAvailable) {
            $isDirectQueryAvailable = true;
        }
    }

    if (empty($results)) {
        send_json_response([
            'success' => false,
            'domain' => $domainClean,
            'error' => 'El proveedor mayorista no retornó resultados de disponibilidad para las extensiones solicitadas.'
        ], 502);
    }

    send_json_response([
        'success' => true,
        'domain' => $domainClean,
        'available' => $isDirectQueryAvailable,
        'result' => $results
    ], 200);

} catch (Exception $e) {
    send_json_response([
        'success' => false,
        'domain' => $domainClean,
        'error' => sanitize_exception_message($e, 'No fue posible consultar la disponibilidad del dominio.')
    ], $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500);
}
