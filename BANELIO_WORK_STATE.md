# BANELIO WORK STATE

## FECHA DE ACTUALIZACIÓN
2026-10-08

## RAMA
`main` en el repositorio GitHub `veraltacoffee/banelio1`.

## ESTADO DE SINCRONIZACIÓN
Corrección de bloqueantes de seguridad, pagos y aprovisionamiento completada. Se eliminaron valores ficticios de contacto en el puente PHP y en el worker de aprovisionamiento (Regla 7), se corrigió la semántica de estados evitando marcar órdenes como PROVISIONED por la simple aceptación de solicitud en transferencias (Regla 9), se aplicaron las 10 migraciones de Prisma en la base de datos local y se validaron los 11 tests automatizados con 100% de aprobación.

## ESTADO GENERAL
ESTABLE, SEGURO Y VERIFICADO.
- Puente PHP (`server/php/`): sin valores ficticios/hardcoded, validación estricta de registrante y semántica veraz de estados.
- Worker de aprovisionamiento (`server/provisioning.ts`): conectado a órdenes pagadas, veraz con transferencias (`TRANSFER_INITIATED` / `PROVISIONING`), sin fallbacks falsos.
- Pagos: validación autoritativa en `server/payments.ts` para Stripe Card (USD), Stripe OXXO (MXN) y PayPal.
- Base de datos: 10 migraciones Prisma desplegadas en SQLite (`prisma/dev.db`).
- Pruebas automatizadas: 11 tests en `server/payments-provisioning.test.ts` pasando al 100%.

## ARQUITECTURA RESUMIDA
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Vite SPA integrado en `server.ts`.
- **Backend:** Node.js v22, Express 4, TypeScript, Prisma ORM 6.19.3.
- **Base de Datos:** SQLite (`prisma/dev.db`), esquema unificado en `prisma/schema.prisma`.
- **Registry:** ResellerClub gestionado mediante PHP bridge oficial alojado en IONOS Apache (`https://banelio.com/api/`).
- **Aprovisionamiento:** Server-authoritative post-pago, validación estricta de contacto y EPP.
- **Pagos:** Server-authoritative para Stripe, PayPal y Stripe OXXO Pay con deduplicación de eventos.

## TRABAJO COMPLETADO
1. Eliminación total de datos ficticios (`Av. Central 100`, `Mazatlán`, `Sinaloa`, `82000`, `6691000000`, `Registrante Banelio`) en `server/php/domains/provision.php`, `customer.php`, `contacts.php` y `server/provisioning.ts` (Regla 7).
2. Corrección del ciclo de vida de aprovisionamiento: transferencias de dominio nunca se marcan como `PROVISIONED` prematuramente; se registran como `TRANSFER_INITIATED` y la orden permanece en `PROVISIONING` (Regla 9).
3. Despliegue de las 10 migraciones históricas en la base SQLite local (`prisma/dev.db`).
4. Ampliación y ejecución de la suite de pruebas `server/payments-provisioning.test.ts` (11 tests pasando).
5. Verificación de types (`tsc --noEmit`), build (`compile_applet`) y tests (`npm test`) con 0 errores.

## TAREA ACTIVA
NINGUNA.

## TAREA PENDIENTE
- Pruebas de integración de extremo a extremo con credenciales reales de ResellerClub en IONOS (`https://banelio.com/api/`).

## ARCHIVOS MODIFICADOS EN LA TAREA
- `server/php/domains/provision.php`
- `server/php/domains/customer.php`
- `server/php/domains/contacts.php`
- `server/provisioning.ts`
- `server/payments-provisioning.test.ts`
- `BANELIO_WORK_STATE.md`
- `BANELIO_TASKS.md`
- `BANELIO_HANDOFF.md`

## BLOQUEADORES
`NONE`

## VALIDACIONES TÉCNICAS
- `npm test` (11/11 tests PASS).
- `compile_applet`: PASS.
- `lint_applet` (`tsc --noEmit`): PASS (0 errores).
- Base de datos Prisma: 10 migraciones aplicadas correctamente.
