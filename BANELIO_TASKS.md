# BANELIO TASKS

## COMPLETED

### TASK: HANDOFF-PREP-01
- **TASK ID:** HANDOFF-PREP-01
- **STATUS:** COMPLETED
- **PRIORITY:** HIGHEST
- **OWNER:** AI Studio Engineer
- **DESCRIPTION:** Preparar el proyecto Banelio para poder continuar el desarrollo desde cualquier cuenta de Google AI Studio sin depender del historial de conversaciones, estableciendo documentación técnica autocontenida y reglas operativas universales.
- **FILES:** `BANELIO_RULES.md`, `BANELIO_TASKS.md`, `BANELIO_WORK_STATE.md`
- **DEPENDENCIES:** Ninguna
- **VALIDATION:** Inspección documental, `npx tsc --noEmit` (PASS), `compile_applet` (PASS), `npx prisma validate` (PASS).

### TASK: AUTH-SERVER-SESSION-01
- **TASK ID:** AUTH-SERVER-SESSION-01
- **STATUS:** COMPLETED
- **PRIORITY:** HIGH
- **OWNER:** Core Backend Team
- **DESCRIPTION:** Implementación de autenticación server-side real de clientes con sesiones HTTP seguras persistidas en Prisma (`Session`), hash de contraseñas con bcryptjs, autenticación de dos factores (2FA) TOTP con código QR y códigos de respaldo, verificación de correo electrónico con tokens de 6 dígitos, restablecimiento de contraseña mediante tokens de corta duración y rate limiting por endpoint en Express.
- **FILES:** `server/auth.ts`, `server.ts`, `prisma/schema.prisma`, `src/context/AppContext.tsx`, `src/components/auth/*`
- **DEPENDENCIES:** Prisma, bcryptjs, nodemailer, qrcode, express-rate-limit
- **VALIDATION:** TypeScript check clean, Prisma Client compilation, end-to-end auth routes test.

### TASK: COMMERCIAL-PRICING-ENTITLEMENTS-01
- **TASK ID:** COMMERCIAL-PRICING-ENTITLEMENTS-01
- **STATUS:** COMPLETED
- **PRIORITY:** HIGH
- **OWNER:** Core Backend / Pricing Team
- **DESCRIPTION:** Implementación del motor de precios comerciales desacoplado de ResellerClub, cálculo server-side de márgenes minoristas (retail) y para partners, redondeo comercial a .99 / .49, gestión de entitlements contractuales de servicios para clientes y migración Prisma para soportar el catálogo comercial unificado.
- **FILES:** `server/pricing.ts`, `server/catalog.ts`, `src/services/pricingEngine.ts`, `prisma/schema.prisma`, `server.ts`
- **DEPENDENCIES:** Prisma ORM, CatalogItem model, Entitlement model
- **VALIDATION:** `npx prisma validate`, `npx prisma generate`, `npx tsc --noEmit`.

### TASK: PAYMENT-GATEWAY-AUTHORITATIVE-01
- **TASK ID:** PAYMENT-GATEWAY-AUTHORITATIVE-01
- **STATUS:** COMPLETED
- **PRIORITY:** HIGH
- **OWNER:** Payments Team
- **DESCRIPTION:** Integración server-authoritative de pagos reales: Stripe Card PaymentIntents, PayPal v2 Order Creation & Server-side Capture con validación matemática de importes y divisas, Stripe OXXO Pay con generación de referencia de 14 dígitos en MXN basada en tipo de cambio real, y Webhook de Stripe con verificación criptográfica HMAC SHA-256 para transicionar órdenes a PAID sin estados simulados.
- **FILES:** `server/payments.ts`, `server/orders.ts`, `server.ts`, `src/components/public/CheckoutModal.tsx`
- **DEPENDENCIES:** Stripe API, PayPal REST API v2, open.er-api.com FX
- **VALIDATION:** Webhook signature verification, server-side amount checks, tsc check clean.

