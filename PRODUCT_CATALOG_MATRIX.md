# Matriz de Contrastación de Catálogo: Banelio vs. ResellerClub

Este documento detalla la auditoría obligatoria y la contrastación comercial efectuada entre el catálogo público de **Banelio** y los productos, planes y especificaciones oficiales comercializados a través de **ResellerClub** (SuperSite 2).

Fuentes oficiales contrastadas:
- Catálogo y Precios: https://www.resellerclub.com/pricing
- Hosting Web & Servidores: https://www.resellerclub.com/hosting
- Correo Empresarial: https://www.resellerclub.com/email
- Titan Email: https://www.resellerclub.com/business-email-hosting
- Certificados Digitales SSL: https://www.resellerclub.com/digital-certificates-and-security
- Programa de Partners y Resellers: https://www.resellerclub.com/partners
- SuperSite 2 KB & Formulario de Dominios: https://cp.resellerclub.com/kb/servlet/KBServlet/faq1137.html

---

## 1. Dominios (Registro, Renovación y Transferencia)

| Campo | Detalle Verificado |
|---|---|
| **Página de Banelio** | `/dominios` y buscador principal en `/` |
| **Nombre Comercial** | Registro y Transferencia de Dominios Banelio |
| **Producto ResellerClub Relacionado** | Domain Name Registration, Renewal & Transfer (gTLDs & ccTLDs) |
| **Características Verificadas** | Acceso a más de 400 extensiones de dominio (.com, .net, .org, .mx, .com.mx, .io, .ai, .cloud, etc.); consulta de disponibilidad en tiempo real mediante POST a SuperSite 2; gestión de registros DNS completos (A, AAAA, CNAME, MX, TXT, SPF, DKIM); bloqueo contra transferencias no autorizadas (Transfer Lock) con código EPP/Auth-Code; opciones de privacidad WHOIS en TLDs elegibles. |
| **Fuente Oficial** | https://www.resellerclub.com/pricing y https://cp.resellerclub.com/kb/servlet/KBServlet/faq1137.html |
| **Disponibilidad Demostrable** | Activa en SuperSite 2 en `/domain-registration/index.php` y `/domain-registration/transfer/index.php`. |
| **Textos Corregidos o Retirados** | Se eliminó la promesa de "Privacidad WHOIS gratis universal e incondicional", aclarando que depende de la extensión de dominio y las políticas del Registry/ICANN aplicables. Se corrigieron los enlaces de transferencia para activar el formulario oficial de transferencia por POST sin exponer el código Auth/EPP en URL ni almacenamiento local. |

---

## 2. Hosting Web Compartido (Linux con cPanel)

