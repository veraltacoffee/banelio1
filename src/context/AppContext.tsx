import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  AuditLogEntry,
  BlogPost,
  CartItem,
  Currency,
  DnsRecord,
  Language,
  DomainRegistrantContact,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PayoutRequest,
  ResellerCommission,
  ServiceType,
  SupportTicket,
  ThemeMode,
  TldConfig,
  UserRole,
  UserService
} from '../types';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_COMMISSIONS,
  INITIAL_ORDERS,
  INITIAL_PAYOUTS,
  INITIAL_SERVICES,
  INITIAL_TICKETS,
  INITIAL_TLDS
} from '../data/mockData';
import { INITIAL_BLOG_POSTS } from '../data/blogData';
import { COUNTRY_TAX_RATES, CURRENCIES, calculateTldRetailPrice, convertCurrency, detectUserLocation } from '../utils/pricing';
import { TRANSLATIONS, getTranslation } from '../utils/translations';
import {
  calculateCommercialDiscount,
  DEFAULT_DISCOUNT_CONFIG
} from '../services/pricingEngine';

// Server-order helpers. El servidor es la ÚNICA autoridad sobre SKUs, precios y
// totales; aquí sólo resolvemos la cantidad en la unidad de facturación del SKU.
function cartItemQuantity(item: CartItem): number {
  if (typeof item.quantity === 'number' && Number.isFinite(item.quantity) && item.quantity > 0) {
    return Math.floor(item.quantity);
  }
  return 1;
}

interface Toast {
  id: string;
  type: 'success' | 'info' | 'error' | 'warning';
  title: string;
  message: string;
}

export interface CustomerUser {
  id?: string;
  name: string;
  email: string;
  role?: UserRole;
  status?: string;
  phone?: string;
  company?: string;
  taxId?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
  createdAt?: string;
  lastLogin?: string;
}

