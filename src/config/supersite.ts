/**
 * BANELIO - Configuración Centralizada de ResellerClub SuperSite 2
 *
 * Fuente única de verdad para las URLs de la tienda comercial,
 * endpoints de búsqueda, registro, transferencia y panel de clientes.
 *
 * GUÍA DE CONFIGURACIÓN DE URLS EN RESELLERCLUB:
 * 1. Accede a tu panel de control de ResellerClub (https://cp.resellerclub.com).
 * 2. Navega a: Configuración > Ajustes de Marca > SuperSite & PartnerSite.
 * 3. En la sección "SuperSite 2", encontrarás:
 *    - La URL base de tu tienda (ej. https://banelio.supersite2.myorderbox.com o tu dominio personalizado si lo activaste con CNAME).
 *    - Las URLs directas para cada categoría de producto activa:
 *      * Dominios: /domain-registration/index.php
 *      * Hosting Web: /web-hosting/index.php o /hosting/linux-cpanel.php
 *      * Correo Empresarial: /business-email/index.php o /titan-email/index.php
 *      * Certificados SSL: /digital-certificate/index.php
 * 4. Si una categoría todavía no tiene una URL personalizada confirmada en tu cuenta,
 *    el sistema utiliza automáticamente la URL principal de SuperSite 2 como destino de reserva.
 */

// URL principal de la tienda SuperSite 2 de Banelio (ResellerClub)
export const SUPERSITE_URL = 'https://banelio.supersite2.myorderbox.com';

// URL oficial del panel de clientes de ResellerClub (MyOrderBox)
export const CUSTOMER_PANEL_URL = 'https://banelio.myorderbox.com/customer';

// Endpoint oficial de búsqueda y comprobación de disponibilidad de dominios
// Documentación ResellerClub: https://cp.resellerclub.com/kb/servlet/KBServlet/faq1137.html
export const SUPERSITE_DOMAIN_SEARCH_ENDPOINT = `${SUPERSITE_URL}/domain-registration/index.php`;

// Endpoint oficial de transferencia de dominios
export const SUPERSITE_DOMAIN_TRANSFER_ENDPOINT = `${SUPERSITE_URL}/domain-registration/transfer/index.php`;

/**
 * URLs específicas por categoría en SuperSite 2.
 * Si alguna URL específica aún no está confirmada en la cuenta de ResellerClub,
 * se deja como null/vacía y el sistema hace fallback transparente a SUPERSITE_URL.
 */
export const SUPERSITE_CATEGORY_URLS = {
  // Tienda general y catálogo de dominios
  domains: `${SUPERSITE_URL}/domain-registration/index.php`,

  // Hosting web (cPanel / Servidores Cloud)
  // Reemplazar con la ruta exacta configurada en SuperSite una vez verificada (ej. `${SUPERSITE_URL}/web-hosting/index.php`)
  hosting: `${SUPERSITE_URL}`,

  // Correo empresarial (Titan Email / Banelio Mail / Google Workspace)
  // Reemplazar con la ruta exacta configurada en SuperSite (ej. `${SUPERSITE_URL}/business-email/index.php`)
  email: `${SUPERSITE_URL}`,

  // Certificados de seguridad SSL (Comodo, Sectigo, RapidSSL)
  // Reemplazar con la ruta exacta configurada en SuperSite (ej. `${SUPERSITE_URL}/digital-certificate/index.php`)
  ssl: `${SUPERSITE_URL}`,

  // Servidores dedicados o VPS (si se activan en la cuenta)
  servers: `${SUPERSITE_URL}`,

  // Google Workspace (si está activado de forma independiente en SuperSite)
  googleWorkspace: `${SUPERSITE_URL}`
};

/**
 * Retorna la URL de compra para una categoría dada con fallback seguro a la tienda SuperSite 2
 */
export function getCategoryStoreUrl(category: keyof typeof SUPERSITE_CATEGORY_URLS): string {
  return SUPERSITE_CATEGORY_URLS[category] || SUPERSITE_URL;
}

// Lista de extensiones populares admitidas comúnmente por SuperSite
export const POPULAR_TLDS = ['com', 'net', 'org', 'mx', 'ai', 'online', 'cloud'] as const;

// Lista exhaustiva de TLDs compuestos reconocidos para una separación precisa nombre/extensión
export const KNOWN_COMPOUND_TLDS = [
  'com.mx',
  'net.mx',
  'org.mx',
  'edu.mx',
  'gob.mx',
  'co.uk',
  'org.uk',
  'me.uk',
  'ltd.uk',
  'plc.uk',
  'com.co',
  'net.co',
  'nom.co',
  'com.ar',
  'net.ar',
  'com.br',
  'net.br',
  'co.nz',
  'net.nz',
  'org.nz',
  'co.za',
  'org.za',
  'com.au',
  'net.au',
  'org.au',
  'com.es',
  'nom.es',
  'org.es',
  'com.pe',
  'net.pe',
  'org.pe',
  'com.uy',
  'com.ve',
  'co.jp',
  'com.sg',
  'com.hk'
] as const;
