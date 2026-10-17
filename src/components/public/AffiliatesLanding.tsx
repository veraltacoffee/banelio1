import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  DollarSign,
  Percent,
  ArrowRight,
  Zap,
  Gift
} from 'lucide-react';

export default function AffiliatesLanding() {
  const { language } = useApp();

  const affiliateBenefits = [
    {
      icon: <Percent className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? '10% Referral Commission' : '10% de Comisión por Referido',
      desc: language === 'en'
        ? 'Earn 10% commission when a client signs up for cloud hosting, domain registration, or digital services using your referral code or link.'
        : 'Gana el 10% de comisión por cada cliente que contrate hosting, dominios o servicios digitales mediante tu código o enlace de referencia.'
    },
    {
      icon: <Zap className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'Custom Referral Links & Codes' : 'Enlaces y Códigos Exclusivos',
      desc: language === 'en'
        ? 'Share your assigned custom referral link or promo code with your clients, community, or audience.'
        : 'Comparte tu enlace de recomendación o código promocional personalizado con tus clientes o en tu plataforma digital.'
    },
    {
      icon: <DollarSign className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'Direct Payouts' : 'Liquidaciones Directas',
      desc: language === 'en'
        ? 'Request commission payouts via PayPal or direct bank transfer (SPEI in Mexico) with low withdrawal thresholds.'
        : 'Recibe tus comisiones acumuladas de forma clara vía PayPal o transferencia bancaria directa (SPEI en México).'
    },
    {
      icon: <Gift className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'Promotional Assets' : 'Material Promocional',
      desc: language === 'en'
        ? 'Official banners, brand logos, and commercial copy ready to share with your clients and network.'
        : 'Banners oficiales, logotipos autorizados y textos comerciales listos para compartir con tus contactos.'
    }
  ];

  const steps = [
    {
      num: '1',
      title: language === 'en' ? 'Sign Up for Free' : 'Regístrate Gratis',
      desc: language === 'en' ? 'Submit your partner request in under 2 minutes.' : 'Completa tu solicitud de afiliado en menos de 2 minutos.'
    },
    {
      num: '2',
      title: language === 'en' ? 'Share Your Link or Code' : 'Comparte tu Enlace o Código',
      desc: language === 'en' ? 'Recommend Banelio on your website, social media, or directly to clients.' : 'Recomienda Banelio en tu sitio web, canal o a tus clientes.'
    },
    {
      num: '3',
      title: language === 'en' ? 'Earn 10% Commission' : 'Gana tu 10% de Comisión',
      desc: language === 'en' ? 'Collect 10% on every service contracted by your referred customers.' : 'Recibe el 10% de comisión por cada servicio contratado por tus referidos.'
    }
  ];

  return (
    <div className="bg-white text-[#070707] min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E2E5DA]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#DFF5B5]/25 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DFF5B5] border border-[#B9E86A] text-xs font-black tracking-wide text-[#070707] uppercase mb-5">
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
              ? 'Ideal for developers, design agencies, tech consultants, and content creators. Earn 10% commission for every referred client through custom links or promo codes.'
              : 'Ideal para agencias de diseño, desarrolladores, consultores y creadores de contenido. Gana el 10% de comisión por cada cliente que refieras con tu enlace o código.'}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://wa.me/526601254107?text=Hola%20Banelio,%20deseo%20unirme%20al%20Programa%20de%20Afiliados"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#B9E86A] hover:bg-[#CBEF8A] text-[#070707] font-black text-sm px-6 py-3.5 rounded-xl shadow-xs transition-transform hover:scale-[1.02] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707]"
            >
              <span>{language === 'en' ? 'Join Affiliate Program via WhatsApp' : 'Unirme al Programa por WhatsApp'}</span>
              <ArrowRight size={16} />
            </a>
            <a
              href="mailto:try@banelio.com?subject=Solicitud%20Afiliado%20Banelio"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#F7F8F0] hover:bg-[#F1F3E8] border border-[#E2E5DA] text-[#070707] font-bold text-sm px-5 py-3.5 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707]"
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
              className="bg-white p-7 rounded-2xl border border-[#E2E5DA] shadow-xs hover:border-[#070707] hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-[#DFF5B5] flex items-center justify-center mb-4">
                {ben.icon}
              </div>
              <h3 className="text-lg font-black text-[#070707] mb-2">{ben.title}</h3>
              <p className="text-xs text-[#555A52] leading-relaxed">{ben.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-[#F7F8F0] border-t border-[#E2E5DA] px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-black text-[#070707] tracking-tight mb-12">
            {language === 'en' ? 'How the Program Works' : '¿Cómo Funciona el Programa?'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.num} className="bg-white p-6 rounded-2xl border border-[#E2E5DA] text-center shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-[#070707] text-[#B9E86A] font-black text-xl flex items-center justify-center mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="text-base font-black text-[#070707] mb-2">{s.title}</h3>
                <p className="text-xs text-[#555A52] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
