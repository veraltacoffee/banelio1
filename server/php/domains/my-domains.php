<?php
/**
 * BANELIO - Listado de Dominios Reales del Cliente Autenticado
 * Archivo: server/php/domains/my-domains.php
 *
 * Consulta la lista de dominios asociados exclusivamente al cliente en ResellerClub.
 * Garantiza aislamiento estricto por cliente.
 */

require_once __DIR__ . '/../reseller/config.php';
require_once __DIR__ . '/../reseller/client.php';

apply_banelio_cors();

// Parámetros de identidad enviados por el backend Node de Banelio
$customerId = isset($_GET['customer_id']) ? trim($_GET['customer_id']) : (isset($_GET['customer-id']) ? trim($_GET['customer-id']) : '');
$email = isset($_GET['email']) ? trim(strtolower($_GET['email'])) : '';

if (empty($customerId) && empty($email)) {
    send_json_response([
        'success' => false,
        'error' => 'Debes proporcionar la identidad del cliente (customer_id o email).'
    ], 400);
}

try {
    $client = new ResellerClubClient();

    // Si no se proporcionó customer_id numérico pero sí email, resolver su ID en ResellerClub
    if (empty($customerId) && !empty($email)) {
        try {
            $customerLookup = $client->get('customers/details.json', [
                'username' => $email
            ]);

            if (is_array($customerLookup) && isset($customerLookup['customerid']) && is_numeric($customerLookup['customerid'])) {
                $customerId = (string)$customerLookup['customerid'];
            }
        } catch (Exception $e) {
            // Si el cliente no existe en ResellerClub aún, tiene 0 dominios registrados
            send_json_response([
                'success' => true,
                'count' => 0,
                'domains' => [],
                'message' => 'No existen dominios registrados en el proveedor para este cliente.'
            ], 200);
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

    // Consulta de dominios filtrando estrictamente por customer-id
    $params = [
        'customer-id' => $customerId,
        'no-of-records' => 50,
        'page-no' => 1
    ];

    $response = $client->get('domains/search.json', $params);

    $domains = [];
    if (is_array($response)) {
        foreach ($response as $key => $item) {
            if ($key === 'recsindb' || $key === 'recspage') continue;
            if (!is_array($item)) continue;

            $domainName = isset($item['entity.description']) ? $item['entity.description'] : '';
            if (!empty($domainName)) {
                $domains[] = [
                    'id' => isset($item['orders.entityid']) ? (string)$item['orders.entityid'] : $key,
                    'domain' => $domainName,
                    'status' => isset($item['orders.currentstatus']) ? $item['orders.currentstatus'] : 'Active',
                    'creationDate' => isset($item['orders.creationtime']) ? date('c', (int)$item['orders.creationtime']) : null,
                    'expiryDate' => isset($item['orders.endtime']) ? date('c', (int)$item['orders.endtime']) : null,
                    'privacyProtection' => isset($item['orders.privacy_protection']) ? $item['orders.privacy_protection'] === 'true' : false,
                    'locked' => isset($item['orders.transfer_lock']) ? $item['orders.transfer_lock'] === 'true' : true,
                    'autoRenew' => isset($item['orders.auto_renew']) ? $item['orders.auto_renew'] === 'true' : false
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
        'error' => $e->getMessage()
    ], $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500);
}
