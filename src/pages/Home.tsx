import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { Shield, Users, BarChart3, ArrowRight, CheckCircle2, CalendarPlus, MessageSquare, CheckSquare, Fingerprint, Menu, X, Vote } from 'lucide-react';

export function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hirePlan, setHirePlan] = useState<{ name: string, type: "contratar" | "cotizar" } | null>(null);
  const [hireForm, setHireForm] = useState({ name: "", email: "", phone: "", comments: "" });
  const [hireStatus, setHireStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-200 overflow-x-hidden">
      {/* Navbar */}
      <nav className="py-4 flex items-center justify-between px-6 md:px-8 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src="/asambleapp_isotype.png" alt="AsambleApp Isotipo" className="h-10 md:h-12 w-auto" />
          <span className="text-2xl md:text-3xl tracking-tight text-[#34318C]" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <span className="font-bold">Asamble</span><span className="font-normal">App</span>
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Características</a>
          <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Precios</a>
          <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Iniciar Sesión</Link>
          <Link to="/register?plan=express_trial" className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-md">Comenzar Gratis</Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-slate-600 hover:text-slate-900"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu size={24} />
        </button>

      </nav>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] transition-opacity md:hidden ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)}></div>

      <div className={`fixed top-0 right-0 bottom-0 w-64 bg-white z-[101] shadow-2xl transition-transform duration-300 md:hidden flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 flex justify-end border-b border-slate-100">
          <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-500 hover:text-slate-800">
            <X size={24} />
          </button>
        </div>
        <div className="flex flex-col p-6 gap-6">
          <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-slate-700 hover:text-blue-600">Características</a>
          <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-slate-700 hover:text-blue-600">Precios</a>
          <hr className="border-slate-100" />
          <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-slate-700 hover:text-blue-600">Iniciar Sesión</Link>
          <Link to="/register?plan=express_trial" onClick={() => setIsMenuOpen(false)} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl text-center text-sm font-bold shadow-md">Comenzar Gratis</Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 text-center max-w-5xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold mb-8">
          <span className="flex h-2 w-2 rounded-full bg-brand-gradient"></span>
          Blockchain integrado para votaciones transparentes
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-tight break-words">
          Democracia Digital <br className="hidden md:block" />
          <span className="text-brand-gradient">Segura y Transparente</span>
        </h1>
        <p className="text-xl text-slate-600 mb-12 max-w-3xl leading-relaxed">
          Plataforma SaaS para instituciones gubernamentales, partidos políticos y organizaciones civiles.
          Garantiza debates organizados, seguimiento legislativo y votaciones inmutables.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="#trial" className="bg-brand-gradient hover:bg-brand-gradient-hover text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
            Prueba Gratuita de 30 Días <ArrowRight size={20} />
          </a>
          <Link to="/login" className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-sm">
            Acceso a Organizaciones
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Todo lo necesario para la toma de decisiones</h2>
            <p className="text-slate-500 text-lg">Módulos diseñados para escalar la participación ciudadana.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Users size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800">Foros Moderados</h3>
              <p className="text-slate-600 leading-relaxed">
                Espacios de discusión con reglas claras. Participación mediante texto o notas de voz, con roles de moderación avanzados.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <Shield size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800">Votación Inmutable</h3>
              <p className="text-slate-600 leading-relaxed">
                Resultados garantizados mediante tecnología blockchain. Control de unicidad por IP y dispositivo para evitar fraudes.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800">Métricas y Rendición</h3>
              <p className="text-slate-600 leading-relaxed">
                Paneles informativos en tiempo real. Exporta reportes personalizados sobre el nivel de participación y asistencia.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Blockchain Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 blockchain-badge">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 tracking-tight">Transparencia garantizada por Blockchain</h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-6">
              Asambleapp utiliza tecnología de libro mayor distribuido (DLT) para inmutabilizar los resultados de cada votación. Esto significa que una vez emitido un voto, queda registrado criptográficamente y <strong>no puede ser alterado ni eliminado por nadie</strong>, ni siquiera por los administradores del sistema.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-bold text-slate-800">Verificabilidad Pública</h4>
                  <p className="text-slate-500 text-sm">Cada proyecto genera un hash criptográfico único que permite auditar los resultados de manera independiente.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-bold text-slate-800">Anonimato Seguro</h4>
                  <p className="text-slate-500 text-sm">El registro en blockchain desvincula la identidad del usuario de su opción elegida, garantizando el secreto del sufragio.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-bold text-slate-800">Prevención de Fraude</h4>
                  <p className="text-slate-500 text-sm">Combinado con nuestro sistema de unicidad por IP y huella de dispositivo (Device Fingerprinting), evitamos la suplantación de identidad.</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-brand-gradient opacity-10 rounded-[3rem] transform rotate-3 scale-105"></div>
            <div className="bg-slate-900 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-slate-500 text-xs font-mono ml-2">blockchain_audit.log</span>
              </div>
              <div className="font-mono text-xs space-y-3 text-slate-300">
                <p><span className="text-blue-400">INFO</span> [0x1a8f...b29c] Block committed</p>
                <p><span className="text-emerald-400">SUCCESS</span> Vote registered anonymously</p>
                <p><span className="text-blue-400">INFO</span> Verifying cryptographic signatures...</p>
                <p><span className="text-emerald-400">SUCCESS</span> 128/128 Nodes confirmed</p>
                <p><span className="text-purple-400">VERIFIED</span> Hash: 8f4e2...a1b9</p>
                <div className="mt-6 pt-4 border-t border-slate-800 text-slate-500">
                  Status: SECURE NETWORK ACTIVE
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Flow Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold tracking-widest text-blue-600 uppercase mb-3">Flujo del Sistema</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">El método AsambleApp en 3 pasos</h3>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Un flujo de trabajo diseñado para maximizar la participación y garantizar la total transparencia en las decisiones de tu organización.
            </p>
          </div>

          <div className="relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-100 via-blue-200 to-emerald-100 -translate-y-1/2 z-0"></div>

            <div className="grid md:grid-cols-3 gap-12 relative z-10">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-xl shadow-blue-900/5 flex items-center justify-center mb-8 border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <CalendarPlus size={28} />
                  </div>
                </div>
                <div className="bg-slate-50 px-3 py-1 rounded-full text-xs font-bold text-slate-500 tracking-wider mb-4">PASO 1</div>
                <h4 className="text-2xl font-bold text-slate-900 mb-3">Programa</h4>
                <p className="text-slate-600 leading-relaxed px-4">
                  Define el proyecto, redacta el documento base, establece la ventana de tiempo para la discusión y programa el inicio de las votaciones.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-xl shadow-indigo-900/5 flex items-center justify-center mb-8 border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <MessageSquare size={28} />
                  </div>
                </div>
                <div className="bg-slate-50 px-3 py-1 rounded-full text-xs font-bold text-slate-500 tracking-wider mb-4">PASO 2</div>
                <h4 className="text-2xl font-bold text-slate-900 mb-3">Debate</h4>
                <p className="text-slate-600 leading-relaxed px-4">
                  Los participantes interactúan en un foro moderado mediante notas de voz o texto. Pueden reaccionar (👍/👎) a las intervenciones, creando consenso antes de votar.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-xl shadow-emerald-900/5 flex items-center justify-center mb-8 border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <Vote size={28} />
                  </div>
                </div>
                <div className="bg-slate-50 px-3 py-1 rounded-full text-xs font-bold text-slate-500 tracking-wider mb-4">PASO 3</div>
                <h4 className="text-2xl font-bold text-slate-900 mb-3">Vota</h4>
                <p className="text-slate-600 leading-relaxed px-4">
                  Terminado el debate, se abre la urna digital. Votaciones secretas o públicas, con resultados en tiempo real y registro auditable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Planes y Tarifas</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Software de Votación y Parlamento Digital adaptado a las necesidades de tu organización.
            </p>
          </div>

          <div className="space-y-20">
            {/* 1. Condominios y Edificios */}
            <div>
              <div className="text-center mb-10">
                <h3 className="text-2xl font-bold text-slate-800">1. Condominios y Edificios</h3>
                <p className="text-slate-500">Cumplimiento de la Ley 21.442 para asambleas y votaciones híbridas.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative">
                  <h4 className="text-xl font-bold text-slate-800 mb-2">Edificio Express</h4>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-slate-900">$24.000</span>
                    <span className="text-slate-500 ml-2">+ IVA / mes</span>
                  </div>
                  <p className="text-slate-700 font-medium mb-6 bg-slate-100 p-3 rounded-lg text-center">Hasta 80 usuarios</p>
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} /> <span className="text-slate-600 text-sm">Votación de mociones y consultas rápidas</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} /> <span className="text-slate-600 text-sm">Asambleas virtuales y registro de participación</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} /> <span className="text-slate-600 text-sm">Soporte por correo</span></li>
                  </ul>
                  <button onClick={() => setHirePlan({ name: "pyme", type: "contratar" })} className="w-full text-center bg-white hover:bg-slate-50 text-blue-600 border-2 border-blue-100 font-bold py-3 rounded-xl transition-colors">Contratar</button>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative">
                  <h4 className="text-xl font-bold text-slate-800 mb-2">Condominio Grande</h4>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-slate-900">$48.000</span>
                    <span className="text-slate-500 ml-2">+ IVA / mes</span>
                  </div>
                  <p className="text-slate-700 font-medium mb-6 bg-slate-100 p-3 rounded-lg text-center">Hasta 250 usuarios</p>
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} /> <span className="text-slate-600 text-sm">Todo lo del Plan Express</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} /> <span className="text-slate-600 text-sm">Cómputo ponderado por prorrateo de dominio</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} /> <span className="text-slate-600 text-sm">Soporte prioritario</span></li>
                  </ul>
                  <button onClick={() => setHirePlan({ name: "express_trial", type: "contratar" })} className="w-full text-center bg-white hover:bg-slate-50 text-blue-600 border-2 border-blue-100 font-bold py-3 rounded-xl transition-colors">Contratar</button>
                </div>
              </div>
            </div>

            {/* 2. Sindicatos y Gremios */}
            <div className="pt-10 border-t border-slate-200">
              <div className="text-center mb-10">
                <h3 className="text-2xl font-bold text-slate-800">2. Sindicatos y Gremios</h3>
                <p className="text-slate-500">Procesos electorales y negociaciones colectivas con validez y auditoría.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative">
                  <h4 className="text-xl font-bold text-slate-800 mb-2">Plan Evento Pyme</h4>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-slate-900">$320.000</span>
                    <span className="text-slate-500 ml-2">+ IVA (pago único por evento)</span>
                  </div>
                  <p className="text-slate-700 font-medium mb-6 bg-slate-100 p-3 rounded-lg text-center">Hasta 300 votantes</p>
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} /> <span className="text-slate-600 text-sm">Autenticación por RUT + Email</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} /> <span className="text-slate-600 text-sm">Votación en línea segura y secreta</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} /> <span className="text-slate-600 text-sm">Generación de Acta de Cierre</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} /> <span className="text-slate-600 text-sm">Soporte básico por correo</span></li>
                  </ul>
                  <button onClick={() => setHirePlan({ name: "pyme", type: "contratar" })} className="w-full text-center bg-white hover:bg-slate-50 text-blue-600 border-2 border-blue-100 font-bold py-3 rounded-xl transition-colors">Contratar</button>
                </div>
                <div className="bg-brand-gradient p-8 rounded-3xl border border-transparent shadow-lg flex flex-col relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-400 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Más Popular</div>
                  <h4 className="text-xl font-bold text-white mb-2">Plan Evento Pro</h4>
                  <div className="mb-6 text-white">
                    <span className="text-4xl font-extrabold">$640.000</span>
                    <span className="text-blue-100 ml-2">+ IVA (pago único por evento)</span>
                  </div>
                  <p className="text-blue-900 bg-white/90 font-bold mb-6 p-3 rounded-lg text-center">301 a 1.500 votantes</p>
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-200 shrink-0 mt-0.5" size={18} /> <span className="text-white text-sm">Todo lo del Plan Pyme</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-200 shrink-0 mt-0.5" size={18} /> <span className="text-white text-sm">Módulo de debate e indicaciones previa votación</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-200 shrink-0 mt-0.5" size={18} /> <span className="text-white text-sm">Trazabilidad y auditoría criptográfica</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-200 shrink-0 mt-0.5" size={18} /> <span className="text-white text-sm">Soporte en vivo durante el proceso</span></li>
                  </ul>
                  <button onClick={() => setHirePlan({ name: "pro", type: "contratar" })} className="w-full text-center bg-white text-blue-600 font-bold py-3 rounded-xl transition-colors hover:bg-blue-50">Contratar</button>
                </div>
              </div>
            </div>

            {/* 3. Educación Superior y Colegios */}
            <div className="pt-10 border-t border-slate-200">
              <div className="text-center mb-10">
                <h3 className="text-2xl font-bold text-slate-800">3. Educación Superior y Colegios</h3>
                <p className="text-slate-500">Elecciones de centros de alumnos, FECh/FEUC y consultas académicas.</p>
              </div>
              <div className="max-w-2xl mx-auto">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative">
                  <h4 className="text-xl font-bold text-slate-800 mb-2">Campus Estudiantil</h4>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-slate-900">$800.000</span>
                    <span className="text-slate-500 ml-2">+ IVA / año</span>
                  </div>
                  <p className="text-slate-700 font-medium mb-6 bg-slate-100 p-3 rounded-lg text-center">Votaciones ilimitadas</p>
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} /> <span className="text-slate-600 text-sm">Elecciones de centros de estudiantes y plebiscitos</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} /> <span className="text-slate-600 text-sm">Módulo parlamentario para debate de mociones</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} /> <span className="text-slate-600 text-sm">Registro y trazabilidad de cómputos</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} /> <span className="text-slate-600 text-sm">Soporte técnico para la federación</span></li>
                  </ul>
                  <button onClick={() => setHirePlan({ name: "express_trial", type: "contratar" })} className="w-full text-center bg-white hover:bg-slate-50 text-blue-600 border-2 border-blue-100 font-bold py-3 rounded-xl transition-colors">Contratar</button>
                </div>
              </div>
            </div>

            {/* 4. Municipalidades y Sector Público */}
            <div className="pt-10 border-t border-slate-200">
              <div className="text-center mb-10">
                <h3 className="text-2xl font-bold text-slate-800">4. Municipalidades y Sector Público</h3>
                <p className="text-slate-500">Consultas ciudadanas, COSOC y presupuestos participativos.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative">
                  <h4 className="text-xl font-bold text-slate-800 mb-2">Público Base</h4>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-slate-900">Cotizar</span>
                  </div>
                  <p className="text-slate-700 font-medium mb-6 bg-slate-100 p-3 rounded-lg text-center">Hasta 20.000 vecinos</p>
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} /> <span className="text-slate-600 text-sm">1 Consulta ciudadana anual</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} /> <span className="text-slate-600 text-sm">Validación mediante ClaveÚnica / RUT</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} /> <span className="text-slate-600 text-sm">Reporte de resultados consolidado</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} /> <span className="text-slate-600 text-sm">Apto para Trato Directo / Compra Ágil ({"<"} 40 UTM)</span></li>
                  </ul>
                  <button onClick={() => setHirePlan({ name: "pyme", type: "cotizar" })} className="w-full text-center bg-white hover:bg-slate-50 text-blue-600 border-2 border-blue-100 font-bold py-3 rounded-xl transition-colors">Cotizar</button>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative">
                  <h4 className="text-xl font-bold text-slate-800 mb-2">Público Avanzado</h4>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-slate-900">Cotizar</span>
                  </div>
                  <p className="text-slate-700 font-medium mb-6 bg-slate-100 p-3 rounded-lg text-center">Padrón ilimitado</p>
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} /> <span className="text-slate-600 text-sm">Votaciones y presupuestos participativos ilimitados</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} /> <span className="text-slate-600 text-sm">Sistema completo de debate de mociones estilo Congreso</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} /> <span className="text-slate-600 text-sm">Asistencia técnica en vivo y soporte dedicado</span></li>
                  </ul>
                  <button onClick={() => setHirePlan({ name: "saas", type: "cotizar" })} className="w-full text-center bg-white hover:bg-slate-50 text-blue-600 border-2 border-blue-100 font-bold py-3 rounded-xl transition-colors">Cotizar</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
      {/* Trial CTA */}
      <section id="trial" className="py-24 px-6 relative overflow-hidden bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Transforma tu institución hoy mismo</h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Abre tu cuenta y configura tu plataforma de debates en minutos. Personalización completa para tu marca.
          </p>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-lg mx-auto shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-blue-400">Prueba Gratis por 30 Días</h3>
            <ul className="text-left space-y-4 mb-8">
              <li className="flex items-center gap-3"><CheckCircle2 className="text-emerald-400" size={20} /> <span className="text-slate-200">Usuarios ilimitados</span></li>
              <li className="flex items-center gap-3"><CheckCircle2 className="text-emerald-400" size={20} /> <span className="text-slate-200">Marca y dominio personalizados</span></li>
              <li className="flex items-center gap-3"><CheckCircle2 className="text-emerald-400" size={20} /> <span className="text-slate-200">Soporte técnico prioritario</span></li>
              <li className="flex items-center gap-3"><CheckCircle2 className="text-emerald-400" size={20} /> <span className="text-slate-200">Acceso a API completa</span></li>
            </ul>
            <Link to="/register?plan=saas" className="block text-center w-full bg-brand-gradient hover:bg-brand-gradient-hover text-white font-bold py-4 rounded-xl transition-colors">
              Crear Cuenta Institucional
            </Link>
            <p className="text-xs text-slate-500 mt-4">No se requiere tarjeta de crédito para iniciar.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 text-center">
        <p className="text-slate-500 font-medium">© 2026 Asambleapp SaaS. Todos los derechos reservados.</p>
        <div className="flex justify-center items-center gap-4 mt-3 text-sm">
          <Link to="/terminos-y-condiciones" className="text-slate-500 hover:text-blue-600 font-semibold transition-colors">
            Términos y Condiciones
          </Link>
          <span className="text-slate-300">|</span>
          <Link to="/proteccion-de-datos" className="text-slate-500 hover:text-blue-600 font-semibold transition-colors">
            Protección de Datos
          </Link>
        </div>
        <p className="text-slate-400 text-sm mt-3">Desarrollada por <a href="https://omtecnologia.cl" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-500 hover:text-brand-primary transition-colors">OM Tecnología</a></p>
      </footer>

      {/* Modal de Contratación/Cotización */}
      {hirePlan && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => { setHirePlan(null); setHireStatus('idle'); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>

            {hireStatus === 'success' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">¡Solicitud Enviada!</h3>
                <p className="text-slate-600 mb-6">Nuestro equipo se pondrá en contacto contigo a la brevedad para {hirePlan.type === 'cotizar' ? 'enviarte una cotización' : 'gestionar la contratación'} del plan.</p>
                <button
                  onClick={() => { setHirePlan(null); setHireStatus('idle'); }}
                  className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-slate-800 mb-2 capitalize">{hirePlan.type} Plan</h3>
                <p className="text-slate-600 mb-6">Completa tus datos y te contactaremos para gestionar el plan seleccionado.</p>

                {hireStatus === 'error' && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                    Ocurrió un error al enviar la solicitud. Por favor intenta nuevamente.
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setHireStatus('loading');
                    try {
                      const res = await apiFetch('/api/request-plan', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...hireForm, planId: hirePlan.name, type: hirePlan.type })
                      });
                      if (res.ok) {
                        setHireStatus('success');
                      } else {
                        setHireStatus('error');
                      }
                    } catch {
                      setHireStatus('error');
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                    <input
                      type="text" required
                      value={hireForm.name} onChange={e => setHireForm({ ...hireForm, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                    <input
                      type="email" required
                      value={hireForm.email} onChange={e => setHireForm({ ...hireForm, email: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                    <input
                      type="text" required
                      value={hireForm.phone} onChange={e => setHireForm({ ...hireForm, phone: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Comentarios (Opcional)</label>
                    <textarea
                      rows={3}
                      value={hireForm.comments} onChange={e => setHireForm({ ...hireForm, comments: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={hireStatus === 'loading'}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-70 mt-2"
                  >
                    {hireStatus === 'loading' ? 'Enviando...' : 'Enviar Solicitud'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
