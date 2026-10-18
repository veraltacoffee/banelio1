import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Server,
  Mail,
  ShieldCheck,
  Layout,
  TrendingUp,
  Users,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Zap,
  Globe2,
  Lock,
  Headphones
} from 'lucide-react';
import { openHostingStore, openEmailStore, openSslStore } from '../../services/supersiteService';

interface HomeServicesGridProps {
  onNavigate: (route: string) => void;
}

export default function HomeServicesGrid({ onNavigate }: HomeServicesGridProps) {
  const { language } = useApp();

  const services = [
    {
      id: 'hosting',
      badge: language === 'en' ? 'Cloud Performance' : 'Alto Rendimiento',
      title: language === 'en' ? 'Cloud SSD Web Hosting' : 'Hosting Cloud de Alta Velocidad',
      desc: language === 'en'
        ? 'High-speed solid-state cloud storage, cPanel in Spanish, automated backups, and free auto-SSL certificates.'
        : 'Almacenamiento Cloud SSD de alta velocidad, panel cPanel en español, copias periódicas y certificados SSL gratuitos.',
      icon: <Server className="w-6 h-6 text-[#070707]" />,
      route: '/hosting',
      externalAction: () => openHostingStore('_blank'),
      actionLabel: language === 'en' ? 'View Hosting Plans' : 'Ver Planes de Hosting',
      popular: true
    },
    {
      id: 'email',
      badge: language === 'en' ? 'Corporate Sovereignty' : 'Imagen Profesional',
      title: language === 'en' ? 'Business Email @yourbrand' : 'Correo Corporativo Pro',
      desc: language === 'en'
        ? 'Build authority with @yourbrand.com. Titan Email, Google Workspace, and Microsoft 365 with SPF/DKIM/DMARC preconfigured.'
        : 'Proyecta legitimidad con @tuempresa.com. Titan Email, Google Workspace y Microsoft 365 con SPF/DKIM/DMARC preconfigurados.',
      icon: <Mail className="w-6 h-6 text-[#070707]" />,
      route: '/email',
      externalAction: () => openEmailStore('_blank'),
      actionLabel: language === 'en' ? 'Explore Email Plans' : 'Ver Planes de Correo',
      popular: false
    },
    {
      id: 'ssl',
      badge: language === 'en' ? 'Encryption & Trust' : 'Cifrado & Confianza',
      title: language === 'en' ? 'Accredited SSL Certificates' : 'Certificados SSL Acreditados',
      desc: language === 'en'
        ? 'Activate the green padlock, protect payment transactions, eliminate browser security warnings, and boost Google SEO rankings.'
        : 'Activa el candado HTTPS seguro, blinda transacciones de tarjeta, elimina advertencias rojas en Chrome y sube en Google.',
      icon: <ShieldCheck className="w-6 h-6 text-[#070707]" />,
      route: '/ssl',
      externalAction: () => openSslStore('_blank'),
      actionLabel: language === 'en' ? 'View SSL Certificates' : 'Ver Certificados SSL',
      popular: false
    },
    {
      id: 'web',
      badge: language === 'en' ? 'Tailored Engineering' : 'A la Medida',
      title: language === 'en' ? 'Custom Web Design' : 'Diseño & Desarrollo Web',
      desc: language === 'en'
        ? 'High-converting landing pages, eCommerce stores, and corporate websites built for sub-second speeds and mobile responsiveness.'
        : 'Landing pages de alta conversión, tiendas online y portales corporativos optimizados para velocidad y Core Web Vitals.',
      icon: <Layout className="w-6 h-6 text-[#070707]" />,
      route: '/diseno-web',
      actionLabel: language === 'en' ? 'Request Web Quote' : 'Cotizar Diseño Web',
      popular: false
    },
    {
      id: 'seo',
      badge: language === 'en' ? 'Organic Visibility' : 'Posicionamiento Orgánico',
      title: language === 'en' ? 'SEO Growth Services' : 'SEO & Posicionamiento',
      desc: language === 'en'
        ? 'Technical audits, on-page architecture, high-intent keyword strategy, and local search dominance on Google Maps.'
        : 'Auditorías técnicas, optimización on-page, estrategia de palabras clave transaccionales y posicionamiento local en Google Maps.',
      icon: <TrendingUp className="w-6 h-6 text-[#070707]" />,
      route: '/seo',
      actionLabel: language === 'en' ? 'Explore SEO Services' : 'Ver Servicios SEO',
      popular: false
    },
    {
      id: 'affiliates',
      badge: language === 'en' ? 'Partner Ecosystem' : 'Ecosistema de Partners',
      title: language === 'en' ? 'Affiliates & Partners' : 'Afiliados & Partners',
      desc: language === 'en'
        ? 'Earn 10% commission on referred clients through your unique affiliate link or promo code.'
        : 'Gana el 10% de comisión en clientes referidos mediante tu enlace exclusivo o código de descuento.',
      icon: <Users className="w-6 h-6 text-[#070707]" />,
      route: '/afiliados',
      actionLabel: language === 'en' ? 'Discover Program' : 'Conocer Programa',
      popular: false
    }
  ];

  const highlights = [
    {
      icon: <Zap className="w-5 h-5 text-[#070707]" />,
      title: language === 'en' ? 'Cloud Performance' : 'Alto Rendimiento Cloud',
      desc: language === 'en' ? 'Fast solid-state cloud architecture' : 'Almacenamiento de alta velocidad'
    },
    {
      icon: <Globe2 className="w-5 h-5 text-[#070707]" />,
      title: language === 'en' ? '400+ Global TLDs' : 'Más de 400 TLDs',
      desc: language === 'en' ? 'Accredited domain registration' : 'Registro de dominios acreditado'
    },
    {
      icon: <Lock className="w-5 h-5 text-[#070707]" />,
      title: language === 'en' ? 'WHOIS Privacy' : 'Privacidad WHOIS',
      desc: language === 'en' ? 'Identity data protection' : 'Protección de datos personales'
    },
    {
      icon: <Headphones className="w-5 h-5 text-[#070707]" />,
      title: language === 'en' ? '24/7 Expert Support' : 'Soporte 24/7 en Español',
      desc: language === 'en' ? 'Direct WhatsApp, phone & email' : 'WhatsApp, teléfono y correo directo'
    }
  ];

  return (
    <section className="py-20 bg-white border-t border-[#E2E5DA] px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DFF5B5] border border-[#B9E86A] text-xs font-black tracking-wide text-[#070707] uppercase mb-4">
            <Sparkles size={13} className="text-[#070707]" />
            <span>{language === 'en' ? 'Complete Digital Portfolio' : 'Catálogo Comercial Integral'}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#070707] tracking-tight">
            {language === 'en'
              ? 'Everything your business needs to grow on the internet.'
              : 'Todo lo que tu marca necesita para crecer en internet.'}
          </h2>

          <p className="mt-4 text-sm sm:text-base text-[#555A52] leading-relaxed">
            {language === 'en'
              ? 'From global domain registration and enterprise NVMe hosting to custom web development and Google SEO dominance.'
              : 'Desde el registro de dominios y hosting NVMe de alta velocidad hasta desarrollo web profesional y posicionamiento SEO.'}
          </p>
        </div>

        {/* 6-Card Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {services.map((svc) => (
            <div
              key={svc.id}
              className={`rounded-2xl p-7 flex flex-col justify-between transition-all border ${
                svc.popular
                  ? 'border-[#070707] bg-white ring-2 ring-[#B9E86A] shadow-xl relative'
                  : 'border-[#E2E5DA] bg-[#F7F8F0]/40 hover:bg-white hover:border-[#070707] hover:shadow-lg'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#B9E86A] flex items-center justify-center">
                    {svc.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#070707] text-[#FCFCF8]">
                    {svc.badge}
                  </span>
                </div>

                <h3 className="text-xl font-black text-[#070707] mb-2">{svc.title}</h3>
                <p className="text-xs sm:text-sm text-[#555A52] leading-relaxed mb-6">
                  {svc.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-[#E2E5DA] flex items-center justify-between gap-2">
                <button
                  onClick={() => onNavigate(svc.route)}
                  className="text-xs font-black text-[#070707] hover:underline flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#070707]"
                >
                  <span>{language === 'en' ? 'Learn More' : 'Conocer Más'}</span>
                  <ArrowRight size={13} />
                </button>

                {svc.externalAction ? (
                  <button
                    onClick={svc.externalAction}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#B9E86A] hover:bg-[#CBEF8A] text-[#070707] text-xs font-black transition-transform hover:scale-[1.02] cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707]"
                  >
                    <span>{svc.actionLabel}</span>
                    <ExternalLink size={12} />
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate(svc.route)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#070707] hover:bg-[#202020] text-[#FCFCF8] text-xs font-bold transition-transform hover:scale-[1.02] cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9E86A]"
                  >
                    <span>{svc.actionLabel}</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Value Highlights */}
        <div className="mt-16 pt-12 border-t border-[#E2E5DA] grid grid-cols-2 md:grid-cols-4 gap-6">
          {highlights.map((hl, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#DFF5B5] flex items-center justify-center shrink-0">
                {hl.icon}
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-[#070707]">{hl.title}</h4>
                <p className="text-[11px] text-[#555A52] mt-0.5 leading-snug">{hl.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
