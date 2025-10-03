import React from 'react';
import { useLocation } from 'react-router-dom';
import SignInForm from '../components/auth/SignInForm';
import AuthGuard from '../components/auth/AuthGuard';

export default function SignInPage() {
  const location = useLocation();
  const from = location.state?.from || '/';

  return (
    <AuthGuard requireAuth={false} redirectTo="/">
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <SignInForm redirectUrl={from} />
        </div>
      </div>
    </AuthGuard>
  );
}