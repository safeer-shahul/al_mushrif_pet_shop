// src/services/public/addressService.ts
import { publicClient, getCsrfToken, createAuthenticatedClient } from '@/utils/ApiClient';
import { useAuth } from '@/context/AuthContext';
import { useCallback } from 'react';
import { Address } from '@/types/user';

const ADDRESS_API_ENDPOINT = '/user/addresses';

/**
 * Custom hook for managing user addresses (CRUD).
 */
export const useAddressService = () => {
    const { isAuthenticated, token } = useAuth();
    
    // Helper to get the authenticated client (enforces authentication)
    const getClient = useCallback(() => {
        if (!isAuthenticated || !token) {
            throw new Error("Authentication required for address operations.");
        }
        return publicClient; // Uses the token via the client interceptor
    }, [isAuthenticated, token]);


    /**
     * Fetches all addresses for the authenticated user.
     */
    const fetchUserAddresses = useCallback(async (): Promise<Address[]> => {
        const api = getClient();
        try {
            // Hitting the protected API route
            const response = await api.get<Address[]>(ADDRESS_API_ENDPOINT);
            
            // NOTE: Assuming the API returns the array directly or in a standard Axios way
            return response.data;
        } catch (error: any) {
            console.error('API Error fetching addresses:', error);
            throw new Error("Failed to load saved addresses.");
        }
    }, [getClient]);


    /**
     * Creates a new address.
     */
    const createAddress = useCallback(async (data: Omit<Address, 'id' | 'user_id'>): Promise<Address> => {
        const api = getClient();
        try {
            await getCsrfToken();
            const payload = {
                ...data,
                // Ensure phone_numbers array is sent as a JSON string to Laravel
                phone_numbers: JSON.stringify(data.phone_numbers) 
            };
            const response = await api.post<{ message: string, address: Address }>(ADDRESS_API_ENDPOINT, payload);
            return response.data.address;

        } catch (error: any) {
            const msg = error.response?.data?.message || 'Address creation failed.';
            throw new Error(msg);
        }
    }, [getClient]);
    
    
    /**
     * Updates an existing address.
     */
    const updateAddress = useCallback(async (id: string, data: Partial<Omit<Address, 'id' | 'user_id'>>): Promise<Address> => {
        const api = getClient();
        try {
            await getCsrfToken();
            const payload = {
                ...data,
                // Ensure phone_numbers array is sent as a JSON string
                phone_numbers: data.phone_numbers ? JSON.stringify(data.phone_numbers) : undefined
            };
            // Laravel uses PUT/PATCH for updates
            const response = await api.put<{ message: string, address: Address }>(`${ADDRESS_API_ENDPOINT}/${id}`, payload);
            return response.data.address;

        } catch (error: any) {
            const msg = error.response?.data?.message || 'Address update failed.';
            throw new Error(msg);
        }
    }, [getClient]);

    
    /**
     * Deletes an address.
     */
    const deleteAddress = useCallback(async (id: string) => {
        const api = getClient();
        try {
            await getCsrfToken();
            const response = await api.delete<{ message: string }>(`${ADDRESS_API_ENDPOINT}/${id}`);
            return response.data.message;

        } catch (error: any) {
            const msg = error.response?.data?.message || 'Address deletion failed.';
            throw new Error(msg);
        }
    }, [getClient]);


    return {
        fetchUserAddresses,
        createAddress,
        updateAddress,
        deleteAddress,
    };
};