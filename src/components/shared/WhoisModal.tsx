import React, { useEffect, useState } from 'react';
import { X, ShieldAlert, Globe, Calendar, User, Server, Loader2, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface WhoisModalProps {
  domain: string;
  isOpen: boolean;
  onClose: () => void;
}

interface WhoisData {
  registrar: string | null;
  status: string[];
  created: string | null;
  expires: string | null;
  lastChanged: string | null;
  nameservers: string[];
}

export default function WhoisModal({ domain, isOpen, onClose }: WhoisModalProps) {
  const { language } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WhoisData | null>(null);

  const t = (es: string, en: string) => (language === 'en' ? en : es);

  useEffect(() => {
    if (!isOpen || !domain) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    const normalized = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim().toLowerCase();

    fetch(`/api/domains/whois?domain=${encodeURIComponent(normalized)}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (!json || json.success !== true || !json.data) {
          setError(t('No se pudo obtener la información del dominio.', 'Domain information could not be retrieved.'));
          return;
        }
        setData(json.data);
      })
      .catch(() => {
        if (cancelled) return;
        setError(t('No se pudo obtener la información del dominio.', 'Domain information could not be retrieved.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [isOpen, domain]);

  if (!isOpen) return null;

  const notAvailable = t('No disponible', 'Not available');

  return (
    <div className="fixed inset-0 z-50 bg-[#070707]/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#111111] rounded-2xl max-w-xl w-full shadow-2xl border border-[#242424] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#070707] text-[#FFFFFF] flex items-center justify-between border-b border-[#242424]">
          <div className="flex items-center gap-2">
            <Globe className="text-[#B8F23A]" size={18} />
            <h3 className="font-bold text-base">{t('Registro WHOIS / RDAP', 'WHOIS / RDAP Record')}</h3>
          </div>
          <button onClick={onClose} className="text-[#8A8F98] hover:text-[#FFFFFF] p-1 rounded-lg hover:bg-[#242424] transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm">
          <div className="bg-[#070707] border border-[#242424] rounded-xl p-3 flex items-center gap-3">
            <ShieldAlert className="text-[#B8F23A] shrink-0" size={20} />
            <div>
              <p className="font-bold text-[#FFFFFF]">{domain}</p>
              <p className="text-xs text-[#8A8F98]">
                {t('Datos públicos consultados en tiempo real vía RDAP.', 'Public data queried in real time via RDAP.')}
              </p>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-[#8A8F98]">
              <Loader2 className="animate-spin text-[#B8F23A]" size={28} />
              <p className="text-xs font-semibold">{t('Consultando información del dominio...', 'Querying domain information...')}</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-[#8A8F98]">
              <AlertTriangle className="text-[#F0934B]" size={28} />
              <p className="text-xs font-semibold text-[#FFFFFF]">{error}</p>
            </div>
          )}

          {!loading && !error && data && (
            <div className="grid grid-cols-2 gap-3 text-xs bg-[#070707] p-4 rounded-xl border border-[#242424]">
              <div>
                <span className="text-[#8A8F98] block flex items-center gap-1">
                  <User size={12} /> {t('Registrar:', 'Registrar:')}
                </span>
                <span className="font-semibold text-[#FFFFFF] break-words">
                  {data.registrar ? data.registrar : notAvailable}
                </span>
              </div>
              <div>
                <span className="text-[#8A8F98] block flex items-center gap-1">
                  <ShieldAlert size={12} /> {t('Estado del Dominio:', 'Domain Status:')}
                </span>
                <span className="font-semibold text-[#B8F23A] break-words block">
                  {data.status.length ? data.status.join(', ') : notAvailable}
                </span>
              </div>
              <div>
                <span className="text-[#8A8F98] block flex items-center gap-1">
                  <Calendar size={12} /> {t('Fecha de Creación:', 'Created:')}
                </span>
                <span className="font-semibold text-[#FFFFFF]">
                  {data.created ? data.created : notAvailable}
                </span>
              </div>
              <div>
                <span className="text-[#8A8F98] block flex items-center gap-1">
                  <Calendar size={12} /> {t('Fecha de Expiración:', 'Expires:')}
                </span>
                <span className="font-semibold text-[#FFFFFF]">
                  {data.expires ? data.expires : notAvailable}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[#8A8F98] block flex items-center gap-1">
                  <Server size={12} /> {t('Servidores de Nombres (Nameservers):', 'Nameservers:')}
                </span>
                {data.nameservers.length ? data.nameservers.map((ns) => (
                  <span key={ns} className="font-mono text-[#8A8F98] block">{ns}</span>
                )) : (
                  <span className="font-mono text-[#8A8F98] block">{notAvailable}</span>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-[#242424] pt-3 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#070707] hover:bg-[#181818] border border-[#242424] text-[#FFFFFF] rounded-xl font-semibold text-xs transition-colors cursor-pointer"
            >
              {t('Cerrar', 'Close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
