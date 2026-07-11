import React from 'react';
import LoginScreen from './LoginScreen';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const { isAdminAuthed, loginAdmin } = useAuth();
  return (
    <LoginScreen
      portal="admin"
      alreadyAuthed={isAdminAuthed}
      onSubmit={loginAdmin}
      hint="Demo admin — admin@gmail.com / password"
    />
  );
}
