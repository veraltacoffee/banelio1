import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/pricing';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { UserService } from '../../types';
import DnsManagerModal from './DnsManagerModal';
import TwoFactorModal from '../auth/TwoFactorModal';
import EmailConfirmationModal from '../auth/EmailConfirmationModal';
import ProfileCompletionModal from './ProfileCompletionModal';
import DomainTransferModal from '../public/DomainTransferModal';
import RegistrantEditModal from './RegistrantEditModal';
import {
  LayoutDashboard,
  User,
  Globe,
  Server,
  ShoppingBag,
  RefreshCw,
  CreditCard,
  ShieldCheck,
  Headphones,
  LogOut,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Plus,
  Download,
  Key,
  Shield,
  Lock,
  ArrowRight,
  Clock,
  Sparkles,
  Building,
  MapPin,
  Send,
  HelpCircle,
  Check
} from 'lucide-react';

export type CustomerDashboardTab =
  | 'DASHBOARD'
  | 'PROFILE'
  | 'DOMAINS'
  | 'SERVICES'
  | 'ORDERS'
  | 'RENEWALS'
  | 'BILLING'
  | 'SECURITY'
  | 'SUPPORT';

export default function CustomerDashboard() {
  const {
    services,
    orders,
    currency,
    updateService,
    impersonatedCustomerName,
    customerUser,
    updateCustomerProfile,
    disableTwoFactor,
    logoutCustomer,
    language,
    t,
    setRole,
    addToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<CustomerDashboardTab>('DASHBOARD');
  const [selectedDnsService, setSelectedDnsService] = useState<UserService | null>(null);
  const [eppModalDomain, setEppModalDomain] = useState<UserService | null>(null);
  const [registrantModalDomain, setRegistrantModalDomain] = useState<UserService | null>(null);
  const [is2FaModalOpen, setIs2FaModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferModalDomain, setTransferModalDomain] = useState('');

  // Real Entitlements (contracted services) from backend /api/entitlements
  const [entitlements, setEntitlements] = useState<any[]>([]);
  const [isLoadingEntitlements, setIsLoadingEntitlements] = useState(false);

  // Real Orders from backend /api/customer/orders
  const [serverOrders, setServerOrders] = useState<any[]>([]);

  // Real Domains from backend /api/customer/domains
  const [serverDomains, setServerDomains] = useState<any[]>([]);
  const [domainsMeta, setDomainsMeta] = useState<{ source?: string; registryConnected?: boolean; backendDependent?: boolean; message?: string }>({});

  // Profile Form State (Mi Perfil tab)
  const [profileName, setProfileName] = useState(customerUser?.name || '');
  const [profilePhone, setProfilePhone] = useState(customerUser?.phone || '');
  const [profileCompany, setProfileCompany] = useState(customerUser?.company || '');
  const [profileTaxId, setProfileTaxId] = useState(customerUser?.taxId || '');
  const [profileAddress, setProfileAddress] = useState(customerUser?.address || '');
  const [profileCity, setProfileCity] = useState(customerUser?.city || '');
  const [profileState, setProfileState] = useState(customerUser?.state || '');
  const [profilePostalCode, setProfilePostalCode] = useState(customerUser?.postalCode || '');
  const [profileCountry, setProfileCountry] = useState(customerUser?.country || 'Mexico');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Password reset request state (Security tab)
  const [pwResetLoading, setPwResetLoading] = useState(false);
  const [pwResetMsg, setPwResetMsg] = useState<string | null>(null);

  // Support inquiry state
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSentSuccess, setSupportSentSuccess] = useState(false);

  useEffect(() => {
    if (customerUser) {
      setProfileName(customerUser.name || '');
      setProfilePhone(customerUser.phone || '');
      setProfileCompany(customerUser.company || '');
      setProfileTaxId(customerUser.taxId || '');
      setProfileAddress(customerUser.address || '');
      setProfileCity(customerUser.city || '');
      setProfileState(customerUser.state || '');
      setProfilePostalCode(customerUser.postalCode || '');
      setProfileCountry(customerUser.country || 'Mexico');
    }
  }, [customerUser]);

  useEffect(() => {
    let isMounted = true;
    async function loadEntitlements() {
      setIsLoadingEntitlements(true);
      try {
        const res = await fetch('/api/entitlements', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && Array.isArray(data.entitlements)) {
            setEntitlements(data.entitlements);
          }
        }
      } catch {
        // Fallback silencioso
      } finally {
        if (isMounted) setIsLoadingEntitlements(false);
      }
    }

    if (customerUser) {
      loadEntitlements();

      fetch('/api/customer/orders', { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data?.success && Array.isArray(data.orders)) {
            setServerOrders(data.orders);
          }
        })
        .catch(() => {});

      fetch('/api/customer/domains', { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data?.success && Array.isArray(data.domains)) {
            setServerDomains(data.domains);
            setDomainsMeta({
              source: data.source,
              registryConnected: data.registryConnected,
              backendDependent: data.backendDependent,
              message: data.message
            });
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [customerUser?.id]);

  const customerDisplayName = impersonatedCustomerName || customerUser?.name || 'Cliente';
  const customerDisplayEmail = customerUser?.email || '';

  // Filter domain services (prioritizing authoritative /api/customer/domains, fallback to services)
  const domainServices = serverDomains.length > 0
    ? serverDomains.map((d) => ({
        id: String(d.id || d.identifier),
        name: d.domain || d.identifier || d.serviceName || d.name || 'dominio.com',
        type: 'DOMAIN' as const,
        status: (d.status || 'Active') as any,
        renewalDate: d.expiryDate || d.expiresAt || d.renewalDate || 'Anual',
        autoRenew: d.autoRenew ?? true,
        whoisPrivacy: d.privacyProtection ?? true,
        transferLock: d.locked ?? true
      }))
    : services.filter((s) => s.type === 'DOMAIN');

  // Customer orders (prioritize authoritative server orders, then session orders)
  const customerOrders = serverOrders.length > 0
    ? serverOrders
    : orders.filter((o) => {
        if (customerUser?.id && o.customerId) return o.customerId === customerUser.id;
        if (customerUser?.email && o.customerEmail) return o.customerEmail.toLowerCase() === customerUser.email.toLowerCase();
        return true;
      });

  const handleToggleWhois = (service: UserService) => {
    updateService(service.id, {
      whoisPrivacy: !service.whoisPrivacy
    });
  };

  const handleToggleAutoRenew = (service: UserService) => {
    updateService(service.id, {
      autoRenew: !service.autoRenew
    });
  };

  const handleToggleTransferLock = (service: UserService) => {
    updateService(service.id, {
      transferLock: !service.transferLock
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    updateCustomerProfile({
      name: profileName.trim(),
      phone: profilePhone.trim(),
      company: profileCompany.trim(),
      taxId: profileTaxId.trim().toUpperCase(),
      address: profileAddress.trim(),
      city: profileCity.trim(),
      state: profileState.trim(),
      postalCode: profilePostalCode.trim(),
      country: profileCountry
    });

    setIsSavingProfile(false);
    setProfileSaveSuccess(true);
    setTimeout(() => {
      setProfileSaveSuccess(false);
    }, 3500);
  };

  const handleRequestPasswordReset = async () => {
    if (!customerUser?.email) return;
    setPwResetLoading(true);
    setPwResetMsg(null);
    try {
      const res = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: customerUser.email })
      });
      const data = await res.json();
      setPwResetMsg(data.message || (language === 'en' ? 'Password reset instructions dispatched.' : 'Instrucciones enviadas a tu correo.'));
    } catch {
      setPwResetMsg(language === 'en' ? 'Connection error. Please try again.' : 'Error de comunicación. Intenta nuevamente.');
    } finally {
      setPwResetLoading(false);
    }
  };

  const handleSendSupportMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) return;

    setSupportSentSuccess(true);
    addToast({
      type: 'success',
      title: language === 'en' ? 'Inquiry Sent' : 'Mensaje Enviado',
      message: language === 'en' ? 'Our engineering team will assist you promptly.' : 'Nuestro equipo de soporte te responderá a la brevedad.'
    });

    setSupportSubject('');
    setSupportMessage('');
    setTimeout(() => setSupportSentSuccess(false), 4000);
  };

  const navItems: { id: CustomerDashboardTab; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    {
      id: 'DASHBOARD',
      label: language === 'en' ? 'Dashboard' : 'Resumen de Cuenta',
      icon: <LayoutDashboard size={16} />
    },
    {
      id: 'PROFILE',
      label: language === 'en' ? 'My Profile' : 'Mi Perfil',
      icon: <User size={16} />
    },
    {
      id: 'DOMAINS',
      label: language === 'en' ? 'My Domains' : 'Mis Dominios',
      icon: <Globe size={16} />,
      badge: domainServices.length > 0 ? domainServices.length : undefined
    },
    {
      id: 'SERVICES',
      label: language === 'en' ? 'My Services' : 'Mis Servicios',
      icon: <Server size={16} />,
      badge: entitlements.length > 0 ? entitlements.length : undefined
    },
    {
      id: 'ORDERS',
      label: language === 'en' ? 'My Orders' : 'Mis Pedidos',
      icon: <ShoppingBag size={16} />,
      badge: customerOrders.length > 0 ? customerOrders.length : undefined
    },
    {
      id: 'RENEWALS',
      label: language === 'en' ? 'Renewals' : 'Renovaciones',
      icon: <RefreshCw size={16} />
    },
    {
      id: 'BILLING',
      label: language === 'en' ? 'Billing' : 'Facturación',
      icon: <CreditCard size={16} />
    },
    {
      id: 'SECURITY',
      label: language === 'en' ? 'Security' : 'Seguridad',
      icon: <ShieldCheck size={16} />,
      badge: customerUser?.twoFactorEnabled ? '2FA' : undefined
    },
    {
      id: 'SUPPORT',
      label: language === 'en' ? 'Support' : 'Soporte',
      icon: <Headphones size={16} />
    }
  ];

  return (
    <div className="min-h-[85vh] bg-[#FCFCF8] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER: USER IDENTIFICATION & QUICK LOGOUT */}
        <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#8A8F98] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#B8F23A] text-[#070707] flex items-center justify-center text-2xl font-black shadow-xs shrink-0">
              {customerDisplayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-[#070707]">{customerDisplayName}</h1>
                <span className="bg-[#B8F23A] text-[#070707] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-[#B8F23A]">
                  {customerUser?.role || 'CUSTOMER'}
                </span>
                <span className="bg-[#F7F8F0] text-[#555A52] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#8A8F98]">
                  {customerUser?.status || 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-[#555A52] font-mono mt-0.5">{customerDisplayEmail}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="customer-logout-btn"
              onClick={() => {
                logoutCustomer();
                setRole('PUBLIC');
              }}
              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span>{language === 'en' ? 'Sign Out' : 'Cerrar Sesión'}</span>
            </button>
          </div>
        </div>

        {/* EMAIL VERIFICATION WARNING BANNER (NON-RESTRICTIVE) */}
        {customerUser && !customerUser.emailVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  {language === 'en' ? 'Email Confirmation Required' : 'Confirma tu Correo Electrónico'}
                </h4>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  {language === 'en'
                    ? 'Verify your address to unlock domain transfers, DNS zone edits, and automated billing invoices.'
                    : 'Confirma tu correo para habilitar transferencias, cambios en zonas DNS y envío automático de facturas.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="px-4 py-2 bg-[#070707] hover:bg-[#242424] text-[#FCFCF8] text-xs font-bold rounded-xl cursor-pointer transition-colors shrink-0 shadow-xs"
            >
              {language === 'en' ? 'Verify Email Now' : 'Confirmar Correo Ahora'}
            </button>
          </div>
        )}

        {/* CUSTOMER PORTAL NAVIGATION BAR */}
        <div className="bg-[#FFFFFF] p-2 rounded-2xl border border-[#8A8F98] shadow-xs overflow-x-auto">
          <nav className="flex items-center gap-1 min-w-max">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#B8F23A] text-[#070707] font-black shadow-xs'
                      : 'text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isActive
                          ? 'bg-[#070707] text-[#FCFCF8]'
                          : 'bg-[#F7F8F0] text-[#070707] border border-[#8A8F98]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ============================================================== */}
        {/* SECCIÓN 1: RESUMEN DE CUENTA (DASHBOARD)                       */}
        {/* ============================================================== */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            {/* Account Real Status Cards (NO FAKE METRICS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#FFFFFF] p-5 rounded-3xl border border-[#8A8F98] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#555A52] uppercase block">
                    {language === 'en' ? 'Account Status' : 'Estado de Cuenta'}
                  </span>
                  <span className="text-base font-black text-[#070707] block mt-1">
                    {customerUser?.status || 'ACTIVE'}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#F7F8F0] text-[#070707] flex items-center justify-center font-bold">
                  <User size={20} />
                </div>
              </div>

              <div className="bg-[#FFFFFF] p-5 rounded-3xl border border-[#8A8F98] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#555A52] uppercase block">
                    {language === 'en' ? 'Email Status' : 'Verificación Correo'}
                  </span>
                  <span className="text-base font-black text-[#070707] block mt-1 flex items-center gap-1.5">
                    {customerUser?.emailVerified ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={14} /> {language === 'en' ? 'Verified' : 'Verificado'}
                      </span>
                    ) : (
                      <span className="text-amber-700 flex items-center gap-1">
                        <AlertTriangle size={14} /> {language === 'en' ? 'Pending' : 'Pendiente'}
                      </span>
                    )}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#F7F8F0] text-[#070707] flex items-center justify-center font-bold">
                  <Mail size={20} />
                </div>
              </div>

              <div className="bg-[#FFFFFF] p-5 rounded-3xl border border-[#8A8F98] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#555A52] uppercase block">
                    {language === 'en' ? '2FA Security' : 'Seguridad 2FA'}
                  </span>
                  <span className="text-base font-black text-[#070707] block mt-1 flex items-center gap-1.5">
                    {customerUser?.twoFactorEnabled ? (
                      <span className="text-[#070707] bg-[#B8F23A] px-2 py-0.5 rounded-full text-xs font-bold">
                        {language === 'en' ? 'Active' : 'Activo'}
                      </span>
                    ) : (
                      <span className="text-[#555A52] text-xs font-medium">
                        {language === 'en' ? 'Not enabled' : 'Desactivado'}
                      </span>
                    )}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#F7F8F0] text-[#070707] flex items-center justify-center font-bold">
                  <ShieldCheck size={20} />
                </div>
              </div>

              <div className="bg-[#FFFFFF] p-5 rounded-3xl border border-[#8A8F98] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#555A52] uppercase block">
                    {language === 'en' ? 'Role & Access' : 'Rol Asignado'}
                  </span>
                  <span className="text-base font-black text-[#070707] block mt-1">
                    {customerUser?.role || 'CUSTOMER'}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#F7F8F0] text-[#070707] flex items-center justify-center font-bold">
                  <Lock size={20} />
                </div>
              </div>
            </div>

            {/* Quick Access Matrix */}
            <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#8A8F98] shadow-xs space-y-4">
              <h3 className="text-base font-black text-[#070707]">
                {language === 'en' ? 'Management Modules' : 'Módulos de Gestión de Cuenta'}
              </h3>
              <p className="text-xs text-[#555A52]">
                {language === 'en'
                  ? 'Access your registered domains, active server instances, billing history, and security settings.'
                  : 'Accede directamente a tus dominios, instancias de hosting, historial de compras y configuración de seguridad.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                <button
                  onClick={() => setActiveTab('DOMAINS')}
                  className="p-5 rounded-2xl border border-[#8A8F98] bg-[#FCFCF8] hover:bg-[#F7F8F0] hover:border-[#B8F23A] transition-all text-left flex items-start justify-between cursor-pointer group"
                >
                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#8A8F98] text-[#070707] flex items-center justify-center mb-3">
                      <Globe size={18} />
                    </div>
                    <h4 className="font-bold text-sm text-[#070707] group-hover:text-[#070707]">
                      {language === 'en' ? 'My Domains' : 'Mis Dominios'}
                    </h4>
                    <p className="text-xs text-[#555A52]">
                      {domainServices.length === 0
                        ? (language === 'en' ? 'No registered domains yet' : 'Sin dominios registrados aún')
                        : `${domainServices.length} ${language === 'en' ? 'domains registered' : 'dominios registrados'}`}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-[#858A82] group-hover:text-[#070707] transition-colors mt-2" />
                </button>

                <button
                  onClick={() => setActiveTab('SERVICES')}
                  className="p-5 rounded-2xl border border-[#8A8F98] bg-[#FCFCF8] hover:bg-[#F7F8F0] hover:border-[#B8F23A] transition-all text-left flex items-start justify-between cursor-pointer group"
                >
                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#8A8F98] text-[#070707] flex items-center justify-center mb-3">
                      <Server size={18} />
                    </div>
                    <h4 className="font-bold text-sm text-[#070707] group-hover:text-[#070707]">
                      {language === 'en' ? 'Contracted Services' : 'Servicios Contratados'}
                    </h4>
                    <p className="text-xs text-[#555A52]">
                      {isLoadingEntitlements
                        ? (language === 'en' ? 'Checking backend...' : 'Consultando backend...')
                        : entitlements.length === 0
                        ? (language === 'en' ? 'No active hosting or SSL' : 'Sin hosting ni SSL activos')
                        : `${entitlements.length} ${language === 'en' ? 'entitlements active' : 'licencias activas'}`}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-[#858A82] group-hover:text-[#070707] transition-colors mt-2" />
                </button>

                <button
                  onClick={() => setActiveTab('ORDERS')}
                  className="p-5 rounded-2xl border border-[#8A8F98] bg-[#FCFCF8] hover:bg-[#F7F8F0] hover:border-[#B8F23A] transition-all text-left flex items-start justify-between cursor-pointer group"
                >
                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#8A8F98] text-[#070707] flex items-center justify-center mb-3">
                      <ShoppingBag size={18} />
                    </div>
                    <h4 className="font-bold text-sm text-[#070707] group-hover:text-[#070707]">
                      {language === 'en' ? 'Orders & Invoices' : 'Mis Pedidos'}
                    </h4>
                    <p className="text-xs text-[#555A52]">
                      {customerOrders.length === 0
                        ? (language === 'en' ? 'No orders recorded' : 'Sin compras registradas')
                        : `${customerOrders.length} ${language === 'en' ? 'orders found' : 'pedidos registrados'}`}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-[#858A82] group-hover:text-[#070707] transition-colors mt-2" />
                </button>

                <button
                  onClick={() => setActiveTab('PROFILE')}
                  className="p-5 rounded-2xl border border-[#8A8F98] bg-[#FCFCF8] hover:bg-[#F7F8F0] hover:border-[#B8F23A] transition-all text-left flex items-start justify-between cursor-pointer group"
                >
                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#8A8F98] text-[#070707] flex items-center justify-center mb-3">
                      <User size={18} />
                    </div>
                    <h4 className="font-bold text-sm text-[#070707] group-hover:text-[#070707]">
                      {language === 'en' ? 'Account Profile' : 'Mi Perfil'}
                    </h4>
                    <p className="text-xs text-[#555A52]">
                      {language === 'en' ? 'Contact details and tax ID' : 'Datos fiscales y de contacto'}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-[#858A82] group-hover:text-[#070707] transition-colors mt-2" />
                </button>

                <button
                  onClick={() => setActiveTab('SECURITY')}
                  className="p-5 rounded-2xl border border-[#8A8F98] bg-[#FCFCF8] hover:bg-[#F7F8F0] hover:border-[#B8F23A] transition-all text-left flex items-start justify-between cursor-pointer group"
                >
                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#8A8F98] text-[#070707] flex items-center justify-center mb-3">
                      <ShieldCheck size={18} />
                    </div>
                    <h4 className="font-bold text-sm text-[#070707] group-hover:text-[#070707]">
                      {language === 'en' ? 'Security & 2FA' : 'Seguridad y 2FA'}
                    </h4>
                    <p className="text-xs text-[#555A52]">
                      {customerUser?.twoFactorEnabled
                        ? (language === 'en' ? '2FA TOTP is active' : 'Autenticación 2FA activa')
                        : (language === 'en' ? 'Protect your account with 2FA' : 'Protege tu cuenta con 2FA')}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-[#858A82] group-hover:text-[#070707] transition-colors mt-2" />
                </button>

                <button
                  onClick={() => setActiveTab('SUPPORT')}
                  className="p-5 rounded-2xl border border-[#8A8F98] bg-[#FCFCF8] hover:bg-[#F7F8F0] hover:border-[#B8F23A] transition-all text-left flex items-start justify-between cursor-pointer group"
                >
                  <div className="space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#8A8F98] text-[#070707] flex items-center justify-center mb-3">
                      <Headphones size={18} />
                    </div>
                    <h4 className="font-bold text-sm text-[#070707] group-hover:text-[#070707]">
                      {language === 'en' ? 'Engineering Support' : 'Soporte y Asistencia'}
                    </h4>
                    <p className="text-xs text-[#555A52]">
                      {language === 'en' ? 'WhatsApp, email and 24/7 hotline' : 'WhatsApp, correo y línea 24/7'}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-[#858A82] group-hover:text-[#070707] transition-colors mt-2" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECCIÓN 2: MI PERFIL (PROFILE)                                 */}
        {/* ============================================================== */}
        {activeTab === 'PROFILE' && (
          <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#8A8F98] shadow-xs space-y-6">
            <div>
              <h3 className="font-black text-lg text-[#070707]">
                {language === 'en' ? 'Customer Profile Information' : 'Datos del Perfil del Cliente'}
              </h3>
              <p className="text-xs text-[#555A52] mt-0.5">
                {language === 'en'
                  ? 'Manage your legal ownership data, tax identification, and contact coordinates.'
                  : 'Administra tus datos de titularidad legal, identificación fiscal y coordenadas de contacto.'}
              </p>
            </div>

            {profileSaveSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
                <CheckCircle2 size={16} />
                <span>
                  {language === 'en' ? 'Profile saved successfully!' : '¡Datos de perfil guardados correctamente!'}
                </span>
              </div>
            )}

            {/* Server-Controlled Inmutable Identifiers */}
            <div className="bg-[#FCFCF8] p-5 rounded-2xl border border-[#8A8F98] space-y-3">
              <span className="text-[11px] font-black uppercase text-[#555A52] tracking-wider block">
                {language === 'en' ? 'Server-Controlled Identity Parameters' : 'Parámetros Autoritativos del Servidor'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[#555A52] block">ID de Cliente / Cuenta:</span>
                  <span className="font-mono font-bold text-[#070707] block mt-0.5">
                    {customerUser?.id || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[#555A52] block">Rol del Sistema:</span>
                  <span className="font-bold text-[#070707] bg-[#B8F23A] px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">
                    {customerUser?.role || 'CUSTOMER'}
                  </span>
                </div>
                <div>
                  <span className="text-[#555A52] block">Estado de Cuenta:</span>
                  <span className="font-bold text-[#070707] block mt-0.5">
                    {customerUser?.status || 'ACTIVE'}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-[#858A82] pt-1">
                {language === 'en'
                  ? 'Note: Client ID, Role, and Account Status are enforced exclusively by the server session.'
                  : 'Nota: El ID de cliente, rol y estado de la cuenta están protegidos y son administrados exclusivamente por el servidor.'}
              </p>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#070707] mb-1">
                    {language === 'en' ? 'Full Legal Name *' : 'Nombre Completo / Titular Legal *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#8A8F98] bg-[#FFFFFF] text-xs outline-none focus:border-[#B8F23A]"
                    placeholder="Ej. Juan Carlos Pérez Morales"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#070707] mb-1">
                    {language === 'en' ? 'Email Address (Server Protected)' : 'Correo Electrónico (Protegido por Servidor)'}
                  </label>
                  <input
                    type="email"
                    disabled
                    value={customerDisplayEmail}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#8A8F98] bg-[#F7F8F0] text-xs text-[#555A52] cursor-not-allowed outline-none font-mono"
                  />
                  <span className="text-[10px] text-[#858A82] mt-0.5 block">
                    {language === 'en'
                      ? 'Email changes require identity verification via the security module.'
                      : 'El cambio de correo requiere verificación de identidad mediante el módulo de seguridad.'}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-[#070707] mb-1">
                    {language === 'en' ? 'Phone Number' : 'Teléfono de Contacto'}
                  </label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#8A8F98] bg-[#FFFFFF] text-xs outline-none focus:border-[#B8F23A]"
                    placeholder="+52 55 1234 5678"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#070707] mb-1">
                    {language === 'en' ? 'Company / Organization' : 'Empresa u Organización'}
                  </label>
                  <input
                    type="text"
                    value={profileCompany}
                    onChange={(e) => setProfileCompany(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#8A8F98] bg-[#FFFFFF] text-xs outline-none focus:border-[#B8F23A]"
                    placeholder="Ej. Soluciones Digitales S.A. de C.V."
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#070707] mb-1">
                    {language === 'en' ? 'Tax ID / RFC' : 'RFC / Identificación Fiscal'}
                  </label>
                  <input
                    type="text"
                    value={profileTaxId}
                    onChange={(e) => setProfileTaxId(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#8A8F98] bg-[#FFFFFF] text-xs uppercase font-mono outline-none focus:border-[#B8F23A]"
                    placeholder="XAXX010101000"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#070707] mb-1">
                    {language === 'en' ? 'Street Address' : 'Dirección Fiscal'}
                  </label>
                  <input
                    type="text"
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#8A8F98] bg-[#FFFFFF] text-xs outline-none focus:border-[#B8F23A]"
                    placeholder="Av. Insurgentes Sur 1200, Int 4"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#070707] mb-1">
                    {language === 'en' ? 'City' : 'Ciudad'}
                  </label>
                  <input
                    type="text"
                    value={profileCity}
                    onChange={(e) => setProfileCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#8A8F98] bg-[#FFFFFF] text-xs outline-none focus:border-[#B8F23A]"
                    placeholder="Ciudad de México"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#070707] mb-1">
                    {language === 'en' ? 'State / Province' : 'Estado o Provincia'}
                  </label>
                  <input
                    type="text"
                    value={profileState}
                    onChange={(e) => setProfileState(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#8A8F98] bg-[#FFFFFF] text-xs outline-none focus:border-[#B8F23A]"
                    placeholder="CDMX"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#070707] mb-1">
                    {language === 'en' ? 'Postal Code' : 'Código Postal'}
                  </label>
                  <input
                    type="text"
                    value={profilePostalCode}
                    onChange={(e) => setProfilePostalCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#8A8F98] bg-[#FFFFFF] text-xs outline-none focus:border-[#B8F23A]"
                    placeholder="03100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#070707] mb-1">
                    {language === 'en' ? 'Country' : 'País'}
                  </label>
                  <select
                    value={profileCountry}
                    onChange={(e) => setProfileCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#8A8F98] bg-[#FFFFFF] text-xs outline-none focus:border-[#B8F23A]"
                  >
                    <option value="Mexico">México</option>
                    <option value="United States">Estados Unidos</option>
                    <option value="Spain">España</option>
                    <option value="Colombia">Colombia</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Chile">Chile</option>
                    <option value="Peru">Perú</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl text-xs font-black shadow-xs cursor-pointer transition-all flex items-center gap-2"
                >
                  <Check size={14} />
                  <span>
                    {isSavingProfile
                      ? (language === 'en' ? 'Saving...' : 'Guardando...')
                      : (language === 'en' ? 'Save Profile Details' : 'Guardar Datos del Perfil')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECCIÓN 3: MIS DOMINIOS (DOMAINS)                              */}
        {/* ============================================================== */}
        {activeTab === 'DOMAINS' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-lg text-[#070707]">{t('client_dom_title')}</h3>
                <p className="text-xs text-[#555A52]">{t('client_dom_subtitle')}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="dashboard-transfer-domain-btn"
                  onClick={() => {
                    setTransferModalDomain('');
                    setIsTransferModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#F7F8F0] hover:bg-[#8A8F98] text-[#070707] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-[#8A8F98]"
                >
                  <Shield size={14} className="text-[#070707]" />
                  <span>{language === 'en' ? 'Transfer Domain' : 'Transferir Dominio'}</span>
                </button>

                <button
                  id="dashboard-search-domain-btn"
                  onClick={() => setRole('PUBLIC')}
                  className="px-4 py-2 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] text-xs font-black rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus size={14} />
                  <span>{language === 'en' ? 'Register New' : 'Registrar Nuevo'}</span>
                </button>
              </div>
            </div>

            {/* Registry Synchronization Real Notice */}
            <div className="bg-[#F7F8F0] p-4 rounded-2xl border border-[#8A8F98] flex items-start gap-3 text-xs">
              <Sparkles size={16} className="text-[#070707] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-[#070707]">
                  {language === 'en' ? 'Registry Connection Status' : 'Sincronización con Registry ResellerClub'}
                </span>
                <p className="text-[#555A52] leading-relaxed">
                  {domainsMeta.message
                    ? domainsMeta.message
                    : language === 'en'
                    ? 'The domain catalog and purchase flows are functional. Full management of existing live DNS zones and EPP auth codes will sync with your account once ResellerClub production credentials are connected in subsequent steps.'
                    : 'El catálogo y registro de dominios se encuentra activo en el storefront. La administración directa de zonas DNS y autorizaciones EPP de dominios existentes requiere credenciales activas del backend IONOS / ResellerClub.'}
                </p>
              </div>
            </div>

            {domainServices.length === 0 ? (
              <div className="bg-[#FFFFFF] rounded-3xl p-12 text-center border border-[#8A8F98] space-y-3">
                <Globe size={40} className="text-[#858A82]/40 mx-auto mb-2" />
                <p className="text-sm font-bold text-[#070707]">
                  {language === 'en' ? 'No registered domains found' : 'No tienes dominios registrados aún en tu cuenta'}
                </p>
                <p className="text-xs text-[#555A52] max-w-md mx-auto">
                  {language === 'en'
                    ? 'Search and register .com, .mx, .com.mx, .io and hundreds of TLDs at wholesale and retail rates.'
                    : 'Busca y registra dominios .com, .mx, .com.mx, .io y cientos de extensiones con protección WHOIS incluida.'}
                </p>
                <button
                  onClick={() => setRole('PUBLIC')}
                  className="px-5 py-2.5 bg-[#B8F23A] text-[#070707] font-black text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-2 mt-2"
                >
                  <Plus size={14} />
                  <span>{language === 'en' ? 'Search Domains in Catalog' : 'Explorar Buscador de Dominios'}</span>
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {domainServices.map((dom) => (
                  <div
                    key={dom.id}
                    className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#8A8F98] shadow-xs hover:border-[#B8F23A]/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F7F8F0] border border-[#8A8F98] text-[#070707] flex items-center justify-center font-bold">
                          <Globe size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-base text-[#070707]">{dom.name}</span>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                dom.status === 'ACTIVE'
                                  ? 'bg-[#B8F23A] text-[#070707] border border-[#B8F23A]'
                                  : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                              }`}
                            >
                              {dom.status}
                            </span>
                          </div>
                          <span className="text-xs text-[#555A52] font-mono">
                            {t('client_expires')}: {dom.expiryDate} &middot; Provider ID: {dom.providerId}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2 text-xs">
                        <button
                          onClick={() => handleToggleWhois(dom)}
                          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            dom.whoisPrivacy
                              ? 'bg-[#B8F23A] text-[#070707] border border-[#B8F23A]'
                              : 'bg-[#FCFCF8] text-[#555A52] border border-[#8A8F98]'
                          }`}
                        >
                          <Shield size={13} />
                          <span>{t('client_whois_priv')}: {dom.whoisPrivacy ? t('client_active') : t('client_inactive')}</span>
                        </button>

                        <button
                          onClick={() => handleToggleTransferLock(dom)}
                          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            dom.transferLock
                              ? 'bg-[#FCFCF8] text-[#070707] border border-[#8A8F98]'
                              : 'bg-amber-500/10 text-amber-700 border border-amber-500/30'
                          }`}
                        >
                          <Lock size={13} />
                          <span>{t('client_transfer_lock')}: {dom.transferLock ? t('client_locked') : t('client_unlocked')}</span>
                        </button>

                        <button
                          onClick={() => handleToggleAutoRenew(dom)}
                          className="px-3 py-1.5 rounded-xl font-bold bg-[#FCFCF8] text-[#555A52] hover:text-[#070707] border border-[#8A8F98] flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw size={13} />
                          <span>{t('client_auto_renew')}: {dom.autoRenew ? t('client_yes') : t('client_no')}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-[#8A8F98] flex-wrap">
                      <button
                        onClick={() => setSelectedDnsService(dom)}
                        className="px-4 py-2.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <span>{t('client_manage_dns')}</span>
                      </button>

                      <button
                        onClick={() => setRegistrantModalDomain(dom)}
                        className="px-3.5 py-2.5 bg-[#FFFFFF] hover:bg-[#F7F8F0] text-[#070707] border border-[#8A8F98] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <User size={14} className="text-[#070707]" />
                        <span>{language === 'en' ? 'Registrant WHOIS' : 'Titular / WHOIS'}</span>
                      </button>

                      <button
                        onClick={() => setEppModalDomain(dom)}
                        className="px-3.5 py-2.5 bg-[#FFFFFF] hover:bg-[#F7F8F0] text-[#070707] border border-[#8A8F98] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Key size={14} className="text-[#070707]" />
                        <span>{t('client_epp_code')}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* SECCIÓN 4: MIS SERVICIOS (SERVICES)                            */}
        {/* ============================================================== */}
        {activeTab === 'SERVICES' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-lg text-[#070707]">
                  {language === 'en' ? 'Contracted Services & Entitlements' : 'Servicios y Licencias Contratadas'}
                </h3>
                <p className="text-xs text-[#555A52]">
                  {language === 'en'
                    ? 'Cloud hosting, business email, and SSL entitlements assigned to your authenticated account.'
                    : 'Servidores cloud, correo corporativo y certificados SSL vinculados a tu cuenta autenticada.'}
                </p>
              </div>

              <button
                onClick={() => setRole('PUBLIC')}
                className="px-4 py-2 bg-[#B8F23A] text-[#070707] rounded-xl text-xs font-black shadow-xs cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus size={14} />
                <span>{language === 'en' ? 'Explore Solutions Catalog' : 'Ver Catálogo de Soluciones'}</span>
              </button>
            </div>

            {isLoadingEntitlements ? (
              <div className="bg-[#FFFFFF] rounded-3xl p-12 text-center border border-[#8A8F98]">
                <RefreshCw size={28} className="animate-spin text-[#858A82] mx-auto mb-3" />
                <p className="text-xs font-bold text-[#555A52]">
                  {language === 'en' ? 'Querying backend entitlements...' : 'Consultando servicios en el servidor...'}
                </p>
              </div>
            ) : entitlements.length === 0 ? (
              <div className="bg-[#FFFFFF] rounded-3xl p-12 text-center border border-[#8A8F98] space-y-3">
                <Server size={40} className="text-[#858A82]/40 mx-auto mb-2" />
                <p className="text-sm font-bold text-[#070707]">
                  {language === 'en' ? 'No active contracted services found' : 'No tienes servicios de hosting, email o SSL activos en este momento'}
                </p>
                <p className="text-xs text-[#555A52] max-w-md mx-auto">
                  {language === 'en'
                    ? 'Contract cPanel Hosting, Corporate Titan Mailboxes, or Wildcard SSL certificates to see them here.'
                    : 'Contrata planes de Hosting cPanel, correo corporativo Titan o certificados SSL para administrarlos desde este panel.'}
                </p>
                <button
                  onClick={() => setRole('PUBLIC')}
                  className="px-5 py-2.5 bg-[#B8F23A] text-[#070707] font-black text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-2 mt-2"
                >
                  <Plus size={14} />
                  <span>{language === 'en' ? 'View Hosting Plans' : 'Ver Planes de Hosting'}</span>
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {entitlements.map((ent: any) => (
                  <div
                    key={ent.id}
                    className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#8A8F98] shadow-xs space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#F7F8F0] border border-[#8A8F98] text-[#070707] flex items-center justify-center font-bold">
                          <Server size={22} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-[#070707] bg-[#B8F23A] border border-[#B8F23A] px-2 py-0.5 rounded">
                            {ent.serviceType}
                          </span>
                          <h4 className="font-extrabold text-base text-[#070707] mt-1">{ent.name}</h4>
                          <span className="text-xs text-[#555A52] font-mono">SKU: {ent.sku}</span>
                        </div>
                      </div>

                      <span className="bg-[#B8F23A] text-[#070707] border border-[#B8F23A] text-xs font-black px-2.5 py-1 rounded-full">
                        {ent.status}
                      </span>
                    </div>

                    <div className="bg-[#FCFCF8] p-3 rounded-2xl border border-[#8A8F98] text-xs space-y-1 text-[#555A52]">
                      <div className="flex justify-between">
                        <span>{language === 'en' ? 'Granted At:' : 'Fecha de Concesión:'}</span>
                        <span className="font-mono text-[#070707]">
                          {ent.grantedAt ? new Date(ent.grantedAt).toLocaleDateString() : '—'}
                        </span>
                      </div>
                      {ent.expiresAt && (
                        <div className="flex justify-between">
                          <span>{language === 'en' ? 'Expires At:' : 'Expiración:'}</span>
                          <span className="font-mono text-[#070707]">
                            {new Date(ent.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* SECCIÓN 5: MIS PEDIDOS (ORDERS)                                */}
        {/* ============================================================== */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-black text-lg text-[#070707]">
                {language === 'en' ? 'My Orders & Purchase Receipts' : 'Mis Pedidos y Comprobantes de Compra'}
              </h3>
              <p className="text-xs text-[#555A52]">
                {language === 'en'
                  ? 'Orders and transactions registered under your authenticated customer account.'
                  : 'Órdenes y transacciones registradas bajo tu cuenta autenticada.'}
              </p>
            </div>

            <div className="bg-[#FFFFFF] rounded-3xl border border-[#8A8F98] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FCFCF8] text-[#555A52] font-bold border-b border-[#8A8F98]">
                    <tr>
                      <th className="py-4 px-6">{language === 'en' ? 'Order Number' : 'Nº de Orden'}</th>
                      <th className="py-4 px-6">{language === 'en' ? 'Date' : 'Fecha'}</th>
                      <th className="py-4 px-6">{language === 'en' ? 'Items' : 'Concepto'}</th>
                      <th className="py-4 px-6">{language === 'en' ? 'Total' : 'Total'}</th>
                      <th className="py-4 px-6">{language === 'en' ? 'Status' : 'Estado'}</th>
                      <th className="py-4 px-6">{language === 'en' ? 'Payment' : 'Pago'}</th>
                      <th className="py-4 px-6 text-right">{language === 'en' ? 'Receipt' : 'Comprobante'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8A8F98]">
                    {customerOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#F7F8F0] transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-[#070707]">
                          {ord.invoiceNumber || ord.id}
                        </td>
                        <td className="py-4 px-6 text-[#555A52]">
                          {new Date(ord.date).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 font-medium text-[#070707]">
                          {ord.items?.map((i) => i.description).join(', ') || 'Servicios Banelio'}
                        </td>
                        <td className="py-4 px-6 font-bold text-[#070707]">
                          {formatMoney(ord.totalUSD, currency)}
                        </td>
                        <td className="py-4 px-6">
                          <span className="bg-[#F7F8F0] text-[#070707] border border-[#8A8F98] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="bg-[#B8F23A] text-[#070707] text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                            {ord.paymentStatus || ord.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => generateInvoicePDF(ord)}
                            className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#F7F8F0] border border-[#8A8F98] text-[#070707] rounded-xl font-bold text-[11px] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Download size={13} className="text-[#070707]" />
                            <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {customerOrders.length === 0 && (
                <div className="bg-[#FFFFFF] p-10 text-center border-t border-[#8A8F98] space-y-2">
                  <ShoppingBag size={32} className="text-[#858A82]/40 mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#070707]">
                    {language === 'en' ? 'No orders recorded yet' : 'No tienes órdenes registradas en tu cuenta'}
                  </p>
                  <p className="text-xs text-[#555A52]">
                    {language === 'en'
                      ? 'Your purchase receipts will appear here automatically upon checkout.'
                      : 'Tus comprobantes de compra aparecerán aquí automáticamente tras completar un pedido.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECCIÓN 6: RENOVACIONES (RENEWALS - BACKEND-DEPENDENT)         */}
        {/* ============================================================== */}
        {activeTab === 'RENEWALS' && (
          <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#8A8F98] shadow-xs space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-[#070707]">
                  {language === 'en' ? 'Service Renewals' : 'Renovaciones de Servicios'}
                </h3>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-200">
                  BACKEND-DEPENDENT
                </span>
              </div>
              <p className="text-xs text-[#555A52] mt-0.5">
                {language === 'en'
                  ? 'Upcoming expiration dates, recurring cycles, and automated renewal triggers.'
                  : 'Fechas de vencimiento, ciclos recurrentes y renovación automática de licencias.'}
              </p>
            </div>

            <div className="bg-[#FCFCF8] rounded-2xl p-6 border border-[#8A8F98] text-center space-y-3">
              <RefreshCw size={36} className="text-[#858A82]/50 mx-auto" />
              <h4 className="font-bold text-sm text-[#070707]">
                {language === 'en' ? 'Registry Renewal Synchronization Pending' : 'Sincronización de Renovaciones con el Registry'}
              </h4>
              <p className="text-xs text-[#555A52] max-w-lg mx-auto leading-relaxed">
                {language === 'en'
                  ? 'The automated calculation of expiration dates and multi-year renewals connects directly with ResellerClub and the IONOS PHP billing core. Once credentials are active in production, all renewal dates will appear here.'
                  : 'El cálculo automatizado de fechas de expiración y renovaciones se sincroniza directamente desde el Registry ResellerClub y el motor de facturación de IONOS. Una vez conectadas las credenciales de producción en las fases siguientes, aquí podrás gestionar la renovación anticipada y el cobro recurrente.'}
              </p>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECCIÓN 7: FACTURACIÓN (BILLING)                              */}
        {/* ============================================================== */}
        {activeTab === 'BILLING' && (
          <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#8A8F98] shadow-xs space-y-6">
            <div>
              <h3 className="font-black text-lg text-[#070707]">
                {language === 'en' ? 'Billing Information & Tax Receipts' : 'Facturación y Datos Fiscales'}
              </h3>
              <p className="text-xs text-[#555A52] mt-0.5">
                {language === 'en'
                  ? 'Official tax identification, electronic CFDI invoice details, and PCI-compliant payment compliance.'
                  : 'Identificación fiscal, emisión de facturas electrónicas CFDI y cumplimiento de seguridad PCI.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#FCFCF8] p-6 rounded-2xl border border-[#8A8F98] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#070707]">
                    {language === 'en' ? 'Registered Tax Data' : 'Datos Fiscales Registrados'}
                  </h4>
                  <button
                    onClick={() => setActiveTab('PROFILE')}
                    className="text-xs font-bold text-[#070707] hover:underline"
                  >
                    {language === 'en' ? 'Edit in Profile' : 'Editar en Mi Perfil'}
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-[#8A8F98] pb-1.5">
                    <span className="text-[#555A52]">{language === 'en' ? 'Legal Name / Business' : 'Razón Social / Nombre'}:</span>
                    <span className="font-bold text-[#070707]">{customerUser?.company || customerUser?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#8A8F98] pb-1.5">
                    <span className="text-[#555A52]">{language === 'en' ? 'Tax ID / RFC' : 'RFC / Identificación Fiscal'}:</span>
                    <span className="font-mono font-bold text-[#070707]">{customerUser?.taxId || 'XAXX010101000'}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#8A8F98] pb-1.5">
                    <span className="text-[#555A52]">{language === 'en' ? 'Fiscal Address' : 'Dirección Fiscal'}:</span>
                    <span className="font-medium text-[#070707] text-right">{customerUser?.address || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#555A52]">{language === 'en' ? 'Country' : 'País'}:</span>
                    <span className="font-bold text-[#070707]">{customerUser?.country || 'México'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#FCFCF8] p-6 rounded-2xl border border-[#8A8F98] space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={20} className="text-[#070707]" />
                    <h4 className="font-bold text-sm text-[#070707]">
                      {language === 'en' ? 'PCI-DSS Payment Security' : 'Seguridad de Pago Certificada'}
                    </h4>
                  </div>
                  <p className="text-xs text-[#555A52] leading-relaxed">
                    {language === 'en'
                      ? 'Banelio never stores credit card or sensitive payment credentials on local servers. Transactions are handled via tokenized gateways with Level 1 PCI-DSS encryption.'
                      : 'Banelio no almacena números de tarjeta ni datos bancarios confidenciales en servidores locales. Toda transacción se procesa directamente a través de pasarelas certificadas PCI-DSS con cifrado de extremo a extremo.'}
                  </p>
                </div>

                <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#8A8F98] text-[11px] text-[#555A52]">
                  <span>{language === 'en' ? 'Supported methods: Stripe, PayPal, and OXXO Pay vouchers.' : 'Métodos soportados: Tarjeta bancaria (Stripe), PayPal y Pago en OXXO.'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECCIÓN 8: SEGURIDAD (SECURITY)                                */}
        {/* ============================================================== */}
        {activeTab === 'SECURITY' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-black text-lg text-[#070707]">
                {language === 'en' ? 'Account Security & Two-Factor Authentication' : 'Seguridad de la Cuenta y Autenticación en 2 Pasos'}
              </h3>
              <p className="text-xs text-[#555A52]">
                {language === 'en'
                  ? 'Manage your 2FA credentials, email verification status, and password recovery.'
                  : 'Administra tus credenciales 2FA, confirmación de correo electrónico y restablecimiento de contraseña.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Email Confirmation */}
              <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#8A8F98] shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-[#F7F8F0] text-[#070707] flex items-center justify-center border border-[#8A8F98]">
                      <Mail size={20} />
                    </div>
                    {customerUser?.emailVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                        <CheckCircle2 size={13} />
                        <span>{language === 'en' ? 'Verified' : 'Verificado'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200">
                        <AlertTriangle size={13} />
                        <span>{language === 'en' ? 'Unverified' : 'Pendiente'}</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-[#070707]">
                      {language === 'en' ? 'Email Confirmation' : 'Confirmación de Correo Electrónico'}
                    </h4>
                    <p className="text-xs text-[#555A52] mt-1 leading-relaxed">
                      {customerUser?.emailVerified
                        ? (language === 'en'
                            ? `Your email address (${customerDisplayEmail}) is verified and authorized for critical domain operations.`
                            : `Tu dirección de correo (${customerDisplayEmail}) está verificada y autorizada para operaciones críticas de dominios.`)
                        : (language === 'en'
                            ? `Confirm your email (${customerDisplayEmail}) to prevent unauthorized domain transfers and ensure invoice delivery.`
                            : `Confirma tu correo (${customerDisplayEmail}) para prevenir transferencias no autorizadas y recibir facturas fiscales.`)}
                    </p>
                  </div>
                </div>

                <div>
                  {customerUser?.emailVerified ? (
                    <div className="p-3 bg-[#F7F8F0] rounded-2xl border border-[#8A8F98] flex items-center gap-2 text-xs text-[#070707]">
                      <ShieldCheck size={16} />
                      <span>{language === 'en' ? 'Email security active' : 'Seguridad de correo activa'}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEmailModalOpen(true)}
                      className="w-full py-2.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                    >
                      <Mail size={14} />
                      <span>{language === 'en' ? 'Verify Email Address' : 'Verificar Correo Electrónico'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Card 2: 2FA TOTP */}
              <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#8A8F98] shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-[#B8F23A] text-[#070707] flex items-center justify-center border border-[#B8F23A]">
                      <Smartphone size={20} />
                    </div>
                    {customerUser?.twoFactorEnabled ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B8F23A] text-[#070707] text-[11px] font-bold border border-[#B8F23A]">
                        <ShieldCheck size={13} />
                        <span>{language === 'en' ? '2FA Active' : '2FA Activo'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                        <span>{language === 'en' ? 'Disabled' : 'Desactivado'}</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-[#070707]">
                      {language === 'en' ? 'Two-Factor Authentication (2FA TOTP)' : 'Autenticación en Dos Pasos (2FA TOTP)'}
                    </h4>
                    <p className="text-xs text-[#555A52] mt-1 leading-relaxed">
                      {customerUser?.twoFactorEnabled
                        ? (language === 'en'
                            ? 'Every login requires your password plus a 6-digit TOTP code generated on your authenticator app.'
                            : 'Cada inicio de sesión requiere tu contraseña y un código dinámico de 6 dígitos desde tu app autenticadora.')
                        : (language === 'en'
                            ? 'Protect your DNS records and server instances against credential stuffing with Google Authenticator, 1Password, or Authy.'
                            : 'Protege tus registros DNS y servidores contra ataques de fuerza bruta usando Google Authenticator, 1Password o Authy.')}
                    </p>
                  </div>
                </div>

                <div>
                  {customerUser?.twoFactorEnabled ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIs2FaModalOpen(true)}
                        className="flex-1 py-2.5 bg-[#F7F8F0] hover:bg-[#8A8F98] text-[#070707] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        {language === 'en' ? 'View Backup Codes' : 'Ver Códigos de Respaldo'}
                      </button>
                      <button
                        onClick={() => disableTwoFactor()}
                        className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        {language === 'en' ? 'Disable' : 'Desactivar'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIs2FaModalOpen(true)}
                      className="w-full py-2.5 bg-[#070707] hover:bg-[#242424] text-[#FCFCF8] rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                    >
                      <ShieldCheck size={14} className="text-[#B8F23A]" />
                      <span>{language === 'en' ? 'Set Up 2FA Now' : 'Activar 2FA Ahora'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Password Reset & Session Security */}
            <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#8A8F98] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-[#070707]">
                    {language === 'en' ? 'Password Recovery' : 'Restablecimiento de Contraseña'}
                  </h4>
                  <p className="text-xs text-[#555A52] mt-0.5">
                    {language === 'en'
                      ? 'Request a secure single-use recovery code dispatched to your verified email address.'
                      : 'Solicita un código de recuperación seguro de un solo uso enviado a tu correo registrado.'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={pwResetLoading}
                  onClick={handleRequestPasswordReset}
                  className="px-4 py-2 bg-[#F7F8F0] hover:bg-[#8A8F98] border border-[#8A8F98] text-[#070707] font-bold text-xs rounded-xl cursor-pointer transition-colors shrink-0"
                >
                  {pwResetLoading
                    ? (language === 'en' ? 'Dispatching...' : 'Enviando...')
                    : (language === 'en' ? 'Request Reset Code' : 'Solicitar Código de Cambio')}
                </button>
              </div>

              {pwResetMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>{pwResetMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                <div className="bg-[#FCFCF8] p-3.5 rounded-2xl border border-[#8A8F98]">
                  <span className="text-[#555A52] text-[11px] block">Cifrado de Sesión</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    HTTPS TLS 1.3 / SHA-256
                  </span>
                </div>
                <div className="bg-[#FCFCF8] p-3.5 rounded-2xl border border-[#8A8F98]">
                  <span className="text-[#555A52] text-[11px] block">Protección de Cookie</span>
                  <span className="font-bold text-[#070707] block mt-0.5">
                    HttpOnly & SameSite=Lax
                  </span>
                </div>
                <div className="bg-[#FCFCF8] p-3.5 rounded-2xl border border-[#8A8F98]">
                  <span className="text-[#555A52] text-[11px] block">Control de Acceso</span>
                  <span className="font-bold text-[#070707] block mt-0.5">
                    Autorización Server-Authoritative
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECCIÓN 9: SOPORTE (SUPPORT)                                   */}
        {/* ============================================================== */}
        {activeTab === 'SUPPORT' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-black text-lg text-[#070707]">
                {language === 'en' ? 'Technical Support & Assistance' : 'Soporte Técnico y Asistencia Oficial'}
              </h3>
              <p className="text-xs text-[#555A52]">
                {language === 'en'
                  ? 'Contact our sysadmin engineers directly through real channels: WhatsApp, telephone, or email.'
                  : 'Comunícate directamente con nuestros ingenieros de sistemas mediante canales reales: WhatsApp, teléfono o correo.'}
              </p>
            </div>

            {/* Direct Channel Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a
                href="https://wa.me/526601254107?text=Hola%20Soporte%20Banelio,%20necesito%20asistencia%20con%20mis%20servicios."
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#FFFFFF] p-6 rounded-3xl border border-[#8A8F98] shadow-xs hover:border-[#25D366] transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center font-bold">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                    </svg>
                  </div>
                  <h4 className="font-extrabold text-base text-[#070707] group-hover:text-[#25D366] transition-colors">
                    WhatsApp Directo
                  </h4>
                  <p className="text-xs text-[#555A52]">
                    {language === 'en' ? 'Instant live response from sysadmin engineers.' : 'Respuesta inmediata con ingenieros de guardia.'}
                  </p>
                </div>
                <span className="text-xs font-bold text-[#25D366] flex items-center gap-1">
                  <span>+52 660 125 4107</span> &rarr;
                </span>
              </a>

              <a
                href="mailto:soporte@banelio.com"
                className="bg-[#FFFFFF] p-6 rounded-3xl border border-[#8A8F98] shadow-xs hover:border-[#070707] transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#F7F8F0] border border-[#8A8F98] text-[#070707] flex items-center justify-center font-bold">
                    <Mail size={22} />
                  </div>
                  <h4 className="font-extrabold text-base text-[#070707]">
                    Correo de Soporte
                  </h4>
                  <p className="text-xs text-[#555A52]">
                    {language === 'en' ? 'Direct ticket submission and follow-up.' : 'Envío de incidencias técnicas y facturación.'}
                  </p>
                </div>
                <span className="text-xs font-bold text-[#070707] flex items-center gap-1">
                  <span>soporte@banelio.com</span> &rarr;
                </span>
              </a>

              <a
                href="tel:+526601254107"
                className="bg-[#FFFFFF] p-6 rounded-3xl border border-[#8A8F98] shadow-xs hover:border-[#070707] transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#F7F8F0] border border-[#8A8F98] text-[#070707] flex items-center justify-center font-bold">
                    <Smartphone size={22} />
                  </div>
                  <h4 className="font-extrabold text-base text-[#070707]">
                    Línea Telefónica 24/7
                  </h4>
                  <p className="text-xs text-[#555A52]">
                    {language === 'en' ? 'Critical emergency helpline for DNS and servers.' : 'Línea de emergencia para incidencias críticas de servidores.'}
                  </p>
                </div>
                <span className="text-xs font-bold text-[#070707] flex items-center gap-1">
                  <span>+52 660 125 4107</span> &rarr;
                </span>
              </a>
            </div>

            {/* Direct Contact Form */}
            <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#8A8F98] shadow-xs space-y-4">
              <h4 className="font-bold text-sm text-[#070707]">
                {language === 'en' ? 'Send Support Inquiry' : 'Enviar Mensaje Directo al Equipo de Soporte'}
              </h4>

              {supportSentSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 size={16} />
                  <span>
                    {language === 'en'
                      ? 'Inquiry received! An engineer will reach out to your registered email shortly.'
                      : '¡Consulta enviada! Un ingeniero de soporte se pondrá en contacto contigo en breve.'}
                  </span>
                </div>
              )}

              <form onSubmit={handleSendSupportMessage} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#070707] mb-1">
                    {language === 'en' ? 'Subject / Incident Summary' : 'Asunto / Resumen de la Incidencia'}
                  </label>
                  <input
                    type="text"
                    required
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    placeholder="ej. Consulta sobre configuración de registros MX y SPF"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#8A8F98] bg-[#FFFFFF] outline-none focus:border-[#B8F23A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#070707] mb-1">
                    {language === 'en' ? 'Detailed Description' : 'Descripción Detallada'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Escribe los detalles de tu consulta técnica o duda comercial..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#8A8F98] bg-[#FFFFFF] outline-none focus:border-[#B8F23A]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl text-xs font-black shadow-xs cursor-pointer flex items-center gap-2 transition-all"
                  >
                    <Send size={14} />
                    <span>{language === 'en' ? 'Send Inquiry' : 'Enviar Mensaje a Soporte'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* MODALS */}
      <DnsManagerModal
        service={selectedDnsService}
        isOpen={!!selectedDnsService}
        onClose={() => setSelectedDnsService(null)}
      />

      <TwoFactorModal
        isOpen={is2FaModalOpen}
        onClose={() => setIs2FaModalOpen(false)}
        mode="SETUP"
      />

      <EmailConfirmationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />

      <ProfileCompletionModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <DomainTransferModal
        domain={transferModalDomain}
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />

      <RegistrantEditModal
        domain={registrantModalDomain}
        isOpen={Boolean(registrantModalDomain)}
        onClose={() => setRegistrantModalDomain(null)}
      />

      {eppModalDomain && (
        <div className="fixed inset-0 z-50 bg-[#070707]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#8A8F98] text-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#070707] font-bold text-sm">
                <Key className="text-[#070707]" size={18} />
                <span>{t('client_epp_modal_title')}</span>
              </div>
              <button
                onClick={() => setEppModalDomain(null)}
                className="text-[#555A52] hover:text-[#070707] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-[#555A52]">
              {t('client_epp_modal_desc')} <b className="text-[#070707]">{eppModalDomain.name}</b>
            </p>
            <div className="bg-[#F7F8F0] p-3 rounded-xl border border-[#8A8F98] font-mono text-center font-black text-sm text-[#070707] select-all">
              {eppModalDomain.eppCode || '—'}
            </div>
            <button
              onClick={() => setEppModalDomain(null)}
              className="w-full py-2.5 bg-[#FFFFFF] hover:bg-[#F7F8F0] border border-[#8A8F98] text-[#070707] font-bold rounded-xl cursor-pointer transition-colors"
            >
              {t('client_close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
