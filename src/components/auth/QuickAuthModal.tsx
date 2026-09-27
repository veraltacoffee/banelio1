import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  Mail,
  User,
  Phone,
  Building,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  X,
  Zap
} from 'lucide-react';

interface QuickAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
  defaultTab?: 'REGISTER' | 'LOGIN';
}

export default function QuickAuthModal({
  isOpen,
  onClose,
  onSuccess,
  title,
  subtitle,
  defaultTab = 'REGISTER'
}: QuickAuthModalProps) {
  const { loginCustomer, registerCustomer, language, addToast } = useApp();

  const [tab, setTab] = useState<'REGISTER' | 'LOGIN'>(defaultTab);

  // Quick Register State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Quick Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim()) {
      setErrorMsg(language === 'en' ? 'Please enter your name and email.' : 'Por favor ingresa tu nombre y correo.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg(language === 'en' ? 'Please enter a valid email.' : 'Por favor ingresa un correo válido.');
      return;
    }

    setIsLoading(true);
    try {
      await registerCustomer({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password
      });

      addToast({
        type: 'success',
        title: language === 'en' ? 'Account Created' : 'Cuenta de Cliente Creada',
        message: language === 'en' ? `Welcome, ${name}! Your services are ready.` : `¡Bienvenido, ${name}! Continuamos con tu pedido.`
      });

      onClose();
      if (onSuccess) onSuccess();
    } catch {
      setErrorMsg(language === 'en' ? 'Failed to create account.' : 'Error al registrar la cuenta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginEmail.trim()) {
      setErrorMsg(language === 'en' ? 'Please enter your email.' : 'Por favor ingresa tu correo.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginCustomer(loginEmail.trim(), loginPassword);
      if (res) {
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch {
      setErrorMsg(language === 'en' ? 'Invalid credentials.' : 'Credenciales inválidas.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#8A8F98] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 relative">
        
        {/* Top Header */}
        <div className="p-6 border-b border-[#8A8F98] flex items-center justify-between bg-[#FCFCF8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B8F23A] text-[#070707] flex items-center justify-center font-black shadow-xs">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="font-black text-lg text-[#070707]">
                {title || (tab === 'REGISTER'
                  ? (language === 'en' ? 'Create Client Account in 1 Step' : 'Alta Rápida de Cliente en 1 Paso')
                  : (language === 'en' ? 'Sign In to Your Account' : 'Acceso a Clientes Banelio'))}
              </h3>
              <p className="text-xs text-[#555A52]">
                {subtitle || (language === 'en'
                  ? 'Frictionless checkout with instant DNS and invoice delivery'
                  : 'Sin trámites lentos: activación instantánea y factura fiscal inmediata')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#555A52] hover:text-[#070707] p-2 rounded-xl hover:bg-[#F7F8F0] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="p-6 pb-0">
          <div className="grid grid-cols-2 p-1 bg-[#F7F8F0] rounded-2xl text-xs font-black">
            <button
              type="button"
              onClick={() => { setTab('REGISTER'); setErrorMsg(''); }}
              className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                tab === 'REGISTER'
                  ? 'bg-white text-[#070707] shadow-sm'
                  : 'text-[#555A52] hover:text-[#070707]'
              }`}
            >
              {language === 'en' ? 'New Client (Instant)' : 'Nuevo Cliente (Instantáneo)'}
            </button>
            <button
              type="button"
              onClick={() => { setTab('LOGIN'); setErrorMsg(''); }}
              className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                tab === 'LOGIN'
                  ? 'bg-white text-[#070707] shadow-sm'
                  : 'text-[#555A52] hover:text-[#070707]'
              }`}
            >
              {language === 'en' ? 'Already a Client' : 'Ya Soy Cliente'}
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle size={15} className="shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {tab === 'REGISTER' ? (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#070707] block">
                    {language === 'en' ? 'Full Name' : 'Nombre Completo'} <span className="text-[#B8F23A]">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-[#858A82]" size={14} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="ejemplo: Carlos Mendoza"
                      className="w-full pl-8 pr-3 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] outline-none focus:border-[#B8F23A]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#070707] block">
                    {language === 'en' ? 'Email Address' : 'Correo Electrónico'} <span className="text-[#B8F23A]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-[#858A82]" size={14} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="carlos@miempresa.com"
                      className="w-full pl-8 pr-3 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] outline-none focus:border-[#B8F23A]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#070707] block">
                    {language === 'en' ? 'Phone / WhatsApp' : 'Teléfono / WhatsApp'}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-[#858A82]" size={14} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Número de teléfono de contacto"
                      className="w-full pl-8 pr-3 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] outline-none focus:border-[#B8F23A]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#070707] block">
                    {language === 'en' ? 'Password' : 'Crea tu Contraseña'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-[#858A82]" size={14} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-8 pr-8 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] outline-none focus:border-[#B8F23A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-[#858A82] hover:text-[#070707] cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Instant Perks Pill */}
              <div className="bg-[#F7F8F0] p-3 rounded-2xl border border-[#8A8F98] text-[11px] text-[#B8F23A] flex items-center gap-2">
                <ShieldCheck size={16} className="shrink-0 text-[#B8F23A]" />
                <span>
                  {language === 'en'
                    ? 'Includes ICANN WHOIS Privacy Protection and 2FA authentication ready.'
                    : 'Incluye protección de privacidad WHOIS ICANN y seguridad 2FA integrada.'}
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] text-xs font-black rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                >
                  <span>{language === 'en' ? 'Create Account & Continue' : 'Crear Cuenta y Continuar'}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#070707] block">
                  {language === 'en' ? 'Email Address' : 'Correo Electrónico'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-[#858A82]" size={14} />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ejemplo@miempresa.com"
                    className="w-full pl-8 pr-3 py-2.5 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] outline-none focus:border-[#B8F23A]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#070707] block">
                  {language === 'en' ? 'Password' : 'Contraseña'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-[#858A82]" size={14} />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-8 pr-8 py-2.5 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] outline-none focus:border-[#B8F23A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-2.5 top-2.5 text-[#858A82] hover:text-[#070707] cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-[#070707] hover:bg-[#242424] text-[#FCFCF8] text-xs font-black rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                >
                  <span>{language === 'en' ? 'Sign In & Continue' : 'Iniciar Sesión y Continuar'}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
