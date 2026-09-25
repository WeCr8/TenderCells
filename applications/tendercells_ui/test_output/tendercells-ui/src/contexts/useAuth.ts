// useAuth.ts - split out of AuthContext.tsx so that file can export only the AuthProvider
// component (react-refresh/only-export-components).
import { useContext } from 'react';
import { AuthContext } from './authContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
