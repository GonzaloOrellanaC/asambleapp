import React, { useState, useEffect } from 'react';
import { useOrg } from '../context/OrgContext';
import { Send, ArrowLeft, CheckCircle2, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export function SupportTicketPage() {
  const { org, currentUser } = useOrg();
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSent, setTicketSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myTickets, setMyTickets] = useState<any[]>([]);

  const isAdmin = currentUser?.role === 'administrador' || currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const userId = currentUser?._id || currentUser?.id;
  const orgId = org?._id || org?.id;

  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [userReplyText, setUserReplyText] = useState('');

  const loadMyTickets = () => {
    if (!userId) return;
    apiFetch(`/api/tickets/user/${userId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMyTickets(data);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadMyTickets();
  }, [userId]);

  const handleUserReply = async (ticketId: string) => {
    if (!userReplyText.trim()) return;
    try {
      const res = await apiFetch(`/api/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userReplyText,
          senderName: currentUser?.name || 'Usuario',
          senderRole: 'user',
          closeTicket: false
        })
      });
      if (res.ok) {
        setUserReplyText('');
        setActiveReplyId(null);
        loadMyTickets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orgId, 
          userId,
          subject: ticketSubject, 
          message: ticketMessage,
          forwardedToSuperAdmin: isAdmin // Org admins send directly to SuperAdmin / Soporte AsambleApp
        })
      });
      if (res.ok) {
        setTicketSent(true);
        setTicketSubject('');
        setTicketMessage('');
        loadMyTickets();
        setTimeout(() => setTicketSent(false), 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-6 md:p-12 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link to={`/${org?.customUrl}`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-6 transition-colors">
            <ArrowLeft size={16} className="mr-2" />
            Volver al panel
          </Link>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-8 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Soporte Técnico</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                  {isAdmin 
                    ? 'Como Administrador de la organización, tus solicitudes van directamente a Soporte AsambleApp (OM Tecnología).'
                    : 'Envía un ticket de soporte al administrador de tu organización o soporte técnico.'
                  }
                </p>
              </div>
              {isAdmin && (
                <span className="self-start sm:self-center px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-full uppercase tracking-wider">
                  Soporte AsambleApp
                </span>
              )}
            </div>

            <div className="p-8">
              {ticketSent ? (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-6 rounded-xl border border-green-200 dark:border-green-800 text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-400">
                    <Send size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">¡Ticket enviado con éxito!</h3>
                  <p className="text-sm">
                    {isAdmin 
                      ? 'El equipo de Soporte AsambleApp (OM Tecnología) ha recibido tu ticket.'
                      : 'El equipo de administración de tu organización ha recibido tu solicitud.'
                    }
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendTicket} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Asunto</label>
                    <input
                      type="text"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Ej. Aumento de límite de audio, Consulta sobre integraciones, Asistencia técnica"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[var(--org-color)] dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mensaje</label>
                    <textarea
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="Describe detalladamente tu problema o solicitud de asistencia..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 min-h-[140px] outline-none focus:ring-2 focus:ring-[var(--org-color)] dark:text-white"
                      required
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !ticketSubject || !ticketMessage}
                      className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-md"
                      style={{ backgroundColor: org?.styles?.primaryColor || '#1d4ed8' }}
                    >
                      <Send size={18} />
                      {isSubmitting ? 'Enviando...' : 'Enviar Ticket'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* User's Ticket History */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-600 dark:text-blue-400" />
              Historial de mis Tickets
            </h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {myTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                Aún no has registrado tickets de soporte.
              </div>
            ) : myTickets.map((t: any) => {
              const tid = t._id || t.id;
              const isOpen = t.status !== 'closed';
              return (
                <div key={tid} className="p-6 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">{t.subject}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Enviado el {new Date(t.createdAt).toLocaleDateString()} a las {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                      !isOpen 
                        ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' 
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    }`}>
                      {!isOpen ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      {!isOpen ? 'Cerrado' : 'Abierto'}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200">
                    <p className="font-semibold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Consulta original:</p>
                    <p className="whitespace-pre-wrap">{t.message}</p>
                  </div>

                  {/* Thread Responses */}
                  {t.responses && t.responses.length > 0 && (
                    <div className="space-y-2.5 pl-4 border-l-2 border-blue-500/40 dark:border-blue-400/40 mt-3">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare size={14} className="text-blue-500" />
                        Respuestas de Soporte / Historial:
                      </span>
                      {t.responses.map((resp: any, idx: number) => {
                        const isSupportSender = resp.senderRole === 'superadmin' || resp.senderRole === 'admin';
                        return (
                          <div 
                            key={idx} 
                            className={`p-3.5 rounded-xl text-xs space-y-1.5 border ${
                              isSupportSender 
                                ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-800/60 text-blue-950 dark:text-blue-100' 
                                : 'bg-slate-100/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex justify-between items-center font-semibold">
                              <span className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                  isSupportSender 
                                    ? 'bg-blue-600 text-white dark:bg-blue-500' 
                                    : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                                }`}>
                                  {isSupportSender ? 'Soporte' : 'Tú'}
                                </span>
                                <span>{resp.senderName || 'Soporte'}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal">
                                {new Date(resp.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap font-normal leading-relaxed">{resp.message}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isOpen && (
                    <div className="pt-2">
                      {activeReplyId === tid ? (
                        <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Añadir un mensaje a esta consulta:
                          </label>
                          <textarea
                            value={userReplyText}
                            onChange={(e) => setUserReplyText(e.target.value)}
                            placeholder="Escribe tu mensaje o respuesta..."
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--org-color)] dark:text-white min-h-[90px]"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => { setActiveReplyId(null); setUserReplyText(''); }}
                              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              disabled={!userReplyText.trim()}
                              onClick={() => handleUserReply(tid)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow transition-all disabled:opacity-50"
                            >
                              <Send size={14} />
                              Enviar Respuesta
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setActiveReplyId(tid); setUserReplyText(''); }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1"
                        >
                          <MessageSquare size={14} />
                          Responder a Soporte
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
