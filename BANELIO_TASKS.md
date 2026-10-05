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
- **HANDOFF:** Los 4 archivos de contexto persistente quedan alineados, sin contradicciones y sincronizados con GitHub `main`.

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

## IN PROGRESS

*(Ninguna tarea en ejecución. El sistema se encuentra estabilizado a la espera de autorización explícita para la siguiente tarea).*

---

## PENDING

*(Sin tareas pendientes registradas. Toda nueva tarea requerirá autorización explícita del usuario para iniciar).*

---

## BLOCKED

*(Ninguna tarea bloqueada).*
