import React, { useState, useEffect } from 'react';
import { Cookie, Shield, Check, X, Settings2, Sliders } from 'lucide-react';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

export const CookieConsentBanner: React.FC<{ onOpenLegalModal?: (doc: 'COOKIES' | 'PRIVACY') => void }> = ({
  onOpenLegalModal
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: true,
    marketing: true
  });

  useEffect(() => {
    // Check if user previously responded
    const storedConsent = localStorage.getItem('banelio_cookies_consent');
    if (storedConsent) return;

    // Show banner after 15 seconds (15000 ms)
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = { essential: true, analytics: true, marketing: true };
    localStorage.setItem('banelio_cookies_consent', JSON.stringify({ ...allAccepted, timestamp: new Date().toISOString() }));
    setIsVisible(false);
    setIsCustomizeOpen(false);
  };

  const handleRejectNonEssential = () => {
    const onlyEssential: CookiePreferences = { essential: true, analytics: false, marketing: false };
    localStorage.setItem('banelio_cookies_consent', JSON.stringify({ ...onlyEssential, timestamp: new Date().toISOString() }));
    setIsVisible(false);
    setIsCustomizeOpen(false);
  };

  const handleSaveCustom = () => {
    localStorage.setItem('banelio_cookies_consent', JSON.stringify({ ...preferences, timestamp: new Date().toISOString() }));
    setIsVisible(false);
    setIsCustomizeOpen(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Cookie Notification Banner */}
      <div
        id="cookie-consent-banner"
        className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-xl z-50 animate-in slide-in-from-bottom-5 duration-500"
      >
        <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-2xl ring-1 ring-white/10">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-[#B8F23A]/20 text-[#070707] flex-shrink-0 mt-0.5">
              <Cookie className="w-5 h-5" />
            </div>

            <div className="space-y-3 flex-1">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>Gestión de Cookies y Privacidad</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#B8F23A]/20 text-[#070707] font-semibold">
                    LFPDPPP
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Utilizamos cookies esenciales para garantizar el funcionamiento del carrito de compras y la seguridad de tu sesión, así como cookies analíticas para mejorar la velocidad de nuestra infraestructura Cloud.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  id="cookie-accept-all-btn"
                  onClick={handleAcceptAll}
                  className="px-4 py-2 rounded-xl bg-[#B8F23A] hover:bg-[#B8F23A] text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  Aceptar todas
                </button>

                <button
                  id="cookie-reject-btn"
                  onClick={handleRejectNonEssential}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 active:scale-95"
                >
                  Rechazar no esenciales
                </button>

                <button
                  id="cookie-customize-btn"
                  onClick={() => setIsCustomizeOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-transparent hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Personalizar</span>
                </button>
              </div>

              {onOpenLegalModal && (
                <p className="text-[11px] text-slate-400">
                  Consulta nuestro{' '}
                  <button
                    onClick={() => onOpenLegalModal('COOKIES')}
                    className="underline hover:text-[#B8F23A] transition-colors"
                  >
                    Aviso de Cookies
                  </button>{' '}
                  y{' '}
                  <button
                    onClick={() => onOpenLegalModal('PRIVACY')}
                    className="underline hover:text-[#B8F23A] transition-colors"
                  >
                    Aviso de Privacidad
                  </button>.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customize Cookies Modal */}
      {isCustomizeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#B8F23A]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Centro de Preferencias de Cookies
                </h3>
              </div>
              <button
                onClick={() => setIsCustomizeOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Essential Cookies */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Cookies Estrictamente Necesarias
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                      Siempre activas
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Garantizan el carrito de compra, moneda seleccionada, checkout seguro y protección contra fraudes.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  className="rounded border-slate-300 text-[#B8F23A] focus:ring-[#B8F23A] mt-1 cursor-not-allowed"
                />
              </div>

              {/* Analytics Cookies */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Cookies de Rendimiento y Analítica
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Nos permiten analizar el tráfico de forma anónima para optimizar la velocidad y latencia de nuestros centros de datos NVMe.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="rounded border-slate-300 text-[#B8F23A] focus:ring-[#B8F23A] mt-1 cursor-pointer w-4 h-4"
                />
              </div>

              {/* Marketing Cookies */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Cookies de Personalización y Ofertas
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Permiten recordar ofertas de dominios y promociones personalizadas acordes a tu país o región.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                  className="rounded border-slate-300 text-[#B8F23A] focus:ring-[#B8F23A] mt-1 cursor-pointer w-4 h-4"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsCustomizeOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCustom}
                className="px-5 py-2 rounded-xl bg-[#B8F23A] hover:bg-[#B8F23A] text-slate-950 text-xs font-bold transition-all shadow-sm"
              >
                Guardar Preferencias
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
