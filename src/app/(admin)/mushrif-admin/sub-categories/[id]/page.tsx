// src/app/(admin)/mushrif-admin/sub-categories/[id]/page.tsx
// Server Component wrapper.

import { fetchAllSubCategoryIdsForStaticExport } from '@/services/admin/categoryService';
import SubCategoryEditPageClient from './client-page'; // The renamed client component

/**
 * REQUIRED FIX: generateStaticParams function for Static Export.
 * This runs at 'next build' time to pre-render the dynamic routes.
 */
export async function generateStaticParams() {
    console.log('Running generateStaticParams for /mushrif-admin/sub-categories/[id]');
    
    // Fetch all sub-category IDs using the server-side utility
    const ids = await fetchAllSubCategoryIdsForStaticExport();
    
    // Map the IDs to the expected params object structure { id: string }[]
    return ids.map(id => ({
        id: id,
    }));
}


/**
 * The main Page Component (Server Component Wrapper).
 */
const SubCategoryEditPage: React.FC = () => {
    return <SubCategoryEditPageClient />;
};

export default SubCategoryEditPage;