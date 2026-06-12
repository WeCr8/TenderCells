import { supabase } from './supabaseClient'
import type { User, Session, AuthError } from '@supabase/supabase-js'

export interface SignUpData {
  email: string
  password: string
  name?: string
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthResponse {
  user: User | null
  session: Session | null
  error: AuthError | null
}

export interface MagicLinkOptions {
  email: string
  redirectUrl: string
  createUser?: boolean
}

class AuthService {
  // Sign up with email and password
  async signUpWithEmail(data: SignUpData): Promise<AuthResponse> {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name || '',
          }
        }
      })

      return {
        user: authData.user,
        session: authData.session,
        error
      }
    } catch (error) {
      console.error('Sign up error:', error)
      return {
        user: null,
        session: null,
        error: error as AuthError
      }
    }
  }

  // Sign in with email and password
  async signInWithEmail(data: SignInData): Promise<AuthResponse> {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      return {
        user: authData.user,
        session: authData.session,
        error
      }
    } catch (error) {
      console.error('Sign in error:', error)
      return {
        user: null,
        session: null,
        error: error as AuthError
      }
    }
  }

  // Sign in with OAuth provider
  // Note: Cross-Origin-Opener-Policy (COOP) warnings may appear in the console when using OAuth.
  // These warnings are from Supabase's internal OAuth implementation checking window.closed/close
  // and are harmless - they don't affect functionality. The OAuth flow uses redirects, not popups.
  async signInWithProvider(provider: 'google' | 'github' | 'discord'): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      return { error }
    } catch (error) {
      console.error('Provider sign in error:', error)
      return { error: error as AuthError }
    }
  }

  // Sign out
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error: error as AuthError }
    }
  }

  // Get current session
  async getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.getSession()
      return {
        session: data.session,
        error
      }
    } catch (error) {
      console.error('Get session error:', error)
      return {
        session: null,
        error: error as AuthError
      }
    }
  }

  // Get current user
  async getUser(): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.getUser()
      return {
        user: data.user,
        error
      }
    } catch (error) {
      console.error('Get user error:', error)
      return {
        user: null,
        error: error as AuthError
      }
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }

  // Reset password
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      return { error }
    } catch (error) {
      console.error('Reset password error:', error)
      return { error: error as AuthError }
    }
  }

  // Update password
  async updatePassword(password: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password
      })
      return { error }
    } catch (error) {
      console.error('Update password error:', error)
      return { error: error as AuthError }
    }
  }

  // Send magic link
  async sendMagicLink(options: MagicLinkOptions): Promise<{ error: Error | null }> {
    try {
      // Call the auth-magic-link edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          email: options.email,
          redirectUrl: options.redirectUrl,
          createUser: options.createUser
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: new Error(errorData.error || 'Failed to send magic link') };
      }

      return { error: null };
    } catch (error) {
      console.error('Send magic link error:', error);
      return { error: error as Error };
    }
  }

  // Handle SSO callback
  async handleSSOCallback(provider: string, code: string, state: string): Promise<any> {
    try {
      // Call the auth-sso edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-sso/${provider}/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          code,
          code_verifier: localStorage.getItem(`${provider}_code_verifier`),
          redirect_uri: `${window.location.origin}/auth/callback/${provider}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to complete authentication' };
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('SSO callback error:', error);
      return { success: false, error: 'Failed to complete authentication' };
    }
  }

  // Verify token (for magic links, email verification, etc.)
  async verifyToken(token: string, type: string): Promise<any> {
    try {
      // Call the auth-verify edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          token,
          type
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to verify token' };
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('Token verification error:', error);
      return { success: false, error: 'Failed to verify token' };
    }
  }
}

export const authService = new AuthService()