| Campo | Detalle Verificado |
|---|---|
| **Página de Banelio** | `/hosting` |
| **Nombre Comercial** | Cloud Starter, Cloud Pro Empresarial, Cloud Elite Turbo |
| **Producto ResellerClub Relacionado** | Linux Shared Hosting (cPanel), Single Domain & Multi Domain Hosting |
| **Características Verificadas** | **Starter:** 1 dominio alojado, 10 GB almacenamiento cloud SSD, 5 buzones de correo corporativo, panel cPanel en español, certificado SSL gratuito (Let's Encrypt / AutoSSL), transferencia mensual sin límite medido, instalador de aplicaciones (Softaculous).<br>**Pro:** Múltiples/Ilimitados sitios web, 50 GB almacenamiento cloud SSD, buzones de correo, certificados SSL gratis automáticos para todos los dominios, aislamiento de cuenta con CloudLinux OS (CageFS), copias de seguridad con restauración en cPanel.<br>**Elite:** Sitios web ilimitados, 150 GB almacenamiento cloud SSD, límites de RAM y CPU ampliados, caché optimizada a nivel servidor, soporte prioritario. |
| **Fuente Oficial** | https://www.resellerclub.com/hosting y https://www.resellerclub.com/web-hosting/linux-cpanel |
| **Disponibilidad Demostrable** | Activa en SuperSite 2 bajo la categoría de Web Hosting Linux cPanel. |
| **Textos Corregidos o Retirados** | Se retiraron afirmaciones no respaldadas en hosting compartido estándar: "almacenamiento NVMe PCIe 4.0 con 7,000 MB/s garantizados por usuario", "IP dedicada incluida gratis en plan compartido", "Acronis Cloud Real-Time Backups incluido sin costo" y "SLA de 99.9% con compensación financiera garantizada". Se sustituyeron por descripciones fácticas de almacenamiento Cloud SSD de alta velocidad, copias de seguridad automatizadas cPanel y alta disponibilidad cloud. |

---

## 3. Hosting para Revendedores (Reseller Hosting con WHM)

| Campo | Detalle Verificado |
|---|---|
| **Página de Banelio** | `/resellers` y `/hosting` (Plan Reseller WHM) |
| **Nombre Comercial** | Hosting Reseller WHM Banelio |
| **Producto ResellerClub Relacionado** | Linux Reseller Hosting (cPanel / WebHost Manager) |
| **Características Verificadas** | Asignación de hasta 50 cuentas independientes de cPanel; 250 GB de espacio en disco asignable; acceso completo a consola WebHost Manager (WHM); marca blanca con nombres de servidor privados (Custom Private Nameservers `ns1.tuempresa.com`); certificados SSL automáticos gratuitos para cada cuenta de cliente final; control individual de cuotas de disco y ancho de banda; protección contra sobreventa (overselling). |
| **Fuente Oficial** | https://www.resellerclub.com/reseller-hosting |
| **Disponibilidad Demostrable** | Activa en SuperSite 2 en la categoría de Reseller Hosting. |
| **Textos Corregidos o Retirados** | Se retiraron promesas de "aprovisionamiento automatizado instantáneo de pasarelas de pago de terceros sin configuración previa" y se especificó que WHM proporciona la plataforma de gestión de cuentas y cuotas, mientras que el módulo de facturación es gestionable por el reseller. |

---

## 4. Correo Empresarial Corporativo (Business Email & Titan)

| Campo | Detalle Verificado |
|---|---|
| **Página de Banelio** | `/email` |
| **Nombre Comercial** | Titan Business Email |
| **Producto ResellerClub Relacionado** | Business Email Hosting powered by Titan |
| **Características Verificadas** | Buzones con dominio corporativo (@tuempresa.com); capacidades de 10 GB o 50 GB por cuenta; interfaz Webmail limpia y moderna; aplicaciones móviles nativas para iOS y Android; calendarios compartidos, libreta de contactos y listas de tareas; generador de firmas corporativas uniformes; compatibilidad con protocolos IMAP/POP3/SMTP; preconfiguración de registros de autenticación SPF, DKIM y DMARC. |
| **Fuente Oficial** | https://www.resellerclub.com/email y https://www.resellerclub.com/business-email-hosting |
| **Disponibilidad Demostrable** | Activa en SuperSite 2 bajo Business Email / Titan Email. |
| **Textos Corregidos o Retirados** | Se conservó el nombre comercial legítimo de la marca proveedora "Titan" (cumpliendo con la directriz de respetar marcas de terceros cuando conservan su identidad en la experiencia de uso) y se eliminaron afirmaciones de que la marca Titan puede borrarse por completo del webmail si la plataforma mantiene su marca oficial. |

---

## 5. Suites de Productividad en la Nube (Google Workspace y Microsoft 365)

| Campo | Detalle Verificado |
|---|---|
| **Página de Banelio** | `/email` |
| **Nombre Comercial** | Google Workspace / Microsoft 365 Business |
| **Producto ResellerClub Relacionado** | Google Workspace (Business Starter / Standard / Plus) y Microsoft 365 Business |
| **Características Verificadas** | **Google Workspace:** buzón profesional con experiencia Gmail sobre dominio corporativo; desde 30 GB hasta 2 TB en Google Drive por usuario; videoconferencias Google Meet; edición colaborativa en Docs, Sheets, Slides y Forms; consola central de administración de Google.<br>**Microsoft 365:** buzón empresarial Exchange de 50 GB por cuenta; 1 TB en OneDrive con control de versiones; aplicaciones web de Word, Excel, PowerPoint y Outlook; canales de colaboración en Microsoft Teams. |
| **Fuente Oficial** | https://www.resellerclub.com/google-workspace y https://www.resellerclub.com/office-365 |
| **Disponibilidad Demostrable** | Activa según la configuración del partner en SuperSite 2. |
| **Textos Corregidos o Retirados** | Se mantuvieron sus nombres comerciales oficiales íntegros. Se eliminaron afirmaciones de soporte SLA con indemnizaciones automáticas emitidas por Banelio, aclarando que corresponden a los términos de servicio oficiales de Google LLC y Microsoft Corp. respectivamente. |

---

## 6. Certificados de Seguridad SSL

| Campo | Detalle Verificado |
|---|---|
| **Página de Banelio** | `/ssl` |
| **Nombre Comercial** | PositiveSSL Estándar (DV), PositiveSSL Wildcard (*.dominio), Sectigo EV SSL |
| **Producto ResellerClub Relacionado** | Digital Certificates (Sectigo / Comodo CA) |
| **Características Verificadas** | **PositiveSSL DV:** validación rápida de dominio en minutos (correo/DNS), protección para dominio raíz (con y sin www), cifrado de 256 bits, sello estático, garantía legal de $10,000 USD.<br>**PositiveSSL Wildcard:** protección de dominio principal y subdominios ilimitados (*.dominio.com), una sola llave privada, reemisiones ilimitadas, garantía legal de $250,000 USD.<br>**Sectigo EV SSL:** validación jurídica exhaustiva de la razón social de la empresa, muestra la entidad verificada en detalles del certificado, sello dinámico interactivo, garantía de $1,750,000 USD. |
| **Fuente Oficial** | https://www.resellerclub.com/digital-certificates-and-security |
| **Disponibilidad Demostrable** | Activa en SuperSite 2 en la categoría de Digital Certificates / SSL. |
| **Textos Corregidos o Retirados** | Se alinearon los emisores a las autoridades oficiales (Sectigo / Comodo CA) y las garantías a los montos contractuales reales de la póliza de la CA ($10K, $250K y $1.75M USD). Se retiró la afirmación de que el candado EV pone la barra del navegador totalmente en verde (característica descontinuada por navegadores modernos como Chrome/Firefox, que ahora muestran la entidad en el menú de información de certificado). |

---

## 7. Servicios Profesionales Propios de Banelio (No Provistos por ResellerClub)

| Campo | Detalle Verificado |
|---|---|
| **Páginas de Banelio** | `/diseno-web`, `/seo`, `/afiliados` |
| **Nombre Comercial** | Diseño & Desarrollo Web Banelio, Posicionamiento SEO Banelio, Programa de Afiliados Banelio |
| **Relación con ResellerClub** | **Ninguna.** Son servicios profesionales y programas de negocio ejecutados directamente por el equipo interno de Banelio. |
| **Características Verificadas** | **Diseño Web:** portales corporativos, landing pages de conversión y tiendas online desarrolladas con código limpio y semántico.<br>**SEO:** auditorías técnicas, optimización on-page, estrategia de palabras clave y SEO local.<br>**Afiliados:** comisión comercial del 10% por referidos mediante enlace o código personalizado, con liquidación por transferencia bancaria (SPEI en México) o PayPal. |
| **Fuente Oficial** | Contratos de prestación de servicios profesionales y términos de afiliación propios de Banelio. |
| **Disponibilidad Demostrable** | Directamente a través del equipo de Banelio vía correo (`try@banelio.com`) y WhatsApp (+52 660 125 4107). |
| **Textos Corregidos o Retirados** | Se eliminó cualquier ambigüedad que pudiera sugerir que el diseño web o el posicionamiento SEO eran productos revendidos de una plataforma externa. Se presentan con total transparencia como servicios a medida prestados por Banelio. En afiliados, se retiraron menciones a pagos automáticos en 24 horas y se estableció el modelo comercial de liquidación directa transparente. |
