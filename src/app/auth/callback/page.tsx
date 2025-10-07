// src/app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const AuthCallbackPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token'); // Expected JWT token
    const userDataJson = searchParams.get('user'); // Expected JSON string of user data
    const isError = searchParams.get('error');

    if (isError) {
      console.error('OAuth Callback Error:', isError);
      alert('Authentication failed: ' + isError);
      router.replace('/login');
      return;
    }

    if (token && userDataJson) {
      try {
        const user = JSON.parse(userDataJson);
        
        if (user.is_superuser || user.is_staff) {
          // If the user is staff/superuser, redirect them to the admin dashboard
          login(user, token);
          router.replace('/mushrif-admin');
        } else {
          // Standard customer, redirect to the homepage
          login(user, token);
          router.replace('/');
        }
      } catch (e) {
        console.error('Failed to parse user data or process login:', e);
        router.replace('/login?error=processing_failed');
      }
    } else {
      // No token/data found, redirect to login with a generic error
      router.replace('/login?error=auth_data_missing');
    }
  }, [searchParams, router, login]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <LoadingSpinner />
      <p className="mt-4 text-gray-600">Processing authentication...</p>
    </div>
  );
};

export default AuthCallbackPage;