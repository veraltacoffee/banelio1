import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SupportTicket } from '../../types';
import { X, MessageSquare, Send, User, Shield } from 'lucide-react';

interface TicketModalProps {
  ticket: SupportTicket | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export default function TicketModal({ ticket, isOpen, onClose, isAdmin = false }: TicketModalProps) {
  const { replyTicket, updateTicketStatus, createTicket } = useApp();
  const [replyText, setReplyText] = useState('');

  // New ticket state
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<'Billing' | 'Technical' | 'Domains' | 'General'>('Technical');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [newInitialMsg, setNewInitialMsg] = useState('');

  if (!isOpen) return null;

  const isCreating = !ticket;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !ticket) return;

    replyTicket(ticket.id, replyText.trim(), isAdmin);
    setReplyText('');
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newInitialMsg.trim()) return;

    createTicket(newSubject.trim(), newCategory, newPriority, newInitialMsg.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070707]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] rounded-3xl max-w-2xl w-full shadow-2xl border border-[#8A8F98] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#FCFCF8] text-[#070707] p-6 flex items-center justify-between shrink-0 border-b border-[#8A8F98]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F7F8F0] border border-[#8A8F98] text-[#B8F23A] flex items-center justify-center font-bold">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base">
                {isCreating ? 'Abrir Nuevo Ticket de Soporte' : `Ticket #${ticket?.id}`}
              </h3>
              <p className="text-xs text-[#555A52]">
                {isCreating ? 'Soporte técnico y facturación 24/7' : ticket?.subject}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#555A52] hover:text-[#070707] p-1 rounded-lg hover:bg-[#F7F8F0] transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* CREATE NEW TICKET VIEW */}
        {isCreating ? (
          <form onSubmit={handleCreateTicket} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            <div>
              <label className="font-bold text-[#070707] block mb-1">Asunto / Título de la Incidencia</label>
              <input
                type="text"
                required
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="ej: Problema al conectar registros MX de correo corporativo"
                className="w-full bg-[#FCFCF8] border border-[#8A8F98] rounded-xl px-3.5 py-2.5 text-[#070707] font-medium outline-none focus:border-[#B8F23A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#070707] block mb-1">Categoría</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#FCFCF8] border border-[#8A8F98] rounded-xl px-3 py-2 text-[#070707] font-semibold outline-none focus:border-[#B8F23A]"
                >
                  <option value="Technical">Soporte Técnico (DNS/Hosting)</option>
                  <option value="Domains">Gestión de Dominios / EPP</option>
                  <option value="Billing">Facturación y Pagos</option>
                  <option value="General">Consultas Comerciales</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#070707] block mb-1">Prioridad</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full bg-[#FCFCF8] border border-[#8A8F98] rounded-xl px-3 py-2 text-[#070707] font-semibold outline-none focus:border-[#B8F23A]"
                >
                  <option value="Low">Baja</option>
                  <option value="Medium">Media</option>
                  <option value="High">Alta</option>
                  <option value="Critical">Crítica (Servidor caído)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-[#070707] block mb-1">Descripción detallada del mensaje</label>
              <textarea
                required
                rows={5}
                value={newInitialMsg}
                onChange={(e) => setNewInitialMsg(e.target.value)}
                placeholder="Por favor describe los detalles del error o lo que necesitas configurar..."
                className="w-full bg-[#FCFCF8] border border-[#8A8F98] rounded-xl p-3 text-[#070707] font-medium outline-none focus:border-[#B8F23A]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#8A8F98]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#FFFFFF] border border-[#8A8F98] text-[#555A52] hover:text-[#070707] rounded-xl font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl font-black shadow-xs cursor-pointer transition-all"
              >
                Enviar Ticket de Soporte
              </button>
            </div>
          </form>
        ) : (
          /* TICKET CONVERSATION VIEW */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Ticket Metadata bar */}
            <div className="bg-[#FCFCF8] border-b border-[#8A8F98] px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-[#555A52]">Estado:</span>
                <span className="font-bold px-2 py-0.5 rounded text-[11px] bg-[#B8F23A] text-[#070707] border border-[#B8F23A]">
                  {ticket?.status}
                </span>
                <span className="text-[#8A8F98]">|</span>
                <span className="text-[#555A52] font-medium">Prioridad: <b className="text-[#070707]">{ticket?.priority}</b></span>
                <span className="text-[#8A8F98]">|</span>
                <span className="text-[#555A52] font-medium">Categoría: <b className="text-[#070707]">{ticket?.category}</b></span>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#555A52]">Cambiar estado:</span>
                  <select
                    value={ticket?.status}
                    onChange={(e) => updateTicketStatus(ticket!.id, e.target.value)}
                    className="bg-[#FFFFFF] border border-[#8A8F98] rounded px-2 py-0.5 text-xs font-bold text-[#070707] outline-none"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="WAITING_CUSTOMER">WAITING_CUSTOMER</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              )}
            </div>

            {/* Message Thread */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-[#FCFCF8]">
              {ticket?.messages.map((m) => {
                const isStaff = m.sender === 'SUPPORT' || m.sender === 'ADMIN';

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isStaff ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-[#555A52] mb-1">
                      {isStaff ? (
                        <>
                          <Shield size={12} className="text-[#B8F23A]" />
                          <span className="font-bold text-[#B8F23A]">{m.senderName}</span>
                        </>
                      ) : (
                        <>
                          <User size={12} className="text-[#858A82]" />
                          <span className="font-bold text-[#070707]">{m.senderName}</span>
                        </>
                      )}
                      <span>&bull;</span>
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl max-w-lg text-xs leading-relaxed ${
                        isStaff
                          ? 'bg-[#F7F8F0] text-[#070707] border border-[#B8F23A] rounded-tl-xs shadow-xs'
                          : 'bg-[#FFFFFF] text-[#070707] border border-[#8A8F98] rounded-tr-xs shadow-xs'
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Box */}
            <form onSubmit={handleSendReply} className="p-4 bg-[#FCFCF8] border-t border-[#8A8F98] flex gap-2 shrink-0">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={isAdmin ? "Escribir respuesta oficial de soporte..." : "Escribe tu respuesta aquí..."}
                className="flex-1 px-4 py-2.5 bg-[#FFFFFF] border border-[#8A8F98] rounded-xl text-xs text-[#070707] outline-none focus:border-[#B8F23A]"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Send size={14} />
                <span>Responder</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
