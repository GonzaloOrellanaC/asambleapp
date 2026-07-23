import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Shield, Eye, ShieldCheck, Database, ClipboardList, CheckCircle2 } from 'lucide-react';
import React, { useState } from 'react';

export function DataProtection() {
  const [activeSection, setActiveSection] = useState('controller');

  const sections = [
    { id: 'controller', label: '1. Responsable del Tratamiento', icon: Shield },
    { id: 'data-collected', label: '2. Datos Recopilados', icon: Database },
    { id: 'purpose', label: '3. Finalidad del Tratamiento', icon: ClipboardList },
    { id: 'rights', label: '4. Derechos ARCO', icon: ShieldCheck },
    { id: 'security', label: '5. Seguridad y Retención', icon: Lock },
    { id: 'blockchain-privacy', label: '6. Privacidad en Blockchain', icon: Eye },
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-200 transition-colors duration-300">
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
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-955/40 py-16 px-6 text-center border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Políticas de Protección de Datos
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Conozca cómo recolectamos, procesamos y protegemos su información de carácter personal en cumplimiento con la legislación vigente.
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
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-955/50 dark:text-blue-400 shadow-sm'
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
          <section id="controller" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Shield size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">1. Responsable del Tratamiento</h2>
            </div>
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-4">
              <p>
                El responsable del tratamiento de los datos personales recopilados a través de esta plataforma es <strong>OM Tecnología</strong>, 
                con domicilio en Chile.
              </p>
              <p>
                Nos comprometemos a garantizar que el tratamiento de sus datos personales se realice con estricto apego a las disposiciones de la 
                <strong>Ley N° 19.628 sobre Protección de la Vida Privada</strong> de la República de Chile, así como bajo los principios internacionales 
                de licitud, lealtad, transparencia, minimización de datos y seguridad de la información.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="data-collected" className="scroll-mt-24 border-t border-slate-100 dark:border-slate-800/60 pt-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Database size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">2. Datos Recopilados</h2>
            </div>
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-4">
              <p>
                Para el correcto funcionamiento de los procesos de debate y votación digital, recopilamos y procesamos los siguientes datos:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Datos de Identidad:</strong> Nombre completo y RUT (Rol Único Tributario) para verificar la pertenencia al padrón de votación.</li>
                <li><strong>Datos de Contacto:</strong> Dirección de correo electrónico y/o número de teléfono móvil (para envíos de códigos OTP de validación de doble factor).</li>
                <li><strong>Datos Técnicos de Conectividad:</strong> Dirección IP, huella digital del dispositivo (Device Fingerprinting), tipo de navegador y sistema operativo. Estos datos son utilizados exclusivamente con fines de prevención de fraude e inicio de sesión seguro.</li>
                <li><strong>Grabaciones de Voz (Opcional):</strong> Notas de audio grabadas por usted dentro del foro de debate cuando decida participar en dicho formato.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section id="purpose" className="scroll-mt-24 border-t border-slate-100 dark:border-slate-800/60 pt-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <ClipboardList size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">3. Finalidad del Tratamiento</h2>
            </div>
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-4">
              <p>
                Los datos recopilados son tratados única y exclusivamente para los siguientes fines:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Validación de Legitimidad:</strong> Confirmar que el usuario pertenece a la organización solicitante y tiene derecho a voto en las iniciativas del proyecto.</li>
                <li><strong>Prevención de Fraude:</strong> Evitar la duplicidad de votos, el uso de robots o la suplantación de identidad mediante la monitorización temporal de sesiones de conexión.</li>
                <li><strong>Comunicaciones Esenciales:</strong> Enviar notificaciones de apertura de debates, cierres de votación, resultados oficiales e invitaciones a asambleas.</li>
                <li><strong>Mejora del Servicio:</strong> Análisis técnico estadístico y anónimo sobre el rendimiento y uso de la plataforma.</li>
              </ul>
              <p>
                En ningún caso OM Tecnología venderá, arrendará o compartirá sus datos de carácter personal con fines publicitarios o a terceras empresas ajenas al Servicio.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section id="rights" className="scroll-mt-24 border-t border-slate-100 dark:border-slate-800/60 pt-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">4. Derechos ARCO</h2>
            </div>
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-4">
              <p>
                De acuerdo con la legislación vigente, usted goza de los denominados derechos ARCO:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Acceso:</strong> Solicitar conocer qué datos personales de su persona mantenemos en la plataforma.</li>
                <li><strong>Rectificación:</strong> Corregir información que sea incorrecta, desactualizada o inexacta.</li>
                <li><strong>Cancelación (Eliminación):</strong> Solicitar la eliminación de su cuenta y sus datos personales almacenados.</li>
                <li><strong>Oposición:</strong> Negarse al tratamiento de sus datos para ciertos procesos específicos.</li>
              </ul>
              <p>
                Para ejercer cualquiera de estos derechos, puede dirigir una solicitud a nuestro Delegado de Protección de Datos a través del correo 
                <strong> privacidad@asambleapp.cl</strong>. Su solicitud será procesada en un plazo máximo de 10 días hábiles.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section id="security" className="scroll-mt-24 border-t border-slate-100 dark:border-slate-800/60 pt-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Lock size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">5. Seguridad y Retención</h2>
            </div>
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-4">
              <p>
                Aplicamos medidas de seguridad técnicas y organizativas del más alto nivel para salvaguardar la integridad y privacidad de su información:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Cifrado de datos en tránsito utilizando protocolos seguros HTTPS y SSL/TLS.</li>
                <li>Cifrado en reposo para el almacenamiento de contraseñas mediante hashing criptográfico robusto (`bcrypt`).</li>
                <li>Políticas estrictas de control de acceso restringido solo para personal autorizado.</li>
              </ul>
              <p>
                <strong>Retención:</strong> Sus datos personales se conservan mientras se mantenga activa la cuenta de su organización. Si la organización finaliza 
                su suscripción o si usted solicita su baja del padrón, procederemos a la eliminación segura de su perfil e identificadores asociados 
                en un plazo no mayor a 30 días corridos, salvo obligaciones legales de conservación de actas oficiales.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section id="blockchain-privacy" className="scroll-mt-24 border-t border-slate-100 dark:border-slate-800/60 pt-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                <Eye size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">6. Privacidad en Blockchain</h2>
            </div>
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-4">
              <p>
                El núcleo tecnológico de AsambleApp utiliza tecnología de libro contable distribuido (blockchain) para registrar los cómputos de cada votación 
                e inmutabilizarlos, cumpliendo así con las máximas exigencias de transparencia democrática.
              </p>
              <p>
                <strong>Tratamiento Anonimizado del Voto:</strong> 
              </p>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 space-y-3">
                <p className="text-sm leading-relaxed">
                  Cuando usted emite un voto, el sistema valida que usted tiene derecho a hacerlo, pero el registro de su opción elegida se escribe en el bloque 
                  <strong>de forma totalmente disociada y anónima</strong>. 
                </p>
                <p className="text-sm leading-relaxed">
                  No se asocia su nombre, RUT, correo, dirección IP, ni ningún otro identificador personal en el bloque público de la cadena. Es criptográficamente 
                  imposible reconstruir o conocer qué opción votó un usuario determinado a partir del registro blockchain.
                </p>
              </div>
              <p className="text-xs text-slate-500">
                Dado que los registros en la blockchain son permanentes e inalterables por diseño (inmutabilidad), este tratamiento de anonimización absoluta 
                garantiza el derecho al secreto del sufragio de por vida.
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
