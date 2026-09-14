import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  login as loginRequest,
  logout as logoutRequest,
  getSession,
  restoreSession,
  refreshSession as refreshSessionRequest,
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

    const expiresIn = Number(nextSession.expires_in || 900);

    const normalized = {
      ...nextSession,
      token_type: nextSession.token_type || "Bearer",
      expires_in: expiresIn,
      expires_at:
        nextSession.expires_at ||
        Date.now() + expiresIn * 1000,
      user: nextSession.user || null,
    };

    setSession(normalized);
    setUser(normalized.user || null);
    saveSession(normalized);
  }, []);

  // Refresh the short-lived Ivy access token.
  const refreshSession = useCallback(async () => {
    try {
      const refreshed = await refreshSessionRequest();

      if (!refreshed?.user) {
        throw new Error("Session refresh failed");
      }

      persistSession(refreshed);

      return refreshed;
    } catch (error) {
      setSession(null);
      setUser(null);
      clearSession();

      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.assign("/login");
      }

      throw error;
    }
  }, [persistSession]);

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
      // Clear local state even if server logout fails.
    }

    setSession(null);
    setUser(null);
    clearSession();
  }, []);

  // Restore session when the page is loaded/refreshed.
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

  // Refresh one minute before the Ivy access token expires.
  useEffect(() => {
    if (!session?.expires_at) return;

    const delay = Math.max(
      session.expires_at - Date.now() - 60_000,
      10_000,
    );

    const timer = setTimeout(() => {
      refreshSession().catch(() => {});
    }, delay);

    return () => clearTimeout(timer);
  }, [session?.expires_at, refreshSession]);

  const value = useMemo(
    () => ({
      user,
      session,
      isAuthenticated,
      isLoading,
      isHydrated,
      login,
      logout,
      refreshSession,
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
      refreshSession,
      persistSession,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}