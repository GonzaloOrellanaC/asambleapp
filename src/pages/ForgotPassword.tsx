import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await apiFetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg('Ocurrió un error al procesar la solicitud.');
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
        
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Recuperar Contraseña</h1>
        
        {status === 'success' ? (
          <div className="text-center">
            <p className="text-slate-600 mb-6">
              Si el correo ingresado está registrado, te enviaremos un enlace para restablecer tu contraseña. 
              Por favor revisa tu bandeja de entrada o spam.
            </p>
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <p className="text-center text-slate-500 mb-8">Ingresa tu correo y te enviaremos instrucciones</p>
            
            {status === 'error' && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-200">
                {errorMsg}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@organizacion.com"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                />
              </div>
              
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-brand-gradient hover:bg-brand-gradient-hover text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-70"
              >
                {status === 'loading' ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-slate-800">
                Volver al inicio de sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
