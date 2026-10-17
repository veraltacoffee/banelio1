import React, { useState, useEffect } from 'react';
import { Cookie, X, Settings2, Sliders } from 'lucide-react';

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

    // Show banner after 15 seconds
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
        <div className="bg-[#070707] text-[#FCFCF8] border border-[#555A52]/50 rounded-2xl p-5 sm:p-6 shadow-2xl ring-1 ring-white/10">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-[#DFF5B5] text-[#070707] shrink-0 mt-0.5">
              <Cookie className="w-5 h-5" />
            </div>

            <div className="space-y-3 flex-1">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#FCFCF8] flex items-center gap-2">
                  <span>Gestión de Cookies y Privacidad</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#DFF5B5] text-[#070707] font-black">
                    LFPDPPP
                  </span>
                </h4>
                <p className="text-xs text-[#D5D9CE] mt-1.5 leading-relaxed">
                  Utilizamos cookies esenciales para garantizar el funcionamiento del carrito de compras y la seguridad de tu sesión, así como cookies analíticas para mejorar la velocidad de nuestra infraestructura Cloud.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  id="cookie-accept-all-btn"
                  onClick={handleAcceptAll}
                  className="px-4 py-2 rounded-xl bg-[#B9E86A] hover:bg-[#CBEF8A] text-[#070707] text-xs font-black transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FCFCF8]"
                >
                  Aceptar todas
                </button>

                <button
                  id="cookie-reject-btn"
                  onClick={handleRejectNonEssential}
                  className="px-3.5 py-2 rounded-xl bg-[#141414] hover:bg-[#202020] text-[#FCFCF8] text-xs font-bold transition-all border border-[#555A52] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9E86A]"
                >
                  Rechazar no esenciales
                </button>

                <button
                  id="cookie-customize-btn"
                  onClick={() => setIsCustomizeOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-transparent hover:bg-white/10 text-[#D5D9CE] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9E86A]"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Personalizar</span>
                </button>
              </div>

              {onOpenLegalModal && (
                <p className="text-[11px] text-[#858A82]">
                  Consulta nuestro{' '}
                  <button
                    onClick={() => onOpenLegalModal('COOKIES')}
                    className="underline text-[#B9E86A] hover:text-[#CBEF8A] transition-colors cursor-pointer"
                  >
                    Aviso de Cookies
                  </button>{' '}
                  y{' '}
                  <button
                    onClick={() => onOpenLegalModal('PRIVACY')}
                    className="underline text-[#B9E86A] hover:text-[#CBEF8A] transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#E2E5DA] rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#E2E5DA] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#49652A]" />
                <h3 className="text-base font-black text-[#070707]">
                  Centro de Preferencias de Cookies
                </h3>
              </div>
              <button
                onClick={() => setIsCustomizeOpen(false)}
                className="p-1.5 rounded-lg text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Essential Cookies */}
              <div className="p-3.5 rounded-xl bg-[#F7F8F0] border border-[#E2E5DA] flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#070707]">
                      Cookies Estrictamente Necesarias
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#DFF5B5] text-[#070707] font-black">
                      Siempre activas
                    </span>
                  </div>
                  <p className="text-xs text-[#555A52] mt-1 leading-relaxed">
                    Garantizan el carrito de compra, moneda seleccionada, checkout seguro y protección contra fraudes.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  className="rounded border-[#E2E5DA] text-[#49652A] mt-1 cursor-not-allowed"
                />
              </div>

              {/* Analytics Cookies */}
              <div className="p-3.5 rounded-xl bg-[#F7F8F0] border border-[#E2E5DA] flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-black text-[#070707]">
                    Cookies de Rendimiento y Analítica
                  </span>
                  <p className="text-xs text-[#555A52] mt-1 leading-relaxed">
                    Nos permiten analizar el tráfico de forma anónima para optimizar la velocidad y latencia de nuestros centros de datos NVMe.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="rounded border-[#E2E5DA] text-[#49652A] focus:ring-[#B9E86A] mt-1 cursor-pointer w-4 h-4"
                />
              </div>

              {/* Marketing Cookies */}
              <div className="p-3.5 rounded-xl bg-[#F7F8F0] border border-[#E2E5DA] flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-black text-[#070707]">
                    Cookies de Personalización y Ofertas
                  </span>
                  <p className="text-xs text-[#555A52] mt-1 leading-relaxed">
                    Permiten recordar ofertas de dominios y promociones personalizadas acordes a tu país o región.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                  className="rounded border-[#E2E5DA] text-[#49652A] focus:ring-[#B9E86A] mt-1 cursor-pointer w-4 h-4"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-[#E2E5DA]">
              <button
                onClick={() => setIsCustomizeOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCustom}
                className="px-5 py-2 rounded-xl bg-[#B9E86A] hover:bg-[#CBEF8A] text-[#070707] text-xs font-black transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707]"
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
