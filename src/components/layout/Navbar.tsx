import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Globe,
  Server,
  Mail,
  ShieldCheck,
  Layout,
  TrendingUp,
  Users,
  BookOpen,
  ShoppingBag,
  Menu,
  X,
  Check,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { CURRENCIES } from '../../utils/pricing';
import { openCustomerPanel, openSuperSiteStore } from '../../services/supersiteService';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export default function Navbar({ currentRoute, onNavigate }: NavbarProps) {
  const {
    currency,
    setCurrency,
    language,
    setLanguage,
    t
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCurrencySelectorOpen, setIsCurrencySelectorOpen] = useState(false);
  const [isLangSelectorOpen, setIsLangSelectorOpen] = useState(false);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);

  const mainNavItems = [
    { route: '/dominios', label: t('nav_domains'), icon: <Globe size={15} /> },
    { route: '/hosting', label: t('nav_hosting'), icon: <Server size={15} /> },
    { route: '/email', label: t('nav_email'), icon: <Mail size={15} /> },
    { route: '/ssl', label: t('nav_ssl'), icon: <ShieldCheck size={15} /> }
  ];

  const moreServices = [
    { route: '/diseno-web', label: t('nav_web_design'), icon: <Layout size={15} /> },
    { route: '/seo', label: t('nav_seo'), icon: <TrendingUp size={15} /> },
    { route: '/afiliados', label: t('nav_affiliates'), icon: <Users size={15} /> },
    { route: '/resellers', label: t('nav_resellers'), icon: <Server size={15} /> },
    { route: '/blog', label: t('nav_blog'), icon: <BookOpen size={15} /> }
  ];

  const isMoreServiceActive = moreServices.some((s) => currentRoute === s.route);

  return (
    <nav className="bg-white/95 border-b border-[#E2E5DA] sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div
            id="navbar-logo"
            className="flex items-center gap-3 cursor-pointer select-none py-1 group shrink-0"
            onClick={() => {
              onNavigate('/');
              setIsMobileMenuOpen(false);
            }}
            title="Banelio Cloud Technologies"
          >
            <img
              src="https://res.cloudinary.com/hxbmhqiq/image/upload/f_auto,q_auto/LOGO_BANELIO_wide_2"
              alt="Banelio Cloud Technologies"
              referrerPolicy="no-referrer"
              className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </div>

          {/* Desktop Navigation Menu */}
          <div className="hidden xl:flex items-center gap-1">
            {mainNavItems.map((item) => {
              const isActive = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  id={`nav-link-${item.route.replace('/', '') || 'home'}`}
                  onClick={() => {
                    onNavigate(item.route);
                    setIsServicesDropdownOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707] ${
                    isActive
                      ? 'text-[#070707] bg-[#B9E86A] font-black shadow-2xs'
                      : 'text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* More Services Dropdown */}
            <div className="relative">
              <button
                id="services-dropdown-toggle"
                onClick={() => setIsServicesDropdownOpen(!isServicesDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707] ${
                  isMoreServiceActive
                    ? 'text-[#070707] bg-[#B9E86A] font-black shadow-2xs'
                    : 'text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0]'
                }`}
              >
                <span>{t('nav_services')}</span>
                <ChevronDown size={13} className={`transition-transform ${isServicesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isServicesDropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white border border-[#E2E5DA] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="text-[10px] font-bold text-[#858A82] uppercase px-3 py-1 border-b border-[#E2E5DA]">
                    {language === 'en' ? 'Solutions & Partner Services' : 'Soluciones & Socios'}
                  </div>
                  <div className="py-1 space-y-0.5">
                    {moreServices.map((svc) => (
                      <button
                        key={svc.route}
                        onClick={() => {
                          onNavigate(svc.route);
                          setIsServicesDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                          currentRoute === svc.route
                            ? 'bg-[#DFF5B5] text-[#070707] font-bold'
                            : 'text-[#070707] hover:bg-[#F7F8F0]'
                        }`}
                      >
                        {svc.icon}
                        <span>{svc.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Direct Blog Link */}
            <button
              onClick={() => {
                onNavigate('/blog');
                setIsServicesDropdownOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707] ${
                currentRoute === '/blog'
                  ? 'text-[#070707] bg-[#B9E86A] font-black shadow-2xs'
                  : 'text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0]'
              }`}
            >
              <BookOpen size={14} />
              <span>{t('nav_blog')}</span>
            </button>
          </div>

          {/* Right Actions: Language, Currency, Store & Customer Portal */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Language Selector (ES / EN) */}
            <div className="relative">
              <button
                id="language-selector-btn"
                onClick={() => {
                  setIsLangSelectorOpen(!isLangSelectorOpen);
                  setIsCurrencySelectorOpen(false);
                  setIsServicesDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#E2E5DA] bg-white hover:bg-[#F7F8F0] text-xs font-bold text-[#070707] transition-all cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707]"
                title={language === 'en' ? 'Select Language' : 'Seleccionar Idioma'}
              >
                <span>{language === 'es' ? '🇲🇽' : '🇺🇸'}</span>
                <span className="font-mono uppercase">{language}</span>
              </button>

              {isLangSelectorOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-[#E2E5DA] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="text-[10px] font-bold text-[#858A82] uppercase px-3 py-1 border-b border-[#E2E5DA]">
                    {language === 'en' ? 'Language' : 'Idioma'}
                  </div>
                  <div className="py-1 space-y-1">
                    <button
                      id="lang-option-es"
                      onClick={() => {
                        setLanguage('es');
                        setIsLangSelectorOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                        language === 'es'
                          ? 'bg-[#DFF5B5] text-[#070707] font-bold'
                          : 'text-[#070707] hover:bg-[#F7F8F0]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>🇲🇽</span>
                        <span>Español (MX)</span>
                      </span>
                      {language === 'es' && <Check className="w-3.5 h-3.5 text-[#070707]" />}
                    </button>

                    <button
                      id="lang-option-en"
                      onClick={() => {
                        setLanguage('en');
                        setIsLangSelectorOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                        language === 'en'
                          ? 'bg-[#DFF5B5] text-[#070707] font-bold'
                          : 'text-[#070707] hover:bg-[#F7F8F0]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>🇺🇸</span>
                        <span>English (US)</span>
                      </span>
                      {language === 'en' && <Check className="w-3.5 h-3.5 text-[#070707]" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Currency Selector */}
            <div className="relative">
              <button
                id="currency-selector-btn"
                onClick={() => {
                  setIsCurrencySelectorOpen(!isCurrencySelectorOpen);
                  setIsLangSelectorOpen(false);
                  setIsServicesDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#E2E5DA] bg-white hover:bg-[#F7F8F0] text-xs font-bold text-[#070707] transition-all cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707]"
                title={t('nav_currency')}
              >
                <span>{CURRENCIES[currency]?.flag || '🌐'}</span>
                <span className="font-mono">{currency}</span>
              </button>

              {isCurrencySelectorOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E2E5DA] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="text-[11px] font-bold text-[#858A82] uppercase px-3 py-1.5 border-b border-[#E2E5DA]">
                    {t('nav_currency')}
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1 space-y-0.5">
                    {Object.keys(CURRENCIES).map((cKey) => {
                      const c = CURRENCIES[cKey as keyof typeof CURRENCIES];
                      const isSelected = currency === cKey;
                      return (
                        <button
                          key={cKey}
                          onClick={() => {
                            setCurrency(cKey as any);
                            setIsCurrencySelectorOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                            isSelected
                              ? 'bg-[#DFF5B5] text-[#070707] font-bold'
                              : 'text-[#070707] hover:bg-[#F7F8F0]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{c.flag}</span>
                            <span>{c.name}</span>
                          </span>
                          <span className="font-mono text-[10px] text-[#555A52] font-semibold">{c.symbol}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Commercial Store / Cart Button */}
            <button
              id="navbar-cart-btn"
              onClick={() => openSuperSiteStore('_blank')}
              className="p-2 text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0] border border-[#E2E5DA] rounded-xl transition-all cursor-pointer bg-white shadow-2xs flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707]"
              title={language === 'en' ? 'Open Banelio Store' : 'Ir a la Tienda Banelio'}
            >
              <ShoppingBag size={17} />
              <span className="hidden md:inline text-xs font-bold text-[#070707]">{t('nav_store')}</span>
            </button>

            {/* Customer Portal Access Button */}
            <button
              id="navbar-panel-btn"
              onClick={() => openCustomerPanel('_blank')}
              className="flex items-center gap-1.5 bg-[#B9E86A] hover:bg-[#CBEF8A] text-[#070707] text-xs font-black px-3 sm:px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707]"
              title={language === 'en' ? 'Access Customer Panel' : 'Ingresar al Panel de Clientes'}
            >
              <span>{t('nav_panel')}</span>
              <ExternalLink size={13} />
            </button>

            {/* Mobile menu toggle */}
            <button
              id="navbar-mobile-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0] border border-[#E2E5DA] rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707]"
              aria-label="Abrir Menú de Navegación"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-[#E2E5DA] px-4 py-4 space-y-1 shadow-2xl animate-in slide-in-from-top-2 max-h-[80vh] overflow-y-auto">
          <div className="text-[10px] font-bold text-[#858A82] uppercase px-3 py-1">
            {language === 'en' ? 'Commercial Catalog' : 'Catálogo Comercial'}
          </div>

          {[...mainNavItems, ...moreServices].map((item) => (
            <button
              key={item.route}
              onClick={() => {
                onNavigate(item.route);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                currentRoute === item.route
                  ? 'bg-[#B9E86A] text-[#070707] font-black'
                  : 'text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          <div className="pt-3 border-t border-[#E2E5DA] space-y-2">
            <button
              onClick={() => {
                openSuperSiteStore('_blank');
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#F7F8F0] hover:bg-[#F1F3E8] border border-[#E2E5DA] text-[#070707] font-bold py-2.5 rounded-xl text-xs shadow-2xs cursor-pointer"
            >
              <ShoppingBag size={15} />
              <span>{language === 'en' ? 'Banelio Store' : 'Tienda Banelio'}</span>
            </button>
            <button
              onClick={() => {
                openCustomerPanel('_blank');
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#B9E86A] hover:bg-[#CBEF8A] text-[#070707] font-black py-2.5 rounded-xl text-xs shadow-xs cursor-pointer"
            >
              <span>{t('nav_customer_panel')}</span>
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
