import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

export function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'superadmin@asambleapp.com' && password === 'admin123') {
      localStorage.setItem('superadminToken', 'true');
      navigate('/superadmin');
    } else {
      alert('Credenciales incorrectas');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8">
        <div className="flex justify-center mb-6">
          <img src="/asambleapp_isotype.png" alt="AsambleApp" className="w-16 h-16 drop-shadow-md" />
        </div>
        <h1 className="text-2xl font-bold text-center text-white mb-2">Acceso Administrativo</h1>
        <p className="text-center text-slate-400 mb-8">Panel global del sistema</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-brand-gradient hover:bg-brand-gradient-hover text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Acceder al Sistema
          </button>
        </form>
      </div>
    </div>
  );
}
