import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/pricing';
import { getProductPriceResult } from '../../services/pricingEngine';
import {
  X,
  Check,
  Mail,
  Server,
  Shield,
  Database,
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  Globe
} from 'lucide-react';
import { ServiceType } from '../../types';

export interface AddonConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  addonType: 'EMAIL' | 'HOSTING' | 'SSL' | 'BACKUP';
  associatedDomain?: string;
}

export default function AddonConfigModal({
  isOpen,
  onClose,
  addonType,
  associatedDomain = 'tudominio.com'
}: AddonConfigModalProps) {
  const { addToCart, currency, language, addToast } = useApp();

  // State for selections
  const [selectedPlan, setSelectedPlan] = useState<string>('starter');
  const [period, setPeriod] = useState<number>(1);
  const [periodUnit, setPeriodUnit] = useState<'year' | 'month'>('year');
  const [mailboxCount, setMailboxCount] = useState<number>(1);

  if (!isOpen) return null;

  const handleAddAddon = () => {
    let serviceName = '';
    let basePriceUSD = 0;
    let type: ServiceType = 'HOSTING';
    let sku = '';
    let quantity = 1;

    if (addonType === 'EMAIL') {
      type = 'EMAIL';
      if (selectedPlan === 'google') {
        sku = periodUnit === 'year' ? 'addon-workspace-year' : 'addon-workspace';
        serviceName = `Google Workspace Starter - ${associatedDomain}`;
        basePriceUSD = getProductPriceResult(sku).retailPriceUSD || (periodUnit === 'year' ? 72 : 6.00);
        quantity = period;
      } else {
        sku = periodUnit === 'year' ? 'addon-mail-pro-year' : 'addon-mail-pro';
        serviceName = `Banelio Mail Pro (${mailboxCount} buzones) - ${associatedDomain}`;
        basePriceUSD = getProductPriceResult(sku).retailPriceUSD || (periodUnit === 'year' ? 16.99 : 1.99);
        quantity = period * mailboxCount;
      }
    } else if (addonType === 'HOSTING') {
      type = 'HOSTING';
      if (selectedPlan === 'business') {
        sku = periodUnit === 'year' ? 'addon-hosting-business-year' : 'addon-hosting-business-month';
        serviceName = `Hosting Cloud NVMe Business - ${associatedDomain}`;
        basePriceUSD = getProductPriceResult(sku).retailPriceUSD || (periodUnit === 'year' ? 89.99 : 8.99);
        quantity = period;
      } else {
        sku = periodUnit === 'year' ? 'addon-hosting-starter-year' : 'addon-hosting-starter-month';
        serviceName = `Hosting Cloud NVMe Starter - ${associatedDomain}`;
        basePriceUSD = getProductPriceResult(sku).retailPriceUSD || (periodUnit === 'year' ? 39.99 : 3.99);
        quantity = period;
      }
    } else if (addonType === 'SSL') {
      type = 'SSL';
      sku = 'addon-ssl-wildcard';
      serviceName = `Certificado SSL Wildcard (*.${associatedDomain})`;
      basePriceUSD = getProductPriceResult(sku).retailPriceUSD || 9.99;
      quantity = 1;
      setPeriodUnit('year');
    } else if (addonType === 'BACKUP') {
      type = 'HOSTING';
      sku = periodUnit === 'year' ? 'addon-backup-year' : 'addon-backup';
      serviceName = `Cloud Backup Diario Automatizado - ${associatedDomain}`;
      basePriceUSD = getProductPriceResult(sku).retailPriceUSD || (periodUnit === 'year' ? 14.99 : 1.49);
      quantity = 1;
    }

    addToCart({
      type,
      sku,
      name: serviceName,
      periodYearsOrMonths: period,
      periodUnit,
      quantity,
      basePriceUSD,
      addons: {
        whoisPrivacy: true
      }
    });

    addToast({
      type: 'success',
      title: language === 'en' ? 'Add-on Added' : 'Complemento Agregado',
      message: `${serviceName} ${language === 'en' ? 'was added to your cart.' : 'ha sido agregado a tu carrito.'}`
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-[#070707]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-[#8A8F98] overflow-hidden">
        {/* Header */}
        <div className="bg-[#FCFCF8] p-6 flex items-center justify-between border-b border-[#8A8F98]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B8F23A] text-[#070707] border border-[#B8F23A] flex items-center justify-center shadow-2xs">
              {addonType === 'EMAIL' && <Mail size={20} />}
              {addonType === 'HOSTING' && <Server size={20} />}
              {addonType === 'SSL' && <Shield size={20} />}
              {addonType === 'BACKUP' && <Database size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-[#070707]">
                  {addonType === 'EMAIL' && (language === 'en' ? 'Corporate Email for your Domain' : 'Correo Corporativo para tu Dominio')}
                  {addonType === 'HOSTING' && (language === 'en' ? 'Cloud NVMe cPanel Web Hosting' : 'Hosting Web Cloud NVMe cPanel')}
                  {addonType === 'SSL' && (language === 'en' ? 'Wildcard SSL Certificate' : 'Certificado SSL Wildcard')}
                  {addonType === 'BACKUP' && (language === 'en' ? 'Automated Cloud Daily Backups' : 'Copias de Seguridad Diarias Cloud')}
                </h3>
                <span className="bg-[#B8F23A] text-[#070707] text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-[#B8F23A]">
                  Add-on
                </span>
              </div>
              <p className="text-xs text-[#555A52]">
                {language === 'en' ? `Associated domain: ${associatedDomain}` : `Dominio vinculado: ${associatedDomain}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#555A52] hover:text-[#070707] hover:bg-[#F7F8F0] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* EMAIL ADDON OPTIONS */}
          {addonType === 'EMAIL' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Plan 1: Banelio Pro */}
                <div
                  onClick={() => setSelectedPlan('banelio')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    selectedPlan === 'banelio'
                      ? 'border-[#B8F23A] bg-[#F7F8F0] ring-1 ring-[#B8F23A]/20'
                      : 'border-[#8A8F98] bg-white hover:border-[#B8F23A]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm text-[#070707]">Banelio Mail Pro</span>
                    {selectedPlan === 'banelio' && <Check size={16} className="text-[#B8F23A]" />}
                  </div>
                  <div className="text-xl font-black text-[#B8F23A] mb-1">
                    {formatMoney(
                      getProductPriceResult(
                        periodUnit === 'year' ? 'addon-mail-pro-year' : 'addon-mail-pro'
                      ).retailPriceUSD,
                      currency
                    )}
                    <span className="text-xs text-[#555A52] font-normal"> / {periodUnit === 'year' ? 'año' : 'mes'}</span>
                  </div>
                  <ul className="text-xs text-[#555A52] space-y-1 mt-2">
                    <li className="flex items-center gap-1.5"><Check size={12} className="text-[#B8F23A]" /> 10GB almacenamiento</li>
                    <li className="flex items-center gap-1.5"><Check size={12} className="text-[#B8F23A]" /> Webmail + IMAP/POP3</li>
                    <li className="flex items-center gap-1.5"><Check size={12} className="text-[#B8F23A]" /> Filtro Antispam Inteligente</li>
                  </ul>
                </div>

                {/* Plan 2: Google Workspace */}
                <div
                  onClick={() => setSelectedPlan('google')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    selectedPlan === 'google'
                      ? 'border-[#B8F23A] bg-[#F7F8F0] ring-1 ring-[#B8F23A]/20'
                      : 'border-[#8A8F98] bg-white hover:border-[#B8F23A]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm text-[#070707]">Google Workspace</span>
                    {selectedPlan === 'google' && <Check size={16} className="text-[#B8F23A]" />}
                  </div>
                  <div className="text-xl font-black text-[#B8F23A] mb-1">
                    {formatMoney(periodUnit === 'year' ? 72.00 : 6.00, currency)}
                    <span className="text-xs text-[#555A52] font-normal"> / {periodUnit === 'year' ? 'año' : 'mes'}</span>
                  </div>
                  <ul className="text-xs text-[#555A52] space-y-1 mt-2">
                    <li className="flex items-center gap-1.5"><Check size={12} className="text-[#B8F23A]" /> Gmail corporativo oficial</li>
                    <li className="flex items-center gap-1.5"><Check size={12} className="text-[#B8F23A]" /> 30GB Cloud Drive</li>
                    <li className="flex items-center gap-1.5"><Check size={12} className="text-[#B8F23A]" /> Google Meet HD + Docs</li>
                  </ul>
                </div>
              </div>

              {selectedPlan === 'banelio' && (
                <div className="flex items-center justify-between p-3 bg-[#F7F8F0] border border-[#8A8F98] rounded-2xl text-xs">
                  <span className="font-bold text-[#070707]">Número de buzones (cuentas):</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMailboxCount(Math.max(1, mailboxCount - 1))}
                      className="w-7 h-7 bg-white border border-[#8A8F98] rounded-lg font-black text-sm flex items-center justify-center hover:bg-[#8A8F98]"
                    >
                      -
                    </button>
                    <span className="font-black text-sm w-6 text-center">{mailboxCount}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setMailboxCount((current) =>
                          Math.min(Math.floor(1000 / Math.max(1, period)), current + 1)
                        )
                      }
                      className="w-7 h-7 bg-white border border-[#8A8F98] rounded-lg font-black text-sm flex items-center justify-center hover:bg-[#8A8F98]"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HOSTING ADDON OPTIONS */}
          {addonType === 'HOSTING' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Plan 1: Starter */}
                <div
                  onClick={() => setSelectedPlan('starter')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    selectedPlan === 'starter'
                      ? 'border-[#B8F23A] bg-[#F7F8F0] ring-1 ring-[#B8F23A]/20'
                      : 'border-[#8A8F98] bg-white hover:border-[#B8F23A]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm text-[#070707]">cPanel NVMe Starter</span>
                    {selectedPlan === 'starter' && <Check size={16} className="text-[#B8F23A]" />}
                  </div>
                  <div className="text-xl font-black text-[#B8F23A] mb-1">
                    {formatMoney(periodUnit === 'year' ? 39.99 : 3.99, currency)}
                    <span className="text-xs text-[#555A52] font-normal"> / {periodUnit === 'year' ? 'año' : 'mes'}</span>
                  </div>
                  <ul className="text-xs text-[#555A52] space-y-1 mt-2">
                    <li className="flex items-center gap-1.5"><Check size={12} className="text-[#B8F23A]" /> 25GB Disco SSD NVMe</li>
                    <li className="flex items-center gap-1.5"><Check size={12} className="text-[#B8F23A]" /> Tráfico Ilimitado</li>
                    <li className="flex items-center gap-1.5"><Check size={12} className="text-[#B8F23A]" /> SSL Gratis + cPanel</li>
                  </ul>
                </div>

                {/* Plan 2: Business */}
                <div
                  onClick={() => setSelectedPlan('business')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    selectedPlan === 'business'
                      ? 'border-[#B8F23A] bg-[#F7F8F0] ring-1 ring-[#B8F23A]/20'
                      : 'border-[#8A8F98] bg-white hover:border-[#B8F23A]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm text-[#070707]">cPanel NVMe Business</span>
                    {selectedPlan === 'business' && <Check size={16} className="text-[#B8F23A]" />}
                  </div>
                  <div className="text-xl font-black text-[#B8F23A] mb-1">
                    {formatMoney(periodUnit === 'year' ? 89.99 : 8.99, currency)}
                    <span className="text-xs text-[#555A52] font-normal"> / {periodUnit === 'year' ? 'año' : 'mes'}</span>
                  </div>
                  <ul className="text-xs text-[#555A52] space-y-1 mt-2">
                    <li className="flex items-center gap-1.5"><Check size={12} className="text-[#B8F23A]" /> 100GB SSD NVMe</li>
                    <li className="flex items-center gap-1.5"><Check size={12} className="text-[#B8F23A]" /> Dominios Ilimitados</li>
                    <li className="flex items-center gap-1.5"><Check size={12} className="text-[#B8F23A]" /> Staging + Backups diarios</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SSL ADDON */}
          {addonType === 'SSL' && (
            <div className="p-4 bg-[#F7F8F0] border border-[#8A8F98] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-[#070707]">Sectigo PositiveSSL Wildcard</h4>
                  <p className="text-xs text-[#555A52]">Protege *. {associatedDomain} y todas sus variantes de subdominios.</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-[#B8F23A]">{formatMoney(9.99, currency)}</span>
                  <span className="text-xs text-[#555A52] block">/ año</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-[#555A52] pt-2 border-t border-[#8A8F98]">
                <div className="flex items-center gap-1.5"><Check size={12} className="text-[#B8F23A]" /> Cifrado SHA-256 / 2048-bit</div>
                <div className="flex items-center gap-1.5"><Check size={12} className="text-[#B8F23A]" /> Garantía $10,000 USD</div>
                <div className="flex items-center gap-1.5"><Check size={12} className="text-[#B8F23A]" /> Sello de sitio seguro</div>
                <div className="flex items-center gap-1.5"><Check size={12} className="text-[#B8F23A]" /> Emisión en 5 minutos</div>
              </div>
            </div>
          )}

          {/* BACKUP ADDON */}
          {addonType === 'BACKUP' && (
            <div className="p-4 bg-[#F7F8F0] border border-[#8A8F98] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-[#070707]">Cloud Backup Diario Automatizado</h4>
                  <p className="text-xs text-[#555A52]">Copias de seguridad automáticas en la nube de alta disponibilidad.</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-[#B8F23A]">
                    {formatMoney(periodUnit === 'year' ? 14.99 : 1.49, currency)}
                  </span>
                  <span className="text-xs text-[#555A52] block">/ {periodUnit === 'year' ? 'año' : 'mes'}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-[#555A52] pt-2 border-t border-[#8A8F98]">
                <div className="flex items-center gap-1.5"><Check size={12} className="text-[#B8F23A]" /> Respaldo cada 24 horas</div>
                <div className="flex items-center gap-1.5"><Check size={12} className="text-[#B8F23A]" /> Retención de 30 días</div>
                <div className="flex items-center gap-1.5"><Check size={12} className="text-[#B8F23A]" /> Restauración en 1-clic</div>
                <div className="flex items-center gap-1.5"><Check size={12} className="text-[#B8F23A]" /> Almacenamiento redundante</div>
              </div>
            </div>
          )}

          {/* Billing Cycle / Period Selection */}
          {addonType !== 'SSL' && (
            <div className="p-4 bg-white border border-[#8A8F98] rounded-2xl flex items-center justify-between text-xs">
              <span className="font-bold text-[#070707]">Ciclo de Facturación:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPeriodUnit('month');
                    setPeriod(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    periodUnit === 'month'
                      ? 'bg-[#B8F23A] text-[#070707] shadow-2xs'
                      : 'bg-[#F7F8F0] text-[#555A52] hover:text-[#070707]'
                  }`}
                >
                  Mensual
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPeriodUnit('year');
                    setPeriod(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    periodUnit === 'year'
                      ? 'bg-[#B8F23A] text-[#070707] shadow-2xs'
                      : 'bg-[#F7F8F0] text-[#555A52] hover:text-[#070707]'
                  }`}
                >
                  Anual (Ahorro 20%)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-[#FCFCF8] border-t border-[#8A8F98] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-[#555A52] hover:text-[#070707] cursor-pointer"
          >
            {language === 'en' ? 'Cancel' : 'Cancelar'}
          </button>

          <button
            onClick={handleAddAddon}
            className="px-6 py-3 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl font-black text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <span>{language === 'en' ? 'Add to Cart' : 'Añadir al Carrito'}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
