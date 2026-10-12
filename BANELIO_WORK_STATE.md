# BANELIO WORK STATE

## FECHA DE ACTUALIZACIÓN
2026-10-11

## RAMA
`main` en el repositorio GitHub `veraltacoffee/banelio1`.

## ESTADO DE SINCRONIZACIÓN
## ESTADO DE SINCRONIZACIÓN
Implementación y consolidación de la búsqueda y disponibilidad autoritativa de dominios (`DOMAIN-SEARCH-AVAILABILITY-MODULE1`):
1. Búsqueda oficial y en tiempo real conectada a la API de ResellerClub mediante el puente PHP en IONOS (`server/php/domains/check.php`).
2. Mapeo estricto y autoritativo de disponibilidad basado exclusivamente en el proveedor: `available`, `regthroughothers` (transferible), `regthroughus` (en Banelio) y `unknown` (falla o estado no concluyente), sin inventar dominios libres ni ocupar registros legítimos.
3. Soporte multi-extensión agrupado en un solo viaje de red mediante la función `searchDomainsWithAlternatives` en `src/services/domainService.ts`.
4. Manejo robusto de errores sin permitir agregar al carrito o transferir dominios no verificados en `HeroDomainSearch.tsx` y `DomainsLanding.tsx`.

## ESTADO GENERAL
FLUIDO Y VALIDADO — MÓDULO 1 DE BÚSQUEDA Y DISPONIBILIDAD DE DOMINIOS CONCLUIDO.
- TypeScript & Lint: 0 errores, sin dependencias ficticias ni datos simulados.
- Base de datos Prisma: 11 migraciones aplicadas correctamente en SQLite (`prisma/dev.db`).
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
1. **Resolución Autoritativa en `server/php/domains/check.php`:** Soporte para múltiples TLDs vía parámetros combinados, retención de `raw_status`, mapeo seguro diferenciando `available`, `regthroughothers`, `regthroughus` y `unknown`, y validación estricta contra resultados vacíos o respuestas de error del registry.
2. **Servicio Frontend Unificado en `src/services/domainService.ts`:** Ampliadas interfaces `DomainCheckRawResponse` y creado el método batch `searchDomainsWithAlternatives` para consultar el dominio solicitado y extensiones populares en un solo viaje de red HTTP conectando con precios comerciales reales de `/api/domains/pricing`.
3. **Consistencia en Vistas de Búsqueda:** Actualizados `HeroDomainSearch.tsx` y `DomainsLanding.tsx` para usar la búsqueda multi-extensión autoritativa, diferenciando visualmente estados concluyentes de estados `unknown`/`error` y protegiendo el flujo contra transferencias o compras accidentales de dominios no verificados.

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
- `server/php/domains/check.php` (Modificado: mapeo estricto, retención de raw_status y soporte multi-extensión)
- `src/services/domainService.ts` (Modificado: agregado `searchDomainsWithAlternatives`, refinado `checkDomainAvailability`)
- `src/components/public/HeroDomainSearch.tsx` (Modificado: integrado búsqueda autoritativa multi-extensión)
- `src/components/public/DomainsLanding.tsx` (Modificado: integrado búsqueda autoritativa y diferenciación de estados)
- `BANELIO_TASKS.md` (Actualizado: tarea `DOMAIN-SEARCH-AVAILABILITY-MODULE1` completada)
- `BANELIO_WORK_STATE.md` (Actualizado)
- `BANELIO_HANDOFF.md` (Actualizado)

## BLOQUEADORES
- `RESELLERCLUB-CONTROLLED-TESTING-PHASE2`: Bloqueada temporalmente por dependencia externa de credenciales activas en entorno IONOS y autorización expresa del usuario.

## VALIDACIONES TÉCNICAS
- Pruebas y compilación postergadas al cierre integral según instrucciones operativas.
- Base de datos Prisma: 11 migraciones aplicadas correctamente en SQLite (`prisma/dev.db`).
