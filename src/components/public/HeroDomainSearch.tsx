import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/pricing';
import { Search, Loader2, CheckCircle2, XCircle, ShoppingBag, Shield, RefreshCw, Info, AlertCircle } from 'lucide-react';
import WhoisModal from '../shared/WhoisModal';
import DomainTransferModal from './DomainTransferModal';
import { sanitizeDomainInput, checkDomainAvailability, checkDomainTransferEligibility, fetchTransferPricing, TransferPricingEntry, DomainSearchResult } from '../../services/domainService';

export default function HeroDomainSearch() {
  const { tlds, getTldPrice, currency, addToCart, cart, t, language } = useApp();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastSearchedDomain, setLastSearchedDomain] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'REGISTER' | 'TRANSFER'>('REGISTER');
  const [searchResults, setSearchResults] = useState<DomainSearchResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [whoisDomain, setWhoisDomain] = useState<string | null>(null);
  const [transferDomain, setTransferDomain] = useState<string | null>(null);
  const [transferPriceUSD, setTransferPriceUSD] = useState<number>(0);
  const [transferPricing, setTransferPricing] = useState<TransferPricingEntry[]>([]);

  React.useEffect(() => {
    fetchTransferPricing().then((entries) => setTransferPricing(entries || []));
  }, []);

  // Quick chips for top TLDs
  const popularTlds = ['com', 'net', 'org', 'mx', 'ai', 'online', 'cloud'];

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSearching) return; // Prevent duplicate requests

    const sanitized = sanitizeDomainInput(query);
    if (!sanitized.valid) {
      setSearchError(sanitized.error || (language === 'en' ? 'Please enter a valid domain name.' : 'Por favor ingresa un nombre de dominio válido.'));
      return;
    }

    setSearchError(null);
    setIsSearching(true);
    setLastSearchedDomain(sanitized.cleanDomain);

    try {
      const primaryPrice = getTldPrice(sanitized.tld);
      const isPromo = Boolean(tlds.find((t) => t.tld === sanitized.tld)?.isPromo);

      if (activeTab === 'TRANSFER') {
        // Query domain transfer endpoint: GET /api/domains/transfer.php?domain={domain}
        const transferRes = await checkDomainTransferEligibility(sanitized.cleanDomain);
        const primaryResult: DomainSearchResult = {
          domain: sanitized.cleanDomain,
          tld: sanitized.tld,
          isAvailable: transferRes.status === 'available',
          status: transferRes.canTransfer ? 'unavailable' : (transferRes.status === 'available' ? 'available' : 'unknown'),
          rawStatus: transferRes.rawStatus || transferRes.status,
          statusText: transferRes.message,
          priceUSD: primaryPrice,
          isPromo
        };
        setSearchResults([primaryResult]);
      } else {
        // 1. Check the primary searched domain directly with the real backend endpoint: /api/domains/check.php?domain={domain}
        const primaryResult = await checkDomainAvailability(sanitized.cleanDomain, primaryPrice, isPromo);

        // 2. Query complementary TLDs for the brand name using the exact same real backend /api/domains/check.php endpoint
        const complementaryTlds = tlds
          .filter((tItem) => tItem.tld !== sanitized.tld)
          .slice(0, 7); // Top extensions to check concurrently

        const complementaryPromises = complementaryTlds.map(async (tItem) => {
          const altDomain = `${sanitized.domainNameOnly}.${tItem.tld}`;
          const altPrice = getTldPrice(tItem.tld);
          return checkDomainAvailability(altDomain, altPrice, !!tItem.isPromo);
        });

        const altResultsSettled = await Promise.allSettled(complementaryPromises);
        const altResults: DomainSearchResult[] = [];

        altResultsSettled.forEach((res) => {
          if (res.status === 'fulfilled') {
            altResults.push(res.value);
          }
        });

        const combinedResults = [primaryResult, ...altResults];
        setSearchResults(combinedResults);

        if (primaryResult.status === 'error' && primaryResult.errorMsg) {
          setSearchError(primaryResult.errorMsg);
        }
      }
    } catch (err: any) {
      setSearchError(language === 'en' ? 'Connection error. Please try again.' : 'Error de conexión. Por favor intenta de nuevo.');
    } finally {
      setIsSearching(false);
    }
  };

  const isItemInCart = (domainName: string) => {
    return cart.some((item) => item.name.toLowerCase() === domainName.toLowerCase() && item.type === 'DOMAIN');
  };

  const resolveTransferTld = (domainName: string) => domainName.substring(domainName.indexOf('.') + 1).replace(/\./g, '-');
  const getTransferPrice = (domainName: string): number | null => {
    const tld = resolveTransferTld(domainName);
    const entry = transferPricing.find((e) => e.operation === 'transfer' && e.tld.toLowerCase() === tld);
    return entry ? entry.price : null;
  };

  const filteredResults = searchResults.filter((item) => {
    if (selectedCategory === 'All') return true;
    const config = tlds.find((t) => t.tld === item.tld);
    return config?.category === selectedCategory;
  });

  return (
    <section className="relative overflow-hidden pt-14 pb-24 px-4 sm:px-6 lg:px-8 bg-white text-[#070707]">
      {/* Oversized Banelio Favicon Watermark (Bottom-Left overflowing) */}
      <div className="absolute -bottom-64 -left-64 w-[850px] h-[850px] sm:w-[1150px] sm:h-[1150px] lg:w-[1350px] lg:h-[1350px] pointer-events-none select-none z-0 opacity-[0.045] rotate-12 overflow-hidden">
        <img
          src="https://res.cloudinary.com/hxbmhqiq/image/upload/v1787810546/Untitled_design_5_1.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Intro Background Image with fixed height container so it NEVER distorts or shifts when search results expand */}
      <div className="absolute top-0 right-0 w-full sm:w-4/5 lg:w-3/5 h-[580px] sm:h-[620px] lg:h-[660px] pointer-events-none overflow-hidden z-0 flex justify-end">
        <img
          src="https://res.cloudinary.com/hxbmhqiq/image/upload/v1787809567/Person_posing_for_corporate_website_202608262225ry.jpg"
          alt="Banelio Infraestructura Corporativa"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover sm:object-contain object-top lg:object-right-top"
        />
      </div>

      {/* Soft edge gradients ensuring 100% legibility */}
      <div className="absolute top-0 left-0 right-0 h-[660px] pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 sm:via-white/60 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[#B8F23A]/20 blur-[140px]"></div>
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10 pt-4">
        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#070707] mb-6 leading-tight">
          {t('hero_title_line1')} <br className="hidden sm:inline" />
          <span className="bg-[#B8F23A] text-[#070707] px-4 py-1.5 rounded-2xl inline-block mt-1.5 font-black shadow-xs">
            {t('hero_title_line2')}
          </span>
        </h1>

        <p className="text-[#555A52] text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          {t('hero_subtitle')}
        </p>

        {/* Search / Transfer Switcher */}
        <div className="inline-flex p-1.5 bg-[#F7F8F0] backdrop-blur-md rounded-2xl border border-[#8A8F98] mb-6 shadow-2xs">
          <button
            id="hero-tab-register-btn"
            onClick={() => setActiveTab('REGISTER')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'REGISTER'
                ? 'bg-[#B8F23A] text-[#070707] shadow-xs'
                : 'text-[#555A52] hover:text-[#070707]'
            }`}
          >
            {t('hero_tab_register')}
          </button>
          <button
            id="hero-tab-transfer-btn"
            onClick={() => setActiveTab('TRANSFER')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
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
              id="hero-domain-input"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (searchError) setSearchError(null);
              }}
              aria-label={language === 'en' ? 'Domain name search input' : 'Buscador de nombres de dominio'}
              placeholder={activeTab === 'REGISTER' ? t('hero_search_placeholder') : t('hero_transfer_placeholder')}
              className="w-full pl-6 pr-36 sm:pr-48 py-5 rounded-2xl bg-white text-[#070707] placeholder-[#858A82] text-base sm:text-lg font-bold shadow-xl border-2 border-[#8A8F98] focus:border-[#B8F23A] outline-none transition-all"
            />
            <button
              id="hero-search-submit-btn"
              type="submit"
              disabled={isSearching || !query.trim()}
              aria-busy={isSearching}
              className="absolute right-2.5 top-2.5 bottom-2.5 bg-[#B8F23A] hover:bg-[#B8F23A] disabled:bg-[#8A8F98] disabled:text-[#858A82] text-[#070707] px-6 sm:px-8 rounded-xl font-black text-sm sm:text-base flex items-center gap-2 shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSearching ? (
                <>
                  <Loader2 size={18} className="animate-spin text-[#070707]" />
                  <span className="hidden sm:inline">{t('hero_searching')}</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>{activeTab === 'REGISTER' ? t('hero_search_btn') : t('hero_verify_btn')}</span>
                </>
              )}
            </button>
          </div>

          {/* Validation / API Error Banner */}
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

        {/* Quick TLD Badges with Dynamic Prices */}
        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 text-xs">
          <span className="text-[#555A52] font-semibold mr-1">{t('hero_featured_ext')}:</span>
          {popularTlds.map((tld) => {
            const price = getTldPrice(tld);
            return (
              <button
                key={tld}
                id={`hero-quick-tld-${tld}`}
                disabled={isSearching}
                onClick={() => {
                  setQuery(`miempresa.${tld}`);
                  setTimeout(() => {
                    const sanitized = sanitizeDomainInput(`miempresa.${tld}`);
                    if (sanitized.valid) {
                      setLastSearchedDomain(sanitized.cleanDomain);
                      setIsSearching(true);
                      setSearchError(null);
                      checkDomainAvailability(sanitized.cleanDomain, price, false)
                        .then((res) => {
                          setSearchResults([res]);
                        })
                        .catch(() => {
                          setSearchError(language === 'en' ? 'Error checking domain.' : 'Error al verificar el dominio.');
                        })
                        .finally(() => {
                          setIsSearching(false);
                        });
                    }
                  }, 50);
                }}
                className="bg-white hover:bg-[#F7F8F0] border border-[#8A8F98] hover:border-[#B8F23A] px-3.5 py-1.5 rounded-xl text-[#555A52] hover:text-[#070707] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="font-black text-[#B8F23A]">.{tld}</span>
                <span className="text-[#555A52] font-semibold">{formatMoney(price, currency)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEARCH RESULTS SECTION - 100% Real Live Check, Solid & High-Contrast */}
      {searchResults.length > 0 && (
        <div
          role="region"
          aria-live="polite"
          className="max-w-5xl mx-auto mt-14 bg-white text-[#070707] rounded-3xl shadow-2xl border-2 border-[#8A8F98] overflow-hidden relative z-30"
        >
          {/* Header of results */}
          <div className="bg-[#F7F8F0] border-b border-[#8A8F98] px-6 py-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-xl text-[#070707] flex items-center gap-2">
                <span>{language === 'en' ? 'Domain Results for' : 'Resultados de Búsqueda para'}</span>
                <span className="text-[#070707] bg-[#B8F23A] px-2.5 py-0.5 rounded-lg font-mono">
                  "{lastSearchedDomain || query}"
                </span>
              </h3>
              <p className="text-xs text-[#555A52] mt-0.5 font-medium">
                {language === 'en'
                  ? 'Official real-time verification with ICANN and NIC registries.'
                  : 'Verificación oficial en tiempo real con el Registry de Banelio.'}
              </p>
            </div>

            {/* Category Filter Chips */}
            <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-[#8A8F98] text-xs shadow-2xs">
              {['All', 'Popular', 'Tech', 'Geo', 'Global'].map((cat) => {
                const label = cat === 'All' ? (language === 'en' ? 'All' : 'Todos') : cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#B8F23A] text-[#070707] shadow-xs'
                        : 'text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results List */}
          <div className="divide-y divide-[#8A8F98] max-h-[520px] overflow-y-auto bg-white">
            {filteredResults.map((item, index) => {
              const inCart = isItemInCart(item.domain);
              const isTransferMode = activeTab === 'TRANSFER';
              // In transfer mode, registered domains are eligible for transfer
              const isEligibleForTransfer = isTransferMode && !item.isAvailable && (item.status === 'unavailable' || item.status === 'regthroughothers');

              return (
                <div
                  key={index}
                  className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    item.isAvailable || isEligibleForTransfer ? 'bg-white hover:bg-[#F9FAF2]' : 'bg-[#FAFAFA]'
                  }`}
                >
                  {/* Domain Info */}
                  <div className="flex items-start sm:items-center gap-3.5">
                    {item.isAvailable ? (
                      <div className="w-9 h-9 rounded-xl bg-[#B8F23A] text-[#070707] border border-[#B8F23A] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
                        <CheckCircle2 size={20} />
                      </div>
                    ) : isTransferMode ? (
                      <div className="w-9 h-9 rounded-xl bg-[#B8F23A] text-[#070707] border border-[#B8F23A] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
                        <RefreshCw size={18} className="text-[#B8F23A]" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-[#EAECE4] text-[#858A82] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        <XCircle size={20} />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-black text-lg sm:text-xl text-[#070707] tracking-tight">{item.domain}</span>
                        {item.isAvailable ? (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-[#B8F23A] text-[#070707] px-2.5 py-1 rounded-full border border-[#B8F23A]">
                            {language === 'en' ? 'Available' : '¡Disponible!'}
                          </span>
                        ) : isEligibleForTransfer ? (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-[#B8F23A] text-[#070707] px-2.5 py-1 rounded-full border border-[#B8F23A] shadow-2xs">
                            {language === 'en' ? 'Eligible for Transfer' : 'Elegible para Transferencia'}
                          </span>
                        ) : isTransferMode ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#8A8F98] text-[#555A52] px-2.5 py-1 rounded-full">
                            {language === 'en' ? 'Could not determine' : 'No se pudo determinar'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#8A8F98] text-[#555A52] px-2.5 py-1 rounded-full">
                            {item.status === 'unknown' || item.status === 'error'
                              ? (language === 'en' ? 'Could not determine' : 'No se pudo determinar')
                              : (language === 'en' ? 'Not Available' : 'No disponible')}
                          </span>
                        )}
                        {item.isPromo && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-[#B8F23A] text-[#070707] px-2.5 py-1 rounded-full border border-[#B8F23A] shadow-2xs">
                            {language === 'en' ? 'Super Promo' : '¡Super Promo!'}
                          </span>
                        )}
                        {item.suggestion && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F7F8F0] text-[#B8F23A] border border-[#8A8F98] px-2.5 py-1 rounded-full">
                            {language === 'en' ? 'Suggestion' : 'Sugerencia'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#555A52] mt-1 font-medium">
                        {isEligibleForTransfer ? (
                          <span className="text-[#B8F23A] font-semibold">
                            {language === 'en'
                              ? 'This domain is registered and may be eligible for transfer.'
                              : 'Este dominio está registrado y puede ser elegible para transferencia.'}
                          </span>
                        ) : (
                          <>
                            <span className="flex items-center gap-1">
                              <Shield size={13} className="text-[#B8F23A]" /> {language === 'en' ? 'DNS Management + Free WHOIS Privacy' : 'Gestión DNS + Privacidad WHOIS Gratuita'}
                            </span>
                            <span className="hidden sm:inline">&bull;</span>
                            <span className="hidden sm:inline">{language === 'en' ? 'Instant Activation' : 'Activación Inmediata'}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions / Price */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-[#8A8F98] pt-3 sm:pt-0">
                    {item.isAvailable ? (
                      <>
                        <div className="text-right">
                          <span className="text-2xl font-black text-[#070707] block leading-none">
                            {formatMoney(item.priceUSD, currency)}
                          </span>
                          <span className="text-[11px] text-[#555A52] font-semibold">{language === 'en' ? '/ year' : '/ 1 año'}</span>
                        </div>

                        {inCart ? (
                          <button
                            disabled
                            className="bg-[#B8F23A] text-[#070707] border border-[#B8F23A] px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 cursor-default shadow-xs"
                          >
                            <CheckCircle2 size={16} />
                            <span>{t('hero_in_cart')}</span>
                          </button>
                        ) : (
                          <button
                            id={`add-domain-btn-${item.domain.replace('.', '-')}`}
                            onClick={() =>
                              addToCart({
                                type: 'DOMAIN',
                                sku: `tld-${item.domain.substring(item.domain.indexOf('.') + 1).replace(/\./g, '-')}`,
                                name: item.domain,
                                periodYearsOrMonths: 1,
                                periodUnit: 'year',
                                basePath: item.domain,
                                totalPrice: item.priceUSD,
                                basePriceUSD: item.priceUSD,
                                addons: { whoisPrivacy: true }
                              })
                            }
                            className="bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-95 z-30"
                          >
                            <ShoppingBag size={16} />
                            <span>{t('hero_add_to_cart')}</span>
                          </button>
                        )}
                      </>
                    ) : isTransferMode ? (
                      /* Transfer Button for Registered Domain */
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-2xl font-black text-[#070707] block leading-none">
                            {formatMoney(getTransferPrice(item.domain), currency)}
                          </span>
                          <span className="text-[11px] text-[#555A52] font-semibold">{language === 'en' ? 'transfer + 1 yr' : 'transf. + 1 año'}</span>
                        </div>

                        {getTransferPrice(item.domain) === null ? (
                          <span className="text-[11px] font-bold text-[#B45309] text-right max-w-[160px]">
                            {language === 'en' ? 'Transfer pricing not configured' : 'Precio de transferencia no configurado'}
                          </span>
                        ) : (
                          <button
                            id={`transfer-domain-btn-${item.domain.replace('.', '-')}`}
                            onClick={() => {
                              setTransferDomain(item.domain);
                              setTransferPriceUSD(getTransferPrice(item.domain) ?? 0);
                            }}
                            className="bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-95 z-30"
                          >
                            <RefreshCw size={15} />
                            <span>{language === 'en' ? 'Transfer this domain' : 'Transferir este dominio'}</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-end gap-2.5">
                        <button
                          id={`whois-btn-${item.domain.replace('.', '-')}`}
                          onClick={() => setWhoisDomain(item.domain)}
                          className="text-xs font-bold text-[#070707] bg-[#F7F8F0] hover:bg-[#8A8F98] border border-[#8A8F98] px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer z-30 shadow-2xs"
                          title="Ver datos WHOIS públicos del dominio"
                        >
                          <Info size={14} className="text-[#B8F23A]" />
                          <span>{t('hero_whois_btn')}</span>
                        </button>

                        {item.status === 'unknown' || item.status === 'error' ? (
                          <span className="text-[11px] font-bold text-[#858A82] max-w-[180px] text-right">
                            {language === 'en'
                              ? 'Status could not be verified. Try again shortly.'
                              : 'No se pudo verificar el estado. Vuelve a intentar en unos momentos.'}
                          </span>
                        ) : getTransferPrice(item.domain) === null ? (
                          <span className="text-[11px] font-bold text-[#B45309] max-w-[180px] text-right">
                            {language === 'en'
                              ? 'Transfer pricing not configured'
                              : 'Precio de transferencia no configurado'}
                          </span>
                        ) : (
                          <button
                            id={`transfer-occupied-btn-${item.domain.replace('.', '-')}`}
                            onClick={() => {
                              addToCart({
                                type: 'DOMAIN',
                                sku: `domain-${resolveTransferTld(item.domain)}-transfer`,
                                name: item.domain,
                                periodYearsOrMonths: 1,
                                periodUnit: 'year',
                                basePriceUSD: getTransferPrice(item.domain) ?? 0,
                                addons: { isTransfer: true, whoisPrivacy: true }
                              });
                              setTransferDomain(item.domain);
                              setTransferPriceUSD(getTransferPrice(item.domain) ?? 0);
                            }}
                            className="bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-95 z-30 border border-[#B8F23A]"
                            title="Iniciar o solicitar transferencia hacia Banelio"
                          >
                            <RefreshCw size={14} />
                            <span>{language === 'en' ? 'Transfer to Banelio' : 'Transferir a Banelio'}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WHOIS MODAL */}
      <WhoisModal domain={whoisDomain || ''} isOpen={!!whoisDomain} onClose={() => setWhoisDomain(null)} />

      {/* DOMAIN TRANSFER MODAL */}
      <DomainTransferModal
        domain={transferDomain || ''}
        isOpen={!!transferDomain}
        onClose={() => setTransferDomain(null)}
        priceUSD={transferPriceUSD}
      />
    </section>
  );
}

