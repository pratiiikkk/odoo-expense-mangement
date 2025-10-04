'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { authService, userService } from '@/services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const refreshUser = async () => {
    try {
      const userData = await userService.getMe();
      console.log('User data fetched:', userData);
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const initAuth = async () => {
      try {
        const userData = await userService.getMe();
        console.log('Initial auth - user data:', userData);
        setUser(userData);
      } catch (error) {
        console.log('Initial auth - no user session');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [mounted]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authService.login({ email, password });
      console.log('Login response:', response);
      
      // Wait a bit for cookie to be set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Fetch user data
      await refreshUser();
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  // Always provide context, even before mount to prevent "must be used within AuthProvider" error
  return (
    <AuthContext.Provider value={{ user, loading: !mounted || loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
