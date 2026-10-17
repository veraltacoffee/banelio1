import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  Search,
  Clock,
  ArrowRight,
  X,
  Share2,
  Check
} from 'lucide-react';

interface Article {
  id: string;
  category: 'Dominios' | 'Hosting' | 'Email' | 'Seguridad' | 'SEO';
  categoryEn: 'Domains' | 'Hosting' | 'Email' | 'Security' | 'SEO';
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  readTime: string;
  date: string;
  content: string[];
  contentEn: string[];
}

export default function BlogLanding() {
  const { language } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const articles: Article[] = [
    {
      id: 'nvme-vs-ssd',
      category: 'Hosting',
      categoryEn: 'Hosting',
      title: 'Almacenamiento Cloud NVMe PCIe 4.0 vs SATA SSD: Por qué el disco define tu SEO y conversiones',
      titleEn: 'Cloud NVMe PCIe 4.0 vs SATA SSD Storage: Why Disk Speed Dictates Your SEO & Conversion Rate',
      summary: 'Análisis técnico sobre cómo las velocidades de lectura de 7,000 MB/s de las unidades NVMe reducen el Time to First Byte (TTFB) por debajo de 50ms.',
      summaryEn: 'Deep technical dive into how 7,000 MB/s NVMe read speeds drop Time to First Byte (TTFB) below 50ms to dominate Core Web Vitals.',
      readTime: '6 min',
      date: '2026-10-12',
      content: [
        'En el ecosistema de alojamiento web moderno, la mayoría de los proveedores promocionan "almacenamiento SSD". Sin embargo, existe una diferencia radical entre un disco SSD conectado por interfaz SATA tradicional y una unidad de estado sólido NVMe (Non-Volatile Memory Express) conectada directamente al bus PCIe 4.0 del servidor.',
        'Los discos SATA SSD están limitados por el ancho de banda del bus a un máximo teórico de 550 MB/s y una cola de comandos de solo 32 operaciones simultáneas. En contraste, las unidades NVMe PCIe 4.0 entregan más de 7,000 MB/s y admiten hasta 64,000 colas de 64,000 comandos cada una.',
        '¿Cómo impacta esto en tu sitio web? Cada vez que un visitante abre una página en WordPress, WooCommerce o cualquier CMS dinámico, el servidor ejecuta decenas de consultas a la base de datos MariaDB/MySQL. Con NVMe, estas consultas se resuelven de forma prácticamente instantánea, logrando un TTFB menor a 50 milisegundos.',
        'Google utiliza la métrica Interaction to Next Paint (INP) y el TTFB como factores clave de sus Core Web Vitals. Un sitio rápido en servidores NVMe de Banelio no solo entrega una experiencia de navegación superior, sino que recibe un impulso sustancial en el ranking de búsqueda orgánica.'
      ],
      contentEn: [
        'In today\'s web hosting landscape, many providers advertise "SSD storage." However, there is a fundamental architectural gap between a SATA SSD and an enterprise NVMe PCIe 4.0 drive.',
        'SATA SSDs are bottlenecked by legacy controller interfaces, capping throughput at 550 MB/s with a shallow queue depth of 32 commands. Modern enterprise NVMe drives bypass SATA entirely, plugging directly into the PCIe bus to deliver up to 7,000 MB/s with 64,000 command queues.',
        'For WordPress and eCommerce platforms executing multiple concurrent MariaDB queries per pageview, NVMe storage provides sub-50ms Time to First Byte (TTFB).',
        'Google directly factors Core Web Vitals and TTFB into search rankings. Hosting on Banelio NVMe cloud infrastructure ensures your site never suffers latency penalties.'
      ]
    },
    {
      id: 'spf-dkim-dmarc',
      category: 'Email',
      categoryEn: 'Email',
      title: 'Guía Definitiva de Autenticación de Correo: Cómo configurar SPF, DKIM y DMARC para no caer en Spam',
      titleEn: 'The Definitive Email Authentication Guide: Configuring SPF, DKIM & DMARC to Never Land in Spam',
      summary: 'Aprende cómo proteger tu dominio corporativo contra suplantación y garantizar que tus cotizaciones lleguen a la bandeja principal de Gmail y Outlook.',
      summaryEn: 'Learn how to protect your domain from spoofing and guarantee that commercial quotes land in Gmail and Outlook primary inboxes.',
      readTime: '8 min',
      date: '2026-10-08',
      content: [
        'Los principales proveedores de correo del mundo (Google Gmail, Microsoft Outlook, Yahoo) implementaron directivas estrictas obligatorias: cualquier remitente que envíe correos desde un dominio propio debe contar con autenticación criptográfica válida o sus mensajes serán rechazados o enviados directamente a la carpeta de correo no deseado.',
        '1. Registro SPF (Sender Policy Framework): Un registro TXT en tu zona DNS que especifica qué direcciones IP y servidores tienen autorización legal para enviar correos en nombre de tu dominio.',
        '2. Firma DKIM (DomainKeys Identified Mail): Añade una firma criptográfica asimétrica de clave pública/privada en el encabezado de cada correo. El servidor receptor consulta la clave pública en tu DNS para verificar que el mensaje no fue alterado en tránsito.',
        '3. Política DMARC (Domain-based Message Authentication, Reporting, and Conformance): Establece qué debe hacer el servidor de destino (monitorear, poner en cuarentena o rechazar) si un correo no pasa las pruebas SPF o DKIM.',
        'En Banelio, nuestros ingenieros y servicios de correo configuran automáticamente estos tres registros para que tu marca goce de una reputación de remitente impecable desde el primer día.'
      ],
      contentEn: [
        'Major mail mailbox providers like Google and Yahoo mandate strict authentication: senders without valid cryptographic signatures are redirected to spam.',
        '1. SPF (Sender Policy Framework): A DNS TXT record declaring which server IPs are authorized to send mail on behalf of your domain.',
        '2. DKIM (DomainKeys Identified Mail): Appends a public/private cryptographic signature to every header, verifying message integrity in transit.',
        '3. DMARC (Domain-based Message Authentication, Reporting & Conformance): Instructs receivers how to treat unauthenticated emails (none, quarantine, reject).',
        'Banelio business email services pre-configure these cryptographic records to protect domain reputation and maximize inbox deliverability.'
      ]
    },
    {
      id: 'choosing-domain-extension',
      category: 'Dominios',
      categoryEn: 'Domains',
      title: 'Cómo Elegir la Extensión de Dominio Ideal (.com, .mx, .lat, .io o .ai) para tu Marca',
      titleEn: 'Choosing the Ideal Domain Extension (.com, .mx, .lat, .io or .ai) for Your Digital Brand',
      summary: 'Estrategias de posicionamiento de marca, presencia local vs global y protección de propiedad intelectual al registrar dominios.',
      summaryEn: 'Brand positioning, local vs global authority, and intellectual property protection when registering top-level domains.',
      readTime: '5 min',
      date: '2026-09-30',
      content: [
        'Elegir el nombre y la extensión adecuada para tu dominio es una de las decisiones estratégicas más importantes para cualquier empresa.',
        '.com sigue siendo el estándar universal de mayor recordación global. Si tu mercado objetivo es internacional o deseas proteger tu marca de forma indiscutible, asegurar la versión .com es indispensable.',
        'Extensiones territoriales ccTLDs (.mx, .com.mx, .co, .es): Si tu negocio atiende principalmente a clientes en un país específico, los ccTLDs le indican a Google la relevancia geográfica de tu oferta, mejorando el ranking en búsquedas geolocalizadas.',
        'Extensiones de tecnología (.ai, .io, .dev): Muy populares entre startups de inteligencia artificial, software como servicio (SaaS) y comunidades de desarrolladores.',
        'Recomendación Banelio: Registra tu nombre principal en .com y asegura también la versión territorial local (.mx) para blindar tu marca contra competidores.'
      ],
      contentEn: [
        'Selecting the right TLD is a cornerstone decision for brand authority.',
        '.com remains the undisputed global benchmark. For international projects, securing the .com is essential.',
        'Country-code TLDs (.mx, .co, .es): If your audience is local, ccTLDs signal clear geographic relevance to search engines, boosting localized results.',
        'Tech TLDs (.ai, .io, .cloud): Highly valued in SaaS, artificial intelligence, and engineering startups.',
        'Banelio Recommendation: Secure your primary .com and claim your regional ccTLD (.mx) to prevent brand hijacking.'
      ]
    },
    {
      id: 'ssl-commercial-vs-free',
      category: 'Seguridad',
      categoryEn: 'Security',
      title: 'Certificados SSL en 2026: Diferencias entre Let\'s Encrypt y Certificados con Respaldo Legal',
      titleEn: 'SSL Certificates in 2026: Differences between Free Let\'s Encrypt & Commercial Warranted SSL',
      summary: 'Comprende cuándo es suficiente un certificado gratuito y cuándo tu comercio electrónico necesita pólizas de garantía de hasta $1.75M USD.',
      summaryEn: 'Understand when automated free certificates suffice and when your eCommerce store demands legal warranty coverage up to $1.75M USD.',
      readTime: '7 min',
      date: '2026-09-24',
      content: [
        'Tanto los certificados SSL gratuitos (como Let\'s Encrypt) como los comerciales (Sectigo, Comodo CA) utilizan el mismo nivel de cifrado matemático robusto (AES de 256 bits y RSA de 2048 bits / ECC). Sin embargo, existen diferencias críticas a nivel empresarial.',
        '1. Garantía Financiera y Respaldo Legal: Los certificados comerciales incluyen una póliza de seguro (desde $10,000 hasta $1,750,000 USD). Si la autoridad de certificación emite un certificado fraudulento que afecte a un cliente, la póliza indemniza las pérdidas.',
        '2. Soporte Wildcard y Multi-Dominio centralizado: Los certificados comerciales facilitan la administración de múltiples servidores sin depender de renovaciones automáticas cada 90 días.',
        '3. Sellos Dinámicos de Confianza: Proveedores acreditados como Sectigo proporcionan sellos interactivos que muestran la fecha y legitimidad en tiempo real en la página de checkout.',
        'En Banelio incluimos SSL Let\'s Encrypt gratuito en todos los planes de hosting NVMe y ofrecemos certificados acreditados Sectigo para proyectos de alta responsabilidad.'
      ],
      contentEn: [
        'Both free certificates and commercial certificates employ 256-bit AES encryption. However, corporate requirements differ significantly.',
        '1. Financial Warranty: Commercial SSL certificates include liability insurance up to $1.75M USD against rogue issuance.',
        '2. Wildcard & Multi-Domain Management: Enterprise certificates simplify subdomain maintenance across decoupled server clusters.',
        '3. Dynamic Trust Seals: Verified security trust badges display real-time legitimacy at the eCommerce checkout point.',
        'Banelio includes free auto-SSL with all hosting plans while offering commercial Sectigo certificates for high-assurance commerce.'
      ]
    }
  ];

  const categories = [
    { id: 'ALL', label: language === 'en' ? 'All Articles' : 'Todos los Artículos' },
    { id: 'Dominios', label: language === 'en' ? 'Domains' : 'Dominios' },
    { id: 'Hosting', label: language === 'en' ? 'Hosting' : 'Hosting' },
    { id: 'Email', label: language === 'en' ? 'Email' : 'Email' },
    { id: 'Seguridad', label: language === 'en' ? 'Security' : 'Seguridad' }
  ];

  const filteredArticles = articles.filter((art) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      art.category === selectedCategory ||
      (language === 'en' && art.categoryEn.toLowerCase() === selectedCategory.toLowerCase());

    const titleText = language === 'en' ? art.titleEn.toLowerCase() : art.title.toLowerCase();
    const summaryText = language === 'en' ? art.summaryEn.toLowerCase() : art.summary.toLowerCase();
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch = !query || titleText.includes(query) || summaryText.includes(query);

    return matchesCategory && matchesSearch;
  });

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && activeArticle) {
      navigator.clipboard.writeText(`${window.location.origin}/blog#${activeArticle.id}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="bg-white text-[#070707] min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E2E5DA]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#DFF5B5]/25 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DFF5B5] border border-[#B9E86A] text-xs font-black tracking-wide text-[#070707] uppercase mb-5">
            <BookOpen size={14} className="text-[#070707]" />
            <span>{language === 'en' ? 'Banelio Knowledge Base & Tech Articles' : 'Blog Oficial & Recursos Técnicos'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#070707] tracking-tight leading-tight max-w-4xl mx-auto">
            {language === 'en'
              ? 'Technical knowledge for modern web infrastructure.'
              : 'Conocimiento técnico para escalar tu presencia digital.'}
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#555A52] max-w-2xl mx-auto font-normal leading-relaxed">
            {language === 'en'
              ? 'Deep guides on NVMe cloud architecture, email cryptographic authentication, domain sovereignty, and web performance optimization.'
              : 'Guías detalladas sobre infraestructura cloud NVMe, autenticación de correos corporativos, seguridad de dominios y optimización de velocidad.'}
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#858A82]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'en'
                    ? 'Search articles by topic (e.g. NVMe, SPF, SSL, Domains)...'
                    : 'Buscar por tema (ej. NVMe, SPF, SSL, Dominios, TTFB)...'
                }
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#E2E5DA] bg-white text-xs sm:text-sm text-[#070707] placeholder-[#858A82] focus:outline-none focus:border-[#070707] focus:ring-2 focus:ring-[#B9E86A] shadow-2xs"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707] ${
                  selectedCategory === cat.id
                    ? 'bg-[#070707] text-[#FCFCF8] shadow-xs'
                    : 'bg-[#F7F8F0] text-[#555A52] hover:text-[#070707] border border-[#E2E5DA]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-base font-bold text-[#555A52]">
              {language === 'en' ? 'No articles found matching your query.' : 'No se encontraron artículos para tu búsqueda.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredArticles.map((art) => (
              <article
                key={art.id}
                className="bg-white rounded-2xl p-7 border border-[#E2E5DA] shadow-xs hover:border-[#070707] hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#858A82] mb-3">
                    <span className="inline-block bg-[#DFF5B5] text-[#070707] font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                      {language === 'en' ? art.categoryEn : art.category}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock size={12} />
                      {art.readTime}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-[#070707] leading-snug">
                    {language === 'en' ? art.titleEn : art.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-[#555A52] mt-3 leading-relaxed">
                    {language === 'en' ? art.summaryEn : art.summary}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#E2E5DA] flex items-center justify-between">
                  <span className="text-[11px] text-[#858A82] font-mono">{art.date}</span>
                  <button
                    onClick={() => setActiveArticle(art)}
                    className="flex items-center gap-1.5 text-xs font-black text-[#070707] hover:text-[#49652A] group cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#070707]"
                  >
                    <span>{language === 'en' ? 'Read Complete Article' : 'Leer Artículo'}</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Article Detail Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-10 relative border-2 border-[#E2E5DA] shadow-2xl">
            <button
              onClick={() => setActiveArticle(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-[#F7F8F0] hover:bg-[#F1F3E8] text-[#070707] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707]"
              aria-label="Cerrar artículo"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 text-xs mb-4">
              <span className="bg-[#DFF5B5] text-[#070707] font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full">
                {language === 'en' ? activeArticle.categoryEn : activeArticle.category}
              </span>
              <span className="text-[#858A82] flex items-center gap-1 font-mono">
                <Clock size={12} />
                {activeArticle.readTime}
              </span>
              <span className="text-[#858A82] font-mono">&middot; {activeArticle.date}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#070707] leading-tight">
              {language === 'en' ? activeArticle.titleEn : activeArticle.title}
            </h1>

            <div className="my-6 pt-4 border-t border-[#E2E5DA] space-y-4 text-xs sm:text-sm text-[#070707] leading-relaxed">
              {(language === 'en' ? activeArticle.contentEn : activeArticle.content).map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            <div className="pt-6 border-t border-[#E2E5DA] flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F7F8F0] hover:bg-[#F1F3E8] border border-[#E2E5DA] text-xs font-bold text-[#070707] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707]"
              >
                {copiedLink ? <Check size={14} className="text-green-600" /> : <Share2 size={14} />}
                <span>{copiedLink ? (language === 'en' ? 'Link Copied!' : '¡Enlace Copiado!') : (language === 'en' ? 'Share Article' : 'Compartir Artículo')}</span>
              </button>

              <button
                onClick={() => setActiveArticle(null)}
                className="px-5 py-2 rounded-xl bg-[#070707] hover:bg-[#202020] text-[#FCFCF8] text-xs font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9E86A]"
              >
                {language === 'en' ? 'Close Article' : 'Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
