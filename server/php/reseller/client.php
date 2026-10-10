<?php
/**
 * BANELIO - Cliente HTTP Oficial para ResellerClub API
 * Archivo: server/php/reseller/client.php
 *
 * Encapsula llamadas cURL hacia la HTTP API de ResellerClub con autenticación automática.
 */

// Bloqueo estricto de acceso HTTP directo a este archivo de biblioteca
if (isset($_SERVER['SCRIPT_FILENAME']) && realpath($_SERVER['SCRIPT_FILENAME']) === realpath(__FILE__)) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'error' => 'Acceso directo denegado.'], JSON_UNESCAPED_UNICODE);
    exit;
}

require_once __DIR__ . '/config.php';

class ResellerClubClient {
    private $resellerId;
    private $apiKey;
    private $baseUrl;
    private $environment;
    private $timeout = 20;

    public function __construct(array $config = null) {
        if ($config === null) {
            $config = get_resellerclub_config();
        }

        $this->resellerId = $config['resellerId'] ?? '';
        $this->apiKey = $config['apiKey'] ?? '';
        $this->baseUrl = rtrim($config['baseUrl'] ?? '', '/') . '/';
        $this->environment = $config['environment'] ?? 'sandbox';
    }

    public function isConfigured() {
        return !empty($this->resellerId) && !empty($this->apiKey);
    }

    public function getEnvironment() {
        return $this->environment;
    }

    public function getResellerIdMasked() {
        if (empty($this->resellerId)) return 'NO CONFIGURADO';
        $len = strlen($this->resellerId);
        return $len > 4 ? substr($this->resellerId, 0, 2) . '***' . substr($this->resellerId, -2) : '***';
    }

    public function get($endpoint, array $params = []) {
        return $this->request('GET', $endpoint, $params);
    }

    public function post($endpoint, array $params = []) {
        return $this->request('POST', $endpoint, $params);
    }

    public function request($method, $endpoint, array $params = []) {
        if (!$this->isConfigured()) {
            throw new Exception('Credenciales de ResellerClub no configuradas en el servidor.', 503);
        }

        $url = $this->baseUrl . ltrim($endpoint, '/');
        $authParams = [
            'auth-userid' => $this->resellerId,
            'api-key' => $this->apiKey
        ];
        $allParams = array_merge($authParams, $params);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->timeout);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 6);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Banelio-PHP-Client/2.0');

        $method = strtoupper($method);

        if ($method === 'GET') {
            $queryString = http_build_query($allParams);
            $fullUrl = $url . (strpos($url, '?') === false ? '?' : '&') . $queryString;
            curl_setopt($ch, CURLOPT_URL, $fullUrl);
            curl_setopt($ch, CURLOPT_HTTPGET, true);
        } elseif ($method === 'POST') {
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($allParams));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
        } else {
            throw new Exception("Método HTTP no soportado: {$method}", 405);
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErrno = curl_errno($ch);
        curl_close($ch);

        if ($curlErrno !== 0) {
            throw new Exception("No fue posible establecer conexión con el proveedor mayorista.", 502);
        }

        $decoded = json_decode($response, true);

        if ($decoded === null && !empty($response)) {
            if ($httpCode >= 400) {
                throw new Exception("El proveedor mayorista respondió con una falla temporal de servicio.", 502);
            }
            return trim($response);
        }

        if (is_array($decoded) && isset($decoded['status']) && strtoupper($decoded['status']) === 'ERROR') {
            throw new Exception(translate_resellerclub_error($decoded['message'] ?? ''), 400);
        }

        if ($httpCode >= 400) {
            $rawMsg = is_array($decoded) && isset($decoded['message']) ? (string)$decoded['message'] : '';
            $msg = !empty($rawMsg) ? translate_resellerclub_error($rawMsg) : 'Error en la comunicación con el proveedor mayorista.';
            throw new Exception($msg, $httpCode >= 500 ? 502 : $httpCode);
        }

        return $decoded;
    }
}
