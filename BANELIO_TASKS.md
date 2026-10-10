# BANELIO TASKS — Cola Compacta de Tareas

## COMPLETED

### TASK: CONTINUITY-SYSTEM-INIT
- **TASK ID:** CONTINUITY-SYSTEM-INIT
- **STATUS:** COMPLETED
- **PRIORITY:** HIGHEST
- **OWNER:** AI Studio System Engineer
- **OBJECTIVE:** Establecer, alinear y validar el sistema permanente de continuidad documental multi-cuenta para Banelio, garantizando que cualquier cuenta de AI Studio pueda retomar el trabajo directamente desde GitHub `main` sin depender del historial de conversaciones previas.
- **ALLOWED FILES:** `BANELIO_HANDOFF.md`, `BANELIO_RULES.md`, `BANELIO_WORK_STATE.md`, `BANELIO_TASKS.md`
- **FORBIDDEN FILES:** Todos los archivos de código de aplicación (`src/*`, `server/*`, `prisma/*`, `package.json`, etc.)
- **DEPENDENCIES:** Ninguna
- **VALIDATION:** Verificación de consistencia entre los 4 documentos, `lint_applet` (PASS), `compile_applet` (PASS).
- **HANDOFF:** Los 4 archivos de contexto persistente quedan alineados y sin contradicciones.

---

### TASK: DOMAIN-TRANSFER-CHECKOUT
- **TASK ID:** DOMAIN-TRANSFER-CHECKOUT
- **STATUS:** COMPLETED
- **PRIORITY:** HIGH
- **OWNER:** Checkout & Domains Team
- **OBJECTIVE:** Migrar el flujo de transferencia de dominios al checkout comercial estándar de Banelio y retirar la dependencia de los scripts PHP históricos remotos (`transfer-order.php`, `transfer-auth.php`, `transfer-status.php`), manteniendo `transfer.php` exclusivamente para validación de transferibilidad.
- **ALLOWED FILES:**
  - `server.ts`
  - `src/components/public/DomainTransferModal.tsx`
  - `src/services/domainService.ts`
  - `src/components/public/CheckoutModal.tsx`
  - `server/orders.ts`
- **FORBIDDEN FILES:**
  - `prisma/*` (prohibido ejecutar migraciones o modificar esquema)
  - `server/auth.ts`
  - `server/payments.ts`
  - `server/tax.ts`
  - `package.json`
  - `server/php/*`
- **DEPENDENCIES:** `server/php/domains/transfer.php` (verificación remota de transferibilidad), Motor de órdenes `server/orders.ts`, Prisma `Entitlement`.
- **VALIDATION:**
  - `npx tsc --noEmit` limpio (0 errores).
  - `compile_applet` exitoso.
  - Verificación de validación remota de dominio transferible vía `/api/domains/transfer.php`.
  - Validación de Auth/EPP Code (6 a 32 caracteres) tanto en modal (`DomainTransferModal.tsx`) como en validación server-side (`server/orders.ts`).
  - Creación de orden comercial estándar con SKU `DOMAIN_TRANSFER` en `/api/orders/create`.
  - Salida pública sanitizada en `toPublicOrder` (`hasEppCode: true` sin exponer la clave en texto plano).
  - Sin dependencias activas de `transfer-order.php`, `transfer-auth.php` ni `transfer-status.php`.
- **HANDOFF:** Flujo migrado al checkout comercial estándar y validado en todas sus capas. Los 4 documentos de continuidad actualizados.

---

### TASK: FINAL-SECURITY-PAYMENTS-PROVISIONING-IMPLEMENTATION
- **TASK ID:** FINAL-SECURITY-PAYMENTS-PROVISIONING-IMPLEMENTATION
- **STATUS:** COMPLETED
- **PRIORITY:** HIGHEST
- **OWNER:** Security, Core Backend & Provisioning Architecture
- **OBJECTIVE:** Resolver y verificar de forma exhaustiva los 5 bloqueantes críticos del sistema Banelio:
  1. Bloqueante A: Autenticación HMAC-SHA256 servidor a servidor en endpoints protegidos del puente PHP (`PHP_BRIDGE_SECRET`, ventana de 300s, `timingSafeEqual`/`hash_equals`).
  2. Bloqueante B: Eliminación radical de todos los datos ficticios y fallbacks (prefijos telefónicos default como '1' o '52', números '6691000000', 'N/A' y '00000').
  3. Bloqueante C: Deduplicación persistente en base de datos para webhooks Stripe con el modelo `StripeWebhookEvent`, restricción única sobre `eventId` y manejo atómico de entregas simultáneas.
  4. Bloqueante D: Aprovisionamiento server-authoritative idempotente y recuperable con el modelo `ProvisioningOperation`, gestión de estado `UNCERTAIN` ante pérdida de red, reconciliación controlada, aislamiento multi-dominio y blindaje de órdenes sin `customerId`.
  5. Bloqueante E: Validación estricta autoritativa de pagos (OXXO MXN, Stripe Card USD, PayPal server-side) y servicios complementarios sin activación automática simulada.
