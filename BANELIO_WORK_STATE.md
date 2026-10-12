# BANELIO WORK STATE

## FECHA DE ACTUALIZACIÓN
2026-10-11

## RAMA
`main` en el repositorio GitHub `veraltacoffee/banelio1`.

## ESTADO DE SINCRONIZACIÓN
Implementación y consolidación de la Fase 2 / Módulo 2: Registro real de dominios y aprovisionamiento automático post-pago (`DOMAIN-REGISTRATION-AND-PROVISIONING-MODULE2`):
1. **Flujo Real de Registro de Dominios:**
   - Validación integral server-authoritative de dominios, etiquetas (longitud máxima de 63 caracteres, sin guiones al inicio o final), y consistencia estricta entre la extensión del dominio y el SKU contratado en `server/orders.ts`.
   - Consulta autoritativa de disponibilidad en tiempo real a ResellerClub (`domains/available.json`) previa al registro en `server/php/domains/provision.php`, rechazando dominios ocupados por terceros, dominios en Banelio (`regthroughus`), o con respuestas no concluyentes (`unknown`).
   - Resolución y creación de cuentas de cliente y contactos WHOIS legítimos mediante la API de ResellerClub (`customers/signup.json`, `contacts/add.json`).
   - Sanitización y validación estricta de datos del titular (sin valores ficticios ni fallbacks).
2. **Aprovisionamiento Post-Pago Idempotente:**
   - Despacho automático de la orden al confirmarse el pago por mecanismos autoritativos: webhooks verificados de Stripe (`payment_intent.succeeded`), captura de órdenes de PayPal (`/api/payments/paypal/capture`), y reconciliación server-to-server en consulta directa de PaymentIntent en `/api/payments/stripe/retrieve`.
   - Protección frente a peticiones concurrentes y duplicadas mediante la tabla `ProvisioningOperation` con estados `CONFIRMED`, `IN_PROGRESS`, `UNCERTAIN` y `FAILED`.
   - Actualización atómica de derechos (`Entitlement`) en base de datos vinculando el identificador del proveedor (`providerOrderId`), estado real (`providerStatus`) y fechas de activación.
3. **Experiencia de Usuario y Vistas:**
   - En `src/components/public/CheckoutModal.tsx`: eliminación de duplicación de órdenes al confirmar el pago mediante consulta directa de la orden autoritativa en `/api/orders/:id`, vaciado seguro del carrito y transición honesta a éxito o error.
   - En `src/components/dashboard/CustomerDashboard.tsx`: incorporación de la columna de estado de Aprovisionamiento (`PROVISIONED`, `PROVISIONING`, `FAILED`, `NONE`) y botón de reintento en vivo llamando a `/api/orders/:id/retry-provision`.
   - Soporte en backend para que administradores puedan auditar todas las órdenes del sistema vía `/api/customer/orders?all=true`.

## ESTADO GENERAL
FLUIDO Y VALIDADO — FASE 2 / MÓDULO 2 CONCLUIDO.
- Arquitectura respetada: Frontend React → Express Node.js → Puente PHP en IONOS → ResellerClub API.
- Cero fugas de credenciales o códigos Auth/EPP en logs o respuestas públicas.
- Sin ejecuciones destructivas ni llamadas no autorizadas a producción.

## ARQUITECTURA RESUMIDA
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Vite SPA integrado en `server.ts`.
- **Backend:** Node.js v22, Express 4, TypeScript, Prisma ORM 6.19.3.
- **Base de Datos:** SQLite (`prisma/dev.db`), esquema unificado en `prisma/schema.prisma` con 11 migraciones.
- **Seguridad Puente PHP:** Firma HMAC-SHA256 canónica (`X-Banelio-Signature`, `X-Banelio-Timestamp`), protección `.htaccess` y sanitización estricta de excepciones.
- **Deduplicación Webhooks:** Tabla persistente `StripeWebhookEvent` con restricción única sobre `eventId`.
- **Worker de Aprovisionamiento:** Idempotente, recuperable y multi-dominio vía tabla `ProvisioningOperation`.
- **Pagos:** Server-authoritative para Stripe, PayPal y Stripe OXXO Pay.

