import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/pricing';
import { getProductPriceResult } from '../../services/pricingEngine';
import { Server, Check, Zap, Shield, Cpu, HardDrive, ShoppingBag } from 'lucide-react';
import gsap from 'gsap';

export default function HostingPlans() {
  const { currency, addToCart, t, language } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardsContainerRef.current) {
      const cards = cardsContainerRef.current.querySelectorAll('.hosting-card');
      gsap.fromTo(
        cards,
        { y: 30, opacity: 0, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.65,
          stagger: 0.12,
          ease: 'power3.out'
        }
      );
    }
  }, [billingCycle]);

  const plans = [
    {
      id: 'plan-starter',
      name: 'Cloud Starter NVMe',
      tagline: language === 'en' ? 'Ideal for personal websites, blogs, and landing pages.' : 'Ideal para blogs personales, páginas informativas y landing pages.',
      monthlyUSD: getProductPriceResult('hosting-plan-starter-month').retailPriceUSD,
      annualUSD: Number((getProductPriceResult('hosting-plan-starter-year').retailPriceUSD / 12).toFixed(2)),
      annualTotalUSD: getProductPriceResult('hosting-plan-starter-year').retailPriceUSD,
      specs: {
        disk: '15 GB NVMe PCIe 4.0',
        bandwidth: language === 'en' ? '150 GB Bandwidth' : '150 GB Transferencia',
        websites: language === 'en' ? '1 Website' : '1 Sitio Web',
        mailboxes: language === 'en' ? '5 Business Mailboxes' : '5 Cuentas Corporativas',
        ssl: language === 'en' ? 'Free SSL Certificate' : 'Certificado SSL Let’s Encrypt Gratis',
        ram: language === 'en' ? '1 GB RAM + 1 vCPU' : '1 GB RAM Dedicada + 1 vCPU',
        backups: language === 'en' ? 'Weekly Automatic Backups' : 'Copias de Seguridad Semanales'
      },
      popular: false
    },
    {
      id: 'plan-pro',
      name: 'Cloud NVMe Pro Ultra',
      tagline: language === 'en' ? 'Maximum performance for WooCommerce, WordPress, and scaling businesses.' : 'Máximo rendimiento para WooCommerce, WordPress y SaaS en crecimiento.',
      monthlyUSD: getProductPriceResult('hosting-plan-pro-month').retailPriceUSD,
      annualUSD: Number((getProductPriceResult('hosting-plan-pro-year').retailPriceUSD / 12).toFixed(2)),
      annualTotalUSD: getProductPriceResult('hosting-plan-pro-year').retailPriceUSD,
      specs: {
        disk: '60 GB NVMe PCIe 4.0 Ultra',
        bandwidth: language === 'en' ? 'Unlimited 10 Gbps Bandwidth' : 'Tráfico Ilimitado 10 Gbps',
        websites: language === 'en' ? 'Unlimited Websites' : 'Sitios Web Ilimitados',
        mailboxes: language === 'en' ? 'Unlimited Email Mailboxes' : 'Cuentas de Correo Ilimitadas',
        ssl: language === 'en' ? 'Wildcard SSL Included (*.domain)' : 'SSL Wildcard Incluido (*.dominio)',
        ram: language === 'en' ? '4 GB Dedicated RAM + 2 vCPUs' : '4 GB RAM + 2 vCPU Dedicados',
        backups: language === 'en' ? 'Daily Automated Backups' : 'Backups Diarios Automatizados'
      },
      popular: true
    },
    {
      id: 'plan-enterprise',
      name: 'Enterprise Cloud NVMe',
      tagline: language === 'en' ? 'Dedicated cloud infrastructure for digital agencies and high-traffic portals.' : 'Infraestructura dedicada para agencias, fintechs y alto tráfico.',
      monthlyUSD: getProductPriceResult('hosting-plan-enterprise-month').retailPriceUSD,
      annualUSD: Number((getProductPriceResult('hosting-plan-enterprise-year').retailPriceUSD / 12).toFixed(2)),
      annualTotalUSD: getProductPriceResult('hosting-plan-enterprise-year').retailPriceUSD,
      specs: {
        disk: '250 GB NVMe Enterprise U.2',
        bandwidth: language === 'en' ? 'Unlimited 10 Gbps + Anti-DDoS' : 'Tráfico Ilimitado 10 Gbps con Anti-DDoS',
        websites: language === 'en' ? 'Unlimited Websites' : 'Sitios Web Ilimitados',
        mailboxes: language === 'en' ? 'Unlimited Mailboxes + SMTP Relay' : 'Cuentas Ilimitadas + Relay SMTP',
        ssl: language === 'en' ? 'Sectigo EV / Wildcard SSL' : 'Certificados Sectigo EV / Wildcard',
        ram: language === 'en' ? '16 GB RAM + 8 vCPU LiteSpeed' : '16 GB RAM + 8 vCPU LiteSpeed',
        backups: language === 'en' ? 'Instant Snapshots & Restore' : 'Snapshots y Restauración Instantánea'
      },
      popular: false
    }
  ];

  const handleAddHosting = (plan: typeof plans[0]) => {
    const isAnnual = billingCycle === 'annual';
    const pricePerUnit = isAnnual ? plan.annualTotalUSD : plan.monthlyUSD;

    addToCart({
      type: 'HOSTING',
      sku: `hosting-${plan.id}-${isAnnual ? 'year' : 'month'}`,
      name: `${plan.name} (${isAnnual ? (language === 'en' ? 'Annual' : 'Anual') : (language === 'en' ? 'Monthly' : 'Mensual')})`,
      quantity: 1,
      periodYearsOrMonths: 1,
      periodUnit: isAnnual ? 'year' : 'month',
      basePriceUSD: pricePerUnit
    });
  };

  return (
    <section id="hosting-section" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F7F8F0] border-t border-b border-[#8A8F98] text-[#070707] relative overflow-hidden">
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
        {/* Section Header - Clean */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#070707] tracking-tight">
            {t('hosting_section_title')}
          </h2>
          <p className="text-[#555A52] mt-4 text-base sm:text-lg">
            {t('hosting_section_desc')}
          </p>

          {/* Billing Cycle Switcher */}
          <div className="inline-flex items-center gap-3 bg-[#F7F8F0] p-1.5 rounded-2xl border border-[#8A8F98] mt-8 shadow-xs">
            <button
              id="hosting-billing-monthly"
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-[#B8F23A] text-[#070707] shadow-xs'
                  : 'text-[#555A52] hover:text-[#070707]'
              }`}
            >
              {t('hosting_monthly')}
            </button>
            <button
              id="hosting-billing-annual"
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-[#B8F23A] text-[#070707] shadow-xs'
                  : 'text-[#555A52] hover:text-[#070707]'
              }`}
            >
              <span>{t('hosting_annual')}</span>
              <span className="bg-[#070707] text-[#B8F23A] text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase">
                {t('hosting_save_badge')}
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div ref={cardsContainerRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const isAnnual = billingCycle === 'annual';
            const priceUSD = isAnnual ? plan.annualUSD : plan.monthlyUSD;

            return (
              <div
                key={plan.id}
                id={`hosting-card-${plan.id}`}
                className={`hosting-card relative flex flex-col justify-between p-8 rounded-3xl transition-all duration-300 group hover:-translate-y-1.5 ${
                  plan.popular
                    ? 'bg-white border-2 border-[#B8F23A] shadow-2xl ring-2 ring-[#B8F23A]/20'
                    : 'bg-white border border-[#8A8F98] shadow-sm hover:shadow-xl'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#B8F23A] text-[#070707] text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
                    {t('hosting_recommended')}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-xl font-black text-[#070707]">{plan.name}</h3>
                    <div className="p-2 rounded-xl bg-[#F7F8F0] text-[#B8F23A]">
                      <Server size={18} />
                    </div>
                  </div>

                  <p className="text-xs text-[#555A52] mb-6 leading-relaxed">
                    {plan.tagline}
                  </p>

                  <div className="mb-6 pb-6 border-b border-[#8A8F98]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-[#070707] tracking-tight">
                        {formatMoney(priceUSD, currency)}
                      </span>
                      <span className="text-xs text-[#555A52] font-semibold">{t('hosting_per_month')}</span>
                    </div>
                    {isAnnual && (
                      <p className="text-[11px] text-[#B8F23A] font-bold mt-1">
                        {t('hosting_billed_annually')} {formatMoney(plan.annualUSD * 12, currency)} {t('hosting_per_year')}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8 text-xs text-[#555A52]">
                    <li className="flex items-center gap-2.5">
                      <HardDrive size={15} className="text-[#B8F23A] flex-shrink-0" />
                      <span><strong>{plan.specs.disk}</strong></span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Zap size={15} className="text-[#B8F23A] flex-shrink-0" />
                      <span>{plan.specs.bandwidth}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check size={15} className="text-[#B8F23A] flex-shrink-0" />
                      <span>{plan.specs.websites}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check size={15} className="text-[#B8F23A] flex-shrink-0" />
                      <span>{plan.specs.mailboxes}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Shield size={15} className="text-[#B8F23A] flex-shrink-0" />
                      <span>{plan.specs.ssl}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Cpu size={15} className="text-[#B8F23A] flex-shrink-0" />
                      <span>{plan.specs.ram}</span>
                    </li>
                  </ul>
                </div>

                <button
                  id={`btn-add-${plan.id}`}
                  onClick={() => handleAddHosting(plan)}
                  className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 ${
                    plan.popular
                      ? 'bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707]'
                      : 'bg-[#070707] hover:bg-[#111111] text-white'
                  }`}
                >
                  <ShoppingBag size={16} />
                  <span>{t('hosting_cta')} {plan.name}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
