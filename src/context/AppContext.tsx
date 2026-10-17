import React, { createContext, useContext, useEffect, useState } from 'react';
import { Currency, Language, UserRole } from '../types';
import { COUNTRY_TAX_RATES, CURRENCIES, detectUserLocation } from '../utils/pricing';
import { TRANSLATIONS, getTranslation } from '../utils/translations';
import { openCustomerPanel, openSuperSiteStore } from '../services/supersiteService';

interface Toast {
  id: string;
  type: 'success' | 'info' | 'error' | 'warning';
  title: string;
  message: string;
}

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  countryCode: string;
  setCountryCode: (c: string) => void;
  t: (key: keyof typeof TRANSLATIONS['es']) => string;
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  openStore: () => void;
  openPortal: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('PUBLIC');

  // Enforce clean Light Mode across the entire platform
  useEffect(() => {
    localStorage.removeItem('banelio_theme');
    document.documentElement.classList.remove('dark');
  }, []);

  // Initialize currency, country, and language with intelligent detection and localStorage persistence
  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window === 'undefined') return 'MXN';
    const saved = localStorage.getItem('banelio_currency');
    if (saved && CURRENCIES[saved as Currency]) return saved as Currency;
    return detectUserLocation().currency;
  });

  const [countryCode, setCountryCodeState] = useState<string>(() => {
    if (typeof window === 'undefined') return 'MX';
    const saved = localStorage.getItem('banelio_country');
    if (saved && COUNTRY_TAX_RATES[saved]) return saved;
    return detectUserLocation().countryCode;
  });

  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'es';
    const saved = localStorage.getItem('banelio_lang');
    if (saved === 'es' || saved === 'en') return saved;
    return detectUserLocation().language;
  });

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    if (typeof window !== 'undefined') {
      localStorage.setItem('banelio_currency', c);
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('banelio_lang', lang);
    }
  };

  const setCountryCode = (c: string) => {
    setCountryCodeState(c);
    if (typeof window !== 'undefined') {
      localStorage.setItem('banelio_country', c);
    }
    if (COUNTRY_TAX_RATES[c]?.currency) {
      setCurrency(COUNTRY_TAX_RATES[c].currency);
    }
    if (COUNTRY_TAX_RATES[c]?.language) {
      setLanguage(COUNTRY_TAX_RATES[c].language);
    }
  };

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const t = (key: keyof typeof TRANSLATIONS['es']): string => {
    return getTranslation(language, key);
  };

  const openStore = () => {
    openSuperSiteStore('_blank');
  };

  const openPortal = () => {
    openCustomerPanel('_blank');
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        currency,
        setCurrency,
        language,
        setLanguage,
        countryCode,
        setCountryCode,
        t,
        toasts,
        addToast,
        removeToast,
        openStore,
        openPortal
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
