<?php
/**
 * BANELIO - Diagnóstico de Conexión con ResellerClub
 * Archivo: server/php/reseller/test-connection.php
 *
 * Ejecuta una consulta segura y de solo lectura a la cuenta mayorista.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/client.php';

apply_banelio_cors();
verify_banelio_bridge_auth();

try {
    $client = new ResellerClubClient();

    if (!$client->isConfigured()) {
        send_json_response([
            'success' => false,
            'configured' => false,
            'error' => 'Faltan credenciales de ResellerClub (auth-userid o api-key no definidas en el servidor).'
        ], 503);
    }

    // Consulta de solo lectura a los detalles del revendedor
    $details = $client->get('resellers/details.json');

    if (!is_array($details)) {
        send_json_response([
            'success' => false,
            'error' => 'Respuesta inesperada del proveedor al consultar estado.'
        ], 502);
    }

    // NUNCA exponer contraseñas, api keys, ni tokens
    $sanitized = [
        'company' => $details['company'] ?? 'Banelio',
        'resellerstatus' => $details['resellerstatus'] ?? 'Active',
        'resellerid' => $client->getResellerIdMasked(),
        'country' => $details['country'] ?? 'MX',
        'sellingcurrencysymbol' => $details['sellingcurrencysymbol'] ?? 'MXN',
        'environment' => $client->getEnvironment(),
        'supportsautorenew' => ($details['supportsautorenew'] ?? 'true') === 'true'
    ];

    send_json_response([
        'success' => true,
        'message' => 'Banelio está conectado correctamente con ResellerClub.',
        'environment' => $client->getEnvironment(),
        'reseller' => $sanitized
    ], 200);

} catch (Exception $e) {
    send_json_response([
        'success' => false,
        'error' => sanitize_exception_message($e, 'No fue posible validar la conexión con ResellerClub.')
    ], $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500);
}
