// src/services/admin/orderService.ts

import { useAuth } from '@/context/AuthContext';
import { createAuthenticatedClient } from '@/utils/ApiClient';
import { useCallback } from 'react';
import { getCsrfToken } from '@/utils/ApiClient'; 
import { Order } from '@/types/order';

const ADMIN_ORDER_API_ENDPOINT = '/admin/orders/all';
const ADMIN_STATUS_API_ENDPOINT = '/admin/orders';

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
     * Hits: PUT /admin/orders/{id}/status
     */
    const updateOrderStatus = useCallback(async (id: string, status: string, cancelReason?: string) => {
        const api = getClient();
        try {
            await getCsrfToken();
            
            const payload = { 
                status, 
                cancel_reason: cancelReason,
                _method: 'PUT', // Laravel API uses PUT, handle this if necessary
            };
            
            const response = await api.put(`${ADMIN_STATUS_API_ENDPOINT}/${id}/status`, payload);
            return response.data.order as Order;
        } catch (error: any) {
            // IMPORTANT: Extract the error message, especially if it's the stock error from the backend.
            const message = error.response?.data?.message || error.message || 'Failed to update order status.';
            throw new Error(message);
        }
    }, [getClient]);
    const fetchOrderById = useCallback(async (id: string): Promise<Order> => {
            const api = getClient();
            try {
                // Hits GET /admin/orders/{id}
                const response = await api.get<Order>(`/admin/orders/${id}`);
                return response.data;
            } catch (error: any) {
                throw new Error(error.response?.data?.message || 'Failed to load order details.');
            }
    }, [getClient]);

    return {
        fetchAllOrders,
        updateOrderStatus,
        fetchOrderById, // <-- NEW FUNCTION
    };
};