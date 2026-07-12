/**
 * Real-time client (Socket.IO). Connects to the backend with the portal's JWT
 * and invalidates React Query caches on `data:changed`, so admin/user
 * dashboards (and other live views) refresh instantly instead of polling.
 */
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { readSession } from '../api/client';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

let socket = null;
let currentPortal = null;

export function connectRealtime(portal) {
  const session = readSession(portal);
  if (!session?.token) return null;
  if (socket && currentPortal === portal && socket.connected) return socket;
  if (socket) socket.disconnect();
  currentPortal = portal;
  socket = io(API_BASE || undefined, {
    path: '/socket.io',
    auth: { token: session.token, portal },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
  });
  return socket;
}

export function disconnectRealtime() {
  if (socket) socket.disconnect();
  socket = null;
  currentPortal = null;
}

/**
 * Subscribe the current React tree to live updates for a portal. On any
 * `data:changed` pulse it invalidates all active queries (debounced), so the
 * dashboard and lists refetch in real time.
 */
export function useRealtime(portal) {
  const qc = useQueryClient();
  useEffect(() => {
    const s = connectRealtime(portal);
    if (!s) return undefined;
    let timer = null;
    const onChange = () => {
      clearTimeout(timer);
      timer = setTimeout(() => qc.invalidateQueries(), 400);
    };
    s.on('data:changed', onChange);
    return () => {
      clearTimeout(timer);
      s.off('data:changed', onChange);
    };
  }, [portal, qc]);
}
