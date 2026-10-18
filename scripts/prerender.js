import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const dist = path.resolve(root, 'dist');

async function prerender() {
  console.log('🚀 Iniciando prerenderizado estático de páginas para Banelio...');

  const templatePath = path.resolve(dist, 'index.html');
  if (!fs.existsSync(templatePath)) {
    throw new Error('No se encontró dist/index.html. Asegúrate de ejecutar vite build antes del prerender.');
  }
  const baseHtml = fs.readFileSync(templatePath, 'utf-8');

  // Crear servidor Vite en modo SSR para compilar módulos JSX/TSX
  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error'
  });

  try {
    const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');
    const { ROUTE_SEO_CONFIG } = await vite.ssrLoadModule('/src/data/routeSeo.ts');

    const routes = Object.keys(ROUTE_SEO_CONFIG);

    for (const route of routes) {
      const seo = ROUTE_SEO_CONFIG[route];
      const appHtml = render(route);

      let html = baseHtml;

      // Inyectar HTML prerenderizado dentro de <div id="root"></div>
      html = html.replace(
        '<div id="root"></div>',
        `<div id="root">${appHtml}</div>`
      );

      // Reemplazar <title>
      html = html.replace(/<title>.*?<\/title>/, `<title>${seo.title}</title>`);

      // Reemplazar <meta name="description">
      html = html.replace(
        /<meta name="description" content=".*?" \/>/,
        `<meta name="description" content="${seo.description}" />`
      );

      // Reemplazar <link rel="canonical">
      html = html.replace(
        /<link rel="canonical" href=".*?" \/>/,
        `<link rel="canonical" href="${seo.canonical}" />`
      );

      // Reemplazar Open Graph tags
      html = html.replace(
        /<meta property="og:url" content=".*?" \/>/,
        `<meta property="og:url" content="${seo.canonical}" />`
      );
      html = html.replace(
        /<meta property="og:title" content=".*?" \/>/,
        `<meta property="og:title" content="${seo.title}" />`
      );
      html = html.replace(
        /<meta property="og:description" content=".*?" \/>/,
        `<meta property="og:description" content="${seo.description}" />`
      );
      html = html.replace(
        /<meta property="og:type" content=".*?" \/>/,
        `<meta property="og:type" content="${seo.ogType}" />`
      );

      // Reemplazar Twitter tags
      html = html.replace(
        /<meta name="twitter:title" content=".*?" \/>/,
        `<meta name="twitter:title" content="${seo.title}" />`
      );
      html = html.replace(
        /<meta name="twitter:description" content=".*?" \/>/,
        `<meta name="twitter:description" content="${seo.description}" />`
      );

      // Inyectar JSON-LD estructurado
      const jsonLdScript = `<script type="application/ld+json">\n${JSON.stringify(seo.jsonLd, null, 2)}\n</script>`;
      html = html.replace(
        /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
        jsonLdScript
      );

      // Escribir archivo en dist/
      let destDir = dist;
      if (route !== '/') {
        const cleanPath = route.replace(/^\//, '');
        destDir = path.resolve(dist, cleanPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
      }

      const destFile = path.resolve(destDir, 'index.html');
      fs.writeFileSync(destFile, html, 'utf-8');
      console.log(`✅ [Prerender] ${route} -> ${path.relative(dist, destFile)}`);
    }

    console.log(`🎉 Prerenderizado completado exitosamente para ${routes.length} rutas canónicas.`);
  } finally {
    await vite.close();
  }
}

prerender().catch((err) => {
  console.error('❌ Error durante el prerenderizado:', err);
  process.exit(1);
});
