# BANELIO WORK STATE

## FECHA DE ACTUALIZACIÓN
2026-10-09

## RAMA
`main` en el repositorio GitHub `veraltacoffee/banelio1`.

## ESTADO DE SINCRONIZACIÓN
Consolidación final del Paso 1 (Integración mínima, segura y funcional con ResellerClub):
1. Proxies y Rutas API en Node.js (`server.ts`): Implementados proxies protegidos POST para `/api/domains/customer.php`, `/api/domains/contacts.php` y `/api/domains/transfer.php` con firma HMAC-SHA256 idéntica al cuerpo enviado. Conservados GET existentes, soporte para reenvío de extensiones (`tlds`/`tld`) en `/api/domains/check.php`, y unificación de URL base dinámica (`getBridgeBaseUrl()`) sin URLs hardcodeadas.
2. Autenticación HMAC-SHA256 y Falla Segura (`server/phpBridgeAuth.ts` & `server/php/reseller/config.php`): Validación estricta y sincronizada de marcas de tiempo numéricas (`^\d+$`), firmas hexadecimales de 64 caracteres (`^[a-f0-9]{64}$`), ventana de 300 segundos, rechazo seguro de secretos vacíos y protección contra timing attacks (`timingSafeEqual` y `hash_equals`).
3. Diagnóstico y Salud del Sistema (`server.ts` & `server/health.ts`): `/api/registry/status` y `/api/reseller/test-connection` honestos, distinguiendo `CONNECTED` (solo tras confirmación remota exitosa) de `CONFIGURED_NOT_VERIFIED` y `NOT_CONFIGURED`. Retirado código muerto (`getRegistryConfig`) y variables obsoletas en `.env.example`.
4. Suite de Pruebas Automatizadas: 43 tests en total (27 pagos/aprovisionamiento + 8 seguridad PHP + 8 integración ResellerClub bridge) con 100% PASS (43/43).

## ESTADO GENERAL
PASO 1 CONSOLIDADO — PREPARADO PARA PRUEBAS DEL PASO 2.
- Suite de pruebas automatizadas: 43 tests con 100% PASS (43/43).
- TypeScript & Lint: `tsc --noEmit` limpio con 0 errores.
- Compilación y Build: `compile_applet` PASS y `npm run build` (Vite + esbuild) exitoso.
- Verificación PHP: Comprobada estructura de archivos PHP y políticas de seguridad; entorno local sin binario PHP CLI (verificación PHP CLI declarada pendiente para Paso 2 en IONOS).
- Cero fugas de secretos: Códigos EPP protegidos fuera de URLs, logs y respuestas públicas; credenciales de ResellerClub aisladas en servidor.

## ARQUITECTURA RESUMIDA
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Vite SPA integrado en `server.ts`.
- **Backend:** Node.js v22, Express 4, TypeScript, Prisma ORM 6.19.3.
- **Base de Datos:** SQLite (`prisma/dev.db`), esquema unificado en `prisma/schema.prisma` con 11 migraciones.
- **Seguridad Puente PHP:** Firma HMAC-SHA256 canónica (`X-Banelio-Signature`, `X-Banelio-Timestamp`), protección `.htaccess` y sanitización estricta de excepciones.
- **Deduplicación Webhooks:** Tabla persistente `StripeWebhookEvent` con restricción única sobre `eventId`.
- **Worker de Aprovisionamiento:** Idempotente, recuperable y multi-dominio vía tabla `ProvisioningOperation`.
- **Pagos:** Server-authoritative para Stripe, PayPal y Stripe OXXO Pay.

## TRABAJO COMPLETADO EN ESTA TAREA
1. **Blindaje de Bibliotecas PHP contra Ejecución HTTP Directa:** Añadida comprobación de `SCRIPT_FILENAME` vs `__FILE__` en `server/php/reseller/config.php` y `server/php/reseller/client.php` retornando HTTP 403 (`Acceso directo denegado`).
2. **Eliminación Total de Fugas de Información Técnica:** 
   - Eliminada la variable interna `$curlError` de las excepciones en `client.php`, sustituyéndola por mensajes genéricos y registro seguro sin credenciales.
   - Eliminados payloads crudos del proveedor (`'raw' => $resellerResponse`) en `server/php/domains/provision.php`.
   - Incorporados sanitizadores centralizados `sanitize_exception_message()` y `translate_resellerclub_error()` en `config.php` aplicados a todos los bloques `catch` de `test-connection.php`, `my-domains.php`, `customer.php`, `contacts.php`, `provision.php` y `transfer.php`.
3. **Corrección de Falsos Positivos en `my-domains.php`:**
   - Incorporada verificación previa de `$client->isConfigured()` que retorna HTTP 503 si faltan credenciales en lugar de continuar y simular fallo.
   - Distinción rigurosa de errores: fallas de infraestructura (502 red, 503 configuración, 401/403 autenticación) se propagan como error al cliente, evitando el enmascaramiento falso de "0 dominios".
