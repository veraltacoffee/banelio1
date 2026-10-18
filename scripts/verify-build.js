import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const dist = path.resolve(root, 'dist');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ ${message}`);
  } else {
    failedChecks++;
    console.error(`  ❌ ERROR: ${message}`);
  }
}

console.log('🔍 Iniciando suite de comprobación técnica automatizada de Banelio...');

// 1. Archivos críticos en dist/
console.log('\n[1/6] Comprobando archivos clave de distribución...');
assert(fs.existsSync(path.resolve(dist, 'index.html')), 'dist/index.html existe');
assert(fs.existsSync(path.resolve(dist, '.htaccess')), 'dist/.htaccess copiado a la distribución');
assert(fs.existsSync(path.resolve(dist, 'robots.txt')), 'dist/robots.txt existe');
assert(fs.existsSync(path.resolve(dist, 'sitemap.xml')), 'dist/sitemap.xml existe');
assert(fs.existsSync(path.resolve(dist, 'llms.txt')), 'dist/llms.txt existe');
assert(fs.existsSync(path.resolve(dist, 'hero_pure_white.png')), 'dist/hero_pure_white.png existe');

// 2. Comprobando robots.txt
console.log('\n[2/6] Validando contenido de robots.txt...');
const robots = fs.readFileSync(path.resolve(dist, 'robots.txt'), 'utf-8');
assert(robots.includes('User-agent: *'), 'robots.txt permite todos los agentes de usuario');
assert(robots.includes('Allow: /'), 'robots.txt permite rastreo público');
assert(!robots.includes('Disallow: /'), 'robots.txt no bloquea accidentalmente la raíz');
assert(robots.includes('Sitemap: https://banelio.com/sitemap.xml'), 'robots.txt referencia sitemap.xml');

// 3. Comprobando sitemap.xml
console.log('\n[3/6] Validando URLs en sitemap.xml...');
const sitemap = fs.readFileSync(path.resolve(dist, 'sitemap.xml'), 'utf-8');
const expectedSitemapUrls = [
  'https://banelio.com/',
  'https://banelio.com/dominios',
  'https://banelio.com/hosting',
  'https://banelio.com/email',
  'https://banelio.com/ssl',
  'https://banelio.com/diseno-web',
  'https://banelio.com/seo',
  'https://banelio.com/afiliados',
  'https://banelio.com/resellers',
  'https://banelio.com/blog',
  'https://banelio.com/blog/nvme-vs-ssd',
  'https://banelio.com/blog/spf-dkim-dmarc',
  'https://banelio.com/blog/choosing-domain-extension',
  'https://banelio.com/blog/ssl-commercial-vs-free'
];

for (const url of expectedSitemapUrls) {
  assert(sitemap.includes(`<loc>${url}</loc>`), `sitemap.xml incluye ${url}`);
}
assert(!sitemap.includes('localhost'), 'sitemap.xml no contiene referencias locales');
assert(!sitemap.includes('undefined'), 'sitemap.xml no contiene rutas indefinidas');

// 4. Comprobando rutas prerenderizadas
console.log('\n[4/6] Verificando generación estática de páginas HTML...');
const canonicalRoutes = [
  { path: '/', file: 'index.html', titlePart: 'Banelio | Dominios' },
  { path: '/dominios', file: 'dominios/index.html', titlePart: 'Dominios Web' },
  { path: '/hosting', file: 'hosting/index.html', titlePart: 'Hosting Web' },
  { path: '/email', file: 'email/index.html', titlePart: 'Correo Empresarial' },
  { path: '/ssl', file: 'ssl/index.html', titlePart: 'Certificados SSL' },
  { path: '/diseno-web', file: 'diseno-web/index.html', titlePart: 'Diseño y Desarrollo' },
  { path: '/seo', file: 'seo/index.html', titlePart: 'Posicionamiento Web' },
  { path: '/afiliados', file: 'afiliados/index.html', titlePart: 'Programa de Afiliados' },
  { path: '/resellers', file: 'resellers/index.html', titlePart: 'Hosting para Revendedores' },
  { path: '/blog', file: 'blog/index.html', titlePart: 'Blog Oficial' },
  { path: '/blog/nvme-vs-ssd', file: 'blog/nvme-vs-ssd/index.html', titlePart: 'NVMe frente a SATA SSD' },
  { path: '/blog/spf-dkim-dmarc', file: 'blog/spf-dkim-dmarc/index.html', titlePart: 'SPF, DKIM y DMARC' },
  { path: '/blog/choosing-domain-extension', file: 'blog/choosing-domain-extension/index.html', titlePart: 'Extensión de Dominio' },
  { path: '/blog/ssl-commercial-vs-free', file: 'blog/ssl-commercial-vs-free/index.html', titlePart: 'Certificados SSL en 2026' }
];

for (const cr of canonicalRoutes) {
  const filePath = path.resolve(dist, cr.file);
  assert(fs.existsSync(filePath), `Existe HTML prerenderizado para ${cr.path} (${cr.file})`);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert(content.includes('<title>'), `${cr.path} contiene etiqueta <title>`);
    assert(content.includes(cr.titlePart), `${cr.path} contiene título esperado ("${cr.titlePart}")`);
    assert(content.includes('<meta name="description"'), `${cr.path} contiene meta description`);
    assert(content.includes('<link rel="canonical"'), `${cr.path} contiene canonical link`);
    assert(content.includes('<script type="application/ld+json">'), `${cr.path} contiene datos estructurados JSON-LD`);
    assert(content.includes('id="root"'), `${cr.path} contiene contenedor de montaje #root`);
    // Comprobar que no es un div root vacío
    const rootEmpty = content.includes('<div id="root"></div>');
    assert(!rootEmpty, `${cr.path} tiene contenido prerenderizado en el DOM (no está vacío)`);
  }
}

