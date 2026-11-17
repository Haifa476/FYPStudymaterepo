import axios from 'axios';

const TOKEN_KEY = 'studymate_token';
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1', timeout: 15000 });

api.interceptors.request.use((config) => {
  const t = tokenStore.get();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// An expired/invalid token on a protected call sends the user back to the login screen.
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.startsWith('/auth/login') && !url.startsWith('/auth/register')) {
      tokenStore.clear();
      window.dispatchEvent(new Event('studymate:unauthorized'));
    }
    return Promise.reject(err);
  },
);

/** Human-readable message (plus field details) from an API error. */
export function errorMessage(err) {
  const e = err.response?.data?.error;
  if (!err.response) return 'Cannot reach the server. Is the backend running?';
  if (e?.details?.length) return `${e.message}: ${e.details.map((d) => `${d.field} – ${d.message}`).join('; ')}`;
  return e?.message || 'Something went wrong';
}

export default api;
