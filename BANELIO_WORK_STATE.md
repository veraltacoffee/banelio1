# BANELIO WORK STATE

## FECHA DE ACTUALIZACIÓN
2026-10-08

## RAMA
`main` en el repositorio GitHub `veraltacoffee/banelio1`.

## ESTADO DE SINCRONIZACIÓN
Depuración, consolidación y preparación final del repositorio Banelio1 completadas. Código limpio, sin dependencias huérfanas ni componentes abandonados, sin archivos temporales ni `bun.lock`, con documentación oficial en `docs/AI-CONTEXT.md` y listo para exportación o continuidad en Claude/otro agente.

## ESTADO GENERAL
ESTABLE Y CON REPOSITORIO DEPURADO Y CONSOLIDADO PARA RESELLERCLUB.
El proyecto está completamente preparado para continuar el desarrollo teniendo a ResellerClub como proveedor principal:
- Frontend limpio sin componentes abandonados.
- Backend consolidado con rutas de autenticación ordenadas y conexión a IONOS/ResellerClub.
- Dependencias innecesarias eliminadas (`@google/genai`).
- Documentación centralizada en `docs/AI-CONTEXT.md`.

## ARQUITECTURA RESUMIDA
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Vite SPA integrado en `server.ts`.
- **Backend:** Node.js v22, Express 4, TypeScript, Prisma ORM 6.19.3.
- **Base de Datos:** SQLite (`prisma/dev.db`), esquema unificado en `prisma/schema.prisma`.
- **Registry:** ResellerClub gestionado mediante PHP bridge oficial alojado en IONOS Apache (`https://banelio.com/api/`).
- **Transferencias & Registro:** Verificación y checkout comercial estándar de Banelio con EPP Code seguro.
- **Pagos:** Server-authoritative para Stripe, PayPal y Stripe OXXO Pay.

## TRABAJO COMPLETADO
1. Eliminación de dependencias no utilizadas (`@google/genai`).
2. Eliminación de componentes abandonados (`CleanHomeLanding.tsx`, `ResellerPromoSection.tsx`, `QuickAuthModal.tsx`, `RoleBar.tsx`).
3. Eliminación de archivos vacíos y documentación obsoleta (`HTTP`, `AUDIT/`, `estructura.txt`, `BANELIO_AUDITORIA.md`, `BANELIO_AUDIT.md`, `AUTH_IMPLEMENTATION_SPEC.md`).
4. Creación y estructuración obligatoria de `docs/AI-CONTEXT.md`.
5. Verificación de types (`tsc --noEmit`) y build (`compile_applet`) con 0 errores.

## TAREA ACTIVA
NINGUNA (la tarea de depuración y consolidación ha sido finalizada).

## TAREA PENDIENTE
- `RESELLERCLUB-PROVISIONING-WORKER`: Implementar el procesador de aprovisionamiento que conecta órdenes pagadas con la API de ResellerClub.

## ARCHIVOS MODIFICADOS EN LA TAREA
- `package.json`
- `server.ts`
- `docs/AI-CONTEXT.md` (creado)
- `BANELIO_WORK_STATE.md`

## BLOQUEADORES
`NONE`

## VALIDACIONES TÉCNICAS
- `compile_applet`: PASS (Build exitoso de frontend y backend).
- `lint_applet` (`tsc --noEmit`): PASS (0 errores).
- Base de datos Prisma: Validada y migrada.

## SIGUIENTE PASO
Consultar `docs/AI-CONTEXT.md` como fuente de contexto permanente para cualquier siguiente desarrollo.

## ADVERTENCIAS IMPORTANTES
1. **GitHub es la fuente de verdad del código.**
2. **Rama estable y fuente de verdad:** `main`.
3. **Prohibido introducir mocks o fallbacks en memoria.**
4. **ResellerClub es el proveedor principal de infraestructura para dominios y hosting.**
