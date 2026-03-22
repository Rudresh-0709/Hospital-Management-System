import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getAuthStatus, logout as apiLogout } from '../services/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshStatus = async () => {
    try {
      const response = await getAuthStatus();
      setAuthenticated(Boolean(response.authenticated));
      setUser(response.user || null);
    } catch (error) {
      setAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const response = await apiLogout();
    await refreshStatus();
    return response;
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const value = useMemo(
    () => ({
      user,
      authenticated,
      loading,
      refreshStatus,
      logout,
    }),
    [user, authenticated, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
