/**
 * Type definitions for authentication and SSO
 */

export type AuthProvider = 'google' | 'apple' | 'microsoft' | 'github' | 'email';

export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'other';

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  provider: AuthProvider;
  deviceId: string;
  lastActive: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  metadata?: Record<string, any>;
}

export interface AuthDevice {
  id: string;
  name: string;
  type: DeviceType;
  lastActive: string;
  browser?: string;
  os?: string;
  isCurrent: boolean;
}

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface AuthOptions {
  redirectUrl?: string;
  scopes?: string[];
  rememberMe?: boolean;
  captchaToken?: string;
}

export interface AuthState {
  status: AuthStatus;
  session: AuthSession | null;
  user: AuthUser | null;
  devices: AuthDevice[];
  error: AuthError | null;
  isLoading: boolean;
}

export interface AuthResponse {
  success: boolean;
  session?: AuthSession;
  error?: AuthError;
  redirectUrl?: string;
}

export interface MagicLinkOptions {
  email: string;
  redirectUrl: string;
  createUser?: boolean;
}

export interface VerifyOptions {
  token: string;
  type: 'email' | 'phone' | 'totp';
}

export interface SSOState {
  provider: AuthProvider;
  state: string;
  codeVerifier: string;
  redirectUrl: string;
}