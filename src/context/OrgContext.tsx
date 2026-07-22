import { apiFetch } from '../lib/api';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface OrgContextType {
  org: any;
  currentUser: any;
  currentRole: string;
  projects: any[];
  users: any[];
  departments: any[];
  loading: boolean;
  error: string | null;
  reloadData: () => void;
  updateOrgUrl: (newUrl: string) => Promise<boolean>;
  updateOrg: (data: any) => Promise<boolean>;
  updateUser: (data: any) => Promise<boolean>;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { orgUrl } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<string>('');
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadData = () => {
    if (!org) return;
    apiFetch(`/api/projects/${org.id}`).then(r => r.json()).then(p => setProjects(p));
    apiFetch(`/api/users/org/${org.id}`).then(r => r.json()).then(u => setUsers(u));
    apiFetch(`/api/departments/${org.id}`).then(r => r.json()).then(d => setDepartments(d));
  };

  const updateOrg = async (data: any) => {
    if (!org) return false;
    try {
      const res = await apiFetch(`/api/organizations/${org.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setOrg(await res.json());
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const updateUser = async (data: any) => {
    if (!currentUser) return false;
    try {
      const res = await apiFetch(`/api/users/${currentUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setCurrentUser(await res.json());
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const updateOrgUrl = async (newUrl: string) => {
    if (!org) return false;
    try {
      const res = await apiFetch(`/api/organizations/${org.id}/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customUrl: newUrl.toLowerCase().replace(/[^a-z0-9]/g, '') })
      });
      const data = await res.json();
      if (res.ok) {
        navigate(`/${data.customUrl}`);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    if (orgUrl) {
      setLoading(true);
      apiFetch('/api/users/me')
        .then(r => {
          if (!r.ok) {
            navigate('/login', { state: { sessionExpired: true } });
            return null;
          }
          return r.json();
        })
        .then(user => {
          if (user) {
            setCurrentUser(user);
            apiFetch(`/api/organizations/${orgUrl}`)
              .then(r => r.ok ? r.json() : null)
              .then(data => {
                if (data) {
                  setOrg(data);
                  if (user.organizations && user.organizations.length > 0) {
                    const orgMembership = user.organizations.find((o: any) => o.orgId === data.id || (o.orgId && o.orgId._id === data.id));
                    setCurrentRole(orgMembership ? orgMembership.role : user.role);
                  } else {
                    setCurrentRole(user.role);
                  }
                  apiFetch(`/api/projects/${data.id}`).then(r => r.json()).then(p => setProjects(p));
                  apiFetch(`/api/users/org/${data.id}`).then(r => r.json()).then(u => setUsers(u));
                  apiFetch(`/api/departments/${data.id}`).then(r => r.json()).then(d => setDepartments(d));
                } else { 
                   setError('Organización no encontrada');
                }
                setLoading(false);
              })
              .catch(e => {
                setError('Error cargando organización');
                setLoading(false);
              });
          }
        });
    }
  }, [orgUrl]);

  return (
    <OrgContext.Provider value={{ org, currentUser, currentRole, projects, users, departments, loading, error, reloadData, updateOrgUrl, updateOrg, updateUser }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (context === undefined) {
    return {
      org: null,
      currentUser: null,
      currentRole: '',
      projects: [],
      users: [],
      departments: [],
      loading: false,
      error: null,
      reloadData: () => {},
      updateOrgUrl: async () => false,
      updateOrg: async () => false,
      updateUser: async () => false
    };
  }
  return context;
}
