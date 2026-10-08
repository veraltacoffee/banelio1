import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  KeyRound,
  User,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowRight,
  ArrowLeft,
  Info,
  Eye,
  EyeOff,
  RefreshCw,
  ShoppingCart
} from 'lucide-react';
import {
  TransferCustomerData,
  checkDomainTransferEligibility,
  sanitizeDomainInput
} from '../../services/domainService';
import { formatMoney } from '../../utils/pricing';

interface DomainTransferModalProps {
  domain: string;
  isOpen: boolean;
  onClose: () => void;
  priceUSD?: number;
}

type TransferStep = 1 | 2 | 3 | 4;

export default function DomainTransferModal({
  domain,
  isOpen,
  onClose,
  priceUSD = 0
}: DomainTransferModalProps) {
  const {
    customerUser,
    currency,
    language,
    addToCart,
    setIsCartOpen,
    setSharedRegistrantContact,
    addToast
  } = useApp();

  const [step, setStep] = useState<TransferStep>(1);
  const [cleanDomain, setCleanDomain] = useState<string>('');

  // Eligibility check state
  const [isCheckingEligibility, setIsCheckingEligibility] = useState<boolean>(false);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [eligibilityStatus, setEligibilityStatus] = useState<string>('');
  const [eligibilityMessage, setEligibilityMessage] = useState<string>('');

  // Step 2: Customer Contact Information
  const [customerData, setCustomerData] = useState<TransferCustomerData>({
    first_name: '',
    last_name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: ''
  });

  // Step 3: Auth/EPP Code (Stored ONLY in React state memory, never in localStorage/sessionStorage/URL/console)
  const [authCode, setAuthCode] = useState<string>('');
  const [showAuthCode, setShowAuthCode] = useState<boolean>(false);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [resolvedPrice, setResolvedPrice] = useState<number>(priceUSD || 12.99);

  // Initialize on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setAuthCode('');
      setShowAuthCode(false);
      setValidationErrors({});
      setIsEligible(null);
      setEligibilityStatus('');
      setEligibilityMessage('');

      const sanitized = sanitizeDomainInput(domain);
      const targetDomain = sanitized.valid ? sanitized.cleanDomain : domain.trim().toLowerCase();
      setCleanDomain(targetDomain);

      if (priceUSD > 0) {
        setResolvedPrice(priceUSD);
      }

      if (customerUser) {
        const parts = (customerUser.name || '').trim().split(' ');
        setCustomerData({
          first_name: parts[0] || '',
          last_name: parts.slice(1).join(' ') || '',
          company: customerUser.company || '',
          email: customerUser.email || '',
          phone: customerUser.phone || '',
          address: customerUser.address || '',
          city: customerUser.city || '',
          state: customerUser.state || '',
          country: customerUser.country || 'Mexico',
          postal_code: customerUser.postalCode || ''
        });
      }

      // Check transfer eligibility upon modal open
      if (targetDomain) {
        setIsCheckingEligibility(true);
        checkDomainTransferEligibility(targetDomain, priceUSD)
          .then((result) => {
            setIsEligible(result.canTransfer);
            setEligibilityStatus(result.status);
            setEligibilityMessage(result.message);
            if (result.priceUSD && result.priceUSD > 0) {
              setResolvedPrice(result.priceUSD);
            }
          })
          .catch(() => {
            setIsEligible(false);
            setEligibilityStatus('error');
            setEligibilityMessage('No fue posible contactar con el registry para verificar transferibilidad.');
          })
          .finally(() => {
            setIsCheckingEligibility(false);
          });
      }
    }
  }, [isOpen, domain, customerUser, priceUSD]);

  if (!isOpen) return null;

  const validateCustomerData = (): boolean => {
    const errors: Record<string, string> = {};
    if (!customerData.first_name.trim()) {
      errors.first_name = language === 'en' ? 'First name is required' : 'El nombre es obligatorio';
    }
    if (!customerData.last_name.trim()) {
      errors.last_name = language === 'en' ? 'Last name is required' : 'El apellido es obligatorio';
    }
    if (!customerData.email.trim()) {
      errors.email = language === 'en' ? 'Email is required' : 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
      errors.email = language === 'en' ? 'Invalid email format' : 'Formato de correo inválido';
    }
    if (!customerData.phone.trim()) {
      errors.phone = language === 'en' ? 'Phone number is required' : 'El teléfono es obligatorio';
    }
    if (!customerData.address.trim()) {
      errors.address = language === 'en' ? 'Street address is required' : 'La dirección es obligatoria';
    }
    if (!customerData.city.trim()) {
      errors.city = language === 'en' ? 'City is required' : 'La ciudad es obligatoria';
    }
    if (!customerData.state.trim()) {
      errors.state = language === 'en' ? 'State / Province is required' : 'El estado o provincia es obligatorio';
    }
    if (!customerData.postal_code.trim()) {
      errors.postal_code = language === 'en' ? 'Postal code is required' : 'El código postal es obligatorio';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAuthCode = (): boolean => {
    const code = authCode.trim();
    if (!code) {
      setValidationErrors({
        auth_code: language === 'en'
          ? 'Auth/EPP Code is required to proceed with transfer'
          : 'El código Auth/EPP es obligatorio para transferir el dominio'
      });
      return false;
    }
    if (code.length < 6 || code.length > 32) {
      setValidationErrors({
        auth_code: language === 'en'
          ? 'Auth/EPP Code must be between 6 and 32 characters long'
          : 'El código Auth/EPP debe tener entre 6 y 32 caracteres'
      });
      return false;
    }
    setValidationErrors({});
    return true;
  };

  const handleAddToCart = () => {
    if (!validateAuthCode()) {
      setStep(3);
      return;
    }

    const registrant = {
      name: `${customerData.first_name} ${customerData.last_name}`.trim(),
      company: customerData.company ? `${customerData.company} (${cleanDomain})` : cleanDomain,
      email: customerData.email,
      phone: customerData.phone,
      address: customerData.address,
      city: customerData.city,
      state: customerData.state,
      country: customerData.country,
      postalCode: customerData.postal_code
    };

    // Keep shared registrant contact synchronized in AppContext
    setSharedRegistrantContact(registrant);

    // Add DOMAIN_TRANSFER product to commercial cart
    addToCart({
      type: 'DOMAIN',
      name: cleanDomain,
      sku: 'DOMAIN_TRANSFER',
      quantity: 1,
      periodYearsOrMonths: 1,
      periodUnit: 'year',
      basePriceUSD: resolvedPrice,
      addons: {
        whoisPrivacy: false,
        backup: false,
        dedicatedIp: false,
        isTransfer: true,
        eppCode: authCode.trim(),
        registrantContact: registrant
      }
    });

    addToast({
      type: 'success',
      title: language === 'en' ? 'Transfer added to Cart' : 'Transferencia añadida al carrito',
      message: language === 'en'
        ? `Domain ${cleanDomain} added to checkout cart.`
        : `El dominio ${cleanDomain} fue añadido al carrito comercial con código Auth/EPP validado.`
    });

    onClose();
    setIsCartOpen(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="relative bg-white text-[#070707] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-2 border-[#8A8F98] overflow-hidden my-6">
        {/* Close Button */}
        <button
          id="close-transfer-modal-btn"
          onClick={onClose}
          aria-label={language === 'en' ? 'Close modal' : 'Cerrar modal'}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0] transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#B8F23A] border border-[#B8F23A] text-[#070707] rounded-full text-xs font-black mb-2">
            <RefreshCw size={13} />
            <span>{language === 'en' ? 'Domain Transfer' : 'Transferencia de Dominio'}</span>
          </div>
          <h2 id="transfer-modal-title" className="text-2xl sm:text-3xl font-black text-[#070707] tracking-tight">
            {language === 'en' ? 'Transfer your Domain to Banelio' : 'Transfiere tu Dominio a Banelio'}
          </h2>
          <p className="text-xs text-[#555A52] mt-1 font-medium">
            {language === 'en'
              ? 'Consolidate your digital assets under NVMe high-performance infrastructure with 1 year renewal included.'
              : 'Consolida tus activos web en la infraestructura de Banelio con 1 año de renovación incluido.'}
          </p>
        </div>

        {/* Progress Step Indicator */}
        <div className="grid grid-cols-4 gap-1.5 mb-8">
          {[
            { num: 1, label: language === 'en' ? 'Domain' : 'Dominio' },
            { num: 2, label: language === 'en' ? 'Client' : 'Titular' },
            { num: 3, label: language === 'en' ? 'Auth Code' : 'Auth/EPP' },
            { num: 4, label: language === 'en' ? 'Review & Cart' : 'Carrito' }
          ].map((s) => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div key={s.num} className="text-center">
                <div
                  className={`h-2 rounded-full mb-1 transition-all ${
                    isDone
                      ? 'bg-[#B8F23A]'
                      : isActive
                      ? 'bg-[#B8F23A]'
                      : 'bg-[#8A8F98]'
                  }`}
                />
                <span
                  className={`text-[10px] font-bold block truncate ${
                    isActive ? 'text-[#070707]' : 'text-[#858A82]'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* PASO 1: VERIFICACIÓN DEL DOMINIO */}
        {/* ============================================================ */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-5 bg-[#F7F8F0] border border-[#8A8F98] rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-[#555A52] font-semibold uppercase tracking-wider block">
                    {language === 'en' ? 'Domain to Transfer' : 'Dominio a Transferir'}
                  </span>
                  <span className="text-2xl font-black text-[#070707] font-mono tracking-tight">{cleanDomain}</span>
                </div>
                <div className="text-right sm:text-right">
                  <span className="text-xs text-[#555A52] font-semibold block">
                    {language === 'en' ? 'Transfer + 1 Year Renewal' : 'Transferencia + 1 Año Renovación'}
                  </span>
                  <span className="text-2xl font-black text-[#070707]">{formatMoney(resolvedPrice, currency)}</span>
                </div>
              </div>

              {/* Status indicator */}
              <div className="mt-4 pt-4 border-t border-[#8A8F98]">
                {isCheckingEligibility ? (
                  <div className="flex items-center gap-2 text-xs text-[#555A52] font-medium">
                    <RefreshCw size={15} className="animate-spin text-[#B8F23A]" />
                    <span>Verificando elegibilidad con el Registry...</span>
                  </div>
                ) : isEligible === false && eligibilityStatus === 'available' ? (
                  <div className="flex items-start gap-2.5 text-xs text-amber-700 font-bold bg-amber-50 p-3 rounded-xl border border-amber-200">
                    <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-amber-800">Dominio Disponible para Registro Nuevo</p>
                      <p className="font-normal text-amber-700 mt-0.5">
                        Este dominio no está registrado actualmente. Puedes registrarlo como dominio nuevo directamente sin necesidad de transferencia.
                      </p>
                    </div>
                  </div>
                ) : isEligible === false && eligibilityStatus === 'regthroughus' ? (
                  <div className="flex items-start gap-2.5 text-xs text-blue-700 font-bold bg-blue-50 p-3 rounded-xl border border-blue-200">
                    <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-blue-800">Dominio ya gestionado en Banelio</p>
                      <p className="font-normal text-blue-700 mt-0.5">
                        Este dominio ya se encuentra registrado y activo dentro de la plataforma Banelio. Puedes gestionarlo desde tu panel de cliente.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 text-xs text-[#070707] font-bold">
                    <CheckCircle2 size={16} className="text-[#B8F23A] shrink-0" />
                    <span>
                      {eligibilityMessage ||
                        (language === 'en'
                          ? 'Status: Registered externally (Eligible for transfer)'
                          : 'Estado: Registrado con otro proveedor (Elegible para transferencia)')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-white border border-[#8A8F98] rounded-2xl space-y-2 text-xs text-[#555A52]">
              <div className="font-bold text-[#070707] flex items-center gap-1.5">
                <Info size={14} className="text-[#B8F23A]" />
                <span>{language === 'en' ? 'Requirements before transferring:' : 'Requisitos antes de iniciar:'}</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[#555A52] pl-1 font-medium">
                <li>{language === 'en' ? 'The domain must be unlocked at your current registrar.' : 'El dominio debe estar desbloqueado en tu registrador actual (Transfer Lock desactivado).'}</li>
                <li>{language === 'en' ? 'Have been registered or transferred for more than 60 days.' : 'Tener más de 60 días de antigüedad de registro o transferencia previa.'}</li>
                <li>{language === 'en' ? 'Possess the valid Auth/EPP Code from current provider.' : 'Contar con el código Auth/EPP generado por tu proveedor actual.'}</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-[#8A8F98] text-xs font-bold text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0] cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'Cancelar'}
              </button>
              {isEligible !== false ? (
                <button
                  type="button"
                  id="transfer-step1-continue-btn"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                >
                  <span>{language === 'en' ? 'Continue with Client Info' : 'Continuar con Datos de Titular'}</span>
                  <ArrowRight size={15} />
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PASO 2: INFORMACIÓN DEL CLIENTE / TITULAR */}
        {/* ============================================================ */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-[#F7F8F0] p-4 rounded-2xl border border-[#8A8F98] mb-2">
              <h3 className="font-black text-sm text-[#070707] flex items-center gap-2">
                <User size={15} className="text-[#B8F23A]" />
                <span>{language === 'en' ? 'Domain Contact & Registrant Details' : 'Datos del Titular y Contacto'}</span>
              </h3>
              <p className="text-xs text-[#555A52] mt-0.5 font-medium">
                {language === 'en'
                  ? 'Official contact details assigned to the domain WHOIS record.'
                  : 'Información oficial requerida para el registro del contacto ante el Registry.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#555A52] mb-1">
                  {language === 'en' ? 'First Name' : 'Nombre'} *
                </label>
                <input
                  type="text"
                  value={customerData.first_name}
                  onChange={(e) => setCustomerData({ ...customerData, first_name: e.target.value })}
                  placeholder="Nombre"
                  className={`w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border ${
                    validationErrors.first_name ? 'border-red-400 bg-red-50/30' : 'border-[#8A8F98]'
                  } focus:border-[#B8F23A] outline-none`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#555A52] mb-1">
                  {language === 'en' ? 'Last Name' : 'Apellido(s)'} *
                </label>
                <input
                  type="text"
                  value={customerData.last_name}
                  onChange={(e) => setCustomerData({ ...customerData, last_name: e.target.value })}
                  placeholder="Apellido(s)"
                  className={`w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border ${
                    validationErrors.last_name ? 'border-red-400 bg-red-50/30' : 'border-[#8A8F98]'
                  } focus:border-[#B8F23A] outline-none`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#555A52] mb-1">
                  {language === 'en' ? 'Company (Optional)' : 'Empresa / Organización (Opcional)'}
                </label>
                <input
                  type="text"
                  value={customerData.company}
                  onChange={(e) => setCustomerData({ ...customerData, company: e.target.value })}
                  placeholder="Empresa (opcional)"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-[#8A8F98] focus:border-[#B8F23A] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#555A52] mb-1">
                  {language === 'en' ? 'Email Address' : 'Correo Electrónico'} *
                </label>
                <input
                  type="email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  className={`w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border ${
                    validationErrors.email ? 'border-red-400 bg-red-50/30' : 'border-[#8A8F98]'
                  } focus:border-[#B8F23A] outline-none`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#555A52] mb-1">
                  {language === 'en' ? 'Phone Number' : 'Teléfono'} *
                </label>
                <input
                  type="tel"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                  placeholder="Número de teléfono de contacto"
                  className={`w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border ${
                    validationErrors.phone ? 'border-red-400 bg-red-50/30' : 'border-[#8A8F98]'
                  } focus:border-[#B8F23A] outline-none`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#555A52] mb-1">
                  {language === 'en' ? 'Street Address' : 'Dirección (Calle y Número)'} *
                </label>
                <input
                  type="text"
                  value={customerData.address}
                  onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                  placeholder="Calle y número"
                  className={`w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border ${
                    validationErrors.address ? 'border-red-400 bg-red-50/30' : 'border-[#8A8F98]'
                  } focus:border-[#B8F23A] outline-none`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#555A52] mb-1">
                  {language === 'en' ? 'City' : 'Ciudad'} *
                </label>
                <input
                  type="text"
                  value={customerData.city}
                  onChange={(e) => setCustomerData({ ...customerData, city: e.target.value })}
                  placeholder="Ciudad"
                  className={`w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border ${
                    validationErrors.city ? 'border-red-400 bg-red-50/30' : 'border-[#8A8F98]'
                  } focus:border-[#B8F23A] outline-none`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#555A52] mb-1">
                  {language === 'en' ? 'State / Province' : 'Estado o Provincia'} *
                </label>
                <input
                  type="text"
                  value={customerData.state}
                  onChange={(e) => setCustomerData({ ...customerData, state: e.target.value })}
                  placeholder="Estado"
                  className={`w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border ${
                    validationErrors.state ? 'border-red-400 bg-red-50/30' : 'border-[#8A8F98]'
                  } focus:border-[#B8F23A] outline-none`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#555A52] mb-1">
                  {language === 'en' ? 'Country' : 'País'} *
                </label>
                <input
                  type="text"
                  value={customerData.country}
                  onChange={(e) => setCustomerData({ ...customerData, country: e.target.value })}
                  placeholder="País"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-[#8A8F98] focus:border-[#B8F23A] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#555A52] mb-1">
                  {language === 'en' ? 'Postal Code' : 'Código Postal'} *
                </label>
                <input
                  type="text"
                  value={customerData.postal_code}
                  onChange={(e) => setCustomerData({ ...customerData, postal_code: e.target.value })}
                  placeholder="Código Postal"
                  className={`w-full px-3 py-2 text-xs font-semibold rounded-xl bg-white border ${
                    validationErrors.postal_code ? 'border-red-400 bg-red-50/30' : 'border-[#8A8F98]'
                  } focus:border-[#B8F23A] outline-none`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-[#8A8F98] text-xs font-bold text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0] cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft size={15} />
                <span>{language === 'en' ? 'Back' : 'Atrás'}</span>
              </button>
              <button
                type="button"
                id="transfer-step2-continue-btn"
                onClick={() => {
                  if (validateCustomerData()) {
                    setStep(3);
                  }
                }}
                className="px-6 py-2.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
              >
                <span>{language === 'en' ? 'Continue to Auth Code' : 'Continuar a Código Auth/EPP'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PASO 3: AUTH / EPP CODE */}
        {/* ============================================================ */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="bg-[#F7F8F0] p-5 rounded-2xl border border-[#8A8F98]">
              <div className="flex items-center gap-2 font-black text-sm text-[#070707] mb-1">
                <KeyRound size={16} className="text-[#B8F23A]" />
                <span>{language === 'en' ? 'Transfer Authorization (Auth/EPP Code)' : 'Código de Autorización de Transferencia (Auth/EPP Code)'}</span>
              </div>
              <p className="text-xs text-[#555A52] font-medium leading-relaxed">
                {language === 'en'
                  ? 'To initiate the transfer, provide the Auth/EPP Code provided by your current registrar (must be between 6 and 32 characters).'
                  : 'Para autorizar la transferencia, ingresa el código Auth/EPP proporcionado por tu registrador actual (debe tener entre 6 y 32 caracteres).'}
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black text-[#070707]">
                {language === 'en' ? 'Auth / EPP Code:' : 'Código Auth / EPP:'} *
              </label>

              <div className="relative">
                <input
                  id="transfer-auth-code-input"
                  type={showAuthCode ? 'text' : 'password'}
                  value={authCode}
                  onChange={(e) => {
                    setAuthCode(e.target.value);
                    if (validationErrors.auth_code) {
                      setValidationErrors({});
                    }
                  }}
                  placeholder={language === 'en' ? 'Enter Auth/EPP Code provided by your registrar' : 'Ingresa el código proporcionado por tu registrador'}
                  className={`w-full pl-4 pr-12 py-3 text-sm font-mono font-bold rounded-xl bg-white border-2 ${
                    validationErrors.auth_code ? 'border-red-500 bg-red-50/20' : 'border-[#8A8F98]'
                  } focus:border-[#B8F23A] outline-none`}
                />
                <button
                  type="button"
                  onClick={() => setShowAuthCode(!showAuthCode)}
                  aria-label={showAuthCode ? 'Hide Auth Code' : 'Show Auth Code'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#858A82] hover:text-[#070707] p-1 cursor-pointer"
                >
                  {showAuthCode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {validationErrors.auth_code && (
                <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {validationErrors.auth_code}
                </p>
              )}

              <div className="p-3 bg-[#FAFAFA] border border-[#8A8F98] rounded-xl text-xs text-[#555A52] space-y-1">
                <div className="font-semibold text-[#070707] flex items-center gap-1.5">
                  <Lock size={13} className="text-[#B8F23A]" />
                  <span>{language === 'en' ? 'Privacy & Security Note:' : 'Nota de Seguridad:'}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {language === 'en'
                    ? 'Your Auth Code is treated with strict confidentiality. It is never exposed in browser storage or public logs.'
                    : 'Tu Auth Code se procesa con estricta confidencialidad. Nunca se almacena en el navegador ni se expone públicamente.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl border border-[#8A8F98] text-xs font-bold text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0] cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft size={15} />
                <span>{language === 'en' ? 'Back' : 'Atrás'}</span>
              </button>
              <button
                type="button"
                id="transfer-step3-continue-btn"
                onClick={() => {
                  if (validateAuthCode()) {
                    setStep(4);
                  }
                }}
                className="px-6 py-2.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
              >
                <span>{language === 'en' ? 'Review & Add to Cart' : 'Revisar y Añadir al Carrito'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PASO 4: REVISAR Y AÑADIR AL CARRITO */}
        {/* ============================================================ */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="bg-[#F7F8F0] p-4 rounded-2xl border border-[#8A8F98]">
              <h3 className="font-black text-sm text-[#070707] flex items-center gap-2 mb-1">
                <ShoppingCart size={16} className="text-[#B8F23A]" />
                <span>{language === 'en' ? 'Transfer Summary' : 'Resumen de la Transferencia'}</span>
              </h3>
              <p className="text-xs text-[#555A52] font-medium">
                {language === 'en'
                  ? 'Verify the details before adding to your shopping cart and proceeding to checkout.'
                  : 'Verifica los detalles antes de añadir al carrito comercial y finalizar tu pedido.'}
              </p>
            </div>

            <div className="bg-white border border-[#8A8F98] rounded-2xl p-4 divide-y divide-[#8A8F98] text-xs">
              <div className="pb-3 flex justify-between items-center">
                <span className="font-bold text-[#555A52]">{language === 'en' ? 'Domain:' : 'Dominio:'}</span>
                <span className="font-black text-sm text-[#070707] font-mono">{cleanDomain}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="font-bold text-[#555A52]">{language === 'en' ? 'Product SKU:' : 'SKU Comercial:'}</span>
                <span className="font-black text-xs px-2 py-0.5 rounded bg-[#F7F8F0] border border-[#8A8F98] font-mono text-[#070707]">
                  DOMAIN_TRANSFER
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="font-bold text-[#555A52]">{language === 'en' ? 'Registrant:' : 'Titular:'}</span>
                <span className="font-semibold text-[#070707]">
                  {customerData.first_name} {customerData.last_name} {customerData.company ? `(${customerData.company})` : ''}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="font-bold text-[#555A52]">{language === 'en' ? 'Contact Email:' : 'Correo de Contacto:'}</span>
                <span className="font-semibold text-[#070707]">{customerData.email}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="font-bold text-[#555A52]">{language === 'en' ? 'Auth / EPP Code:' : 'Código Auth/EPP:'}</span>
                <span className="font-semibold text-[#070707] font-mono">
                  {showAuthCode ? authCode : '••••••••••••'} ({authCode.length} car.)
                </span>
              </div>
              <div className="pt-3 flex justify-between items-center">
                <span className="font-bold text-[#555A52]">
                  {language === 'en' ? 'Total (includes 1 yr renewal):' : 'Total (incluye 1 año de renovación):'}
                </span>
                <span className="font-black text-base text-[#070707]">{formatMoney(resolvedPrice, currency)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-xl border border-[#8A8F98] text-xs font-bold text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0] cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft size={15} />
                <span>{language === 'en' ? 'Back' : 'Atrás'}</span>
              </button>

              <button
                type="button"
                id="transfer-add-to-cart-btn"
                onClick={handleAddToCart}
                className="px-8 py-3 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl text-sm font-black flex items-center gap-2 shadow-lg cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
              >
                <ShoppingCart size={16} />
                <span>{language === 'en' ? 'Add Transfer to Cart' : 'Añadir al Carrito'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
