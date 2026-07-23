import 'react-quill-new/dist/quill.snow.css';
import { io } from 'socket.io-client';
import { apiFetch } from '../lib/api';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Mic, X, Check, Send, FileText, AlertCircle, BarChart3, User, ShieldAlert, ArrowLeft, Lock, ThumbsUp, ThumbsDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { UserPopover } from '../components/UserPopover';
import { useOrg } from '../context/OrgContext';

const AudioPlayer = ({ onEnded }: { onEnded: () => void }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const updateProgress = () => {
      setProgress((audio.currentTime / (audio.duration || 1)) * 100);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
      onEnded();
    };
    
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onEnded]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleSpeed = () => {
    const nextSpeed = speed === 1 ? 1.5 : 1;
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  return (
    <div className="flex items-center gap-3 w-64 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
       <button onClick={togglePlay} className="w-8 h-8 bg-brand-gradient text-white rounded-full flex items-center justify-center shrink-0">
         {isPlaying ? '⏸' : '▶'}
       </button>
       <div className="flex-1 flex flex-col justify-center">
         <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full w-full overflow-hidden">
           <div className="bg-brand-gradient h-full transition-all duration-100" style={{ width: `${progress}%` }}></div>
         </div>
       </div>
       <button onClick={toggleSpeed} className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full shrink-0 hover:bg-slate-300">
         {speed}x
       </button>
       <audio
         ref={audioRef}
         src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
         className="hidden"
       />
    </div>
  );
};
export function ProjectView() {
  const { orgUrl, projectId } = useParams();
  const navigate = useNavigate();
  const { org, currentUser, currentRole } = useOrg();
  const [project, setProject] = useState<any>(null);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);


  const [votesCount, setVotesCount] = useState<any>({ 'A Favor': 0, 'En Contra': 0, 'Abstención': 0 });
  const [newMsg, setNewMsg] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'debate' | 'voting'>('debate');
  const [isResumenModalOpen, setIsResumenModalOpen] = useState(false);

  const [isBlockchainModalOpen, setIsBlockchainModalOpen] = useState(false);
  const [blockchainLogs, setBlockchainLogs] = useState<any[]>([]);

  const fetchBlockchainAudit = async () => {
    try {
      const res = await apiFetch(`/api/blockchain/audit/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setBlockchainLogs(data);
        setIsBlockchainModalOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [readMessageIds, setReadMessageIds] = useState<Set<string>>(new Set());
  const handleMarkAsRead = (id: string) => { setReadMessageIds(prev => new Set(prev).add(id)); };

  const messagesEndRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    apiFetch(`/api/projects/detail/${projectId}`)
      .then(r => {
        if (!r.ok) {
          return r.json().then(err => { throw new Error(err.error || 'Error loading project') });
        }
        return r.json();
      })
      .then(setProject)
      .catch(err => setErrorMsg(err.message));
      
    apiFetch(`/api/discussions/${projectId}`)
      .then(r => r.json())
      .then(setDiscussions);
      
    apiFetch(`/api/votes/${projectId}`)
      .then(r => r.json())
      .then((votes: any[]) => {
        const counts: any = { 'A Favor': 0, 'En Contra': 0, 'Abstención': 0, _voters: [] };
        let myVote = null;
        votes.forEach(v => {
          if (counts[v.option] !== undefined) counts[v.option]++;
          if (currentUser && (v.userId === currentUser.id || v.userId?._id === currentUser.id)) myVote = v.option;
          counts._voters.push(v.userId?.name || 'Usuario desconocido');
        });
        setVotesCount(counts);
        setUserVote(myVote);
      });
      
    const socket = io();
    socket.emit('join_project', projectId);
    if (currentUser) {
      socket.emit('join_user', currentUser.id);
    }
    
    socket.on('new_message', (msg) => {
      setDiscussions(prev => [...prev, msg]);
    });
    
    socket.on('update_reaction', (data) => {
      setDiscussions(prev => prev.map(d => 
        (d._id === data.discussionId || d.id === data.discussionId) ? { ...d, likes: data.likes, dislikes: data.dislikes } : d
      ));
    });
    
    socket.on('duplicate_warning', (data) => {
      alert(`⚠️ ADVERTENCIA: ${data.message}`);
    });
    
    return () => {
      socket.disconnect();
    };
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [discussions]);

  const [currentStatus, setCurrentStatus] = useState<string>('debate');
  const [hasNotified, setHasNotified] = useState(false);
  const [showClosedModal, setShowClosedModal] = useState(false);
  const prevStatusRef = useRef(currentStatus);

  useEffect(() => {
    if (prevStatusRef.current === 'votacion' && currentStatus === 'cerrado') {
      setShowClosedModal(true);
    }
    prevStatusRef.current = currentStatus;
  }, [currentStatus]);

  useEffect(() => {
    if (currentStatus === 'votacion' && !hasNotified) {
      try {
        if (window.Notification && Notification.permission === 'granted') {
           new Notification('Debate finalizado', { body: 'El tiempo de debate ha concluido. Ya puedes votar.' });
        } else if (window.Notification && Notification.permission !== 'denied') {
           Notification.requestPermission().then(permission => {
             if (permission === 'granted') {
               new Notification('Debate finalizado', { body: 'El tiempo de debate ha concluido. Ya puedes votar.' });
             } else {
               alert('Notificación Push: El tiempo de debate ha concluido. Ya puedes votar.');
             }
           }).catch(() => {
             alert('Notificación Push: El tiempo de debate ha concluido. Ya puedes votar.');
           });
        } else {
           alert('Notificación Push: El tiempo de debate ha concluido. Ya puedes votar.');
        }
      } catch (e) {
        alert('Notificación Push: El tiempo de debate ha concluido. Ya puedes votar.');
      }
      setHasNotified(true);
    }
  }, [currentStatus, hasNotified]);

  useEffect(() => {
    if (!project) return;
    
    const updateStatus = () => {
      const now = new Date();
      const debateTime = project.debateClosingTime ? new Date(project.debateClosingTime) : null;
      const votingTime = project.votingClosingTime ? new Date(project.votingClosingTime) : null;
      
      let computedStatus = 'debate';
      if (project.debateStartTime && now < new Date(project.debateStartTime)) {
        computedStatus = 'programado';
      } else if (votingTime && now > votingTime) {
        computedStatus = 'cerrado';
      } else if (debateTime && now > debateTime) {
        computedStatus = 'votacion';
      } else if (project.status) {
        computedStatus = project.status;
      }
      setCurrentStatus(computedStatus);
    };
    
    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    
    return () => clearInterval(interval);
  }, [project]);

  const handleReaction = async (discussionId: string, type: 'like' | 'dislike') => {
    if (!currentUser) return;
    try {
      const userId = currentUser.id || currentUser._id;
      const res = await apiFetch(`/api/discussions/${discussionId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type })
      });
      const data = await res.json();
      if (data.success) {
        setDiscussions(prev => prev.map(d => {
          if ((d.id || d._id) === discussionId) {
            return { ...d, likes: data.likes, dislikes: data.dislikes };
          }
          return d;
        }));
      }
    } catch (e) {
      console.error('Error al reaccionar:', e);
    }
  };

  const handleSendText = () => {
    if (!newMsg.trim() || !currentUser) return;
    
    if (project?.maxChars && newMsg.length > project.maxChars) {
      setErrorMsg(`El texto excede el máximo permitido de ${project.maxChars} caracteres.`);
      return;
    }

    if (project?.restrictBannedWords && org?.settings?.bannedWords && org.settings.bannedWords.length > 0) {
      const lowerMsg = newMsg.toLowerCase();
      const foundBanned = org.settings.bannedWords.some((word: string) => lowerMsg.includes(word.toLowerCase()));
      if (foundBanned) {
        setErrorMsg('El mensaje contiene palabras no permitidas.');
        return;
      }
    }

    const msg = {
      projectId,
      userId: currentUser.id,
      content: newMsg,
      type: 'text'
    };
    apiFetch('/api/discussions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    })
      .then(async r => {
        if (!r.ok) {
          const e = await r.json();
          setErrorMsg(e.error || 'Error al enviar');
          return null;
        }
        return r.json();
      })
      .then(data => {
        if (data) {
          setDiscussions(prev => [...prev, data]);
          setNewMsg('');
          setErrorMsg('');
        }
      });
  };

  const handleAudioRecord = async () => {
    if (!currentUser) return;
    if (isRecording) {
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.webm');
          
          try {
            const uploadRes = await fetch('/api/upload', {
              method: 'POST',
              body: formData
            });
            if (!uploadRes.ok) throw new Error('Error subiendo audio');
            const uploadData = await uploadRes.json();
            
            const msg = {
              projectId,
              userId: currentUser.id,
              content: uploadData.url,
              type: 'audio'
            };
            
            const r = await apiFetch('/api/discussions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(msg)
            });
            
            if (!r.ok) {
              const e = await r.json();
              setErrorMsg(e.error || 'Error al enviar');
            } else {
              setErrorMsg('');
            }
          } catch (err: any) {
            setErrorMsg(err.message || 'Error processing audio');
          }
          
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        setIsRecording(true);
        setErrorMsg('');
        
        // Max audio limit from org settings
        const limitMs = (org?.settings?.audioLimit || 30) * 1000;
        recordingTimerRef.current = setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
          }
        }, limitMs);
      } catch (err) {
        console.error("Microphone error", err);
        setErrorMsg('Error accediendo al micrófono');
      }
    }
  };

  const handleVote = (option: string) => {
    if (!currentUser || userVote) return;
    apiFetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, userId: currentUser.id, option })
    }).then(r => {
      if(r.ok) {
        setUserVote(option);
        setVotesCount((prev: any) => ({ ...prev, [option]: prev[option] + 1 }));
        alert('Voto registrado de forma segura y permanente en la Blockchain.');
      } else {
        alert('Ya has votado.');
      }
    });
  };

  if (errorMsg && !project) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Acceso Denegado o Proyecto no encontrado</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">{errorMsg}</p>
        <Link to={`/${orgUrl}`} className="bg-brand-gradient text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-gradient-hover">
          Volver al Inicio
        </Link>
      </div>
    );
  }


  const isInvited = useMemo(() => {
    if (!currentUser || !project) return false;
    const cid = currentUser.id || currentUser._id;
    return project.invitedUsers?.some((u: any) => (u._id || u.id || u) === cid);
  }, [currentUser, project]);

  if (!project) return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 items-center justify-center">
      <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-3xl mb-6 shadow-lg animate-pulse" style={{ backgroundColor: org?.styles?.primaryColor || '#1d4ed8' }}>
        {org?.name?.charAt(0) || 'A'}
      </div>
      <div className="text-slate-500 dark:text-slate-400 font-medium animate-pulse text-lg tracking-wide">Cargando proyecto...</div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden" style={{ '--org-color': org?.styles?.primaryColor || '#1d4ed8' } as any}>
      
      <div className="h-12 flex items-center px-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <Link to={`/${orgUrl}`} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 transition-colors text-sm font-semibold">
          <ArrowLeft size={16} />
          Volver a {org?.name || 'Proyectos'}
        </Link>
      </div>


      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Info */}
        <div className="w-96 glass-panel flex flex-col relative z-10">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded text-xs font-semibold tracking-wider uppercase">
                ID: {project.id}
              </span>
              <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-semibold tracking-wider uppercase">
                {currentStatus === 'Terminado para republicar' ? 'Terminado para republicar' : currentStatus === 'debate' ? 'En Debate' : currentStatus === 'votacion' ? 'En Votación' : currentStatus === 'programado' ? 'Programado' : 'Cerrado'}
              </span>
              {project.republishedFromId && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold tracking-wider uppercase">
                  Republicado
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">{project.title}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Publicado {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true, locale: es })}
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            {project.content && (
              <div className="mb-6">
                <button
                  onClick={() => setIsResumenModalOpen(true)}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 px-6 rounded-xl transition-colors flex items-center gap-2 border border-slate-300 dark:border-slate-600"
                >
                  <FileText size={18} />
                  Ver Documento (Resumen)
                </button>
                {(currentRole === 'administrador' || currentRole === 'admin' || (project.createdBy && (project.createdBy === currentUser?.id || project.createdBy?._id === currentUser?.id))) && (
                  <button
                    onClick={() => navigate('/' + orgUrl + '/new', { state: { republishData: project } })}
                    className="mt-2 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 border border-purple-300 dark:border-purple-600 w-full"
                  >
                    Republicar
                  </button>
                )}
              </div>
            )}

            <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
              <AlertCircle size={18} className="text-emerald-600" />
              Reglas del Debate
            </h3>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2 list-disc pl-4 mb-6">
              <li>Máximo {project.maxChars || 500} caracteres por intervención de texto.</li>
              <li>Audios limitados a {project.maxAudioTime || 60} segundos.</li>
              <li>Cada usuario solo puede intervenir 1 vez (audio o texto).</li>
              {project.debateClosingTime && (
                <li>El debate se cerrará el: {new Date(project.debateClosingTime).toLocaleString('es-ES')}</li>
              )}
              {project.votingClosingTime && (
                <li>La votación cerrará el: {new Date(project.votingClosingTime).toLocaleString('es-ES')}</li>
              )}
            </ul>
            {project.pdfName && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="text-blue-600" size={20} />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{project.pdfName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Documento adjunto</p>
                  </div>
                </div>
                {project.pdfUrl && (
                  <a href={project.pdfUrl} download={project.pdfName} className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900 shadow-sm">
                    Descargar
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 overflow-hidden shadow-2xl relative">
          <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6 h-full">
              <button 
                onClick={() => setActiveTab('debate')}
                className={cn("h-full px-2 border-b-2 font-bold text-sm tracking-wide transition-colors", activeTab === 'debate' ? "text-slate-900 dark:text-white border-current" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white")}
                style={{ color: activeTab === 'debate' ? 'var(--org-color)' : undefined }}
              >
                Foro de Discusión
              </button>
              <button 
                onClick={() => setActiveTab('voting')}
                className={cn("h-full px-2 border-b-2 font-bold text-sm tracking-wide transition-colors", activeTab === 'voting' ? "text-slate-900 dark:text-white border-current" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white")}
                style={{ color: activeTab === 'voting' ? 'var(--org-color)' : undefined }}
              >
                Panel de Votación
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              {(currentRole === 'administrador' || currentRole === 'admin' || (currentRole === 'editor' && currentUser?.id === project.createdBy)) && currentStatus === 'debate' && (
                <button 
                  onClick={() => {
                    /* Placeholder para cerrar debate anticipadamente */
                  }}
                  className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-900 transition-colors"
                >
                  CERRAR DEBATE
                </button>
              )}
            </div>
          </div>

          {activeTab === 'debate' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {discussions.map((msg, idx) => {
                  const isSelf = currentUser && (msg.userId === currentUser.id || msg.userId?._id === currentUser.id || msg.user?.id === currentUser.id || msg.user?._id === currentUser.id); 
                  const isRead = readMessageIds.has(msg.id || msg._id || String(idx));
                  const msgId = msg.id || msg._id || String(idx);
                  return (
                    <div key={msgId} className={cn("flex flex-col", isSelf ? "items-end" : "items-start")}>
                      <div className={cn("flex items-center gap-2 mb-1", isSelf ? "justify-end mr-1" : "justify-start ml-1")}>
                        {!isSelf && (
                          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                            {msg.user?.avatarUrl ? (
                              <img src={msg.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              (msg.user?.name || 'C').charAt(0).toUpperCase()
                            )}
                          </div>
                        )}
                        <div className={cn("text-[10px] font-bold", isSelf ? "text-blue-600" : "text-slate-500 dark:text-slate-400")}>
                          {isSelf ? `TÚ (${currentUser?.name})` : (msg.user?.name || 'Usuario Invitado')}
                        </div>
                        {isSelf && (
                          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0 border border-slate-300 dark:border-slate-600">
                            {currentUser?.avatarUrl ? (
                              <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              (currentUser?.name || 'T').charAt(0).toUpperCase()
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className={cn(
                        "p-3 text-sm max-w-[85%] relative group shadow-sm flex flex-col gap-2", 
                        isSelf ? "bg-brand-gradient text-white voice-bubble" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl rounded-tl-none",
                        msg.type === 'audio' && isSelf ? "min-w-[200px]" : ""
                      )}>
                        {msg.type === 'text' ? (
                          <div>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            {!isSelf && currentStatus !== 'cerrado' && (
                              <div className="mt-2 flex items-center gap-2 border-t border-slate-200 dark:border-slate-700 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300">
                                  <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", isRead ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800")}>
                                    {isRead && <Check size={14} />}
                                  </div>
                                  <input type="checkbox" className="hidden" checked={isRead} onChange={() => handleMarkAsRead(msgId)} />
                                  He leído este mensaje
                                </label>
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            {isSelf ? (
                              <div className="flex items-center gap-3">
                                <button className="w-8 h-8 bg-white dark:bg-slate-800/20 rounded-full flex items-center justify-center shrink-0">
                                  ▶
                                </button>
                                <div className="flex flex-col flex-1">
                                  <div className="h-1 bg-white dark:bg-slate-800/30 rounded-full w-full overflow-hidden">
                                    <div className="bg-white dark:bg-slate-800 h-full w-1/3"></div>
                                  </div>
                                  <span className="text-[9px] mt-1 opacity-80 uppercase tracking-widest font-bold">Audio</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <AudioPlayer onEnded={() => handleMarkAsRead(msgId)} />
                                {currentStatus !== 'cerrado' && (
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                    <div className={cn("w-3 h-3 rounded-full flex items-center justify-center", isRead ? "bg-emerald-500 text-white" : "bg-slate-300 text-transparent")}>
                                      <Check size={8} />
                                    </div>
                                    {isRead ? "Escuchado hasta el final" : "Debes escucharlo para votar"}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* Moderation Tool (Admin only) */}
                        {!isSelf && (
                          <button className="absolute -right-10 top-2 text-[10px] text-red-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity" title="Banear Usuario">
                            BANEAR
                          </button>
                        )}
                      </div>
                      
                      {/* Reactions */}
                      <div className={"flex items-center gap-2 mt-1 " + (isSelf ? "justify-end mr-1" : "justify-start ml-1")}>
                        <button 
                          onClick={() => currentStatus === 'debate' && handleReaction(msgId, 'like')}
                          disabled={currentStatus !== 'debate'}
                          className={"flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors " + (msg.likes?.some((id: string) => id === currentUser?.id || id === currentUser?._id) ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200") + (currentStatus !== 'debate' ? " opacity-50 cursor-not-allowed" : " cursor-pointer")}
                        >
                          <ThumbsUp size={10} /> {msg.likes?.length || 0}
                        </button>
                        <button 
                          onClick={() => currentStatus === 'debate' && handleReaction(msgId, 'dislike')}
                          disabled={currentStatus !== 'debate'}
                          className={"flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors " + (msg.dislikes?.some((id: string) => id === currentUser?.id || id === currentUser?._id) ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200") + (currentStatus !== 'debate' ? " opacity-50 cursor-not-allowed" : " cursor-pointer")}
                        >
                          <ThumbsDown size={10} /> {msg.dislikes?.length || 0}
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800">
                {errorMsg && (
                  <div className="mb-2 p-2 bg-red-50 text-red-600 text-xs font-bold rounded flex items-center gap-2">
                    <ShieldAlert size={14} />
                    {errorMsg}
                  </div>
                )}
                
                {currentStatus === 'programado' ? (
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-center rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700">
                    El debate aún no ha comenzado.
                  </div>
                ) : currentStatus !== 'debate' ? (
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-center rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700">
                    El periodo de debate ha finalizado. Los aportes están cerrados.
                  </div>
                ) : !isInvited ? (
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-center rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700">
                    No tienes permisos para participar en este debate.
                  </div>
                ) : (

                <>
                <div className="relative flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 shadow-sm">
                  <input
                    type="text"
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value.slice(0, project?.maxChars || 500))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSendText();
                    }}
                    placeholder="Escribe tu aporte legislativo..."
                    className="bg-transparent border-none focus:outline-none text-sm flex-1 text-slate-700 dark:text-slate-300"
                  />
                  <button 
                    onClick={handleAudioRecord}
                    className={cn("text-blue-600 hover:text-blue-800 transition-colors", isRecording && "text-red-500 animate-pulse")}
                  >
                    <Mic size={20} />
                  </button>
                  <button 
                    onClick={handleSendText}
                    disabled={!newMsg.trim()}
                    className="bg-brand-gradient text-white w-8 h-8 rounded-full flex items-center justify-center font-bold disabled:opacity-50"
                  >
                    ↑
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between px-2">
                  <span className="text-[9px] text-slate-400 font-bold">Carácteres: {newMsg.length} / {project?.maxChars || 500}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest italic">Voz encriptada mediante SSL</span>
                </div>
                </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'voting' && (
            <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
              <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="text-center mb-10">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 blockchain-badge">
                    <BarChart3 size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Votación Ciudadana Segura</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Los votos emitidos son registrados de forma anónima e inmutable. 
                    <br/>(Verificación de unicidad por huella de dispositivo e IP activada).
                  </p>
                </div>

                {(() => {
                  
                  if (currentStatus === 'programado') {
                    return (
                      <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl text-center">
                        <h3 className="text-slate-600 dark:text-slate-400 font-semibold mb-2 text-sm uppercase tracking-widest">Proyecto Programado</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                          El debate aún no ha comenzado.
                        </p>
                      </div>
                    );
                  }
                  if (currentStatus === 'debate') {

                    return (
                      <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-center">
                        <h3 className="text-amber-800 font-semibold mb-2 text-sm uppercase tracking-widest">Votación aún no habilitada</h3>
                        <p className="text-amber-700 text-xs font-medium">
                          El periodo de debate sigue activo. La votación se abrirá al finalizar el debate.
                        </p>
                      </div>
                    );
                  }

                  if (currentStatus === 'cerrado') {
                    const totalInterventions = discussions.length;
                    const textInterventions = discussions.filter(d => d.type === 'text').length;
                    const audioInterventions = discussions.filter(d => d.type === 'audio').length;
                    
                    const discussionsWithReactions = discussions.map(d => ({
                      ...d,
                      totalReactions: (d.likes?.length || 0) + (d.dislikes?.length || 0),
                      likeCount: d.likes?.length || 0,
                      dislikeCount: d.dislikes?.length || 0
                    })).filter(d => d.totalReactions > 0);
                    
                    const mostReactions = [...discussionsWithReactions].sort((a, b) => b.totalReactions - a.totalReactions)[0];
                    const mostLikes = [...discussionsWithReactions].sort((a, b) => b.likeCount - a.likeCount)[0];
                    const mostDislikes = [...discussionsWithReactions].sort((a, b) => b.dislikeCount - a.dislikeCount)[0];

                    return (
                      <div className="space-y-4">
                        <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Resumen del Debate</h3>
                          <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                              <div className="text-2xl font-bold text-slate-800 dark:text-white">{totalInterventions}</div>
                              <div className="text-xs text-slate-500 font-semibold uppercase">Intervenciones</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                              <div className="text-2xl font-bold text-slate-800 dark:text-white">{textInterventions}</div>
                              <div className="text-xs text-slate-500 font-semibold uppercase">Escritos</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                              <div className="text-2xl font-bold text-slate-800 dark:text-white">{audioInterventions}</div>
                              <div className="text-xs text-slate-500 font-semibold uppercase">Audios</div>
                            </div>
                          </div>
                          
                          {discussionsWithReactions.length > 0 && (
                            <div className="space-y-3 text-sm">
                              {mostReactions && (
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <span className="text-slate-600 dark:text-slate-400">Más reacciones ({mostReactions.totalReactions}):</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{mostReactions.user?.name || 'Usuario'}</span>
                                </div>
                              )}
                              {mostLikes && mostLikes.likeCount > 0 && (
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <span className="text-slate-600 dark:text-slate-400">Más apoyado (👍 {mostLikes.likeCount}):</span>
                                  <span className="font-bold text-emerald-600">{mostLikes.user?.name || 'Usuario'}</span>
                                </div>
                              )}
                              {mostDislikes && mostDislikes.dislikeCount > 0 && (
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <span className="text-slate-600 dark:text-slate-400">Menos apoyado (👎 {mostDislikes.dislikeCount}):</span>
                                  <span className="font-bold text-red-600">{mostDislikes.user?.name || 'Usuario'}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Resultados Finales de Votación</h3>
                        {currentRole !== 'usuario' && (
                          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Registro de Participación (Admin)</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Lista de usuarios que han emitido su voto. Por privacidad, no se muestra la opción elegida.</p>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                              {votesCount._voters?.map((voter: string, i: number) => (
                                <div key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                  <User size={14} className="text-slate-400" />
                                  {voter}
                                </div>
                              ))}
                              {!votesCount._voters?.length && <div className="text-sm text-slate-500 dark:text-slate-400 italic">Nadie ha votado aún.</div>}
                            </div>
                          </div>
                        )}
                        {['A Favor', 'En Contra', 'Abstención'].map(opt => {
                          const totalVotes = (votesCount['A Favor'] || 0) + (votesCount['En Contra'] || 0) + (votesCount['Abstención'] || 0);
                          const count = votesCount[opt] || 0;
                          const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                          const colorClass = opt === 'A Favor' ? 'bg-emerald-500' : opt === 'En Contra' ? 'bg-red-500' : 'bg-slate-500';
                          const bgClass = opt === 'A Favor' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : opt === 'En Contra' ? 'bg-red-50 text-red-900 border-red-200' : 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700';
                          
                          return (
                            <div key={opt} className={`p-4 border-2 rounded-xl relative overflow-hidden ${userVote === opt ? bgClass + ' ring-2 ring-blue-500' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                              <div className={`absolute top-0 left-0 bottom-0 ${colorClass} opacity-10`} style={{ width: `${percentage}%` }}></div>
                              <div className="relative flex justify-between items-center z-10">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-lg">{opt}</span>
                                  {userVote === opt && <span className="text-[10px] uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Tu Voto</span>}
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-xl block">{percentage}%</span>
                                  <span className="text-xs opacity-70">{count} votos</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  // currentStatus === 'votacion'
                  if (userVote) {
                    return (
                      <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-xl text-center">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Check size={32} />
                        </div>
                        <h3 className="text-emerald-800 font-bold text-lg mb-2">¡Voto Registrado Exitosamente!</h3>
                        <p className="text-emerald-700 text-sm">
                          Has emitido tu voto de forma segura. Los resultados se mostrarán públicamente cuando finalice el periodo de votación.
                        </p>
                      </div>
                    );
                  }

                  const otherDiscussions = discussions.filter(d => !currentUser || (d.userId !== currentUser.id && d.userId?._id !== currentUser.id && d.user?.id !== currentUser.id && d.user?._id !== currentUser.id));
                  const readCount = otherDiscussions.filter(d => readMessageIds.has(d.id || d._id)).length;
                  const canVote = otherDiscussions.length === readCount;


                  if (!isInvited) {
                    return (
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-8 rounded-xl text-center">
                        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertCircle size={32} />
                        </div>
                        <h3 className="text-slate-800 dark:text-slate-100 font-bold text-lg mb-2">Acceso Denegado</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                          No tienes permisos para votar en este proyecto.
                        </p>
                      </div>
                    );
                  }

                  if (!canVote) {
                    return (
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-8 rounded-xl text-center">
                        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertCircle size={32} />
                        </div>
                        <h3 className="text-slate-800 dark:text-slate-100 font-bold text-lg mb-2">Requisito Incompleto</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                          Para poder emitir tu voto, es obligatorio revisar todo el foro de discusión. Debes marcar como leídos todos los mensajes de texto y escuchar todos los audios hasta el final.
                        </p>
                        <div className="inline-block bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                          Progreso: {readCount} / {otherDiscussions.length}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <h3 className="text-center font-bold text-slate-800 dark:text-slate-100 mb-6">Emite tu voto ahora:</h3>
                      <button onClick={() => handleVote('A Favor')} className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-lg hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-all text-left flex justify-between items-center group">
                        A Favor
                        <ArrowLeft className="opacity-0 group-hover:opacity-100 rotate-180 transition-all" size={20} />
                      </button>
                      <button onClick={() => handleVote('En Contra')} className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-lg hover:border-red-500 hover:bg-red-50 hover:text-red-700 transition-all text-left flex justify-between items-center group">
                        En Contra
                        <ArrowLeft className="opacity-0 group-hover:opacity-100 rotate-180 transition-all" size={20} />
                      </button>
                      <button onClick={() => handleVote('Abstención')} className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-lg hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900 hover:text-slate-700 dark:text-slate-300 transition-all text-left flex justify-between items-center group">
                        Abstención
                        <ArrowLeft className="opacity-0 group-hover:opacity-100 rotate-180 transition-all" size={20} />
                      </button>
                    </div>
                  );
                })()}
                {(currentRole === 'administrador' || currentRole === 'admin') && (
                  <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-center">
                    <button onClick={fetchBlockchainAudit} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold transition-colors">
                      <Lock size={16} /> Ver Auditoría Blockchain
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      
  
      {isResumenModalOpen && project && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="text-blue-600" />
                Documento del Proyecto
              </h2>
              <button onClick={() => setIsResumenModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div 
                className="ql-editor prose max-w-none break-words"
                dangerouslySetInnerHTML={{ __html: project.content }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Blockchain Audit Modal */}
      {isBlockchainModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">Auditoría Blockchain</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Registro inmutable de transacciones</p>
                </div>
              </div>
              <button onClick={() => setIsBlockchainModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-900">
              <div className="space-y-4">
                {blockchainLogs.length === 0 ? (
                  <div className="text-center text-slate-500 py-8">No hay registros en la blockchain para este proyecto aún.</div>
                ) : (
                  blockchainLogs.map((block, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 font-mono text-sm shadow-sm">
                      <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                        <span className="font-bold text-blue-600 dark:text-blue-400">Bloque #{block.index}</span>
                        <span className="text-slate-400 text-xs">{new Date(block.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="space-y-2 text-xs overflow-x-auto">
                        <div className="flex gap-4">
                          <span className="text-slate-500 min-w-[80px]">Hash:</span>
                          <span className="text-slate-800 dark:text-slate-300 font-semibold truncate">{block.hash}</span>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-slate-500 min-w-[80px]">Prev Hash:</span>
                          <span className="text-slate-500 dark:text-slate-400 truncate">{block.previousHash}</span>
                        </div>
                        <div className="flex gap-4 mt-2 pt-2 border-t border-slate-50 dark:border-slate-700">
                          <span className="text-slate-500 min-w-[80px]">Data:</span>
                          <pre className="text-green-600 dark:text-green-400 m-0">{JSON.stringify(block.data, null, 2)}</pre>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showClosedModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} />
              </div>
              <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-2">¡Votación Finalizada!</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                El proceso de votación ha concluido. Para ver los resultados finales del proyecto, por favor actualiza la página o vuelve a entrar.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-[var(--org-color)] text-white font-bold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity"
              >
                Ver Resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
