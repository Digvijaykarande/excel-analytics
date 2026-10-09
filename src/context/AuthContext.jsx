import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "../lib/api";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  const logout = useCallback(() => { setToken(null); setUser(null); }, []);

  useEffect(() => {
    if (!getToken()) return;
    api("/api/users/me").then(setUser).catch(() => setToken(null)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    window.addEventListener("ea:logout", logout);
    return () => window.removeEventListener("ea:logout", logout);
  }, [logout]);

  const authenticate = useCallback(async (path, body) => {
    const { token, user: u } = await api(path, { method: "POST", body });
    setToken(token); setUser(u);
    return u;
  }, []);

  const value = useMemo(() => ({
    user, loading, setUser, logout,
    login: (email, password) => authenticate("/api/auth/login", { email, password }),
    register: (name, email, password) => authenticate("/api/auth/register", { name, email, password }),
  }), [user, loading, logout, authenticate]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
