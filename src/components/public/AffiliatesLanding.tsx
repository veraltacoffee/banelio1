import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  DollarSign,
  TrendingUp,
  Percent,
  Check,
  ArrowRight,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Zap,
  Gift
} from 'lucide-react';

export default function AffiliatesLanding() {
  const { language } = useApp();

  const affiliateBenefits = [
    {
      icon: <Percent className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'Up to 30% Recurring Commissions' : 'Hasta 30% de Comisión Recurrente',
      desc: language === 'en'
        ? 'Earn every time a client orders or renews their NVMe cloud hosting, domain, or corporate email services.'
        : 'Recibe comisiones atractivas por cada cliente que contrate o renueve planes de hosting cloud, dominios y correos.'
    },
    {
      icon: <Zap className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? '60-Day Cookie Tracking' : 'Cookies de Rastreo de 60 Días',
      desc: language === 'en'
        ? 'Your referral link keeps attribution active for 60 days, ensuring you get credited even if the user buys later.'
        : 'Tu enlace de referido mantiene el rastreo activo por 60 días para que no pierdas ninguna venta.'
    },
    {
      icon: <DollarSign className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'Punctual Monthly Payouts' : 'Liquidaciones Mensuales Puntuales',
      desc: language === 'en'
        ? 'Request automated payouts via PayPal or direct bank transfer (SPEI in Mexico) with low withdrawal thresholds.'
        : 'Cobros puntuales mes con mes a través de PayPal o transferencia bancaria directa (SPEI en México).'
    },
    {
      icon: <Gift className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'Marketing Kit & Banners' : 'Material Publicitario & Banners',
      desc: language === 'en'
        ? 'Ready-to-use creative banners, coupon codes, and text links for your blog, YouTube channel, or agency.'
        : 'Banners profesionales, enlaces de texto y códigos de descuento para compartir con tu comunidad.'
    }
  ];

  const steps = [
    {
      num: '1',
      title: language === 'en' ? 'Sign Up for Free' : 'Regístrate Gratis',
      desc: language === 'en' ? 'Submit your partner application in under 2 minutes.' : 'Completa tu solicitud de afiliado en menos de 2 minutos.'
    },
    {
      num: '2',
      title: language === 'en' ? 'Share Your Link' : 'Comparte tu Enlace',
      desc: language === 'en' ? 'Recommend Banelio on your blog, social media, or to clients.' : 'Recomienda Banelio en tu sitio web, canal o a tus clientes.'
    },
    {
      num: '3',
      title: language === 'en' ? 'Earn Recurring Income' : 'Genera Ingresos Recurrentes',
      desc: language === 'en' ? 'Watch your commissions grow with every sale and renewal.' : 'Recibe tus comisiones acumuladas directamente en tu cuenta.'
    }
  ];

  return (
    <div className="bg-white text-[#070707] min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#8A8F98]/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#B8F23A]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B8F23A]/25 border border-[#B8F23A] text-xs font-black tracking-wide text-[#070707] uppercase mb-5">
            <Users size={14} className="text-[#070707]" />
            <span>{language === 'en' ? 'Partner & Affiliate Program' : 'Programa de Afiliados & Partners'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#070707] tracking-tight leading-tight max-w-4xl mx-auto">
            {language === 'en'
              ? 'Monetize your audience with Banelio cloud solutions.'
              : 'Monetiza tu comunidad recomendando la infraestructura de Banelio.'}
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#555A52] max-w-2xl mx-auto font-normal leading-relaxed">
            {language === 'en'
              ? 'Ideal for developers, design agencies, YouTubers, bloggers, and tech content creators. Earn passive monthly revenue for every referred client.'
              : 'Ideal para agencias de diseño, desarrolladores, creadores de contenido y consultores. Genera ingresos pasivos mensuales por cada cliente que refieras.'}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://wa.me/526601254107?text=Hola%20Banelio,%20deseo%20unirme%20al%20Programa%20de%20Afiliados"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#B8F23A] hover:bg-[#a6dc32] text-[#070707] font-black text-sm px-6 py-3.5 rounded-xl shadow-xs transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <span>{language === 'en' ? 'Join Affiliate Program via WhatsApp' : 'Unirme al Programa por WhatsApp'}</span>
              <ArrowRight size={16} />
            </a>
            <a
              href="mailto:try@banelio.com?subject=Solicitud%20Afiliado%20Banelio"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#F7F8F0] hover:bg-[#eaede0] border border-[#8A8F98] text-[#070707] font-bold text-sm px-5 py-3.5 rounded-xl transition-colors cursor-pointer"
            >
              <span>{language === 'en' ? 'Contact Affiliates Team' : 'Contactar por Email'}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {affiliateBenefits.map((ben, idx) => (
            <div
              key={idx}
              className="bg-white p-7 rounded-2xl border border-[#8A8F98]/40 shadow-xs hover:border-[#070707] hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-[#B8F23A] flex items-center justify-center mb-4">
                {ben.icon}
              </div>
              <h3 className="text-lg font-black text-[#070707] mb-2">{ben.title}</h3>
              <p className="text-xs text-[#555A52] leading-relaxed">{ben.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-[#F7F8F0] border-t border-[#8A8F98]/20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-black text-[#070707] tracking-tight mb-12">
            {language === 'en' ? 'How the Program Works' : '¿Cómo Funciona el Programa?'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.num} className="bg-white p-6 rounded-2xl border border-[#8A8F98]/30 text-center">
                <div className="w-12 h-12 rounded-full bg-[#070707] text-[#B8F23A] font-black text-xl flex items-center justify-center mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="text-base font-black text-[#070707] mb-2">{s.title}</h3>
                <p className="text-xs text-[#555A52]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
