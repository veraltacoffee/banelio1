<?php
/**
 * BANELIO - Aprovisionamiento Oficial de Dominios en ResellerClub
 * Archivo: server/php/domains/provision.php
 *
 * Ejecuta el registro o transferencia de dominios en ResellerClub
 * de forma server-authoritative tras la confirmación verificada de pago.
 *
 * Operaciones soportadas:
 *  - 'register': Registro de nuevo dominio (domains/register.json)
 *  - 'transfer': Transferencia de dominio existente (domains/transfer.json)
 *
 * NUNCA simula éxito: devuelve el orderId/entityId real de ResellerClub
 * o el error detallado del proveedor.
 */

require_once __DIR__ . '/../reseller/config.php';
require_once __DIR__ . '/../reseller/client.php';

apply_banelio_cors();
verify_banelio_bridge_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json_response([
        'success' => false,
        'error' => 'Método HTTP no permitido. Se requiere POST.'
    ], 405);
}

// Leer cuerpo JSON o POST form-data
$rawInput = file_get_contents('php://input');
$postData = json_decode($rawInput, true);
if (!is_array($postData)) {
    $postData = $_POST;
}

$action = isset($postData['action']) ? strtolower(trim($postData['action'])) : 'register';
$domainRaw = isset($postData['domain']) ? trim($postData['domain']) : '';
$years = isset($postData['years']) ? (int)$postData['years'] : 1;
if ($years < 1 || $years > 10) {
    $years = 1;
}

// Validación de dominio
if (empty($domainRaw)) {
    send_json_response([
        'success' => false,
        'error' => 'El nombre de dominio es obligatorio para aprovisionar.'
    ], 400);
}

$domainClean = strtolower(preg_replace('/^https?:\/\//i', '', $domainRaw));
$domainClean = preg_replace('/^www\./i', '', $domainClean);
$domainClean = rtrim($domainClean, '/');
$parts = explode('.', $domainClean);

if (count($parts) < 2) {
    send_json_response([
        'success' => false,
        'error' => 'Dominio inválido. Debe incluir nombre y extensión (ej. midominio.com).'
    ], 400);
}

$sld = $parts[0];
$tld = implode('.', array_slice($parts, 1));

// Datos del registrante/cliente
$customerId = isset($postData['customer_id']) ? trim($postData['customer_id']) : '';
$contactId = isset($postData['contact_id']) ? trim($postData['contact_id']) : '';
$authCode = isset($postData['auth_code']) ? trim($postData['auth_code']) : (isset($postData['epp_code']) ? trim($postData['epp_code']) : '');

// Nameservers opcionales (default ResellerClub / Banelio DNS)
$ns = isset($postData['ns']) && is_array($postData['ns']) && count($postData['ns']) >= 2
    ? $postData['ns']
    : ['ns1.orderbox-host.com', 'ns2.orderbox-host.com'];

// Validación específica para transferencias
if ($action === 'transfer') {
    if (empty($authCode)) {
        send_json_response([
            'success' => false,
            'error' => 'El código Auth/EPP es obligatorio para transferir un dominio.'
        ], 400);
    }
    $authLen = strlen($authCode);
    if ($authLen < 6 || $authLen > 32) {
        send_json_response([
            'success' => false,
            'error' => 'El código Auth/EPP debe tener entre 6 y 32 caracteres.'
        ], 400);
    }
}

