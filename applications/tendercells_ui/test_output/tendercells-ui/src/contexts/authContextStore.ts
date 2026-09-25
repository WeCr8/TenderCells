// authContext.ts - the context object and its type, split out of AuthContext.tsx so that
// file can export only the AuthProvider component (react-refresh/only-export-components).
import { createContext } from 'react';
import type { User } from 'firebase/auth';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
