import React from 'react';
import { useApp } from '../../context/AppContext';
import HostingPlans from './HostingPlans';
import { Zap, HardDrive, Headphones } from 'lucide-react';

export default function HostingLanding() {
  const { t, language } = useApp();

  return (
    <div className="bg-white text-[#070707]">
      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#070707] text-[#FCFCF8] relative overflow-hidden border-b border-[#242424]">
        {/* Oversized Banelio Favicon Watermark (Top-Left overflowing) */}
        <div className="absolute -top-64 -left-64 w-[850px] h-[850px] sm:w-[1150px] sm:h-[1150px] lg:w-[1350px] lg:h-[1350px] pointer-events-none select-none z-0 opacity-[0.07] brightness-150 rotate-15 overflow-hidden">
          <img
            src="https://res.cloudinary.com/hxbmhqiq/image/upload/v1787810546/Untitled_design_5_1.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            {t('host_title')}
          </h1>
          <p className="text-[#A0A69D] text-base sm:text-lg max-w-2xl mx-auto">
            {t('host_subtitle')}
          </p>
        </div>
      </section>

      {/* Hosting Plans Component (bg-[#F7F8F0]) */}
      <HostingPlans />

      {/* Technical Infrastructure Specs (bg-white) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-[#8A8F98] relative overflow-hidden">
        {/* Oversized Banelio Favicon Watermark (Bottom-Left overflowing) */}
        <div className="absolute -bottom-64 -left-64 w-[850px] h-[850px] sm:w-[1150px] sm:h-[1150px] lg:w-[1350px] lg:h-[1350px] pointer-events-none select-none z-0 opacity-[0.045] -rotate-12 overflow-hidden">
          <img
            src="https://res.cloudinary.com/hxbmhqiq/image/upload/v1787810546/Untitled_design_5_1.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-[#070707] tracking-tight">
              {language === 'en' ? 'Enterprise Cloud Architecture Engineered for Speed' : 'Arquitectura Cloud Diseñada para Máxima Velocidad'}
            </h2>
            <p className="text-[#555A52] mt-3 text-base">
              {language === 'en'
                ? 'High-redundancy hardware nodes with isolated cPanel account virtualization.'
                : 'Nodos de hardware de alta redundancia con aislamiento total por cuenta en CloudLinux.'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#F8F9F3] p-8 rounded-3xl border border-[#8A8F98] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#B8F23A] text-[#070707] flex items-center justify-center font-bold">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#070707]">
                {language === 'en' ? 'LiteSpeed + LSCache' : 'LiteSpeed + Caché LSCache'}
              </h3>
              <p className="text-xs text-[#555A52] leading-relaxed">
                {language === 'en'
                  ? 'Up to 300% faster response times for WordPress and PHP applications compared to Apache or NGINX.'
                  : 'Tiempos de respuesta hasta 300% más veloces en WordPress y aplicaciones PHP frente a Apache o Nginx tradicionales.'}
              </p>
            </div>

            <div className="bg-[#F8F9F3] p-8 rounded-3xl border border-[#8A8F98] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#B8F23A] text-[#070707] flex items-center justify-center font-bold">
                <HardDrive size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#070707]">
                {language === 'en' ? '100% Pure NVMe PCIe 4.0' : 'Almacenamiento NVMe PCIe 4.0'}
              </h3>
              <p className="text-xs text-[#555A52] leading-relaxed">
                {language === 'en'
                  ? 'Ultra high IOPS throughput eliminating database disk bottlenecks under peak customer traffic.'
                  : 'Tasas masivas de IOPS que eliminan cualquier cuello de botella en bases de datos MySQL con alto tráfico.'}
              </p>
            </div>

            <div className="bg-[#F8F9F3] p-8 rounded-3xl border border-[#8A8F98] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#B8F23A] text-[#070707] flex items-center justify-center font-bold">
                <Headphones size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#070707]">
                {language === 'en' ? '24/7 Expert SysAdmin Support' : 'Soporte Especializado 24/7'}
              </h3>
              <p className="text-xs text-[#555A52] leading-relaxed">
                {language === 'en'
                  ? 'Immediate ticket and WhatsApp assistance by certified system engineers in Spanish and English.'
                  : 'Atención inmediata por ingenieros de sistemas certificados mediante tickets y WhatsApp 24/7/365.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
