// src/app/(public)/products/page.tsx
// This is a Server Component.

import { Suspense } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProductListingPageClient from './client-page';

/**
 * The main page component acts as the Server Component wrapper.
 * We wrap the client component that uses useSearchParams() in <Suspense />
 * to allow the page to be statically exported without error.
 */
const ProductListingPage: React.FC = () => {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
                <p className="mt-4 text-gray-600">Loading product catalog...</p>
            </div>
        }>
            <ProductListingPageClient />
        </Suspense>
    );
};

export default ProductListingPage;