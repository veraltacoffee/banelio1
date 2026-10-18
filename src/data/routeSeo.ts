export interface RouteSeoMetadata {
  path: string;
  title: string;
  description: string;
  canonical: string;
  ogType: string;
  jsonLd: Record<string, any>;
}

export const ROUTE_SEO_CONFIG: Record<string, RouteSeoMetadata> = {
  '/': {
    path: '/',
    title: 'Banelio | Dominios, Hosting Web, Correo y Servicios Digitales',
    description: 'Registra tu dominio en Banelio. Hosting web de alto rendimiento con cPanel, correo empresarial corporativo, certificados SSL y servicios de diseño web y posicionamiento SEO.',
    canonical: 'https://banelio.com/',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://banelio.com/#organization',
          name: 'Banelio',
          url: 'https://banelio.com',
          logo: 'https://res.cloudinary.com/hxbmhqiq/image/upload/f_auto,q_auto/LOGO_BANELIO_wide_2',
          email: 'try@banelio.com',
          telephone: '+52-660-125-4107',
          sameAs: [
            'https://facebook.com/trybanelio',
            'https://instagram.com/trybanelio',
            'https://x.com/trybanelio',
            'https://youtube.com/@trybanelio',
            'https://tiktok.com/@trybanelio'
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            email: 'try@banelio.com',
            telephone: '+52-660-125-4107',
            contactType: 'customer service',
            availableLanguage: ['Spanish', 'English']
          }
        },
        {
          '@type': 'WebSite',
          '@id': 'https://banelio.com/#website',
          url: 'https://banelio.com',
          name: 'Banelio',
          publisher: { '@id': 'https://banelio.com/#organization' }
        },
        {
          '@type': 'Service',
          name: 'Registro y Transferencia de Dominios Web',
          provider: { '@id': 'https://banelio.com/#organization' },
          serviceType: 'Domain Name Registration & Management',
          description: 'Búsqueda, registro y transferencia de dominios .com, .mx, .lat, .io, .ai con gestión DNS y opciones de privacidad Whois.'
        },
        {
          '@type': 'Service',
          name: 'Hosting Web Cloud con cPanel',
          provider: { '@id': 'https://banelio.com/#organization' },
          serviceType: 'Cloud Web Hosting Services',
          description: 'Alojamiento web con almacenamiento Cloud SSD, cPanel en español, aislamiento CloudLinux y certificados SSL automáticos.'
        }
      ]
    }
  },
  '/dominios': {
    path: '/dominios',
    title: 'Comprar y Transferir Dominios Web | Banelio',
    description: 'Registra dominios .com, .mx, .lat, .io, .ai y más de 400 extensiones. Gestión DNS completa, protección de privacidad WHOIS y asistente de transferencia.',
    canonical: 'https://banelio.com/dominios',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': 'https://banelio.com/dominios#webpage',
          url: 'https://banelio.com/dominios',
          name: 'Comprar y Transferir Dominios Web | Banelio',
          description: 'Registra dominios .com, .mx, .lat, .io, .ai y más de 400 extensiones con gestión DNS y opciones de privacidad WHOIS.',
          isPartOf: { '@id': 'https://banelio.com/#website' }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://banelio.com/' },
            { '@type': 'ListItem', position: 2, name: 'Dominios', item: 'https://banelio.com/dominios' }
          ]
        },
        {
          '@type': 'Service',
          name: 'Registro de Dominios de Internet',
          provider: { '@id': 'https://banelio.com/#organization' },
          serviceType: 'Domain Registration and Transfer',
          description: 'Registro oficial de extensiones gTLD y ccTLD, Anycast DNS y bloqueo de transferencias no autorizadas.'
        }
      ]
    }
  },
  '/hosting': {
    path: '/hosting',
    title: 'Hosting Web Cloud de Alta Velocidad con cPanel | Banelio',
    description: 'Alojamiento web con almacenamiento Cloud SSD, panel cPanel en español, certificados SSL gratuitos automáticos, copias de seguridad y migración asistida.',
    canonical: 'https://banelio.com/hosting',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': 'https://banelio.com/hosting#webpage',
          url: 'https://banelio.com/hosting',
          name: 'Hosting Web Cloud de Alta Velocidad con cPanel | Banelio',
          description: 'Alojamiento web en servidores cloud con cPanel en español, almacenamiento de alta velocidad y certificados SSL gratis.',
          isPartOf: { '@id': 'https://banelio.com/#website' }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://banelio.com/' },
            { '@type': 'ListItem', position: 2, name: 'Hosting Web', item: 'https://banelio.com/hosting' }
          ]
        },
        {
          '@type': 'Service',
          name: 'Alojamiento Web Cloud y Servidores cPanel',
          provider: { '@id': 'https://banelio.com/#organization' },
          serviceType: 'Web Hosting Services',
          description: 'Planes de hosting compartido y empresarial con cPanel, almacenamiento SSD, copias de seguridad y soporte técnico.'
        }
      ]
    }
  },
  '/email': {
    path: '/email',
    title: 'Correo Empresarial Corporativo con Dominio Propio | Banelio',
    description: 'Buzones profesionales @tuempresa.com con Titan Email, Google Workspace y Microsoft 365. Cifrado TLS y autenticación SPF, DKIM y DMARC preconfigurada.',
    canonical: 'https://banelio.com/email',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': 'https://banelio.com/email#webpage',
          url: 'https://banelio.com/email',
          name: 'Correo Empresarial Corporativo con Dominio Propio | Banelio',
          description: 'Soluciones de correo corporativo Titan Email, Google Workspace y Microsoft 365 con autenticación criptográfica SPF/DKIM/DMARC.',
          isPartOf: { '@id': 'https://banelio.com/#website' }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://banelio.com/' },
            { '@type': 'ListItem', position: 2, name: 'Correo Empresarial', item: 'https://banelio.com/email' }
          ]
        },
        {
          '@type': 'Service',
          name: 'Correo Electrónico Corporativo con Dominio Propio',
          provider: { '@id': 'https://banelio.com/#organization' },
          serviceType: 'Business Email Hosting',
          description: 'Buzones de correo con dominio corporativo, sincronización multidispositivo y alta reputación de entrega.'
        }
      ]
    }
  },
  '/ssl': {
    path: '/ssl',
    title: 'Certificados SSL Acreditados DV, Wildcard y EV | Banelio',
    description: 'Activa el candado HTTPS y blinda las transacciones de tus clientes con certificados SSL de Sectigo y Comodo CA con garantías de hasta $1.75M USD.',
    canonical: 'https://banelio.com/ssl',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': 'https://banelio.com/ssl#webpage',
          url: 'https://banelio.com/ssl',
          name: 'Certificados SSL Acreditados DV, Wildcard y EV | Banelio',
          description: 'Cifra la conexión de tus visitantes con certificados SSL acreditados de Sectigo y Comodo CA.',
          isPartOf: { '@id': 'https://banelio.com/#website' }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://banelio.com/' },
            { '@type': 'ListItem', position: 2, name: 'Certificados SSL', item: 'https://banelio.com/ssl' }
          ]
        },
        {
          '@type': 'Service',
          name: 'Emisión de Certificados de Seguridad SSL',
          provider: { '@id': 'https://banelio.com/#organization' },
          serviceType: 'Digital Security Certificates',
          description: 'Certificados PositiveSSL DV, comodines Wildcard y validación extendida EV con sellos de confianza y garantías legales.'
        }
      ]
    }
  },
  '/diseno-web': {
    path: '/diseno-web',
    title: 'Diseño y Desarrollo de Páginas Web Profesionales | Banelio',
    description: 'Desarrollo de sitios web corporativos, landing pages de alta conversión y tiendas online optimizadas para velocidad, móviles y posicionamiento Google.',
    canonical: 'https://banelio.com/diseno-web',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': 'https://banelio.com/diseno-web#webpage',
          url: 'https://banelio.com/diseno-web',
          name: 'Diseño y Desarrollo de Páginas Web Profesionales | Banelio',
          description: 'Servicio profesional propio de Banelio: desarrollo de portales corporativos, tiendas de comercio electrónico y páginas de aterrizaje.',
          isPartOf: { '@id': 'https://banelio.com/#website' }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://banelio.com/' },
            { '@type': 'ListItem', position: 2, name: 'Diseño Web', item: 'https://banelio.com/diseno-web' }
          ]
        },
        {
          '@type': 'Service',
          name: 'Diseño y Desarrollo Web a Medida',
          provider: { '@id': 'https://banelio.com/#organization' },
          serviceType: 'Web Design & Development Services',
          description: 'Creación de sitios web modernos, responsivos y optimizados para Core Web Vitals y conversión comercial.'
        }
      ]
    }
  },
  '/seo': {
    path: '/seo',
    title: 'Posicionamiento Web y Optimización SEO en Google | Banelio',
    description: 'Servicios de optimización SEO técnica, arquitectura on-page, palabras clave transaccionales y SEO local en Google Maps para atraer prospectos calificados.',
    canonical: 'https://banelio.com/seo',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': 'https://banelio.com/seo#webpage',
          url: 'https://banelio.com/seo',
          name: 'Posicionamiento Web y Optimización SEO en Google | Banelio',
          description: 'Servicio profesional propio de Banelio: auditorías SEO técnicas, optimización de contenidos y posicionamiento local.',
          isPartOf: { '@id': 'https://banelio.com/#website' }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://banelio.com/' },
            { '@type': 'ListItem', position: 2, name: 'SEO & Posicionamiento', item: 'https://banelio.com/seo' }
          ]
        },
        {
          '@type': 'Service',
          name: 'Posicionamiento en Motores de Búsqueda (SEO)',
          provider: { '@id': 'https://banelio.com/#organization' },
          serviceType: 'Search Engine Optimization',
          description: 'Estrategias de posicionamiento orgánico, optimización on-page, auditorías técnicas de rastreo y SEO local.'
        }
      ]
    }
  },
  '/afiliados': {
    path: '/afiliados',
    title: 'Programa de Afiliados y Partners Comerciales | Banelio',
    description: 'Gana el 10% de comisión por cada cliente que refieras a Banelio en servicios de hosting, dominios y soluciones web con enlaces y códigos exclusivos.',
    canonical: 'https://banelio.com/afiliados',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': 'https://banelio.com/afiliados#webpage',
          url: 'https://banelio.com/afiliados',
          name: 'Programa de Afiliados y Partners Comerciales | Banelio',
          description: 'Programa oficial de afiliados de Banelio: 10% de comisión por referir servicios de infraestructura web y hosting.',
          isPartOf: { '@id': 'https://banelio.com/#website' }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://banelio.com/' },
            { '@type': 'ListItem', position: 2, name: 'Afiliados', item: 'https://banelio.com/afiliados' }
          ]
        }
      ]
    }
  },
  '/resellers': {
    path: '/resellers',
    title: 'Hosting para Revendedores y Soluciones para Agencias | Banelio',
    description: 'Inicia tu propia empresa de hosting con cPanel y WebHost Manager (WHM). 100% marca blanca con servidores de nombres privados y control de cuotas.',
    canonical: 'https://banelio.com/resellers',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': 'https://banelio.com/resellers#webpage',
          url: 'https://banelio.com/resellers',
          name: 'Hosting para Revendedores y Soluciones para Agencias | Banelio',
          description: 'Planes reseller con WHM, cPanel para cada cliente, nameservers privados y marca blanca.',
          isPartOf: { '@id': 'https://banelio.com/#website' }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://banelio.com/' },
            { '@type': 'ListItem', position: 2, name: 'Revendedores', item: 'https://banelio.com/resellers' }
          ]
        },
        {
          '@type': 'Service',
          name: 'Hosting Reseller con WebHost Manager (WHM)',
          provider: { '@id': 'https://banelio.com/#organization' },
          serviceType: 'Reseller Web Hosting',
          description: 'Alojamiento para revendedores con consola WHM, cuentas cPanel independientes y soporte de marca blanca.'
        }
      ]
    }
  },
  '/blog': {
    path: '/blog',
    title: 'Blog Oficial: Infraestructura Web, Dominios y Cloud | Banelio',
    description: 'Artículos técnicos y guías prácticas sobre rendimiento de servidores, autenticación de correos corporativos, elección de dominios y seguridad web.',
    canonical: 'https://banelio.com/blog',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': 'https://banelio.com/blog#webpage',
          url: 'https://banelio.com/blog',
          name: 'Blog Oficial: Infraestructura Web, Dominios y Cloud | Banelio',
          description: 'Base de conocimiento técnico y guías de arquitectura cloud redactadas por ingenieros de Banelio.',
          isPartOf: { '@id': 'https://banelio.com/#website' }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://banelio.com/' },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://banelio.com/blog' }
          ]
        }
      ]
    }
  },
  '/blog/nvme-vs-ssd': {
    path: '/blog/nvme-vs-ssd',
    title: 'Almacenamiento Cloud NVMe frente a SATA SSD | Blog Banelio',
    description: 'Análisis técnico sobre cómo el almacenamiento de alta velocidad en servidores cloud optimiza el Time to First Byte (TTFB) y mejora las métricas Core Web Vitals en Google.',
    canonical: 'https://banelio.com/blog/nvme-vs-ssd',
    ogType: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Almacenamiento Cloud NVMe frente a SATA SSD: Rendimiento, TTFB y Posicionamiento SEO',
      description: 'Análisis técnico sobre cómo el almacenamiento de alta velocidad en servidores cloud optimiza el Time to First Byte (TTFB) y mejora las métricas Core Web Vitals en Google.',
      author: { '@type': 'Organization', name: 'Banelio' },
      publisher: {
        '@type': 'Organization',
        name: 'Banelio',
        logo: { '@type': 'ImageObject', url: 'https://res.cloudinary.com/hxbmhqiq/image/upload/f_auto,q_auto/LOGO_BANELIO_wide_2' }
      },
      datePublished: '2026-10-12',
      dateModified: '2026-10-18',
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://banelio.com/blog/nvme-vs-ssd' }
    }
  },
  '/blog/spf-dkim-dmarc': {
    path: '/blog/spf-dkim-dmarc',
    title: 'Guía de Autenticación de Correo: SPF, DKIM y DMARC | Blog Banelio',
    description: 'Aprende a proteger el dominio de tu empresa contra la suplantación de identidad y asegura que tus mensajes corporativos lleguen a la bandeja de entrada.',
    canonical: 'https://banelio.com/blog/spf-dkim-dmarc',
    ogType: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Guía de Autenticación de Correo Corporativo: Configuración de SPF, DKIM y DMARC',
      description: 'Aprende a proteger el dominio de tu empresa contra la suplantación de identidad y asegura que tus mensajes corporativos lleguen correctamente a la bandeja de entrada.',
      author: { '@type': 'Organization', name: 'Banelio' },
      publisher: {
        '@type': 'Organization',
        name: 'Banelio',
        logo: { '@type': 'ImageObject', url: 'https://res.cloudinary.com/hxbmhqiq/image/upload/f_auto,q_auto/LOGO_BANELIO_wide_2' }
      },
      datePublished: '2026-10-08',
      dateModified: '2026-10-18',
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://banelio.com/blog/spf-dkim-dmarc' }
    }
  },
  '/blog/choosing-domain-extension': {
    path: '/blog/choosing-domain-extension',
    title: 'Cómo Elegir la Extensión de Dominio Adecuada (.com, .mx, .ai) | Blog Banelio',
    description: 'Criterios estratégicos de posicionamiento, cobertura geográfica y protección de propiedad intelectual al registrar dominios para tu marca.',
    canonical: 'https://banelio.com/blog/choosing-domain-extension',
    ogType: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Cómo Elegir la Extensión de Dominio Adecuada (.com, .mx, .lat, .io o .ai) para tu Empresa',
      description: 'Criterios estratégicos de posicionamiento, cobertura geográfica y protección de propiedad intelectual al registrar dominios para tu marca.',
      author: { '@type': 'Organization', name: 'Banelio' },
      publisher: {
        '@type': 'Organization',
        name: 'Banelio',
        logo: { '@type': 'ImageObject', url: 'https://res.cloudinary.com/hxbmhqiq/image/upload/f_auto,q_auto/LOGO_BANELIO_wide_2' }
      },
      datePublished: '2026-09-30',
      dateModified: '2026-10-18',
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://banelio.com/blog/choosing-domain-extension' }
    }
  },
  '/blog/ssl-commercial-vs-free': {
    path: '/blog/ssl-commercial-vs-free',
    title: 'Certificados SSL en 2026: Cifrado HTTPS y Garantías | Blog Banelio',
    description: 'Conoce las diferencias entre certificados de validación de dominio (DV), comodines Wildcard y validación extendida (EV) para tiendas online y portales corporativos.',
    canonical: 'https://banelio.com/blog/ssl-commercial-vs-free',
    ogType: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Certificados SSL en 2026: Cifrado HTTPS, Tipos de Validación y Garantías de Seguridad',
      description: 'Conoce las diferencias entre certificados de validación de dominio (DV), comodines Wildcard y validación extendida (EV) para tiendas online y portales corporativos.',
      author: { '@type': 'Organization', name: 'Banelio' },
      publisher: {
        '@type': 'Organization',
        name: 'Banelio',
        logo: { '@type': 'ImageObject', url: 'https://res.cloudinary.com/hxbmhqiq/image/upload/f_auto,q_auto/LOGO_BANELIO_wide_2' }
      },
      datePublished: '2026-09-24',
      dateModified: '2026-10-18',
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://banelio.com/blog/ssl-commercial-vs-free' }
    }
  }
};