- **ALLOWED FILES:**
  - `prisma/schema.prisma`
  - `prisma/migrations/*`
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
- **DEPENDENCIES:** Prisma SQLite `dev.db`, ResellerClub PHP Bridge, Stripe Webhooks
- **VALIDATION:**
  - `npm test` ejecutando los 20 tests obligatorios con 100% PASS (20/20 aprobados).
  - `tsc --noEmit` limpio (0 errores).
  - `compile_applet` exitoso.
  - `npm run build` exitoso (Vite + esbuild).
  - Migración Prisma `20261009004012_add_stripe_events_and_provisioning_operations` creada y aplicada.
  - Verificación de ausencia total de datos ficticios en flujos de registrante.
  - Verificación de no exposición de secretos en frontend o logs.
- **HANDOFF:** Sistema blindado, idempotente y completamente documentado.

---

### TASK: MASTER-VALIDATION-DOMAINS-DELIVERY
- **TASK ID:** MASTER-VALIDATION-DOMAINS-DELIVERY
- **STATUS:** COMPLETED
- **PRIORITY:** HIGHEST
- **OWNER:** AI Studio System & Backend Engineer
- **OBJECTIVE:** Finalización, validación obligatoria y entrega de los flujos de dominios:
  1. Base de datos: Corrección no destructiva de la migración `20261009004012_add_stripe_events_and_provisioning_operations`, restauración de modelos históricos en `prisma/schema.prisma` y validación con `npx prisma migrate status`.
  2. Precios y transferencias: Activación de `providerTransferCostUSD` en `pricingEngine.ts`, normalización de transferencias por TLD (`DOMAIN_TRANSFER`), verificación del endpoint `/api/transfers/pricing`.
  3. Pedidos y pagos: Validación de Auth/EPP Code y cálculo de impuestos y totales server-authoritative.
  4. Pruebas: Ampliación a 23 escenarios de prueba automatizada en `server/payments-provisioning.test.ts` con 100% de éxito.
- **ALLOWED FILES:**
  - `prisma/migrations/20261009004012_add_stripe_events_and_provisioning_operations/migration.sql`
  - `prisma/schema.prisma`
  - `server/orders.ts`
  - `server/payments-provisioning.test.ts`
  - `src/services/pricingEngine.ts`
  - `CLAUDE_HANDOFF.md`
  - `docs/AI-CONTEXT.md`
  - `BANELIO_HANDOFF.md`
  - `BANELIO_WORK_STATE.md`
  - `BANELIO_TASKS.md`
- **DEPENDENCIES:** Prisma SQLite `dev.db`, ResellerClub PHP Bridge, Stripe Webhooks
- **VALIDATION:**
  - `npm test` ejecutando 23/23 tests automatizados con 100% PASS.
  - `npm run lint` (`tsc --noEmit`) con 0 errores.
  - `npm run build` exitoso (Vite + esbuild).
  - `npx prisma migrate status`: Database schema is up to date (11 migraciones aplicadas).
  - `/api/transfers/pricing` configurado y retornando precios reales.
- **HANDOFF:** Flujos de dominios, pagos, transferencias y aprovisionamiento finalizados, validados y documentados para Claude o herramientas posteriores.

---

### TASK: PHP-BRIDGE-SECURITY-HARDENING
- **TASK ID:** PHP-BRIDGE-SECURITY-HARDENING
- **STATUS:** COMPLETED
- **PRIORITY:** HIGHEST
- **OWNER:** Security & PHP Bridge Architecture
- **OBJECTIVE:** Implementar y validar el blindaje definitivo de seguridad en el puente PHP entre IONOS y ResellerClub:
  1. Bloqueo de acceso HTTP directo a bibliotecas internas (`config.php`, `client.php`) retornando 403.
  2. Eliminación de fugas de datos sensibles, trazas, rutas internas, variables cURL sin filtrar (`$curlError`) y respuestas crudas del proveedor (`'raw' => $resellerResponse`).
  3. Sanitización y traducción estricta de excepciones en todos los catch blocks (`sanitize_exception_message`, `translate_resellerclub_error`).
  4. Corrección de falsos positivos en `my-domains.php`: validación previa de credenciales (HTTP 503 si no están configuradas) y propagación de errores reales (502, 503, 401, 403), distinguiendo fallas de infraestructura de una consulta legítima con cero dominios.
  5. Protección HTTP vía `.htaccess` para Apache 2.4/2.2 en hosting compartido IONOS contra descarga o acceso a `.env`, `*.local.php`, `config.local.php`, `config.php`, `client.php`, `.json`, logs y repositorios.
  6. Suite de 35 pruebas automatizadas (27 existentes + 8 nuevas pruebas de seguridad PHP) con 100% de éxito.
