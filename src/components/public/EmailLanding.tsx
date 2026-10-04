import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Check, Mail, ShieldCheck, Smartphone, Lock, Server } from 'lucide-react';
import { formatMoney, formatMoneyExact } from '../../utils/pricing';
import { calculateCommercialDiscount, DEFAULT_DISCOUNT_CONFIG, getProductPriceResult } from '../../services/pricingEngine';

export default function EmailLanding() {
  const { currency, addToCart, t, language } = useApp();

  const mailboxPackages = [1, 3, 5, 10, 25, 50];
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');

  const emailPlans = [
    {
      id: 'email-starter',
      sku: 'email-email-starter',
      name: 'Email Starter Pro',
      storage: language === 'en' ? '10 GB per Mailbox' : '10 GB por Buzón',
      basePriceUSD: getProductPriceResult('email-email-starter').retailPriceUSD,
      features: language === 'en'
        ? [
            'Modern Webmail + IMAP/POP3',
            'Intelligent Anti-Spam Filter',
            'SPF, DKIM & DMARC Protection',
            'iOS/Android Mobile Sync'
          ]
        : [
            'Webmail Moderno + IMAP/POP3',
            'Filtro Anti-Spam Inteligente',
            'Protección SPF, DKIM & DMARC',
            'Sincronización Móvil iOS/Android'
          ]
    },
    {
      id: 'email-business',
      sku: 'email-email-business',
      name: 'Email Business Suite',
      storage: language === 'en' ? '50 GB per Mailbox' : '50 GB por Buzón',
      basePriceUSD: getProductPriceResult('email-email-business').retailPriceUSD,
      features: language === 'en'
        ? [
            'Shared Calendars & Contacts',
            'Advanced Anti-Phishing Protection',
            'Unlimited Aliases & Forwarding',
            '99.99% SLA Uptime Guarantee'
          ]
        : [
            'Calendarios y Contactos Compartidos',
            'Protección Avanzada Anti-Phishing',
            'Aliases y Reenvíos Ilimitados',
            'Garantía SLA 99.99% Uptime'
          ]
    }
  ];

  const [mailboxSelections, setMailboxSelections] = useState<Record<string, number>>({
    'email-starter': 1,
    'email-business': 1
  });

  const getPlanPricing = (planId: string, mailboxCount: number, cycle: 'month' | 'year') => {
    const plan = emailPlans.find((item) => item.id === planId);
    const baseMonthlyPriceUSD = plan?.basePriceUSD ?? 0;
    const periods = 1;

    const discount = calculateCommercialDiscount(
      mailboxCount,
      periods,
      DEFAULT_DISCOUNT_CONFIG
    );

    const priceSku = cycle === 'year'
      ? `${plan?.sku}-year`
      : plan?.sku;

    const catalogPriceUSD = priceSku
      ? getProductPriceResult(priceSku).retailPriceUSD
      : 0;

    const baseUnitPriceUSD = catalogPriceUSD > 0
      ? catalogPriceUSD
      : baseMonthlyPriceUSD;

    const unitPriceUSD = Number((
      baseUnitPriceUSD *
      (1 - discount.combinedDiscountPercent / 100)
    ).toFixed(2));

    const subtotalUSD = Number((
      unitPriceUSD * mailboxCount
    ).toFixed(2));

    return {
      unitPriceUSD,
      subtotalUSD,
      discount: discount.combinedDiscountPercent
    };
  };


  return (
    <div className="bg-white text-[#070707]">
      {/* Section 1: Hero & Plans (bg-white) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white">
        {/* Oversized Banelio Favicon Watermark (Bottom-Left overflowing) */}
        <div className="absolute -bottom-64 -left-64 w-[850px] h-[850px] sm:w-[1150px] sm:h-[1150px] lg:w-[1350px] lg:h-[1350px] pointer-events-none select-none z-0 opacity-[0.045] rotate-12 overflow-hidden">
          <img
            src="https://res.cloudinary.com/hxbmhqiq/image/upload/v1787810546/Untitled_design_5_1.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="max-w-7xl mx-auto space-y-16 relative z-10">
          {/* Header - Clean, with billing toggle */}
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#070707]">
              {t('eml_title')}
            </h1>
            <p className="text-[#555A52] mt-4 text-base sm:text-lg">
              {t('eml_subtitle')}
            </p>

            {/* Billing Cycle Switcher */}
            <div className="inline-flex items-center gap-3 bg-[#F7F8F0] p-1.5 rounded-2xl border border-[#8A8F98] mt-8 shadow-xs">
              <button
                type="button"
                onClick={() => setBillingCycle('month')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === 'month'
                    ? 'bg-[#B8F23A] text-[#070707] shadow-xs'
                    : 'text-[#555A52] hover:text-[#070707]'
                }`}
              >
                {language === 'en' ? 'Monthly' : 'Facturación Mensual'}
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('year')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  billingCycle === 'year'
                    ? 'bg-[#B8F23A] text-[#070707] shadow-xs'
                    : 'text-[#555A52] hover:text-[#070707]'
                }`}
              >
                <span>{language === 'en' ? 'Annual' : 'Facturación Anual'}</span>
                <span className="bg-[#070707] text-[#B8F23A] text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase">
                  {language === 'en' ? 'ANNUAL BILLING' : 'FACTURACIÓN ANUAL'}
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {emailPlans.map((plan) => {
              const mailboxCount = mailboxSelections[plan.id] ?? 1;
              const pricing = getPlanPricing(plan.id, mailboxCount, billingCycle);

              return (
                <div
                  key={plan.id}
                  className="bg-white p-8 rounded-3xl border border-[#8A8F98] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-2xl font-black text-[#070707]">
                      {plan.name}
                    </h3>

                    <p className="text-xs text-[#555A52] mt-1">
                      {mailboxCount}{' '}
                      {language === 'en'
                        ? mailboxCount === 1 ? 'Email Account' : 'Email Accounts'
                        : mailboxCount === 1 ? 'Cuenta de Correo' : 'Cuentas de Correo'}
                      {' · '}
                      {plan.storage}
                    </p>

                    <div className="mt-6">
                      <p className="text-xs font-bold text-[#555A52] mb-3">
                        {language === 'en'
                          ? 'How many mailboxes do you need?'
                          : '¿Cuántos buzones necesitas?'}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {mailboxPackages.map((count) => {
                          const selected = mailboxCount === count;

                          return (
                            <button
                              key={count}
                              type="button"
                              onClick={() =>
                                setMailboxSelections((current) => ({
                                  ...current,
                                  [plan.id]: count
                                }))
                              }
                              className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${
                                selected
                                  ? 'bg-[#B8F23A] border-[#B8F23A] text-[#070707] shadow-sm'
                                  : 'bg-white border-[#D9DED2] text-[#555A52] hover:border-[#B8F23A] hover:text-[#070707]'
                              }`}
                            >
                              {count}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-6 mb-6 pb-6 border-b border-[#8A8F98]">
                      <span className="text-4xl font-black text-[#070707]">
                        {formatMoneyExact(pricing.subtotalUSD, currency)}
                      </span>
                      <span className="text-xs text-[#555A52]">
                        {' '}/ {billingCycle === 'year' ? (language === 'en' ? 'year' : 'año') : (language === 'en' ? 'month' : 'mes')}
                      </span>

                      <p className="text-[11px] text-[#777D73] mt-2">
                        {pricing.discount > 0 && (
                          <>
                            <span className="line-through mr-2 text-[#858A82]">
                              {formatMoneyExact(
                                billingCycle === 'year'
                                  ? plan.basePriceUSD * 12
                                  : plan.basePriceUSD,
                                currency
                              )}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-[#B8F23A] px-2 py-0.5 font-black text-[#070707]">
                              {language === 'en'
                                ? `SAVE ${pricing.discount}%`
                                : `AHORRA ${pricing.discount}%`}
                            </span>
                            <br />
                          </>
                        )}
                        <span className={pricing.discount > 0 ? 'font-black text-[#B8F23A]' : ''}>
                          {formatMoneyExact(pricing.unitPriceUSD, currency)}
                        </span>{' '}
                        {language === 'en'
                          ? `per mailbox / ${billingCycle === 'year' ? 'year' : 'month'}`
                          : `por buzón / ${billingCycle === 'year' ? 'año' : 'mes'}`}
                      </p>
                    </div>

                    <ul className="space-y-3 mb-8 text-xs text-[#555A52]">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check size={14} className="text-[#B8F23A]" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() =>
                      addToCart({
                        type: 'EMAIL',
                        sku: billingCycle === 'year'
                          ? `${plan.sku}-year`
                          : plan.sku,
                        name: `${plan.name} (${mailboxCount} ${
                          language === 'en'
                            ? mailboxCount === 1 ? 'mailbox' : 'mailboxes'
                            : mailboxCount === 1 ? 'buzón' : 'buzones'
                        } · ${billingCycle === 'year' ? (language === 'en' ? 'Annual' : 'Anual') : (language === 'en' ? 'Monthly' : 'Mensual')})`,
                        quantity: mailboxCount,
                        periodYearsOrMonths: 1,
                        periodUnit: billingCycle,
                        basePriceUSD: pricing.unitPriceUSD
                      })
                    }
                    className="w-full py-3.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] font-black rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                  >
                    {t('email_cta')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 2: Enterprise Protocol & Sync Features (bg-[#F7F8F0]) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F7F8F0] border-t border-[#8A8F98] relative overflow-hidden">
        {/* Oversized Banelio Favicon Watermark (Top-Right overflowing) */}
        <div className="absolute -top-64 -right-64 w-[850px] h-[850px] sm:w-[1150px] sm:h-[1150px] lg:w-[1350px] lg:h-[1350px] pointer-events-none select-none z-0 opacity-[0.05] -rotate-15 overflow-hidden">
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
              {language === 'en' ? 'Built for Clean Deliverability & Maximum Privacy' : 'Entregabilidad Limpia y Privacidad Total'}
            </h2>
            <p className="text-[#555A52] mt-3 text-base">
              {language === 'en' ? 'Stop landing in spam folders with our authenticated email gateways.' : 'Evita caer en la carpeta de correo no deseado gracias a pasarelas autenticadas.'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-[#8A8F98] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#B8F23A] text-[#070707] flex items-center justify-center font-bold">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#070707]">
                {language === 'en' ? 'SPF, DKIM & DMARC' : 'Autenticación SPF, DKIM y DMARC'}
              </h3>
              <p className="text-xs text-[#555A52] leading-relaxed">
                {language === 'en'
                  ? 'Pre-signed cryptographic records ensure your emails reach Outlook, Gmail, and Yahoo inboxes reliably.'
                  : 'Registros criptográficos pre-configurados para garantizar la llegada al inbox de Gmail, Outlook y Yahoo.'}
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-[#8A8F98] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#B8F23A] text-[#070707] flex items-center justify-center font-bold">
                <Smartphone size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#070707]">
                {language === 'en' ? 'Sync on All Devices' : 'Sincronización en Cualquier Dispositivo'}
              </h3>
              <p className="text-xs text-[#555A52] leading-relaxed">
                {language === 'en'
                  ? 'Easily connect with Apple Mail, Outlook, Thunderbird, and native mobile clients with auto-discovery.'
                  : 'Conexión automática en iPhone, Android, Outlook de escritorio y clientes web sin configuraciones complejas.'}
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-[#8A8F98] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#B8F23A] text-[#070707] flex items-center justify-center font-bold">
                <Lock size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#070707]">
                {language === 'en' ? 'End-to-End TLS Encryption' : 'Cifrado de Extremo a Extremo TLS'}
              </h3>
              <p className="text-xs text-[#555A52] leading-relaxed">
                {language === 'en'
                  ? 'All message transfers and storage channels use zero-knowledge TLS 1.3 encryption for bulletproof privacy.'
                  : 'Toda la transferencia y almacenamiento de correos está protegido por protocolos TLS 1.3 de grado bancario.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
