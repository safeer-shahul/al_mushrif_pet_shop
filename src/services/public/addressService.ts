// src/services/public/addressService.ts - Updated
import { getCsrfToken, createAuthenticatedClient, publicClient } from '@/utils/ApiClient';
import { useAuth } from '@/context/AuthContext';
import { useCallback } from 'react';
import { Address } from '@/types/user';

const ADDRESS_API_ENDPOINT = '/user/addresses';

/**
 * Custom hook for managing user addresses (CRUD).
 */
export const useAddressService = () => {
    const { token } = useAuth();
    
    // Follow the same pattern as in brandService
    const getClient = useCallback((isFileUpload: boolean = false) => {
        const config = isFileUpload ? { omitContentType: true } : {};
        if (token) {
            return createAuthenticatedClient(token, config); 
        }
        // For addresses, always require authentication
        throw new Error("Authentication required for address operations.");
    }, [token]);

    /**
     * Fetches all addresses for the authenticated user.
     */
    const fetchUserAddresses = useCallback(async (): Promise<Address[]> => {
        try {
            // Use getClient like brandService does
            const api = getClient();
            
            // Log for debugging
            console.log("Fetching addresses with token:", token ? "Token present" : "No token");
            
            const response = await api.get<Address[]>(ADDRESS_API_ENDPOINT);
            
            // Log success for debugging
            console.log("Addresses fetched successfully:", response.data);
            
            return response.data || [];
        } catch (error: any) {
            // Detailed error logging for debugging
            console.error('Address fetch error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            
            // Rethrow with user-friendly message
            if (error.response?.status === 401) {
                throw new Error("Session expired. Please log in again.");
            } else if (!token) {
                throw new Error("Please log in to view addresses.");
            } else {
                throw new Error("Could not load addresses. Please try again.");
            }
        }
    }, [token, getClient]);

    /**
     * Creates a new address.
     */
    const createAddress = useCallback(async (data: Omit<Address, 'id' | 'user_id'>): Promise<Address> => {
        try {
            const api = getClient();
            await getCsrfToken();
            
            // Prepare payload
            const payload = {
                ...data,
                // Ensure phone_numbers array is sent as a JSON string
                phone_numbers: JSON.stringify(data.phone_numbers) 
            };
            
            // Log for debugging
            console.log("Creating address with payload:", payload);
            
            const response = await api.post<{ message: string, address: Address }>(ADDRESS_API_ENDPOINT, payload);
            
            return response.data.address;
        } catch (error: any) {
            console.error('Address creation error:', error);
            throw new Error(error.response?.data?.message || 'Failed to create address.');
        }
    }, [getClient]);
    
    /**
     * Updates an existing address.
     */
    const updateAddress = useCallback(async (id: string, data: Partial<Omit<Address, 'id' | 'user_id'>>): Promise<Address> => {
        try {
            const api = getClient();
            await getCsrfToken();
            
            const payload = {
                ...data,
                phone_numbers: data.phone_numbers ? JSON.stringify(data.phone_numbers) : undefined
            };
            
            console.log("Updating address with payload:", payload);
            
            const response = await api.put<{ message: string, address: Address }>(`${ADDRESS_API_ENDPOINT}/${id}`, payload);
            return response.data.address;
        } catch (error: any) {
            console.error('Address update error:', error);
            throw new Error(error.response?.data?.message || 'Failed to update address.');
        }
    }, [getClient]);
    
    /**
     * Deletes an address.
     */
    const deleteAddress = useCallback(async (id: string) => {
        try {
            const api = getClient();
            await getCsrfToken();
            
            console.log("Deleting address:", id);
            
            const response = await api.delete<{ message: string }>(`${ADDRESS_API_ENDPOINT}/${id}`);
            return response.data.message;
        } catch (error: any) {
            console.error('Address deletion error:', error);
            throw new Error(error.response?.data?.message || 'Failed to delete address.');
        }
    }, [getClient]);

    return {
        fetchUserAddresses,
        createAddress,
        updateAddress,
        deleteAddress,
    };
};