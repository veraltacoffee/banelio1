import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Globe, Server, Mail, Shield, ShoppingBag, Menu, X, ArrowRight, BookOpen, Check } from 'lucide-react';
import { CURRENCIES } from '../../utils/pricing';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export default function Navbar({ currentRoute, onNavigate }: NavbarProps) {
  const {
    cart,
    setIsCartOpen,
    role,
    setRole,
    currency,
    setCurrency,
    language,
    setLanguage,
    customerUser,
    logoutCustomer,
    t
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCurrencySelectorOpen, setIsCurrencySelectorOpen] = useState(false);
  const [isLangSelectorOpen, setIsLangSelectorOpen] = useState(false);

  const navItems = [
    { route: '/dominios', label: t('nav_domains'), icon: <Globe size={16} /> },
    { route: '/hosting', label: t('nav_hosting'), icon: <Server size={16} /> },
    { route: '/email', label: t('nav_email'), icon: <Mail size={16} /> },
    { route: '/ssl', label: t('nav_ssl'), icon: <Shield size={16} /> },
    { route: '/blog', label: t('nav_blog'), icon: <BookOpen size={16} /> }
  ];

  return (
    <nav className="bg-white/95 border-b border-[#8A8F98] sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div
            id="navbar-logo"
            className="flex items-center gap-3 cursor-pointer select-none py-1 group"
            onClick={() => {
              onNavigate('/');
              setRole('PUBLIC');
              setIsMobileMenuOpen(false);
            }}
            title="Banelio Cloud Technologies"
          >
            <img
              src="https://res.cloudinary.com/hxbmhqiq/image/upload/f_auto,q_auto/LOGO_BANELIO_wide_2"
              alt="Banelio Cloud Technologies"
              referrerPolicy="no-referrer"
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </div>

          {/* Desktop Navigation Menu */}
          <div className="hidden lg:flex items-center gap-1.5">
            {navItems.map((item) => {
              const isActive = currentRoute === item.route && role === 'PUBLIC';
              return (
                <button
                  key={item.route}
                  id={`nav-link-${item.route.replace('/', '') || 'home'}`}
                  onClick={() => {
                    onNavigate(item.route);
                    if (role !== 'PUBLIC') setRole('PUBLIC');
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'text-[#070707] bg-[#B8F23A] font-bold shadow-xs'
                      : 'text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Right Actions: Language, Currency, Cart & Dashboard */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Language Selector (ES / EN) */}
            <div className="relative">
              <button
                id="language-selector-btn"
                onClick={() => {
                  setIsLangSelectorOpen(!isLangSelectorOpen);
                  setIsCurrencySelectorOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#8A8F98] bg-white hover:bg-[#F7F8F0] text-xs font-bold text-[#070707] transition-all cursor-pointer shadow-2xs"
                title={language === 'en' ? 'Select Language' : 'Seleccionar Idioma'}
              >
                <span>{language === 'es' ? '🇲🇽' : '🇺🇸'}</span>
                <span className="font-mono uppercase">{language}</span>
              </button>

              {isLangSelectorOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-[#8A8F98] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="text-[10px] font-bold text-[#858A82] uppercase px-3 py-1 border-b border-[#8A8F98]">
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
                          ? 'bg-[#B8F23A]/20 text-[#B8F23A] font-bold'
                          : 'text-[#070707] hover:bg-[#F7F8F0]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>🇲🇽</span>
                        <span>Español (MX)</span>
                      </span>
                      {language === 'es' && <Check className="w-3.5 h-3.5 text-[#B8F23A]" />}
                    </button>

                    <button
                      id="lang-option-en"
                      onClick={() => {
                        setLanguage('en');
                        setIsLangSelectorOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                        language === 'en'
                          ? 'bg-[#B8F23A]/20 text-[#B8F23A] font-bold'
                          : 'text-[#070707] hover:bg-[#F7F8F0]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>🇺🇸</span>
                        <span>English (US)</span>
                      </span>
                      {language === 'en' && <Check className="w-3.5 h-3.5 text-[#B8F23A]" />}
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
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#8A8F98] bg-white hover:bg-[#F7F8F0] text-xs font-bold text-[#070707] transition-all cursor-pointer shadow-2xs"
                title={t('nav_currency')}
              >
                <span>{CURRENCIES[currency]?.flag || '🌐'}</span>
                <span className="font-mono">{currency}</span>
              </button>

              {isCurrencySelectorOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#8A8F98] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="text-[11px] font-bold text-[#858A82] uppercase px-3 py-1.5 border-b border-[#8A8F98]">
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
                              ? 'bg-[#B8F23A]/20 text-[#B8F23A] font-bold'
                              : 'text-[#070707] hover:bg-[#F7F8F0]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{c.flag}</span>
                            <span>{c.name}</span>
                          </span>
                          <span className="font-mono text-[10px] text-[#858A82]">{c.symbol}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Button */}
            <button
              id="navbar-cart-btn"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0] border border-[#8A8F98] rounded-xl transition-all cursor-pointer bg-white shadow-2xs"
              title={t('nav_cart')}
            >
              <ShoppingBag size={18} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#B8F23A] text-[#070707] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                  {cart.length}
                </span>
              )}
            </button>

            {/* Role / Access Action Button */}
            {role === 'PUBLIC' ? (
              <div className="flex items-center">
                <button
                  id="navbar-panel-btn"
                  onClick={() => setRole('CUSTOMER')}
                  className="flex items-center gap-1.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] text-xs font-black px-3.5 sm:px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <span>{t('nav_panel')}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : role === 'CUSTOMER' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#070707] bg-[#B8F23A] px-3.5 py-2 rounded-xl shadow-xs max-w-[140px] truncate" title={customerUser?.name || 'Mi Panel'}>
                  {customerUser?.name ? customerUser.name.split(' ')[0] : (language === 'en' ? 'MY PANEL' : 'MI PANEL')}
                </span>
                <button
                  id="navbar-customer-logout-btn"
                  onClick={() => {
                    logoutCustomer();
                  }}
                  className="text-xs font-bold text-[#555A52] hover:text-[#070707] bg-[#F7F8F0] border border-[#8A8F98] px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                >
                  {language === 'en' ? 'Exit Panel' : 'Salir'}
                </button>
              </div>
            ) : role === 'RESELLER' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#070707] bg-[#B8F23A] border border-[#B8F23A] px-3 py-1.5 rounded-xl">
                  {t('nav_affiliate_portal')}
                </span>
                <button
                  id="navbar-reseller-logout-btn"
                  onClick={() => setRole('PUBLIC')}
                  className="text-xs font-bold text-[#555A52] hover:text-[#070707] bg-[#F7F8F0] border border-[#8A8F98] px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                >
                  {language === 'en' ? 'Exit Portal' : 'Salir'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#070707] bg-[#B8F23A] px-3 py-1.5 rounded-xl">
                  {t('nav_admin_console')}
                </span>
                <button
                  id="navbar-admin-logout-btn"
                  onClick={() => setRole('PUBLIC')}
                  className="text-xs font-bold text-[#555A52] hover:text-[#070707] bg-[#F7F8F0] border border-[#8A8F98] px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                >
                  {language === 'en' ? 'Exit Admin' : 'Salir'}
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              id="navbar-mobile-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0] border border-[#8A8F98] rounded-xl transition-colors cursor-pointer"
              aria-label="Abrir Menú de Navegación"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#8A8F98] px-4 py-4 space-y-2 shadow-2xl animate-in slide-in-from-top-2">
          {navItems.map((item) => (
            <button
              key={item.route}
              onClick={() => {
                onNavigate(item.route);
                if (role !== 'PUBLIC') setRole('PUBLIC');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-left transition-colors cursor-pointer ${
                currentRoute === item.route && role === 'PUBLIC'
                  ? 'bg-[#B8F23A] text-[#070707] font-bold'
                  : 'text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <div className="pt-3 border-t border-[#8A8F98] flex gap-2">
            <button
              onClick={() => { setRole('CUSTOMER'); setIsMobileMenuOpen(false); }}
              className="flex-1 bg-[#B8F23A] text-[#070707] font-bold py-2.5 rounded-xl text-xs shadow-xs"
            >
              {t('nav_customer_panel')}
            </button>
            <button
              onClick={() => { setRole('RESELLER'); setIsMobileMenuOpen(false); }}
              className="flex-1 bg-[#F7F8F0] text-[#070707] border border-[#8A8F98] font-bold py-2.5 rounded-xl text-xs"
            >
              {t('nav_affiliate_portal')}
            </button>
            <button
              onClick={() => { setRole('ADMIN'); setIsMobileMenuOpen(false); }}
              className="flex-1 bg-[#070707] text-white font-bold py-2.5 rounded-xl text-xs"
            >
              {t('nav_admin_console')}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
