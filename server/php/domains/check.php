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

$domainRaw = isset($_GET['domain']) ? trim($_GET['domain']) : '';
if (empty($domainRaw)) {
    send_json_response([
        'success' => false,
        'error' => 'El parámetro domain es obligatorio.'
    ], 400);
}

// Sanitizar dominio
$domainClean = strtolower(preg_replace('/^https?:\/\//i', '', $domainRaw));
$domainClean = preg_replace('/^www\./i', '', $domainClean);
$parts = explode('.', $domainClean);
$sld = $parts[0];

// TLDs a consultar
$tldsToQuery = [];
if (count($parts) > 1) {
    $tldsToQuery[] = implode('.', array_slice($parts, 1));
} else {
    $customTlds = isset($_GET['tlds']) ? $_GET['tlds'] : '';
    if (!empty($customTlds)) {
        $tldsToQuery = is_array($customTlds) ? $customTlds : explode(',', $customTlds);
    } else {
        $tldsToQuery = ['com', 'net', 'org', 'mx', 'com.mx'];
    }
}

// Limpiar TLDs
$cleanTlds = [];
foreach ($tldsToQuery as $tld) {
    $t = strtolower(trim(ltrim($tld, '.')));
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

    // Preparar llamada GET /domains/available.json
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

    foreach ($response as $fullDomain => $details) {
        if (!is_array($details)) continue;

        $statusRaw = isset($details['status']) ? strtolower($details['status']) : '';
        $isAvailable = ($statusRaw === 'available');

        // Mapeo seguro y estricto de disponibilidad
        $statusStandard = 'unavailable';
        if ($isAvailable) {
            $statusStandard = 'available';
        } elseif ($statusRaw === 'regthroughus') {
            $statusStandard = 'regthroughus';
        } else {
            $statusStandard = 'regthroughothers';
        }

        $results[$fullDomain] = [
            'status' => $statusStandard,
            'available' => $isAvailable,
            'classkey' => isset($details['classkey']) ? $details['classkey'] : null
        ];

        if ($fullDomain === $domainClean && $isAvailable) {
            $isDirectQueryAvailable = true;
        }
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
        'error' => $e->getMessage()
    ], $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500);
}
