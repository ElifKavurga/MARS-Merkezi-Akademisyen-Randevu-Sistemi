import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { STORAGE_KEYS } from '../constants/storage';
import {
  registerClearSessionHandler,
  unregisterClearSessionHandler,
} from '../services/authSessionBridge';
import type { AuthUser, LoginResponse } from '../types/auth';
import { AuthContext } from './authContextBase';

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

function toAuthUser(loginResponse: LoginResponse): AuthUser {
  return {
    userId: loginResponse.userId,
    fullName: loginResponse.fullName,
    institutionalEmail: loginResponse.institutionalEmail,
    role: loginResponse.role,
    department: loginResponse.department,
    isActive: loginResponse.isActive,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.TOKEN));
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  const setSession = useCallback((loginResponse: LoginResponse) => {
    const nextUser = toAuthUser(loginResponse);

    localStorage.setItem(STORAGE_KEYS.TOKEN, loginResponse.token);
    localStorage.setItem(STORAGE_KEYS.TOKEN_TYPE, loginResponse.type);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(nextUser));

    setToken(loginResponse.token);
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_TYPE);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    registerClearSessionHandler(clearSession);
    return () => unregisterClearSessionHandler(clearSession);
  }, [clearSession]);

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
