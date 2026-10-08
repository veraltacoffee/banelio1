import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const WhatsAppFloatingButton: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(true);
  const { language } = useApp();

  const phoneParam = "526601254107";
  const messageText = encodeURIComponent(
    language === 'en'
      ? "Hello Banelio Cloud, I would like customized advice regarding domains, hosting, and business email."
      : "Hola Banelio Cloud, deseo asesoría personalizada sobre dominios, hosting y correo corporativo."
  );
  const whatsappUrl = `https://wa.me/${phoneParam}?text=${messageText}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Friendly Tooltip Bubble */}
      {showTooltip && (
        <div className="relative bg-white text-[#070707] px-3.5 py-2 rounded-2xl shadow-xl border border-[#8A8F98] text-xs flex items-center gap-2 max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse flex-shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold leading-tight text-[#070707]">
              {language === 'en' ? 'Chat with an advisor' : '¡Chatea con un asesor!'}
            </span>
            <span className="text-[10px] text-[#555A52] font-medium">
              {language === 'en' ? 'Support and sales 24/7' : 'Soporte y ventas 24/7'}
            </span>
          </div>
          <button
            id="wa-tooltip-close"
            onClick={() => setShowTooltip(false)}
            className="p-1 text-[#858A82] hover:text-[#070707] rounded-full cursor-pointer ml-1"
            aria-label="Cerrar tooltip de WhatsApp"
          >
            <X className="w-3 h-3" />
          </button>
          
          {/* Tooltip Arrow */}
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-b border-r border-[#8A8F98] transform rotate-45" />
        </div>
      )}

      {/* Main Floating Button */}
      <a
        id="whatsapp-floating-btn"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp a Banelio"
        className="group relative flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
      >
        {/* Glow / Pulse rings */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25 duration-1000" />

        {/* Official WhatsApp SVG Logo Icon */}
        <svg
          className="w-7 h-7 fill-current relative z-10 transition-transform group-hover:scale-105"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.456h.005c6.554 0 11.89-5.336 11.893-11.893a11.821 11.821 0 00-3.48-8.414z"/>
        </svg>
      </a>
    </div>
  );
};
