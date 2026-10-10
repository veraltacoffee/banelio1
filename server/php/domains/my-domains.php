<?php
/**
 * BANELIO - Listado de Dominios Reales del Cliente Autenticado
 * Archivo: server/php/domains/my-domains.php
 *
 * Consulta la lista de dominios asociados exclusivamente al cliente en ResellerClub.
 */

require_once __DIR__ . '/../reseller/config.php';
require_once __DIR__ . '/../reseller/client.php';

apply_banelio_cors();
verify_banelio_bridge_auth();

$customerId = trim($_GET['customer_id'] ?? '');
$email = trim(strtolower($_GET['email'] ?? ''));

if (empty($customerId) && empty($email)) {
    send_json_response([
        'success' => false,
        'error' => 'Debes proporcionar la identidad del cliente (customer_id o email).'
    ], 400);
}

try {
    $client = new ResellerClubClient();

    if (!$client->isConfigured()) {
        send_json_response([
            'success' => false,
            'error' => 'Credenciales de ResellerClub no configuradas en el servidor.'
        ], 503);
    }

    if (empty($customerId) && !empty($email)) {
        try {
            $customerLookup = $client->get('customers/details.json', ['username' => $email]);
            if (is_array($customerLookup) && isset($customerLookup['customerid']) && is_numeric($customerLookup['customerid'])) {
                $customerId = (string)$customerLookup['customerid'];
            }
        } catch (Exception $e) {
            $errCode = $e->getCode();
            if ($errCode === 502 || $errCode === 503 || $errCode === 401 || $errCode === 403) {
                throw $e;
            }
            $errMsg = strtolower($e->getMessage());
            if (strpos($errMsg, 'invalid customer') !== false ||
                strpos($errMsg, 'customer does not exist') !== false ||
                strpos($errMsg, 'no existe') !== false) {
                send_json_response([
                    'success' => true,
                    'count' => 0,
                    'domains' => [],
                    'message' => 'No existen dominios registrados en el proveedor para este cliente.'
                ], 200);
            }
            throw $e;
        }
    }

    if (empty($customerId)) {
        send_json_response([
            'success' => true,
            'count' => 0,
            'domains' => [],
            'message' => 'El cliente no tiene servicios de dominios aprovisionados en el proveedor mayorista.'
        ], 200);
    }

    $response = $client->get('domains/search.json', [
        'customer-id' => $customerId,
        'no-of-records' => 50,
        'page-no' => 1
    ]);

    $domains = [];
    if (is_array($response)) {
        foreach ($response as $key => $item) {
            if ($key === 'recsindb' || $key === 'recspage' || !is_array($item)) continue;

            $domainName = $item['entity.description'] ?? '';
            if (!empty($domainName)) {
                $domains[] = [
                    'id' => (string)($item['orders.entityid'] ?? $key),
                    'domain' => $domainName,
                    'status' => $item['orders.currentstatus'] ?? 'Active',
                    'creationDate' => isset($item['orders.creationtime']) ? date('c', (int)$item['orders.creationtime']) : null,
                    'expiryDate' => isset($item['orders.endtime']) ? date('c', (int)$item['orders.endtime']) : null,
                    'privacyProtection' => ($item['orders.privacy_protection'] ?? '') === 'true',
                    'locked' => ($item['orders.transfer_lock'] ?? 'true') === 'true',
                    'autoRenew' => ($item['orders.auto_renew'] ?? '') === 'true'
                ];
            }
        }
    }

    send_json_response([
        'success' => true,
        'count' => count($domains),
        'domains' => $domains
    ], 200);

} catch (Exception $e) {
    send_json_response([
        'success' => false,
        'error' => sanitize_exception_message($e, 'No fue posible consultar los dominios en el proveedor.')
    ], $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500);
}
