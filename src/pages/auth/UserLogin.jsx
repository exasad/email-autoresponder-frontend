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
      hint="Demo user — demo@back2back.io / User@12345"
    />
  );
}
