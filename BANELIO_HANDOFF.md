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
- **Autenticación y Seguridad Puente PHP:** Firma HMAC-SHA256 con ventana de 300s (`PHP_BRIDGE_SECRET`), protección HTTP perimetral mediante directivas `.htaccess` (Apache 2.4/2.2), bloqueo de acceso directo a librerías (`config.php`, `client.php`), eliminación de trazas de cURL y respuestas crudas, y sanitización estricta de excepciones en todos los endpoints sin exponer detalles internos al cliente.
- **Deduplicación Webhooks:** Tabla persistente `StripeWebhookEvent` (`RECEIVED`, `PROCESSING`, `PROCESSED`, `FAILED`), protección atómica contra entregas simultáneas.
- **Aprovisionamiento y Registro de Dominios:**
  - Verificación autoritativa de disponibilidad previa al registro (`domains/available.json`) en `server/php/domains/provision.php`, rechazando dominios ocupados, en Banelio (`regthroughus`), o con respuestas no concluyentes (`unknown`).
  - Creación y reutilización de clientes y contactos WHOIS en ResellerClub (`customers/signup.json`, `contacts/add.json`).
  - Tabla persistente `ProvisioningOperation` por ítem/orden (`PENDING`, `IN_PROGRESS`, `CONFIRMED`, `FAILED`, `UNCERTAIN`), prevención de reenvíos a ciegas, reintentos seguros (`retryProvisionOrder`) y recuperación multi-dominio.
  - Sincronización automática tras confirmación autoritativa de pagos (Stripe Webhook, Stripe Retrieve reconciliado y PayPal Capture).
- **Transferencias de Dominio:** Costos mayoristas de transferencia activos en catálogo, endpoint `/api/transfers/pricing` habilitado y validación rigurosa de Auth/EPP Code (6-32 caracteres).
- **Pagos:** Server-authoritative para Stripe, PayPal y Stripe OXXO Pay.

## 4. Tarea activa
- **Actualmente en ejecución:** NINGUNA.
- Fase 2 / Módulo 2 concluido con éxito. El flujo de registro real de dominios y aprovisionamiento automático post-pago se encuentra técnicamente implementado y blindado contra duplicados.

## 5. Tareas del sistema
- **ÚLTIMA TAREA COMPLETADA:** `DOMAIN-REGISTRATION-AND-PROVISIONING-MODULE2` (Status: `COMPLETED`).
- **TAREA PENDIENTE (PASO 2):** `RESELLERCLUB-CONTROLLED-TESTING-PHASE2` (Requiere credenciales activas en entorno IONOS y autorización expresa).
  - **Archivos a desplegar en IONOS bajo `/api/`:**
    - `/api/.htaccess` (Protección perimetral)
    - `/api/reseller/.htaccess`, `config.php`, `client.php`, `test-connection.php`, `config.local.php`
    - `/api/domains/{check.php, transfer.php, customer.php, contacts.php, provision.php, my-domains.php}`
  - **Variables en IONOS:** `RESELLERCLUB_RESELLER_ID`, `RESELLERCLUB_API_KEY`, `PHP_BRIDGE_SECRET`, `RESELLERCLUB_ENVIRONMENT` (configuradas vía `SetEnv` en Apache o `config.local.php`).
  - **Variables en Node.js:** `RESELLERCLUB_RESELLER_ID`, `RESELLERCLUB_API_KEY`, `PHP_BRIDGE_SECRET`, `RESELLERCLUB_BRIDGE_URL`.
  - **Verificación:** Ejecutar `test-connection.php` (operación 100% de solo lectura, inocua para saldos y pedidos).

## 6. Último trabajo realizado
- Implementado el flujo completo de registro de dominios en `server/orders.ts`, `server/provisioning.ts` y `server/php/domains/provision.php`.
- Vinculado el aprovisionamiento automático inmediatamente tras la confirmación de pago autoritativa en Stripe y PayPal.
- Eliminada la duplicación de órdenes en checkout (`CheckoutModal.tsx`), consultando la orden autoritativa y actualizando el carrito de forma segura.
- Agregada visualización en tiempo real del estado de aprovisionamiento (`PROVISIONED`, `PROVISIONING`, `FAILED`, `NONE`) y botón de reintento en el panel del cliente (`CustomerDashboard.tsx`).

## 7. Protocolo de continuidad
- **Sesión activa:** Trabaja exclusivamente en la tarea autorizada sobre los archivos permitidos.
- **Validación:** Verificaciones al final del proyecto.
- **Cierre documental:** Actualiza los archivos de estado (`BANELIO_HANDOFF.md`, `BANELIO_WORK_STATE.md`, `BANELIO_TASKS.md`).
- **Respaldo:** El ZIP descargable de AI Studio sirve como snapshot seguro e íntegro.

## 8. Bloqueadores
- `RESELLERCLUB-CONTROLLED-TESTING-PHASE2`: Bloqueada temporalmente por dependencia de credenciales activas en entorno IONOS y autorización expresa del usuario.

## 9. Próximo paso
Configurar credenciales en IONOS para habilitar la ejecución controlada de la prueba en vivo del Paso 2 (`RESELLERCLUB-CONTROLLED-TESTING-PHASE2`).

## 10. Reglas de seguridad
- Trabajar únicamente en la tarea explícitamente autorizada.
- Modificar únicamente los archivos listados en `ALLOWED FILES` de la tarea.
- No modificar arquitectura, Prisma, base de datos, dependencias, `.env`, pagos, autenticación ni infraestructura sin autorización explícita.
- No detener el trabajo por estado de sincronización con GitHub.
