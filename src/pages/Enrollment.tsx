import { apiFetch } from '../lib/api';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export function Enrollment() {
  const { orgUrl, token } = useParams();
  
  const [step, setStep] = useState<'validate' | 'form' | 'success'>('validate');
  const [linkInfo, setLinkInfo] = useState<any>(null);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [userExistsConfirm, setUserExistsConfirm] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);

  useEffect(() => {
    apiFetch(`/api/enrollment/link/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setLinkInfo(data.link);
          if (data.departments) setDepartments(data.departments);
          setStep('form');
        } else {
          setError(data.error || 'Enlace inválido o expirado');
        }
      })
      .catch(() => setError('Error de conexión'));
  }, [token]);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/enrollment/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password, name, departmentIds: selectedDepts })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStep('success');
      } else {
        setError(data.error || 'Error completando el registro');
      }
    } catch (e) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'validate') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-slate-500">
          {error || 'Validando enlace de enrolamiento...'}
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">¡Registro Exitoso!</h1>
          <p className="text-slate-600 mb-4">
            Hemos enviado un correo electrónico de bienvenida a <strong>{email}</strong> con un enlace para confirmar tu cuenta.
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Unirse a la Organización</h1>
        <p className="text-center text-slate-500 mb-8">
          Has sido invitado a unirte a <strong>{linkInfo?.orgId?.name}</strong> como <strong>{linkInfo?.role}</strong>.
        </p>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-200">
            {error}
          </div>
        )}

        {userExistsConfirm ? (
          <div className="space-y-5">
            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm border border-blue-200">
              El correo <strong>{email}</strong> ya está registrado. ¿Deseas usar esta cuenta para unirte a <strong>{linkInfo?.orgId?.name}</strong>? Ingresa tu contraseña actual para confirmar.
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña Actual</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setUserExistsConfirm(false)}
                className="flex-1 px-4 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  setError('');
                  try {
                    const res = await apiFetch('/api/enrollment/complete', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email, token, password, confirmJoinExisting: true, departmentIds: selectedDepts })
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                      window.location.href = '/login';
                    } else {
                      setError(data.error || 'Error al unir organización');
                    }
                  } catch (e) {
                    setError('Error de conexión');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="flex-1 bg-brand-gradient hover:bg-brand-gradient-hover text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-70"
              >
                {loading ? 'Confirmando...' : 'Unirse con mi cuenta'}
              </button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleComplete} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tu Nombre Completo</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan Pérez"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tu Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Crea una Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Grupo de Trabajo {linkInfo?.orgId?.settings?.requireDepartment ? '(Obligatorio)' : '(Opcional)'}
            </label>
            <div className="max-h-48 overflow-y-auto border border-slate-300 rounded-lg p-2 space-y-2">
              {departments.map((d: any) => {
                const id = d._id || d.id;
                const isChecked = selectedDepts.includes(id);
                return (
                  <label key={id} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded cursor-pointer">
                    <input 
                      type={linkInfo?.orgId?.settings?.allowMultipleDepartments ? "checkbox" : "radio"}
                      name="enroll_department"
                      checked={isChecked}
                      onChange={(e) => {
                        if (linkInfo?.orgId?.settings?.allowMultipleDepartments) {
                          if (e.target.checked) setSelectedDepts([...selectedDepts, id]);
                          else setSelectedDepts(selectedDepts.filter(did => did !== id));
                        } else {
                          setSelectedDepts([id]);
                        }
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{d.name}</span>
                  </label>
                );
              })}
              {departments.length === 0 && <p className="text-sm text-slate-500 p-2">No hay grupos disponibles</p>}
            </div>
          </div>
<button
            type="submit"
            disabled={loading || (linkInfo?.orgId?.settings?.requireDepartment && selectedDepts.length === 0)}
            className="w-full bg-brand-gradient hover:bg-brand-gradient-hover text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-70 mt-4"
          >
            {loading ? 'Enviando...' : 'Completar Registro'}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
