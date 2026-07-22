import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { User as UserIcon, Settings, LogOut, Bell, Headset, Info, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useOrg } from '../context/OrgContext';

export function UserPopover({ children, role = "Usuario", orgUrl, onSettingsClick }: { children: ReactNode, role?: string, orgUrl?: string, onSettingsClick?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const { currentUser } = useOrg();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      apiFetch(`/api/notifications/${currentUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setUnreadCount(data.filter(n => !n.read).length);
          }
        })
        .catch(console.error);
    }
  }, [currentUser, isOpen]); // Refetch when opened to be fresh

  return (
    <>
    <div className="relative" ref={popoverRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none flex items-center justify-center w-full h-full rounded-full">
        {children}
        {unreadCount > 0 && (
          <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></div>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Mi Cuenta</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">{role}</p>
          </div>
          {orgUrl && (
            <>
              <Link to={`/${orgUrl}/profile`} onClick={() => setIsOpen(false)} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900 flex items-center gap-2 transition-colors">
                <UserIcon size={16} className="text-slate-400" />
                Perfil
              </Link>
              <Link to={`/${orgUrl}/notifications`} onClick={() => setIsOpen(false)} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900 flex items-center justify-between transition-colors">
                <div className="flex items-center gap-2">
                  <Bell size={16} className={unreadCount > 0 ? "text-blue-500" : "text-slate-400"} />
                  <span className={unreadCount > 0 ? "font-semibold text-slate-900 dark:text-slate-100" : ""}>Notificaciones</span>
                </div>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </Link>
              <Link to={`/${orgUrl}/support`} onClick={() => setIsOpen(false)} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900 flex items-center gap-2 transition-colors">
                <Headset size={16} className="text-slate-400" />
                Soporte
              </Link>
            </>
          )}
          <button onClick={() => { setIsOpen(false); onSettingsClick?.(); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900 flex items-center gap-2 transition-colors">
            <Settings size={16} className="text-slate-400" />
            Configuración
          </button>
          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
          <button onClick={() => { setIsOpen(false); setShowInfoModal(true); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900 flex items-center gap-2 transition-colors">
            <Info size={16} className="text-slate-400" />
            Información
          </button>
          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('superadminToken'); window.location.href = '/login'; }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
            <LogOut size={16} className="text-red-400" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>

      {showInfoModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setShowInfoModal(false)} 
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3">
              Información de la Aplicación
            </h3>
            <div className="space-y-3.5 text-sm text-slate-600 dark:text-slate-300">
              <p>
                <strong>Desarrollada por:</strong> OM Tecnología, empresa dedicada a desarrollos de tecnologías y servicios web, aplicaciones móviles, integración con inteligencia artificial y promover el buen uso de estas.
              </p>
              <p>
                <strong>Página web:</strong>{' '}
                <a 
                  href="https://omtecnologia.cl" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  https://omtecnologia.cl
                </a>
              </p>
              <p>
                <strong>CEO y Jefe de proyectos:</strong>{' '}
                <a 
                  href="https://www.linkedin.com/in/gonzaloorellanac/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  Gonzalo Orellana Canales
                </a>
              </p>
              <p>
                <strong>Profesión:</strong> Ingeniero en Computación e Informática de la Universidad Andrés Bello
              </p>
              <p>
                <strong>Versión de la aplicación:</strong> Beta, 0.1
              </p>
            </div>
            <div className="mt-6 pt-2">
              <button 
                onClick={() => setShowInfoModal(false)} 
                className="w-full py-2.5 bg-slate-900 text-white dark:bg-slate-700 dark:text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
