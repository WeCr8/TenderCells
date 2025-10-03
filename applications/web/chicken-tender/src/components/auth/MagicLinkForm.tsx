import React, { useState } from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { useAuth } from '../../hooks/useAuth';

interface MagicLinkFormProps {
  redirectUrl?: string;
  createUser?: boolean;
  onSuccess?: () => void;
  className?: string;
}

export default function MagicLinkForm({ 
  redirectUrl = '/', 
  createUser = false,
  onSuccess,
  className = '' 
}: MagicLinkFormProps) {
  const { sendMagicLink, error, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Check if testing mode is enabled
  const isTesting = import.meta.env.VITE_AUTH_DISABLED === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFormError(null);
    
    if (!email) {
      setFormError('Email is required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await sendMagicLink({
        email,
        redirectUrl,
        createUser
      });
      
      if (response.success) {
        setMagicLinkSent(true);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setFormError(response.error?.message || 'Failed to send magic link');
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-8 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Sign In with Magic Link</h2>
        <p className="text-gray-600 mt-2">
          We'll email you a magic link for a password-free sign in
        </p>
      </div>
      
      {/* Error message */}
      {(formError || error) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {formError || error?.message}
        </div>
      )}
      
      {/* Success message */}
      {magicLinkSent && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          <h3 className="font-medium">Magic link sent!</h3>
          <p>Check your email for a link to sign in.</p>
          {isTesting && (
            <p className="mt-2 text-sm">
              <strong>Testing mode:</strong> In testing mode, no actual email is sent. 
              You can proceed as if you received the link.
            </p>
          )}
        </div>
      )}
      
      {!magicLinkSent && (
        <form onSubmit={handleSubmit} className="space-y-4">
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
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting}
            icon={<ArrowRight className="w-4 h-4" />}
            iconPlacement="right"
          >
            Send Magic Link
          </Button>
        </form>
      )}
      
      {/* Back to sign in */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {magicLinkSent ? (
            <>
              Didn't receive the email?{' '}
              <button
                onClick={() => setMagicLinkSent(false)}
                className="font-medium text-farm-600 hover:text-farm-500"
              >
                Try again
              </button>
            </>
          ) : (
            <>
              Remember your password?{' '}
              <a href="/signin" className="font-medium text-farm-600 hover:text-farm-500">
                Sign in
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}