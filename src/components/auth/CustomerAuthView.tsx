import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Mail, User, Phone, Building, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import TwoFactorModal from './TwoFactorModal';

interface CustomerAuthViewProps {
  onCancel?: () => void;
  defaultTab?: 'LOGIN' | 'REGISTER';
}

export default function CustomerAuthView({ onCancel, defaultTab = 'LOGIN' }: CustomerAuthViewProps) {
  const {
    loginCustomer,
    registerCustomer,
    pendingTwoFactorAuth,
    cancelTwoFactorLogin,
    setRole,
    language
  } = useApp();
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>(defaultTab);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [resetStep, setResetStep] = useState<'EMAIL' | 'CODE'>('EMAIL');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginEmail.trim()) {
      setErrorMsg(language === 'en' ? 'Please enter your email.' : 'Por favor ingresa tu correo electrónico.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg(language === 'en' ? 'Please enter your password.' : 'Por favor ingresa tu contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      await loginCustomer(loginEmail, loginPassword);
    } catch {
      setErrorMsg(language === 'en' ? 'Authentication failed.' : 'Error al autenticar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetEmail.trim()) {
      setResetError(language === 'en'
        ? 'Please enter your email address.'
        : 'Por favor ingresa tu correo electrónico.');
      return;
    }

    setResetLoading(true);

    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: resetEmail.trim().toLowerCase(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setResetError(
          result.error ||
          (language === 'en'
            ? 'Unable to send the recovery code.'
            : 'No se pudo enviar el código de recuperación.')
        );
        return;
      }

      setResetStep('CODE');
      setResetSuccess(language === 'en'
        ? 'If the email is registered, a recovery code has been sent.'
        : 'Si el correo está registrado, recibirás un código de recuperación.');
    } catch {
      setResetError(language === 'en'
        ? 'Unable to connect to the server.'
        : 'No se pudo conectar con el servidor.');
    } finally {
      setResetLoading(false);
    }
  };

  const handlePasswordResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!/^\d{6}$/.test(resetCode.trim())) {
      setResetError(language === 'en'
        ? 'The recovery code must contain 6 digits.'
        : 'El código de recuperación debe contener 6 dígitos.');
      return;
    }

    if (resetPassword.length < 8) {
      setResetError(language === 'en'
        ? 'The new password must contain at least 8 characters.'
        : 'La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (resetPassword !== resetPasswordConfirm) {
      setResetError(language === 'en'
        ? 'The passwords do not match.'
        : 'Las contraseñas no coinciden.');
      return;
    }

    setResetLoading(true);

    try {
      const response = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: resetEmail.trim().toLowerCase(),
          code: resetCode.trim(),
          password: resetPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setResetError(
          result.error ||
          (language === 'en'
            ? 'Unable to reset the password.'
            : 'No se pudo restablecer la contraseña.')
        );
        return;
      }

      setResetSuccess(language === 'en'
        ? 'Password changed successfully. You can now sign in.'
        : 'Contraseña cambiada correctamente. Ya puedes iniciar sesión.');

      setResetCode('');
      setResetPassword('');
      setResetPasswordConfirm('');
    } catch {
      setResetError(language === 'en'
        ? 'Unable to connect to the server.'
        : 'No se pudo conectar con el servidor.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!regName.trim() || !regEmail.trim()) {
      setErrorMsg(language === 'en' ? 'Please fill in all required fields.' : 'Por favor completa todos los campos requeridos.');
      return;
    }
    if (!acceptTerms) {
      setErrorMsg(language === 'en' ? 'You must accept the terms of service.' : 'Debes aceptar los términos y condiciones.');
      return;
    }

    setIsLoading(true);
    try {
      await registerCustomer({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        company: regCompany.trim(),
        password: regPassword
      });
    } catch {
      setErrorMsg(language === 'en' ? 'Registration failed.' : 'Error al registrar la cuenta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#FCFCF8] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-md">
        
        {/* Header Branding */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8F23A] text-[#070707] text-xs font-bold border border-[#B8F23A] mb-2">
            <ShieldCheck size={14} className="text-[#B8F23A]" />
            <span>{language === 'en' ? 'Client Portal Access' : 'Portal de Clientes Banelio'}</span>
          </div>
          <h1 className="text-3xl font-black text-[#070707] tracking-tight">
            {tab === 'LOGIN' 
              ? (language === 'en' ? 'Sign In to Your Panel' : 'Iniciar Sesión en Mi Panel')
              : (language === 'en' ? 'Create Client Account' : 'Crear Cuenta de Cliente')}
          </h1>
          <p className="text-xs text-[#555A52]">
            {tab === 'LOGIN'
              ? (language === 'en' ? 'Manage your domains, NVMe hosting, SSL certificates and DNS zones.' : 'Administra tus dominios, hosting NVMe, certificados SSL y registros DNS.')
              : (language === 'en' ? 'Instant activation with full control and 99.9% uptime SLA.' : 'Activación inmediata con control total y garantía SLA 99.9%.')}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#8A8F98] shadow-xl relative overflow-hidden">
          
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#F7F8F0] rounded-2xl mb-6 text-xs font-black">
            <button
              id="customer-tab-login"
              type="button"
              onClick={() => { setTab('LOGIN'); setErrorMsg(''); }}
              className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                tab === 'LOGIN'
                  ? 'bg-white text-[#070707] shadow-sm'
                  : 'text-[#555A52] hover:text-[#070707]'
              }`}
            >
              {language === 'en' ? 'Sign In' : 'Iniciar Sesión'}
            </button>
            <button
              id="customer-tab-register"
              type="button"
              onClick={() => { setTab('REGISTER'); setErrorMsg(''); }}
              className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                tab === 'REGISTER'
                  ? 'bg-white text-[#070707] shadow-sm'
                  : 'text-[#555A52] hover:text-[#070707]'
              }`}
            >
              {language === 'en' ? 'Register' : 'Crear Cuenta'}
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {showPasswordReset ? (
            <div className="space-y-5">
              <div className="text-center">
                <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-[#B8F23A] flex items-center justify-center">
                  <KeyRound size={22} className="text-[#B8F23A]" />
                </div>
                <h2 className="text-lg font-black text-[#070707]">
                  {language === 'en' ? 'Recover Password' : 'Recuperar Contraseña'}
                </h2>
                <p className="mt-1 text-xs text-[#555A52]">
                  {resetStep === 'EMAIL'
                    ? (language === 'en'
                      ? 'Enter your email to receive a recovery code.'
                      : 'Ingresa tu correo para recibir un código de recuperación.')
                    : (language === 'en'
                      ? 'Enter the 6-digit code and your new password.'
                      : 'Ingresa el código de 6 dígitos y tu nueva contraseña.')}
                </p>
              </div>

              {resetError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-red-700">
                  <AlertCircle size={16} className="shrink-0 text-red-500" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="p-3.5 bg-[#F7F8F0] border border-[#B8F23A] rounded-2xl flex items-center gap-2.5 text-xs text-[#B8F23A]">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              {resetStep === 'EMAIL' ? (
                <form onSubmit={handlePasswordResetRequest} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#070707] block">
                      {language === 'en' ? 'Email Address' : 'Correo Electrónico'}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858A82] w-4 h-4" />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="ejemplo@miempresa.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] font-medium focus:ring-2 focus:ring-[#B8F23A] focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {resetLoading
                      ? (language === 'en' ? 'Sending...' : 'Enviando...')
                      : (language === 'en' ? 'Send Recovery Code' : 'Enviar Código de Recuperación')}
                    {!resetLoading && <ArrowRight size={16} />}
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePasswordResetConfirm} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#070707] block">
                      {language === 'en' ? '6-Digit Code' : 'Código de 6 Dígitos'}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      required
                      value={resetCode}
                      onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setResetCode(value === '000000' ? '' : value.slice(0, 6));
                  }}
                      placeholder="123456"
                      className="w-full px-4 py-2.5 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] font-medium tracking-[0.3em] text-center focus:ring-2 focus:ring-[#B8F23A] focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#070707] block">
                      {language === 'en' ? 'New Password' : 'Nueva Contraseña'}
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full px-4 py-2.5 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] font-medium focus:ring-2 focus:ring-[#B8F23A] focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#070707] block">
                      {language === 'en' ? 'Confirm New Password' : 'Confirmar Nueva Contraseña'}
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={resetPasswordConfirm}
                      onChange={(e) => setResetPasswordConfirm(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="w-full px-4 py-2.5 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] font-medium focus:ring-2 focus:ring-[#B8F23A] focus:outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {resetLoading
                      ? (language === 'en' ? 'Updating...' : 'Actualizando...')
                      : (language === 'en' ? 'Change Password' : 'Cambiar Contraseña')}
                    {!resetLoading && <CheckCircle2 size={16} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setResetStep('EMAIL');
                      setResetCode('');
                      setResetPassword('');
                      setResetPasswordConfirm('');
                      setResetError('');
                      setResetSuccess('');
                    }}
                    className="w-full text-xs font-bold text-[#555A52] hover:text-[#070707] cursor-pointer"
                  >
                    {language === 'en' ? 'Use another email' : 'Usar otro correo'}
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowPasswordReset(false);
                  setResetError('');
                  setResetSuccess('');
                }}
                className="w-full text-xs font-bold text-[#555A52] hover:text-[#070707] cursor-pointer"
              >
                {language === 'en' ? '← Back to Sign In' : '← Volver a Iniciar Sesión'}
              </button>
            </div>
          ) : tab === 'LOGIN' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#070707] block">
                  {language === 'en' ? 'Email Address' : 'Correo Electrónico'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858A82] w-4 h-4" />
                  <input
                    id="customer-login-email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ejemplo@miempresa.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] font-medium focus:ring-2 focus:ring-[#B8F23A] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#070707] block">
                    {language === 'en' ? 'Password' : 'Contraseña'}
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858A82] w-4 h-4" />
                  <input
                    id="customer-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] font-medium focus:ring-2 focus:ring-[#B8F23A] focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#858A82] hover:text-[#070707]"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[#555A52]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#8A8F98] text-[#B8F23A] focus:ring-[#B8F23A]"
                  />
                  <span>{language === 'en' ? 'Remember session' : 'Recordar sesión'}</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordReset(true);
                    setResetEmail(loginEmail);
                    setResetError('');
                    setResetSuccess('');
                    setResetStep('EMAIL');
                  }}
                  className="text-[#B8F23A] font-bold hover:underline cursor-pointer"
                >
                  {language === 'en' ? 'Forgot password?' : '¿Olvidaste tu contraseña?'}
                </button>
              </div>

              <button
                id="customer-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>{language === 'en' ? 'Verifying...' : 'Accediendo...'}</span>
                ) : (
                  <>
                    <span>{language === 'en' ? 'Sign In to My Panel' : 'Ingresar a Mi Panel'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#070707] block">
                  {language === 'en' ? 'Full Name' : 'Nombre Completo'} *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858A82] w-4 h-4" />
                  <input
                    id="customer-reg-name"
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Carlos Santana"
                    className="w-full pl-10 pr-4 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] font-medium focus:ring-2 focus:ring-[#B8F23A] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#070707] block">
                  {language === 'en' ? 'Corporate Email' : 'Correo Electrónico'} *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858A82] w-4 h-4" />
                  <input
                    id="customer-reg-email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="carlos@miempresa.com"
                    className="w-full pl-10 pr-4 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] font-medium focus:ring-2 focus:ring-[#B8F23A] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#070707] block">
                    {language === 'en' ? 'Company' : 'Empresa'}
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858A82] w-4 h-4" />
                    <input
                      id="customer-reg-company"
                      type="text"
                      value={regCompany}
                      onChange={(e) => setRegCompany(e.target.value)}
                      placeholder="Tech Inc"
                      className="w-full pl-10 pr-3 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] font-medium focus:ring-2 focus:ring-[#B8F23A] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#070707] block">
                    {language === 'en' ? 'Phone' : 'Teléfono'}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858A82] w-4 h-4" />
                    <input
                      id="customer-reg-phone"
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="Número de teléfono de contacto"
                      className="w-full pl-10 pr-3 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] font-medium focus:ring-2 focus:ring-[#B8F23A] focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#070707] block">
                  {language === 'en' ? 'Secure Password' : 'Contraseña Segura'} *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858A82] w-4 h-4" />
                  <input
                    id="customer-reg-password"
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-10 pr-4 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] font-medium focus:ring-2 focus:ring-[#B8F23A] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer text-[11px] text-[#555A52] pt-1">
                <input
                  type="checkbox"
                  required
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 rounded border-[#8A8F98] text-[#B8F23A] focus:ring-[#B8F23A]"
                />
                <span>
                  {language === 'en' ? (
                    <>I accept the <strong className="text-[#070707]">Terms of Service</strong> and <strong className="text-[#070707]">Privacy Policy</strong>.</>
                  ) : (
                    <>Acepto los <strong className="text-[#070707]">Términos de Servicio</strong> y el <strong className="text-[#070707]">Aviso de Privacidad</strong>.</>
                  )}
                </span>
              </label>

              <button
                id="customer-reg-submit"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>{language === 'en' ? 'Creating Account...' : 'Registrando...'}</span>
                ) : (
                  <>
                    <span>{language === 'en' ? 'Create Account & Access Panel' : 'Crear Cuenta y Entrar a Mi Panel'}</span>
                    <CheckCircle2 size={16} />
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              if (onCancel) onCancel();
              else setRole('PUBLIC');
            }}
            className="text-xs font-bold text-[#555A52] hover:text-[#070707] transition-colors cursor-pointer"
          >
            &larr; {language === 'en' ? 'Return to Home & Store' : 'Volver a la página principal'}
          </button>
        </div>

      </div>

      {/* 2FA Challenge Modal */}
      {pendingTwoFactorAuth && (
        <TwoFactorModal
          isOpen={!!pendingTwoFactorAuth}
          onClose={cancelTwoFactorLogin}
          mode="CHALLENGE"
        />
      )}
    </div>
  );
}
