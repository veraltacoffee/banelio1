# BANELIO AI CONTEXT

## Project
- **Repository:** `veraltacoffee/banelio1`
- **Current Branch:** `main`
- **Architecture:** Client-Server Monorepo (React SPA + Express Backend API + IONOS PHP Bridge to ResellerClub)
- **Technology Stack:**
  - **Runtime & Language:** Node.js v22, TypeScript 5.8
  - **Frontend:** React 19, Tailwind CSS v4, Vite 6, Lucide React, Motion
  - **Backend:** Express 4.21, Helmet, CORS, Express-Rate-Limit, esbuild
  - **Database & ORM:** Prisma ORM 6.19 with SQLite (`prisma/dev.db` in dev)
  - **Bridge Registry:** Apache PHP 8.x scripts on IONOS hosting (`https://banelio.com/api/`)
  - **External Providers:** ResellerClub HTTP API, Stripe, PayPal REST SDK v2, IANA RDAP

## Business objective
Banelio es una plataforma comercial digital para la venta y administración de dominios (registro y transferencia), hosting cloud NVMe de alta velocidad, correo corporativo, certificados SSL y soluciones paquetizadas, junto con un portal de afiliados/partners con cálculo server-authoritative de precios, márgenes brutos y facturación en múltiples monedas.

## Current architecture
```
Banelio Frontend (React 19 SPA)
         ↓  (JSON HTTP / HttpOnly Cookie Auth)
Backend / API Banelio (Node.js Express / Prisma ORM)
         ↓  (Server-to-Server Proxy / HTTPS)
ResellerClub PHP Bridge (IONOS Apache: https://banelio.com/api/)
         ↓  (Direct HTTP API calls with Reseller credentials)
ResellerClub API (OrderBox Registry / DNS / Contacts / Orders)
         ↓
Control y Servicios de ResellerClub (cPanel, Webmail, Registry ICANN)
```

## ResellerClub
- **Integración existente:**
  - Ubicación local del puente: `server/php/`
  - `server/php/reseller/config.php`: configuración de credenciales y URL de la API de ResellerClub en el servidor IONOS.
  - `server/php/reseller/client.php`: cliente HTTP cURL con autenticación server-side para llamadas a ResellerClub.
  - `server/php/reseller/test-connection.php`: comprobación de salud y estado de la cuenta reseller.
  - `server/php/domains/check.php`: consulta directa de disponibilidad de dominios.
  - `server/php/domains/transfer.php`: comprobación de transferibilidad (`regthroughothers`, `regthroughus`, `available`).
  - `server/php/domains/customer.php`: búsqueda y sincronización de clientes de ResellerClub.
  - `server/php/domains/contacts.php`: gestión de contactos Registrant/Admin/Tech/Billing.
  - `server/php/domains/my-domains.php`: listado de dominios activos de un cliente.
- **Endpoints consumidos por el backend Banelio:**
  - `GET /api/domains/check.php`: proxy a `https://banelio.com/api/domains/check.php`
  - `GET /api/domains/transfer.php`: proxy a `https://banelio.com/api/domains/transfer.php`
  - `GET /api/domains/customer.php`: proxy a `https://banelio.com/api/domains/customer.php`
  - `GET /api/domains/contacts.php`: proxy a `https://banelio.com/api/domains/contacts.php`
  - `GET /api/customer/domains`: consulta en vivo a `my-domains.php` con fallback a `Entitlement` local
  - `GET /api/registry/status` y `GET /api/reseller/test-connection`: validación de conectividad en vivo
  - `GET /api/domains/pricing`: catálogo comercial de dominios con precios minoristas y costes de proveedor
  - `GET /api/transfers/pricing`: precios de transferencia y renovación de dominios
- **Funciones implementadas:**
  - Búsqueda de disponibilidad en tiempo real con precios comerciales resueltos desde el catálogo.
  - Verificación de elegibilidad de transferencias y captura segura de Auth/EPP Code (6-32 caracteres).
  - Consulta WHOIS/RDAP bootstrap oficial de IANA sin credenciales (`/api/domains/whois`).
  - Sincronización de lista de dominios activos del cliente autenticado.
