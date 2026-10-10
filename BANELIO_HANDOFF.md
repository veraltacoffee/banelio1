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
- **Aprovisionamiento:** Tabla persistente `ProvisioningOperation` por ítem/orden (`PENDING`, `IN_PROGRESS`, `CONFIRMED`, `FAILED`, `UNCERTAIN`), prevención de reenvíos a ciegas, reintentos seguros (`retryProvisionOrder`) y recuperación multi-dominio.
- **Transferencias de Dominio:** Costos mayoristas de transferencia activos en catálogo, endpoint `/api/transfers/pricing` habilitado y validación rigurosa de Auth/EPP Code (6-32 caracteres).
- **Pagos:** Server-authoritative para Stripe, PayPal y Stripe OXXO Pay.
- **Pruebas y Validación:** 24 tests automatizados en `server/payments-provisioning.test.ts` con 100% PASS (24/24), `compile_applet` exitoso, `lint_applet` limpio (0 errores), `build` exitoso.

## 4. Tarea activa
- **Actualmente en ejecución:** NINGUNA.
- El proyecto se encuentra completamente validado y estabilizado a la espera de credenciales de producción para pruebas end-to-end con ResellerClub.

## 5. Tareas del sistema
- **ÚLTIMA TAREA COMPLETADA:** `MASTER-VALIDATION-DOMAINS-DELIVERY` (Status: `COMPLETED`).
- **TAREA PENDIENTE:** Despliegue manual de scripts en IONOS bajo `/api/` y configuración de credenciales del puente.
  - **Archivos a copiar:** `server/php/reseller/{config.php, client.php, test-connection.php}` hacia `/api/reseller/` y `server/php/domains/{check.php, transfer.php, customer.php, contacts.php, provision.php, my-domains.php}` hacia `/api/domains/`.
  - **Variables en IONOS:** `RESELLERCLUB_RESELLER_ID`, `RESELLERCLUB_API_KEY`, `PHP_BRIDGE_SECRET`, `RESELLERCLUB_ENVIRONMENT` (configuradas vía servidor web o `config.local.php`).
  - **Variables en Node.js:** `RESELLERCLUB_RESELLER_ID`, `RESELLERCLUB_API_KEY`, `PHP_BRIDGE_SECRET`.
  - **Verificación:** Ejecutar `test-connection.php` (operación 100% de solo lectura, inocua para saldos y pedidos).

## 6. Último trabajo realizado
- Consolidación del alcance comercial definitivo centrado exclusivamente en dominios: búsqueda, registro, transferencia (EPP/Auth) y renovación.
- Retiro del escaparate y desactivación de productos fuera de alcance (hosting, correo, SSL independiente, afiliados y paneles de socios en Navbar y Dashboard).
- Exclusión en `.gitignore` de `config.local.php`, `server/php/**/config.local.php` y `*.local.php` para protección estricta de secretos.
- Fallback de entorno seguro a `'sandbox'` en `server/php/reseller/config.php` si se omite la variable en el servidor.
- Sincronización y actualización de `docs/AI-CONTEXT.md`, `BANELIO_WORK_STATE.md` y `BANELIO_HANDOFF.md`.

## 7. Protocolo de continuidad
- **Sesión activa:** Trabaja exclusivamente en la tarea autorizada sobre los archivos permitidos.
- **Validación:** Ejecuta `lint_applet` y `compile_applet` al finalizar.
- **Cierre documental:** Actualiza los 4 archivos de estado (`BANELIO_HANDOFF.md`, `BANELIO_RULES.md`, `BANELIO_WORK_STATE.md`, `BANELIO_TASKS.md`).
- **Respaldo:** El ZIP descargable de AI Studio sirve como snapshot seguro e íntegro.

## 8. Bloqueadores
`NONE`

## 9. Próximo paso
Ejecutar la copia manual de los 9 archivos PHP a IONOS, configurar las 3 variables clave en IONOS y Node.js, y verificar la conectividad mediante `/api/reseller/test-connection.php`.

## 10. Reglas de seguridad
- Trabajar únicamente en la tarea explícitamente autorizada.
- Modificar únicamente los archivos listados en `ALLOWED FILES` de la tarea.
- No modificar arquitectura, Prisma, base de datos, dependencias, `.env`, pagos, autenticación ni infraestructura sin autorización explícita.
- No detener el trabajo por estado de sincronización con GitHub.
