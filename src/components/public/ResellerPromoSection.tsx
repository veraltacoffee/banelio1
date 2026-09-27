import React from 'react';
import { useApp } from '../../context/AppContext';
import { Users, DollarSign, TrendingUp, ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function ResellerPromoSection() {
  const { setRole } = useApp();

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#070707] text-[#FCFCF8] relative overflow-hidden border-t border-[#555A52]/30">
      {/* Oversized Banelio Favicon Watermark (Top-Right overflowing) */}
      <div className="absolute -top-64 -right-64 w-[850px] h-[850px] sm:w-[1150px] sm:h-[1150px] lg:w-[1350px] lg:h-[1350px] pointer-events-none select-none z-0 opacity-[0.06] -rotate-12 brightness-125 overflow-hidden">
        <img
          src="https://res.cloudinary.com/hxbmhqiq/image/upload/v1787810546/Untitled_design_5_1.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Background ambient lights */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#B8F23A]/10 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#B8F23A]/10 blur-[150px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="bg-[#070707] rounded-[2.5rem] p-8 sm:p-14 border border-[#555A52]/40 shadow-2xl">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#FCFCF8] leading-tight">
                Vende dominios y hosting con <span className="text-[#B8F23A]">tu propia marca</span> y genera hasta el 30% recurrente.
              </h2>

              <p className="text-[#858A82] text-sm sm:text-base leading-relaxed">
                Banelio te proporciona la infraestructura tecnológica completa y conectividad automatizada. Tú defines tus propios precios a clientes, gestionas tu cartera y cobras comisiones de renovación de por vida.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2 text-[#FCFCF8]">
                  <CheckCircle2 size={16} className="text-[#B8F23A] shrink-0" />
                  <span>100% Marca Blanca (Tu logo y tus márgenes)</span>
                </div>
                <div className="flex items-center gap-2 text-[#FCFCF8]">
                  <CheckCircle2 size={16} className="text-[#B8F23A] shrink-0" />
                  <span>Retiros automáticos vía PayPal o Transferencia</span>
                </div>
                <div className="flex items-center gap-2 text-[#FCFCF8]">
                  <CheckCircle2 size={16} className="text-[#B8F23A] shrink-0" />
                  <span>API REST documentada para integración custom</span>
                </div>
                <div className="flex items-center gap-2 text-[#FCFCF8]">
                  <CheckCircle2 size={16} className="text-[#B8F23A] shrink-0" />
                  <span>Protección anti-fraude y cookies de afiliación</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-4 items-center">
                <button
                  onClick={() => setRole('RESELLER')}
                  className="px-8 py-4 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <span>Explorar Portal de Resellers</span>
                  <ArrowRight size={18} />
                </button>
                <span className="text-xs text-[#858A82] font-medium">Activación inmediata sin cuota de alta.</span>
              </div>
            </div>

            {/* Right Card / Metric Simulation */}
            <div className="lg:col-span-5 bg-[#070707] rounded-3xl p-6 border border-[#555A52]/40 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#555A52]/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#070707] text-[#B8F23A] border border-[#555A52]/40 flex items-center justify-center font-bold text-xs">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#FCFCF8]">Simulador de Comisiones</h4>
                    <p className="text-[10px] text-[#858A82]">Basado en nivel Partner Gold (25%)</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-[#B8F23A]/20 text-[#070707] border border-[#B8F23A]/30 px-2 py-0.5 rounded">
                  En Vivo
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-[#070707] border border-[#555A52]/40 p-3 rounded-xl flex justify-between items-center">
                  <span className="text-[#858A82]">10 Clientes con Hosting Pro ($59.88/año):</span>
                  <span className="font-bold text-[#FCFCF8]">$149.70 USD / año</span>
                </div>

                <div className="bg-[#070707] border border-[#555A52]/40 p-3 rounded-xl flex justify-between items-center">
                  <span className="text-[#858A82]">25 Dominios .com registrados:</span>
                  <span className="font-bold text-[#FCFCF8]">$81.25 USD / año</span>
                </div>

                <div className="bg-[#070707] border border-[#B8F23A]/40 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-[#B8F23A] font-bold block">Tu Ingreso Pasivo Estimado:</span>
                    <span className="text-[10px] text-[#858A82]">Renovaciones anuales automáticas</span>
                  </div>
                  <span className="text-2xl font-black text-[#B8F23A]">$230.95 USD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
