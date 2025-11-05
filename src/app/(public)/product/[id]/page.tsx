// src/app/product/[id]/page.tsx
// Server Component wrapper.

import { fetchAllProductIdsForStaticExport } from '@/services/public/productService';
import ProductDetailPageClient from './client-page'; // The renamed client component

/**
 * REQUIRED FIX: generateStaticParams function for Static Export.
 * This runs at 'next build' time to pre-render the dynamic routes.
 */
export async function generateStaticParams() {
    console.log('Running generateStaticParams for /product/[id]');
    
    // Fetch all product IDs using the server-side utility
    const ids = await fetchAllProductIdsForStaticExport();
    
    // Map the IDs to the expected params object structure { id: string }[]
    return ids.map(id => ({
        id: id,
    }));
}


/**
 * The main Page Component (Server Component Wrapper).
 */
const ProductDetailPage: React.FC = () => {
    return <ProductDetailPageClient />;
};

export default ProductDetailPage;