### TASK: RESELLERCLUB-CLEANUP-01
- **TASK ID:** RESELLERCLUB-CLEANUP-01
- **STATUS:** COMPLETED
- **PRIORITY:** HIGH
- **OWNER:** Infrastructure Team
- **DESCRIPTION:** Eliminación del cliente TypeScript duplicado de ResellerClub (`server/provider/resellerclub/*`) para consolidar la arquitectura de registry exclusivamente a través del bridge PHP alojado en IONOS Apache (`https://banelio.com/api/`), evitando duplicidad de llamadas y riesgos de fuga de credenciales.
- **FILES:** `server.ts`, `server/php/reseller/*`, `server/php/domains/*`
- **DEPENDENCIES:** IONOS PHP Bridge
- **VALIDATION:** Compilación TypeScript limpia, comprobación de rutas de proxy en `server.ts`.

---

## IN PROGRESS

*Actualmente no hay tareas de código en ejecución. El proyecto se encuentra estabilizado tras la configuración de handoff universal.*

---

## PENDING

### TASK: DOMAIN-TRANSFER-CHECKOUT
- **TASK ID:** DOMAIN-TRANSFER-CHECKOUT
- **STATUS:** PENDING
- **PRIORITY:** HIGH
- **OWNER:** Checkout & Domains Team
- **DESCRIPTION:** Migrar la transferencia de dominios al checkout comercial de Banelio y eliminar la dependencia de los PHP históricos transfer-order.php, transfer-auth.php y transfer-status.php, manteniendo transfer.php para validación.
- **FILES:** `server.ts`, `src/components/public/DomainTransferModal.tsx`, `src/services/domainService.ts`, `src/components/public/CheckoutModal.tsx`, `server/orders.ts`
- **DEPENDENCIES:** `server/php/domains/transfer.php` (para validación de transferibilidad), Motor de órdenes `server/orders.ts`, Prisma `Entitlement`
- **VALIDATION:** Verificación de transferibilidad vía `transfer.php`, creación de orden con SKU de transferencia en `/api/orders/create`, flujo de pago server-authoritative, generación de `Entitlement` con Auth/EPP code en configuración, eliminación de proxies huérfanos a scripts PHP no presentes en el repositorio.

### TASK: RESELLERCLUB-PROVISIONING-AUTOMATION
- **TASK ID:** RESELLERCLUB-PROVISIONING-AUTOMATION
- **STATUS:** PENDING
- **PRIORITY:** MEDIUM
- **OWNER:** Backend / Provisioning Team
- **DESCRIPTION:** Implementar el pipeline de aprovisionamiento automatizado posterior a la confirmación de pago (PAID) para interactuar con los endpoints del bridge PHP de ResellerClub en IONOS (registro de dominio, creación de contactos WHOIS y asignación de DNS).
- **FILES:** `server/orders.ts`, `server/php/domains/customer.php`, `server/php/domains/contacts.php`
- **DEPENDENCIES:** Tarea DOMAIN-TRANSFER-CHECKOUT, credenciales activas en IONOS PHP bridge
- **VALIDATION:** Pruebas controladas en entorno Sandbox / Test de ResellerClub.

### TASK: CPANEL-HOSTING-PROVISIONING
- **TASK ID:** CPANEL-HOSTING-PROVISIONING
- **STATUS:** PENDING
- **PRIORITY:** MEDIUM
- **OWNER:** Hosting Infrastructure Team
- **DESCRIPTION:** Integrar aprovisionamiento de cuentas de hosting cPanel y Webmail tras la compra de planes de Hosting NVMe / Cloud en el checkout de Banelio.
- **FILES:** `server/orders.ts`, `server/php/*`
- **DEPENDENCIES:** Credenciales de servidor cPanel/WHM
- **VALIDATION:** Creación de cuenta cPanel de prueba mediante API segura.

---

## BLOCKED

*(Ninguna tarea bloqueada en este momento. Todos los bloqueos previos fueron resueltos en el cleanup arquitectónico).*