try {
    $client = new ResellerClubClient();

    if (!$client->isConfigured()) {
        send_json_response([
            'success' => false,
            'error' => 'Credenciales de ResellerClub no configuradas en el servidor IONOS.'
        ], 503);
    }

    $registrant = isset($postData['registrant']) && is_array($postData['registrant'])
        ? $postData['registrant']
        : [];

    $customerEmail = isset($registrant['email']) ? trim(strtolower($registrant['email'])) : (isset($postData['email']) ? trim(strtolower($postData['email'])) : '');
    $customerName = isset($registrant['name']) ? trim($registrant['name']) : (isset($postData['name']) ? trim($postData['name']) : '');
    $companyName = !empty($registrant['company']) ? trim($registrant['company']) : (!empty($registrant['org']) ? trim($registrant['org']) : $customerName);

    $regAddress = !empty($registrant['address']) ? trim($registrant['address']) : (isset($postData['address']) ? trim($postData['address']) : '');
    $regCity = !empty($registrant['city']) ? trim($registrant['city']) : (isset($postData['city']) ? trim($postData['city']) : '');
    $regState = !empty($registrant['state']) ? trim($registrant['state']) : (isset($postData['state']) ? trim($postData['state']) : '');
    $regCountry = !empty($registrant['country']) ? strtoupper(trim($registrant['country'])) : (isset($postData['country']) ? strtoupper(trim($postData['country'])) : '');
    $regZip = !empty($registrant['postalCode']) ? trim($registrant['postalCode']) : (!empty($registrant['zipcode']) ? trim($registrant['zipcode']) : (isset($postData['zipcode']) ? trim($postData['zipcode']) : ''));
    $regPhone = !empty($registrant['phone']) ? preg_replace('/\D/', '', $registrant['phone']) : (isset($postData['phone']) ? preg_replace('/\D/', '', $postData['phone']) : '');
    $regPhoneCc = !empty($registrant['phone_cc']) ? preg_replace('/\D/', '', $registrant['phone_cc']) : (isset($postData['phone_cc']) ? preg_replace('/\D/', '', $postData['phone_cc']) : '');

    // Validación estricta de registrante: prohibición de datos incompletos o ficticios
    if (empty($customerEmail) || !filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
        send_json_response([
            'success' => false,
            'error' => 'El correo electrónico del registrante es obligatorio y debe ser válido.'
        ], 400);
    }
    if (empty($customerName) || strlen($customerName) < 3) {
        send_json_response([
            'success' => false,
            'error' => 'El nombre completo del registrante es obligatorio para operar en ResellerClub.'
        ], 400);
    }
    if (empty($regAddress) || empty($regCity) || empty($regState) || empty($regCountry) || empty($regZip)) {
        send_json_response([
            'success' => false,
            'error' => 'Faltan datos obligatorios de dirección del registrante (dirección, ciudad, estado, código postal o país). No se permite el uso de información ficticia.'
        ], 400);
    }
    if (empty($regPhone)) {
        send_json_response([
            'success' => false,
            'error' => 'El número telefónico del registrante es obligatorio. No se permite el uso de información ficticia.'
        ], 400);
    }
    if (empty($regPhoneCc)) {
        send_json_response([
            'success' => false,
            'error' => 'El código de país del teléfono (phone_cc) es obligatorio. No se permite el uso de información ficticia ni prefijos predeterminados.'
        ], 400);
    }

    // 1. Resolver o registrar el cliente en ResellerClub si no se pasó customer_id
    if (empty($customerId)) {
        // Buscar si ya existe por email/username
        try {
            $existingCustomer = $client->get('customers/details.json', ['username' => $customerEmail]);
            if (is_array($existingCustomer) && !empty($existingCustomer['customerid'])) {
                $customerId = (string)$existingCustomer['customerid'];
            }
        } catch (Exception $e) {
            // No existe, procederemos a registrarlo con datos reales
        }

        if (empty($customerId)) {
            $passwd = 'Bnl!' . bin2hex(random_bytes(6)) . '9A';
            $signupData = [
                'username' => $customerEmail,
                'passwd' => $passwd,
                'name' => $customerName,
                'company' => !empty($companyName) ? $companyName : $customerName,
                'address-line-1' => $regAddress,
                'city' => $regCity,
                'state' => $regState,
                'country' => $regCountry,
                'zipcode' => $regZip,
                'tel-no-cc' => $regPhoneCc,
                'tel-no' => $regPhone,
                'lang-pref' => 'es'
            ];

            $newCustId = $client->post('customers/signup.json', $signupData);
            if (empty($newCustId) || !is_numeric($newCustId)) {
                send_json_response([
                    'success' => false,
                    'error' => 'No fue posible registrar la cuenta de cliente en ResellerClub.'
                ], 502);
            }
            $customerId = (string)$newCustId;
        }
    }

    // 2. Resolver o registrar contacto WHOIS si no se pasó contact_id
    if (empty($contactId)) {
        // Buscar si ya tiene contactos creados
        try {
            $contactsSearch = $client->get('contacts/search.json', [
                'customer-id' => $customerId,
                'no-of-records' => 1,
                'page-no' => 1
            ]);
            if (is_array($contactsSearch)) {
                foreach ($contactsSearch as $k => $item) {
                    if ($k === 'recsindb' || $k === 'recspage') continue;
                    if (is_array($item) && isset($item['entity.entityid'])) {
                        $contactId = (string)$item['entity.entityid'];
                        break;
                    }
                }
            }
        } catch (Exception $e) {}

        if (empty($contactId)) {
            $contactParams = [
                'name' => $customerName,
                'company' => !empty($companyName) ? $companyName : $customerName,
                'email' => $customerEmail,
                'address-line-1' => $regAddress,
                'city' => $regCity,
                'state' => $regState,
                'country' => $regCountry,
                'zipcode' => $regZip,
                'tel-no-cc' => $regPhoneCc,
                'tel-no' => $regPhone,
                'customer-id' => $customerId,
                'type' => 'Contact'
            ];

            $newContactId = $client->post('contacts/add.json', $contactParams);
            if (empty($newContactId) || !is_numeric($newContactId)) {
                send_json_response([
                    'success' => false,
                    'error' => 'No fue posible crear el contacto WHOIS en ResellerClub.'
                ], 502);
            }
            $contactId = (string)$newContactId;
        }
    }

    // 3. Ejecutar la llamada de aprovisionamiento en ResellerClub
    if ($action === 'register') {
        $regParams = [
            'domain-name' => $sld,
            'tlds' => [$tld],
            'years' => $years,
            'ns' => $ns,
            'customer-id' => $customerId,
            'reg-contact-id' => $contactId,
            'admin-contact-id' => $contactId,
            'tech-contact-id' => $contactId,
            'billing-contact-id' => $contactId,
            'invoice-option' => 'NoInvoice',
            'protect-privacy' => 'false'
        ];

        $resellerResponse = $client->post('domains/register.json', $regParams);

        // ResellerClub retorna { "actiontype": "AddDomain", "entityid": "123456", "status": "Success", ... }
        $orderId = null;
        if (is_array($resellerResponse)) {
            $orderId = isset($resellerResponse['entityid'])
                ? (string)$resellerResponse['entityid']
                : (isset($resellerResponse['orderid']) ? (string)$resellerResponse['orderid'] : null);
        } elseif (is_numeric($resellerResponse)) {
            $orderId = (string)$resellerResponse;
        }

        if (empty($orderId)) {
            $errorMsg = is_array($resellerResponse) && isset($resellerResponse['message'])
                ? $resellerResponse['message']
                : 'ResellerClub no devolvió confirmación del registro.';
            send_json_response([
                'success' => false,
                'error' => $errorMsg,
                'raw' => $resellerResponse
            ], 502);
        }

        $rcStatus = is_array($resellerResponse) && isset($resellerResponse['status'])
            ? trim($resellerResponse['status'])
            : 'Success';
        $isProvisioned = strtolower($rcStatus) === 'success' || strtolower($rcStatus) === 'active';

        send_json_response([
            'success' => true,
            'action' => 'register',
            'domain' => $domainClean,
            'orderId' => $orderId,
            'customerId' => $customerId,
            'contactId' => $contactId,
            'years' => $years,
            'status' => $isProvisioned ? 'PROVISIONED' : 'PENDING_REGISTRATION',
            'providerStatus' => $rcStatus,
            'message' => $isProvisioned
                ? "Dominio {$domainClean} registrado exitosamente en ResellerClub."
                : "Registro de {$domainClean} enviado al proveedor. Estado actual: {$rcStatus}."
        ], 200);

    } elseif ($action === 'transfer') {
        $transParams = [
            'domain-name' => $domainClean,
            'auth-code' => $authCode,
            'ns' => $ns,
            'customer-id' => $customerId,
            'reg-contact-id' => $contactId,
            'admin-contact-id' => $contactId,
            'tech-contact-id' => $contactId,
            'billing-contact-id' => $contactId,
            'invoice-option' => 'NoInvoice',
            'protect-privacy' => 'false'
        ];

        $resellerResponse = $client->post('domains/transfer.json', $transParams);

        $orderId = null;
        if (is_array($resellerResponse)) {
            $orderId = isset($resellerResponse['entityid'])
                ? (string)$resellerResponse['entityid']
                : (isset($resellerResponse['orderid']) ? (string)$resellerResponse['orderid'] : null);
        } elseif (is_numeric($resellerResponse)) {
            $orderId = (string)$resellerResponse;
        }

        if (empty($orderId)) {
            $errorMsg = is_array($resellerResponse) && isset($resellerResponse['message'])
                ? $resellerResponse['message']
                : 'ResellerClub no devolvió confirmación de la transferencia.';
            send_json_response([
                'success' => false,
                'error' => $errorMsg,
                'raw' => $resellerResponse
            ], 502);
        }

        send_json_response([
            'success' => true,
            'action' => 'transfer',
            'domain' => $domainClean,
            'orderId' => $orderId,
            'customerId' => $customerId,
            'contactId' => $contactId,
            'status' => 'TRANSFER_INITIATED',
            'message' => "Orden de transferencia para {$domainClean} iniciada exitosamente en ResellerClub (ID: {$orderId}). En espera de confirmación y liberación por el registry."
        ], 200);

    } else {
        send_json_response([
            'success' => false,
            'error' => "Acción no soportada: {$action}. Solo 'register' o 'transfer'."
        ], 400);
    }

} catch (Exception $e) {
    send_json_response([
        'success' => false,
        'action' => $action,
        'domain' => $domainClean,
        'error' => $e->getMessage()
    ], $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500);
}