- **Funciones pendientes:**
  - Disparador de aprovisionamiento automatizado: ejecutar la orden de compra/transferencia en ResellerClub cuando una orden pasa a `PAYMENT_CONFIRMED` en Banelio.
- **Credenciales:**
  - NUNCA se almacenan en el código ni en el repositorio de GitHub. Residen exclusivamente en variables de entorno seguras del servidor IONOS y en el entorno de ejecución backend (`RESELLER_ID`, `API_KEY`).

## Payments
- **Stripe:**
  - Ubicación: `server/payments.ts` (`stripeCreatePaymentIntent`, `parseStripeWebhookEvent`), `server.ts` (`/api/payments/stripe/*`, `/api/webhooks/stripe`).
  - Flujo: Client Secret retornado por el backend → frontend monta Payment Element → confirmación mediante webhook `payment_intent.succeeded` verificado con HMAC SHA-256 (`STRIPE_WEBHOOK_SECRET`).
- **PayPal:**
  - Ubicación: `server/payments.ts` (`paypalCreateOrder`, `paypalCaptureOrder`), `server.ts` (`/api/payments/paypal/*`).
  - Flujo: Orden creada server-side con OAuth Bearer token → captura server-side verificando monto y moneda exacta contra la orden en Prisma.
- **OXXO Pay:**
  - Ubicación: `server/payments.ts` (`usdToMxnCents`, `stripeCreatePaymentIntent`), `server.ts` (`/api/payments/stripe/oxxo-intent`).
  - Flujo: Conversión USD a MXN con tasa de cambio real y buffer de protección FX → generación de voucher de 14 dígitos vía Stripe OXXO → confirmación mediante webhook.
- **Estado real:**
  - Totalmente implementado con manejo seguro de credenciales no configuradas (retorna HTTP 503 estructurado `{ configured: false, status: 'unavailable' }`).

## Authentication
- **Ubicación:** `server/auth.ts`, `prisma/schema.prisma` (`Customer`, `Session`, `PendingTwoFactorAuth`, `EmailVerificationToken`, `PasswordResetToken`), `src/components/auth/`.
- **Estado real:**
  - Autenticación server-side con sesiones persistidas en base de datos.
  - Cookie `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` en producción.
  - Tokens de sesión generados con `crypto.randomBytes(32)` y almacenados como hash SHA-256 en la tabla `Session`.
  - Contraseñas cifradas con `bcryptjs` (salt rounds 12).
  - Soporte de 2FA TOTP con códigos QR (`qrcode`), tokens de verificación de email y recuperación de contraseña con expiración y control de intentos fallidos.
  - Rate-limiting estricto en rutas sensibles de autenticación (`express-rate-limit`).

## Database
- **Prisma Schema:** `prisma/schema.prisma`
- **Modelos activos:**
  - `Customer`: cuentas de clientes y administradores, hash de contraseña, estado 2FA, verificación.
  - `Session`: sesiones activas vinculadas a cookie HttpOnly con expiración y lastSeenAt.
  - `PendingTwoFactorAuth`: flujo temporal de validación de segundo factor.
  - `EmailVerificationToken`: tokens con hash seguro para confirmar dirección de correo.
  - `PasswordResetToken`: tokens temporales con control de intentos fallidos para restablecimiento.
  - `CatalogItem`: catálogo comercial autoritativo server-side (SKUs, precios en USD Decimal, metadata).
  - `Order`: órdenes con llave de idempotencia, desglose de impuestos, estado de pago y estado de provisión.
  - `Entitlement`: derechos de servicio aprovisionados o pendientes para clientes (dominios, hosting, correo, SSL, soluciones).

