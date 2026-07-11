import React from 'react';
import LoginScreen from './LoginScreen';
import { useAuth } from '../../context/AuthContext';

export default function UserLogin() {
  const { isUserAuthed, loginUser } = useAuth();
  return (
    <LoginScreen
      portal="user"
      alreadyAuthed={isUserAuthed}
      onSubmit={loginUser}
    />
  );
}
