import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, userApi, readSession, writeSession } from '../api/client';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(() => readSession('admin'));
  const [user, setUser] = useState(() => readSession('user'));

  // Keep React state in sync when a client writes/clears a session.
  useEffect(() => {
    const onSession = () => { setAdmin(readSession('admin')); setUser(readSession('user')); };
    const onUnauthorized = (e) => {
      const portal = e.detail?.portal;
      if (portal === 'admin') { setAdmin(null); navigate('/admin/login'); }
      if (portal === 'user') { setUser(null); navigate('/user/login'); }
    };
    window.addEventListener('b2b:session', onSession);
    window.addEventListener('b2b:unauthorized', onUnauthorized);
    return () => {
      window.removeEventListener('b2b:session', onSession);
      window.removeEventListener('b2b:unauthorized', onUnauthorized);
    };
  }, [navigate]);

  const loginAdmin = useCallback(async (credentials) => {
    const { data } = await adminApi.post('/login', credentials);
    const session = { token: data.data.token, refreshToken: data.data.refreshToken, profile: data.data.admin };
    writeSession('admin', session);
    setAdmin(session);
    return session;
  }, []);

  const loginUser = useCallback(async (credentials) => {
    const { data } = await userApi.post('/login', credentials);
    const session = { token: data.data.token, refreshToken: data.data.refreshToken, profile: data.data.user };
    writeSession('user', session);
    setUser(session);
    return session;
  }, []);

  const logoutAdmin = useCallback(async () => {
    try { await adminApi.post('/logout'); } catch { /* ignore */ }
    writeSession('admin', null);
    setAdmin(null);
    navigate('/admin/login');
  }, [navigate]);

  const logoutUser = useCallback(async () => {
    try { await userApi.post('/logout'); } catch { /* ignore */ }
    writeSession('user', null);
    setUser(null);
    navigate('/user/login');
  }, [navigate]);

  const updateAdminProfile = useCallback((profile) => {
    setAdmin((s) => {
      if (!s) return s;
      const next = { ...s, profile: { ...s.profile, ...profile } };
      writeSession('admin', next);
      return next;
    });
  }, []);

  const updateUserProfile = useCallback((profile) => {
    setUser((s) => {
      if (!s) return s;
      const next = { ...s, profile: { ...s.profile, ...profile } };
      writeSession('user', next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    admin, user,
    isAdminAuthed: !!admin?.token,
    isUserAuthed: !!user?.token,
    loginAdmin, loginUser, logoutAdmin, logoutUser,
    updateAdminProfile, updateUserProfile,
  }), [admin, user, loginAdmin, loginUser, logoutAdmin, logoutUser, updateAdminProfile, updateUserProfile]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
