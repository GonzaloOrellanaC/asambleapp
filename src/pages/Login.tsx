import { apiFetch } from '../lib/api';
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [token, setToken] = useState('');
  const [expiredOrgName, setExpiredOrgName] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionExpired, setSessionExpired] = useState(location.state?.sessionExpired || false);

  const isOrgExpired = (org: any) => {
    if (!org) return false;
    if (org.plan !== 'trial') return false;
    if (!org.createdAt) return false;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return Date.now() - new Date(org.createdAt).getTime() > thirtyDays;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const orgs = data.user.organizations || [];
        if (orgs.length > 1) {
          setOrganizations(orgs);
          setToken(data.token);
        } else if (orgs.length === 1 && orgs[0].orgId && orgs[0].orgId.customUrl) {
          if (isOrgExpired(orgs[0].orgId)) {
            setExpiredOrgName(orgs[0].orgId.name);
          } else {
            localStorage.setItem('token', data.token);
            navigate(`/${orgs[0].orgId.customUrl}`);
          }
        } else if (data.user.orgId && data.user.orgId.customUrl) {
          if (isOrgExpired(data.user.orgId)) {
            setExpiredOrgName(data.user.orgId.name);
          } else {
            localStorage.setItem('token', data.token);
            navigate(`/${data.user.orgId.customUrl}`);
          }
        } else {
          setError('El usuario no tiene una organización asignada');
        }
      } else {
        setError(data.error || 'Ocurrió un error al iniciar sesión');
      }
    } catch (err) {
      setError('Ocurrió un error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="absolute top-6 left-6">
        <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Volver al inicio
        </Link>
      </div>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="flex justify-center mb-6">
          <img src="/asambleapp_isotype.png" alt="AsambleApp" className="w-16 h-16 drop-shadow-md" />
        </div>
        {organizations.length > 1 ? (
          <>
            <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Selecciona tu Organización</h1>
            <p className="text-center text-slate-500 mb-8">Tienes acceso a múltiples organizaciones</p>
            
            <div className="space-y-3">
              {organizations.map((org: any) => (
                <button
                  key={org._id || org.orgId._id}
                  onClick={() => {
                    if (isOrgExpired(org.orgId)) {
                      setExpiredOrgName(org.orgId.name);
                    } else {
                      localStorage.setItem('token', token);
                      navigate(`/${org.orgId.customUrl}`);
                    }
                  }}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-between group"
                >
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-blue-700">{org.orgId.name}</h3>
                    <p className="text-sm text-slate-500 capitalize">{org.role}</p>
                  </div>
                  <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                  </div>
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setOrganizations([])}
              className="mt-6 w-full text-center text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Volver al login
            </button>
          </>
        ) : (
          <>
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Iniciar Sesión</h1>
        <p className="text-center text-slate-500 mb-8">Ingresa a tu organización</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Usuario / Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@organizacion.com"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">Contraseña</label>
              <a href="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
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
            className="w-full bg-brand-gradient hover:bg-brand-gradient-hover text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-70"
          >
            {loading ? 'Iniciando sesión...' : 'Entrar a la Organización'}
          </button>
        </form>
        </>
        )}
      </div>

      {expiredOrgName && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-8 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Cuenta Caducada</h3>
            <p className="text-slate-600 mb-6">
              Tu periodo de prueba de 30 días para la organización <strong>{expiredOrgName}</strong> ha finalizado. 
              Por favor, contacta con soporte o revisa nuestros planes para continuar utilizando la plataforma.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setExpiredOrgName(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Cerrar
              </button>
              <a
                href="/#pricing"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Ver Precios
              </a>
            </div>
          </div>
        </div>
      )}

      {sessionExpired && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Sesión Caducada</h3>
            <p className="text-slate-600 mb-6">
              Tu sesión ha expirado o no tienes permisos para acceder. Por favor, vuelve a iniciar sesión.
            </p>
            <button
              onClick={() => setSessionExpired(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
