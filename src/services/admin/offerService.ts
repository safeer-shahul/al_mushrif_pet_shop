// src/services/admin/offerService.ts
import { useAuth } from '@/context/AuthContext';
import { getCsrfToken, createAuthenticatedClient } from '@/utils/ApiClient';
// Assuming you have defined src/types/offer.ts
import { Offer } from '@/types/offer'; 
import { useCallback } from 'react';
import { Product } from '@/types/product';

interface PaginatedProductList {
    data: Product[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

// 💡 FIX 1: Correct Constant Definition (Using ENDPOINT)
const OFFER_API_ENDPOINT = '/admin/offers';

export const useOfferService = () => {
    const { token } = useAuth();
    
    const getClient = useCallback((isFileUpload: boolean = false) => {
        if (!token) throw new Error("Authentication token missing.");
        const config = isFileUpload ? { omitContentType: true } : {};
        return createAuthenticatedClient(token, config); 
    }, [token]);

    const fetchAllOffers = useCallback(async (): Promise<Offer[]> => {
        const api = getClient();
        // 💡 FIX 2: Correct variable name and syntax
        const response = await api.get<Offer[]>(OFFER_API_ENDPOINT); 
        return response.data;
    }, [getClient]);
    
    const fetchOfferById = useCallback(async (id: string): Promise<Offer> => {
        const api = getClient();
        try {
            // NOTE: The Axios response object has a 'data' property
            const response = await api.get<Offer>(`${OFFER_API_ENDPOINT}/${id}`);

            // 💡 FIX: Return the response.data directly.
            // If the API returns the Offer object itself (like your trace shows), 
            // the data is found at response.data.
            if (!response.data) {
                throw new Error("API returned empty data.");
            }
            return response.data;
            
        } catch (error: any) {
             // Handle 404/network errors gracefully
            throw new Error(error.response?.data?.message || 'Failed to load offer details.');
        }
    }, [getClient]);

    const saveOfferWithImage = useCallback(async (id: string | undefined, formData: FormData, isUpdate: boolean = false): Promise<{ message: string, offer: Offer }> => {
        const api = getClient(true); // Use the multipart client
        await getCsrfToken();
        
        try {
            if (isUpdate && id) {
                // Ensure PUT spoofing is present (handled on parent, but safer to check)
                if (!formData.has('_method')) {
                     formData.append('_method', 'PUT');
                }
                const response = await api.post(`${OFFER_API_ENDPOINT}/${id}`, formData);
                return response.data;
            } else {
                const response = await api.post(OFFER_API_ENDPOINT, formData);
                return response.data;
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to save offer.';
            throw new Error(msg);
        }
    }, [getClient]);

    const deleteOffer = useCallback(async (id: string) => {
        const api = getClient();
        await getCsrfToken();
        await api.delete(`${OFFER_API_ENDPOINT}/${id}`);
    }, [getClient]);

    /**
     * Searches products by name or SKU for the OfferForm dropdown.
     */
    const searchProductsForDropdown = useCallback(async (searchQuery: string): Promise<PaginatedProductList> => {
        const api = getClient();
        try {
            const response = await api.get<PaginatedProductList>('/admin/products/search-dropdown', {
                params: { search: searchQuery }
            });
            return response.data;
        } catch (error: any) {
            console.error('API Error in searchProductsForDropdown:', error);
            throw new Error('Failed to search products.');
        }
    }, [getClient]);

    return {
        fetchAllOffers,
        fetchOfferById,
        saveOfferWithImage,
        deleteOffer,
        searchProductsForDropdown
    };
};