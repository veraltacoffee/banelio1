import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/pricing';
import { ArrowRight, Server, Globe, Mail, Shield, CheckCircle2, Zap, Award, ShoppingBag } from 'lucide-react';

interface CleanHomeLandingProps {
  onNavigate: (route: string) => void;
}

export default function CleanHomeLanding({ onNavigate }: CleanHomeLandingProps) {
  const { currency, addToCart } = useApp();

  return (
    <div className="bg-[#FCFCF8] text-[#070707]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4 sm:px-6 lg:px-8 bg-[#FCFCF8]">
        {/* Subtle Oversized Favicon Watermark (Bottom-Left overflowing) */}
        <div className="absolute -bottom-52 -left-52 w-[650px] h-[650px] sm:w-[850px] sm:h-[850px] pointer-events-none select-none z-0 opacity-[0.04] rotate-12 overflow-hidden">
          <img
            src="https://res.cloudinary.com/hxbmhqiq/image/upload/v1787810546/Untitled_design_5_1.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Intro Background Image Overlay with enhanced framing and visibility */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute right-0 top-0 w-full sm:w-4/5 lg:w-3/5 h-full opacity-100 flex justify-end">
            <img
              src="https://res.cloudinary.com/hxbmhqiq/image/upload/v1787809567/Person_posing_for_corporate_website_202608262225ry.jpg"
              alt="Banelio Infraestructura Corporativa"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover sm:object-contain object-top lg:object-right-top"
            />
          </div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-[#F7F8F0] border border-[#8A8F98] px-4 py-1.5 rounded-full text-xs font-bold text-[#B8F23A]">
            <Zap size={14} />
            <span>Infraestructura Cloud de Nueva Generación</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#070707] leading-tight">
            La plataforma definitiva para <br className="hidden sm:inline" />
            <span className="text-[#B8F23A]">dominios, hosting y marcas digitales.</span>
          </h1>

          <p className="text-[#555A52] text-base sm:text-xl max-w-2xl mx-auto font-normal leading-relaxed">
            Aprovisionamiento instantáneo, discos NVMe de ultra velocidad, correo corporativo protegido y soporte técnico premium 24/7.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
            <button
              onClick={() => onNavigate('/dominios')}
              className="px-8 py-4 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] !text-[#070707] rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              <span>Buscar mi Dominio</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => onNavigate('/hosting')}
              className="px-8 py-4 bg-[#FFFFFF] hover:bg-[#F7F8F0] text-[#070707] border border-[#8A8F98] rounded-2xl font-bold text-sm transition-all cursor-pointer shadow-xs"
            >
              Ver Planes de Hosting
            </button>
          </div>
        </div>
      </section>

      {/* 3 Core Pillars */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#8A8F98]">
        <div className="grid md:grid-cols-3 gap-8">
          <div
            onClick={() => onNavigate('/dominios')}
            className="group bg-[#FFFFFF] p-8 rounded-3xl border border-[#8A8F98] hover:border-[#B8F23A] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#F7F8F0] text-[#070707] group-hover:bg-[#B8F23A] group-hover:text-[#070707] flex items-center justify-center font-bold transition-colors">
                <Globe size={28} />
              </div>
              <h3 className="text-2xl font-black text-[#070707]">Registro de Dominios</h3>
              <p className="text-xs text-[#555A52] leading-relaxed">
                Registra extensiones globales (.com, .mx, .ai, .online) con privacidad WHOIS incluida y gestión de registros DNS Anycast.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-black text-[#B8F23A]">
              <span>Explorar Dominios</span>
              <ArrowRight size={14} />
            </div>
          </div>

          <div
            onClick={() => onNavigate('/hosting')}
            className="group bg-[#FFFFFF] p-8 rounded-3xl border border-[#8A8F98] hover:border-[#B8F23A] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#F7F8F0] text-[#070707] group-hover:bg-[#B8F23A] group-hover:text-[#070707] flex items-center justify-center font-bold transition-colors">
                <Server size={28} />
              </div>
              <h3 className="text-2xl font-black text-[#070707]">Hosting Cloud NVMe</h3>
              <p className="text-xs text-[#555A52] leading-relaxed">
                Servidores optimizados con cPanel, discos NVMe Gen4, LiteSpeed Web Server y certificados SSL automáticos gratis.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-black text-[#B8F23A]">
              <span>Ver Planes desde $59/mes</span>
              <ArrowRight size={14} />
            </div>
          </div>

          <div
            onClick={() => onNavigate('/email')}
            className="group bg-[#FFFFFF] p-8 rounded-3xl border border-[#8A8F98] hover:border-[#B8F23A] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#F7F8F0] text-[#070707] group-hover:bg-[#B8F23A] group-hover:text-[#070707] flex items-center justify-center font-bold transition-colors">
                <Mail size={28} />
              </div>
              <h3 className="text-2xl font-black text-[#070707]">Correo Profesional</h3>
              <p className="text-xs text-[#555A52] leading-relaxed">
                Cuentas de email con tu propio dominio (ej: contacto@tuempresa.com), filtros anti-spam avanzados y sincronización móvil.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-black text-[#B8F23A]">
              <span>Configurar Email</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* Fast CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F7F8F0] border-t border-[#8A8F98]">
        <div className="max-w-5xl mx-auto bg-[#070707] text-[#FCFCF8] rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold text-[#B8F23A] uppercase tracking-widest">Garantía de Satisfacción</span>
            <h3 className="text-2xl sm:text-3xl font-black">¿Listo para lanzar tu proyecto a internet?</h3>
            <p className="text-[#858A82] text-xs sm:text-sm">Configuración en 60 segundos con soporte en español 24 horas.</p>
          </div>
          <button
            onClick={() => onNavigate('/dominios')}
            className="px-8 py-4 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] font-black text-sm rounded-2xl shrink-0 shadow-lg cursor-pointer transition-all"
          >
            Comenzar Ahora
          </button>
        </div>
      </section>
    </div>
  );
}
