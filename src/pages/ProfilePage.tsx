import React, { useState } from 'react';
import { ArrowLeft, User, Camera, Check, Lock, AlertCircle } from 'lucide-react';

import { useOrg } from '../context/OrgContext';
import { Link, useNavigate } from 'react-router-dom';
import { ImageUpload } from '../components/ImageUpload';


export function ProfilePage() {
  const { org, currentUser, updateUser } = useOrg();
  const orgUrl = org?.customUrl || '';
  const navigate = useNavigate();

  const [name, setName] = useState(currentUser?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    
    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setPasswordSuccess('Contraseña actualizada correctamente.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.error || 'Error al cambiar la contraseña.');
      }
    } catch(err) {
      setPasswordError('Error de red al cambiar la contraseña.');
    } finally {
      setIsChangingPassword(false);
    }
  };


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    
    const success = await updateUser({ name, avatarUrl });
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 transition-colors" style={{ '--org-color': org?.styles?.primaryColor || '#1d4ed8' } as any}>
      <div className="h-12 flex items-center px-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <Link to={`/${orgUrl}`} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-sm font-semibold">
          <ArrowLeft size={16} />
          Volver a Inicio
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="h-32 bg-slate-200 dark:bg-slate-700 w-full" style={{ backgroundColor: org?.styles?.primaryColor || '#1d4ed8' }}></div>
          
          <form onSubmit={handleSave} className="p-8 pt-0">
            <div className="relative flex justify-between items-end -mt-16 mb-8">
              <div className="relative group">
                <ImageUpload
                  currentImageUrl={avatarUrl}
                  onImageUploaded={(url) => setAvatarUrl(url)}
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 shadow-md overflow-hidden flex items-center justify-center text-4xl font-bold text-slate-400"
                  isProfile={true}
                />
              </div>
              <div>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase rounded-full border border-slate-200 dark:border-slate-600">
                  {currentUser?.role || 'Usuario'}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button 
                type="submit" 
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-brand-gradient text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saved ? <><Check size={18} /> Guardado</> : (isSaving ? 'Guardando...' : 'Guardar Cambios')}
              </button>
            </div>
          
          </form>

          <div className="p-8 pt-0 border-t border-slate-200 dark:border-slate-700 mt-8">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 mt-8 flex items-center gap-2">
              <Lock size={20} className="text-slate-400" />
              Cambiar Contraseña
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-6">
              {passwordError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 font-medium">
                  <AlertCircle size={16} />
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm flex items-center gap-2 font-medium">
                  <Check size={16} />
                  {passwordSuccess}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Contraseña Actual
                </label>
                <input 
                  type="password" 
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[var(--org-color)] outline-none dark:bg-slate-700 dark:text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nueva Contraseña
                  </label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[var(--org-color)] outline-none dark:bg-slate-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Confirmar Nueva Contraseña
                  </label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[var(--org-color)] outline-none dark:bg-slate-700 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={isChangingPassword || !oldPassword || !newPassword || !confirmPassword}
                  className="px-6 py-2 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isChangingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
