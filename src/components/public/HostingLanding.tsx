import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Zap,
  ShieldCheck,
  Check,
  ExternalLink,
  Cpu,
  RefreshCw,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { openHostingStore } from '../../services/supersiteService';

export default function HostingLanding() {
  const { language } = useApp();

  const plans = [
    {
      id: 'starter',
      name: 'Cloud Starter',
      subtitle: language === 'en' ? 'For personal blogs & startups' : 'Para sitios personales, blogs y primeros proyectos',
      popular: false,
      specs: [
        language === 'en' ? '1 Hosted Website' : '1 Sitio Web alojado',
        language === 'en' ? '10 GB NVMe PCIe 4.0 Storage' : '10 GB Almacenamiento NVMe PCIe 4.0',
        language === 'en' ? '5 Professional Business Email Accounts' : '5 Cuentas de Correo Corporativo',
        language === 'en' ? 'Free Auto-SSL Certificate (Let\'s Encrypt)' : 'Certificado SSL Gratis automático',
        language === 'en' ? 'LiteSpeed Web Server + LSCache' : 'LiteSpeed Web Server + LSCache',
        language === 'en' ? 'cPanel Control Panel in Spanish' : 'Panel de Control cPanel en Español',
        language === 'en' ? 'Unmetered Monthly Bandwidth' : 'Transferencia mensual sin límite medido',
        language === 'en' ? 'Weekly Automatic Backups' : 'Copias de seguridad semanales'
      ],
      badge: null
    },
    {
      id: 'pro',
      name: language === 'en' ? 'Cloud Pro Business' : 'Cloud Pro Empresarial',
      subtitle: language === 'en' ? 'Our most recommended plan for growing businesses' : 'El plan más recomendado para empresas y tiendas en crecimiento',
      popular: true,
      specs: [
        language === 'en' ? 'Unlimited Hosted Websites' : 'Sitios Web Ilimitados',
        language === 'en' ? '50 GB Ultra NVMe PCIe 4.0 Storage' : '50 GB Almacenamiento Ultra NVMe PCIe 4.0',
        language === 'en' ? 'Unlimited Professional Email Accounts' : 'Cuentas de Correo Corporativo Ilimitadas',
        language === 'en' ? 'Free Wildcard SSL for all domains' : 'Certificados SSL Gratis para todos tus dominios',
        language === 'en' ? 'LiteSpeed Enterprise + HTTP/3 QUIC' : 'LiteSpeed Enterprise + HTTP/3 & QUIC',
        language === 'en' ? 'CloudLinux OS Isolation (Guaranteed Resources)' : 'Aislamiento CloudLinux OS (Recursos 100% garantizados)',
        language === 'en' ? 'Daily Automated Backups with 1-Click Restore' : 'Backups Diarios con restauración en 1 clic',
        language === 'en' ? '1-Click WordPress Staging & Git Integration' : 'Entornos Staging WordPress y despliegue Git',
        language === 'en' ? 'Free Zero-Downtime White-Glove Migration' : 'Migración Gratuita Zero-Downtime incluida'
      ],
      badge: language === 'en' ? 'Most Popular' : 'Más Recomendado'
    },
    {
      id: 'elite',
      name: 'Cloud Elite Turbo',
      subtitle: language === 'en' ? 'Dedicated resources for heavy traffic & eCommerce' : 'Máxima potencia para e-commerce de alto tráfico y agencias',
      popular: false,
      specs: [
        language === 'en' ? 'Unlimited Hosted Websites' : 'Sitios Web Ilimitados',
        language === 'en' ? '150 GB Ultra NVMe PCIe 4.0 Storage' : '150 GB Almacenamiento Ultra NVMe',
        language === 'en' ? '4 Dedicated CPU Cores & 8 GB RAM' : '4 Cores de CPU & 8 GB RAM Dedicada',
        language === 'en' ? 'Dedicated IPv4 Address included' : 'Dirección IP Dedicada incluida',
        language === 'en' ? 'Unlimited High-Speed Inboxes' : 'Buzones de Correo Ilimitados',
        language === 'en' ? 'LiteSpeed Enterprise Turbo Caching' : 'Caché LiteSpeed Enterprise optimizado',
        language === 'en' ? 'Acronis Cloud Real-Time Backups' : 'Copias Acronis Cloud en tiempo real',
        language === 'en' ? 'VIP Priority 24/7 Phone & Ticket Support' : 'Soporte Prioritario VIP 24/7'
      ],
      badge: null
    },
    {
      id: 'reseller',
      name: 'Hosting Reseller WHM',
      subtitle: language === 'en' ? 'Launch your own hosting brand with cPanel & WHM' : 'Crea tu propia empresa de hosting con marca blanca',
      popular: false,
      specs: [
        language === 'en' ? '50 Independent cPanel Client Accounts' : '50 Cuentas cPanel independientes',
        language === 'en' ? '250 GB NVMe PCIe 4.0 Enterprise Storage' : '250 GB Espacio NVMe de alto rendimiento',
        language === 'en' ? 'Full WebHost Manager (WHM) Access' : 'Acceso completo a WebHost Manager (WHM)',
        language === 'en' ? '100% White-Label (Custom Private Nameservers)' : '100% Marca Blanca (Nameservers Privados)',
        language === 'en' ? 'Automated Client Provisioning & Billing Ready' : 'Compatible con aprovisionamiento y facturación',
        language === 'en' ? 'Free SSL for all your client accounts' : 'Certificados SSL Gratis para cada cliente',
        language === 'en' ? 'Overselling Protection & Quota Control' : 'Control exacto de cuotas de disco y ancho de banda'
      ],
      badge: language === 'en' ? 'Agencies & Devs' : 'Agencias & Partners'
    }
  ];

  const features = [
    {
      icon: <Cpu className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'NVMe PCIe 4.0 Storage' : 'Almacenamiento NVMe PCIe 4.0',
      desc: language === 'en'
        ? 'Over 10x faster than traditional SATA SSDs. Delivers up to 7,000 MB/s read/write speed for instant database queries.'
        : 'Más de 10x más rápido que SSDs tradicionales. Hasta 7,000 MB/s de lectura/escritura para consultas MariaDB y WordPress instantáneas.'
    },
    {
      icon: <Zap className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'LiteSpeed Web Server & HTTP/3' : 'LiteSpeed Web Server & HTTP/3',
      desc: language === 'en'
        ? 'Pre-configured with LSCache to serve pages in under 50ms TTFB and maximize Google Core Web Vitals scores.'
        : 'Optimizado con LSCache y protocolo QUIC / HTTP/3 para alcanzar un Time To First Byte (TTFB) inferior a 50ms y optimizar SEO.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'CloudLinux OS Isolation' : 'Aislamiento CloudLinux OS',
      desc: language === 'en'
        ? 'CageFS isolates each account so other tenants never consume your CPU, memory, or compromise your security.'
        : 'Cada cuenta corre en un contenedor virtual CageFS seguro. Ningún vecino en el servidor puede saturar tus recursos ni comprometer datos.'
    },
    {
      icon: <RefreshCw className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'Free Zero-Downtime Migration' : 'Migración Gratuita Zero-Downtime',
      desc: language === 'en'
        ? 'Our senior systems engineers migrate your websites, databases, and emails with zero interruption to your visitors.'
        : 'Nuestro equipo de ingenieros migra tu sitio web, bases de datos y cuentas de correo sin que tus clientes sufran caídas ni pérdidas.'
    },
    {
      icon: <Clock className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? '99.9% Uptime SLA Guaranteed' : 'Garantía SLA de 99.9% de Disponibilidad',
      desc: language === 'en'
        ? 'Enterprise Tier-III and Tier-IV redundant datacenter architecture with automatic hardware failover.'
        : 'Infraestructura redundante en centros de datos certificados Tier-III y Tier-IV con conmutación por error automatizada.'
    },
    {
      icon: <Layers className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'cPanel Control Panel' : 'Panel de Control cPanel Líder',
      desc: language === 'en'
        ? 'The industry-standard control panel with 1-click installers (Softaculous), phpMyAdmin, and cron jobs.'
        : 'El panel de control más confiable y potente del mundo con instalador de más de 400 aplicaciones (WordPress, PrestaShop) en 1 clic.'
    }
  ];

  return (
    <div className="bg-white text-[#070707] min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E2E5DA]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#DFF5B5]/25 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DFF5B5] border border-[#B9E86A] text-xs font-black tracking-wide text-[#070707] uppercase mb-5">
            <Sparkles size={14} className="text-[#070707]" />
            <span>{language === 'en' ? 'Ultra NVMe PCIe 4.0 Cloud Hosting' : 'Cloud Hosting NVMe de Alta Velocidad'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#070707] tracking-tight leading-tight max-w-4xl mx-auto">
            {language === 'en'
              ? 'Web Hosting built for extreme speed and zero downtime.'
              : 'Hosting web de alto rendimiento, escalable y sin caídas.'}
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#555A52] max-w-2xl mx-auto font-normal leading-relaxed">
            {language === 'en'
              ? 'Powered by 100% NVMe PCIe 4.0 storage, LiteSpeed Web Server, cPanel in Spanish, and automatic SSL certificates. View plans and order directly in the Banelio Store.'
              : 'Servidores optimizados con LiteSpeed Web Server, almacenamiento 100% NVMe PCIe 4.0, cPanel en español y certificados SSL automáticos. Consulta planes y contrata en la Tienda Banelio.'}
          </p>

          {/* Direct CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => openHostingStore('_blank')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#B9E86A] hover:bg-[#CBEF8A] text-[#070707] font-black text-sm px-6 py-3.5 rounded-xl shadow-xs transition-transform hover:scale-[1.02] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707]"
            >
              <span>{language === 'en' ? 'View Hosting Plans' : 'Ver Planes de Hosting'}</span>
              <ExternalLink size={16} />
            </button>
            <a
              href="https://wa.me/526601254107?text=Hola%20Banelio,%20deseo%20asesoria%20sobre%20planes%20de%20Hosting%20Web%20NVMe"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#F7F8F0] hover:bg-[#F1F3E8] border border-[#E2E5DA] text-[#070707] font-bold text-sm px-5 py-3.5 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707]"
            >
              <span>{language === 'en' ? 'Chat with Infrastructure Advisor' : 'Consultar por WhatsApp'}</span>
            </a>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#555A52]">
            <span className="flex items-center gap-1.5 font-medium">
              <Check size={14} className="text-[#070707] font-bold" />
              {language === 'en' ? '99.9% Uptime SLA' : 'SLA de 99.9% de Uptime'}
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Check size={14} className="text-[#070707] font-bold" />
              {language === 'en' ? 'Free Zero-Downtime Migration' : 'Migración 100% Gratuita'}
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Check size={14} className="text-[#070707] font-bold" />
              {language === 'en' ? '30-Day Satisfaction Guarantee' : 'Garantía de Satisfacción 30 Días'}
            </span>
          </div>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-4xl font-black text-[#070707] tracking-tight">
            {language === 'en' ? 'Select the Ideal Plan for Your Project' : 'Elige el Plan Perfecto para tu Proyecto'}
          </h2>
          <p className="mt-3 text-[#555A52] text-sm sm:text-base">
            {language === 'en'
              ? 'Final authoritative pricing, billing cycle selection, and order fulfillment are processed securely through our official commercial store.'
              : 'Los precios finales, la selección de ciclo y la contratación se completan de manera segura a través de nuestra plataforma comercial oficial.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 flex flex-col justify-between transition-all border ${
                plan.popular
                  ? 'border-[#070707] bg-white ring-2 ring-[#B9E86A] shadow-xl relative'
                  : 'border-[#E2E5DA] bg-[#F7F8F0]/40 hover:bg-white hover:border-[#070707] hover:shadow-md'
              }`}
            >
              <div>
                {plan.badge && (
                  <div className="inline-block bg-[#B9E86A] text-[#070707] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-3">
                    {plan.badge}
                  </div>
                )}
                <h3 className="text-xl font-black text-[#070707]">{plan.name}</h3>
                <p className="text-xs text-[#555A52] mt-1.5 leading-relaxed min-h-[36px]">
                  {plan.subtitle}
                </p>

                <div className="my-5 p-3 rounded-xl bg-white border border-[#E2E5DA] text-center">
                  <span className="text-xs font-bold text-[#070707] block">
                    {language === 'en' ? 'Banelio Commercial Catalog' : 'Catálogo Comercial Banelio'}
                  </span>
                  <span className="text-xs text-[#555A52]">
                    {language === 'en' ? 'Check real-time pricing & discounts' : 'Consulta precios y promociones'}
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-[#070707] pt-2 border-t border-[#E2E5DA]">
                  {plan.specs.map((spec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check size={14} className="text-[#070707] shrink-0 mt-0.5" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-[#E2E5DA]">
                <button
                  onClick={() => openHostingStore('_blank')}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.02] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707] ${
                    plan.popular
                      ? 'bg-[#B9E86A] hover:bg-[#CBEF8A] text-[#070707] shadow-xs'
                      : 'bg-[#070707] hover:bg-[#202020] text-[#FCFCF8]'
                  }`}
                >
                  <span>{language === 'en' ? 'Order Plan' : 'Contratar Plan'}</span>
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Technical Features */}
      <section className="py-20 bg-[#F7F8F0] border-t border-[#E2E5DA] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-4xl font-black text-[#070707] tracking-tight">
              {language === 'en'
                ? 'Engineering built for speed, resilience, and security'
                : 'Ingeniería diseñada para velocidad, resiliencia y seguridad'}
            </h2>
            <p className="mt-3 text-[#555A52] text-sm sm:text-base">
              {language === 'en'
                ? 'Discover the technologies behind Banelio\'s NVMe cloud infrastructure.'
                : 'Conoce los pilares tecnológicos que sustentan nuestra plataforma de alojamiento web.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl border border-[#E2E5DA] shadow-2xs hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-[#DFF5B5] flex items-center justify-center mb-4">
                  {feat.icon}
                </div>
                <h3 className="text-lg font-black text-[#070707] mb-2">{feat.title}</h3>
                <p className="text-xs sm:text-sm text-[#555A52] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>

          {/* Bottom Banner */}
          <div className="mt-16 bg-[#070707] text-[#FCFCF8] rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#B9E86A]/10 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-2xl sm:text-3xl font-black text-[#FCFCF8] tracking-tight">
              {language === 'en'
                ? 'Need a custom server or high-capacity deployment?'
                : '¿Necesitas un servidor dedicado o una configuración a medida?'}
            </h3>
            <p className="mt-3 text-sm text-[#D5D9CE] max-w-2xl mx-auto">
              {language === 'en'
                ? 'Talk to our infrastructure architects for enterprise clusters, private cloud, or migration assistance.'
                : 'Habla con nuestros arquitectos de infraestructura para clusters empresariales, nube privada o asistencia de migración.'}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => openHostingStore('_blank')}
                className="bg-[#B9E86A] hover:bg-[#CBEF8A] text-[#070707] font-black text-xs sm:text-sm px-6 py-3 rounded-xl transition-transform hover:scale-[1.02] cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707]"
              >
                <span>{language === 'en' ? 'Go to Banelio Store' : 'Ir a la Tienda Banelio'}</span>
                <ExternalLink size={14} />
              </button>
              <a
                href="mailto:try@banelio.com?subject=Consulta%20Servidor%20Personalizado%20Banelio"
                className="bg-[#141414] hover:bg-[#202020] border border-[#555A52] text-[#FCFCF8] font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9E86A]"
              >
                try@banelio.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
