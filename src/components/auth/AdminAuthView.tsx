import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Lock, Key, ArrowRight, AlertTriangle, Eye, EyeOff, Terminal, ShieldAlert } from 'lucide-react';

interface AdminAuthViewProps {
  onCancel?: () => void;
}

export default function AdminAuthView({ onCancel }: AdminAuthViewProps) {
  const { loginAdmin, setRole, language } = useApp();

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!adminEmail.trim() || !adminPassword) {
      setErrorMsg('Credenciales de administrador requeridas.');
      return;
    }

    setIsLoading(true);
    try {
      await loginAdmin(adminEmail, adminPassword, securityPin);
    } catch {
      setErrorMsg('Error de autenticación administrativa.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#070707] text-[#FCFCF8] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#B8F23A]/5 blur-[160px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Internal Security Badge */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B8F23A]/10 text-[#070707] text-xs font-mono font-bold border border-[#B8F23A]/30 mb-2">
            <ShieldAlert size={14} className="text-[#B8F23A]" />
            <span>ACCESO INTERNO RESTRINGIDO &bull; NIVEL 0</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            {language === 'en' ? 'Core Admin Console' : 'Consola de Administración Root'}
          </h1>
          <p className="text-xs text-[#858A82]">
            {language === 'en'
              ? 'Authorized infrastructure management and domain registrar gateway only.'
              : 'Acceso exclusivo para personal autorizado de operaciones y facturación de Banelio.'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#111111] rounded-3xl p-6 sm:p-8 border border-[#242424] shadow-2xl space-y-6">
          
          <div className="p-3 bg-[#242424] border border-[#242424] rounded-2xl flex items-start gap-2.5 text-xs text-[#B0B8A8]">
            <Terminal size={16} className="text-[#B8F23A] shrink-0 mt-0.5" />
            <span>
              Este módulo registra dirección IP de origen, geolocalización y huella criptográfica de cada inicio de sesión.
            </span>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-2xl flex items-center gap-2.5 text-xs text-red-300">
              <AlertTriangle size={16} className="shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-[#FCFCF8] block">
                ID de Operador / Admin Email
              </label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555A52] w-4 h-4" />
                <input
                  id="admin-login-email"
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#070707] border border-[#242424] rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-[#B8F23A] focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-[#FCFCF8] block">
                  Clave Maestra
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555A52] w-4 h-4" />
                <input
                  id="admin-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#070707] border border-[#242424] rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-[#B8F23A] focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555A52] hover:text-white"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-[#FCFCF8] block">
                Token 2FA / Código de Seguridad
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555A52] w-4 h-4" />
                <input
                  id="admin-login-pin"
                  type="text"
                  required
                  maxLength={6}
                  value={securityPin}
                  onChange={(e) => setSecurityPin(e.target.value)}
                  placeholder="Código de seguridad"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#070707] border border-[#242424] rounded-xl text-xs text-[#B8F23A] font-mono tracking-widest focus:ring-2 focus:ring-[#B8F23A] focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              id="admin-login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3.5 px-6 rounded-2xl bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer hover:scale-[1.01] active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Validando Certificados...</span>
              ) : (
                <>
                  <span>Desbloquear Consola Maestra</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Return Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              if (onCancel) onCancel();
              else setRole('PUBLIC');
            }}
            className="text-xs font-bold text-[#858A82] hover:text-[#FCFCF8] transition-colors cursor-pointer"
          >
            &larr; {language === 'en' ? 'Return to Main Website' : 'Salir y volver a la tienda pública'}
          </button>
        </div>

      </div>
    </div>
  );
}
