// src/services/public/offerService.ts
import { publicClient } from '@/utils/ApiClient';
import { Offer } from '@/types/offer'; 
import { useCallback } from 'react';

const OFFER_BANNERS_ENDPOINT = '/offers/banners';

/**
 * Custom hook for accessing public Offer data (e.g., banners, active deals).
 */
export const usePublicOfferService = () => {
    
    /**
     * Fetches a list of active offers that have an image associated with them.
     */
    const fetchPublicOfferBanners = useCallback(async (): Promise<Offer[]> => {
        try {
            const response = await publicClient.get<Offer[]>(OFFER_BANNERS_ENDPOINT);
            return response.data;
        } catch (error: any) {
            console.error('API Error in fetchPublicOfferBanners:', error);
            // It's non-critical if banners fail to load
            return [];
        }
    }, []);

    return {
        fetchPublicOfferBanners,
    };
};