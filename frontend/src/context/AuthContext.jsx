import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AuthDrawer from "../components/AuthDrawer";
import { api } from "../lib/api";

const AuthContext = createContext(null);
const TOKEN_STORAGE_KEY = "accessToken";
const USER_STORAGE_KEY = "currentUser";

function readStoredUser() {
  try {
    const value = localStorage.getItem(USER_STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) ?? "");
  const [currentUser, setCurrentUser] = useState(readStoredUser);
  const [authLoading, setAuthLoading] = useState(false);
  const isLoggedIn = Boolean(token);
  const role = currentUser?.role ?? "customer";
  const isAdmin = role === "admin";
  const isSalesManager = role === "sales_manager";
  const isProductManager = role === "product_manager";

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }

    localStorage.removeItem("isLoggedIn");
  }, [token]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [currentUser]);

  const refreshCurrentUser = useCallback(async (accessToken = token) => {
    if (!accessToken) {
      setCurrentUser(null);
      return null;
    }

    const user = await api.getCurrentUser(accessToken);
    setCurrentUser(user);
    return user;
  }, [token]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let isMounted = true;

    refreshCurrentUser(token)
      .then((user) => {
        if (isMounted) {
          setCurrentUser(user);
        }
      })
      .catch(() => {
        if (isMounted) {
          setToken("");
          setCurrentUser(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshCurrentUser, token]);

  const openAuth = useCallback((tab = "login") => {
    setAuthTab(tab);
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => setAuthOpen(false), []);

  const login = useCallback(async ({ email, password }) => {
    setAuthLoading(true);

    try {
      const tokenResponse = await api.login(email, password);
      const user = await api.getCurrentUser(tokenResponse.access_token);
      setToken(tokenResponse.access_token);
      setCurrentUser(user);
      setAuthOpen(false);
      return user;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setAuthLoading(true);

    try {
      await api.register(payload);
      const tokenResponse = await api.login(payload.email, payload.password);
      const user = await api.getCurrentUser(tokenResponse.access_token);
      setToken(tokenResponse.access_token);
      setCurrentUser(user);
      setAuthOpen(false);
      return user;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken("");
    setCurrentUser(null);
  }, []);

  const value = useMemo(
    () => ({
      authOpen,
      authTab,
      setAuthTab,
      token,
      isLoggedIn,
      role,
      isAdmin,
      isSalesManager,
      isProductManager,
      currentUser,
      authLoading,
      openAuth,
      closeAuth,
      login,
      register,
      logout,
      refreshCurrentUser,
    }),
    [
      authOpen,
      authTab,
      token,
      isLoggedIn,
      role,
      isAdmin,
      isSalesManager,
      isProductManager,
      currentUser,
      authLoading,
      openAuth,
      closeAuth,
      login,
      register,
      logout,
      refreshCurrentUser,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      <div className="relative min-h-screen overflow-x-hidden">
        <div
          className={`min-h-screen transition-[filter] duration-300 ${authOpen ? "brightness-[0.92]" : ""}`}
        >
          {children}
        </div>
        <AuthDrawer />
      </div>
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}