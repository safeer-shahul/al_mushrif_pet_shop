// src/app/(admin)/mushrif-admin/products/[id]/page.tsx
// Server Component wrapper.

import { fetchAllProductIdsForStaticExport } from '@/services/admin/productService';
import ProductEditPageClient from './client-page'; // The renamed client component

/**
 * REQUIRED FIX: generateStaticParams function for Static Export.
 * This runs at 'next build' time to pre-render the dynamic routes.
 */
export async function generateStaticParams() {
    console.log('Running generateStaticParams for /mushrif-admin/products/[id]');
    
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
const ProductEditPage: React.FC = () => {
    return <ProductEditPageClient />;
};

export default ProductEditPage;