4. **Protección Apache `.htaccess` para IONOS:**
   - Creado `/api/.htaccess` (`server/php/.htaccess`) bloqueando `.env`, `.local.php`, `config.local.php`, `config.php`, `client.php`, `.json`, logs y repositorios, con compatibilidad para Apache 2.4 (`Require all denied`) y Apache 2.2 (`Deny from all`).
   - Creado `/api/reseller/.htaccess` (`server/php/reseller/.htaccess`) bloqueando inclusión de configuración y permitiendo solo el endpoint de diagnóstico `test-connection.php`.
   - Creada plantilla `server/php/reseller/config.local.php.example` con bloqueo de acceso directo y guía de configuración en IONOS.
5. **Carga Segura de Configuración Local:** Función `load_banelio_local_config()` que busca `config.local.php` prioritariamente un nivel arriba fuera de la raíz web pública (óptimo en hosting compartido IONOS) y localmente bajo `.htaccess`.
6. **Preservación Estricta:** `server.ts`, `server/customerDomains.ts`, `server/payments-provisioning.test.ts` y `server/php/domains/check.php` se mantuvieron 100% intactos conforme a las reglas.
7. **Suite de Pruebas:** Creado `server/php-bridge-security.test.ts` con 8 tests dedicados de seguridad PHP, alcanzando 35/35 tests exitosos (100% PASS).

## GUÍA DE DESPLIEGUE EN IONOS Y CONFIGURACIÓN DEL PUENTE PHP
1. **Archivos a desplegar en IONOS (bajo la raíz web /api/):**
   - `/api/.htaccess` (Protección perimetral Apache)
   - `/api/reseller/.htaccess` (Protección del directorio reseller)
   - `/api/reseller/config.php` (Biblioteca central y helpers de seguridad)
   - `/api/reseller/client.php` (Cliente HTTP cURL protegido)
   - `/api/reseller/test-connection.php` (Diagnóstico seguro de solo lectura)
   - `/api/reseller/config.local.php` (Credenciales del servidor, o colocar fuera de la raíz web)
   - `/api/domains/check.php` (Búsqueda de disponibilidad en tiempo real)
   - `/api/domains/transfer.php` (Comprobación y validación Auth/EPP)
   - `/api/domains/customer.php` (Consulta y alta de clientes con HMAC)
   - `/api/domains/contacts.php` (Consulta y alta de contactos WHOIS con HMAC)
   - `/api/domains/provision.php` (Aprovisionamiento y transferencias con HMAC)
   - `/api/domains/my-domains.php` (Listado seguro de dominios del cliente con HMAC)
2. **Variables de entorno o constantes requeridas en IONOS:**
   - `RESELLERCLUB_RESELLER_ID`, `RESELLERCLUB_API_KEY`, `PHP_BRIDGE_SECRET`, `RESELLERCLUB_ENVIRONMENT` ('sandbox' o 'live').
   - Pueden definirse mediante directivas Apache `SetEnv` en IONOS o dentro de `config.local.php`.
3. **Autenticación HMAC-SHA256:**
   - Headers: `X-Banelio-Timestamp` y `X-Banelio-Signature`. Cadena: `METHOD|PATH|TIMESTAMP|BODY`.
4. **Verificación:**
   - `GET /api/reseller/test-connection.php` (100% de solo lectura).

## ARCHIVOS MODIFICADOS Y CREADOS EN LA TAREA
- `server/php/reseller/config.php` (Modificado: protección de acceso directo, carga unificada, sanitización)
- `server/php/reseller/client.php` (Modificado: protección de acceso directo, sanitización de excepciones)
- `server/php/reseller/test-connection.php` (Modificado: sanitización de errores)
- `server/php/domains/my-domains.php` (Modificado: validación de configuración, distinción de 0 dominios vs errores)
- `server/php/domains/customer.php` (Modificado: validación de configuración, sanitización de errores)
- `server/php/domains/contacts.php` (Modificado: validación de configuración, sanitización de errores)
- `server/php/domains/provision.php` (Modificado: eliminación de respuestas crudas, sanitización)
- `server/php/domains/transfer.php` (Modificado: sanitización de errores)
- `server/php/.htaccess` (Creado: reglas de seguridad perimetral Apache 2.4/2.2)
- `server/php/reseller/.htaccess` (Creado: protección específica reseller)
- `server/php/reseller/config.local.php.example` (Creado: plantilla segura de credenciales)
- `server/php-bridge-security.test.ts` (Creado: suite de 8 tests automatizados de seguridad PHP)
- `BANELIO_TASKS.md` (Actualizado: tarea completada)
- `BANELIO_WORK_STATE.md` (Actualizado)
- `BANELIO_HANDOFF.md` (Actualizado)

## BLOQUEADORES
`NONE`

## VALIDACIONES TÉCNICAS
- `npm test` (35/35 tests PASS, 100% de éxito).
- `compile_applet`: PASS.
- `lint_applet` (`tsc --noEmit`): PASS (0 errores).
- `npm run build`: PASS (Vite + esbuild exitoso).
- Base de datos Prisma: 11 migraciones aplicadas correctamente en SQLite (`prisma/dev.db`).
