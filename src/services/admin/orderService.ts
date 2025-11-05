import { useAuth } from '@/context/AuthContext';
import { createAuthenticatedClient, publicClient } from '@/utils/ApiClient';
import { useCallback } from 'react';
import { getCsrfToken } from '@/utils/ApiClient'; 
import { Order } from '@/types/order';

const ADMIN_ORDER_API_ENDPOINT = '/admin/orders/all';
const ADMIN_STATUS_API_ENDPOINT = '/admin/orders';
const ADMIN_DETAIL_API_ENDPOINT = '/admin/orders'; 
// CRITICAL FIX: Point to the new public route. This is correct.
const ORDER_STATIC_EXPORT_ENDPOINT = '/public/order-ids'; 

// ---------------------------------------------------------------------
// 1. PUBLIC UTILITY FOR NEXT.JS BUILD (FIXING 404)
// ---------------------------------------------------------------------

/**
 * UTILITY FUNCTION FOR NEXT.JS BUILD (Server-side compatible)
 * Fetches all order IDs for generateStaticParams. Uses publicClient.
 * NOTE: This relies on the new public route /public/order-ids
 */
export const fetchAllOrderIdsForStaticExport = async (): Promise<string[]> => {
    try {
        // Hitting the new public endpoint
        const response = await publicClient.get<string[]>(ORDER_STATIC_EXPORT_ENDPOINT); 

        // The Laravel route returns a direct array of IDs
        const ids = Array.isArray(response.data) ? response.data : [];
            
        return ids.map(id => id.toString());
        
    } catch (error) {
        // Changing the error message to explicitly guide the user on the 404/401 fix path
        console.error('Failed to fetch Order IDs for static export (404/401 - Check Laravel routing/middleware):', error);
        return []; 
    }
}

// ---------------------------------------------------------------------
// 2. AUTHENTICATED HOOK (useAdminOrderService) - (Unchanged)
// ---------------------------------------------------------------------

/**
 * Custom hook for Admin Order API operations.
 */
export const useAdminOrderService = () => {
    const { token } = useAuth();

    const getClient = useCallback(() => {
        if (!token) {
            throw new Error("Authentication token missing.");
        }
        return createAuthenticatedClient(token);
    }, [token]);

    /**
     * Fetches the list of all orders.
     */
    const fetchAllOrders = useCallback(async (): Promise<Order[]> => {
        const api = getClient();
        try {
            const response = await api.get<Order[]>(ADMIN_ORDER_API_ENDPOINT);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to load orders.');
        }
    }, [getClient]);

    /**
     * Updates the status of a specific order.
     */
    const updateOrderStatus = useCallback(async (id: string, status: string, cancelReason?: string) => {
        const api = getClient();
        try {
            await getCsrfToken();
            
            const payload = { 
                status, 
                cancel_reason: cancelReason,
                _method: 'PUT',
            };
            
            const response = await api.put(`${ADMIN_STATUS_API_ENDPOINT}/${id}/status`, payload);
            return response.data.order as Order;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to update order status.';
            throw new Error(message);
        }
    }, [getClient]);

    const fetchOrderById = useCallback(async (id: string): Promise<Order> => {
        const api = getClient();
        try {
            const response = await api.get<Order>(`${ADMIN_DETAIL_API_ENDPOINT}/${id}`); 
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to load order details.');
        }
    }, [getClient]);

    return {
        fetchAllOrders,
        updateOrderStatus,
        fetchOrderById,
    };
};