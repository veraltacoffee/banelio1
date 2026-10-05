# BANELIO HANDOFF

## 1. Fuente de verdad

GitHub:
`veraltacoffee/banelio1`

Rama estable:
`main`

El código de GitHub es la fuente de verdad.

## 2. Cómo comenzar una nueva sesión

Leer obligatoriamente en este orden exacto:

1. `BANELIO_HANDOFF.md`
2. `BANELIO_WORK_STATE.md`
3. `BANELIO_TASKS.md`
4. `BANELIO_RULES.md`

Después de leer estos cuatro archivos, leer ÚNICAMENTE los archivos directamente relacionados con la tarea asignada.
No realizar auditorías generales ni lectura masiva del repositorio.

## 3. Estado actual

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Vite SPA integrado en `server.ts`.
- **Backend:** Node.js (v22), Express 4, Prisma ORM (v6.19.3) con SQLite (`prisma/dev.db`).
- **Autenticación:** Server-side con sesiones en base de datos (`Session`), bcryptjs, 2FA TOTP (`qrcode`), tokens de verificación por email y rate limiting.
- **Pagos:** Server-authoritative para Stripe (tarjetas con webhook HMAC SHA-256), PayPal (captura server-side v2) y Stripe OXXO Pay (FX real en MXN).
- **Registry:** ResellerClub vía bridge oficial PHP en IONOS Apache (`https://banelio.com/api/`).
- **Salud del sistema:** `/api/health` en estado OK, catálogo sembrado (53 items), base de datos operativa, compilación y linter limpios.

## 4. Tarea activa

- **TASK ID:** `DOMAIN-TRANSFER-CHECKOUT`
- **OBJETIVO:** Migrar la transferencia de dominios al checkout comercial de Banelio y eliminar la dependencia de los scripts PHP históricos remotos (`transfer-order.php`, `transfer-auth.php`, `transfer-status.php`), manteniendo `transfer.php` exclusivamente para validación de transferibilidad.
- **ESTADO:** PENDING (NO ejecutada en esta sesión).
- **ARCHIVOS AUTORIZADOS:**
  - `server.ts`
  - `src/components/public/DomainTransferModal.tsx`
  - `src/services/domainService.ts`
  - `src/components/public/CheckoutModal.tsx`
  - `server/orders.ts`
- **ARCHIVOS PROHIBIDOS:**
  - `prisma/*` (prohibido modificar esquema o migraciones)
  - `server/auth.ts`
  - `server/payments.ts`
  - `server/tax.ts`
  - `package.json`
  - Archivos PHP (`server/php/*`)
- **DEPENDENCIAS:**
  - `server/php/domains/transfer.php` (verificación de transferibilidad)
  - Motor de órdenes en `server/orders.ts`
  - Modelo Prisma `Entitlement`
- **VALIDACIONES REQUERIDAS:**
  - `npx tsc --noEmit` (0 errores)
  - `compile_applet` (PASS)
  - Verificación del modal de transferencia y paso al carrito/checkout con SKU comercial.

## 5. Último trabajo realizado

- Creación y formalización del sistema permanente de continuidad y handoff multi-cuenta (`BANELIO_HANDOFF.md`, `BANELIO_WORK_STATE.md`, `BANELIO_TASKS.md`, `BANELIO_RULES.md`).
- Reversión completa y confirmada de cambios no autorizados previos en `server/db.ts` y `.env.example`.
- Código de aplicación y configuración 100% alineados con GitHub `main`.

## 6. Último commit conocido

NO DISPONIBLE EN EL ENTORNO LOCAL DE CONTENEDOR (sin historial Git local disponible en el runtime; la fuente de verdad es GitHub `veraltacoffee/banelio1` en la rama `main`).

## 7. Última sincronización GitHub

PENDIENTE (los cambios de documentación de continuidad requieren sincronización / push hacia GitHub).

## 8. Bloqueadores

NONE

## 9. Próximo paso

Cerrar esta conversación e iniciar una nueva sesión de AI Studio para abordar exclusivamente la tarea `DOMAIN-TRANSFER-CHECKOUT` leyendo este archivo como punto de partida.

## 10. Regla de seguridad

No continuar una tarea diferente a la indicada en este documento.
No modificar archivos fuera de los explícitamente autorizados para la tarea activa.
