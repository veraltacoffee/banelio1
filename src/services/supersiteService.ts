/**
 * BANELIO - Servicio de Integración con ResellerClub SuperSite 2
 *
 * Se encarga del procesamiento, validación y envío de formularios POST
 * directamente hacia los endpoints oficiales de SuperSite 2, sin intermediarios
 * ni backend local.
 *
 * Documentación oficial ResellerClub:
 * - Búsqueda de dominios: https://cp.resellerclub.com/kb/servlet/KBServlet/faq1137.html
 * - Configuración de URLs de marca: https://www.resellerclub.com/help/article/How-to-Configure-SuperSite-and-PartnerSite-URLs
 */

import {
  SUPERSITE_URL,
  CUSTOMER_PANEL_URL,
  SUPERSITE_DOMAIN_SEARCH_ENDPOINT,
  SUPERSITE_DOMAIN_TRANSFER_ENDPOINT,
  SUPERSITE_CATEGORY_URLS,
  KNOWN_COMPOUND_TLDS
} from '../config/supersite';

export interface ParsedDomain {
  isValid: boolean;
  cleanInput: string;
  domainName: string;
  tld: string;
  fullDomain: string;
  errorMessage?: string;
}

/**
 * Sanitiza y separa nombre y extensión admitiendo TLDs compuestos (.com.mx, .co.uk, etc.)
 */
export function parseDomainInput(input: string, defaultTld: string = 'com'): ParsedDomain {
  if (!input || !input.trim()) {
    return {
      isValid: false,
      cleanInput: '',
      domainName: '',
      tld: '',
      fullDomain: '',
      errorMessage: 'Por favor, ingresa un nombre de dominio.'
    };
  }

  let clean = input.trim().toLowerCase();

  // Eliminar protocolos (http://, https://, etc.)
  clean = clean.replace(/^[a-z]+:\/\//i, '');

  // Eliminar prefijo www.
  clean = clean.replace(/^www\./i, '');

  // Eliminar rutas, parámetros de consulta o hashes
  clean = clean.split('/')[0].split('?')[0].split('#')[0];

  // Eliminar puertos (:80, :443)
  clean = clean.split(':')[0];

  // Eliminar caracteres no permitidos en nombres de dominio
  clean = clean.replace(/[^a-z0-9.-]/g, '');

  // Reducir puntos repetidos a uno solo
  clean = clean.replace(/\.{2,}/g, '.');

  // Eliminar puntos o guiones al inicio o al final
  clean = clean.replace(/^[-.]+|[-.]+$/g, '');

  if (!clean) {
    return {
      isValid: false,
      cleanInput: '',
      domainName: '',
      tld: '',
      fullDomain: '',
      errorMessage: 'El dominio contiene caracteres no válidos.'
    };
  }

  // 1. Comprobar extensiones compuestas conocidas (ordenadas de mayor longitud a menor)
  for (const compoundTld of KNOWN_COMPOUND_TLDS) {
    const suffix = `.${compoundTld}`;
    if (clean.endsWith(suffix) && clean.length > suffix.length) {
      const namePart = clean.slice(0, -suffix.length);
      if (isValidDomainLabel(namePart)) {
        return {
          isValid: true,
          cleanInput: clean,
          domainName: namePart,
          tld: compoundTld,
          fullDomain: `${namePart}.${compoundTld}`
        };
      }
    }
  }

  // 2. Si contiene un punto, separar por el último punto
  if (clean.includes('.')) {
    const lastDotIndex = clean.lastIndexOf('.');
    const namePart = clean.slice(0, lastDotIndex);
    const tldPart = clean.slice(lastDotIndex + 1);

    if (!isValidDomainLabel(namePart)) {
      return {
        isValid: false,
        cleanInput: clean,
        domainName: namePart,
        tld: tldPart,
        fullDomain: clean,
        errorMessage: 'El nombre del dominio antes de la extensión no tiene un formato válido.'
      };
    }

    if (!tldPart || tldPart.length < 2 || !/^[a-z0-9-]+$/.test(tldPart)) {
      return {
        isValid: false,
        cleanInput: clean,
        domainName: namePart,
        tld: tldPart,
        fullDomain: clean,
        errorMessage: 'La extensión del dominio (.tld) no tiene un formato válido.'
      };
    }

    return {
      isValid: true,
      cleanInput: clean,
      domainName: namePart,
      tld: tldPart,
      fullDomain: `${namePart}.${tldPart}`
    };
  }

  // 3. Si no tiene punto, es sólo el nombre y se aplica la extensión por defecto
  if (!isValidDomainLabel(clean)) {
    return {
      isValid: false,
      cleanInput: clean,
      domainName: clean,
      tld: defaultTld,
      fullDomain: `${clean}.${defaultTld}`,
      errorMessage: 'El nombre de dominio ingresado no es válido.'
    };
  }

  const cleanTld = defaultTld.replace(/^\./, '').toLowerCase();
  return {
    isValid: true,
    cleanInput: clean,
    domainName: clean,
    tld: cleanTld,
    fullDomain: `${clean}.${cleanTld}`
  };
}

/**
 * Valida un subsegmento o etiqueta de nombre de dominio según RFC
 */
function isValidDomainLabel(label: string): boolean {
  if (!label || label.length < 1 || label.length > 63) return false;
  // Solo letras, números y guiones; no puede iniciar ni terminar en guion
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label);
}

