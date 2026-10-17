import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  Search,
  Target,
  BarChart3,
  Check,
  ArrowRight,
  ExternalLink,
  Sparkles,
  MapPin,
  FileSearch,
  Layers,
  MessageSquare
} from 'lucide-react';

export default function SeoLanding() {
  const { language } = useApp();

  const seoPillars = [
    {
      icon: <FileSearch className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'Comprehensive Technical Audit' : 'Auditoría SEO Técnica Exhaustiva',
      desc: language === 'en'
        ? 'Deep analysis of crawlability, indexing errors, Core Web Vitals, redirect chains, canonical tags, and structured JSON-LD.'
        : 'Analizamos rastreo de Googlebot, errores de indexación, Core Web Vitals, redirecciones, etiquetas canónicas y marcado JSON-LD.'
    },
    {
      icon: <Target className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'High-Intent Keyword Strategy' : 'Estrategia de Palabras Clave Transaccionales',
      desc: language === 'en'
        ? 'Target terms with real commercial purchase intent rather than vanity traffic, bringing qualified leads ready to convert.'
        : 'Nos enfocamos en términos con intención real de compra y no en tráfico vano, atrayendo prospectos listos para contratar.'
    },
    {
      icon: <Layers className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'On-Page & Semantic Architecture' : 'Optimización On-Page & Arquitectura Semántica',
      desc: language === 'en'
        ? 'Perfecting titles, meta descriptions, heading hierarchies, URL structures, and internal linking to maximize relevancy.'
        : 'Optimizamos títulos, metadescripciones, jerarquías H1-H6, estructura de URLs y enlazado interno para maximizar relevancia.'
    },
    {
      icon: <MapPin className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'Local SEO & Google Maps' : 'SEO Local & Google Business Profile',
      desc: language === 'en'
        ? 'Dominate local search in your city and state. Capture customers actively searching for nearby services on mobile devices.'
        : 'Domina los resultados locales en tu ciudad. Capta clientes que buscan servicios en Google Maps desde sus celulares.'
    }
  ];

  const benefits = [
    language === 'en' ? 'Sustainable organic traffic that doesn\'t stop when ad budgets pause' : 'Tráfico orgánico sostenible que no desaparece al pausar la inversión en anuncios',
    language === 'en' ? 'High return on investment (ROI) compared to paid clicks' : 'Mayor retorno de inversión (ROI) a mediano y largo plazo que el pago por clic',
    language === 'en' ? 'Transparent monthly reporting via Google Search Console & GA4' : 'Reportes mensuales transparentes basados en Google Search Console y GA4',
    language === 'en' ? 'Fast NVMe hosting synergy: TTFB < 50ms gives an immediate ranking boost' : 'Sinergia directa con Hosting NVMe: la velocidad extrema impulsa el ranking'
  ];

  return (
    <div className="bg-white text-[#070707] min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#8A8F98]/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#B8F23A]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B8F23A]/25 border border-[#B8F23A] text-xs font-black tracking-wide text-[#070707] uppercase mb-5">
            <TrendingUp size={14} className="text-[#070707]" />
            <span>{language === 'en' ? 'Organic Search Engine Optimization' : 'Posicionamiento Orgánico en Google (SEO)'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#070707] tracking-tight leading-tight max-w-4xl mx-auto">
            {language === 'en'
              ? 'Reach the first page of Google and dominate your market.'
              : 'Alcanza la primera página de Google y lidera las búsquedas de tu sector.'}
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#555A52] max-w-2xl mx-auto font-normal leading-relaxed">
            {language === 'en'
              ? 'Proven technical SEO, content optimization, and local search strategies that attract qualified buyers searching for what you offer.'
              : 'Metodología rigurosa de SEO técnico, optimización de contenidos y autoridad que atrae prospectos calificados en el momento exacto en que buscan tus servicios.'}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://wa.me/526601254107?text=Hola%20Banelio,%20solicito%20una%20auditoria%20SEO%20para%20mi%20sitio%20web"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#B8F23A] hover:bg-[#a6dc32] text-[#070707] font-black text-sm px-6 py-3.5 rounded-xl shadow-xs transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <MessageSquare size={16} />
              <span>{language === 'en' ? 'Request Free SEO Audit on WhatsApp' : 'Solicitar Auditoría SEO Gratuita'}</span>
            </a>
            <a
              href="mailto:try@banelio.com?subject=Solicitud%20Auditoria%20SEO%20Banelio"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#F7F8F0] hover:bg-[#eaede0] border border-[#8A8F98] text-[#070707] font-bold text-sm px-5 py-3.5 rounded-xl transition-colors cursor-pointer"
            >
              <span>{language === 'en' ? 'Email Brief to try@banelio.com' : 'Consultar por Email'}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Pillars Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-4xl font-black text-[#070707] tracking-tight">
            {language === 'en' ? 'The 4 Pillars of Sustainable Ranking' : 'Los 4 Pilares del Posicionamiento Orgánico'}
          </h2>
          <p className="mt-3 text-[#555A52] text-sm sm:text-base">
            {language === 'en'
              ? 'We don\'t use obsolete tricks or black-hat tactics. We build long-term search equity that Google rewards.'
              : 'Sin trucos obsoletos ni prácticas penalizables. Construimos autoridad y relevancia sólida que Google premia permanentemente.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {seoPillars.map((pillar, idx) => (
            <div
              key={idx}
              className="bg-white p-7 rounded-2xl border border-[#8A8F98]/40 shadow-xs hover:border-[#070707] hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-[#B8F23A] flex items-center justify-center mb-4">
                {pillar.icon}
              </div>
              <h3 className="text-lg font-black text-[#070707] mb-2">{pillar.title}</h3>
              <p className="text-xs text-[#555A52] leading-relaxed">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-[#F7F8F0] border-t border-[#8A8F98]/20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-[#070707]">
              {language === 'en' ? 'Why Invest in SEO with Banelio?' : '¿Por qué contratar SEO con Banelio?'}
            </h2>
          </div>

          <div className="space-y-4">
            {benefits.map((b, i) => (
              <div key={i} className="bg-white p-5 rounded-xl border border-[#8A8F98]/30 flex items-start gap-3">
                <Check size={18} className="text-[#070707] shrink-0 mt-0.5" />
                <span className="text-sm font-semibold text-[#070707]">{b}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <a
              href="https://wa.me/526601254107?text=Hola%20Banelio,%20deseo%20asesoria%20sobre%20el%20servicio%20de%20SEO"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#070707] hover:bg-[#202020] text-white font-black text-sm px-8 py-3.5 rounded-xl transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <span>{language === 'en' ? 'Talk to an SEO Specialist' : 'Hablar con un Especialista SEO'}</span>
              <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
