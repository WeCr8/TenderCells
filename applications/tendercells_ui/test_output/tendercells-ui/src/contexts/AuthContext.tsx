// AuthContext.tsx - Firebase auth provider for React.
//
// EXPORTS ONLY THE COMPONENT. The context object and its type live in ./authContext, and the
// useAuth hook in ./useAuth, because react-refresh/only-export-components requires a file to
// export components and nothing else - a non-component export here breaks fast refresh for
// every consumer of the provider.
import React, { useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { FIREBASE_ENABLED, auth } from '../lib/firebase/firebaseApp';
import { setAnalyticsUser } from '../analytics';
import { AuthContext, type AuthContextType } from './authContext';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    if (!FIREBASE_ENABLED) {
      setUser(null);
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      // Attribute analytics events to the signed-in user (uid only, not PII);
      // clears attribution on sign-out. No-op if analytics is disabled.
      void setAnalyticsUser(currentUser?.uid ?? null);
    });

    // A popup can be blocked by browser policy or a hosted app's opener policy.
    // Resolve a redirect started by the Google fallback on the next load.
    void getRedirectResult(auth).catch((err) => {
      setError(formatAuthError(err, 'Google login failed'));
    });

    return unsubscribe;
  }, []);

  const formatAuthError = (err: unknown, fallback: string) => {
    const code = typeof err === 'object' && err && 'code' in err
      ? String((err as { code?: unknown }).code)
      : '';

    if (code === 'auth/operation-not-allowed') {
      return 'This sign-in method is not enabled in the Tender Cells Firebase project.';
    }
    if (code === 'auth/unauthorized-domain') {
      return 'This website is not authorized for Tender Cells sign-in. Add its domain in Firebase Authentication settings.';
    }
    if (code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
      return 'The email or password is incorrect.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Google sign-in was closed before it completed.';
    }
    return err instanceof Error ? err.message : fallback;
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      if (!FIREBASE_ENABLED) {
        throw new Error('Authentication is disabled in the public demo.');
      }
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const message = formatAuthError(err, 'Login failed');
      setError(message);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError(null);
      if (!FIREBASE_ENABLED) {
        throw new Error('Authentication is disabled in the public demo.');
      }
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      try {
        await signInWithPopup(auth, provider);
      } catch (err) {
        const code = typeof err === 'object' && err && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
        if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
          await signInWithRedirect(auth, provider);
          return;
        }
        throw err;
      }
    } catch (err) {
      const message = formatAuthError(err, 'Google login failed');
      setError(message);
      throw err;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setError(null);
      if (!FIREBASE_ENABLED) {
        throw new Error('Authentication is disabled in the public demo.');
      }
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const message = formatAuthError(err, 'Registration failed');
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      if (!FIREBASE_ENABLED) {
        setUser(null);
        return;
      }
      await signOut(auth);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    loginWithGoogle,
    register,
    logout,
    clearError: () => setError(null),
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// useAuth moved to ./useAuth - see the header comment.
