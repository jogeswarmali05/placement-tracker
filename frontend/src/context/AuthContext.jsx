import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authAPI, tokenStore } from '../services/api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  useEffect(() => {
    if (!tokenStore.get()) return;
    authAPI.me().then((d) => setUser(d.user)).catch(() => tokenStore.clear()).finally(() => setLoading(false));
  }, []);

  const handleAuth = useCallback((data) => {
    tokenStore.set(data.token);
    setUser(data.user);
  }, []);

  const login = useCallback(async (creds) => handleAuth(await authAPI.login(creds)), [handleAuth]);
  const register = useCallback(async (form) => handleAuth(await authAPI.register(form)), [handleAuth]);
  const logout = useCallback(() => { tokenStore.clear(); setUser(null); }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
