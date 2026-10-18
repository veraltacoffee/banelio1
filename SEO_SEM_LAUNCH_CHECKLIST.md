# Lista de Verificación y Puesta en Marcha: SEO, SEM y Analítica (Banelio)

Esta guía documenta las tareas técnicas y manuales requeridas por el propietario de la marca una vez que el sitio web esté publicado en producción bajo el dominio principal `https://banelio.com/`.

---

## 1. Verificación en Google Search Console

- [ ] **Acceder a Google Search Console:** Ingresar con la cuenta de Google corporativa a https://search.google.com/search-console.
- [ ] **Añadir la propiedad de dominio:** Seleccionar el tipo de propiedad **Prefijo de URL** (`https://banelio.com/`) o **Dominio** (`banelio.com`).
- [ ] **Método de verificación recomendado:**
  * **Opción A (Registro DNS en IONOS):** Copiar el registro TXT generado por Google y agregarlo en la zona DNS del dominio `banelio.com` en el panel de IONOS. (Recomendado por abarcar todos los subdominios).
  * **Opción B (Archivo HTML):** Descargar el archivo `google[token].html` proporcionado por Search Console y subirlo a la raíz de `dist/` en el hosting de IONOS.
  * **Opción C (Etiqueta HTML):** Copiar la metaetiqueta `<meta name="google-site-verification" content="..." />` e insertarla en el `<head>` de `index.html`.
- [ ] **Envío de Sitemap:**
  * En el menú lateral, hacer clic en **Sitemaps**.
  * En el campo "Añadir un sitemap nuevo", escribir: `sitemap.xml`.
  * Hacer clic en **Enviar** y confirmar que el estado indique `Correcto`.
- [ ] **Inspección de URLs canónicas principales:**
  * Usar la barra superior de inspección de URLs para solicitar la indexación prioritaria de:
    - `https://banelio.com/`
    - `https://banelio.com/dominios`
    - `https://banelio.com/hosting`
    - `https://banelio.com/email`
    - `https://banelio.com/ssl`
    - `https://banelio.com/diseno-web`
    - `https://banelio.com/seo`
    - `https://banelio.com/blog`
- [ ] **Comprobación de Cobertura y Core Web Vitals:** Verificar después de 48-72 horas que no se reporten errores 404, bloqueos accidentales ni problemas de datos estructurados.

---

## 2. Verificación en Bing Webmaster Tools

- [ ] **Acceder a Bing Webmaster Tools:** Ingresar a https://www.bing.com/webmasters.
- [ ] **Importación desde Search Console (Método Rápido):**
  * Seleccionar "Importar desde Google Search Console".
  * Esto sincroniza automáticamente la propiedad y el sitemap sin necesidad de ingresar nuevos registros DNS.
- [ ] **Verificación manual alternativa:**
  * Si se prefiere verificación independiente, agregar el registro CNAME o TXT provisto por Bing en la configuración DNS de IONOS.
- [ ] **Envío del Sitemap en Bing:**
  * Ir a **Sitemaps** > **Enviar Sitemap**: `https://banelio.com/sitemap.xml`.
- [ ] **Configuración de IndexNow (Opcional):**
  * Para notificación instantánea de cambios de contenido a Bing y Yandex.

---

## 3. Analítica Web y Medición de Conversiones (GA4 y Google Tag Manager)

El código del proyecto está preparado para recibir identificadores de medición limpios sin exponer claves secretas ni tokens privados.

### Configuración de Google Tag Manager (GTM)
- [ ] Crear un contenedor web en https://tagmanager.google.com/ para `banelio.com`.
- [ ] Obtener el identificador del contenedor (formato `GTM-XXXXXXX`).
- [ ] Insertar el fragmento oficial de GTM en el `<head>` y después de la apertura de `<body>` en `index.html`.