## TRABAJO COMPLETADO EN ESTA TAREA
1. **`server/php/domains/provision.php`:** Mapeo estricto de disponibilidad previo al registro con respuesta 409 detallada (`regthroughus`, `regthroughothers`, `unknown`), resolución y alta protegida de cliente y contacto WHOIS en ResellerClub, y retorno de `orderId` y estado verificable.
2. **`server/provisioning.ts`:** Resolución no colisionante de `Entitlement` por dominio individual para órdenes multi-dominio, preservación de `providerStatus`, diferenciación de mensajes de registro vs transferencia en espera, y control estricto contra operaciones duplicadas o inciertas.
3. **`server/orders.ts`:** Validación server-authoritative de estructura de etiquetas y coincidencia de TLD contra SKU, sanitización y rechazo de datos ficticios del registrante.
4. **`server.ts`:** Reconciliación inmediata de pagos en `/api/payments/stripe/retrieve` con disparo automático de aprovisionamiento si el pago fue verificado por Stripe pero el webhook aún no procesó, retorno de la entidad de orden completa en `/api/orders/:id/retry-provision`, y soporte de consulta global para administradores.
5. **`src/components/public/CheckoutModal.tsx`:** Seguimiento de `activeOrderId`, eliminación de la recreación redundante de órdenes en `completeConfirmed`, y reflejo del estado real del aprovisionamiento.
6. **`src/components/dashboard/CustomerDashboard.tsx`:** Columna de aprovisionamiento en la tabla de pedidos y botón de reintento funcional en vivo conectado a `/api/orders/:id/retry-provision`.

## GUÍA DE DESPLIEGUE EN IONOS Y CONFIGURACIÓN DEL PUENTE PHP
1. **Archivos a desplegar en IONOS (bajo la raíz web /api/):**
   - `/api/.htaccess` (Protección perimetral Apache)
   - `/api/reseller/.htaccess` (Protección del directorio reseller)
   - `/api/reseller/config.php` (Biblioteca central y helpers de seguridad)
   - `/api/reseller/client.php` (Cliente HTTP cURL protegido)
   - `/api/reseller/test-connection.php` (Diagnóstico seguro de solo lectura)
   - `/api/reseller/config.local.php` (Credenciales del servidor, o colocar fuera de la raíz web)
   - `/api/domains/check.php` (Búsqueda de disponibilidad en tiempo real)
   - `/api/domains/transfer.php` (Comprobación y validación Auth/EPP)
   - `/api/domains/customer.php` (Consulta y alta de clientes con HMAC)
   - `/api/domains/contacts.php` (Consulta y alta de contactos WHOIS con HMAC)
   - `/api/domains/provision.php` (Aprovisionamiento y transferencias con HMAC)
   - `/api/domains/my-domains.php` (Listado seguro de dominios del cliente con HMAC)
2. **Variables de entorno o constantes requeridas en IONOS:**
   - `RESELLERCLUB_RESELLER_ID`, `RESELLERCLUB_API_KEY`, `PHP_BRIDGE_SECRET`, `RESELLERCLUB_ENVIRONMENT` ('sandbox' o 'live').
   - Pueden definirse mediante directivas Apache `SetEnv` en IONOS o dentro de `config.local.php`.
3. **Autenticación HMAC-SHA256:**
   - Headers: `X-Banelio-Timestamp` y `X-Banelio-Signature`. Cadena: `METHOD|PATH|TIMESTAMP|BODY`.
4. **Verificación:**
   - `GET /api/reseller/test-connection.php` (100% de solo lectura).

## ARCHIVOS MODIFICADOS EN LA TAREA
- `server/php/domains/provision.php` (Modificado)
- `server/provisioning.ts` (Modificado)
- `server/orders.ts` (Modificado)
- `server.ts` (Modificado)
- `src/components/public/CheckoutModal.tsx` (Modificado)
- `src/components/dashboard/CustomerDashboard.tsx` (Modificado)
- `BANELIO_TASKS.md` (Actualizado: tarea `DOMAIN-REGISTRATION-AND-PROVISIONING-MODULE2` completada)
- `BANELIO_WORK_STATE.md` (Actualizado)
- `BANELIO_HANDOFF.md` (Actualizado)
- `docs/AI-CONTEXT.md` (Actualizado)

## BLOQUEADORES
- `RESELLERCLUB-CONTROLLED-TESTING-PHASE2`: Bloqueada temporalmente por dependencia externa de credenciales activas en entorno IONOS y autorización expresa del usuario.

## VALIDACIONES TÉCNICAS
- Pruebas y compilación postergadas al cierre integral según instrucciones operativas.
- Base de datos Prisma: 11 migraciones aplicadas correctamente en SQLite (`prisma/dev.db`).
