// src/app/(admin)/mushrif-admin/brands/[id]/page.tsx
// Server Component wrapper

import { fetchAllBrandIdsForStaticExport } from '@/services/admin/brandService';
import BrandEditPageClient from './client-page'; 

/**
 * REQUIRED FIX: generateStaticParams function for Static Export.
 * This runs at 'next build' time to pre-render the dynamic routes.
 */
export async function generateStaticParams() {
    console.log('Running generateStaticParams for /mushrif-admin/brands/[id]');
    
    const ids = await fetchAllBrandIdsForStaticExport();
    
    return ids.map(id => ({
        id: id,
    }));
}


/**
 * The main Page Component (Server Component Wrapper).
 */
const BrandEditPage: React.FC = () => {
    return <BrandEditPageClient />;
};

export default BrandEditPage;