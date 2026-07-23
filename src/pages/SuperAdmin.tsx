import { apiFetch } from '../lib/api';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Settings, User, Trash2, Eye, Activity, Monitor, Smartphone, Tablet, Globe, ExternalLink, Calendar } from 'lucide-react';
import { UserPopover } from '../components/UserPopover';

export function SuperAdmin() {
  const [orgs, setOrgs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{id: string, name: string} | null>(null);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'system' | 'visits'>('system');
  const [visitData, setVisitData] = useState<any>(null);
  const [loadingVisits, setLoadingVisits] = useState(true);

  const loadOrgs = () => {
    apiFetch('/api/organizations')
      .then(r => r.json())
      .then(data => setOrgs(data));
      
    apiFetch('/api/tickets')
      .then(r => r.json())
      .then(setTickets)
      .catch(() => {});
  };

  const loadVisits = () => {
    setLoadingVisits(true);
    apiFetch('/api/visits')
      .then(r => r.json())
      .then(data => {
        setVisitData(data);
        setLoadingVisits(false);
      })
      .catch(() => setLoadingVisits(false));
  };

  useEffect(() => {
    if (localStorage.getItem('superadminToken') !== 'true') {
      navigate('/login-superadmin');
      return;
    }
    loadOrgs();
    loadVisits();
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
            {activeTab === 'system' && (
              <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 text-sm">
                <Plus size={18} />
                Nueva Organización
              </button>
            )}
            {activeTab === 'visits' && (
              <button 
                onClick={loadVisits} 
                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 text-sm"
              >
                <Activity size={18} />
                Actualizar
              </button>
            )}
          </div>

          <div className="flex border-b border-slate-200 mb-8 font-sans">
            <button
              onClick={() => setActiveTab('system')}
              className={`pb-4 px-6 font-bold text-sm border-b-2 transition-all cursor-pointer ${
                activeTab === 'system'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Gestión de Sistema
            </button>
            <button
              onClick={() => setActiveTab('visits')}
              className={`pb-4 px-6 font-bold text-sm border-b-2 transition-all cursor-pointer ${
                activeTab === 'visits'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Visitas y Analítica
            </button>
          </div>

          {activeTab === 'system' ? (
            <>

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
          </>
          ) : (
            <div className="space-y-8 font-sans">
              {loadingVisits || !visitData ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 font-medium">
                  Cargando estadísticas de visitas...
                </div>
              ) : (
                <>
                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Eye size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Visitas</p>
                        <h4 className="text-2xl font-extrabold text-slate-900">{visitData.totalVisits}</h4>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <User size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visitas Únicas</p>
                        <h4 className="text-2xl font-extrabold text-slate-900">{visitData.uniqueVisits}</h4>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Monitor size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dispositivos</p>
                        <div className="text-xs space-y-0.5 text-slate-600 mt-0.5">
                          <p className="flex justify-between"><span>Desktop:</span> <strong>{visitData.devices.desktop || 0}</strong></p>
                          <p className="flex justify-between"><span>Móvil:</span> <strong>{visitData.devices.mobile || 0}</strong></p>
                          <p className="flex justify-between"><span>Tablet:</span> <strong>{visitData.devices.tablet || 0}</strong></p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Globe size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Navegadores Top</p>
                        <div className="text-xs space-y-0.5 text-slate-600 mt-0.5">
                          {Object.entries(visitData.browsers).slice(0, 3).map(([browser, count]) => (
                            <p key={browser} className="flex justify-between truncate">
                              <span className="truncate">{browser}:</span> <strong>{count as any}</strong>
                            </p>
                          ))}
                          {Object.keys(visitData.browsers).length === 0 && <p className="text-slate-400">Sin datos</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Sistemas Operativos</h3>
                      <div className="space-y-2">
                        {Object.entries(visitData.operatingSystems).map(([osName, count]) => (
                          <div key={osName} className="flex justify-between items-center text-sm text-slate-600">
                            <span className="font-semibold">{osName}</span>
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-xs font-mono font-bold">{count as any}</span>
                          </div>
                        ))}
                        {Object.keys(visitData.operatingSystems).length === 0 && (
                          <p className="text-slate-400 text-sm text-center py-4">No hay datos registrados</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Navegadores</h3>
                      <div className="space-y-2">
                        {Object.entries(visitData.browsers).map(([bName, count]) => (
                          <div key={bName} className="flex justify-between items-center text-sm text-slate-600">
                            <span className="font-semibold">{bName}</span>
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-xs font-mono font-bold">{count as any}</span>
                          </div>
                        ))}
                        {Object.keys(visitData.browsers).length === 0 && (
                          <p className="text-slate-400 text-sm text-center py-4">No hay datos registrados</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                      <h3 className="font-bold text-xs text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={16} />
                        Historial de Visitas Recientes (Últimos 200)
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="p-4">Fecha/Hora</th>
                            <th className="p-4">IP</th>
                            <th className="p-4">Dispositivo</th>
                            <th className="p-4">SO</th>
                            <th className="p-4">Navegador</th>
                            <th className="p-4">Idioma</th>
                            <th className="p-4">Procedencia</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {visitData.recentVisits.map((visit: any) => {
                            const dateStr = new Date(visit.visitedAt).toLocaleString();
                            return (
                              <tr key={visit._id || visit.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-medium text-slate-800">{dateStr}</td>
                                <td className="p-4 font-mono text-xs">{visit.ip}</td>
                                <td className="p-4">
                                  <div className="flex flex-col">
                                    <span className="capitalize font-semibold text-slate-700">{visit.deviceType}</span>
                                    {visit.screenWidth && (
                                      <span className="text-[10px] text-slate-400">{visit.screenWidth}x{visit.screenHeight}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">{visit.os}</td>
                                <td className="p-4">{visit.browser}</td>
                                <td className="p-4 font-mono text-xs uppercase">{visit.language || '-'}</td>
                                <td className="p-4 max-w-[180px] truncate" title={visit.referer}>
                                  {visit.referer ? (
                                    <a 
                                      href={visit.referer} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-blue-600 hover:underline flex items-center gap-1 inline-flex"
                                    >
                                      <span className="truncate max-w-[140px]">{visit.referer}</span>
                                      <ExternalLink size={10} />
                                    </a>
                                  ) : (
                                    <span className="text-slate-400 italic text-xs">Directo</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {visitData.recentVisits.length === 0 && (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-400 italic">No hay visitas registradas aún</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
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
