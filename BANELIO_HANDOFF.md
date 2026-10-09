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
- **Backend:** Node.js v22, Express 4, Prisma ORM 6.19.3 con SQLite (`prisma/dev.db`), 11 migraciones aplicadas.
- **Autenticación Puente PHP:** Firma HMAC-SHA256 con ventana de 300s (`PHP_BRIDGE_SECRET`), validación estricta y protección en todos los endpoints de ResellerClub.
- **Deduplicación Webhooks:** Tabla persistente `StripeWebhookEvent` (`RECEIVED`, `PROCESSING`, `PROCESSED`, `FAILED`), protección atómica contra entregas simultáneas.
- **Aprovisionamiento:** Tabla persistente `ProvisioningOperation` por ítem/orden (`PENDING`, `IN_PROGRESS`, `CONFIRMED`, `FAILED`, `UNCERTAIN`), prevención de reenvíos a ciegas y recuperación multi-dominio.
- **Pagos:** Server-authoritative para Stripe, PayPal y Stripe OXXO Pay.
- **Pruebas y Validación:** 20 tests automatizados en `server/payments-provisioning.test.ts` con 100% PASS, `compile_applet` exitoso, `lint_applet` limpio (0 errores).

## 4. Tarea activa
- **Actualmente en ejecución:** NINGUNA.
- El proyecto se encuentra estabilizado en Google AI Studio a la espera de la siguiente tarea explícitamente autorizada.

## 5. Tareas del sistema
- **ÚLTIMA TAREA COMPLETADA:** `FINAL-SECURITY-PAYMENTS-PROVISIONING-IMPLEMENTATION` (Status: `COMPLETED`).
- **TAREAS PENDIENTES:** Pruebas de integración de extremo a extremo con credenciales reales de ResellerClub en IONOS.

## 6. Último trabajo realizado
- Implementación de firma HMAC-SHA256 entre Node.js y el puente PHP (`server/phpBridgeAuth.ts`, `server/php/reseller/config.php`).
- Eliminación total de datos ficticios y fallbacks ('6691000000', '1', '52', 'N/A', '00000') en backend TS y PHP.
- Migración `20261009004012_add_stripe_events_and_provisioning_operations` creada y aplicada.
- Deduplicación persistente de Stripe con atomic claiming y recuperación segura.
- Aprovisionamiento idempotente con manejo de `UNCERTAIN` ante timeout de red y control de acceso estricto a órdenes sin `customerId`.
- Suite ampliada y validada: 20 de 20 tests aprobados al 100%.

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
