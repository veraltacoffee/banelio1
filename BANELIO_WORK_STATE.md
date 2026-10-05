# BANELIO WORK STATE

## FECHA DE ACTUALIZACIÓN
2026-10-04

## RAMA
`main` (fuente de verdad en GitHub `veraltacoffee/banelio1`)

## ÚLTIMO COMMIT COMPROBADO
NO DISPONIBLE EN EL SISTEMA DE ARCHIVOS DEL CONTENEDOR (sin `.git` local en el runtime; consultar en GitHub `veraltacoffee/banelio1`).

## ESTADO GENERAL
ESTABLE Y SIN MODIFICACIONES DE CÓDIGO NO AUTORIZADAS.
El sistema cuenta con frontend Vite SPA y backend Express + Prisma SQLite completamente operativos. Todos los cambios no autorizados previos en `server/db.ts` y `.env.example` fueron revertidos y el código coincide exactamente con GitHub `main`. Se encuentra establecido el sistema permanente de continuidad documental multi-cuenta.

## ARQUITECTURA RESUMIDA
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Vite SPA.
- **Backend:** Node.js v22, Express 4, TypeScript, Prisma ORM 6.19.3.
- **Base de Datos:** SQLite (`prisma/dev.db`), esquema unificado en `prisma/schema.prisma`.
- **Registry:** ResellerClub gestionado mediante PHP bridge oficial alojado en IONOS Apache (`https://banelio.com/api/`).
- **Pagos:** Server-authoritative para Stripe (tarjetas con webhook HMAC SHA-256), PayPal (captura v2 autenticada) y Stripe OXXO Pay (vouchers MXN con FX real).

## TRABAJO COMPLETADO
1. Reversión completa y confirmada de modificaciones no autorizadas en `server/db.ts` y `.env.example`.
2. Verificación de alineación de todo el código de aplicación con GitHub `main`.
3. Creación y formalización de `BANELIO_HANDOFF.md`, `BANELIO_WORK_STATE.md`, `BANELIO_TASKS.md` y `BANELIO_RULES.md` como sistema universal de continuidad entre cuentas de AI Studio.

## TAREA ACTIVA
`DOMAIN-TRANSFER-CHECKOUT` (Estado: PENDING - NO ejecutada en esta sesión).

## ARCHIVOS RELACIONADOS CON TAREA ACTIVA
- `server.ts`
- `src/components/public/DomainTransferModal.tsx`
- `src/services/domainService.ts`
- `src/components/public/CheckoutModal.tsx`
- `server/orders.ts`

## BLOQUEADORES
NONE

## VALIDACIONES
- `compile_applet`: PASS
- `lint_applet` (`tsc --noEmit`): PASS (0 errores)
- Backend `/api/health`: 200 OK (`catalogItems: 53`, `orders: 0`, `customers: 0`)
- Frontend: HTTP 200 OK

## SIGUIENTE PASO
Iniciar una nueva sesión de AI Studio leyendo en orden `BANELIO_HANDOFF.md`, `BANELIO_WORK_STATE.md`, `BANELIO_TASKS.md` y `BANELIO_RULES.md` para ejecutar exclusivamente la tarea `DOMAIN-TRANSFER-CHECKOUT`.

## ADVERTENCIAS IMPORTANTES
1. **GitHub es la fuente de verdad del código.**
2. **Prohibido ejecutar migraciones** (`prisma migrate deploy`, `prisma db push`) o modificar `prisma/schema.prisma` sin autorización expresa.
3. **Prohibido introducir mocks, fallbacks en memoria o APIs inventadas.**
4. **Una conversación = una tarea lógica.** No encadenar tareas en una misma sesión.
5. **No declarar una tarea terminada sin comprobar la sincronización con GitHub (`PUSH PENDIENTE`).**
