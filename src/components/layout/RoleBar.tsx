import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, Currency } from '../../types';
import { CURRENCIES, COUNTRY_TAX_RATES } from '../../utils/pricing';
import { ShieldCheck, UserCheck, Users, Globe, ShoppingBag, AlertTriangle, X } from 'lucide-react';

export default function RoleBar() {
  const {
    role,
    setRole,
    currency,
    setCurrency,
    countryCode,
    setCountryCode,
    cart,
    setIsCartOpen,
    impersonatedCustomerName,
    stopImpersonation,
    language
  } = useApp();

  const roles: { key: UserRole; label: string; icon: React.ReactNode }[] = [
    { key: 'PUBLIC', label: language === 'en' ? '1. Public Store (Visitor)' : '1. Tienda Pública (Visitante)', icon: <Globe size={14} /> },
    { key: 'CUSTOMER', label: language === 'en' ? '2. Client Area' : '2. Panel de Cliente', icon: <UserCheck size={14} /> },
    { key: 'RESELLER', label: language === 'en' ? '3. Affiliate Portal' : '3. Portal de Afiliados', icon: <Users size={14} /> },
    { key: 'ADMIN', label: language === 'en' ? '4. Admin Console (CMD)' : '4. Consola de Admin (CMD)', icon: <ShieldCheck size={14} /> }
  ];

  return (
    <div className="bg-[#070707] text-[#858A82] text-xs border-b border-[#555A52]/30 sticky top-0 z-50">
      {/* Impersonation Banner */}
      {impersonatedCustomerName && (
        <div className="bg-[#B8F23A] text-[#070707] font-bold px-4 py-1.5 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle size={16} className="text-[#070707]" />
            <span>
              {language === 'en'
                ? `ACTIVE IMPERSONATION MODE: Viewing account of ${impersonatedCustomerName} as Administrator.`
                : `MODO IMPERSONACIÓN ACTIVO: Estás viendo la cuenta de ${impersonatedCustomerName} como Administrador.`}
            </span>
          </div>
          <button
            onClick={stopImpersonation}
            className="flex items-center gap-1 bg-[#070707] text-[#FCFCF8] px-2.5 py-0.5 rounded text-[11px] hover:bg-[#555A52] transition-colors"
          >
            <X size={12} /> {language === 'en' ? 'Exit Impersonation' : 'Salir de Impersonación'}
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Role Switcher */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[#858A82] font-semibold uppercase tracking-wider text-[10px] mr-1 hidden sm:inline">
            {language === 'en' ? 'Role View:' : 'Vista de Rol:'}
          </span>
          {roles.map((r) => {
            const isActive = role === r.key && !impersonatedCustomerName;
            return (
              <button
                key={r.key}
                onClick={() => {
                  if (impersonatedCustomerName) stopImpersonation();
                  setRole(r.key);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#B8F23A] text-[#070707] font-bold shadow-sm ring-1 ring-[#B8F23A]'
                    : 'bg-[#070707] text-[#858A82] hover:bg-[#555A52]/30 hover:text-[#FCFCF8] border border-[#555A52]/40'
                }`}
              >
                {r.icon}
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Selectors: Currency, Tax Country, Cart */}
        <div className="flex items-center gap-3">
          {/* Currency */}
          <div className="flex items-center gap-1 bg-[#070707] rounded-md px-2 py-0.5 border border-[#555A52]/40">
            <span className="text-[#858A82] text-[11px]">{language === 'en' ? 'Currency:' : 'Moneda:'}</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              aria-label={language === 'en' ? 'Display currency' : 'Moneda de visualización'}
              className="bg-transparent text-[#FCFCF8] font-bold outline-none cursor-pointer text-xs"
            >
              {Object.keys(CURRENCIES).map((c) => (
                <option key={c} value={c} className="bg-[#070707] text-[#FCFCF8]">
                  {CURRENCIES[c as Currency].flag} {c} ({CURRENCIES[c as Currency].symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Country Tax */}
          <div className="flex items-center gap-1 bg-[#070707] rounded-md px-2 py-0.5 border border-[#555A52]/40">
            <span className="text-[#858A82] text-[11px]">{language === 'en' ? 'Location:' : 'Ubicación:'}</span>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              aria-label={language === 'en' ? 'Country for tax calculation' : 'País para cálculo de impuestos'}
              className="bg-transparent text-[#FCFCF8] font-bold outline-none cursor-pointer text-xs"
            >
              {Object.keys(COUNTRY_TAX_RATES).map((code) => (
                <option key={code} value={code} className="bg-[#070707] text-[#FCFCF8]">
                  {code === 'MX' ? '🇲🇽' : code === 'US' ? '🇺🇸' : code === 'ES' ? '🇪🇸' : code === 'CO' ? '🇨🇴' : code === 'AR' ? '🇦🇷' : code === 'CL' ? '🇨🇱' : code === 'PE' ? '🇵🇪' : code === 'BR' ? '🇧🇷' : code === 'GB' ? '🇬🇧' : code === 'CA' ? '🇨🇦' : code === 'DE' ? '🇩🇪' : '🌐'} {COUNTRY_TAX_RATES[code].name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-1.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer shadow-xs"
          >
            <ShoppingBag size={13} />
            <span>{language === 'en' ? 'Cart' : 'Carrito'}</span>
            {cart.length > 0 && (
              <span className="bg-[#070707] text-[#B8F23A] text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
