// src/services/public/checkoutService.ts - UPDATED
import { createAuthenticatedClient, getCsrfToken } from '@/utils/ApiClient';
import { useAuth } from '@/context/AuthContext';
import { useCallback } from 'react';

// Simplified Order Response Type
interface OrderResponse {
    message: string;
    order: {
        id: string;
        payable_price: number;
        // Include other order fields as needed
    };
}

/**
 * Custom hook for public checkout and order actions.
 */
export const useCheckoutService = () => {
    const { isAuthenticated, token } = useAuth();
    
    /**
     * Places the final COD order.
     */
    const placeOrder = useCallback(async (addressId: string): Promise<OrderResponse> => {
    if (!isAuthenticated || !token) {
        throw new Error("Authentication required for order placement.");
    }
    
    try {
        // Get a CSRF token first
        await getCsrfToken();
        
        // Create an authenticated client with the token
        const api = createAuthenticatedClient(token);
        
        // Add some debug logging
        console.log('Placing order with address ID:', addressId);
        
        const response = await api.post<OrderResponse>('/user/orders', {
            address_id: addressId,
            payment_mode: 'COD'
        });

        return response.data;
    } catch (error: any) {
        // Enhanced error handling for 422 errors
        if (error.response?.status === 422) {
            // Laravel validation errors come in error.response.data.errors
            const validationErrors = error.response.data.errors || {};
            console.error('Validation errors:', validationErrors);
            
            // Check for specific validation errors
            if (validationErrors.address_id) {
                throw new Error(`Address error: ${validationErrors.address_id[0]}`);
            }
            
            if (validationErrors.cart) {
                throw new Error(`Cart error: ${validationErrors.cart[0]}`);
            }
            
            // Generic validation error message
            const errorMessages = Object.entries(validationErrors)
                .map(([field, msgs]) => `${field}: ${(msgs as string[])[0]}`)
                .join(', ');
                
            throw new Error(`Validation failed: ${errorMessages || 'Unknown validation error'}`);
        }
        
        // Regular error handling for other errors
        console.error('Order placement error:', error.response?.data || error);
        const msg = error.response?.data?.message || 'Order failed. Please try again.';
        throw new Error(msg);
    }
}, [isAuthenticated, token]);

    return {
        placeOrder,
    };
};