/**
 * Envía la búsqueda de dominio mediante POST directamente a SuperSite 2.
 * SuperSite 2 es la única autoridad sobre disponibilidad y precios reales.
 *
 * Campos oficiales documentados por ResellerClub:
 * - action = check_availability
 * - showrelated = true
 * - txtDomainName = nombre del dominio (sin extensión)
 * - tld[] = extensión seleccionada
 */
export function submitDomainSearchToSuperSite(domainName: string, tld: string, target: string = '_self'): void {
  const cleanTld = tld.replace(/^\./, '').trim().toLowerCase();
  const cleanName = domainName.trim().toLowerCase();

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = SUPERSITE_DOMAIN_SEARCH_ENDPOINT;
  form.target = target;
  form.style.display = 'none';

  // Campo obligatorio: action=check_availability
  const actionField = document.createElement('input');
  actionField.type = 'hidden';
  actionField.name = 'action';
  actionField.value = 'check_availability';
  form.appendChild(actionField);

  // Campo obligatorio: showrelated=true
  const showRelatedField = document.createElement('input');
  showRelatedField.type = 'hidden';
  showRelatedField.name = 'showrelated';
  showRelatedField.value = 'true';
  form.appendChild(showRelatedField);

  // Campo obligatorio: txtDomainName
  const domainField = document.createElement('input');
  domainField.type = 'hidden';
  domainField.name = 'txtDomainName';
  domainField.value = cleanName;
  form.appendChild(domainField);

  // Campo obligatorio: tld[]
  const tldField = document.createElement('input');
  tldField.type = 'hidden';
  tldField.name = 'tld[]';
  tldField.value = cleanTld;
  form.appendChild(tldField);

  document.body.appendChild(form);
  form.submit();
  setTimeout(() => {
    if (document.body.contains(form)) {
      document.body.removeChild(form);
    }
  }, 1000);
}

export interface DomainTransferPayload {
  domainName: string;
  tld: string;
  authCode?: string;
  target?: string;
}

/**
 * Envía el formulario de transferencia mediante POST directamente a SuperSite 2.
 *
 * Campos oficiales documentados por ResellerClub:
 * - action = domain_transfer_summary
 * - nextstep = true
 * - dom_action = transfer
 * - domainname = nombre del dominio
 * - tlds = extensión
 * - secretname = código Auth/EPP (si el cliente lo proveyó)
 *
 * REQUISITO DE SEGURIDAD ESTRICTO:
 * El código Auth/EPP no se almacena en ninguna parte del navegador (ni cookies, ni
 * localStorage, ni sessionStorage, ni parámetros de URL, ni registros).
 * Se envía exclusivamente mediante el cuerpo del formulario POST a SuperSite 2.
 */
