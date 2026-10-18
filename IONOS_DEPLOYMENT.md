# Guía Oficial de Publicación en Hosting Compartido IONOS (Banelio)

Esta guía detalla el procedimiento paso a paso para publicar la versión compilada y estática de **Banelio** en la raíz del dominio principal `https://banelio.com/` alojado en el hosting compartido de **IONOS**.

---

## 1. Requisitos Previos y Preparación de Archivos

1. **Compilar la distribución estática:**
   Desde el directorio del proyecto, ejecutar:
   ```bash
   npm run build
   ```
   Esto compila la aplicación y genera automáticamente el prerenderizado estático de todas las páginas canónicas y artículos del blog dentro de la carpeta `dist/`.

2. **Verificar que la carpeta `dist/` contenga:**
   - `index.html` (portada prerenderizada)
   - `.htaccess` (reglas de Apache, redirecciones 301, compresión y caché)
   - `robots.txt` (directivas de rastreo para buscadores)
   - `sitemap.xml` (mapa de sitio con 14 URLs canónicas)
   - `llms.txt` (resumen factual para motores de IA)
   - `hero_pure_white.png` (recurso principal del intro con fondo blanco puro)
   - Subdirectorios prerenderizados:
     * `dominios/index.html`
     * `hosting/index.html`
     * `email/index.html`
     * `ssl/index.html`
     * `diseno-web/index.html`
     * `seo/index.html`
     * `afiliados/index.html`
     * `resellers/index.html`
     * `blog/index.html`
     * `blog/nvme-vs-ssd/index.html`
     * `blog/spf-dkim-dmarc/index.html`
     * `blog/choosing-domain-extension/index.html`
     * `blog/ssl-commercial-vs-free/index.html`
   - Carpeta `assets/` con archivos CSS y JS minificados con hashes de versión.

---

## 2. Paso 1: Copia de Seguridad Preventiva en IONOS

**CRÍTICO:** Antes de sobrescribir cualquier archivo en el servidor, realiza y descarga una copia de respaldo del contenido actual:

