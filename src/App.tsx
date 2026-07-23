import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { TermsAndConditions } from './pages/TermsAndConditions';
import { DataProtection } from './pages/DataProtection';
import { OrgDashboard } from './pages/OrgDashboard';
import { ProjectView } from './pages/ProjectView';
import { SuperAdmin } from './pages/SuperAdmin';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { SuperAdminLogin } from './pages/SuperAdminLogin';
import { Enrollment } from './pages/Enrollment';
import { EmailConfirmation } from './pages/EmailConfirmation';
import { OrgLayout } from './layouts/OrgLayout';
import { NewProjectPage } from './pages/NewProjectPage';
import { ProfilePage } from './pages/ProfilePage';
import { SupportTicketPage } from './pages/SupportTicketPage';
import { NotificationsPage } from './pages/NotificationsPage';

import React from 'react';

export default function App() {
  React.useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Listen for changes across tabs/components
    const handleStorage = () => {
      const isDarkNow = localStorage.getItem('darkMode') === 'true';
      if (isDarkNow) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('darkModeChanged', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('darkModeChanged', handleStorage);
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/terminos-y-condiciones" element={<TermsAndConditions />} />
          <Route path="/proteccion-de-datos" element={<DataProtection />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login-superadmin" element={<SuperAdminLogin />} />
          <Route path="/superadmin" element={<SuperAdmin />} />
          <Route path="/confirm-email/:token" element={<EmailConfirmation />} />
          <Route path="/:orgUrl/enroll/:token" element={<Enrollment />} />
          <Route path="/:orgUrl" element={<OrgLayout />}>
            <Route index element={<OrgDashboard />} />
            <Route path="new-project" element={<NewProjectPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="support" element={<SupportTicketPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="p/:projectId" element={<ProjectView />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}
