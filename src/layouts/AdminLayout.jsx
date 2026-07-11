import React from 'react';
import {
  DashboardOutlined, TeamOutlined, MailOutlined, DesktopOutlined, UserOutlined,
  RocketOutlined, ContactsOutlined, InboxOutlined, ClusterOutlined,
} from '@ant-design/icons';
import AppShell from './AppShell';
import { adminApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { key: '/admin', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: '/admin/users', label: 'Users', icon: <TeamOutlined /> },
  { key: '/admin/campaigns', label: 'Campaigns', icon: <RocketOutlined /> },
  { key: '/admin/leads', label: 'Leads', icon: <ContactsOutlined /> },
  { key: '/admin/smtp', label: 'SMTP Pool', icon: <MailOutlined /> },
  { key: '/admin/pop-accounts', label: 'POP Accounts', icon: <InboxOutlined /> },
  { key: '/admin/queue', label: 'Email Queue', icon: <ClusterOutlined /> },
  { key: '/admin/system', label: 'Server Monitor', icon: <DesktopOutlined /> },
  { key: '/admin/profile', label: 'My Profile', icon: <UserOutlined /> },
];

export default function AdminLayout() {
  const { admin, logoutAdmin } = useAuth();
  return (
    <AppShell
      portal="admin"
      brand="Back2Back"
      nav={NAV}
      api={adminApi}
      profile={admin?.profile}
      onLogout={logoutAdmin}
    />
  );
}
