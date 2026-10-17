import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Mail,
  ShieldCheck,
  Check,
  ExternalLink,
  Sparkles,
  Smartphone,
  Lock,
  Globe,
  Users,
  Calendar,
  Send,
  CheckCircle2
} from 'lucide-react';
import { openEmailStore } from '../../services/supersiteService';

export default function EmailLanding() {
  const { language } = useApp();

  const suites = [
    {
      id: 'titan',
      name: language === 'en' ? 'Titan Business Email' : 'Titan Email Empresarial',
      tagline: language === 'en' ? 'Modern, ultra-fast professional email designed for growing businesses' : 'Correo profesional ultrarrápido y moderno diseñado para empresas',
      recommended: true,
      badge: language === 'en' ? 'Best Value & Ease of Use' : 'Mejor Relación Calidad-Precio',
      features: [
        language === 'en' ? 'Custom inboxes with your domain (@yourbrand.com)' : 'Buzones con tu propio dominio (@tuempresa.com)',
        language === 'en' ? '10 GB or 50 GB storage per inbox' : '10 GB o 50 GB de almacenamiento por buzón',
        language === 'en' ? 'Ultra-clean Webmail + Native iOS & Android Apps' : 'Webmail moderno y Apps nativas para iOS y Android',
        language === 'en' ? 'SPF, DKIM, and DMARC pre-configured for maximum deliverability' : 'Registros SPF, DKIM y DMARC preconfigurados para no caer en spam',
        language === 'en' ? 'Shared team calendars, address books, and task lists' : 'Calendarios compartidos, libreta de contactos y tareas',
        language === 'en' ? 'Professional email signature generator with company branding' : 'Generador de firmas corporativas uniformes',
        language === 'en' ? 'Read receipts, send later, and email templates' : 'Confirmación de lectura, programar envío y plantillas'
      ]
    },
    {
      id: 'gsuite',
      name: 'Google Workspace',
      tagline: language === 'en' ? 'The complete cloud productivity suite by Google with Gmail' : 'La suite en la nube líder de Google con la potencia de Gmail',
      recommended: false,
      badge: language === 'en' ? 'Google Cloud Ecosystem' : 'Ecosistema Google',
      features: [
        language === 'en' ? 'Professional Gmail experience with your corporate domain' : 'Experiencia Gmail profesional con tu dominio corporativo',
        language === 'en' ? '30 GB to 2 TB Google Drive cloud storage per user' : 'Desde 30 GB hasta 2 TB en Google Drive por usuario',
        language === 'en' ? 'Google Meet video meetings for up to 150 participants' : 'Videoconferencias en Google Meet para hasta 150 personas',
        language === 'en' ? 'Collaborative Google Docs, Sheets, Slides, and Forms' : 'Edición colaborativa en tiempo real de Documentos, Hojas de cálculo y Diapositivas',
        language === 'en' ? 'Single Sign-On (SSO) and central Google Admin console' : 'Consola central de administración de Google y autenticación SSO',
        language === 'en' ? 'Enterprise-grade 99.9% uptime SLA by Google' : 'Garantía oficial de disponibilidad 99.9% de Google'
      ]
    },
    {
      id: 'm365',
      name: 'Microsoft 365 Business',
      tagline: language === 'en' ? 'Industry-standard enterprise email and Microsoft Office apps' : 'El estándar corporativo con Outlook, Word, Excel y Microsoft Teams',
      recommended: false,
      badge: language === 'en' ? 'Corporate Standard' : 'Estándar Corporativo',
      features: [
        language === 'en' ? 'Business-class Exchange email with 50 GB inbox' : 'Correo empresarial Exchange con buzón de 50 GB por usuario',
        language === 'en' ? '1 TB OneDrive cloud storage per user with ransomware protection' : '1 TB de almacenamiento en la nube OneDrive con protección anti-ransomware',
        language === 'en' ? 'Web & desktop versions of Word, Excel, PowerPoint, and Outlook' : 'Acceso a Word, Excel, PowerPoint y Outlook',
        language === 'en' ? 'Microsoft Teams for internal chat, calling, and meetings' : 'Microsoft Teams para chat, videollamadas y canales de equipo',
        language === 'en' ? 'Advanced threat protection and data loss prevention' : 'Protección avanzada contra amenazas y filtración de datos'
      ]
    }
  ];

  const emailAdvantages = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'Pre-Configured SPF, DKIM & DMARC' : 'Autenticación Criptográfica SPF, DKIM y DMARC',
      desc: language === 'en'
        ? 'Avoid spam filters in Gmail, Yahoo, and Outlook. Protect your domain reputation from spoofing and phishing.'
        : 'Evita que tus cotizaciones y facturas terminen en la carpeta de correo no deseado. Blindamos tu marca contra falsificación de identidad.'
    },
    {
      icon: <Smartphone className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'Multi-Device Sync (IMAP / Mobile)' : 'Sincronización Total en Celular y Computadora',
      desc: language === 'en'
        ? 'Seamless synchronization across iPhone, Android, Apple Mail, Outlook, and modern Webmail interfaces.'
        : 'Tus correos, carpetas y contactos se mantienen perfectamente sincronizados en tu teléfono móvil, tablet y programas de escritorio.'
    },
    {
      icon: <Lock className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'TLS End-to-End Encryption' : 'Cifrado TLS Punto a Punto',
      desc: language === 'en'
        ? 'All messages are encrypted in transit and at rest with strict TLS 1.3 standards to comply with privacy laws.'
        : 'Toda la correspondencia viaja cifrada con los estándares criptográficos más altos, cumpliendo con la legislación de protección de datos.'
    },
    {
      icon: <Users className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'Shared Calendars & Address Books' : 'Calendarios y Contactos de Equipo',
      desc: language === 'en'
        ? 'Coordinate meetings, check colleague availability, and access central corporate directories.'
        : 'Coordina reuniones con tus colaboradores, consulta disponibilidad de salas y mantén un directorio corporativo unificado.'
    }
  ];

  return (
    <div className="bg-white text-[#070707] min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#8A8F98]/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#B8F23A]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B8F23A]/25 border border-[#B8F23A] text-xs font-black tracking-wide text-[#070707] uppercase mb-5">
            <Mail size={14} className="text-[#070707]" />
            <span>{language === 'en' ? 'Business Email Solutions' : 'Correo Corporativo con Dominio Propio'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#070707] tracking-tight leading-tight max-w-4xl mx-auto">
            {language === 'en'
              ? 'Build trust with professional email @yourcompany.com'
              : 'Proyecta legitimidad y confianza con correos @tuempresa.com'}
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#555A52] max-w-2xl mx-auto font-normal leading-relaxed">
            {language === 'en'
              ? 'Leave free personal addresses behind. Choose from Titan Business Email, Google Workspace, and Microsoft 365 with high deliverability and spam filtering.'
              : 'Deja atrás los buzones gratuitos. Descubre Titan Email, Google Workspace y Microsoft 365 con autenticación criptográfica SPF/DKIM/DMARC y máxima entregabilidad.'}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => openEmailStore('_blank')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#B8F23A] hover:bg-[#a6dc32] text-[#070707] font-black text-sm px-6 py-3.5 rounded-xl shadow-xs transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <span>{language === 'en' ? 'View Email Plans in SuperSite' : 'Ver Planes de Correo en SuperSite'}</span>
              <ExternalLink size={16} />
            </button>
            <a
              href="https://wa.me/526601254107?text=Hola%20Banelio,%20deseo%20asesoria%20sobre%20correo%20empresarial"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#F7F8F0] hover:bg-[#eaede0] border border-[#8A8F98] text-[#070707] font-bold text-sm px-5 py-3.5 rounded-xl transition-colors cursor-pointer"
            >
              <span>{language === 'en' ? 'Migration Assistance WhatsApp' : 'Asesoría de Migración por WhatsApp'}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Solutions Comparison */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-4xl font-black text-[#070707] tracking-tight">
            {language === 'en' ? 'Available Email Platforms' : 'Opciones de Correo Empresarial'}
          </h2>
          <p className="mt-3 text-[#555A52] text-sm sm:text-base">
            {language === 'en'
              ? 'Choose the platform that best fits your workflow, team size, and collaboration requirements.'
              : 'Selecciona la plataforma que mejor se adapte a tu dinámica de trabajo, tamaño de equipo y herramientas colaborativas.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {suites.map((suite) => (
            <div
              key={suite.id}
              className={`rounded-2xl p-7 flex flex-col justify-between transition-all border ${
                suite.recommended
                  ? 'border-[#070707] bg-white ring-2 ring-[#B8F23A] shadow-xl relative'
                  : 'border-[#8A8F98]/40 bg-[#F7F8F0]/40 hover:bg-white hover:border-[#8A8F98] hover:shadow-md'
              }`}
            >
              <div>
                <div className="inline-block bg-[#B8F23A] text-[#070707] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-3">
                  {suite.badge}
                </div>
                <h3 className="text-2xl font-black text-[#070707]">{suite.name}</h3>
                <p className="text-xs text-[#555A52] mt-2 leading-relaxed min-h-[40px]">
                  {suite.tagline}
                </p>

                <div className="my-5 p-3 rounded-xl bg-white border border-[#8A8F98]/20 text-center">
                  <span className="text-xs font-bold text-[#555A52] block">
                    {language === 'en' ? 'SuperSite 2 Commercial Catalog' : 'Catálogo Comercial SuperSite'}
                  </span>
                  <span className="text-xs text-[#858A82]">
                    {language === 'en' ? 'Official pricing & account setup' : 'Precios oficiales y configuración'}
                  </span>
                </div>

                <ul className="space-y-3 text-xs text-[#070707] pt-2 border-t border-[#8A8F98]/20">
                  {suite.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 size={15} className="text-[#070707] shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-[#8A8F98]/20">
                <button
                  onClick={() => openEmailStore('_blank')}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.02] cursor-pointer ${
                    suite.recommended
                      ? 'bg-[#B8F23A] hover:bg-[#a6dc32] text-[#070707] shadow-xs'
                      : 'bg-[#070707] hover:bg-[#202020] text-white'
                  }`}
                >
                  <span>{language === 'en' ? 'Check & Order on SuperSite' : 'Ver y Contratar en SuperSite'}</span>
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Security & Features */}
      <section className="py-20 bg-[#F7F8F0] border-t border-[#8A8F98]/20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-4xl font-black text-[#070707] tracking-tight">
              {language === 'en'
                ? 'Why corporate email is critical for your company'
                : 'Por qué el correo corporativo es imprescindible'}
            </h2>
            <p className="mt-3 text-[#555A52] text-sm sm:text-base">
              {language === 'en'
                ? 'Security protocols and business reputation guarantees included with Banelio email.'
                : 'Protocolos de seguridad y garantías de reputación que diferencian una comunicación profesional.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {emailAdvantages.map((adv, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl border border-[#8A8F98]/30 shadow-2xs hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-[#B8F23A] flex items-center justify-center mb-4">
                  {adv.icon}
                </div>
                <h3 className="text-base font-black text-[#070707] mb-2">{adv.title}</h3>
                <p className="text-xs text-[#555A52] leading-relaxed">{adv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
