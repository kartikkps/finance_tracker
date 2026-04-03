import React, { createContext, useContext, useState, useEffect } from 'react';

export type Role = 'ADMIN' | 'ANALYST' | 'VIEWER';

interface User {
  id: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If token exists, fetch current user profile to validate
    const validateToken = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        
        if (json.success && json.data) {
          setUser({ id: json.data.id, email: json.data.email, role: json.data.role });
        } else {
          logout(); // Invalid token
        }
      } catch (err) {
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading }}>
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
