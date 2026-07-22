import React, { useState, useEffect } from 'react';
import { useOrg } from '../context/OrgContext';
import { apiFetch } from '../lib/api';
import { Bell, MailOpen, User, CheckCircle2, MessageSquare, Archive, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotificationsPage() {
  const { org, currentUser } = useOrg();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.id) {
      fetchNotifications();
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch(`/api/notifications/${currentUser?.id}`);
      const data = await res.json();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiFetch(`/api/notifications/read-all/${currentUser?.id}`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'invitation': return <User className="text-blue-500" size={20} />;
      case 'chat_message': return <MessageSquare className="text-emerald-500" size={20} />;
      case 'debate_closed': return <Archive className="text-purple-500" size={20} />;
      case 'voting_ended': return <CheckCircle2 className="text-green-500" size={20} />;
      default: return <Bell className="text-slate-500" size={20} />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-6 md:p-12 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <Link to={`/${org?.customUrl}`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-6 transition-colors">
          <ArrowLeft size={16} className="mr-2" />
          Volver al panel
        </Link>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <Bell size={24} className="text-blue-600 dark:text-blue-400" /> 
                Notificaciones
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {unreadCount} nuevas
                  </span>
                )}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Registros de invitaciones, debates y votaciones.</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors"
              >
                <MailOpen size={16} />
                Marcar todas como leídas
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {loading ? (
              <div className="p-12 text-center text-slate-500">Cargando notificaciones...</div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Bell size={28} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p>No tienes notificaciones por el momento.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n._id} className={`p-4 md:p-6 transition-colors flex gap-4 ${n.read ? 'bg-white dark:bg-slate-800' : 'bg-blue-50/50 dark:bg-slate-800/80'}`}>
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${n.read ? 'bg-slate-100 dark:bg-slate-700' : 'bg-white shadow-sm border border-slate-200 dark:bg-slate-700 dark:border-slate-600'}`}>
                      {getIconForType(n.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 md:gap-4 mb-1">
                      <h3 className={`font-semibold ${n.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                        {n.title}
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className={`text-sm mb-3 ${n.read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {n.message}
                    </p>
                    <div className="flex items-center gap-3">
                      {n.projectId && (
                        <Link 
                          to={`/${org?.customUrl}/p/${n.projectId._id}`} 
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                          onClick={() => !n.read && handleMarkAsRead(n._id)}
                        >
                          Ver Proyecto
                        </Link>
                      )}
                      {!n.read && (
                        <button 
                          onClick={() => handleMarkAsRead(n._id)}
                          className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                          Marcar como leída
                        </button>
                      )}
                    </div>
                  </div>
                  {!n.read && (
                    <div className="flex-shrink-0 flex items-center">
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
