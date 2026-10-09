# BANELIO — Infraestructura Cloud & Registro de Dominios

Plataforma integral para búsqueda, registro, transferencia y administración de dominios en México y a nivel internacional, con integración server-side a ResellerClub (vía puente PHP autenticado por HMAC-SHA256), pagos multimoneda (Stripe Card en USD, OXXO en MXN y PayPal), autenticación de clientes con 2FA y deduplicación persistente en base de datos.

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 20+ (recomendado Node.js 22 LTS)
- npm o bun

### Instalación
```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno (copiar desde .env.example)
cp .env.example .env

# 3. Aplicar migraciones de base de datos Prisma (SQLite)
npx prisma migrate dev

# 4. Iniciar servidor de desarrollo
npm run dev
```

El servidor iniciará en `http://localhost:3000`.

---

## 🧪 Pruebas y Validación

```bash
# Ejecutar suite de pruebas de seguridad, pagos y aprovisionamiento (20 tests)
npm test

# Verificación de tipado estricto TypeScript
npm run lint

# Compilación de producción (Vite + Node Express bundle)
npm run build
```

---

## 🏛️ Arquitectura del Sistema

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Vite.
  - Flujo de storefront optimizado exclusivamente para dominios: búsqueda en tiempo real, validación de disponibilidad vía API, cálculo autoritativo de precios en múltiples divisas, transferencia con código EPP y captura estructurada del titular/registrante.
  - Modal de carrito con cálculo exacto de impuestos por país y checkout blindado.
  - Panel de cliente (`Mi Panel`): gestión de dominios, zonas DNS, datos del registrante, pedidos y seguridad de cuenta (2FA TOTP con códigos de respaldo y verificación de email).
- **Backend:** Node.js 22 + Express, TypeScript (`server.ts`).
  - Proxies seguros firmados criptográficamente hacia el puente PHP IONOS (`https://banelio.com/api/`).
  - Idempotencia estricta en webhooks de Stripe con almacenamiento en la tabla `StripeWebhookEvent`.
  - Ciclo de vida de aprovisionamiento en la tabla `ProvisioningOperation` (`PENDING` -> `IN_PROGRESS` -> `CONFIRMED` / `UNCERTAIN` / `FAILED`), aislando dominios individuales en pedidos múltiples y previniendo reenvíos a ciegas tras fallos de red.
  - Control autoritativo de divisas e importes: pagos con tarjeta en USD, vouchers OXXO exclusivamente en MXN calculados en servidor, y captura server-side en PayPal.
- **Base de Datos:** SQLite (`prisma/dev.db`) con Prisma ORM 6.19.3. Todas las migraciones se encuentran versionadas en `prisma/migrations/`.
- **Puente PHP (ResellerClub):** PHP 8.x en IONOS (`server/php/`).
  - Autenticación obligatoria servidor a servidor mediante HMAC-SHA256 (`X-Banelio-Signature`, `X-Banelio-Timestamp`) y secreto compartido `PHP_BRIDGE_SECRET`.
  - Sin datos ficticios: validación de campos obligatorios reales del registrante (nombre, correo, teléfono con código de país internacional, dirección, ciudad, estado, código postal y país ISO).

---

## 🔒 Variables de Entorno Requeridas

Consulta `.env.example` para los nombres oficiales:
- `SESSION_SECRET`: Secreto para firma de cookies de sesión segura.
- `DATABASE_URL`: URI de conexión a la base de datos (por defecto `file:./dev.db`).
- `PHP_BRIDGE_SECRET` / `RESELLER_BRIDGE_SECRET`: Clave compartida para autenticación HMAC-SHA256 con el puente PHP.
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`: Credenciales de Stripe para pagos con tarjeta y OXXO Pay.
- `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`: Credenciales de PayPal para captura de órdenes.
- `RESELLERCLUB_API_KEY` / `RESELLERCLUB_AUTH_USER_ID`: Credenciales del reseller en ResellerClub para operaciones en producción.

---

## 📄 Handoff a Claude

Para instrucciones detalladas de exportación, estado de módulos y trabajo pendiente, consulta [`CLAUDE_HANDOFF.md`](./CLAUDE_HANDOFF.md).
