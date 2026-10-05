# BANELIO TASKS — Cola de Tareas

## COMPLETED

### TASK: CONTINUITY-SYSTEM-INIT
- **TASK ID:** CONTINUITY-SYSTEM-INIT
- **STATUS:** COMPLETED
- **PRIORITY:** HIGHEST
- **OWNER:** AI Studio System Engineer
- **OBJECTIVE:** Establecer el sistema permanente de continuidad documental multi-cuenta para Banelio, garantizando que cualquier cuenta de AI Studio pueda retomar el trabajo directamente desde GitHub sin depender de conversaciones previas.
- **ALLOWED FILES:** `BANELIO_RULES.md`, `BANELIO_TASKS.md`, `BANELIO_WORK_STATE.md`, `BANELIO_HANDOFF.md`
- **FORBIDDEN FILES:** Todos los archivos de código de aplicación (`src/*`, `server/*`, `prisma/*`, `package.json`, etc.)
- **DEPENDENCIES:** Ninguna
- **VALIDATION:** Inspección documental, verificación de alineación con GitHub `main`, `lint_applet` (PASS), `compile_applet` (PASS).
- **HANDOFF:** Documentación de handoff creada y alineada.

---

## IN PROGRESS

*(Ninguna tarea en ejecución. El sistema de continuidad está establecido y listo para la siguiente tarea lógica).*

---

## PENDING

### TASK: DOMAIN-TRANSFER-CHECKOUT
- **TASK ID:** DOMAIN-TRANSFER-CHECKOUT
- **STATUS:** PENDING
- **PRIORITY:** HIGH
- **OWNER:** Checkout & Domains Team
- **OBJECTIVE:** Migrar la transferencia de dominios al checkout comercial estándar de Banelio y eliminar la dependencia de los scripts PHP históricos remotos (`transfer-order.php`, `transfer-auth.php`, `transfer-status.php`), manteniendo `transfer.php` exclusivamente para validación de transferibilidad.
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
- **VALIDATION:** `npx tsc --noEmit` limpio, `compile_applet` exitoso, verificación de validación de dominio transferible en UI y generación de orden comercial con SKU `DOMAIN_TRANSFER` en `/api/orders/create`.
- **HANDOFF:** Debe ejecutarse en una nueva sesión dedicada de AI Studio leyendo previamente `BANELIO_HANDOFF.md`.

---

## BLOCKED

*(Ninguna tarea bloqueada).*
