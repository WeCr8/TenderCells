import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  requireAuth = true,
  redirectTo = '/signin'
}: AuthGuardProps) {
  const { status, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if testing mode is enabled
  const isTesting = import.meta.env.VITE_AUTH_DISABLED === 'true';

  useEffect(() => {
    // Skip auth checks if in testing mode
    if (isTesting) {
      return;
    }

    if (!isLoading) {
      const isAuthenticated = status === 'authenticated';
      
      if (requireAuth && !isAuthenticated) {
        // Redirect to login if authentication is required but user is not authenticated
        navigate(redirectTo, { 
          state: { from: location.pathname },
          replace: true 
        });
      } else if (!requireAuth && isAuthenticated) {
        // Redirect to home if authentication is not required but user is authenticated
        navigate('/', { replace: true });
      }
    }
  }, [status, isLoading, requireAuth, navigate, redirectTo, location, isTesting]);

  if (isLoading && !isTesting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-farm-600 animate-spin" />
      </div>
    );
  }

  // If in testing mode, always render children
  if (isTesting) {
    return <>{children}</>;
  }

  // If requireAuth is true and user is authenticated, or
  // if requireAuth is false and user is not authenticated, render children
  if ((requireAuth && status === 'authenticated') || 
      (!requireAuth && status === 'unauthenticated')) {
    return <>{children}</>;
  }

  // This should not be visible due to the redirect in useEffect,
  // but it's a fallback just in case
  return null;
}