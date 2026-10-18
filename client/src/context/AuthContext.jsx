import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/resources';
import { refreshSession, setAccessToken, setAuthFailureHandler } from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  const clear = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    qc.clear();
  }, [qc]);

  useEffect(() => {
    setAuthFailureHandler(clear);
    refreshSession()
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [clear]);

  const accept = ({ user: u, accessToken }) => {
    setAccessToken(accessToken);
    setUser(u);
    return u;
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login: async (body) => accept(await authApi.login(body)),
      register: async (body) => accept(await authApi.register(body)),
      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          clear();
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading, clear]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