// 5. Verificando seguridad de búsqueda y transferencia de dominios
console.log('\n[5/6] Validando seguridad e integración de búsqueda y transferencia...');
const supersiteConfig = fs.readFileSync(path.resolve(root, 'src/config/supersite.ts'), 'utf-8');
assert(
  supersiteConfig.includes("SUPERSITE_URL = 'https://banelio.supersite2.myorderbox.com'") &&
  supersiteConfig.includes('SUPERSITE_DOMAIN_TRANSFER_ENDPOINT = `${SUPERSITE_URL}/domain-registration/transfer/index.php`'),
  'SUPERSITE_DOMAIN_TRANSFER_ENDPOINT configurado en la URL oficial'
);
assert(
  supersiteConfig.includes("SUPERSITE_URL = 'https://banelio.supersite2.myorderbox.com'") &&
  supersiteConfig.includes('SUPERSITE_DOMAIN_SEARCH_ENDPOINT = `${SUPERSITE_URL}/domain-registration/index.php`'),
  'SUPERSITE_DOMAIN_SEARCH_ENDPOINT configurado en la URL oficial'
);

const supersiteService = fs.readFileSync(path.resolve(root, 'src/services/supersiteService.ts'), 'utf-8');
assert(supersiteService.includes("name = 'action'"), 'Servicio incluye campo POST action');
assert(supersiteService.includes("value = 'check_availability'"), 'Búsqueda usa action=check_availability');
assert(supersiteService.includes("value = 'domain_transfer_summary'"), 'Transferencia usa action=domain_transfer_summary');
assert(supersiteService.includes("value = 'transfer'"), 'Transferencia usa dom_action=transfer');
assert(supersiteService.includes("value = 'true'"), 'Transferencia usa nextstep=true');
assert(supersiteService.includes("name = 'secretname'"), 'Transferencia incluye campo secretname para Auth/EPP');

// Verificar que Auth/EPP no se guarda en storage ni se manda por GET
const modalContent = fs.readFileSync(path.resolve(root, 'src/components/public/DomainTransferModal.tsx'), 'utf-8');
assert(!modalContent.includes('localStorage.setItem'), 'Auth/EPP no se almacena en localStorage');
assert(!modalContent.includes('sessionStorage.setItem'), 'Auth/EPP no se almacena en sessionStorage');
assert(!modalContent.includes('document.cookie ='), 'Auth/EPP no se almacena en cookies');

// 6. Validar llms.txt y privacidad
console.log('\n[6/6] Validando llms.txt y ausencia de credenciales privadas...');
const llms = fs.readFileSync(path.resolve(dist, 'llms.txt'), 'utf-8');
assert(llms.includes('Banelio'), 'llms.txt identifica la marca Banelio');
assert(llms.includes('try@banelio.com'), 'llms.txt contiene contacto oficial');
assert(!llms.includes('secret') && !llms.includes('password') && !llms.includes('apiKey'), 'llms.txt no contiene secretos ni claves');

console.log('\n' + '='.repeat(60));
console.log(`📊 RESULTADO DE COMPROBACIÓN: ${passedChecks}/${totalChecks} verificaciones exitosas`);
if (failedChecks === 0) {
  console.log('🎉 TODAS LAS VERIFICACIONES TÉCNICAS PASARON SATISFACTORIAMENTE.');
} else {
  console.error(`⚠️ Se detectaron ${failedChecks} fallas en la verificación.`);
  process.exit(1);
}
console.log('='.repeat(60));
