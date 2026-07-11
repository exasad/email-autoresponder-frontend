import React from 'react';
import {
  DashboardOutlined, RocketOutlined, ContactsOutlined, UserOutlined,
  MailOutlined, MessageOutlined, RetweetOutlined, SendOutlined,
} from '@ant-design/icons';
import AppShell from './AppShell';
import { userApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { key: '/user', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: '/user/campaigns', label: 'Campaigns', icon: <RocketOutlined /> },
  { key: '/user/mother-mail', label: 'Mother Mail', icon: <MailOutlined /> },
  { key: '/user/replies', label: 'Replies', icon: <MessageOutlined /> },
  { key: '/user/followups', label: 'Follow-ups', icon: <RetweetOutlined /> },
  { key: '/user/smtp', label: 'My SMTP', icon: <SendOutlined /> },
  { key: '/user/leads', label: 'Leads', icon: <ContactsOutlined /> },
  { key: '/user/profile', label: 'My Profile', icon: <UserOutlined /> },
];

export default function UserLayout() {
  const { user, logoutUser } = useAuth();
  return (
    <AppShell
      portal="user"
      brand="SecureMail"
      nav={NAV}
      api={userApi}
      profile={user?.profile}
      onLogout={logoutUser}
    />
  );
}
