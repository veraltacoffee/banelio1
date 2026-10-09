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

$client = new ResellerClubClient();

// ==========================================
// 1. GET: Consultar contactos de un cliente
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $customerId = isset($_GET['customer_id']) ? trim($_GET['customer_id']) : (isset($_GET['customer-id']) ? trim($_GET['customer-id']) : '');
    $contactId = isset($_GET['contact_id']) ? trim($_GET['contact_id']) : (isset($_GET['contact-id']) ? trim($_GET['contact-id']) : '');

    // Consulta específica de un contacto
    if (!empty($contactId)) {
        try {
            $data = $client->get('contacts/details.json', ['contact-id' => $contactId]);
            send_json_response(['success' => true, 'contact' => $data], 200);
        } catch (Exception $e) {
            send_json_response(['success' => false, 'error' => $e->getMessage()], 404);
        }
    }

    if (empty($customerId)) {
        send_json_response([
            'success' => false,
            'error' => 'Debes proporcionar customer-id para listar contactos.'
        ], 400);
    }

    try {
        $params = [
            'customer-id' => $customerId,
            'no-of-records' => 10,
            'page-no' => 1
        ];

        $data = $client->get('contacts/search.json', $params);

        $contacts = [];
        if (is_array($data)) {
            foreach ($data as $key => $item) {
                if ($key === 'recsindb' || $key === 'recspage') continue;
                if (!is_array($item)) continue;

                $contacts[] = [
                    'contactId' => isset($item['entity.entityid']) ? (string)$item['entity.entityid'] : $key,
                    'name' => isset($item['contact.name']) ? $item['contact.name'] : '',
                    'company' => isset($item['contact.company']) ? $item['contact.company'] : '',
                    'email' => isset($item['contact.emailaddr']) ? $item['contact.emailaddr'] : '',
                    'type' => isset($item['contact.type']) ? $item['contact.type'] : 'Contact',
                    'status' => isset($item['entity.currentstatus']) ? $item['entity.currentstatus'] : 'Active'
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
            'error' => $e->getMessage()
        ], $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500);
    }
}

// ==========================================
// 2. POST: Añadir nuevo contacto WHOIS
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $postData = json_decode($rawInput, true);
    if (!is_array($postData)) {
        $postData = $_POST;
    }

    $customerId = isset($postData['customer_id']) ? trim($postData['customer_id']) : (isset($postData['customer-id']) ? trim($postData['customer-id']) : '');
    $name = isset($postData['name']) ? trim($postData['name']) : '';
    $company = isset($postData['company']) ? trim($postData['company']) : $name;
    $email = isset($postData['email']) ? trim(strtolower($postData['email'])) : '';
    $address = isset($postData['address1']) ? trim($postData['address1']) : (isset($postData['address']) ? trim($postData['address']) : '');
    $city = isset($postData['city']) ? trim($postData['city']) : '';
    $state = isset($postData['state']) ? trim($postData['state']) : '';
    $country = isset($postData['country']) ? strtoupper(trim($postData['country'])) : '';
    $zipcode = isset($postData['zipcode']) ? trim($postData['zipcode']) : (isset($postData['zip']) ? trim($postData['zip']) : '');
    $telCc = isset($postData['phone_cc']) ? preg_replace('/\D/', '', $postData['phone_cc']) : (isset($postData['tel-no-cc']) ? preg_replace('/\D/', '', $postData['tel-no-cc']) : '');
    $telNo = isset($postData['phone']) ? preg_replace('/\D/', '', $postData['phone']) : (isset($postData['tel-no']) ? preg_replace('/\D/', '', $postData['tel-no']) : '');
    $type = isset($postData['type']) ? trim($postData['type']) : 'Contact';

    if (empty($customerId)) {
        send_json_response(['success' => false, 'error' => 'El customer_id es obligatorio para registrar un contacto.'], 400);
    }
    if (empty($name)) {
        send_json_response(['success' => false, 'error' => 'El nombre del registrante es obligatorio.'], 400);
    }
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        send_json_response(['success' => false, 'error' => 'El email de contacto debe ser válido.'], 400);
    }
    if (empty($address) || empty($city)) {
        send_json_response(['success' => false, 'error' => 'La dirección física y la ciudad son obligatorias.'], 400);
    }
    if (empty($state)) {
        send_json_response(['success' => false, 'error' => 'El estado o provincia es obligatorio.'], 400);
    }
    if (empty($country)) {
        send_json_response(['success' => false, 'error' => 'El país es obligatorio.'], 400);
    }
    if (empty($zipcode)) {
        send_json_response(['success' => false, 'error' => 'El código postal es obligatorio.'], 400);
    }
    if (empty($telNo)) {
        send_json_response(['success' => false, 'error' => 'El teléfono de contacto es obligatorio.'], 400);
    }
    if (empty($telCc)) {
        $telCc = '1';
    }

    try {
        $contactParams = [
            'name' => $name,
            'company' => !empty($company) ? $company : $name,
            'email' => $email,
            'address-line-1' => $address,
            'city' => $city,
            'state' => $state,
            'country' => $country,
            'zipcode' => $zipcode,
            'tel-no-cc' => !empty($telCc) ? $telCc : '52',
            'tel-no' => $telNo,
            'customer-id' => $customerId,
            'type' => $type
        ];

        $newContactId = $client->post('contacts/add.json', $contactParams);

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
            'error' => $e->getMessage()
        ], $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500);
    }
}

send_json_response(['success' => false, 'error' => 'Método HTTP no permitido.'], 405);
