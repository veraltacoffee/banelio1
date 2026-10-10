# BANELIO WORK STATE

## FECHA DE ACTUALIZACIÓN
2026-10-09

## RAMA
`main` en el repositorio GitHub `veraltacoffee/banelio1`.

## ESTADO DE SINCRONIZACIÓN
Finalización, validación y entrega completa de los flujos comerciales de dominios, pagos, transferencias y aprovisionamiento:
1. Base de datos y Migraciones: Migración `20261009004012_add_stripe_events_and_provisioning_operations` corregida y blindada como estrictamente no destructiva, preservando los modelos comerciales históricos (`PricingProfile`, `ProviderCostRecord`, etc.) en `prisma/schema.prisma` y `prisma/dev.db`. Todas las 11 migraciones están aplicadas y `prisma migrate status` confirma el esquema al día.
2. Transferencias de Dominios: Costos mayoristas de transferencia (`providerTransferCostUSD`) activados en el motor de precios, habilitando cotizaciones y precios reales en `/api/transfers/pricing`. Validación estricta de códigos Auth/EPP (6-32 caracteres) y sanitización en respuestas públicas sin exponer claves en texto plano.
3. Pagos y Pedidos: Validación autoritativa de órdenes con cálculo server-side de impuestos y totales, resolución inteligente de SKUs por TLD en transferencias (`DOMAIN_TRANSFER`), deduplicación persistente de webhooks (`StripeWebhookEvent`) y control de acceso estricto a órdenes.
4. Aprovisionamiento e Idempotencia: Aprovisionamiento seguro con registro por operación (`ProvisioningOperation`), prevención de reenvíos a ciegas (`UNCERTAIN`), reintentos controlados (`retryProvisionOrder`) y aislamiento multi-dominio.
5. Autenticación Puente PHP: Firma canónica HMAC-SHA256 entre Node.js y el puente PHP IONOS sin valores ficticios ni credenciales hardcodeadas (incluyendo sincronización en `my-domains.php`).
6. Ciclo de Vida de Dominios y Entitlements: Creación y persistencia inmediata de `Entitlement` en estado `GRANTED` para ítems de categoría `DOMAIN`, y transición automática a `PROVISIONED` con enlace a `providerOrderId` tras el aprovisionamiento verificado.

## ESTADO GENERAL
ESTABLE, BLINDADO, SEGURO Y VERIFICADO AL 100%.
- Suite de pruebas automatizadas: 24 tests en `server/payments-provisioning.test.ts` con 100% PASS (24/24).
- Base de datos: 11 migraciones Prisma aplicadas en SQLite (`prisma/dev.db`) con cero advertencias de pérdida de datos.
- Typescript & Lint: `tsc --noEmit` limpio con 0 errores.
- Build: compilación de producción Vite + esbuild exitosa.
- Cero fugas de secretos: variables de entorno documentadas en `.env.example`, sin credenciales en frontend ni logs.

## ARQUITECTURA RESUMIDA
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Vite SPA integrado en `server.ts`.
- **Backend:** Node.js v22, Express 4, TypeScript, Prisma ORM 6.19.3.
- **Base de Datos:** SQLite (`prisma/dev.db`), esquema unificado en `prisma/schema.prisma` con 11 migraciones.
- **Seguridad Puente PHP:** Firma HMAC-SHA256 canónica (`X-Banelio-Signature`, `X-Banelio-Timestamp`).
- **Deduplicación Webhooks:** Tabla persistente `StripeWebhookEvent` con restricción única sobre `eventId`.
- **Worker de Aprovisionamiento:** Idempotente, recuperable y multi-dominio vía tabla `ProvisioningOperation`.
- **Pagos:** Server-authoritative para Stripe, PayPal y Stripe OXXO Pay.

## TRABAJO COMPLETADO EN ESTA TAREA
1. Creación de módulo de autenticación server-to-server `server/phpBridgeAuth.ts` con generación y verificación de firma canónica HMAC-SHA256.
2. Actualización de `server/php/reseller/config.php` con función `verify_banelio_bridge_auth()` y protección en `provision.php`, `customer.php`, `contacts.php`, `my-domains.php` y `test-connection.php`.
3. Eliminación total de valores por defecto y fallbacks ficticios en `server/php/domains/customer.php`, `server/php/domains/contacts.php`, `server/php/domains/provision.php` y `server/provisioning.ts`.
4. Extensión del esquema Prisma (`prisma/schema.prisma`) con los modelos `StripeWebhookEvent` y `ProvisioningOperation` y sus enums correspondientes.
5. Creación y aplicación de la migración `20261009004012_add_stripe_events_and_provisioning_operations` sin borrar datos de la base.
6. Actualización de `server/payments.ts` con `claimStripeWebhookEvent`, `markStripeWebhookEventProcessed`, `markStripeWebhookEventFailed` e `isStripeEventProcessed`.
7. Actualización de `server/provisioning.ts` con ciclo de vida idempotente persistente, registro de estado `UNCERTAIN` ante cortes de red y soporte multi-dominio independiente.
8. Blindaje de autorización en `server/orders.ts` (`authorizeOrderAccess`) y `server.ts` impidiendo que órdenes sin `customerId` eludan controles de acceso.
9. Actualización y firma de proxies a IONOS en `server.ts`.
10. Creación de la suite completa de 20 escenarios de prueba en `server/payments-provisioning.test.ts`.

