// src/app/(auth)/mushrif-admin-login/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import { loginUser } from '@/utils/authApi';

const AdminLoginPage: React.FC = () => {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  // NEW: Check for errors coming back from Google OAuth redirect (Laravel)
  useEffect(() => {
    const queryError = searchParams.get('error');
    if (queryError) {
      setError(decodeURIComponent(queryError));
    }
  }, [searchParams]);

  const handleLoginSuccess = (user: any, token: string) => {
    // Crucial check: only allow superuser/staff to proceed
    if (user.is_superuser || user.is_staff) {
      login(user, token);
      router.push('/mushrif-admin'); // Redirect to the admin dashboard root
    } else {
      // Deny access and redirect non-staff users (Failsafe for traditional login)
      setError('Access Denied: Only staff and superusers can log in here. Redirecting to customer login...');
      // In a real application, you might also call useAuth().logout() here.
      setTimeout(() => router.replace('/login'), 3000); 
    }
  };

  const handleSubmit = async (identifier: string, password: string) => {
    setError(null);
    try {
      const { user, access_token } = await loginUser(identifier, password);
      handleLoginSuccess(user, access_token);
    } catch (err: any) {
      console.error('Admin Login error:', err.message);
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl dark:bg-gray-800">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white">
          Mushrif Admin Access
        </h2>
        
        {error && (
          <div className="p-3 text-sm font-medium text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-100">
            {error}
          </div>
        )}

        <LoginForm 
          onSubmit={handleSubmit} 
          emailLabel="Staff Email or Username" 
        />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-400">OR</span>
          </div>
        </div>

        <GoogleLoginButton type="admin" />
      </div>
    </div>
  );
};

export default AdminLoginPage;