# BANELIO WORK STATE

## CURRENT DATE
2026-10-04

## CURRENT GIT BRANCH
main (AI Studio Container Environment / .git directory not initialized in container filesystem)

## CURRENT COMMIT
NOT AVAILABLE (Container filesystem without local git VCS history)

## PROJECT STATUS
ESTABLE Y LISTO PARA HANDOFF UNIVERSAL MULTI-CUENTA.
El proyecto cuenta con frontend (React 19 + Tailwind CSS + Vite) y backend (Node.js + Express + Prisma ORM) plenamente funcionales. Se ha completado el saneamiento arquitectónico eliminando el cliente TypeScript redundante de ResellerClub y consolidando la integración externa a través del bridge PHP oficial alojado en IONOS Apache (`https://banelio.com/api/`). El sistema de órdenes, cálculo de impuestos, autenticación server-side con sesiones persistidas en Prisma, 2FA y pasarelas de pago (Stripe, PayPal, OXXO) operan en modo server-authoritative estricto.

## ARCHITECTURE
- **Frontend:**
  React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Vite SPA integrado mediante middleware en desarrollo (`server.ts`) y distribución compilada en producción (`dist/`).
- **Backend:**
  Node.js (v22), Express 4, TypeScript (ejecución con `tsx` en desarrollo y empaquetado con `esbuild` para producción).
- **Database:**
  Prisma ORM (v6.19.3) con base de datos relacional SQLite (`prisma/dev.db`), migraciones ordenadas y esquema unificado.
- **Registry:**
  ResellerClub gestionado mediante PHP bridge oficial alojado en servidor IONOS Apache (`https://banelio.com/api/`). El backend Node.js actúa como proxy y consumidor seguro sin exponer API keys ni credenciales en el cliente.
- **Payments:**
  - **Stripe:** Creación server-side de `PaymentIntent` para tarjetas bancarias y confirmación server-authoritative mediante webhook criptográfico (`payment_intent.succeeded` con HMAC SHA-256).
  - **PayPal:** Integración server-side con API REST v2 (creación de orden y captura autenticada `/api/payments/paypal/capture` con validación estricta de importe y divisa contra la base de datos).
  - **OXXO Pay:** Generación de boletas/vouchers de pago de 14 dígitos en MXN a través de Stripe con cálculo y conversión FX real (open.er-api.com) sin tasas simuladas.
- **Technical services:**
  ResellerClub White Label, cPanel Hosting, Webmail corporativo y certificados SSL gestionados a nivel mayorista.

## COMPLETED WORK
1. **Saneamiento Arquitectónico y Eliminación del Cliente TS de ResellerClub:**
   Se eliminó la capa `/server/provider/resellerclub/` para evitar duplicidad de lógica y riesgos de seguridad. Toda la comunicación con el Registry se delega en el bridge PHP oficial de IONOS (`server/php/*`).
2. **Autenticación Server-Side Completa y Segura:**
   - Modelo `Session` persistido en Prisma con cookies HTTP seguras (`banelio_session`).
   - Cifrado de contraseñas con `bcryptjs` (salt rounds 12).
   - Autenticación de Dos Factores (2FA) TOTP con generación de QR en backend (`qrcode`) y códigos de respaldo cifrados.
   - Verificación de correo electrónico (`EmailVerificationToken`) y restablecimiento de contraseña (`PasswordResetToken`) con envío SMTP vía `nodemailer`.
   - Limitadores de tasa (`express-rate-limit`) en endpoints de autenticación.
3. **Motor Server-Authoritative de Órdenes e Impuestos:**
   - Creación idempotente de órdenes (`/api/orders/create`) con validación de SKU, cálculo de subtotal, descuentos y desglose de impuestos por país (11 países + internacional) en `server/tax.ts`.
   - Desacoplamiento total entre `OrderStatus`, `PaymentStatus` y `ProvisionStatus`.
4. **Arquitectura de Precios Comerciales y Entitlements:**
   - Módulo `server/pricing.ts` y servicio `src/services/pricingEngine.ts`.
   - Control de márgenes mayoristas (partner) y minoristas (retail) con redondeo psicológico comercial.
   - Modelo `Entitlement` en Prisma para rastrear la titularidad y configuración de cada servicio adquirido.
5. **Pasarelas de Pago Reales:**
   - Stripe Card, PayPal Capture server-side y Stripe OXXO Pay operativos sin estados fingidos ni aprobación automática en frontend.
6. **Portal del Cliente (Customer Dashboard):**
   - Panel unificado con pestañas de Resumen, Perfil, Dominios, Servicios contratados, Órdenes, Renovaciones, Facturación con generación de facturas PDF descargables (`jspdf`), Seguridad (2FA) y Soporte.
   - Conexión con endpoints `/api/customer/orders`, `/api/customer/domains` y `/api/entitlements`.
7. **Consola de Administración (Admin Dashboard):**
   - Configuración de márgenes y costos de catálogo, métricas de rendimiento interno, supervisión de clientes, solicitudes de comisiones de partners (payouts) y registro de auditoría.

## CURRENT WORK
Finalización de la preparación del repositorio para desarrollo independiente desde cualquier cuenta de Google AI Studio sin depender de memoria conversacional previa.

## NEXT TASK
**TASK ID:** DOMAIN-TRANSFER-CHECKOUT  
**Descripción:** Migrar la transferencia de dominios al checkout comercial de Banelio y eliminar la dependencia de los PHP históricos `transfer-order.php`, `transfer-auth.php` y `transfer-status.php`, manteniendo `transfer.php` para validación.