export interface AffiliateUser {
  name: string;
  email: string;
  website?: string;
  paymentMethod: string;
  paymentDest: string;
  referralCode: string;
}

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  customerUser: CustomerUser | null;
  affiliateUser: AffiliateUser | null;
  isAdminAuthenticated: boolean;
  loginCustomer: (email: string, password?: string) => Promise<boolean>;
  registerCustomer: (data: { name: string; email: string; password?: string; phone?: string; company?: string }) => Promise<boolean>;
  logoutCustomer: () => void;
  sendVerificationEmail: () => Promise<boolean>;
  verifyEmailCode: (code: string) => Promise<boolean>;
  enableTwoFactor: () => Promise<{ qrCodeUrl: string; secret: string; backupCodes: string[] }>;
  disableTwoFactor: () => Promise<boolean>;
  verifyTwoFactorCode: (code: string) => Promise<boolean>;
  pendingTwoFactorAuth: { email: string; user: CustomerUser; challengeToken: string } | null;
  completeTwoFactorLogin: (code: string) => Promise<boolean>;
  cancelTwoFactorLogin: () => void;
  updateCustomerSecurity: (data: Partial<CustomerUser>) => void;
  updateCustomerProfile: (data: Partial<CustomerUser>) => void;
  loginAffiliate: (email: string, password?: string) => Promise<boolean>;
  registerAffiliate: (data: { name: string; email: string; website?: string; paymentMethod: string; paymentDest: string; password?: string }) => Promise<boolean>;
  logoutAffiliate: () => void;
  loginAdmin: (email: string, password?: string, pin?: string) => Promise<boolean>;
  logoutAdmin: () => void;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof TRANSLATIONS['es']) => string;
  countryCode: string;
  setCountryCode: (c: string) => void;
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  updateCartItemPeriod: (id: string, period: number) => void;
  updateCartItemAddons: (id: string, addons: Partial<NonNullable<CartItem['addons']>>) => void;
  updateCartItemEppCode: (id: string, eppCode: string) => void;
  updateCartItemRegistrant: (id: string, contact: DomainRegistrantContact) => void;
  domainRegistrantMode: 'SAME' | 'INDIVIDUAL';
  setDomainRegistrantMode: (mode: 'SAME' | 'INDIVIDUAL') => void;
  sharedRegistrantContact: DomainRegistrantContact;
  setSharedRegistrantContact: React.Dispatch<React.SetStateAction<DomainRegistrantContact>>;
  clearCart: () => void;
  cartTotalUSD: number;
  cartTaxUSD: number;
  cartSubtotalUSD: number;
  promoCode: string;
  promoDiscountUSD: number;
  applyPromoCode: (code: string) => { success: boolean; message: string };
  removePromoCode: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  tlds: TldConfig[];
  updateTldConfig: (tld: string, updates: Partial<TldConfig>) => void;
  getTldPrice: (tldName: string) => number;
  services: UserService[];
  addService: (service: UserService) => void;
  updateService: (id: string, updates: Partial<UserService>) => void;
  addDnsRecord: (serviceId: string, record: Omit<DnsRecord, 'id'>) => void;
  removeDnsRecord: (serviceId: string, recordId: string) => void;
  orders: Order[];
  processCheckout: (
    paymentMethod: PaymentMethod,
    customerInfo: { name: string; email: string },
    oxxoDetails?: { reference: string; expiresAt: string },
    paymentStatus?: { confirmed: boolean; gatewayReference?: string }
  ) => Promise<Order>;
  tickets: SupportTicket[];
  createTicket: (subject: string, category: any, priority: any, message: string) => void;
  replyTicket: (ticketId: string, message: string, isAdmin?: boolean) => void;
  updateTicketStatus: (ticketId: string, status: any) => void;
  commissions: ResellerCommission[];
  payouts: PayoutRequest[];
  requestPayout: (amountUSD: number, method: any, destination: string) => { success: boolean; message: string };
  updatePayoutStatus: (payoutId: string, status: 'APPROVED' | 'REJECTED') => void;
  resellerPromoCode: string;
  auditLogs: AuditLogEntry[];
  addAuditLog: (action: string, entity: string, details: string, entityId?: string) => void;
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  impersonatedCustomerName: string | null;
  startImpersonation: (customerName: string) => void;
  stopImpersonation: () => void;
  blogPosts: BlogPost[];
  addBlogPost: (post: Omit<BlogPost, 'id'>) => void;
  updateBlogPost: (id: string, updates: Partial<BlogPost>) => void;
  deleteBlogPost: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('PUBLIC');
  
  // Enforce clean Light Mode across the entire platform
  const theme: ThemeMode = 'light';
  const setTheme = (_t: ThemeMode) => {};
  const toggleTheme = () => {};

  useEffect(() => {
    localStorage.removeItem('banelio_theme');
    document.documentElement.classList.remove('dark');
  }, []);
  
  // Initialize currency, country, and language with intelligent detection (defaults to MXN / Mexico / Spanish)
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('banelio_currency');
    if (saved && CURRENCIES[saved as Currency]) return saved as Currency;
    return detectUserLocation().currency;
  });

  const [countryCode, setCountryCodeState] = useState<string>(() => {
    const saved = localStorage.getItem('banelio_country');
    if (saved && COUNTRY_TAX_RATES[saved]) return saved;
    return detectUserLocation().countryCode;
  });

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('banelio_lang');
    if (saved === 'es' || saved === 'en') return saved;
    return detectUserLocation().language;
  });

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('banelio_currency', c);
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('banelio_lang', lang);
  };

  const setCountryCode = (c: string) => {
    setCountryCodeState(c);
    localStorage.setItem('banelio_country', c);
    // Automatically match appropriate currency if user hasn't explicitly overridden
    if (COUNTRY_TAX_RATES[c]?.currency) {
      setCurrency(COUNTRY_TAX_RATES[c].currency);
    }
    if (COUNTRY_TAX_RATES[c]?.language) {
      setLanguage(COUNTRY_TAX_RATES[c].language);
    }
  };

  // Background IP lookup refinement on initial load
  useEffect(() => {
    const hasManualOverride = localStorage.getItem('banelio_currency');
    if (!hasManualOverride) {
      fetch('https://api.country.is/')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.country && COUNTRY_TAX_RATES[data.country]) {
            const detected = COUNTRY_TAX_RATES[data.country];
            setCountryCodeState(data.country);
            setCurrencyState(detected.currency);
            setLanguageState(detected.language);
          }
        })
        .catch(() => {
          // Fallback to local timezone detection
        });
    }
  }, []);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [domainRegistrantMode, setDomainRegistrantMode] = useState<'SAME' | 'INDIVIDUAL'>('SAME');
  const [sharedRegistrantContact, setSharedRegistrantContact] = useState<DomainRegistrantContact>({
    name: '',
    company: '',
    email: '',
    phone: '',
    taxId: '',
    address: '',
    city: '',
    state: '',
    country: 'México',
    postalCode: ''
  });
  const [promoCode, setPromoCode] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [impersonatedCustomerName, setImpersonatedCustomerName] = useState<string | null>(null);

  // Core Data States initialized from mockData or localStorage
  const [tlds, setTlds] = useState<TldConfig[]>(() => {
    const saved = localStorage.getItem('gh_tlds');
    return saved ? JSON.parse(saved) : INITIAL_TLDS;
  });

  const [services, setServices] = useState<UserService[]>(() => {
    const saved = localStorage.getItem('gh_services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('gh_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem('gh_tickets');
    return saved ? JSON.parse(saved) : INITIAL_TICKETS;
  });

  const [commissions, setCommissions] = useState<ResellerCommission[]>(() => {
    const saved = localStorage.getItem('gh_commissions');
    return saved ? JSON.parse(saved) : INITIAL_COMMISSIONS;
  });

  const [payouts, setPayouts] = useState<PayoutRequest[]>(() => {
    const saved = localStorage.getItem('gh_payouts');
    return saved ? JSON.parse(saved) : INITIAL_PAYOUTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('gh_audit');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem('banelio_blog_posts');
    const catalogIds = new Set(INITIAL_BLOG_POSTS.map((p) => p.id));
    const customPosts = saved ? JSON.parse(saved).filter((p) => !catalogIds.has(p.id)) : [];
    const catalogPosts = INITIAL_BLOG_POSTS.filter((p) => {
      const stored = saved ? JSON.parse(saved).find((s) => s.id === p.id) : undefined;
      return stored ? { ...p, ...stored } : p;
    });
    return [...customPosts, ...catalogPosts];
  });

  // User Authentication States
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(null);

  const [affiliateUser, setAffiliateUser] = useState<AffiliateUser | null>(null);

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const [pendingTwoFactorAuth, setPendingTwoFactorAuth] = useState<{ email: string; user: CustomerUser; challengeToken: string } | null>(null);

  const loginCustomer = async (email: string, password?: string): Promise<boolean> => {
    if (!password) return false;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.user) {
        return false;
      }

      const user = result.user as CustomerUser;
      if (result.requiresTwoFactor && typeof result.challengeToken === 'string') {
        setPendingTwoFactorAuth({
          email: email.trim().toLowerCase(),
          user,
          challengeToken: result.challengeToken,
        });
        return true;
      }

      setCustomerUser(user);
      setAffiliateUser(null);
      if (user.role === 'ADMIN') {
        setIsAdminAuthenticated(true);
        setRole('ADMIN');
      } else if (user.role === 'RESELLER') {
        setIsAdminAuthenticated(false);
        setRole('RESELLER');
      } else {
        setIsAdminAuthenticated(false);
        setRole('CUSTOMER');
      }

      return true;
    } catch {
      return false;
    }
  };

  const completeTwoFactorLogin = async (code: string): Promise<boolean> => {
    if (!pendingTwoFactorAuth) return false;

    try {
      const response = await fetch('/api/auth/2fa/complete-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          challengeToken: pendingTwoFactorAuth.challengeToken,
          code: code.trim(),
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success || !result.user) return false;

      const user = result.user as CustomerUser;
      setCustomerUser(user);
      setAffiliateUser(null);
      if (user.role === 'ADMIN') {
        setIsAdminAuthenticated(true);
        setRole('ADMIN');
      } else if (user.role === 'RESELLER') {
        setIsAdminAuthenticated(false);
        setRole('RESELLER');
      } else {
        setIsAdminAuthenticated(false);
        setRole('CUSTOMER');
      }
      setPendingTwoFactorAuth(null);
      return true;
    } catch {
      return false;
    }

  };
  const cancelTwoFactorLogin = () => {
    setPendingTwoFactorAuth(null);
  };

  const registerCustomer = async (data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    company?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    taxId?: string;
  }): Promise<boolean> => {
    if (!data.password) return false;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          password: data.password,
          phone: data.phone?.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.user) {
        return false;
      }

      const user = result.user as CustomerUser;

      setCustomerUser(user);
      setAffiliateUser(null);
      setIsAdminAuthenticated(false);
      setRole('CUSTOMER');

      if (result.requiresEmailVerification) {
        addToast({
          type: 'success',
          title: 'Cuenta Creada',
          message: 'Tu cuenta fue creada. Debes verificar tu correo electrónico para continuar.',
        });
      } else {
        addToast({
          type: 'success',
          title: 'Cuenta Creada Exitosamente',
          message: `¡Bienvenido a Banelio, ${data.name}!`,
        });
      }

      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) return;

        const result = await response.json();

        if (cancelled || !result.success || !result.user) return;

        const user = result.user as CustomerUser;
        setCustomerUser(user);
        setAffiliateUser(null);
        if (user.role === 'ADMIN') {
          setIsAdminAuthenticated(true);
          setRole('ADMIN');
        } else if (user.role === 'RESELLER') {
          setIsAdminAuthenticated(false);
          setRole('RESELLER');
        } else {
          setIsAdminAuthenticated(false);
          setRole('CUSTOMER');
        }
      } catch {
        // Sin sesión válida: mantener estado público.
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const sendVerificationEmail = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/email-verification/send', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        addToast({
          type: 'error',
          title: 'Verificación de email',
          message: result.error || 'No se pudo enviar el correo de verificación.',
        });
        return false;
      }

      return true;
    } catch {
      addToast({
        type: 'error',
        title: 'Verificación de email',
        message: 'No se pudo conectar con el servidor.',
      });
      return false;
    }
  };

  const verifyEmailCode = async (code: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/email-verification/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success || !result.user) {
        addToast({
          type: 'error',
          title: 'Verificación de email',
          message: result.error || 'El código es inválido o ha expirado.',
        });
        return false;
      }

      setCustomerUser(result.user as CustomerUser);
      return true;
    } catch {
      addToast({
        type: 'error',
        title: 'Verificación de email',
        message: 'No se pudo conectar con el servidor.',
      });
      return false;
    }
  };

  const enableTwoFactor = async (): Promise<{ qrCodeUrl: string; secret: string; backupCodes: string[] }> => {
    const response = await fetch("/api/auth/2fa/setup", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) throw new Error(data.error || "No se pudo configurar la autenticación de dos factores.");
    return { qrCodeUrl: data.qrCodeUrl, secret: data.secret, backupCodes: data.backupCodes };
  };

  const verifyTwoFactorCode = async (code: string): Promise<boolean> => {
    const response = await fetch("/api/auth/2fa/verify-setup", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) return false;
    if (data.customer) setCustomerUser(data.customer);
    return true;
  };

  const disableTwoFactor = async (): Promise<boolean> => {
    if (!customerUser) return false;
    const password = window.prompt("Introduce tu contraseña para desactivar la autenticación de dos factores:");
    if (!password) return false;
    const response = await fetch("/api/auth/2fa/disable", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      addToast({ type: "error", title: "2FA", message: data.error || "No se pudo desactivar la autenticación de dos factores." });
      return false;
    }
    if (data.customer) setCustomerUser(data.customer);
    else setCustomerUser({ ...customerUser, twoFactorEnabled: false, twoFactorSecret: undefined, backupCodes: undefined });
    addToast({ type: "success", title: "2FA", message: "Autenticación de dos factores desactivada." });
    return true;
  };

  const updateCustomerSecurity = (data: Partial<CustomerUser>) => {
    if (customerUser) {
      setCustomerUser({
        ...customerUser,
        ...data
      });
    }
  };

  const updateCustomerProfile = (data: Partial<CustomerUser>) => {
    if (customerUser) {
      const updated = {
        ...customerUser,
        ...data
      };
      setCustomerUser(updated);
      addToast({
        type: 'success',
        title: 'Perfil Actualizado',
        message: 'Tus datos de cuenta y facturación fueron guardados con éxito.'
      });
    }
  };

  const logoutCustomer = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // El estado local debe limpiarse aunque el backend no responda.
    }

    setCustomerUser(null);
    setAffiliateUser(null);
    setIsAdminAuthenticated(false);
    setRole('PUBLIC');
    setPendingTwoFactorAuth(null);
    setSharedRegistrantContact(null);
  };

  const loginAffiliate = async (_email: string, _password?: string): Promise<boolean> => {
    // El acceso de partners/resellers todavía no tiene autenticación backend.
    // No permitir un login falso desde el navegador.
    return false;
  };

  const registerAffiliate = async (_data: {
    name: string;
    email: string;
    website?: string;
    paymentMethod: string;
    paymentDest: string;
    password?: string;
  }): Promise<boolean> => {
    // El registro de partners/resellers todavía no tiene backend real.
    // No crear cuentas falsas ni persistirlas en el navegador.
    return false;
  };

  const logoutAffiliate = () => {
    setAffiliateUser(null);
    setRole('PUBLIC');
    setCustomerUser(null);
    setIsAdminAuthenticated(false);
  };

  const loginAdmin = async (
    _email: string,
    _password?: string,
    _pin?: string
  ): Promise<boolean> => {
    // El acceso administrativo debe validarse exclusivamente mediante
    // autenticación backend. No permitir un login falso desde el navegador.
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    setRole('PUBLIC');
    setCustomerUser(null);
    setAffiliateUser(null);
  };

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('gh_tlds', JSON.stringify(tlds));
  }, [tlds]);
  useEffect(() => {
    localStorage.setItem('gh_services', JSON.stringify(services));
  }, [services]);
  useEffect(() => {
    localStorage.setItem('gh_orders', JSON.stringify(orders));
  }, [orders]);
  useEffect(() => {
    localStorage.setItem('gh_tickets', JSON.stringify(tickets));
  }, [tickets]);
  useEffect(() => {
    localStorage.setItem('gh_commissions', JSON.stringify(commissions));
  }, [commissions]);
  useEffect(() => {
    localStorage.setItem('gh_payouts', JSON.stringify(payouts));
  }, [payouts]);
  useEffect(() => {
    localStorage.setItem('gh_audit', JSON.stringify(auditLogs));
  }, [auditLogs]);
  useEffect(() => {
    localStorage.setItem('banelio_blog_posts', JSON.stringify(blogPosts));
  }, [blogPosts]);

  // Blog CRUD methods
  const addBlogPost = (post: Omit<BlogPost, 'id'>) => {
    const id = `post-${Date.now()}`;
    const newPost: BlogPost = { ...post, id };
    setBlogPosts(prev => [newPost, ...prev]);
    addAuditLog('CREATE_BLOG_POST', 'BLOG', `Se publicó el artículo: ${newPost.title}`, id);
    addToast({
      type: 'success',
      title: 'Artículo Publicado',
      message: `El post "${newPost.title}" ya está visible en el blog.`
    });
  };

  const updateBlogPost = (id: string, updates: Partial<BlogPost>) => {
    setBlogPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    addAuditLog('UPDATE_BLOG_POST', 'BLOG', `Se actualizó el artículo ID: ${id}`, id);
    addToast({
      type: 'info',
      title: 'Artículo Actualizado',
      message: 'Los cambios se han guardado exitosamente.'
    });
  };

  const deleteBlogPost = (id: string) => {
    const postToDelete = blogPosts.find(p => p.id === id);
    setBlogPosts(prev => prev.filter(p => p.id !== id));
    addAuditLog('DELETE_BLOG_POST', 'BLOG', `Se eliminó el artículo: ${postToDelete?.title || id}`, id);
    addToast({
      type: 'warning',
      title: 'Artículo Eliminado',
      message: 'El artículo ha sido removido del blog.'
    });
  };

  // Toast Helpers
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

  const addAuditLog = (action: string, entity: string, details: string, entityId?: string) => {
    const newLog: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: role === 'ADMIN' ? 'Admin Master (Administrador Banelio)' : role === 'RESELLER' ? 'Partner Reseller' : 'Cliente Autenticado',
      role,
      action,
      entity,
      entityId,
      ipAddress: '',
      details
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Cart operations
  const addToCart = (item: Omit<CartItem, 'id'>) => {
    // Check if already in cart
    const exists = cart.find((i) => i.name.toLowerCase() === item.name.toLowerCase() && i.type === item.type);
    if (exists) {
      addToast({
        type: 'info',
        title: 'Ya en el carrito',
        message: `${item.name} ya está en tu pedido.`
      });
      setIsCartOpen(true);
      return;
    }
    const id = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setCart((prev) => [...prev, { ...item, id }]);
    addToast({
      type: 'success',
      title: 'Añadido al carrito',
      message: `${item.name} ha sido agregado con éxito.`
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const updateCartItemPeriod = (id: string, period: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, periodYearsOrMonths: Math.max(1, period) } : item))
    );
  };

  const updateCartItemAddons = (id: string, addonsUpdates: Partial<NonNullable<CartItem['addons']>>) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          addons: {
            ...(item.addons || {}),
            ...addonsUpdates
          }
        };
      })
    );
  };

  const updateCartItemEppCode = (id: string, eppCode: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          addons: {
            ...(item.addons || {}),
            eppCode
          }
        };
      })
    );
  };

  const updateCartItemRegistrant = (id: string, contact: DomainRegistrantContact) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          addons: {
            ...(item.addons || {}),
            registrantContact: contact
          }
        };
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setPromoCode('');
  };

  // Promo code discounts
  const promoDiscountUSD = promoCode === 'WELCOME20' ? 0.2 : promoCode === 'PARTNER30' ? 0.15 : promoCode === 'HOTSALE' ? 0.25 : 0;

  const applyPromoCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (['WELCOME20', 'PARTNER30', 'HOTSALE'].includes(clean)) {
      setPromoCode(clean);
      addToast({
        type: 'success',
        title: 'Cupón aplicado',
        message: `Descuento del ${(promoDiscountUSD ? promoDiscountUSD * 100 : 20)}% aplicado a tu orden.`
      });
      return { success: true, message: 'Cupón válido aplicado.' };
    }
    return { success: false, message: 'Cupón no válido o expirado.' };
  };

  const removePromoCode = () => {
    setPromoCode('');
  };

  // Cart Calculations
  // Debe coincidir con CartModal y server/orders.ts:
  // descuento comercial por cantidad/duración antes del cupón.
  const cartSubtotalUSD = cart.reduce((acc, item) => {
    const periodMultiplier = Math.max(1, item.periodYearsOrMonths || 1);
    const isTransfer = item.type === 'DOMAIN' && Boolean(item.addons?.isTransfer);
    const discount = calculateCommercialDiscount(
      item.quantity,
      isTransfer ? 1 : periodMultiplier,
      DEFAULT_DISCOUNT_CONFIG
    );
    const discountedUnitPrice = Math.round(
      item.basePriceUSD *
      (1 - discount.combinedDiscountPercent / 100) *
      100
    ) / 100;
    const itemTotal = Math.round(
      discountedUnitPrice *
      item.quantity *
      periodMultiplier *
      100
    ) / 100;

    return acc + itemTotal;
  }, 0);

  const discountAmountUSD = cartSubtotalUSD * promoDiscountUSD;
  const taxableSubtotalUSD = Math.max(0, cartSubtotalUSD - discountAmountUSD);
  const taxRate = COUNTRY_TAX_RATES[countryCode]?.rate ?? 0.16;
  const cartTaxUSD = taxableSubtotalUSD * taxRate;
  const cartTotalUSD = taxableSubtotalUSD + cartTaxUSD;

  const [serverCatalog, setServerCatalog] = useState<Array<{
    sku: string;
    name: string;
    description?: string;
    category: string;
    price: number;
    currency?: string;
    billingPeriod: string;
    metadata?: Record<string, unknown>;
  }>>([]);

  React.useEffect(() => {
    let cancelled = false;

    fetch('/api/catalog')
      .then((res) => {
        if (!res.ok) throw new Error(`Catalog HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : [];

        if (!cancelled && items.length > 0) {
          setServerCatalog(items);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // TLD Pricing Engine
  const getTldPrice = (tldName: string): number => {
    const cleanTld = tldName.replace(/^\./, '').toLowerCase();
    const sku = `domain-${cleanTld}`;

    const serverItem = serverCatalog.find(
      (item) => item.category === 'DOMAIN' && item.sku === sku
    );

    if (serverItem && Number.isFinite(Number(serverItem.price))) {
      return Number(serverItem.price);
    }

    const config = tlds.find((t) => t.tld.toLowerCase() === cleanTld);
    if (!config) return 0;
    return calculateTldRetailPrice(config);
  };

  const updateTldConfig = (tld: string, updates: Partial<TldConfig>) => {
    setTlds((prev) =>
      prev.map((item) => (item.tld.toLowerCase() === tld.toLowerCase() ? { ...item, ...updates } : item))
    );
    addAuditLog('UPDATE_TLD_PRICING', 'TLD_CONFIG', `Actualizó configuración de .${tld}`, tld);
    addToast({
      type: 'success',
      title: 'Motor de Precios Actualizado',
      message: `Margen y precio de .${tld} recalculados en tiempo real.`
    });
  };

  // Service Management
  const addService = (service: UserService) => {
    setServices((prev) => [service, ...prev]);
  };

  const updateService = (id: string, updates: Partial<UserService>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    addAuditLog('UPDATE_SERVICE', 'USER_SERVICE', `Modificó configuración del servicio ${id}`, id);
    addToast({
      type: 'success',
      title: 'Servicio Actualizado',
      message: 'Los cambios fueron guardados en el panel.'
    });
  };

  const addDnsRecord = (serviceId: string, record: Omit<DnsRecord, 'id'>) => {
    const recordId = `dns-${Date.now()}`;
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === serviceId) {
          const currentRecords = s.dnsRecords || [];
          return {
            ...s,
            dnsRecords: [...currentRecords, { ...record, id: recordId }]
          };
        }
        return s;
      })
    );
    addAuditLog('ADD_DNS_RECORD', 'DNS_ZONE', `Añadido registro ${record.type} ${record.host} -> ${record.value}`, serviceId);
    addToast({
      type: 'success',
      title: 'Registro DNS Creado',
      message: `Se añadió registro ${record.type} para ${record.host}. Propagación en curso.`
    });
  };

  const removeDnsRecord = (serviceId: string, recordId: string) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === serviceId) {
          return {
            ...s,
            dnsRecords: (s.dnsRecords || []).filter((r) => r.id !== recordId)
          };
        }
        return s;
      })
    );
    addAuditLog('DELETE_DNS_RECORD', 'DNS_ZONE', `Eliminado registro DNS ${recordId}`, serviceId);
    addToast({
      type: 'info',
      title: 'Registro DNS Eliminado',
      message: 'La zona DNS fue actualizada.'
    });
  };

  // Crea/persiste la orden de forma SERVER-AUTHORITATIVE (POST /api/orders/create).
  // Idempotente: clave aleatoria estable durante el mismo checkout para que
  // los reintentos no dupliquen la orden y los cambios de carrito/cupón/país
  // generen una nueva identidad de checkout.
  const createServerOrderCheckoutRef = useRef<{ fingerprint: string; key: string } | null>(null);

  const createServerOrder = async (customerInfo: { name: string; email: string }): Promise<any> => {
    const items = cart.map((item) => ({
      sku: item.sku || '',
      quantity: cartItemQuantity(item),
      periodYearsOrMonths: Math.max(1, item.periodYearsOrMonths || 1),
      periodUnit: item.periodUnit || 'year',
      isTransfer: Boolean(item.addons?.isTransfer) || undefined,
      ...(item.addons?.isTransfer && item.addons?.eppCode ? { eppCode: item.addons.eppCode } : {})
    }));

    const checkoutFingerprint = JSON.stringify({
      items: [...items].sort((a, b) =>
        `${a.sku}|${a.quantity}|${a.periodYearsOrMonths}|${a.periodUnit}|${Boolean(a.isTransfer)}|${a.eppCode || ''}`.localeCompare(
          `${b.sku}|${b.quantity}|${b.periodYearsOrMonths}|${b.periodUnit}|${Boolean(b.isTransfer)}|${b.eppCode || ''}`
        )
      ),
      countryCode,
      promoCode: promoCode.trim() || ''
    });

    if (
      !createServerOrderCheckoutRef.current ||
      createServerOrderCheckoutRef.current.fingerprint !== checkoutFingerprint
    ) {
      createServerOrderCheckoutRef.current = {
        fingerprint: checkoutFingerprint,
        key: `co-${crypto.randomUUID()}`
      };
    }

    const idempotencyKey = createServerOrderCheckoutRef.current.key;

    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idempotencyKey,
        countryCode,
        promoCode: promoCode.trim() || undefined,
        referralCode: promoCode.trim() === 'PARTNER30' ? 'PARTNER30' : (affiliateUser?.referralCode || undefined),
        customer: {
          email: customerInfo?.email || customerUser?.email || undefined,
          name: customerInfo?.name || customerUser?.name || undefined,
          registrant: sharedRegistrantContact?.email ? {
            name: sharedRegistrantContact.name,
            org: sharedRegistrantContact.company,
            email: sharedRegistrantContact.email,
            phone: sharedRegistrantContact.phone,
            address: sharedRegistrantContact.address,
            city: sharedRegistrantContact.city,
            state: sharedRegistrantContact.state,
            postalCode: sharedRegistrantContact.postalCode,
            country: sharedRegistrantContact.country
          } : undefined
        },
        items
      })
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok || !data?.order) {
      const msg = data?.error || (data && data.message) || `El servidor rechazó la orden (HTTP ${res.status}).`;
      throw new Error(msg);
    }
    return data.order;
  };

  // Checkout & Provisioning process
  // IMPORTANTE (server-authoritative): el servidor (POST /api/orders/create) es la
  // ÚNICA autoridad para crear la orden, validar SKUs, calcular precios/impuestos/
  // totales, y asignar el Order ID y los estados. El frontend ya NO fabrica:
  // orderId, invoice, precios, EPP, DNS/IP, provisioning ni comisiones.
  // Sin webhook real del proveedor, la orden queda SIEMPRE en PENDING_PAYMENT
  // y NO se provisiona. El frontend JAMÁS marca PAID.
  const processCheckout = async (
    paymentMethod: PaymentMethod,
    customerInfo: { name: string; email: string },
    oxxoDetails?: { reference: string; expiresAt: string },
    paymentStatus?: { confirmed: boolean; gatewayReference?: string }
  ): Promise<Order> => {
    let serverOrder: any;
    try {
      serverOrder = await createServerOrder({
        name: customerInfo.name || customerUser?.name || 'Cliente',
        email: customerInfo.email || customerUser?.email || ''
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'No se pudo crear la orden',
        message: err?.message || 'El servidor rechazó la orden. Revisa tu carrito e intenta de nuevo.'
      });
      throw err;
    }

    const isOxxo = paymentMethod === 'OXXO_PAY';

    // Estados SIEMPRE del servidor. Sin confirmación real (webhook) la orden
    // queda PENDING_PAYMENT; nunca PAID por decisión del frontend.
    const orderStatus: OrderStatus = 'PENDING_PAYMENT';
    const orderPaymentStatus: Order['paymentStatus'] = 'PENDING_PAYMENT';

    const orderItems: OrderItem[] = (serverOrder.items || []).map((li: any, idx: number) => {
      const cartItem = cart.find((c) => c.sku === li.sku);
      const serviceType: ServiceType = cartItem
        ? cartItem.type
        : (li.sku || '').startsWith('tld-')
          ? 'DOMAIN'
          : (li.sku || '').startsWith('email-')
            ? 'EMAIL'
            : (li.sku || '').startsWith('ssl-')
              ? 'SSL'
              : 'HOSTING';
      const periodLabel = li.billingPeriod === 'MONTH' ? 'mes(es)' : 'año(s)';
      return {
        id: `${serverOrder.id}-${idx}`,
        description: `${serviceType === 'DOMAIN' ? 'Registro de Dominio' : serviceType === 'HOSTING' ? 'Plan de Hosting NVMe' : serviceType === 'EMAIL' ? 'Buzón Correo Pro' : 'Certificado SSL'}: ${li.name} (${li.quantity} ${periodLabel})`,
        serviceType,
        unitPriceUSD: Number(li.unitPriceUSD),
        quantity: Number(li.quantity)
      };
    });

    const totalPaidInCurrency = convertCurrency(Number(serverOrder.total), currency);

    const newOrder: Order = {
      id: serverOrder.id,
      customerId: serverOrder.customerId || customerUser?.id || '',
      customerName: customerInfo.name || customerUser?.name || 'Cliente',
      customerEmail: customerInfo.email || customerUser?.email || '',
      countryCode,
      date: serverOrder.createdAt || new Date().toISOString(),
      items: orderItems,
      subtotalUSD: Number(serverOrder.subtotal),
      discountUSD: Number(serverOrder.discount || 0),
      taxUSD: Number(serverOrder.tax),
      taxPercent: Number(serverOrder.taxRate || 0),
      totalUSD: Number(serverOrder.total),
      currencyPaid: currency,
      totalPaidInCurrency,
      paymentMethod,
      status: orderStatus,
      paymentStatus: orderPaymentStatus,
      gatewayReference: paymentStatus?.gatewayReference,
      invoiceNumber: serverOrder.id,
      referralCodeUsed: promoCode === 'PARTNER30' ? 'PARTNER30' : undefined,
      oxxoDetails: isOxxo
        ? {
            reference: oxxoDetails?.reference || '',
            expiresAt: oxxoDetails?.expiresAt || ''
          }
        : undefined
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Sin confirmación real de pago (webhook) NO se crean servicios, jobs de
    // provisioning ni comisiones. Nada de Math.random en estados ni montos.
    addAuditLog(
      'ORDER_PAYMENT_PENDING',
      'ORDER',
      `Orden ${serverOrder.id} creada en estado ${serverOrder.paymentStatus} (${paymentMethod}) - pendiente de confirmación del proveedor.`,
      serverOrder.id
    );

    return newOrder;
  };

  // Support Tickets
  const createTicket = (subject: string, category: any, priority: any, message: string) => {
    const ticketId = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTicket: SupportTicket = {
      id: ticketId,
      customerId: 'usr-customer-01',
      customerName: impersonatedCustomerName || 'Juan Pérez',
      subject,
      category,
      priority,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'CUSTOMER',
          senderName: impersonatedCustomerName || 'Juan Pérez',
          message,
          timestamp: new Date().toISOString()
        }
      ]
    };
    setTickets((prev) => [newTicket, ...prev]);
    addAuditLog('CREATE_SUPPORT_TICKET', 'SUPPORT_TICKET', `Nuevo ticket #${ticketId}: ${subject}`, ticketId);
    addToast({
      type: 'success',
      title: 'Ticket de Soporte Creado',
      message: `Tu ticket #${ticketId} ha sido asignado a un ingeniero de guardia.`
    });
  };

  const replyTicket = (ticketId: string, message: string, isAdmin = false) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const newMsg = {
            id: `msg-${Date.now()}`,
            sender: (isAdmin ? 'SUPPORT' : 'CUSTOMER') as any,
            senderName: isAdmin ? 'Soporte Banelio' : impersonatedCustomerName || 'Cliente',
            message,
            timestamp: new Date().toISOString()
          };
          return {
            ...t,
            status: isAdmin ? 'WAITING_CUSTOMER' : 'IN_PROGRESS',
            updatedAt: new Date().toISOString(),
            messages: [...t.messages, newMsg]
          };
        }
        return t;
      })
    );
    addToast({
      type: 'info',
      title: 'Respuesta enviada',
      message: 'El hilo del ticket fue actualizado.'
    });
  };

  const updateTicketStatus = (ticketId: string, status: any) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status, updatedAt: new Date().toISOString() } : t)));
    addAuditLog('UPDATE_TICKET_STATUS', 'SUPPORT_TICKET', `Estado del ticket #${ticketId} cambiado a ${status}`, ticketId);
  };

  // Reseller Payouts
  const requestPayout = (amountUSD: number, method: any, destination: string) => {
    const available = commissions
      .filter((c) => c.status === 'AVAILABLE')
      .reduce((sum, c) => sum + c.amountUSD, 0);

    const alreadyPending = payouts
      .filter((p) => p.status === 'PENDING')
      .reduce((sum, p) => sum + p.amountUSD, 0);

    const netAvailable = Math.max(0, available - alreadyPending);

    if (amountUSD < 50) {
      return { success: false, message: 'El monto mínimo de retiro es $50.00 USD.' };
    }
    if (amountUSD > netAvailable) {
      return { success: false, message: `Saldo disponible insuficiente ($${netAvailable.toFixed(2)} USD disponibles).` };
    }

    const newPayout: PayoutRequest = {
      id: `pay-${Date.now()}`,
      resellerId: 'res-01',
      resellerName: affiliateUser?.name || 'Partner Banelio',
      amountUSD,
      method,
      destinationDetail: destination,
      requestedAt: new Date().toISOString(),
      status: 'PENDING'
    };

    setPayouts((prev) => [newPayout, ...prev]);
    addAuditLog('REQUEST_PAYOUT', 'PAYOUT', `Solicitó retiro de $${amountUSD.toFixed(2)} USD vía ${method}`);
    addToast({
      type: 'success',
      title: 'Solicitud de Retiro Enviada',
      message: 'El equipo de administración revisará la transferencia en menos de 24h.'
    });

    return { success: true, message: 'Solicitud enviada con éxito.' };
  };

  const updatePayoutStatus = (payoutId: string, status: 'APPROVED' | 'REJECTED') => {
    setPayouts((prev) =>
      prev.map((p) =>
        p.id === payoutId
          ? { ...p, status, processedAt: new Date().toISOString() }
          : p
      )
    );
    addAuditLog('PROCESS_PAYOUT', 'PAYOUT', `Payout ${payoutId} fue marcado como ${status}`, payoutId);
    addToast({
      type: status === 'APPROVED' ? 'success' : 'warning',
      title: status === 'APPROVED' ? 'Pago Aprobado' : 'Pago Rechazado',
      message: `La solicitud ${payoutId} ha sido procesada.`
    });
  };

  // Impersonation
  const startImpersonation = (customerName: string) => {
    setImpersonatedCustomerName(customerName);
    setRole('CUSTOMER');
    addAuditLog('IMPERSONATE_START', 'USER', `Admin inició impersonación del cliente: ${customerName}`);
    addToast({
      type: 'warning',
      title: 'Modo Impersonación Activo',
      message: `Estás visualizando el panel como: ${customerName}. Todas las acciones quedan registradas.`
    });
  };

  const stopImpersonation = () => {
    const prevName = impersonatedCustomerName;
    setImpersonatedCustomerName(null);
    setRole('ADMIN');
    addAuditLog('IMPERSONATE_STOP', 'USER', `Admin finalizó impersonación de ${prevName}`);
    addToast({
      type: 'info',
      title: 'Impersonación Finalizada',
      message: 'Has vuelto a la Consola de Administración.'
    });
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        customerUser,
        affiliateUser,
        isAdminAuthenticated,
        loginCustomer,
        registerCustomer,
        logoutCustomer,
        sendVerificationEmail,
        verifyEmailCode,
        enableTwoFactor,
        disableTwoFactor,
        verifyTwoFactorCode,
        pendingTwoFactorAuth,
        completeTwoFactorLogin,
        cancelTwoFactorLogin,
        updateCustomerSecurity,
        updateCustomerProfile,
        loginAffiliate,
        registerAffiliate,
        logoutAffiliate,
        loginAdmin,
        logoutAdmin,
        currency,
        setCurrency,
        countryCode,
        setCountryCode,
        cart,
        addToCart,
        removeFromCart,
        updateCartItemPeriod,
        updateCartItemAddons,
        updateCartItemEppCode,
        updateCartItemRegistrant,
        domainRegistrantMode,
        setDomainRegistrantMode,
        sharedRegistrantContact,
        setSharedRegistrantContact,
        clearCart,
        cartTotalUSD,
        cartTaxUSD,
        cartSubtotalUSD,
        promoCode,
        promoDiscountUSD,
        applyPromoCode,
        removePromoCode,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        tlds,
        updateTldConfig,
        getTldPrice,
        services,
        addService,
        updateService,
        addDnsRecord,
        removeDnsRecord,
        orders,
        processCheckout,
        tickets,
        createTicket,
        replyTicket,
        updateTicketStatus,
        commissions,
        payouts,
        requestPayout,
        updatePayoutStatus,
        resellerPromoCode: 'PARTNER30',
        auditLogs,
        addAuditLog,
        toasts,
        addToast,
        removeToast,
        theme,
        setTheme,
        toggleTheme,
        language,
        setLanguage,
        t: (key: keyof typeof TRANSLATIONS['es']) => getTranslation(language, key),
        impersonatedCustomerName,
        startImpersonation,
        stopImpersonation,
        blogPosts,
        addBlogPost,
        updateBlogPost,
        deleteBlogPost
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
