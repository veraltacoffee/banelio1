import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatMoneyExact } from '../../utils/pricing';
import { calculateCommercialDiscount, DEFAULT_DISCOUNT_CONFIG } from '../../services/pricingEngine';
import {
  ShoppingBag,
  X,
  Trash2,
  Tag,
  ArrowRight,
  Shield,
  Check,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Eye,
  EyeOff,
  User,
  Users,
  Building,
  Mail,
  Server,
  Database,
  Plus,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import AddonConfigModal, { AddonConfigModalProps } from './AddonConfigModal';

export default function CartModal() {
  const {
    cart,
    removeFromCart,
    updateCartItemPeriod,
    updateCartItemEppCode,
    updateCartItemRegistrant,
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
    setIsCheckoutOpen,
    currency,
    countryCode,
    domainRegistrantMode,
    setDomainRegistrantMode,
    sharedRegistrantContact,
    setSharedRegistrantContact,
    language,
    addToast
  } = useApp();

  const [inputCode, setInputCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [visibleEppCodes, setVisibleEppCodes] = useState<Record<string, boolean>>({});
  const [expandedRegistrantIds, setExpandedRegistrantIds] = useState<Record<string, boolean>>({});
  const [showSharedRegistrantForm, setShowSharedRegistrantForm] = useState<boolean>(false);
  const [transferErrors, setTransferErrors] = useState<Record<string, string>>({});

  // Addon popup state
  const [addonModalConfig, setAddonModalConfig] = useState<{
    isOpen: boolean;
    type: 'EMAIL' | 'HOSTING' | 'SSL' | 'BACKUP';
    domain: string;
  }>({
    isOpen: false,
    type: 'EMAIL',
    domain: 'tudominio.com'
  });

  if (!isCartOpen) return null;

  const domainItems = cart.filter((item) => item.type === 'DOMAIN');
  const transferItems = cart.filter((item) => item.type === 'DOMAIN' && item.addons?.isTransfer);
  const primaryDomainName = domainItems.length > 0 ? domainItems[0].name : 'tudominio.com';

  const toggleEppVisibility = (itemId: string) => {
    setVisibleEppCodes((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const toggleRegistrantExpand = (itemId: string) => {
    setExpandedRegistrantIds((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const res = applyPromoCode(inputCode);
    if (!res.success) {
      setPromoError(res.message);
    } else {
      setPromoError('');
      setInputCode('');
    }
  };

  const handleProceedToCheckout = () => {
    // Validate EPP codes for all transfer domains
    const errors: Record<string, string> = {};
    let hasError = false;

    transferItems.forEach((item) => {
      const code = item.addons?.eppCode?.trim();
      if (!code) {
        errors[item.id] = language === 'en'
          ? 'Transfer code (EPP / Auth Code) is mandatory.'
          : 'El código de autorización EPP es obligatorio para transferir este dominio.';
        hasError = true;
      }
    });

    if (hasError) {
      setTransferErrors(errors);
      addToast({
        type: 'error',
        title: language === 'en' ? 'Missing Transfer Code' : 'Código de Transferencia Requerido',
        message: language === 'en'
          ? 'Please enter the authorization code for all domains being transferred.'
          : 'Por favor ingresa la clave de autorización (código EPP) en los dominios para transferir.'
      });
      return;
    }

    setTransferErrors({});
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#070707]/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-lg bg-[#FFFFFF] shadow-2xl flex flex-col justify-between border-l border-[#8A8F98]">
          {/* Drawer Header */}
          <div className="p-6 bg-[#FCFCF8] text-[#070707] flex items-center justify-between border-b border-[#8A8F98]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#B8F23A] text-[#070707] border border-[#B8F23A] flex items-center justify-center">
                <ShoppingBag size={18} />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">
                  {language === 'en' ? 'Shopping Cart' : 'Carrito de Compras'}
                </h2>
                <p className="text-[11px] text-[#555A52]">
                  {language === 'en' ? 'Review your domains & hosting services' : 'Configura tus dominios y servicios'}
                </p>
              </div>
              <span className="ml-2 bg-[#B8F23A] text-[#070707] text-xs font-black px-2.5 py-0.5 rounded-full border border-[#B8F23A]">
                {cart.length}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-xl text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Items Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 bg-[#F7F8F0] text-[#555A52] border border-[#8A8F98] rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag size={28} />
                </div>
                <h3 className="font-bold text-[#070707] text-base">
                  {language === 'en' ? 'Your cart is empty' : 'Tu carrito está vacío'}
                </h3>
                <p className="text-xs text-[#555A52] max-w-xs mx-auto">
                  {language === 'en'
                    ? 'Search for a new domain or enter a domain to transfer to Banelio.'
                    : 'Busca un nuevo dominio o ingresa un dominio para transferir a Banelio.'}
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-[#B8F23A] text-[#070707] font-black text-xs rounded-xl hover:bg-[#B8F23A] transition-all cursor-pointer shadow-xs"
                >
                  {language === 'en' ? 'Explore Domains' : 'Explorar Dominios'}
                </button>
              </div>
            ) : (
              <>
                {/* Header Actions */}
                <div className="flex justify-between items-center pb-2 border-b border-[#8A8F98] text-xs">
                  <span className="font-bold text-[#555A52]">
                    {language === 'en' ? `Selected Items (${cart.length})` : `Servicios en el Carrito (${cart.length})`}
                  </span>
                  <button
                    onClick={clearCart}
                    className="text-[#858A82] hover:text-[#070707] font-semibold cursor-pointer transition-colors"
                  >
                    {language === 'en' ? 'Clear Cart' : 'Vaciar Carrito'}
                  </button>
                </div>

                {/* DOMAIN REGISTRANT ASSIGNMENT MODE (Same vs Individual) */}
                {domainItems.length > 0 && (
                  <div className="p-4 bg-[#F8F9F3] rounded-2xl border border-[#8A8F98] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#070707] flex items-center gap-1.5">
                        <Users size={14} className="text-[#B8F23A]" />
                        <span>{language === 'en' ? 'Domain Registrant Assignment' : 'Titularidad de los Dominios'}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDomainRegistrantMode('SAME')}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          domainRegistrantMode === 'SAME'
                            ? 'bg-white border-[#B8F23A] ring-1 ring-[#B8F23A]/20 shadow-2xs'
                            : 'bg-[#F7F8F0] border-[#8A8F98] text-[#555A52] hover:text-[#070707]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-[#070707]">
                          <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${domainRegistrantMode === 'SAME' ? 'border-[#B8F23A]' : 'border-[#858A82]'}`}>
                            {domainRegistrantMode === 'SAME' && <div className="w-1.5 h-1.5 rounded-full bg-[#B8F23A]" />}
                          </div>
                          <span>{language === 'en' ? 'Same Registrant' : 'Mismo Titular'}</span>
                        </div>
                        <p className="text-[10px] text-[#555A52] mt-1 pl-4">
                          {language === 'en' ? 'Same person/company for all domains' : 'Misma persona o empresa para todos'}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDomainRegistrantMode('INDIVIDUAL')}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          domainRegistrantMode === 'INDIVIDUAL'
                            ? 'bg-white border-[#B8F23A] ring-1 ring-[#B8F23A]/20 shadow-2xs'
                            : 'bg-[#F7F8F0] border-[#8A8F98] text-[#555A52] hover:text-[#070707]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-[#070707]">
                          <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${domainRegistrantMode === 'INDIVIDUAL' ? 'border-[#B8F23A]' : 'border-[#858A82]'}`}>
                            {domainRegistrantMode === 'INDIVIDUAL' && <div className="w-1.5 h-1.5 rounded-full bg-[#B8F23A]" />}
                          </div>
                          <span>{language === 'en' ? 'Individual' : 'Titular Diferente'}</span>
                        </div>
                        <p className="text-[10px] text-[#555A52] mt-1 pl-4">
                          {language === 'en' ? 'Assign a different owner per domain' : 'Personalizar titular por cada dominio'}
                        </p>
                      </button>
                    </div>

                    {/* Quick preview of shared registrant when in SAME mode */}
                    {domainRegistrantMode === 'SAME' && (
                      <div className="pt-2 border-t border-[#8A8F98]/80">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] text-[#555A52]">
                            Titular actual: <strong className="text-[#070707]">{sharedRegistrantContact.name}</strong> ({sharedRegistrantContact.company || 'Particular'})
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowSharedRegistrantForm(!showSharedRegistrantForm)}
                            className="text-[11px] font-bold text-[#B8F23A] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>{showSharedRegistrantForm ? 'Ocultar' : 'Editar Datos'}</span>
                            {showSharedRegistrantForm ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </div>

                        {showSharedRegistrantForm && (
                          <div className="mt-3 p-3 bg-white rounded-xl border border-[#8A8F98] space-y-2.5 animate-in fade-in">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-bold text-[#555A52] block">Nombre Completo</label>
                                <input
                                  type="text"
                                  value={sharedRegistrantContact.name}
                                  onChange={(e) =>
                                    setSharedRegistrantContact((prev) => ({ ...prev, name: e.target.value }))
                                  }
                                  placeholder="Nombre completo"
                                  className="w-full px-2.5 py-1.5 bg-[#FCFCF8] border border-[#8A8F98] rounded-lg text-xs font-semibold text-[#070707] outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-[#555A52] block">Empresa / Razón Social</label>
                                <input
                                  type="text"
                                  value={sharedRegistrantContact.company || ''}
                                  onChange={(e) =>
                                    setSharedRegistrantContact((prev) => ({ ...prev, company: e.target.value }))
                                  }
                                  placeholder="Ej: Acme Corp S.A."
                                  className="w-full px-2.5 py-1.5 bg-[#FCFCF8] border border-[#8A8F98] rounded-lg text-xs font-semibold text-[#070707] outline-none"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-bold text-[#555A52] block">Correo de Titular</label>
                                <input
                                  type="email"
                                  value={sharedRegistrantContact.email}
                                  onChange={(e) =>
                                    setSharedRegistrantContact((prev) => ({ ...prev, email: e.target.value }))
                                  }
                                  placeholder="correo@empresa.com"
                                  className="w-full px-2.5 py-1.5 bg-[#FCFCF8] border border-[#8A8F98] rounded-lg text-xs font-semibold text-[#070707] outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-[#555A52] block">Teléfono de Contacto</label>
                                <input
                                  type="tel"
                                  value={sharedRegistrantContact.phone || ''}
                                  onChange={(e) =>
                                    setSharedRegistrantContact((prev) => ({ ...prev, phone: e.target.value }))
                                  }
                                  placeholder="Número de teléfono de contacto"
                                  className="w-full px-2.5 py-1.5 bg-[#FCFCF8] border border-[#8A8F98] rounded-lg text-xs font-semibold text-[#070707] outline-none"
                                />
                              </div>
                            </div>
                            <p className="text-[10px] text-[#555A52] flex items-center gap-1">
                              <Info size={11} className="text-[#B8F23A]" /> Estos datos se aplicarán a todos los dominios adquiridos.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* CART ITEMS LIST */}
                <div className="space-y-4">
                  {cart.map((item) => {
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
                    const eppCode = item.addons?.eppCode || '';
                    const isEppVisible = visibleEppCodes[item.id] || false;
                    const isRegistrantExpanded = expandedRegistrantIds[item.id] || false;
                    const hasError = Boolean(transferErrors[item.id]);

                    return (
                      <div
                        key={item.id}
                        className={`bg-[#FCFCF8] p-4 sm:p-5 rounded-2xl border transition-all shadow-xs space-y-3.5 ${
                          hasError ? 'border-red-400 ring-2 ring-red-200' : 'border-[#8A8F98]'
                        }`}
                      >
                        {/* Item Card Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-black uppercase tracking-wider text-[#070707] bg-[#B8F23A] px-2.5 py-0.5 rounded-full border border-[#B8F23A]">
                                {item.type}
                              </span>

                              {isTransfer ? (
                                <span className="text-[10px] font-black uppercase tracking-wider bg-[#B8F23A] text-[#070707] px-2.5 py-0.5 rounded-full border border-[#B8F23A] flex items-center gap-1 shadow-2xs">
                                  <RefreshCw size={10} />
                                  <span>Transferencia a Banelio</span>
                                </span>
                              ) : item.type === 'DOMAIN' ? (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F7F8F0] text-[#555A52] px-2 py-0.5 rounded border border-[#8A8F98]">
                                  Registro Nuevo
                                </span>
                              ) : null}
                            </div>

                            <h4 className="font-black text-base text-[#070707] mt-1.5">{item.name}</h4>
                            <span className="text-xs text-[#555A52] block mt-0.5">
                              Costo base: {formatMoneyExact(item.basePriceUSD, currency)} / {item.periodUnit === 'year' ? 'año' : 'mes'}
                            </span>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-[#858A82] hover:text-red-600 p-1.5 rounded-lg hover:bg-[#F7F8F0] transition-colors cursor-pointer"
                            title="Eliminar del pedido"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* TRANSFER CODE / EPP CODE MANDATORY INPUT FOR TRANSFER DOMAINS */}
                        {isTransfer && (
                          <div className="p-3.5 bg-white border border-[#8A8F98] rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-black text-[#070707] flex items-center gap-1.5">
                                <KeyRound size={14} className="text-[#B8F23A]" />
                                <span>Código de Transferencia / Clave EPP</span>
                                <span className="text-red-500 font-bold">*</span>
                              </label>
                              <span className="text-[10px] font-black uppercase text-[#070707] bg-[#B8F23A] px-2 py-0.5 rounded-md">
                                Obligatorio
                              </span>
                            </div>

                            <div className="relative">
                              <input
                                type={isEppVisible ? 'text' : 'password'}
                                value={eppCode}
                                onChange={(e) => {
                                  updateCartItemEppCode(item.id, e.target.value);
                                  if (transferErrors[item.id]) {
                                    setTransferErrors((prev) => {
                                      const next = { ...prev };
                                      delete next[item.id];
                                      return next;
                                    });
                                  }
                                }}
                                placeholder="Ej: epP-8849-XK39!m"
                                className={`w-full pl-3 pr-10 py-2 bg-[#FCFCF8] border rounded-xl text-xs font-mono font-bold text-[#070707] outline-none transition-all ${
                                  hasError
                                    ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                                    : 'border-[#8A8F98] focus:border-[#B8F23A]'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => toggleEppVisibility(item.id)}
                                className="absolute right-3 top-2.5 text-[#858A82] hover:text-[#070707] cursor-pointer"
                                title={isEppVisible ? 'Ocultar código' : 'Mostrar código'}
                              >
                                {isEppVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>

                            {hasError ? (
                              <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                                <AlertCircle size={12} /> {transferErrors[item.id]}
                              </p>
                            ) : (
                              <p className="text-[10px] text-[#555A52]">
                                Solicita o copia la clave de autorización (Auth/EPP Code) desde tu registrador actual antes de transferir.
                              </p>
                            )}
                          </div>
                        )}

                        {/* INDIVIDUAL REGISTRANT EDIT FOR THIS DOMAIN (When INDIVIDUAL mode is selected) */}
                        {item.type === 'DOMAIN' && domainRegistrantMode === 'INDIVIDUAL' && (
                          <div className="p-3 bg-white border border-[#8A8F98] rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#070707] flex items-center gap-1.5">
                                <User size={13} className="text-[#B8F23A]" />
                                <span>Titular para {item.name}:</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRegistrantExpand(item.id)}
                                className="text-[11px] font-bold text-[#B8F23A] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>{isRegistrantExpanded ? 'Cerrar' : 'Personalizar'}</span>
                                {isRegistrantExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </button>
                            </div>

                            <p className="text-[11px] text-[#555A52]">
                              Titular actual:{' '}
                              <strong>
                                {item.addons?.registrantContact?.name || sharedRegistrantContact.name}
                              </strong>{' '}
                              ({item.addons?.registrantContact?.company || sharedRegistrantContact.company || 'Particular'})
                            </p>

                            {isRegistrantExpanded && (
                              <div className="pt-2 border-t border-[#8A8F98] space-y-2 animate-in fade-in">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-semibold text-[#555A52] block">Nombre del Titular</label>
                                    <input
                                      type="text"
                                      value={item.addons?.registrantContact?.name ?? sharedRegistrantContact.name}
                                      onChange={(e) =>
                                        updateCartItemRegistrant(item.id, {
                                          ...(item.addons?.registrantContact || sharedRegistrantContact),
                                          name: e.target.value
                                        })
                                      }
                                      placeholder="Nombre completo"
                                      className="w-full px-2.5 py-1.5 bg-[#FCFCF8] border border-[#8A8F98] rounded-lg text-xs font-semibold text-[#070707] outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-semibold text-[#555A52] block">Empresa / Razón Social</label>
                                    <input
                                      type="text"
                                      value={item.addons?.registrantContact?.company ?? sharedRegistrantContact.company ?? ''}
                                      onChange={(e) =>
                                        updateCartItemRegistrant(item.id, {
                                          ...(item.addons?.registrantContact || sharedRegistrantContact),
                                          company: e.target.value
                                        })
                                      }
                                      placeholder="Empresa (opcional)"
                                      className="w-full px-2.5 py-1.5 bg-[#FCFCF8] border border-[#8A8F98] rounded-lg text-xs font-semibold text-[#070707] outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-semibold text-[#555A52] block">Correo Electrónico</label>
                                    <input
                                      type="email"
                                      value={item.addons?.registrantContact?.email ?? sharedRegistrantContact.email}
                                      onChange={(e) =>
                                        updateCartItemRegistrant(item.id, {
                                          ...(item.addons?.registrantContact || sharedRegistrantContact),
                                          email: e.target.value
                                        })
                                      }
                                      placeholder="correo@dominio.com"
                                      className="w-full px-2.5 py-1.5 bg-[#FCFCF8] border border-[#8A8F98] rounded-lg text-xs font-semibold text-[#070707] outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-semibold text-[#555A52] block">Teléfono</label>
                                    <input
                                      type="tel"
                                      value={item.addons?.registrantContact?.phone ?? sharedRegistrantContact.phone ?? ''}
                                      onChange={(e) =>
                                        updateCartItemRegistrant(item.id, {
                                          ...(item.addons?.registrantContact || sharedRegistrantContact),
                                          phone: e.target.value
                                        })
                                      }
                                      placeholder="Número de teléfono de contacto"
                                      className="w-full px-2.5 py-1.5 bg-[#FCFCF8] border border-[#8A8F98] rounded-lg text-xs font-semibold text-[#070707] outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Period selector & Total */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#8A8F98] text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-[#555A52] font-medium">Periodo:</span>
                            {isTransfer ? (
                              <span className="bg-white border border-[#8A8F98] rounded-lg px-2.5 py-1 font-bold text-[#070707] text-xs">
                                1 Año (Transferencia + Renovación ICANN)
                              </span>
                            ) : (
                              <select
                                value={item.periodYearsOrMonths}
                                onChange={(e) => updateCartItemPeriod(item.id, parseInt(e.target.value))}
                                className="bg-[#FFFFFF] border border-[#8A8F98] rounded-lg px-2.5 py-1 font-bold text-[#070707] text-xs outline-none"
                              >
                                <option value={1}>1 {item.periodUnit === 'year' ? 'Año' : 'Mes'}</option>
                                <option value={2}>2 {item.periodUnit === 'year' ? 'Años' : 'Meses'}</option>
                                <option value={3}>3 {item.periodUnit === 'year' ? 'Años' : 'Meses'}</option>
                                <option value={5}>5 {item.periodUnit === 'year' ? 'Años' : 'Meses'}</option>
                              </select>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="font-extrabold text-sm text-[#B8F23A]">
                              {formatMoneyExact(itemTotal, currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ADD-ONS CROSS-SELL POPUP SECTION BEFORE CHECKOUT */}
                <div className="p-4 bg-gradient-to-br from-[#F8F9F3] to-[#F7F8F0] rounded-2xl border border-[#8A8F98] space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-[#B8F23A]" />
                      <h4 className="font-black text-xs uppercase tracking-wider text-[#070707]">
                        {language === 'en' ? 'Power up your domain before checkout' : 'Potencia tu Dominio con Complementos'}
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold text-[#070707] bg-[#B8F23A] px-2 py-0.5 rounded-full border border-[#B8F23A]">
                      1-Clic
                    </span>
                  </div>

                  <p className="text-[11px] text-[#555A52]">
                    Agrega correo corporativo, hosting NVMe o certificados SSL vinculados a tu dominio con un solo clic.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {/* Addon 1: Email */}
                    <button
                      type="button"
                      onClick={() =>
                        setAddonModalConfig({
                          isOpen: true,
                          type: 'EMAIL',
                          domain: primaryDomainName
                        })
                      }
                      className="p-2.5 bg-white hover:bg-[#F8F9F3] border border-[#8A8F98] hover:border-[#B8F23A] rounded-xl text-left transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Mail size={16} className="text-[#B8F23A]" />
                        <Plus size={12} className="text-[#858A82] group-hover:text-[#070707]" />
                      </div>
                      <span className="font-black text-xs text-[#070707] block leading-tight">Correo Pro</span>
                      <span className="text-[10px] text-[#555A52]">{formatMoney(1.99, currency)}/m</span>
                    </button>

                    {/* Addon 2: Hosting NVMe */}
                    <button
                      type="button"
                      onClick={() =>
                        setAddonModalConfig({
                          isOpen: true,
                          type: 'HOSTING',
                          domain: primaryDomainName
                        })
                      }
                      className="p-2.5 bg-white hover:bg-[#F8F9F3] border border-[#8A8F98] hover:border-[#B8F23A] rounded-xl text-left transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Server size={16} className="text-[#B8F23A]" />
                        <Plus size={12} className="text-[#858A82] group-hover:text-[#070707]" />
                      </div>
                      <span className="font-black text-xs text-[#070707] block leading-tight">Hosting NVMe</span>
                      <span className="text-[10px] text-[#555A52]">{formatMoney(3.99, currency)}/m</span>
                    </button>

                    {/* Addon 3: SSL Wildcard */}
                    <button
                      type="button"
                      onClick={() =>
                        setAddonModalConfig({
                          isOpen: true,
                          type: 'SSL',
                          domain: primaryDomainName
                        })
                      }
                      className="p-2.5 bg-white hover:bg-[#F8F9F3] border border-[#8A8F98] hover:border-[#B8F23A] rounded-xl text-left transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Shield size={16} className="text-[#B8F23A]" />
                        <Plus size={12} className="text-[#858A82] group-hover:text-[#070707]" />
                      </div>
                      <span className="font-black text-xs text-[#070707] block leading-tight">SSL Wildcard</span>
                      <span className="text-[10px] text-[#555A52]">{formatMoney(9.99, currency)}/a</span>
                    </button>

                    {/* Addon 4: Backup Cloud */}
                    <button
                      type="button"
                      onClick={() =>
                        setAddonModalConfig({
                          isOpen: true,
                          type: 'BACKUP',
                          domain: primaryDomainName
                        })
                      }
                      className="p-2.5 bg-white hover:bg-[#F8F9F3] border border-[#8A8F98] hover:border-[#B8F23A] rounded-xl text-left transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Database size={16} className="text-[#B8F23A]" />
                        <Plus size={12} className="text-[#858A82] group-hover:text-[#070707]" />
                      </div>
                      <span className="font-black text-xs text-[#070707] block leading-tight">Cloud Backup</span>
                      <span className="text-[10px] text-[#555A52]">{formatMoney(1.49, currency)}/m</span>
                    </button>
                  </div>
                </div>

                {/* Promo Code Input */}
                <div className="pt-1">
                  {promoCode ? (
                    <div className="bg-[#B8F23A] border border-[#B8F23A] p-3 rounded-xl flex items-center justify-between text-xs text-[#070707]">
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-[#B8F23A] shrink-0" />
                        <span>Cupón <b>{promoCode}</b> activado (-{(promoDiscountUSD * 100).toFixed(0)}%)</span>
                      </div>
                      <button onClick={removePromoCode} className="text-[#555A52] hover:text-[#070707] font-bold underline cursor-pointer">
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyPromo} className="space-y-1">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3 top-3 text-[#858A82]" size={14} />
                          <input
                            type="text"
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value)}
                            placeholder="Cupón (ej: WELCOME20, PARTNER30)"
                            className="w-full pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#8A8F98] rounded-xl text-xs uppercase font-semibold text-[#070707] outline-none focus:border-[#B8F23A]"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl text-xs font-black transition-colors cursor-pointer shadow-xs"
                        >
                          Aplicar
                        </button>
                      </div>
                      {promoError && (
                        <p className="text-[11px] text-[#B8F23A] font-medium flex items-center gap-1">
                          <AlertCircle size={12} /> {promoError}
                        </p>
                      )}
                    </form>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Drawer Footer / Checkout CTA */}
          {cart.length > 0 && (
            <div className="p-6 bg-[#FCFCF8] border-t border-[#8A8F98] space-y-4">
              <div className="space-y-1.5 text-xs text-[#555A52]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-[#070707]">{formatMoneyExact(cartSubtotalUSD, currency)}</span>
                </div>

                {promoDiscountUSD > 0 && (
                  <div className="flex justify-between text-[#B8F23A] font-medium">
                    <span>Descuento Cupón:</span>
                    <span>-{formatMoneyExact(cartSubtotalUSD * promoDiscountUSD, currency)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Impuestos / Tax ({countryCode}):</span>
                  <span className="font-semibold text-[#070707]">{formatMoneyExact(cartTaxUSD, currency)}</span>
                </div>

                <div className="flex justify-between text-base font-black text-[#070707] pt-2 border-t border-[#8A8F98]">
                  <span>Total a Pagar:</span>
                  <span className="text-[#B8F23A]">{formatMoneyExact(cartTotalUSD, currency)}</span>
                </div>
              </div>

              <button
                id="cart-proceed-checkout-btn"
                onClick={handleProceedToCheckout}
                className="w-full py-4 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:scale-[1.01] active:scale-95"
              >
                <span>Proceder al Pago Seguro</span>
                <ArrowRight size={16} />
              </button>

              <div className="flex items-center justify-center gap-3 text-[10px] text-[#555A52] font-semibold">
                <span className="flex items-center gap-1">
                  <Shield size={11} className="text-[#B8F23A]" /> Cifrado SSL 256-bit
                </span>
                <span>&bull;</span>
                <span>Stripe & PayPal Verified</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADDON CONFIGURATION POPUP MODAL */}
      <AddonConfigModal
        isOpen={addonModalConfig.isOpen}
        onClose={() => setAddonModalConfig((prev) => ({ ...prev, isOpen: false }))}
        addonType={addonModalConfig.type}
        associatedDomain={addonModalConfig.domain}
      />
    </div>
  );
}
