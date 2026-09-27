import React from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AffiliatesLanding() {
  const { setRole, t, language } = useApp();

  return (
    <div className="bg-white text-[#070707]">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#070707] text-[#FCFCF8] relative overflow-hidden border-b border-[#242424]">
        {/* Oversized Banelio Favicon Watermark (Top-Left overflowing) */}
        <div className="absolute -top-64 -left-64 w-[850px] h-[850px] sm:w-[1150px] sm:h-[1150px] lg:w-[1350px] lg:h-[1350px] pointer-events-none select-none z-0 opacity-[0.07] brightness-150 rotate-12 overflow-hidden">
          <img
            src="https://res.cloudinary.com/hxbmhqiq/image/upload/v1787810546/Untitled_design_5_1.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="absolute top-0 right-0 w-96 h-96 bg-[#B8F23A]/10 blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#B8F23A]/10 blur-[150px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#FCFCF8] leading-tight">
              {language === 'en' ? (
                <>Recommend domains and cloud hosting and earn <span className="text-[#B8F23A]">up to 30% recurring</span>.</>
              ) : (
                <>Recomienda dominios y hosting y gana <span className="text-[#B8F23A]">hasta el 30% recurrente</span>.</>
              )}
            </h1>

            <p className="text-[#A0A69D] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              {t('aff_subtitle')}
            </p>

            <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
              <button
                onClick={() => setRole('RESELLER')}
                className="px-8 py-4 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <span>{t('aff_join_btn')}</span>
                <ArrowRight size={18} />
              </button>
              <span className="text-xs text-[#858A82]">{t('aff_subtext')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights & Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F7F8F0] border-t border-[#8A8F98] relative overflow-hidden">
        {/* Oversized Banelio Favicon Watermark (Bottom-Right overflowing) */}
        <div className="absolute -bottom-64 -right-64 w-[850px] h-[850px] sm:w-[1150px] sm:h-[1150px] lg:w-[1350px] lg:h-[1350px] pointer-events-none select-none z-0 opacity-[0.05] -rotate-20 overflow-hidden">
          <img
            src="https://res.cloudinary.com/hxbmhqiq/image/upload/v1787810546/Untitled_design_5_1.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 relative z-10">
          <div className="bg-white p-8 rounded-3xl border border-[#8A8F98] shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#B8F23A] text-[#070707] flex items-center justify-center font-black text-xl">
              30%
            </div>
            <h3 className="text-xl font-bold text-[#070707]">
              {language === 'en' ? 'Recurring Lifetime Commissions' : 'Comisiones Recurrentes de por Vida'}
            </h3>
            <p className="text-xs sm:text-sm text-[#555A52] leading-relaxed">
              {language === 'en'
                ? 'Earn commissions not just on the first sale, but every time your client renews their hosting, email, or domain year after year.'
                : 'Gana no solo en la primera venta, sino cada vez que tu cliente renueve su servicio de hosting, correo o dominio año con año.'}
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-[#8A8F98] shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#B8F23A] text-[#070707] flex items-center justify-center font-black text-xl">
              60d
            </div>
            <h3 className="text-xl font-bold text-[#070707]">
              {language === 'en' ? '60-Day Tracking Cookie' : 'Cookie de Seguimiento de 60 Días'}
            </h3>
            <p className="text-xs sm:text-sm text-[#555A52] leading-relaxed">
              {language === 'en'
                ? 'If a visitor clicks your link and purchases up to 60 days later, the commission is automatically attributed to your account.'
                : 'Si un visitante entra con tu enlace y compra hasta 60 días después, la comisión se acredita automáticamente a tu cuenta.'}
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-[#8A8F98] shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#B8F23A] text-[#070707] flex items-center justify-center font-black text-xl">
              $0
            </div>
            <h3 className="text-xl font-bold text-[#070707]">
              {language === 'en' ? 'Zero Cost & Real-Time Payouts' : '100% Gratuito y Pagos Puntuales'}
            </h3>
            <p className="text-xs sm:text-sm text-[#555A52] leading-relaxed">
              {language === 'en'
                ? 'No sign-up or maintenance fees. Withdraw your balance via PayPal or local bank transfer when you reach $25 USD.'
                : 'Sin cuotas de inscripción ni mantenimiento. Retira tu saldo por PayPal o transferencia bancaria al alcanzar $25 USD.'}
            </p>
          </div>
        </div>

        {/* CTA box */}
        <div className="mt-16 bg-white border border-[#8A8F98] p-8 sm:p-12 rounded-3xl text-center space-y-6 relative z-10 shadow-sm">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#070707]">
            {language === 'en' ? 'Ready to monetize your audience?' : '¿Listo para monetizar tu tráfico y clientes?'}
          </h2>
          <div className="flex flex-wrap justify-center gap-6 text-xs sm:text-sm text-[#555A52]">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#B8F23A]" />
              {language === 'en' ? 'Instant Activation' : 'Activación Instantánea'}
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#B8F23A]" />
              {language === 'en' ? 'Real-Time Tracking Dashboard' : 'Panel de Seguimiento en Tiempo Real'}
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#B8F23A]" />
              {language === 'en' ? 'High Conversion Rates' : 'Alta Tasa de Conversión'}
            </span>
          </div>
          <button
            onClick={() => setRole('RESELLER')}
            className="px-8 py-4 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] font-black rounded-2xl text-sm transition-all shadow-md cursor-pointer"
          >
            {t('aff_portal_btn')}
          </button>
        </div>
        </div>
      </section>
    </div>
  );
}
