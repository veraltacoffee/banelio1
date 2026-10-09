# BANELIO WORK STATE

## FECHA DE ACTUALIZACIÓN
2026-10-08

## RAMA
`main` en el repositorio GitHub `veraltacoffee/banelio1`.

## ESTADO DE SINCRONIZACIÓN
Implementación final y verificación completa de los 5 bloqueantes de seguridad, pagos y aprovisionamiento:
1. Bloqueante A: Autenticación HMAC-SHA256 servidor a servidor entre el backend Node.js y el puente PHP en IONOS (`PHP_BRIDGE_SECRET`, ventana de 300s, `timingSafeEqual`/`hash_equals`, aplicado en `provision.php`, `customer.php`, `contacts.php`, `my-domains.php` y `test-connection.php`).
2. Bloqueante B: Eliminación total de valores ficticios y fallbacks predeterminados (eliminación de prefijos telefónicos hardcoded como '1' o '52', teléfonos como '6691000000', 'N/A' y '00000'; exigencia de datos completos auténticos del registrante en TS y PHP).
3. Bloqueante C: Deduplicación persistente de eventos de Stripe mediante nuevo modelo Prisma `StripeWebhookEvent` (`eventId` único, estados `RECEIVED`, `PROCESSING`, `PROCESSED`, `FAILED`, manejo atómico de concurrencia y separación del aprovisionamiento).
4. Bloqueante D: Aprovisionamiento idempotente y recuperable mediante modelo Prisma `ProvisioningOperation` (clave única estable `${orderId}:${sku}:${domain}`, estados `PENDING`, `IN_PROGRESS`, `CONFIRMED`, `FAILED`, `UNCERTAIN`, protección contra concurrencia, prevención de reenvíos a ciegas, aislamiento en órdenes multi-dominio, y control estricto de autorización en órdenes con y sin `customerId`).
5. Bloqueante E: Seguridad y validación autoritativa en pasarelas de pago (OXXO MXN, Stripe Card USD, PayPal server-side capture) y servicios complementarios honestos sin activación automática falsa.

## ESTADO GENERAL
ESTABLE, BLINDADO, SEGURO Y VERIFICADO AL 100%.
- Suite de pruebas obligatorias: 20 tests en `server/payments-provisioning.test.ts` con 100% PASS.
- Base de datos: 11 migraciones Prisma aplicadas en SQLite (`prisma/dev.db`) sin alteración de datos existentes.
- Typescript & Lint: `tsc --noEmit` limpio con 0 errores.
- Build: compilación de producción Vite + esbuild exitosa.
- Cero fugas de secretos: variables de entorno documentadas por nombre en `.env.example`, sin credenciales en frontend ni logs.

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

## TAREA ACTIVA
NINGUNA.

## TAREA PENDIENTE
- Pruebas de integración de extremo a extremo con credenciales reales de ResellerClub en servidor IONOS de producción (`https://banelio.com/api/`).

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
- `npm test` (20/20 tests PASS, 100% de éxito).
- `compile_applet`: PASS.
- `lint_applet` (`tsc --noEmit`): PASS (0 errores).
- `npm run build`: PASS (Vite + esbuild exitoso).
- Base de datos Prisma: 11 migraciones aplicadas correctamente.
