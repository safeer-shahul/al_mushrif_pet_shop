// src/app/(auth)/login/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
// IMPORT THE NEW API UTILITY
import { loginUser } from '@/utils/authApi'; 

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleLoginSuccess = (user: any, token: string) => {
    login(user, token);
    router.push('/');
  };

  // REFACTORED: Now uses the centralized loginUser function
  const handleSubmit = async (identifier: string, password: string) => {
    setError(null);
    try {
      const { user, access_token } = await loginUser(identifier, password);
      
      handleLoginSuccess(user, access_token);

    } catch (err: any) {
      // Catch the formatted error message from loginUser
      console.error('Login error:', err.message);
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg dark:bg-gray-800">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
          Customer Login
        </h2>
        
        {error && (
          <div className="p-3 text-sm font-medium text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-100">
            {error}
          </div>
        )}

        <LoginForm onSubmit={handleSubmit} />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-400">OR</span>
          </div>
        </div>

        <GoogleLoginButton type="customer" />

        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          Don't have an account? <Link href="/register" className="font-medium text-primary hover:text-primary-light">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;