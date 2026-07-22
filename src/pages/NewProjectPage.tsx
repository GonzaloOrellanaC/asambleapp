import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, UploadCloud, FileText, CheckCircle } from 'lucide-react';
import { useOrg } from '../context/OrgContext';
import { apiFetch } from '../lib/api';
import { RichTextEditor } from '../components/RichTextEditor';

export function NewProjectPage() {
  const { org, users, departments, reloadData, currentRole } = useOrg();
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [expandedDepts, setExpandedDepts] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const republishData = location.state?.republishData;
  const [activeTab, setActiveTab] = useState<'upload' | 'write'>(republishData?.pdfUrl ? 'upload' : 'write');
  const [errorMessage, setErrorMessage] = useState('');

  const [projectData, setProjectData] = useState(republishData ? {
    ...republishData,
    title: republishData.title + ' (Republicado)',
    debateStartTime: republishData.debateStartTime ? new Date(republishData.debateStartTime).toISOString().slice(0, 16) : '',
    debateClosingTime: republishData.debateClosingTime ? new Date(republishData.debateClosingTime).toISOString().slice(0, 16) : '',
    votingClosingTime: republishData.votingClosingTime ? new Date(republishData.votingClosingTime).toISOString().slice(0, 16) : '',
    invitedUsers: (republishData.invitedUsers || []).map((u: any) => u._id || u.id || u),
    republishedFromId: republishData._id || republishData.id
  } : { 
    title: '', 
    content: '', 
    maxChars: 500, 
    maxAudioTime: 60, 
    debateStartTime: '',
    debateClosingTime: '',
    votingClosingTime: '',
    pdfUrl: '',
    pdfName: '',
    invitedUsers: [] as string[],
    restrictBannedWords: true
  });

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Editor state
  const [editorContent, setEditorContent] = useState(republishData?.content || '');
  const [editorStyles, setEditorStyles] = useState({
    fontFamily: 'Arial, sans-serif',
    fontSize: '16px',
    lineHeight: '1.5',
    padding: '2rem',
    columnCount: 1,
    paperSize: 'auto'
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;

    try {
      let finalPdfUrl = projectData.pdfUrl;
      let finalPdfName = projectData.pdfName;

      // Handle PDF upload
      if (activeTab === 'upload' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await apiFetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          finalPdfUrl = data.url;
          finalPdfName = data.name;
        }
      }

      // Handle Editor content (save as HTML in content, or as a generated PDF, but let's just save as content for now)
      // Actually we can just save it in the project's content field, and render it in ProjectView if there's no PDF.
      const finalContent = activeTab === 'write' ? editorContent : projectData.content;

      const userIdsFromDepts = new Set<string>();
      users.forEach((u: any) => {
        const uDepts = [...(u.departmentIds || [])];
        if (u.departmentId && !uDepts.includes(u.departmentId)) uDepts.push(u.departmentId);
        
        const hasMatchingDept = uDepts.some(d => {
          const did = typeof d === 'object' ? (d._id || d.id) : d;
          return selectedDepts.includes(did);
        });
        
        if (hasMatchingDept) {
          userIdsFromDepts.add(u._id || u.id);
        }
      });
      const allInvitedUsers = Array.from(new Set([...projectData.invitedUsers, ...userIdsFromDepts]));

      if (allInvitedUsers.length === 0) {
        setErrorMessage("Atención: Debes invitar al menos a un usuario o departamento antes de crear el proyecto.");
        return;
      }

      const payload = { 
        ...projectData,
        invitedUsers: allInvitedUsers,
        content: finalContent,
        editorStyles: activeTab === 'write' ? editorStyles : undefined, // Save styles if using editor
        orgId: org.id,
        pdfUrl: finalPdfUrl,
        pdfName: finalPdfName,
        debateStartTime: projectData.debateStartTime ? new Date(projectData.debateStartTime).toISOString() : null,
        debateClosingTime: projectData.debateClosingTime ? new Date(projectData.debateClosingTime).toISOString() : null,
        votingClosingTime: projectData.votingClosingTime ? new Date(projectData.votingClosingTime).toISOString() : null
      };

      await apiFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      reloadData();
      navigate(`/${org.customUrl}`);
    } catch (e) {
      console.error(e);
      alert('Error al crear proyecto');
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  if (!org) return null;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900" style={{ '--org-color': org.styles?.primaryColor || '#1d4ed8' } as any}>
      <div className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <div className="flex items-center gap-4">
          <Link to={`/${org.customUrl}`} className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Nuevo Proyecto</h1>
        </div>
        {errorMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 shadow-lg flex items-center gap-2">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="text-red-700 font-bold ml-2">X</button>
          </div>
        )}
        <button 
          onClick={handleCreateProject}
          disabled={!projectData.title}
          className="bg-[var(--org-color)] text-white px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <CheckCircle size={16} /> Crear Proyecto
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Form */}
        <div className="w-[400px] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto p-6 flex flex-col shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Detalles del Proyecto</h2>
          
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título del Proyecto *</label>
              <input 
                type="text" 
                required
                value={projectData.title}
                onChange={e => setProjectData({...projectData, title: e.target.value})}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--org-color)]"
                placeholder="Ej. Ley de Movilidad Urbana"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Resumen / Descripción breve</label>
              <textarea 
                value={projectData.content}
                onChange={e => setProjectData({...projectData, content: e.target.value})}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--org-color)] min-h-[100px]"
                placeholder="Breve descripción del proyecto para el listado..."
              />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">Reglas del Debate</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Máx. Caracteres</label>
                  <input 
                    type="number" 
                    value={projectData.maxChars}
                    onChange={e => setProjectData({...projectData, maxChars: Number(e.target.value)})}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--org-color)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Máx. Segundos Audio</label>
                  <input 
                    type="number" 
                    value={projectData.maxAudioTime}
                    onChange={e => setProjectData({...projectData, maxAudioTime: Number(e.target.value)})}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--org-color)]"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Inicio de Debate</label>
                  <input 
                    type="datetime-local" 
                    value={projectData.debateStartTime}
                    onChange={e => setProjectData({...projectData, debateStartTime: e.target.value})}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--org-color)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cierre de Debate</label>
                  <input 
                    type="datetime-local" 
                    value={projectData.debateClosingTime}
                    onChange={e => setProjectData({...projectData, debateClosingTime: e.target.value})}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--org-color)]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cierre de Votaciones</label>
                  <input 
                    type="datetime-local" 
                    value={projectData.votingClosingTime}
                    onChange={e => setProjectData({...projectData, votingClosingTime: e.target.value})}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--org-color)]"
                  />
                </div>
              </div>

            </div>
              <div className="mb-4 mt-6">
                <label className="flex items-center gap-2 p-1 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900 rounded cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={projectData.restrictBannedWords}
                    onChange={(e) => setProjectData({...projectData, restrictBannedWords: e.target.checked})}
                    className="rounded border-slate-300 dark:border-slate-600 text-[var(--org-color)] focus:ring-[var(--org-color)]"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Aplicar filtro de palabras prohibidas en el chat de debate</span>
                </label>
              </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Invitar por Grupos de Trabajo (Opcional)</label>
              
              <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2 space-y-2 mb-4 bg-slate-50 dark:bg-slate-900/50">
                {departments && departments.filter((d: any) => !d.parentId).map((dept: any) => {
                  const id = dept._id || dept.id;
                  const isChecked = selectedDepts.includes(id);
                  const subgroups = departments.filter((d: any) => d.parentId === id);
                  const hasSubgroups = subgroups.length > 0;
                  const isExpanded = expandedDepts.includes(id);
                  
                  return (
                    <div key={id} className="flex flex-col">
                      <div className="flex items-center gap-2 p-1 hover:bg-white dark:hover:bg-slate-800 rounded">
                        {hasSubgroups ? (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              if (isExpanded) {
                                setExpandedDepts(expandedDepts.filter(eid => eid !== id));
                              } else {
                                setExpandedDepts([...expandedDepts, id]);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded"
                          >
                            <svg 
                              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            >
                              <path d="m9 18 6-6-6-6"/>
                            </svg>
                          </button>
                        ) : (
                          <div className="w-6"></div>
                        )}
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const newDepts = [...selectedDepts, id];
                                subgroups.forEach((s: any) => {
                                  if (!newDepts.includes(s._id || s.id)) {
                                    newDepts.push(s._id || s.id);
                                  }
                                });
                                setSelectedDepts(newDepts);
                                if (!isExpanded && hasSubgroups) {
                                  setExpandedDepts([...expandedDepts, id]);
                                }
                              } else {
                                const subgroupIDs = subgroups.map((s: any) => s._id || s.id);
                                setSelectedDepts(selectedDepts.filter(did => did !== id && !subgroupIDs.includes(did)));
                              }
                            }}
                            className="rounded border-slate-300 text-[var(--org-color)] focus:ring-[var(--org-color)]"
                          />
                          <span className="text-sm font-medium">{dept.name}</span>
                        </label>
                      </div>
                      
                      {hasSubgroups && isExpanded && (
                        <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-200 dark:border-slate-700 pl-2">
                          {subgroups.map((sub: any) => {
                            const subId = sub._id || sub.id;
                            const isSubChecked = selectedDepts.includes(subId);
                            return (
                              <label key={subId} className="flex items-center gap-2 p-1 hover:bg-white dark:hover:bg-slate-800 rounded cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={isSubChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      const newDepts = [...selectedDepts, subId];
                                      if (!newDepts.includes(id)) {
                                        newDepts.push(id);
                                      }
                                      setSelectedDepts(newDepts);
                                    } else {
                                      setSelectedDepts(selectedDepts.filter(did => did !== subId));
                                    }
                                  }}
                                  className="rounded border-slate-300 text-[var(--org-color)] focus:ring-[var(--org-color)]"
                                />
                                <span className="text-sm text-slate-600 dark:text-slate-300">{sub.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {(!departments || departments.filter((d: any) => !d.parentId).length === 0) && (
                  <p className="text-sm text-slate-500 p-2">No hay grupos creados</p>
                )}
              </div>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Invitar Usuarios Específicos (Opcional)</label>
              <div className="mb-2">
                <label className="flex items-center gap-2 p-1 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900 rounded cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={projectData.invitedUsers.length === users.length && users.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setProjectData({...projectData, invitedUsers: users.map(u => u._id || u.id)});
                      } else {
                        setProjectData({...projectData, invitedUsers: []});
                      }
                    }}
                    className="rounded border-slate-300 dark:border-slate-600 text-[var(--org-color)] focus:ring-[var(--org-color)]"
                  />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Invitar a todos los usuarios de la organización</span>
                </label>
              </div>
              <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2 space-y-1">
                {users.map(u => {
                  const uid = u._id || u.id;
                  return (
                  <label key={uid} className="flex items-center gap-2 p-1 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={projectData.invitedUsers.includes(uid)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProjectData({...projectData, invitedUsers: [...projectData.invitedUsers, uid]});
                        } else {
                          setProjectData({...projectData, invitedUsers: projectData.invitedUsers.filter(id => id !== uid)});
                        }
                      }}
                      className="rounded border-slate-300 dark:border-slate-600 text-[var(--org-color)] focus:ring-[var(--org-color)]"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{u.name} ({u.email})</span>
                  </label>
                )})}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Document */}
        <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-6 flex flex-col overflow-hidden relative">
          <div className="absolute top-6 left-6 right-6 z-10 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${activeTab === 'write' ? 'bg-white dark:bg-slate-800 text-[var(--org-color)] border-t border-l border-r border-slate-200 dark:border-slate-700' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
              <FileText className="inline-block mr-2" size={16} />
              Escribir Proyecto
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${activeTab === 'upload' ? 'bg-white dark:bg-slate-800 text-[var(--org-color)] border-t border-l border-r border-slate-200 dark:border-slate-700' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
              <UploadCloud className="inline-block mr-2" size={16} />
              Subir PDF
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden relative rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 mt-12">
            {activeTab === 'write' ? (
              <RichTextEditor 
                value={editorContent}
                onChange={setEditorContent}
                editorStyles={editorStyles}
                onStylesChange={setEditorStyles}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <input 
                  type="file" 
                  accept="application/pdf"
                  className="hidden" 
                  id="pdf-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      setProjectData({ ...projectData, pdfName: file.name });
                    }
                  }}
                />
                <label 
                  htmlFor="pdf-upload"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type === 'application/pdf') {
                      setSelectedFile(file);
                      setProjectData({ ...projectData, pdfName: file.name });
                    } else if (file) {
                      alert('Solo se permiten archivos PDF');
                    }
                  }}
                  className={`w-full max-w-md p-12 border-2 border-dashed rounded-xl cursor-pointer transition-colors flex flex-col items-center justify-center ${isDragging ? 'border-[var(--org-color)] bg-[var(--org-color)]/5' : 'border-slate-300 dark:border-slate-600 hover:border-[var(--org-color)] hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                >
                  <UploadCloud size={48} className={selectedFile ? 'text-[var(--org-color)]' : 'text-slate-400'} />
                  <h3 className="mt-4 text-lg font-bold text-slate-700 dark:text-slate-200">
                    {selectedFile ? 'Archivo seleccionado' : 'Arrastra un PDF aquí'}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {selectedFile ? selectedFile.name : 'o haz clic para explorar tus archivos'}
                  </p>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
