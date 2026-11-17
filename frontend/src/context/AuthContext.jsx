import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { tokenStore } from '../api/client.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  const logout = useCallback(() => { tokenStore.clear(); setStudent(null); }, []);

  useEffect(() => {
    if (!tokenStore.get()) return;
    api.get('/auth/me').then((r) => setStudent(r.data.student)).catch(() => tokenStore.clear()).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    window.addEventListener('studymate:unauthorized', logout);
    return () => window.removeEventListener('studymate:unauthorized', logout);
  }, [logout]);

  const authenticate = async (path, payload) => {
    const { data } = await api.post(path, payload);
    tokenStore.set(data.token);
    setStudent(data.student);
  };

  const value = {
    student, loading, setStudent, logout,
    login: (p) => authenticate('/auth/login', p),
    register: (p) => authenticate('/auth/register', p),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
