# BANELIO — Frontend Estático & Integración ResellerClub SuperSite 2

Frontend moderno desarrollado en **React 19, TypeScript, Vite y Tailwind CSS v4** para **Banelio** (`banelio.com`), diseñado para alojarse en el **hosting compartido de IONOS**. La plataforma delega toda la operativa comercial, verificación autoritativa de disponibilidad, precios efectivos, carrito, pasarelas de pago y gestión de clientes en **ResellerClub SuperSite 2** y el **Panel de Clientes MyOrderBox**.

---

## 🏛️ Arquitectura del Sistema

```
                      ┌─────────────────────────────────────────┐
                      │            IONOS (banelio.com)          │
                      │  Frontend React 19 + TypeScript (Vite)  │
                      │  Páginas institucionales, diseño,       │
                      │  legal, SEO, buscador y transferencia   │
                      └────────────────────┬────────────────────┘
                                           │
                        Formularios POST   │   Redirección directa
                     de búsqueda/registro  │   al panel de clientes
                                           ▼
┌──────────────────────────────────────────┴──────────────────────────────────────────┐
│                             RESELLERCLUB SUPERSITE 2                                 │
│  - Tienda comercial: https://banelio.supersite2.myorderbox.com                       │
│  - Endpoint de búsqueda: .../domain-registration/index.php (POST)                   │
│  - Endpoint de transferencia: .../domain-registration/transfer/index.php (POST)      │
│  - Panel de Clientes: https://banelio.myorderbox.com/customer                        │
│  - Catálogo comercial, checkout seguro, facturación, aprovisionamiento ICANN/Registry│
└─────────────────────────────────────────────────────────────────────────────────────┘
```

1. **IONOS (`banelio.com`):**
   - Frontend 100% estático compilado con Vite (`dist/`).
   - Identidad corporativa de Banelio, diseño responsive de alto contraste y soporte bilingüe (Español / Inglés).
   - Formularios oficiales que envían directamente a SuperSite 2 mediante POST según especificaciones técnicas de ResellerClub.
   - Sin backend intermedio Node.js/PHP, sin base de datos local SQLite ni autenticación propia.
   - Seguridad: el código Auth/EPP se conserva únicamente en la memoria de la sesión mientras se envía por POST a SuperSite 2. No se guarda en cookies, localStorage ni URLs.

2. **ResellerClub SuperSite 2 (`banelio.supersite2.myorderbox.com`):**
   - Comprobación oficial de disponibilidad en tiempo real ante los Registries.
   - Precios efectivos, promociones comerciales y tipos de cambio aplicados por ResellerClub.
   - Gestión integral del carrito de compras y pasarelas de pago.

3. **Panel de Clientes ResellerClub (`banelio.myorderbox.com/customer`):**
   - Acceso de clientes para administración de dominios, registros DNS Anycast, bloqueo de transferencias (Transfer Lock), autorizaciones EPP y renovaciones.

---

## ⚙️ Configuración Centralizada

Todas las rutas y URLs de SuperSite 2 están centralizadas en:
[`src/config/supersite.ts`](src/config/supersite.ts)

| Clave | URL Configurada | Propósito |
|---|---|---|
| `SUPERSITE_URL` | `https://banelio.supersite2.myorderbox.com` | Tienda comercial SuperSite 2 |
| `CUSTOMER_PANEL_URL` | `https://banelio.myorderbox.com/customer` | Portal de inicio de sesión y gestión del cliente |
| `SUPERSITE_DOMAIN_SEARCH_ENDPOINT` | `.../domain-registration/index.php` | Formulario POST de búsqueda y registro |
| `SUPERSITE_DOMAIN_TRANSFER_ENDPOINT` | `.../domain-registration/transfer/index.php` | Formulario POST de transferencia |

> ⚠️ **Comprobación manual en ResellerClub antes de publicar:**
> Confirma en tu panel de control de ResellerClub (`Configuración > Ajustes de Marca > SuperSite & PartnerSite`) la URL exacta de tu SuperSite y del panel de clientes. Si configuras un dominio totalmente personalizado (por ejemplo `tienda.banelio.com`), solo debes actualizar `src/config/supersite.ts`.

---

## 🛠️ Desarrollo Local

### Requisitos Previos
- Node.js 20+ (recomendado Node.js 22 LTS)
- npm

### Comandos
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo en http://localhost:3000
npm run dev

# 3. Comprobar tipado estricto TypeScript
npm run lint

# 4. Compilar para producción (archivos estáticos en dist/)
npm run build

# 5. Vista previa local del build estático
npm run preview
```

---

## 🚀 Despliegue en Hosting Compartido de IONOS

Al tratarse de una Single Page Application (SPA) puramente estática, el despliegue en IONOS no requiere Node.js ni bases de datos:

1. Ejecuta la compilación de producción:
   ```bash
   npm run build
   ```
2. La carpeta de salida es:
   ```
   dist/
   ├── index.html
   ├── robots.txt
   ├── sitemap.xml
   └── assets/
       ├── index-[hash].css
       └── index-[hash].js
   ```
3. Sube el contenido íntegro de la carpeta `dist/` a la raíz del espacio web de tu dominio `banelio.com` en IONOS (mediante SFTP o el Gestor de Archivos de IONOS).
4. Asegúrate de que tu archivo `.htaccess` en la raíz de IONOS redirija las rutas al `index.html` para el enrutamiento SPA:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

---

## 📋 Integración de Formularios SuperSite 2

### 1. Búsqueda y Disponibilidad de Dominios
- **Destino:** `https://banelio.supersite2.myorderbox.com/domain-registration/index.php`
- **Método:** `POST`
- **Campos:**
  - `action`: `check_availability`
  - `showrelated`: `true`
  - `txtDomainName`: Nombre del dominio sin su extensión (soporta TLDs compuestos como `com.mx`, `co.uk`).
  - `tld[]`: Extensión seleccionada.

### 2. Transferencia de Dominios
- **Destino:** `https://banelio.supersite2.myorderbox.com/domain-registration/transfer/index.php`
- **Método:** `POST`
- **Campos:**
  - `action`: `domain_transfer_summary`
  - `nextstep`: `true`
  - `dom_action`: `transfer`
  - `domainname`: Nombre del dominio.
  - `tlds`: Extensión.
  - `secretname`: Código Auth/EPP obtenido por el cliente (opcional al inicio).
