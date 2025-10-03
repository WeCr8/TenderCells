import React from 'react';
import SignUpForm from '../components/auth/SignUpForm';
import AuthGuard from '../components/auth/AuthGuard';

export default function SignUpPage() {
  return (
    <AuthGuard requireAuth={false} redirectTo="/">
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <SignUpForm />
        </div>
      </div>
    </AuthGuard>
  );
}