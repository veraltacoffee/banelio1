# BANELIO WORK STATE

## FECHA DE ACTUALIZACIÓN
2026-10-17

## REPOSITORIO Y RAMA
- Repositorio de trabajo: `veraltacoffee/banelio2`
- Rama de trabajo: `supersite2-integration`
- Repositorio de respaldo intacto: `veraltacoffee/banelio1`

## ARQUITECTURA FINAL CONSOLIDADA
**Frontend Estático IONOS + ResellerClub SuperSite 2:**
1. **IONOS (`banelio.com`):**
   - Frontend estático React 19 + TypeScript + Vite + Tailwind CSS v4.
   - Páginas comerciales completas restauradas y activas:
     * Portada Principal (`/`)
     * Registro y Transferencia de Dominios (`/dominios`, `/domains`)
     * Hosting Web Cloud NVMe & Reseller WHM (`/hosting`)
     * Correo Corporativo: Titan, Google Workspace, Microsoft 365 (`/email`, `/correo`)
     * Certificados SSL & Seguridad Web: DV, Wildcard, EV (`/ssl`, `/seguridad`)
     * Diseño y Desarrollo Web Profesional (`/diseno-web`, `/web`)
     * Servicios SEO & Posicionamiento en Google (`/seo`)
     * Programa de Partners & Afiliados (`/afiliados`)
     * Soluciones para Revendedores & Agencias (`/resellers`)
     * Blog Oficial & Recursos Técnicos (`/blog`)
   - Búsqueda y transferencia de dominios mediante formularios directos POST a ResellerClub SuperSite 2 sin almacenar ni exponer Auth/EPP.
   - Botones contextuales en Hosting, Correo y SSL dirigidos a SuperSite 2 con fallback centralizado.
   - Botones de contacto y WhatsApp para servicios a medida (Diseño Web, SEO, Afiliados, Reseller onboarding).
   - Enrutamiento limpio SPA con `.htaccess` configurado en `public/.htaccess` para soporte de recargas en IONOS Apache.
   - Cero código de backend propio en la compilación de salida (`dist/`).
   - Cero dependencias de servidor (Express, SQLite, Prisma) en el frontend.

2. **ResellerClub SuperSite 2:**
   - Comprobación oficial de disponibilidad de dominios en tiempo real ante Registries.
   - Tienda comercial autoritativa, precios en tiempo real, planes y promociones.
   - Carrito, checkout seguro y cobros comerciales.
   - Aprovisionamiento de dominios, hosting, correos y certificados.

3. **Panel de Clientes de ResellerClub:**
   - Gestión de servicios contratados (`https://banelio.myorderbox.com/customer`).

## CONFIGURACIÓN CENTRALIZADA
- Módulo central: `src/config/supersite.ts`
- Tienda SuperSite 2: `https://banelio.supersite2.myorderbox.com`
- Panel de Clientes: `https://banelio.myorderbox.com/customer`
- Búsqueda oficial: `https://banelio.supersite2.myorderbox.com/domain-registration/index.php` (POST)
- Transferencia oficial: `https://banelio.supersite2.myorderbox.com/domain-registration/transfer/index.php` (POST)
- URLs por categoría: `SUPERSITE_CATEGORY_URLS` (hosting, email, ssl) con fallback automático.

## ESTADO DE VERIFICACIÓN
- `npm run lint` (`tsc --noEmit`): 0 errores.
- `npm run build` (`vite build`): Exitoso. Directorio de salida: `dist/`.
- Archivos generados en `dist/`: `.htaccess`, `index.html`, `sitemap.xml`, `robots.txt`, `assets/`.
- Sin código de servidor `dist/server.cjs`.
