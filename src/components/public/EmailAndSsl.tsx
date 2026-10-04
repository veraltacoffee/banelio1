import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/pricing';
import { getProductPriceResult } from '../../services/pricingEngine';
import { Mail, Shield, Check, ShoppingBag } from 'lucide-react';
import gsap from 'gsap';

export default function EmailAndSsl() {
  const { currency, addToCart, t, language } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.service-card');
      gsap.fromTo(
        cards,
        { y: 25, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out'
        }
      );
    }
  }, []);

  const emailPlans = [
    {
      id: 'eml-starter',
      sku: 'email-eml-starter',
      name: language === 'en' ? 'Professional Email (5 Mailboxes)' : 'Email Profesional (5 Buzones)',
      tagline: language === 'en' ? 'Ideal for freelancers and startups starting with their own domain.' : 'Ideal para profesionistas y pymes que inician con su dominio propio.',
      priceUSD: getProductPriceResult('email-eml-starter').retailPriceUSD,
      specs: language === 'en'
        ? [
            '5 Mailboxes (10 GB each) with automated backup',
            'Cloud Antispam Filter & Live Antivirus',
            'Modern Webmail + IMAP/SMTP Protocols',
            'Shared Calendars, Contacts and Tasks',
            'End-to-End TLS 1.3 Encryption'
          ]
        : [
            '5 Buzones de 10 GB c/u con backup',
            'Filtro Antispam Cloud & Antivirus',
            'Webmail Moderno + Protocolos IMAP/SMTP',
            'Calendarios, Contactos y Tareas compartidas',
            'Cifrado TLS 1.3 de extremo a extremo'
          ]
    },
    {
      id: 'eml-pro',
      sku: 'email-eml-pro',
      name: language === 'en' ? 'Email Suite Enterprise (10 Mailboxes)' : 'Email Suite Enterprise (10 Buzones)',
      tagline: language === 'en' ? 'Massive storage, advanced encryption security with guaranteed SLA.' : 'Almacenamiento masivo y seguridad de cifrado avanzado con SLA garantizado.',
      priceUSD: getProductPriceResult('email-eml-pro').retailPriceUSD,
      specs: language === 'en'
        ? [
            '10 High-capacity Mailboxes (30 GB each)',
            'Pre-configured SPF, DKIM & DMARC records',
            'Anti-Phishing & spoofing protection',
            'Native sync with iOS, Android and Outlook',
            '24/7 Priority bilingual technical support'
          ]
        : [
            '10 Buzones de 30 GB c/u de alta capacidad',
            'Registros SPF, DKIM y DMARC preconfigurados',
            'Protección contra suplantación de identidad (Anti-Phishing)',
            'Sincronización nativa con iOS, Android y Outlook',
            'Soporte técnico prioritario 24/7 en español'
          ]
    }
  ];

  const sslPlans = [
    {
      id: 'ssl-dv',
      sku: 'ssl-ssl-dv',
      name: 'Sectigo Essential SSL (DV)',
      tagline: language === 'en' ? 'Instant domain validation for 1 website.' : 'Validación de dominio instantánea para 1 dominio web.',
      priceUSD: getProductPriceResult('ssl-ssl-dv').retailPriceUSD,
      type: 'Single Domain DV',
      warranty: language === 'en' ? '$10,000 USD Warranty' : '$10,000 USD Garantía'
    },
    {
      id: 'ssl-wildcard',
      sku: 'ssl-ssl-wildcard',
      name: 'PositiveSSL Wildcard (*.domain)',
      tagline: language === 'en' ? 'Protects the main domain and unlimited subdomains.' : 'Protege el dominio principal y todos sus subdominios de forma ilimitada.',
      priceUSD: getProductPriceResult('ssl-ssl-wildcard').retailPriceUSD,
      type: 'Wildcard DV',
      warranty: language === 'en' ? '$50,000 USD Warranty' : '$50,000 USD Garantía',
      badge: language === 'en' ? 'Best Seller' : 'Más Vendido'
    },
    {
      id: 'ssl-ev',
      sku: 'ssl-ssl-ev',
      name: 'Comodo EV SSL (Extended Validation)',
      tagline: language === 'en' ? 'Maximum bank-grade trust with rigorous identity validation.' : 'Máxima confianza bancaria con validación rigurosa de personería jurídica.',
      priceUSD: getProductPriceResult('ssl-ssl-ev').retailPriceUSD,
      type: 'Enterprise EV',
      warranty: language === 'en' ? '$1,000,000 USD Warranty' : '$1,000,000 USD Garantía'
    }
  ];

  return (
    <section ref={containerRef} id="services-section" className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-[#8A8F98] text-[#070707] relative overflow-hidden">
      {/* Oversized Banelio Favicon Watermark (Middle-Left overflowing) */}
      <div className="absolute top-1/4 -left-64 w-[850px] h-[850px] sm:w-[1150px] sm:h-[1150px] lg:w-[1350px] lg:h-[1350px] pointer-events-none select-none z-0 opacity-[0.045] rotate-25 overflow-hidden">
        <img
          src="https://res.cloudinary.com/hxbmhqiq/image/upload/v1787810546/Untitled_design_5_1.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="max-w-7xl mx-auto space-y-20 relative z-10">
        
        {/* EMAIL SECTION */}
        <div>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-[#070707] tracking-tight">
              {t('email_section_title')}
            </h2>
            <p className="text-[#555A52] mt-2 text-sm sm:text-base">
              {t('email_section_desc')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {emailPlans.map((plan) => (
              <div
                key={plan.id}
                id={`email-card-${plan.id}`}
                className="service-card bg-[#FDFDFD] rounded-3xl p-8 border border-[#8A8F98] hover:border-[#B8F23A] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-[#F7F8F0] border border-[#8A8F98] text-[#B8F23A] flex items-center justify-center mb-4">
                    <Mail size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-[#070707]">{plan.name}</h3>
                  <p className="text-xs text-[#555A52] mt-1 mb-4">{plan.tagline}</p>
                  <div className="text-3xl font-black text-[#070707] mb-6">
                    {formatMoney(plan.priceUSD, currency)}
                    <span className="text-xs font-normal text-[#555A52]"> / {language === 'en' ? 'year' : 'año'}</span>
                  </div>

                  <ul className="space-y-2.5 mb-8 text-xs text-[#555A52]">
                    {plan.specs.map((s, idx) => (
                      <li key={idx} className="flex items-center gap-2.5">
                        <Check size={15} className="text-[#B8F23A] shrink-0" />
                        <span className="text-[#070707]">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  id={`btn-add-${plan.id}`}
                  onClick={() =>
                    addToCart({
                      type: 'EMAIL',
                      sku: `email-${plan.id}`,
                      name: plan.name,
                      periodYearsOrMonths: 1,
                      periodUnit: 'year',
                      basePriceUSD: plan.priceUSD
                    })
                  }
                  className="w-full py-3.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <ShoppingBag size={15} />
                  <span>{t('email_cta')}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SSL CERTIFICATES SECTION */}
        <div>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-[#070707] tracking-tight">
              {t('ssl_section_title')}
            </h2>
            <p className="text-[#555A52] mt-2 text-sm sm:text-base">
              {t('ssl_section_desc')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {sslPlans.map((ssl) => (
              <div
                key={ssl.id}
                id={`ssl-card-${ssl.id}`}
                className={`service-card relative bg-[#FDFDFD] rounded-3xl p-7 border transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl ${
                  ssl.badge
                    ? 'border-2 border-[#B8F23A] shadow-lg ring-2 ring-[#B8F23A]/20'
                    : 'border-[#8A8F98] hover:border-[#B8F23A]'
                }`}
              >
                {ssl.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#B8F23A] text-[#070707] text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                    {t('ssl_best_seller')}
                  </div>
                )}

                <div>
                  <div className="w-10 h-10 rounded-2xl bg-[#F7F8F0] border border-[#8A8F98] text-[#B8F23A] flex items-center justify-center mb-4">
                    <Shield size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-[#070707]">{ssl.name}</h3>
                  <p className="text-xs text-[#555A52] mt-1 mb-4">{ssl.tagline}</p>
                  
                  <div className="text-2xl font-black text-[#070707] mb-4">
                    {formatMoney(ssl.priceUSD, currency)}
                    <span className="text-xs font-normal text-[#555A52]"> / {language === 'en' ? 'year' : 'año'}</span>
                  </div>

                  <div className="p-3 bg-[#F7F8F0] rounded-2xl mb-6 space-y-1 text-xs border border-[#8A8F98]">
                    <div className="text-[11px] font-bold text-[#B8F23A]">{ssl.type}</div>
                    <div className="text-[10px] text-[#555A52]">{ssl.warranty}</div>
                  </div>
                </div>

                <button
                  id={`btn-add-${ssl.id}`}
                  onClick={() =>
                    addToCart({
                      type: 'SSL',
                      sku: `ssl-${ssl.id}`,
                      name: ssl.name,
                      periodYearsOrMonths: 1,
                      periodUnit: 'year',
                      basePriceUSD: ssl.priceUSD
                    })
                  }
                  className="w-full py-3 bg-[#070707] hover:bg-[#111111] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <ShoppingBag size={14} />
                  <span>{t('ssl_cta')}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
