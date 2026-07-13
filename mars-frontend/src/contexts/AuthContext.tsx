import { createContext, useContext, useState, type ReactNode } from 'react';

type AuthContextValue = {
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Auth henüz implement edilmedi; iskelet aşamasında uygulama gezilebilir kalsın.
  const [isAuthenticated, setAuthenticated] = useState(true);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setAuthenticated }}>
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
