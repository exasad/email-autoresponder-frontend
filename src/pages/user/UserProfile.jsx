import React from 'react';
import ProfilePage from '../../components/ProfilePage';
import { userApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function UserProfile() {
  const { user, updateUserProfile } = useAuth();
  return (
    <ProfilePage
      portal="user"
      api={userApi}
      profile={user?.profile}
      onProfileUpdated={updateUserProfile}
      fields={[
        { name: 'name', label: 'Full name', placeholder: 'Your full name' },
        { name: 'email', label: 'Email', disabled: true, placeholder: 'you@company.com' },
        { name: 'company', label: 'Company', placeholder: 'Your company' },
        { name: 'phone', label: 'Phone', placeholder: '+1 555 000 0000' },
        { name: 'timezone', label: 'Timezone', placeholder: 'e.g. UTC, America/New_York' },
      ]}
    />
  );
}
