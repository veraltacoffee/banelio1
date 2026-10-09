# CLAUDE HANDOFF — BANELIO CORE DOMAINS

Este documento describe el estado exacto, la arquitectura, los cambios realizados y los siguientes pasos para continuar el desarrollo de Banelio con Claude.

---

## 1. RESUMEN EJECUTIVO

- **Objetivo Central:** Comercialización y gestión de nombres de dominio (búsqueda, disponibilidad en tiempo real, registro, transferencia con código EPP/Auth, checkout seguro, panel de cliente y aprovisionamiento vía ResellerClub).
- **Estado Técnico:**
  - Base de código limpia, modular y sin código muerto ni mocks en el flujo de dominios.
  - Retirados temporalmente de la UI y del catálogo comercial: hosting, correo, SSL, soluciones bundle, afiliados, blog y consola administrativa no funcional (preservando íntegramente los modelos de datos y migraciones para futuras fases).
  - 23/23 pruebas de seguridad, pagos, transferencias y aprovisionamiento aprobadas (`npm test`).
  - Cero errores de tipado TypeScript (`tsc --noEmit`).
  - Compilación de producción exitosa (Vite + esbuild CJS bundle).
  - Migración `20261009004012_add_stripe_events_and_provisioning_operations` corregida como no destructiva, preservando modelos comerciales históricos (`PricingProfile`, `ProviderCostRecord`, `ProductPriceVersion`, `SolutionDefinition`, `SolutionComponent`, `CommercialOffer`, `FxProtectionConfig`) y `solutionId` en `Entitlement`.
  - Precios de transferencias configurados y activos en `/api/transfers/pricing` con costos de proveedor reales.
- **Rama Git:** `main`

---

## 2. ARQUITECTURA DEL SISTEMA

### 2.1 Frontend (SPA React 19 + TypeScript)
- **Vite SPA** integrado en `server.ts`.
- **Estilos:** Tailwind CSS v4, Lucide React, diseño responsivo y consistente con identidad de marca Banelio.
- **Storefront de Dominios:**
  - `HeroDomainSearch.tsx`: Búsqueda principal con pestañas de Registro y Transferencia. Consulta el endpoint real `/api/domains/check.php` y `/api/domains/transfer.php`.
  - `DomainsLanding.tsx`: Vista dedicada de dominios con filtrado por categoría y cálculo de precios por divisa.
  - `CartModal.tsx`: Carrito enfocado exclusivamente en dominios y transferencias, con soporte de código EPP por ítem y formulario de datos del registrante.
  - `CheckoutModal.tsx`: Pasarela con registro/login de cliente, validación de datos fiscales/contacto, Stripe Card (USD), OXXO Pay (MXN con tipo de cambio de servidor), y PayPal.
- **Panel de Cliente (`CustomerDashboard.tsx`):**
  - Vista de dominios activos y órdenes recientes desde base de datos.
  - Editor de datos del registrante (`RegistrantEditModal.tsx`).
  - Gestión de zonas DNS (`DnsManagerModal.tsx`).
  - Seguridad de la cuenta: Verificación de correo electrónico y autenticación de dos factores (2FA TOTP con códigos QR y backup codes).
  - Modal de tickets de soporte (`TicketModal.tsx`).
  - Cumplimiento Legal México (`LegalModal.tsx`, `CookieConsentBanner.tsx`).

### 2.2 Backend (Node.js 22 + Express + TypeScript)
- **Servidor:** `server.ts` sirviendo API REST y Vite SPA.
- **Base de Datos:** SQLite (`prisma/dev.db`) con Prisma ORM 6.19.3.
- **Modelos Persistentes Clave:**
  - `CatalogItem`: Catálogo comercial de TLDs y precios autoritativos.
  - `Order`: Pedidos con estados de pago y totales calculados en servidor.
  - `Customer`: Usuarios registrados, contraseñas con bcrypt, estado de 2FA y verificación de correo.
  - `StripeWebhookEvent`: Deduplicación persistente atómica de webhooks (`RECEIVED`, `PROCESSING`, `PROCESSED`, `FAILED`).
  - `ProvisioningOperation`: Ciclo de vida por ítem (`PENDING`, `IN_PROGRESS`, `CONFIRMED`, `UNCERTAIN`, `FAILED`), previniendo operaciones duplicadas y reenvíos a ciegas tras errores de red.
  - `Entitlement`: Servicios y dominios contratados por los clientes.

