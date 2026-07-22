import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setStatus('error');
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setStatus('error');
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await apiFetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Ocurrió un error al restablecer tu contraseña.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg('Ocurrió un error de conexión.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="flex justify-center mb-6">
          <img src="/asambleapp_isotype.png" alt="AsambleApp" className="w-16 h-16 drop-shadow-md" />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Nueva Contraseña</h1>
        
        {status === 'success' ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <p className="text-slate-600 mb-6">
              Tu contraseña ha sido restablecida exitosamente.
            </p>
            <Link to="/login" className="inline-block w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors">
              Iniciar Sesión
            </Link>
          </div>
        ) : (
          <>
            <p className="text-center text-slate-500 mb-8">Ingresa tu nueva contraseña</p>
            
            {status === 'error' && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-200">
                {errorMsg}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirmar Contraseña</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                />
              </div>
              
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-brand-gradient hover:bg-brand-gradient-hover text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-70 mt-2"
              >
                {status === 'loading' ? 'Guardando...' : 'Guardar Contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
