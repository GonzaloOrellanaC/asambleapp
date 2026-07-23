import { apiFetch } from '../lib/api';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Settings, User, Trash2 } from 'lucide-react';
import { UserPopover } from '../components/UserPopover';

export function SuperAdmin() {
  const [orgs, setOrgs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{id: string, name: string} | null>(null);
  const navigate = useNavigate();

  const loadOrgs = () => {
    apiFetch('/api/organizations')
      .then(r => r.json())
      .then(data => setOrgs(data));
      
    apiFetch('/api/tickets')
      .then(r => r.json())
      .then(setTickets)
      .catch(() => {});
  };

  useEffect(() => {
    if (localStorage.getItem('superadminToken') !== 'true') {
      navigate('/login-superadmin');
      return;
    }
    loadOrgs();
  }, [navigate]);

  const executeDelete = async () => {
    if (!confirmDeleteModal) return;
    const { id } = confirmDeleteModal;
    setDeletingId(id);
    try {
      const res = await apiFetch(`/api/organizations/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setConfirmDeleteModal(null);
        loadOrgs();
      } else {
        console.error("Error al eliminar la organización");
      }
    } catch (e) {
      console.error("Error de conexión", e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setConfirmDeleteModal({ id, name });
  };

  const [closeModal, setCloseModal] = useState<{ id: string, subject: string } | null>(null);
  const [customResponse, setCustomResponse] = useState('');

  const handleCloseTicket = async (ticketId: string, is24hTimeout = false, customMsg?: string) => {
    try {
      const res = await apiFetch(`/api/tickets/${ticketId}/close`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          closingMessage: customMsg, 
          is24hTimeout,
          senderName: 'Soporte AsambleApp',
          senderRole: 'superadmin'
        })
      });
      if (res.ok) {
        setCloseModal(null);
        setCustomResponse('');
        loadOrgs();
      } else {
        alert('Error al cerrar el ticket');
      }
    } catch (e) {
      alert('Error al conectar con el servidor');
    }
  };

  const handleReplyTicket = async (ticketId: string, message: string, closeTicket: boolean = false) => {
    if (!message) return;
    try {
      const res = await apiFetch(`/api/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          senderName: 'Soporte AsambleApp',
          senderRole: 'superadmin',
          closeTicket
        })
      });
      if (res.ok) {
        setCloseModal(null);
        setCustomResponse('');
        loadOrgs();
      } else {
        alert('Error al responder el ticket');
      }
    } catch (e) {
      alert('Error al conectar con el servidor');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 z-50 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/asambleapp_logo_redesign.svg" alt="AsambleApp" className="h-7 w-auto" />
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Global</span>
            <span className="text-sm font-medium text-slate-600">SaaS Management</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-800">Root System</p>
            <p className="text-[10px] text-slate-500 uppercase">Super Admin</p>
          </div>
          <div className="w-10 h-10 bg-slate-200 rounded-full border border-slate-300 overflow-visible relative">
            <UserPopover role="Super Administrador">
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-slate-300 transition-all">
                <User className="w-full h-full p-2 text-slate-500" />
              </div>
            </UserPopover>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Panel de Super Administrador</h1>
              <p className="text-slate-500 mt-1 text-sm">Gestión global de organizaciones y facturación.</p>
            </div>
            <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 text-sm">
              <Plus size={18} />
              Nueva Organización
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-slate-500">
                <Building2 size={16} />
                Organizaciones Activas
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {orgs.map((org: any) => (
                <div key={org.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <h3 className="font-semibold text-slate-800">{org.name}</h3>
                    <p className="text-slate-400 text-sm tracking-wide">/{org.customUrl}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg shadow-sm border border-slate-200 flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: org.styles.primaryColor }}>
                      {org.name.charAt(0)}
                    </div>
                    <button 
                      onClick={() => console.log('Settings for', org.name)}
                      className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                      title="Configuración"
                    >
                      <Settings size={20} />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(org.id, org.name)}
                      disabled={deletingId === org.id}
                      className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                      title="Eliminar Organización"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
              {orgs.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm">Cargando organizaciones...</div>
              )}
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mt-8">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-slate-500">
                Tickets de Soporte (AsambleApp)
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {tickets.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No hay tickets registrados</div>
              ) : tickets.map((t: any) => {
                const tid = t._id || t.id;
                const isClosed = t.status === 'closed';
                return (
                  <div key={tid} className="p-6 hover:bg-slate-50 transition-colors space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800">{t.subject}</h3>
                          {t.forwardedToSuperAdmin && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded uppercase tracking-wider">
                              Reenviado por Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Organización: <strong>{t.orgId?.name || 'Desconocida'}</strong> {t.userId && `• Usuario: ${t.userId?.name} (${t.userId?.email})`}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isClosed ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {isClosed ? 'Cerrado' : 'Abierto'}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">{t.message}</p>

                    {/* Thread Responses */}
                    {t.responses && t.responses.length > 0 && (
                      <div className="space-y-2 pl-4 border-l-2 border-slate-200 mt-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Respuestas en este ticket:</span>
                        {t.responses.map((resp: any, idx: number) => (
                          <div key={idx} className="bg-slate-100 p-2.5 rounded-lg text-xs space-y-1">
                            <div className="flex justify-between items-center text-slate-500 font-medium">
                              <span><strong>{resp.senderName || 'Soporte'}</strong> ({resp.senderRole || 'admin'})</span>
                              <span className="text-[10px]">{new Date(resp.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-700 whitespace-pre-wrap">{resp.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {!isClosed && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleCloseTicket(tid, true)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
                          title="Envía respuesta tipo de cierre tras 24 hrs sin respuesta"
                        >
                          Cerrar por Inactividad (24h)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCloseModal({ id: tid, subject: t.subject })}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                        >
                          Responder Ticket
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>
      </div>

      {/* Reply or Close Ticket Modal */}
      {closeModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-1 text-slate-900">Responder Ticket de Soporte</h3>
            <p className="text-xs text-slate-500 mb-4">Ticket: "{closeModal.subject}"</p>
            
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Mensaje o Respuesta para el usuario:</label>
            <textarea
              value={customResponse}
              onChange={(e) => setCustomResponse(e.target.value)}
              placeholder="Escribe el mensaje de respuesta..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm mb-4 outline-none focus:ring-2 focus:ring-slate-900 min-h-[120px]"
            />

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setCloseModal(null); setCustomResponse(''); }}
                className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!customResponse.trim()}
                onClick={() => handleReplyTicket(closeModal.id, customResponse, false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Enviar Respuesta
              </button>
              <button
                type="button"
                disabled={!customResponse.trim()}
                onClick={() => handleReplyTicket(closeModal.id, customResponse, true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 disabled:opacity-50"
              >
                Responder y Cerrar Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-2 text-slate-900">Eliminar Organización</h3>
            <p className="text-sm text-slate-600 mb-6">
              ¿Estás seguro de que deseas eliminar permanentemente la organización <strong>"{confirmDeleteModal.name}"</strong> y todos sus datos asociados? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setConfirmDeleteModal(null)} 
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={executeDelete}
                disabled={deletingId === confirmDeleteModal.id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-70 flex items-center gap-2"
              >
                {deletingId === confirmDeleteModal.id ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
