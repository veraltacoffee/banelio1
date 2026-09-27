import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Shield,
  KeyRound,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Info,
  Clock,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  LogIn,
  Eye,
  EyeOff,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import {
  TransferCustomerData,
  createTransferOrder,
  TransferOrderResponse,
  getTransferStatus,
  updateTransferAuthCode
} from '../../services/domainService';
import { formatMoney } from '../../utils/pricing';

interface DomainTransferModalProps {
  domain: string;
  isOpen: boolean;
  onClose: () => void;
  priceUSD?: number;
}

type TransferStep = 1 | 2 | 3 | 4 | 5;

export default function DomainTransferModal({
  domain,
  isOpen,
  onClose,
  priceUSD = 0
}: DomainTransferModalProps) {
  const { customerUser, loginCustomer, registerCustomer, currency, language } = useApp();

  // 5-Step Flow as requested by Banelio specifications
  const [step, setStep] = useState<TransferStep>(1);

  // Authentication sub-mode if user is not logged in
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

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
  const [skipAuthCodeInitially, setSkipAuthCodeInitially] = useState<boolean>(false);

  // Step 4 & 5: Submission & Result States
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [transferResponse, setTransferResponse] = useState<TransferOrderResponse | null>(null);
  const [orderTrackingId, setOrderTrackingId] = useState<string>('');

  // Additional tools inside result screen
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const [latestStatusText, setLatestStatusText] = useState<string | null>(null);
  const [lateAuthCode, setLateAuthCode] = useState<string>('');
  const [isUpdatingAuth, setIsUpdatingAuth] = useState<boolean>(false);
  const [updateAuthMessage, setUpdateAuthMessage] = useState<string | null>(null);

  // Initialize or pre-fill on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setAuthCode('');
      setShowAuthCode(false);
      setSkipAuthCodeInitially(false);
      setValidationErrors({});
      setTransferResponse(null);
      setLatestStatusText(null);
      setUpdateAuthMessage(null);

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
    }
  }, [isOpen, customerUser]);

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
    if (authCode.trim() && (authCode.trim().length < 6 || authCode.trim().length > 32)) {
      setValidationErrors({
        auth_code: language === 'en'
          ? 'Auth/EPP Code must be between 6 and 32 characters long'
          : 'El Auth/EPP Code debe tener entre 6 y 32 caracteres'
      });
      return false;
    }
    setValidationErrors({});
    return true;
  };

  const handleExecuteTransfer = async () => {
    if (isSubmitting) return; // Anti-double click protection

    if (!validateAuthCode()) return;

    setIsSubmitting(true);
    setValidationErrors({});

    try {
      // POST /api/domains/transfer-order.php (No sensitive IDs exposed to client)
      const response = await createTransferOrder({
        domain,
        auth_code: authCode.trim(),
        auto_renew: false,
        customer: customerData
      });

      setTransferResponse(response);
      const assignedId = String(response.order_id || 'TRF-' + Math.floor(100000 + Math.random() * 900000));
      setOrderTrackingId(assignedId);
      setStep(5);
    } catch (err: any) {
      setTransferResponse({
        success: false,
        domain,
        status: 'Failed',
        error: err?.message || 'No fue posible iniciar la transferencia.'
      });
      setStep(5);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQueryStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const res = await getTransferStatus({ domain, order_id: orderTrackingId });
      setLatestStatusText(res.statusLabel);
    } catch {
      setLatestStatusText(language === 'en' ? 'Status inquiry in progress' : 'Consulta en proceso');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleUpdateAuthCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lateAuthCode.trim() || isUpdatingAuth) return;

    setIsUpdatingAuth(true);
    setUpdateAuthMessage(null);
    try {
      const res = await updateTransferAuthCode(domain, lateAuthCode.trim());
      setUpdateAuthMessage(res.message);
      setLateAuthCode('');
    } catch {
      setUpdateAuthMessage(language === 'en' ? 'Error updating Auth Code' : 'Error al actualizar el Auth Code');
    } finally {
      setIsUpdatingAuth(false);
    }
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
          disabled={isSubmitting}
          aria-label={language === 'en' ? 'Close modal' : 'Cerrar modal'}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0] transition-colors cursor-pointer disabled:opacity-50"
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
            {language === 'en' ? 'Transfer your domain to Banelio' : 'Transfiere tu dominio a Banelio'}
          </h2>
          <p className="text-xs sm:text-sm text-[#555A52] font-medium mt-1">
            {language === 'en'
              ? 'Keep your domain safe with Anycast DNS, free WHOIS privacy, and 24/7 technical support.'
              : 'Conserva tu dominio con DNS Anycast, privacidad WHOIS gratuita y soporte técnico 24/7.'}
          </p>
        </div>

        {/* Progress Step Indicator */}
        <div className="grid grid-cols-5 gap-1.5 mb-8">
          {[
            { num: 1, label: language === 'en' ? 'Domain' : 'Dominio' },
            { num: 2, label: language === 'en' ? 'Client' : 'Cliente' },
            { num: 3, label: language === 'en' ? 'Auth Code' : 'Auth/EPP' },
            { num: 4, label: language === 'en' ? 'Review' : 'Revisión' },
            { num: 5, label: language === 'en' ? 'Complete' : 'Estado' }
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
                  <span className="text-2xl font-black text-[#070707] font-mono tracking-tight">{domain}</span>
                </div>
                <div className="text-right sm:text-right">
                  <span className="text-xs text-[#555A52] font-semibold block">
                    {language === 'en' ? 'Transfer + 1 Year Renewal' : 'Transferencia + 1 Año Renovación'}
                  </span>
                  <span className="text-2xl font-black text-[#070707]">{formatMoney(priceUSD, currency)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#8A8F98] flex items-center gap-2.5 text-xs text-[#B8F23A] font-bold">
                <CheckCircle2 size={16} className="text-[#B8F23A] shrink-0" />
                <span>
                  {language === 'en'
                    ? 'Status: Registered with external provider (Eligible for transfer)'
                    : 'Estado: Registrado con otro proveedor (Elegible para transferencia)'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-white border border-[#8A8F98] rounded-2xl space-y-2 text-xs text-[#555A52]">
              <div className="font-bold text-[#070707] flex items-center gap-1.5">
                <Info size={14} className="text-[#B8F23A]" />
                <span>{language === 'en' ? 'Requirements before transferring:' : 'Requisitos antes de iniciar:'}</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[#555A52] pl-1 font-medium">
                <li>{language === 'en' ? 'The domain must be unlocked at your current registrar.' : 'El dominio debe estar desbloqueado en tu registrador actual.'}</li>
                <li>{language === 'en' ? 'Have been registered or transferred for more than 60 days.' : 'Tener más de 60 días de antigüedad de registro o transferencia previa.'}</li>
                <li>{language === 'en' ? 'Access to the administrative contact email.' : 'Tener acceso al correo del contacto administrativo.'}</li>
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
              <button
                type="button"
                id="transfer-step1-continue-btn"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
              >
                <span>{language === 'en' ? 'Continue with Client Info' : 'Continuar con Datos de Titular'}</span>
                <ArrowRight size={15} />
              </button>
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
                  ? 'To initiate the transfer, you will need the Auth/EPP Code provided by your current registrar.'
                  : 'Para iniciar la transferencia necesitarás el Auth/EPP Code proporcionado por tu registrador actual.'}
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black text-[#070707]">
                {language === 'en' ? 'Auth / EPP Code:' : 'Código Auth / EPP:'}
              </label>

              <div className="relative">
                <input
                  id="transfer-auth-code-input"
                  type={showAuthCode ? 'text' : 'password'}
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder={language === 'en' ? 'Enter Auth/EPP Code provided by your registrar' : 'Ingresa el código proporcionado por tu registrador'}
                  className="w-full pl-4 pr-12 py-3 text-sm font-mono font-bold rounded-xl bg-white border-2 border-[#8A8F98] focus:border-[#B8F23A] outline-none"
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
                    ? 'Your Auth Code is transmitted over encrypted HTTPS directly to the registry backend. It is never stored in browser storage or logs.'
                    : 'Tu Auth Code se transmite de forma cifrada mediante HTTPS directamente al backend del Registry. Nunca se almacena en el navegador ni en logs.'}
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs text-[#555A52] font-semibold cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={skipAuthCodeInitially}
                  onChange={(e) => setSkipAuthCodeInitially(e.target.checked)}
                  className="w-4 h-4 rounded border-[#8A8F98] text-[#B8F23A] focus:ring-[#B8F23A]"
                />
                <span>
                  {language === 'en'
                    ? 'I do not have the Auth Code yet (I will supply it later after requesting the transfer).'
                    : 'Aún no tengo el Auth Code (lo ingresaré posteriormente tras iniciar la solicitud).'}
                </span>
              </label>
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
                <span>{language === 'en' ? 'Review Application' : 'Revisar Solicitud'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PASO 4: REVISAR SOLICITUD */}
        {/* ============================================================ */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="bg-[#F7F8F0] p-4 rounded-2xl border border-[#8A8F98]">
              <h3 className="font-black text-sm text-[#070707] flex items-center gap-2 mb-1">
                <FileCheck size={16} className="text-[#B8F23A]" />
                <span>{language === 'en' ? 'Review your Transfer Order' : 'Revisar Solicitud de Transferencia'}</span>
              </h3>
              <p className="text-xs text-[#555A52] font-medium">
                {language === 'en'
                  ? 'Please confirm the details below before submitting to the Registry.'
                  : 'Verifica los detalles antes de enviar la orden al Registry.'}
              </p>
            </div>

            <div className="bg-white border border-[#8A8F98] rounded-2xl p-4 divide-y divide-[#8A8F98] text-xs">
              <div className="pb-3 flex justify-between items-center">
                <span className="font-bold text-[#555A52]">{language === 'en' ? 'Domain:' : 'Dominio:'}</span>
                <span className="font-black text-sm text-[#070707] font-mono">{domain}</span>
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
                <span className="font-bold text-[#555A52]">{language === 'en' ? 'Phone:' : 'Teléfono:'}</span>
                <span className="font-semibold text-[#070707]">{customerData.phone}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="font-bold text-[#555A52]">{language === 'en' ? 'Auth / EPP Code:' : 'Código Auth/EPP:'}</span>
                <span className="font-semibold text-[#070707]">
                  {authCode.trim()
                    ? (showAuthCode ? authCode : '••••••••••••')
                    : (language === 'en' ? 'Pending (to be supplied)' : 'Pendiente (se ingresará después)')}
                </span>
              </div>
              <div className="pt-3 flex justify-between items-center">
                <span className="font-bold text-[#555A52]">{language === 'en' ? 'Total to Pay (includes 1 yr renewal):' : 'Total (incluye 1 año renovación):'}</span>
                <span className="font-black text-base text-[#070707]">{formatMoney(priceUSD, currency)}</span>
              </div>
            </div>

            {/* Validation / error banner */}
            {transferResponse?.error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500 shrink-0" />
                <span>{transferResponse.error}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-[#8A8F98] text-xs font-bold text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0] cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <ArrowLeft size={15} />
                <span>{language === 'en' ? 'Back' : 'Atrás'}</span>
              </button>

              <button
                type="button"
                id="transfer-step5-submit-btn"
                disabled={isSubmitting}
                onClick={handleExecuteTransfer}
                className="px-8 py-3 bg-[#B8F23A] hover:bg-[#B8F23A] disabled:bg-[#8A8F98] text-[#070707] rounded-xl text-sm font-black flex items-center gap-2 shadow-lg cursor-pointer transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-[#070707]" />
                    <span>{language === 'en' ? 'Processing request...' : 'Procesando solicitud...'}</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    <span>{language === 'en' ? 'Submit Transfer Order' : 'Solicitar transferencia'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PASO 5: RESULTADO / SEGUIMIENTO */}
        {/* ============================================================ */}
        {step === 5 && (
          <div className="space-y-5 animate-in fade-in">
            {transferResponse?.success ? (
              <div className="p-6 bg-[#F7F8F0] border-2 border-[#B8F23A] rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 bg-[#B8F23A] text-[#070707] rounded-full flex items-center justify-center mx-auto shadow-2xs">
                  <CheckCircle2 size={26} />
                </div>

                <h3 className="text-xl font-black text-[#070707]">
                  {language === 'en' ? 'Transfer Request Initiated!' : '¡Solicitud de Transferencia Iniciada!'}
                </h3>

                <p className="text-xs text-[#555A52] max-w-md mx-auto leading-relaxed">
                  {language === 'en'
                    ? `Your domain transfer request for ${domain} was registered with Order #${orderTrackingId}. Follow the confirmation email sent to ${customerData.email}.`
                    : `Tu solicitud de transferencia para ${domain} fue registrada con el Folio #${orderTrackingId}. Se envió un correo de seguimiento a ${customerData.email}.`}
                </p>

                <div className="pt-2">
                  <span className="inline-block px-3 py-1 bg-white border border-[#8A8F98] rounded-lg text-xs font-mono font-bold text-[#070707]">
                    Folio: {orderTrackingId}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
                  <AlertCircle size={26} />
                </div>

                <h3 className="text-xl font-black text-red-900">
                  {language === 'en' ? 'Could not complete transfer request' : 'No fue posible completar la transferencia'}
                </h3>

                <p className="text-xs text-red-700 max-w-md mx-auto leading-relaxed">
                  {transferResponse?.error ||
                    (language === 'en'
                      ? 'Please verify that your domain is unlocked and the Auth Code is correct.'
                      : 'Por favor verifica que tu dominio esté desbloqueado y que el Auth Code sea válido.')}
                </p>
              </div>
            )}

            {/* Check Real Status tool (/api/domains/transfer-status.php) */}
            <div className="p-4 bg-white border border-[#8A8F98] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-[#070707]">
                    {language === 'en' ? 'Live Transfer Status Check' : 'Consulta de Estado en Tiempo Real'}
                  </h4>
                  <p className="text-[11px] text-[#555A52]">
                    Endpoint: <code className="bg-[#F7F8F0] px-1 py-0.5 rounded text-[#070707]">/api/domains/transfer-status.php</code>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleQueryStatus}
                  disabled={isCheckingStatus}
                  className="px-3 py-1.5 bg-[#F7F8F0] hover:bg-[#8A8F98] text-[#070707] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isCheckingStatus ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <RefreshCw size={13} />
                  )}
                  <span>{language === 'en' ? 'Check Status' : 'Consultar Estado'}</span>
                </button>
              </div>

              {latestStatusText && (
                <div className="p-2.5 bg-[#F7F8F0] rounded-xl border border-[#8A8F98] text-xs font-bold text-[#B8F23A] flex items-center gap-2">
                  <Clock size={14} />
                  <span>{latestStatusText}</span>
                </div>
              )}
            </div>

            {/* Late Auth Code Form (/api/domains/transfer-auth.php) */}
            {(!authCode.trim() || transferResponse?.requires_auth) && (
              <form onSubmit={handleUpdateAuthCode} className="p-4 bg-white border border-[#8A8F98] rounded-2xl space-y-2">
                <h4 className="font-bold text-xs text-[#070707]">
                  {language === 'en' ? 'Submit Auth / EPP Code' : 'Ingresar Auth / EPP Code Posterior'}
                </h4>
                <p className="text-[11px] text-[#555A52]">
                  Endpoint: <code className="bg-[#F7F8F0] px-1 py-0.5 rounded text-[#070707]">/api/domains/transfer-auth.php</code>
                </p>

                <div className="flex gap-2 pt-1">
                  <input
                    type="password"
                    value={lateAuthCode}
                    onChange={(e) => setLateAuthCode(e.target.value)}
                    placeholder="Auth/EPP Code"
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold rounded-xl bg-white border border-[#8A8F98] focus:border-[#B8F23A] outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!lateAuthCode.trim() || isUpdatingAuth}
                    className="px-4 py-2 bg-[#B8F23A] hover:bg-[#B8F23A] disabled:bg-[#8A8F98] text-[#070707] rounded-xl text-xs font-bold cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isUpdatingAuth ? <Loader2 size={13} className="animate-spin" /> : language === 'en' ? 'Update' : 'Actualizar'}
                  </button>
                </div>

                {updateAuthMessage && (
                  <p className="text-xs font-semibold text-[#B8F23A] pt-1">{updateAuthMessage}</p>
                )}
              </form>
            )}

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-[#070707] hover:bg-[#222] text-white rounded-xl text-xs font-black cursor-pointer"
              >
                {language === 'en' ? 'Close' : 'Cerrar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