- **ALLOWED FILES:**
  - `server/php/reseller/config.php`
  - `server/php/reseller/client.php`
  - `server/php/reseller/test-connection.php`
  - `server/php/domains/my-domains.php`
  - `server/php/domains/customer.php`
  - `server/php/domains/contacts.php`
  - `server/php/domains/provision.php`
  - `server/php/domains/transfer.php`
  - `server/php/.htaccess`
  - `server/php/reseller/.htaccess`
  - `server/php/reseller/config.local.php.example`
  - `server/php-bridge-security.test.ts`
  - `BANELIO_WORK_STATE.md`
  - `BANELIO_TASKS.md`
  - `BANELIO_HANDOFF.md`
- **FORBIDDEN FILES:**
  - `server.ts`
  - `server/customerDomains.ts`
  - `server/payments-provisioning.test.ts`
  - `server/php/domains/check.php`
  - `prisma/*`
- **VALIDATION:**
  - `npm test`: 35/35 tests PASS (100% aprobados).
  - `tsc --noEmit` limpio (0 errores).
  - `compile_applet` exitoso.
  - `npm run build` exitoso (Vite + esbuild).
- **HANDOFF:** Puente PHP blindado, compatible con hosting compartido IONOS y verificado exhaustivamente.

---

### TASK: RESELLERCLUB-CONSOLIDATION-PHASE1
- **TASK ID:** RESELLERCLUB-CONSOLIDATION-PHASE1
- **STATUS:** COMPLETED
- **PRIORITY:** HIGHEST
- **OWNER:** Core Architecture & Integrations Engineer
- **OBJECTIVE:** Consolidación final del Paso 1: integración mínima, segura y funcional con ResellerClub:
  1. Unificar arquitectura de rutas: Frontend → servidor Node/API de Banelio → puente PHP en IONOS → ResellerClub.
  2. Implementar proxies POST para clientes (`/api/domains/customer.php`), contactos (`/api/domains/contacts.php`) y transferencias (`/api/domains/transfer.php`) con firma HMAC-SHA256 idéntica al cuerpo enviado.
  3. Validar estricto rechazo de códigos EPP en peticiones GET y URLs.
  4. Sincronizar validación HMAC en Node y PHP con formato estricto de timestamp numérico y firma hexadecimal de 64 caracteres.
  5. Unificar `getBridgeBaseUrl()` eliminando endpoints hardcodeados y retirar código muerto (`getRegistryConfig`).
  6. Suite automatizada completa de 43 pruebas (100% PASS).
- **ALLOWED FILES:**
  - `server.ts`
  - `server/phpBridgeAuth.ts`
  - `server/health.ts`
  - `.env.example`
  - `server/resellerclub-bridge.test.ts`
  - `BANELIO_WORK_STATE.md`
  - `BANELIO_TASKS.md`
  - `BANELIO_HANDOFF.md`
- **VALIDATION:**
  - `npm test`: 43/43 tests PASS (100% aprobados).
  - `npm run lint` (`tsc --noEmit`): limpio (0 errores).
  - `npm run build`: exitoso (Vite + esbuild).
  - `compile_applet`: exitoso.
- **HANDOFF:** Paso 1 consolidado técnicamente y preparado para pruebas del paso 2.

---

## IN PROGRESS

*(Ninguna tarea en ejecución. El sistema se encuentra consolidado a la espera de autorización expresa para las pruebas del paso 2).*

---

## PENDING

### TASK: RESELLERCLUB-CONTROLLED-TESTING-PHASE2
- **TASK ID:** RESELLERCLUB-CONTROLLED-TESTING-PHASE2
- **STATUS:** PENDING
- **PRIORITY:** HIGH
- **OWNER:** Integrations & QA Engineer
- **OBJECTIVE:** Ejecutar las pruebas controladas del Paso 2 una vez que el usuario configure las credenciales de prueba en IONOS / ResellerClub:
  1. Conexión auténtica con ResellerClub vía `/api/reseller/test-connection`.
  2. Disponibilidad y precios reales de dominios.
  3. Consultas y resolución de clientes/contactos de prueba.
  4. Validación de flujo de transferencias con dominio de prueba.
  5. Listado de dominios reales del cliente en IONOS/ResellerClub.
- **DEPENDENCIES:** Credenciales activas en entorno IONOS y autorización explícita del usuario.

---

## BLOCKED

*(Ninguna tarea bloqueada).*
