import React, { useState, useEffect } from 'react';
import { useOrg } from '../context/OrgContext';
import { Settings, Image as ImageIcon, Link2, Moon, Sun, Monitor } from 'lucide-react';
import { ImageUpload } from './ImageUpload';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { org, currentUser, updateOrgUrl, updateOrg } = useOrg();
  const isAdmin = currentUser?.role === 'administrador' || currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const orgUrl = org?.customUrl || '';
  
  const [activeTab, setActiveTab] = useState(isAdmin ? 'org' : 'prefs');
  
  // Org fields
  const [newUrl, setNewUrl] = useState(orgUrl);
  const [logoUrl, setLogoUrl] = useState(org?.logoUrl || '');
  const [primaryColor, setPrimaryColor] = useState(org?.styles?.primaryColor || '#1d4ed8');
  const [bannedWords, setBannedWords] = useState(org?.settings?.bannedWords?.join(', ') || '');
  const [audioMessages, setAudioMessages] = useState(org?.settings?.audioMessages ?? true);
  const [reactions, setReactions] = useState(org?.settings?.reactions ?? true);
  
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSent, setTicketSent] = useState(false);
  const audioLimit = org?.settings?.audioLimit || 30;

  const handleSendTicket = async (isForSuperAdmin = false) => {
    if (!ticketSubject || !ticketMessage) return;
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orgId: org?._id || org?.id, 
          userId: currentUser?._id || currentUser?.id,
          subject: ticketSubject, 
          message: ticketMessage,
          forwardedToSuperAdmin: isForSuperAdmin
        })
      });
      if (res.ok) {
        setTicketSent(true);
        setTicketSubject('');
        setTicketMessage('');
        setTimeout(() => setTicketSent(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };
  
  // Preferences
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
    window.dispatchEvent(new Event('darkModeChanged'));
  }, [darkMode]);

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    
    // First update general info
        const words = bannedWords.split(',').map(w => w.trim()).filter(w => w);
    const resOrg = await updateOrg({ 
      customUrl: newUrl, 
      logoUrl, 
      styles: { primaryColor },
      settings: { ...org?.settings, bannedWords: words, audioMessages, reactions }
    });
    
    if (resOrg) {
      onClose();
    } else {
      setError('Error al actualizar la organización o la URL ya está en uso.');
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col transition-colors">
        <div className="flex items-center gap-3 p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Configuración</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ajustes de interfaz y organización</p>
          </div>
        </div>
        
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-5 pt-3 gap-6">
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('org')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'org' ? 'border-[var(--org-color)] text-[var(--org-color)]' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
              style={activeTab === 'org' ? { borderColor: org?.styles?.primaryColor || '#1d4ed8', color: org?.styles?.primaryColor || '#1d4ed8' } : {}}
            >
              Organización
            </button>
          )}
          <button 
            onClick={() => setActiveTab('prefs')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'prefs' ? 'border-[var(--org-color)] text-[var(--org-color)]' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            style={activeTab === 'prefs' ? { borderColor: org?.styles?.primaryColor || '#1d4ed8', color: org?.styles?.primaryColor || '#1d4ed8' } : {}}
          >
            Preferencias
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-200">{error}</div>}

          {activeTab === 'org' && isAdmin && (
            <form id="org-form" onSubmit={handleSaveOrg} className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Link2 size={16} /> URL Personalizada
                </label>
                <div className="flex items-center shadow-sm">
                  <span className="bg-slate-100 dark:bg-slate-700 border border-r-0 border-slate-300 dark:border-slate-600 rounded-l-lg px-3 py-2 text-slate-500 dark:text-slate-400 text-sm">asambleapp.com/</span>
                  <input 
                    type="text" 
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="flex-1 border border-slate-300 dark:border-slate-600 rounded-r-lg px-3 py-2 focus:ring-2 focus:ring-[var(--org-color)] outline-none dark:bg-slate-800 dark:text-white"
                    placeholder="mi-institucion"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <ImageIcon size={16} /> Isotipo (Máximo 500x500)
                </label>
                <div className="w-32 h-32">
                  <ImageUpload 
                    currentImageUrl={logoUrl} 
                    onImageUploaded={async (url) => {
                      setLogoUrl(url);
                      await updateOrg({ logoUrl: url });
                    }} 
                    className="w-full h-full rounded-xl border border-slate-300 dark:border-slate-600 overflow-hidden"
                    maxWidthOrHeight={500}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Carga un isotipo cuadrado en formato PNG o JPEG para representar a la organización. Arrastra o haz click.</p>
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Color Principal
                </label>
                <div className="flex items-center gap-4">
                  <input 
                    type="color" 
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                  />
                  <span className="text-sm font-mono text-slate-600 dark:text-slate-400">{primaryColor}</span>
                </div>
              </div>
              
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6 space-y-6">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Participación y Chat</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-800 dark:text-slate-200">Mensajes de audio</h4>
                    <p className="text-sm text-slate-500">Permitir notas de voz. Límite actual: {audioLimit} seg.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={audioMessages} onChange={(e) => setAudioMessages(e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-1">¿Necesitas más tiempo de audio?</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">Envía un ticket de soporte al administrador del sistema.</p>
                  <input
                    type="text"
                    placeholder="Asunto (ej. Aumento límite de audio)"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 mb-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white"
                  />
                  <textarea
                    placeholder="Mensaje (ej. Solicitamos aumentar el límite a 60 segundos por la naturaleza de nuestros debates)"
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 mb-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white"
                    rows={2}
                  />
                  <button
                    type="button"
                    onClick={() => handleSendTicket(true)}
                    disabled={!ticketSubject || !ticketMessage}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {ticketSent ? 'Enviado ✓' : 'Enviar Ticket'}
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-800 dark:text-slate-200">Reacciones</h4>
                    <p className="text-sm text-slate-500">Permitir reacciones con emojis a los mensajes del debate.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={reactions} onChange={(e) => setReactions(e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-800 dark:text-slate-200">Palabras prohibidas en chat</h4>
                  <p className="text-sm text-slate-500">Separadas por comas. Estas palabras serán censuradas o bloqueadas automáticamente.</p>
                  <textarea 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" 
                    rows={3}
                    placeholder="ejemplo, prohibido, secreto"
                    value={bannedWords}
                    onChange={(e) => setBannedWords(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'prefs' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                  Tema de la Interfaz
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setDarkMode(false)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${!darkMode ? 'border-[var(--org-color)] bg-slate-50 dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                    style={!darkMode ? { borderColor: org?.styles?.primaryColor || '#1d4ed8' } : {}}
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      <Sun size={24} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Modo Claro</span>
                  </button>
                  <button
                    onClick={() => setDarkMode(true)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${darkMode ? 'border-[var(--org-color)] bg-slate-50 dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                    style={darkMode ? { borderColor: org?.styles?.primaryColor || '#1d4ed8' } : {}}
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                      <Moon size={24} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Modo Oscuro</span>
                  </button>
                </div>

              </div>
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                  Notificaciones
                </label>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-800 dark:text-slate-200">Alertas Emergentes</h4>
                    <p className="text-sm text-slate-500">Mostrar notificaciones push en la esquina inferior.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={currentUser?.notificationPreferences?.popups ?? true}
                      onChange={async (e) => {
                        try {
                          await fetch(`/api/users/org/${org.id}/${currentUser.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              notificationPreferences: {
                                ...currentUser.notificationPreferences,
                                popups: e.target.checked
                              }
                            })
                          });
                          window.location.reload();
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-[var(--org-color)]" style={currentUser?.notificationPreferences?.popups ?? true ? { backgroundColor: org?.styles?.primaryColor || '#1d4ed8' } : {}}></div>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                  Legal
                </label>
                <div className="flex flex-col gap-3">
                  <a href="/terminos-y-condiciones" target="_blank" rel="noopener noreferrer" className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-center">
                    Términos y Condiciones
                  </a>
                  <a href="/proteccion-de-datos" target="_blank" rel="noopener noreferrer" className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-center">
                    Protección de Datos
                  </a>
                </div>
              </div>

            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 mt-auto">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-bold transition-colors"
          >
            {activeTab === 'org' && isAdmin ? 'Cancelar' : 'Cerrar'}
          </button>
          
          {activeTab === 'org' && isAdmin && (
            <button 
              form="org-form"
              type="submit" 
              disabled={isSaving}
              className="px-5 py-2 bg-brand-gradient text-white rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
