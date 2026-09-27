import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, ShieldCheck, Lock, Award } from 'lucide-react';
import { formatMoney } from '../../utils/pricing';
import { getProductPriceResult } from '../../services/pricingEngine';

export default function SslLanding() {
  const { currency, addToCart, t, language } = useApp();

  const sslPlans = [
    {
      id: 'ssl-dv',
      sku: 'ssl-ssl-dv',
      name: 'SSL Positivo DV',
      validation: language === 'en' ? 'Domain Validation in 5 minutes' : 'Validación por Dominio en 5 minutos',
      warranty: language === 'en' ? 'Warranty $10,000 USD' : 'Garantía $10,000 USD',
      priceUSD: getProductPriceResult('ssl-ssl-dv').retailPriceUSD || 14.99,
      features: language === 'en'
        ? ['256-bit SHA-256 Encryption', 'HTTPS Browser Padlock', 'Dynamic Security Site Seal', 'Unlimited Free Reissuance']
        : ['Encriptación 256-bit SHA-256', 'Candado de Seguridad en Navegadores', 'Sello de Seguridad Dinámico', 'Reemisión Ilimitada']
    },
    {
      id: 'ssl-wildcard',
      sku: 'ssl-ssl-wildcard',
      name: 'SSL Wildcard Pro (*.domain)',
      validation: language === 'en' ? 'Secures your domain and all its subdomains' : 'Protege tu dominio y todos sus subdominios',
      warranty: language === 'en' ? 'Warranty $50,000 USD' : 'Garantía $50,000 USD',
      priceUSD: getProductPriceResult('ssl-ssl-wildcard').retailPriceUSD || 49.99,
      features: language === 'en'
        ? ['Protects unlimited subdomains (*.company.com)', 'Immediate Automated Issuance', '99.9% Browser & Mobile Compatibility', 'Certified Trust Site Seal']
        : ['Protege subdominios ilimitados (*.empresa.com)', 'Aprobación Inmediata', 'Compatibilidad 99.9% con Móviles y Navegadores', 'Sello de Seguridad Certificado']
    }
  ];

  return (
    <div className="bg-white text-[#070707]">
      {/* Section 1: Hero & Plans (bg-white) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white">
        {/* Oversized Banelio Favicon Watermark (Top-Right overflowing) */}
        <div className="absolute -top-64 -right-64 w-[850px] h-[850px] sm:w-[1150px] sm:h-[1150px] lg:w-[1350px] lg:h-[1350px] pointer-events-none select-none z-0 opacity-[0.045] -rotate-15 overflow-hidden">
          <img
            src="https://res.cloudinary.com/hxbmhqiq/image/upload/v1787810546/Untitled_design_5_1.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="max-w-7xl mx-auto space-y-16 relative z-10">
          {/* Header - Clean, no eyebrow badge */}
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#070707]">
              {t('ssl_title')}
            </h1>
            <p className="text-[#555A52] mt-4 text-base sm:text-lg">
              {t('ssl_subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {sslPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white p-8 rounded-3xl border border-[#8A8F98] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-2xl font-black text-[#070707]">{plan.name}</h3>
                  <p className="text-xs text-[#555A52] mt-1">{plan.validation}</p>
                  
                  <div className="mt-6 mb-6 pb-6 border-b border-[#8A8F98]">
                    <span className="text-4xl font-black text-[#070707]">{formatMoney(plan.priceUSD, currency)}</span>
                    <span className="text-xs text-[#555A52]"> / {language === 'en' ? 'year' : 'año'}</span>
                  </div>

                  <ul className="space-y-3 mb-8 text-xs text-[#555A52]">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-[#B8F23A]" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() =>
                    addToCart({
                      type: 'SSL',
                      sku: `ssl-${plan.id}`,
                      name: `${plan.name} (${language === 'en' ? '1 Year' : '1 Año'})`,
                      periodYearsOrMonths: 1,
                      periodUnit: 'year',
                      basePriceUSD: plan.priceUSD
                    })
                  }
                  className="w-full py-3.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] font-black rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                >
                  {t('ssl_cta')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Trust & Compliance Badges (bg-[#F7F8F0]) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F7F8F0] border-t border-[#8A8F98] relative overflow-hidden">
        {/* Oversized Banelio Favicon Watermark (Bottom-Left overflowing) */}
        <div className="absolute -bottom-64 -left-64 w-[850px] h-[850px] sm:w-[1150px] sm:h-[1150px] lg:w-[1350px] lg:h-[1350px] pointer-events-none select-none z-0 opacity-[0.05] rotate-20 overflow-hidden">
          <img
            src="https://res.cloudinary.com/hxbmhqiq/image/upload/v1787810546/Untitled_design_5_1.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-[#070707] tracking-tight">
              {language === 'en' ? 'Google Chrome & Mobile Trust Verified' : 'Confianza Total en Google Chrome y Navegadores'}
            </h2>
            <p className="text-[#555A52] mt-3 text-base">
              {language === 'en'
                ? 'Protect checkout transactions and eliminate "Not Secure" browser warning banners.'
                : 'Protege las compras en tu web y elimina para siempre la advertencia de "Sitio no seguro".'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-[#8A8F98] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#B8F23A] text-[#070707] flex items-center justify-center font-bold">
                <Lock size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#070707]">
                {language === 'en' ? '256-bit Strong Encryption' : 'Cifrado Fuerte de 256 Bits'}
              </h3>
              <p className="text-xs text-[#555A52] leading-relaxed">
                {language === 'en'
                  ? 'SHA-256 signature algorithms protecting passwords, customer details, and credit card payments.'
                  : 'Algoritmos con firma SHA-256 que protegen contraseñas, datos personales y pagos con tarjeta.'}
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-[#8A8F98] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#B8F23A] text-[#070707] flex items-center justify-center font-bold">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#070707]">
                {language === 'en' ? 'Instant Automatic Validation' : 'Aprobación Inmediata en Minutos'}
              </h3>
              <p className="text-xs text-[#555A52] leading-relaxed">
                {language === 'en'
                  ? 'Automated DNS or HTTP file challenge verifies your domain ownership and issues the certificate in under 5 minutes.'
                  : 'Validación automatizada por registro DNS o archivo HTTP que emite e instala tu certificado en menos de 5 minutos.'}
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-[#8A8F98] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#B8F23A] text-[#070707] flex items-center justify-center font-bold">
                <Award size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#070707]">
                {language === 'en' ? 'Official Financial Warranty' : 'Garantía Financiera Incluida'}
              </h3>
              <p className="text-xs text-[#555A52] leading-relaxed">
                {language === 'en'
                  ? 'Up to $50,000 USD certification warranty backing against encryption breach or misissuance.'
                  : 'Póliza de garantía de hasta $50,000 USD respaldada por la autoridad certificadora ante cualquier eventualidad.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