1. Inicia sesión en el panel de control de IONOS (https://my.ionos.com/).
2. Ve a **Hosting** > **Espacio Web** (Webspace) o conéctate mediante **SFTP / FTPS** (usando FileZilla, Cyberduck o WinSCP con las credenciales de tu cuenta de IONOS).
3. Localiza el directorio raíz asignado al dominio `banelio.com` (típicamente `/` o un directorio como `/banelio` o `/htdocs`).
4. Selecciona todos los archivos y carpetas existentes y descárgalos a una carpeta local segura titulada `BACKUP_BANELIO_PRE_DEPLOY_[FECHA]`.
5. Si utilizas el Administrador de Archivos de IONOS, comprime el directorio en un archivo `.zip` y descárgalo a tu equipo.

---

## 3. Paso 2: Subida del Contenido de `dist/` a la Raíz del Dominio

1. **IMPORTANTE:** Debes subir **el contenido interno de la carpeta `dist/`**, **NO** la carpeta `dist` en sí ni la carpeta con el código fuente del proyecto (`src/`, `node_modules/`, `package.json`, etc.).
2. Vía SFTP / Administrador de Archivos de IONOS:
   - Abre la carpeta de destino en el servidor (la raíz web del dominio `banelio.com`).
   - Sube todos los archivos y subcarpetas que se encuentran dentro de `dist/`:
     * Arrastra `index.html`, `.htaccess`, `robots.txt`, `sitemap.xml`, `llms.txt`, `hero_pure_white.png`.
     * Arrastra las carpetas `dominios/`, `hosting/`, `email/`, `ssl/`, `diseno-web/`, `seo/`, `afiliados/`, `resellers/`, `blog/` y `assets/`.
   - **Nota sobre archivos ocultos:** Asegúrate de que tu cliente FTP muestre archivos que inician con punto para no omitir el archivo `.htaccess`.
3. Confirma que la transferencia finalice con 0 archivos fallidos.

---

## 4. Paso 3: Confirmación de Certificado SSL y HTTPS

1. En el panel de IONOS, dirígete a **Dominios & SSL**.
2. Verifica que el dominio `banelio.com` tenga un certificado SSL activo (Let's Encrypt o SSL Wildcard de IONOS) con estado **Seguro (HTTPS activo)**.
3. Si la opción "Forzar HTTPS" está disponible en el panel de IONOS, actívala para asegurar que todas las peticiones HTTP se redirijan a HTTPS sin depender exclusivamente de `.htaccess`.

---

## 5. Paso 4: Pruebas de Comprobación y Verificación en Vivo

Abre una ventana de navegación privada o en modo incógnito y realiza las siguientes comprobaciones:

### A. Acceso a la Portada
- Abrir `https://banelio.com/`
- Comprobar que cargue de inmediato con la paleta autorizada, la tipografía correcta y la imagen `hero_pure_white.png` perfectamente integrada sobre fondo blanco sin halos.
- Verificar que no existan errores en la consola del navegador (tecla `F12` > pestaña *Console*).

### B. Apertura Directa y Recarga de Rutas Públicas Prerenderizadas
Abre cada URL directamente en la barra de direcciones del navegador y presiona `Ctrl+F5` (o `Cmd+Shift+R`) para recargar sin caché:
- `https://banelio.com/dominios`
- `https://banelio.com/hosting`
- `https://banelio.com/email`
- `https://banelio.com/ssl`
- `https://banelio.com/diseno-web`
- `https://banelio.com/seo`
- `https://banelio.com/afiliados`
- `https://banelio.com/resellers`
- `https://banelio.com/blog`
*Resultado esperado:* Cada página debe mostrar de inmediato su propio contenido visible, título y encabezados sin mostrar pantalla en blanco ni error 404 de Apache.

### C. Artículos Individuales del Blog
Abre directamente las siguientes URLs de artículos:
- `https://banelio.com/blog/nvme-vs-ssd`
- `https://banelio.com/blog/spf-dkim-dmarc`
- `https://banelio.com/blog/choosing-domain-extension`
- `https://banelio.com/blog/ssl-commercial-vs-free`
*Resultado esperado:* Cada artículo debe abrirse directamente en su vista de lectura completa con migas de pan funcionales y botón para volver al blog.

### D. Verificación de Archivos Estáticos de Rastreo
Comprobar en el navegador que los siguientes archivos respondan con código HTTP 200:
- `https://banelio.com/.htaccess` (debe retornar 403 Forbidden por seguridad de Apache, confirmando que mod_rewrite y la protección de archivos de configuración funcionan).
- `https://banelio.com/robots.txt` (debe mostrar el contenido que permite el rastreo e incluye el enlace al sitemap).
- `https://banelio.com/sitemap.xml` (debe mostrar el XML válido con 14 URLs).
- `https://banelio.com/llms.txt` (debe mostrar el resumen textual de Banelio).

### E. Pruebas de Búsqueda y Transferencia de Dominios
1. **Búsqueda de dominio:**
   - En la portada o en `/dominios`, escribe un nombre de prueba (ej. `miempresaprueba`) con extensión `.com`.
   - Haz clic en **Buscar**.
   - Debe abrirse la pestaña de la Tienda Banelio en SuperSite 2 en `/domain-registration/index.php` mostrando la disponibilidad real calculada por la plataforma oficial.
2. **Transferencia de dominio:**
   - En la portada o en `/dominios`, haz clic en la pestaña **Transferir Dominio Existente** o en el botón del footer "Transferir Dominio".
   - Introduce un dominio de prueba (ej. `midominioactual.com`) y un código Auth/EPP de prueba opcional.
   - Haz clic en **Continuar Transferencia**.
   - Debe abrirse el flujo oficial de transferencia de SuperSite 2 en `/domain-registration/transfer/index.php` con los parámetros enviados por POST.
   - Confirma que el código Auth/EPP **NO** aparece en la barra de direcciones de la URL.

---

## 6. Procedimiento de Restauración (Rollback) en Caso de Fallo

Si ocurriera cualquier error imprevisto durante la publicación:
1. Conéctate inmediatamente vía SFTP al hosting de IONOS.
2. Elimina los archivos subidos recientemente.
3. Sube el contenido íntegro de la carpeta de respaldo guardada en el Paso 1 (`BACKUP_BANELIO_PRE_DEPLOY_[FECHA]`).
4. Verifica que `https://banelio.com/` vuelva al estado anterior funcional.
