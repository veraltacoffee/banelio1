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

## IN PROGRESS

*(Ninguna tarea en ejecución. El sistema se encuentra estabilizado en Google AI Studio a la espera de autorización explícita para la siguiente tarea).*

---

## PENDING

*(Sin tareas pendientes registradas. Toda nueva tarea requerirá autorización explícita del usuario para iniciar).*

---

## BLOCKED

*(Ninguna tarea bloqueada).*
