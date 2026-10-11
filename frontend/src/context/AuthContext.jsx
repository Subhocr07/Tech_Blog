import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('devchronicle_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('devchronicle_access_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const updateUserData = (userData, accessToken) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('devchronicle_user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('devchronicle_user');
    }

    if (accessToken) {
      setToken(accessToken);
      localStorage.setItem('devchronicle_access_token', accessToken);
    } else if (accessToken === null) {
      setToken(null);
      localStorage.removeItem('devchronicle_access_token');
    }
  };

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/auth/me');
      updateUserData(res.data.data.user);
    } catch {
      try {
        const refreshRes = await api.post('/auth/refresh');
        updateUserData(refreshRes.data.data.user, refreshRes.data.data.accessToken);
      } catch {
        updateUserData(null, null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handleUnauthorized = () => {
      updateUserData(null, null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [checkAuth]);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user: loggedInUser, accessToken } = res.data.data;
      updateUserData(loggedInUser, accessToken);
      return loggedInUser;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setAuthError(msg);
      throw err;
    }
  };

  const register = async (name, email, password, confirmPassword) => {
    setAuthError(null);
    try {
      const res = await api.post('/auth/register', { name, email, password, confirmPassword });
      const { user: registeredUser, accessToken } = res.data.data;
      updateUserData(registeredUser, accessToken);
      return registeredUser;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      setAuthError(msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {} finally {
      updateUserData(null, null);
    }
  };

  const setOAuthSession = (accessToken, userData) => {
    updateUserData(userData, accessToken);
  };

  const updateUserProfile = (updatedUser) => {
    updateUserData(updatedUser);
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(user && token),
    isAdmin: Boolean(user && user.role === 'admin'),
    authError,
    login,
    register,
    logout,
    refreshAuth: checkAuth,
    setOAuthSession,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
