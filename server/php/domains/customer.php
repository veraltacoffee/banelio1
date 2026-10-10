<?php
/**
 * BANELIO - Gestión de Clientes en ResellerClub
 * Archivo: server/php/domains/customer.php
 *
 * Operaciones para consultar y registrar clientes en el proveedor.
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

// 1. GET: Consultar datos del cliente
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $customerId = trim($_GET['customer_id'] ?? '');
    $email = trim(strtolower($_GET['email'] ?? ''));

    if (empty($customerId) && empty($email)) {
        send_json_response(['success' => false, 'error' => 'Debes proporcionar customer-id o email.'], 400);
    }

    try {
        $params = !empty($customerId) ? ['customer-id' => $customerId] : ['username' => $email];
        $data = $client->get('customers/details.json', $params);

        if (!is_array($data) || empty($data['customerid'])) {
            send_json_response(['success' => false, 'error' => 'Cliente no encontrado en el proveedor.'], 404);
        }

        send_json_response([
            'success' => true,
            'customer' => [
                'customerId' => (string)$data['customerid'],
                'username' => $data['user_name'] ?? '',
                'name' => $data['name'] ?? '',
                'company' => $data['company'] ?? '',
                'city' => $data['city'] ?? '',
                'state' => $data['state'] ?? '',
                'country' => $data['country'] ?? '',
                'status' => $data['customer_status'] ?? 'Active'
            ]
        ], 200);

    } catch (Exception $e) {
        send_json_response([
            'success' => false,
            'error' => sanitize_exception_message($e, 'No fue posible consultar los datos del cliente.')
        ], $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500);
    }
}

// 2. POST: Alta de cliente en el proveedor
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $postData = json_decode(file_get_contents('php://input'), true);
    if (!is_array($postData)) {
        $postData = $_POST;
    }

    $email = trim(strtolower($postData['email'] ?? ''));
    $name = trim($postData['name'] ?? '');
    $company = trim($postData['company'] ?? $name);
    $address = trim($postData['address'] ?? '');
    $city = trim($postData['city'] ?? '');
    $state = trim($postData['state'] ?? '');
    $country = strtoupper(trim($postData['country'] ?? ''));
    $zipcode = trim($postData['zipcode'] ?? '');
    $telCc = preg_replace('/\D/', '', $postData['phone_cc'] ?? '');
    $telNo = preg_replace('/\D/', '', $postData['phone'] ?? '');

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        send_json_response(['success' => false, 'error' => 'El correo electrónico es obligatorio y debe ser válido.'], 400);
    }
    if (empty($name) || strlen($name) < 3) {
        send_json_response(['success' => false, 'error' => 'El nombre completo es obligatorio.'], 400);
    }
    if (empty($address) || empty($city) || empty($state) || empty($country) || empty($zipcode)) {
        send_json_response(['success' => false, 'error' => 'Todos los campos de dirección física son obligatorios.'], 400);
    }
    if (empty($telNo) || empty($telCc)) {
        send_json_response(['success' => false, 'error' => 'El número telefónico y el código de país son obligatorios.'], 400);
    }

    try {
        // Verificar si ya existe previamente
        try {
            $existing = $client->get('customers/details.json', ['username' => $email]);
            if (is_array($existing) && !empty($existing['customerid'])) {
                send_json_response([
                    'success' => true,
                    'customerId' => (string)$existing['customerid'],
                    'alreadyExisted' => true,
                    'message' => 'El cliente ya se encuentra registrado en el proveedor.'
                ], 200);
            }
        } catch (Exception $e) {
            // No existe, continuar con signup
        }

        $passwd = 'Bnl!' . bin2hex(random_bytes(6)) . '9A';
        $newCustomerId = $client->post('customers/signup.json', [
            'username' => $email,
            'passwd' => $passwd,
            'name' => $name,
            'company' => $company ?: $name,
            'address-line-1' => $address,
            'city' => $city,
            'state' => $state,
            'country' => $country,
            'zipcode' => $zipcode,
            'tel-no-cc' => $telCc,
            'tel-no' => $telNo,
            'lang-pref' => trim($postData['lang'] ?? 'es')
        ]);

        if (empty($newCustomerId) || !is_numeric($newCustomerId)) {
            send_json_response(['success' => false, 'error' => 'No fue posible crear la cuenta de cliente en el proveedor.'], 502);
        }

        send_json_response([
            'success' => true,
            'customerId' => (string)$newCustomerId,
            'alreadyExisted' => false,
            'message' => 'Cliente registrado exitosamente en ResellerClub.'
        ], 201);

    } catch (Exception $e) {
        send_json_response([
            'success' => false,
            'error' => sanitize_exception_message($e, 'No fue posible registrar el cliente en el proveedor.')
        ], $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500);
    }
}

send_json_response(['success' => false, 'error' => 'Método HTTP no permitido.'], 405);
