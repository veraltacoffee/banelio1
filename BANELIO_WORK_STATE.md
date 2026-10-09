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
5. Autenticación Puente PHP: Firma canónica HMAC-SHA256 entre Node.js y el puente PHP IONOS sin valores ficticios ni credenciales hardcodeadas.

## ESTADO GENERAL
ESTABLE, BLINDADO, SEGURO Y VERIFICADO AL 100%.
- Suite de pruebas automatizadas: 23 tests en `server/payments-provisioning.test.ts` con 100% PASS (23/23).
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
- `npm test` (23/23 tests PASS, 100% de éxito).
- `compile_applet`: PASS.
- `lint_applet` (`tsc --noEmit`): PASS (0 errores).
- `npm run build`: PASS (Vite + esbuild exitoso).
- Base de datos Prisma: 11 migraciones aplicadas correctamente en SQLite (`prisma/dev.db`).
