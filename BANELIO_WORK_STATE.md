# BANELIO WORK STATE

## FECHA DE ACTUALIZACIÓN
2026-10-04

## RAMA
`main` es actualmente la rama estable y fuente de verdad de Banelio en GitHub `veraltacoffee/banelio1`.

## ESTADO DE SINCRONIZACIÓN
Documentación y código actualizados tras la finalización de `DOMAIN-TRANSFER-CHECKOUT`. Sincronización con GitHub `main` lista para push.

## ESTADO GENERAL
ESTABLE Y CON TAREA DOMAIN-TRANSFER-CHECKOUT COMPLETADA.
El flujo de transferencias de dominios ha sido migrado satisfactoriamente al checkout comercial estándar de Banelio. Se validaron tanto las consultas remotas vía `server/php/domains/transfer.php` como el flujo completo de carrito comercial, orden server-authoritative (`DOMAIN_TRANSFER`), protección de Auth/EPP Code en memoria y sanitización segura en API sin exposición de secretos. No hay dependencias activas de los scripts históricos `transfer-order.php`, `transfer-auth.php` ni `transfer-status.php`.

## ARQUITECTURA RESUMIDA
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Vite SPA integrado en `server.ts`.
- **Backend:** Node.js v22, Express 4, TypeScript, Prisma ORM 6.19.3.
- **Base de Datos:** SQLite (`prisma/dev.db`), esquema unificado en `prisma/schema.prisma`.
- **Transferencias:** Validación remota vía `server/php/domains/transfer.php` (`/api/domains/transfer.php`). Modal de 4 pasos con Auth/EPP Code protegido en memoria. Creación de orden comercial estándar con SKU `DOMAIN_TRANSFER` y sanitización en `server/orders.ts`.
- **Registry:** ResellerClub gestionado mediante PHP bridge oficial alojado en IONOS Apache (`https://banelio.com/api/`).
- **Pagos:** Server-authoritative para Stripe (tarjetas con webhook HMAC SHA-256), PayPal (captura v2 autenticada) y Stripe OXXO Pay (vouchers MXN con FX real).

## TRABAJO COMPLETADO
1. Corrección y alineación final del protocolo de continuidad (`BANELIO_HANDOFF.md`, `BANELIO_RULES.md`, `BANELIO_WORK_STATE.md`, `BANELIO_TASKS.md`).
2. Ejecución integral y completitud de la tarea `DOMAIN-TRANSFER-CHECKOUT`.
3. Modal de transferencia (`DomainTransferModal.tsx`) integrado con carrito comercial y titular ICANN.
4. Validación estricta y segura de Auth/EPP Code (6-32 caracteres) tanto en cliente como en backend de órdenes (`server/orders.ts`).
5. Extracción robusta de dominio y protección de margen mínimo en `/api/orders/create`.
6. Retiro verificado de dependencias de scripts PHP legacy de transferencia.

## TAREA ACTIVA
NINGUNA (la tarea `DOMAIN-TRANSFER-CHECKOUT` ha sido finalizada y validada).

## TAREA PENDIENTE
NINGUNA en cola actualmente. Nuevas tareas requerirán autorización explícita del usuario.

## ARCHIVOS MODIFICADOS EN LA TAREA
- `src/components/public/DomainTransferModal.tsx`
- `server/orders.ts`
- `BANELIO_HANDOFF.md`
- `BANELIO_RULES.md`
- `BANELIO_WORK_STATE.md`
- `BANELIO_TASKS.md`

## BLOQUEADORES
`NONE`

## VALIDACIONES TÉCNICAS
- `compile_applet`: PASS (Build exitoso de frontend y backend).
- `lint_applet` (`tsc --noEmit`): PASS (0 errores).
- Backend `/api/health`: 200 OK.
- Creación de órdenes con transferencias (`/api/orders/create`): 200 OK con sanitización de `hasEppCode: true`.
- Validación de errores para EPP inválido/ausente: 400 Bad Request verificado.
- Consulta de transferibilidad (`/api/domains/transfer.php`): 200 OK con respuesta remota real.

## SIGUIENTE PASO
Esperar autorización explícita para la siguiente tarea de desarrollo. Toda nueva sesión debe leer obligatoriamente:
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
