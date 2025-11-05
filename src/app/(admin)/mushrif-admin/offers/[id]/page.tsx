// src/app/(admin)/mushrif-admin/offers/[id]/page.tsx
// Server Component wrapper.

import { fetchAllOfferIdsForStaticExport } from '@/services/admin/offerService';
import OfferEditPageClient from './client-page';

/**
 * REQUIRED FIX: generateStaticParams function for Static Export.
 * This runs at 'next build' time to pre-render the dynamic routes.
 */
export async function generateStaticParams() {
    console.log('Running generateStaticParams for /mushrif-admin/offers/[id]');
    
    // Fetch all offer IDs using the server-side utility
    const ids = await fetchAllOfferIdsForStaticExport();
    
    // Map the IDs to the expected params object structure { id: string }[]
    return ids.map(id => ({
        id: id,
    }));
}


/**
 * The main Page Component (Server Component Wrapper).
 */
const OfferEditPage: React.FC = () => {
    return <OfferEditPageClient />;
};

export default OfferEditPage;