### Configuración de Google Analytics 4 (GA4)
- [ ] Crear una propiedad GA4 en https://analytics.google.com/.
- [ ] Crear un flujo de datos web para `https://banelio.com/`.
- [ ] Obtener el ID de medición (formato `G-XXXXXXXXXX`).
- [ ] Enlazar GA4 con el contenedor de GTM o mediante la etiqueta de Google.

### Eventos de Conversión Recomendados para Registrar:
1. `search_domain`: Disparado cuando el usuario ejecuta una búsqueda de dominio en el hero o en `/dominios`.
2. `transfer_domain_click`: Disparado cuando el usuario hace clic en "Transferir Dominio" o envía el formulario de transferencia.
3. `order_plan_click`: Clics salientes hacia la Tienda Banelio en botones de contratación de hosting, email o SSL.
4. `whatsapp_contact`: Clics dirigidos a la línea oficial de WhatsApp (`+52 660 125 4107`).
5. `legal_document_view`: Aperturas del modal de marco legal (Privacidad, Términos, ARCO).

---

## 4. Google Ads y Campañas de Búsqueda (SEM)

- [ ] **Vincular Google Ads con GA4:**
  * En Google Ads, ir a **Herramientas y configuración** > **Cuentas vinculadas** > **Google Analytics (GA4)** y enlazar la propiedad.
- [ ] **Importar conversiones clave:**
  * Importar los eventos `order_plan_click` y `whatsapp_contact` como acciones de conversión primarias.
- [ ] **Estructura recomendada de campañas de búsqueda (SEM México):**
  * **Campaña 1: Registro y Transferencia de Dominios**
    - Palabras clave: *"comprar dominio .com"*, *"registrar dominio .mx"*, *"transferir dominio web"*, *"precio dominio banelio"*.
    - URL de destino: `https://banelio.com/dominios`.
  * **Campaña 2: Hosting Web para Empresas**
    - Palabras clave: *"hosting cpanel mexico"*, *"hosting cloud para wordpress"*, *"alojamiento web rapido"*, *"hosting para empresas"*.
    - URL de destino: `https://banelio.com/hosting`.
  * **Campaña 3: Correo Corporativo con Dominio Propio**
    - Palabras clave: *"correo empresarial con dominio propio"*, *"titan email mexico"*, *"contratar google workspace empresa"*, *"buzon corporativo seguro"*.
    - URL de destino: `https://banelio.com/email`.
  * **Campaña 4: Certificados SSL**
    - Palabras clave: *"comprar certificado ssl"*, *"ssl wildcard para subdominios"*, *"certificado ssl sectigo mexico"*.
    - URL de destino: `https://banelio.com/ssl`.
  * **Campaña 5: Servicios Digitales (Diseño Web & SEO)**
    - Palabras clave: *"diseno de paginas web profesionales"*, *"agencia seo posicionamiento google"*, *"desarrollo web a medida"*.
    - URLs de destino: `https://banelio.com/diseno-web` y `https://banelio.com/seo`.
- [ ] **Extensiones de Anuncio Obligatorias:**
  * Enlaces de sitio (Sitelinks): Dominios, Hosting cPanel, Correo Pro, Certificados SSL, Blog.
  * Texto destacado (Callouts): Soporte en Español 24/7, Servidores Cloud, CPanel Incluido, Activación Rápida.
  * Fragmentos estructurados: Servicios (Dominios, Hosting, Correo, SSL, Diseño Web, SEO).
  * Extensión de llamada / WhatsApp: `+52 660 125 4107`.

---

## 5. Auditoría Periódica y Mantenimiento

- [ ] **Revisión mensual de Search Console:** Monitorizar impresiones orgánicas, CTR y posición media en consultas con intención transaccional.
- [ ] **Auditoría de Enlaces Rotos:** Ejecutar rastreos trimestrales con herramientas como Screaming Frog o el inspector de Search Console para asegurar cero errores 404 o cadenas de redirección.
- [ ] **Actualización de Artículos del Blog:** Mantener actualizados los artículos técnicos y reflejar cualquier cambio en `sitemap.xml` con su correspondiente fecha `lastmod`.
