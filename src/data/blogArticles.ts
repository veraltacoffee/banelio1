export interface Article {
  id: string;
  slug: string;
  category: 'Dominios' | 'Hosting' | 'Email' | 'Seguridad' | 'SEO';
  categoryEn: 'Domains' | 'Hosting' | 'Email' | 'Security' | 'SEO';
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  readTime: string;
  date: string;
  author: string;
  content: string[];
  contentEn: string[];
}

export const BLOG_ARTICLES: Article[] = [
  {
    id: 'nvme-vs-ssd',
    slug: 'nvme-vs-ssd',
    category: 'Hosting',
    categoryEn: 'Hosting',
    title: 'Almacenamiento Cloud NVMe frente a SATA SSD: Rendimiento, TTFB y Posicionamiento SEO',
    titleEn: 'Cloud NVMe vs SATA SSD Storage: Performance, TTFB and Search Engine Optimization',
    summary: 'Análisis técnico sobre cómo el almacenamiento de alta velocidad en servidores cloud optimiza el Time to First Byte (TTFB) y mejora las métricas Core Web Vitals en Google.',
    summaryEn: 'Technical analysis of how high-speed cloud storage optimizes Time to First Byte (TTFB) and improves Google Core Web Vitals scores.',
    readTime: '6 min',
    date: '2026-10-12',
    author: 'Equipo de Infraestructura Banelio',
    content: [
      'En el ecosistema de alojamiento web moderno, la velocidad del subsistema de almacenamiento es uno de los factores más determinantes en el rendimiento percibido por el usuario y los motores de búsqueda.',
      'Los discos de estado sólido SATA convencionales operan bajo una interfaz originalmente diseñada para unidades mecánicas, con un límite de transferencia teórico de 550 MB/s y una cola de comandos reducida. En contraste, las arquitecturas NVMe (Non-Volatile Memory Express) se comunican directamente a través del bus PCI Express del servidor, alcanzando tasas de transferencia que multiplican la capacidad de respuesta del almacenamiento y soportan miles de operaciones concurrentes.',
      '¿Cómo impacta esto en un sitio web en producción? En plataformas dinámicas con CMS como WordPress, WooCommerce o tiendas online, cada visita genera consultas a bases de datos MariaDB o MySQL para cargar contenidos, productos y sesiones. Cuando el almacenamiento responde sin cuellos de botella, las consultas se resuelven en milisegundos, permitiendo un Time to First Byte (TTFB) significativamente más bajo.',
      'Google toma en cuenta el TTFB y la interacción del usuario como señales dentro de sus métricas de Core Web Vitals. Un sitio alojado en una infraestructura optimizada no solo ofrece una experiencia de navegación más ágil y profesional a sus visitantes, sino que fortalece su competitividad en los resultados de búsqueda orgánica.'
    ],
    contentEn: [
      'In modern web hosting architecture, storage subsystem performance is a primary driver of both user experience and search engine visibility.',
      'Legacy SATA SSDs rely on controller interfaces originally designed for mechanical hard drives, capped at roughly 550 MB/s with shallow command queues. Non-Volatile Memory Express (NVMe) architecture connects directly to the server PCIe bus, unlocking substantially higher throughput and thousands of concurrent queues.',
      'For dynamic websites and content management systems such as WordPress or WooCommerce, each pageview triggers database queries to retrieve posts, products, and customer sessions. Responsive storage resolves queries rapidly, lowering Time to First Byte (TTFB).',
      'Search engines actively reward fast initial response times and smooth Core Web Vitals. Hosting your website on a solid, optimized cloud infrastructure provides an immediate advantage in both user retention and organic search rank.'
    ]
  },
  {
    id: 'spf-dkim-dmarc',
    slug: 'spf-dkim-dmarc',
    category: 'Email',
    categoryEn: 'Email',
    title: 'Guía de Autenticación de Correo Corporativo: Configuración de SPF, DKIM y DMARC',
    titleEn: 'Business Email Authentication Guide: Setting Up SPF, DKIM, and DMARC',
    summary: 'Aprende a proteger el dominio de tu empresa contra la suplantación de identidad y asegura que tus mensajes corporativos lleguen correctamente a la bandeja de entrada.',
    summaryEn: 'Learn how to protect your corporate domain from spoofing and ensure business communications land reliably in customer inboxes.',
    readTime: '8 min',
    date: '2026-10-08',
    author: 'Equipo de Seguridad Banelio',
    content: [
      'Los principales proveedores de servicios de correo electrónico a nivel mundial, incluyendo Google Gmail, Microsoft Outlook y Yahoo, aplican estrictos requisitos de autenticación criptográfica para todos los remitentes de correos corporativos.',
      '1. Registro SPF (Sender Policy Framework): Es un registro de tipo TXT en la zona DNS de tu dominio que especifica con exactitud cuáles direcciones IP y servidores de correo están formalmente autorizados para emitir correspondencia en nombre de tu organización.',
      '2. Firma DKIM (DomainKeys Identified Mail): Incorpora una firma criptográfica asimétrica (par de llaves pública y privada) en el encabezado de cada mensaje transmitido. El servidor del destinatario consulta la llave pública publicada en tu DNS para verificar matemáticamente que el contenido del correo no fue adulterado ni interceptado en tránsito.',
      '3. Política DMARC (Domain-based Message Authentication, Reporting and Conformance): Define la instrucción explícita que debe aplicar el servidor receptor (monitorear, enviar a cuarentena o rechazar rotundamente) en caso de que un mensaje falle las validaciones de SPF o DKIM.',
      'En Banelio, los servicios de correo corporativo facilitan la configuración de estos tres registros esenciales, blindando la reputación de tu dominio y garantizando que tus cotizaciones, avisos y contratos lleguen siempre a la bandeja de entrada de tus clientes.'
    ],
    contentEn: [
      'Leading global mailbox providers such as Google Gmail, Microsoft Outlook, and Yahoo enforce strict email authentication policies on custom domain senders.',
      '1. SPF (Sender Policy Framework): A DNS TXT record declaring exactly which servers and IP addresses are authorized to dispatch messages on behalf of your domain.',
      '2. DKIM (DomainKeys Identified Mail): Embeds an asymmetric cryptographic signature into outgoing email headers. Receiving mail servers verify the public key in your DNS to confirm message authenticity and integrity.',
      '3. DMARC (Domain-based Message Authentication, Reporting and Conformance): Instructs receiving servers whether to accept, quarantine, or reject messages that fail SPF or DKIM checks.',
      'Banelio professional email solutions streamline DNS record provisioning to keep your domain reputation safe and ensure your communications reach intended inboxes.'
    ]
  },
  {
    id: 'choosing-domain-extension',
    slug: 'choosing-domain-extension',
    category: 'Dominios',
    categoryEn: 'Domains',
    title: 'Cómo Elegir la Extensión de Dominio Adecuada (.com, .mx, .lat, .io o .ai) para tu Empresa',
    titleEn: 'Choosing the Right Domain Extension (.com, .mx, .lat, .io or .ai) for Your Business',
    summary: 'Criterios estratégicos de posicionamiento, cobertura geográfica y protección de propiedad intelectual al registrar dominios para tu marca.',
    summaryEn: 'Strategic criteria covering market positioning, geographic focus, and brand protection when selecting top-level domain extensions.',
    readTime: '5 min',
    date: '2026-09-30',
    author: 'Especialistas en Dominios Banelio',
    content: [
      'Seleccionar el nombre y la extensión adecuada para tu presencia digital es una de las primeras decisiones estratégicas de cualquier proyecto o empresa.',
      'Extensión genérica global (.com): Sigue siendo el estándar con mayor reconocimiento y memorabilidad en todo el mundo. Si tu proyecto tiene aspiraciones internacionales o deseas proteger tu marca de forma integral, asegurar la versión .com es el primer paso recomendado.',
      'Extensiones territoriales ccTLDs (.mx, .com.mx, .co, .es): Si tu modelo de negocio atiende preponderantemente a consumidores o empresas en un país determinado, las extensiones territoriales le indican a los buscadores la afinidad geográfica de tus servicios, favoreciendo la relevancia en búsquedas locales.',
      'Extensiones temáticas y tecnológicas (.ai, .io, .cloud): Muy valoradas por empresas de software, startups de tecnología e iniciativas digitales que buscan transmitir innovación y especialización.',
      'Recomendación de protección de marca: Es una buena práctica registrar el nombre central en la extensión global .com y complementar con la extensión territorial correspondiente (.mx o .com.mx), previniendo que competidores o terceros ocupen variantes directas de tu identidad.'
    ],
    contentEn: [
      'Selecting the right name and top-level extension is a foundational strategic step for any enterprise or digital venture.',
      'Global generic TLD (.com): Remains the most recognized extension worldwide. For businesses with global ambitions or brands looking for complete identity protection, securing the .com is a fundamental first step.',
      'Country-code TLDs (.mx, .com.mx, .co, .es): If your business operates primarily within a specific country, ccTLDs clearly signal geographic focus to search engines, boosting local market relevance.',
      'Tech-focused TLDs (.ai, .io, .cloud): Popular among software companies and tech ventures seeking to emphasize innovation in their sector.',
      'Brand protection guideline: Register your primary name under the global .com and secure your local ccTLD (.mx) to prevent unauthorized brand imitation.'
    ]
  },
  {
    id: 'ssl-commercial-vs-free',
    slug: 'ssl-commercial-vs-free',
    category: 'Seguridad',
    categoryEn: 'Security',
    title: 'Certificados SSL en 2026: Cifrado HTTPS, Tipos de Validación y Garantías de Seguridad',
    titleEn: 'SSL Certificates in 2026: HTTPS Encryption, Validation Types, and Security Warranties',
    summary: 'Conoce las diferencias entre certificados de validación de dominio (DV), comodines Wildcard y validación extendida (EV) para tiendas online y portales corporativos.',
    summaryEn: 'Understand the differences between domain validation (DV), Wildcard, and Extended Validation (EV) certificates for online stores and portals.',
    readTime: '7 min',
    date: '2026-09-24',
    author: 'Equipo de Ciberseguridad Banelio',
    content: [
      'El protocolo HTTPS es hoy un estándar imprescindible en cualquier sitio web. Sin un certificado SSL activo, los navegadores modernos alertan a los usuarios con mensajes visibles de "Sitio no seguro", lo que genera desconfianza inmediata y reduce la conversión.',
      'Todos los certificados SSL modernos aplican algoritmos criptográficos robustos (cifrado de hasta 256 bits). Sin embargo, existen diferencias operativas y de respaldo según el tipo de validación:',
      '1. Validación de Dominio (DV - Domain Validation): Verifica que el solicitante tiene control sobre el nombre de dominio. Es ideal para blogs, sitios web informativos y plataformas que requieren activación rápida sin necesidad de trámites documentales.',
      '2. Certificados Wildcard (*.dominio.com): Permiten proteger con un único certificado el dominio raíz y un número ilimitado de subdominios (por ejemplo: tienda.tudominio.com, app.tudominio.com, blog.tudominio.com), simplificando notablemente la gestión técnica y las renovaciones.',
      '3. Validación Extendida (EV - Extended Validation): Implica una verificación legal formal de la existencia y registro mercantil de la empresa ante una Autoridad de Certificación acreditada (como Sectigo). Incluyen sellos dinámicos y pólizas de garantía financiera elevadas, recomendadas para portales financieros, aseguradoras y comercio electrónico de alto volumen.',
      'En Banelio facilitamos tanto opciones con activación automatizada en planes de hosting como certificados comerciales acreditados Sectigo para organizaciones con requerimientos de cumplimiento específicos.'
    ],
    contentEn: [
      'HTTPS is an absolute baseline standard on the modern web. Without an active certificate, browsers mark sites with explicit "Not Secure" warnings, depressing visitor trust and conversion.',
      'Modern SSL certificates utilize robust encryption standards (up to 256-bit). However, validation levels and financial backing differ based on commercial requirements:',
      '1. Domain Validation (DV): Confirms ownership of the domain name. Well-suited for blogs, content sites, and projects requiring rapid automated setup.',
      '2. Wildcard SSL (*.domain.com): Protects the root domain and all its subdomains under a single certificate, greatly simplifying management across decoupled environments.',
      '3. Extended Validation (EV): Requires thorough legal vetting of the requesting business entity by an accredited Certificate Authority like Sectigo. EV certificates offer dynamic site seals and high financial warranties, making them appropriate for eCommerce portals and financial platforms.',
      'Banelio offers both automated setup options across cloud hosting plans and accredited commercial Sectigo certificates for compliance-focused organizations.'
    ]
  }
];

export function getArticleBySlug(slug: string): Article | undefined {
  return BLOG_ARTICLES.find((a) => a.slug === slug || a.id === slug);
}
