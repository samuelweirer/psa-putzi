import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';
import type { User, RegisterRequest } from '../types/auth.types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      // Convert snake_case to camelCase for frontend
      setUser({
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        role: data.role,
        mfaEnabled: data.mfa_enabled || false,
      });
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      localStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });

    // Handle MFA required case
    if (data.mfa_required) {
      // Store temp token for MFA verification
      localStorage.setItem('mfaTempToken', data.temp_token);
      throw new Error('MFA_REQUIRED');
    }

    // Store tokens (backend uses snake_case)
    localStorage.setItem('accessToken', data.access_token);
    localStorage.setItem('refreshToken', data.refresh_token);

    // Set user state (convert snake_case to camelCase for frontend)
    setUser({
      id: data.user.id,
      email: data.user.email,
      firstName: data.user.first_name,
      lastName: data.user.last_name,
      role: data.user.role,
      mfaEnabled: data.user.mfa_enabled || false,
    });
    setIsAuthenticated(true);
  };

  const register = async (registerData: RegisterRequest) => {
    // Transform camelCase to snake_case for backend
    const backendData = {
      email: registerData.email,
      password: registerData.password,
      first_name: registerData.firstName,
      last_name: registerData.lastName,
    };

    // Register the user
    await api.post('/auth/register', backendData);

    // Backend doesn't return tokens on registration (doesn't match spec)
    // Workaround: Automatically login after successful registration
    await login(registerData.email, registerData.password);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    setUser,
    setIsAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
