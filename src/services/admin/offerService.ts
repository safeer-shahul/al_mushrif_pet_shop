// src/services/admin/offerService.ts
import { useAuth } from '@/context/AuthContext';
import { getCsrfToken, createAuthenticatedClient } from '@/utils/ApiClient';
// Assuming you have defined src/types/offer.ts
import { Offer } from '@/types/offer'; 
import { useCallback } from 'react';

// 💡 FIX 1: Correct Constant Definition (Using ENDPOINT)
const OFFER_API_ENDPOINT = '/admin/offers';

export const useOfferService = () => {
    const { token } = useAuth();
    
    const getClient = useCallback(() => {
        if (!token) throw new Error("Authentication token missing.");
        return createAuthenticatedClient(token); 
    }, [token]);

    const fetchAllOffers = useCallback(async (): Promise<Offer[]> => {
        const api = getClient();
        // 💡 FIX 2: Correct variable name and syntax
        const response = await api.get<Offer[]>(OFFER_API_ENDPOINT); 
        return response.data;
    }, [getClient]);
    
    const fetchOfferById = useCallback(async (id: string): Promise<Offer> => {
        const api = getClient();
        const response = await api.get<{ offer: Offer }>(`${OFFER_API_ENDPOINT}/${id}`);
        return response.data.offer;
    }, [getClient]);

    const saveOffer = useCallback(async (data: Partial<Offer>, isUpdate: boolean = false): Promise<Offer> => {
        const api = getClient();
        await getCsrfToken();
        
        const payload = {
            ...data,
            // Convert product_ids array to JSON string for Laravel backend
            products: data.products ? JSON.stringify(data.products) : '[]',
        };
        
        try {
            if (isUpdate && data.id) {
                const response = await api.put(`${OFFER_API_ENDPOINT}/${data.id}`, payload);
                return response.data.offer;
            } else {
                const response = await api.post(OFFER_API_ENDPOINT, payload);
                return response.data.offer;
            }
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to save offer.');
        }
    }, [getClient]);

    const deleteOffer = useCallback(async (id: string) => {
        const api = getClient();
        await getCsrfToken();
        await api.delete(`${OFFER_API_ENDPOINT}/${id}`);
    }, [getClient]);

    return {
        fetchAllOffers,
        fetchOfferById,
        saveOffer,
        deleteOffer
    };
};