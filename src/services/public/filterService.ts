// src/services/public/filterService.ts
import { publicClient } from '@/utils/ApiClient';
import { FilterType } from '@/types/filter';
import { useCallback } from 'react';

const PUBLIC_FILTERS_ENDPOINT = '/catalog/filters';

/**
 * Custom hook for accessing public product filter data.
 */
export const usePublicFilterService = () => {
    
    /**
     * Fetches all public filter types and their items.
     */
    const fetchAllPublicFilters = useCallback(async (): Promise<FilterType[]> => {
        try {
            const response = await publicClient.get<FilterType[]>(PUBLIC_FILTERS_ENDPOINT);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching public filters:', error);
            return [];
        }
    }, []);

    return {
        fetchAllPublicFilters,
    };
};