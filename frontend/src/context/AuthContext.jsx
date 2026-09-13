import { useCallback, useEffect, useMemo, useState } from "react";
import {
  login as loginRequest,
  logout as logoutRequest,
  getSession,
  restoreSession,
  setSession as saveSession,
  clearSession,
} from "../services/api.js";
import { AuthContext } from "./authContext.js";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSession());
  const [user, setUser] = useState(() => getSession()?.user || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  const isAuthenticated = Boolean(session && user);

  const persistSession = useCallback((nextSession) => {
    if (!nextSession) {
      setSession(null);
      setUser(null);
      clearSession();
      return;
    }

    const normalized = {
      ...nextSession,
      token_type: nextSession.token_type || "Bearer",
      expires_in: Number(nextSession.expires_in || 1800),
      expires_at:
        nextSession.expires_at ||
        Date.now() + Number(nextSession.expires_in || 1800) * 1000,
      user: nextSession.user || null,
    };

    setSession(normalized);
    setUser(normalized.user || null);
    saveSession(normalized);
  }, []);

  const login = useCallback(
    async (credentials) => {
      setIsLoading(true);

      try {
        const payload = await loginRequest(credentials);
        persistSession(payload);
        return payload;
      } finally {
        setIsLoading(false);
      }
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Local auth state should still be cleared if the logout request fails.
    }

    setSession(null);
    setUser(null);
    clearSession();
  }, []);

  useEffect(() => {
    let active = true;

    async function restoreSessionFromServer() {
      try {
        const restored = await restoreSession();
        if (!active) return;

        if (restored?.user) {
          setSession(restored);
          setUser(restored.user);
        } else {
          setSession(null);
          setUser(null);
        }
      } catch {
        if (!active) return;
        setSession(null);
        setUser(null);
      } finally {
        if (active) {
          setIsLoading(false);
          setIsHydrated(true);
        }
      }
    }

    restoreSessionFromServer();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      isAuthenticated,
      isLoading,
      isHydrated,
      login,
      logout,
      setSession: persistSession,
    }),
    [
      user,
      session,
      isAuthenticated,
      isLoading,
      isHydrated,
      login,
      logout,
      persistSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
