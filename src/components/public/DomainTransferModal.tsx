import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  KeyRound,
  AlertCircle,
  Lock,
  ArrowRight,
  Info,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import {
  parseDomainInput,
  submitDomainTransferToSuperSite
} from '../../services/supersiteService';

interface DomainTransferModalProps {
  domain: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DomainTransferModal({
  domain,
  isOpen,
  onClose
}: DomainTransferModalProps) {
  const { language } = useApp();

  const [inputDomain, setInputDomain] = useState<string>('');
  // Auth/EPP code kept strictly in ephemeral React memory (never localStorage, sessionStorage, URL or logs)
  const [authCode, setAuthCode] = useState<string>('');
  const [showAuthCode, setShowAuthCode] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setInputDomain(domain || '');
      setAuthCode('');
      setShowAuthCode(false);
      setValidationError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, domain]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const parsed = parseDomainInput(inputDomain);
    if (!parsed.isValid) {
      setValidationError(
        parsed.errorMessage ||
          (language === 'en'
            ? 'Please enter a valid domain name (e.g. yourcompany.com).'
            : 'Por favor ingresa un nombre de dominio válido (ej. tuempresa.com).')
      );
      return;
    }

    const trimmedAuth = authCode.trim();
    if (trimmedAuth && (trimmedAuth.length < 5 || trimmedAuth.length > 40)) {
      setValidationError(
        language === 'en'
          ? 'Auth/EPP code must be between 5 and 40 characters.'
          : 'El código Auth/EPP debe tener entre 5 y 40 caracteres.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Envío POST oficial directo a SuperSite 2
      submitDomainTransferToSuperSite({
        domainName: parsed.domainName,
        tld: parsed.tld,
        authCode: trimmedAuth || undefined,
        target: '_blank'
      });

      // Limpiar memoria y cerrar modal
      setAuthCode('');
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 500);
    } catch {
      setIsSubmitting(false);
      setValidationError(
        language === 'en'
          ? 'Could not connect with SuperSite 2 transfer gateway. Please try again.'
          : 'No se pudo conectar con la pasarela de transferencia de SuperSite 2. Por favor intenta de nuevo.'
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="relative bg-white text-[#070707] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-2 border-[#8A8F98] overflow-hidden my-6">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#B8F23A] border border-[#B8F23A] text-[#070707] rounded-full text-xs font-black mb-2 shadow-2xs">
            <RefreshCw size={13} />
            <span>{language === 'en' ? 'Domain Transfer' : 'Transferencia de Dominio'}</span>
          </div>
          <h2 id="transfer-modal-title" className="text-2xl sm:text-3xl font-black text-[#070707] tracking-tight">
            {language === 'en' ? 'Transfer to SuperSite 2' : 'Transfiere tu Dominio a Banelio'}
          </h2>
          <p className="text-xs text-[#555A52] mt-1 font-medium leading-relaxed">
            {language === 'en'
              ? 'Transfer your domain to Banelio powered by ResellerClub SuperSite 2 with official ICANN registry processing.'
              : 'Transfiere la administración de tu dominio hacia la plataforma Banelio respaldada por SuperSite 2 con gestión oficial ante el Registry.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Domain Input */}
          <div>
            <label className="block text-xs font-black text-[#070707] uppercase tracking-wider mb-1.5">
              {language === 'en' ? 'Domain Name to Transfer' : 'Nombre del Dominio a Transferir'} *
            </label>
            <input
              type="text"
              id="transfer-domain-input"
              value={inputDomain}
              onChange={(e) => {
                setInputDomain(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="ejemplo.com"
              className="w-full px-4 py-3 bg-[#F7F8F0] border-2 border-[#8A8F98] focus:border-[#B8F23A] rounded-xl text-sm font-mono font-bold text-[#070707] outline-none transition-all"
            />
          </div>

          {/* Auth/EPP Code Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black text-[#070707] uppercase tracking-wider">
                {language === 'en' ? 'Auth / EPP Code (Optional)' : 'Código Auth / EPP (Opcional)'}
              </label>
              <span className="text-[11px] text-[#555A52] font-medium">
                {language === 'en' ? 'From current registrar' : 'Obtenido de tu registrador'}
              </span>
            </div>

            <div className="relative">
              <input
                id="transfer-auth-code-input"
                type={showAuthCode ? 'text' : 'password'}
                value={authCode}
                onChange={(e) => {
                  setAuthCode(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder={language === 'en' ? 'Enter Auth/EPP code if available' : 'Ingresa el código Auth/EPP si ya lo posees'}
                className="w-full pl-4 pr-12 py-3 text-sm font-mono font-bold rounded-xl bg-white border-2 border-[#8A8F98] focus:border-[#B8F23A] outline-none transition-all"
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
          </div>

          {/* Security & Confidentiality Notice */}
          <div className="p-3.5 bg-[#F7F8F0] border border-[#8A8F98] rounded-2xl text-xs space-y-1.5">
            <div className="font-bold text-[#070707] flex items-center gap-1.5">
              <Lock size={13} className="text-[#B8F23A]" />
              <span>{language === 'en' ? 'Security & In-Memory Confidentiality' : 'Seguridad y Privacidad Estricta'}</span>
            </div>
            <p className="text-[11px] text-[#555A52] leading-relaxed">
              {language === 'en'
                ? 'Your Auth/EPP code is kept solely in browser memory and transmitted directly via POST to SuperSite 2. It is never stored in cookies, storage, or local logs.'
                : 'Tu código Auth/EPP se conserva únicamente en la memoria volátil del navegador y se envía directamente por POST a SuperSite 2. No se almacena en cookies, bases de datos ni registros locales.'}
            </p>
          </div>

          {/* Transfer Checklist */}
          <div className="p-3.5 bg-white border border-[#8A8F98] rounded-2xl space-y-1.5 text-xs text-[#555A52]">
            <div className="font-bold text-[#070707] flex items-center gap-1.5">
              <Info size={13} className="text-[#B8F23A]" />
              <span>{language === 'en' ? 'Pre-transfer checklist:' : 'Requisitos previos a la transferencia:'}</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-[#555A52] pl-1 font-medium">
              <li>{language === 'en' ? 'Domain unlocked at current registrar (Transfer Lock OFF).' : 'El dominio debe estar desbloqueado en tu proveedor actual (Transfer Lock desactivado).'}</li>
              <li>{language === 'en' ? 'More than 60 days since registration or previous transfer.' : 'Tener más de 60 días desde su registro o transferencia previa.'}</li>
              <li>{language === 'en' ? 'SuperSite 2 will check registry status and confirm effective pricing.' : 'SuperSite 2 verificará el estado del Registry y mostrará el precio efectivo.'}</li>
            </ul>
          </div>

          {/* Error Message */}
          {validationError && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in"
            >
              <AlertCircle size={15} className="text-red-500 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#8A8F98] text-xs font-bold text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0] cursor-pointer"
            >
              {language === 'en' ? 'Cancel' : 'Cancelar'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !inputDomain.trim()}
              id="transfer-submit-to-supersite-btn"
              className="px-6 py-2.5 bg-[#B8F23A] hover:bg-[#B8F23A] disabled:bg-[#8A8F98] disabled:text-[#858A82] text-[#070707] font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-[#070707]" />
                  <span>{language === 'en' ? 'Redirecting to SuperSite...' : 'Enviando a SuperSite...'}</span>
                </>
              ) : (
                <>
                  <span>{language === 'en' ? 'Continue on SuperSite 2' : 'Continuar en SuperSite 2'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
