# BANELIO HANDOFF

## 1. Entorno de trabajo y fuente de verdad operativa
- **Repositorio Oficial:** GitHub `veraltacoffee/banelio1` (rama `main`).
- **Régimen Operativo Temporal:** El entorno activo de desarrollo es este proyecto en **Google AI Studio**.
- **Desacoplamiento de Sincronización:** El trabajo NO se detiene ni bloquea por incidencias de sincronización con GitHub. No se intenta reparar, reconectar ni cambiar el repositorio o rama.
- **Respaldo de Seguridad:** El archivo ZIP descargado de Google AI Studio constituye la copia de seguridad oficial del estado actual.
- **Regla de integridad:** No eliminar ni sobrescribir archivos locales por el hecho de que GitHub no refleje todavía los cambios más recientes. No afirmar que GitHub está sincronizado si no se comprueba directamente.

## 2. Orden obligatorio de lectura para iniciar sesión
Toda nueva sesión o cuenta de AI Studio debe leer el contexto persistente oficial en este orden exacto:
1. `docs/AI-CONTEXT.md`
2. `BANELIO_HANDOFF.md`
3. `BANELIO_RULES.md`
4. `BANELIO_WORK_STATE.md`
5. `BANELIO_TASKS.md`

Tras esta lectura, no releerlos completos y leer únicamente los archivos específicos relacionados con la tarea autorizada.

## 3. Estado actual del proyecto
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Vite SPA integrado en `server.ts`.
- **Backend:** Node.js v22, Express 4, Prisma ORM 6.19.3 con SQLite (`prisma/dev.db`), 10 migraciones aplicadas.
- **Autenticación:** Server-side con sesiones persistidas en base de datos (`Session`), bcryptjs, 2FA TOTP, tokens de verificación por email y rate limiting.
- **Pagos:** Server-authoritative para Stripe (tarjetas con webhook HMAC SHA-256), PayPal (captura v2 autenticada) y Stripe OXXO Pay (vouchers MXN con FX real y deduplicación estricta).
- **Registry & Aprovisionamiento:** ResellerClub vía bridge oficial PHP en IONOS Apache (`server/php/`). Eliminación total de datos ficticios/hardcoded de registrante (Regla 7), y semántica veraz de estados: transferencias de dominio se registran como `PROVISIONING` / `TRANSFER_INITIATED` (Regla 9).
- **Pruebas y Validación:** 11 tests automatizados en `server/payments-provisioning.test.ts` con 100% PASS, `compile_applet` exitoso, `lint_applet` limpio (0 errores).

## 4. Tarea activa
- **Actualmente en ejecución:** NINGUNA.
- El proyecto se encuentra estabilizado en Google AI Studio a la espera de la siguiente tarea explícitamente autorizada.

## 5. Tareas del sistema
- **ÚLTIMA TAREA COMPLETADA:** `SECURITY-PAYMENTS-PROVISIONING-HARDENING` (Status: `COMPLETED`).
- **TAREAS PENDIENTES:** Pruebas de integración de extremo a extremo con credenciales reales de ResellerClub en IONOS.

## 6. Último trabajo realizado
- Eliminación de datos ficticios en `server/php/domains/provision.php`, `customer.php`, `contacts.php` y `server/provisioning.ts`.
- Semántica honesta de ciclo de vida de aprovisionamiento: transferencias pasan a `PROVISIONING` / `TRANSFER_INITIATED`, nunca marcadas prematuramente como `PROVISIONED`.
- Despliegue de migraciones en SQLite local y ejecución exitosa de la suite completa de 11 tests.

## 7. Protocolo de continuidad
- **Sesión activa:** Trabaja exclusivamente en la tarea autorizada sobre los archivos permitidos.
- **Validación:** Ejecuta `lint_applet` y `compile_applet` al finalizar.
- **Cierre documental:** Actualiza los 4 archivos de estado (`BANELIO_HANDOFF.md`, `BANELIO_RULES.md`, `BANELIO_WORK_STATE.md`, `BANELIO_TASKS.md`).
- **Respaldo:** El ZIP descargable de AI Studio sirve como snapshot seguro e íntegro.

## 8. Bloqueadores
`NONE`

## 9. Próximo paso
Esperar la definición y autorización explícita del usuario para la siguiente tarea de desarrollo.

## 10. Reglas de seguridad
- Trabajar únicamente en la tarea explícitamente autorizada.
- Modificar únicamente los archivos listados en `ALLOWED FILES` de la tarea.
- No modificar arquitectura, Prisma, base de datos, dependencias, `.env`, pagos, autenticación ni infraestructura sin autorización explícita.
- No detener el trabajo por estado de sincronización con GitHub.
