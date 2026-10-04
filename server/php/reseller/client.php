<?php
/**
 * BANELIO - Cliente HTTP Oficial para ResellerClub API
 * Archivo: server/php/reseller/client.php
 *
 * Encapsula llamadas cURL hacia la HTTP API de ResellerClub con autenticación automática.
 */

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

        $this->resellerId = $config['resellerId'];
        $this->apiKey = $config['apiKey'];
        $this->baseUrl = rtrim($config['baseUrl'], '/') . '/';
        $this->environment = $config['environment'];
    }

    public function isConfigured() {
        return !empty($this->resellerId) && !empty($this->apiKey);
    }

    public function getEnvironment() {
        return $this->environment;
    }

    public function getBaseUrl() {
        return $this->baseUrl;
    }

    public function getResellerIdMasked() {
        if (empty($this->resellerId)) return 'NO CONFIGURADO';
        $len = strlen($this->resellerId);
        return $len > 4 ? substr($this->resellerId, 0, 2) . '***' . substr($this->resellerId, -2) : '***';
    }

    /**
     * Petición GET hacia ResellerClub
     */
    public function get($endpoint, array $params = []) {
        return $this->request('GET', $endpoint, $params);
    }

    /**
     * Petición POST hacia ResellerClub
     */
    public function post($endpoint, array $params = []) {
        return $this->request('POST', $endpoint, $params);
    }

    /**
     * Ejecutor centralizado de cURL con inyección de auth-userid y api-key
     */
    public function request($method, $endpoint, array $params = []) {
        if (!$this->isConfigured()) {
            throw new Exception('Credenciales de ResellerClub no configuradas en el servidor.', 503);
        }

        $endpointClean = ltrim($endpoint, '/');
        $url = $this->baseUrl . $endpointClean;

        // Inyectar credenciales oficiales de forma obligatoria
        $authParams = [
            'auth-userid' => $this->resellerId,
            'api-key' => $this->apiKey
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->timeout);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 6);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Banelio-PHP-Client/2.0');

        $method = strtoupper($method);

        if ($method === 'GET') {
            $allParams = array_merge($authParams, $params);
            $queryString = http_build_query($allParams);
            $fullUrl = $url . (strpos($url, '?') === false ? '?' : '&') . $queryString;
            curl_setopt($ch, CURLOPT_URL, $fullUrl);
            curl_setopt($ch, CURLOPT_HTTPGET, true);
        } elseif ($method === 'POST') {
            // En ResellerClub HTTP API, auth-userid y api-key pueden ir en query o post body
            $allParams = array_merge($authParams, $params);
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($allParams));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/x-www-form-urlencoded'
            ]);
        } else {
            throw new Exception("Método HTTP no soportado: {$method}", 405);
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErrno = curl_errno($ch);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlErrno !== 0) {
            throw new Exception("Error de red conectando con ResellerClub: {$curlError}", 502);
        }

        $decoded = json_decode($response, true);

        // Si la respuesta no es JSON válido (ej. error 500 HTML de Cloudflare/Proxy)
        if ($decoded === null && !empty($response)) {
            if ($httpCode >= 400) {
                throw new Exception("El proveedor respondió con error HTTP {$httpCode}.", 502);
            }
            // En algunas llamadas simples devuelve un id escalar
            return trim($response);
        }

        // Detección de error semántico oficial de ResellerClub
        if (is_array($decoded)) {
            if (isset($decoded['status']) && strtoupper($decoded['status']) === 'ERROR') {
                $msg = isset($decoded['message']) ? $decoded['message'] : 'Error en la operación solicitada a ResellerClub.';
                throw new Exception($msg, 400);
            }
        }

        if ($httpCode >= 400) {
            $msg = is_array($decoded) && isset($decoded['message']) ? $decoded['message'] : "Error HTTP {$httpCode} del proveedor.";
            throw new Exception($msg, $httpCode);
        }

        return $decoded;
    }
}
