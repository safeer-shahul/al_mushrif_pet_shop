// src/services/public/brandService.ts
import { publicClient } from '@/utils/ApiClient';
import { Brand } from '@/types/brand';
import { useCallback } from 'react';

const PUBLIC_BRANDS_ENDPOINT = '/brands';

/**
 * Custom hook for fetching public, active brand data.
 */
export const usePublicBrandService = () => {
    
    /**
     * Fetches a list of all active brands for filtering/navigation.
     * Hits: GET /api/brands (public route)
     */
    const fetchAllPublicBrands = useCallback(async (): Promise<Brand[]> => {
        try {
            // Use the publicClient directly (no token/auth check required)
            const response = await publicClient.get<Brand[]>(PUBLIC_BRANDS_ENDPOINT);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching public brands:', error);
            // This is non-critical data for product listing.
            return []; 
        }
    }, []);

    return {
        fetchAllPublicBrands,
    };
};