<?php
/**
 * BANELIO - Aprovisionamiento Oficial de Dominios en ResellerClub
 * Archivo: server/php/domains/provision.php
 *
 * Ejecuta el registro o transferencia de dominios en ResellerClub
 * tras la confirmación verificada de pago.
 */

require_once __DIR__ . '/../reseller/config.php';
require_once __DIR__ . '/../reseller/client.php';

apply_banelio_cors();
verify_banelio_bridge_auth();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    send_json_response(['success' => false, 'error' => 'Método HTTP no permitido. Se requiere POST.'], 405);
}

$postData = json_decode(file_get_contents('php://input'), true);
if (!is_array($postData)) {
    $postData = $_POST;
}

$action = strtolower(trim($postData['action'] ?? 'register'));
$domainRaw = trim($postData['domain'] ?? '');
$years = (int)($postData['years'] ?? 1);
if ($years < 1 || $years > 10) $years = 1;

if (empty($domainRaw)) {
    send_json_response(['success' => false, 'error' => 'El nombre de dominio es obligatorio para aprovisionar.'], 400);
}

$domainClean = strtolower(preg_replace('/^https?:\/\//i', '', $domainRaw));
$domainClean = preg_replace('/^www\./i', '', $domainClean);
$domainClean = rtrim($domainClean, '/');
$parts = explode('.', $domainClean);

if (count($parts) < 2) {
    send_json_response(['success' => false, 'error' => 'Dominio inválido. Debe incluir nombre y extensión (ej. midominio.com).'], 400);
}

$sld = $parts[0];
$tld = implode('.', array_slice($parts, 1));

$customerId = trim($postData['customer_id'] ?? '');
$contactId = trim($postData['contact_id'] ?? '');
$authCode = trim($postData['auth_code'] ?? $postData['epp_code'] ?? '');

$ns = (isset($postData['ns']) && is_array($postData['ns']) && count($postData['ns']) >= 2)
    ? $postData['ns']
    : ['ns1.orderbox-host.com', 'ns2.orderbox-host.com'];

if ($action === 'transfer') {
    if (empty($authCode) || strlen($authCode) < 6 || strlen($authCode) > 32) {
        send_json_response(['success' => false, 'error' => 'El código Auth/EPP es obligatorio y debe tener entre 6 y 32 caracteres.'], 400);
    }
}

