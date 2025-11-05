// src/app/(admin)/mushrif-admin/orders/[id]/page.tsx
// Server Component wrapper.

import { fetchAllOrderIdsForStaticExport } from '@/services/admin/orderService';
import AdminOrderDetailPageClient from './client-page';

/**
 * REQUIRED FIX: generateStaticParams function for Static Export.
 * This runs at 'next build' time to pre-render the dynamic routes.
 */
export async function generateStaticParams() {
    console.log('Running generateStaticParams for /mushrif-admin/orders/[id]');
    
    // Fetch all order IDs using the server-side utility
    const ids = await fetchAllOrderIdsForStaticExport();
    
    // Map the IDs to the expected params object structure { id: string }[]
    return ids.map(id => ({
        id: id,
    }));
}


/**
 * The main Page Component (Server Component Wrapper).
 */
const AdminOrderDetailPage: React.FC = () => {
    return <AdminOrderDetailPageClient />;
};

export default AdminOrderDetailPage;