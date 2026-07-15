import { createContext } from 'react';
import type { AuthUser, LoginResponse } from '../types/auth';

export type AuthContextValue = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  setSession: (loginResponse: LoginResponse) => void;
  clearSession: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
