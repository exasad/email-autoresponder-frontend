import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './routes/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';

import AdminLogin from './pages/auth/AdminLogin';
import UserLogin from './pages/auth/UserLogin';

import AdminDashboard from './pages/admin/AdminDashboard';
import Users from './pages/admin/Users';
import AdminCampaigns from './pages/admin/Campaigns';
import AdminLeads from './pages/admin/Leads';
import AdminPopAccounts from './pages/admin/PopAccounts';
import AdminQueue from './pages/admin/Queue';
import Smtp from './pages/admin/Smtp';
import SystemMonitor from './pages/admin/SystemMonitor';
import AdminProfile from './pages/admin/AdminProfile';

import UserDashboard from './pages/user/UserDashboard';
import Campaigns from './pages/user/Campaigns';
import CampaignDetail from './pages/user/CampaignDetail';
import MotherMailPage from './pages/user/MotherMailPage';
import RepliesPage from './pages/user/RepliesPage';
import FollowupsPage from './pages/user/FollowupsPage';
import UserSmtp from './pages/user/Smtp';
import Leads from './pages/user/Leads';
import LeadLogs from './pages/user/LeadLogs';
import UserProfile from './pages/user/UserProfile';

import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/user/login" replace />} />

      {/* Auth */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/user/login" element={<UserLogin />} />

      {/* Admin portal */}
      <Route path="/admin" element={<ProtectedRoute portal="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="campaigns" element={<AdminCampaigns />} />
        <Route path="leads" element={<AdminLeads />} />
        <Route path="smtp" element={<Smtp />} />
        <Route path="pop-accounts" element={<AdminPopAccounts />} />
        <Route path="queue" element={<AdminQueue />} />
        <Route path="system" element={<SystemMonitor />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* User portal */}
      <Route path="/user" element={<ProtectedRoute portal="user"><UserLayout /></ProtectedRoute>}>
        <Route index element={<UserDashboard />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="campaigns/:id" element={<CampaignDetail />} />
        <Route path="mother-mail" element={<MotherMailPage />} />
        <Route path="replies" element={<RepliesPage />} />
        <Route path="followups" element={<FollowupsPage />} />
        <Route path="smtp" element={<UserSmtp />} />
        <Route path="leads" element={<Leads />} />
        <Route path="lead-logs" element={<LeadLogs />} />
        <Route path="profile" element={<UserProfile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
