import { Outlet } from 'react-router-dom';
import { OrgProvider, useOrg } from '../context/OrgContext';
import { OrgHeader } from '../components/OrgHeader';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { io } from 'socket.io-client';
import { Bell, X } from 'lucide-react';

function OrgContent() {
  const { org, currentUser, departments, loading, updateUser } = useOrg();
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [popupNotification, setPopupNotification] = useState<{title: string, message: string} | null>(null);

  useEffect(() => {
    if (!currentUser?.id || !currentUser?.notificationPreferences?.popups) return;
    
    // Check local storage for preference if needed, but assuming enabled by default
    const prefs = currentUser.notificationPreferences || { popups: true };
    if (!prefs.popups) return;

    const socket = io();
    socket.emit('join_user', currentUser.id);
    
    socket.on('new_notification', (data: {title: string, message: string}) => {
      setPopupNotification(data);
      setTimeout(() => {
        setPopupNotification(null);
      }, 5000); // Hide after 5 seconds
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  if (loading) {
    return <div className="h-full flex items-center justify-center">Cargando...</div>;
  }

  const needsDepartment = org?.settings?.requireDepartment && 
    (!currentUser?.departmentIds || currentUser.departmentIds.length === 0) &&
    (!currentUser?.departmentId);

  return (
    <>
      <OrgHeader />
      <div className="flex-1 flex flex-col min-h-0 relative">
        <Outlet />
        
        {popupNotification && (
          <div className="fixed bottom-4 right-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-4 w-80 z-[300] animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Bell size={16} />
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{popupNotification.title}</h4>
              </div>
              <button onClick={() => setPopupNotification(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">{popupNotification.message}</p>
          </div>
        )}

        {needsDepartment && (
          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-[200] p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold mb-2">Se requiere Grupo de Trabajo</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
                La organización ahora requiere que selecciones tu grupo de trabajo antes de continuar.
                {org.settings.allowMultipleDepartments ? ' Puedes seleccionar más de uno.' : ' Selecciona un grupo.'}
              </p>
              
              <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2 space-y-2 mb-6">
                {departments.map((d: any) => {
                  const id = d._id || d.id;
                  const isChecked = selectedDepts.includes(id);
                  return (
                    <label key={id} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer border border-transparent hover:border-slate-200">
                      <input 
                        type={org.settings.allowMultipleDepartments ? "checkbox" : "radio"}
                        name="department_selection"
                        checked={isChecked}
                        onChange={(e) => {
                          if (org.settings.allowMultipleDepartments) {
                            if (e.target.checked) setSelectedDepts([...selectedDepts, id]);
                            else setSelectedDepts(selectedDepts.filter(did => did !== id));
                          } else {
                            setSelectedDepts([id]);
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">{d.name}</span>
                    </label>
                  );
                })}
                {departments.length === 0 && <p className="text-sm text-slate-500 p-2">No hay grupos disponibles. Contacta al administrador.</p>}
              </div>

              <button 
                disabled={selectedDepts.length === 0 || saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await apiFetch(`/api/users/org/${org.id}/${currentUser._id || currentUser.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ departmentIds: selectedDepts })
                    });
                    // Reload window to apply changes cleanly
                    window.location.reload();
                  } catch (e) {
                    console.error(e);
                    setSaving(false);
                  }
                }}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar y Continuar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function OrgLayout() {
  return (
    <OrgProvider>
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
        <OrgContent />
      </div>
    </OrgProvider>
  );
}
