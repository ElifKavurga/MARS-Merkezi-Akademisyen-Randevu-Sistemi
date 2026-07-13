import { createContext, useContext, useState, type ReactNode } from 'react';
import { STORAGE_KEYS } from '../constants/storage';
import type { AuthUser, LoginResponse } from '../types/auth';

type AuthContextValue = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  setSession: (loginResponse: LoginResponse) => void;
  clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.TOKEN));
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  const setSession = (loginResponse: LoginResponse) => {
    const nextUser: AuthUser = {
      userId: loginResponse.userId,
      fullName: loginResponse.fullName,
      institutionalEmail: loginResponse.institutionalEmail,
      role: loginResponse.role,
    };

    localStorage.setItem(STORAGE_KEYS.TOKEN, loginResponse.token);
    localStorage.setItem(STORAGE_KEYS.TOKEN_TYPE, loginResponse.type);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(nextUser));

    setToken(loginResponse.token);
    setUser(nextUser);
  };

  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_TYPE);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(token),
        user,
        token,
        setSession,
        clearSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
