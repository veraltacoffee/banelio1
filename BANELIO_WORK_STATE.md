# BANELIO WORK STATE

## FECHA DE ACTUALIZACIÓN
2026-10-17

## REPOSITORIO Y ESTADO
- Repositorio: `veraltacoffee/banelio1`
- Entorno: AI Studio Build (sin binario `git` en el entorno; cambios aplicados y verificados directamente sobre el espacio de trabajo activo).
- Arquitectura: Frontend estático React 19 + TypeScript + Vite + Tailwind CSS v4, 100% compatible con hosting compartido IONOS.

## REDISEÑO VISUAL INTEGRAL Y PALETA OFICIAL
Centralizada en variables CSS dentro de `src/index.css`:
- **Negro principal:** `#070707`
- **Blanco cálido:** `#FCFCF8`
- **Fondo claro:** `#F7F8F0`
- **Fondo alternativo:** `#F1F3E8`
- **Lima claro:** `#DFF5B5`
- **Lima principal:** `#CBEF8A`
- **Lima de énfasis:** `#B9E86A`
- **Verde oscuro:** `#49652A`
- **Gris de texto:** `#555A52`
- **Gris secundario:** `#858A82`
- **Bordes y separadores:** `#E2E5DA`

*Se eliminó por completo el código de color lima antiguo (`#B8F23A`) y el gris antiguo (`#8A8F98`) en todos los archivos de la aplicación.*

## IMAGEN DEL INTRO (Hero)
- **Fondo 100% blanco puro (`#FFFFFF`):** Recurso `public/hero_pure_white.png` integrado directamente con fondo blanco puro sin sombras ni halos.
- **Cero sombras:** Eliminadas sombras proyectadas, halos y drop-shadows.
- **Integración fluida:** Fondo blanco puro integrado sin costuras con el contenedor `bg-white` de la sección en `HeroDomainSearch.tsx` en móvil, tablet y escritorio.

## MARCA BLANCA Y TEXTOS PÚBLICOS
- Ninguna mención pública o visible a plataformas externas de reventa en la interfaz de usuario.
- Enlaces y botones de autoservicio etiquetados como "Tienda Banelio", "Panel de Clientes", "Ver planes", etc.
- Conservación técnica íntegra de `supersiteService.ts` y `supersite.ts` para la funcionalidad de compra, búsqueda y transferencia.
- Programa de afiliados ajustado: modelo estándar del 10% mediante enlace/código de referido, sin promesas de comisiones recurrentes.

## FOOTER COMPLETO DE 5 COLUMNAS
1. **Banelio:** Logotipo oficial, descripción veraz, contacto directo (`try@banelio.com`, `+52 660 125 4107`), enlace a WhatsApp 24/7 y 6 redes sociales oficiales verificadas.
2. **Dominios y hosting:** Registro de dominios, transferencia, hosting Cloud NVMe, hosting revendedores WHM, privacidad Whois y LiteSpeed.
3. **Servicios digitales:** Correo corporativo, certificados SSL, diseño web, posicionamiento SEO y blog.
4. **Clientes y partners:** Tienda Banelio, Panel de control de clientes, Programa de afiliados y soluciones para revendedores.
5. **Información legal:** Aviso de privacidad, Política de cookies, Términos de Servicio, Derechos ARCO (INAI), Políticas y Contrato de dominios y Política de uso aceptable (AUP).

## ESTADO DE COMPILACIÓN Y VERIFICACIÓN
- `npm run lint` (`tsc --noEmit`): 0 errores.
- `compile_applet` (`vite build`): Exitoso.
- Sin dependencias de servidor ni scripts residuales.
