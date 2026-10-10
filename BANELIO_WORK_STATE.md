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
1. Consolidación del alcance definitivo centrado exclusivamente en dominios: búsqueda, disponibilidad, registro, transferencia (EPP/Auth) y renovación.
2. Retiro del escaparate y desactivación de funciones comerciales fuera de alcance (hosting, correo, SSL independiente, afiliados y paneles de socios).
3. Blindaje de secretos locales: incorporación de `config.local.php`, `server/php/**/config.local.php` y `*.local.php` en `.gitignore`.
4. Mitigación contra despliegues involuntarios en vivo: ajuste de entorno por defecto a `'sandbox'` en `server/php/reseller/config.php` si se omite la variable.
5. Actualización y coherencia de documentos de contexto: `docs/AI-CONTEXT.md`, `BANELIO_WORK_STATE.md` y `BANELIO_HANDOFF.md`.
6. Preservación íntegra de la base de datos (11 migraciones Prisma en SQLite), autenticación HMAC-SHA256 y la suite completa de pruebas.

## GUÍA DE DESPLIEGUE EN IONOS Y CONFIGURACIÓN DEL PUENTE PHP
1. **Archivos a desplegar en IONOS (bajo la raíz web /api/):**
   - `/api/reseller/config.php` (Biblioteca base)
   - `/api/reseller/client.php` (Cliente HTTP cURL)
   - `/api/reseller/test-connection.php` (Diagnóstico seguro de solo lectura)
   - `/api/reseller/config.local.php` (Opcional, si se definen constantes PHP locales en el servidor)
   - `/api/domains/check.php` (Búsqueda de disponibilidad en tiempo real)
   - `/api/domains/transfer.php` (Comprobación y validación Auth/EPP)
   - `/api/domains/customer.php` (Consulta y alta de clientes con HMAC)
   - `/api/domains/contacts.php` (Consulta y alta de contactos WHOIS con HMAC)
   - `/api/domains/provision.php` (Aprovisionamiento y transferencias con HMAC)
   - `/api/domains/my-domains.php` (Listado seguro de dominios del cliente con HMAC)
2. **Variables de entorno requeridas:**
   - **En PHP (IONOS):** `RESELLERCLUB_RESELLER_ID`, `RESELLERCLUB_API_KEY`, `PHP_BRIDGE_SECRET`, `RESELLERCLUB_ENVIRONMENT` (por defecto `sandbox`, cambiar a `live` cuando se pase a producción real).
   - **En Node.js:** `RESELLERCLUB_RESELLER_ID`, `RESELLERCLUB_API_KEY`, `PHP_BRIDGE_SECRET`.
3. **Autenticación HMAC-SHA256:**
   - Headers: `X-Banelio-Timestamp` y `X-Banelio-Signature`. Cadena: `METHOD|PATH|TIMESTAMP|BODY`.
4. **Verificación de conexión segura:**
   - `test-connection.php` realiza únicamente un `GET` a `resellers/details.json`. Es 100% de solo lectura y no realiza cargos ni compras.

## ARCHIVOS MODIFICADOS EN LA TAREA
- `.gitignore`
- `server/php/reseller/config.php`
- `src/components/layout/Navbar.tsx`
- `src/components/dashboard/CustomerDashboard.tsx`
- `src/components/public/CartModal.tsx`
- `docs/AI-CONTEXT.md`
- `BANELIO_WORK_STATE.md`
- `BANELIO_HANDOFF.md`

## BLOQUEADORES
`NONE`

## VALIDACIONES TÉCNICAS
- `npm test` (24/24 tests PASS, 100% de éxito).
- `compile_applet`: PASS.
- `lint_applet` (`tsc --noEmit`): PASS (0 errores).
- `npm run build`: PASS (Vite + esbuild exitoso).
- Base de datos Prisma: 11 migraciones aplicadas correctamente en SQLite (`prisma/dev.db`).
