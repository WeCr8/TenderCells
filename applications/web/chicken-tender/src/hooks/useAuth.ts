import { useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

// Fake user for testing
const fakeUser = {
  id: 'test-user-id',
  email: 'test@wecr8.fun',
  role: 'admin',
};

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  })

  // Check if testing mode is enabled
  const isTesting = import.meta.env.VITE_AUTH_DISABLED === 'true';

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      // If in testing mode, use fake user
      if (isTesting) {
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            user: fakeUser as unknown as User,
            session: { user: fakeUser } as unknown as Session,
            loading: false,
            error: null
          }))
        }
        return;
      }

      try {
        const { session, error } = await authService.getSession()
        
        if (mounted) {
          if (error) {
            setAuthState(prev => ({
              ...prev,
              loading: false,
              error: error.message
            }))
          } else {
            setAuthState(prev => ({
              ...prev,
              user: session?.user || null,
              session,
              loading: false,
              error: null
            }))
          }
        }
      } catch (error) {
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to initialize authentication'
          }))
        }
      }
    }

    initializeAuth()

    // Listen for auth state changes (only if not in testing mode)
    let subscription: { unsubscribe: () => void } | null = null;
    
    if (!isTesting) {
      const { data: { subscription: sub } } = authService.onAuthStateChange((event, session) => {
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            user: session?.user || null,
            session,
            loading: false,
            error: null
          }))
        }
      })
      subscription = sub;
    }

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [isTesting])

  // Sign up with email
  const signUpWithEmail = useCallback(async (email: string, password: string, options?: any) => {
    // If in testing mode, return success with fake user
    if (isTesting) {
      return { success: true, error: null };
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { user, session, error } = await authService.signUpWithEmail({
        email,
        password,
        name: options?.metadata?.name
      })

      if (error) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }))
        return { success: false, error: error.message }
      }

      setAuthState(prev => ({
        ...prev,
        user,
        session,
        loading: false,
        error: null
      }))

      return { success: true, error: null }
    } catch (error) {
      const errorMessage = 'Failed to sign up'
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }, [isTesting])

  // Sign in with email
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    // If in testing mode, return success with fake user
    if (isTesting) {
      setAuthState(prev => ({
        ...prev,
        user: fakeUser as unknown as User,
        session: { user: fakeUser } as unknown as Session,
        loading: false,
        error: null
      }))
      return { success: true, error: null };
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { user, session, error } = await authService.signInWithEmail({
        email,
        password
      })

      if (error) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }))
        return { success: false, error: error.message }
      }

      setAuthState(prev => ({
        ...prev,
        user,
        session,
        loading: false,
        error: null
      }))

      return { success: true, error: null }
    } catch (error) {
      const errorMessage = 'Failed to sign in'
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }, [isTesting])

  // Sign in with OAuth provider
  const signInWithProvider = useCallback(async (provider: 'google' | 'github' | 'discord') => {
    // If in testing mode, return success with fake user
    if (isTesting) {
      setAuthState(prev => ({
        ...prev,
        user: fakeUser as unknown as User,
        session: { user: fakeUser } as unknown as Session,
        loading: false,
        error: null
      }))
      return { success: true, error: null };
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { error } = await authService.signInWithProvider(provider)

      if (error) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }))
        return { success: false, error: error.message }
      }

      // OAuth redirect will handle the rest
      return { success: true, error: null }
    } catch (error) {
      const errorMessage = 'Failed to sign in with provider'
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }, [isTesting])

  // Sign out
  const signOut = useCallback(async () => {
    // If in testing mode, just clear the auth state
    if (isTesting) {
      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null
      });
      return { success: true, error: null };
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { error } = await authService.signOut()

      if (error) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }))
        return { success: false, error: error.message }
      }

      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null
      })

      return { success: true, error: null }
    } catch (error) {
      const errorMessage = 'Failed to sign out'
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }, [isTesting])

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    // If in testing mode, return success
    if (isTesting) {
      return { success: true, error: null };
    }

    try {
      const { error } = await authService.resetPassword(email)
      
      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Failed to send reset email' }
    }
  }, [isTesting])

  // Send magic link
  const sendMagicLink = useCallback(async (options: { email: string, redirectUrl: string, createUser?: boolean }) => {
    // If in testing mode, return success
    if (isTesting) {
      return { success: true, error: null };
    }

    try {
      const { error } = await authService.sendMagicLink(options)
      
      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Failed to send magic link' }
    }
  }, [isTesting])

  // Handle SSO callback
  const handleSSOCallback = useCallback(async (provider: string, code: string, state: string) => {
    // If in testing mode, return success with fake user
    if (isTesting) {
      return { 
        success: true, 
        error: null,
        session: { 
          user: fakeUser as unknown as User,
          accessToken: 'fake-token',
          refreshToken: 'fake-refresh-token',
          expiresAt: Date.now() + 3600000,
          provider: 'fake',
          deviceId: 'fake-device',
          lastActive: new Date().toISOString()
        }
      };
    }

    try {
      const response = await authService.handleSSOCallback(provider, code, state)
      
      if (!response.success) {
        return { success: false, error: response.error }
      }

      // Update auth state with new session
      if (response.session) {
        setAuthState({
          user: response.session.user as unknown as User,
          session: response.session as unknown as Session,
          loading: false,
          error: null
        })
      }

      return response
    } catch (error) {
      return { success: false, error: 'Failed to complete authentication' }
    }
  }, [isTesting])

  // Verify token (for magic links, email verification, etc.)
  const verifyToken = useCallback(async (token: string, type: string) => {
    // If in testing mode, return success with fake user
    if (isTesting) {
      return { 
        success: true, 
        error: null,
        session: { 
          user: fakeUser as unknown as User,
          accessToken: 'fake-token',
          refreshToken: 'fake-refresh-token',
          expiresAt: Date.now() + 3600000,
          provider: 'fake',
          deviceId: 'fake-device',
          lastActive: new Date().toISOString()
        }
      };
    }

    try {
      const response = await authService.verifyToken(token, type)
      
      if (!response.success) {
        return { success: false, error: response.error }
      }

      // Update auth state with new session
      if (response.session) {
        setAuthState({
          user: response.session.user as unknown as User,
          session: response.session as unknown as Session,
          loading: false,
          error: null
        })
      }

      return response
    } catch (error) {
      return { success: false, error: 'Failed to verify token' }
    }
  }, [isTesting])

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    error: authState.error,
    signUpWithEmail,
    signInWithEmail,
    signInWithProvider,
    signOut,
    resetPassword,
    sendMagicLink,
    handleSSOCallback,
    verifyToken,
    isAuthenticated: !!authState.user,
    status: authState.user ? 'authenticated' : authState.loading ? 'loading' : 'unauthenticated',
    clearError: () => setAuthState(prev => ({ ...prev, error: null }))
  }
}