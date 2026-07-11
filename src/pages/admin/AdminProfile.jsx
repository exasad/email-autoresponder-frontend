import React from 'react';
import ProfilePage from '../../components/ProfilePage';
import { adminApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function AdminProfile() {
  const { admin, updateAdminProfile } = useAuth();
  return (
    <ProfilePage
      portal="admin"
      api={adminApi}
      profile={admin?.profile}
      onProfileUpdated={updateAdminProfile}
      fields={[
        { name: 'name', label: 'Full name', placeholder: 'Your full name' },
        { name: 'email', label: 'Email', disabled: true, placeholder: 'admin@gmail.com' },
        { name: 'phone', label: 'Phone', placeholder: '+1 555 000 0000' },
      ]}
    />
  );
}
