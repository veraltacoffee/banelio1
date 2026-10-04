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

$domainRaw = isset($_GET['domain']) ? trim($_GET['domain']) : (isset($_POST['domain']) ? trim($_POST['domain']) : '');
$authCode = isset($_GET['auth_code']) ? trim($_GET['auth_code']) : (isset($_POST['auth_code']) ? trim($_POST['auth_code']) : '');

if (empty($domainRaw)) {
    send_json_response([
        'success' => false,
        'error' => 'Debes proporcionar un dominio para consultar transferencia.'
    ], 400);
}

// Sanitizar dominio
$domainClean = strtolower(preg_replace('/^https?:\/\//i', '', $domainRaw));
$domainClean = preg_replace('/^www\./i', '', $domainClean);
$parts = explode('.', $domainClean);

if (count($parts) < 2) {
    send_json_response([
        'success' => false,
        'error' => 'Debes proporcionar un dominio completo con extensión válida (ej. midominio.com).'
    ], 400);
}

$sld = $parts[0];
$tld = implode('.', array_slice($parts, 1));

try {
    $client = new ResellerClubClient();

    // 1. Validar estado en el Registry
    $availData = $client->get('domains/available.json', [
        'domain-name' => $sld,
        'tlds' => [$tld]
    ]);

    $domainInfo = isset($availData[$domainClean]) ? $availData[$domainClean] : null;
    $status = isset($domainInfo['status']) ? strtolower($domainInfo['status']) : '';

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

    // 2. Si está registrado en otro proveedor (regthroughothers), es elegible para transferencia
    $isEligible = ($status === 'regthroughothers');

    // 3. Validación de Auth/EPP Code cuando se proporcione
    $authCodeValid = false;
    $authCodeError = null;

    if (!empty($authCode)) {
        $authLen = strlen($authCode);
        if ($authLen < 6 || $authLen > 32) {
            $authCodeValid = false;
            $authCodeError = 'El código Auth/EPP debe tener entre 6 y 32 caracteres alfanuméricos.';
        } elseif (!preg_match('/^[\x20-\x7E]+$/', $authCode)) {
            $authCodeValid = false;
            $authCodeError = 'El código Auth/EPP contiene caracteres no permitidos.';
        } else {
            $authCodeValid = true;
        }
    }

    // Respuesta limpia y estructurada sin crear órdenes falsas
    send_json_response([
        'success' => true,
        'domain' => $domainClean,
        'eligible' => $isEligible,
        'status' => $isEligible ? 'TRANSFER_ELIGIBLE' : 'NOT_ELIGIBLE',
        'requiresAuthCode' => true,
        'authCodeProvided' => !empty($authCode),
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
        'error' => $e->getMessage()
    ], $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500);
}
