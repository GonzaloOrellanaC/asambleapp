import { apiFetch } from '../lib/api';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Users, Activity, Plus, Settings, UploadCloud, Trash2, LayoutGrid, List } from 'lucide-react';
import { UserPopover } from '../components/UserPopover';
import { useOrg } from '../context/OrgContext';



const getProjectStatusInfo = (project: any) => {
  const now = new Date();
  
  if (project.debateStartTime && now < new Date(project.debateStartTime)) {
    return { label: 'Programado', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' };
  }
  
  if (project.debateClosingTime && now > new Date(project.debateClosingTime)) {
    if (project.votingClosingTime && now < new Date(project.votingClosingTime)) {
      return { label: 'En Votación', color: 'bg-purple-100 text-purple-700' };
    }
    return { label: 'Cerrado', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' };
  }
  
  return { label: 'En Debate', color: 'bg-blue-100 text-blue-700' };
};

const stripHtmlAndEntities = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

export function OrgDashboard() {
  const { orgUrl } = useParams();
  const { org, currentUser, currentRole, projects, users, departments, reloadData, updateOrgUrl, updateOrg } = useOrg();
  
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const [activeTab, setActiveTab] = useState<'projects' | 'users' | 'departments' | 'tickets' | 'settings'>('projects');
  const [tickets, setTickets] = useState<any[]>([]);
  const [projectFilter, setProjectFilter] = useState<'activos' | 'cerrados' | 'todos'>(() => {
    return (localStorage.getItem('projectFilter') as any) || 'activos';
  });

  useEffect(() => {
    localStorage.setItem('projectFilter', projectFilter);
  }, [projectFilter]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectData, setProjectData] = useState({ 
    title: '', 
    content: '', 
    maxChars: 500, 
    maxAudioTime: 60, 
    debateClosingTime: '',
    votingClosingTime: '',
    pdfUrl: '',
    pdfName: '',
    invitedUsers: [] as string[]
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [showUserModal, setShowUserModal] = useState(false);
  const [userData, setUserData] = useState({ name: '', email: '', role: 'usuario', departmentId: '', departmentIds: [] as string[] });

  const [showDeptModal, setShowDeptModal] = useState(false);

  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [showDeptDetails, setShowDeptDetails] = useState(false);

  const [showSubgroupsModal, setShowSubgroupsModal] = useState(false);
  const [subgroupsList, setSubgroupsList] = useState<any[]>([]);

  const [deptUsersFilter, setDeptUsersFilter] = useState<string | null>(null);

  const [deptData, setDeptData] = useState({ name: '', description: '', parentId: '' });
  
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [enrollmentRole, setEnrollmentRole] = useState('usuario');
  const [expiresInHours, setExpiresInHours] = useState('24');
  const [generatedLink, setGeneratedLink] = useState('');
  const [editUser, setEditUser] = useState<any>(null);
  const [editUserDepts, setEditUserDepts] = useState<string[]>([]);
  const [expandedEditDepts, setExpandedEditDepts] = useState<string[]>([]);
  const [expandedInviteDepts, setExpandedInviteDepts] = useState<string[]>([]);

  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<any>(null);
  const [userPage, setUserPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const filteredUsers = deptUsersFilter ? users.filter((u: any) => u.departmentIds?.some((d: any) => (d._id || d.id) === deptUsersFilter) || (u.departmentId && (u.departmentId._id || u.departmentId.id) === deptUsersFilter)) : users;


  const [consensusLevel, setConsensusLevel] = useState<string>('0%');

  const filteredProjects = projects.filter((p: any) => {
    const s = getProjectStatusInfo(p).label;
    const isActive = s === 'En Debate' || s === 'En Votación';
    if (projectFilter === 'activos') return isActive;
    if (projectFilter === 'cerrados') return !isActive;
    return true;
  });
  
  const activeProjectsCount = projects.filter((p: any) => {
    const s = getProjectStatusInfo(p).label;
    return s === 'En Debate' || s === 'En Votación';
  }).length;


  useEffect(() => {
    if (org && !newUrl) {
      setNewUrl(org.customUrl);
    }
  }, [org]);
  
  useEffect(() => {
    if (org && org.id) {
      apiFetch(`/api/votes/org/${org.id}`)
        .then(r => r.json())
        .then((votes: any[]) => {
          if (!votes || votes.length === 0) {
            setConsensusLevel('0%');
            return;
          }
          const aFavor = votes.filter(v => v.option === 'A Favor').length;
          const percentage = Math.round((aFavor / votes.length) * 100);
          setConsensusLevel(`${percentage}%`);
        })
        .catch(() => setConsensusLevel('0%'));

      apiFetch(`/api/tickets/org/${org.id}`)
        .then(r => r.json())
        .then(setTickets)
        .catch(() => {});
    }
  }, [org, projects]);

  const [replyTicketModal, setReplyTicketModal] = useState<{ id: string, subject: string } | null>(null);
  const [ticketReplyMessage, setTicketReplyMessage] = useState('');

  const handleForwardTicket = async (ticketId: string) => {
    if (!ticketId) return;
    try {
      const res = await apiFetch(`/api/tickets/${ticketId}/forward`, { method: 'PUT' });
      if (res.ok) {
        setTickets(prev => prev.map(t => (t._id === ticketId || t.id === ticketId) ? { ...t, forwardedToSuperAdmin: true } : t));
        alert('Ticket reenviado a Soporte AsambleApp con éxito.');
      } else {
        alert('Error al reenviar el ticket.');
      }
    } catch (e) {
      alert('Error al reenviar el ticket.');
    }
  };

  const handleCloseTicket = async (ticketId: string, is24hTimeout = false) => {
    if (!ticketId) return;
    try {
      const res = await apiFetch(`/api/tickets/${ticketId}/close`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          is24hTimeout,
          senderName: 'Administrador de Organización',
          senderRole: 'admin'
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setTickets(prev => prev.map(t => (t._id === ticketId || t.id === ticketId) ? updated : t));
        alert('Ticket cerrado con éxito.');
      } else {
        alert('Error al cerrar el ticket.');
      }
    } catch (e) {
      alert('Error al cerrar el ticket.');
    }
  };

  const handleReplyTicket = async (ticketId: string, message: string, closeTicket: boolean = false) => {
    if (!ticketId || !message.trim()) return;
    try {
      const res = await apiFetch(`/api/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          senderName: 'Administrador de Organización',
          senderRole: 'admin',
          closeTicket
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setTickets(prev => prev.map(t => (t._id === ticketId || t.id === ticketId) ? updated : t));
        setReplyTicketModal(null);
        setTicketReplyMessage('');
        alert(closeTicket ? 'Respuesta enviada y ticket cerrado.' : 'Respuesta enviada con éxito.');
      } else {
        alert('Error al responder el ticket.');
      }
    } catch (e) {
      alert('Error al responder el ticket.');
    }
  };

  

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      const res = await apiFetch(`/api/projects/${projectToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        reloadData(); // reload projects from context
        setProjectToDelete(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar el proyecto');
      }
    } catch (e) {
      alert('Error al eliminar el proyecto');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalPdfUrl = '';
      let finalPdfName = '';

      if (selectedFile) {
        // Read file as base64 for mockup purposes
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(selectedFile);
        });
        finalPdfUrl = await base64Promise;
        finalPdfName = selectedFile.name;
      }

      const payload = { 
        ...projectData, 
        orgId: org.id,
        pdfUrl: finalPdfUrl,
        pdfName: finalPdfName,
        debateClosingTime: projectData.debateClosingTime ? new Date(projectData.debateClosingTime).toISOString() : null,
        votingClosingTime: projectData.votingClosingTime ? new Date(projectData.votingClosingTime).toISOString() : null
      };

      await apiFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setShowProjectModal(false);
      setProjectData({ title: '', content: '', maxChars: 500, maxAudioTime: 60, debateClosingTime: '',
    votingClosingTime: '', pdfUrl: '', pdfName: '', invitedUsers: [] });
      setSelectedFile(null);
      reloadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userData, orgId: org.id })
      });
      setShowUserModal(false);
      setUserData({ name: '', email: '', role: 'usuario', departmentId: '', departmentIds: [] });
      reloadData();
    } catch (e) {
      console.error(e);
    }
  };


  const handleDeleteDept = async (id: string) => {
    try {
      const res = await apiFetch(`/api/departments/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        alert("Error al eliminar el grupo");
        return;
      }
      setShowDeptDetails(false);
      setSelectedDept(null);
      setDeptUsersFilter(null);
      setDeptToDelete(null);
      reloadData();
    } catch (e) {
      console.error(e);
      alert("Error de red");
    }
  };
  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: deptData.name, description: deptData.description, parentId: deptData.parentId || undefined, orgId: org.id })
      });
      setShowDeptModal(false);
      setDeptData({ name: '', description: '', parentId: '' });
      reloadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateEnrollmentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/enrollment/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: org.id, role: enrollmentRole, expiresInHours })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setGeneratedLink(`${window.location.origin}/${orgUrl}/enroll/${data.token}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="" style={{ '--org-color': org?.styles?.primaryColor || '#1d4ed8' } as any}>
      {!org ? (
        <div className="max-w-6xl mx-auto p-6 mt-6 text-center text-slate-500 dark:text-slate-400">
          Cargando organización...
        </div>
      ) : (
      <main className="max-w-6xl mx-auto p-6 mt-6">
        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-8 space-x-8">
          <button 
            className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'projects' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'}`}
            onClick={() => setActiveTab('projects')}
          >
            Proyectos
            {activeTab === 'projects' && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ backgroundColor: org.styles?.primaryColor || '#1d4ed8' }}></div>}
          </button>
          {currentRole !== 'usuario' && (
            <>
              <button 
                className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'users' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'}`}
                onClick={() => setActiveTab('users')}
              >
                Usuarios
                {activeTab === 'users' && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ backgroundColor: org.styles?.primaryColor || '#1d4ed8' }}></div>}
              </button>
              <button 
                className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'departments' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'}`}
                onClick={() => setActiveTab('departments')}
              >
                Grupos de Trabajo
                {activeTab === 'departments' && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ backgroundColor: org.styles?.primaryColor || '#1d4ed8' }}></div>}
              </button>
              <button 
                className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'tickets' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'}`}
                onClick={() => setActiveTab('tickets')}
              >
                Tickets
                {activeTab === 'tickets' && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ backgroundColor: org.styles?.primaryColor || '#1d4ed8' }}></div>}
              </button>

            </>
          )}
        </div>

        {activeTab === 'projects' && (
          <>
                        <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Proyectos de Ley y Debates</h2>
                <p className="text-slate-500 dark:text-slate-400">Gestiona las iniciativas, foros de discusión y votaciones.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow-sm">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
                    title="Vista Cuadrícula"
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
                    title="Vista Lista"
                  >
                    <List size={18} />
                  </button>
                </div>
                {currentRole !== 'usuario' && (
                  <Link 
                    to={`/${orgUrl}/new-project`}
                    className="flex items-center gap-2 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 shadow-sm"
                    style={{ backgroundColor: org.styles?.primaryColor || '#1d4ed8' }}
                  >
                    <Plus size={18} />
                    Nuevo Proyecto
                  </Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><FileText size={24} /></div>
                <div>
                  <div className="text-2xl font-bold">{activeProjectsCount}</div>
                  <div className="text-slate-500 dark:text-slate-400 text-sm">Proyectos Activos</div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Users size={24} /></div>
                <div>
                  <div className="text-2xl font-bold">{users.length}</div>
                  <div className="text-slate-500 dark:text-slate-400 text-sm">Participantes Registrados</div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Activity size={24} /></div>
                <div>
                  <div className="text-2xl font-bold">{consensusLevel}</div>
                  <div className="text-slate-500 dark:text-slate-400 text-sm">Nivel de Consenso</div>
                </div>
              </div>
            </div>

                        <div className="mb-6 flex gap-2">
              <button 
                onClick={() => setProjectFilter('activos')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${projectFilter === 'activos' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900'}`}
              >
                Proyectos Activos
              </button>
              <button 
                onClick={() => setProjectFilter('cerrados')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${projectFilter === 'cerrados' ? 'bg-slate-800 text-white border border-slate-800' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900'}`}
              >
                Cerrados / Programados
              </button>
              <button 
                onClick={() => setProjectFilter('todos')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${projectFilter === 'todos' ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900'}`}
              >
                Todos
              </button>
            </div>
            
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project: any) => {
                  const statusInfo = getProjectStatusInfo(project);
                  return (
                    <div key={project.id || project._id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative group flex flex-col h-full">
                      {currentRole !== 'usuario' && (
                        <button 
                          onClick={() => setProjectToDelete(project.id || project._id)}
                          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <div className="mb-4">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2 leading-tight flex-none">{project.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2 flex-1">{project.content ? stripHtmlAndEntities(project.content).substring(0, 150) + '...' : 'Sin descripción'}</p>
                      
                      <div className="mt-auto">
                        <Link 
                          to={`/${orgUrl}/p/${project.id || project._id}`}
                          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--org-color)] hover:underline"
                          style={{ color: org?.styles?.primaryColor || '#1d4ed8' }}
                        >
                          Ver Detalles
                        </Link>
                      </div>
                    </div>
                  );
                })}
                {filteredProjects.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <FileText className="mx-auto mb-4 text-slate-400" size={32} />
                    <p className="font-medium">No hay proyectos activos</p>
                    <p className="text-sm mt-1">Crea un nuevo proyecto para comenzar.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Proyecto</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400 w-48">Estado</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400 w-32 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredProjects.map((project: any) => {
                      const statusInfo = getProjectStatusInfo(project);
                      return (
                        <tr key={project.id || project._id} className="hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900 group">
                          <td className="px-6 py-4">
                            <Link to={`/${orgUrl}/p/${project.id || project._id}`} className="block">
                              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">{project.title}</h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{project.content ? stripHtmlAndEntities(project.content).substring(0, 100) + '...' : 'Sin descripción'}</p>
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link 
                                to={`/${orgUrl}/p/${project.id || project._id}`}
                                className="text-sm font-bold text-blue-600 hover:text-blue-800"
                                style={{ color: org?.styles?.primaryColor || '#1d4ed8' }}
                              >
                                Ver
                              </Link>
                              {currentRole !== 'usuario' && (
                                <button 
                                  onClick={() => setProjectToDelete(project.id || project._id)}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Eliminar proyecto"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredProjects.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                          <FileText className="mx-auto mb-4 text-slate-400" size={32} />
                          <p className="font-medium">No hay proyectos activos</p>
                          <p className="text-sm mt-1">Crea un nuevo proyecto para comenzar.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Users Tab Placeholder */}
        {activeTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Usuarios
                  {deptUsersFilter && (
                    <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                      Filtrados por grupo
                      <button onClick={() => setDeptUsersFilter(null)} className="ml-1 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200">
                        &times;
                      </button>
                    </span>
                  )}
                </h2>
                <p className="text-slate-500 dark:text-slate-400">Administra los miembros de la organización.</p>
              </div>
              <button 
                onClick={() => setShowEnrollmentModal(true)}
                className="flex items-center gap-2 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
                style={{ backgroundColor: org.styles?.primaryColor || '#1d4ed8' }}
              >
                <Plus size={18} />
                Invitar Usuarios
              </button>
            </div>
            
            
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-sm text-slate-500">Mostrando {Math.min(filteredUsers.length, usersPerPage)} de {filteredUsers.length} usuarios</span>
                <select 
                  value={usersPerPage} 
                  onChange={e => { setUsersPerPage(Number(e.target.value)); setUserPage(1); }}
                  className="text-sm border border-slate-300 rounded px-2 py-1"
                >
                  <option value={10}>10 por página</option>
                  <option value={50}>50 por página</option>
                  <option value={100}>100 por página</option>
                </select>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Nombre</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Email</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Grupos</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Rol</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.slice((userPage - 1) * usersPerPage, userPage * usersPerPage).map((user: any) => (
                    <tr key={user.id || user._id}>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-100">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{user.email}</td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.departmentIds && user.departmentIds.length > 0 ? 
                            user.departmentIds.map((d: any) => (
                              <span key={d._id || d.id} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                {d.name}
                              </span>
                            ))
                            : user.departmentId ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                {user.departmentId.name || 'Asignado'}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">Sin grupo</span>
                            )
                          }
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(currentRole === 'administrador' || currentRole === 'gestor') && (
                          <button 
                            onClick={() => {
                              setEditUser(user);
                              setEditUserDepts(user.departmentIds?.map((d:any) => d._id || d.id) || (user.departmentId ? [user.departmentId._id || user.departmentId] : []));
                            }}
                            className="text-blue-600 hover:underline text-sm font-medium"
                          >
                            Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              
              </table>
              {filteredUsers.length > usersPerPage && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <button 
                    disabled={userPage === 1} 
                    onClick={() => setUserPage(p => p - 1)}
                    className="px-3 py-1 bg-slate-100 rounded text-sm disabled:opacity-50"
                  >Anterior</button>
                  <span className="text-sm">Página {userPage} de {Math.ceil(filteredUsers.length / usersPerPage)}</span>
                  <button 
                    disabled={userPage >= Math.ceil(filteredUsers.length / usersPerPage)} 
                    onClick={() => setUserPage(p => p + 1)}
                    className="px-3 py-1 bg-slate-100 rounded text-sm disabled:opacity-50"
                  >Siguiente</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Departments Tab Placeholder */}
        {activeTab === 'departments' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Grupos de Trabajo</h2>
                <p className="text-slate-500 dark:text-slate-400">Gestiona las áreas de la organización.</p>
              </div>
              <button 
                onClick={() => setShowDeptModal(true)}
                className="flex items-center gap-2 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
                style={{ backgroundColor: org.styles?.primaryColor || '#1d4ed8' }}
              >
                <Plus size={18} />
                Nuevo Grupo de Trabajo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.filter(d => !d.parentId).map((dept: any) => {
                const subgroups = departments.filter(d => d.parentId === (dept._id || dept.id));
                return (
                  <div 
                    key={dept.id || dept._id} 
                    className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative flex flex-col justify-between"
                  >
                    <div 
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedDept(dept);
                        setShowDeptDetails(true);
                      }}
                    >
                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-2">{dept.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{dept.description || 'Sin descripción'}</p>
                    </div>
                    {subgroups.length > 0 && (
                      <div className="border-t border-slate-100 dark:border-slate-700 pt-3 mt-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSubgroupsList(subgroups);
                            setShowSubgroupsModal(true);
                          }}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Ver {subgroups.length} subgrupos
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Tickets de Soporte</h2>
                <p className="text-slate-500 dark:text-slate-400">Revisa y gestiona las solicitudes de tus usuarios.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  Tickets de Usuarios
                </h2>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {tickets.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No hay tickets registrados</div>
                ) : tickets.map((t: any) => {
                  const tid = t._id || t.id;
                  const isClosed = t.status === 'closed';
                  return (
                    <div key={tid} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors space-y-3">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100">{t.subject}</h3>
                          <p className="text-xs text-slate-400">
                            De: {t.userId?.name || 'Desconocido'} ({t.userId?.email || 'Sin email'})
                          </p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          isClosed 
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' 
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        }`}>
                          {isClosed ? 'Cerrado' : 'Abierto'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{t.message}</p>

                      {/* Thread Responses */}
                      {t.responses && t.responses.length > 0 && (
                        <div className="space-y-2 pl-4 border-l-2 border-slate-200 dark:border-slate-700 mt-2">
                          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Historial de Respuestas:</span>
                          {t.responses.map((resp: any, idx: number) => (
                            <div key={idx} className="bg-slate-100 dark:bg-slate-900 p-2.5 rounded-lg text-xs space-y-1 border border-slate-200/60 dark:border-slate-800">
                              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-medium">
                                <span><strong>{resp.senderName || 'Soporte'}</strong> ({resp.senderRole || 'admin'})</span>
                                <span className="text-[10px]">{new Date(resp.createdAt).toLocaleString()}</span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{resp.message}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                        {!isClosed && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleCloseTicket(tid, true)}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                              title="Cierra el ticket notificando 24 hrs sin respuesta"
                            >
                              Cerrar (Inactividad 24h)
                            </button>
                            <button
                              type="button"
                              onClick={() => setReplyTicketModal({ id: tid, subject: t.subject })}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-slate-700 dark:text-white hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
                            >
                              Responder Ticket
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleForwardTicket(tid)}
                          disabled={t.forwardedToSuperAdmin}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t.forwardedToSuperAdmin ? 'Reenviado a Soporte AsambleApp ✓' : 'Reenviar a Soporte AsambleApp'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      {/* Reply Ticket Modal for Org Admin */}
      {replyTicketModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold mb-1 text-slate-800 dark:text-slate-100">Responder Ticket</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Ticket: "{replyTicketModal.subject}"</p>
            
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Respuesta para el usuario:</label>
            <textarea
              value={ticketReplyMessage}
              onChange={(e) => setTicketReplyMessage(e.target.value)}
              placeholder="Escribe la respuesta para el usuario..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm mb-4 outline-none focus:ring-2 focus:ring-[var(--org-color)] dark:text-white min-h-[120px]"
            />

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setReplyTicketModal(null); setTicketReplyMessage(''); }}
                className="px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!ticketReplyMessage.trim()}
                onClick={() => handleReplyTicket(replyTicketModal.id, ticketReplyMessage, false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Enviar Respuesta
              </button>
              <button
                type="button"
                disabled={!ticketReplyMessage.trim()}
                onClick={() => handleReplyTicket(replyTicketModal.id, ticketReplyMessage, true)}
                className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-700 rounded-lg font-medium text-sm hover:bg-slate-800 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
              >
                Responder y Cerrar Ticket
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
      )}



      {showDeptModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Nuevo Grupo de Trabajo</h3>
            <form onSubmit={handleCreateDept}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre del Grupo</label>
                <input 
                  type="text" 
                  value={deptData.name}
                  onChange={e => setDeptData({...deptData, name: e.target.value})}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-6">
                
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Grupo Padre (Opcional)</label>
                <select
                  value={deptData.parentId}
                  onChange={e => setDeptData({...deptData, parentId: e.target.value})}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Ninguno (Grupo Principal)</option>
                  {departments.map((d: any) => (
                    <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Descripción</label>
                <textarea 
                  value={deptData.description}
                  onChange={e => setDeptData({...deptData, description: e.target.value})}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowDeptModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 rounded-lg font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Modal (Orphaned but keeping form start to fix syntax) */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl my-8">
            <h3 className="text-xl font-bold mb-6">Nuevo Proyecto</h3>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Título</label>
                <input 
                  type="text" 
                  value={projectData.title}
                  onChange={e => setProjectData({...projectData, title: e.target.value})}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Máx. caracteres (texto)</label>
                  <input 
                    type="number" 
                    value={projectData.maxChars}
                    onChange={e => setProjectData({...projectData, maxChars: parseInt(e.target.value)})}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Máx. tiempo (audio s)</label>
                  <input 
                    type="number" 
                    value={projectData.maxAudioTime}
                    onChange={e => setProjectData({...projectData, maxAudioTime: parseInt(e.target.value)})}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cierre de Debate</label>
                  <input 
                    type="datetime-local" 
                    value={projectData.debateClosingTime}
                    onChange={e => setProjectData({...projectData, debateClosingTime: e.target.value})}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cierre de Votaciones</label>
                  <input 
                    type="datetime-local" 
                    value={projectData.votingClosingTime}
                    onChange={e => setProjectData({...projectData, votingClosingTime: e.target.value})}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Contenido inicial (opcional)</label>
                <textarea 
                  value={projectData.content}
                  onChange={e => setProjectData({...projectData, content: e.target.value})}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                ></textarea>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Usuarios Invitados</label>
                <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2 space-y-1">
                  {users.filter((u: any) => u.role === 'usuario').length === 0 && (
                    <div className="text-sm text-slate-500 dark:text-slate-400 p-2 text-center">No hay usuarios disponibles.</div>
                  )}
                  {users.filter((u: any) => u.role === 'usuario').map((u: any) => {
                    const uid = u._id || u.id;
                    return (
                    <label key={uid} className="flex items-center gap-2 p-1 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900 rounded">
                      <input 
                        type="checkbox" 
                        checked={projectData.invitedUsers.includes(uid)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProjectData({...projectData, invitedUsers: [...projectData.invitedUsers, uid]});
                          } else {
                            setProjectData({...projectData, invitedUsers: projectData.invitedUsers.filter((id: string) => id !== uid)});
                          }
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{u.name} ({u.email})</span>
                    </label>
                  )})}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => {setShowProjectModal(false); setSelectedFile(null);}} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 rounded-lg font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-brand-gradient text-white rounded-lg font-medium hover:bg-brand-gradient-hover">Crear Proyecto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Invitar Usuario</h3>
            <form onSubmit={handleCreateUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre</label>
                <input 
                  type="text" 
                  value={userData.name}
                  onChange={e => setUserData({...userData, name: e.target.value})}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                <input 
                  type="email" 
                  value={userData.email}
                  onChange={e => setUserData({...userData, email: e.target.value})}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rol</label>
                <select 
                  value={userData.role}
                  onChange={e => setUserData({...userData, role: e.target.value})}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800"
                >
                  <option value="usuario">Usuario</option>
                  <option value="editor">Editor</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
                            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Grupos de Trabajo (opcional)</label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2 space-y-2">
                {departments.filter(d => !d.parentId).map((dept: any) => {
                  const id = dept._id || dept.id;
                  const isChecked = userData.departmentIds.includes(id);
                  const subgroups = departments.filter(d => d.parentId === id);
                  const hasSubgroups = subgroups.length > 0;
                  const isExpanded = expandedInviteDepts.includes(id);
                  
                  return (
                    <div key={id} className="flex flex-col">
                      <div className="flex items-center gap-2 p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded">
                        {hasSubgroups ? (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              if (isExpanded) {
                                setExpandedInviteDepts(expandedInviteDepts.filter(eid => eid !== id));
                              } else {
                                setExpandedInviteDepts([...expandedInviteDepts, id]);
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
                                const newDepts = [...userData.departmentIds, id];
                                subgroups.forEach(s => {
                                  if (!newDepts.includes(s._id || s.id)) {
                                    newDepts.push(s._id || s.id);
                                  }
                                });
                                setUserData({...userData, departmentIds: newDepts});
                                if (!isExpanded && hasSubgroups) {
                                  setExpandedInviteDepts([...expandedInviteDepts, id]);
                                }
                              } else {
                                const subgroupIDs = subgroups.map(s => s._id || s.id);
                                setUserData({...userData, departmentIds: userData.departmentIds.filter(did => did !== id && !subgroupIDs.includes(did))});
                              }
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium">{dept.name}</span>
                        </label>
                      </div>
                      
                      {hasSubgroups && isExpanded && (
                        <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-100 dark:border-slate-700 pl-2">
                          {subgroups.map(sub => {
                            const subId = sub._id || sub.id;
                            const isSubChecked = userData.departmentIds.includes(subId);
                            return (
                              <label key={subId} className="flex items-center gap-2 p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={isSubChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      const newDepts = [...userData.departmentIds, subId];
                                      if (!newDepts.includes(id)) {
                                        newDepts.push(id);
                                      }
                                      setUserData({...userData, departmentIds: newDepts});
                                    } else {
                                      setUserData({...userData, departmentIds: userData.departmentIds.filter(did => did !== subId)});
                                    }
                                  }}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
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
                {departments.filter(d => !d.parentId).length === 0 && <p className="text-sm text-slate-500 p-2">No hay grupos creados</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 rounded-lg font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-brand-gradient text-white rounded-lg font-medium hover:bg-brand-gradient-hover">Invitar</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {showEnrollmentModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Enrolamiento Masivo</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Genera un enlace mágico para que múltiples usuarios se registren automáticamente en la organización con un rol específico.</p>
            
            <form onSubmit={handleGenerateEnrollmentLink}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Seleccionar Rol</label>
                <select 
                  value={enrollmentRole}
                  onChange={e => {
                    setEnrollmentRole(e.target.value);
                    setGeneratedLink('');
                  }}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800"
                >
                  <option value="usuario">Usuario</option>
                  <option value="editor">Editor</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tiempo de Vigencia</label>
                <select 
                  value={expiresInHours}
                  onChange={e => {
                    setExpiresInHours(e.target.value);
                    setGeneratedLink('');
                  }}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800"
                >
                  <option value="1">1 hora</option>
                  <option value="24">24 horas</option>
                  <option value="72">3 días</option>
                  <option value="168">7 días</option>
                  <option value="720">30 días</option>
                </select>
              </div>
              
              {generatedLink ? (
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Enlace Generado</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-600 dark:text-slate-400 text-sm outline-none"
                    />
                    <button 
                      type="button"
                      onClick={() => navigator.clipboard.writeText(generatedLink)}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      Copiar
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Copia y comparte este enlace. Quien ingrese podrá unirse a la organización como {enrollmentRole}.</p>
                </div>
              ) : (
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowEnrollmentModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 rounded-lg font-medium transition-colors">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-brand-gradient text-white rounded-lg font-medium hover:bg-brand-gradient-hover transition-colors">Generar Enlace</button>
                </div>
              )}
              
              {generatedLink && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => { setShowEnrollmentModal(false); setGeneratedLink(''); }} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 rounded-lg font-medium transition-colors">Cerrar</button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {editUser && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Editar Usuario</h3>
            <div className="mb-4">
              <p className="font-medium text-slate-800 dark:text-slate-100">{editUser.name}</p>
              <p className="text-sm text-slate-500">{editUser.email}</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Grupos de Trabajo</label>
              <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-2 space-y-2">
                {departments.filter(d => !d.parentId).map((dept: any) => {
                  const id = dept._id || dept.id;
                  const isChecked = editUserDepts.includes(id);
                  const subgroups = departments.filter(d => d.parentId === id);
                  const hasSubgroups = subgroups.length > 0;
                  const isExpanded = expandedEditDepts.includes(id);
                  
                  return (
                    <div key={id} className="flex flex-col">
                      <div className="flex items-center gap-2 p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded">
                        {hasSubgroups ? (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              if (isExpanded) {
                                setExpandedEditDepts(expandedEditDepts.filter(eid => eid !== id));
                              } else {
                                setExpandedEditDepts([...expandedEditDepts, id]);
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
                                const newDepts = [...editUserDepts, id];
                                subgroups.forEach(s => {
                                  if (!newDepts.includes(s._id || s.id)) {
                                    newDepts.push(s._id || s.id);
                                  }
                                });
                                setEditUserDepts(newDepts);
                                if (!isExpanded && hasSubgroups) {
                                  setExpandedEditDepts([...expandedEditDepts, id]);
                                }
                              } else {
                                const subgroupIDs = subgroups.map(s => s._id || s.id);
                                setEditUserDepts(editUserDepts.filter(did => did !== id && !subgroupIDs.includes(did)));
                              }
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium">{dept.name}</span>
                        </label>
                      </div>
                      
                      {hasSubgroups && isExpanded && (
                        <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-100 dark:border-slate-700 pl-2">
                          {subgroups.map(sub => {
                            const subId = sub._id || sub.id;
                            const isSubChecked = editUserDepts.includes(subId);
                            return (
                              <label key={subId} className="flex items-center gap-2 p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={isSubChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      const newDepts = [...editUserDepts, subId];
                                      if (!newDepts.includes(id)) {
                                        newDepts.push(id);
                                      }
                                      setEditUserDepts(newDepts);
                                    } else {
                                      setEditUserDepts(editUserDepts.filter(did => did !== subId));
                                    }
                                  }}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
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
                {departments.filter(d => !d.parentId).length === 0 && <p className="text-sm text-slate-500 p-2">No hay grupos creados</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setEditUser(null)} 
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  try {
                    await apiFetch(`/api/users/org/${org.id}/${editUser._id || editUser.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ departmentIds: editUserDepts })
                    });
                    setEditUser(null);
                    reloadData();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Department Details Modal */}
      {showDeptDetails && selectedDept && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-2">{selectedDept.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{selectedDept.description || 'Sin descripción'}</p>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => {
                  setDeptUsersFilter(selectedDept._id || selectedDept.id);
                  setShowDeptDetails(false);
                  setActiveTab('users');
                }}
                className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all flex items-center justify-between group"
              >
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">Ver Usuarios</h4>
                  <p className="text-sm text-slate-500">Administrar usuarios de este grupo</p>
                </div>
                <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowDeptDetails(false);
                  setDeptData({ name: '', description: '', parentId: selectedDept._id || selectedDept.id });
                  setShowDeptModal(true);
                }}
                className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all flex items-center justify-between group"
              >
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">Crear Subgrupo</h4>
                  <p className="text-sm text-slate-500">Crear una división dentro de este grupo</p>
                </div>
                <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </div>
              </button>
            </div>
            
            <div className="flex justify-between items-center mt-6">
              <button 
                type="button" 
                onClick={() => setDeptToDelete(selectedDept)} 
                className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg font-medium transition-colors"
              >
                Eliminar Grupo
              </button>
              <button type="button" onClick={() => setShowDeptDetails(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 rounded-lg font-medium transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}


      {/* Subgroups Modal */}
      {showSubgroupsModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Subgrupos</h3>
              <button onClick={() => setShowSubgroupsModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {subgroupsList.map((dept: any) => {
                  const subSubgroups = departments.filter(d => d.parentId === (dept._id || dept.id));
                  return (
                    <div 
                      key={dept.id || dept._id} 
                      className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 relative flex flex-col justify-between"
                    >
                      <div 
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedDept(dept);
                          setShowDeptDetails(true);
                        }}
                      >
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">{dept.name}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{dept.description || 'Sin descripción'}</p>
                      </div>
                      
                      {subSubgroups.length > 0 && (
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSubgroupsList(subSubgroups);
                            }}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Ver {subSubgroups.length} sub-subgrupos
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
