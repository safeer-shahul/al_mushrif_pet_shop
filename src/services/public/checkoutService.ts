// src/services/public/checkoutService.ts
import { publicClient, getCsrfToken } from '@/utils/ApiClient';
import { useAuth } from '@/context/AuthContext';
import { useCallback } from 'react';
import { Address } from '@/types/user'; // Assuming types/user.ts defines Address

// Simplified Order Response Type
interface OrderResponse {
    message: string;
    order: {
        id: string;
        payable_price: number;
        // Include other order fields as needed (Laravel's response should contain these)
    };
}

/**
 * Custom hook for public checkout and order actions.
 */
export const useCheckoutService = () => {
    const { isAuthenticated, token } = useAuth();
    
    // Helper to get the client (enforces authentication for order placement)
    const getClient = useCallback(() => {
        if (!isAuthenticated || !token) {
            throw new Error("Authentication required for order placement.");
        }
        return publicClient; // Public client handles the bearer token via interceptor
    }, [isAuthenticated, token]);


    /**
     * Places the final COD order.
     */
    const placeOrder = useCallback(async (addressId: string): Promise<OrderResponse> => {
        const api = getClient();
        try {
            await getCsrfToken();
            
            const response = await api.post<OrderResponse>('/user/orders', {
                address_id: addressId,
                payment_mode: 'COD', // Always COD for MVP
            });

            return response.data;

        } catch (error: any) {
            const msg = error.response?.data?.message || 'Order failed. Check cart and authentication.';
            throw new Error(msg);
        }
    }, [getClient]);

    return {
        placeOrder,
    };
};