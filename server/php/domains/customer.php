<?php
/**
 * BANELIO - Gestión Mínima de Clientes en ResellerClub
 * Archivo: server/php/domains/customer.php
 *
 * Operaciones necesarias para consultar y crear cuentas de cliente en el proveedor.
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

// ==========================================
// 1. GET: Consultar datos del cliente
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $customerId = trim($_GET['customer_id'] ?? $_GET['customer-id'] ?? '');
    $email = trim(strtolower($_GET['email'] ?? $_GET['username'] ?? ''));

    if (empty($customerId) && empty($email)) {
        send_json_response([
            'success' => false,
            'error' => 'Debes proporcionar customer-id o email.'
        ], 400);
    }

    try {
        $params = [];
        if (!empty($customerId)) {
            $params['customer-id'] = $customerId;
        } else {
            $params['username'] = $email;
        }

        $data = $client->get('customers/details.json', $params);

        if (!is_array($data) || empty($data['customerid'])) {
            send_json_response([
                'success' => false,
                'error' => 'Cliente no encontrado en el proveedor.'
            ], 404);
        }

        $sanitized = [
            'customerId' => (string)$data['customerid'],
            'username' => isset($data['user_name']) ? $data['user_name'] : '',
            'name' => isset($data['name']) ? $data['name'] : '',
            'company' => isset($data['company']) ? $data['company'] : '',
            'city' => isset($data['city']) ? $data['city'] : '',
            'state' => isset($data['state']) ? $data['state'] : '',
            'country' => isset($data['country']) ? $data['country'] : '',
            'status' => isset($data['customer_status']) ? $data['customer_status'] : 'Active'
        ];

        send_json_response([
            'success' => true,
            'customer' => $sanitized
        ], 200);

    } catch (Exception $e) {
        send_json_response([
            'success' => false,
            'error' => sanitize_exception_message($e, 'No fue posible consultar los datos del cliente.')
        ], $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500);
    }
}

// ==========================================
// 2. POST: Alta de cliente en el proveedor
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Aceptar JSON en request body o form-data
    $rawInput = file_get_contents('php://input');
    $postData = json_decode($rawInput, true);
    if (!is_array($postData)) {
        $postData = $_POST;
    }

    $email = trim(strtolower($postData['email'] ?? $postData['username'] ?? ''));
    $name = trim($postData['name'] ?? '');
    $company = trim($postData['company'] ?? $name);
    $address = trim($postData['address'] ?? $postData['address1'] ?? '');
    $city = trim($postData['city'] ?? '');
    $state = trim($postData['state'] ?? '');
    $country = strtoupper(trim($postData['country'] ?? ''));
    $zipcode = trim($postData['zipcode'] ?? $postData['zip'] ?? '');
    $telCc = preg_replace('/\D/', '', $postData['phone_cc'] ?? $postData['tel-no-cc'] ?? '');
    $telNo = preg_replace('/\D/', '', $postData['phone'] ?? $postData['tel-no'] ?? '');
    $lang = trim($postData['lang'] ?? 'es');

    // Validación estricta de datos reales obligatorios (sin valores ficticios)
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        send_json_response(['success' => false, 'error' => 'El correo electrónico es obligatorio y debe ser válido.'], 400);
    }
    if (empty($name) || strlen($name) < 3) {
        send_json_response(['success' => false, 'error' => 'El nombre completo es obligatorio.'], 400);
    }
    if (empty($address)) {
        send_json_response(['success' => false, 'error' => 'La dirección física es obligatoria.'], 400);
    }
    if (empty($city)) {
        send_json_response(['success' => false, 'error' => 'La ciudad es obligatoria.'], 400);
    }
    if (empty($state)) {
        send_json_response(['success' => false, 'error' => 'El estado o provincia es obligatorio.'], 400);
    }
    if (empty($country)) {
        send_json_response(['success' => false, 'error' => 'El código de país es obligatorio.'], 400);
    }
    if (empty($zipcode)) {
        send_json_response(['success' => false, 'error' => 'El código postal es obligatorio.'], 400);
    }
    if (empty($telNo)) {
        send_json_response(['success' => false, 'error' => 'El número telefónico es obligatorio.'], 400);
    }
    if (empty($telCc)) {
        send_json_response(['success' => false, 'error' => 'El código de país del teléfono (phone_cc) es obligatorio.'], 400);
    }

    try {
        // Primero verificar si ya existe
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
            // Continúa con el registro si no existe
        }

        // Generar contraseña robusta y aleatoria para el proveedor
        $passwd = 'Bnl!' . bin2hex(random_bytes(6)) . '9A';

        $signupParams = [
            'username' => $email,
            'passwd' => $passwd,
            'name' => $name,
            'company' => !empty($company) ? $company : $name,
            'address-line-1' => $address,
            'city' => $city,
            'state' => $state,
            'country' => $country,
            'zipcode' => $zipcode,
            'tel-no-cc' => $telCc,
            'tel-no' => $telNo,
            'lang-pref' => $lang
        ];

        $newCustomerId = $client->post('customers/signup.json', $signupParams);

        if (empty($newCustomerId) || !is_numeric($newCustomerId)) {
            send_json_response([
                'success' => false,
                'error' => 'No fue posible crear la cuenta de cliente en el proveedor.'
            ], 502);
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
