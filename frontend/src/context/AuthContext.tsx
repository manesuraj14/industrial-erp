import React, { createContext, useContext, useState } from 'react';
import type { User, Role } from '../types/erp';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSales: boolean;
  loginAs: (role: Role) => void;
  logout: () => void;
}

const DEMO_USERS: Record<Role, User> = {
  ADMIN: {
    id: 'a1',
    email: 'admin@erp.com',
    fullName: 'System Administrator',
    role: 'ADMIN',
  },
  SALES: {
    id: 's1',
    email: 'sales@erp.com',
    fullName: 'Senior Sales Executive',
    role: 'SALES',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('erp_active_role');
    if (saved === 'ADMIN' || saved === 'SALES') {
      return DEMO_USERS[saved];
    }
    return null;
  });

  const loginAs = (role: Role) => {
    const selected = DEMO_USERS[role];
    setUser(selected);
    localStorage.setItem('erp_active_role', role);
    localStorage.setItem('erp_token', `jwt-demo-token-${role.toLowerCase()}-12345`);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('erp_active_role');
    localStorage.removeItem('erp_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isSales: user?.role === 'SALES',
        loginAs,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
