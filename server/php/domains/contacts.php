<?php
/**
 * BANELIO - Gestión de Contactos WHOIS de Dominios
 * Archivo: server/php/domains/contacts.php
 *
 * Operaciones para consultar y registrar contactos WHOIS en ResellerClub.
 */

require_once __DIR__ . '/../reseller/config.php';
require_once __DIR__ . '/../reseller/client.php';

apply_banelio_cors();
verify_banelio_bridge_auth();

$client = new ResellerClubClient();

if (!$client->isConfigured()) {
    send_json_response([
        'success' => false,
        'error' => 'Credenciales de ResellerClub no configuradas en el servidor.'
    ], 503);
}

// 1. GET: Consultar contactos de un cliente o por ID específico
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $contactId = trim($_GET['contact_id'] ?? '');
    $customerId = trim($_GET['customer_id'] ?? '');

    if (!empty($contactId)) {
        try {
            $data = $client->get('contacts/details.json', ['contact-id' => $contactId]);
            send_json_response(['success' => true, 'contact' => $data], 200);
        } catch (Exception $e) {
            send_json_response([
                'success' => false,
                'error' => sanitize_exception_message($e, 'Contacto WHOIS no encontrado o no disponible.')
            ], 404);
        }
    }

    if (empty($customerId)) {
        send_json_response(['success' => false, 'error' => 'Debes proporcionar customer-id para listar contactos.'], 400);
    }

    try {
        $data = $client->get('contacts/search.json', [
            'customer-id' => $customerId,
            'no-of-records' => 10,
            'page-no' => 1
        ]);

        $contacts = [];
        if (is_array($data)) {
            foreach ($data as $key => $item) {
                if ($key === 'recsindb' || $key === 'recspage' || !is_array($item)) continue;

                $contacts[] = [
                    'contactId' => (string)($item['entity.entityid'] ?? $key),
                    'name' => $item['contact.name'] ?? '',
                    'company' => $item['contact.company'] ?? '',
                    'email' => $item['contact.emailaddr'] ?? '',
                    'type' => $item['contact.type'] ?? 'Contact',
                    'status' => $item['entity.currentstatus'] ?? 'Active'
                ];
            }
        }

        send_json_response([
            'success' => true,
            'count' => count($contacts),
            'contacts' => $contacts
        ], 200);

    } catch (Exception $e) {
        send_json_response([
            'success' => false,
            'count' => 0,
            'contacts' => [],
            'error' => sanitize_exception_message($e, 'No fue posible consultar los contactos WHOIS en el proveedor.')
        ], $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500);
    }
}

// 2. POST: Añadir nuevo contacto WHOIS
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $postData = json_decode(file_get_contents('php://input'), true);
    if (!is_array($postData)) {
        $postData = $_POST;
    }

    $customerId = trim($postData['customer_id'] ?? '');
    $name = trim($postData['name'] ?? '');
    $company = trim($postData['company'] ?? $name);
    $email = trim(strtolower($postData['email'] ?? ''));
    $address = trim($postData['address'] ?? '');
    $city = trim($postData['city'] ?? '');
    $state = trim($postData['state'] ?? '');
    $country = strtoupper(trim($postData['country'] ?? ''));
    $zipcode = trim($postData['zipcode'] ?? '');
    $telCc = preg_replace('/\D/', '', $postData['phone_cc'] ?? '');
    $telNo = preg_replace('/\D/', '', $postData['phone'] ?? '');

    if (empty($customerId)) {
        send_json_response(['success' => false, 'error' => 'El customer_id es obligatorio para registrar un contacto.'], 400);
    }
    if (empty($name)) {
        send_json_response(['success' => false, 'error' => 'El nombre del registrante es obligatorio.'], 400);
    }
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        send_json_response(['success' => false, 'error' => 'El email de contacto debe ser válido.'], 400);
    }
    if (empty($address) || empty($city) || empty($state) || empty($country) || empty($zipcode)) {
        send_json_response(['success' => false, 'error' => 'Todos los datos de dirección son obligatorios.'], 400);
    }
    if (empty($telNo) || empty($telCc)) {
        send_json_response(['success' => false, 'error' => 'El teléfono y el código de país son obligatorios.'], 400);
    }

    try {
        $newContactId = $client->post('contacts/add.json', [
            'name' => $name,
            'company' => $company ?: $name,
            'email' => $email,
            'address-line-1' => $address,
            'city' => $city,
            'state' => $state,
            'country' => $country,
            'zipcode' => $zipcode,
            'tel-no-cc' => $telCc,
            'tel-no' => $telNo,
            'customer-id' => $customerId,
            'type' => trim($postData['type'] ?? 'Contact')
        ]);

        if (empty($newContactId) || !is_numeric($newContactId)) {
            send_json_response(['success' => false, 'error' => 'No fue posible crear el contacto en el proveedor.'], 502);
        }

        send_json_response([
            'success' => true,
            'contactId' => (string)$newContactId,
            'customerId' => $customerId,
            'message' => 'Contacto WHOIS registrado exitosamente.'
        ], 201);

    } catch (Exception $e) {
        send_json_response([
            'success' => false,
            'error' => sanitize_exception_message($e, 'No fue posible registrar el contacto WHOIS en el proveedor.')
        ], $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500);
    }
}

send_json_response(['success' => false, 'error' => 'Método HTTP no permitido.'], 405);
