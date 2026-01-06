"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import {jwtDecode} from 'jwt-decode';

interface User {
  username: string;
  email: string;
  user_id: number;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        // We might want to fetch full profile here
        setUser({ username: decoded.username || 'User', email: '', user_id: decoded.user_id });
      } catch (e) {
        Cookies.remove('access_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: any) => {
    const { data } = await api.post('/auth/login/', credentials);
    Cookies.set('access_token', data.access);
    Cookies.set('refresh_token', data.refresh);
    
    const decoded: any = jwtDecode(data.access);
    setUser({ username: decoded.username || 'User', email: '', user_id: decoded.user_id });
    
    router.push('/dashboard');
  };

  const register = async (userData: any) => {
    await api.post('/auth/register/', userData);
    // Auto login or redirect to login? Let's redirect to login
    router.push('/login');
  };

  const logout = () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
