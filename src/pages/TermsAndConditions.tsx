import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Scale, FileText, Lock, Users, HelpCircle } from 'lucide-react';
import React, { useState } from 'react';

export function TermsAndConditions() {
  const [activeSection, setActiveSection] = useState('acceptance');

  const sections = [
    { id: 'acceptance', label: '1. Aceptación de los Términos', icon: ShieldCheck },
    { id: 'service', label: '2. Descripción del Servicio', icon: FileText },
    { id: 'accounts', label: '3. Registro y Cuentas', icon: Users },
    { id: 'usage', label: '4. Uso Aceptable', icon: Scale },
    { id: 'privacy', label: '5. Privacidad y Seguridad', icon: Lock },
    { id: 'support', label: '6. Soporte y Contacto', icon: HelpCircle },
  ];

  const handleScrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
            <ArrowLeft size={20} />
            <span className="text-sm font-semibold hidden sm:inline">Volver</span>
          </Link>
          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
          <img src="/asambleapp_isotype.png" alt="AsambleApp" className="h-8 w-auto" />
          <span className="text-xl tracking-tight text-[#34318C] dark:text-slate-100 font-bold">
            Asamble<span className="font-normal">App</span>
          </span>
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
          Última actualización: 23 de Julio, 2026
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/40 py-16 px-6 text-center border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Términos y Condiciones de Uso
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Lea atentamente este documento que rige el acceso y uso de la plataforma digital AsambleApp.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-12 lg:flex lg:gap-10">
        {/* Sticky Sidebar Navigation */}
        <aside className="lg:w-1/4 mb-8 lg:mb-0 lg:sticky lg:top-24 h-fit">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 px-2">
              Secciones
            </h2>
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleScrollTo(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Legal Text Sections */}
        <main className="lg:w-3/4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm space-y-12">
          {/* Section 1 */}
          <section id="acceptance" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">1. Aceptación de los Términos</h2>
            </div>
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-4">
              <p>
                Al acceder, registrarse o utilizar la plataforma AsambleApp (en adelante, "el Servicio" o "la Plataforma"), 
                desarrollada y operada por <strong>OM Tecnología</strong>, usted acepta y se compromete a cumplir en su totalidad con 
                los presentes Términos y Condiciones.
              </p>
              <p>
                Si no está de acuerdo con alguna de las disposiciones establecidas en este documento, le rogamos que se abstenga 
                de acceder o hacer uso del Servicio de manera inmediata. Estos términos aplican tanto para administradores de 
                organizaciones como para usuarios finales invitados a las votaciones y debates.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="service" className="scroll-mt-24 border-t border-slate-100 dark:border-slate-800/60 pt-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <FileText size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">2. Descripción del Servicio</h2>
            </div>
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-4">
              <p>
                AsambleApp es una plataforma de software como servicio (SaaS) diseñada para facilitar la toma de decisiones, 
                la moderación de debates y la realización de votaciones inmutables en diversas organizaciones (condominios, 
                sindicatos, centros estudiantiles, municipalidades, etc.).
              </p>
              <p>
                Las características principales del Servicio incluyen:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Foros de Debate Moderados:</strong> Espacios digitales estructurados para el intercambio de opiniones mediante texto y notas de voz.</li>
                <li><strong>Módulo de Votación Blockchain:</strong> Registro inmutable y criptográfico de sufragios para garantizar la transparencia y seguridad de los resultados.</li>
                <li><strong>Verificación de Identidad:</strong> Mecanismos de control mediante RUT, SMS y Device Fingerprinting para prevenir duplicidades e identidades falsas.</li>
                <li><strong>Gestión de Organizaciones y Proyectos:</strong> Herramientas administrativas para crear, programar y auditar iniciativas.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section id="accounts" className="scroll-mt-24 border-t border-slate-100 dark:border-slate-800/60 pt-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Users size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">3. Registro y Cuentas de Usuario</h2>
            </div>
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-4">
              <p>
                Para participar en los debates o votaciones de una organización, el usuario debe registrarse o ser invitado a través de 
                un enlace de enrolamiento oficial.
              </p>
              <p>
                Usted acepta y garantiza que:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Toda la información proporcionada durante el registro es verídica, exacta y actualizada.</li>
                <li>Es responsable de proteger la confidencialidad de su contraseña y de cualquier actividad que ocurra bajo su cuenta.</li>
                <li>No compartirá sus credenciales de acceso con terceros ni permitirá que otras personas utilicen su cuenta.</li>
                <li>Informará de manera inmediata a soporte en caso de detectar cualquier uso no autorizado de su cuenta o violación de seguridad.</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section id="usage" className="scroll-mt-24 border-t border-slate-100 dark:border-slate-800/60 pt-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Scale size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">4. Uso Aceptable</h2>
            </div>
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-4">
              <p>
                El usuario se compromete a hacer un uso de la Plataforma conforme a la ley, la moral, las buenas costumbres y los presentes Términos. 
                Queda expresamente prohibido:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Utilizar lenguaje vulgar, difamatorio, acosador, racista o de odio en los foros de debate o en los títulos de proyectos.</li>
                <li>Manipular o intentar eludir los sistemas de seguridad de la plataforma, incluyendo el Device Fingerprinting y la unicidad de IP.</li>
                <li>Suplantar la identidad de otro usuario o registrarse con correos electrónicos y credenciales ajenas.</li>
                <li>Utilizar herramientas automáticas (bots, scrapers) para interferir con el normal funcionamiento de las votaciones.</li>
              </ul>
              <p>
                Los administradores de cada organización y OM Tecnología se reservan el derecho de suspender o revocar el acceso a cualquier usuario que 
                infrinja las normas de uso aceptable aquí detalladas.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section id="privacy" className="scroll-mt-24 border-t border-slate-100 dark:border-slate-800/60 pt-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Lock size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">5. Privacidad y Seguridad</h2>
            </div>
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-4">
              <p>
                En cumplimiento con la legislación de protección de datos personales (Ley 19.628 de Chile) y normativas internacionales equivalentes, 
                AsambleApp se compromete a salvaguardar la privacidad de la información recolectada.
              </p>
              <p>
                <strong>Inmutabilidad y Votos:</strong> Para garantizar la validez democrática de los procesos, el voto registrado en blockchain es 
                <strong>completamente anónimo e inalterable</strong>. Esto significa que ni los administradores ni OM Tecnología pueden rastrear su 
                sufragio individual en el registro blockchain una vez emitido de forma segura.
              </p>
              <p>
                Los datos de registro de usuarios (nombre, RUT, correo) solo son utilizados para validar la legitimidad para participar en las 
                asambleas y no serán comercializados ni cedidos a terceros sin consentimiento explícito.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section id="support" className="scroll-mt-24 border-t border-slate-100 dark:border-slate-800/60 pt-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                <HelpCircle size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">6. Soporte y Contacto</h2>
            </div>
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-4">
              <p>
                Si tiene dudas, consultas, reclamos o sugerencias respecto a los presentes Términos y Condiciones, o requiere asistencia técnica con la 
                plataforma, puede ponerse en contacto con nuestro equipo a través de los canales de comunicación oficiales:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Correo de Soporte:</strong> soporte@asambleapp.cl</li>
                <li><strong>Sitio Web del Proveedor:</strong> <a href="https://omtecnologia.cl" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">OM Tecnología</a></li>
              </ul>
              <p className="mt-4 text-sm text-slate-500">
                Al continuar utilizando AsambleApp, usted declara haber leído y comprendido los términos descritos en este documento.
              </p>
            </div>
          </section>
        </main>
      </div>

      {/* Simple Page Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-400 dark:text-slate-500 mt-20">
        <p>© 2026 Asambleapp SaaS. Todos los derechos reservados.</p>
        <p className="mt-2">Desarrollada por OM Tecnología</p>
      </footer>
    </div>
  );
}
