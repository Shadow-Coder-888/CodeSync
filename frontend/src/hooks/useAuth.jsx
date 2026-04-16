// src/hooks/useAuth.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('cs-token') || null);
  const [loading, setLoading] = useState(!!localStorage.getItem('cs-token'));

  // Rehydrate on mount if token exists
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    axios.get(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setUser(r.data.user))
      .catch(() => { localStorage.removeItem('cs-token'); setToken(null); })
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback((tok, u) => {
    localStorage.setItem('cs-token', tok);
    setToken(tok);
    setUser(u);
  }, []);

  const register = useCallback(async (email, password, username) => {
    const r = await axios.post(`${API}/api/auth/register`, { email, password, username });
    persist(r.data.token, r.data.user);
    return r.data.user;
  }, [persist]);

  const login = useCallback(async (email, password) => {
    const r = await axios.post(`${API}/api/auth/login`, { email, password });
    persist(r.data.token, r.data.user);
    return r.data.user;
  }, [persist]);

  const logout = useCallback(() => {
    localStorage.removeItem('cs-token');
    setToken(null);
    setUser(null);
  }, []);

  // Axios helper with auth header
  const authAxios = useCallback((cfg = {}) =>
    axios({ ...cfg, headers: { ...(cfg.headers || {}), Authorization: `Bearer ${token}` } }),
  [token]);

  return (
    <Ctx.Provider value={{ user, token, loading, register, login, logout, authAxios }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
