// src/app/(auth)/mushrif-admin-login/page.tsx
// This is a Server Component.

import { Suspense } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AdminLoginPageClient from './client-page'; // Import the client component

/**
 * The main page component acts as the Server Component wrapper.
 * We must wrap the client component that uses useSearchParams() in <Suspense /> 
 * to allow the page to be statically exported.
 */
const AdminLoginPage: React.FC = () => {
    return (
        <Suspense fallback={
             <div className="flex items-center justify-center min-h-screen bg-gray-50">
                 <LoadingSpinner />
                 <p className="mt-4 text-gray-600">Loading page...</p>
             </div>
        }>
            <AdminLoginPageClient />
        </Suspense>
    );
};

export default AdminLoginPage;