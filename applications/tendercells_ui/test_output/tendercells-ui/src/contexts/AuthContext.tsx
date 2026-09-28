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
import { AuthContext, type AuthContextType } from './authContextStore';
import { applyPendingWorkspaceReset } from '../services/workspaceReset';

// FIX(2026-09-27): the old "disabled in the public demo" text hid a build that shipped
// without Firebase config; name the real cause so a broken deploy is obvious.
const AUTH_UNCONFIGURED_MESSAGE =
  'Sign-in is unavailable: this build was published without Firebase configuration.';

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
      const finishAuthChange = async () => {
        if (currentUser) {
          try {
            await applyPendingWorkspaceReset(currentUser.uid);
          } catch (resetError) {
            console.error('Workspace reset check failed:', resetError);
          }
        }
        setUser(currentUser);
        setLoading(false);
      };
      void finishAuthChange();
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
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists. Use Login instead.';
    }
    if (code === 'auth/weak-password') {
      return 'Password must be at least 6 characters.';
    }
    if (code === 'auth/invalid-email') {
      return 'Enter a valid email address.';
    }
    if (code === 'auth/network-request-failed' || code === 'auth/internal-error') {
      return 'Could not reach Tender Cells sign-in. Check your connection and try again.';
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
        throw new Error(AUTH_UNCONFIGURED_MESSAGE);
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
        throw new Error(AUTH_UNCONFIGURED_MESSAGE);
      }
      auth.tenantId = null;
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      try {
        await signInWithPopup(auth, provider);
      } catch (err) {
        const code = typeof err === 'object' && err && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
        if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request' || code === 'auth/operation-not-supported-in-this-environment') {
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
        throw new Error(AUTH_UNCONFIGURED_MESSAGE);
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