try {
    $client = new ResellerClubClient();

    if (!$client->isConfigured()) {
        send_json_response(['success' => false, 'error' => 'Credenciales de ResellerClub no configuradas en el servidor.'], 503);
    }

    $reg = (isset($postData['registrant']) && is_array($postData['registrant'])) ? $postData['registrant'] : $postData;

    $customerEmail = trim(strtolower($reg['email'] ?? ''));
    $customerName = trim($reg['name'] ?? '');
    $companyName = trim($reg['company'] ?? $reg['org'] ?? $customerName);
    $regAddress = trim($reg['address'] ?? '');
    $regCity = trim($reg['city'] ?? '');
    $regState = trim($reg['state'] ?? '');
    $regCountry = strtoupper(trim($reg['country'] ?? ''));
    $regZip = trim($reg['postalCode'] ?? $reg['zipcode'] ?? '');
    $regPhone = preg_replace('/\D/', '', $reg['phone'] ?? '');
    $regPhoneCc = preg_replace('/\D/', '', $reg['phone_cc'] ?? '');

    if (empty($customerEmail) || !filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
        send_json_response(['success' => false, 'error' => 'El correo electrónico del registrante es obligatorio y debe ser válido.'], 400);
    }
    if (empty($customerName) || strlen($customerName) < 3) {
        send_json_response(['success' => false, 'error' => 'El nombre completo del registrante es obligatorio.'], 400);
    }
    if (empty($regAddress) || empty($regCity) || empty($regState) || empty($regCountry) || empty($regZip)) {
        send_json_response(['success' => false, 'error' => 'Faltan datos obligatorios de dirección física del registrante.'], 400);
    }
    if (empty($regPhone) || empty($regPhoneCc)) {
        send_json_response(['success' => false, 'error' => 'El teléfono y código de país del registrante son obligatorios.'], 400);
    }

    // 1. Resolver o registrar cliente
    if (empty($customerId)) {
        try {
            $existingCustomer = $client->get('customers/details.json', ['username' => $customerEmail]);
            if (is_array($existingCustomer) && !empty($existingCustomer['customerid'])) {
                $customerId = (string)$existingCustomer['customerid'];
            }
        } catch (Exception $e) {}

        if (empty($customerId)) {
            $passwd = 'Bnl!' . bin2hex(random_bytes(6)) . '9A';
            $newCustId = $client->post('customers/signup.json', [
                'username' => $customerEmail,
                'passwd' => $passwd,
                'name' => $customerName,
                'company' => $companyName ?: $customerName,
                'address-line-1' => $regAddress,
                'city' => $regCity,
                'state' => $regState,
                'country' => $regCountry,
                'zipcode' => $regZip,
                'tel-no-cc' => $regPhoneCc,
                'tel-no' => $regPhone,
                'lang-pref' => 'es'
            ]);

            if (empty($newCustId) || !is_numeric($newCustId)) {
                send_json_response(['success' => false, 'error' => 'No fue posible registrar la cuenta de cliente en ResellerClub.'], 502);
            }
            $customerId = (string)$newCustId;
        }
    }

    // 2. Resolver o registrar contacto WHOIS
    if (empty($contactId)) {
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
            $newContactId = $client->post('contacts/add.json', [
                'name' => $customerName,
                'company' => $companyName ?: $customerName,
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
            ]);

            if (empty($newContactId) || !is_numeric($newContactId)) {
                send_json_response(['success' => false, 'error' => 'No fue posible crear el contacto WHOIS en ResellerClub.'], 502);
            }
            $contactId = (string)$newContactId;
        }
    }

    // 3. Ejecutar llamada al proveedor
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
        $orderId = is_array($resellerResponse)
            ? (string)($resellerResponse['entityid'] ?? $resellerResponse['orderid'] ?? '')
            : (is_numeric($resellerResponse) ? (string)$resellerResponse : '');

        if (empty($orderId)) {
            $rawMsg = is_array($resellerResponse) && isset($resellerResponse['message'])
                ? (string)$resellerResponse['message']
                : 'ResellerClub no devolvió confirmación del registro.';
            send_json_response(['success' => false, 'error' => translate_resellerclub_error($rawMsg)], 502);
        }

        $rcStatus = is_array($resellerResponse) && isset($resellerResponse['status'])
            ? trim($resellerResponse['status'])
            : 'Success';
        $isProvisioned = in_array(strtolower($rcStatus), ['success', 'active'], true);

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
        $orderId = is_array($resellerResponse)
            ? (string)($resellerResponse['entityid'] ?? $resellerResponse['orderid'] ?? '')
            : (is_numeric($resellerResponse) ? (string)$resellerResponse : '');

        if (empty($orderId)) {
            $rawMsg = is_array($resellerResponse) && isset($resellerResponse['message'])
                ? (string)$resellerResponse['message']
                : 'ResellerClub no devolvió confirmación de la transferencia.';
            send_json_response(['success' => false, 'error' => translate_resellerclub_error($rawMsg)], 502);
        }

        send_json_response([
            'success' => true,
            'action' => 'transfer',
            'domain' => $domainClean,
            'orderId' => $orderId,
            'customerId' => $customerId,
            'contactId' => $contactId,
            'status' => 'TRANSFER_INITIATED',
            'message' => "Orden de transferencia para {$domainClean} iniciada exitosamente en ResellerClub (ID: {$orderId})."
        ], 200);

    } else {
        send_json_response(['success' => false, 'error' => "Acción no soportada: {$action}."], 400);
    }

} catch (Exception $e) {
    send_json_response([
        'success' => false,
        'action' => $action,
        'domain' => $domainClean,
        'error' => sanitize_exception_message($e, 'Fallo durante el aprovisionamiento del dominio en el proveedor.')
    ], $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500);
}
