import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/pricing';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { UserService, SupportTicket } from '../../types';
import DnsManagerModal from './DnsManagerModal';
import TicketModal from './TicketModal';
import TwoFactorModal from '../auth/TwoFactorModal';
import EmailConfirmationModal from '../auth/EmailConfirmationModal';
import ProfileCompletionModal from './ProfileCompletionModal';
import DomainTransferModal from '../public/DomainTransferModal';
import RegistrantEditModal from './RegistrantEditModal';
import {
  Globe,
  Server,
  FileText,
  MessageSquare,
  Shield,
  ShieldCheck,
  Lock,
  ExternalLink,
  Plus,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Key,
  HardDrive,
  Cpu,
  Mail,
  Smartphone,
  Check,
  AlertCircle,
  LogOut,
  UserCheck,
  User,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function CustomerDashboard() {
  const {
    services,
    orders,
    tickets,
    currency,
    updateService,
    impersonatedCustomerName,
    customerUser,
    disableTwoFactor,
    logoutCustomer,
    language,
    t,
    setRole
  } = useApp();

  const [activeTab, setActiveTab] = useState<'DOMAINS' | 'HOSTING' | 'INVOICES' | 'SUPPORT' | 'SECURITY'>('DOMAINS');
  const [selectedDnsService, setSelectedDnsService] = useState<UserService | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [eppModalDomain, setEppModalDomain] = useState<UserService | null>(null);
  const [registrantModalDomain, setRegistrantModalDomain] = useState<UserService | null>(null);
  const [is2FaModalOpen, setIs2FaModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  useEffect(() => {
    if (customerUser && !customerUser.emailVerified) {
      setIsEmailModalOpen(true);
    }
  }, [customerUser?.id, customerUser?.emailVerified]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferModalDomain, setTransferModalDomain] = useState('');

  const customerDisplayName = impersonatedCustomerName || customerUser?.name || '';
  const customerDisplayEmail = customerUser?.email || '';

  // Check if profile is complete
  const isProfileComplete = Boolean(
    customerUser?.name &&
    customerUser?.phone &&
    customerUser?.address &&
    customerUser?.taxId
  );

  // Filter items
  const domainServices = services.filter((s) => s.type === 'DOMAIN');
  const hostingServices = services.filter((s) => s.type === 'HOSTING' || s.type === 'EMAIL' || s.type === 'SSL');

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

  return (
    <div className="min-h-[85vh] bg-[#FCFCF8] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Dashboard Header Profile */}
        <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#8A8F98] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#B8F23A] text-[#070707] flex items-center justify-center text-2xl font-black shadow-xs">
              {customerDisplayName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[#070707]">{customerDisplayName}</h1>
                <span className="bg-[#B8F23A] text-[#070707] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-[#B8F23A]">
                  {t('client_verified_customer')}
                </span>
              </div>
              <p className="text-xs text-[#555A52] font-medium mt-0.5">{customerDisplayEmail}</p>
            </div>
          </div>

          {/* Quick Actions & Logout */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="dashboard-edit-profile-btn"
              onClick={() => setIsProfileModalOpen(true)}
              className="px-4 py-2 bg-[#F7F8F0] hover:bg-[#8A8F98] text-[#070707] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <User size={14} />
              <span>{language === 'en' ? 'Complete Profile Data' : 'Completar Datos del Perfil'}</span>
            </button>

            <button
              id="dashboard-logout-btn"
              onClick={() => {
                logoutCustomer();
                setRole('PUBLIC');
              }}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span>{language === 'en' ? 'Sign Out' : 'Cerrar Sesión'}</span>
            </button>
          </div>
        </div>

        {/* PROFILE COMPLETION ANNOUNCEMENT (NON-RESTRICTIVE) */}
        {!isProfileComplete && (
          <div className="bg-[#F7F8F0] border-2 border-[#B8F23A] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 animate-in fade-in">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#B8F23A] text-[#070707] flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles size={24} className="text-[#B8F23A]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-[#070707]">
                    {language === 'en' ? 'Profile Completion Request' : 'Solicitud para Llenar tus Datos Completos'}
                  </h3>
                  <span className="text-[10px] font-black uppercase bg-[#B8F23A] text-[#070707] px-2 py-0.5 rounded-md">
                    {language === 'en' ? 'Recommended for full control' : 'Recomendado para control total'}
                  </span>
                </div>
                <p className="text-xs text-[#555A52] leading-relaxed max-w-3xl">
                  {language === 'en'
                    ? 'We recommend completing your tax ID (RFC), contact phone, and billing address to maintain total ownership and automatic invoicing on your domains. Note: This never restricts your freedom to buy domains, perform domain transfers, or contract hosting services at any time.'
                    : 'Te sugerimos completar tus datos de facturación (RFC), teléfono y dirección fiscal con el fin de tener el control total de la titularidad de tu cuenta y dominios. Nota: Esta solicitud no limita en ningún momento tu capacidad de realizar transferencias de dominio, compras de dominios o contratación de servicios en la web.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id="banner-complete-profile-btn"
                onClick={() => setIsProfileModalOpen(true)}
                className="px-5 py-2.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{language === 'en' ? 'Fill Profile Info Now' : 'Llenar Datos Completos'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Unverified Email Warning Banner */}
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

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#8A8F98] pb-2">
          <button
            onClick={() => setActiveTab('DOMAINS')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'DOMAINS'
                ? 'bg-[#B8F23A] text-[#070707] font-black shadow-xs'
                : 'bg-[#FFFFFF] text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0] border border-[#8A8F98]'
            }`}
          >
            <Globe size={16} />
            <span>{t('client_domains_tab')} ({domainServices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('HOSTING')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'HOSTING'
                ? 'bg-[#B8F23A] text-[#070707] font-black shadow-xs'
                : 'bg-[#FFFFFF] text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0] border border-[#8A8F98]'
            }`}
          >
            <Server size={16} />
            <span>{t('client_hosting_tab')} ({hostingServices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('INVOICES')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'INVOICES'
                ? 'bg-[#B8F23A] text-[#070707] font-black shadow-xs'
                : 'bg-[#FFFFFF] text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0] border border-[#8A8F98]'
            }`}
          >
            <FileText size={16} />
            <span>{t('client_invoices_tab')} ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SUPPORT')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'SUPPORT'
                ? 'bg-[#B8F23A] text-[#070707] font-black shadow-xs'
                : 'bg-[#FFFFFF] text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0] border border-[#8A8F98]'
            }`}
          >
            <MessageSquare size={16} />
            <span>{t('client_support_tab')} ({tickets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'SECURITY'
                ? 'bg-[#B8F23A] text-[#070707] font-black shadow-xs'
                : 'bg-[#FFFFFF] text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0] border border-[#8A8F98]'
            }`}
          >
            <ShieldCheck size={16} />
            <span>{language === 'en' ? 'Security & 2FA' : 'Seguridad & 2FA'}</span>
            {customerUser?.twoFactorEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </div>

        {/* TAB 1: DOMAIN MANAGEMENT */}
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
                  <Shield size={14} className="text-[#B8F23A]" />
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

            {domainServices.length === 0 ? (
              <div className="bg-[#FFFFFF] rounded-3xl p-12 text-center border border-[#8A8F98]">
                <Globe size={40} className="text-[#858A82]/40 mx-auto mb-3" />
                <p className="text-sm font-bold text-[#070707]">{t('client_no_domains')}</p>
                <p className="text-xs text-[#555A52] mt-1">{t('client_no_domains_sub')}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {domainServices.map((dom) => (
                  <div
                    key={dom.id}
                    className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#8A8F98] shadow-xs hover:border-[#B8F23A]/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                  >
                    {/* Domain Left Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F7F8F0] border border-[#8A8F98] text-[#B8F23A] flex items-center justify-center font-bold">
                          <Globe size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-base text-[#070707]">{dom.name}</span>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                dom.status === 'ACTIVE'
                                  ? 'bg-[#B8F23A] text-[#B8F23A] border border-[#B8F23A]'
                                  : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                              }`}
                            >
                              {dom.status}
                            </span>
                          </div>
                          <span className="text-xs text-[#555A52] font-mono">
                            {t('client_expires')}: {dom.expiryDate} &middot; PAL Provider ID: {dom.providerId}
                          </span>
                        </div>
                      </div>

                      {/* Feature Toggles */}
                      <div className="flex flex-wrap gap-3 pt-2 text-xs">
                        {/* WHOIS Privacy Toggle */}
                        <button
                          onClick={() => handleToggleWhois(dom)}
                          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            dom.whoisPrivacy
                              ? 'bg-[#B8F23A] text-[#B8F23A] border border-[#B8F23A]'
                              : 'bg-[#FCFCF8] text-[#555A52] border border-[#8A8F98]'
                          }`}
                        >
                          <Shield size={13} className={dom.whoisPrivacy ? 'text-[#B8F23A]' : 'text-[#858A82]'} />
                          <span>{t('client_whois_priv')}: {dom.whoisPrivacy ? t('client_active') : t('client_inactive')}</span>
                        </button>

                        {/* Transfer Lock Toggle */}
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

                        {/* Auto-renew toggle */}
                        <button
                          onClick={() => handleToggleAutoRenew(dom)}
                          className="px-3 py-1.5 rounded-xl font-bold bg-[#FCFCF8] text-[#555A52] hover:text-[#070707] border border-[#8A8F98] flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw size={13} />
                          <span>{t('client_auto_renew')}: {dom.autoRenew ? t('client_yes') : t('client_no')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Domain Action Buttons */}
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
                        title="Ver o editar datos del titular legal / ICANN"
                      >
                        <User size={14} className="text-[#B8F23A]" />
                        <span>{language === 'en' ? 'Registrant WHOIS' : 'Titular / WHOIS'}</span>
                      </button>

                      <button
                        onClick={() => setEppModalDomain(dom)}
                        className="px-3.5 py-2.5 bg-[#FFFFFF] hover:bg-[#F7F8F0] text-[#070707] border border-[#8A8F98] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Ver Código EPP / Clave de Transferencia"
                      >
                        <Key size={14} className="text-[#B8F23A]" />
                        <span>{t('client_epp_code')}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HOSTING & CLOUD */}
        {activeTab === 'HOSTING' && (
          <div className="space-y-4">
            <h3 className="font-black text-lg text-[#070707]">{t('client_hosting_title')}</h3>

            {hostingServices.length === 0 ? (
              <div className="bg-[#FFFFFF] rounded-3xl p-12 text-center border border-[#8A8F98]">
                <Server size={40} className="text-[#858A82]/40 mx-auto mb-3" />
                <p className="text-sm font-bold text-[#070707]">{t('client_no_hosting')}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {hostingServices.map((srv) => {
                  const hasDisk = typeof srv.diskUsageMb === 'number' && typeof srv.diskLimitMb === 'number' && srv.diskLimitMb > 0;
                  const diskUsed = srv.diskUsageMb ?? 0;
                  const diskLimit = srv.diskLimitMb ?? 0;
                  const diskPct = hasDisk ? Math.round((diskUsed / diskLimit) * 100) : null;

                  const hasBw = typeof srv.bandwidthUsageGb === 'number' && typeof srv.bandwidthLimitGb === 'number' && srv.bandwidthLimitGb > 0;
                  const bwUsed = srv.bandwidthUsageGb ?? 0;
                  const bwLimit = srv.bandwidthLimitGb ?? 0;
                  const bwPct = hasBw ? Math.round((bwUsed / bwLimit) * 100) : null;

                  return (
                    <div key={srv.id} className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#8A8F98] shadow-xs space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#F7F8F0] border border-[#8A8F98] text-[#B8F23A] flex items-center justify-center font-bold">
                            {srv.type === 'HOSTING' ? <Server size={24} /> : srv.type === 'EMAIL' ? <Mail size={24} /> : <Shield size={24} />}
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase text-[#070707] bg-[#B8F23A] border border-[#B8F23A] px-2 py-0.5 rounded">
                              {srv.type}
                            </span>
                            <h4 className="font-extrabold text-base text-[#070707] mt-1">{srv.name}</h4>
                            <span className="text-xs text-[#555A52] font-mono">IP: {srv.ipAddress || '—'}</span>
                          </div>
                        </div>

                        <span className="bg-[#B8F23A] text-[#070707] border border-[#B8F23A] text-xs font-black px-2.5 py-1 rounded-full">
                          {srv.status}
                        </span>
                      </div>

                      {/* Usage Meters */}
                      <div className="space-y-3 bg-[#F7F8F0] p-4 rounded-2xl border border-[#8A8F98] text-xs">
                        <div>
                          <div className="flex justify-between font-semibold text-[#070707] mb-1">
                            <span className="flex items-center gap-1.5 text-[#555A52]">
                              <HardDrive size={13} /> {t('client_disk_usage')}:
                            </span>
                            {hasDisk ? (
                              <span>{diskPct}% ({(diskUsed / 1024).toFixed(1)} GB / {(diskLimit / 1024).toFixed(0)} GB)</span>
                            ) : (
                              <span className="text-[#858A82]">{language === 'en' ? 'No data' : 'Sin datos'}</span>
                            )}
                          </div>
                          {hasDisk && (
                            <div className="w-full bg-[#8A8F98] h-2 rounded-full overflow-hidden">
                              <div className="bg-[#B8F23A] h-full rounded-full" style={{ width: `${diskPct}%` }} />
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex justify-between font-semibold text-[#070707] mb-1">
                            <span className="flex items-center gap-1.5 text-[#555A52]">
                              <Cpu size={13} /> {t('client_bw_usage')}:
                            </span>
                            {hasBw ? (
                              <span>{bwPct}% ({bwUsed} GB / {bwLimit} GB)</span>
                            ) : (
                              <span className="text-[#858A82]">{language === 'en' ? 'No data' : 'Sin datos'}</span>
                            )}
                          </div>
                          {hasBw && (
                            <div className="w-full bg-[#8A8F98] h-2 rounded-full overflow-hidden">
                              <div className="bg-[#B8F23A] h-full rounded-full" style={{ width: `${bwPct}%` }} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => alert(`Conectando con Single Sign-On (SSO) seguro a cPanel de ${srv.name}...`)}
                          className="flex-1 py-2.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                        >
                          <ExternalLink size={14} />
                          <span>{t('client_login_cpanel')}</span>
                        </button>

                        <button
                          onClick={() => alert(`Accediendo al Webmail de ${srv.name}...`)}
                          className="px-4 py-2.5 bg-[#FFFFFF] hover:bg-[#F7F8F0] text-[#070707] border border-[#8A8F98] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          <span>{t('client_webmail')}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INVOICES & PAYMENTS */}
        {activeTab === 'INVOICES' && (
          <div className="space-y-4">
            <h3 className="font-black text-lg text-[#070707]">{t('client_invoices_title')}</h3>

            <div className="bg-[#FFFFFF] rounded-3xl border border-[#8A8F98] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FCFCF8] text-[#555A52] font-bold border-b border-[#8A8F98]">
                  <tr>
                    <th className="py-4 px-6">{t('client_inv_number')}</th>
                    <th className="py-4 px-6">{t('client_inv_date')}</th>
                    <th className="py-4 px-6">{t('client_inv_concept')}</th>
                    <th className="py-4 px-6">{t('client_inv_total')}</th>
                    <th className="py-4 px-6">{t('client_inv_status')}</th>
                    <th className="py-4 px-6 text-right">{t('client_inv_download')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8A8F98]">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#F7F8F0] transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-[#070707]">{ord.invoiceNumber}</td>
                      <td className="py-4 px-6 text-[#555A52]">{new Date(ord.date).toLocaleDateString()}</td>
                      <td className="py-4 px-6 font-medium text-[#070707]">
                        {ord.items.map((i) => i.description).join(', ')}
                      </td>
                      <td className="py-4 px-6 font-bold text-[#B8F23A]">
                        {formatMoney(ord.totalUSD, currency)}
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-[#B8F23A] text-[#070707] border border-[#B8F23A] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => generateInvoicePDF(ord)}
                          className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#F7F8F0] border border-[#8A8F98] text-[#070707] rounded-xl font-bold text-[11px] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Download size={13} className="text-[#B8F23A]" />
                          <span>{t('client_inv_pdf')}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && (
                <div className="bg-[#FFFFFF] p-10 text-center border-t border-[#8A8F98]">
                  <FileText size={32} className="text-[#858A82]/40 mx-auto mb-3" />
                  <p className="text-sm font-bold text-[#070707]">{t('client_no_invoices')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SUPPORT TICKETS */}
        {activeTab === 'SUPPORT' && (
          <div className="space-y-4">
            {/* Direct WhatsApp & Telephone Fast-Track Banner */}
            <div className="bg-[#070707] text-[#FCFCF8] rounded-3xl p-5 sm:p-6 border border-[#242424] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#25D366]/20 text-[#25D366] text-[11px] font-bold border border-[#25D366]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse"></span>
                  <span>{language === 'en' ? 'Direct SysAdmin Line 24/7' : 'Línea Directa de Ingeniería 24/7'}</span>
                </div>
                <h4 className="text-base font-black text-white">
                  {language === 'en' ? 'Need immediate assistance on your services?' : '¿Requieres atención inmediata en tus servicios?'}
                </h4>
                <p className="text-xs text-[#959A92]">
                  {language === 'en'
                    ? 'Chat live with an engineer via WhatsApp or call our 24/7 support line.'
                    : 'Habla directamente con un ingeniero por WhatsApp o llámanos a nuestra línea de soporte 24/7.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
                <a
                  href="https://wa.me/526601254107?text=Hola%20Soporte%20Banelio,%20necesito%20asistencia%20con%20mis%20servicios."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                  </svg>
                  <span>WhatsApp</span>
                </a>
                <a
                  href="tel:+526601254107"
                  className="px-4 py-2.5 bg-[#141414] hover:bg-[#202020] text-[#FCFCF8] hover:text-[#B8F23A] text-xs font-bold rounded-xl border border-[#353A32] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Smartphone size={14} className="text-[#B8F23A]" />
                  <span>Llamar</span>
                </a>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div>
                <h3 className="font-black text-lg text-[#070707]">{t('client_support_title')}</h3>
                <p className="text-xs text-[#555A52]">{t('client_support_sub')}</p>
              </div>
              <button
                onClick={() => setIsNewTicketOpen(true)}
                className="px-4 py-2.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                <span>{t('client_open_ticket')}</span>
              </button>
            </div>

            <div className="bg-[#FFFFFF] rounded-3xl border border-[#8A8F98] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FCFCF8] text-[#555A52] font-bold border-b border-[#8A8F98]">
                  <tr>
                    <th className="py-4 px-6">ID</th>
                    <th className="py-4 px-6">{t('client_ticket_subject')}</th>
                    <th className="py-4 px-6">{t('client_ticket_cat')}</th>
                    <th className="py-4 px-6">{t('client_ticket_priority')}</th>
                    <th className="py-4 px-6">{t('client_inv_status')}</th>
                    <th className="py-4 px-6 text-right">{t('client_ticket_view_chat')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8A8F98]">
                  {tickets.map((tk) => (
                    <tr key={tk.id} className="hover:bg-[#F7F8F0] transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-[#070707]">#{tk.id}</td>
                      <td className="py-4 px-6 font-bold text-[#070707]">{tk.subject}</td>
                      <td className="py-4 px-6 text-[#555A52]">{tk.category}</td>
                      <td className="py-4 px-6">
                        <span className={`font-bold ${tk.priority === 'High' || tk.priority === 'Critical' ? 'text-rose-600' : 'text-[#555A52]'}`}>
                          {tk.priority}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            tk.status === 'OPEN'
                              ? 'bg-[#B8F23A] text-[#B8F23A] border border-[#B8F23A]'
                              : tk.status === 'WAITING_CUSTOMER'
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                          }`}
                        >
                          {tk.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedTicket(tk)}
                          className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#F7F8F0] border border-[#8A8F98] text-[#070707] rounded-xl font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          {t('client_ticket_view_chat')} ({tk.messages.length})
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tickets.length === 0 && (
                <div className="bg-[#FFFFFF] p-10 text-center border-t border-[#8A8F98]">
                  <MessageSquare size={32} className="text-[#858A82]/40 mx-auto mb-3" />
                  <p className="text-sm font-bold text-[#070707]">{t('client_no_tickets')}</p>
                </div>
              )}
            </div>
          </div>
        )}
        {/* TAB 5: SECURITY & 2FA */}
        {activeTab === 'SECURITY' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg text-[#070707]">
                  {language === 'en' ? 'Account Security & Two-Factor Authentication' : 'Seguridad de la Cuenta y Autenticación en 2 Pasos'}
                </h3>
                <p className="text-xs text-[#555A52]">
                  {language === 'en'
                    ? 'Manage your 2FA credentials, email verification status, and registry security locks.'
                    : 'Administra tus credenciales 2FA, confirmación de correo electrónico y bloqueo de seguridad ICANN.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Email Verification */}
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
                    <div className="p-3 bg-[#F7F8F0] rounded-2xl border border-[#8A8F98] flex items-center gap-2 text-xs text-[#B8F23A]">
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

              {/* Card 2: Two-Factor Authentication (2FA) */}
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
                            ? 'Every login requires your password plus a 6-digit TOTP code generated on your authenticator device.'
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

            {/* Card 3: Active Session & Device Details */}
            <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#8A8F98] shadow-xs space-y-4">
              <h4 className="font-bold text-sm text-[#070707]">
                {language === 'en' ? 'Active Session & Security Log' : 'Sesión Activa y Registro de Seguridad'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-[#FCFCF8] p-3 rounded-2xl border border-[#8A8F98]">
                  <span className="text-[#555A52] text-[11px] block">Estado de Conexión</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    HTTPS TLS 1.3 / Encriptación 256-bit
                  </span>
                </div>
                <div className="bg-[#FCFCF8] p-3 rounded-2xl border border-[#8A8F98]">
                  <span className="text-[#555A52] text-[11px] block">Último Inicio de Sesión</span>
                  <span className="font-mono font-bold text-[#070707] block mt-0.5">
                    {customerUser?.lastLogin ? new Date(customerUser.lastLogin).toLocaleString() : 'Hoy (Sesión Actual)'}
                  </span>
                </div>
                <div className="bg-[#FCFCF8] p-3 rounded-2xl border border-[#8A8F98]">
                  <span className="text-[#555A52] text-[11px] block">Protección Anti-Hijacking</span>
                  <span className="font-bold text-[#B8F23A] block mt-0.5">
                    ICANN Registrar Lock Activo
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DNS MODAL */}
      <DnsManagerModal
        service={selectedDnsService}
        isOpen={!!selectedDnsService}
        onClose={() => setSelectedDnsService(null)}
      />

      {/* TICKET MODAL (VIEW / REPLY) */}
      <TicketModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />

      {/* NEW TICKET MODAL */}
      <TicketModal
        ticket={null}
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
      />

      {/* TWO FACTOR SETUP MODAL */}
      <TwoFactorModal
        isOpen={is2FaModalOpen}
        onClose={() => setIs2FaModalOpen(false)}
        mode="SETUP"
      />

      {/* EMAIL CONFIRMATION MODAL */}
      <EmailConfirmationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />

      {/* PROFILE COMPLETION MODAL */}
      <ProfileCompletionModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* DOMAIN TRANSFER MODAL */}
      <DomainTransferModal
        domain={transferModalDomain}
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />

      {/* REGISTRANT ICANN EDIT MODAL */}
      <RegistrantEditModal
        domain={registrantModalDomain}
        isOpen={Boolean(registrantModalDomain)}
        onClose={() => setRegistrantModalDomain(null)}
      />

      {/* EPP CODE MODAL */}
      {eppModalDomain && (
        <div className="fixed inset-0 z-50 bg-[#070707]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#8A8F98] text-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#070707] font-bold text-sm">
                <Key className="text-[#B8F23A]" size={18} />
                <span>{t('client_epp_modal_title')}</span>
              </div>
              <button onClick={() => setEppModalDomain(null)} className="text-[#555A52] hover:text-[#070707] font-bold cursor-pointer">
                ✕
              </button>
            </div>
            <p className="text-[#555A52]">
              {t('client_epp_modal_desc')} <b className="text-[#070707]">{eppModalDomain.name}</b>
            </p>
            <div className="bg-[#F7F8F0] p-3 rounded-xl border border-[#8A8F98] font-mono text-center font-black text-sm text-[#B8F23A] select-all">
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
