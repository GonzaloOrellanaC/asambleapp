import React, { useState } from 'react';
import { Settings, User } from 'lucide-react';
import { useOrg } from '../context/OrgContext';
import { UserPopover } from './UserPopover';
import { SettingsModal } from './SettingsModal';
import { apiFetch } from '../lib/api';

export function OrgHeader() {
  const { org, currentUser, updateOrgUrl } = useOrg();
  const orgUrl = org?.customUrl || '';
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return (
    <>
      <header className="glass-panel border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
                        {org?.logoUrl ? (
              <img src={org.logoUrl} alt="Logo" className="w-8 h-8 rounded object-cover" />
            ) : (
              <div className="w-8 h-8 rounded flex items-center justify-center text-white font-bold" style={{ backgroundColor: org?.styles?.primaryColor || '#1d4ed8' }}>
                {org?.name?.charAt(0) || 'A'}
              </div>
            )}
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{org?.name || 'Cargando...'}</h1>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
            <div className="hidden md:flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Instancia Activa</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">/{orgUrl}</span>
                {org && (
                  <button onClick={() => setShowSettingsModal(true)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 transition-colors" title="Cambiar URL">
                    <Settings size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200 blockchain-badge hidden md:flex">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold">Blockchain Integrado</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{currentUser?.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">{currentUser?.role}</p>
              </div>
              <div className="w-10 h-10 overflow-visible relative">
                <UserPopover role={currentUser?.role || ''} orgUrl={org?.customUrl} onSettingsClick={() => setShowSettingsModal(true)}>
                  <div className="w-full h-full rounded-full border border-slate-300 dark:border-slate-600 overflow-hidden flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 hover:ring-2 hover:ring-slate-300 transition-all bg-slate-200 dark:bg-slate-700">
                    {currentUser?.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      currentUser?.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                </UserPopover>
              </div>
            </div>
          </div>
        </div>
      </header>

      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}
    </>
  );
}
