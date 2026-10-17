import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Briefcase,
  Layers,
  Server,
  Globe,
  Check,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Users
} from 'lucide-react';
import { openHostingStore } from '../../services/supersiteService';

export default function ResellersLanding() {
  const { language } = useApp();

  const offerings = [
    {
      icon: <Server className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'Reseller Hosting with WHM' : 'Hosting Reseller con cPanel/WHM',
      desc: language === 'en'
        ? 'Create custom cPanel accounts for each of your web clients. Allocate disk quotas, bandwidth, and email limits freely.'
        : 'Crea cuentas de cPanel independientes para cada cliente. Administra espacio, buzones y recursos desde tu consola WHM central.'
    },
    {
      icon: <Layers className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? '100% White-Label Brand' : '100% Marca Blanca Personalizada',
      desc: language === 'en'
        ? 'Your clients will never see Banelio. Use private custom nameservers (ns1.yourbrand.com) and custom branded cPanel themes.'
        : 'Tus clientes nunca sabrán quién es el proveedor de infraestructura. Utiliza servidores de nombres propios (ns1.tuempresa.com).'
    },
    {
      icon: <Globe className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'Wholesale Domain Pricing' : 'Dominios a Precios Mayoristas',
      desc: language === 'en'
        ? 'Access lower registry acquisition costs across 400+ TLDs (.com, .mx, .io, .ai) with automated API registration.'
        : 'Accede a tarifas preferenciales de distribuidor en más de 400 extensiones para revender con tu propio margen comercial.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'Tier-3 Infrastructure Support' : 'Soporte de Infraestructura Nivel 3',
      desc: language === 'en'
        ? 'Direct escalation access to our senior sysadmins to keep your client operations online 24 hours a day, 365 days a year.'
        : 'Línea de soporte técnico prioritario para resolver cualquier incidente de servidor o DNS de manera ágil.'
    }
  ];

  return (
    <div className="bg-white text-[#070707] min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#8A8F98]/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#B8F23A]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B8F23A]/25 border border-[#B8F23A] text-xs font-black tracking-wide text-[#070707] uppercase mb-5">
            <Briefcase size={14} className="text-[#070707]" />
            <span>{language === 'en' ? 'Reseller & Agency Infrastructure' : 'Soluciones para Agencias & Revendedores'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#070707] tracking-tight leading-tight max-w-4xl mx-auto">
            {language === 'en'
              ? 'Start your own hosting & cloud business under your brand.'
              : 'Construye tu propio negocio de hosting y dominios con tu marca.'}
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#555A52] max-w-2xl mx-auto font-normal leading-relaxed">
            {language === 'en'
              ? 'Equip your digital agency with WebHost Manager (WHM), private nameservers, NVMe PCIe 4.0 speed, and wholesale domain margins.'
              : 'Equipa tu agencia con WebHost Manager (WHM), servidores de nombres privados, velocidad NVMe y márgenes mayoristas en dominios.'}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => openHostingStore('_blank')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#B8F23A] hover:bg-[#a6dc32] text-[#070707] font-black text-sm px-6 py-3.5 rounded-xl shadow-xs transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <span>{language === 'en' ? 'Explore Reseller Plans on SuperSite' : 'Ver Planes Reseller en SuperSite'}</span>
              <ExternalLink size={16} />
            </button>
            <a
              href="https://wa.me/526601254107?text=Hola%20Banelio,%20solicito%20informacion%20para%20Revendedores%20y%20Agencias"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#F7F8F0] hover:bg-[#eaede0] border border-[#8A8F98] text-[#070707] font-bold text-sm px-5 py-3.5 rounded-xl transition-colors cursor-pointer"
            >
              <span>{language === 'en' ? 'Talk to a Partner Manager' : 'Hablar con Asesor por WhatsApp'}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Offerings */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {offerings.map((off, idx) => (
            <div
              key={idx}
              className="bg-white p-7 rounded-2xl border border-[#8A8F98]/40 shadow-xs hover:border-[#070707] hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-[#B8F23A] flex items-center justify-center mb-4">
                {off.icon}
              </div>
              <h3 className="text-lg font-black text-[#070707] mb-2">{off.title}</h3>
              <p className="text-xs text-[#555A52] leading-relaxed">{off.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
