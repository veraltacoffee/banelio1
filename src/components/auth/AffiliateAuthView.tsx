import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, Mail, Lock, Globe, DollarSign, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles, Percent } from 'lucide-react';

interface AffiliateAuthViewProps {
  onCancel?: () => void;
  defaultTab?: 'REGISTER' | 'LOGIN';
}

export default function AffiliateAuthView({ onCancel, defaultTab = 'REGISTER' }: AffiliateAuthViewProps) {
  const { loginAffiliate, registerAffiliate, setRole, language } = useApp();
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>(defaultTab);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regWebsite, setRegWebsite] = useState('');
  const [regPaymentMethod, setRegPaymentMethod] = useState<'PayPal' | 'Bank_SPEI'>('PayPal');
  const [regPaymentDest, setRegPaymentDest] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginEmail.trim()) {
      setErrorMsg(language === 'en' ? 'Please enter your partner email.' : 'Ingresa tu correo de afiliado.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg(language === 'en' ? 'Please enter your password.' : 'Ingresa tu contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      await loginAffiliate(loginEmail, loginPassword);
    } catch {
      setErrorMsg(language === 'en' ? 'Affiliate authentication failed.' : 'Error al autenticar afiliado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!regName.trim() || !regEmail.trim()) {
      setErrorMsg(language === 'en' ? 'Please fill in all required fields.' : 'Por favor completa los campos obligatorios.');
      return;
    }
    if (!acceptTerms) {
      setErrorMsg(language === 'en' ? 'You must accept the affiliate program terms.' : 'Debes aceptar las condiciones del programa de afiliados.');
      return;
    }

    setIsLoading(true);
    try {
      await registerAffiliate({
        name: regName.trim(),
        email: regEmail.trim(),
        website: regWebsite.trim(),
        paymentMethod: regPaymentMethod,
        paymentDest: regPaymentDest.trim() || regEmail.trim(),
        password: regPassword
      });
    } catch {
      setErrorMsg(language === 'en' ? 'Registration failed.' : 'Error al registrarte.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#FCFCF8] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-lg">
        
        {/* Header Badge */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B8F23A] text-[#070707] text-xs font-black border border-[#B8F23A] mb-2">
            <Percent size={14} className="text-[#B8F23A]" />
            <span>30% {language === 'en' ? 'Lifetime Recurring Commission' : 'Comisión Recurrente de por Vida'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#070707] tracking-tight">
            {tab === 'REGISTER' 
              ? (language === 'en' ? 'Join the Partner Network' : 'Portal de Afiliados y Partners')
              : (language === 'en' ? 'Partner Portal Sign In' : 'Iniciar Sesión de Afiliado')}
          </h1>
          <p className="text-xs sm:text-sm text-[#555A52] max-w-md mx-auto">
            {language === 'en'
              ? 'Monetize your clients and traffic with recurring payouts and real-time tracking.'
              : 'Gana comisiones continuas recomendando dominios, servidores NVMe y hosting corporativo.'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#8A8F98] shadow-xl relative overflow-hidden">
          
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#F7F8F0] rounded-2xl mb-6 text-xs font-black">
            <button
              id="affiliate-tab-register"
              type="button"
              onClick={() => { setTab('REGISTER'); setErrorMsg(''); }}
              className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                tab === 'REGISTER'
                  ? 'bg-white text-[#070707] shadow-sm'
                  : 'text-[#555A52] hover:text-[#070707]'
              }`}
            >
              {language === 'en' ? 'Join as Partner' : 'Registrarme como Afiliado'}
            </button>
            <button
              id="affiliate-tab-login"
              type="button"
              onClick={() => { setTab('LOGIN'); setErrorMsg(''); }}
              className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                tab === 'LOGIN'
                  ? 'bg-white text-[#070707] shadow-sm'
                  : 'text-[#555A52] hover:text-[#070707]'
              }`}
            >
              {language === 'en' ? 'Partner Login' : 'Iniciar Sesión'}
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {tab === 'LOGIN' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#070707] block">
                  {language === 'en' ? 'Partner Email' : 'Correo Electrónico de Afiliado'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858A82] w-4 h-4" />
                  <input
                    id="affiliate-login-email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="afiliado@tuempresa.com"
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
                    id="affiliate-login-password"
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

              <button
                id="affiliate-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-3.5 px-6 rounded-2xl bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>{language === 'en' ? 'Entering...' : 'Accediendo...'}</span>
                ) : (
                  <>
                    <span>{language === 'en' ? 'Access Affiliate Portal' : 'Acceder al Portal de Afiliados'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#070707] block">
                  {language === 'en' ? 'Full Name / Agency Name' : 'Nombre Completo o Razón Social de Agencia'} *
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858A82] w-4 h-4" />
                  <input
                    id="affiliate-reg-name"
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Agencia Creativa Digital"
                    className="w-full pl-10 pr-4 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] font-medium focus:ring-2 focus:ring-[#B8F23A] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#070707] block">
                  {language === 'en' ? 'Email Address' : 'Correo Electrónico'} *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858A82] w-4 h-4" />
                  <input
                    id="affiliate-reg-email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="afiliado@agenciadigital.com"
                    className="w-full pl-10 pr-4 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] font-medium focus:ring-2 focus:ring-[#B8F23A] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#070707] block">
                  {language === 'en' ? 'Website, Blog or Channel' : 'Sitio Web, Canal de YouTube o Red Social'}
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858A82] w-4 h-4" />
                  <input
                    id="affiliate-reg-website"
                    type="text"
                    value={regWebsite}
                    onChange={(e) => setRegWebsite(e.target.value)}
                    placeholder="https://miagencia.com"
                    className="w-full pl-10 pr-4 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] font-medium focus:ring-2 focus:ring-[#B8F23A] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#070707] block">
                    {language === 'en' ? 'Payout Method' : 'Método de Cobro'}
                  </label>
                  <select
                    id="affiliate-reg-method"
                    value={regPaymentMethod}
                    onChange={(e) => setRegPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] font-bold focus:ring-2 focus:ring-[#B8F23A] focus:outline-none"
                  >
                    <option value="PayPal">PayPal</option>
                    <option value="Bank_SPEI">Transferencia SPEI (México)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#070707] block">
                    {regPaymentMethod === 'PayPal' ? 'Email PayPal' : 'CLABE Interbancaria'}
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#858A82] w-3.5 h-3.5" />
                    <input
                      id="affiliate-reg-dest"
                      type="text"
                      value={regPaymentDest}
                      onChange={(e) => setRegPaymentDest(e.target.value)}
                      placeholder={regPaymentMethod === 'PayPal' ? 'paypal@empresa.com' : '18 dígitos CLABE'}
                      className="w-full pl-8 pr-3 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] font-medium focus:ring-2 focus:ring-[#B8F23A] focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#070707] block">
                  {language === 'en' ? 'Password' : 'Crea una Contraseña'} *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858A82] w-4 h-4" />
                  <input
                    id="affiliate-reg-password"
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
                    <>I agree to the <strong className="text-[#070707]">Partner Program Terms</strong> with 30% lifetime commissions.</>
                  ) : (
                    <>Acepto las <strong className="text-[#070707]">Bases del Programa de Afiliados</strong> con 30% de comisión recurrente de por vida.</>
                  )}
                </span>
              </label>

              <button
                id="affiliate-reg-submit"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>{language === 'en' ? 'Generating Referral Link...' : 'Activando Cuenta de Partner...'}</span>
                ) : (
                  <>
                    <span>{language === 'en' ? 'Complete Registration & Get Link' : 'Completar Registro y Obtener Enlace'}</span>
                    <Sparkles size={16} />
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
            &larr; {language === 'en' ? 'Return to Main Website' : 'Volver a la web principal'}
          </button>
        </div>

      </div>
    </div>
  );
}
