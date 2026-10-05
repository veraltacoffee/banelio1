# BANELIO HANDOFF

## 1. Fuente de verdad y rama de trabajo
- **Repositorio GitHub:** `veraltacoffee/banelio1`
- **Rama:** `main` es actualmente la rama estable y fuente de verdad de Banelio.
- Las cuentas de AI Studio trabajan secuencialmente sobre el mismo repositorio y sincronizan sus cambios mediante GitHub.
- No crear ramas adicionales salvo autorización explícita para una tarea concreta.

## 2. Orden obligatorio de lectura para iniciar sesión
Toda nueva sesión o cuenta de AI Studio debe leer el contexto persistente oficial en este orden exacto:
1. `BANELIO_HANDOFF.md`
2. `BANELIO_RULES.md`
3. `BANELIO_WORK_STATE.md`
4. `BANELIO_TASKS.md`

Después de leer estos cuatro archivos, leer únicamente los archivos específicos relacionados con la tarea autorizada.

## 3. Estado actual del proyecto
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Vite SPA integrado en `server.ts`.
- **Backend:** Node.js v22, Express 4, Prisma ORM 6.19.3 con SQLite (`prisma/dev.db`).
- **Autenticación:** Server-side con sesiones persistidas en base de datos (`Session`), bcryptjs, 2FA TOTP, tokens de verificación por email y rate limiting.
- **Pagos:** Server-authoritative para Stripe (tarjetas con webhook HMAC SHA-256), PayPal (captura v2 autenticada) y Stripe OXXO Pay (vouchers MXN con FX real).
- **Registry:** ResellerClub vía bridge oficial PHP en IONOS Apache (`https://banelio.com/api/`).
- **Estado técnico:** `/api/health` OK, catálogo sembrado (53 items), base de datos operativa, compilación y linter limpios.
- **Sincronización:** Documentación de continuidad sincronizada con GitHub `main`.

## 4. Tarea activa
- **Actualmente en ejecución:** NINGUNA.
- El proyecto se encuentra estabilizado y en espera de autorización explícita para la siguiente tarea.

## 5. Tarea pendiente registrada
- **TASK ID:** `DOMAIN-TRANSFER-CHECKOUT`
- **ESTADO:** `PENDING / NO INICIADA`.
- **IMPORTANTE:** No iniciar automáticamente esta tarea por el simple hecho de que aparezca como PENDING. Toda tarea PENDING requiere autorización explícita del usuario para comenzar.
- **OBJETIVO (cuando se autorice):** Migrar la transferencia de dominios al checkout comercial de Banelio y retirar la dependencia de scripts PHP históricos remotos (`transfer-order.php`, `transfer-auth.php`, `transfer-status.php`), manteniendo `transfer.php` únicamente para validación.
- **ARCHIVOS AUTORIZADOS (cuando se autorice):** `server.ts`, `src/components/public/DomainTransferModal.tsx`, `src/services/domainService.ts`, `src/components/public/CheckoutModal.tsx`, `server/orders.ts`.
- **ARCHIVOS PROHIBIDOS:** `prisma/*`, `server/auth.ts`, `server/payments.ts`, `server/tax.ts`, `package.json`, archivos PHP (`server/php/*`).

## 6. Último trabajo realizado
- Formalización final del protocolo de continuidad y alineación sin inconsistencias de los cuatro documentos rectores (`BANELIO_HANDOFF.md`, `BANELIO_RULES.md`, `BANELIO_WORK_STATE.md`, `BANELIO_TASKS.md`).
- Documentación de continuidad sincronizada con GitHub `main`.
- Código de aplicación y configuración 100% alineados con GitHub `main`.

## 7. Protocolo de continuidad multi-cuenta
- **Cuenta A:** Trabaja una sola tarea autorizada → Valida → Actualiza los 4 archivos de estado → Push/Sync a GitHub → GitHub queda como fuente de verdad.
- **Cuenta B:** Abre nueva conversación → Lee los 4 archivos en el orden exacto → Continúa desde GitHub → Trabaja únicamente la tarea autorizada.
- **Cuenta C:** Mismo procedimiento secuencial.

## 8. Bloqueadores
`NONE`

## 9. Próximo paso
Esperar la autorización explícita del usuario para comenzar la tarea `DOMAIN-TRANSFER-CHECKOUT` o cualquier otra tarea específica.

## 10. Reglas de seguridad
- Trabajar únicamente en la tarea explícitamente autorizada.
- No modificar archivos fuera del alcance autorizado de cada tarea.
- No iniciar automáticamente una tarea PENDING.
- Después de modificar código, actualizar obligatoriamente los archivos de estado y sincronizar con GitHub `main`.
