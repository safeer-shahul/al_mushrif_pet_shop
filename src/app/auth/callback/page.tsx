// src/app/auth/callback/page.tsx
'use client';

import { useEffect, useRef } from 'react'; // Import useRef to prevent double execution
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const AuthCallbackPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  // Use a ref to ensure the logic only runs once, preventing infinite loop
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing, especially important in development Strict Mode
    if (hasProcessed.current) return;

    const token = searchParams.get('token'); 
    const userDataJson = searchParams.get('user'); 
    const isError = searchParams.get('error');
    const redirectPath = searchParams.get('redirect') || '/'; // Default to homepage

    if (isError) {
      console.error('OAuth Callback Error:', isError);
      const targetLoginPath = redirectPath === '/mushrif-admin' ? '/mushrif-admin-login' : '/login';
      
      hasProcessed.current = true;
      // Redirect to the login page with the error
      router.replace(`${targetLoginPath}?error=${isError}`);
      return;
    }

    if (token && userDataJson) {
      if (!hasProcessed.current) {
        try {
          const user = JSON.parse(userDataJson);
          
          login(user, token);
          
          // CRITICAL: Mark as processed immediately before navigation
          hasProcessed.current = true;
          
          // Navigate to the final destination, removing the token/user data from the URL history
          // This breaks the loop by navigating to a clean URL.
          router.replace(redirectPath);

        } catch (e) {
          console.error('Failed to parse user data or process login:', e);
          hasProcessed.current = true;
          router.replace('/login?error=processing_failed');
        }
      }
    } else if (!isError && !token) {
        // If no token or error, and we haven't processed, default back to login 
        // (This handles users landing here without any query parameters)
        hasProcessed.current = true;
        router.replace('/login?error=auth_data_missing');
    }

    // Dependency array is empty or minimal to control execution
  }, [searchParams, router, login]); 

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <LoadingSpinner />
      <p className="mt-4 text-gray-600">Processing authentication...</p>
    </div>
  );
};

export default AuthCallbackPage;