import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/pricing';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  FileText,
  ArrowRight,
  User,
  Mail,
  Building,
  Globe,
  Sparkles,
  Server,
  X,
  Store,
  Printer,
  Copy,
  Clock,
  ExternalLink,
  AlertCircle,
  LogIn,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { Order, PaymentMethod } from '../../types';

export default function CheckoutModal() {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    cartTotalUSD,
    cartTaxUSD,
    cartSubtotalUSD,
    promoDiscountUSD,
    currency,
    language,
    countryCode,
    processCheckout,
    customerUser,
    registerCustomer,
    loginCustomer,
    logoutCustomer,
    setRole,
    addToast
  } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('STRIPE_CARD');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checkoutAuthTab, setCheckoutAuthTab] = useState<'REGISTER' | 'LOGIN'>('REGISTER');
  const [checkoutLoginEmail, setCheckoutLoginEmail] = useState('');
  const [checkoutLoginPassword, setCheckoutLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'PAYMENT' | 'PROVISIONING' | 'SUCCESS' | 'OXXO_VOUCHER' | 'PAYMENT_PENDING' | 'PAYMENT_FAILED'>('PAYMENT');
  const [provisionLogs, setProvisionLogs] = useState<string[]>([]);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<string>('');
  const [gatewayReference, setGatewayReference] = useState<string>('');
  const [paypalApproveUrl, setPaypalApproveUrl] = useState<string>('');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [usdMxnRate, setUsdMxnRate] = useState<number | null>(null);

  // Cargar el tipo de cambio REAL del servidor (usado solo para MOSTRAR el
  // monto estimado en MXN antes de generar el voucher; el monto definitivo lo
  // calcula el servidor en /api/payments/oxxo/create-voucher).
  useEffect(() => {
    fetch('/api/payments/config', { headers: { Accept: 'application/json' } })
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg && cfg.fx && typeof cfg.fx.usdMxnRate === 'number' && cfg.fx.usdMxnRate > 0) {
          setUsdMxnRate(cfg.fx.usdMxnRate);
        }
      })
      .catch(() => {});
  }, []);

  // Sync with logged in customerUser
  useEffect(() => {
    if (customerUser) {
      setCustomerName(customerUser.name || '');
      setCustomerEmail(customerUser.email || '');
      setCompanyName(customerUser.company || '');
      setRegPhone(customerUser.phone || '');
      setRegTaxId(customerUser.taxId || '');
      setRegAddress(customerUser.address || '');
      setRegCity(customerUser.city || '');
      setRegState(customerUser.state || '');
      setRegPostalCode(customerUser.postalCode || '');
    } else {
      setCustomerName('');
      setCustomerEmail('');
      setCompanyName('');
      setCustomerPassword('');
    }
  }, [customerUser]);

  // Registrant Contact timing choice (Now vs Later in Mi Panel)
  const [registrantTiming, setRegistrantTiming] = useState<'LATER' | 'NOW'>('LATER');
  const [regPhone, setRegPhone] = useState('');
  const [regTaxId, setRegTaxId] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('');
  const [regPostalCode, setRegPostalCode] = useState('');

  // Stripe Card (empty, user fills real data)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // OXXO Pay Details State
  const [oxxoVoucher, setOxxoVoucher] = useState<{
    reference: string;
    formattedReference: string;
    expiresAt: string;
    amountMXN: number;
    instructions: string[];
  } | null>(null);

  if (!isCheckoutOpen) return null;

  // Estimación de MOSTRAR para OXXO usando el FX real del servidor (si está
  // disponible). El monto autoritativo del voucher lo calcula el backend.
  const totalInMXN = usdMxnRate ? Math.round(cartTotalUSD * usdMxnRate) : 0;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast({
      type: 'success',
      title: 'Referencia Copiada',
      message: 'Código de referencia OXXO copiado al portapapeles.'
    });
  };

  const handleInlineLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!checkoutLoginEmail.trim() || !checkoutLoginPassword) {
      addToast({
        type: 'error',
        title: 'Campos requeridos',
        message: 'Por favor ingresa tu correo y contraseña para iniciar sesión.'
      });
      return;
    }

    setIsLoggingIn(true);
    try {
      await loginCustomer(checkoutLoginEmail.trim(), checkoutLoginPassword);
      addToast({
        type: 'success',
        title: 'Sesión Iniciada',
        message: 'Bienvenido de nuevo. Tus datos fueron asociados a la orden.'
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Error de Inicio de Sesión',
        message: 'Credenciales inválidas. Por favor verifica tus datos o regístrate si eres nuevo.'
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Ensure user is authenticated or registers real account
    let activeCustomerEmail = customerEmail.trim();
    let activeCustomerName = customerName.trim();

    if (!customerUser) {
      if (checkoutAuthTab === 'LOGIN') {
        if (!checkoutLoginEmail.trim() || !checkoutLoginPassword) {
          addToast({
            type: 'error',
            title: 'Inicia Sesión Primero',
            message: 'Ingresa tu correo y contraseña o cambia a la pestaña "Crear Cuenta".'
          });
          return;
        }
        try {
          setIsProcessing(true);
          await loginCustomer(checkoutLoginEmail.trim(), checkoutLoginPassword);
          activeCustomerEmail = checkoutLoginEmail.trim();
        } catch {
          setIsProcessing(false);
          addToast({
            type: 'error',
            title: 'Credenciales Inválidas',
            message: 'Verifica tu correo y contraseña o crea una cuenta nueva.'
          });
          return;
        }
      } else {
        // REGISTER TAB
        if (!activeCustomerName) {
          addToast({
            type: 'error',
            title: 'Nombre Requerido',
            message: 'Por favor ingresa tu nombre completo para la factura y titularidad.'
          });
          return;
        }
        if (!activeCustomerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(activeCustomerEmail)) {
          addToast({
            type: 'error',
            title: 'Correo Inválido',
            message: 'Por favor ingresa un correo electrónico válido.'
          });
          return;
        }
        if (!customerPassword || customerPassword.length < 6) {
          addToast({
            type: 'error',
            title: 'Contraseña Requerida',
            message: 'Por favor define una contraseña (mínimo 6 caracteres) para proteger tu cuenta de cliente.'
          });
          return;
        }

        try {
          setIsProcessing(true);
          await registerCustomer({
            name: activeCustomerName,
            email: activeCustomerEmail,
            company: companyName.trim(),
            phone: regPhone.trim(),
            password: customerPassword
          });
        } catch (err) {
          console.error('Registration error during checkout', err);
        }
      }
    } else {
      activeCustomerEmail = customerUser.email;
      activeCustomerName = customerUser.name;
    }

    setIsProcessing(true);

    // Crear la orden PRIMERO (server-authoritative). El servidor valida SKUs,
    // forma de pago y calcula el total REAL. El cliente solo recibe el orderId.
    let serverOrder: any;
    try {
      serverOrder = await processCheckout(
        paymentMethod,
        { name: activeCustomerName, email: activeCustomerEmail }
      );
    } catch (err: any) {
      setIsProcessing(false);
      setPaymentNotice(`No se pudo registrar tu orden en el servidor: ${err?.message || 'error'}. Tu carrito sigue guardado.`);
      setStep('PAYMENT_FAILED');
      return;
    }
    const orderId = serverOrder?.id;

    if (paymentMethod === 'OXXO_PAY') {
      // 1. Solicitar el voucher REAL a Stripe (solo con orderId). El servidor
      // lee el total de la orden, aplica FX real USD->MXN y devuelve la
      // referencia de 14 dígitos. NUNCA se envía un monto del cliente.
      let oxxoData: any = null;
      try {
        const res = await fetch('/api/payments/oxxo/create-voucher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            customerName: activeCustomerName,
            customerEmail: activeCustomerEmail
          })
        });
        if (res.ok) oxxoData = await res.json();
      } catch {
        oxxoData = null;
      }

      // OXXO requiere un proveedor real configurado. NUNCA fabricar voucher
      // ni referencia (sería un pago falso).
      if (!oxxoData || oxxoData.configured === false || !oxxoData.reference) {
        setIsProcessing(false);
        setPaymentNotice(
          'OXXO Pay no está configurado en este momento, por lo que no se generó un voucher. Intenta con tarjeta o PayPal.'
        );
        setStep('PAYMENT_FAILED');
        return;
      }

      setOxxoVoucher({
        reference: oxxoData.reference,
        formattedReference: oxxoData.formattedReference || `${oxxoData.reference.slice(0, 4)}-${oxxoData.reference.slice(4, 8)}-${oxxoData.reference.slice(8, 12)}-${oxxoData.reference.slice(12)}`,
        expiresAt: oxxoData.expiresAt,
        amountMXN: Number(oxxoData.amountMXN) || 0,
        instructions: oxxoData.instructions || [
          'Acude a cualquier tienda OXXO de la República Mexicana.',
          'Indica al cajero que pagarás con OXXO Pay.',
          'Dicta la referencia de 14 dígitos o muestra el código de barras.',
          'Realiza el pago en efectivo.',
          'Conserva tu ticket; tus servicios se activarán en cuanto OXXO confirme la recepción.'
        ]
      });
      if (oxxoData.paymentIntentId) setGatewayReference(oxxoData.paymentIntentId);
      setCompletedOrder(serverOrder);
      setIsProcessing(false);
      setStep('OXXO_VOUCHER');
      return;
    }

    // Stripe & PayPal Real-time Flow.
    // IMPORTANT: Creating a PaymentIntent / PayPal order is ONLY "payment started".
    // The order is NOT marked PAID and NOT provisioned until the gateway CONFIRMS
    // the payment. Missing credentials => PAYMENT_FAILED (never SUCCESS).
    const paymentLabel = paymentMethod === 'STRIPE_CARD' ? 'Stripe' : 'PayPal';
    setStep('PROVISIONING');
    setProvisionLogs([`[1/4] Creando orden de cobro en ${paymentLabel} (${formatMoney(cartTotalUSD, currency)})...`]);

    const registerUnconfirmed = async (gatewayRef: string, fail: boolean) => {
      // No real gateway confirmation -> store order WITHOUT provisioning.
      try {
        const order = await processCheckout(
          paymentMethod,
          { name: activeCustomerName, email: activeCustomerEmail },
          undefined,
          { confirmed: false, gatewayReference: gatewayRef }
        );
        setGatewayReference(gatewayRef);
        setCompletedOrder(order);
      } catch {
        setGatewayReference(gatewayRef);
        setCompletedOrder(null);
        setIsProcessing(false);
        setPaymentNotice(
          'No se pudo registrar tu orden en el servidor. Tu carrito sigue guardado. Verifica los productos e inténtalo de nuevo.'
        );
        setStep('PAYMENT_FAILED');
        return;
      }
      setIsProcessing(false);
      setPaymentNotice(
        fail
          ? 'El proveedor de pago no confirmó la transacción. Tu carrito no se ha aprovisionado y sigue guardado.'
          : 'El pago está iniciado pero todavía NO está confirmado por el proveedor. Tu carrito NO ha sido aprovisionado y sigue guardado.'
      );
      setStep(fail ? 'PAYMENT_FAILED' : 'PAYMENT_PENDING');
    };

    try {
      if (paymentMethod === 'STRIPE_CARD') {
        // Step 1: creation of the PaymentIntent (NOT a confirmation).
        // Solo se envía el orderId; el monto se lee de la orden en Prisma.
        const res = await fetch('/api/payments/stripe/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            customerEmail: activeCustomerEmail
          })
        });
        const data = await res.json();

        if (!data.configured) {
          // No STRIPE_SECRET_KEY -> definitely cannot confirm -> fail safely.
          setProvisionLogs((prev) => [...prev, '[2/4] Stripe no está configurado: no se puede confirmar el pago.']);
          await registerUnconfirmed('', true);
          return;
        }
        if (!res.ok || !data.clientSecret) {
          setProvisionLogs((prev) => [...prev, `[2/4] Stripe no pudo crear el intent: ${data.error || 'error'}`]);
          await registerUnconfirmed('', true);
          return;
        }

        // PaymentIntent created. The card must still be paid with Stripe.js and the
        // PaymentIntent status verified server-side. We do NOT auto-provision here.
        setGatewayReference(data.id);
        setProvisionLogs((prev) => [
          ...prev,
          `[2/4] PaymentIntent ${data.id} creado (${data.status}). Requiere confirmación del pago.`
        ]);
        setPaymentNotice(
          'Se creó la orden de pago en Stripe. Para finalizar: confirma el pago en tu navegador y luego pulsa "Verificar estado del pago" para confirmar la transacción con el proveedor.'
        );
        await registerUnconfirmed(data.id, false);
        return;
      }

      // PayPal
      const res = await fetch('/api/payments/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId
        })
      });
      const data = await res.json();

      if (!data.configured) {
        setProvisionLogs((prev) => [...prev, '[2/4] PayPal no está configurado: no se puede confirmar el pago.']);
        await registerUnconfirmed('', true);
        return;
      }
      if (!res.ok || !data.orderId) {
        setProvisionLogs((prev) => [...prev, `[2/4] PayPal no pudo crear la orden: ${data.error || 'error'}`]);
        await registerUnconfirmed('', true);
        return;
      }

      // Order created but NOT captured -> not a payment yet.
      setGatewayReference(data.orderId);
      setPaypalApproveUrl(data.approveUrl || '');
      setProvisionLogs((prev) => [
        ...prev,
        `[2/4] PayPal Order ${data.orderId} creada (${data.status}). Requiere aprobación y captura.`
      ]);
      setPaymentNotice(
        data.approveUrl
          ? 'Se creó tu orden en PayPal. Aprueba el pago en el sitio de PayPal y después pulsa "Confirmar pago con PayPal".'
          : 'Se creó tu orden en PayPal, pero falta la aprobación del comprador para poder capturar el pago.'
      );
      await registerUnconfirmed(data.orderId, false);
    } catch (err: any) {
      // Network / exception -> fail safely (no provisioning).
      setProvisionLogs((prev) => [...prev, `[2/4] Error conectando con ${paymentLabel}: ${err?.message || 'error de red'}`]);
      await registerUnconfirmed('', true);
    }
  };

  const handleOpenPaypal = () => {
    if (paypalApproveUrl) {
      window.open(paypalApproveUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Called only AFTER the gateway confirms the payment. Provisions the order.
  const completeConfirmed = async (gatewayRef: string) => {
    const paymentLabel = paymentMethod === 'STRIPE_CARD' ? 'Stripe' : 'PayPal';
    setStep('PROVISIONING');
    setProvisionLogs((prev) => [
      ...prev,
      `[3/4] Pago confirmado por ${paymentLabel}. Registrando la orden en el servidor...`
    ]);
    let order: Order;
    try {
      order = await processCheckout(
        paymentMethod,
        { name: customerName || 'Cliente', email: customerEmail || '' },
        undefined,
        { confirmed: true, gatewayReference: gatewayRef }
      );
    } catch {
      setIsProcessing(false);
      setPaymentNotice(
        'No se pudo registrar tu orden en el servidor. Tu carrito sigue guardado.'
      );
      setStep('PAYMENT_FAILED');
      return;
    }
    setCompletedOrder(order);
    // processCheckout closes the modal on a confirmed order; reopen to show SUCCESS.
    setIsCheckoutOpen(true);
    setIsProcessing(false);
    setStep('SUCCESS');
    try {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    } catch {}
  };

  const handleVerifyPayment = async () => {
    setIsVerifyingPayment(true);
    try {
      let confirmed = false;
      let ref = gatewayReference;
      if (paymentMethod === 'STRIPE_CARD' || paymentMethod === 'OXXO_PAY') {
        const res = await fetch('/api/payments/stripe/retrieve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: gatewayReference })
        });
        const data = await res.json();
        if (data.configured && data.confirmed && data.status === 'succeeded') {
          confirmed = true;
          ref = data.id;
        } else {
          setPaymentNotice(
            data.configured === false
              ? 'Stripe no está configurado en el servidor. No se puede confirmar el pago.'
              : `El pago aún no está confirmado (estado: ${data.status || 'desconocido'}). Inténtalo de nuevo en unos momentos.`
          );
        }
      } else {
        const res = await fetch('/api/payments/paypal/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: gatewayReference })
        });
        const data = await res.json();
        if (data.configured && data.confirmed && data.status === 'COMPLETED') {
          confirmed = true;
          ref = data.orderId;
        } else {
          setPaymentNotice(
            data.configured === false
              ? 'PayPal no está configurado en el servidor. No se puede confirmar el pago.'
              : `PayPal aún no confirmó la captura (estado: ${data.status || 'desconocido'}). Aprueba el pago e inténtalo de nuevo.`
          );
        }
      }

      if (confirmed) {
        await completeConfirmed(ref);
      } else if (paymentMethod === 'OXXO_PAY' && oxxoVoucher) {
        setStep('OXXO_VOUCHER');
      } else {
        setStep(paymentNotice.includes('no está configurado') ? 'PAYMENT_FAILED' : 'PAYMENT_PENDING');
      }
    } catch (err: any) {
      setPaymentNotice(`No se pudo verificar el pago (${err?.message || 'error de red'}).`);
      setStep('PAYMENT_FAILED');
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (completedOrder) {
      generateInvoicePDF(completedOrder);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FCFCF8] overflow-y-auto">
      <div className="min-h-screen w-full flex flex-col bg-[#FCFCF8]">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#FFFFFF] border-b border-[#8A8F98] px-4 sm:px-6 lg:px-10">
          <div className="max-w-7xl mx-auto py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#070707] text-[#B8F23A] flex items-center justify-center shadow-xs">
                <Lock size={18} />
              </div>
              <div>
                <div className="font-black text-base tracking-tight text-[#070707] leading-none">
                  BANELIO
                </div>
                <div className="text-[11px] text-[#B8F23A] font-bold mt-1">
                  {language === 'en' ? 'Checkout' : 'Finalizar compra'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsCheckoutOpen(false)}
              aria-label={language === 'en' ? 'Close checkout' : 'Cerrar checkout'}
              className="text-[#555A52] hover:text-[#070707] p-2 rounded-xl hover:bg-[#F7F8F0] border border-[#8A8F98] transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
          <div className="px-1 pb-3 -mt-1 max-w-7xl mx-auto">
            <p className="text-[11px] text-[#555A52]">
              {language === 'en'
                ? 'Encrypted transactions with Stripe, PayPal and OXXO Pay.'
                : 'Transacciones cifradas con Stripe, PayPal y OXXO Pay.'}
            </p>
          </div>
        </header>

        {/* STEP 1: PAYMENT FORM */}
        {step === 'PAYMENT' && (
          <form onSubmit={handlePay} className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:items-start">
            <div className="space-y-6 min-w-0">
            {/* Customer Details & Account Status Banner */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#B8F23A]">
                  1. Datos de Facturación y Cuenta de Cliente
                </h4>
                {customerUser ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#B8F23A] text-[#070707] text-xs font-bold border border-[#B8F23A]">
                    <CheckCircle2 size={14} className="text-[#B8F23A]" />
                    <span>Sesión iniciada: <strong>{customerUser.name}</strong> ({customerUser.email})</span>
                    <button
                      type="button"
                      onClick={() => {
                        logoutCustomer();
                      }}
                      className="ml-2 text-[11px] font-bold text-[#DE1E28] hover:underline cursor-pointer"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-[#F7F8F0] p-1 rounded-xl border border-[#8A8F98]">
                    <button
                      type="button"
                      onClick={() => setCheckoutAuthTab('REGISTER')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        checkoutAuthTab === 'REGISTER'
                          ? 'bg-white text-[#070707] shadow-xs'
                          : 'text-[#555A52] hover:text-[#070707]'
                      }`}
                    >
                      Cliente Nuevo
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutAuthTab('LOGIN')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        checkoutAuthTab === 'LOGIN'
                          ? 'bg-white text-[#070707] shadow-xs'
                          : 'text-[#555A52] hover:text-[#070707]'
                      }`}
                    >
                      Ya tengo cuenta
                    </button>
                  </div>
                )}
              </div>

              {!customerUser && checkoutAuthTab === 'REGISTER' && (
                <div className="space-y-3">
                  <div className="p-3 bg-[#F7F8F0] border border-[#8A8F98] rounded-2xl flex items-center gap-2.5 text-xs text-[#555A52]">
                    <Sparkles size={16} className="text-[#B8F23A] shrink-0" />
                    <span>
                      <strong>Alta inmediata de cliente:</strong> Completa tus datos reales para generar tu cuenta en Mi Panel y expedir tu factura fiscal.
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#070707] block mb-1">Nombre Completo *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 text-[#858A82]" size={15} />
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Tu nombre y apellidos"
                          className="w-full pl-9 pr-3 py-2.5 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs font-medium text-[#070707] outline-none focus:border-[#B8F23A]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#070707] block mb-1">Correo Electrónico *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 text-[#858A82]" size={15} />
                        <input
                          type="email"
                          required
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="tu@correo.com"
                          className="w-full pl-9 pr-3 py-2.5 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs font-medium text-[#070707] outline-none focus:border-[#B8F23A]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#070707] block mb-1">
                        Contraseña para Mi Panel *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 text-[#858A82]" size={15} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={customerPassword}
                          onChange={(e) => setCustomerPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full pl-9 pr-10 py-2.5 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs font-medium text-[#070707] outline-none focus:border-[#B8F23A]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-[#858A82] hover:text-[#070707]"
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#070707] block mb-1">Empresa / Razón Social (Opcional)</label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 text-[#858A82]" size={15} />
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Razón Social o Nombre Comercial"
                          className="w-full pl-9 pr-3 py-2.5 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs font-medium text-[#070707] outline-none focus:border-[#B8F23A]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!customerUser && checkoutAuthTab === 'LOGIN' && (
                <div className="p-4 bg-[#F8F9F3] border border-[#8A8F98] rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#B8F23A]">
                    <LogIn size={15} />
                    <span>Inicia sesión con tu cuenta registrada para asociar tu pedido</span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#070707] block mb-1">Correo Electrónico</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 text-[#858A82]" size={15} />
                        <input
                          type="email"
                          value={checkoutLoginEmail}
                          onChange={(e) => setCheckoutLoginEmail(e.target.value)}
                          placeholder="tu@correo.com"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-[#8A8F98] rounded-xl text-xs font-medium text-[#070707] outline-none focus:border-[#B8F23A]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#070707] block mb-1">Contraseña</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 text-[#858A82]" size={15} />
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          value={checkoutLoginPassword}
                          onChange={(e) => setCheckoutLoginPassword(e.target.value)}
                          placeholder="Tu contraseña"
                          className="w-full pl-9 pr-10 py-2 bg-white border border-[#8A8F98] rounded-xl text-xs font-medium text-[#070707] outline-none focus:border-[#B8F23A]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-3 text-[#858A82] hover:text-[#070707]"
                        >
                          {showLoginPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={isLoggingIn}
                      onClick={() => handleInlineLogin()}
                      className="px-4 py-2 bg-[#070707] hover:bg-[#242424] text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {isLoggingIn ? <Loader2 size={13} className="animate-spin" /> : <LogIn size={13} />}
                      <span>Iniciar Sesión</span>
                    </button>
                  </div>
                </div>
              )}

              {customerUser && (
                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-xs font-semibold text-[#070707] block mb-1">Titular de la Cuenta</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 text-[#858A82]" size={15} />
                      <input
                        type="text"
                        disabled
                        value={customerUser.name}
                        className="w-full pl-9 pr-3 py-2.5 bg-[#F7F8F0] border border-[#8A8F98] rounded-xl text-xs font-medium text-[#555A52]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#070707] block mb-1">Correo Electrónico Registrado</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-[#858A82]" size={15} />
                      <input
                        type="email"
                        disabled
                        value={customerUser.email}
                        className="w-full pl-9 pr-3 py-2.5 bg-[#F7F8F0] border border-[#8A8F98] rounded-xl text-xs font-medium text-[#555A52]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* DOMAIN ICANN REGISTRANT SECTION (Optional at checkout or editable post-purchase in Mi Panel) */}
            {cart.some((c) => c.type === 'DOMAIN') && (
              <div className="p-4 bg-[#F8F9F3] border border-[#8A8F98] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#B8F23A] flex items-center gap-1.5">
                    <User size={14} className="text-[#B8F23A]" />
                    <span>Datos de Contacto de Registrador ICANN para Dominios</span>
                  </h4>
                  <span className="text-[10px] font-black uppercase bg-[#B8F23A] text-[#070707] px-2 py-0.5 rounded-full border border-[#B8F23A]">
                    Flexible
                  </span>
                </div>

                {/* Transfer items EPP verified indicator */}
                {cart.some((c) => c.type === 'DOMAIN' && c.addons?.isTransfer) && (
                  <div className="p-3 bg-white border border-[#B8F23A] rounded-xl flex items-center gap-2 text-xs text-[#B8F23A]">
                    <CheckCircle2 size={16} className="text-[#B8F23A] shrink-0" />
                    <div>
                      <strong>Clave de Transferencia (EPP) verificada:</strong> Los dominios a transferir fueron validados correctamente con su código de autorización.
                    </div>
                  </div>
                )}

                <p className="text-xs text-[#555A52]">
                  ¿Cuándo prefieres completar o actualizar los datos de titularidad oficial de tus dominios?
                </p>

                <div className="grid sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegistrantTiming('LATER')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      registrantTiming === 'LATER'
                        ? 'bg-white border-[#B8F23A] ring-1 ring-[#B8F23A]/20 shadow-2xs'
                        : 'bg-[#F7F8F0] border-[#8A8F98] text-[#555A52] hover:text-[#070707]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#070707]">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${registrantTiming === 'LATER' ? 'border-[#B8F23A]' : 'border-[#858A82]'}`}>
                        {registrantTiming === 'LATER' && <div className="w-2 h-2 rounded-full bg-[#B8F23A]" />}
                      </div>
                      <span>Completar después en Mi Panel</span>
                    </div>
                    <p className="text-[10px] text-[#555A52] mt-1 pl-5">
                      <strong>Recomendado para compra rápida.</strong> Se usarán los datos de tu cuenta y podrás cambiarlos cuando gustes desde tu panel.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegistrantTiming('NOW')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      registrantTiming === 'NOW'
                        ? 'bg-white border-[#B8F23A] ring-1 ring-[#B8F23A]/20 shadow-2xs'
                        : 'bg-[#F7F8F0] border-[#8A8F98] text-[#555A52] hover:text-[#070707]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#070707]">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${registrantTiming === 'NOW' ? 'border-[#B8F23A]' : 'border-[#858A82]'}`}>
                        {registrantTiming === 'NOW' && <div className="w-2 h-2 rounded-full bg-[#B8F23A]" />}
                      </div>
                      <span>Completar datos ahora</span>
                    </div>
                    <p className="text-[10px] text-[#555A52] mt-1 pl-5">
                      Ingresar dirección postal, teléfono de contacto y RFC/Tax ID en este momento.
                    </p>
                  </button>
                </div>

                {/* Expanded Fields if user chooses NOW */}
                {registrantTiming === 'NOW' && (
                  <div className="pt-3 border-t border-[#8A8F98] grid sm:grid-cols-2 gap-3 animate-in fade-in">
                    <div>
                      <label className="text-[11px] font-semibold text-[#555A52] block mb-1">Teléfono</label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="Número de teléfono de contacto"
                        className="w-full px-3 py-2 bg-white border border-[#8A8F98] rounded-xl text-xs font-medium text-[#070707] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#555A52] block mb-1">RFC / Tax ID</label>
                      <input
                        type="text"
                        value={regTaxId}
                        onChange={(e) => setRegTaxId(e.target.value)}
                        placeholder="AAAA000000XXX"
                        className="w-full px-3 py-2 bg-white border border-[#8A8F98] rounded-xl text-xs font-medium text-[#070707] outline-none uppercase"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-[#555A52] block mb-1">Dirección Postal</label>
                      <input
                        type="text"
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        placeholder="Calle, Número y Colonia"
                        className="w-full px-3 py-2 bg-white border border-[#8A8F98] rounded-xl text-xs font-medium text-[#070707] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#555A52] block mb-1">Ciudad y Estado</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={regCity}
                          onChange={(e) => setRegCity(e.target.value)}
                          placeholder="Ciudad"
                          className="w-full px-2.5 py-2 bg-white border border-[#8A8F98] rounded-xl text-xs font-medium text-[#070707] outline-none"
                        />
                        <input
                          type="text"
                          value={regState}
                          onChange={(e) => setRegState(e.target.value)}
                          placeholder="Estado"
                          className="w-full px-2.5 py-2 bg-white border border-[#8A8F98] rounded-xl text-xs font-medium text-[#070707] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#555A52] block mb-1">Código Postal</label>
                      <input
                        type="text"
                        value={regPostalCode}
                        onChange={(e) => setRegPostalCode(e.target.value)}
                        placeholder="03900"
                        className="w-full px-3 py-2 bg-white border border-[#8A8F98] rounded-xl text-xs font-medium text-[#070707] outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Method Selector (Stripe, PayPal, OXXO Pay) */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-[#B8F23A] mb-3">
                3. Selecciona tu Forma de Pago
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {/* 1. Stripe Card */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('STRIPE_CARD')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                    paymentMethod === 'STRIPE_CARD'
                      ? 'border-[#B8F23A] bg-[#F7F8F0] ring-1 ring-[#B8F23A]/30'
                      : 'border-[#8A8F98] bg-[#FCFCF8] hover:border-[#B8F23A]/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <CreditCard size={20} className={paymentMethod === 'STRIPE_CARD' ? 'text-[#B8F23A]' : 'text-[#858A82]'} />
                    <div className="w-3.5 h-3.5 rounded-full border border-[#B8F23A] flex items-center justify-center">
                      {paymentMethod === 'STRIPE_CARD' && <div className="w-2 h-2 rounded-full bg-[#B8F23A]"></div>}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#070707] block">Tarjeta Crédito/Débito</span>
                    <span className="text-[10px] text-[#555A52]">Stripe PCI-DSS Nivel 1</span>
                  </div>
                </button>

                {/* 2. PayPal */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('PAYPAL')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                    paymentMethod === 'PAYPAL'
                      ? 'border-[#B8F23A] bg-[#F7F8F0] ring-1 ring-[#B8F23A]/30'
                      : 'border-[#8A8F98] bg-[#FCFCF8] hover:border-[#B8F23A]/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-black text-[#003087] text-sm italic tracking-tight">PayPal</span>
                    <div className="w-3.5 h-3.5 rounded-full border border-[#B8F23A] flex items-center justify-center">
                      {paymentMethod === 'PAYPAL' && <div className="w-2 h-2 rounded-full bg-[#B8F23A]"></div>}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#070707] block">PayPal Express</span>
                    <span className="text-[10px] text-[#555A52]">Saldo o Cuenta Bancaria</span>
                  </div>
                </button>

                {/* 3. OXXO Pay */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('OXXO_PAY')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                    paymentMethod === 'OXXO_PAY'
                      ? 'border-[#DE1E28] bg-[#FFF5F5] ring-1 ring-[#DE1E28]/30'
                      : 'border-[#8A8F98] bg-[#FCFCF8] hover:border-[#DE1E28]/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-black text-[#DE1E28] text-sm tracking-wider uppercase bg-[#FFE500] px-1.5 py-0.5 rounded font-mono">OXXO</span>
                    <div className="w-3.5 h-3.5 rounded-full border border-[#DE1E28] flex items-center justify-center">
                      {paymentMethod === 'OXXO_PAY' && <div className="w-2 h-2 rounded-full bg-[#DE1E28]"></div>}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#070707] block">OXXO Pay (Efectivo)</span>
                    <span className="text-[10px] text-[#555A52]">Pago en +20,000 Tiendas MX</span>
                  </div>
                </button>
              </div>

              {/* Form Views Depending on Active Method */}
              {paymentMethod === 'STRIPE_CARD' && (
                <div className="bg-[#FCFCF8] p-4 rounded-2xl border border-[#8A8F98] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-[#555A52]">Datos de la Tarjeta</label>
                    <div className="flex gap-1 text-[10px] font-bold text-[#858A82]">
                      <span className="bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#8A8F98]">VISA</span>
                      <span className="bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#8A8F98]">MasterCard</span>
                      <span className="bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#8A8F98]">AMEX</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-3 py-2.5 bg-[#FFFFFF] border border-[#8A8F98] rounded-xl text-xs font-mono font-bold text-[#070707] outline-none focus:border-[#B8F23A]"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-[#555A52] block mb-1">Expiración (MM/AA)</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/AA"
                        className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#8A8F98] rounded-xl text-xs font-mono font-bold text-[#070707] outline-none focus:border-[#B8F23A]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#555A52] block mb-1">CVC / CVV</label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="123"
                        className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#8A8F98] rounded-xl text-xs font-mono font-bold text-[#070707] outline-none focus:border-[#B8F23A]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'PAYPAL' && (
                <div className="bg-[#F4F7FC] p-4 rounded-2xl border border-[#D0DFFA] text-xs space-y-2">
                  <div className="flex items-center gap-2 text-[#003087] font-bold">
                    <span>Pago Rápido con Cuenta PayPal</span>
                  </div>
                  <p className="text-[#555A52] text-[11px]">
                    Al hacer clic en el botón inferior se procesará el cargo seguro a través de la pasarela oficial de PayPal.
                  </p>
                </div>
              )}

              {paymentMethod === 'OXXO_PAY' && (
                <div className="bg-[#FFFDF5] p-4 rounded-2xl border border-[#FFE8A3] text-xs space-y-2">
                  <div className="flex items-center gap-2 text-[#8F6B00] font-bold">
                    <Store size={16} />
                    <span>Ficha Digital de Pago en Efectivo</span>
                  </div>
                  <p className="text-[#555A52] text-[11px]">
                    Se generará una referencia de 14 dígitos con código de barras para que pagues en cualquier OXXO de México. Tendrás 48 horas para liquidar.
                  </p>
                </div>
              )}
            </div>
            </div>

            <div className="lg:sticky lg:top-6 space-y-6">
            {/* Order Summary Recap */}
            <div className="bg-[#F7F8F0] text-[#070707] p-4 rounded-2xl space-y-2 text-xs border border-[#8A8F98]">
              <div className="flex justify-between text-[#555A52]">
                <span>Servicios a Contratar ({cart.length}):</span>
                <span className="font-semibold text-[#070707] truncate max-w-[280px]">{cart.map((c) => c.name).join(', ')}</span>
              </div>
              <div className="flex justify-between text-[#555A52]">
                <span>Subtotal:</span>
                <span>{formatMoney(cartSubtotalUSD, currency)}</span>
              </div>
              {promoDiscountUSD > 0 && (
                <div className="flex justify-between text-[#B8F23A]">
                  <span>Descuento Cupón:</span>
                  <span>-{(promoDiscountUSD * 100).toFixed(0)}%</span>
                </div>
              )}
              <div className="flex justify-between text-[#555A52]">
                <span>Impuestos ({countryCode}):</span>
                <span>{formatMoney(cartTaxUSD, currency)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-[#070707] pt-2 border-t border-[#8A8F98]">
                <span>Total a Pagar:</span>
                <span className="text-[#B8F23A] text-base">
                  {paymentMethod === 'OXXO_PAY'
                    ? `$${totalInMXN.toLocaleString()} MXN`
                    : formatMoney(cartTotalUSD, currency)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                paymentMethod === 'OXXO_PAY'
                  ? 'bg-[#FFE500] hover:bg-[#FADC00] text-[#070707]'
                  : 'bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707]'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : paymentMethod === 'OXXO_PAY' ? (
                <>
                  <Store size={18} />
                  <span>Generar Ficha OXXO Pay (${totalInMXN.toLocaleString()} MXN)</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Pagar Ahora ({formatMoney(cartTotalUSD, currency)})</span>
                </>
              )}
            </button>
            </div>
          </form>
        )}

        {/* STEP: OXXO VOUCHER DISPLAY */}
        {step === 'OXXO_VOUCHER' && oxxoVoucher && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-[#DE1E28] text-white p-4 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="bg-[#FFE500] text-[#070707] font-black text-base px-2 py-0.5 rounded font-mono">
                  OXXO
                </div>
                <div>
                  <h4 className="font-bold text-sm">Ficha de Pago en Efectivo</h4>
                  <p className="text-[11px] text-white/80">Válido en cualquier sucursal OXXO de México</p>
                </div>
              </div>
              <span className="text-sm font-black bg-white/10 px-3 py-1 rounded-xl">
                ${oxxoVoucher.amountMXN.toLocaleString()} MXN
              </span>
            </div>

            {/* Reference & Barcode Box */}
            <div className="bg-[#FCFCF8] border border-[#8A8F98] rounded-2xl p-6 text-center space-y-4 shadow-xs">
              <div>
                <span className="text-[11px] text-[#555A52] uppercase font-bold tracking-wider">
                  Referencia de Pago (14 Dígitos)
                </span>
                <div className="flex items-center justify-center gap-3 mt-1">
                  <span className="text-xl sm:text-2xl font-mono font-black text-[#070707] tracking-widest bg-[#F7F8F0] px-4 py-2 rounded-xl border border-[#8A8F98]">
                    {oxxoVoucher.formattedReference}
                  </span>
                  <button
                    onClick={() => copyToClipboard(oxxoVoucher.reference)}
                    className="p-2.5 bg-[#FFFFFF] hover:bg-[#F7F8F0] border border-[#8A8F98] rounded-xl text-[#070707] cursor-pointer transition-colors"
                    title="Copiar Referencia"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              {/* Simulated High-Contrast Barcode Visualizer */}
              <div className="bg-white p-4 rounded-xl border border-[#8A8F98] inline-block mx-auto max-w-full">
                <div className="flex items-center justify-center gap-0.5 h-14 px-4">
                  {[4,2,6,1,3,5,2,4,7,2,1,6,3,2,5,4,2,7,1,3,4,6,2,5,3,1,7,4,2,6,3,5,2].map((w, idx) => (
                    <div
                      key={idx}
                      className="bg-black h-full"
                      style={{ width: `${w * 1.5}px` }}
                    ></div>
                  ))}
                </div>
                <div className="font-mono text-[11px] text-[#555A52] tracking-widest mt-1">
                  {oxxoVoucher.reference}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-[#858A82]">
                <Clock size={14} className="text-[#DE1E28]" />
                <span>Expira el: <b>{new Date(oxxoVoucher.expiresAt).toLocaleDateString()} a las {new Date(oxxoVoucher.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b></span>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2 text-xs">
              <h5 className="font-bold text-[#070707]">Instrucciones para pagar en caja:</h5>
              <ol className="list-decimal list-inside space-y-1 text-[#555A52]">
                {oxxoVoucher.instructions.map((inst, i) => (
                  <li key={i}>{inst}</li>
                ))}
              </ol>
            </div>

            {/* Action buttons: print / verify real payment status */}
            <div className="pt-2 border-t border-[#8A8F98] flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-[#FFFFFF] hover:bg-[#F7F8F0] border border-[#8A8F98] text-[#070707] rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={15} />
                <span>Imprimir Ficha</span>
              </button>

              <button
                onClick={handleVerifyPayment}
                disabled={isVerifyingPayment}
                className="flex-1 py-3 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60"
              >
                {isVerifyingPayment ? <Loader2 className="animate-spin" size={15} /> : <RefreshCw size={15} />}
                <span>Verificar estado del pago (OXXO)</span>
              </button>
            </div>
            <p className="text-[11px] text-[#858A82] text-center">
              Tus servicios se activarán automáticamente cuando OXXO confirme la recepción del pago en efectivo. No hay pago simulado: la confirmación la envía el proveedor.
            </p>
          </div>
        )}

        {/* STEP: PAYMENT PENDING (started but NOT confirmed by the gateway) */}
        {step === 'PAYMENT_PENDING' && (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-[#FFF7E6] text-[#B7791F] border border-[#F3D9A4] rounded-full flex items-center justify-center mx-auto">
              <Clock size={32} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-[#FFF7E6] text-[#B7791F] border border-[#F3D9A4] px-3 py-1 rounded-full">
                Pago iniciado — pendiente de confirmación
              </span>
              <h3 className="text-2xl font-black text-[#070707] mt-3">
                Tu pago aún no está confirmado
              </h3>
              <p className="text-xs text-[#555A52] mt-1 max-w-md mx-auto">{paymentNotice}</p>
            </div>

            <div className="bg-[#F7F8F0] border border-[#8A8F98] rounded-2xl p-4 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#555A52]">Método de pago:</span>
                <span className="font-bold">{paymentMethod === 'STRIPE_CARD' ? 'Stripe' : 'PayPal'}</span>
              </div>
              {gatewayReference && (
                <div className="flex justify-between">
                  <span className="text-[#555A52]">Referencia del proveedor:</span>
                  <span className="font-mono font-bold">{gatewayReference}</span>
                </div>
              )}
              <p className="text-[#555A52] pt-1">
                Tus servicios <b>NO se han activado</b> y tu carrito sigue guardado. Solo se aprovisionarán cuando el proveedor confirme el pago.
              </p>
            </div>

            {paymentMethod === 'PAYPAL' && paypalApproveUrl && (
              <button
                onClick={handleOpenPaypal}
                className="w-full py-3 bg-[#003087] hover:bg-[#003087]/90 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                Abrir PayPal para Aprobar el Pago
              </button>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleVerifyPayment}
                disabled={isVerifyingPayment}
                className="flex-1 py-3 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
              >
                {isVerifyingPayment ? <Loader2 className="animate-spin" size={15} /> : <RefreshCw size={15} />}
                <span>
                  {paymentMethod === 'STRIPE_CARD' ? 'Verificar estado del pago (Stripe)' : 'Confirmar pago con PayPal'}
                </span>
              </button>
              <button
                onClick={() => { setIsCheckoutOpen(false); }}
                className="flex-1 py-3 bg-[#FFFFFF] hover:bg-[#F7F8F0] border border-[#8A8F98] text-[#070707] rounded-xl font-bold text-xs cursor-pointer"
              >
                Volver a mi carrito (guardado)
              </button>
            </div>
          </div>
        )}

        {/* STEP: PAYMENT FAILED (no credentials / error / no confirmation) */}
        {step === 'PAYMENT_FAILED' && (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-[#FDE8E8] text-[#C0392B] border border-[#F2C6C6] rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-[#FDE8E8] text-[#C0392B] border border-[#F2C6C6] px-3 py-1 rounded-full">
                Pago no confirmado
              </span>
              <h3 className="text-2xl font-black text-[#070707] mt-3">
                No se pudo confirmar el pago
              </h3>
              <p className="text-xs text-[#555A52] mt-1 max-w-md mx-auto">{paymentNotice}</p>
            </div>
            <p className="text-[11px] text-[#858A82] max-w-md mx-auto">
              Ningún servicio fue aprovisionado y tu carrito está intacto. No se ha cargado ningún importe.
            </p>
            <button
              onClick={() => { setStep('PAYMENT'); }}
              className="w-full py-3 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              Reintentar con otro método
            </button>
          </div>
        )}

        {/* STEP 2: LIVE PROVISIONING QUEUE LOGS */}
        {step === 'PROVISIONING' && (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-[#F7F8F0] border border-[#8A8F98] text-[#B8F23A] rounded-full flex items-center justify-center mx-auto animate-spin">
              <Loader2 size={32} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-[#070707]">Procesando solicitud de pago...</h4>
              <p className="text-xs text-[#555A52] mt-1">
                Estamos contactando al proveedor de pago. Los servicios se aprovisionarán solo cuando el proveedor confirme la transacción.
              </p>
            </div>

            <div className="bg-[#070707] border border-[#242424] text-left p-4 rounded-2xl font-mono text-xs text-[#B8F23A] space-y-1.5 shadow-inner">
              {provisionLogs.map((log, idx) => (
                <div key={idx}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS & INVOICE DOWNLOAD */}
        {step === 'SUCCESS' && completedOrder && (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-[#B8F23A] text-[#070707] border border-[#B8F23A] rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-[#B8F23A] text-[#070707] border border-[#B8F23A] px-3 py-1 rounded-full">
                ¡Orden Creada!
              </span>
              <h3 className="text-2xl font-black text-[#070707] mt-3">
                Tu orden fue registrada correctamente
              </h3>
              <p className="text-xs text-[#555A52] mt-1 max-w-md mx-auto">
                Tu orden {completedOrder.id} está pendiente de confirmación de pago. Tus servicios se activarán en cuanto el proveedor confirme la transacción.
              </p>
            </div>

            {/* Invoice Recap Box */}
            <div className="bg-[#F7F8F0] border border-[#8A8F98] rounded-2xl p-4 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-[#555A52]">N° de Orden:</span>
                <span className="font-mono font-bold text-[#070707]">{completedOrder.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#555A52]">Método de Pago:</span>
                <span className="font-bold text-[#070707]">
                  {completedOrder.paymentMethod === 'STRIPE_CARD' ? 'Tarjeta (Stripe)' : completedOrder.paymentMethod === 'PAYPAL' ? 'PayPal Checkout' : 'OXXO Pay Efectivo'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#555A52]">Fecha de la Orden:</span>
                <span className="font-semibold text-[#070707]">{new Date(completedOrder.date).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#555A52]">Total de la Orden:</span>
                <span className="font-bold text-[#B8F23A]">
                  {completedOrder.paymentMethod === 'OXXO_PAY'
                    ? `$${totalInMXN.toLocaleString()} MXN`
                    : formatMoney(completedOrder.totalUSD, currency)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownloadInvoice}
                className="flex-1 py-3.5 bg-[#FFFFFF] hover:bg-[#F7F8F0] border border-[#8A8F98] hover:border-[#B8F23A] text-[#070707] rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
              >
                <FileText size={16} />
                <span>Descargar Factura PDF Legal</span>
              </button>

              <button
                onClick={() => {
                  setIsCheckoutOpen(false);
                  setRole('CUSTOMER');
                }}
                className="flex-1 py-3.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <span>Ir a Administrar en Mi Panel</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
