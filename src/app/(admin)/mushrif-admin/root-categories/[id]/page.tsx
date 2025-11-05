// src/app/(admin)/mushrif-admin/root-categories/[id]/page.tsx
// This is the new Server Component wrapper.

import { fetchAllRootCategoryIdsForStaticExport } from '@/services/admin/categoryService';
import RootCategoryEditPageClient from './client-page'; 

/**
 * REQUIRED FIX: generateStaticParams function for Static Export.
 * This function runs at 'next build' time to pre-render the dynamic routes.
 */
export async function generateStaticParams() {
    console.log('Running generateStaticParams for /mushrif-admin/root-categories/[id]');
    
    // Fetch all category IDs using the server-side utility
    const ids = await fetchAllRootCategoryIdsForStaticExport();
    
    // Map the IDs to the expected params object structure { id: string }[]
    return ids.map(id => ({
        id: id,
    }));
}


/**
 * The main Page Component (Server Component Wrapper).
 * It simply renders the client component.
 */
const RootCategoryEditPage: React.FC = () => {
    return <RootCategoryEditPageClient />;
};

export default RootCategoryEditPage;