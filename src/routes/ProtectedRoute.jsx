import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Guards a portal subtree; bounces unauthenticated visitors to that portal's login. */
export default function ProtectedRoute({ portal, children }) {
  const auth = useAuth();
  const location = useLocation();
  const authed = portal === 'admin' ? auth.isAdminAuthed : auth.isUserAuthed;

  if (!authed) {
    return <Navigate to={`/${portal}/login`} replace state={{ from: location }} />;
  }
  return children;
}
