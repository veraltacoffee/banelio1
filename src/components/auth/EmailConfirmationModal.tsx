import React, { useEffect, useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, X, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface EmailConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EmailConfirmationModal({ isOpen, onClose, onSuccess }: EmailConfirmationModalProps) {
  const {
    customerUser,
    sendVerificationEmail,
    verifyEmailCode,
    language,
    addToast
  } = useApp();

  const [code, setCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastSentTime, setLastSentTime] = useState<number | null>(null);

  const targetEmail = customerUser?.email || '';

  useEffect(() => {
    if (!isOpen || !customerUser || customerUser.emailVerified || lastSentTime !== null) {
      return;
    }

    let cancelled = false;

    const sendInitialVerification = async () => {
      setIsSending(true);
      setErrorMsg('');

      try {
        const sent = await sendVerificationEmail();

        if (!cancelled && sent) {
          setLastSentTime(Date.now());
        }
      } catch {
        if (!cancelled) {
          setErrorMsg(
            language === 'en'
              ? 'Failed to send confirmation email.'
              : 'Error al enviar el correo de verificación.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsSending(false);
        }
      }
    };

    void sendInitialVerification();

    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    customerUser?.id,
    customerUser?.emailVerified,
    lastSentTime,
    language,
  ]);

  if (!isOpen) return null;

  const handleSendEmail = async () => {
    setIsSending(true);
    setErrorMsg('');
    try {
      await sendVerificationEmail();
      setLastSentTime(Date.now());
      addToast({
        type: 'success',
        title: language === 'en' ? 'Confirmation Email Sent' : 'Correo de Confirmación Enviado',
        message: language === 'en'
          ? `We sent a 6-digit confirmation code to ${targetEmail}`
          : `Enviamos un código de 6 dígitos a ${targetEmail}`
      });
    } catch {
      setErrorMsg(language === 'en' ? 'Failed to send confirmation email.' : 'Error al enviar el correo.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!code.trim() || code.trim().length < 4) {
      setErrorMsg(language === 'en' ? 'Please enter the verification code.' : 'Por favor ingresa el código de confirmación.');
      return;
    }

    setIsVerifying(true);
    try {
      const valid = await verifyEmailCode(code.trim());
      if (valid) {
        addToast({
          type: 'success',
          title: language === 'en' ? 'Email Verified' : 'Correo Verificado',
          message: language === 'en'
            ? 'Your email address has been verified successfully.'
            : 'Tu correo electrónico ha sido verificado correctamente.'
        });
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(language === 'en' ? 'Invalid or expired code. Try requesting a new one.' : 'Código inválido o expirado. Solicita uno nuevo.');
      }
    } catch {
      setErrorMsg(language === 'en' ? 'Verification error.' : 'Error al verificar.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#8A8F98] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 relative">
        
        {/* Header */}
        <div className="p-6 border-b border-[#8A8F98] flex items-center justify-between bg-[#FCFCF8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B8F23A] text-[#070707] flex items-center justify-center border border-[#B8F23A]">
              <Mail size={20} />
            </div>
            <div>
              <h3 className="font-black text-lg text-[#070707]">
                {language === 'en' ? 'Verify Your Email Address' : 'Confirmación de Correo Electrónico'}
              </h3>
              <p className="text-xs text-[#555A52]">
                {language === 'en' ? 'Security requirement for domain transfers & DNS ownership' : 'Requisito de seguridad ICANN para gestión y transferencia de dominios'}
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
          <div className="bg-[#FCFCF8] p-4 rounded-2xl border border-[#8A8F98] text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[#555A52]">{language === 'en' ? 'Recipient:' : 'Destinatario:'}</span>
              <span className="font-mono font-bold text-[#070707]">{targetEmail}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#8A8F98]">
              <span className="text-[#555A52]">{language === 'en' ? 'Status:' : 'Estado actual:'}</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                {language === 'en' ? 'Pending Confirmation' : 'Pendiente de Confirmación'}
              </span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-xs text-[#555A52] leading-relaxed">
              {language === 'en'
                ? 'Click below to send a security confirmation email, or enter the code if you already received it.'
                : 'Haz clic abajo para recibir tu código de seguridad o introduce el código si ya lo tienes.'}
            </p>
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={isSending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F7F8F0] hover:bg-[#8A8F98] text-[#070707] text-xs font-bold rounded-xl cursor-pointer transition-colors"
            >
              {isSending ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
              <span>
                {lastSentTime
                  ? (language === 'en' ? 'Resend Code' : 'Reenviar Código')
                  : (language === 'en' ? 'Send Confirmation Email' : 'Enviar Correo de Confirmación')}
              </span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle size={15} className="shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#070707] block">
                {language === 'en' ? 'Enter 6-Digit Verification Code:' : 'Código de Verificación (6 dígitos):'}
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="ejemplo: 749201"
                className="w-full text-center tracking-widest text-xl font-mono font-black py-3 bg-[#FCFCF8] border-2 border-[#8A8F98] rounded-2xl outline-none focus:border-[#B8F23A] focus:bg-white text-[#070707]"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-[#8A8F98] text-xs font-bold text-[#555A52] hover:bg-[#F7F8F0] cursor-pointer transition-colors"
              >
                {language === 'en' ? 'Cancel' : 'Cancelar'}
              </button>
              <button
                type="submit"
                disabled={isVerifying || code.length < 4}
                className="flex-1 py-3 px-4 rounded-xl bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                <span>{language === 'en' ? 'Verify Email' : 'Confirmar Correo'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
