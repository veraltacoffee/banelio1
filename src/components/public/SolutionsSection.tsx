import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/pricing';
import {
  BANELIO_SOLUTIONS_CONFIG,
  calculateSolutionPrice
} from '../../services/pricingEngine';
import { Check, Sparkles, Layers, ShieldCheck, ArrowRight } from 'lucide-react';

export default function SolutionsSection() {
  const { currency, addToCart, language } = useApp();

  const solutions = Object.values(BANELIO_SOLUTIONS_CONFIG).map((sol) => {
    const pricing = calculateSolutionPrice(sol.code, currency, 1, 1);

    return {
      ...sol,
      totalExpectedCost: pricing.expectedCostUSD,
      retailUSD: pricing.retailPriceUSD,
      retailLocal: pricing.retailPriceLocal
    };
  });

  const handleHireSolution = (sol: typeof solutions[0]) => {
    addToCart({
      type: 'HOSTING',
      sku: `sol-${sol.code.toLowerCase()}`,
      name: `Solución BANELIO ${sol.name}`,
      quantity: 1,
      periodYearsOrMonths: 1,
      periodUnit: 'year',
      basePriceUSD: sol.retailUSD
    });
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 bg-[#F7F8F0] border border-[#8A8F98] px-4 py-1.5 rounded-full text-xs font-bold text-[#B8F23A]">
          <Layers size={14} />
          <span>{language === 'en' ? 'Turnkey Commercial Solutions' : 'Soluciones Integrales BANELIO'}</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-[#070707] tracking-tight">
          {language === 'en' ? 'Everything you need in one single package' : 'Todo lo que necesitas en un solo paquete'}
        </h2>
        <p className="text-[#555A52] text-sm sm:text-base">
          {language === 'en'
            ? 'Dominio, correo corporativo, hosting NVMe y certificado SSL combinados bajo una tarifa anual con margen protegido.'
            : 'Dominio, correo corporativo, hosting NVMe y certificado SSL combinados bajo una tarifa anual con margen protegido.'}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {solutions.map((sol) => {
          const isBusiness = sol.code === 'BUSINESS';
          return (
            <div
              key={sol.code}
              className={`relative bg-[#FFFFFF] rounded-3xl p-8 border flex flex-col justify-between transition-all duration-300 ${
                isBusiness
                  ? 'border-[#B8F23A] shadow-xl ring-2 ring-[#B8F23A]/50 md:-translate-y-2'
                  : 'border-[#8A8F98] shadow-xs hover:border-[#B8F23A]/40 hover:shadow-md'
              }`}
            >
              {isBusiness && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#B8F23A] text-[#070707] text-[11px] font-black uppercase px-4 py-1 rounded-full shadow-xs flex items-center gap-1.5">
                  <Sparkles size={12} />
                  <span>{language === 'en' ? 'Most Popular' : 'Más Recomendada'}</span>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B8F23A] bg-[#F7F8F0] px-2.5 py-1 rounded-md">
                    SOL-{sol.code}
                  </span>
                  <h3 className="text-2xl font-black text-[#070707] mt-3">{sol.name}</h3>
                  <p className="text-xs text-[#555A52] mt-1">{sol.tagline}</p>
                </div>

                {/* Price Display */}
                <div className="py-4 border-y border-[#8A8F98]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-[#070707]">
                      {formatMoney(sol.retailLocal, currency)}
                    </span>
                    <span className="text-xs text-[#555A52] font-semibold">/{language === 'en' ? 'yr' : 'año'}</span>
                  </div>
                  <p className="text-[11px] text-[#B8F23A] font-bold mt-1">
                    {language === 'en' ? 'All-in-one annual bundle' : 'Paquete todo incluido con aprovisionamiento modular'}
                  </p>
                </div>

                {/* Included Components */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold uppercase text-[#555A52] tracking-wider block">
                    {language === 'en' ? 'Included Services:' : 'Servicios Incluidos:'}
                  </span>
                  <ul className="space-y-2.5 text-xs text-[#070707]">
                    {sol.components.map((comp) => (
                      <li key={comp.sku} className="flex items-start gap-2.5">
                        <div className="mt-0.5 w-4 h-4 rounded-full bg-[#B8F23A] text-[#070707] flex items-center justify-center shrink-0">
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <div>
                          <span className="font-semibold">{comp.name}</span>
                          <span className="text-[#555A52] text-[11px] ml-1">
                            ({comp.quantity} {comp.category.toLowerCase()})
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8 mt-6 border-t border-[#8A8F98] space-y-3">
                <div className="flex items-center gap-1.5 text-[11px] text-[#555A52]">
                  <ShieldCheck size={14} className="text-[#B8F23A]" />
                  <span>{language === 'en' ? 'Activation on demand' : 'Activación progresiva sin costos ocultos'}</span>
                </div>
                <button
                  onClick={() => handleHireSolution(sol)}
                  className={`w-full py-3.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs ${
                    isBusiness
                      ? 'bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707]'
                      : 'bg-[#070707] hover:bg-[#252525] text-[#FCFCF8]'
                  }`}
                >
                  <span>{language === 'en' ? 'Select Solution' : 'Contratar Solución'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
