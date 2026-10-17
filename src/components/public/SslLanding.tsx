import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Lock,
  Check,
  ExternalLink,
  Sparkles,
  TrendingUp,
  CreditCard,
  Globe2,
  Award,
  CheckCircle2
} from 'lucide-react';
import { openSslStore } from '../../services/supersiteService';

export default function SslLanding() {
  const { language } = useApp();

  const sslTypes = [
    {
      id: 'dv',
      name: language === 'en' ? 'PositiveSSL Standard (DV)' : 'SSL Validación de Dominio (DV)',
      issuer: 'Sectigo / Comodo CA',
      tagline: language === 'en' ? 'Fast automated issuance in 5 minutes for blogs and company websites' : 'Emisión exprés en 5 minutos sin papeleos para webs corporativas y blogs',
      recommended: false,
      badge: language === 'en' ? 'Fast Issuance' : 'Activación Exprés',
      warranty: '$10,000 USD',
      features: [
        language === 'en' ? 'Protects 1 single domain (www & non-www)' : 'Protege 1 dominio principal (con y sin www)',
        language === 'en' ? 'Instant domain validation via email or DNS' : 'Validación instantánea por correo o registro DNS',
        language === 'en' ? 'Up to 256-bit encryption with SHA-256' : 'Cifrado de 256 bits con firma SHA-256',
        language === 'en' ? 'Activates the secure HTTPS padlock in 99.9% of browsers' : 'Activa el candado HTTPS en el 99.9% de navegadores',
        language === 'en' ? 'Static Trust Site Seal included' : 'Sello de sitio seguro estático para tu web'
      ]
    },
    {
      id: 'wildcard',
      name: language === 'en' ? 'Wildcard SSL (*.domain.com)' : 'SSL Wildcard Comodín (*.dominio)',
      issuer: 'Sectigo / Comodo CA',
      tagline: language === 'en' ? 'Secure your main domain and unlimited subdomains with one certificate' : 'Protege tu dominio y subdominios ilimitados con un único certificado',
      recommended: true,
      badge: language === 'en' ? 'Most Flexible' : 'Más Versátil',
      warranty: '$250,000 USD',
      features: [
        language === 'en' ? 'Protects *.yourbrand.com (unlimited subdomains)' : 'Protege *.tuempresa.com (subdominios ilimitados)',
        language === 'en' ? 'Ideal for SaaS, client portals, staging, and multi-stores' : 'Ideal para plataformas SaaS, portales y tiendas múltiples',
        language === 'en' ? 'Single private key and certificate file to manage' : 'Un solo certificado para renovar y administrar',
        language === 'en' ? '256-bit military-grade encryption' : 'Cifrado robusto de 256 bits nivel bancario',
        language === 'en' ? 'Unlimited server reissuances free of charge' : 'Reemisiones ilimitadas de servidor sin costo'
      ]
    },
    {
      id: 'ev',
      name: language === 'en' ? 'Extended Validation SSL (EV)' : 'SSL Validación Extendida (EV)',
      issuer: 'Sectigo Enterprise CA',
      tagline: language === 'en' ? 'The highest level of brand verification and commercial legal guarantee' : 'El máximo nivel de validación corporativa y respaldo legal para e-commerce',
      recommended: false,
      badge: language === 'en' ? 'Maximum Trust' : 'Máxima Autoridad',
      warranty: '$1,750,000 USD',
      features: [
        language === 'en' ? 'Rigorous legal vetting of corporate identity' : 'Validación jurídica de la razón social de la empresa',
        language === 'en' ? 'Displays verified legal entity in certificate details' : 'Muestra el nombre legal de tu empresa en el certificado',
        language === 'en' ? 'Highest financial warranty up to $1.75M USD' : 'Garantía legal y financiera de hasta $1.75M USD',
        language === 'en' ? 'Dynamic interactive TrustLogo security seal' : 'Sello interactivo dinámico TrustLogo de alta confianza',
        language === 'en' ? 'Essential for banks, fintech, and high-volume eCommerce' : 'Imprescindible para pasarelas de pago y comercios de alto volumen'
      ]
    }
  ];

  const sslBenefits = [
    {
      icon: <Lock className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'Eliminate "Not Secure" Warnings' : 'Elimina la Alerta "No Seguro"',
      desc: language === 'en'
        ? 'Google Chrome, Safari, and Firefox alert users with a red warning on non-HTTPS sites, causing over 85% visitor abandonment.'
        : 'Los navegadores modernos advierten en rojo a los visitantes en sitios sin SSL, provocando que más del 85% abandone antes de interactuar.'
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'Google SEO Ranking Signal' : 'Impulso Oficial en Google SEO',
      desc: language === 'en'
        ? 'HTTPS is an official Google ranking factor. Secure websites receive preferential indexing and ranking over unencrypted sites.'
        : 'HTTPS es un factor oficial de posicionamiento orgánico en Google. Los sitios con SSL reciben preferencia en los resultados de búsqueda.'
    },
    {
      icon: <CreditCard className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'PCI-DSS Payment Compliance' : 'Cumplimiento Bancario PCI-DSS',
      desc: language === 'en'
        ? 'Mandatory standard by Visa, Mastercard, and American Express for accepting online card payments safely.'
        : 'Estándar obligatorio para procesar pagos con tarjeta de crédito o débito según los lineamientos de las entidades financieras internacionales.'
    },
    {
      icon: <Award className="w-6 h-6 text-[#070707]" />,
      title: language === 'en' ? 'Legal Warranty & Trust Seal' : 'Garantía Legal de Emisión',
      desc: language === 'en'
        ? 'Commercial certificates backed by Sectigo/Comodo include insurance coverage against certificate authority compromise.'
        : 'Los certificados comerciales incluyen pólizas de seguro financiero que protegen a tus compradores contra cualquier fallo de emisión.'
    }
  ];

  return (
    <div className="bg-white text-[#070707] min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#8A8F98]/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#B8F23A]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B8F23A]/25 border border-[#B8F23A] text-xs font-black tracking-wide text-[#070707] uppercase mb-5">
            <ShieldCheck size={14} className="text-[#070707]" />
            <span>{language === 'en' ? 'Accredited SSL & Web Security' : 'Certificados SSL Acreditados & Seguridad Web'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#070707] tracking-tight leading-tight max-w-4xl mx-auto">
            {language === 'en'
              ? 'Protect your users and transactions with HTTPS encryption.'
              : 'Protege las transacciones y datos de tus usuarios con HTTPS seguro.'}
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#555A52] max-w-2xl mx-auto font-normal leading-relaxed">
            {language === 'en'
              ? 'Activate the green padlock, boost your Google rankings, and safeguard confidential data with industry-leading certificates from Sectigo and Comodo CA.'
              : 'Activa el candado de seguridad, escala en los resultados de Google y blinda la información confidencial con certificados de las autoridades líderes mundiales.'}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => openSslStore('_blank')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#B8F23A] hover:bg-[#a6dc32] text-[#070707] font-black text-sm px-6 py-3.5 rounded-xl shadow-xs transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <span>{language === 'en' ? 'View SSL Certificates in SuperSite' : 'Ver Certificados SSL en SuperSite'}</span>
              <ExternalLink size={16} />
            </button>
            <a
              href="https://wa.me/526601254107?text=Hola%20Banelio,%20deseo%20asesoria%20sobre%20certificados%20SSL%20y%20seguridad"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#F7F8F0] hover:bg-[#eaede0] border border-[#8A8F98] text-[#070707] font-bold text-sm px-5 py-3.5 rounded-xl transition-colors cursor-pointer"
            >
              <span>{language === 'en' ? 'Ask a Security Advisor' : 'Consultar por WhatsApp'}</span>
            </a>
          </div>
        </div>
      </section>

      {/* SSL Plans Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-4xl font-black text-[#070707] tracking-tight">
            {language === 'en' ? 'Choose the Right SSL Protection' : 'Certificados Disponibles para tu Sitio'}
          </h2>
          <p className="mt-3 text-[#555A52] text-sm sm:text-base">
            {language === 'en'
              ? 'From single domains to enterprise wildcard and EV validations with direct issuance on SuperSite 2.'
              : 'Desde validación de dominio básica hasta comodines wildcard y certificados EV para empresas, gestionados en SuperSite 2.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {sslTypes.map((ssl) => (
            <div
              key={ssl.id}
              className={`rounded-2xl p-7 flex flex-col justify-between transition-all border ${
                ssl.recommended
                  ? 'border-[#070707] bg-white ring-2 ring-[#B8F23A] shadow-xl relative'
                  : 'border-[#8A8F98]/40 bg-[#F7F8F0]/40 hover:bg-white hover:border-[#8A8F98] hover:shadow-md'
              }`}
            >
              <div>
                <div className="inline-block bg-[#B8F23A] text-[#070707] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-3">
                  {ssl.badge}
                </div>
                <div className="text-xs font-bold text-[#858A82] uppercase tracking-wider mb-1">
                  {ssl.issuer}
                </div>
                <h3 className="text-2xl font-black text-[#070707]">{ssl.name}</h3>
                <p className="text-xs text-[#555A52] mt-2 leading-relaxed min-h-[40px]">
                  {ssl.tagline}
                </p>

                <div className="my-5 p-3 rounded-xl bg-white border border-[#8A8F98]/20 flex items-center justify-between">
                  <span className="text-xs text-[#555A52]">
                    {language === 'en' ? 'Legal Warranty Coverage:' : 'Garantía Legal:'}
                  </span>
                  <span className="text-xs font-black text-[#070707]">{ssl.warranty}</span>
                </div>

                <ul className="space-y-3 text-xs text-[#070707] pt-2 border-t border-[#8A8F98]/20">
                  {ssl.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 size={15} className="text-[#070707] shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-[#8A8F98]/20">
                <button
                  onClick={() => openSslStore('_blank')}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.02] cursor-pointer ${
                    ssl.recommended
                      ? 'bg-[#B8F23A] hover:bg-[#a6dc32] text-[#070707] shadow-xs'
                      : 'bg-[#070707] hover:bg-[#202020] text-white'
                  }`}
                >
                  <span>{language === 'en' ? 'Order SSL on SuperSite' : 'Contratar SSL en SuperSite'}</span>
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 bg-[#F7F8F0] border-t border-[#8A8F98]/20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-4xl font-black text-[#070707] tracking-tight">
              {language === 'en'
                ? 'Crucial advantages of an accredited SSL certificate'
                : 'Ventajas fundamentales de un certificado SSL acreditado'}
            </h2>
            <p className="mt-3 text-[#555A52] text-sm sm:text-base">
              {language === 'en'
                ? 'Why businesses invest in commercial SSL rather than basic self-signed options.'
                : 'Por qué las marcas invierten en certificados con respaldo legal y validación acreditada.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sslBenefits.map((ben, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl border border-[#8A8F98]/30 shadow-2xs hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-[#B8F23A] flex items-center justify-center mb-4">
                  {ben.icon}
                </div>
                <h3 className="text-base font-black text-[#070707] mb-2">{ben.title}</h3>
                <p className="text-xs text-[#555A52] leading-relaxed">{ben.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
