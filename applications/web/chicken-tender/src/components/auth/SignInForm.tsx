import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { useAuth } from '../../hooks/useAuth';
import type { AuthProvider } from '../../types/auth';

interface SignInFormProps {
  redirectUrl?: string;
  onSuccess?: () => void;
  className?: string;
}

export default function SignInForm({ 
  redirectUrl = '/', 
  onSuccess,
  className = '' 
}: SignInFormProps) {
  const navigate = useNavigate();
  const { signInWithEmail, signInWithProvider, sendMagicLink, error, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Check if testing mode is enabled
  const isTesting = import.meta.env.VITE_AUTH_DISABLED === 'true';

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFormError(null);
    
    if (!email) {
      setFormError('Email is required');
      return;
    }
    
    if (!password) {
      setFormError('Password is required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await signInWithEmail(email, password, { 
        redirectUrl, 
        rememberMe 
      });
      
      if (response.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(redirectUrl);
        }
      } else {
        setFormError(response.error?.message || 'Failed to sign in');
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProviderSignIn = async (provider: AuthProvider) => {
    clearError();
    setFormError(null);
    
    try {
      await signInWithProvider(provider, { redirectUrl });
      // The page will be redirected to the provider's login page
      // or in testing mode, will be automatically signed in
      if (isTesting) {
        navigate(redirectUrl);
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to sign in with provider');
    }
  };

  const handleSendMagicLink = async () => {
    clearError();
    setFormError(null);
    
    if (!email) {
      setFormError('Email is required');
      return;
    }
    
    setIsSendingMagicLink(true);
    
    try {
      const response = await sendMagicLink({
        email,
        redirectUrl,
        createUser: false
      });
      
      if (response.success) {
        setMagicLinkSent(true);
        if (isTesting) {
          // In testing mode, automatically redirect after a short delay
          setTimeout(() => {
            navigate(redirectUrl);
          }, 1500);
        }
      } else {
        setFormError(response.error?.message || 'Failed to send magic link');
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-8 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
        <p className="text-gray-600 mt-2">Welcome back to Chicken Tender</p>
      </div>
      
      {/* Error message */}
      {(formError || error) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {formError || error?.message}
        </div>
      )}
      
      {/* Magic link success message */}
      {magicLinkSent && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          Magic link sent! Check your email to sign in.
          {isTesting && (
            <p className="mt-2 text-sm">
              <strong>Testing mode:</strong> In testing mode, no actual email is sent. 
              You will be automatically redirected.
            </p>
          )}
        </div>
      )}
      
      {/* Email/Password Form */}
      <form onSubmit={handleEmailSignIn} className="space-y-4 mb-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-farm-500 focus:border-farm-500"
              placeholder="you@example.com"
              disabled={isSubmitting || isSendingMagicLink}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-farm-500 focus:border-farm-500"
              placeholder="••••••••"
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-farm-600 focus:ring-farm-500 border-gray-300 rounded"
              disabled={isSubmitting}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
          
          <div className="text-sm">
            <a href="#" className="font-medium text-farm-600 hover:text-farm-500">
              Forgot password?
            </a>
          </div>
        </div>
        
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isSubmitting}
          disabled={isSubmitting || isSendingMagicLink}
        >
          Sign In
        </Button>
      </form>
      
      {/* Magic Link Option */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>
      
      <div className="space-y-3">
        {/* Magic Link Button */}
        <Button
          variant="outline"
          fullWidth
          icon={<Mail className="w-5 h-5" />}
          onClick={handleSendMagicLink}
          loading={isSendingMagicLink}
          disabled={isSubmitting || isSendingMagicLink || !email}
        >
          {magicLinkSent ? 'Magic Link Sent' : 'Sign in with Magic Link'}
        </Button>
        
        {/* SSO Providers */}
        <Button
          variant="outline"
          fullWidth
          onClick={() => handleProviderSignIn('google')}
          disabled={isSubmitting || isSendingMagicLink}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
            />
          </svg>
          Sign in with Google
        </Button>
        
        <Button
          variant="outline"
          fullWidth
          onClick={() => handleProviderSignIn('apple')}
          disabled={isSubmitting || isSendingMagicLink}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z"
            />
          </svg>
          Sign in with Apple
        </Button>
        
        <Button
          variant="outline"
          fullWidth
          onClick={() => handleProviderSignIn('microsoft')}
          disabled={isSubmitting || isSendingMagicLink}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"
            />
          </svg>
          Sign in with Microsoft
        </Button>
      </div>
      
      {/* Sign Up Link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/signup" className="font-medium text-farm-600 hover:text-farm-500">
            Sign up
          </a>
        </p>
      </div>

      {/* Testing mode notice */}
      {isTesting && (
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Testing Mode Active:</strong> Authentication is disabled. Click any sign-in method to proceed.
          </p>
        </div>
      )}
    </div>
  );
}