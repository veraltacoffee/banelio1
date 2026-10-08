import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserService, DnsRecord } from '../../types';
import { X, Plus, Trash2, Globe, Shield } from 'lucide-react';

interface DnsManagerModalProps {
  service: UserService | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DnsManagerModal({ service, isOpen, onClose }: DnsManagerModalProps) {
  const { addDnsRecord, removeDnsRecord, updateService } = useApp();

  const [type, setType] = useState<DnsRecord['type']>('A');
  const [host, setHost] = useState('@');
  const [value, setValue] = useState('');
  const ttl = 3600;
  const [priority, setPriority] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeNsTab, setActiveNsTab] = useState<'RECORDS' | 'NAMESERVERS'>('RECORDS');

  // Nameservers state
  const [ns1, setNs1] = useState(service?.nameservers?.[0] || 'ns1.banelio.com');
  const [ns2, setNs2] = useState(service?.nameservers?.[1] || 'ns2.banelio.com');

  if (!isOpen || !service) return null;

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    addDnsRecord(service.id, {
      type,
      host: host.trim() || '@',
      value: value.trim(),
      ttl,
      priority: type === 'MX' ? priority : undefined
    });

    setValue('');
    setHost('@');
    setShowAddForm(false);
  };

  const handleSaveNameservers = (e: React.FormEvent) => {
    e.preventDefault();
    updateService(service.id, {
      nameservers: [ns1, ns2]
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070707]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] rounded-3xl max-w-3xl w-full shadow-2xl border border-[#8A8F98] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#FCFCF8] text-[#070707] p-6 flex items-center justify-between shrink-0 border-b border-[#8A8F98]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F7F8F0] border border-[#8A8F98] text-[#B8F23A] flex items-center justify-center font-bold">
              <Globe size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base">Gestor de Zona DNS</h3>
                <span className="bg-[#B8F23A] text-[#070707] border border-[#B8F23A] text-[10px] font-black uppercase px-2 py-0.5 rounded">
                  Activo
                </span>
              </div>
              <p className="text-xs text-[#555A52] font-mono mt-0.5">{service.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#555A52] hover:text-[#070707] p-1 rounded-lg hover:bg-[#F7F8F0] transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#8A8F98] bg-[#FCFCF8] px-6 pt-2 shrink-0">
          <button
            onClick={() => setActiveNsTab('RECORDS')}
            className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer ${
              activeNsTab === 'RECORDS'
                ? 'border-[#B8F23A] text-[#B8F23A] bg-[#FFFFFF] rounded-t-lg'
                : 'border-transparent text-[#555A52] hover:text-[#070707]'
            }`}
          >
            Registros DNS ({service.dnsRecords?.length || 0})
          </button>
          <button
            onClick={() => setActiveNsTab('NAMESERVERS')}
            className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer ${
              activeNsTab === 'NAMESERVERS'
                ? 'border-[#B8F23A] text-[#B8F23A] bg-[#FFFFFF] rounded-t-lg'
                : 'border-transparent text-[#555A52] hover:text-[#070707]'
            }`}
          >
            Servidores de Nombres (NS)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeNsTab === 'RECORDS' ? (
            <>
              {/* DNS Propagation Info */}
              <div className="bg-[#F7F8F0] border border-[#8A8F98] rounded-2xl p-4 flex items-center justify-between text-xs text-[#070707]">
                <div className="flex items-center gap-2.5">
                  <Shield size={18} className="text-[#B8F23A] shrink-0" />
                  <span>
                    La red Anycast de Banelio propaga tus cambios DNS en <b className="text-[#B8F23A]">menos de 60 segundos</b> mundialmente.
                  </span>
                </div>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-3.5 py-1.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl font-black flex items-center gap-1.5 shrink-0 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus size={14} />
                  <span>{showAddForm ? 'Cancelar' : 'Añadir Registro'}</span>
                </button>
              </div>

              {/* Add New Record Form */}
              {showAddForm && (
                <form onSubmit={handleCreateRecord} className="bg-[#FCFCF8] p-4 rounded-2xl border border-[#8A8F98] space-y-3 shadow-xs">
                  <h4 className="font-bold text-xs text-[#070707]">Crear Nuevo Registro DNS</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] font-semibold text-[#555A52] block mb-1">Tipo</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        className="w-full bg-[#FFFFFF] border border-[#8A8F98] rounded-xl px-2.5 py-2 font-bold text-[#070707] outline-none"
                      >
                        <option value="A">A (Dirección IPv4)</option>
                        <option value="AAAA">AAAA (IPv6)</option>
                        <option value="CNAME">CNAME (Alias)</option>
                        <option value="MX">MX (Servidor Correo)</option>
                        <option value="TXT">TXT (SPF / DKIM)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#555A52] block mb-1">Host / Nombre</label>
                      <input
                        type="text"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        placeholder="@ o www o mail"
                        className="w-full bg-[#FFFFFF] border border-[#8A8F98] rounded-xl px-3 py-2 text-[#070707] font-mono outline-none focus:border-[#B8F23A]"
                      />
                    </div>

                    <div className={type === 'MX' ? 'sm:col-span-1' : 'sm:col-span-2'}>
                      <label className="text-[11px] font-semibold text-[#555A52] block mb-1">
                        {type === 'A' ? 'Dirección IP (ej: 185.199.108.15)' : 'Destino / Valor'}
                      </label>
                      <input
                        type="text"
                        required
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={type === 'A' ? '185.199.108.153' : type === 'CNAME' ? 'miempresa.com' : 'v=spf1 ...'}
                        className="w-full bg-[#FFFFFF] border border-[#8A8F98] rounded-xl px-3 py-2 text-[#070707] font-mono outline-none focus:border-[#B8F23A]"
                      />
                    </div>

                    {type === 'MX' && (
                      <div>
                        <label className="text-[11px] font-semibold text-[#555A52] block mb-1">Prioridad</label>
                        <input
                          type="number"
                          value={priority}
                          onChange={(e) => setPriority(parseInt(e.target.value))}
                          className="w-full bg-[#FFFFFF] border border-[#8A8F98] rounded-xl px-3 py-2 text-[#070707] font-mono outline-none focus:border-[#B8F23A]"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1.5 text-xs text-[#555A52] hover:text-[#070707] font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl text-xs font-black transition-colors shadow-xs cursor-pointer"
                    >
                      Guardar Registro
                    </button>
                  </div>
                </form>
              )}

              {/* Records Table */}
              <div className="border border-[#8A8F98] rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FCFCF8] text-[#555A52] font-bold border-b border-[#8A8F98]">
                    <tr>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Host</th>
                      <th className="py-3 px-4">Valor / Destino</th>
                      <th className="py-3 px-4">TTL</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8A8F98] font-mono bg-[#FFFFFF]">
                    {(service.dnsRecords || []).map((rec) => (
                      <tr key={rec.id} className="hover:bg-[#F7F8F0] transition-colors">
                        <td className="py-3 px-4">
                          <span className="bg-[#F7F8F0] text-[#B8F23A] font-bold px-2 py-0.5 rounded text-[11px] border border-[#8A8F98]">
                            {rec.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#070707]">{rec.host}</td>
                        <td className="py-3 px-4 text-[#555A52] max-w-xs truncate">{rec.value}</td>
                        <td className="py-3 px-4 text-[#555A52]">{rec.ttl}s</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => removeDnsRecord(service.id, rec.id)}
                            className="p-1.5 text-[#858A82] hover:text-[#070707] hover:bg-[#F7F8F0] rounded-lg transition-colors cursor-pointer"
                            title="Eliminar registro"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* NAMESERVERS TAB */
            <form onSubmit={handleSaveNameservers} className="space-y-4">
              <div className="bg-[#FCFCF8] p-4 rounded-2xl border border-[#8A8F98] space-y-3 shadow-xs">
                <h4 className="font-bold text-xs text-[#070707]">Servidores de Nombres Autoritativos</h4>
                <p className="text-xs text-[#555A52]">
                  Apunta tu dominio a los servidores DNS de Banelio o personaliza con Cloudflare / otros registradores.
                </p>

                <div className="space-y-3 text-xs font-mono">
                  <div>
                    <label className="text-[11px] font-bold text-[#555A52] font-sans block mb-1">Nameserver 1</label>
                    <input
                      type="text"
                      value={ns1}
                      onChange={(e) => setNs1(e.target.value)}
                      className="w-full bg-[#FFFFFF] border border-[#8A8F98] rounded-xl px-3 py-2 text-[#070707] outline-none focus:border-[#B8F23A]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#555A52] font-sans block mb-1">Nameserver 2</label>
                    <input
                      type="text"
                      value={ns2}
                      onChange={(e) => setNs2(e.target.value)}
                      className="w-full bg-[#FFFFFF] border border-[#8A8F98] rounded-xl px-3 py-2 text-[#070707] outline-none focus:border-[#B8F23A]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
                  >
                    Actualizar Nameservers
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FCFCF8] border-t border-[#8A8F98] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#FFFFFF] hover:bg-[#F7F8F0] border border-[#8A8F98] text-[#070707] rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Finalizar Edición
          </button>
        </div>
      </div>
    </div>
  );
}
