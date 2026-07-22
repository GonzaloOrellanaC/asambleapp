import { apiFetch } from '../lib/api';
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function EmailConfirmation() {
  const { token } = useParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [orgUrl, setOrgUrl] = useState('');

  useEffect(() => {
    apiFetch(`/api/confirm-email/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          setOrgUrl(data.orgUrl);
        } else {
          setStatus('error');
          setErrorMsg(data.error || 'Enlace inválido o expirado.');
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMsg('Error de conexión.');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <h1 className="text-xl font-bold text-slate-800">Verificando correo...</h1>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">¡Correo Confirmado!</h1>
            <p className="text-slate-600 mb-8">
              Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesión en tu organización.
            </p>
            <Link 
              to={orgUrl ? `/${orgUrl}` : '/login'} 
              className="bg-brand-gradient hover:bg-brand-gradient-hover text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Error de Verificación</h1>
            <p className="text-slate-600 mb-8">
              {errorMsg}
            </p>
            <Link 
              to="/login" 
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Ir a Iniciar Sesión
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
