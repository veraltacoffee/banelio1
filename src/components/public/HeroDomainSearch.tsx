import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Loader2, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import DomainTransferModal from './DomainTransferModal';
import {
  parseDomainInput,
  submitDomainSearchToSuperSite
} from '../../services/supersiteService';
import { POPULAR_TLDS } from '../../config/supersite';

export default function HeroDomainSearch() {
  const { t, language } = useApp();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'REGISTER' | 'TRANSFER'>('REGISTER');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetDomain, setTransferTargetDomain] = useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      const action = params.get('action');
      if (tab === 'transfer' || action === 'transfer') {
        setActiveTab('TRANSFER');
        setIsTransferModalOpen(true);
      }
    }
  }, []);

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
      // Envío POST oficial directo a la plataforma de búsqueda
      submitDomainSearchToSuperSite(parsed.domainName, parsed.tld, '_blank');
      setTimeout(() => {
        setIsSearching(false);
      }, 800);
    } catch {
      setIsSearching(false);
      setSearchError(
        language === 'en'
          ? 'Could not connect to domain search. Please try again.'
          : 'No se pudo conectar con el sistema de búsqueda. Por favor intenta de nuevo.'
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
    <section className="relative overflow-hidden pt-14 pb-24 px-4 sm:px-6 lg:px-8 bg-white text-[#070707]">
      {/* Oversized Banelio Favicon Watermark (Bottom-Left overflowing) */}
      <div className="absolute -bottom-64 -left-64 w-[850px] h-[850px] sm:w-[1150px] sm:h-[1150px] lg:w-[1350px] lg:h-[1350px] pointer-events-none select-none z-0 opacity-[0.04] rotate-12 overflow-hidden">
        <img
          src="https://res.cloudinary.com/hxbmhqiq/image/upload/v1787810546/Untitled_design_5_1.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Intro Background Image with 100% pure white background, no drop shadows or halos */}
      <div className="absolute top-0 right-0 w-full sm:w-4/5 lg:w-3/5 h-[580px] sm:h-[620px] lg:h-[660px] pointer-events-none overflow-hidden z-0 flex justify-end">
        <img
          src="/hero_pure_white.png"
          alt="Banelio Infraestructura y Servicios Digitales"
          className="w-full h-full object-contain object-top lg:object-right-top"
        />
      </div>

      {/* Soft edge gradients ensuring 100% legibility and seamless white background integration */}
      <div className="absolute top-0 left-0 right-0 h-[660px] pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 sm:via-white/70 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[#DFF5B5]/25 blur-[140px]"></div>
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10 pt-4">
        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#070707] mb-6 leading-tight">
          {t('hero_title_line1')} <br className="hidden sm:inline" />
          <span className="bg-[#B9E86A] text-[#070707] px-4 py-1.5 rounded-2xl inline-block mt-1.5 font-black shadow-xs">
            {t('hero_title_line2')}
          </span>
        </h1>

        <p className="text-[#555A52] text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          {t('hero_subtitle')}
        </p>

        {/* Search / Transfer Switcher */}
        <div className="inline-flex p-1.5 bg-[#F7F8F0] backdrop-blur-md rounded-2xl border border-[#E2E5DA] mb-6 shadow-2xs">
          <button
            id="hero-tab-register-btn"
            onClick={() => setActiveTab('REGISTER')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707] ${
              activeTab === 'REGISTER'
                ? 'bg-[#B9E86A] text-[#070707] shadow-xs'
                : 'text-[#555A52] hover:text-[#070707]'
            }`}
          >
            {t('hero_tab_register')}
          </button>
          <button
            id="hero-tab-transfer-btn"
            onClick={() => setActiveTab('TRANSFER')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707] ${
              activeTab === 'TRANSFER'
                ? 'bg-[#B9E86A] text-[#070707] shadow-xs'
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
              id="hero-domain-input"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (searchError) setSearchError(null);
              }}
              aria-label={language === 'en' ? 'Domain name search input' : 'Buscador de nombres de dominio'}
              placeholder={activeTab === 'REGISTER' ? t('hero_search_placeholder') : t('hero_transfer_placeholder')}
              className="w-full pl-6 pr-36 sm:pr-48 py-5 rounded-2xl bg-white text-[#070707] placeholder-[#858A82] text-base sm:text-lg font-bold shadow-xl border-2 border-[#E2E5DA] focus:border-[#070707] focus:ring-2 focus:ring-[#B9E86A] outline-none transition-all"
            />
            <button
              id="hero-search-submit-btn"
              type="submit"
              disabled={isSearching || !query.trim()}
              aria-busy={isSearching}
              className="absolute right-2.5 top-2.5 bottom-2.5 bg-[#B9E86A] hover:bg-[#CBEF8A] active:scale-95 disabled:bg-[#E2E5DA] disabled:text-[#858A82] text-[#070707] px-6 sm:px-8 rounded-xl font-black text-sm sm:text-base flex items-center gap-2 shadow-md transition-all cursor-pointer hover:scale-[1.02] disabled:cursor-not-allowed disabled:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707]"
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

          {/* Validation Error Banner */}
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

        {/* Quick TLD Badges: send direct search to official store */}
        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 text-xs">
          <span className="text-[#555A52] font-semibold mr-1">{t('hero_featured_ext')}:</span>
          {POPULAR_TLDS.map((tld) => (
            <button
              key={tld}
              id={`hero-quick-tld-${tld}`}
              disabled={isSearching}
              onClick={() => handleQuickTldClick(tld)}
              className="bg-white hover:bg-[#F7F8F0] border border-[#E2E5DA] hover:border-[#070707] px-4 py-1.5 rounded-xl text-[#070707] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707]"
              title={`${language === 'en' ? 'Search domain in' : 'Buscar dominio en'} .${tld}`}
            >
              <span className="font-black text-[#49652A]">.{tld}</span>
              <ArrowRight size={12} className="text-[#555A52]" />
            </button>
          ))}
        </div>
      </div>

      {/* DOMAIN TRANSFER MODAL */}
      <DomainTransferModal
        domain={transferTargetDomain || query}
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />
    </section>
  );
}
