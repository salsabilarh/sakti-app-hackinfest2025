import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const ROLES = {
  ADMIN: 'admin',
  MANAJEMEN: 'management',
  PDO: 'pdo',
  VIEWER: 'viewer',
};

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const api = axios.create({
    baseURL: 'http://localhost:3000/api',
  });

  // Interceptor untuk attach token ke setiap request
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('sakti_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  useEffect(() => {
    const token = localStorage.getItem('sakti_token');
    if (token) {
      setAuthToken(token);
      getProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token } = res.data;

      localStorage.setItem('sakti_token', token);
      setAuthToken(token);
      await getProfile();
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Login gagal' };
    }
  };

  const getProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setUser(res.data.user);
      setIsAuthenticated(true);
    } catch (err) {
      setIsAuthenticated(false);
      setUser(null);
      setAuthToken(null);
      localStorage.removeItem('sakti_token');
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('sakti_token');
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
  };

  const value = {
    isAuthenticated,
    user,
    authToken, // token disediakan di context
    login,
    logout,
    updateUser,
    loading,
    ROLES,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