### 2.3 Puente PHP (IONOS -> ResellerClub)
- Ubicación local: `server/php/` (desplegado en servidor IONOS `https://banelio.com/api/`).
- **Autenticación HMAC-SHA256:**
  - Encabezados: `X-Banelio-Signature`, `X-Banelio-Timestamp`.
  - Ventana de tolerancia: 300 segundos (5 minutos).
  - Comparación en tiempo constante (`hash_equals` / `crypto.timingSafeEqual`).
  - Secreto compartido: `PHP_BRIDGE_SECRET`.
  - Endpoints protegidos: `provision.php`, `customer.php`, `contacts.php`, `my-domains.php`, `test-connection.php`.
- **Cero Datos Ficticios:**
  - Eliminados los valores por defecto históricos (`6691000000`, `00000`, prefijos arbitrarios `1` o `52`).
  - Validación de campos obligatorios reales antes de invocar los endpoints de ResellerClub.

---

## 3. INSTALACIÓN Y EJECUCIÓN

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Validar estado de la base de datos
npx prisma migrate status

# 4. Iniciar en desarrollo
npm run dev

# 5. Compilar para producción
npm run build

# 6. Ejecutar en producción
npm start
```

---

## 4. COMANDOS DE PRUEBA Y VERIFICACIÓN

```bash
# Suite de pruebas automatizadas (20 escenarios obligatorios)
npm test

# Verificación de tipos TypeScript
npm run lint

