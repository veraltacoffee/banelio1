# BANELIO WORK STATE

## FECHA DE ACTUALIZACIÓN
2026-10-04

## RAMA
`main` (fuente de verdad y rama de trabajo actual en GitHub `veraltacoffee/banelio1`).

## ÚLTIMO COMMIT COMPROBADO
NO DISPONIBLE EN EL CONTENEDOR (sin `.git` local en el runtime; la fuente de verdad verificable es GitHub `veraltacoffee/banelio1`).

## ESTADO GENERAL
ESTABLE Y CON DOCUMENTACIÓN DE CONTINUIDAD ALINEADA.
El sistema cuenta con frontend Vite SPA y backend Express + Prisma SQLite completamente operativos. Todos los archivos de código y configuración coinciden con GitHub `main`. No hay cambios de código pendientes ni en ejecución.

## ARQUITECTURA RESUMIDA
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Vite SPA integrado en `server.ts`.
- **Backend:** Node.js v22, Express 4, TypeScript, Prisma ORM 6.19.3.
- **Base de Datos:** SQLite (`prisma/dev.db`), esquema unificado en `prisma/schema.prisma`.
- **Registry:** ResellerClub gestionado mediante PHP bridge oficial alojado en IONOS Apache (`https://banelio.com/api/`).
- **Pagos:** Server-authoritative para Stripe (tarjetas con webhook HMAC SHA-256), PayPal (captura v2 autenticada) y Stripe OXXO Pay (vouchers MXN con FX real).

## TRABAJO COMPLETADO
1. Reversión previa y confirmada de modificaciones no autorizadas en `server/db.ts` y `.env.example`.
2. Verificación de código 100% idéntico a GitHub `main`.
3. Sincronización y resolución de inconsistencias entre los 4 documentos de continuidad (`BANELIO_HANDOFF.md`, `BANELIO_RULES.md`, `BANELIO_WORK_STATE.md`, `BANELIO_TASKS.md`).

## TAREA ACTIVA
NINGUNA (no hay ninguna tarea en ejecución actualmente; el sistema está a la espera de autorización explícita).

## TAREA PENDIENTE
`DOMAIN-TRANSFER-CHECKOUT` (Estado: `PENDING / NO INICIADA`).
Requiere autorización explícita del usuario para iniciar.

## ARCHIVOS RELACIONADOS CON LA TAREA PENDIENTE
- `server.ts`
- `src/components/public/DomainTransferModal.tsx`
- `src/services/domainService.ts`
- `src/components/public/CheckoutModal.tsx`
- `server/orders.ts`

## BLOQUEADORES
`NONE`

## VALIDACIONES
- `compile_applet`: PASS (Build exitoso de frontend y backend).
- `lint_applet` (`tsc --noEmit`): PASS (0 errores).
- Backend `/api/health`: 200 OK.
- Frontend: HTTP 200 OK.

## SIGUIENTE PASO
Esperar autorización explícita para iniciar la tarea `DOMAIN-TRANSFER-CHECKOUT` o cualquier otra tarea específica. Toda nueva sesión debe leer obligatoriamente:
1. `BANELIO_HANDOFF.md`
2. `BANELIO_RULES.md`
3. `BANELIO_WORK_STATE.md`
4. `BANELIO_TASKS.md`

## ADVERTENCIAS IMPORTANTES
1. **GitHub es la fuente de verdad del código.**
2. **`main` es la rama de trabajo.** Las cuentas de AI Studio trabajan secuencialmente sobre ella sin crear ramas adicionales salvo instrucción expresa.
3. **Prohibido ejecutar migraciones** (`prisma migrate deploy`, `prisma db push`) o modificar `prisma/schema.prisma` sin autorización expresa.
4. **Prohibido introducir mocks o fallbacks en memoria.**
5. **Una tarea PENDING no se inicia automáticamente.** Requiere autorización previa del usuario.
6. **Reportar `PUSH PENDIENTE`** si AI Studio no puede hacer push directo a GitHub al finalizar la tarea.
