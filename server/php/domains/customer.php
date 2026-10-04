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

$client = new ResellerClubClient();

// ==========================================
// 1. GET: Consultar datos del cliente
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $customerId = isset($_GET['customer_id']) ? trim($_GET['customer_id']) : (isset($_GET['customer-id']) ? trim($_GET['customer-id']) : '');
    $email = isset($_GET['email']) ? trim(strtolower($_GET['email'])) : (isset($_GET['username']) ? trim(strtolower($_GET['username'])) : '');

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
            'error' => $e->getMessage()
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

    $email = isset($postData['email']) ? trim(strtolower($postData['email'])) : (isset($postData['username']) ? trim(strtolower($postData['username'])) : '');
    $name = isset($postData['name']) ? trim($postData['name']) : '';
    $company = isset($postData['company']) ? trim($postData['company']) : $name;
    $address = isset($postData['address']) ? trim($postData['address']) : (isset($postData['address1']) ? trim($postData['address1']) : '');
    $city = isset($postData['city']) ? trim($postData['city']) : '';
    $state = isset($postData['state']) ? trim($postData['state']) : 'Sinaloa';
    $country = isset($postData['country']) ? strtoupper(trim($postData['country'])) : 'MX';
    $zipcode = isset($postData['zipcode']) ? trim($postData['zipcode']) : (isset($postData['zip']) ? trim($postData['zip']) : '82000');
    $telCc = isset($postData['phone_cc']) ? preg_replace('/\D/', '', $postData['phone_cc']) : '52';
    $telNo = isset($postData['phone']) ? preg_replace('/\D/', '', $postData['phone']) : '6691000000';
    $lang = isset($postData['lang']) ? trim($postData['lang']) : 'es';

    // Validación de obligatorios
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
            'tel-no-cc' => !empty($telCc) ? $telCc : '52',
            'tel-no' => !empty($telNo) ? $telNo : '6691000000',
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
            'error' => $e->getMessage()
        ], $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500);
    }
}

send_json_response(['success' => false, 'error' => 'Método HTTP no permitido.'], 405);
