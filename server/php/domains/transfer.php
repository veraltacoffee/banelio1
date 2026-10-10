<?php
/**
 * BANELIO - Comprobación y Validación de Transferencia de Dominios
 * Archivo: server/php/domains/transfer.php
 *
 * Verifica si un dominio es elegible para ser transferido a Banelio y valida el código Auth/EPP.
 */

require_once __DIR__ . '/../reseller/config.php';
require_once __DIR__ . '/../reseller/client.php';

apply_banelio_cors();

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$domainRaw = '';
$authCode = '';

if ($method === 'GET') {
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
} elseif ($method === 'POST') {
    // Operación protegida por firma HMAC-SHA256
    verify_banelio_bridge_auth();

    $postData = json_decode(file_get_contents('php://input'), true);
    if (!is_array($postData)) {
        $postData = $_POST;
    }

    $domainRaw = trim($postData['domain'] ?? $postData['domain-name'] ?? $postData['domain_name'] ?? '');
    // El código Auth/EPP se conserva exactamente como lo introdujo el usuario, sin trim() ni transformaciones
    $rawAuth = $postData['auth_code'] ?? $postData['auth-code'] ?? $postData['authCode'] ?? $postData['epp_code'] ?? $postData['epp-code'] ?? $postData['eppCode'] ?? null;
    $authCode = ($rawAuth !== null && $rawAuth !== false) ? (string)$rawAuth : '';
} else {
    send_json_response(['success' => false, 'error' => 'Método HTTP no soportado.'], 405);
}

if (empty($domainRaw)) {
    send_json_response(['success' => false, 'error' => 'Debes proporcionar un dominio para consultar transferencia.'], 400);
}

$domainClean = strtolower(preg_replace('/^https?:\/\//i', '', $domainRaw));
$domainClean = preg_replace('/^www\./i', '', $domainClean);
$domainClean = rtrim($domainClean, '/');
$parts = explode('.', $domainClean);

if (count($parts) < 2) {
    send_json_response(['success' => false, 'error' => 'Debes proporcionar un dominio completo con extensión válida (ej. midominio.com).'], 400);
}

$sld = $parts[0];
$tld = implode('.', array_slice($parts, 1));

try {
    $client = new ResellerClubClient();

    $availData = $client->get('domains/available.json', [
        'domain-name' => $sld,
        'tlds' => [$tld]
    ]);

    $domainInfo = $availData[$domainClean] ?? null;
    $status = strtolower($domainInfo['status'] ?? '');

    if ($status === 'available') {
        send_json_response([
            'success' => true,
            'domain' => $domainClean,
            'eligible' => false,
            'status' => 'AVAILABLE_FOR_REGISTRATION',
            'message' => 'El dominio no está registrado aún. Puedes registrarlo directamente en lugar de transferirlo.',
            'requiresAuthCode' => false
        ], 200);
    }

    if ($status === 'regthroughus') {
        send_json_response([
            'success' => true,
            'domain' => $domainClean,
            'eligible' => false,
            'status' => 'ALREADY_MANAGED',
            'message' => 'Este dominio ya se encuentra registrado y administrado en Banelio.',
            'requiresAuthCode' => false
        ], 200);
    }

    $isEligible = ($status === 'regthroughothers');
    $authCodeValid = false;
    $authCodeError = null;

    if ($authCode !== '') {
        $authLen = strlen($authCode);
        if ($authLen < 6 || $authLen > 32) {
            $authCodeError = 'El código Auth/EPP debe tener entre 6 y 32 caracteres alfanuméricos.';
        } elseif (!preg_match('/^[\x20-\x7E]+$/', $authCode)) {
            $authCodeError = 'El código Auth/EPP contiene caracteres no permitidos.';
        } else {
            $authCodeValid = true;
        }
    }

    send_json_response([
        'success' => true,
        'domain' => $domainClean,
        'eligible' => $isEligible,
        'status' => $isEligible ? 'TRANSFER_ELIGIBLE' : 'NOT_ELIGIBLE',
        'requiresAuthCode' => true,
        'authCodeProvided' => ($authCode !== ''),
        'authCodeValid' => $authCodeValid,
        'authCodeError' => $authCodeError,
        'message' => $isEligible
            ? 'El dominio es elegible para transferencia. Recuerda desbloquearlo en tu proveedor actual (Transfer Lock desactivado) y contar con el código Auth/EPP.'
            : 'El dominio no se encuentra disponible para transferencia en este momento.'
    ], 200);

} catch (Exception $e) {
    send_json_response([
        'success' => false,
        'domain' => $domainClean,
        'error' => sanitize_exception_message($e, 'No fue posible verificar la transferibilidad del dominio.')
    ], $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500);
}
