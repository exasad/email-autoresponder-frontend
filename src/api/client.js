import axios from 'axios';

/**
 * Two isolated API clients — one per auth system. Each reads its OWN token from
 * localStorage and, on a 401, clears only its own session and emits an event
 * the AuthProvider listens for (to redirect to the right login).
 */
const SESSION_KEYS = { admin: 'b2b.admin.session', user: 'b2b.user.session' };

export function readSession(portal) {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEYS[portal]) || 'null');
  } catch {
    return null;
  }
}

export function writeSession(portal, session) {
  if (session) localStorage.setItem(SESSION_KEYS[portal], JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEYS[portal]);
  window.dispatchEvent(new CustomEvent('b2b:session', { detail: { portal } }));
}

function createApi(portal) {
  const instance = axios.create({
    baseURL: `/api/${portal}`,
    timeout: 30_000,
  });

  instance.interceptors.request.use((config) => {
    const session = readSession(portal);
    if (session?.token) config.headers.Authorization = `Bearer ${session.token}`;
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    (error) => {
      const status = error?.response?.status;
      const url = error?.config?.url || '';
      if (status === 401 && !url.includes('/login')) {
        writeSession(portal, null);
        window.dispatchEvent(new CustomEvent('b2b:unauthorized', { detail: { portal } }));
      }
      // Normalize the error message for toasts.
      const data = error?.response?.data;
      error.apiMessage = data?.message || error.message || 'Request failed';
      error.apiErrors = data?.errors || null;
      return Promise.reject(error);
    }
  );

  return instance;
}

export const adminApi = createApi('admin');
export const userApi = createApi('user');
export const apiFor = (portal) => (portal === 'admin' ? adminApi : userApi);
export { SESSION_KEYS };
