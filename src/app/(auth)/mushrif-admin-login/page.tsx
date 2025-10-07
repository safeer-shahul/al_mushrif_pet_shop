// src/app/(auth)/mushrif-admin-login/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { publicClient, getCsrfToken } from '@/utils/ApiClient';
import LoginForm from '@/components/auth/LoginForm';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';

const API_ADMIN_LOGIN_ENDPOINT = '/auth/staff/login'; // Assuming a dedicated admin login endpoint

const AdminLoginPage: React.FC = () => {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleLoginSuccess = (user: any, token: string) => {
    // Crucial check: only allow superuser/staff to proceed
    if (user.is_superuser || user.is_staff) {
      login(user, token);
      router.push('/mushrif-admin'); // Redirect to the admin dashboard root
    } else {
      // Prevent non-staff users from logging in via this dedicated page
      setError('Access Denied: Only staff and superusers can log in here.');
      // You might also want to clear their token/state here if the backend didn't
    }
  };

  const handleSubmit = async (email: string, password: string) => {
    setError(null);
    try {
      await getCsrfToken();
      const response = await publicClient.post(API_ADMIN_LOGIN_ENDPOINT, {
        email,
        password,
      });

      const { user, access_token } = response.data;
      
      if (!user || !access_token) {
        throw new Error("Invalid response format from server.");
      }

      handleLoginSuccess(user, access_token);

    } catch (err: any) {
      console.error('Admin Login error:', err);
      setError(err.response?.data?.message || 'Admin login failed. Check credentials and permissions.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl">
        <h2 className="text-3xl font-extrabold text-center text-gray-900">
          Mushrif Admin Access
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

        <GoogleLoginButton type="admin" />
      </div>
    </div>
  );
};

export default AdminLoginPage;