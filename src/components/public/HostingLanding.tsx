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
      subtitle: language === 'en' ? 'For personal blogs, landing pages & initial websites' : 'Para sitios personales, blogs y primeros proyectos web',
      popular: false,
      specs: [
        language === 'en' ? '1 Hosted Website' : '1 Sitio Web alojado',
        language === 'en' ? '10 GB Cloud SSD Storage' : '10 GB Almacenamiento Cloud SSD',
        language === 'en' ? '5 Professional Business Email Accounts' : '5 Cuentas de Correo Corporativo',
        language === 'en' ? 'Free Auto-SSL Certificate' : 'Certificado SSL Gratis automático',
        language === 'en' ? 'High-Performance Web Server with Caching' : 'Servidor Web de alto rendimiento con soporte de caché',
        language === 'en' ? 'cPanel Control Panel in Spanish' : 'Panel de Control cPanel en Español',
        language === 'en' ? 'Unmetered Monthly Bandwidth' : 'Transferencia mensual sin límite medido',
        language === 'en' ? 'Automated Periodic Backups' : 'Copias de seguridad periódicas automatizadas'
      ],
      badge: null
    },
    {
      id: 'pro',
      name: language === 'en' ? 'Cloud Pro Business' : 'Cloud Pro Empresarial',
      subtitle: language === 'en' ? 'Recommended for growing businesses, catalogs & stores' : 'Recomendado para empresas y sitios con múltiples dominios',
      popular: true,
      specs: [
        language === 'en' ? 'Multiple / Unlimited Hosted Websites' : 'Sitios Web Múltiples / Ilimitados',
        language === 'en' ? '50 GB Cloud SSD Storage' : '50 GB Almacenamiento Cloud SSD',
        language === 'en' ? 'Professional Email Accounts included' : 'Cuentas de Correo Corporativo incluidas',
        language === 'en' ? 'Free SSL for all your hosted domains' : 'Certificados SSL Gratis para tus dominios',
        language === 'en' ? 'CloudLinux OS Isolation (Account Protection)' : 'Aislamiento CloudLinux OS (Entorno protegido por cuenta)',
        language === 'en' ? 'Automated Backups with cPanel 1-Click Restore' : 'Backups automatizados con restauración en cPanel',
        language === 'en' ? '1-Click Application Installer (WordPress, etc.)' : 'Instalador de más de 400 aplicaciones en 1 clic',
        language === 'en' ? 'Assisted Website Migration Available' : 'Asistencia en migración web disponible'
      ],
      badge: language === 'en' ? 'Most Popular' : 'Más Recomendado'
    },
    {
      id: 'elite',
      name: 'Cloud Elite Turbo',
      subtitle: language === 'en' ? 'Enhanced computing resources for heavy traffic and commerce' : 'Recursos ampliados para sitios con alto volumen de visitas y agencias',
      popular: false,
      specs: [
        language === 'en' ? 'Unlimited Hosted Websites' : 'Sitios Web Ilimitados',
        language === 'en' ? '150 GB Cloud SSD Storage' : '150 GB Almacenamiento Cloud SSD',
        language === 'en' ? 'Expanded CPU & RAM allocation limits' : 'Límites ampliados de memoria RAM y procesamiento',
        language === 'en' ? 'High-Volume Professional Mailboxes' : 'Buzones de Correo Corporativo de alta capacidad',
        language === 'en' ? 'Optimized Server Cache for Faster TTFB' : 'Caché de servidor optimizada para menor TTFB',
        language === 'en' ? 'Automated Backups & File Manager' : 'Copias de seguridad y administrador de archivos cPanel',
        language === 'en' ? 'Priority Technical Support' : 'Soporte Técnico Especializado Prioritario'
      ],
      badge: null
    },
    {
      id: 'reseller',
      name: 'Hosting Reseller WHM',
      subtitle: language === 'en' ? 'Launch your own hosting brand with cPanel & WHM' : 'Gestiona y revende cuentas de hosting con tu propia marca',
      popular: false,
      specs: [
        language === 'en' ? 'Up to 50 Independent cPanel Client Accounts' : 'Hasta 50 Cuentas cPanel independientes',
        language === 'en' ? '250 GB High-Performance Storage' : '250 GB Espacio de almacenamiento asignable',
        language === 'en' ? 'Full WebHost Manager (WHM) Access' : 'Acceso completo a WebHost Manager (WHM)',
        language === 'en' ? '100% White-Label (Custom Private Nameservers)' : '100% Marca Blanca con Nameservers Privados',
        language === 'en' ? 'Free Auto-SSL for all your client accounts' : 'Certificados SSL Gratis para cada cliente',
        language === 'en' ? 'Disk Quota & Bandwidth Management' : 'Gestión personalizada de cuotas de disco y transferencia'
      ],
      badge: language === 'en' ? 'Agencies & Devs' : 'Agencias & Partners'
    }
  ];

  const features = [
    {
      icon: <Cpu className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'High-Speed Cloud SSD Storage' : 'Almacenamiento Cloud SSD de Alta Velocidad',
      desc: language === 'en'
        ? 'Solid-state drives configured in redundant arrays for fast database queries and smooth dynamic page generation.'
        : 'Discos de estado sólido en matrices redundantes que aceleran las consultas a bases de datos y la carga de páginas dinámicas.'
    },
    {
      icon: <Zap className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'Optimized Web Server & Caching' : 'Servidor Web Optimizado & Caché',
      desc: language === 'en'
        ? 'Pre-configured caching layers designed to minimize server latency and deliver pages swiftly to visitors.'
        : 'Capas de aceleración y compresión preconfiguradas para reducir el tiempo de respuesta del servidor (TTFB).'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'CloudLinux Operating System' : 'Aislamiento CloudLinux OS',
      desc: language === 'en'
        ? 'CageFS isolates each tenant account, ensuring stable resource distribution and preventing noisy neighbor interference.'
        : 'Tecnología CageFS que aísla de forma segura cada cuenta para garantizar la estabilidad de los recursos asignados.'
    },
    {
      icon: <RefreshCw className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'Assisted Website Migration' : 'Asistencia en Migración Web',
      desc: language === 'en'
        ? 'Our technical support team assists you with migrating website files, databases, and mailboxes from your previous host.'
        : 'Nuestro equipo de soporte técnico te orienta en el proceso de migración de archivos, bases de datos y correos.'
    },
    {
      icon: <Clock className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'High Availability Architecture' : 'Infraestructura de Alta Disponibilidad',
      desc: language === 'en'
        ? 'Enterprise cloud infrastructure engineered for robust operational stability and business continuity.'
        : 'Infraestructura en la nube con monitoreo permanente diseñada para ofrecer máxima continuidad operativa.'
    },
    {
      icon: <Layers className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'Industry-Standard cPanel' : 'Panel de Control cPanel Líder',
      desc: language === 'en'
        ? 'Intuitive graphical interface for managing domains, subdomains, email accounts, databases, and SSL certificates.'
        : 'Interfaz gráfica intuitiva para administrar fácilmente dominios, correos, bases de datos MariaDB y certificados SSL.'
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
            <span>{language === 'en' ? 'Cloud Web Hosting Solutions' : 'Alojamiento Web Cloud de Alto Rendimiento'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#070707] tracking-tight leading-tight max-w-4xl mx-auto">
            {language === 'en'
              ? 'Web Hosting built for high performance, stability, and scale.'
              : 'Hosting web de alto rendimiento, escalable y confiable.'}
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#555A52] max-w-2xl mx-auto font-normal leading-relaxed">
            {language === 'en'
              ? 'Equipped with fast solid-state cloud storage, cPanel control panel, automated free SSL, and professional business email. Select your plan and contract securely in the Banelio Store.'
              : 'Equipado con almacenamiento cloud de alta velocidad, panel cPanel en español, certificados SSL automáticos y cuentas de correo corporativo. Consulta planes y contrata en la Tienda Banelio.'}
          </p>

          {/* Direct CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => openHostingStore('_blank')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#B9E86A] hover:bg-[#CBEF8A] text-[#070707] font-black text-sm px-6 py-3.5 rounded-xl shadow-xs transition-transform hover:scale-[1.02] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707]"
            >
              <span>{language === 'en' ? 'View Hosting Plans in Store' : 'Ver Planes de Hosting en la Tienda'}</span>
              <ExternalLink size={16} />
            </button>
            <a
              href="https://wa.me/526601254107?text=Hola%20Banelio,%20deseo%20asesoria%20sobre%20planes%20de%20Hosting%20Web"
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
              {language === 'en' ? 'High Availability Cloud' : 'Alta Disponibilidad Cloud'}
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Check size={14} className="text-[#070707] font-bold" />
              {language === 'en' ? 'cPanel Control Panel' : 'Panel cPanel en Español'}
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Check size={14} className="text-[#070707] font-bold" />
              {language === 'en' ? 'Expert Technical Support' : 'Soporte Técnico Especializado'}
            </span>
          </div>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-4xl font-black text-[#070707] tracking-tight">
            {language === 'en' ? 'Select the Ideal Plan for Your Project' : 'Elige el Plan Adecuado para tu Proyecto'}
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
                    {language === 'en' ? 'Check real-time pricing & discounts' : 'Consulta precios y promociones en tienda'}
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
                  <span>{language === 'en' ? 'Order Plan in Store' : 'Ver y Contratar Plan'}</span>
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
                ? 'Discover the technologies behind Banelio\'s cloud hosting infrastructure.'
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
                ? 'Need guidance choosing the right hosting setup?'
                : '¿Necesitas asesoría para elegir el plan adecuado?'}
            </h3>
            <p className="mt-3 text-sm text-[#D5D9CE] max-w-2xl mx-auto">
              {language === 'en'
                ? 'Consult with our infrastructure team for custom migrations, high-capacity sites, or reseller setups.'
                : 'Habla con nuestros asesores de infraestructura para migraciones, proyectos de alto tráfico o configuración reseller.'}
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
                href="mailto:try@banelio.com?subject=Consulta%20Hosting%20Banelio"
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
