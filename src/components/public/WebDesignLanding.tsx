import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Layout,
  Smartphone,
  Zap,
  ShoppingBag,
  Sparkles,
  Check,
  ArrowRight,
  Code2,
  Search,
  MessageSquare,
  Palette
} from 'lucide-react';

export default function WebDesignLanding() {
  const { language } = useApp();

  const services = [
    {
      title: language === 'en' ? 'High-Conversion Landing Pages' : 'Landing Pages de Alta Conversión',
      tagline: language === 'en' ? 'Designed specifically to maximize ROI on Google & Meta Ads campaigns' : 'Diseñadas para maximizar el retorno de inversión en campañas publicitarias',
      features: [
        language === 'en' ? 'Ultra-fast load time (under 1.5 seconds)' : 'Carga ultra rápida (menos de 1.5s)',
        language === 'en' ? 'Direct WhatsApp & CRM lead integration' : 'Integración directa con WhatsApp y CRM',
        language === 'en' ? 'A/B testing ready and conversion copywriting' : 'Estructura orientada a la venta y copywriting persuasivo',
        language === 'en' ? 'Pixel tracking (Meta, Google Tag Manager)' : 'Instalación de píxeles de medición y analítica'
      ]
    },
    {
      title: language === 'en' ? 'Corporate & Business Websites' : 'Sitios Web Corporativos e Institucionales',
      tagline: language === 'en' ? 'Establish an authoritative digital presence that reflects your brand prestige' : 'Presencia institucional sólida y moderna que proyecta solidez ante clientes y bancos',
      features: [
        language === 'en' ? 'Multi-page architecture with custom branding' : 'Estructura multipágina a la medida de tu modelo de negocio',
        language === 'en' ? '100% responsive for smartphones, tablets & desktops' : '100% adaptable a teléfonos, tablets y computadoras',
        language === 'en' ? 'Built-in technical SEO on-page and Schema.org' : 'Optimización SEO on-page y marcado Schema.org desde el código',
        language === 'en' ? 'Corporate email & contact form integration' : 'Formularios interactivos conectados a tu correo corporativo'
      ]
    },
    {
      title: language === 'en' ? 'eCommerce & Online Stores' : 'Tiendas Online & Comercio Electrónico',
      tagline: language === 'en' ? 'Sell your physical or digital products 24/7 with seamless checkout' : 'Vende productos físicos o digitales las 24 horas con pasarelas de pago seguras',
      features: [
        language === 'en' ? 'Stripe, PayPal, and regional payment integrations' : 'Integración con tarjetas de crédito, débito, PayPal y pagos locales',
        language === 'en' ? 'Automated inventory, shipping & tax calculations' : 'Gestión automatizada de inventario, envíos e impuestos',
        language === 'en' ? 'Optimized cart flow for mobile conversion' : 'Checkout optimizado para compras rápidas en smartphones',
        language === 'en' ? 'Automated order notification emails' : 'Notificaciones por correo de confirmación de pedido'
      ]
    }
  ];

  const processSteps = [
    {
      step: '01',
      title: language === 'en' ? 'Discovery & Strategy' : 'Descubrimiento & Estrategia',
      desc: language === 'en'
        ? 'We analyze your target audience, competitors, and commercial goals to craft the ideal site structure.'
        : 'Analizamos a fondo tu nicho, tus ventajas competitivas y tus objetivos de negocio para diseñar la arquitectura adecuada.'
    },
    {
      step: '02',
      title: language === 'en' ? 'UI/UX Design & Branding' : 'Diseño UI/UX & Identidad',
      desc: language === 'en'
        ? 'We design modern, unique visual interfaces that align with your brand typography and color palette.'
        : 'Creamos maquetas y prototipos modernos alineados a la identidad visual y tipográfica de tu marca.'
    },
    {
      step: '03',
      title: language === 'en' ? 'Agile Development' : 'Desarrollo & Optimización',
      desc: language === 'en'
        ? 'Clean, semantic code optimized for Core Web Vitals, mobile responsiveness, and instantaneous loading.'
        : 'Programación limpia, semántica y ligera con tiempos de carga inferiores a 2 segundos y Core Web Vitals en verde.'
    },
    {
      step: '04',
      title: language === 'en' ? 'Launch & Training' : 'Lanzamiento & Soporte',
      desc: language === 'en'
        ? 'We deploy to Banelio NVMe cloud hosting, configure DNS & SSL, and train your team on managing content.'
        : 'Publicamos en la nube NVMe de Banelio, configuramos DNS y SSL, y te entregamos la documentación completa.'
    }
  ];

  return (
    <div className="bg-white text-[#070707] min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#8A8F98]/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#B8F23A]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B8F23A]/25 border border-[#B8F23A] text-xs font-black tracking-wide text-[#070707] uppercase mb-5">
            <Layout size={14} className="text-[#070707]" />
            <span>{language === 'en' ? 'Custom Web Design & Engineering' : 'Diseño Web Profesional a Medida'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#070707] tracking-tight leading-tight max-w-4xl mx-auto">
            {language === 'en'
              ? 'Websites crafted to elevate your brand and generate real sales.'
              : 'Sitios web diseñados para proyectar tu marca y generar ventas reales.'}
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#555A52] max-w-2xl mx-auto font-normal leading-relaxed">
            {language === 'en'
              ? 'We develop high-performance corporate portals, eCommerce stores, and conversion landing pages optimized for speed and SEO rankings.'
              : 'Desarrollamos portales corporativos, tiendas e-commerce y landing pages de alta conversión optimizadas para Google PageSpeed y posicionamiento SEO.'}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://wa.me/526601254107?text=Hola%20Banelio,%20deseo%20una%20cotizacion%20de%20Diseno%20Web%20Profesional"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#B8F23A] hover:bg-[#a6dc32] text-[#070707] font-black text-sm px-6 py-3.5 rounded-xl shadow-xs transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <MessageSquare size={16} />
              <span>{language === 'en' ? 'Request Custom Proposal on WhatsApp' : 'Solicitar Cotización por WhatsApp'}</span>
            </a>
            <a
              href="mailto:try@banelio.com?subject=Cotizacion%20Diseno%20Web%20Banelio"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#F7F8F0] hover:bg-[#eaede0] border border-[#8A8F98] text-[#070707] font-bold text-sm px-5 py-3.5 rounded-xl transition-colors cursor-pointer"
            >
              <span>{language === 'en' ? 'Email Brief to try@banelio.com' : 'Enviar Requerimientos por Email'}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-4xl font-black text-[#070707] tracking-tight">
            {language === 'en' ? 'Tailored Web Solutions' : 'Soluciones de Desarrollo a la Medida'}
          </h2>
          <p className="mt-3 text-[#555A52] text-sm sm:text-base">
            {language === 'en'
              ? 'Every business requires a distinct digital architecture. We build solutions adapted to your exact needs.'
              : 'Cada empresa requiere una presencia digital distinta. Construimos la solución exacta que tu estrategia necesita.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {services.map((svc, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-7 border border-[#8A8F98]/40 shadow-xs hover:border-[#070707] hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#B8F23A] flex items-center justify-center mb-4">
                  {idx === 0 ? <Zap className="w-6 h-6 text-[#070707]" /> : idx === 1 ? <Layout className="w-6 h-6 text-[#070707]" /> : <ShoppingBag className="w-6 h-6 text-[#070707]" />}
                </div>
                <h3 className="text-2xl font-black text-[#070707]">{svc.title}</h3>
                <p className="text-xs text-[#555A52] mt-2 leading-relaxed min-h-[36px]">
                  {svc.tagline}
                </p>

                <ul className="space-y-3 text-xs text-[#070707] mt-6 pt-4 border-t border-[#8A8F98]/20">
                  {svc.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2.5">
                      <Check size={14} className="text-[#070707] shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-[#8A8F98]/20">
                <a
                  href={`https://wa.me/526601254107?text=Hola%20Banelio,%20me%20interesa%20el%20servicio%20de%20${encodeURIComponent(svc.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-black bg-[#070707] hover:bg-[#202020] text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer"
                >
                  <span>{language === 'en' ? 'Get a Quote for this Service' : 'Cotizar este Servicio'}</span>
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Methodology */}
      <section className="py-20 bg-[#F7F8F0] border-t border-[#8A8F98]/20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-4xl font-black text-[#070707] tracking-tight">
              {language === 'en' ? 'Our 4-Step Engineering Process' : 'Metodología de Trabajo en 4 Pasos'}
            </h2>
            <p className="mt-3 text-[#555A52] text-sm sm:text-base">
              {language === 'en'
                ? 'From first briefing to launch, we ensure transparent communication and zero surprises.'
                : 'Desde la primera reunión hasta el despliegue final, con comunicación clara y entregables puntuales.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-[#8A8F98]/30 shadow-2xs">
                <div className="text-2xl font-black text-[#B8F23A] mb-2 font-mono">{step.step}</div>
                <h3 className="text-base font-black text-[#070707] mb-2">{step.title}</h3>
                <p className="text-xs text-[#555A52] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
