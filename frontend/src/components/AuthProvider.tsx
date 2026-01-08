// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

import { User, auth } from '@/lib/api';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Background auth check with retry logic
  const checkAuth = async (retries = 3) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const userData = await auth.me();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setRetryCount(0); // Reset retry count on success
        return true;
      } catch (err: any) {
        console.log(`Auth check attempt ${attempt + 1}/${retries}:`, err.message);

        // Aniq 401 - token yaroqsiz
        if (err.message === 'Avtorizatsiya muddati tugagan') {
          console.log('Token expired, logging out');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setToken(null);
          return false;
        }

        // Network error - retry with exponential backoff
        if (attempt < retries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10s
          console.log(`Retrying after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed - keep localStorage user (offline mode)
    console.log('Auth check failed after retries - continuing offline');
    return false;
  };

  useEffect(() => {
    // Saqlangan foydalanuvchini yuklash
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        // Avval localStorage'dan user ni olish (fast UX)
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        setLoading(false);

        // Background'da token ni tekshirish (retry logic bilan)
        checkAuth();
      } catch (e) {
        // JSON parse xatolik
        console.error('Failed to parse stored user:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
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
    setToken(response.token);
    return response.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
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
