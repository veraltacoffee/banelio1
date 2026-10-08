import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, RefreshCw, Copy, Check, X, KeyRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'CHALLENGE' | 'SETUP';
  onSuccess?: () => void;
}

export default function TwoFactorModal({ isOpen, onClose, mode, onSuccess }: TwoFactorModalProps) {
  const {
    completeTwoFactorLogin,
    enableTwoFactor,
    verifyTwoFactorCode,
    language,
    addToast
  } = useApp();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  } | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  useEffect(() => {
    if (isOpen && mode === 'SETUP') {
      enableTwoFactor().then((res) => {
        setSetupData(res);
      });
    }
    if (isOpen) {
      setCode(['', '', '', '', '', '']);
      setErrorMsg('');
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setErrorMsg('');

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`2fa-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`2fa-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(paste)) {
      const digits = paste.split('');
      setCode(digits);
      const lastInput = document.getElementById(`2fa-input-5`);
      lastInput?.focus();
    }
  };

  const fullCode = code.join('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (fullCode.length !== 6) {
      setErrorMsg(language === 'en' ? 'Please enter all 6 digits.' : 'Por favor ingresa los 6 dígitos.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'CHALLENGE') {
        const success = await completeTwoFactorLogin(fullCode);
        if (success) {
          onClose();
          if (onSuccess) onSuccess();
        } else {
          setErrorMsg(language === 'en' ? 'Invalid verification code. Please try again.' : 'Código de verificación incorrecto. Intenta de nuevo.');
        }
      } else {
        const valid = await verifyTwoFactorCode(fullCode);
        if (valid) {
          addToast({
            type: 'success',
            title: language === 'en' ? '2FA Enabled' : '2FA Activado',
            message: language === 'en' ? 'Two-factor authentication is now active on your account.' : 'La autenticación de dos factores está ahora activa en tu cuenta.'
          });
          onClose();
          if (onSuccess) onSuccess();
        } else {
          setErrorMsg(language === 'en' ? 'Invalid 6-digit code. Check your authenticator app.' : 'Código de 6 dígitos inválido. Revisa tu aplicación de autenticación.');
        }
      }
    } catch {
      setErrorMsg(language === 'en' ? 'An error occurred during verification.' : 'Ocurrió un error en la verificación.');
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    if (!setupData?.secret) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const copyBackupCodes = () => {
    if (!setupData?.backupCodes) return;
    navigator.clipboard.writeText(setupData.backupCodes.join('\n'));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#8A8F98] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 relative">
        
        {/* Header */}
        <div className="p-6 border-b border-[#8A8F98] flex items-center justify-between bg-[#FCFCF8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B8F23A] text-[#070707] flex items-center justify-center border border-[#B8F23A]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-black text-lg text-[#070707]">
                {mode === 'SETUP'
                  ? (language === 'en' ? 'Set Up Two-Factor Auth (2FA)' : 'Configurar Autenticación 2FA')
                  : (language === 'en' ? 'Two-Factor Verification' : 'Verificación en Dos Pasos')}
              </h3>
              <p className="text-xs text-[#555A52]">
                {mode === 'SETUP'
                  ? (language === 'en' ? 'Enhance security with Google Authenticator or Authy' : 'Protección de grado bancario para tu panel y dominios')
                  : (language === 'en' ? 'Enter the 6-digit code from your app' : 'Ingresa el código de 6 dígitos de tu app autenticadora')}
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {mode === 'SETUP' && setupData && (
            <div className="space-y-4">
              <div className="bg-[#FCFCF8] p-4 rounded-2xl border border-[#8A8F98] flex items-center gap-4">
                <div className="w-24 h-24 bg-white p-2 rounded-xl border border-[#8A8F98] shrink-0 flex items-center justify-center shadow-xs">
                  {/* Visual QR Code Generator */}
                  <img
                    src={setupData.qrCodeUrl}
                    alt="2FA QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-1.5 text-xs text-[#555A52]">
                  <p className="font-bold text-[#070707]">
                    1. {language === 'en' ? 'Scan with Authenticator app' : 'Escanea con Google Authenticator / 1Password / Authy'}
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    {language === 'en'
                      ? 'Or enter secret key manually:'
                      : 'O introduce la clave secreta manualmente:'}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <code className="bg-[#F7F8F0] px-2 py-1 rounded-lg text-[11px] font-mono text-[#070707] select-all font-bold">
                      {setupData.secret}
                    </code>
                    <button
                      type="button"
                      onClick={copySecret}
                      className="p-1 rounded-md hover:bg-[#8A8F98] text-[#555A52] cursor-pointer transition-colors"
                      title="Copiar Clave"
                    >
                      {copiedSecret ? <Check size={14} className="text-[#B8F23A]" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Backup Codes Section */}
              <div className="bg-[#FCFCF8] p-4 rounded-2xl border border-[#8A8F98] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#070707] flex items-center gap-1.5">
                    <KeyRound size={14} className="text-[#B8F23A]" />
                    {language === 'en' ? 'Emergency Backup Codes' : 'Códigos de Respaldo de Emergencia'}
                  </span>
                  <button
                    type="button"
                    onClick={copyBackupCodes}
                    className="text-[11px] text-[#B8F23A] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedBackup ? <Check size={12} /> : <Copy size={12} />}
                    {copiedBackup ? (language === 'en' ? 'Copied' : 'Copiados') : (language === 'en' ? 'Copy Codes' : 'Copiar')}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-[#555A52] bg-white p-2 rounded-xl border border-[#8A8F98]">
                  {setupData.backupCodes.map((codeStr, idx) => (
                    <div key={idx} className="px-1.5 py-0.5 bg-[#F7F8F0] rounded text-center font-bold">
                      {codeStr}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[#858A82]">
                  {language === 'en'
                    ? 'Save these codes in a secure place. Each can be used once if you lose your phone.'
                    : 'Guarda estos códigos en un lugar seguro. Cada uno sirve 1 sola vez si pierdes tu celular.'}
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle size={15} className="shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#070707] block text-center">
                {mode === 'SETUP'
                  ? (language === 'en' ? '2. Enter the 6-digit code generated by the app to verify:' : '2. Ingresa el código de 6 dígitos que muestra tu app para confirmar:')
                  : (language === 'en' ? 'Enter 6-digit Authenticator Code:' : 'Ingresa el código de 6 dígitos de tu app:')}
              </label>

              {/* 6 Digit Input Group */}
              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`2fa-input-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-11 h-13 text-center text-xl font-mono font-black text-[#070707] bg-[#FCFCF8] border-2 border-[#8A8F98] rounded-2xl outline-none focus:border-[#B8F23A] focus:bg-white focus:ring-2 focus:ring-[#B8F23A]/50 transition-all"
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-[#8A8F98] text-xs font-bold text-[#555A52] hover:bg-[#F7F8F0] cursor-pointer transition-colors"
              >
                {language === 'en' ? 'Cancel' : 'Cancelar'}
              </button>
              <button
                type="submit"
                disabled={isLoading || fullCode.length !== 6}
                className="flex-1 py-3 px-4 rounded-xl bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <ShieldCheck size={16} />
                )}
                <span>{language === 'en' ? 'Verify & Confirm' : 'Verificar y Confirmar'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
