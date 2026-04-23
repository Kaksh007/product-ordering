import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Warmup ping — fire-and-forget on every app load so Render's free-tier backend
  // starts its cold-start the moment the page opens, not after the user hits Login.
  useEffect(() => {
    api.get('/api/health').catch(() => {}); // silence errors — purely a wakeup call
  }, []);

  // When a token is present on mount, hydrate /me so we know who the user is.
  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/api/auth/me');
        setUser(data.user);
      } catch {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [token]);

  const persistSession = (nextToken, nextUser) => {
    localStorage.setItem('token', nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const login = async ({ email, password }) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    persistSession(data.token, data.user);
    return data.user;
  };

  const register = async ({ name, email, password, confirmPassword, role }) => {
    const { data } = await api.post('/api/auth/register', {
      name,
      email,
      password,
      confirmPassword,
      role,
    });
    persistSession(data.token, data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = { user, token, loading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
