import { useAuth } from '@/context/AuthContext';
import { createAuthenticatedClient, getCsrfToken } from '@/utils/ApiClient';
import { Order } from '@/types/order';
import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

const USER_ORDER_API_ENDPOINT = '/user/orders';

/**
 * Custom hook for authenticated user order history and actions.
 */
export const usePublicOrderService = () => {
    const { token, isAuthenticated } = useAuth();

    const getClient = useCallback(() => {
        if (!isAuthenticated || !token) {
            // Throwing an error here prevents unnecessary API calls if the user logs out.
            throw new Error("Authentication required for this operation.");
        }
        return createAuthenticatedClient(token);
    }, [token, isAuthenticated]);

    /**
     * Fetches the authenticated user's list of all orders.
     * Hits: GET /api/user/orders
     */
    const fetchUserOrders = useCallback(async (): Promise<Order[]> => {
        const api = getClient();
        try {
            const response = await api.get<Order[]>(USER_ORDER_API_ENDPOINT);
            return response.data;
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to load order history.';
            // Do not toast on fetch failure, let the page component handle display error.
            throw new Error(msg);
        }
    }, [getClient]);

    /**
     * Fetches details for a specific order.
     * Hits: GET /api/user/orders/{id}
     */
    const fetchUserOrderById = useCallback(async (id: string): Promise<Order> => {
        const api = getClient();
        try {
            const response = await api.get<Order>(`${USER_ORDER_API_ENDPOINT}/${id}`);
            return response.data;
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to load order details.';
            // Do not toast on fetch failure, let the page component handle display error.
            throw new Error(msg);
        }
    }, [getClient]);
    
    /**
     * Cancels an order. Only allowed if status is 'Pending Confirmation'.
     * Hits: POST /api/user/orders/{id}/cancel
     */
    const cancelOrder = useCallback(async (id: string, reason: string) => {
        const api = getClient();
        try {
            await getCsrfToken();
            const response = await api.post(`${USER_ORDER_API_ENDPOINT}/${id}/cancel`, {
                cancel_reason: reason
            });
            // We keep toast here as cancellation is a direct user action.
            toast.success("Order successfully cancelled."); 
            return response.data.order as Order;
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to cancel order.';
            toast.error(msg);
            throw new Error(msg); // Throw to allow component state update (e.g., stopping the spinner)
        }
    }, [getClient]);


    return {
        fetchUserOrders,
        fetchUserOrderById,
        cancelOrder,
    };
};