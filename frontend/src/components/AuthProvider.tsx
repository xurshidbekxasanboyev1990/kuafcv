'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, auth } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Saqlangan foydalanuvchini yuklash
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      try {
        // Avval localStorage'dan user ni olish
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setLoading(false);
        
        // Background'da token ni tekshirish
        auth.me()
          .then((userData) => {
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          })
          .catch((err) => {
            console.log('Auth check error:', err.message);
            // Faqat aniq 401 xatolik bo'lsa logout
            if (err.message === 'Avtorizatsiya muddati tugagan') {
              console.log('Token expired, logging out');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setUser(null);
            }
            // Network xatoliklari, server down - logout QILMASLIK
            // localStorage'dagi user bilan davom etish
          });
      } catch (e) {
        // JSON parse xatolik
        localStorage.removeItem('user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await auth.login(email, password);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    return response.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