# Compilación completa del frontend y backend
npm run build
```

---

## 5. VARIABLES DE ENTORNO REQUERIDAS

| Variable | Descripción | Estado |
| :--- | :--- | :--- |
| `DATABASE_URL` | Ruta SQLite (`file:./dev.db`) | Requerido |
| `SESSION_SECRET` | Firma de cookies de sesión | Requerido |
| `PHP_BRIDGE_SECRET` | Secreto HMAC para el puente PHP IONOS | Requerido |
| `RESELLER_BRIDGE_SECRET` | Alias alternativo para el secreto HMAC | Opcional |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe | Requerido en prod |
| `STRIPE_WEBHOOK_SECRET` | Clave para verificar firma de webhooks | Requerido en prod |
| `PAYPAL_CLIENT_ID` | Client ID de PayPal REST SDK | Requerido en prod |
| `PAYPAL_CLIENT_SECRET` | Client Secret de PayPal | Requerido en prod |
| `PAYPAL_MODE` | `sandbox` o `live` | Opcional |
| `RESELLERCLUB_API_KEY` | API Key de ResellerClub | En servidor IONOS |
| `RESELLERCLUB_AUTH_USER_ID` | Reseller ID en ResellerClub | En servidor IONOS |

*Nota: No se deben guardar secretos ni claves reales en archivos versionados ni en `.env.example`.*

---

## 6. RUTAS PRINCIPALES

### Frontend
- `/`: Portada con buscador de dominios en tiempo real, verificación de TLDs y FAQ.
- `/dominios`: Storefront detallado con catálogo de extensiones, filtros y transferencias.
- `/api/auth/me`: Verificación de sesión de cliente.
- `Mi Panel` (modal / view `CUSTOMER`): Gestión de dominios, pedidos, 2FA, DNS y datos de contacto.

### Backend REST API
- `GET /api/health`: Estado de salud, base de datos y conectividad.
- `GET /api/catalog`: Catálogo comercial activo de dominios (precios públicos sanitizados).
- `GET /api/domains/check.php?domain={domain}`: Proxy de verificación de disponibilidad.
- `GET /api/domains/transfer.php?domain={domain}`: Proxy de verificación de elegibilidad para transferir.
- `POST /api/orders`: Creación autoritativa de pedidos con precios calculados en servidor.
- `POST /api/orders/:id/retry-provision`: Reintento seguro y controlado de aprovisionamiento.
- `POST /api/payments/stripe/create-intent`: Creación de PaymentIntent en USD.
- `POST /api/payments/oxxo/create-voucher`: Generación de voucher de pago OXXO en MXN.
- `POST /api/payments/stripe/webhook`: Webhook de Stripe con deduplicación persistente en base de datos.
- `POST /api/payments/paypal/create-order` y `/capture-order`: Flujo server-side de PayPal.
- `POST /api/auth/*`: Registro, login, logout, 2FA setup, 2FA verify, verificación de email y reseteo de contraseña.

---

## 7. ESTADO REAL DE RESELLERCLUB

- **Ambiente de Pruebas Local:** Totalmente simulado mediante mocks rigurosos y aserciones en `server/payments-provisioning.test.ts` (pruebas de concurrencia, pérdida de red, formato HMAC, campos obligatorios, deduplicación).
- **Ambiente Remoto (IONOS):** Los endpoints PHP (`https://banelio.com/api/domains/*.php`) cuentan con la lógica del SDK HTTP de ResellerClub. La activación final de operaciones reales requiere conectar las credenciales de producción (`RESELLERCLUB_API_KEY`, `RESELLERCLUB_AUTH_USER_ID`) en el servidor IONOS y autorizar las IPs de salida en el panel de ResellerClub.
- **Regla:** Ningún aprovisionamiento real se declara probado hasta que se ejecute una orden de prueba verificada con credenciales autorizadas en producción.

---

## 8. CAMBIOS REALIZADOS EN LA LIMPIEZA

1. **Eliminación de Módulos No Funcionales:**
   - Retirados componentes y páginas de blog: `BlogLanding.tsx`, `BlogPostDetail.tsx`, `src/data/blogData.ts`.
   - Retirados componentes de afiliados y resellers: `AffiliatesLanding.tsx`, `AffiliateAuthView.tsx`, `ResellerPortal.tsx`.
   - Retirada la consola de administración no funcional: `src/components/admin/AdminDashboard.tsx`.
   - Retiradas páginas y secciones de servicios complementarios sin integración de proveedor: `HostingPlans.tsx`, `HostingLanding.tsx`, `EmailAndSsl.tsx`, `EmailLanding.tsx`, `SslLanding.tsx`, `SolutionsSection.tsx`, `AddonConfigModal.tsx`.
2. **Optimización de Navegación y Tienda:**
   - `Navbar.tsx` simplificado: navegación centrada en Dominios, idioma, divisa, carrito y panel de cliente.
   - `Footer.tsx` equilibrado en 3 columnas: Identidad/Contacto, Dominios/DNS y Cumplimiento Legal México.
   - `CartModal.tsx` limpio de popups y cross-sells de hosting, email o SSL no verificados.
   - `CustomerDashboard.tsx` actualizado para enfocar los llamados a la acción en registro y administración de dominios.
   - `server/catalog.ts` actualizado: `getActiveCatalog` expone exclusivamente la categoría `DOMAIN`.
3. **Reducción de Dependencias:**
   - Retiradas librerías de animación innecesarias (`gsap` y `motion`) de `package.json`, reduciendo el bundle de producción en más de 340 kB.
4. **Verificación de Migraciones Prisma:**
   - Comprobada la migración `20261009004012_add_stripe_events_and_provisioning_operations`. Los modelos base (`CatalogItem`, `Order`, `Customer`, `Session`, etc.) y sus datos se encuentran 100% preservados en `prisma/dev.db`.

---

## 9. TRABAJO PENDIENTE Y PRÓXIMAS FASES

1. **Credenciales de Producción ResellerClub:**
   - Desplegar `server/php/` actualizado con autenticación HMAC en el servidor IONOS.
   - Configurar `PHP_BRIDGE_SECRET` en el entorno de IONOS y en el backend de Banelio.
   - Configurar `RESELLERCLUB_API_KEY` y `RESELLERCLUB_AUTH_USER_ID` en `config.php` de IONOS.
   - Autorizar la IP del servidor en el panel de ResellerClub (Configuración de API / Whitelist de IPs).
2. **Prueba Extremo a Extremo en Producción:**
   - Realizar una búsqueda y registro de un dominio de prueba de bajo costo en el entorno real para validar la cadena completa (Stripe -> Webhook -> Node.js -> HMAC -> PHP IONOS -> ResellerClub -> Creación de Orden -> Entitlement en base de datos).
3. **Reintegración Futura de Hosting, Email y SSL:**
   - Cuando se cuente con APIs activas y verificadas para hosting cPanel/Plesk, correo Titan y certificados SSL, reintegrar dichos productos en el catálogo comercial y crear sus respectivos workers de aprovisionamiento idempotente.
