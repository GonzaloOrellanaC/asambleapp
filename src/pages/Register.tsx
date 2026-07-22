import { apiFetch } from '../lib/api';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export function Register() {
  const [orgName, setOrgName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const searchParams = new URLSearchParams(window.location.search);
  const plan = searchParams.get('plan') || 'free';
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName, adminEmail, adminPassword: password, plan })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Ocurrió un error al registrar.');
      }
    } catch (err) {
      setError('Ocurrió un error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">¡Organización Registrada!</h1>
          <p className="text-slate-600 mb-4">
            Hemos enviado un correo electrónico de bienvenida a <strong>{adminEmail}</strong> con un enlace para confirmar tu cuenta y acceder a tu nueva organización.
          </p>
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm mb-8 border border-yellow-200">
            <strong>Nota importante:</strong> El correo enviado puede haber llegado a tu carpeta de spam o correo no deseado. Por favor, asegúrate de revisarla.
          </div>
          <Link to={`/login`} className="text-blue-600 font-medium hover:underline">
            Ir a Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative">
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200"
      >
        <ArrowLeft size={18} />
        Volver
      </Link>
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mt-12 md:mt-0">
        <div className="flex justify-center mb-6">
          <img src="/asambleapp_isotype.png" alt="AsambleApp" className="w-16 h-16 drop-shadow-md" />
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Crea tu Institución</h1>
        <p className="text-center text-slate-500 mb-8">Comienza tu prueba gratuita de 30 días</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Institución</label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Ej: Senado de la República"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email del Administrador</label>
            <input
              type="email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@institucion.gov"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-gradient hover:bg-brand-gradient-hover text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Creando...' : 'Comenzar Prueba Gratis'} 
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>¿Ya tienes una organización? <Link to="/login" className="text-blue-600 hover:underline font-medium">Inicia sesión</Link></p>
        </div>
      </div>
    </div>
  );
}
