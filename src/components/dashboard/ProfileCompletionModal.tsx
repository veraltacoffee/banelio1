import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, User, Building, Mail, Phone, MapPin, Globe, CheckCircle2, FileText, Sparkles } from 'lucide-react';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileCompletionModal({ isOpen, onClose }: ProfileCompletionModalProps) {
  const { customerUser, updateCustomerProfile, language } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Mexico');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (customerUser && isOpen) {
      setName(customerUser.name || '');
      setEmail(customerUser.email || '');
      setPhone(customerUser.phone || '');
      setCompany(customerUser.company || '');
      setTaxId(customerUser.taxId || '');
      setAddress(customerUser.address || '');
      setCity(customerUser.city || '');
      setState(customerUser.state || '');
      setPostalCode(customerUser.postalCode || '');
      setCountry(customerUser.country || 'Mexico');
      setSavedSuccess(false);
    }
  }, [customerUser, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    updateCustomerProfile({
      name: name.trim(),
      phone: phone.trim(),
      company: company.trim(),
      taxId: taxId.trim().toUpperCase(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country
    });

    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#8A8F98] overflow-hidden text-[#070707]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#8A8F98] flex items-center justify-between bg-[#F7F8F0] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B8F23A] text-[#070707] flex items-center justify-center font-black shadow-xs">
              <User size={20} className="text-[#B8F23A]" />
            </div>
            <div>
              <h2 id="profile-modal-title" className="text-lg font-black text-[#070707]">
                {language === 'en' ? 'Complete Profile Information' : 'Datos Completos de la Cuenta'}
              </h2>
              <p className="text-xs text-[#555A52]">
                {language === 'en'
                  ? 'Maintain 100% control over domain ownership, invoices, and contact data.'
                  : 'Ten el control total sobre la titularidad de tus dominios y facturas fiscales.'}
              </p>
            </div>
          </div>
          <button
            id="close-profile-modal-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 text-[#555A52] hover:text-[#070707] hover:bg-[#EAECE4] rounded-xl transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Informative Note */}
        <div className="p-4 bg-[#F7F8F0] border-b border-[#8A8F98] text-xs text-[#B8F23A] flex items-center gap-2">
          <Sparkles size={16} className="shrink-0 text-[#B8F23A]" />
          <span>
            {language === 'en'
              ? 'Filling these details is for account management and invoicing; you can purchase or transfer services anytime without restrictions.'
              : 'Completar estos datos te brinda control total y facturación automática; puedes comprar y transferir dominios libremente en cualquier momento.'}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {savedSuccess && (
            <div className="p-3.5 bg-[#B8F23A] border border-[#B8F23A] rounded-2xl flex items-center gap-2 text-[#070707] font-bold">
              <CheckCircle2 size={16} />
              <span>{language === 'en' ? 'Profile saved successfully!' : '¡Datos guardados correctamente en tu cuenta!'}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block font-bold text-[#070707] mb-1">
                {language === 'en' ? 'Full Legal Name / Owner' : 'Nombre Completo / Titular *'}
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-3 text-[#858A82]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#8A8F98] bg-white text-xs outline-none focus:border-[#B8F23A]"
                  placeholder="Ej. Juan Carlos Pérez Morales"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#070707] mb-1">
                {language === 'en' ? 'Email Address' : 'Correo Electrónico'}
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-3 text-[#858A82]" />
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#8A8F98] bg-[#F7F8F0] text-xs text-[#555A52] cursor-not-allowed outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#070707] mb-1">
                {language === 'en' ? 'Phone Number' : 'Teléfono de Contacto'}
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-3 text-[#858A82]" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#8A8F98] bg-white text-xs outline-none focus:border-[#B8F23A]"
                  placeholder="Número de teléfono de contacto"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#070707] mb-1">
                {language === 'en' ? 'Company Name (Optional)' : 'Empresa / Razón Social (Opcional)'}
              </label>
              <div className="relative">
                <Building size={15} className="absolute left-3 top-3 text-[#858A82]" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#8A8F98] bg-white text-xs outline-none focus:border-[#B8F23A]"
                  placeholder="Ej. Innovaciones Cloud S.A. de C.V."
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#070707] mb-1">
                {language === 'en' ? 'Tax ID / RFC / CIF' : 'RFC / Identificación Fiscal'}
              </label>
              <div className="relative">
                <FileText size={15} className="absolute left-3 top-3 text-[#858A82]" />
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#8A8F98] bg-white text-xs outline-none focus:border-[#B8F23A] uppercase font-mono"
                  placeholder="XAXX010101000"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-[#070707] mb-1">
                {language === 'en' ? 'Billing Address' : 'Dirección de Facturación / Domicilio'}
              </label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-3 text-[#858A82]" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#8A8F98] bg-white text-xs outline-none focus:border-[#B8F23A]"
                  placeholder="Av. Insurgentes Sur 1602, Piso 4"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#070707] mb-1">
                {language === 'en' ? 'City' : 'Ciudad'}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#8A8F98] bg-white text-xs outline-none focus:border-[#B8F23A]"
                placeholder="Ciudad de México"
              />
            </div>

            <div>
              <label className="block font-bold text-[#070707] mb-1">
                {language === 'en' ? 'State / Province' : 'Estado / Provincia'}
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#8A8F98] bg-white text-xs outline-none focus:border-[#B8F23A]"
                placeholder="CDMX"
              />
            </div>

            <div>
              <label className="block font-bold text-[#070707] mb-1">
                {language === 'en' ? 'Postal Code' : 'Código Postal'}
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#8A8F98] bg-white text-xs outline-none focus:border-[#B8F23A]"
                placeholder="03900"
              />
            </div>

            <div>
              <label className="block font-bold text-[#070707] mb-1">
                {language === 'en' ? 'Country' : 'País'}
              </label>
              <div className="relative">
                <Globe size={15} className="absolute left-3 top-3 text-[#858A82]" />
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#8A8F98] bg-white text-xs outline-none focus:border-[#B8F23A]"
                >
                  <option value="Mexico">México (MX)</option>
                  <option value="United States">Estados Unidos (US)</option>
                  <option value="Spain">España (ES)</option>
                  <option value="Colombia">Colombia (CO)</option>
                  <option value="Argentina">Argentina (AR)</option>
                  <option value="Chile">Chile (CL)</option>
                  <option value="Peru">Perú (PE)</option>
                  <option value="Other">Otro País</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#8A8F98] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#8A8F98] text-xs font-bold text-[#555A52] hover:bg-[#F7F8F0] transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Cancel' : 'Cerrar'}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {isSaving
                ? (language === 'en' ? 'Saving...' : 'Guardando...')
                : (language === 'en' ? 'Save Profile Data' : 'Guardar Información')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