## BLOCKERS
NONE

## FILES MODIFIED IN LAST TASK
- `BANELIO_WORK_STATE.md`

## FILES CREATED IN LAST TASK
- `BANELIO_RULES.md`
- `BANELIO_TASKS.md`

## FILES DELETED IN LAST TASK
NONE

## IMPORTANT DEPENDENCIES
- Node.js >= 20
- React 19.0.1
- Express 4.21.2
- Prisma ORM 6.19.3 & `@prisma/client`
- Vite 6.2.3 & `@vitejs/plugin-react`
- Tailwind CSS 4.1.14 & `@tailwindcss/vite`
- bcryptjs 3.0.3
- nodemailer 10.0.10
- qrcode 1.5.4
- express-rate-limit 8.7.0
- helmet 8.3.0
- jspdf 4.2.1 & jspdf-autotable 5.0.8
- lucide-react 0.546.0

## PRODUCTION CRITICAL SYSTEMS
Los siguientes sistemas están catalogados como críticos y no deben romperse bajo ninguna circunstancia:
- **Authentication:** Sesiones server-side, 2FA TOTP, validación de contraseñas bcrypt, tokens de verificación/reseteo y cookies HTTP.
- **Payments:** Gateways de Stripe, PayPal y OXXO; webhooks autoritativos y cálculo real de conversión de divisas.
- **Orders:** Validación de SKU, cálculo server-side de importes e impuestos, idempotencia y ciclo de vida de órdenes en Prisma.
- **Catalog:** Catálogo comercial unificado sembrado en base de datos (`seedCatalog`).
- **Customer:** Perfiles de clientes, gestión de sesiones e historial.
- **Entitlements:** Asignación contractual de dominios, hosting, correos y certificados adquiridos.
- **Prisma:** Esquema relacional, migraciones y cliente tipado.
- **Domain Search:** Verificación en vivo de dominios vía bridge PHP (`check.php`) y consultas WHOIS RDAP RFC 7482/7483.
- **Domain Registration:** Preparación de aprovisionamiento con datos WHOIS completos.
- **Domain Transfer:** Validación de transferibilidad y retención de códigos Auth/EPP en memoria/entitlements.
- **ResellerClub PHP Bridge:** Conectividad con IONOS Apache PHP en `https://banelio.com/api/`.
- **Partner Portal:** Cálculo de comisiones y margen comercial para revendedores/afiliados.

## VALIDATION STATUS
- **TypeScript:** PASS (`npx tsc --noEmit` completado con 0 errores).
- **Build:** PASS (`compile_applet` / Vite build & esbuild server bundle completado con éxito).
- **Prisma Validate:** PASS (`npx prisma validate` - esquema válido sin errores).
- **Prisma Generate:** PASS (`npx prisma generate` - Prisma Client v6.19.3 generado correctamente).
- **Tests:** NOT RUN (No existe script de pruebas automatizadas configurado en `package.json`).

## KNOWN TECHNICAL DEBT
1. **Scripts PHP de Transferencia Remota No Versionados Localmente:**
   Los siguientes tres archivos PHP históricos existen en el servidor remoto `https://banelio.com/api/domains/`, pero **NO están presentes localmente en el repositorio**:
   - `server/php/domains/transfer-order.php`
   - `server/php/domains/transfer-auth.php`
   - `server/php/domains/transfer-status.php`
   El archivo `server.ts` actualmente mantiene proxies HTTP hacia ellos como fallback temporal, pero la arquitectura debe migrar a la creación de órdenes de transferencia mediante el checkout comercial estándar de Banelio (`DOMAIN-TRANSFER-CHECKOUT`).
2. **Archivos PHP Presentes en el Repositorio Local:**
   Los siguientes archivos del bridge PHP sí están presentes y versionados en el repositorio:
   - `server/php/reseller/config.php`
   - `server/php/reseller/client.php`
   - `server/php/reseller/test-connection.php`
   - `server/php/domains/check.php`
   - `server/php/domains/transfer.php`
   - `server/php/domains/my-domains.php`
   - `server/php/domains/customer.php`
   - `server/php/domains/contacts.php`
3. **Aprovisionamiento Automático Post-Pago:**
   Al confirmar un pago (`PAYMENT_CONFIRMED`), el campo `provisionStatus` permanece deliberadamente en `NONE` hasta que se active el pipeline de aprovisionamiento real contra ResellerClub e IONOS.

## DO NOT CHANGE
- Esquema de base de datos `prisma/schema.prisma` ni migraciones existentes en `prisma/migrations/`.
- Lógica de autenticación server-side en `server/auth.ts` ni configuración de cookies.
- Mecanismo server-authoritative de cobro en `server/payments.ts` y verificación de firmas de webhook.
- Motor de cálculo fiscal en `server/tax.ts` y creación de órdenes en `server/orders.ts`.
- Bridge de conexión PHP en `server/php/reseller/*` y `server/php/domains/check.php` / `server/php/domains/transfer.php`.
- Clientes o lógica del frontend salvo para tareas expresamente asignadas.

## HANDOFF INSTRUCTIONS
La siguiente sesión de AI Studio DEBE comenzar leyendo obligatoriamente:
1. `BANELIO_RULES.md`
2. `BANELIO_WORK_STATE.md`
3. `BANELIO_TASKS.md`

La siguiente sesión **NO debe depender del historial de esta conversación**. Toda la información de arquitectura, estado, tareas, reglas y dependencias reside íntegramente en los archivos del repositorio.