## GUÍA DE DESPLIEGUE EN IONOS Y CONFIGURACIÓN DEL PUENTE PHP
1. **Archivos a desplegar en IONOS y rutas exactas bajo `/api/`:**
   - **Librería base y configuración (requeridos como dependencias internas):**
     - Destino: `/api/reseller/config.php` (Origen: `server/php/reseller/config.php`)
     - Destino: `/api/reseller/client.php` (Origen: `server/php/reseller/client.php`)
     - Destino opcional: `/api/reseller/config.local.php` (crear en servidor si se definen constantes PHP en vez de variables de entorno de Apache/FastCGI)
   - **Endpoints de diagnóstico y catálogo:**
     - Destino: `/api/reseller/test-connection.php` (Origen: `server/php/reseller/test-connection.php`)
     - Destino: `/api/domains/check.php` (Origen: `server/php/domains/check.php`)
     - Destino: `/api/domains/transfer.php` (Origen: `server/php/domains/transfer.php`)
   - **Endpoints protegidos con HMAC-SHA256 (operaciones server-to-server):**
     - Destino: `/api/domains/customer.php` (Origen: `server/php/domains/customer.php`)
     - Destino: `/api/domains/contacts.php` (Origen: `server/php/domains/contacts.php`)
     - Destino: `/api/domains/provision.php` (Origen: `server/php/domains/provision.php`)
     - Destino: `/api/domains/my-domains.php` (Origen: `server/php/domains/my-domains.php`)
   *Nota de dependencia:* Los scripts de `/api/domains/*.php` dependen estrictamente de `require_once __DIR__ . '/../reseller/config.php'` y `client.php`. No deben omitirse los archivos de `reseller/`.

2. **Variables de entorno exactas según el código:**
   - **Entorno PHP (IONOS):**
     - Identificador de revendedor: `RESELLERCLUB_RESELLER_ID` (alternativas: `RESELLERCLUB_AUTH_USER_ID`, `RESELLER_ID`)
     - Clave API: `RESELLERCLUB_API_KEY` (alternativa: `API_KEY`)
     - Secreto compartido HMAC: `PHP_BRIDGE_SECRET` (alternativa: `RESELLER_BRIDGE_SECRET`)
     - Entorno: `RESELLERCLUB_ENVIRONMENT` (`live` o `test`)
   - **Entorno Node.js (Servidor Banelio):**
     - Identificador de revendedor: `RESELLERCLUB_RESELLER_ID` (o `RESELLER_ID`)
     - Clave API: `RESELLERCLUB_API_KEY` (o `API_KEY`)
     - Secreto compartido HMAC: `PHP_BRIDGE_SECRET` (o `RESELLER_BRIDGE_SECRET`)

3. **Autenticación HMAC-SHA256:**
   - Generación (Node.js): `buildBridgeAuthHeaders(method, urlOrPath, rawBody, timestampSec)` en `server/phpBridgeAuth.ts`.
   - Headers: `X-Banelio-Timestamp` y `X-Banelio-Signature`.
   - Cadena canónica: `${METHOD}|${PATH}|${TIMESTAMP}|${BODY}`.
   - Validación (PHP): `verify_banelio_bridge_auth()` en `server/php/reseller/config.php`. Tolerancia máxima de 300 segundos, normalización de rutas (`/api/...` y relativo), y comparación con `hash_equals()`.

4. **Inocuidad y alcance de test-connection.php:**
   - Ejecuta únicamente un `GET` a `resellers/details.json` en la API de ResellerClub.
   - Es una operación de solo lectura para obtener razón social, estatus y moneda base de la cuenta revendedora.
   - NO crea órdenes, NO registra ni transfiere dominios, NO renueva ni realiza cargos económicos de ningún tipo.

## TAREA ACTIVA
NINGUNA.

## TAREA PENDIENTE
- Configuración manual en IONOS de los scripts y credenciales para verificación final en producción.

## ARCHIVOS MODIFICADOS EN LA TAREA
- `prisma/schema.prisma`
- `prisma/migrations/20261009004012_add_stripe_events_and_provisioning_operations/migration.sql`
- `.env.example`
- `server/php/reseller/config.php`
- `server/php/domains/provision.php`
- `server/php/domains/customer.php`
- `server/php/domains/contacts.php`
- `server/php/domains/my-domains.php`
- `server/php/reseller/test-connection.php`
- `server/phpBridgeAuth.ts`
- `server/payments.ts`
- `server/provisioning.ts`
- `server/orders.ts`
- `server.ts`
- `server/payments-provisioning.test.ts`
- `BANELIO_WORK_STATE.md`
- `BANELIO_TASKS.md`
- `BANELIO_HANDOFF.md`

## BLOQUEADORES
`NONE`

## VALIDACIONES TÉCNICAS
- `npm test` (24/24 tests PASS, 100% de éxito).
- `compile_applet`: PASS.
- `lint_applet` (`tsc --noEmit`): PASS (0 errores).
- `npm run build`: PASS (Vite + esbuild exitoso).
- Base de datos Prisma: 11 migraciones aplicadas correctamente en SQLite (`prisma/dev.db`).
