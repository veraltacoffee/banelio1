import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Loader2, Shield, RefreshCw, Lock, Cpu, AlertCircle, ArrowRight } from 'lucide-react';
import DomainTransferModal from './DomainTransferModal';
import {
  parseDomainInput,
  submitDomainSearchToSuperSite,
  openSuperSiteStore
} from '../../services/supersiteService';
import { POPULAR_TLDS } from '../../config/supersite';

export default function DomainsLanding() {
  const { t, language } = useApp();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'REGISTER' | 'TRANSFER'>('REGISTER');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetDomain, setTransferTargetDomain] = useState('');

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSearching) return;

    const parsed = parseDomainInput(query);
    if (!parsed.isValid) {
      setSearchError(
        parsed.errorMessage ||
          (language === 'en'
            ? 'Please enter a valid domain name (e.g. yourcompany.com).'
            : 'Por favor ingresa un nombre de dominio válido (ej. tuempresa.com).')
      );
      return;
    }

    setSearchError(null);

    if (activeTab === 'TRANSFER') {
      setTransferTargetDomain(parsed.fullDomain);
      setIsTransferModalOpen(true);
      return;
    }

    setIsSearching(true);
    try {
      submitDomainSearchToSuperSite(parsed.domainName, parsed.tld, '_blank');
      setTimeout(() => {
        setIsSearching(false);
      }, 800);
    } catch {
      setIsSearching(false);
      setSearchError(
        language === 'en'
          ? 'Could not connect with SuperSite 2. Please try again.'
          : 'No se pudo conectar con SuperSite 2. Por favor intenta de nuevo.'
      );
    }
  };

  const handleQuickTldClick = (tld: string) => {
    const rawName = query.trim() ? parseDomainInput(query).domainName || 'miempresa' : 'miempresa';
    setQuery(`${rawName}.${tld}`);
    setSearchError(null);
    setIsSearching(true);
    submitDomainSearchToSuperSite(rawName, tld, '_blank');
    setTimeout(() => {
      setIsSearching(false);
    }, 800);
  };

  return (
    <div className="bg-white text-[#070707]">
      {/* Hero & Search Engine */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
        {/* Oversized Banelio Favicon Watermark (Bottom-Right overflowing) */}
        <div className="absolute -bottom-64 -right-64 w-[850px] h-[850px] sm:w-[1150px] sm:h-[1150px] lg:w-[1350px] lg:h-[1350px] pointer-events-none select-none z-0 opacity-[0.045] -rotate-12 overflow-hidden">
          <img
            src="https://res.cloudinary.com/hxbmhqiq/image/upload/v1787810546/Untitled_design_5_1.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Intro Background Image */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute right-0 top-0 w-full sm:w-4/5 lg:w-3/5 h-full opacity-100 flex justify-end">
            <img
              src="https://res.cloudinary.com/hxbmhqiq/image/upload/v1787809567/Person_posing_for_corporate_website_202608262225ry.jpg"
              alt="Banelio Infraestructura Corporativa"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover sm:object-contain object-top lg:object-right-top"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 sm:via-white/50 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[#B8F23A]/20 blur-[140px]"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#070707] mb-6 leading-tight">
            {t('hero_title_line1')} <br className="hidden sm:inline" />
            <span className="bg-[#B8F23A] text-[#070707] px-4 py-1.5 rounded-2xl inline-block mt-1.5 font-black shadow-xs">
              {t('hero_title_line2')}
            </span>
          </h1>

          <p className="text-[#555A52] text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            {t('hero_subtitle')}
          </p>

          {/* Switcher */}
          <div className="inline-flex p-1 bg-[#F7F8F0] backdrop-blur-md rounded-2xl border border-[#8A8F98] mb-6">
            <button
              onClick={() => setActiveTab('REGISTER')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'REGISTER'
                  ? 'bg-[#B8F23A] text-[#070707] shadow-xs'
                  : 'text-[#555A52] hover:text-[#070707]'
              }`}
            >
              {t('hero_tab_register')}
            </button>
            <button
              onClick={() => setActiveTab('TRANSFER')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'TRANSFER'
                  ? 'bg-[#B8F23A] text-[#070707] shadow-xs'
                  : 'text-[#555A52] hover:text-[#070707]'
              }`}
            >
              <RefreshCw size={13} />
              <span>{t('hero_tab_transfer')}</span>
            </button>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto mb-8 group">
            <div className="relative flex items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (searchError) setSearchError(null);
                }}
                aria-label={language === 'en' ? 'Domain search input' : 'Buscador de dominios'}
                placeholder={activeTab === 'REGISTER' ? t('hero_search_placeholder') : t('hero_transfer_placeholder')}
                className="w-full pl-6 pr-36 sm:pr-44 py-5 rounded-2xl bg-white text-[#070707] placeholder-[#858A82] text-base sm:text-lg font-medium shadow-xl border-2 border-[#8A8F98] focus:border-[#B8F23A] outline-none transition-all"
              />
              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                aria-busy={isSearching}
                className="absolute right-2.5 top-2.5 bottom-2.5 bg-[#B8F23A] hover:bg-[#B8F23A] disabled:bg-[#8A8F98] disabled:text-[#858A82] text-[#070707] px-5 sm:px-8 rounded-xl font-black text-sm sm:text-base flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
              >
                {isSearching ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-[#070707]" />
                    <span className="hidden sm:inline">{t('hero_searching')}</span>
                  </>
                ) : (
                  <>
                    {activeTab === 'REGISTER' ? <Search size={18} /> : <RefreshCw size={18} />}
                    <span>{activeTab === 'REGISTER' ? t('hero_search_btn') : t('hero_verify_btn')}</span>
                  </>
                )}
              </button>
            </div>

            {searchError && (
              <div
                role="alert"
                className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 animate-in fade-in"
              >
                <AlertCircle size={16} className="text-red-500 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}
          </form>

          {/* Top TLD Badges */}
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 text-xs">
            <span className="text-[#555A52] font-semibold mr-1">{t('hero_featured_ext')}:</span>
            {POPULAR_TLDS.map((tld) => (
              <button
                key={tld}
                disabled={isSearching}
                onClick={() => handleQuickTldClick(tld)}
                className="bg-white hover:bg-[#F7F8F0] border border-[#8A8F98] hover:border-[#B8F23A] px-4 py-1.5 rounded-xl text-[#555A52] hover:text-[#070707] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
                title={`${language === 'en' ? 'Search in' : 'Buscar en'} .${tld}`}
              >
                <span className="font-bold text-[#B8F23A]">.{tld}</span>
                <ArrowRight size={12} className="text-[#555A52]" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Domain Features Breakdown */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F7F8F0] border-t border-[#8A8F98] relative overflow-hidden">
        {/* Oversized Banelio Favicon Watermark (Top-Left overflowing) */}
        <div className="absolute -top-64 -left-64 w-[850px] h-[850px] sm:w-[1150px] sm:h-[1150px] lg:w-[1350px] lg:h-[1350px] pointer-events-none select-none z-0 opacity-[0.05] rotate-20 overflow-hidden">
          <img
            src="https://res.cloudinary.com/hxbmhqiq/image/upload/v1787810546/Untitled_design_5_1.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-[#070707] tracking-tight">
              {language === 'en' ? 'Everything Included with Every Domain Registration' : 'Todo lo que incluye cada registro de dominio'}
            </h2>
            <p className="text-[#555A52] mt-2 text-sm">
              {language === 'en' ? 'Direct provisioning with official ICANN registry accreditation.' : 'Aprovisionamiento directo con acreditación oficial de registry e ICANN.'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-[#8A8F98] shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F7F8F0] border border-[#8A8F98] text-[#B8F23A] flex items-center justify-center font-bold">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#070707]">
                {language === 'en' ? 'Free WHOIS Privacy Protection' : 'Privacidad WHOIS Gratuita'}
              </h3>
              <p className="text-xs text-[#555A52] leading-relaxed">
                {language === 'en'
                  ? 'Your personal information (name, email, phone) is permanently masked from spammers and public databases at zero extra charge.'
                  : 'Tus datos personales (nombre, teléfono y dirección) quedan enmascarados ante spammers y bases de datos públicas de forma permanente.'}
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-[#8A8F98] shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F7F8F0] border border-[#8A8F98] text-[#B8F23A] flex items-center justify-center font-bold">
                <Cpu size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#070707]">
                {language === 'en' ? 'Advanced Anycast DNS Panel' : 'Panel DNS Avanzado Anycast'}
              </h3>
              <p className="text-xs text-[#555A52] leading-relaxed">
                {language === 'en'
                  ? 'Complete control over A, AAAA, CNAME, MX, TXT, SPF, and DKIM records with lightning-fast global propagation.'
                  : 'Control total de registros A, AAAA, CNAME, MX, TXT, SPF y DKIM con propagación global instantánea en segundos.'}
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-[#8A8F98] shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F7F8F0] border border-[#8A8F98] text-[#B8F23A] flex items-center justify-center font-bold">
                <Lock size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#070707]">
                {language === 'en' ? 'Transfer Lock & Theft Shield' : 'Bloqueo Anti-Robo (Transfer Lock)'}
              </h3>
              <p className="text-xs text-[#555A52] leading-relaxed">
                {language === 'en'
                  ? 'Keep your domain locked against unauthorized transfers. EPP authorization code instantly available in your panel.'
                  : 'Protege tu dominio contra transferencias no autorizadas. Código de autorización EPP disponible en 1 clic en tu panel.'}
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => openSuperSiteStore('_blank')}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] font-black text-sm rounded-2xl shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <span>{language === 'en' ? 'Explore Full SuperSite Catalog' : 'Explorar Catálogo Completo en SuperSite'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Domain Transfer Modal */}
      <DomainTransferModal
        domain={transferTargetDomain || query}
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />
    </div>
  );
}
