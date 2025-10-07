// src/app/(auth)/login/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { publicClient, getCsrfToken } from '@/utils/ApiClient';
import LoginForm from '@/components/auth/LoginForm';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';

const API_LOGIN_ENDPOINT = '/auth/login'; // Adjust to your actual Laravel endpoint

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleLoginSuccess = (user: any, token: string) => {
    // Check for admin/staff roles and redirect unauthorized users away from the public site if needed,
    // though the backend should handle this segregation. For now, just log in and redirect.
    login(user, token);
    router.push('/');
  };

  const handleSubmit = async (email: string, password: string) => {
    setError(null);
    try {
      // 1. Get the CSRF token first
      await getCsrfToken();

      // 2. Submit credentials
      const response = await publicClient.post(API_LOGIN_ENDPOINT, {
        email,
        password,
      });

      // The Laravel API should return the user object and JWT token on successful login
      const { user, access_token } = response.data;
      
      if (!user || !access_token) {
        throw new Error("Invalid response format from server.");
      }

      handleLoginSuccess(user, access_token);

    } catch (err: any) {
      console.error('Login error:', err);
      // Display specific error message from the API or a general one
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          Customer Login
        </h2>
        
        {error && (
          <div className="p-3 text-sm font-medium text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <LoginForm onSubmit={handleSubmit} />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 bg-white">OR</span>
          </div>
        </div>

        <GoogleLoginButton type="customer" />

        <p className="text-sm text-center text-gray-600">
          Don't have an account? <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;