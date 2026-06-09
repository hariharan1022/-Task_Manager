import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  api,
  setAccessToken,
  setUnauthorizedHandler,
  setTokenRefreshedHandler,
  setStoredRefreshToken,
  getStoredRefreshToken,
} from "../utils/axios.js";
import toast from "react-hot-toast";
import { MIN_LOADING_MS, MAX_API_TIMEOUT_MS } from "../utils/loadingConfig.js";

const AuthContext = createContext(null);

const USER_KEY = "skyrovix_user";
const REFRESH_KEY = "skyrovix_refresh_token";

const readPersisted = () => {
  try {
    const user = localStorage.getItem(USER_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY);
    const remembered = !!localStorage.getItem(REFRESH_KEY);
    return { user: user ? JSON.parse(user) : null, refreshToken, remembered };
  } catch {
    return { user: null, refreshToken: null, remembered: true };
  }
};

const writeUser = (user) => {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [remember, setRememberState] = useState(true);
  const rememberRef = useRef(true);

  const persistTokens = useCallback((accessToken, refreshToken, shouldRemember) => {
    setAccessToken(accessToken);
    setStoredRefreshToken(refreshToken, shouldRemember);
  }, []);

  const clearAuth = useCallback(
    ({ silent = false } = {}) => {
      const hadUser = !!user;
      setUser(null);
      setAccessToken(null);
      setStoredRefreshToken(null, true);
      writeUser(null);
      if (hadUser && !silent) setSessionExpired(true);
    },
    [user]
  );

  useEffect(() => {
    setUnauthorizedHandler(() => clearAuth());
    setTokenRefreshedHandler((accessToken, refreshToken) => {
      setStoredRefreshToken(refreshToken, rememberRef.current);
    });
  }, [clearAuth]);

  useEffect(() => {
    let cancelled = false;
    const tryRefresh = async (refreshToken, savedUser, remembered, retries) => {
      try {
        const { data } = await api.post("/auth/refresh", { refreshToken }, { timeout: MAX_API_TIMEOUT_MS });
        if (cancelled) return false;
        const shouldRemember = !!localStorage.getItem(REFRESH_KEY);
        rememberRef.current = shouldRemember;
        setRememberState(shouldRemember);
        setAccessToken(data.accessToken);
        setStoredRefreshToken(data.refreshToken, shouldRemember);
        if (savedUser && !cancelled) {
          setUser(savedUser);
          writeUser(savedUser);
        }
        try {
          const me = await api.get("/auth/me", { timeout: MAX_API_TIMEOUT_MS });
          if (cancelled) return false;
          setUser(me.data.user);
          writeUser(me.data.user);
        } catch {
          if (!cancelled && savedUser) {
            setUser(savedUser);
            writeUser(savedUser);
          }
        }
        return true;
      } catch {
        if (!cancelled && retries > 0) {
          await new Promise((r) => setTimeout(r, 1500));
          if (!cancelled) {
            return tryRefresh(refreshToken, savedUser, remembered, retries - 1);
          }
        }
        return false;
      }
    };

    const init = async () => {
      const started = Date.now();
      const { user: savedUser, refreshToken, remembered } = readPersisted();
      rememberRef.current = remembered;
      setRememberState(remembered);
      if (!refreshToken) {
        const wait = Math.max(0, MIN_LOADING_MS - (Date.now() - started));
        if (!cancelled && wait > 0) await new Promise((r) => setTimeout(r, wait));
        if (!cancelled) setLoading(false);
        return;
      }
      if (savedUser && !cancelled) {
        setUser(savedUser);
      }
      const ok = await tryRefresh(refreshToken, savedUser, remembered, 2);
      if (!cancelled && !ok) {
        clearAuth({ silent: !savedUser });
      }
      const wait = Math.max(0, MIN_LOADING_MS - (Date.now() - started));
      if (!cancelled && wait > 0) await new Promise((r) => setTimeout(r, wait));
      if (!cancelled) setLoading(false);
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [clearAuth]);

  const login = useCallback(async (email, password, shouldRemember = true) => {
    const { data } = await api.post("/auth/login", { email, password }, { timeout: MAX_API_TIMEOUT_MS });
    rememberRef.current = shouldRemember;
    setRememberState(shouldRemember);
    setAccessToken(data.accessToken);
    setStoredRefreshToken(data.refreshToken, shouldRemember);
    setUser(data.user);
    writeUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload, shouldRemember = true) => {
    const { data } = await api.post("/auth/register", payload);
    if (data.accessToken && data.user) {
      rememberRef.current = shouldRemember;
      setRememberState(shouldRemember);
      setAccessToken(data.accessToken);
      setStoredRefreshToken(data.refreshToken, shouldRemember);
      setUser(data.user);
      writeUser(data.user);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    setLoggingOut(true);
    try {
      try {
        await api.post("/auth/logout");
      } catch {
        /* ignore — clear locally anyway */
      }
      clearAuth({ silent: true });
      return true;
    } finally {
      setTimeout(() => setLoggingOut(false), 600);
    }
  }, [clearAuth]);

  const updateUser = useCallback((next) => {
    setUser(next);
    writeUser(next);
  }, []);

  const setRemember = useCallback((v) => {
    rememberRef.current = v;
    setRememberState(v);
  }, []);

  const dismissSessionExpired = useCallback(() => setSessionExpired(false), []);

  useEffect(() => {
    if (sessionExpired) {
      toast.error("Session expired. Please sign in again.");
    }
  }, [sessionExpired]);

  useEffect(() => {
    if (!user) return;
    const ping = () => api.post("/auth/ping").catch(() => {});
    ping();
    const id = setInterval(ping, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loggingOut,
        sessionExpired,
        remember,
        login,
        register,
        logout,
        updateUser,
        setRemember,
        dismissSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
