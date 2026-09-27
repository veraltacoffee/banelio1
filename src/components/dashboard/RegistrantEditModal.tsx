import React, { useState } from 'react';
import { UserService, DomainRegistrantContact } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, User, Building, Mail, Phone, MapPin, Globe, Check, ShieldCheck } from 'lucide-react';

interface RegistrantEditModalProps {
  domain: UserService | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RegistrantEditModal({
  domain,
  isOpen,
  onClose
}: RegistrantEditModalProps) {
  const { updateService, sharedRegistrantContact, addToast, language } = useApp();

  if (!isOpen || !domain) return null;

  const currentContact: DomainRegistrantContact = domain.registrantContact || sharedRegistrantContact;

  const [name, setName] = useState(currentContact.name || '');
  const [company, setCompany] = useState(currentContact.company || '');
  const [email, setEmail] = useState(currentContact.email || '');
  const [phone, setPhone] = useState(currentContact.phone || '');
  const [taxId, setTaxId] = useState(currentContact.taxId || '');
  const [address, setAddress] = useState(currentContact.address || '');
  const [city, setCity] = useState(currentContact.city || '');
  const [state, setState] = useState(currentContact.state || '');
  const [postalCode, setPostalCode] = useState(currentContact.postalCode || '');
  const [country, setCountry] = useState(currentContact.country || 'México');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedContact: DomainRegistrantContact = {
      name,
      company,
      email,
      phone,
      taxId,
      address,
      city,
      state,
      postalCode,
      country
    };

    updateService(domain.id, {
      registrantContact: updatedContact
    });

    addToast({
      type: 'success',
      title: language === 'en' ? 'Registrant Updated' : 'Titularidad Actualizada',
      message: language === 'en'
        ? `ICANN registrant details updated for ${domain.name}.`
        : `Los datos de contacto y titularidad ICANN para ${domain.name} fueron guardados correctamente.`
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-[#070707]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-[#8A8F98] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#FCFCF8] p-6 flex items-center justify-between border-b border-[#8A8F98]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B8F23A] text-[#070707] border border-[#B8F23A] flex items-center justify-center shadow-2xs">
              <User size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-[#070707]">
                  {language === 'en' ? 'ICANN Registrant Contact Data' : 'Datos del Titular / Registrador ICANN'}
                </h3>
                <span className="bg-[#B8F23A] text-[#070707] text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-[#B8F23A]">
                  WHOIS
                </span>
              </div>
              <p className="text-xs text-[#555A52]">
                Dominio: <strong className="text-[#070707] font-mono">{domain.name}</strong>
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
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="p-3 bg-[#F8F9F3] border border-[#8A8F98] rounded-2xl flex items-center gap-2.5 text-xs text-[#555A52]">
            <ShieldCheck size={18} className="text-[#B8F23A] shrink-0" />
            <span>
              Estos datos representan la titularidad legal de <strong>{domain.name}</strong> ante ICANN y los Registries oficiales. Si tienes activa la Protección WHOIS Privacy, tu información privada permanecerá oculta para terceros.
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#070707] block mb-1">Nombre Completo del Titular *</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-[#858A82]" size={14} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Juan Carlos Pérez"
                  className="w-full pl-9 pr-3 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs font-semibold text-[#070707] outline-none focus:border-[#B8F23A]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#070707] block mb-1">Empresa / Razón Social</label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 text-[#858A82]" size={14} />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Ej: Empresa Digital S.A."
                  className="w-full pl-9 pr-3 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs font-semibold text-[#070707] outline-none focus:border-[#B8F23A]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#070707] block mb-1">Correo Electrónico *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-[#858A82]" size={14} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="titular@empresa.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs font-semibold text-[#070707] outline-none focus:border-[#B8F23A]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#070707] block mb-1">Teléfono Fiscal *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 text-[#858A82]" size={14} />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Número de teléfono de contacto"
                  className="w-full pl-9 pr-3 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs font-semibold text-[#070707] outline-none focus:border-[#B8F23A]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#070707] block mb-1">RFC / Tax ID Fiscal</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="PEDJ850101XYZ"
                className="w-full px-3 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs font-semibold text-[#070707] outline-none uppercase focus:border-[#B8F23A]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#070707] block mb-1">País</label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 text-[#858A82]" size={14} />
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="México"
                  className="w-full pl-9 pr-3 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs font-semibold text-[#070707] outline-none focus:border-[#B8F23A]"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-[#070707] block mb-1">Dirección Postal *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 text-[#858A82]" size={14} />
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Av. Insurgentes Sur 1602, Colonia Crédito Constructor"
                  className="w-full pl-9 pr-3 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs font-semibold text-[#070707] outline-none focus:border-[#B8F23A]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#070707] block mb-1">Ciudad y Estado</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ciudad de México"
                  className="w-full px-3 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs font-semibold text-[#070707] outline-none"
                />
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="CDMX"
                  className="w-full px-3 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs font-semibold text-[#070707] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#070707] block mb-1">Código Postal</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="03900"
                className="w-full px-3 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs font-semibold text-[#070707] outline-none"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-[#8A8F98] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#555A52] hover:text-[#070707] cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl font-black text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Check size={15} />
              <span>Guardar Datos de Titular</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
