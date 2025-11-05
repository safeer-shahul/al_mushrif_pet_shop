// src/app/auth/callback/page.tsx
// This is a Server Component.

import { Suspense } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AuthCallbackPageClient from './client-page';

/**
 * The main page component acts as the Server Component wrapper.
 * We must wrap the client component that uses useSearchParams() in <Suspense /> 
 * to handle the lack of search params during static build time.
 */
const AuthCallbackPage: React.FC = () => {
    return (
        // The Suspense boundary satisfies the Next.js static export requirement.
        <Suspense fallback={
             <div className="flex flex-col items-center justify-center min-h-screen">
                 <LoadingSpinner />
                 <p className="mt-4 text-gray-600">Loading authentication data...</p>
             </div>
        }>
            <AuthCallbackPageClient />
        </Suspense>
    );
};

export default AuthCallbackPage;