## Files and modules
- `server.ts`: punto de entrada backend Express, proxy de APIs IONOS/ResellerClub, rutas de catálogo, pagos, órdenes y autenticación.
- `server/catalog.ts`: definición autoritativa del catálogo comercial, seed de productos y resolución de precios.
- `server/orders.ts`: creación de órdenes server-authoritative, validación de EPP Code, cálculo de impuestos y transiciones de pago.
- `server/auth.ts`: lógica de registro, login, sesiones, 2FA, verificación y recuperación de contraseña.
- `server/payments.ts`: pasarelas de pago (Stripe, PayPal, OXXO Pay) y verificación de webhooks.
- `server/pricing.ts`: administración del motor de precios comerciales y márgenes para partners/minoristas.
- `server/tax.ts`: motor de cálculo de impuestos para 11 países e internacional.
- `server/health.ts`: diagnóstico y estado de salud de servicios externos y base de datos.
- `server/db.ts`: cliente singleton de Prisma ORM.
- `server/php/`: scripts PHP desplegados en el backend IONOS Apache que interactúan directamente con ResellerClub.
- `src/App.tsx`: routing SPA basado en rutas limpias (`/dominios`, `/hosting`, `/email`, `/ssl`, `/afiliados`, `/blog`) y roles de usuario.
- `src/context/AppContext.tsx`: estado global de React (carrito, moneda, idioma, usuario autenticado, modales).
- `src/services/domainService.ts`: cliente frontend para disponibilidad, transferencia y catálogo de precios.
- `src/services/pricingEngine.ts`: lógica de márgenes comerciales, descuentos por volumen y redondeos por divisa.

## Removed
- `@google/genai`: dependencia eliminada de `package.json` (cero consumidores en producción).
- `src/components/public/CleanHomeLanding.tsx`: landing experimental no referenciada.
- `src/components/public/ResellerPromoSection.tsx`: sección promocional redundante sin importación.
- `src/components/auth/QuickAuthModal.tsx`: modal de autenticación provisional reemplazado por pestañas integradas en checkout.
- `src/components/layout/RoleBar.tsx`: barra de desarrollo reemplazada completamente por `Navbar.tsx`.
- `queryRegistry` en `server.ts`: función alternativa no utilizada que puenteaba directamente a ResellerClub obviando el bridge PHP en IONOS.
- Código muerto y variables/funciones huérfanas en `AdminDashboard.tsx` (`editingTld`, `editCost`, `editMargin`, `editMarkup`, `editPromo`, `startEditTld`, `saveTldEdit`, `updateTldConfig`).
- Imports y variables no utilizadas en más de 20 componentes y utilidades (`Footer`, `CustomerDashboard`, `CheckoutModal`, `CartModal`, `TwoFactorModal`, `EmailConfirmationModal`, `CustomerAuthView`, `AffiliateAuthView`, `AddonConfigModal`, `DomainTransferModal`, `DomainsLanding`, `HeroDomainSearch`, `HostingLanding`, `EmailLanding`, `LegalModal`, `DnsManagerModal`, `ProfileCompletionModal`, `TicketModal`, `WhatsAppFloatingButton`, `ResellerPortal`, `pdfGenerator.ts`, `AppContext.tsx`).
- `HTTP`: archivo vacío de 0 bytes en la raíz del proyecto.
- `AUDIT/CONTEXT.md` y carpeta `AUDIT/`: directorio y archivo vacíos de 0 bytes.
- `estructura.txt`: archivo de volcado obsoleto que referenciaba dependencias inexistentes (`bun.lock`).
- `BANELIO_AUDITORIA.md`: texto duplicado de instrucciones de auditoría obsoletas.
- `BANELIO_AUDIT.md`: auditoría histórica superada (16-Sep-2026).
- `AUTH_IMPLEMENTATION_SPEC.md`: especificación técnica de tarea ya completada.