export function submitDomainTransferToSuperSite({
  domainName,
  tld,
  authCode,
  target = '_self'
}: DomainTransferPayload): void {
  const cleanTld = tld.replace(/^\./, '').trim().toLowerCase();
  const cleanName = domainName.trim().toLowerCase();

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = SUPERSITE_DOMAIN_TRANSFER_ENDPOINT;
  form.target = target;
  form.style.display = 'none';

  // Campos oficiales de transferencia
  const actionField = document.createElement('input');
  actionField.type = 'hidden';
  actionField.name = 'action';
  actionField.value = 'domain_transfer_summary';
  form.appendChild(actionField);

  const nextStepField = document.createElement('input');
  nextStepField.type = 'hidden';
  nextStepField.name = 'nextstep';
  nextStepField.value = 'true';
  form.appendChild(nextStepField);

  const domActionField = document.createElement('input');
  domActionField.type = 'hidden';
  domActionField.name = 'dom_action';
  domActionField.value = 'transfer';
  form.appendChild(domActionField);

  const domainField = document.createElement('input');
  domainField.type = 'hidden';
  domainField.name = 'domainname';
  domainField.value = cleanName;
  form.appendChild(domainField);

  const tldsField = document.createElement('input');
  tldsField.type = 'hidden';
  tldsField.name = 'tlds';
  tldsField.value = cleanTld;
  form.appendChild(tldsField);

  if (authCode && authCode.trim()) {
    const secretField = document.createElement('input');
    secretField.type = 'hidden';
    secretField.name = 'secretname';
    secretField.value = authCode.trim();
    form.appendChild(secretField);
  }

  document.body.appendChild(form);
  form.submit();
  setTimeout(() => {
    if (document.body.contains(form)) {
      document.body.removeChild(form);
    }
  }, 1000);
}

/**
 * Abre el panel de clientes oficial de ResellerClub
 */
export function openCustomerPanel(target: string = '_blank'): void {
  window.open(CUSTOMER_PANEL_URL, target, 'noopener,noreferrer');
}

/**
 * Abre la tienda oficial SuperSite 2
 */
export function openSuperSiteStore(target: string = '_blank'): void {
  window.open(SUPERSITE_URL, target, 'noopener,noreferrer');
}

/**
 * Retorna la URL configurada para la tienda de Hosting (o fallback a SuperSite principal)
 */
export function getHostingStoreUrl(): string {
  return SUPERSITE_CATEGORY_URLS.hosting || SUPERSITE_URL;
}

/**
 * Abre la tienda de planes de Hosting en SuperSite 2
 */
export function openHostingStore(target: string = '_blank'): void {
  window.open(getHostingStoreUrl(), target, 'noopener,noreferrer');
}

/**
 * Retorna la URL configurada para la tienda de Correo Empresarial (o fallback a SuperSite principal)
 */
export function getEmailStoreUrl(): string {
  return SUPERSITE_CATEGORY_URLS.email || SUPERSITE_URL;
}

/**
 * Abre la tienda de planes de Correo Empresarial en SuperSite 2
 */
export function openEmailStore(target: string = '_blank'): void {
  window.open(getEmailStoreUrl(), target, 'noopener,noreferrer');
}

/**
 * Retorna la URL configurada para la tienda de Certificados SSL (o fallback a SuperSite principal)
 */
export function getSslStoreUrl(): string {
  return SUPERSITE_CATEGORY_URLS.ssl || SUPERSITE_URL;
}

/**
 * Abre la tienda de Certificados SSL en SuperSite 2
 */
export function openSslStore(target: string = '_blank'): void {
  window.open(getSslStoreUrl(), target, 'noopener,noreferrer');
}
