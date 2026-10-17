# BANELIO HANDOFF — RESTAURACIÓN COMERCIAL Y FRONTEND SUPERSITE 2

## 1. RESUMEN EJECUTIVO
Se ha completado la restauración integral de la plataforma comercial Banelio conservando el 100% del frontend corporativo y delegando las operaciones comerciales a ResellerClub SuperSite 2.

- **Arquitectura Final:**
  - **IONOS:** Aloja el frontend estático compilado con Vite (`dist/`), con todas sus páginas comerciales, diseño responsivo, soporte en español e inglés, cumplimiento legal México y enrutamiento SPA mediante directivas `.htaccess`.
  - **ResellerClub SuperSite 2:** Gestiona la tienda comercial, catálogo de precios autoritativo, planes de hosting, buzones de correo, certificados SSL, búsqueda definitiva de dominios, carrito y checkout seguro.
  - **Panel de clientes de ResellerClub:** Gestiona los servicios contratados (`https://banelio.myorderbox.com/customer`).
- **Estado Técnico:**
  - Cero código de backend propio en la compilación.
  - Sin base de datos propia, sin Prisma, sin servidor Express.
  - `npm run lint` (`tsc --noEmit`): 0 errores.
  - `npm run build` (`vite build`): Compilación estática exitosa en `dist/`.
  - Formulario oficial de búsqueda de dominios con POST a `/domain-registration/index.php`.
  - Formulario oficial de transferencias con POST a `/domain-registration/transfer/index.php` (código Auth/EPP volátil en memoria React, nunca almacenado).
  - Repositorios protegidos: `banelio1` y `main` de `banelio2` intactos.

## 2. PÁGINAS Y SERVICIOS RESTAURADOS Y ACCESIBLES
1. **Portada Principal (`/`):**
   - Buscador interactivo de dominios (pestañas Registro y Transferencia).
   - Catálogo de servicios comerciales destacados (Hosting, Correo Pro, SSL, Diseño Web, SEO, Afiliados).
   - Métricas de infraestructura (NVMe, LiteSpeed, Anycast DNS, TTFB < 50ms).
   - Sección interactiva de Preguntas Frecuentes (FAQ).
2. **Dominios (`/dominios`, `/domains`):**
   - Búsqueda, catálogo de TLDs y modal de transferencia seguro.
3. **Hosting Web Cloud NVMe (`/hosting`):**
   - Planes Starter, Pro Empresarial, Elite Turbo y Hosting Reseller WHM.
   - Características técnicas: NVMe PCIe 4.0, LiteSpeed Enterprise, cPanel en español, CloudLinux, HTTP/3.
   - Botones contextuales a la tienda SuperSite 2 y asesoría técnica.
4. **Correo Empresarial (`/email`, `/correo`):**
   - Suites Titan Email, Google Workspace y Microsoft 365.
   - Especificaciones de autenticación SPF, DKIM y DMARC, sincronización multidispositivo y cifrado TLS.
   - Botones contextuales a SuperSite 2.
5. **Certificados SSL y Seguridad (`/ssl`, `/seguridad`):**
   - Certificados Validación de Dominio (DV), Wildcard y Validación Extendida (EV).
   - Garantías legales, cifrado de 256 bits y beneficios para SEO y pasarelas de pago.
   - Botones contextuales a SuperSite 2.
6. **Diseño y Desarrollo Web (`/diseno-web`, `/web`):**
   - Sitios corporativos, tiendas online e-commerce y landing pages de alta conversión.
   - Metodología de 4 pasos y llamada a la acción hacia cotización directa por WhatsApp y email.
7. **Servicios SEO (`/seo`):**
   - Auditoría técnica, estrategia de palabras clave transaccionales, optimización on-page y SEO local.
   - Botón de solicitud de auditoría gratuita.
8. **Programa de Afiliados (`/afiliados`):**
   - Comisiones de hasta el 30% recurrente, cookies de 60 días y pagos mensuales.
   - Botón de postulación de afiliado.
9. **Soluciones para Revendedores (`/resellers`):**
   - Hosting Reseller con cPanel/WHM, marca blanca y dominios a precio mayorista.
10. **Blog & Guías Técnicas (`/blog`):**
    - Artículos sobre NVMe vs SSD, configuración SPF/DKIM/DMARC, selección de dominios y certificados SSL.
    - Filtros por categoría, buscador interactivo y modal editorial de lectura completa.

## 3. CONFIGURACIÓN CENTRALIZADA (`src/config/supersite.ts`)
- `SUPERSITE_URL`: `https://banelio.supersite2.myorderbox.com`
- `CUSTOMER_PANEL_URL`: `https://banelio.myorderbox.com/customer`
- `SUPERSITE_DOMAIN_SEARCH_ENDPOINT`: `https://banelio.supersite2.myorderbox.com/domain-registration/index.php`
- `SUPERSITE_DOMAIN_TRANSFER_ENDPOINT`: `https://banelio.supersite2.myorderbox.com/domain-registration/transfer/index.php`
- `SUPERSITE_CATEGORY_URLS`: Mapeo de categorías con fallback transparente a la tienda principal de SuperSite 2.

## 4. PUBLICACIÓN EN IONOS
- Ejecutar `npm run build`.
- Subir los archivos generados en la carpeta `dist/` a la raíz web de IONOS (`/` o `htdocs`).
- El archivo `dist/.htaccess` preconfigurado garantiza que las rutas limpias (`/hosting`, `/email`, `/ssl`, `/blog`, etc.) funcionen al recargar o entrar directamente.
