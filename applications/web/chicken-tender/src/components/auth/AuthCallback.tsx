import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { AuthProvider } from '../../types/auth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleSSOCallback, verifyToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Check if testing mode is enabled
  const isTesting = import.meta.env.VITE_AUTH_DISABLED === 'true';

  useEffect(() => {
    const processCallback = async () => {
      try {
        // If in testing mode, just redirect to home
        if (isTesting) {
          const redirectTo = new URLSearchParams(location.search).get('redirect_uri') || '/';
          navigate(redirectTo, { replace: true });
          return;
        }

        // Parse URL parameters
        const params = new URLSearchParams(location.search);
        
        // Check for token parameter (magic link)
        const token = params.get('token');
        const type = params.get('type');
        
        if (token && type) {
          // Handle magic link or other token-based auth
          const response = await verifyToken(token, type);
          
          if (!response.success) {
            throw new Error(response.error?.message || 'Failed to verify token');
          }
          
          // Redirect to the intended destination or home
          const redirectTo = params.get('redirect_uri') || '/';
          navigate(redirectTo, { replace: true });
          return;
        }
        
        // Check for OAuth callback parameters
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        
        // Check for errors from the provider
        if (error) {
          throw new Error(errorDescription || `Authentication error: ${error}`);
        }
        
        // Ensure we have the required parameters
        if (!code || !state) {
          throw new Error('Invalid callback: missing required parameters');
        }
        
        // Determine the provider from the URL path
        const pathSegments = location.pathname.split('/');
        const providerSegment = pathSegments[pathSegments.length - 1];
        const provider = providerSegment as AuthProvider;
        
        // Handle the callback
        const response = await handleSSOCallback(provider, code, state);
        
        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to complete authentication');
        }
        
        // Redirect to the intended destination or home
        const redirectTo = params.get('redirect_uri') || '/';
        navigate(redirectTo, { replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
      }
    };
    
    processCallback();
  }, [location, handleSSOCallback, navigate, verifyToken, isTesting]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/signin', { replace: true })}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-farm-600 hover:bg-farm-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-farm-500"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <Loader2 className="animate-spin h-12 w-12 text-farm-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing Sign In</h2>
          <p className="text-gray-600">Please wait while we authenticate your account...</p>
          {isTesting && (
            <p className="mt-4 text-sm text-blue-700">
              <strong>Testing Mode:</strong> You will be redirected automatically.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}