## Kept intentionally
- `tools/banelio-agent.py`: script de despliegue y gestión del servidor Banelio (`/srv/banelio/agent/banelio-agent.py`).
- `server/php/`: scripts PHP del bridge oficial con ResellerClub desplegados en IONOS Apache (`https://banelio.com/api/`).
- `src/data/mockData.ts` y `src/data/blogData.ts`: artículos de conocimiento técnico y datos base de la plataforma.
- Modelos Prisma `CatalogItem`, `Order`, `Customer`, `Session`, `PendingTwoFactorAuth`, `EmailVerificationToken`, `PasswordResetToken`, `Entitlement`: esenciales para el flujo comercial y seguridad.
- Módulos de Stripe, PayPal y OXXO en `server/payments.ts`: necesarios para el checkout de Banelio.
- WHOIS/RDAP bootstrap (`/api/domains/whois` y `WhoisModal.tsx`): servicio ICANN oficial para inspección pública de dominios ocupados (no compite con ResellerClub ya que ResellerClub solo comercializa disponibilidad).

## Pending
- `RESELLERCLUB-PROVISIONING-WORKER`: automatizar el aprovisionamiento de dominios y servicios en ResellerClub una vez que la orden ha sido confirmada como `PAID` en Banelio.

## Decisions
1. **Server-Authoritative:** Ningún precio, impuesto, total ni SKU es calculado o confiado desde el cliente. El backend valida cada ítem contra el catálogo en Prisma.
2. **Separación de Costos y Precios:** Los costos mayoristas de ResellerClub (`providerCostUSD`, etc.) nunca se exponen al cliente público; solo se muestran precios minoristas calculados (`retailPriceUSD`).
3. **Autenticación sin JWT en localStorage:** La identidad del usuario se mantiene mediante cookies HttpOnly seguras con tokens de sesión aleatorios indexados por hash SHA-256 en la base de datos.
4. **Bridge Oficial en IONOS:** El backend Node.js se comunica con la API de ResellerClub mediante scripts PHP protegidos alojados en `https://banelio.com/api/` para mantener credenciales y whitelists de IP seguras.

## Change history
- **2026-10-09:**
  - Corrección y blindaje de la migración `20261009004012_add_stripe_events_and_provisioning_operations` como estrictamente no destructiva, restaurando y preservando los modelos comerciales históricos en Prisma.
  - Activación de costos mayoristas de transferencia (`providerTransferCostUSD`) en `pricingEngine.ts`, permitiendo precios reales y autoritativos en `/api/transfers/pricing` para dominios transferibles.
  - Normalización en creación de pedidos (`server/orders.ts`) para resolver el costo de proveedor por TLD cuando se solicita una transferencia (`DOMAIN_TRANSFER`).
  - Ampliación y validación de la suite de pruebas automatizadas a 23/23 tests pasando (`npm test`), verificación de tipos limpia (`tsc --noEmit`) y compilación exitosa (`npm run build`).

- **2026-10-08:**
  - Depuración y consolidación profunda del repositorio en la rama `cleanup/banelio-resellerclub`.
  - Eliminación de dependencias no utilizadas (`@google/genai`).
  - Eliminación de componentes abandonados (`CleanHomeLanding.tsx`, `ResellerPromoSection.tsx`, `QuickAuthModal.tsx`, `RoleBar.tsx`).
  - Eliminación de la función redundante `queryRegistry` en `server.ts` que duplicaba el bridge oficial PHP.
  - Eliminación de código muerto y estado huérfano de edición local de TLDs en `AdminDashboard.tsx`.
  - Limpieza exhaustiva de todos los imports y variables no utilizadas en componentes (`CustomerDashboard`, `CheckoutModal`, `CartModal`, `TwoFactorModal`, `EmailConfirmationModal`, `Footer`, etc.).
  - Incorporación de `bun.lock` a `.gitignore` para preservar `package-lock.json` como único lockfile npm sin interferencias.
  - Validación completa con `tsc --noEmit --noUnusedLocals` (0 errores), `lint` (PASS) y `build` (PASS).

## Next task
`RESELLERCLUB-PROVISIONING-WORKER`: Implementar el procesador server-side de aprovisionamiento que despacha llamadas automáticas a la API de ResellerClub (registro/transferencia) al confirmarse el pago de una orden en Banelio.
