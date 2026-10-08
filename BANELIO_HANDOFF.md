# BANELIO HANDOFF

## 1. Fuente de verdad y rama de trabajo
- **Repositorio GitHub:** `veraltacoffee/banelio1`
- **Rama:** `main` es actualmente la rama estable y fuente de verdad de Banelio.
- Las cuentas de AI Studio trabajan secuencialmente sobre el mismo repositorio y sincronizan sus cambios mediante GitHub.
- No crear ramas adicionales salvo autorización explícita para una tarea concreta.

## 2. Orden obligatorio de lectura para iniciar sesión
Toda nueva sesión o cuenta de AI Studio debe leer el contexto persistente oficial en este orden exacto:
1. `docs/AI-CONTEXT.md`
2. `BANELIO_HANDOFF.md`
3. `BANELIO_RULES.md`
4. `BANELIO_WORK_STATE.md`
5. `BANELIO_TASKS.md`

Después de leer estos cuatro archivos, leer únicamente los archivos específicos relacionados con la tarea autorizada.

## 3. Estado actual del proyecto
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Vite SPA integrado en `server.ts`.
- **Backend:** Node.js v22, Express 4, Prisma ORM 6.19.3 con SQLite (`prisma/dev.db`).
- **Autenticación:** Server-side con sesiones persistidas en base de datos (`Session`), bcryptjs, 2FA TOTP, tokens de verificación por email y rate limiting.
- **Pagos:** Server-authoritative para Stripe (tarjetas con webhook HMAC SHA-256), PayPal (captura v2 autenticada) y Stripe OXXO Pay (vouchers MXN con FX real).
- **Registry:** ResellerClub vía bridge oficial PHP en IONOS Apache (`https://banelio.com/api/domains/transfer.php`).
- **Checkout de Transferencias:** Flujo migrado al checkout comercial estándar con SKU `DOMAIN_TRANSFER`, validación y sanitización server-authoritative de Auth/EPP Code, eliminación de dependencias de scripts PHP legacy (`transfer-order.php`, `transfer-auth.php`, `transfer-status.php`).
- **Estado técnico:** `/api/health` OK, base de datos operativa, compilación y linter limpios (0 errores).

## 4. Tarea activa
- **Actualmente en ejecución:** NINGUNA.
- La tarea `DOMAIN-TRANSFER-CHECKOUT` ha sido finalizada y verificada con éxito.

## 5. Tareas del sistema
- **ÚLTIMA TAREA COMPLETADA:** `DOMAIN-TRANSFER-CHECKOUT` (Status: `COMPLETED`).
- **TAREAS PENDIENTES:** Ninguna tarea pendiente actualmente en cola. Toda nueva tarea requerirá autorización explícita del usuario para iniciar.

## 6. Último trabajo realizado
- Migración y consolidación completa del flujo de transferencia de dominios al checkout comercial estándar de Banelio:
  1. Verificación remota de transferibilidad delegada exclusivamente a `server/php/domains/transfer.php` (`/api/domains/transfer.php`).
  2. Modal de transferencia (`src/components/public/DomainTransferModal.tsx`) con 4 pasos (Dominio, Titular, Auth/EPP Code y Resumen).
  3. Código Auth/EPP protegido en memoria de React (nunca expuesto en storage local, URLs ni consola).
  4. Adición al carrito con SKU `DOMAIN_TRANSFER`, vinculación de contacto de titular ICANN y precio resuelto.
  5. Checkout comercial (`src/components/public/CheckoutModal.tsx`) con indicador de clave EPP verificada y soporte multi-pasarela.
  6. Backend de órdenes (`server/orders.ts`) con validación estricta de longitud y existencia de Auth/EPP (6-32 caracteres), extracción robusta del dominio del titular, cálculo server-authoritative de precios/impuestos, protección de margen mínimo y sanitización de salida (`hasEppCode: true` en `toPublicOrder` sin filtrar el código secreto).
  7. Retirada de toda dependencia de scripts PHP históricos (`transfer-order.php`, `transfer-auth.php`, `transfer-status.php`).
  8. Validación integral con `tsc --noEmit` (PASS) y `compile_applet` (PASS).

## 7. Protocolo de continuidad multi-cuenta
- **Cuenta A:** Trabaja una sola tarea autorizada → Valida → Actualiza los 4 archivos de estado → Push/Sync a GitHub → GitHub queda como fuente de verdad.
- **Cuenta B:** Abre nueva conversación → Lee los 4 archivos en el orden exacto → Continúa desde GitHub → Trabaja únicamente la tarea autorizada.
- **Cuenta C:** Mismo procedimiento secuencial.

## 8. Bloqueadores
`NONE`

## 9. Próximo paso
Esperar la definición y autorización explícita del usuario para la siguiente tarea de desarrollo.

## 10. Reglas de seguridad
- Trabajar únicamente en la tarea explícitamente autorizada.
- No modificar archivos fuera del alcance autorizado de cada tarea.
- No iniciar automáticamente una tarea PENDING.
- Después de modificar código, actualizar obligatoriamente los archivos de estado y sincronizar con GitHub `main`.
